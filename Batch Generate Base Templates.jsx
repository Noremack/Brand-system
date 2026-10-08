#target "indesign"
#include "modules/10-brand-engine.jsxinc"
#include "modules/09-ui-utils.jsxinc"

(function() {
    var userPrefs = UIUtils.loadPreferences();
    function getPref(key, fallback) { return UIUtils.getPref(userPrefs, key, fallback); }

    var win = new Window("dialog", "Batch Generate Base Templates");
    win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 20; win.margins = 25;

    var headerGrp = win.add("group"); headerGrp.orientation = "column"; headerGrp.alignChildren = "left"; headerGrp.spacing = 3;
    var titleTxt = headerGrp.add("statictext", undefined, "Batch Template Generator");
    try { titleTxt.graphics.font = ScriptUI.newFont("dialog", "BOLD", 18); } catch(e){}
    var subTxt = headerGrp.add("statictext", undefined, "Generate final InDesign templates (.indt) for distribution across multiple page sizes.");

    var contentGroup = win.add("group"); contentGroup.orientation = "row"; contentGroup.alignChildren = ["fill", "fill"]; contentGroup.spacing = 20;
    
    // LEFT COLUMN: Output & Formats
    var leftCol = contentGroup.add("group"); leftCol.orientation = "column"; leftCol.alignChildren = "fill"; leftCol.preferredSize.width = 250;
    var outCard = leftCol.add("panel", undefined, "Output Destination"); outCard.orientation = "column"; outCard.alignChildren = "left"; outCard.margins = 20; outCard.spacing = 12;
    var outDirGrp = outCard.add("group");
    var outDirInput = outDirGrp.add("edittext", undefined, Folder.desktop.fsName); outDirInput.preferredSize.width = 160;
    var outDirBtn = outDirGrp.add("button", undefined, "..."); outDirBtn.preferredSize.width = 30;
    outDirBtn.onClick = function() { var f = new Folder(outDirInput.text).selectDlg("Select Output Folder"); if (f) outDirInput.text = f.fsName; };
    
    var cbExportPDF = outCard.add("checkbox", undefined, "Export Example PDFs & JPGs");
    cbExportPDF.value = true; cbExportPDF.helpTip = "Generates a PDF and JPGs demonstrating all master pages and footer variants.";
    var cbExportINDD = outCard.add("checkbox", undefined, "Export standard .INDD documents");
    cbExportINDD.value = getPref("exportINDD", false); cbExportINDD.helpTip = "Saves standard InDesign Documents (.indd) alongside the templates (.indt).";
    var cbSpecimen = outCard.add("checkbox", undefined, "Inject Type Specimen");
    cbSpecimen.value = getPref("injectSpecimen", true); cbSpecimen.helpTip = "Generates a typography specimen on the first page of each template.";

    var fmtCard = leftCol.add("panel", undefined, "Target Page Formats"); fmtCard.orientation = "column"; fmtCard.alignChildren = "left"; fmtCard.margins = 20; fmtCard.spacing = 12;
    var cbSelectAllFmt = fmtCard.add("checkbox", undefined, "Select All Formats"); cbSelectAllFmt.value = true;
    var formatList = fmtCard.add("listbox", undefined, [], {multiselect: true}); formatList.preferredSize = [200, 160];
    
    var pMatrix = BrandSystem.config.pageMatrix;
    for (var i = 0; i < pMatrix.length; i++) {
        var item = formatList.add("item", pMatrix[i].name);
        item.selected = true;
    }
    cbSelectAllFmt.onClick = function() { for (var k=0; k<formatList.items.length; k++) formatList.items[k].selected = cbSelectAllFmt.value; };

    // RIGHT COLUMN: Settings
    var rightCol = contentGroup.add("group"); rightCol.orientation = "column"; rightCol.alignChildren = ["fill", "fill"];
    var settingsTabs = rightCol.add("tabbedpanel"); settingsTabs.alignChildren = ["fill", "fill"];

    // TAB 1: STYLE & THEMES
    var tabTheme = settingsTabs.add("tab", undefined, "Style & Themes");
    tabTheme.orientation = "column"; tabTheme.alignChildren = "left"; tabTheme.margins = 20; tabTheme.spacing = 15;
    
    var cmGroup = tabTheme.add("group"); cmGroup.add("statictext", undefined, "Color Mode:").preferredSize.width = 110; 
    var rbRGB = cmGroup.add("radiobutton", undefined, "RGB (Digital)"); rbRGB.value = getPref("colorMode", "RGB") === "RGB";
    var rbCMYK = cmGroup.add("radiobutton", undefined, "CMYK (Print)"); rbCMYK.value = getPref("colorMode", "RGB") === "CMYK";

    var modeGrp = tabTheme.add("group"); modeGrp.add("statictext", undefined, "Style Mode:").preferredSize.width = 110;
    var rbStandard = modeGrp.add("radiobutton", undefined, "Standard (Light)"); rbStandard.value = !getPref("isReverseMode", false);
    var rbReverse = modeGrp.add("radiobutton", undefined, "Reverse (Dark)"); rbReverse.value = getPref("isReverseMode", false);

    var themeGrp = tabTheme.add("group"); themeGrp.add("statictext", undefined, "Primary Theme:").preferredSize.width = 110;
    var themeDropdown = themeGrp.add("dropdownlist", undefined, BrandSystem.config.availableThemes); themeDropdown.preferredSize.width = 160;
    var tIdx = 0; for (var t=0; t<BrandSystem.config.availableThemes.length; t++) { if (BrandSystem.config.availableThemes[t] === (getPref("primaryStyleTheme", "Blue"))) { tIdx = t; break; } }
    themeDropdown.selection = tIdx;

    // TAB 2: TYPOGRAPHY
    var tabTypo = settingsTabs.add("tab", undefined, "Typography");
    tabTypo.orientation = "column"; tabTypo.alignChildren = "left"; tabTypo.margins = 20; tabTypo.spacing = 15;
    
    var fontInput = UIUtils.addInputRow(tabTypo, "Font Name:", getPref("selectedFont", BrandSystem.config.dialogDefaults.font), null);
    var leadingInput = UIUtils.addInputRow(tabTypo, "Leading Ratio:", getPref("baseLeadingRatio", BrandSystem.config.dialogDefaults.leadingRatio), "x");
    var scaleInput = UIUtils.addInputRow(tabTypo, "Scale Ratio:", getPref("scaleRatio", BrandSystem.config.dialogDefaults.scaleRatio), "x");

    // TAB 3: ASSETS & FOOTERS
    var tabAsset = settingsTabs.add("tab", undefined, "Assets");
    tabAsset.orientation = "column"; tabAsset.alignChildren = "left"; tabAsset.margins = 20; tabAsset.spacing = 15;
    
    var svgGrp = tabAsset.add("group"); svgGrp.add("statictext", undefined, "Footer Brand:").preferredSize.width = 110;
    var svgDropdown = tabAsset.add("dropdownlist", undefined, ["None", "All Footers"].concat(BrandSystem.config.assetTokens.footerVariants)); 
    var savedSvg = getPref("selectedFooterVariant", "All Footers");
    for (var i = 0; i < svgDropdown.items.length; i++) { if (svgDropdown.items[i].text === savedSvg) { svgDropdown.selection = i; break; } }
    if (!svgDropdown.selection) svgDropdown.selection = 1;

    var dirGrp = tabAsset.add("group"); dirGrp.add("statictext", undefined, "Footer Source:").preferredSize.width = 110;
    var defaultDir = BrandSystem.config.assetTokens.footerDirectory;
    var savedDir = getPref("customFooterDirectory", defaultDir);
    if (!(new Folder(savedDir).exists)) savedDir = defaultDir; 
    var dirInput = dirGrp.add("edittext", undefined, savedDir); dirInput.preferredSize.width = 250;
    var dirBtn = dirGrp.add("button", undefined, "..."); dirBtn.preferredSize.width = 35;

    var extGrp = tabAsset.add("group"); extGrp.add("statictext", undefined, "Footer Format:").preferredSize.width = 110;
    var extDropdown = extGrp.add("dropdownlist", undefined, []); extDropdown.preferredSize.width = 150;
    var extRefreshBtn = extGrp.add("button", undefined, "Refresh List");

    function updateFormatDropdown() {
        UIUtils.updateFormatDropdown(dirInput.text, extDropdown, getPref("footerFormat", ".svg"));
    }
    dirBtn.onClick = function() { var f = new Folder(dirInput.text).selectDlg("Select Footer Directory"); if (f) { dirInput.text = f.fsName; updateFormatDropdown(); } };
    extRefreshBtn.onClick = function() { updateFormatDropdown(); };
    updateFormatDropdown();

    var btnGroup = win.add("group"); btnGroup.alignment = ["right", "bottom"]; btnGroup.spacing = 15;
    btnGroup.add("button", undefined, "Cancel", {name: "cancel"}); 
    var okBtn = btnGroup.add("button", undefined, "Generate Base Templates", {name: "ok"});

    if (win.show() == 1) {
        var selectedFormats = [];
        for (var i=0; i<formatList.items.length; i++) {
            if (formatList.items[i].selected) {
                for (var m=0; m<pMatrix.length; m++) {
                    if (pMatrix[m].name === formatList.items[i].text) { selectedFormats.push(pMatrix[m]); break; }
                }
            }
        }
        
        if (selectedFormats.length === 0) { alert("No page formats selected."); return; }

        var outFolder = new Folder(outDirInput.text);
        if (!outFolder.exists) { try { outFolder.create(); } catch(e) { alert("Could not create output folder."); return; } }

        var params = { 
            doReset: false, buildColors: true, buildTypography: true, injectSpecimen: cbSpecimen.value, buildObjects: true, updateMargins: true, injectFooters: true, perfLog: false,
            selectedThemes: [themeDropdown.selection.text], primaryStyleTheme: themeDropdown.selection.text, 
            isReverseMode: rbReverse.value, colorMode: rbCMYK.value ? "CMYK" : "RGB",
            selectedFooterVariant: svgDropdown.selection ? svgDropdown.selection.text : "None",
            customFooterDirectory: dirInput.text,
            footerFormat: (extDropdown.selection && extDropdown.selection.text !== "None Found") ? extDropdown.selection.text : ".svg",
            selectedFont: fontInput.text, baseLeadingRatio: parseFloat(leadingInput.text) || 1.25, scaleRatio: parseFloat(scaleInput.text) || 1.25
        };

        UIUtils.savePreferences({
            colorMode: params.colorMode,
            primaryStyleTheme: params.primaryStyleTheme,
            isReverseMode: params.isReverseMode,
            selectedFont: params.selectedFont,
            injectSpecimen: params.injectSpecimen,
            baseLeadingRatio: params.baseLeadingRatio,
            scaleRatio: params.scaleRatio,
            selectedFooterVariant: params.selectedFooterVariant,
            customFooterDirectory: params.customFooterDirectory,
            footerFormat: params.footerFormat,
            exportINDD: cbExportINDD.value
        });

        BrandSystem.Logger.showProgress("Batch Generating Base Templates...");
        var generatedCount = 0;

        for (var i = 0; i < selectedFormats.length; i++) {
            var format = selectedFormats[i];
            
            var orientations = (format.orientation && format.orientation.length > 0)
                ? format.orientation.map(function(o) { return o.charAt(0).toUpperCase() + o.slice(1); })
                : ["Portrait", "Landscape"];

            for (var o = 0; o < orientations.length; o++) {
                var orientation = orientations[o];
                var width, height;
                
                if (orientation === "Portrait") {
                    width = format.shortEdge;
                    height = format.longEdge;
                } else {
                    width = format.longEdge;
                    height = format.shortEdge;
                }
                
                var docType = format.type || "document";
                var formatName = format.name.toLowerCase();
                var orientationStr = orientation.toLowerCase();
                var pageCountStr = (format.name === "DL") ? "-2-page" : "";
                
                var targetDir = new Folder(outFolder.fsName + "/" + docType);
                if (!targetDir.exists) { try { targetDir.create(); } catch(e) {} }
                
                var fileName;
                var isDigital = (format.type === 'digital' || format.name.toLowerCase().indexOf('digital') === 0);
                if (isDigital) {
                    var widthPx = Math.round(width / BrandSystem.config.PT_TO_MM);
                    var heightPx = Math.round(height / BrandSystem.config.PT_TO_MM);
                    fileName = docType + "-" + formatName + "-" + orientationStr + pageCountStr + "-" + widthPx + "x" + heightPx + "px.indt";
                } else {
                    fileName = docType + "-" + formatName + "-" + orientationStr + pageCountStr + "-" + width + "-" + height + "mm.indt";
                }
                var outputFile = new File(targetDir.fsName + "/" + fileName);

                BrandSystem.Logger.updateProgress("Building: " + fileName);
                var doc = app.documents.add(false); 
                var isLargeFormat = Math.max(format.shortEdge, format.longEdge) > 425;
                if (isLargeFormat || format.name === "DL") doc.documentPreferences.facingPages = false;
                
                doc.documentPreferences.pageWidth = width + "mm";
                doc.documentPreferences.pageHeight = height + "mm";
                
                var currentParams = {};
                for (var key in params) { currentParams[key] = params[key]; }
                currentParams.layoutMetrics = format; currentParams.baseFontSize = format.baseFont || 12;
                try { 
                    BrandSystem.process(doc, currentParams); 
                    doc.save(outputFile, true); 
                    
                    if (cbExportINDD.value) {
                        var inddFile = new File(targetDir.fsName + "/" + fileName.replace(".indt", ".indd"));
                        doc.save(inddFile, false);
                    }
                    
                    if (cbExportPDF.value) {
                        var examplesDir = new Folder(targetDir.fsName + "/examples");
                        if (!examplesDir.exists) { try { examplesDir.create(); } catch(e) {} }
                        
                        BrandSystem.Logger.updateProgress("Exporting PDF: " + fileName.replace(".indt", ".pdf"));
                        var pdfFile = new File(examplesDir.fsName + "/" + fileName.replace(".indt", ".pdf"));
                        
                        var aCover = doc.masterSpreads.itemByName("A-Cover");
                        var bContent = doc.masterSpreads.itemByName("B-Content");
                        var cBack = doc.masterSpreads.itemByName("C-Back");
                        
                        var originalFacing = doc.documentPreferences.facingPages;
                        doc.documentPreferences.facingPages = false; // Prevents Left/Right master mirroring offsets

                        var footerNames = [];
                        if (aCover.isValid) {
                            var items = aCover.allPageItems;
                            for (var f = 0; f < items.length; f++) {
                                if (items[f].isValid && items[f].label === "DynamicBrandFooter" && items[f].name && items[f].name.indexOf("Footer Variant:") === 0) {
                                    var fName = items[f].name;
                                    if (fName === "Footer Variant: Q") continue; // Q is the default cover, so we don't need a duplicate
                                    var alreadyAdded = false;
                                    for (var fnCheck = 0; fnCheck < footerNames.length; fnCheck++) { if (footerNames[fnCheck] === fName) alreadyAdded = true; }
                                    if (!alreadyAdded) footerNames.push(fName);
                                }
                            }
                        }
                        
                        var tempMasters = [];
                        if (aCover.isValid && footerNames.length > 0) {
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
                                } catch(e) {
                                    BrandSystem.Logger.warn("Failed to create PDF page for footer variant " + footerNames[fn] + ": " + e.message);
                                }
                            }
                        }
                        
                        if (bContent && bContent.isValid) {
                            var pgB1 = doc.pages.add(LocationOptions.AT_END); pgB1.appliedMaster = bContent;
                            if (originalFacing) { var pgB2 = doc.pages.add(LocationOptions.AT_END); pgB2.appliedMaster = bContent; }
                        }
                        
                        if (cBack && cBack.isValid) { var pgC = doc.pages.add(LocationOptions.AT_END); pgC.appliedMaster = cBack; }
                        
                        var preset = app.pdfExportPresets.itemByName("[High Quality Print]");
                        if (!preset.isValid) preset = app.pdfExportPresets.firstItem();
                        app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
                        
                        var oldSpreadsPref = app.pdfExportPreferences.exportReaderSpreads;
                        app.pdfExportPreferences.exportReaderSpreads = true;
                        
                        try {
                            doc.exportFile(ExportFormat.PDF_TYPE, pdfFile, false, preset);
                            BrandSystem.Logger.info("Exported PDF: " + pdfFile.name);
                        } catch (pdfErr) {
                            BrandSystem.Logger.warn("Failed to export PDF " + pdfFile.name + ": " + pdfErr.message);
                        }
                        
                        app.pdfExportPreferences.exportReaderSpreads = oldSpreadsPref;
                        
                        try {
                            try { if (typeof JPEGOptionsQuality !== "undefined") app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH; } catch(e) {}
                            try { if (typeof ExportRangeOrAllPages !== "undefined") app.jpegExportPreferences.jpegExportRange = ExportRangeOrAllPages.EXPORT_RANGE; } catch(e) {}
                            try { app.jpegExportPreferences.exportResolution = 150; } catch(e) {}
                            try { app.jpegExportPreferences.exportingSpread = true; } catch(e) {}
                            
                            // Force render for invisible documents by physically duplicating master items onto the export pages
                            var exportPages = doc.pages.everyItem().getElements();
                            for (var ep = 0; ep < exportPages.length; ep++) {
                                try {
                                    var pg = exportPages[ep];
                                    var appliedM = pg.appliedMaster;
                                    if (appliedM && appliedM.isValid) {
                                        var mPg = appliedM.pages.length > 0 ? appliedM.pages[0] : null;
                                        if (mPg && mPg.isValid) {
                                            var mItems = mPg.pageItems.everyItem().getElements();
                                            for (var mi = 0; mi < mItems.length; mi++) {
                                                if (mItems[mi].isValid && mItems[mi].visible) { try { mItems[mi].duplicate(pg); } catch(e) {} }
                                            }
                                        }
                                        try { pg.appliedMaster = null; } catch(e) {} // Detach master to prevent blank rendering
                                    }
                                } catch(e) {}
                            }
                            try { doc.recompose(); } catch(e) {}
                            
                            var jpgFormat = 1701736204; // Raw application ID for standard JPEG export
                            try { if (typeof ExportFormat !== "undefined" && ExportFormat.JPG) jpgFormat = ExportFormat.JPG; } catch(e) {}
                            
                            var baseName = fileName.replace(".indt", "");
                            
                            // Hide specimen for clean JPG cover exports
                            var specItems = doc.pages[0].pageItems.everyItem().getElements();
                            for (var h = 0; h < specItems.length; h++) {
                                if (specItems[h].isValid && specItems[h].label === "DynamicBrandSpecimen") {
                                    try { specItems[h].visible = false; } catch(e){}
                                }
                            }
                            
                            for (var ep = 0; ep < exportPages.length; ep++) {
                                var pg = exportPages[ep];
                                var suffix = "";
                                
                                if (ep === 0) {
                                    var vName = "Cover";
                                    if (aCover && aCover.isValid && aCover.pages.length > 0) {
                                        var items = aCover.pages[0].pageItems.everyItem().getElements();
                                        for (var f = 0; f < items.length; f++) {
                                            if (items[f].isValid && items[f].label === "DynamicBrandFooter" && items[f].name && items[f].name.indexOf("Footer Variant:") === 0 && items[f].visible) {
                                                vName = items[f].name.replace("Footer Variant: ", "");
                                                break;
                                            }
                                        }
                                    }
                                    suffix = vName;
                                } else if (ep <= footerNames.length) {
                                    suffix = footerNames[ep - 1].replace("Footer Variant: ", "");
                                } else if (ep === exportPages.length - 1 && cBack && cBack.isValid) {
                                    suffix = "Back";
                                } else {
                                    continue; // Skip inner content pages entirely
                                }
                                
                                try { app.jpegExportPreferences.pageString = pg.name; } catch(e) {}
                                
                                var tempName = baseName + "_TMP_" + ep;
                                var tempFile = new File(examplesDir.fsName + "/" + tempName + ".jpg");
                                var finalFile = new File(examplesDir.fsName + "/" + baseName + "-" + suffix + ".jpg");
                                
                                if (finalFile.exists) finalFile.remove();
                                
                                doc.exportFile(jpgFormat, tempFile, false);
                                
                                // Capture whatever file InDesign natively rendered and rename it cleanly
                                var createdFiles = examplesDir.getFiles(tempName + "*.jpg");
                                if (createdFiles && createdFiles.length > 0) {
                                    createdFiles[0].rename(finalFile.name);
                                }
                            }
                            
                            BrandSystem.Logger.info("Exported named JPGs for: " + baseName);
                        } catch (jpgErr) {
                            var safeJpgName = fileName.replace(".indt", ".jpg");
                            var errStr = "Unknown exception";
                            try { errStr = (jpgErr && jpgErr.message) ? String(jpgErr.message) : String(jpgErr); } catch(es) {}
                            BrandSystem.Logger.warn("Failed to export JPG " + safeJpgName + ": " + errStr);
                        }
                        
                        // Clean up temporary masters AFTER all exports are completely finished
                        for (var tm = 0; tm < tempMasters.length; tm++) {
                            try { if(tempMasters[tm].isValid) tempMasters[tm].remove(); } catch(e) {}
                        }
                    }
                    
                    doc.close(SaveOptions.NO); 
                    BrandSystem.Logger.info("Successfully saved: " + fileName);
                    generatedCount++;
                } catch(e) { 
                    try { if (doc && doc.isValid) doc.close(SaveOptions.NO); } catch(err){}
                    BrandSystem.Logger.warn("Failed to generate " + fileName + ": " + e.message); 
                }
            }
        }
        BrandSystem.Logger.closeProgress(); 
        
        // Force a warning entry so the ContinualLog doesn't suppress the dump on a perfect run
        BrandSystem.Logger.warn("=== BATCH GENERATION REPORT REQUESTED ===");
        var logPath = BrandSystem.Logger.dump(null, true);
        alert("Batch Generation Complete!\n\nSuccessfully generated " + generatedCount + " templates to:\n" + outFolder.fsName + "\n\nLog saved to:\n" + logPath);
    }
})();