/**
 * @file AssetInjector.jsx
 * @description Handles the fetching and placement of dynamic brand assets (Headers, Footers, Covers, Specimens).
 */

/**
 * Finds a layer in the document using fuzzy keyword matching.
 * @param {Document} doc - The active InDesign document.
 * @param {Array} keywords - Array of strings that must be in the layer name.
 * @returns {Layer|null} The matching layer, or null if not found.
 */
function findLayerFuzzy(doc, keywords) {
    var docLayers = doc.layers.everyItem().getElements();
    for (var i = 0; i < docLayers.length; i++) {
        if (!docLayers[i].isValid) continue;
        var name = docLayers[i].name;
        var allMatch = true;
        for (var k = 0; k < keywords.length; k++) {
            var safeKw = keywords[k].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var regex = new RegExp(safeKw, "i");
            if (!regex.test(name)) { allMatch = false; break; }
        }
        if (allMatch) return docLayers[i];
    }
    return null;
}

/**
 * Hybrid Fuzzy Asset Scanner.
 * Matches keywords anywhere in the filename, but enforces strict suffix boundaries (@ or .) on the variant to prevent substring collisions (e.g. "Q" vs "Q-QR").
 * @param {String} folderPath - Asset directory.
 * @param {Array} fuzzyKeywords - Array of flexible keywords (e.g. ["header", "A4"]).
 * @param {String|null} strictVariant - Exact variant token requiring strict boundaries (e.g. "Q").
 * @param {String} extension - File extension (e.g. ".svg").
 * @param {Array} [allVariants] - Array of all known variants to prevent substring collisions (e.g. "Q" vs "Q-QR").
 * @returns {File|null}
 */
function findFuzzyAsset(folderPath, fuzzyKeywords, strictVariant, extension, allVariants) {
    var folder = new Folder(folderPath);
    if (!folder.exists) return null;
    var files = folder.getFiles();
    if (!files || files.length === undefined) return null;
    var extLower = extension.toLowerCase();
    for (var i = 0; i < files.length; i++) {
        if (!(files[i] instanceof File)) continue;
        var name = files[i].name;
        if (name.toLowerCase().substring(name.length - extLower.length) !== extLower) continue;
        var allMatch = true;
        for (var k = 0; k < fuzzyKeywords.length; k++) {
            if (!fuzzyKeywords[k]) continue; // Skip undefined/null keywords
            var safeKw = String(fuzzyKeywords[k]).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var regex = new RegExp("(?:^|[-_@\\s])" + safeKw + "(?:[-_@\\.\\s]|$)", "i");
            if (!regex.test(name)) { allMatch = false; break; }
        }
        if (!allMatch) continue;
        if (strictVariant) {
            var safeVar = String(strictVariant).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var varRegex = new RegExp("(?:^|[-_\\s])" + safeVar + "(?:[-_@\\.\\s]|$)", "i");
            if (!varRegex.test(name)) continue;
            
            if (allVariants) {
                var matchedLonger = false;
                for (var v = 0; v < allVariants.length; v++) {
                    var variantStr = allVariants[v];
                    if (variantStr && variantStr !== strictVariant && variantStr.length > (strictVariant ? String(strictVariant).length : 0)) {
                        var longerSafe = String(variantStr).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                        var longerRegex = new RegExp("(?:^|[-_\\s])" + longerSafe + "(?:[-_@\\.\\s]|$)", "i");
                        if (longerRegex.test(name)) { matchedLonger = true; break; }
                    }
                }
                if (matchedLonger) continue;
            }
        }
        return files[i];
    }
    return null;
}

/**
 * Proxies and injects the dynamic SVG/EPS brand footers onto the Cover master pages.
 * @param {Document} doc - The active InDesign document.
 * @param {Object} layoutMetrics - Active layout constraints.
 * @param {Array} brandVariantsArray - Array of brand variant strings (e.g., ["Q", "BA"]).
 * @param {String} customDir - Network path to the asset directory.
 * @param {String} footerFormat - Selected file extension (e.g., ".svg").
 */
