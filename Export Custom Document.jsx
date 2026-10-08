#target "indesign"

/**
 * ============================================================================
 * Adobe InDesign Brand System — Custom Document Packaging & Export Engine
 * ============================================================================
 * @file Export Custom Document.jsx
 * @package InDesign Brand System — Queensland Government Design System (QGDS)
 * @version 2.4.0
 * @author Queensland Government Publishing & Design Engineering
 * @description Packages and exports bespoke InDesign layouts through the Brand
 * System distribution pipeline. Generates standalone distribution templates
 * (.indt), standard documents (.indd), multi-page PDF catalogs, and cleanly
 * suffixed JPEG preview spreads without altering the active working document.
 *
 * Architecture & Execution Lifecycle:
 * 1. Document & Preference Validation: Detects active document name and categories.
 * 2. Interactive Dialog: Allows user to configure category types (report, digital,
 *    flyer, etc.), output directory, and export formats (.indt, .indd, PDF, JPG).
 * 3. Non-Destructive Spread Synthesis: Dynamically synthesizes variant pages
 *    from master spreads ("A-Cover", "B-Content", "C-Back") at the end of the
 *    document to produce multi-page PDF catalogs and high-res JPEG previews.
 * 4. Guaranteed Cleanup: Guarantees removal of all synthesized temporary pages
 *    and masters in a strict `finally` block before saving final templates.
 *
 * Environment & Compatibility:
 * - Adobe InDesign CS6 through CC 2026+ (ExtendScript ES3 engine)
 * ============================================================================
 */

#include "modules/10-brand-engine.jsxinc"
#include "modules/09-ui-utils.jsxinc"

