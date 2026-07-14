if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k; if (this == null) throw new TypeError('"this" is null or not defined');
        var o = Object(this); var len = o.length >>> 0; if (len === 0) return -1;
        var n = fromIndex | 0; if (n >= len) return -1;
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) { if (k in o && o[k] === searchElement) return k; k++; }
        return -1;
    };
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        if (this == null) throw new TypeError(' this is null or not defined');
        if (typeof callback !== "function") throw new TypeError(callback + ' is not a function');
        var O = Object(this); var len = O.length >>> 0; var T;
        if (arguments.length > 1) T = thisArg;
        var k = 0;
        while (k < len) { var kValue; if (k in O) { kValue = O[k]; callback.call(T, kValue, k, O); } k++; }
    };
}

if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        if (this == null) throw new TypeError(' this is null or not defined');
        if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
        var O = Object(this); var len = O.length >>> 0; var T;
        if (arguments.length > 1) T = thisArg;
        var A = new Array(len); var k = 0;
        while (k < len) { var kValue, mappedValue; if (k in O) { kValue = O[k]; mappedValue = callback.call(T, kValue, k, O); A[k] = mappedValue; } k++; }
        return A;
    };
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function(callback, thisArg) {
        if (this == null) throw new TypeError(' this is null or not defined');
        if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
        var O = Object(this); var len = O.length >>> 0; var res = []; var T;
        if (arguments.length > 1) T = thisArg;
        for (var i = 0; i < len; i++) { if (i in O) { var val = O[i]; if (callback.call(T, val, i, O)) res.push(val); } }
        return res;
    };
}

if (!Object.keys) {
    Object.keys = (function() {
        var hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'), dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'], dontEnumsLength = dontEnums.length;
        return function(obj) { if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) throw new TypeError('Object.keys called on non-object');
            var result = [], prop, i; for (prop in obj) { if (hasOwnProperty.call(obj, prop)) { result.push(prop); } } if (hasDontEnumBug) { for (i = 0; i < dontEnumsLength; i++) { if (hasOwnProperty.call(obj, dontEnums[i])) { result.push(dontEnums[i]); } } } return result; };
    }());
}