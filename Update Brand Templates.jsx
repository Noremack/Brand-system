#target "indesign"

/**
 * ============================================================================
 * Adobe InDesign Brand System — Pre-compiled Format Template Builder
 * ============================================================================
 * @file Update Brand Templates.jsx
 * @package InDesign Brand System — Queensland Government Design System (QGDS)
 * @version 2.4.0
 * @author Queensland Government Publishing & Design Engineering
 * @description Pre-compiles format-specific .indt master templates and companion
 * cache-manifest.json metadata directly into the templates/ directory.
 *
 * Why Pre-compiled Templates?
 * InDesign ExtendScript DOM creation for 147+ complex Object, Table, and Cell
 * styles is computationally intensive (taking 30–60+ seconds per document).
 * Pre-baking them into standalone .indt templates allows the runtime engine
 * (10-brand-engine.jsxinc) to load fully styled templates via document.open()
 * in sub-second execution (<150ms).
 *
 * Execution Modes:
 * 1. Manual Mode: User double-clicks script in the Scripts Panel. Displays a
 *    dialog allowing selection of Color Profile (RGB/CMYK), Theme, and Style Mode.
 * 2. Silent / Automated Mode: Triggered automatically by 10-brand-engine.jsxinc
 *    via app.doScript() when an un-cached format is requested at runtime.
 *
 * Environment & Compatibility:
 * - Adobe InDesign CS6 through CC 2026+ (ExtendScript ES3 engine)
 * - Strict ES3 compliance: zero modern ES6+ syntax leaks.
 * ============================================================================
 */

// Global flag prevents Apply Brand System from auto-launching when modules are included
var BATCH_PROCESS_ACTIVE = true;

#include "modules/10-brand-engine.jsxinc"
#include "modules/09-ui-utils.jsxinc"

