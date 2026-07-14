/**
 * @file Extract Config Information.jsx
 * @description A utility tool to reverse-engineer visually styled InDesign objects and text 
 * into JSON objects formatted specifically for .system/lib/Config.jsx.
 */

#target "indesign"

(function() {
    if (app.documents.length === 0) {
        alert("Please open a document and select an object or text.");
        return;
    }

    if (app.selection.length === 0) {
        alert("Please select an object or text block to extract properties.");
        return;
    }

    var sel = app.selection[0];
    var doc = app.activeDocument;
    var out = [];

    var oldV = doc.viewPreferences.verticalMeasurementUnits;
    var oldH = doc.viewPreferences.horizontalMeasurementUnits;

    function round(num) { return Math.round(num * 100) / 100; }

    try {
    function getColorData(swatch) {
        if (!swatch || swatch.name === "None" || swatch.name === "[None]" || !swatch.hasOwnProperty("colorValue")) return null;
        var space = (swatch.space == ColorSpace.RGB) ? "RGB" : ((swatch.space == ColorSpace.CMYK) ? "CMYK" : "Unknown");
        var vals = swatch.colorValue;
        var roundedVals = [];
        for (var i=0; i<vals.length; i++) roundedVals.push(Math.round(vals[i]));
        
        var cmykStr = "";
        if (space === "CMYK") cmykStr = ', "cmykValue": [' + roundedVals.join(", ") + ']';
        return '  { "name": "' + swatch.name + '", "space": "' + space + '", "value": [' + roundedVals.join(", ") + ']' + cmykStr + ' }';
    }

    var isText = false;
    var textObj = null;

    // Determine if selection is a TextFrame or raw text selection
    if (sel.hasOwnProperty("texts") && sel.texts.length > 0) {
        isText = true;
        textObj = sel.texts[0];
    } else if (sel.hasOwnProperty("pointSize")) {
        isText = true;
        textObj = sel;
    }

    if (isText && textObj) {
        doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
        doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;

        out.push("/* ----------------------------------------------------");
        out.push("   TYPOGRAPHY TOKENS (Config.jsx -> typographyMatrix)");
        out.push("---------------------------------------------------- */");
        
        var ranges = textObj.textStyleRanges ? textObj.textStyleRanges : [textObj];
        var uniqueRanges = [];
        var seenSignatures = {};

        for (var r = 0; r < ranges.length; r++) {
            var tr = ranges[r];
            var sig = tr.pointSize + "_" + (tr.appliedFont ? tr.appliedFont.name : "") + "_" + tr.fontStyle + "_" + tr.leading + "_" + (tr.appliedParagraphStyle ? tr.appliedParagraphStyle.name : "");
            if (!seenSignatures[sig]) {
                seenSignatures[sig] = true;
                uniqueRanges.push(tr);
            }
        }

        for (var i = 0; i < uniqueRanges.length; i++) {
            var tr = uniqueRanges[i];
            
            var pStyleName = tr.appliedParagraphStyle ? tr.appliedParagraphStyle.name : "None";
            var cStyleName = tr.appliedCharacterStyle ? tr.appliedCharacterStyle.name : "None";
            
            var overrideStr = "";
            try { 
                if (tr.styleOverridden !== undefined) {
                    overrideStr = tr.styleOverridden ? " (Has Overrides)" : " (Clean)";
                } 
            } catch(e) {}

            out.push("/* --- " + pStyleName + overrideStr + (cStyleName !== "[None]" && cStyleName !== "None" ? " (" + cStyleName + ")" : "") + " --- */");
            
            var pt = tr.pointSize;
            var font = tr.appliedFont ? tr.appliedFont.name : "Unknown";
            var style = tr.fontStyle;
            var leading = tr.leading;
            
            var leadingRatio = 1.25;
            if (leading !== Leading.AUTO) {
                leadingRatio = round(leading / pt) + "x";
            } else {
                leadingRatio = "Auto (~1.2x)";
            }

            out.push("// Raw Base: " + pt + "pt " + font + " " + style + " (Leading: " + leadingRatio + ")");

            // Reverse-engineer the algorithmic scale power based on standard system constraints
            var basePt = 12;
            var scaleRatio = 1.25;
            var scalePower = Math.log(pt / basePt) / Math.log(scaleRatio);
            
            var spaceBeforePt = (tr.spaceBefore !== undefined) ? parseFloat(tr.spaceBefore) : 0;
            var spaceRatio = spaceBeforePt / basePt;
            
            out.push("  // Config.jsx -> typographyMatrix");
            out.push("  customToken: { scale: " + round(scalePower) + ", space: " + round(spaceRatio) + " },");

            var leftIndentPt = (tr.leftIndent !== undefined) ? parseFloat(tr.leftIndent) : 0;
            if (leftIndentPt > 0) {
                out.push("  // Config.jsx -> designTokens.list");
                out.push("  customIndentRatio: " + round(leftIndentPt / basePt) + ",");
            }

            try {
                if (tr.fillColor) {
                    var cData = getColorData(tr.fillColor);
                    if (cData) { out.push("\n  // Extracted Text Color\n" + cData + ","); }
                }
            } catch (e) {}
            out.push("");
        }
    } 
    
    if (sel.hasOwnProperty("fillColor") && !sel.hasOwnProperty("pointSize")) {
        doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
        doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;

        out.push("/* ----------------------------------------------------");
        out.push("   OBJECT TOKENS & COLORS");
        out.push("---------------------------------------------------- */");
        
        try {
            if (sel.hasOwnProperty("topLeftCornerRadius")) {
                var radius = parseFloat(sel.topLeftCornerRadius);
                if (radius > 0) {
                    out.push("// Config.jsx -> designTokens.layout");
                    out.push("customRadiusMm: " + round(radius) + ",\n");
                }
            }
        } catch(e) {}
        
        try {
            if (sel.hasOwnProperty("strokeWeight")) {
                var stroke = parseFloat(sel.strokeWeight);
                if (stroke > 0) {
                    out.push("// Config.jsx -> designTokens.table (or Object Base Stroke)");
                    out.push("customStrokeRatio: " + round(stroke / 1.0) + ", // relative to 1pt base\n");
                }
            }
        } catch(e) {}
        
        try {
            if (sel.constructor.name === "TextFrame") {
                var insets = sel.textFramePreferences.insetSpacing;
                var insetsRound = [];
                out.push("// StyleBuilder.jsx -> Object Styles Inset Space");
                if (insets instanceof Array) { 
                    for (var i=0; i<insets.length; i++) insetsRound.push(round(parseFloat(insets[i]))); 
                    out.push("customInsetMm: [" + insetsRound.join(", ") + "],\n");
                } else { 
                    out.push("customInsetMm: " + round(parseFloat(insets)) + ",\n"); 
                }
            }
        } catch(e) {}

        try { if (sel.fillColor) { var cDataFill = getColorData(sel.fillColor); if (cDataFill) out.push("// Extracted Fill Color\n" + cDataFill + ","); } } catch(e) {}
        try { if (sel.strokeColor) { var cDataStroke = getColorData(sel.strokeColor); if (cDataStroke) out.push("// Extracted Stroke Color\n" + cDataStroke + ","); } } catch(e) {}
    }

    var win = new Window("dialog", "Extract Config Information");
    win.orientation = "column"; win.alignChildren = ["fill", "fill"]; win.preferredSize = [450, 400];
    win.add("statictext", undefined, "Copy these converted tokens into .system/lib/Config.jsx:");
    var editTxt = win.add("edittext", undefined, out.join("\n"), {multiline: true}); editTxt.preferredSize = [450, 320];
    var btnGroup = win.add("group"); btnGroup.alignment = "right";
    var closeBtn = btnGroup.add("button", undefined, "Close"); closeBtn.onClick = function() { win.close(); }
    win.show();

    } finally {
        doc.viewPreferences.horizontalMeasurementUnits = oldH;
        doc.viewPreferences.verticalMeasurementUnits = oldV;
    }
})();