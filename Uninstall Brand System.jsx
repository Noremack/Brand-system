#target "indesign"

/**
 * ============================================================================
 * Adobe InDesign Brand System — Complete Document Sanitizer / Uninstaller
 * ============================================================================
 * @file Uninstall Brand System.jsx
 * @package InDesign Brand System — Queensland Government Design System (QGDS)
 * @version 2.4.0
 * @author Queensland Government Publishing & Design Engineering
 * @description Thoroughly purges all Brand System styling artifacts, swatches,
 * vector headers, footers, cover elements, system layers, and master spreads
 * from an active document, restoring it safely to InDesign defaults.
 *
 * Sanitization Protocol:
 * 1. User Safety Confirmation: Displays explicit confirmation dialog warning
 *    the user of destructive cleanup.
 * 2. Atomic Sweep via CleanupProtocol: Wipes paragraph, character, object,
 *    and table styles, detaching overrides and preserving raw text content.
 * 3. Master Spread Purge: Removes brand master pages ("A-Cover", "B-Content",
 *    "C-Back", "TEMP-*").
 * 4. System Layer Normalization: Removes internal system layers ("Background",
 *    "Master: expand for cover options") while safely preserving and renaming
 *    the user content layer ("Foreground" -> "Layer 1").
 * 5. Atomic Undo Safety: Executed within app.doScript() with UndoModes.ENTIRE_SCRIPT,
 *    enabling instant Ctrl+Z reversal if run accidentally.
 *
 * Environment & Compatibility:
 * - Adobe InDesign CS6 through CC 2026+ (ExtendScript ES3 engine)
 * ============================================================================
 */

#include "modules/02-utilities.jsxinc"
#include "modules/08-cleanup-protocol.jsxinc"

(function() {
    // -------------------------------------------------------------------------
    // 1. PRE-FLIGHT VALIDATION & CONFIRMATION
    // -------------------------------------------------------------------------
    if (app.documents.length === 0) {
        alert("Please open an InDesign document before running the Uninstaller.");
        return;
    }

    var doc = app.activeDocument;
    var confirmMsg = "WARNING: This will completely WIPE all Brand System elements from this document.\n\n" +
                     "- All custom Styles (Text, Object, Table, Cell) will be deleted.\n" +
                     "- All Brand Swatches and Gradients will be deleted.\n" +
                     "- All Headers, Footers, and Cover Graphics will be removed.\n" +
                     "- Brand Master Pages and System Layers will be removed.\n\n" +
                     "Are you sure you want to thoroughly uninstall the Brand System from this document?";

    if (!confirm(confirmMsg)) {
        return;
    }

    // -------------------------------------------------------------------------
    // 2. ATOMIC TRANSACTION EXECUTION
    // -------------------------------------------------------------------------
    app.doScript(function() {
        try {
            // Step 1: Run core cleanup protocol (wipes styles, swatches, and master page items)
            CleanupProtocol.resetDocument(doc);

            // Step 2: Remove Brand Master Pages completely
            var masters = doc.masterSpreads.everyItem().getElements();
            for (var m = masters.length - 1; m >= 0; m--) {
                var mName = masters[m].namePrefix + "-" + masters[m].baseName;
                if (mName === "A-Cover" || mName === "B-Content" || mName === "C-Back" || mName.indexOf("TEMP-") === 0) {
                    try {
                        masters[m].remove();
                    } catch (_) {}
                }
            }

            // Step 3: Clean up and normalize System Layers
            var layers = doc.layers.everyItem().getElements();
            for (var l = layers.length - 1; l >= 0; l--) {
                var lName = layers[l].name;
                if (lName === "Background" || lName === "Master: expand for cover options") {
                    try {
                        layers[l].remove();
                    } catch (_) {}
                } else if (lName === "Foreground") {
                    // Retain user content layer but restore default name
                    try {
                        layers[l].name = "Layer 1";
                    } catch (_) {}
                }
            }

            alert("Brand System Uninstalled Successfully!\n\nThe document has been safely stripped of all brand assets, styles, and master pages.");
        } catch (e) {
            alert("An error occurred during uninstallation:\n" + e.message);
        }
    }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Uninstall Brand System");
})();