function injectFooterGraphic(doc, layoutMetrics, brandVariantsArray, customDir, footerFormat) {
    if (!doc || !doc.isValid) throw new Error("Invalid document reference passed.");
    Logger.startTimer("Inject Footer Graphic");
    var masters = doc.masterSpreads.everyItem().getElements();
    var coverMaster = null;

    for (var m = 0; m < masters.length; m++) { 
        if (masters[m].isValid && masters[m].namePrefix === "A" && masters[m].baseName === "Cover") { coverMaster = masters[m]; break; } 
    }
    if (!coverMaster) {
        Logger.warn("Cover master missing for footer injection.");
        return;
    }

    var targetLayer = findLayerFuzzy(doc, ["master", "cover", "options"]);
    if (!targetLayer || !targetLayer.isValid) targetLayer = doc.layers.item(0);

    if (!targetLayer.isValid) {
        Logger.warn("Target layer missing during injection phase.");
        return; 
    }

    var page = coverMaster.pages[0]; var bounds = page.bounds; 
    var h = Math.abs(bounds[2] - bounds[0]); var w = Math.abs(bounds[3] - bounds[1]);
    var orientationStr = (w > h) ? "landscape" : "portrait";

    // STRUCTURAL FIX: High-Speed SSD Proxying for network SVGs
    var validFiles = [];
    var tempProxies = [];
    var vLen = brandVariantsArray.length;
    var tempFolder = Folder.temp;
    
    var baseDir = (customDir && customDir !== "") ? customDir : config.assetTokens.footerDirectory;
    if (baseDir.charAt(baseDir.length - 1) !== '/' && baseDir.charAt(baseDir.length - 1) !== '\\') {
        baseDir += '/';
    }
    
    Logger.info("Footer directory set to: " + baseDir);
    
    for (var v = 0; v < vLen; v++) {
        var brandVariant = brandVariantsArray[v];
        var ext = footerFormat || ".svg";
        var fuzzyKeywords = ["footer", layoutMetrics.formatStr, orientationStr];
        var allVariants = (config.assetTokens && config.assetTokens.footerVariants) ? config.assetTokens.footerVariants : null;
        var graphicFile = findFuzzyAsset(baseDir, fuzzyKeywords, brandVariant, ext, allVariants);
        
        if (graphicFile && graphicFile.exists) {
            var fileName = graphicFile.name;
            Logger.info("Found requested asset via hybrid match: " + fileName);
            var proxyFile = new File(tempFolder.fsName + "/" + fileName);
            try {
                if (graphicFile.copy(proxyFile)) {
                    validFiles.push({ variant: brandVariant, file: proxyFile, original: graphicFile });
                    tempProxies.push(proxyFile);
                } else {
                    validFiles.push({ variant: brandVariant, file: graphicFile, original: graphicFile }); // Fallback to network
                }
            } catch (e) {
                Logger.warn("File copy failed for " + fileName + ": " + e.message);
                validFiles.push({ variant: brandVariant, file: graphicFile, original: graphicFile }); // Fallback to network
            }
        } else {
            Logger.info("Missing expected asset (Skipping): " + fileName);
        }
    }

    // Targeted cleanup: Sweep Master Spreads (including pasteboard and nested groups) for O(1) performance
    for (var msIdx = 0; msIdx < masters.length; msIdx++) {
        var mItems = masters[msIdx].allPageItems;
        for (var i = mItems.length - 1; i >= 0; i--) {
            try {
                if (mItems[i].isValid && (mItems[i].label === "DynamicBrandFooter" || (mItems[i].name && mItems[i].name.indexOf("Footer Variant:") === 0))) {
                    if (mItems[i].locked) mItems[i].locked = false;
                    mItems[i].remove();
                }
            } catch(e) { Logger.warn("Failed to remove old footer element: " + e.message); }
        }
    }

    try {
    var coverPages = coverMaster.pages.everyItem().getElements();
    var cpLen = coverPages.length;
    var injectedCount = 0;
    
    for (var p = 0; p < cpLen; p++) {
        var targetPage = coverPages[p];
        if (!targetPage.isValid) continue;

        var pB = targetPage.bounds;
        Logger.info("Placing footer on page " + targetPage.name + " bounds: " + pB.join(", "));
        
        var maxVisibleFooterHeight = 0;
        var pageHeight = Math.abs(pB[2] - pB[0]);

        var vfLen = validFiles.length;
        for (var f = 0; f < vfLen; f++) {
            var vData = validFiles[f];
            
            var rect = targetPage.rectangles.add(targetLayer);
            rect.label = "DynamicBrandFooter";
            try { rect.name = "Footer Variant: " + vData.variant; } catch(e) { Logger.warn("Failed to set name for Footer Variant: " + e.message); } 
            
            var swatchNone = doc.swatches.item("None");
            if (!swatchNone.isValid) swatchNone = doc.swatches.item("[None]");
            rect.strokeWeight = 0; 
            if (swatchNone.isValid) {
                rect.fillColor = swatchNone;
                rect.strokeColor = swatchNone;
            }
            
            rect.geometricBounds = [pB[0] + "mm", pB[1] + "mm", (pB[0] + 10) + "mm", (pB[1] + 10) + "mm"];
            rect.place(vData.file); // Lightning fast SSD placement
            rect.fit(FitOptions.FRAME_TO_CONTENT);
            
            var fgb = rect.geometricBounds;
            var intrinsicH = fgb[2] - fgb[0];
            var intrinsicW = fgb[3] - fgb[1];
            var pageWidth = pB[3] - pB[1];
            var dynamicFooterHeight = (intrinsicW > 0) ? intrinsicH * (pageWidth / intrinsicW) : intrinsicH;
            
            var gBounds = [(pB[2] - dynamicFooterHeight) + "mm", pB[1] + "mm", pB[2] + "mm", pB[3] + "mm"];
            Logger.info("Applying dynamic footer geometricBounds for " + vData.variant + ": " + gBounds.join(", "));
            rect.geometricBounds = gBounds;
            rect.frameFittingOptions.fittingAlignment = AnchorPoint.BOTTOM_CENTER_ANCHOR;
            rect.fit(FitOptions.PROPORTIONALLY);

            if (rect.graphics.length > 0) {
                var gb = rect.graphics[0].geometricBounds;
                var visibleHeight = Math.abs(gb[2] - gb[0]);
                if (visibleHeight > maxVisibleFooterHeight) maxVisibleFooterHeight = visibleHeight;
            }

            // Embed the graphic directly into the document so the template is fully standalone
            var placedGraphic = rect.graphics[0];
            if (placedGraphic && placedGraphic.isValid && placedGraphic.itemLink && placedGraphic.itemLink.isValid) {
                try {
                    placedGraphic.itemLink.unlink();
                    Logger.info("Embedded footer graphic: " + vData.variant);
                } catch (embedErr) {
                    Logger.warn("Failed to embed footer graphic: " + embedErr.message);
                }
            }

            var isVisible = true;
            if (vLen > 1 && vData.variant !== "Q") {
                isVisible = false;
                rect.visible = false;
            }
            
            var hasWordmark = false;
            if (vData.original && vData.original.name.toLowerCase().indexOf("wordmark") !== -1) {
                hasWordmark = true;
            }
            
            if (hasWordmark) {
                var wordmarkGroup = targetPage.groups.itemByName("Brand bar - Wordmark");
                if (wordmarkGroup && wordmarkGroup.isValid) {
                    try {
                        var targetWordmark = wordmarkGroup.duplicate();
                        targetWordmark.visible = true;
                        rect.visible = true;
                        var combinedGroup = targetPage.groups.add([targetWordmark, rect]);
                        combinedGroup.name = "Footer Variant: " + vData.variant;
                        combinedGroup.label = "DynamicBrandFooter";
                        combinedGroup.visible = isVisible;
                    } catch(e) {
                        Logger.warn("Failed to group Wordmark header with footer: " + e.message);
                        rect.visible = isVisible;
                    }
                }
            }
            injectedCount++;
        }
        
        if (layoutMetrics.formatStr !== "A4") {
            if (maxVisibleFooterHeight === 0) {
                var h = (orientationStr === "landscape") ? layoutMetrics.footerHeightLandscape : layoutMetrics.footerHeightPortrait;
                if (h === undefined || h === null) h = Math.round(pageHeight * 0.12);
                maxVisibleFooterHeight = h;
            }
            var pageItems = targetPage.pageItems.everyItem().getElements();
            for (var i = 0; i < pageItems.length; i++) {
                if (pageItems[i].isValid && (pageItems[i].name === "Brand bar - Large" || pageItems[i].name === "Brand bar - Full" || pageItems[i].name === "Brand bar - Bleed")) {
                    var scaledHeaderHeightMm = Math.max(30, pageHeight - maxVisibleFooterHeight - layoutMetrics.margin);
                    var bleedMm = (layoutMetrics.bleed !== undefined) ? layoutMetrics.bleed : 0;
                    var updatedBounds = [(pB[0] - bleedMm) + "mm", (pB[1] - bleedMm) + "mm", (pB[0] + scaledHeaderHeightMm) + "mm", (pB[3] - layoutMetrics.margin) + "mm"];
                    pageItems[i].geometricBounds = updatedBounds;
                    if (pageItems[i].graphics.length > 0) {
                        pageItems[i].fit(FitOptions.FILL_PROPORTIONALLY);
                    }
                    Logger.info("Dynamically adjusted " + pageItems[i].name + " to avoid overlapping tallest footer.");
                    break;
                }
            }
        }
        
        var leftoverWordmark = targetPage.groups.itemByName("Brand bar - Wordmark");
        if (leftoverWordmark && leftoverWordmark.isValid) {
            try { leftoverWordmark.remove(); } catch(e) { Logger.warn("Failed to remove leftover Wordmark: " + e.message); }
        }
    }
    } finally {
        // STRUCTURAL FIX: Proxy Wipe Protocol safely wrapped to prevent disk leaks on crash
        for (var t = 0; t < tempProxies.length; t++) {
            if (tempProxies[t] && tempProxies[t].exists) tempProxies[t].remove();
        }
    }
    
    Logger.endTimer("Inject Footer Graphic", "Items Injected: " + injectedCount);
}

