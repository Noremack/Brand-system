#target "indesign"

/**
 * ============================================================================
 * Adobe InDesign Brand System — Design Token Reverse-Engineering Utility
 * ============================================================================
 * @file Extract Config Information.jsx
 * @package InDesign Brand System — Queensland Government Design System (QGDS)
 * @version 2.4.0
 * @author Queensland Government Publishing & Design Engineering
 * @description Reverse-engineers visually styled InDesign document elements
 * (selected text frames, headings, paragraphs, and vector containers) into
 * mathematical scaling powers, ratios, and JSON token declarations ready for
 * insertion into brand-tokens.json.
 *
 * Capabilities:
 * 1. Typography Analysis: Inspects point sizes, font families, styles, leading,
 *    space before/after, and paragraph overrides; calculates modular scale
 *    powers relative to universalReferencePt (12pt).
 * 2. Swatch & Color Harvesting: Extracts fill and stroke color values, detects
 *    ColorSpace (RGB vs CMYK), and formats process swatch payloads.
 * 3. Container & Inset Geometry: Extracts corner radii, stroke weights, and
 *    multiline inset spacing values in millimeters.
 * 4. Interactive Output Window: Presents formatted JSON snippets in a multiline
 *    copy-ready dialog window.
 *
 * Environment & Compatibility:
 * - Adobe InDesign CS6 through CC 2026+ (ExtendScript ES3 engine)
 * ============================================================================
 */

