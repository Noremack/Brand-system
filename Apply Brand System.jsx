#target "indesign"

/**
 * ============================================================================
 * Adobe InDesign Brand System — Apply Brand System Dashboard
 * ============================================================================
 * @file Apply Brand System.jsx
 * @package InDesign Brand System — Queensland Government Design System (QGDS)
 * @version 2.4.0
 * @author Queensland Government Publishing & Design Engineering
 * @description User-facing ScriptUI dashboard for applying design tokens, brand
 * typography hierarchies, swatches, object styles, margins, and master page
 * assets to an active InDesign document.
 *
 * Architecture & Execution Lifecycle:
 * 1. Pre-flight Validation: Ensures an active document is open in InDesign.
 * 2. Document Metrics Analysis: Analyzes document page geometry and matches
 *    against configured page matrices (A4, A3, DL, etc.).
 * 3. User Preferences: Hydrates dialog state from saved user preferences.
 * 4. Interactive ScriptUI Dashboard: Renders an M3-inspired tabbed interface
 *    for scope selection, color mode (RGB/CMYK), style themes, and asset paths.
 * 5. Atomic Transaction Execution: Wraps all DOM mutations in an atomic
 *    app.doScript() call with UndoModes.ENTIRE_SCRIPT, allowing a single-click
 *    undo (Ctrl+Z) of the entire brand application.
 *
 * Environment & Compatibility:
 * - Adobe InDesign CS6 through CC 2026+ (ExtendScript ES3 engine)
 * - Strict ES3 compliance: zero modern ES6+ keywords, arrow functions, or template literals.
 * ============================================================================
 */

#include "modules/10-brand-engine.jsxinc"
#include "modules/09-ui-utils.jsxinc"

/**
 * Initializes and presents the interactive Brand System Dashboard dialog.
 * Gathers user configuration options and executes the BrandSystem pipeline.
 *
 * @returns {void}
 */