/**
 * Injects page numbers and document title onto the B-Content master pages.
 * @param {Document} doc - The active InDesign document.
 * @param {Object} layoutMetrics - Active layout constraints.
 */
function injectContentMasterFooters(doc, layoutMetrics) {
    Logger.startTimer("Inject Content Master Footers");
    var masters = doc.masterSpreads.everyItem().getElements();
    var contentMaster = null;

    for (var m = 0; m < masters.length; m++) { 
        if (masters[m].isValid && masters[m].namePrefix === "B" && masters[m].baseName === "Content") { contentMaster = masters[m]; break; } 
    }
    
    // Cleanup sweep to remove old footer elements before injecting new ones
    for (var msIdx = 0; msIdx < masters.length; msIdx++) {
        var mItems = masters[msIdx].allPageItems;
        for (var i = mItems.length - 1; i >= 0; i--) {
            var item = mItems[i];
            try {
                if (item.isValid && (item.label === "DynamicContentFooter" || (item.name && item.name.indexOf("Content Footer") === 0))) {
                    if (item.locked) item.locked = false; 
                    Logger.info("Deleting old content footer element: " + item.name); 
                    item.remove(); 
                }
            } catch(e) { Logger.warn("Failed to clean up old content footer: " + e.message); }
        }
    }

    if (!contentMaster) { 
        Logger.info("Content master missing (likely large format). Skipping content footers."); 
        Logger.endTimer("Inject Content Master Footers");
        return; 
    }

    var targetLayer = findLayerFuzzy(doc, ["foreground"]);
    if (!targetLayer || !targetLayer.isValid) targetLayer = doc.layers.item(0);

    var boldCStyle = CacheManager.getCStyle(doc, "Bold");
    var pStyle = CacheManager.getPStyle(doc, "Footer");
    
    var swatchNone = doc.swatches.item("None");
    if (!swatchNone.isValid) swatchNone = doc.swatches.item("[None]");

    var cPages = contentMaster.pages.everyItem().getElements();
    for (var p = 0; p < cPages.length; p++) {
        var targetPage = cPages[p];
        if (!targetPage.isValid) continue;

        var pB = targetPage.bounds;
        var margin = layoutMetrics.margin;
        
        var bottomMm = pB[2] - margin; 
        var topMm = bottomMm - 8;
        var liveW = (pB[3] - margin) - (pB[1] + margin);

        var tfNum = targetPage.textFrames.add(targetLayer, {label: "DynamicContentFooter", name: "Content Footer - Page Number", strokeWeight: 0, fillColor: swatchNone, strokeColor: swatchNone});
        tfNum.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;
        
        var tfTitle = targetPage.textFrames.add(targetLayer, {label: "DynamicContentFooter", name: "Content Footer - Document Title", strokeWeight: 0, fillColor: swatchNone, strokeColor: swatchNone});
        tfTitle.textFramePreferences.verticalJustification = VerticalJustification.BOTTOM_ALIGN;

        var isLeft = (targetPage.side === PageSideOptions.LEFT_HAND);

        if (isLeft) {
            var splitX = (pB[1] + margin) + (liveW * 0.2);
            tfNum.geometricBounds = [topMm + "mm", (pB[1] + margin) + "mm", bottomMm + "mm", (splitX - 5) + "mm"];
            tfTitle.geometricBounds = [topMm + "mm", (splitX + 5) + "mm", bottomMm + "mm", (pB[3] - margin) + "mm"];
            tfNum.contents = SpecialCharacters.AUTO_PAGE_NUMBER;
            tfTitle.contents = "Document Title";
            if (pStyle && pStyle.isValid) { tfNum.texts[0].appliedParagraphStyle = pStyle; tfTitle.texts[0].appliedParagraphStyle = pStyle; }
            tfNum.texts[0].justification = Justification.LEFT_ALIGN;
            tfTitle.texts[0].justification = Justification.RIGHT_ALIGN;
        } else {
            var splitX = (pB[3] - margin) - (liveW * 0.2);
            tfTitle.geometricBounds = [topMm + "mm", (pB[1] + margin) + "mm", bottomMm + "mm", (splitX - 5) + "mm"];
            tfNum.geometricBounds = [topMm + "mm", (splitX + 5) + "mm", bottomMm + "mm", (pB[3] - margin) + "mm"];
            tfTitle.contents = "Document Title";
            tfNum.contents = SpecialCharacters.AUTO_PAGE_NUMBER;
            if (pStyle && pStyle.isValid) { tfTitle.texts[0].appliedParagraphStyle = pStyle; tfNum.texts[0].appliedParagraphStyle = pStyle; }
            tfTitle.texts[0].justification = Justification.LEFT_ALIGN;
            tfNum.texts[0].justification = Justification.RIGHT_ALIGN;
        }

        if (boldCStyle && boldCStyle.isValid) { try { tfNum.texts[0].appliedCharacterStyle = boldCStyle; } catch(e) { Logger.warn("Failed to apply bold style to page number: " + e.message); } }
    }
    Logger.endTimer("Inject Content Master Footers");
}

/**
 * Injects scaled header graphics and optional logo placements onto the Cover master pages.
 * @param {Document} doc - The active InDesign document.
 * @param {Object} layoutMetrics - Active layout constraints.
 * @param {String} customDir - Network path to the asset directory.
 * @param {String} footerFormat - Selected file extension.
 * @param {String} primaryTheme - The active theme name (e.g., "Gum").
 */
