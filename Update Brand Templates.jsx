#target "indesign"

var BATCH_PROCESS_ACTIVE = true; // Prevents the UI from launching when the engine is loaded
#include "modules/10-brand-engine.jsxinc"
#include "modules/09-ui-utils.jsxinc"

(function() {
    var isSilent = app.scriptArgs.getValue("BrandSystem_Silent") === "true";
    var userPrefs = UIUtils.loadPreferences();
    
    if (!isSilent) {
        var win = new Window("dialog", "Build Brand Templates");
        win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 15; win.margins = 20;

        var panel = win.add("panel", undefined, "Template Settings");
        panel.orientation = "column"; panel.alignChildren = "left"; panel.spacing = 10; panel.margins = 15;

        var grpColor = panel.add("group"); grpColor.add("statictext", undefined, "Color Profile:").preferredSize.width = 100;
        var ddColor = grpColor.add("dropdownlist", undefined, ["RGB", "CMYK"]);
        ddColor.selection = (userPrefs.colorMode === "CMYK") ? 1 : 0;

        var grpTheme = panel.add("group"); grpTheme.add("statictext", undefined, "Theme:").preferredSize.width = 100;
        var ddTheme = grpTheme.add("dropdownlist", undefined, BrandSystem.config.availableThemes);
        var tIdx = 0;
        for (var t=0; t<BrandSystem.config.availableThemes.length; t++) {
            if (BrandSystem.config.availableThemes[t] === (userPrefs.primaryStyleTheme || "Blue")) { tIdx = t; break; }
        }
        ddTheme.selection = tIdx;

        var grpMode = panel.add("group"); grpMode.add("statictext", undefined, "Style Mode:").preferredSize.width = 100;
        var ddMode = grpMode.add("dropdownlist", undefined, ["Standard", "Reverse"]);
        ddMode.selection = userPrefs.isReverseMode ? 1 : 0;

        var btnGroup = win.add("group"); btnGroup.alignment = ["right", "bottom"];
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

    BrandSystem.Logger.showProgress("Building Format-Specific Templates...");
    BrandSystem.Logger.startTimer("Template Builder Execution");
    BrandSystem.Logger.info("Template Builder Mode: " + (isSilent ? "Silent/Auto" : "Manual"));
    
    var folder = new Folder(new File($.fileName).parent.fsName + "/.system/Resources");
    
    if (!folder.exists) {
        folder.create();
    } else if (!isSilent) {
        BrandSystem.Logger.info("Manual Update triggered. Purging old template cache...");
        var oldTemplates = folder.getFiles("*.indt");
        for (var t = 0; t < oldTemplates.length; t++) {
            try { oldTemplates[t].remove(); } catch(e) { BrandSystem.Logger.warn("Failed to remove old template: " + e.message); }
        }
    }
    
    var pMatrix = BrandSystem.config.pageMatrix;
    var modeStr = userPrefs.isReverseMode ? "Reverse" : "Standard";
    var cMode = userPrefs.colorMode || "RGB";
    var pTheme = userPrefs.primaryStyleTheme || "Blue";

    for (var i = 0; i < pMatrix.length; i++) {
        var format = pMatrix[i];
        var namePart = format.name;
        var isDigital = (format.type === 'digital' || format.name.toLowerCase().indexOf('digital') === 0);
        if (isDigital) {
            var widthPx = Math.round(format.longEdge / BrandSystem.config.PT_TO_MM);
            var heightPx = Math.round(format.shortEdge / BrandSystem.config.PT_TO_MM);
            namePart = format.name + "_" + widthPx + "x" + heightPx + "px";
        }
        var templateName = "BrandSystem_" + namePart + "_" + cMode + "_" + pTheme + "_" + modeStr + ".indt";
        BrandSystem.Logger.updateProgress("Building Template: " + templateName);
        var templateFile = new File(folder.fsName + "/" + templateName);
        
        var doc = app.documents.add(false); 
        var isLargeFormat = Math.max(format.shortEdge, format.longEdge) > 425;
        if (isLargeFormat || format.name === "DL") doc.documentPreferences.facingPages = false;
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
        } catch(e) {
            try { if (doc && doc.isValid) doc.close(SaveOptions.NO); } catch(err){}
            BrandSystem.Logger.warn("Failed to build template " + format.name + ": " + e.message);
        }
    }
    
    BrandSystem.Logger.endTimer("Template Builder Execution", "All Templates Saved");
    BrandSystem.Logger.closeProgress();
    if (!isSilent) {
        var logPath = BrandSystem.Logger.dump(null, true);
        alert("Format-Specific Templates successfully built and updated.\n\nPerformance log saved to:\n" + logPath);
    }
})();