function manualInit() {
    // -------------------------------------------------------------------------
    // 1. PRE-FLIGHT CHECKS & DOCUMENT METRICS
    // -------------------------------------------------------------------------
    if (app.documents.length === 0) {
        alert("Please open an InDesign document before running the Brand System.");
        return;
    }

    var doc = app.activeDocument;
    var metrics = BrandSystem.analyze(doc);

    // Load persisted user preferences (falls back to defaults if not found)
    var userPrefs = UIUtils.loadPreferences();

    /**
     * Helper to retrieve a preference with a typed fallback value.
     * @param {String} key - Preference key.
     * @param {*} fallback - Default fallback value.
     * @returns {*}
     */
    function getPref(key, fallback) {
        return UIUtils.getPref(userPrefs, key, fallback);
    }

    // -------------------------------------------------------------------------
    // 2. DIALOG WINDOW CONSTRUCTION (Material 3 Inspired Layout)
    // -------------------------------------------------------------------------
    var win = new Window("dialog", "Brand System Dashboard");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 20;
    win.margins = 25;

    // Header Title & Subtitle Banner
    var headerGrp = win.add("group");
    headerGrp.orientation = "column";
    headerGrp.alignChildren = "left";
    headerGrp.spacing = 3;

    var titleTxt = headerGrp.add("statictext", undefined, "Brand System Configuration");
    try {
        titleTxt.graphics.font = ScriptUI.newFont("dialog", "BOLD", 18);
    } catch (_) {}

    var subTxt = headerGrp.add("statictext", undefined, "Configure and apply design tokens to the document. Detected format: " + metrics.name);

    // Two-Column Main Content Container
    var contentGroup = win.add("group");
    contentGroup.orientation = "row";
    contentGroup.alignChildren = ["fill", "fill"];
    contentGroup.spacing = 20;

    // LEFT COLUMN: Scope & System Options
    var leftCol = contentGroup.add("group");
    leftCol.orientation = "column";
    leftCol.alignChildren = "fill";
    leftCol.preferredSize.width = 250;

    // Card 1: Execution Scope
    var scopeCard = leftCol.add("panel", undefined, "");
    scopeCard.orientation = "column";
    scopeCard.alignChildren = "left";
    scopeCard.margins = 20;
    scopeCard.spacing = 12;

    var scopeLbl = scopeCard.add("statictext", undefined, "Execution Scope");
    try {
        scopeLbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 13);
    } catch (_) {}

    var cbColors = scopeCard.add("checkbox", undefined, "Build Color Swatches");
    cbColors.value = getPref("buildColors", true);
    cbColors.helpTip = "Generates and injects brand swatches and gradients into the document.";

    var cbTypo = scopeCard.add("checkbox", undefined, "Build Typography Styles");
    cbTypo.value = getPref("buildTypography", true);
    cbTypo.helpTip = "Generates scalable paragraph and character styles.";

    var cbObjects = scopeCard.add("checkbox", undefined, "Build Object Styles");
    cbObjects.value = getPref("buildObjects", true);
    cbObjects.helpTip = "Imports cached object, table, and cell styles from the formatting templates.";

    var cbMargins = scopeCard.add("checkbox", undefined, "Update Margins & Masters");
    cbMargins.value = getPref("updateMargins", true);
    cbMargins.helpTip = "Enforces layout margins, gutters, and generates required master pages.";

    var cbFooters = scopeCard.add("checkbox", undefined, "Inject Headers & Footers");
    cbFooters.value = getPref("injectFooters", true);
    cbFooters.helpTip = "Injects vector headers, footers, and back cover elements onto master pages.";

    // Card 2: System Options
    var sysCard = leftCol.add("panel", undefined, "");
    sysCard.orientation = "column";
    sysCard.alignChildren = "left";
    sysCard.margins = 20;
    sysCard.spacing = 12;

    var sysLbl = sysCard.add("statictext", undefined, "System Options");
    try {
        sysLbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 13);
    } catch (_) {}

    var cbReset = sysCard.add("checkbox", undefined, "Reset/Clean Document First?");
    cbReset.helpTip = "Wipes existing brand styles and master pages before applying the new system.";
    cbReset.onClick = function() {
        if (cbReset.value) {
            var confirmMsg = "WARNING: This is a destructive action.\n" +
                             "It will remove ALL custom styles, swatches, and groups from this document, " +
                             "reverting to the basic InDesign defaults.\n\n" +
                             "Are you absolutely sure you want to proceed?";
            if (!confirm(confirmMsg)) {
                cbReset.value = false;
            }
        }
    };

    var cbSpecimen = sysCard.add("checkbox", undefined, "Inject Type Specimen");
    cbSpecimen.value = getPref("injectSpecimen", true);
    cbSpecimen.helpTip = "Generates a typography specimen on the active page.";

    var cbPerfLog = sysCard.add("checkbox", undefined, "Generate Performance Report");
    cbPerfLog.value = getPref("perfLog", true);
    cbPerfLog.helpTip = "Appends a detailed execution trace to the BrandSystem_ContinualLog.txt file.";

    // RIGHT COLUMN: Configuration Tabs
    var rightCol = contentGroup.add("group");
    rightCol.orientation = "column";
    rightCol.alignChildren = ["fill", "fill"];

    var settingsTabs = rightCol.add("tabbedpanel");
    settingsTabs.alignChildren = ["fill", "fill"];

    // =========================================================================
    // TAB 1: STYLE & THEMES
    // =========================================================================
    var tabTheme = settingsTabs.add("tab", undefined, "Style & Themes");
    tabTheme.orientation = "column";
    tabTheme.alignChildren = "left";
    tabTheme.margins = 20;
    tabTheme.spacing = 15;

    // Color Mode (RGB for Screen vs CMYK for Print)
    var cmGroup = tabTheme.add("group");
    cmGroup.add("statictext", undefined, "Color Mode:").preferredSize.width = 110;
    var rbRGB = cmGroup.add("radiobutton", undefined, "RGB (Digital)");
    rbRGB.value = getPref("colorMode", "RGB") === "RGB";
    rbRGB.helpTip = "Optimizes color definitions for digital screens and web output.";

    var rbCMYK = cmGroup.add("radiobutton", undefined, "CMYK (Print)");
    rbCMYK.value = getPref("colorMode", "RGB") === "CMYK";
    rbCMYK.helpTip = "Optimizes swatches for commercial print separations.";

    // Style Mode (Standard Light vs Reverse Dark)
    var modeGrp = tabTheme.add("group");
    modeGrp.add("statictext", undefined, "Style Mode:").preferredSize.width = 110;
    var rbStandard = modeGrp.add("radiobutton", undefined, "Standard (Light)");
    rbStandard.value = !getPref("isReverseMode", false);
    rbStandard.helpTip = "Generates dark text on light backgrounds (standard corporate publishing).";

    var rbReverse = modeGrp.add("radiobutton", undefined, "Reverse (Dark)");
    rbReverse.value = getPref("isReverseMode", false);
    rbReverse.helpTip = "Inverts text, tables, and borders for high-contrast dark backgrounds.";

    // Primary Brand Theme Selection
    var themeGrp = tabTheme.add("group");
    themeGrp.add("statictext", undefined, "Primary Theme:").preferredSize.width = 110;
    var themeDropdown = themeGrp.add("dropdownlist", undefined, []);
    themeDropdown.preferredSize.width = 160;

    var div1 = tabTheme.add("panel", undefined, undefined);
    div1.alignment = "fill";
    div1.preferredSize.height = 1;

    // Secondary Themes Selection (Multiselect)
    var listLbl = tabTheme.add("statictext", undefined, "Load Additional Themes:");
    try {
        listLbl.graphics.font = ScriptUI.newFont("dialog", "BOLD", 12);
    } catch (_) {}

    var cbSelectAll = tabTheme.add("checkbox", undefined, "Select All Themes");
    var themeList = tabTheme.add("listbox", undefined, BrandSystem.config.availableThemes, {multiselect: true});
    themeList.preferredSize = [280, 110];

    var defaultTheme = (BrandSystem.config.availableThemes && BrandSystem.config.availableThemes.length > 0)
        ? [BrandSystem.config.availableThemes[0]]
        : ["Blue"];
    var savedThemes = getPref("selectedThemes", defaultTheme);

    for (var i = 0; i < themeList.items.length; i++) {
        for (var j = 0; j < savedThemes.length; j++) {
            if (themeList.items[i].text === savedThemes[j]) {
                themeList.items[i].selected = true;
                break;
            }
        }
    }
    if (!themeList.selection) themeList.selection = 0;

    // =========================================================================
    // TAB 2: TYPOGRAPHY
    // =========================================================================
    var tabTypo = settingsTabs.add("tab", undefined, "Typography Defaults");
    tabTypo.orientation = "column";
    tabTypo.alignChildren = "left";
    tabTypo.margins = 20;
    tabTypo.spacing = 15;

    var fontInput = UIUtils.addInputRow(tabTypo, "Font Name:", getPref("selectedFont", BrandSystem.config.dialogDefaults.font), null, "Exact name of the font family installed on your system.");
    var sizeInput = UIUtils.addInputRow(tabTypo, "Base Size:", metrics.baseFont, "pt", "Baseline body font size. Headings scale proportionally from this value.");
    var leadingInput = UIUtils.addInputRow(tabTypo, "Leading Ratio:", getPref("baseLeadingRatio", BrandSystem.config.dialogDefaults.leadingRatio), "x", "Line height multiplier (e.g., 1.25x body size).");
    var scaleInput = UIUtils.addInputRow(tabTypo, "Scale Ratio:", getPref("scaleRatio", BrandSystem.config.dialogDefaults.scaleRatio), "x", "Modular typographic scale factor between heading tiers (e.g. 1.25x).");

    // =========================================================================
    // TAB 3: ASSETS & FOOTERS
    // =========================================================================
    var tabAsset = settingsTabs.add("tab", undefined, "Footers & Assets");
    tabAsset.orientation = "column";
    tabAsset.alignChildren = "left";
    tabAsset.margins = 20;
    tabAsset.spacing = 15;

    var svgGrp = tabAsset.add("group");
    svgGrp.add("statictext", undefined, "Footer Brand:").preferredSize.width = 110;
    var svgDropdown = svgGrp.add("dropdownlist", undefined, ["None", "All Footers"].concat(BrandSystem.config.assetTokens.footerVariants));
    var savedSvg = getPref("selectedFooterVariant", "All Footers");
    for (var i = 0; i < svgDropdown.items.length; i++) {
        if (svgDropdown.items[i].text === savedSvg) {
            svgDropdown.selection = i;
            break;
        }
    }
    if (!svgDropdown.selection) svgDropdown.selection = 1;

    var dirGrp = tabAsset.add("group");
    dirGrp.add("statictext", undefined, "Footer Source:").preferredSize.width = 110;
    var defaultDir = BrandSystem.config.assetTokens.footerDirectory;
    var savedDir = getPref("customFooterDirectory", defaultDir);
    if (!(new Folder(savedDir).exists)) savedDir = defaultDir;

    var dirInput = dirGrp.add("edittext", undefined, savedDir);
    dirInput.preferredSize.width = 250;
    dirInput.helpTip = "Local or network file path containing brand vector artwork.";

    var dirBtn = dirGrp.add("button", undefined, "...");
    dirBtn.preferredSize.width = 35;

    var extGrp = tabAsset.add("group");
    extGrp.add("statictext", undefined, "Footer Format:").preferredSize.width = 110;
    var extDropdown = extGrp.add("dropdownlist", undefined, []);
    extDropdown.preferredSize.width = 150;
    var extRefreshBtn = extGrp.add("button", undefined, "Refresh List");
    extRefreshBtn.helpTip = "Rescans the directory for supported image extensions.";

    var extNoteGrp = tabAsset.add("group");
    extNoteGrp.margins = [115, -8, 0, 0];
    extNoteGrp.add("statictext", undefined, "(Supported: .svg, .eps, .png, .jpg)");

    /**
     * Refreshes the format dropdown list based on files present in the chosen directory.
     */
    function updateFormatDropdown() {
        UIUtils.updateFormatDropdown(dirInput.text, extDropdown, getPref("footerFormat", ".svg"));
    }

    dirBtn.onClick = function() {
        var f = new Folder(dirInput.text).selectDlg("Select Footer Asset Directory");
        if (f) {
            dirInput.text = f.fsName;
            updateFormatDropdown();
        }
    };
    extRefreshBtn.onClick = function() {
        updateFormatDropdown();
    };
    updateFormatDropdown();

    // -------------------------------------------------------------------------
    // 3. DIALOG CONTROLS & STATE MACHINE
    // -------------------------------------------------------------------------
    var btnGroup = win.add("group");
    btnGroup.alignment = ["right", "bottom"];
    btnGroup.spacing = 15;

    btnGroup.add("button", undefined, "Cancel", {name: "cancel"});
    var okBtn = btnGroup.add("button", undefined, "Apply Brand System", {name: "ok"});

    /**
     * Synchronizes dependent UI controls:
     * - If Typography or Objects or Footers are checked, Swatches must be built.
     * - If Footers are checked, Margins and Objects are mandatory.
     * - Updates dropdown items to match active themes in the listbox.
     */
    function updateUI() {
        var currentPrimary = themeDropdown.selection ? themeDropdown.selection.text : getPref("primaryStyleTheme", null);
        var activeNames = [];
        for (var i = 0; i < themeList.items.length; i++) {
            if (themeList.items[i].selected) activeNames.push(themeList.items[i].text);
        }

        themeDropdown.removeAll();
        if (activeNames.length > 0) {
            themeDropdown.enabled = true;
            var foundIdx = 0;
            for (var m = 0; m < activeNames.length; m++) {
                themeDropdown.add("item", activeNames[m]);
                if (activeNames[m] === currentPrimary) foundIdx = m;
            }
            themeDropdown.selection = foundIdx;
        } else {
            themeDropdown.add("item", "None");
            themeDropdown.selection = 0;
            themeDropdown.enabled = false;
        }

        cbTypo.enabled = true;
        cbObjects.enabled = true;
        cbSpecimen.enabled = cbTypo.value;

        if (!cbTypo.value) cbSpecimen.value = false;

        if (cbFooters.value) {
            cbMargins.value = true;
            cbMargins.enabled = false;
            cbObjects.value = true;
            cbObjects.enabled = false;
        } else {
            cbMargins.enabled = true;
        }

        // Swatches are a foundational dependency for any style or footer injection
        if (cbTypo.value || cbObjects.value || cbFooters.value) {
            cbColors.value = true;
            cbColors.enabled = false;
        } else {
            cbColors.enabled = true;
        }

        listLbl.enabled = cbColors.value;
        cbSelectAll.enabled = cbColors.value;
        themeList.enabled = cbColors.value;

        themeGrp.enabled = (cbTypo.value || cbObjects.value || cbFooters.value);
        modeGrp.enabled = (cbTypo.value || cbObjects.value || cbFooters.value);
        tabTypo.enabled = (cbTypo.value || cbObjects.value);
        tabAsset.enabled = cbFooters.value;
    }

    // Attach event listeners
    themeList.onChange = updateUI;
    cbColors.onClick = updateUI;
    cbTypo.onClick = updateUI;
    cbSpecimen.onClick = updateUI;
    cbObjects.onClick = updateUI;
    cbMargins.onClick = updateUI;
    cbFooters.onClick = updateUI;
    cbSelectAll.onClick = function() {
        for (var k = 0; k < themeList.items.length; k++) {
            themeList.items[k].selected = cbSelectAll.value;
        }
        updateUI();
    };

    updateUI();

    // -------------------------------------------------------------------------
    // 4. DIALOG PRESENTATION & ATOMIC EXECUTION
    // -------------------------------------------------------------------------
    if (win.show() === 1) {
        var sThemes = [];
        for (var i = 0; i < themeList.items.length; i++) {
            if (themeList.items[i].selected) sThemes.push(themeList.items[i].text);
        }
        if (sThemes.length === 0) {
            sThemes.push((BrandSystem.config.availableThemes && BrandSystem.config.availableThemes.length > 0)
                ? BrandSystem.config.availableThemes[0]
                : "Blue");
        }

        // Assemble execution parameters payload
        var params = {
            doReset: cbReset.value,
            buildColors: cbColors.value,
            buildTypography: cbTypo.value,
            injectSpecimen: cbSpecimen.value,
            buildObjects: cbObjects.value,
            updateMargins: cbMargins.value,
            injectFooters: cbFooters.value,
            perfLog: cbPerfLog.value,
            selectedThemes: sThemes,
            primaryStyleTheme: themeDropdown.selection ? themeDropdown.selection.text : sThemes[0],
            isReverseMode: rbReverse.value,
            colorMode: rbCMYK.value ? "CMYK" : "RGB",
            selectedFooterVariant: svgDropdown.selection ? svgDropdown.selection.text : "None",
            customFooterDirectory: dirInput.text,
            footerFormat: (extDropdown.selection && extDropdown.selection.text !== "None Found")
                ? extDropdown.selection.text
                : ".svg",
            layoutMetrics: metrics,
            baseFontSize: parseInt(sizeInput.text, 10) || metrics.baseFont,
            selectedFont: fontInput.text,
            baseLeadingRatio: parseFloat(leadingInput.text) || 1.25,
            scaleRatio: parseFloat(scaleInput.text) || 1.25
        };

        // Persist preferences for seamless repeat executions
        UIUtils.savePreferences({
            buildColors: params.buildColors,
            buildTypography: params.buildTypography,
            injectSpecimen: params.injectSpecimen,
            buildObjects: params.buildObjects,
            updateMargins: params.updateMargins,
            injectFooters: params.injectFooters,
            perfLog: params.perfLog,
            selectedThemes: params.selectedThemes,
            primaryStyleTheme: params.primaryStyleTheme,
            isReverseMode: params.isReverseMode,
            colorMode: params.colorMode,
            selectedFooterVariant: params.selectedFooterVariant,
            customFooterDirectory: params.customFooterDirectory,
            footerFormat: params.footerFormat,
            selectedFont: params.selectedFont,
            baseLeadingRatio: params.baseLeadingRatio,
            scaleRatio: params.scaleRatio
        });

        // Atomic transaction: Entire script can be reverted in one single Undo step
        app.doScript(function() {
            try {
                BrandSystem.process(doc, params);
            } catch (e) {
                alert("Fatal Execution Error:\n" + e.message);
            }
        }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Apply Brand System");
    }
}

// Auto-run if executed directly as a script (not included by a batch orchestrator)
if (typeof BATCH_PROCESS_ACTIVE === "undefined") {
    manualInit();
}
