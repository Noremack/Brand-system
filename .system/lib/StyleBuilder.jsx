/**
 * @file StyleBuilder.jsx
 * @description Acts as the translation layer between Config.jsx design tokens and InDesign DOM properties.
 * Takes raw numbers and formats them into InDesign-compatible structures (like object corner radii, 
 * dynamic stroke weights, or baseline shifts).
 * 
 * Note: These definitions are compiled ONLY when "Update Brand Templates.jsx" is run.
 */
var StyleBuilder = {
    
    // =========================================================================
    // 1. THEME ENGINE
    // =========================================================================
    /**
     * Resolves context-aware variables (like text color) depending on if the user selected Standard or Reverse mode.
     */
    getThemeColors: function(primaryTheme, isReverse) {
        if (!primaryTheme) primaryTheme = "Blue"; 
        var hasExtraDark = (primaryTheme === "Blue" || primaryTheme === "BVRT" || primaryTheme === "Gum" || primaryTheme === "Sand");
        var extraDarkToken = hasExtraDark ? (primaryTheme + " - Extra Dark") : (primaryTheme + " - Black");
        
        var baseData = { 
            themeName: primaryTheme,
            themeWhiteColor: primaryTheme + " - White",
            themeExtraDarkColor: extraDarkToken
        }; 

        if (isReverse) {
            baseData.primaryTextColor = "Paper"; 
            baseData.primaryHeadingColor = "Paper"; 
            baseData.secondaryHeadingColor = primaryTheme + " - Extra Light"; 
            baseData.accentColor = primaryTheme + " - Light"; 
            baseData.subtleStrokeColor = "Neutral - Dark"; 
            baseData.frameFillColor = extraDarkToken; 
            baseData.tableBodyHorizontalBorderColor = "Paper"; 
            baseData.tableBodyVerticalBorderColor = baseData.themeWhiteColor;
            baseData.tableHeaderBG = baseData.themeWhiteColor; 
            baseData.tableHeaderText = extraDarkToken; 
            baseData.tableZebraColor = primaryTheme + " - Black";
        } else {
            baseData.primaryTextColor = "Neutral - Extra Dark"; 
            baseData.primaryHeadingColor = primaryTheme + " - Medium"; 
            baseData.secondaryHeadingColor = extraDarkToken; 
            baseData.accentColor = primaryTheme + " - Medium"; 
            baseData.subtleStrokeColor = "Neutral - Light"; 
            baseData.frameFillColor = primaryTheme + " - Extra Light"; 
            baseData.tableHeaderBG = primaryTheme + " - Medium"; 
            baseData.tableHeaderText = "Neutral - White"; 
            baseData.tableBodyHorizontalBorderColor = "Neutral - Medium"; 
            baseData.tableBodyVerticalBorderColor = "Neutral - Light";
            baseData.tableZebraColor = "Neutral - Extra Light";
        }
        return baseData;
    },

    // =========================================================================
    // 2. OBJECT STYLES
    // =========================================================================
    objectStyleDefinitions: function(theme, typo) {
        var ref = config.typographyMatrix.universalReferencePt;
        var rLarge = sysUtils.scaleMm(config.designTokens.layout.cornerRadiusLargeMm, typo.baseFontSize, ref);
        var rMedium = sysUtils.scaleMm(config.designTokens.layout.cornerRadiusMediumMm, typo.baseFontSize, ref);
        var rSmall = sysUtils.scaleMm(config.designTokens.layout.cornerRadiusSmallMm, typo.baseFontSize, ref);

        function buildCorners(tl, tr, bl, br, fillColor, radius) {
            return {
                enableFill: true, fillColor: fillColor, enableStroke: false, strokeWeight: 0,
                topLeftCornerOption: tl ? CornerOptions.ROUNDED_CORNER : CornerOptions.NONE,
                topRightCornerOption: tr ? CornerOptions.ROUNDED_CORNER : CornerOptions.NONE,
                bottomLeftCornerOption: bl ? CornerOptions.ROUNDED_CORNER : CornerOptions.NONE,
                bottomRightCornerOption: br ? CornerOptions.ROUNDED_CORNER : CornerOptions.NONE,
                topLeftCornerRadius: tl ? radius : "0mm", topRightCornerRadius: tr ? radius : "0mm",
                bottomLeftCornerRadius: bl ? radius : "0mm", bottomRightCornerRadius: br ? radius : "0mm"
            };
        }

        var baseStyles = [{ name: "Frame - Basic", properties: { enableFill: true, fillColor: theme.frameFillColor, enableStroke: true, strokeColor: theme.accentColor, strokeWeight: typo.baseStroke } }];

        var permutations = [
            { suffix: "Top Left", tl: true, tr: false, bl: false, br: false }, { suffix: "Top Right", tl: false, tr: true, bl: false, br: false },
            { suffix: "Bottom Left", tl: false, tr: false, bl: true, br: false }, { suffix: "Bottom Right", tl: false, tr: false, bl: false, br: true },
            { suffix: "Top", tl: true, tr: true, bl: false, br: false }, { suffix: "Bottom", tl: false, tr: false, bl: true, br: true }, 
            { suffix: "Left", tl: true, tr: false, bl: true, br: false }, { suffix: "Right", tl: false, tr: true, bl: false, br: true },
            { suffix: "All Corners", tl: true, tr: true, bl: true, br: true }
        ];

        var sizeMatrix = [ { folder: "Frames - Radius Large", radius: rLarge }, { folder: "Frames - Radius Medium", radius: rMedium }, { folder: "Frames - Radius Small", radius: rSmall } ];
        var colorMatrix = [
            { label: "White", value: theme.themeWhiteColor }, { label: "Medium", value: theme.themeName + " - Medium" },
            { label: "Dark", value: theme.themeName + " - Dark" }, { label: "Extra Dark", value: theme.themeExtraDarkColor }, 
            { label: "Paper", value: "Paper" }, { label: "Neutral Light", value: "Neutral - Extra Light" }
        ];

        for (var c = 0; c < colorMatrix.length; c++) {
            for (var s = 0; s < sizeMatrix.length; s++) {
                for (var p = 0; p < permutations.length; p++) {
                    baseStyles.push({ group: sizeMatrix[s].folder, name: colorMatrix[c].label + " - Rounded " + permutations[p].suffix, properties: buildCorners(permutations[p].tl, permutations[p].tr, permutations[p].bl, permutations[p].br, colorMatrix[c].value, sizeMatrix[s].radius) });
                }
            }
        }

        var spaceBase = config.designTokens.layout.spacingBaseMm;
        function scaleSpc(multiplier) { return sysUtils.scaleMm(spaceBase * multiplier, typo.baseFontSize, ref); }
        
        var insetPermutations = [
            { name: "Inset - X-Small", t: 0.5, b: 0.5, l: 0.5, r: 0.5 },                                       
            { name: "Inset - Small", t: 1.0, b: 1.0, l: 1.0, r: 1.0 },                                       
            { name: "Inset - Medium", t: 1.5, b: 1.5, l: 1.5, r: 1.5 },                                      
            { name: "Inset - Large", t: 2.0, b: 2.0, l: 2.0, r: 2.0 },                                       
            { name: "Inset - Large (Vertical Only)", t: 2.0, b: 2.0, l: 0, r: 0 },                           
            { name: "Inset - Large (Flush Left)", t: 2.0, b: 2.0, l: 0, r: 2.0 },                            
            { name: "Inset - Large (Flush Right)", t: 2.0, b: 2.0, l: 2.0, r: 0 },                           
            { name: "Inset - Large (Reduced Left)", t: 2.0, b: 2.0, l: 1.0, r: 2.0 },                        
            { name: "Inset - Large (Vertical Reduced Bottom)", t: 2.0, b: 1.5, l: 0, r: 0 },                 
            { name: "Inset - X-Small (Flush Right)", t: 0.5, b: 0.5, l: 0.5, r: 0 },
            { name: "Inset - X-Small (Bottom Left)", t: 0, b: 0.5, l: 0.5, r: 0 },
            { name: "Inset - X-Small (Left Only)", t: 0, b: 0, l: 0.5, r: 0 }
        ];

        for (var ins = 0; ins < insetPermutations.length; ins++) {
            baseStyles.push({
                group: "Text Frame Insets", name: insetPermutations[ins].name,
                properties: { enableFill: false, enableStroke: false, enableParagraphStyle: false, enableTextFrameGeneralOptions: true, textFramePreferences: { insetSpacing: [scaleSpc(insetPermutations[ins].t), scaleSpc(insetPermutations[ins].l), scaleSpc(insetPermutations[ins].b), scaleSpc(insetPermutations[ins].r)] } }
            });
        }

        var columnPermutations = [
            { name: "Columns - X-Small", cols: 2, gutter: 4 },
            { name: "Columns - Small", cols: 2, gutter: 6 },
            { name: "Columns - Medium", cols: 2, gutter: 12 }
        ];

        for (var colIdx = 0; colIdx < columnPermutations.length; colIdx++) {
            baseStyles.push({
                group: "Text Frame Columns", name: columnPermutations[colIdx].name,
                properties: { enableFill: false, enableStroke: false, enableParagraphStyle: false, enableTextFrameGeneralOptions: true, textFramePreferences: { textColumnCount: columnPermutations[colIdx].cols, textColumnGutter: sysUtils.scaleMm(columnPermutations[colIdx].gutter, typo.baseFontSize, ref) } }
            });
        }

        return baseStyles;
    },

    // =========================================================================
    // 3. TYPOGRAPHY STYLES
    // =========================================================================
    characterStyleDefinitions: function(typo, theme, suffix) {
        var sfx = suffix ? " " + suffix : ""; function n(name) { return name + sfx; } 
        var ts = config.designTokens.character;
        var baseSize = typo.baseFontSize; 
        var smallSize = Math.round(baseSize * Math.pow(typo.scaleRatio, config.typographyMatrix.small.scale));
        var standardShift = Math.round(baseSize * ts.iconBaselineShiftRatio) + "pt"; 
        var smallShift = Math.round(smallSize * ts.iconBaselineShiftRatio) + "pt"; 
        var fullStroke = typo.baseStroke; var halfStroke = (parseFloat(typo.baseStroke) * ts.underlineThinRatio) + "pt";
        var isReverse = (suffix !== ""); var accentColor = isReverse ? "Neutral - White" : theme.accentColor;

        var styles = [
            { name: n("Bold"), properties: { fontStyle: "Bold" } }, { name: n("Italic"), properties: { fontStyle: "Italic" } },
            { name: n("Accent"), properties: { fillColor: accentColor } }, { name: n("Accent Semibold"), properties: { fontStyle: "SemiBold", fillColor: accentColor } },
            { name: n("Underline 1pt line"), properties: { underline: true, underlineWeight: fullStroke } }, { name: n("Underline .5 line"), properties: { underline: true, underlineWeight: halfStroke } },
            { name: n("Underline 1pt japanese dots"), properties: { underline: true, underlineWeight: fullStroke, underlineType: "Japanese Dots" } },
            { name: n("Offset Custom Icon"), properties: { baselineShift: standardShift } }, { name: n("Offset Custom Icon Small"), properties: { baselineShift: smallShift } }
        ];

        if (isReverse) {
            for (var i = 0; i < styles.length; i++) { styles[i].group = "Reverse"; }
        }
        return styles;
    },
    
    paragraphStyleDefinitions: function(typo, theme, suffix) {
        var sfx = suffix ? " " + suffix : ""; function n(name) { return name + sfx; } 
        var PT_TO_MM = config.PT_TO_MM; var tMat = config.typographyMatrix; var dt = config.designTokens.list;
        var isReverse = (suffix !== "");

        function calc(scalePower, leadingRatio) { return sysUtils.calcType(scalePower, leadingRatio || typo.baseLeadingRatio, typo.baseFontSize, typo.scaleRatio); }
        function space(ratio) { if (ratio === 0) return "0mm"; return (Math.round((typo.baseFontSize * ratio * PT_TO_MM) * 4) / 4) + "mm"; }

        var bulletBaseIndent = sysUtils.scaleMm(typo.baseFontSize * dt.bulletIndentRatio * PT_TO_MM, typo.baseFontSize, typo.baseFontSize);
        var numberBaseIndent = sysUtils.scaleMm(typo.baseFontSize * dt.numberIndentRatio * PT_TO_MM, typo.baseFontSize, typo.baseFontSize);
        
        var baselineTotalIndent = dt.iconWidthMm + dt.iconGapMm; 
        var dynamicIconIndent = sysUtils.scaleMm(baselineTotalIndent, typo.baseFontSize, config.typographyMatrix.universalReferencePt);
        
        var smallSizePt = Math.round(typo.baseFontSize * Math.pow(typo.scaleRatio, tMat.small.scale)); 
        var dynamicIconSmallIndent = sysUtils.scaleMm(baselineTotalIndent, smallSizePt, config.typographyMatrix.universalReferencePt);
        
        var listSpaceBeforeMm = typo.baseLeadingInPt * dt.spaceRatio * PT_TO_MM; var listSpaceBefore = (Math.round(listSpaceBeforeMm * 4) / 4) + "mm"; var listSpaceBetween = (Math.round((listSpaceBeforeMm / 2) * 4) / 4) + "mm"; 
        var smallLeadingPt = Math.round(smallSizePt * (typo.baseLeadingRatio || 1.25)); var smallListSpaceBeforeMm = smallLeadingPt * dt.spaceRatio * PT_TO_MM; var smallListSpaceBefore = (Math.round(smallListSpaceBeforeMm * 4) / 4) + "mm"; var smallListSpaceBetween = (Math.round((smallListSpaceBeforeMm / 2) * 4) / 4) + "mm";

        function buildListStyles(baseStyleName, baseProps, indentValue, maxLevel) {
            var listStyles = [];
            for (var i = 1; i <= maxLevel; i++) {
                var currentStyleName = n(baseStyleName + " " + i);
                var indentString = (Math.round((parseFloat(indentValue) * i) * 4) / 4) + "mm";
                var levelProps = { spaceBefore: listSpaceBefore, spaceBetweenParagraphsUsingSameStyle: listSpaceBetween, leftIndent: indentString, tabList: [{ alignment: TabStopAlignment.LEFT_ALIGN, position: indentString }] };
                if (i === 1) { levelProps.basedOn = baseProps.basedOn; levelProps.firstLineIndent = "-" + indentValue; } else { levelProps.basedOn = n(baseStyleName + " " + (i - 1)); }
                if (baseProps.bulletsAndNumberingListType) levelProps.bulletsAndNumberingListType = baseProps.bulletsAndNumberingListType; if (baseProps.numberingList) levelProps.numberingList = baseProps.numberingList; if (baseProps.numberingFormat) levelProps.numberingFormat = baseProps.numberingFormat;
                listStyles.push({ name: currentStyleName, properties: i === 1 ? sysUtils.merge(baseProps, levelProps) : levelProps });
            }
            return listStyles;
        }
        
        var styles = [
            { name: n("Paragraph"), properties: { appliedFont: typo.primaryFontName, fontStyle: "Light", pointSize: typo.baseFontSize + "pt", leading: typo.baseLeadingInPt + "pt", justification: Justification.LEFT_ALIGN, hyphenation: false, fillColor: theme.primaryTextColor, spaceBefore: (Math.round((typo.baseLeadingInPt * PT_TO_MM) * 4) / 4) + "mm" } },
            { name: n("Paragraph No Spacing"), properties: { basedOn: n("Paragraph"), spaceBefore: "0mm", spaceAfter: "0mm" } },
            { name: n("Paragraph Small"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor }, calc(tMat.small.scale)) },
            { name: n("Paragraph Small No Spacing"), properties: { basedOn: n("Paragraph Small"), spaceBefore: "0mm", spaceAfter: "0mm" } },
            
            { name: n("List Custom Icon"), properties: { basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, spaceBefore: listSpaceBefore, spaceBetweenParagraphsUsingSameStyle: listSpaceBetween, leftIndent: dynamicIconIndent, firstLineIndent: "-" + dynamicIconIndent, tabList: [{ alignment: TabStopAlignment.LEFT_ALIGN, position: dynamicIconIndent }] }, grepStyles: [{ charStyle: n("Offset Custom Icon"), expr: "~a\\t~i" }, { charStyle: n("Offset Custom Icon"), expr: "~a\\t" }] },
            { name: n("List Custom Icon Small"), properties: { basedOn: n("Paragraph Small"), fillColor: theme.primaryTextColor, spaceBefore: smallListSpaceBefore, spaceBetweenParagraphsUsingSameStyle: smallListSpaceBetween, leftIndent: dynamicIconSmallIndent, firstLineIndent: "-" + dynamicIconSmallIndent, tabList: [{ alignment: TabStopAlignment.LEFT_ALIGN, position: dynamicIconSmallIndent }] }, grepStyles: [{ charStyle: n("Offset Custom Icon Small"), expr: "~a\\t~i" }, { charStyle: n("Offset Custom Icon Small"), expr: "~a\\t" }] },
            
            { name: n("Introduction Paragraph"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fontStyle: "Regular", fillColor: theme.primaryTextColor }, calc(tMat.intro.scale)) },
            { name: n("Title"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fontStyle: "Black", fillColor: theme.primaryHeadingColor, keepWithNext: 1 }, calc(tMat.title.scale)) },
            { name: n("Subtitle"), properties: sysUtils.merge({ basedOn: n("Title"), fontStyle: "Regular", fillColor: theme.primaryHeadingColor, spaceBefore: space(tMat.subtitle.space) }, calc(tMat.subtitle.scale)) },
            { name: n("Heading 1"), properties: sysUtils.merge({ basedOn: n("Title"), fontStyle: "Bold", fillColor: theme.primaryHeadingColor, spaceBefore: space(tMat.heading1.space) }, calc(tMat.heading1.scale)) },
            { name: n("Heading 2"), properties: sysUtils.merge({ basedOn: n("Heading 1"), fontStyle: "Medium", fillColor: theme.primaryHeadingColor, spaceBefore: space(tMat.heading2.space) }, calc(tMat.heading2.scale)) },
            { name: n("Heading 3"), properties: sysUtils.merge({ basedOn: n("Heading 2"), fillColor: theme.secondaryHeadingColor }, calc(tMat.heading3.scale)) },
            { name: n("Heading 4"), properties: sysUtils.merge({ basedOn: n("Heading 3"), fontStyle: "Bold", fillColor: theme.secondaryHeadingColor, spaceBefore: space(tMat.heading4.space) }, calc(tMat.heading4.scale)) }
        ];

        var bullets = buildListStyles("List Bullet", { basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, bulletsAndNumberingListType: ListType.BULLET_LIST }, bulletBaseIndent, 3);
        for(var b=0; b<bullets.length; b++) styles.push(bullets[b]);

        var numbers = buildListStyles("List Number", { basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, bulletsAndNumberingListType: ListType.NUMBERED_LIST, numberingList: "Scripted Numbered List", numberingFormat: "^#.^t", firstLineIndent: "-" + dynamicIconIndent, tabList: [{ alignment: TabStopAlignment.LEFT_ALIGN, position: dynamicIconIndent }] }, dynamicIconIndent, 3);
        for(var nIdx=0; nIdx<numbers.length; nIdx++) styles.push(numbers[nIdx]);

        var secondaryStyles = [
            { name: n("Figure Caption"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.secondaryHeadingColor, fontStyle: "Medium" }, calc(tMat.caption.scale)) }, 
            { name: n("Caption"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, fontStyle: "Regular" }, calc(tMat.caption.scale)) },
            { name: n("Notes"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, fontStyle: "Light" }, calc(tMat.caption.scale)) }, 
            { name: n("Footer"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, fontStyle: "Regular" }, calc(tMat.footer.scale)) },
            { name: n("TOC 1"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, fontStyle: "Medium", tabList: [{ alignment: TabStopAlignment.RIGHT_ALIGN }] }, calc(tMat.toc1.scale)) },
            { name: n("TOC 2"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, fontStyle: "Regular", tabList: [{ alignment: TabStopAlignment.RIGHT_ALIGN }] }, calc(tMat.toc2.scale)) },
            { name: n("TOC 3"), properties: sysUtils.merge({ basedOn: n("Paragraph"), fillColor: theme.primaryTextColor, fontStyle: "Light", tabList: [{ alignment: TabStopAlignment.RIGHT_ALIGN }] }, calc(tMat.toc3.scale)) },
            { name: n("Cell - Header Text Solid"), properties: { basedOn: n("Paragraph"), fontStyle: "Bold", pointSize: typo.baseFontSize + "pt", leading: typo.baseLeadingInPt + "pt", fillColor: theme.tableHeaderText, spaceBefore: 0, spaceAfter: 0 } },
            { name: n("Cell - Header Text Clean"), properties: { basedOn: n("Paragraph"), fontStyle: "Bold", pointSize: typo.baseFontSize + "pt", leading: typo.baseLeadingInPt + "pt", fillColor: theme.primaryHeadingColor, spaceBefore: 0, spaceAfter: 0 } }
        ];

        for(var s=0; s<secondaryStyles.length; s++) styles.push(secondaryStyles[s]);

        if (isReverse) {
            for (var i = 0; i < styles.length; i++) { styles[i].group = "Reverse"; }
        }
        
        return styles;
    },

    // =========================================================================
    // 4. TABLE STYLES
    // =========================================================================
    cellStyleDefinitions: function(theme, typo, suffix) {
        var sfx = suffix ? " " + suffix : ""; function n(name) { return name + sfx; }
        var isReverse = (suffix !== "");
        var PT_TO_MM = config.PT_TO_MM;
        // Dynamic padding and stroke weights driven by values in config.designTokens.table
        var padV = (Math.round((typo.baseLeadingInPt * config.designTokens.table.cellPaddingRatio * PT_TO_MM) * 4) / 4) + "mm";
        var weight = (parseFloat(typo.baseStroke) * config.designTokens.table.borderWeightRatio) + "pt";
        var thickWeight = (parseFloat(typo.baseStroke) * config.designTokens.table.borderThickWeightRatio) + "pt";
        var styles = [
        { name: n("Cell - Body"), properties: { appliedParagraphStyle: n("Paragraph No Spacing"), fillColor: "None", topInset: padV, bottomInset: padV, bottomEdgeStrokeWeight: weight, bottomEdgeStrokeColor: theme.tableBodyHorizontalBorderColor, topEdgeStrokeWeight: 0, topEdgeStrokeColor: "None", leftEdgeStrokeWeight: weight, leftEdgeStrokeColor: theme.tableBodyVerticalBorderColor, rightEdgeStrokeWeight: weight, rightEdgeStrokeColor: theme.tableBodyVerticalBorderColor } },
        { name: n("Cell - Header Solid"), properties: { appliedParagraphStyle: n("Cell - Header Text Solid"), fillColor: theme.tableHeaderBG, topInset: padV, bottomInset: padV, topEdgeStrokeWeight: typo.baseStroke, topEdgeStrokeColor: theme.tableHeaderBG, bottomEdgeStrokeWeight: 0, bottomEdgeStrokeColor: "None", leftEdgeStrokeWeight: 0, leftEdgeStrokeColor: "None", rightEdgeStrokeWeight: 0, rightEdgeStrokeColor: "None" } },
        { name: n("Cell - Header Clean"), properties: { appliedParagraphStyle: n("Cell - Header Text Clean"), fillColor: "None", topInset: padV, bottomInset: padV, bottomEdgeStrokeWeight: thickWeight, bottomEdgeStrokeColor: theme.primaryHeadingColor, topEdgeStrokeWeight: 0, topEdgeStrokeColor: "None", leftEdgeStrokeWeight: 0, leftEdgeStrokeColor: "None", rightEdgeStrokeWeight: 0, rightEdgeStrokeColor: "None" } }
        ];
        
        if (isReverse) {
            for (var i = 0; i < styles.length; i++) { styles[i].group = "Reverse"; }
        }
        return styles;
    },

    tableStyleDefinitions: function(theme, typo, suffix) {
        var sfx = suffix ? " " + suffix : ""; function n(name) { return name + sfx; }
        var isReverse = (suffix !== "");
        var PT_TO_MM = config.PT_TO_MM;
        var tableSpaceBefore = (Math.round((typo.baseFontSize * config.designTokens.table.spaceBeforeRatio * PT_TO_MM) * 4) / 4) + "mm";
        
        var zebraProps = {
            alternatingFills: AlternatingFillsTypes.ALTERNATING_ROWS,
            firstAlternatingFillColor: theme.tableZebraColor,
            secondAlternatingFillColor: "None",
            skipFirstAlternatingFillRows: 1
        };

        var styles = [
        { name: n("Table - Solid Header"), properties: sysUtils.merge({ headerRegionCellStyle: n("Cell - Header Solid"), bodyRegionCellStyle: n("Cell - Body"), topBorderStrokeWeight: 0, topBorderStrokeColor: "None", bottomBorderStrokeWeight: 0, bottomBorderStrokeColor: "None", leftBorderStrokeWeight: 0, leftBorderStrokeColor: "None", rightBorderStrokeWeight: 0, rightBorderStrokeColor: "None", spaceBefore: tableSpaceBefore }, zebraProps) },
        { name: n("Table - Clean Header"), properties: sysUtils.merge({ headerRegionCellStyle: n("Cell - Header Clean"), bodyRegionCellStyle: n("Cell - Body"), topBorderStrokeWeight: 0, topBorderStrokeColor: "None", bottomBorderStrokeWeight: 0, bottomBorderStrokeColor: "None", leftBorderStrokeWeight: 0, leftBorderStrokeColor: "None", rightBorderStrokeWeight: 0, rightBorderStrokeColor: "None", spaceBefore: tableSpaceBefore }, zebraProps) }
        ];
        
        if (isReverse) {
            for (var i = 0; i < styles.length; i++) { styles[i].group = "Reverse"; }
        }
        return styles;
    }
};