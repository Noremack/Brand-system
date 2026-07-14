// Performance memory cache
var CacheManager = {
    swatches: {}, pStyles: {}, cStyles: {}, cellStyles: {}, strokeStyles: {}, lists: {},
    
    getSwatch: function(doc, name) {
        if (this.swatches[name]) return this.swatches[name];
        var item = doc.swatches.itemByName(name);
        if (item.isValid) { this.swatches[name] = item; return item; }
        return null;
    },
    getPStyle: function(doc, name) {
        if (this.pStyles[name]) return this.pStyles[name];
        var item = doc.paragraphStyles.itemByName(name);
        if (item.isValid) { this.pStyles[name] = item; return item; }
        var all = doc.allParagraphStyles;
        for (var i = 0; i < all.length; i++) { if (all[i].name === name) { this.pStyles[name] = all[i]; return all[i]; } }
        return null;
    },
    getCStyle: function(doc, name) {
        if (this.cStyles[name]) return this.cStyles[name];
        var item = doc.characterStyles.itemByName(name);
        if (item.isValid) { this.cStyles[name] = item; return item; }
        var all = doc.allCharacterStyles;
        for (var i = 0; i < all.length; i++) { if (all[i].name === name) { this.cStyles[name] = all[i]; return all[i]; } }
        return null;
    },
    getCellStyle: function(doc, name) {
        if (this.cellStyles[name]) return this.cellStyles[name];
        var item = doc.cellStyles.itemByName(name);
        if (item.isValid) { this.cellStyles[name] = item; return item; }
        var all = doc.allCellStyles;
        for (var i = 0; i < all.length; i++) { if (all[i].name === name) { this.cellStyles[name] = all[i]; return all[i]; } }
        return null;
    },
    getStrokeStyle: function(doc, name) {
        if (this.strokeStyles[name]) return this.strokeStyles[name];
        var item = doc.strokeStyles.itemByName(name);
        if (item.isValid) { this.strokeStyles[name] = item; return item; }
        return null;
    },
    getList: function(doc, name) {
        if (this.lists[name]) return this.lists[name];
        var item = doc.numberingLists.itemByName(name);
        if (!item.isValid) { item = doc.numberingLists.add({ name: name }); }
        this.lists[name] = item; return item;
    },
    reset: function() {
        this.swatches = {}; this.pStyles = {}; this.cStyles = {}; 
        this.cellStyles = {}; this.strokeStyles = {}; this.lists = {};
    }
};