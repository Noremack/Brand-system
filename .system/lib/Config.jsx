/**
 * @file Config.jsx
 * @description The central brain of the Brand System. Contains all design tokens, page layout 
 * dimensions, typography scales, and color values. 
 * 
 * IMPORTANT: If you change ANY values in this file, you must run "Update Brand Templates.jsx" 
 * from the InDesign Scripts panel to recompile the .indt master caches!
 */
var config = {
        // =========================================================================
        // 1. SYSTEM CALIBRATION
        // =========================================================================
        PT_TO_MM: 0.352778,
        
        // =========================================================================
        // 2. PAGE LAYOUT MATRIX
        // =========================================================================
        // Defines the supported document sizes, layout spacing, and default master pages.
        pageMatrix: [
            { name: "Contact card", type: "card", formatStr: "ContactCard", shortEdge: 55, longEdge: 90, margin: 5, gutter: 5, bleed: 3, baseFont: 9, masters: ["Cover"], orientation: ["landscape"], brandBars: ["none"] },
            { name: "A6", type: "flyer", formatStr: "A6", shortEdge: 105, longEdge: 148, margin: 7, gutter: 7, bleed: 3, baseFont: 12, masters: ["Cover", "Back"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small"] },
            { name: "DL", type: "flyer", formatStr: "DL", shortEdge: 99,  longEdge: 210, margin: 7, gutter: 7, bleed: 3, baseFont: 12, masters: ["Cover", "Back"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small"] },
            { name: "A5", type: "booklet", formatStr: "A5", shortEdge: 148, longEdge: 210, margin: 10, gutter: 10, bleed: 3, baseFont: 12, masters: ["Cover", "Content", "Back"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A4", type: "document", formatStr: "A4", shortEdge: 210, longEdge: 297, margin: 12, gutter: 12, bleed: 3, baseFont: 12, masters: ["Cover", "Content", "Back"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A3", type: "document", formatStr: "A3", shortEdge: 297, longEdge: 420, margin: 17, gutter: 17, bleed: 3, baseFont: 12, masters: ["Cover"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A2", type: "poster", formatStr: "A2", shortEdge: 420, longEdge: 594, margin: 24, gutter: 24, bleed: 3, baseFont: 18, masters: ["Cover"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A1", type: "poster", formatStr: "A1", shortEdge: 594, longEdge: 841, margin: 34, gutter: 34, bleed: 3, baseFont: 24, masters: ["Cover"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A0", type: "poster", formatStr: "A0", shortEdge: 841, longEdge: 1189, margin: 48, gutter: 48, bleed: 3, baseFont: 32, masters: ["Cover"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A-Frame", type: "signage", formatStr: "AFrame", shortEdge: 600, longEdge: 900, margin: 34, gutter: 34, bleed: 3, baseFont: 24, masters: ["Cover"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "A-Frame large", type: "signage", formatStr: "AFrameLarge", shortEdge: 900, longEdge: 1200, margin: 48, gutter: 48, bleed: 3, baseFont: 32, masters: ["Cover"], orientation: ["portrait", "landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "Pullup banner", type: "signage", formatStr: "PullupBanner", shortEdge: 850, longEdge: 2000, margin: 48, gutter: 48, bleed: 5, baseFont: 32, masters: ["Cover"], orientation: ["portrait"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "Tri-fold", type: "signage", formatStr: "TriFold", shortEdge: 300, longEdge: 800, margin: 34, gutter: 34, bleed: 5, baseFont: 24, masters: ["Cover"], orientation: ["landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "Presentation", type: "digital", formatStr: "FHD", shortEdge: 381, longEdge: 677.33, margin: 17.5, gutter: 17.5, bleed: 0, baseFont: 24, masters: ["Cover"], orientation: ["landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "Screensaver", type: "digital", formatStr: "FHD", shortEdge: 381, longEdge: 677.33, margin: 17.5, gutter: 17.5, bleed: 0, baseFont: 24, masters: ["Cover"], orientation: ["landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "Digital-billboard", type: "signage", formatStr: "Billboard", shortEdge: 88.9, longEdge: 335.85, margin: 8.8, gutter: 8.8, bleed: 0, baseFont: 12, masters: ["Cover"], orientation: ["landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] },
            { name: "Digital-billboard large", type: "signage", formatStr: "BillboardLarge", shortEdge: 114.3, longEdge: 431.8, margin: 10.58, gutter: 10.58, bleed: 0, baseFont: 14, masters: ["Cover"], orientation: ["landscape"], brandBars: ["Brand bar - Small", "Brand bar - Large", "Brand bar - Full"] }
        ],
        fallbackMetrics: { name: "Custom", formatStr: "Custom", margin: 12, gutter: 12, bleed: 3, baseFont: 12, masters: ["Cover", "Content", "Back"] },
        dialogDefaults: { font: "Noto Sans", fontSize: 12, leadingRatio: 1.25, scaleRatio: 1.25 },

        // =========================================================================
        // 3. LAYER & ASSET MANAGEMENT
        // =========================================================================
        layerMatrix: [
            { name: "Foreground", color: UIColors.BLUE, aliases: ["Foreground", "Layer 1"] },
            { name: "Master: expand for cover options", color: UIColors.RED, aliases: [] },
            { name: "Background", color: UIColors.GREEN, aliases: ["Background", "Layer 2"] }
        ],

        assetTokens: {
            footerDirectory: new File($.fileName).parent.parent.fsName + "/Resources/Footers/EPS/",
            footerVariants: ["Q", "Q-QR", "BA", "BA-QR", "DRFA"],
            textureAlignment: "TOP_CENTER_ANCHOR", // Default for Brand bar - Full and Back Cover
            textureAlignmentSmall: "TOP_CENTER_ANCHOR", // Brand bar - Small
            textureAlignmentMedium: "TOP_CENTER_ANCHOR" // Brand bar - Wordmark Background
        },

        // =========================================================================
        // 4. DESIGN TOKENS
        // =========================================================================
        // Typography math: scale multipliers for H1/H2 sizes, spaces before/after, and leading.
        typographyMatrix: {
            universalReferencePt: 12, 
            title:      { scale: 3.25,     space: 0 },
            subtitle:   { scale: 2.25,     space: 0.5 },
            heading1:   { scale: 3.25,     space: 1.0 },
            heading2:   { scale: 2.25,     space: 1.0 },
            heading3:   { scale: 1.25,     space: 1.0 },
            heading4:   { scale: 0,     space: 0.75 },
            intro:      { scale: 0.75,  space: 0 },
            small:      { scale: -0.8, space: 0 },
            caption:    { scale: -0.8, space: 0.5 },
            footer:     { scale: -0.8, space: 0.5 },
            toc1:       { scale: 0.25,  space: 0 },
            toc2:       { scale: 0,     space: 0 },
            toc3:       { scale: -0.25, space: 0 }
        },

        // Master variables utilized by the StyleBuilder for padding, radii, and line weights.
        designTokens: {
            layout:    { headerHeightMm: 12, headerHeightMediumMm: 23, headerHeightLargeMm: 180, backCoverHeightMm: 19, coverMarginRatio: 0.5, absoluteMinMarginMm: 6, cornerRadiusLargeMm: 8, cornerRadiusMediumMm: 4, cornerRadiusSmallMm: 2, spacingBaseMm: 4 },
            list:      { iconWidthMm: 7, iconGapMm: 2, bulletIndentRatio: 1.0, numberIndentRatio: 1.75, spaceRatio: 0.75 },
            character: { iconBaselineShiftRatio: -5/12, underlineThinRatio: 0.5 },
        table:     { cellPaddingRatio: 0.4, spaceBeforeRatio: 0.5, borderWeightRatio: 0.75, borderThickWeightRatio: 1.5 }
        },

        // =========================================================================
        // 5. STYLE SPECIMEN CONFIGURATION
        // =========================================================================
        specimenStyles: [
            { text: "Title", style: "Title" }, { text: "Subtitle", style: "Subtitle" },
            { text: "Heading 1", style: "Heading 1" }, { text: "Heading 2", style: "Heading 2" },
            { text: "Heading 3", style: "Heading 3" }, { text: "Heading 4", style: "Heading 4" },
            { text: "Intro paragraph", style: "Introduction Paragraph" }, { text: "Paragraph", style: "Paragraph" },
            { text: "Paragraph No Spacing", style: "Paragraph No Spacing" },
            { text: "Paragraph Small", style: "Paragraph Small" },
            { text: "Paragraph Small No Spacing", style: "Paragraph Small No Spacing" },
            { text: "Figure caption", style: "Figure Caption" }, { text: "Caption", style: "Caption" },
            { text: "Notes", style: "Notes" }, { text: "Footer", style: "Footer" },
            { text: "List bullet 1", style: "List Bullet 1" }, { text: "List bullet 2", style: "List Bullet 2" },
            { text: "List bullet 3", style: "List Bullet 3" }, { text: "List number 1", style: "List Number 1" },
            { text: "List number 2", style: "List Number 2" }, { text: "List number 3", style: "List Number 3" },
            { text: "List Custom Icon", style: "List Custom Icon" }, { text: "List Custom Icon Small", style: "List Custom Icon Small" },
            { text: "TOC 1", style: "TOC 1" }, { text: "TOC 2", style: "TOC 2" }, { text: "TOC 3", style: "TOC 3" }
        ],

        // =========================================================================
        // 6. COLOR PALETTES & THEMES
        // =========================================================================
        availableThemes: ["Blue", "Gum", "Sand", "BVRT"], 
        
        colors: [
            { "name": "Blue - White", "space": "RGB", "value": [229, 238, 247] },
            { "name": "Blue - Extra Light", "space": "RGB", "value": [178, 206, 233] },
            { "name": "Blue - Light", "space": "RGB", "value": [127, 174, 219] },
            { "name": "Blue - Medium", "space": "RGB", "value": [0, 94, 184], "cmykValue": [93, 64, 0, 0] },
            { "name": "Blue - Dark", "space": "RGB", "value": [0, 65, 128], "cmykValue": [93, 64, 0, 30] },
            { "name": "Blue - Extra Dark", "space": "RGB", "value": [0, 37, 73], "cmykValue": [93, 64, 0, 60] },
            { "name": "Blue - Black", "space": "RGB", "value": [0, 18, 36], "cmykValue": [93, 64, 0, 80] },
            { "name": "Neutral - White", "space": "RGB", "value": [246, 245, 247], "cmykValue": [2, 2, 1, 0] }, 
            { "name": "Neutral - Extra Light", "space": "RGB", "value": [235, 235, 235], "cmykValue": [8, 6, 6, 0] },
            { "name": "Neutral - Light", "space": "RGB", "value": [224, 224, 224], "cmykValue": [13, 10, 9, 0] },
            { "name": "Neutral - Medium", "space": "RGB", "value": [120, 121, 126], "cmykValue": [48, 39, 31, 25] },
            { "name": "Neutral - Dark", "space": "RGB", "value": [89, 89, 89], "cmykValue": [53, 45, 40, 45] },
            { "name": "Neutral - Extra Dark", "space": "RGB", "value": [65, 65, 65], "cmykValue": [60, 50, 43, 59] },
            { "name": "Neutral - Black", "space": "RGB", "value": [29, 29, 29], "cmykValue": [70, 58, 53, 85] },
            { "name": "Gum - Neutral", "space": "RGB", "value": [208, 216, 211] },
            { "name": "Gum - White", "space": "RGB", "value": [239, 239, 243] },
            { "name": "Gum - Extra Light", "space": "RGB", "value": [6, 188, 80] },
            { "name": "Gum - Light", "space": "RGB", "value": [4, 130, 92] },
            { "name": "Gum - Medium", "space": "RGB", "value": [2, 76, 74] },
            { "name": "Gum - Dark", "space": "RGB", "value": [0, 49, 51] },
            { "name": "Gum - Extra Dark", "space": "RGB", "value": [0, 49, 51] },
            { "name": "Gum - Black", "space": "RGB", "value": [0, 25, 25] },
            { "name": "Sand - Neutral", "space": "RGB", "value": [216, 212, 206] },
            { "name": "Sand - White", "space": "RGB", "value": [247, 244, 242] },
            { "name": "Sand - Extra Light", "space": "RGB", "value": [255, 156, 26] },
            { "name": "Sand - Light", "space": "RGB", "value": [234, 86, 21] },
            { "name": "Sand - Medium", "space": "RGB", "value": [198, 51, 0] },
            { "name": "Sand - Dark", "space": "RGB", "value": [76, 16, 0] },
            { "name": "Sand - Extra Dark", "space": "RGB", "value": [76, 16, 0] },
            { "name": "Sand - Black", "space": "RGB", "value": [25, 6, 0] },
            { "name": "BVRT - White", "space": "RGB", "value": [251, 243, 224] },
            { "name": "BVRT - Extra Light", "space": "RGB", "value": [234, 217, 180] },
            { "name": "BVRT - Light", "space": "RGB", "value": [212, 179, 134] },
            { "name": "BVRT - Medium", "space": "RGB", "value": [121, 68, 8] },
            { "name": "BVRT - Dark", "space": "RGB", "value": [91, 47, 8] },
            { "name": "BVRT - Extra Dark", "space": "RGB", "value": [77, 44, 8] },
            { "name": "BVRT - Black", "space": "RGB", "value": [41, 22, 8] }
        ],
        gradients: [
            { "name": "Blue - Gradient Dark", "type": "Linear", "stops": [{ "color": "Blue - Black", "location": 0 }, { "color": "Blue - Extra Dark", "location": 100 }] },
            { "name": "Blue - Gradient Light", "type": "Linear", "stops": [{ "color": "Blue - Light", "location": 0 }, { "color": "Blue - Extra Light", "location": 100 }] },
            { "name": "Blue - Gradient", "type": "Linear", "stops": [{ "color": "Blue - Dark", "location": 0 }, { "color": "Blue - Medium", "location": 100 }] },
            { "name": "Gum - Gradient Dark", "type": "Linear", "stops": [{ "color": "Gum - Black", "location": 0 }, { "color": "Gum - Dark", "location": 100 }] },
            { "name": "Gum - Gradient Light", "type": "Linear", "stops": [{ "color": "Gum - Light", "location": 0 }, { "color": "Gum - Extra Light", "location": 100 }] },
            { "name": "Gum - Gradient", "type": "Linear", "stops": [{ "color": "Gum - Dark", "location": 0 }, { "color": "Gum - Medium", "location": 100 }] },
            { "name": "Sand - Gradient Dark", "type": "Linear", "stops": [{ "color": "Sand - Black", "location": 0 }, { "color": "Sand - Dark", "location": 100 }] },
            { "name": "Sand - Gradient Light", "type": "Linear", "stops": [{ "color": "Sand - Light", "location": 0 }, { "color": "Sand - Extra Light", "location": 100 }] },
            { "name": "Sand - Gradient", "type": "Linear", "stops": [{ "color": "Sand - Dark", "location": 0 }, { "color": "Sand - Medium", "location": 100 }] },
            { "name": "Neutral - Gradient", "type": "Linear", "stops": [{ "color": "Neutral - Light", "location": 0 }, { "color": "Neutral - Extra Light", "location": 100 }] },
            { "name": "Neutral - Gradient White", "type": "Linear", "stops": [{ "color": "Neutral - Extra Light", "location": 0 }, { "color": "Neutral - White", "location": 100 }] },
            { "name": "BVRT - Gradient Dark", "type": "Linear", "stops": [{ "color": "BVRT - Black", "location": 0 }, { "color": "BVRT - Dark", "location": 100 }] },
            { "name": "BVRT - Gradient Light", "type": "Linear", "stops": [{ "color": "BVRT - Light", "location": 0 }, { "color": "BVRT - Extra Light", "location": 100 }] },
            { "name": "BVRT - Gradient", "type": "Linear", "stops": [{ "color": "BVRT - Dark", "location": 0 }, { "color": "BVRT - Medium", "location": 100 }] }
        ]
    };