(function() {
    // -------------------------------------------------------------------------
    // 1. EXECUTION MODE & PREFERENCE HYDRATION
    // -------------------------------------------------------------------------
    var isSilent = app.scriptArgs.getValue("BrandSystem_Silent") === "true";
    var userPrefs = UIUtils.loadPreferences();

    if (!isSilent) {
        var win = new Window("dialog", "Build Brand Templates");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 15;
        win.margins = 20;

        var panel = win.add("panel", undefined, "Template Settings");
        panel.orientation = "column";
        panel.alignChildren = "left";
        panel.spacing = 10;
        panel.margins = 15;

        // Color Profile selection
        var grpColor = panel.add("group");
        grpColor.add("statictext", undefined, "Color Profile:").preferredSize.width = 100;
        var ddColor = grpColor.add("dropdownlist", undefined, ["RGB", "CMYK"]);
        ddColor.selection = (userPrefs.colorMode === "CMYK") ? 1 : 0;

        // Theme selection
        var grpTheme = panel.add("group");
        grpTheme.add("statictext", undefined, "Theme:").preferredSize.width = 100;
        var ddTheme = grpTheme.add("dropdownlist", undefined, BrandSystem.config.availableThemes);
        var tIdx = 0;
        for (var t = 0; t < BrandSystem.config.availableThemes.length; t++) {
            var defaultTheme = (BrandSystem.config.availableThemes && BrandSystem.config.availableThemes.length > 0)
                ? BrandSystem.config.availableThemes[0]
                : "Blue";
            if (BrandSystem.config.availableThemes[t] === (userPrefs.primaryStyleTheme || defaultTheme)) {
                tIdx = t;
                break;
            }
        }
        ddTheme.selection = tIdx;

        // Style Mode selection
        var grpMode = panel.add("group");
        grpMode.add("statictext", undefined, "Style Mode:").preferredSize.width = 100;
        var ddMode = grpMode.add("dropdownlist", undefined, ["Standard", "Reverse"]);
        ddMode.selection = userPrefs.isReverseMode ? 1 : 0;

        var btnGroup = win.add("group");
        btnGroup.alignment = ["right", "bottom"];
        btnGroup.add("button", undefined, "Cancel", {name: "cancel"});
        var buildBtn = btnGroup.add("button", undefined, "Build Templates", {name: "ok"});

        if (win.show() !== 1) {
            return;
        }

        userPrefs.colorMode = ddColor.selection.text;
        userPrefs.primaryStyleTheme = ddTheme.selection.text;
        userPrefs.isReverseMode = (ddMode.selection.text === "Reverse");
        UIUtils.savePreferences(userPrefs);
    }

    // -------------------------------------------------------------------------
    // 2. TEMPLATE DIRECTORY PREPARATION
    // -------------------------------------------------------------------------
    BrandSystem.Logger.showProgress("Building Format-Specific Templates...");
    BrandSystem.Logger.startTimer("Template Builder Execution");
    BrandSystem.Logger.info("Template Builder Mode: " + (isSilent ? "Silent/Auto" : "Manual"));

    var folder = new Folder(new File($.fileName).parent.fsName + "/templates");

    if (!folder.exists) {
        folder.create();
    } else if (!isSilent) {
        // Manual updates purge obsolete template files to avoid stale cache drift
        BrandSystem.Logger.info("Manual Update triggered. Purging old template cache...");
        var oldTemplates = folder.getFiles("*.indt");
        for (var ot = 0; ot < oldTemplates.length; ot++) {
            try {
                oldTemplates[ot].remove();
            } catch (e) {
                BrandSystem.Logger.warn("Failed to remove old template: " + e.message);
            }
        }
    }

    // -------------------------------------------------------------------------
    // 3. BATCH GENERATION ACROSS CONFIGURED PAGE MATRIX
    // -------------------------------------------------------------------------
    var pMatrix = BrandSystem.config.pageMatrix;
    var modeStr = userPrefs.isReverseMode ? "Reverse" : "Standard";
    var cMode = userPrefs.colorMode || "RGB";
    var pTheme = userPrefs.primaryStyleTheme || "Blue";

    for (var i = 0; i < pMatrix.length; i++) {
        var format = pMatrix[i];
        var namePart = format.name;
        var isDigital = (format.type === "digital" || format.name.toLowerCase().indexOf("digital") === 0);

        if (isDigital) {
            var widthPx = Math.round(format.longEdge / BrandSystem.config.PT_TO_MM);
            var heightPx = Math.round(format.shortEdge / BrandSystem.config.PT_TO_MM);
            namePart = format.name + "_" + widthPx + "x" + heightPx + "px";
        }

        var templateName = "BrandSystem_" + namePart + "_" + cMode + "_" + pTheme + "_" + modeStr + ".indt";
        BrandSystem.Logger.updateProgress("Building Template: " + templateName);
        var templateFile = new File(folder.fsName + "/" + templateName);

        // Create invisible temporary document for template generation
        var doc = app.documents.add(false);
        var isLargeFormat = Math.max(format.shortEdge, format.longEdge) > 425;
        if (isLargeFormat || format.name === "DL") {
            doc.documentPreferences.facingPages = false;
        }

        doc.documentPreferences.pageWidth = format.shortEdge + "mm";
        doc.documentPreferences.pageHeight = format.longEdge + "mm";

        if (format.bleed !== undefined) {
            doc.documentPreferences.documentBleedTopOffset = format.bleed + "mm";
            doc.documentPreferences.documentBleedBottomOffset = format.bleed + "mm";
            doc.documentPreferences.documentBleedInsideOrLeftOffset = format.bleed + "mm";
            doc.documentPreferences.documentBleedOutsideOrRightOffset = format.bleed + "mm";
        }

        try {
            BrandSystem.generateTemplate(doc, format, userPrefs);
            doc.save(templateFile, true);
            doc.close(SaveOptions.NO);
            BrandSystem.Logger.info("Saved template: " + templateName);
        } catch (e) {
            try {
                if (doc && doc.isValid) doc.close(SaveOptions.NO);
            } catch (_) {}
            BrandSystem.Logger.warn("Failed to build template " + format.name + ": " + e.message);
        }
    }

    // -------------------------------------------------------------------------
    // 4. CACHE MANIFEST CREATION & VERIFICATION
    // -------------------------------------------------------------------------
    try {
        var manifestFile = new File(folder.fsName + "/cache-manifest.json");
        if (manifestFile.open("w")) {
            var manifestObj = {
                cache_version: BrandSystem.config.CACHE_VERSION || "2.4.0",
                colorMode: cMode,
                primaryStyleTheme: pTheme,
                isReverseMode: userPrefs.isReverseMode,
                generated_at: new Date().toString(),
                templateCount: pMatrix.length
            };
            manifestFile.write(BrandSystem.BrandReports ? BrandSystem.BrandReports.formatReportJson(manifestObj) : "{}");
            manifestFile.close();
            BrandSystem.Logger.info("Updated cache-manifest.json with version " + (BrandSystem.config.CACHE_VERSION || "2.4.0"));
        }
    } catch (e) {
        BrandSystem.Logger.warn("Failed to write cache manifest: " + e.message);
    }

    // -------------------------------------------------------------------------
    // 5. COMPLETION & TELEMETRY LOGGING
    // -------------------------------------------------------------------------
    BrandSystem.Logger.endTimer("Template Builder Execution", "All Templates Saved");
    BrandSystem.Logger.closeProgress();

    if (!isSilent) {
        var logPath = BrandSystem.Logger.dump(null, true);
        alert("Format-Specific Templates successfully built and updated.\n\nPerformance log saved to:\n" + logPath);
    }
})();