(function() {
    // -------------------------------------------------------------------------
    // 1. PRE-FLIGHT VALIDATION & SELECTION CHECKS
    // -------------------------------------------------------------------------
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

    // Cache original measurement preferences to guarantee clean restoration
    var oldV = doc.viewPreferences.verticalMeasurementUnits;
    var oldH = doc.viewPreferences.horizontalMeasurementUnits;

    /**
     * Rounds a numeric value to two decimal places.
     * @param {Number} num - Number to round.
     * @returns {Number} Rounded number.
     */
    function round(num) {
        return Math.round(num * 100) / 100;
    }

    /**
     * Extracts swatch color data and formats as a JSON token snippet.
     * @param {Swatch} swatch - The InDesign swatch object.
     * @returns {String|null} Formatted JSON string or null if None/invalid.
     */
    function getColorData(swatch) {
        if (!swatch || swatch.name === "None" || swatch.name === "[None]" || !swatch.hasOwnProperty("colorValue")) {
            return null;
        }
        var space = (swatch.space === ColorSpace.RGB) ? "RGB" : ((swatch.space === ColorSpace.CMYK) ? "CMYK" : "Unknown");
        var vals = swatch.colorValue;
        var roundedVals = [];
        for (var i = 0; i < vals.length; i++) {
            roundedVals.push(Math.round(vals[i]));
        }

        var cmykStr = "";
        if (space === "CMYK") {
            cmykStr = ', "cmykValue": [' + roundedVals.join(", ") + ']';
        }
        return '  { "name": "' + swatch.name + '", "space": "' + space + '", "value": [' + roundedVals.join(", ") + ']' + cmykStr + ' }';
    }

    try {
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

        // ---------------------------------------------------------------------
        // 2. TYPOGRAPHY EXTRACTION & SCALING MATH
        // ---------------------------------------------------------------------
        if (isText && textObj) {
            doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.POINTS;
            doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.POINTS;

            out.push("/* ----------------------------------------------------");
            out.push("   TYPOGRAPHY TOKENS (brand-tokens.json -> typographyMatrix)");
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
                var trItem = uniqueRanges[i];

                var pStyleName = trItem.appliedParagraphStyle ? trItem.appliedParagraphStyle.name : "None";
                var cStyleName = trItem.appliedCharacterStyle ? trItem.appliedCharacterStyle.name : "None";

                var overrideStr = "";
                try {
                    if (trItem.styleOverridden !== undefined) {
                        overrideStr = trItem.styleOverridden ? " (Has Overrides)" : " (Clean)";
                    }
                } catch (_) {}

                out.push("/* --- " + pStyleName + overrideStr + (cStyleName !== "[None]" && cStyleName !== "None" ? " (" + cStyleName + ")" : "") + " --- */");

                var pt = trItem.pointSize;
                var font = trItem.appliedFont ? trItem.appliedFont.name : "Unknown";
                var style = trItem.fontStyle;
                var leading = trItem.leading;

                var leadingRatio = 1.25;
                if (leading !== Leading.AUTO) {
                    leadingRatio = round(leading / pt) + "x";
                } else {
                    leadingRatio = "Auto (~1.2x)";
                }

                out.push("// Raw Base: " + pt + "pt " + font + " " + style + " (Leading: " + leadingRatio + ")");

                // Reverse-engineer the algorithmic scale power based on standard system constraints (12pt base, 1.25 ratio)
                var basePt = 12;
                var scaleRatio = 1.25;
                var scalePower = Math.log(pt / basePt) / Math.log(scaleRatio);

                var spaceBeforePt = (trItem.spaceBefore !== undefined) ? parseFloat(trItem.spaceBefore) : 0;
                var spaceRatio = spaceBeforePt / basePt;

                out.push("  // brand-tokens.json -> typographyMatrix");
                out.push("  customToken: { scale: " + round(scalePower) + ", space: " + round(spaceRatio) + " },");

                var leftIndentPt = (trItem.leftIndent !== undefined) ? parseFloat(trItem.leftIndent) : 0;
                if (leftIndentPt > 0) {
                    out.push("  // brand-tokens.json -> designTokens.list");
                    out.push("  customIndentRatio: " + round(leftIndentPt / basePt) + ",");
                }

                try {
                    if (trItem.fillColor) {
                        var cData = getColorData(trItem.fillColor);
                        if (cData) {
                            out.push("\n  // Extracted Text Color\n" + cData + ",");
                        }
                    }
                } catch (_) {}
                out.push("");
            }
        }

        // ---------------------------------------------------------------------
        // 3. OBJECT & CONTAINER EXTRACTION (Geometry, Corners, Insets)
        // ---------------------------------------------------------------------
        if (sel.hasOwnProperty("fillColor") && !sel.hasOwnProperty("pointSize")) {
            doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
            doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;

            out.push("/* ----------------------------------------------------");
            out.push("   OBJECT TOKENS & COLORS (brand-tokens.json -> designTokens)");
            out.push("---------------------------------------------------- */");

            try {
                if (sel.hasOwnProperty("topLeftCornerRadius")) {
                    var radius = parseFloat(sel.topLeftCornerRadius);
                    if (radius > 0) {
                        out.push("// brand-tokens.json -> designTokens.layout");
                        out.push("customRadiusMm: " + round(radius) + ",\n");
                    }
                }
            } catch (_) {}

            try {
                if (sel.hasOwnProperty("strokeWeight")) {
                    var stroke = parseFloat(sel.strokeWeight);
                    if (stroke > 0) {
                        out.push("// brand-tokens.json -> designTokens.table (or Object Base Stroke)");
                        out.push("customStrokeRatio: " + round(stroke / 1.0) + ", // relative to 1pt base\n");
                    }
                }
            } catch (_) {}

            try {
                if (sel.constructor.name === "TextFrame") {
                    var insets = sel.textFramePreferences.insetSpacing;
                    var insetsRound = [];
                    out.push("// brand-tokens.json -> styles.objectStyles Inset Space");
                    if (insets instanceof Array) {
                        for (var ins = 0; ins < insets.length; ins++) {
                            insetsRound.push(round(parseFloat(insets[ins])));
                        }
                        out.push("customInsetMm: [" + insetsRound.join(", ") + "],\n");
                    } else {
                        out.push("customInsetMm: " + round(parseFloat(insets)) + ",\n");
                    }
                }
            } catch (_) {}

            try {
                if (sel.fillColor) {
                    var cDataFill = getColorData(sel.fillColor);
                    if (cDataFill) out.push("// Extracted Fill Color\n" + cDataFill + ",");
                }
            } catch (_) {}

            try {
                if (sel.strokeColor) {
                    var cDataStroke = getColorData(sel.strokeColor);
                    if (cDataStroke) out.push("// Extracted Stroke Color\n" + cDataStroke + ",");
                }
            } catch (_) {}
        }

        // ---------------------------------------------------------------------
        // 4. PRESENTATION DIALOG WINDOW
        // -------------------------------------------------------------------------
        var win = new Window("dialog", "Extract Config Information");
        win.orientation = "column";
        win.alignChildren = ["fill", "fill"];
        win.preferredSize = [450, 400];

        win.add("statictext", undefined, "Copy these converted tokens into brand-tokens.json:");
        var editTxt = win.add("edittext", undefined, out.join("\n"), {multiline: true});
        editTxt.preferredSize = [450, 320];

        var btnGroup = win.add("group");
        btnGroup.alignment = "right";
        var closeBtn = btnGroup.add("button", undefined, "Close");
        closeBtn.onClick = function() {
            win.close();
        };

        win.show();

    } finally {
        // Guarantee unit restoration
        doc.viewPreferences.horizontalMeasurementUnits = oldH;
        doc.viewPreferences.verticalMeasurementUnits = oldV;
    }
})();