(function() {
    // -------------------------------------------------------------------------
    // 1. PRE-FLIGHT VALIDATION & PREFERENCES
    // -------------------------------------------------------------------------
    if (app.documents.length === 0) {
        alert("Please open a custom document before running the exporter.");
        return;
    }
    var doc = app.activeDocument;

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
    // 2. SCRIPTUI EXPORT CONFIGURATION DIALOG
    // -------------------------------------------------------------------------
    var win = new Window("dialog", "Export Custom Document");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 20;
    win.margins = 25;

    var headerGrp = win.add("group");
    headerGrp.orientation = "column";
    headerGrp.alignChildren = "left";
    headerGrp.spacing = 3;

    var titleTxt = headerGrp.add("statictext", undefined, "Export Custom Document");
    try {
        titleTxt.graphics.font = ScriptUI.newFont("dialog", "BOLD", 18);
    } catch (_) {}

    headerGrp.add("statictext", undefined, "Package and export the active document into the Brand System.");

    var contentGroup = win.add("group");
    contentGroup.orientation = "row";
    contentGroup.alignChildren = ["fill", "fill"];
    contentGroup.spacing = 20;

    var leftCol = contentGroup.add("group");
    leftCol.orientation = "column";
    leftCol.alignChildren = "fill";
    leftCol.preferredSize.width = 320;

    // Document Details Card
    var detailsCard = leftCol.add("panel", undefined, "Document Details");
    detailsCard.orientation = "column";
    detailsCard.alignChildren = "left";
    detailsCard.margins = 20;
    detailsCard.spacing = 12;

    var nameGrp = detailsCard.add("group");
    nameGrp.add("statictext", undefined, "Base Filename:").preferredSize.width = 100;
    var defaultName = doc.name.replace(/\.ind[dt]$/i, "");
    var nameInput = nameGrp.add("edittext", undefined, defaultName);
    nameInput.preferredSize.width = 170;

    var typeGrp = detailsCard.add("group");
    typeGrp.add("statictext", undefined, "Category Type:").preferredSize.width = 100;
    var typeDropdown = typeGrp.add("dropdownlist", undefined, []);
    typeDropdown.preferredSize.width = 170;

    // Harvest unique document category types from config
    var typesObj = {};
    for (var i = 0; i < BrandSystem.config.pageMatrix.length; i++) {
        var t = BrandSystem.config.pageMatrix[i].type;
        if (t) typesObj[t] = true;
    }
    var docTypes = [];
    for (var k in typesObj) {
        docTypes.push(k);
    }
    docTypes.push("Custom...");

    for (var d = 0; d < docTypes.length; d++) {
        typeDropdown.add("item", docTypes[d]);
    }
    typeDropdown.selection = 0;

    var customTypeGrp = detailsCard.add("group");
    customTypeGrp.add("statictext", undefined, "Custom Type:").preferredSize.width = 100;
    var customTypeInput = customTypeGrp.add("edittext", undefined, "other");
    customTypeInput.preferredSize.width = 170;
    customTypeGrp.visible = false;

    typeDropdown.onChange = function() {
        customTypeGrp.visible = (typeDropdown.selection.text === "Custom...");
    };

    // Output Destination Card
    var outCard = leftCol.add("panel", undefined, "Output Destination");
    outCard.orientation = "column";
    outCard.alignChildren = "left";
    outCard.margins = 20;
    outCard.spacing = 12;

    var outDirGrp = outCard.add("group");
    var outDirInput = outDirGrp.add("edittext", undefined, Folder.desktop.fsName);
    outDirInput.preferredSize.width = 230;
    var outDirBtn = outDirGrp.add("button", undefined, "...");
    outDirBtn.preferredSize.width = 35;
    outDirBtn.onClick = function() {
        var f = new Folder(outDirInput.text).selectDlg("Select Output Destination Folder");
        if (f) outDirInput.text = f.fsName;
    };

    var cbExportINDT = outCard.add("checkbox", undefined, "Export .INDT Template");
    cbExportINDT.value = true;
    var cbExportINDD = outCard.add("checkbox", undefined, "Export standard .INDD document");
    cbExportINDD.value = getPref("exportINDD", false);
    var cbExportPDF = outCard.add("checkbox", undefined, "Export Example PDF Catalog & JPGs");
    cbExportPDF.value = true;

    // Dialog action buttons
    var btnGroup = win.add("group");
    btnGroup.alignment = ["right", "bottom"];
    btnGroup.spacing = 15;
    btnGroup.add("button", undefined, "Cancel", {name: "cancel"});
    var okBtn = btnGroup.add("button", undefined, "Package Document", {name: "ok"});

    // -------------------------------------------------------------------------
    // 3. EXPORT PIPELINE EXECUTION
    // -------------------------------------------------------------------------
    if (win.show() === 1) {
        var outFolder = new Folder(outDirInput.text);
        if (!outFolder.exists) {
            try {
                outFolder.create();
            } catch (_) {
                alert("Could not create output destination folder.");
                return;
            }
        }

        var docType = typeDropdown.selection.text;
        if (docType === "Custom...") {
            docType = customTypeInput.text.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
            if (!docType) docType = "other";
        }

        var baseName = nameInput.text.replace(/[\/\\:*?"<>|]/g, '');
        var targetDir = new Folder(outFolder.fsName + "/" + docType);
        if (!targetDir.exists) {
            try {
                targetDir.create();
            } catch (_) {}
        }

        BrandSystem.Logger.showProgress("Exporting Custom Document...");

        var tempMasters = [];
        var generatedPages = [];

        try {
            var aCover = doc.masterSpreads.itemByName("A-Cover");
            var bContent = doc.masterSpreads.itemByName("B-Content");
            var cBack = doc.masterSpreads.itemByName("C-Back");

            var footerNames = [];
            if (cbExportPDF.value && aCover.isValid) {
                var items = aCover.allPageItems;
                for (var f = 0; f < items.length; f++) {
                    if (items[f].isValid && items[f].label === "DynamicBrandFooter" && items[f].name && items[f].name.indexOf("Footer Variant:") === 0) {
                        var fName = items[f].name;
                        var alreadyAdded = false;
                        for (var fnCheck = 0; fnCheck < footerNames.length; fnCheck++) {
                            if (footerNames[fnCheck] === fName) alreadyAdded = true;
                        }
                        if (!alreadyAdded) footerNames.push(fName);
                    }
                }

                // Synthesize catalog pages demonstrating every brand footer variant
                if (footerNames.length > 0) {
                    for (var fn = 0; fn < footerNames.length; fn++) {
                        try {
                            var tempMaster = aCover.duplicate();
                            tempMaster.namePrefix = "TEMP";
                            tempMaster.baseName = "Variant " + (footerNames[fn].split(": ")[1] || "Custom");
                            tempMasters.push(tempMaster);

                            var mItems = tempMaster.allPageItems;
                            for (var m = 0; m < mItems.length; m++) {
                                if (mItems[m].isValid && mItems[m].label === "DynamicBrandFooter" && mItems[m].name && mItems[m].name.indexOf("Footer Variant:") === 0) {
                                    mItems[m].visible = (mItems[m].name === footerNames[fn]);
                                }
                            }
                            var pg = doc.pages.add(LocationOptions.AT_END);
                            pg.appliedMaster = tempMaster;
                            generatedPages.push({ page: pg, suffix: footerNames[fn].replace("Footer Variant: ", "") });
                        } catch (e) {
                            BrandSystem.Logger.warn("Failed to create PDF page for footer variant " + footerNames[fn] + ": " + e.message);
                        }
                    }
                }

                var originalFacing = doc.documentPreferences.facingPages;
                if (bContent && bContent.isValid) {
                    var pgB1 = doc.pages.add(LocationOptions.AT_END);
                    pgB1.appliedMaster = bContent;
                    generatedPages.push({ page: pgB1, suffix: "Content_1" });
                    if (originalFacing) {
                        var pgB2 = doc.pages.add(LocationOptions.AT_END);
                        pgB2.appliedMaster = bContent;
                        generatedPages.push({ page: pgB2, suffix: "Content_2" });
                    }
                }
                if (cBack && cBack.isValid) {
                    var pgC = doc.pages.add(LocationOptions.AT_END);
                    pgC.appliedMaster = cBack;
                    generatedPages.push({ page: pgC, suffix: "Back" });
                }

                var examplesDir = new Folder(targetDir.fsName + "/examples");
                if (!examplesDir.exists) {
                    try {
                        examplesDir.create();
                    } catch (_) {}
                }

                // -------------------------------------------------------------
                // 3a. PDF CATALOG EXPORT
                // -------------------------------------------------------------
                BrandSystem.Logger.updateProgress("Exporting PDF...");
                var pdfFile = new File(examplesDir.fsName + "/" + baseName + ".pdf");
                var preset = app.pdfExportPresets.itemByName("[High Quality Print]");
                if (!preset.isValid) preset = app.pdfExportPresets.firstItem();
                app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;

                var oldSpreadsPref = app.pdfExportPreferences.exportReaderSpreads;
                app.pdfExportPreferences.exportReaderSpreads = true;
                try {
                    doc.exportFile(ExportFormat.PDF_TYPE, pdfFile, false, preset);
                } catch (_) {}
                app.pdfExportPreferences.exportReaderSpreads = oldSpreadsPref;

                // -------------------------------------------------------------
                // 3b. JPEG PREVIEWS GENERATION
                // -------------------------------------------------------------
                BrandSystem.Logger.updateProgress("Exporting JPGs...");
                try {
                    try { if (typeof JPEGOptionsQuality !== "undefined") app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH; } catch (_) {}
                    try { if (typeof ExportRangeOrAllPages !== "undefined") app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE; } catch (_) {}
                    try { app.jpegExportPreferences.exportResolution = 150; } catch (_) {}
                    try { app.jpegExportPreferences.exportingSpread = false; } catch (_) {}

                    var jpgFormat = 1701736204; // Raw application ID for standard JPEG export
                    try { if (typeof ExportFormat !== "undefined" && ExportFormat.JPG) jpgFormat = ExportFormat.JPG; } catch (_) {}

                    for (var gp = 0; gp < generatedPages.length; gp++) {
                        if (generatedPages[gp].suffix.indexOf("Content") === 0) continue; // Skip inner content pages for JPG previews

                        var targetPage = generatedPages[gp].page;
                        var appliedM = targetPage.appliedMaster;
                        if (appliedM && appliedM.isValid && appliedM.pages.length > 0) {
                            var mItemsPage = appliedM.pages[0].pageItems.everyItem().getElements();
                            for (var mi = 0; mi < mItemsPage.length; mi++) {
                                if (mItemsPage[mi].isValid && mItemsPage[mi].visible) {
                                    try { mItemsPage[mi].duplicate(targetPage); } catch (_) {}
                                }
                            }
                            try { targetPage.appliedMaster = null; } catch (_) {} // Detach master to prevent blank rendering
                        }

                        try { app.jpegExportPreferences.pageString = targetPage.name; } catch (_) {}
                        var tempName = baseName + "_TMP_" + gp;
                        var tempFile = new File(examplesDir.fsName + "/" + tempName + ".jpg");
                        var finalFile = new File(examplesDir.fsName + "/" + baseName + "-" + generatedPages[gp].suffix + ".jpg");

                        if (finalFile.exists) finalFile.remove();
                        doc.exportFile(jpgFormat, tempFile, false);

                        var createdFiles = examplesDir.getFiles(tempName + "*.jpg");
                        if (createdFiles && createdFiles.length > 0) {
                            createdFiles[0].rename(finalFile.name);
                        }
                    }
                } catch (_) {}
            }
        } finally {
            // Strictly guarantee document cleanup so working document remains pristine
            for (var pp = generatedPages.length - 1; pp >= 0; pp--) {
                try { generatedPages[pp].page.remove(); } catch (_) {}
            }
            for (var tm = 0; tm < tempMasters.length; tm++) {
                try { if (tempMasters[tm].isValid) tempMasters[tm].remove(); } catch (_) {}
            }
        }

        // ---------------------------------------------------------------------
        // 4. TEMPLATE & INDD PERSISTENCE
        // ---------------------------------------------------------------------
        if (cbExportINDT.value) {
            BrandSystem.Logger.updateProgress("Saving INDT...");
            try { doc.save(new File(targetDir.fsName + "/" + baseName + ".indt"), true); } catch (_) {}
        }
        if (cbExportINDD.value) {
            BrandSystem.Logger.updateProgress("Saving INDD...");
            try { doc.save(new File(targetDir.fsName + "/" + baseName + ".indd"), false); } catch (_) {}
        }

        BrandSystem.Logger.closeProgress();
        alert("Custom Export Complete!\n\nDocument successfully packaged into:\n" + targetDir.fsName);
    }
})();