#target "indesign"
#include ".system/lib/Logger.jsx"
#include ".system/lib/CleanupProtocol.jsx"

(function() {
    if (app.documents.length === 0) {
        alert("Please open a document before running the Uninstaller.");
        return;
    }

    var doc = app.activeDocument;
    var confirmMsg = "WARNING: This will completely WIPE all Brand System elements from this document.\n\n" +
                     "- All custom Styles (Text, Object, Table, Cell) will be deleted.\n" +
                     "- All Brand Swatches and Gradients will be deleted.\n" +
                     "- All Headers, Footers, and Cover Graphics will be removed.\n" +
                     "- Brand Master Pages and System Layers will be removed.\n\n" +
                     "Are you sure you want to thoroughly uninstall the Brand System from this document?";
                     
    if (!confirm(confirmMsg)) return;

    app.doScript(function() {
        try {
            // 1. Run the core cleanup sweep (wipes styles, swatches, and master items)
            CleanupProtocol.resetDocument(doc);
            
            // 2. Remove Brand Master Pages completely
            var masters = doc.masterSpreads.everyItem().getElements();
            for (var m = masters.length - 1; m >= 0; m--) {
                var mName = masters[m].namePrefix + "-" + masters[m].baseName;
                if (mName === "A-Cover" || mName === "B-Content" || mName === "C-Back" || mName.indexOf("TEMP-") === 0) {
                    try { masters[m].remove(); } catch(e) {}
                }
            }
            
            // 3. Clean up Layers safely
            var layers = doc.layers.everyItem().getElements();
            for (var l = layers.length - 1; l >= 0; l--) {
                var lName = layers[l].name;
                if (lName === "Background" || lName === "Master: expand for cover options") {
                    try { layers[l].remove(); } catch(e) {}
                } else if (lName === "Foreground") {
                    try { layers[l].name = "Layer 1"; } catch(e) {} // Keep user content but rename layer
                }
            }

            alert("Brand System Uninstalled Successfully!\n\nThe document has been safely stripped of all brand assets, styles, and master pages.");
        } catch (e) {
            alert("An error occurred during uninstallation:\n" + e.message);
        }
    }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Uninstall Brand System");
})();