function injectHeaderGraphic(doc, layoutMetrics, customDir, footerFormat, primaryTheme) {
    Logger.startTimer("Inject Header Graphic");
    var masters = doc.masterSpreads.everyItem().getElements();
    var coverMaster = null;

    for (var m = 0; m < masters.length; m++) { 
        if (masters[m].isValid && masters[m].namePrefix === "A" && masters[m].baseName === "Cover") { coverMaster = masters[m]; break; } 
    }
    if (!coverMaster) { Logger.warn("Cover master missing for header injection."); return; }

    var targetLayer = findLayerFuzzy(doc, ["master", "cover", "options"]);
    if (!targetLayer || !targetLayer.isValid) targetLayer = doc.layers.item(0);
    
    for (var msIdx = 0; msIdx < masters.length; msIdx++) {
        var mItems = masters[msIdx].allPageItems;
        for (var i = mItems.length - 1; i >= 0; i--) {
            try {
                if (mItems[i].isValid && (mItems[i].label === "DynamicBrandHeader" || (mItems[i].name && (mItems[i].name.indexOf("Header Element") === 0 || mItems[i].name.indexOf("Brand bar") === 0)))) {
                    if (mItems[i].locked) mItems[i].locked = false; mItems[i].remove();
                }
            } catch(e) { Logger.warn("Failed to remove old header element: " + e.message); }
        }
    }

    var baseDir = (customDir && customDir !== "") ? customDir : config.assetTokens.footerDirectory;
    if (baseDir.charAt(baseDir.length - 1) !== '/' && baseDir.charAt(baseDir.length - 1) !== '\\') {
        baseDir += '/';
    }
    
    var extList = [".png", ".jpg", ".eps", ".svg", ".pdf", ".tif"];
    var textureFile = null;
    for (var x = 0; x < extList.length; x++) {
        textureFile = findFuzzyAsset(baseDir, ["texture", "landscape"], null, extList[x], null);
        if (textureFile) break;
    }
    
    var textureProxyFile = null;
    var useTextureProxy = false;
    if (textureFile) {
        Logger.info("Found texture asset for header: " + textureFile.name);
        textureProxyFile = new File(Folder.temp.fsName + "/header_" + textureFile.name);
        try {
            if (textureFile.copy(textureProxyFile)) useTextureProxy = true;
        } catch (e) { Logger.warn("Texture proxy copy failed: " + e.message); }
    }

    var ext = footerFormat || ".svg";
    var fuzzyKeywords = ["header", layoutMetrics.formatStr];
    var headerImgFile = findFuzzyAsset(baseDir, fuzzyKeywords, null, ext);

    try {
    var coverPages = coverMaster.pages.everyItem().getElements();
    for (var p = 0; p < coverPages.length; p++) {
        var targetPage = coverPages[p];
        if (!targetPage.isValid) continue;

        var pB = targetPage.bounds;
        var bleedMm = (layoutMetrics.bleed !== undefined) ? layoutMetrics.bleed : 0;
        var lt = config.designTokens.layout;

        var headerDefs = [
            { name: "Brand bar - Small", baseHeight: config.designTokens.layout.headerHeightMm || 12, visible: true, scaleMethod: "font" },
            { name: "Brand bar - Wordmark Background", baseHeight: config.designTokens.layout.headerHeightMediumMm || 23, visible: false, scaleMethod: "wordmark_inset" },
            { name: "Brand bar - Large", baseHeight: config.designTokens.layout.headerHeightLargeMm || 180, visible: false, scaleMethod: "page" },
            { name: "Brand bar - Full", baseHeight: 0, visible: false, scaleMethod: "page_full" },
            { name: "Brand bar - Bleed", baseHeight: 0, visible: false, scaleMethod: "page_full" }
        ];

        var finalHeaderDefs = headerDefs;
        if (layoutMetrics.brandBars && layoutMetrics.brandBars.constructor === Array) {
            if (layoutMetrics.brandBars.length === 1 && layoutMetrics.brandBars[0] === 'none') {
                finalHeaderDefs = [];
            } else {
                finalHeaderDefs = [];
                for (var i = 0; i < headerDefs.length; i++) {
                    for (var j = 0; j < layoutMetrics.brandBars.length; j++) {
                        if (headerDefs[i].name === layoutMetrics.brandBars[j]) {
                            finalHeaderDefs.push(headerDefs[i]);
                            break;
                        }
                    }
                }
            }
        }

        if (headerImgFile && headerImgFile.exists) {
            var isNone = (layoutMetrics.brandBars && layoutMetrics.brandBars.length === 1 && layoutMetrics.brandBars[0] === 'none');
            if (!isNone) {
                var wordmarkPresent = false;
                for (var i = 0; i < finalHeaderDefs.length; i++) {
                    if (finalHeaderDefs[i].name === "Brand bar - Wordmark Background") {
                        wordmarkPresent = true;
                        break;
                    }
                }
                if (!wordmarkPresent) {
                    for (var i = 0; i < headerDefs.length; i++) {
                        if (headerDefs[i].name === "Brand bar - Wordmark Background") {
                            finalHeaderDefs.push(headerDefs[i]);
                            Logger.info("Forcing inclusion of 'Brand bar - Wordmark Background' because header asset was found.");
                            break;
                        }
                    }
                }
            }
        }
        
        var createdBars = {};
        for (var hIdx = 0; hIdx < finalHeaderDefs.length; hIdx++) {
            var hDef = finalHeaderDefs[hIdx];
            var scaledHeaderHeightMm;
            
            if (hDef.scaleMethod === "page") {
                var pageHeight = Math.abs(pB[2] - pB[0]);
                if (layoutMetrics.formatStr === "A4") {
                    scaledHeaderHeightMm = (hDef.baseHeight / 297) * pageHeight; // Baseline ratio from A4 height (297mm)
                } else {
                    var pageWidth = Math.abs(pB[3] - pB[1]);
                    var orientationStr = (pageWidth > pageHeight) ? "landscape" : "portrait";
                    var exactFooterHeight = (orientationStr === "landscape") ? layoutMetrics.footerHeightLandscape : layoutMetrics.footerHeightPortrait;
                    if (!exactFooterHeight) exactFooterHeight = Math.round(pageHeight * 0.12);
                    scaledHeaderHeightMm = Math.max(30, pageHeight - exactFooterHeight - layoutMetrics.margin);
                }
            } else if (hDef.scaleMethod === "page_full") {
                var pageHeight = Math.abs(pB[2] - pB[0]);
                var pageWidth = Math.abs(pB[3] - pB[1]);
                var orientationStr = (pageWidth > pageHeight) ? "landscape" : "portrait";
                var exactFooterHeight = (orientationStr === "landscape") ? layoutMetrics.footerHeightLandscape : layoutMetrics.footerHeightPortrait;
                if (!exactFooterHeight) exactFooterHeight = Math.round(pageHeight * 0.12);
                scaledHeaderHeightMm = Math.max(30, pageHeight - exactFooterHeight - layoutMetrics.margin);
            } else if (hDef.scaleMethod === "wordmark_inset") {
                var isAboveA3 = Math.max(Math.abs(pB[2] - pB[0]), Math.abs(pB[3] - pB[1])) > 420;
                var coverTopMargin = Math.max(layoutMetrics.margin * (isAboveA3 ? 1 : lt.coverMarginRatio), lt.absoluteMinMarginMm);
                var targetImgH = parseFloat(sysUtils.scaleMm(layoutMetrics.headerImgHeight || 9, layoutMetrics.baseFont, config.typographyMatrix.universalReferencePt));
                var insetLargeMm = parseFloat(sysUtils.scaleMm(lt.spacingBaseMm * 2.0, layoutMetrics.baseFont, config.typographyMatrix.universalReferencePt));
                scaledHeaderHeightMm = coverTopMargin + targetImgH + insetLargeMm;
            } else {
                scaledHeaderHeightMm = parseFloat(sysUtils.scaleMm(hDef.baseHeight, layoutMetrics.baseFont, config.typographyMatrix.universalReferencePt));
            }
            
            Logger.info("Placing " + hDef.name + " on page " + targetPage.name + " bounds: " + pB.join(", ") + ". Scaled Height: " + scaledHeaderHeightMm + "mm");
            
            var rect = targetPage.rectangles.add(targetLayer);
            rect.label = "DynamicBrandHeader";
            rect.name = hDef.name;
            rect.visible = hDef.visible;

            var objStyleGroup = doc.objectStyleGroups.item("Frames - Radius Large");
            if (objStyleGroup.isValid) {
                var objStyle = objStyleGroup.objectStyles.item("Medium - Rounded Bottom Right");
                if (objStyle.isValid) {
                    rect.appliedObjectStyle = objStyle;
                } else {
                    Logger.warn("Object style 'Medium - Rounded Bottom Right' not found.");
                }
            }

            var themeName = primaryTheme || "Blue";
            var gradientName = themeName + " - Gradient";
            var themeGradient = doc.gradients.itemByName(gradientName);
            if (themeGradient.isValid) {
                rect.fillColor = themeGradient;
            } else {
                Logger.info("Gradient '" + gradientName + "' not found. Falling back to default.");
            }

            rect.strokeWeight = 0;
            var swatchNone = doc.swatches.item("None");
            if (!swatchNone.isValid) swatchNone = doc.swatches.item("[None]");
            if (swatchNone.isValid) rect.strokeColor = swatchNone;

            var gBounds = [(pB[0] - bleedMm) + "mm", (pB[1] - bleedMm) + "mm", (pB[0] + scaledHeaderHeightMm) + "mm", (pB[3] - layoutMetrics.margin) + "mm"];
            Logger.info("Applying header geometricBounds: " + gBounds.join(", "));
            rect.geometricBounds = gBounds;
            
            var alignStr = (config.assetTokens && config.assetTokens.textureAlignment) ? config.assetTokens.textureAlignment : "CENTER_ANCHOR";
            if (hDef.name === "Brand bar - Small" && config.assetTokens.textureAlignmentSmall) {
                alignStr = config.assetTokens.textureAlignmentSmall;
            } else if (hDef.name === "Brand bar - Wordmark Background" && config.assetTokens.textureAlignmentMedium) {
                alignStr = config.assetTokens.textureAlignmentMedium;
            }

            var anchorEnum = AnchorPoint.CENTER_ANCHOR;
            if (alignStr === "TOP_LEFT_ANCHOR") anchorEnum = AnchorPoint.TOP_LEFT_ANCHOR;
            else if (alignStr === "TOP_CENTER_ANCHOR") anchorEnum = AnchorPoint.TOP_CENTER_ANCHOR;
            else if (alignStr === "TOP_RIGHT_ANCHOR") anchorEnum = AnchorPoint.TOP_RIGHT_ANCHOR;
            else if (alignStr === "LEFT_CENTER_ANCHOR") anchorEnum = AnchorPoint.LEFT_CENTER_ANCHOR;
            else if (alignStr === "BOTTOM_LEFT_ANCHOR") anchorEnum = AnchorPoint.BOTTOM_LEFT_ANCHOR;
            else if (alignStr === "BOTTOM_CENTER_ANCHOR") anchorEnum = AnchorPoint.BOTTOM_CENTER_ANCHOR;
            else if (alignStr === "BOTTOM_RIGHT_ANCHOR") anchorEnum = AnchorPoint.BOTTOM_RIGHT_ANCHOR;
            else if (alignStr === "RIGHT_CENTER_ANCHOR") anchorEnum = AnchorPoint.RIGHT_CENTER_ANCHOR;

            if (textureFile && textureFile.exists) {
                try {
                    var placeFile = useTextureProxy ? textureProxyFile : textureFile;
                    rect.place(placeFile);
                    rect.frameFittingOptions.fittingAlignment = anchorEnum;
                    rect.fit(FitOptions.FILL_PROPORTIONALLY);
                    Logger.info("Placed and aligned texture in " + hDef.name);
                    
                    var placedGraphic = rect.graphics[0];
                    if (placedGraphic && placedGraphic.isValid && placedGraphic.itemLink && placedGraphic.itemLink.isValid) {
                        try {
                            placedGraphic.itemLink.unlink();
                            Logger.info("Embedded texture graphic in " + hDef.name);
                        } catch (embedErr) {
                            Logger.warn("Failed to embed texture graphic in " + hDef.name + ": " + embedErr.message);
                        }
                    }
                } catch(e) {
                    Logger.warn("Failed to place texture in " + hDef.name + ": " + e.message);
                }
            }

            createdBars[hDef.name] = rect;
        }
        
        var headerImgName;
        
        if (headerImgFile && headerImgFile.exists) {
            headerImgName = headerImgFile.name;
            Logger.info("Found requested header image via hybrid match: " + headerImgName);
            var tempFolder = Folder.temp;
            var proxyFile = new File(tempFolder.fsName + "/" + headerImgName);
            var useProxy = false;
            try {
                if (headerImgFile.copy(proxyFile)) useProxy = true;
            } catch (e) { Logger.warn("Header proxy copy failed: " + e.message); }
            
            try {
            var placeFile = useProxy ? proxyFile : headerImgFile;
            
            var imgRect = targetPage.rectangles.add(targetLayer);
            imgRect.label = "DynamicBrandHeader";
            imgRect.name = "Wordmark";
            imgRect.visible = true;
            
            var swatchNone = doc.swatches.item("None");
            if (!swatchNone.isValid) swatchNone = doc.swatches.item("[None]");
            imgRect.strokeWeight = 0;
            if (swatchNone.isValid) {
                imgRect.fillColor = swatchNone;
                imgRect.strokeColor = swatchNone;
            }
            
            imgRect.geometricBounds = [pB[0] + "mm", pB[1] + "mm", (pB[0] + 10) + "mm", (pB[1] + 10) + "mm"];
            imgRect.place(placeFile);
            imgRect.fit(FitOptions.FRAME_TO_CONTENT);
            
            var igb = imgRect.geometricBounds;
            var intrinsicH = igb[2] - igb[0];
            var intrinsicW = igb[3] - igb[1];
            
            var targetImgH = intrinsicH;
            var targetImgW = intrinsicW;
            
            var isAboveA3 = Math.max(Math.abs(pB[2] - pB[0]), Math.abs(pB[3] - pB[1])) > 420;
            var coverTopMargin = Math.max(layoutMetrics.margin * (isAboveA3 ? 1 : lt.coverMarginRatio), lt.absoluteMinMarginMm);
            var newTop = pB[0] + coverTopMargin;
            var insetLargeMm = parseFloat(sysUtils.scaleMm(lt.spacingBaseMm * 2.0, layoutMetrics.baseFont, config.typographyMatrix.universalReferencePt));
            var newRight = pB[3] - layoutMetrics.margin - insetLargeMm;
            
            var finalBounds = [newTop + "mm", (newRight - targetImgW) + "mm", (newTop + targetImgH) + "mm", newRight + "mm"];
            Logger.info("Applying dynamic header image geometricBounds: " + finalBounds.join(", "));
            imgRect.geometricBounds = finalBounds;
            
            imgRect.fit(FitOptions.PROPORTIONALLY);
            
            var placedGraphic = imgRect.graphics[0];
            if (placedGraphic && placedGraphic.isValid && placedGraphic.itemLink && placedGraphic.itemLink.isValid) {
                try {
                    placedGraphic.itemLink.unlink();
                    Logger.info("Embedded header graphic.");
                } catch (embedErr) {
                    Logger.warn("Failed to embed header graphic: " + embedErr.message);
                }
            }
            } finally {
                if (useProxy && proxyFile && proxyFile.exists) proxyFile.remove();
            }
            
            if (createdBars["Brand bar - Wordmark Background"]) {
                var bgRect = createdBars["Brand bar - Wordmark Background"];
                var dynamicBgHeight = coverTopMargin + targetImgH + insetLargeMm;
                var bgBounds = [(pB[0] - bleedMm) + "mm", (pB[1] - bleedMm) + "mm", (pB[0] + dynamicBgHeight) + "mm", (pB[3] - layoutMetrics.margin) + "mm"];
                bgRect.geometricBounds = bgBounds;
                if (bgRect.graphics.length > 0) {
                    bgRect.fit(FitOptions.FILL_PROPORTIONALLY);
                }
                Logger.info("Updated Brand bar - Wordmark Background dynamic height to: " + dynamicBgHeight + "mm");

                try {
                    bgRect.visible = true;
                    var headerGroup = targetPage.groups.add([bgRect, imgRect]);
                    headerGroup.name = "Brand bar - Wordmark";
                    headerGroup.label = "DynamicBrandHeader";
                    headerGroup.visible = true;
                } catch (groupErr) {
                    Logger.warn("Failed to group Wordmark: " + groupErr.message);
                    imgRect.visible = false;
                }
            }
        } else {
            Logger.info("Header image not found (optional).");
        }
    }
    } finally {
        if (useTextureProxy && textureProxyFile && textureProxyFile.exists) textureProxyFile.remove();
    }

    Logger.endTimer("Inject Header Graphic");
}

