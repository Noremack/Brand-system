// System math utilities
var sysUtils = {
    merge: function(base, newProps) { 
        var result = {}; 
        for (var key in base) result[key] = base[key]; 
        for (var k in newProps) result[k] = newProps[k]; 
        return result; 
    },
    scaleMm: function(val, currentPt, referencePt) {
        var scale = currentPt / referencePt;
        return (Math.round((val * scale) * 4) / 4) + "mm";
    },
    calcType: function(scalePower, leadingRatio, basePt, scaleRatio) {
        var size = Math.round(basePt * Math.pow(scaleRatio, scalePower));
        return { pointSize: size + "pt", leading: Math.round(size * leadingRatio) + "pt" };
    }
};