/**
 * Generates the complex back cover information block using layered styles.
 * @param {Document} doc - The active InDesign document.
 * @param {Object} layoutMetrics - Active layout constraints.
 * @param {String} customDir - Network path to the asset directory.
 * @param {String} primaryTheme - The active theme name.
 * @param {Boolean} isReverseMode - Whether reverse mode is enabled.
 */
function injectBackCoverElement(doc, layoutMetrics, customDir, primaryTheme, isReverseMode) {
    Logger.startTimer("Inject Back Cover Element");
    var masters = doc.masterSpreads.everyItem().getElements();
    var backMaster = null;

    for (var m = 0; m < masters.length; m++) { 
        if (masters[m].isValid && masters[m].namePrefix === "C" && masters[m].baseName === "Back") { backMaster = masters[m]; break; } 
    }
    if (!backMaster) { Logger.info("Back master missing (likely large format). Skipping back cover injection."); return; }

    var targetLayer = findLayerFuzzy(doc, ["master", "cover", "options"]);
    if (!targetLayer || !targetLayer.isValid) targetLayer = doc.layers.item(0);

    for (var msIdx = 0; msIdx < masters.length; msIdx++) {
        var mItems = masters[msIdx].allPageItems;
        for (var i = mItems.length - 1; i >= 0; i--) {
            try {
                if (mItems[i].isValid && (mItems[i].label === "DynamicBrandBackCover" || (mItems[i].name && mItems[i].name.indexOf("Back Cover") === 0))) {
                    if (mItems[i].locked) mItems[i].locked = false; mItems[i].remove();
                }
            } catch(e) { Logger.warn("Failed to remove old back cover element: " + e.message); }
        }
    }

    var baseDir = (customDir && customDir !== "") ? customDir : config.assetTokens.footerDirectory;
    if (baseDir.charAt(baseDir.length - 1) !== '/' && baseDir.charAt(baseDir.length - 1) !== '\\') {
        baseDir += '/';
    }
    var extList = [".png", ".jpg", ".eps", ".svg", ".pdf", ".tif"];
    var textureFile = null;
    for (var x = 0; x < extList.length; x++) {
        textureFile = findFuzzyAsset(baseDir, ["texture", "landscape"], null, extList[x], null);
        if (textureFile) break;
    }
    
    var textureProxyFile = null;
    var useTextureProxy = false;
    if (textureFile) {
        Logger.info("Found texture asset for back cover: " + textureFile.name);
        textureProxyFile = new File(Folder.temp.fsName + "/backcover_" + textureFile.name);
        try {
            if (textureFile.copy(textureProxyFile)) useTextureProxy = true;
        } catch (e) { Logger.warn("Texture proxy copy failed: " + e.message); }
    }

    var anchorEnum = AnchorPoint.CENTER_ANCHOR;
    var alignStr = (config.assetTokens && config.assetTokens.textureAlignment) ? config.assetTokens.textureAlignment : "CENTER_ANCHOR";
    if (alignStr === "TOP_LEFT_ANCHOR") anchorEnum = AnchorPoint.TOP_LEFT_ANCHOR;
    else if (alignStr === "TOP_CENTER_ANCHOR") anchorEnum = AnchorPoint.TOP_CENTER_ANCHOR;
    else if (alignStr === "TOP_RIGHT_ANCHOR") anchorEnum = AnchorPoint.TOP_RIGHT_ANCHOR;
    else if (alignStr === "LEFT_CENTER_ANCHOR") anchorEnum = AnchorPoint.LEFT_CENTER_ANCHOR;
    else if (alignStr === "BOTTOM_LEFT_ANCHOR") anchorEnum = AnchorPoint.BOTTOM_LEFT_ANCHOR;
    else if (alignStr === "BOTTOM_CENTER_ANCHOR") anchorEnum = AnchorPoint.BOTTOM_CENTER_ANCHOR;
    else if (alignStr === "BOTTOM_RIGHT_ANCHOR") anchorEnum = AnchorPoint.BOTTOM_RIGHT_ANCHOR;
    else if (alignStr === "RIGHT_CENTER_ANCHOR") anchorEnum = AnchorPoint.RIGHT_CENTER_ANCHOR;

    try {
    var backPages = backMaster.pages.everyItem().getElements();
    for (var p = 0; p < backPages.length; p++) {
        var targetPage = backPages[p];
        if (!targetPage.isValid) continue;

        var pB = targetPage.bounds;
        var backCoverBaseHeight = config.designTokens.layout.backCoverHeightMm || 17;
        var scaledHeightMm = parseFloat(sysUtils.scaleMm(backCoverBaseHeight, layoutMetrics.baseFont, config.typographyMatrix.universalReferencePt));
        
        var spaceBase = config.designTokens.layout.spacingBaseMm;
        var ref = config.typographyMatrix.universalReferencePt;
        var topInsetMm = parseFloat(sysUtils.scaleMm(spaceBase * 1.5, layoutMetrics.baseFont, ref));
        var totalHeightMm = scaledHeightMm + topInsetMm;

        Logger.info("Placing back cover element on page " + targetPage.name + " bounds: " + pB.join(", ") + ". Total Height: " + totalHeightMm + "mm");
        
        var bgRect = targetPage.rectangles.add(targetLayer);
        bgRect.label = "DynamicBrandBackCover";
        bgRect.name = "Back Cover Background";
        
        var objStyleGroup = doc.objectStyleGroups.item("Frames - Radius Large");
        if (objStyleGroup.isValid) {
            var objStyle = objStyleGroup.objectStyles.item("Medium - Rounded Top Left");
            if (objStyle.isValid) {
                bgRect.appliedObjectStyle = objStyle;
                Logger.info("Applied object style 'Frames - Radius Large/Medium - Rounded Top Left'");
            } else {
                Logger.warn("Object style 'Medium - Rounded Top Left' not found.");
            }
        } else {
             Logger.info("Object style group 'Frames - Radius Large' not found. Skipping style.");
        }

        var themeName = primaryTheme || "Blue";
        var gradientName = themeName + " - Gradient";
        var themeGradient = doc.gradients.itemByName(gradientName);
        if (themeGradient.isValid) {
            bgRect.fillColor = themeGradient;
            Logger.info("Applied '" + gradientName + "' to back cover fill.");
        } else {
            Logger.info("Gradient '" + gradientName + "' not found. Falling back to default.");
        }

        var swatchNone = doc.swatches.item("None");
        if (!swatchNone.isValid) swatchNone = doc.swatches.item("[None]");
        
        bgRect.strokeWeight = 0;
        if (swatchNone.isValid) bgRect.strokeColor = swatchNone;

        var bleedMm = (layoutMetrics.bleed !== undefined) ? layoutMetrics.bleed : 0;
        var gBounds = [(pB[2] - totalHeightMm) + "mm", (pB[1] + layoutMetrics.margin) + "mm", (pB[2] + bleedMm) + "mm", (pB[3] + bleedMm) + "mm"];
        Logger.info("Applying back cover geometricBounds: " + gBounds.join(", "));
        bgRect.geometricBounds = gBounds;

        if (textureFile && textureFile.exists) {
            try {
                var placeFile = useTextureProxy ? textureProxyFile : textureFile;
                bgRect.place(placeFile);
                bgRect.frameFittingOptions.fittingAlignment = anchorEnum;
                bgRect.fit(FitOptions.FILL_PROPORTIONALLY);
                Logger.info("Placed and aligned texture in Back Cover Background");
                
                var placedGraphic = bgRect.graphics[0];
                if (placedGraphic && placedGraphic.isValid && placedGraphic.itemLink && placedGraphic.itemLink.isValid) {
                    try {
                        placedGraphic.itemLink.unlink();
                        Logger.info("Embedded back cover texture graphic.");
                    } catch (embedErr) {
                        Logger.warn("Failed to embed back cover texture graphic: " + embedErr.message);
                    }
                }
            } catch(e) {
                Logger.warn("Failed to place texture in back cover: " + e.message);
            }
        }

        var tf = targetPage.textFrames.add(targetLayer);
        tf.label = "DynamicBrandBackCover";
        tf.name = "Back Cover Text";
        tf.geometricBounds = gBounds;
        tf.strokeWeight = 0;
        if (swatchNone.isValid) { tf.strokeColor = swatchNone; tf.fillColor = swatchNone; }

        tf.contents = "13 QGOV (137468)\nwww.tmr.qld.gov.au | www.qld.gov.au";
        
        var targetBold = isReverseMode ? "Bold" : "Bold Reverse";
        var boldRevStyle = CacheManager.getCStyle(doc, targetBold);
        if (boldRevStyle && boldRevStyle.isValid) {
            try {
                tf.texts[0].characters.itemByRange(0, 15).appliedCharacterStyle = boldRevStyle;
                Logger.info("Applied '" + targetBold + "' character style to back cover text.");
            } catch(e) {
                Logger.warn("Failed to apply '" + targetBold + "' character style: " + e.message);
            }
        } else {
            Logger.warn("'" + targetBold + "' character style not found.");
        }

        var targetPStyle = isReverseMode ? "Footer" : "Footer Reverse";
        var pStyle = CacheManager.getPStyle(doc, targetPStyle);
        if (!pStyle) pStyle = doc.paragraphStyles.itemByName(targetPStyle);
        if (pStyle && pStyle.isValid) { try { tf.texts[0].appliedParagraphStyle = pStyle; } catch(e) { Logger.warn("Failed to apply paragraph style " + targetPStyle + ": " + e.message); } }

        tf.texts[0].justification = Justification.RIGHT_ALIGN;
        tf.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
        
        var lt = config.designTokens.layout;
        var isAboveA2 = Math.max(Math.abs(pB[2] - pB[0]), Math.abs(pB[3] - pB[1])) > 595;
        var calculatedVerticalMargin = layoutMetrics.margin * (isAboveA2 ? 1 : lt.coverMarginRatio);
        var finalVerticalMargin = Math.max(calculatedVerticalMargin, lt.absoluteMinMarginMm);
        tf.textFramePreferences.insetSpacing = [topInsetMm + "mm", 0, (finalVerticalMargin + bleedMm) + "mm", (layoutMetrics.margin + bleedMm) + "mm"];
    }
    } finally {
        if (useTextureProxy && textureProxyFile && textureProxyFile.exists) textureProxyFile.remove();
    }
    
    Logger.endTimer("Inject Back Cover Element");
}

/**
 * Prints a robust type specimen on the active page containing all generated styles.
 * @param {Document} doc - The active InDesign document.
 * @param {Object} layoutMetrics - Active layout constraints.
 */
function injectStyleSpecimen(doc, layoutMetrics) {
    Logger.startTimer("Inject Style Specimen");
    if (doc.pages.length === 0) return;
    var targetPage = doc.pages[0];
    
    var targetLayer = findLayerFuzzy(doc, ["foreground"]);
    if (!targetLayer || !targetLayer.isValid) targetLayer = doc.layers.item(0);

    // Global sweep to ensure old specimens are deleted even if moved to another page or grouped
    var allItems = doc.allPageItems;
    for (var i = allItems.length - 1; i >= 0; i--) {
        var item = allItems[i];
        try {
            if (item.isValid && (item.label === "DynamicBrandSpecimen" || item.name === "Typography Specimen")) {
                if (item.locked) item.locked = false; item.remove();
            }
        } catch(e) { Logger.warn("Failed to remove old specimen: " + e.message); }
    }

    var pB = targetPage.bounds;
    var m = layoutMetrics.margin;
    
    var h = Math.abs(pB[2] - pB[0]);
    var w = Math.abs(pB[3] - pB[1]);
    var orientationStr = (w > h) ? "landscape" : "portrait";
    var exactFooterHeight = (orientationStr === "landscape") ? layoutMetrics.footerHeightLandscape : layoutMetrics.footerHeightPortrait;
    if (!exactFooterHeight) exactFooterHeight = Math.round(h * 0.12);
    
    var dynamicFooterHeight = 40; // Safe fallback
    var dynamicHeaderHeight = 0;
    var aCoverMaster = doc.masterSpreads.itemByName("A-Cover");
    if (aCoverMaster.isValid) {
        var pItems = aCoverMaster.allPageItems;
        for (var pi = 0; pi < pItems.length; pi++) {
            if (pItems[pi].isValid) {
                if (pItems[pi].label === "DynamicBrandFooter" && pItems[pi].visible && pItems[pi].constructor.name !== "Group") {
                    var fBounds = pItems[pi].geometricBounds;
                    var fHeight = pB[2] - fBounds[0];
                    if (fHeight > dynamicFooterHeight) dynamicFooterHeight = fHeight;
                }
                if (pItems[pi].name === "Brand bar - Wordmark Background") {
                    var hBounds = pItems[pi].geometricBounds;
                    var hHeight = hBounds[2] - pB[0];
                    if (hHeight > dynamicHeaderHeight) dynamicHeaderHeight = hHeight;
                }
            }
        }
    }
    
    var headerHeight = config.designTokens.layout.headerHeightMm;
    var scaledHeader = headerHeight ? parseFloat(sysUtils.scaleMm(headerHeight, layoutMetrics.baseFont, config.typographyMatrix.universalReferencePt)) : 0;
    
    if (dynamicHeaderHeight > scaledHeader) scaledHeader = dynamicHeaderHeight;
    
    var topMm = pB[0] + scaledHeader + m;
    var bottomMm = pB[2] - dynamicFooterHeight - m;
    if (bottomMm <= topMm) bottomMm = topMm + 50;

    var tf = targetPage.textFrames.add(targetLayer);
    tf.label = "DynamicBrandSpecimen";
    tf.name = "Typography Specimen";
    tf.geometricBounds = [topMm + "mm", (pB[1] + m) + "mm", bottomMm + "mm", (pB[3] - m) + "mm"];
    tf.textFramePreferences.verticalJustification = VerticalJustification.TOP_ALIGN;

    var swatchNone = doc.swatches.item("None");
    if (!swatchNone.isValid) swatchNone = doc.swatches.item("[None]");
    tf.strokeWeight = 0;
    if (swatchNone.isValid) {
        tf.fillColor = swatchNone;
        tf.strokeColor = swatchNone;
    }

    var colStyleGroup = doc.objectStyleGroups.item("Text Frame Columns");
    if (colStyleGroup.isValid) {
        var colStyle = colStyleGroup.objectStyles.item("Columns - X-Small");
        var specimenColumns = 3;
        if (w < 110) specimenColumns = 1; else if (w < 200) specimenColumns = 2;
        if (colStyle.isValid) {
            tf.appliedObjectStyle = colStyle;
            tf.textFramePreferences.textColumnCount = specimenColumns;
            Logger.info("Applied 'Columns - X-Small' object style to specimen frame and set to " + specimenColumns + " columns.");
        } else {
            Logger.info("Object style 'Columns - X-Small' not found.");
        }
    } else {
        Logger.info("Object style group 'Text Frame Columns' not found.");
    }

    var stylesToInject = config.specimenStyles || [];

    var contentStr = "";
    for (var s = 0; s < stylesToInject.length; s++) { contentStr += stylesToInject[s].text + "\r"; }
    tf.contents = contentStr;

    for (var s = 0; s < stylesToInject.length; s++) {
        var pStyle = CacheManager.getPStyle(doc, stylesToInject[s].style);
        if (!pStyle) pStyle = doc.paragraphStyles.itemByName(stylesToInject[s].style);
        if (pStyle && pStyle.isValid) { try { tf.paragraphs[s].appliedParagraphStyle = pStyle; } catch(e) { Logger.warn("Failed to apply style " + stylesToInject[s].style + " to specimen: " + e.message); } }
    }

    var ip = tf.insertionPoints.lastItem();
    ip.contents = "\r";
    var table1 = tf.insertionPoints.lastItem().tables.add({headerRowCount: 1, bodyRowCount: 3, columnCount: 3});
    for (var c=0; c<3; c++) table1.rows[0].cells[c].contents = "Column header";
    for (var r=1; r<=3; r++) { for (var c=0; c<3; c++) table1.rows[r].cells[c].contents = "Example"; }
    try {
        var tStyle1 = doc.tableStyles.itemByName("Table - Solid Header");
        if (tStyle1.isValid) { 
            table1.appliedTableStyle = tStyle1; 
            table1.clearTableStyleOverrides(true); 
            table1.cells.everyItem().clearCellStyleOverrides(true);
        }
    } catch(e) { Logger.warn("Failed to apply table style 1: " + e.message); }

    tf.insertionPoints.lastItem().contents = "\r\r";
    var table2 = tf.insertionPoints.lastItem().tables.add({headerRowCount: 1, bodyRowCount: 3, columnCount: 3});
    for (var c=0; c<3; c++) table2.rows[0].cells[c].contents = "Column header";
    for (var r=1; r<=3; r++) { for (var c=0; c<3; c++) table2.rows[r].cells[c].contents = "Example"; }
    try {
        var tStyle2 = doc.tableStyles.itemByName("Table - Clean Header");
        if (tStyle2.isValid) { 
            table2.appliedTableStyle = tStyle2; 
            table2.clearTableStyleOverrides(true); 
            table2.cells.everyItem().clearCellStyleOverrides(true);
        }
    } catch(e) { Logger.warn("Failed to apply table style 2: " + e.message); }

    Logger.endTimer("Inject Style Specimen");
}