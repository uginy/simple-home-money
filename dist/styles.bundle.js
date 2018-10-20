webpackJsonp([3,5],{

/***/ 108:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ 154:
/***/ (function(module, exports) {

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ 155:
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};


/***/ }),

/***/ 178:
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		return /msie [6-9]\b/.test(self.navigator.userAgent.toLowerCase());
	}),
	getHeadElement = memoize(function () {
		return document.head || document.getElementsByTagName("head")[0];
	}),
	singletonElement = null,
	singletonCounter = 0,
	styleElementsInsertedAtTop = [];

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	// By default, add <style> tags to the bottom of <head>.
	if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

	var styles = listToStyles(list);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
}

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function insertStyleElement(options, styleElement) {
	var head = getHeadElement();
	var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
	if (options.insertAt === "top") {
		if(!lastStyleElementInsertedAtTop) {
			head.insertBefore(styleElement, head.firstChild);
		} else if(lastStyleElementInsertedAtTop.nextSibling) {
			head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			head.appendChild(styleElement);
		}
		styleElementsInsertedAtTop.push(styleElement);
	} else if (options.insertAt === "bottom") {
		head.appendChild(styleElement);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement(styleElement) {
	styleElement.parentNode.removeChild(styleElement);
	var idx = styleElementsInsertedAtTop.indexOf(styleElement);
	if(idx >= 0) {
		styleElementsInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement(options) {
	var styleElement = document.createElement("style");
	styleElement.type = "text/css";
	insertStyleElement(options, styleElement);
	return styleElement;
}

function createLinkElement(options) {
	var linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	insertStyleElement(options, linkElement);
	return linkElement;
}

function addStyle(obj, options) {
	var styleElement, update, remove;

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement(options));
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement(options);
		update = updateLink.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement(options);
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	if(sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ 25:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap) {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
  var base64 = new Buffer(JSON.stringify(sourceMap)).toString('base64');
  var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

  return '/*# ' + data + ' */';
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(74).Buffer))

/***/ }),

/***/ 372:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(443);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(178)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js??ref--10-2!../node_modules/postcss-loader/index.js??postcss!../node_modules/sass-loader/lib/loader.js??ref--10-4!./styles.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js??ref--10-2!../node_modules/postcss-loader/index.js??postcss!../node_modules/sass-loader/lib/loader.js??ref--10-4!./styles.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 373:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(444);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(178)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js??ref--9-2!../../node_modules/postcss-loader/index.js??postcss!./theme.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js??ref--9-2!../../node_modules/postcss-loader/index.js??postcss!./theme.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 374:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(445);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(178)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js??ref--9-2!../../node_modules/postcss-loader/index.js??postcss!./vendor.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js??ref--9-2!../../node_modules/postcss-loader/index.js??postcss!./vendor.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 41:
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ 443:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(25)(false);
// imports


// module
exports.push([module.i, "/* You can add global styles to this file, and also import other style files */\n", ""]);

// exports


/***/ }),

/***/ 444:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(25)(false);
// imports
exports.push([module.i, "@import url(http://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,800,700,600);", ""]);

// module
exports.push([module.i, "body,html{padding:0;margin:0;height:100%;min-height:100%;font-family:'Open Sans',sans-serif;color:#4f5f6f;overflow-x:hidden}.main-wrapper{width:100%;position:absolute;height:100%;overflow-y:auto;overflow-x:hidden}#ref .color-primary{color:#52bcd3}#ref .chart .color-primary{color:#52bcd3}#ref .chart .color-secondary{color:#7bccdd}.app{position:relative;width:100%;padding-left:230px;min-height:100vh;margin:0 auto;left:0;background-color:#f0f3f6;box-shadow:0 0 3px #ccc;transition:left .3s ease,padding-left .3s ease;overflow:hidden}.app .content{padding:110px 30px 90px 30px;min-height:100vh}@media (min-width:1200px){.app .content{padding:120px 50px 100px 50px}}@media (min-width:992px) and (max-width:1199px){.app .content{padding:110px 30px 90px 30px}}@media (min-width:768px) and (max-width:991px){.app .content{padding:95px 20px 75px 20px}}@media (max-width:767px){.app .content{padding:65px 10px 65px 10px}}@media (max-width:991px){.app{padding-left:0}}@media (max-width:991px){.app.sidebar-open{left:0}}.app.blank{background-color:#667380}.auth{position:absolute;width:100%;height:100%;left:0;background-color:#667380;overflow-x:hidden;overflow-y:auto}.auth-container{width:450px;min-height:330px;position:absolute;top:50%;left:50%;transform:translateY(-50%) translateX(-50%)}.auth-container .auth-header{text-align:center;border-bottom:1px solid #52bcd3}.auth-container .auth-title{color:#97a4b1;padding:20px;line-height:30px;font-size:26px;font-weight:600;margin:0}.auth-container .auth-content{padding:30px 50px;min-height:260px}.auth-container .forgot-btn{line-height:28px}.auth-container .checkbox label{padding:0}.auth-container .checkbox a{vertical-align:text-top}.auth-container .checkbox span{color:#4f5f6f}@media (max-width:767px){.auth-container{width:100%;position:relative;left:0;top:0;transform:inherit;margin:0;margin-bottom:10px}.auth-container .auth-content{padding:30px 25px}}.error-card{width:410px;min-height:330px;margin:60px auto}.error-card .error-title{font-size:150px;line-height:150px;font-weight:700;color:#252932;text-align:center;text-shadow:rgba(61,61,61,.3) .5px .5px,rgba(61,61,61,.2) 1px 1px,rgba(61,61,61,.3) 1.5px 1.5px}.error-card .error-sub-title{font-weight:100;text-align:center}.error-card .error-container{text-align:center;visibility:hidden}.error-card .error-container.visible{visibility:visible}.error-card.global{position:absolute;top:50%;left:50%;transform:translateY(-50%) translateX(-50%);margin:0}.error-card.global .error-title{color:#fff}.error-card.global .error-container,.error-card.global .error-sub-title{color:#fff}@media (min-width:768px) and (max-width:991px){.error-card{width:50%}.error-card.global{position:relative;top:25%;left:0;transform:inherit;margin:40px auto}}@media (max-width:767px){.error-card{width:90%}.error-card.global{position:relative;top:25%;left:0;transform:inherit;margin:40px auto}}.alert{background-image:none}.alert.alert-primary{background-color:#52bcd3;border-color:#52bcd3;color:#fff}.alert.alert-primary hr{border-top-color:#3eb4ce}.alert.alert-primary .alert-link{color:#e6e6e6}.alert.alert-success{background-color:#4bcf99;border-color:#4bcf99;color:#fff}.alert.alert-success hr{border-top-color:#37ca8e}.alert.alert-success .alert-link{color:#e6e6e6}.alert.alert-info{background-color:#76d4f5;border-color:#76d4f5;color:#fff}.alert.alert-info hr{border-top-color:#5ecdf3}.alert.alert-info .alert-link{color:#e6e6e6}.alert.alert-warning{background-color:#fe974b;border-color:#fe974b;color:#fff}.alert.alert-warning hr{border-top-color:#fe8832}.alert.alert-warning .alert-link{color:#e6e6e6}.alert.alert-danger{background-color:#f44;border-color:#f44;color:#fff}.alert.alert-danger hr{border-top-color:#ff2b2b}.alert.alert-danger .alert-link{color:#e6e6e6}.alert.alert-inverse{background-color:#131e26;border-color:#131e26;color:#fff}.alert.alert-inverse hr{border-top-color:#0b1115}.alert.alert-inverse .alert-link{color:#e6e6e6}.animated{animation-duration:.5s;animation-delay:.1s}.btn{background-image:none;border-radius:0;margin-bottom:5px}.btn.btn-primary{color:#fff;background-color:#52bcd3;border-color:#52bcd3}.btn.btn-primary:hover{color:#fff;background-color:#31a7c1;border-color:#2fa0b9}.btn.btn-primary.focus,.btn.btn-primary:focus{color:#fff;background-color:#31a7c1;border-color:#2fa0b9}.btn.btn-primary.active,.btn.btn-primary:active,.open>.btn.btn-primary.dropdown-toggle{color:#fff;background-color:#31a7c1;border-color:#2fa0b9;background-image:none}.btn.btn-primary.active.focus,.btn.btn-primary.active:focus,.btn.btn-primary.active:hover,.btn.btn-primary:active.focus,.btn.btn-primary:active:focus,.btn.btn-primary:active:hover,.open>.btn.btn-primary.dropdown-toggle.focus,.open>.btn.btn-primary.dropdown-toggle:focus,.open>.btn.btn-primary.dropdown-toggle:hover{color:#fff;background-color:#2a8fa4;border-color:#227284}.btn.btn-primary.disabled.focus,.btn.btn-primary.disabled:focus,.btn.btn-primary:disabled.focus,.btn.btn-primary:disabled:focus{background-color:#52bcd3;border-color:#52bcd3}.btn.btn-primary.disabled:hover,.btn.btn-primary:disabled:hover{background-color:#52bcd3;border-color:#52bcd3}.btn.btn-secondary{color:#4f5f6f;background-color:#fff;border-color:#d7dde4}.btn.btn-secondary:hover{color:#4f5f6f;background-color:#e6e6e6;border-color:#b2becb}.btn.btn-secondary.focus,.btn.btn-secondary:focus{color:#4f5f6f;background-color:#e6e6e6;border-color:#b2becb}.btn.btn-secondary.active,.btn.btn-secondary:active,.open>.btn.btn-secondary.dropdown-toggle{color:#4f5f6f;background-color:#e6e6e6;border-color:#b2becb;background-image:none}.btn.btn-secondary.active.focus,.btn.btn-secondary.active:focus,.btn.btn-secondary.active:hover,.btn.btn-secondary:active.focus,.btn.btn-secondary:active:focus,.btn.btn-secondary:active:hover,.open>.btn.btn-secondary.dropdown-toggle.focus,.open>.btn.btn-secondary.dropdown-toggle:focus,.open>.btn.btn-secondary.dropdown-toggle:hover{color:#4f5f6f;background-color:#d4d4d4;border-color:#8b9cb1}.btn.btn-secondary.disabled.focus,.btn.btn-secondary.disabled:focus,.btn.btn-secondary:disabled.focus,.btn.btn-secondary:disabled:focus{background-color:#fff;border-color:#d7dde4}.btn.btn-secondary.disabled:hover,.btn.btn-secondary:disabled:hover{background-color:#fff;border-color:#d7dde4}.btn.btn-success{color:#fff;background-color:#4bcf99;border-color:#4bcf99}.btn.btn-success:hover{color:#fff;background-color:#31b680;border-color:#2eae7a}.btn.btn-success.focus,.btn.btn-success:focus{color:#fff;background-color:#31b680;border-color:#2eae7a}.btn.btn-success.active,.btn.btn-success:active,.open>.btn.btn-success.dropdown-toggle{color:#fff;background-color:#31b680;border-color:#2eae7a;background-image:none}.btn.btn-success.active.focus,.btn.btn-success.active:focus,.btn.btn-success.active:hover,.btn.btn-success:active.focus,.btn.btn-success:active:focus,.btn.btn-success:active:hover,.open>.btn.btn-success.dropdown-toggle.focus,.open>.btn.btn-success.dropdown-toggle:focus,.open>.btn.btn-success.dropdown-toggle:hover{color:#fff;background-color:#299a6c;border-color:#217a55}.btn.btn-success.disabled.focus,.btn.btn-success.disabled:focus,.btn.btn-success:disabled.focus,.btn.btn-success:disabled:focus{background-color:#4bcf99;border-color:#4bcf99}.btn.btn-success.disabled:hover,.btn.btn-success:disabled:hover{background-color:#4bcf99;border-color:#4bcf99}.btn.btn-info{color:#fff;background-color:#76d4f5;border-color:#76d4f5}.btn.btn-info:hover{color:#fff;background-color:#46c5f2;border-color:#3dc2f1}.btn.btn-info.focus,.btn.btn-info:focus{color:#fff;background-color:#46c5f2;border-color:#3dc2f1}.btn.btn-info.active,.btn.btn-info:active,.open>.btn.btn-info.dropdown-toggle{color:#fff;background-color:#46c5f2;border-color:#3dc2f1;background-image:none}.btn.btn-info.active.focus,.btn.btn-info.active:focus,.btn.btn-info.active:hover,.btn.btn-info:active.focus,.btn.btn-info:active:focus,.btn.btn-info:active:hover,.open>.btn.btn-info.dropdown-toggle.focus,.open>.btn.btn-info.dropdown-toggle:focus,.open>.btn.btn-info.dropdown-toggle:hover{color:#fff;background-color:#25bbef;border-color:#10a7db}.btn.btn-info.disabled.focus,.btn.btn-info.disabled:focus,.btn.btn-info:disabled.focus,.btn.btn-info:disabled:focus{background-color:#76d4f5;border-color:#76d4f5}.btn.btn-info.disabled:hover,.btn.btn-info:disabled:hover{background-color:#76d4f5;border-color:#76d4f5}.btn.btn-warning{color:#fff;background-color:#fe974b;border-color:#fe974b}.btn.btn-warning:hover{color:#fff;background-color:#fe7a18;border-color:#fe740e}.btn.btn-warning.focus,.btn.btn-warning:focus{color:#fff;background-color:#fe7a18;border-color:#fe740e}.btn.btn-warning.active,.btn.btn-warning:active,.open>.btn.btn-warning.dropdown-toggle{color:#fff;background-color:#fe7a18;border-color:#fe740e;background-image:none}.btn.btn-warning.active.focus,.btn.btn-warning.active:focus,.btn.btn-warning.active:hover,.btn.btn-warning:active.focus,.btn.btn-warning:active:focus,.btn.btn-warning:active:hover,.open>.btn.btn-warning.dropdown-toggle.focus,.open>.btn.btn-warning.dropdown-toggle:focus,.open>.btn.btn-warning.dropdown-toggle:hover{color:#fff;background-color:#f16701;border-color:#c85601}.btn.btn-warning.disabled.focus,.btn.btn-warning.disabled:focus,.btn.btn-warning:disabled.focus,.btn.btn-warning:disabled:focus{background-color:#fe974b;border-color:#fe974b}.btn.btn-warning.disabled:hover,.btn.btn-warning:disabled:hover{background-color:#fe974b;border-color:#fe974b}.btn.btn-danger{color:#fff;background-color:#f44;border-color:#f44}.btn.btn-danger:hover{color:#fff;background-color:#f11;border-color:#ff0707}.btn.btn-danger.focus,.btn.btn-danger:focus{color:#fff;background-color:#f11;border-color:#ff0707}.btn.btn-danger.active,.btn.btn-danger:active,.open>.btn.btn-danger.dropdown-toggle{color:#fff;background-color:#f11;border-color:#ff0707;background-image:none}.btn.btn-danger.active.focus,.btn.btn-danger.active:focus,.btn.btn-danger.active:hover,.btn.btn-danger:active.focus,.btn.btn-danger:active:focus,.btn.btn-danger:active:hover,.open>.btn.btn-danger.dropdown-toggle.focus,.open>.btn.btn-danger.dropdown-toggle:focus,.open>.btn.btn-danger.dropdown-toggle:hover{color:#fff;background-color:#ec0000;border-color:#c40000}.btn.btn-danger.disabled.focus,.btn.btn-danger.disabled:focus,.btn.btn-danger:disabled.focus,.btn.btn-danger:disabled:focus{background-color:#f44;border-color:#f44}.btn.btn-danger.disabled:hover,.btn.btn-danger:disabled:hover{background-color:#f44;border-color:#f44}.btn.btn-primary-outline{color:#52bcd3;background-image:none;background-color:transparent;border-color:#52bcd3}.btn.btn-primary-outline.active,.btn.btn-primary-outline.focus,.btn.btn-primary-outline:active,.btn.btn-primary-outline:focus,.open>.btn.btn-primary-outline.dropdown-toggle{color:#fff;background-color:#52bcd3;border-color:#52bcd3}.btn.btn-primary-outline:hover{color:#fff;background-color:#52bcd3;border-color:#52bcd3}.btn.btn-primary-outline.disabled.focus,.btn.btn-primary-outline.disabled:focus,.btn.btn-primary-outline:disabled.focus,.btn.btn-primary-outline:disabled:focus{border-color:#a3dbe8}.btn.btn-primary-outline.disabled:hover,.btn.btn-primary-outline:disabled:hover{border-color:#a3dbe8}.btn.btn-secondary-outline{color:#d7dde4;background-image:none;background-color:transparent;border-color:#d7dde4}.btn.btn-secondary-outline.active,.btn.btn-secondary-outline.focus,.btn.btn-secondary-outline:active,.btn.btn-secondary-outline:focus,.open>.btn.btn-secondary-outline.dropdown-toggle{color:#fff;background-color:#d7dde4;border-color:#d7dde4}.btn.btn-secondary-outline:hover{color:#fff;background-color:#d7dde4;border-color:#d7dde4}.btn.btn-secondary-outline.disabled.focus,.btn.btn-secondary-outline.disabled:focus,.btn.btn-secondary-outline:disabled.focus,.btn.btn-secondary-outline:disabled:focus{border-color:#fff}.btn.btn-secondary-outline.disabled:hover,.btn.btn-secondary-outline:disabled:hover{border-color:#fff}.btn.btn-info-outline{color:#76d4f5;background-image:none;background-color:transparent;border-color:#76d4f5}.btn.btn-info-outline.active,.btn.btn-info-outline.focus,.btn.btn-info-outline:active,.btn.btn-info-outline:focus,.open>.btn.btn-info-outline.dropdown-toggle{color:#fff;background-color:#76d4f5;border-color:#76d4f5}.btn.btn-info-outline:hover{color:#fff;background-color:#76d4f5;border-color:#76d4f5}.btn.btn-info-outline.disabled.focus,.btn.btn-info-outline.disabled:focus,.btn.btn-info-outline:disabled.focus,.btn.btn-info-outline:disabled:focus{border-color:#d5f2fc}.btn.btn-info-outline.disabled:hover,.btn.btn-info-outline:disabled:hover{border-color:#d5f2fc}.btn.btn-success-outline{color:#4bcf99;background-image:none;background-color:transparent;border-color:#4bcf99}.btn.btn-success-outline.active,.btn.btn-success-outline.focus,.btn.btn-success-outline:active,.btn.btn-success-outline:focus,.open>.btn.btn-success-outline.dropdown-toggle{color:#fff;background-color:#4bcf99;border-color:#4bcf99}.btn.btn-success-outline:hover{color:#fff;background-color:#4bcf99;border-color:#4bcf99}.btn.btn-success-outline.disabled.focus,.btn.btn-success-outline.disabled:focus,.btn.btn-success-outline:disabled.focus,.btn.btn-success-outline:disabled:focus{border-color:#9ce4c7}.btn.btn-success-outline.disabled:hover,.btn.btn-success-outline:disabled:hover{border-color:#9ce4c7}.btn.btn-warning-outline{color:#fe974b;background-image:none;background-color:transparent;border-color:#fe974b}.btn.btn-warning-outline.active,.btn.btn-warning-outline.focus,.btn.btn-warning-outline:active,.btn.btn-warning-outline:focus,.open>.btn.btn-warning-outline.dropdown-toggle{color:#fff;background-color:#fe974b;border-color:#fe974b}.btn.btn-warning-outline:hover{color:#fff;background-color:#fe974b;border-color:#fe974b}.btn.btn-warning-outline.disabled.focus,.btn.btn-warning-outline.disabled:focus,.btn.btn-warning-outline:disabled.focus,.btn.btn-warning-outline:disabled:focus{border-color:#ffd2b0}.btn.btn-warning-outline.disabled:hover,.btn.btn-warning-outline:disabled:hover{border-color:#ffd2b0}.btn.btn-danger-outline{color:#f44;background-image:none;background-color:transparent;border-color:#f44}.btn.btn-danger-outline.active,.btn.btn-danger-outline.focus,.btn.btn-danger-outline:active,.btn.btn-danger-outline:focus,.open>.btn.btn-danger-outline.dropdown-toggle{color:#fff;background-color:#f44;border-color:#f44}.btn.btn-danger-outline:hover{color:#fff;background-color:#f44;border-color:#f44}.btn.btn-danger-outline.disabled.focus,.btn.btn-danger-outline.disabled:focus,.btn.btn-danger-outline:disabled.focus,.btn.btn-danger-outline:disabled:focus{border-color:#faa}.btn.btn-danger-outline.disabled:hover,.btn.btn-danger-outline:disabled:hover{border-color:#faa}.btn.btn-oval:focus,.btn.btn-pill-left:focus,.btn.btn-pill-right:focus{outline:0;outline-offset:initial}.btn.btn-pill-left{border-top-left-radius:25px;border-bottom-left-radius:25px}.btn.btn-pill-right{border-top-right-radius:25px;border-bottom-right-radius:25px}.btn.btn-oval{border-radius:25px}.btn.btn-link{text-decoration:none}.btn strong{font-weight:600}.btn-group .dropdown-menu>li:last-child a:hover:before{height:0;transform:scaleX(0)}.card{background-color:#fff;box-shadow:1px 1px 5px rgba(126,142,159,.1);margin-bottom:10px;border-radius:0;border:none}.card .card{box-shadow:none}.card .card-header{background-image:none;background-color:#fff;-ms-flex-align:center;align-items:center;display:-ms-flexbox;display:flex;-ms-flex-direction:row;flex-direction:row;padding:0;border-radius:0;min-height:50px;border:none}.card .card-header::after{content:\"\";display:table;clear:both}.card .card-header.bordered{border-bottom:1px solid #d7dde4}.card .card-header.card-header-sm{min-height:40px}.card .card-header>span{vertical-align:middle}.card .card-header .pull-right{margin-left:auto}.card .card-header .header-block{padding:.5rem 15px}@media (min-width:1200px){.card .card-header .header-block{padding:.5rem 20px}}@media (max-width:767px){.card .card-header .header-block{padding:.5rem 10px}}.card .card-header .title{color:#4f5f6f;display:-ms-inline-flexbox;display:inline-flex}.card .card-header .btn{margin:0}.card .card-header .nav-tabs{border-color:transparent;-ms-flex-item-align:stretch;align-self:stretch;display:-ms-flexbox;display:flex;position:relative;top:1px}.card .card-header .nav-tabs .nav-item{margin-left:0;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch}.card .card-header .nav-tabs .nav-item .nav-link{display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-ms-flex-align:center;align-items:center;color:#4f5f6f;opacity:.7;padding-left:10px;padding-right:10px;border-radius:0;font-size:14px;border-top-width:2px;border-bottom:1px solid #d7dde4;text-decoration:none}.card .card-header .nav-tabs .nav-item .nav-link.active{border-top-color:#52bcd3;border-bottom-color:transparent;opacity:1}.card .card-header .nav-tabs .nav-item .nav-link.active:focus,.card .card-header .nav-tabs .nav-item .nav-link.active:hover{opacity:1;background-color:#fff;border-color:#d7dde4 #d7dde4 transparent;border-top-color:#52bcd3}.card .card-header .nav-tabs .nav-item .nav-link:focus,.card .card-header .nav-tabs .nav-item .nav-link:hover{opacity:1;background-color:transparent;border-color:transparent}.card.card-default>.card-header{background-color:#fff;color:inherit}.card.card-primary{border-color:#52bcd3}.card.card-primary>.card-header{background-color:#52bcd3;border-color:#52bcd3}.card.card-success>.card-header{background-color:#4bcf99}.card.card-info>.card-header{background-color:#76d4f5}.card.card-warning>.card-header{background-color:#fe974b}.card.card-danger>.card-header{background-color:#f44}.card.card-inverse>.card-header{background-color:#131e26}.card .card-title-block,.card .title-block{padding-bottom:0;margin-bottom:20px;border:none}.card .card-title-block::after,.card .title-block::after{content:\"\";display:table;clear:both}.card .section{margin-bottom:20px}.card .example,.card .section.demo{margin-bottom:20px}.card-block{padding:15px}.card-block .tab-content{padding:0;border-color:transparent}@media (min-width:1200px){.card-block{padding:20px}}@media (max-width:767px){.card-block{padding:10px}}.card-footer{background-color:#fafafa}.easy-pie-chart{width:50px;height:50px;display:inline-block;background-color:#d7dde4;border-radius:5px}.dropdown-menu{float:left;box-shadow:2px 3px 6px rgba(126,142,159,.1);border:1px solid rgba(126,142,159,.1);border-top-left-radius:0;border-top-right-radius:0}.dropdown-menu .dropdown-item{display:block;padding:0 15px;clear:both;font-weight:400;color:#4f5f6f;white-space:nowrap;transition:none}.dropdown-menu .dropdown-item i{margin-right:2px}.dropdown-menu .dropdown-item:hover{color:#52bcd3!important;background:0 0;background-color:#f5f5f5}.flex-row{display:-ms-flexbox;display:flex;-ms-flex-direction:row;flex-direction:row}.flex-col{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column}.centralize-y{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}input,textarea{outline:0}.form-group .row{margin-left:-10px;margin-right:-10px}.form-group .row [class^=col]{padding-left:10px;padding-right:10px}.form-group.has-error span.has-error{color:#f44;font-size:13px;display:block!important}.form-group.has-error .form-control-feedback{color:#f44}.form-group.has-warning span.has-warning{color:#fe974b;font-size:13px;display:block!important}.form-group.has-warning .form-control-feedback{color:#fe974b}.form-group.has-success span.has-success{color:#4bcf99;font-size:13px;display:block!important}.form-group.has-success .form-control-feedback{color:#4bcf99}.input-group{margin-bottom:10px}.input-group .form-control{padding-left:5px}.input-group span.input-group-addon{font-style:italic;border:none;border-radius:0;border:none;background-color:#d7dde4;transition:background-color ease-in-out 15s,color ease-in-out .15s}.input-group span.input-group-addon.focus{background-color:#52bcd3;color:#fff}.control-label,label{font-weight:600}.form-control.underlined{padding-left:0;padding-right:0;border-radius:0;border:none;border-radius:0;box-shadow:none;border-bottom:1px solid #d7dde4}.form-control.underlined.indented{padding:.375rem .75rem}.form-control.underlined:focus,.has-error .form-control.underlined:focus,.has-success .form-control.underlined:focus,.has-warning .form-control.underlined:focus{border:none;box-shadow:none;border-bottom:1px solid #52bcd3}.has-error .form-control.underlined{box-shadow:none;border-color:#f44}.has-warning .form-control.underlined{box-shadow:none;border-color:#fe974b}.has-success .form-control.underlined{box-shadow:none;border-color:#4bcf99}.form-control.boxed{border-radius:0;box-shadow:none}.form-control.boxed:focus{border:1px solid #52bcd3}.checkbox,.radio{display:none}.checkbox+span,.radio+span{padding:0;padding-right:10px}.checkbox+span:before,.radio+span:before{font-family:FontAwesome;font-size:21px;display:inline-block;vertical-align:middle;letter-spacing:10px;color:#c8d0da}.checkbox:checked+span:before,.radio:checked+span:before{color:#52bcd3}.checkbox:disabled+span:before,.radio:disabled+span:before{opacity:.5;cursor:not-allowed}.checkbox:checked:disabled+span:before,.radio:checked:disabled+span:before{color:#c8d0da}.checkbox+span:before{content:\"\\F0C8\"}.checkbox:checked+span:before{content:\"\\F14A\"}.checkbox.rounded+span:before{content:\"\\F111\"}.checkbox.rounded:checked+span:before{content:\"\\F058\"}.radio+span:before{content:\"\\F111\"}.radio:checked+span:before{content:\"\\F192\"}.radio.squared+span:before{content:\"\\F0C8\"}.radio.squared:checked+span:before{content:\"\\F14A\"}.form-control::-webkit-input-placeholder{font-style:italic;color:#c8d0da}.form-control:-moz-placeholder{font-style:italic;color:#d7dde4}.form-control::-moz-placeholder{font-style:italic;color:#d7dde4}.form-control:-ms-input-placeholder{font-style:italic;color:#d7dde4}.images-container::after{content:\"\";display:table;clear:both}.images-container .image-container{float:left;padding:3px;margin-right:10px;margin-bottom:35px;position:relative;border:1px solid #e6eaee;overflow:hidden}.images-container .image-container.active{border-color:#52bcd3}.images-container .image-container:hover .controls{bottom:0;opacity:1}.images-container .controls{position:absolute;left:0;right:0;opacity:0;bottom:-35px;text-align:center;height:35px;font-size:24px;transition:bottom .2s ease,opacity .2s ease;background-color:#fff}.images-container .controls::after{content:\"\";display:table;clear:both}.images-container .controls .control-btn{display:inline-block;color:#4f5f6f;cursor:pointer;width:35px;height:35px;line-height:35px;text-align:center;opacity:.5;transition:opacity .3s ease}.images-container .controls .control-btn:hover{opacity:1}.images-container .controls .control-btn.move{cursor:move}.images-container .controls .control-btn.star{color:#ffb300}.images-container .controls .control-btn.star i:before{content:\"\\F006\"}.images-container .controls .control-btn.star.active i:before{content:\"\\F005\"}.images-container .controls .control-btn.remove{color:#f44}.images-container .image{background-size:cover;background-position:center;background-repeat:no-repeat;width:130px;height:135px;line-height:135px;text-align:center}.images-container .image-container.main{border-color:#ffb300}.images-container .image-container.new{opacity:.6;transition:opacity .3s ease;border-style:dashed;border:1px #52bcd3 solid;color:#52bcd3}.images-container .image-container.new .image{font-size:2.5rem}.images-container .image-container.new:hover{opacity:1}.item-list{list-style:none;padding:0;margin:0;margin-bottom:0;line-height:1.4rem;display:-ms-flexbox;display:flex;-ms-flex-flow:column nowrap;flex-flow:column nowrap}@media (min-width:992px) and (max-width:1199px){.item-list{font-size:1rem}}@media (min-width:768px) and (max-width:991px){.item-list{font-size:.95rem}}@media (max-width:767px){.item-list{font-size:1.05rem}}.item-list.striped>li{border-bottom:1px solid #e9edf0}.item-list.striped>li:nth-child(2n+1){background-color:#fcfcfd}@media (max-width:767px){.item-list.striped>li:nth-child(2n+1){background-color:#f8f9fb}}.item-list.striped .item-list-footer{border-bottom:none}.item-list .item{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column}.item-list .item-row{display:-ms-flexbox;display:flex;-ms-flex-align:stretch;align-items:stretch;-ms-flex-direction:row;flex-direction:row;-ms-flex-pack:justify;justify-content:space-between;-ms-flex-wrap:wrap;flex-wrap:wrap;min-width:100%}.item-list .item-row.nowrap{-ms-flex-wrap:nowrap;flex-wrap:nowrap}.item-list .item-col{-ms-flex-align:center;align-items:center;display:-ms-flexbox;display:flex;padding:10px 10px 10px 0;-ms-flex-preferred-size:0;flex-basis:0;-ms-flex-positive:3;flex-grow:3;-ms-flex-negative:3;flex-shrink:3;margin-left:auto;margin-right:auto;min-width:0}.item-list .item-col.fixed{-ms-flex-positive:0;flex-grow:0;-ms-flex-negative:0;flex-shrink:0;-ms-flex-preferred-size:auto;flex-basis:auto}.item-list .item-col.pull-left{margin-right:auto}.item-list .item-col.pull-right{margin-left:auto}.item-list .item-col>div{width:100%}.item-list .item-col:last-child{padding-right:0}.item-list .no-overflow{overflow:hidden}.item-list .no-wrap{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.item-list .item-list-header .item-col.item-col-header span{color:#999;font-size:.8rem;font-weight:700!important}.item-list .item-heading{font-size:.9rem;display:none;color:#666;font-weight:700;padding-right:10px}@media (max-width:767px){.item-list .item-heading{display:block}}@media (min-width:544px) and (max-width:767px){.item-list .item-heading{width:100%}}@media (max-width:543px){.item-list .item-heading{width:40%}}.item-list .item-col.item-col-check{-ms-flex-preferred-size:30px;flex-basis:30px}@media (max-width:767px){.item-list .item-col.item-col-check{-ms-flex-order:-8;order:-8}}.item-list .item-check{margin-bottom:0}.item-list .item-check .checkbox+span{padding-right:0}.item-list .item-check .checkbox+span:before{width:20px}.item-list .item-col.item-col-img{display:-ms-flexbox;display:flex;-ms-flex-preferred-size:70px;flex-basis:70px}.item-list .item-col.item-col-img.xs{-ms-flex-preferred-size:40px;flex-basis:40px}.item-list .item-col.item-col-img.sm{-ms-flex-preferred-size:50px;flex-basis:50px}.item-list .item-col.item-col-img.lg{-ms-flex-preferred-size:100px;flex-basis:100px}.item-list .item-col.item-col-img.xl{-ms-flex-preferred-size:120px;flex-basis:120px}.item-list .item-col.item-col-img a{width:100%}.item-list .item-img{-ms-flex-positive:1;flex-grow:1;-ms-flex-item-align:stretch;-ms-grid-row-align:stretch;align-self:stretch;background-color:#efefef;padding-bottom:100%;width:100%;height:0;background-size:cover;background-position:center;background-repeat:no-repeat}@media (max-width:767px){.item-list .item-col.item-col-title{-ms-flex-order:-4;order:-4}}.item-list .item-col.item-col-title a{display:block}.item-list .item-title{margin:0;font-size:inherit;line-height:inherit;font-weight:600}.item-list .item-stats{height:1.4rem}.item-list .item-col.item-col-actions-dropdown{-ms-flex-preferred-size:40px;flex-basis:40px;text-align:center;padding-left:0!important}@media (max-width:767px){.item-list .item-col.item-col-actions-dropdown{-ms-flex-order:-3;order:-3;-ms-flex-preferred-size:40px!important;flex-basis:40px!important;padding-right:10px}}.item-list .item-actions-dropdown{position:relative;font-size:1.1rem}.item-list .item-actions-dropdown.active .item-actions-block{max-width:120px}.item-list .item-actions-dropdown.active .item-actions-toggle-btn{color:#52bcd3}.item-list .item-actions-dropdown.active .item-actions-toggle-btn .active{display:block}.item-list .item-actions-dropdown.active .item-actions-toggle-btn .inactive{display:none}.item-list .item-actions-dropdown .item-actions-toggle-btn{color:#9ba8b5;font-size:1.2rem;cursor:pointer;width:100%;line-height:30px;text-align:center;text-decoration:none}.item-list .item-actions-dropdown .item-actions-toggle-btn .active{display:none}.item-list .item-actions-dropdown .item-actions-block{height:30px;max-width:0;line-height:30px;overflow:hidden;position:absolute;top:0;right:100%;background-color:#d7dde4;border-radius:3px;transition:all .15s ease-in-out}.item-list .item-actions-dropdown .item-actions-block.direction-right{right:auto;left:100%}.item-list .item-actions-dropdown .item-actions-block .item-actions-list{padding:0;list-style:none;white-space:nowrap;padding:0 5px}.item-list .item-actions-dropdown .item-actions-block .item-actions-list li{display:inline-block;padding:0}.item-list .item-actions-dropdown .item-actions-block .item-actions-list a{display:block;padding:0 5px}.item-list .item-actions-dropdown .item-actions-block .item-actions-list a.edit{color:#38424c}.item-list .item-actions-dropdown .item-actions-block .item-actions-list a.check{color:#40b726}.item-list .item-actions-dropdown .item-actions-block .item-actions-list a.remove{color:#db0e1e}.card>.item-list .item>.item-row{padding:0 15px}@media (min-width:1200px){.card>.item-list .item>.item-row{padding:0 20px}}@media (max-width:767px){.card>.item-list .item>.item-row{padding:0 10px}}.logo{display:inline-block;width:45px;height:25px;vertical-align:middle;margin-right:5px;position:relative}.logo .l{width:11px;height:11px;border-radius:50%;background-color:#52bcd3;position:absolute}.logo .l.l1{bottom:0;left:0}.logo .l.l2{width:7px;height:7px;bottom:13px;left:10px}.logo .l.l3{width:7px;height:7px;bottom:4px;left:17px}.logo .l.l4{bottom:13px;left:25px}.logo .l.l5{bottom:0;left:34px}.modal-body.modal-tab-container{padding:0}.modal-body.modal-tab-container .modal-tabs{padding-left:0;margin-bottom:0;list-style:none;background-color:#fff;border-bottom:1px solid #ddd;box-shadow:0 0 2px rgba(0,0,0,.3)}.modal-body.modal-tab-container .modal-tabs .nav-link{padding:10px 20px;border:none}.modal-body.modal-tab-container .modal-tabs .nav-link.active,.modal-body.modal-tab-container .modal-tabs .nav-link:hover{color:#52bcd3;border-bottom:2px solid #52bcd3}.modal-body.modal-tab-container .modal-tabs .nav-link.active{font-weight:600}a:not(.btn){transition:color .13s;text-decoration:none;color:#52bcd3}a:not(.btn):hover{text-decoration:inherit;color:#2c96ad}a:not(.btn):hover:before{transform:scaleX(1)}a:not(.btn):focus{text-decoration:none}span a{vertical-align:text-bottom}[class*=' nav'] li>a,[class^=nav] li>a{display:block}[class*=' nav'] li>a:before,[class^=nav] li>a:before{display:none}.nav.nav-tabs-bordered{border-color:#52bcd3}.nav.nav-tabs-bordered+.tab-content{border-style:solid;border-width:0 1px 1px 1px;border-color:#52bcd3;padding:10px 20px 0}.nav.nav-tabs-bordered .nav-item .nav-link{text-decoration:none}.nav.nav-tabs-bordered .nav-item .nav-link:hover{color:#fff;background-color:#52bcd3;border:1px solid #52bcd3}.nav.nav-tabs-bordered .nav-item .nav-link.active{border-color:#52bcd3;border-bottom-color:transparent}.nav.nav-tabs-bordered .nav-item .nav-link.active:hover{background-color:#fff;color:inherit}.nav.nav-pills+.tab-content{border:0;padding:5px}.nav.nav-pills .nav-item .nav-link{text-decoration:none}.nav.nav-pills .nav-item .nav-link:hover{color:#4f5f6f;background-color:transparent;border:0}.nav.nav-pills .nav-item .nav-link.active{border-color:#52bcd3;border-bottom-color:transparent;background-color:#52bcd3}.nav.nav-pills .nav-item .nav-link.active:hover{background-color:#52bcd3;color:#fff}#nprogress .bar{background:#52bcd3!important}#nprogress .bar .peg{box-shadow:0 0 10px #52bcd3,0 0 5px #52bcd3}#nprogress .spinner{top:25px!important;right:23px!important}#nprogress .spinner .spinner-icon{border-top-color:#52bcd3!important;border-left-color:#52bcd3!important}.pagination{margin-top:0}.pagination .page-item .page-link{color:#52bcd3}.pagination .page-item.active .page-link,.pagination .page-item.active .page-link:focus,.pagination .page-item.active .page-link:hover{color:#fff;border-color:#52bcd3;background-color:#52bcd3}::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-track{border-radius:0}::-webkit-scrollbar-thumb{border-radius:0;background:#3eb4ce}::-webkit-scrollbar-thumb:window-inactive{background:#52bcd3}.table label{margin-bottom:0}.table .checkbox+span{margin-bottom:0}.table .checkbox+span:before{line-height:20px}.row .col{padding-left:.9375rem;padding-right:.9375rem;float:left}.row-sm{margin-left:-10px;margin-right:-10px}.row-sm [class^=col]{padding-left:10px;padding-right:10px}.title-block{padding-bottom:15px;margin-bottom:30px;border-bottom:1px solid #d7dde4}.title-block::after{content:\"\";display:table;clear:both}@media (max-width:767px){.title-block{margin-bottom:20px}}.subtitle-block{padding-bottom:10px;margin-bottom:20px;border-bottom:1px dashed #e0e5ea}.section{display:block;margin-bottom:30px}.section:last-of-type{margin-bottom:0}.box-placeholder{margin-bottom:15px;padding:20px;border:1px dashed #ddd;background:#fafafa;color:#444;cursor:pointer}.underline-animation{position:absolute;top:auto;bottom:1px;left:0;width:100%;height:1px;background-color:#52bcd3;content:'';transition:all .2s;-webkit-backface-visibility:hidden;backface-visibility:hidden;transform:scaleX(0)}.stat-chart{border-radius:50%}.stat{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;margin-right:10px}.stat .value{font-size:20px;line-height:24px;overflow:hidden;text-overflow:ellipsis;font-weight:500}.stat .name{overflow:hidden;text-overflow:ellipsis}.stat.lg .value{font-size:26px;line-height:28px}.stat.lg .name{font-size:16px}.list-icon [class^=col]{cursor:pointer}.list-icon [class^=col] em{font-size:14px;width:40px;vertical-align:middle;margin:0;display:inline-block;text-align:center;transition:all 1s;line-height:30px}.list-icon [class^=col]:hover em{transform:scale(2,2)}.well{background-image:none;background-color:#fff}.jumbotron{background-image:none;background-color:#fff;padding:15px 30px}.jumbotron.jumbotron-fluid{padding-left:0;padding-right:0}.rounded{border-radius:.25rem}.rounded-l{border-radius:.3rem}.rounded-s{border-radius:.2rem}.jqstooltip{height:25px!important;width:auto!important;border-radius:.2rem}.title{font-size:1.45rem;font-weight:600;margin-bottom:0}.title.l{font-size:1.6rem}.title.s{font-size:1.4rem}.card .title{font-size:1.1rem;color:#4f5f6f}.title-description{margin:0;font-size:.9rem;font-weight:400;color:#7e8e9f}.title-description.s{font-size:.8rem}@media (max-width:767px){.title-description{display:none}}.subtitle{font-size:1.2rem;margin:0;color:#7e8e9f}.text-primary{color:#52bcd3}.text-muted{color:#9ba8b5}pre{padding:0;border:none;background:0 0}.flot-chart{display:block;height:225px}.flot-chart .flot-chart-content{width:100%;height:100%}.flot-chart .flot-chart-pie-content{width:225px;height:225px;margin:auto}.dashboard-page #dashboard-downloads-chart,.dashboard-page #dashboard-visits-chart{height:220px}@media (max-width:543px){.dashboard-page .items .card-header{border:none;-ms-flex-wrap:wrap;flex-wrap:wrap}.dashboard-page .items .card-header .header-block{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;width:100%;-ms-flex-pack:justify;justify-content:space-between;border-bottom:1px solid #e9edf0}}.dashboard-page .items .card-header .title{padding-right:0;margin-right:5px}.dashboard-page .items .card-header .search{margin:0;vertical-align:middle;display:-ms-inline-flexbox;display:inline-flex;-ms-flex-direction:row;flex-direction:row;-ms-flex-align:center;align-items:center}@media (max-width:543px){.dashboard-page .items .card-header .search{min-width:50%}}.dashboard-page .items .card-header .search .search-input{border:none;background-color:inherit;color:#c2ccd6;width:100px;transition:color .3s ease}.dashboard-page .items .card-header .search .search-input::-webkit-input-placeholder{transition:color .3s ease;color:#c2ccd6}.dashboard-page .items .card-header .search .search-input:-moz-placeholder{transition:color .3s ease;color:#c2ccd6}.dashboard-page .items .card-header .search .search-input::-moz-placeholder{transition:color .3s ease;color:#c2ccd6}.dashboard-page .items .card-header .search .search-input:-ms-input-placeholder{transition:color .3s ease;color:#c2ccd6}@media (max-width:543px){.dashboard-page .items .card-header .search .search-input{min-width:130px}}.dashboard-page .items .card-header .search .search-input:focus{color:#7e8e9f}.dashboard-page .items .card-header .search .search-input:focus::-webkit-input-placeholder{color:#aab4c0}.dashboard-page .items .card-header .search .search-input:focus:-moz-placeholder{color:#aab4c0}.dashboard-page .items .card-header .search .search-input:focus::-moz-placeholder{color:#aab4c0}.dashboard-page .items .card-header .search .search-input:focus:-ms-input-placeholder{color:#aab4c0}.dashboard-page .items .card-header .search .search-input:focus+.search-icon{color:#7e8e9f}.dashboard-page .items .card-header .search .search-icon{color:#c2ccd6;transition:color .3s ease;-ms-flex-order:-1;order:-1;padding-right:6px}.dashboard-page .items .card-header .pagination{display:inline-block;margin:0}.dashboard-page .items .item-list .item-col-title{-ms-flex-positive:9;flex-grow:9}.dashboard-page .items .item-list .item-col-date{text-align:right}@media (min-width:1200px){.dashboard-page .items .item-list .item-col-date{-ms-flex-positive:4;flex-grow:4}}@media (max-width:767px){.dashboard-page .items .item-list .item-row{padding:0}.dashboard-page .items .item-list .item-col{padding-left:10px;padding-right:10px}.dashboard-page .items .item-list .item-col-img{padding-left:10px;-ms-flex-preferred-size:60px;flex-basis:60px;padding-right:0}.dashboard-page .items .item-list .item-col-stats{text-align:center}}@media (min-width:544px) and (max-width:767px){.dashboard-page .items .item-list .item-col-title{-ms-flex-preferred-size:100%;flex-basis:100%;border-bottom:1px solid #e9edf0}.dashboard-page .items .item-list .item-col:not(.item-col-title):not(.item-col-img){position:relative;padding-top:35px}.dashboard-page .items .item-list .item-heading{position:absolute;height:30px;width:100%;left:0;top:5px;line-height:30px;padding-left:10px;padding-right:10px}}@media (max-width:543px){.dashboard-page .items .item-list .item-col{border-bottom:1px solid #e9edf0}.dashboard-page .items .item-list .item-col-img{-ms-flex-preferred-size:50px;flex-basis:50px;-ms-flex-order:-5;order:-5}.dashboard-page .items .item-list .item-col-title{-ms-flex-preferred-size:calc(100% - 50px);flex-basis:calc(100% - 50px)}.dashboard-page .items .item-list .item-col:not(.item-col-title):not(.item-col-img){-ms-flex-preferred-size:100%;flex-basis:100%;text-align:left}.dashboard-page .items .item-list .item-col:not(.item-col-title):not(.item-col-img) .item-heading{text-align:left}.dashboard-page .items .item-list .item-col-date{border:none}}.dashboard-page .sales-breakdown .dashboard-sales-breakdown-chart{margin:0 auto;max-width:250px;max-height:250px}.dashboard-page #dashboard-sales-map .jqvmap-zoomin,.dashboard-page #dashboard-sales-map .jqvmap-zoomout{background-color:#52bcd3;height:20px;width:20px;line-height:14px}.dashboard-page #dashboard-sales-map .jqvmap-zoomout{top:32px}.dashboard-page .stats .card-block{padding-bottom:0}.dashboard-page .stats .stat-col{margin-bottom:20px;float:left;white-space:nowrap;overflow:hidden}.dashboard-page .stats .stat-icon{color:#52bcd3;display:inline-block;font-size:26px;text-align:center;vertical-align:middle;width:50px}.dashboard-page .stats .stat-chart{margin-right:5px;vertical-align:middle}@media (min-width:1200px){.dashboard-page .stats .stat-chart{margin-right:.6vw}}.dashboard-page .stats .stat{vertical-align:middle}@media (min-width:1200px){.dashboard-page .stats .stat .value{font-size:1.3vw}}@media (min-width:1200px){.dashboard-page .stats .stat .name{font-size:.9vw}}.dashboard-page .stats .stat-progress{height:2px;margin:5px 0;color:#52bcd3}.dashboard-page .stats .stat-progress[value]::-webkit-progress-bar{background-color:#ddd}.dashboard-page .stats .stat-progress[value]::-webkit-progress-value{background-color:#52bcd3}.dashboard-page .stats .stat-progress[value]::-moz-progress-bar{background-color:#ddd}.dashboard-page .tasks{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;-ms-flex-line-pack:stretch;align-content:stretch}.dashboard-page .tasks .title-block .title{-ms-flex-align:center;align-items:center;display:-ms-flexbox;display:flex;-ms-flex-pack:justify;justify-content:space-between}.dashboard-page .tasks label{width:100%;margin-bottom:0}.dashboard-page .tasks label .checkbox:checked+span{text-decoration:line-through}.dashboard-page .tasks label span{display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%}.dashboard-page .tasks .tasks-block{max-height:400px;overflow-y:scroll;overflow-x:hidden;margin:0;margin-right:-5px}.dashboard-page .tasks .item-list .item-col{padding-top:5px;padding-bottom:5px}.items-list-page .title-search-block{position:relative}@media (max-width:767px){.items-list-page .title-block{padding-bottom:10px;margin-bottom:13px}}.items-list-page .title-block .action{display:inline}.items-list-page .title-block .action a{padding:10px 15px}.items-list-page .title-block .action a .icon{margin-right:5px;text-align:center;width:16px}@media (max-width:767px){.items-list-page .title-block .action{display:none}}.items-list-page .items-search{position:absolute;margin-bottom:15px;right:0;top:0}@media (max-width:767px){.items-list-page .items-search{position:static}}.items-list-page .items-search .search-button{margin:0}.items-list-page .item-list .item-col.item-col-check{text-align:left}.items-list-page .item-list .item-col.item-col-img{text-align:left;width:auto;text-align:center;-ms-flex-preferred-size:70px;flex-basis:70px}@media (min-width:544px){.items-list-page .item-list .item-col.item-col-img:not(.item-col-header){height:80px}}.items-list-page .item-list .item-col.item-col-title{text-align:left;margin-left:0!important;margin-right:auto;-ms-flex-preferred-size:0;flex-basis:0;-ms-flex-positive:9;flex-grow:9}.items-list-page .item-list .item-col.item-col-sales{text-align:right;font-weight:600}.items-list-page .item-list .item-col.item-col-stats{text-align:center}.items-list-page .item-list .item-col.item-col-category{text-align:left;font-weight:600}.items-list-page .item-list .item-col.item-col-author{text-align:left;-ms-flex-positive:4.5;flex-grow:4.5}.items-list-page .item-list .item-col.item-col-date{text-align:right}@media (max-width:767px){.items-list-page .card.items{background:0 0;box-shadow:none}.items-list-page .item-list .item{border:none;margin-bottom:10px;background-color:#fff;box-shadow:1px 1px 5px rgba(126,142,159,.1)}.items-list-page .item-list .item-row{padding:0!important}.items-list-page .item-list .item-col.item-col-author{-ms-flex-positive:3;flex-grow:3}}@media (min-width:544px) and (max-width:767px){.items-list-page .item-list .item{background-color:#fff;margin-bottom:10px;box-shadow:1px 1px 5px rgba(126,142,159,.1)}.items-list-page .item-list .item-row{padding:0}.items-list-page .item-list .item-heading{width:100%;display:block;position:absolute;top:0;width:100%;left:0;line-height:40px;padding-left:0}.items-list-page .item-list .item-col.item-col-actions-dropdown,.items-list-page .item-list .item-col.item-col-check,.items-list-page .item-list .item-col.item-col-title{border-bottom:1px solid #d7dde4}.items-list-page .item-list .item-col.item-col-actions-dropdown .item-heading,.items-list-page .item-list .item-col.item-col-check .item-heading,.items-list-page .item-list .item-col.item-col-title .item-heading{display:none}.items-list-page .item-list .item-col.item-col-author,.items-list-page .item-list .item-col.item-col-category,.items-list-page .item-list .item-col.item-col-date,.items-list-page .item-list .item-col.item-col-sales,.items-list-page .item-list .item-col.item-col-stats{padding-top:40px;position:relative}.items-list-page .item-list .item-col.item-col-check{display:none}.items-list-page .item-list .item-col.item-col-title{padding-left:10px;text-align:left;margin-left:0!important;margin-right:auto;-ms-flex-preferred-size:calc(100% - 40px);flex-basis:calc(100% - 40px)}.items-list-page .item-list .item-col.item-col-img{padding-left:10px;-ms-flex-preferred-size:79px;flex-basis:79px}.items-list-page .item-list .item-col.item-col-sales{text-align:left}.items-list-page .item-list .item-col.item-col-stats{text-align:center}.items-list-page .item-list .item-col.item-col-category{text-align:center}.items-list-page .item-list .item-col.item-col-author{text-align:center}.items-list-page .item-list .item-col.item-col-date{padding-right:10px;text-align:right;white-space:nowrap;-ms-flex-preferred-size:100px;flex-basis:100px;-ms-flex-preferred-size:0;flex-basis:0;-ms-flex-positive:3;flex-grow:3}}@media (max-width:543px){.items-list-page .item-list .item{border:none;font-size:.9rem;margin-bottom:10px;background-color:#fff;box-shadow:1px 1px 5px rgba(126,142,159,.1)}.items-list-page .item-list .item .item-col{text-align:right;border-bottom:1px solid #d7dde4;padding-left:10px}.items-list-page .item-list .item .item-col[class^=item-col]{-ms-flex-preferred-size:100%;flex-basis:100%}.items-list-page .item-list .item .item-col.item-col-check{display:none}.items-list-page .item-list .item .item-col.item-col-img .item-img{padding-bottom:65%}.items-list-page .item-list .item .item-col.item-col-title{text-align:left;padding-bottom:0;border:none;-ms-flex-positive:1;flex-grow:1;-ms-flex-preferred-size:0;flex-basis:0}.items-list-page .item-list .item .item-col.item-col-title .item-heading{display:none}.items-list-page .item-list .item .item-col.item-col-title .item-title{font-size:1rem;line-height:1.4rem}.items-list-page .item-list .item .item-col.item-col-actions-dropdown{border:none;padding-bottom:0}.items-list-page .item-list .item .item-col.item-col-sales{text-align:left}.items-list-page .item-list .item .item-col.item-col-stats{text-align:left}.items-list-page .item-list .item .item-col.item-col-category{text-align:left}.items-list-page .item-list .item .item-col.item-col-author{text-align:left}.items-list-page .item-list .item .item-col.item-col-date{text-align:left}}.table-flip-scroll table{width:100%}@media only screen and (max-width:800px){.table-flip-scroll .flip-content:after,.table-flip-scroll .flip-header:after{visibility:hidden;display:block;font-size:0;content:\" \";clear:both;height:0}.table-flip-scroll html .flip-content,.table-flip-scroll html .flip-header{-ms-zoom:1;zoom:1}.table-flip-scroll table{width:100%;border-collapse:collapse;border-spacing:0;display:block;position:relative}.table-flip-scroll td,.table-flip-scroll th{margin:0;vertical-align:top}.table-flip-scroll td:last-child,.table-flip-scroll th:last-child{border-bottom:1px solid #ddd}.table-flip-scroll th{border:0!important;border-right:1px solid #ddd!important;width:auto!important;display:block;text-align:right}.table-flip-scroll td{display:block;text-align:left;border:0!important;border-bottom:1px solid #ddd!important}.table-flip-scroll thead{display:block;float:left}.table-flip-scroll thead tr{display:block}.table-flip-scroll tbody{display:block;width:auto;position:relative;overflow-x:auto;white-space:nowrap}.table-flip-scroll tbody tr{display:inline-block;vertical-align:top;margin-left:-5px;border-left:1px solid #ddd}}.wyswyg{border:1px solid #d7dde4}.wyswyg .ql-container{border-top:1px solid #d7dde4}.wyswyg .toolbar .btn{margin:0}.wyswyg .ql-container{font-size:1rem}.wyswyg .ql-container .ql-editor{min-height:200px}.footer{background-color:#fff;position:absolute;left:230px;right:0;bottom:0;height:50px;display:-ms-flexbox;display:flex;-ms-flex-pack:justify;justify-content:space-between;-ms-flex-align:center;align-items:center}.footer-fixed .footer{position:fixed}.footer .footer-block{vertical-align:middle;margin-left:20px;margin-right:20px}.footer .footer-github-btn{vertical-align:middle}@media (max-width:991px){.footer{left:0}}.footer .author>ul{list-style:none;margin:0;padding:0}.footer .author>ul li{display:inline-block}.footer .author>ul li:after{content:\"|\"}.footer .author>ul li:last-child:after{content:\"\"}@media (max-width:991px){.footer .author>ul li{display:block;text-align:right}.footer .author>ul li:after{content:\"\"}}@media (max-width:991px){.footer .author>ul{display:block}}@media (max-width:767px){.footer .author>ul{display:none}}.modal .modal-content{border-radius:0}.modal .modal-header{background-color:#52bcd3;color:#fff}.modal .modal-footer .btn{margin-bottom:0}.header{background-color:#d7dde4;height:70px;position:absolute;left:230px;right:0;transition:left .3s ease;z-index:10;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}@media (max-width:991px){.header{left:0}}@media (max-width:767px){.header{left:0;height:50px}}.header-fixed .header{position:fixed}.header .header-block{margin-right:15px}@media (max-width:767px){.header .header-block{padding:5px}}.sidebar{background-color:#3a4651;width:230px;padding-bottom:60px;position:absolute;top:0;left:0;bottom:0;transition:left .3s ease;z-index:20}@media (max-width:991px){.sidebar{position:fixed;left:-230px}}.sidebar-fixed .sidebar{position:fixed}.sidebar-open .sidebar{left:0}.sidebar .sidebar-container{position:absolute;top:0;bottom:51px;width:100%;left:0;overflow-y:auto;overflow-x:hidden}.sidebar .sidebar-container::-webkit-scrollbar-track{background-color:#2c353e}.sidebar .nav{font-size:14px}.open .sidebar .nav li a:focus,.sidebar .nav li a:focus{background-color:inherit}.sidebar .nav ul{padding:0;height:0;overflow:hidden}.loaded .sidebar .nav ul{height:auto}.sidebar .nav li.active ul{height:auto}.sidebar .nav li a{color:rgba(255,255,255,.5);text-decoration:none}.sidebar .nav li a:hover,.sidebar .nav li.open a:hover,.sidebar .nav li.open>a{color:#fff;background-color:#2d363f}.sidebar .nav>li>a{padding-top:15px;padding-bottom:15px;padding-left:20px;padding-right:10px}.sidebar .nav>li.active>a,.sidebar .nav>li.active>a:hover{background-color:#52bcd3!important;color:#fff!important}.sidebar .nav>li.open>a{background-color:#333e48}.sidebar .nav>li.open>a i.arrow{transform:rotate(90deg)}.sidebar .nav>li>a i{margin-right:5px;font-size:16px}.sidebar .nav>li>a i.arrow{float:right;font-size:20px;line-height:initial;transition:all .3s ease}.sidebar .nav>li>a i.arrow:before{content:\"\\F105\"!important}.sidebar .nav>li>ul>li a{padding-top:10px;padding-bottom:10px;padding-left:50px;background-color:#333e48}.sidebar .nav>li>ul>li.active a{color:#fff}.sidebar-overlay{position:absolute;display:none;left:200vw;right:0;top:0;bottom:0;z-index:5;opacity:0;transition:opacity .3s ease;z-index:15}@media (max-width:991px){.sidebar-overlay{display:block}}@media (max-width:767px){.sidebar-overlay{background-color:rgba(0,0,0,.7)}}@media (max-width:991px){.sidebar-open .sidebar-overlay{left:0;opacity:1}}#modal-media .modal-body{min-height:250px}#modal-media .modal-tab-content{min-height:300px}#modal-media .images-container{padding:15px;text-align:center}#modal-media .images-container .image-container{margin:0 auto 10px auto;cursor:pointer;transition:all .3s ease;display:inline-block;float:none}#modal-media .images-container .image-container:hover{border-color:rgba(82,188,211,.5)}#modal-media .images-container .image-container.active{border-color:rgba(82,188,211,.5)}#modal-media .upload-container{padding:15px}#modal-media .upload-container .dropzone{position:relative;border:2px dashed #52bcd3;height:270px}#modal-media .upload-container .dropzone .dz-message-block{position:absolute;top:50%;left:50%;transform:translateY(-50%) translateX(-50%)}#modal-media .upload-container .dropzone .dz-message-block .dz-message{margin:0;font-size:24px;color:#52bcd3;width:230px}.header .header-block-buttons{text-align:center;margin-left:auto;margin-right:auto;white-space:nowrap}.header .header-block-buttons .btn.header-btn{background-color:transparent;border:1px solid #64798d;color:#64798d;margin:0 5px}.header .header-block-buttons .btn.header-btn:focus,.header .header-block-buttons .btn.header-btn:hover{border:1px solid #3a4651;color:#3a4651}@media (max-width:767px){.header .header-block-buttons{display:none}}.header .header-block-collapse{padding-right:5px}.header .header-block-collapse .collapse-btn{background:0 0;border:none;box-shadow:none;color:#52bcd3;font-size:24px;line-height:40px;border-radius:0;outline:0;padding:0;padding-left:10px;padding-right:10px;vertical-align:initial}.header .header-block-nav{margin-left:auto;white-space:nowrap}.header .header-block-nav::after{content:\"\";display:table;clear:both}.header .header-block-nav a{text-decoration:none}.header .header-block-nav ul{margin:0;padding:0;list-style:none}.header .header-block-nav>ul{display:table}.header .header-block-nav>ul>li{display:table-cell;position:relative}.header .header-block-nav>ul>li:before{display:block;content:\" \";width:1px;height:24px;top:50%;margin-top:-12px;background-color:#8b9cb1;position:absolute;left:0}.header .header-block-nav>ul>li:first-child:before{display:none}.header .header-block-nav>ul>li>a{padding:0 15px;color:#4f5f6f}.header .header-block-nav>ul>li>a:hover{color:#52bcd3}.header .header-block-nav .dropdown-menu{margin-top:15px}.header .header-block-search{margin-right:auto;padding-left:30px}@media (max-width:767px){.header .header-block-search{padding-left:10px}}@media (min-width:768px) and (max-width:991px){.header .header-block-search{padding-left:20px}}@media (min-width:992px) and (max-width:1199px){.header .header-block-search{padding-left:30px}}@media (min-width:1200px){.header .header-block-search{padding-left:50px}}.header .header-block-search>form{float:right}@media (max-width:767px){.header .header-block-search>form{padding-left:0}}.header .header-block-search .input-container{position:relative;color:#7e8e9f}.header .header-block-search .input-container i{position:absolute;pointer-events:none;display:block;height:40px;line-height:40px;left:0}.header .header-block-search .input-container input{background-color:transparent;border:none;padding-left:25px;height:40px;max-width:150px}@media (max-width:767px){.header .header-block-search .input-container input{max-width:140px}}.header .header-block-search .input-container input:focus+.underline{transform:scaleX(1)}.sidebar-header .brand{color:#fff;text-align:left;padding-left:25px;line-height:70px;font-size:16px}@media (max-width:767px){.sidebar-header .brand{line-height:50px;font-size:16px}}.customize{width:100%;color:rgba(255,255,255,.5);padding:5px 15px;text-align:center}.customize .customize-header{margin-bottom:10px}#customize-menu{position:fixed;bottom:0;left:0;width:230px}@media (max-width:991px){.sidebar-open #customize-menu{left:0}}@media (max-width:991px){#customize-menu{transition:left .3s ease;left:-230px}}#customize-menu>li>a{background-color:#3a4651;border-top:1px solid rgba(45,54,63,.5)}#customize-menu>li.open>a,#customize-menu>li>a:hover{background-color:#2d363f}#customize-menu .customize{width:230px;color:rgba(255,255,255,.5);background-color:#2d363f;text-align:center;padding:10px 15px;border-top:2px solid #52bcd3}#customize-menu .customize .customize-item{margin-bottom:15px}#customize-menu .customize .customize-item .customize-header{margin-bottom:10px}#customize-menu .customize .customize-item label{font-weight:400}#customize-menu .customize .customize-item label.title{font-size:14px}#customize-menu .customize .customize-item .radio+span{padding:0;padding-left:5px}#customize-menu .customize .customize-item .radio+span:before{font-size:17px;color:#546273;cursor:pointer}#customize-menu .customize .customize-item .radio:checked+span:before{color:#52bcd3}#customize-menu .customize .customize-item .customize-colors{list-style:none}#customize-menu .customize .customize-item .customize-colors li{display:inline-block;margin-left:5px;margin-right:5px}#customize-menu .customize .customize-item .customize-colors li .color-item{display:block;height:20px;width:20px;border:1px solid;cursor:pointer}#customize-menu .customize .customize-item .customize-colors li .color-item.color-red{background-color:#fb494d;border-color:#fb494d}#customize-menu .customize .customize-item .customize-colors li .color-item.color-orange{background-color:#fe7a0e;border-color:#fe7a0e}#customize-menu .customize .customize-item .customize-colors li .color-item.color-green{background-color:#8cde33;border-color:#8cde33}#customize-menu .customize .customize-item .customize-colors li .color-item.color-seagreen{background-color:#4bcf99;border-color:#4bcf99}#customize-menu .customize .customize-item .customize-colors li .color-item.color-blue{background-color:#52bcd3;border-color:#52bcd3}#customize-menu .customize .customize-item .customize-colors li .color-item.color-purple{background-color:#7867a7;border-color:#7867a7}#customize-menu .customize .customize-item .customize-colors li .color-item.active{position:relative;font-family:FontAwesome;font-size:17px;line-height:17px}#customize-menu .customize .customize-item .customize-colors li .color-item.active:before{content:\"\\F00C\";position:absolute;top:0;left:0;color:#fff}.header .header-block-nav .notifications{font-size:16px}.header .header-block-nav .notifications a{padding-right:10px}.header .header-block-nav .notifications .counter{font-weight:700;font-size:14px;position:relative;top:-3px;left:-2px}.header .header-block-nav .notifications.new .counter{color:#52bcd3;font-weight:700}@media (max-width:767px){.header .header-block-nav .notifications{position:static}}.header .header-block-nav .notifications-dropdown-menu{white-space:normal;left:auto;right:0;min-width:350px}.header .header-block-nav .notifications-dropdown-menu:before{position:absolute;right:20px;bottom:100%;margin-right:-1px}.header .header-block-nav .notifications-dropdown-menu:after{position:absolute;right:20px;bottom:100%}.header .header-block-nav .notifications-dropdown-menu .notifications-container .notification-item{border-bottom:1px solid rgba(126,142,159,.1);padding:5px}.header .header-block-nav .notifications-dropdown-menu .notifications-container .notification-item:hover{background-color:#f5f5f5}.header .header-block-nav .notifications-dropdown-menu .notifications-container .img-col{display:table-cell;padding:5px}.header .header-block-nav .notifications-dropdown-menu .notifications-container .body-col{padding:5px;display:table-cell}.header .header-block-nav .notifications-dropdown-menu .notifications-container .img{width:40px;height:40px;border-radius:3px;vertical-align:top;display:inline-block;background-size:cover;background-position:center;background-repeat:no-repeat}.header .header-block-nav .notifications-dropdown-menu .notifications-container p{color:#4f5f6f;display:inline-block;line-height:18px;font-size:13px;margin:0;vertical-align:top}.header .header-block-nav .notifications-dropdown-menu .notifications-container p .accent{font-weight:700}.header .header-block-nav .notifications-dropdown-menu footer{text-align:center}.header .header-block-nav .notifications-dropdown-menu footer a{color:#373a3c;transition:none}.header .header-block-nav .notifications-dropdown-menu footer a:hover{background-color:#f5f5f5;color:#52bcd3}@media (max-width:767px){.header .header-block-nav .notifications-dropdown-menu{min-width:100px;width:100%;margin-top:5px}.header .header-block-nav .notifications-dropdown-menu:after,.header .header-block-nav .notifications-dropdown-menu:before{right:107px}}.header .header-block-nav .profile .img{display:inline-block;width:30px;height:30px;line-height:30px;border-radius:4px;background-color:#8b9cb1;color:#fff;text-align:center;margin-right:10px;background-repeat:no-repeat;background-position:center;background-size:cover;vertical-align:middle}.header .header-block-nav .profile .name{display:inline-block;margin-right:9px;font-weight:700}@media (max-width:767px){.header .header-block-nav .profile .name{display:none}}.header .header-block-nav .profile .arrow{color:#52bcd3}.header .header-block-nav .profile-dropdown-menu{left:auto;right:0;min-width:180px;white-space:normal}.header .header-block-nav .profile-dropdown-menu:before{position:absolute;right:10px;bottom:100%;margin-right:-1px}.header .header-block-nav .profile-dropdown-menu:after{position:absolute;right:10px;bottom:100%}.header .header-block-nav .profile-dropdown-menu a{padding:10px 15px}.header .header-block-nav .profile-dropdown-menu a .icon{color:#52bcd3;text-align:center;width:16px}.header .header-block-nav .profile-dropdown-menu a span{display:inline-block;padding-left:5px;text-align:left;color:#7e8e9f}.header .header-block-nav .profile-dropdown-menu .profile-dropdown-menu-icon{padding:0}.header .header-block-nav .profile-dropdown-menu .profile-dropdown-menu-topic{color:#7e8e9f;padding:0}.header .header-block-nav .profile-dropdown-menu .dropdown-divider{margin:0}.header .header-block-nav .profile-dropdown-menu .logout{border-top:1px solid rgba(126,142,159,.1)}@media (max-width:767px){.header .header-block-nav .profile-dropdown-menu{margin-top:8px}}.form-group.has-error .form-help-text{color:#fb494d;font-size:13px}.form-group.has-error .form-control{border-color:#fb494d}.form-group.has-success .form-help-text{color:#8cde33;font-size:13px}.n-progress .progress-bar{float:left;width:0;height:100%;font-size:12px;line-height:20px;color:#211f33;text-align:center;background-color:#337ab7;box-shadow:inset 0 -1px 0 rgba(0,0,0,.15);transition:width .6s ease}.n-progress .progress-bar.success{background-color:#5cb85c}.n-progress .progress-bar.danger{background-color:#f44}.n-progress .progress-bar.warning{background-color:#f0ad4e}.n-progress{height:20px;margin-bottom:20px;overflow:hidden;background-color:#f5f5f5;border-radius:4px;box-shadow:inset 0 1px 2px rgba(0,0,0,.1)}.planning-expenses{margin-right:8px;margin-top:6px}.text-center{text-align:center}a{cursor:pointer}", ""]);

// exports


/***/ }),

/***/ 445:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(25)(false);
// imports


// module
exports.push([module.i, "@charset \"UTF-8\";/*!\r\nAnimate.css - http://daneden.me/animate\r\nLicensed under the MIT license - http://opensource.org/licenses/MIT\r\n\r\nCopyright (c) 2015 Daniel Eden\r\n*/.animated{animation-duration:1s;animation-fill-mode:both}.animated.infinite{animation-iteration-count:infinite}.animated.hinge{animation-duration:2s}.animated.bounceIn,.animated.bounceOut{animation-duration:.75s}.animated.flipOutX,.animated.flipOutY{animation-duration:.75s}@keyframes bounce{100%,20%,53%,80%,from{animation-timing-function:cubic-bezier(.215,.61,.355,1);transform:translate3d(0,0,0)}40%,43%{animation-timing-function:cubic-bezier(.755,.050,.855,.060);transform:translate3d(0,-30px,0)}70%{animation-timing-function:cubic-bezier(.755,.050,.855,.060);transform:translate3d(0,-15px,0)}90%{transform:translate3d(0,-4px,0)}}.bounce{animation-name:bounce;transform-origin:center bottom}@keyframes flash{100%,50%,from{opacity:1}25%,75%{opacity:0}}.flash{animation-name:flash}@keyframes pulse{from{transform:scale3d(1,1,1)}50%{transform:scale3d(1.05,1.05,1.05)}100%{transform:scale3d(1,1,1)}}.pulse{animation-name:pulse}@keyframes rubberBand{from{transform:scale3d(1,1,1)}30%{transform:scale3d(1.25,.75,1)}40%{transform:scale3d(.75,1.25,1)}50%{transform:scale3d(1.15,.85,1)}65%{transform:scale3d(.95,1.05,1)}75%{transform:scale3d(1.05,.95,1)}100%{transform:scale3d(1,1,1)}}.rubberBand{animation-name:rubberBand}@keyframes shake{100%,from{transform:translate3d(0,0,0)}10%,30%,50%,70%,90%{transform:translate3d(-10px,0,0)}20%,40%,60%,80%{transform:translate3d(10px,0,0)}}.shake{animation-name:shake}@keyframes swing{20%{transform:rotate3d(0,0,1,15deg)}40%{transform:rotate3d(0,0,1,-10deg)}60%{transform:rotate3d(0,0,1,5deg)}80%{transform:rotate3d(0,0,1,-5deg)}100%{transform:rotate3d(0,0,1,0deg)}}.swing{transform-origin:top center;animation-name:swing}@keyframes tada{from{transform:scale3d(1,1,1)}10%,20%{transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg)}30%,50%,70%,90%{transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg)}40%,60%,80%{transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg)}100%{transform:scale3d(1,1,1)}}.tada{animation-name:tada}@keyframes wobble{from{transform:none}15%{transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg)}30%{transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg)}45%{transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg)}60%{transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg)}75%{transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg)}100%{transform:none}}.wobble{animation-name:wobble}@keyframes jello{100%,11.1%,from{transform:none}22.2%{transform:skewX(-12.5deg) skewY(-12.5deg)}33.3%{transform:skewX(6.25deg) skewY(6.25deg)}44.4%{transform:skewX(-3.125deg) skewY(-3.125deg)}55.5%{transform:skewX(1.5625deg) skewY(1.5625deg)}66.6%{transform:skewX(-.78125deg) skewY(-.78125deg)}77.7%{transform:skewX(.390625deg) skewY(.390625deg)}88.8%{transform:skewX(-.1953125deg) skewY(-.1953125deg)}}.jello{animation-name:jello;transform-origin:center}@keyframes bounceIn{100%,20%,40%,60%,80%,from{animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;transform:scale3d(.3,.3,.3)}20%{transform:scale3d(1.1,1.1,1.1)}40%{transform:scale3d(.9,.9,.9)}60%{opacity:1;transform:scale3d(1.03,1.03,1.03)}80%{transform:scale3d(.97,.97,.97)}100%{opacity:1;transform:scale3d(1,1,1)}}.bounceIn{animation-name:bounceIn}@keyframes bounceInDown{100%,60%,75%,90%,from{animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;transform:translate3d(0,-3000px,0)}60%{opacity:1;transform:translate3d(0,25px,0)}75%{transform:translate3d(0,-10px,0)}90%{transform:translate3d(0,5px,0)}100%{transform:none}}.bounceInDown{animation-name:bounceInDown}@keyframes bounceInLeft{100%,60%,75%,90%,from{animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;transform:translate3d(-3000px,0,0)}60%{opacity:1;transform:translate3d(25px,0,0)}75%{transform:translate3d(-10px,0,0)}90%{transform:translate3d(5px,0,0)}100%{transform:none}}.bounceInLeft{animation-name:bounceInLeft}@keyframes bounceInRight{100%,60%,75%,90%,from{animation-timing-function:cubic-bezier(.215,.61,.355,1)}from{opacity:0;transform:translate3d(3000px,0,0)}60%{opacity:1;transform:translate3d(-25px,0,0)}75%{transform:translate3d(10px,0,0)}90%{transform:translate3d(-5px,0,0)}100%{transform:none}}.bounceInRight{animation-name:bounceInRight}@keyframes bounceInUp{100%,60%,75%,90%,from{animation-timing-function:cubic-bezier(.215,.61,.355,1)}from{opacity:0;transform:translate3d(0,3000px,0)}60%{opacity:1;transform:translate3d(0,-20px,0)}75%{transform:translate3d(0,10px,0)}90%{transform:translate3d(0,-5px,0)}100%{transform:translate3d(0,0,0)}}.bounceInUp{animation-name:bounceInUp}@keyframes bounceOut{20%{transform:scale3d(.9,.9,.9)}50%,55%{opacity:1;transform:scale3d(1.1,1.1,1.1)}100%{opacity:0;transform:scale3d(.3,.3,.3)}}.bounceOut{animation-name:bounceOut}@keyframes bounceOutDown{20%{transform:translate3d(0,10px,0)}40%,45%{opacity:1;transform:translate3d(0,-20px,0)}100%{opacity:0;transform:translate3d(0,2000px,0)}}.bounceOutDown{animation-name:bounceOutDown}@keyframes bounceOutLeft{20%{opacity:1;transform:translate3d(20px,0,0)}100%{opacity:0;transform:translate3d(-2000px,0,0)}}.bounceOutLeft{animation-name:bounceOutLeft}@keyframes bounceOutRight{20%{opacity:1;transform:translate3d(-20px,0,0)}100%{opacity:0;transform:translate3d(2000px,0,0)}}.bounceOutRight{animation-name:bounceOutRight}@keyframes bounceOutUp{20%{transform:translate3d(0,-10px,0)}40%,45%{opacity:1;transform:translate3d(0,20px,0)}100%{opacity:0;transform:translate3d(0,-2000px,0)}}.bounceOutUp{animation-name:bounceOutUp}@keyframes fadeIn{from{opacity:0}100%{opacity:1}}.fadeIn{animation-name:fadeIn}@keyframes fadeInDown{from{opacity:0;transform:translate3d(0,-100%,0)}100%{opacity:1;transform:none}}.fadeInDown{animation-name:fadeInDown}@keyframes fadeInDownBig{from{opacity:0;transform:translate3d(0,-2000px,0)}100%{opacity:1;transform:none}}.fadeInDownBig{animation-name:fadeInDownBig}@keyframes fadeInLeft{from{opacity:0;transform:translate3d(-100%,0,0)}100%{opacity:1;transform:none}}.fadeInLeft{animation-name:fadeInLeft}@keyframes fadeInLeftBig{from{opacity:0;transform:translate3d(-2000px,0,0)}100%{opacity:1;transform:none}}.fadeInLeftBig{animation-name:fadeInLeftBig}@keyframes fadeInRight{from{opacity:0;transform:translate3d(100%,0,0)}100%{opacity:1;transform:none}}.fadeInRight{animation-name:fadeInRight}@keyframes fadeInRightBig{from{opacity:0;transform:translate3d(2000px,0,0)}100%{opacity:1;transform:none}}.fadeInRightBig{animation-name:fadeInRightBig}@keyframes fadeInUp{from{opacity:0;transform:translate3d(0,100%,0)}100%{opacity:1;transform:none}}.fadeInUp{animation-name:fadeInUp}@keyframes fadeInUpBig{from{opacity:0;transform:translate3d(0,2000px,0)}100%{opacity:1;transform:none}}.fadeInUpBig{animation-name:fadeInUpBig}@keyframes fadeOut{from{opacity:1}100%{opacity:0}}.fadeOut{animation-name:fadeOut}@keyframes fadeOutDown{from{opacity:1}100%{opacity:0;transform:translate3d(0,100%,0)}}.fadeOutDown{animation-name:fadeOutDown}@keyframes fadeOutDownBig{from{opacity:1}100%{opacity:0;transform:translate3d(0,2000px,0)}}.fadeOutDownBig{animation-name:fadeOutDownBig}@keyframes fadeOutLeft{from{opacity:1}100%{opacity:0;transform:translate3d(-100%,0,0)}}.fadeOutLeft{animation-name:fadeOutLeft}@keyframes fadeOutLeftBig{from{opacity:1}100%{opacity:0;transform:translate3d(-2000px,0,0)}}.fadeOutLeftBig{animation-name:fadeOutLeftBig}@keyframes fadeOutRight{from{opacity:1}100%{opacity:0;transform:translate3d(100%,0,0)}}.fadeOutRight{animation-name:fadeOutRight}@keyframes fadeOutRightBig{from{opacity:1}100%{opacity:0;transform:translate3d(2000px,0,0)}}.fadeOutRightBig{animation-name:fadeOutRightBig}@keyframes fadeOutUp{from{opacity:1}100%{opacity:0;transform:translate3d(0,-100%,0)}}.fadeOutUp{animation-name:fadeOutUp}@keyframes fadeOutUpBig{from{opacity:1}100%{opacity:0;transform:translate3d(0,-2000px,0)}}.fadeOutUpBig{animation-name:fadeOutUpBig}@keyframes flip{from{transform:perspective(400px) rotate3d(0,1,0,-360deg);animation-timing-function:ease-out}40%{transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);animation-timing-function:ease-out}50%{transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);animation-timing-function:ease-in}80%{transform:perspective(400px) scale3d(.95,.95,.95);animation-timing-function:ease-in}100%{transform:perspective(400px);animation-timing-function:ease-in}}.animated.flip{-webkit-backface-visibility:visible;backface-visibility:visible;animation-name:flip}@keyframes flipInX{from{transform:perspective(400px) rotate3d(1,0,0,90deg);animation-timing-function:ease-in;opacity:0}40%{transform:perspective(400px) rotate3d(1,0,0,-20deg);animation-timing-function:ease-in}60%{transform:perspective(400px) rotate3d(1,0,0,10deg);opacity:1}80%{transform:perspective(400px) rotate3d(1,0,0,-5deg)}100%{transform:perspective(400px)}}.flipInX{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;animation-name:flipInX}@keyframes flipInY{from{transform:perspective(400px) rotate3d(0,1,0,90deg);animation-timing-function:ease-in;opacity:0}40%{transform:perspective(400px) rotate3d(0,1,0,-20deg);animation-timing-function:ease-in}60%{transform:perspective(400px) rotate3d(0,1,0,10deg);opacity:1}80%{transform:perspective(400px) rotate3d(0,1,0,-5deg)}100%{transform:perspective(400px)}}.flipInY{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;animation-name:flipInY}@keyframes flipOutX{from{transform:perspective(400px)}30%{transform:perspective(400px) rotate3d(1,0,0,-20deg);opacity:1}100%{transform:perspective(400px) rotate3d(1,0,0,90deg);opacity:0}}.flipOutX{animation-name:flipOutX;-webkit-backface-visibility:visible!important;backface-visibility:visible!important}@keyframes flipOutY{from{transform:perspective(400px)}30%{transform:perspective(400px) rotate3d(0,1,0,-15deg);opacity:1}100%{transform:perspective(400px) rotate3d(0,1,0,90deg);opacity:0}}.flipOutY{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;animation-name:flipOutY}@keyframes lightSpeedIn{from{transform:translate3d(100%,0,0) skewX(-30deg);opacity:0}60%{transform:skewX(20deg);opacity:1}80%{transform:skewX(-5deg);opacity:1}100%{transform:none;opacity:1}}.lightSpeedIn{animation-name:lightSpeedIn;animation-timing-function:ease-out}@keyframes lightSpeedOut{from{opacity:1}100%{transform:translate3d(100%,0,0) skewX(30deg);opacity:0}}.lightSpeedOut{animation-name:lightSpeedOut;animation-timing-function:ease-in}@keyframes rotateIn{from{transform-origin:center;transform:rotate3d(0,0,1,-200deg);opacity:0}100%{transform-origin:center;transform:none;opacity:1}}.rotateIn{animation-name:rotateIn}@keyframes rotateInDownLeft{from{transform-origin:left bottom;transform:rotate3d(0,0,1,-45deg);opacity:0}100%{transform-origin:left bottom;transform:none;opacity:1}}.rotateInDownLeft{animation-name:rotateInDownLeft}@keyframes rotateInDownRight{from{transform-origin:right bottom;transform:rotate3d(0,0,1,45deg);opacity:0}100%{transform-origin:right bottom;transform:none;opacity:1}}.rotateInDownRight{animation-name:rotateInDownRight}@keyframes rotateInUpLeft{from{transform-origin:left bottom;transform:rotate3d(0,0,1,45deg);opacity:0}100%{transform-origin:left bottom;transform:none;opacity:1}}.rotateInUpLeft{animation-name:rotateInUpLeft}@keyframes rotateInUpRight{from{transform-origin:right bottom;transform:rotate3d(0,0,1,-90deg);opacity:0}100%{transform-origin:right bottom;transform:none;opacity:1}}.rotateInUpRight{animation-name:rotateInUpRight}@keyframes rotateOut{from{transform-origin:center;opacity:1}100%{transform-origin:center;transform:rotate3d(0,0,1,200deg);opacity:0}}.rotateOut{animation-name:rotateOut}@keyframes rotateOutDownLeft{from{transform-origin:left bottom;opacity:1}100%{transform-origin:left bottom;transform:rotate3d(0,0,1,45deg);opacity:0}}.rotateOutDownLeft{animation-name:rotateOutDownLeft}@keyframes rotateOutDownRight{from{transform-origin:right bottom;opacity:1}100%{transform-origin:right bottom;transform:rotate3d(0,0,1,-45deg);opacity:0}}.rotateOutDownRight{animation-name:rotateOutDownRight}@keyframes rotateOutUpLeft{from{transform-origin:left bottom;opacity:1}100%{transform-origin:left bottom;transform:rotate3d(0,0,1,-45deg);opacity:0}}.rotateOutUpLeft{animation-name:rotateOutUpLeft}@keyframes rotateOutUpRight{from{transform-origin:right bottom;opacity:1}100%{transform-origin:right bottom;transform:rotate3d(0,0,1,90deg);opacity:0}}.rotateOutUpRight{animation-name:rotateOutUpRight}@keyframes hinge{0%{transform-origin:top left;animation-timing-function:ease-in-out}20%,60%{transform:rotate3d(0,0,1,80deg);transform-origin:top left;animation-timing-function:ease-in-out}40%,80%{transform:rotate3d(0,0,1,60deg);transform-origin:top left;animation-timing-function:ease-in-out;opacity:1}100%{transform:translate3d(0,700px,0);opacity:0}}.hinge{animation-name:hinge}@keyframes rollIn{from{opacity:0;transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg)}100%{opacity:1;transform:none}}.rollIn{animation-name:rollIn}@keyframes rollOut{from{opacity:1}100%{opacity:0;transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg)}}.rollOut{animation-name:rollOut}@keyframes zoomIn{from{opacity:0;transform:scale3d(.3,.3,.3)}50%{opacity:1}}.zoomIn{animation-name:zoomIn}@keyframes zoomInDown{from{opacity:0;transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(0,60px,0);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInDown{animation-name:zoomInDown}@keyframes zoomInLeft{from{opacity:0;transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(10px,0,0);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInLeft{animation-name:zoomInLeft}@keyframes zoomInRight{from{opacity:0;transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInRight{animation-name:zoomInRight}@keyframes zoomInUp{from{opacity:0;transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInUp{animation-name:zoomInUp}@keyframes zoomOut{from{opacity:1}50%{opacity:0;transform:scale3d(.3,.3,.3)}100%{opacity:0}}.zoomOut{animation-name:zoomOut}@keyframes zoomOutDown{40%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}100%{opacity:0;transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);transform-origin:center bottom;animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomOutDown{animation-name:zoomOutDown}@keyframes zoomOutLeft{40%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(42px,0,0)}100%{opacity:0;transform:scale(.1) translate3d(-2000px,0,0);transform-origin:left center}}.zoomOutLeft{animation-name:zoomOutLeft}@keyframes zoomOutRight{40%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(-42px,0,0)}100%{opacity:0;transform:scale(.1) translate3d(2000px,0,0);transform-origin:right center}}.zoomOutRight{animation-name:zoomOutRight}@keyframes zoomOutUp{40%{opacity:1;transform:scale3d(.475,.475,.475) translate3d(0,60px,0);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}100%{opacity:0;transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);transform-origin:center bottom;animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomOutUp{animation-name:zoomOutUp}@keyframes slideInDown{from{transform:translate3d(0,-100%,0);visibility:visible}100%{transform:translate3d(0,0,0)}}.slideInDown{animation-name:slideInDown}@keyframes slideInLeft{from{transform:translate3d(-100%,0,0);visibility:visible}100%{transform:translate3d(0,0,0)}}.slideInLeft{animation-name:slideInLeft}@keyframes slideInRight{from{transform:translate3d(100%,0,0);visibility:visible}100%{transform:translate3d(0,0,0)}}.slideInRight{animation-name:slideInRight}@keyframes slideInUp{from{transform:translate3d(0,100%,0);visibility:visible}100%{transform:translate3d(0,0,0)}}.slideInUp{animation-name:slideInUp}@keyframes slideOutDown{from{transform:translate3d(0,0,0)}100%{visibility:hidden;transform:translate3d(0,100%,0)}}.slideOutDown{animation-name:slideOutDown}@keyframes slideOutLeft{from{transform:translate3d(0,0,0)}100%{visibility:hidden;transform:translate3d(-100%,0,0)}}.slideOutLeft{animation-name:slideOutLeft}@keyframes slideOutRight{from{transform:translate3d(0,0,0)}100%{visibility:hidden;transform:translate3d(100%,0,0)}}.slideOutRight{animation-name:slideOutRight}@keyframes slideOutUp{from{transform:translate3d(0,0,0)}100%{visibility:hidden;transform:translate3d(0,-100%,0)}}.slideOutUp{animation-name:slideOutUp}/*!\r\n *  Font Awesome 4.3.0 by @davegandy - http://fontawesome.io - @fontawesome\r\n *  License - http://fontawesome.io/license (Font: SIL OFL 1.1, CSS: MIT License)\r\n */@font-face{font-family:FontAwesome;src:url(" + __webpack_require__(674) + ");src:url(" + __webpack_require__(673) + "?#iefix&v=4.3.0) format('embedded-opentype'),url(" + __webpack_require__(960) + ") format('woff2'),url(" + __webpack_require__(961) + ") format('woff'),url(" + __webpack_require__(959) + ") format('truetype'),url(" + __webpack_require__(675) + "#fontawesomeregular) format('svg');font-weight:400;font-style:normal}.fa{display:inline-block;font:normal normal normal 14px/1 FontAwesome;font-size:inherit;text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;transform:translate(0,0)}.fa-lg{font-size:1.33333333em;line-height:.75em;vertical-align:-15%}.fa-2x{font-size:2em}.fa-3x{font-size:3em}.fa-4x{font-size:4em}.fa-5x{font-size:5em}.fa-fw{width:1.28571429em;text-align:center}.fa-ul{padding-left:0;margin-left:2.14285714em;list-style-type:none}.fa-ul>li{position:relative}.fa-li{position:absolute;left:-2.14285714em;width:2.14285714em;top:.14285714em;text-align:center}.fa-li.fa-lg{left:-1.85714286em}.fa-border{padding:.2em .25em .15em;border:solid .08em #eee;border-radius:.1em}.pull-right{float:right}.pull-left{float:left}.fa.pull-left{margin-right:.3em}.fa.pull-right{margin-left:.3em}.fa-spin{animation:fa-spin 2s infinite linear}.fa-pulse{animation:fa-spin 1s infinite steps(8)}@keyframes fa-spin{0%{transform:rotate(0)}100%{transform:rotate(359deg)}}.fa-rotate-90{transform:rotate(90deg)}.fa-rotate-180{transform:rotate(180deg)}.fa-rotate-270{transform:rotate(270deg)}.fa-flip-horizontal{transform:scale(-1,1)}.fa-flip-vertical{transform:scale(1,-1)}:root .fa-flip-horizontal,:root .fa-flip-vertical,:root .fa-rotate-180,:root .fa-rotate-270,:root .fa-rotate-90{filter:none}.fa-stack{position:relative;display:inline-block;width:2em;height:2em;line-height:2em;vertical-align:middle}.fa-stack-1x,.fa-stack-2x{position:absolute;left:0;width:100%;text-align:center}.fa-stack-1x{line-height:inherit}.fa-stack-2x{font-size:2em}.fa-inverse{color:#fff}.fa-glass:before{content:\"\\F000\"}.fa-music:before{content:\"\\F001\"}.fa-search:before{content:\"\\F002\"}.fa-envelope-o:before{content:\"\\F003\"}.fa-heart:before{content:\"\\F004\"}.fa-star:before{content:\"\\F005\"}.fa-star-o:before{content:\"\\F006\"}.fa-user:before{content:\"\\F007\"}.fa-film:before{content:\"\\F008\"}.fa-th-large:before{content:\"\\F009\"}.fa-th:before{content:\"\\F00A\"}.fa-th-list:before{content:\"\\F00B\"}.fa-check:before{content:\"\\F00C\"}.fa-close:before,.fa-remove:before,.fa-times:before{content:\"\\F00D\"}.fa-search-plus:before{content:\"\\F00E\"}.fa-search-minus:before{content:\"\\F010\"}.fa-power-off:before{content:\"\\F011\"}.fa-signal:before{content:\"\\F012\"}.fa-cog:before,.fa-gear:before{content:\"\\F013\"}.fa-trash-o:before{content:\"\\F014\"}.fa-home:before{content:\"\\F015\"}.fa-file-o:before{content:\"\\F016\"}.fa-clock-o:before{content:\"\\F017\"}.fa-road:before{content:\"\\F018\"}.fa-download:before{content:\"\\F019\"}.fa-arrow-circle-o-down:before{content:\"\\F01A\"}.fa-arrow-circle-o-up:before{content:\"\\F01B\"}.fa-inbox:before{content:\"\\F01C\"}.fa-play-circle-o:before{content:\"\\F01D\"}.fa-repeat:before,.fa-rotate-right:before{content:\"\\F01E\"}.fa-refresh:before{content:\"\\F021\"}.fa-list-alt:before{content:\"\\F022\"}.fa-lock:before{content:\"\\F023\"}.fa-flag:before{content:\"\\F024\"}.fa-headphones:before{content:\"\\F025\"}.fa-volume-off:before{content:\"\\F026\"}.fa-volume-down:before{content:\"\\F027\"}.fa-volume-up:before{content:\"\\F028\"}.fa-qrcode:before{content:\"\\F029\"}.fa-barcode:before{content:\"\\F02A\"}.fa-tag:before{content:\"\\F02B\"}.fa-tags:before{content:\"\\F02C\"}.fa-book:before{content:\"\\F02D\"}.fa-bookmark:before{content:\"\\F02E\"}.fa-print:before{content:\"\\F02F\"}.fa-camera:before{content:\"\\F030\"}.fa-font:before{content:\"\\F031\"}.fa-bold:before{content:\"\\F032\"}.fa-italic:before{content:\"\\F033\"}.fa-text-height:before{content:\"\\F034\"}.fa-text-width:before{content:\"\\F035\"}.fa-align-left:before{content:\"\\F036\"}.fa-align-center:before{content:\"\\F037\"}.fa-align-right:before{content:\"\\F038\"}.fa-align-justify:before{content:\"\\F039\"}.fa-list:before{content:\"\\F03A\"}.fa-dedent:before,.fa-outdent:before{content:\"\\F03B\"}.fa-indent:before{content:\"\\F03C\"}.fa-video-camera:before{content:\"\\F03D\"}.fa-image:before,.fa-photo:before,.fa-picture-o:before{content:\"\\F03E\"}.fa-pencil:before{content:\"\\F040\"}.fa-map-marker:before{content:\"\\F041\"}.fa-adjust:before{content:\"\\F042\"}.fa-tint:before{content:\"\\F043\"}.fa-edit:before,.fa-pencil-square-o:before{content:\"\\F044\"}.fa-share-square-o:before{content:\"\\F045\"}.fa-check-square-o:before{content:\"\\F046\"}.fa-arrows:before{content:\"\\F047\"}.fa-step-backward:before{content:\"\\F048\"}.fa-fast-backward:before{content:\"\\F049\"}.fa-backward:before{content:\"\\F04A\"}.fa-play:before{content:\"\\F04B\"}.fa-pause:before{content:\"\\F04C\"}.fa-stop:before{content:\"\\F04D\"}.fa-forward:before{content:\"\\F04E\"}.fa-fast-forward:before{content:\"\\F050\"}.fa-step-forward:before{content:\"\\F051\"}.fa-eject:before{content:\"\\F052\"}.fa-chevron-left:before{content:\"\\F053\"}.fa-chevron-right:before{content:\"\\F054\"}.fa-plus-circle:before{content:\"\\F055\"}.fa-minus-circle:before{content:\"\\F056\"}.fa-times-circle:before{content:\"\\F057\"}.fa-check-circle:before{content:\"\\F058\"}.fa-question-circle:before{content:\"\\F059\"}.fa-info-circle:before{content:\"\\F05A\"}.fa-crosshairs:before{content:\"\\F05B\"}.fa-times-circle-o:before{content:\"\\F05C\"}.fa-check-circle-o:before{content:\"\\F05D\"}.fa-ban:before{content:\"\\F05E\"}.fa-arrow-left:before{content:\"\\F060\"}.fa-arrow-right:before{content:\"\\F061\"}.fa-arrow-up:before{content:\"\\F062\"}.fa-arrow-down:before{content:\"\\F063\"}.fa-mail-forward:before,.fa-share:before{content:\"\\F064\"}.fa-expand:before{content:\"\\F065\"}.fa-compress:before{content:\"\\F066\"}.fa-plus:before{content:\"\\F067\"}.fa-minus:before{content:\"\\F068\"}.fa-asterisk:before{content:\"\\F069\"}.fa-exclamation-circle:before{content:\"\\F06A\"}.fa-gift:before{content:\"\\F06B\"}.fa-leaf:before{content:\"\\F06C\"}.fa-fire:before{content:\"\\F06D\"}.fa-eye:before{content:\"\\F06E\"}.fa-eye-slash:before{content:\"\\F070\"}.fa-exclamation-triangle:before,.fa-warning:before{content:\"\\F071\"}.fa-plane:before{content:\"\\F072\"}.fa-calendar:before{content:\"\\F073\"}.fa-random:before{content:\"\\F074\"}.fa-comment:before{content:\"\\F075\"}.fa-magnet:before{content:\"\\F076\"}.fa-chevron-up:before{content:\"\\F077\"}.fa-chevron-down:before{content:\"\\F078\"}.fa-retweet:before{content:\"\\F079\"}.fa-shopping-cart:before{content:\"\\F07A\"}.fa-folder:before{content:\"\\F07B\"}.fa-folder-open:before{content:\"\\F07C\"}.fa-arrows-v:before{content:\"\\F07D\"}.fa-arrows-h:before{content:\"\\F07E\"}.fa-bar-chart-o:before,.fa-bar-chart:before{content:\"\\F080\"}.fa-twitter-square:before{content:\"\\F081\"}.fa-facebook-square:before{content:\"\\F082\"}.fa-camera-retro:before{content:\"\\F083\"}.fa-key:before{content:\"\\F084\"}.fa-cogs:before,.fa-gears:before{content:\"\\F085\"}.fa-comments:before{content:\"\\F086\"}.fa-thumbs-o-up:before{content:\"\\F087\"}.fa-thumbs-o-down:before{content:\"\\F088\"}.fa-star-half:before{content:\"\\F089\"}.fa-heart-o:before{content:\"\\F08A\"}.fa-sign-out:before{content:\"\\F08B\"}.fa-linkedin-square:before{content:\"\\F08C\"}.fa-thumb-tack:before{content:\"\\F08D\"}.fa-external-link:before{content:\"\\F08E\"}.fa-sign-in:before{content:\"\\F090\"}.fa-trophy:before{content:\"\\F091\"}.fa-github-square:before{content:\"\\F092\"}.fa-upload:before{content:\"\\F093\"}.fa-lemon-o:before{content:\"\\F094\"}.fa-phone:before{content:\"\\F095\"}.fa-square-o:before{content:\"\\F096\"}.fa-bookmark-o:before{content:\"\\F097\"}.fa-phone-square:before{content:\"\\F098\"}.fa-twitter:before{content:\"\\F099\"}.fa-facebook-f:before,.fa-facebook:before{content:\"\\F09A\"}.fa-github:before{content:\"\\F09B\"}.fa-unlock:before{content:\"\\F09C\"}.fa-credit-card:before{content:\"\\F09D\"}.fa-rss:before{content:\"\\F09E\"}.fa-hdd-o:before{content:\"\\F0A0\"}.fa-bullhorn:before{content:\"\\F0A1\"}.fa-bell:before{content:\"\\F0F3\"}.fa-certificate:before{content:\"\\F0A3\"}.fa-hand-o-right:before{content:\"\\F0A4\"}.fa-hand-o-left:before{content:\"\\F0A5\"}.fa-hand-o-up:before{content:\"\\F0A6\"}.fa-hand-o-down:before{content:\"\\F0A7\"}.fa-arrow-circle-left:before{content:\"\\F0A8\"}.fa-arrow-circle-right:before{content:\"\\F0A9\"}.fa-arrow-circle-up:before{content:\"\\F0AA\"}.fa-arrow-circle-down:before{content:\"\\F0AB\"}.fa-globe:before{content:\"\\F0AC\"}.fa-wrench:before{content:\"\\F0AD\"}.fa-tasks:before{content:\"\\F0AE\"}.fa-filter:before{content:\"\\F0B0\"}.fa-briefcase:before{content:\"\\F0B1\"}.fa-arrows-alt:before{content:\"\\F0B2\"}.fa-group:before,.fa-users:before{content:\"\\F0C0\"}.fa-chain:before,.fa-link:before{content:\"\\F0C1\"}.fa-cloud:before{content:\"\\F0C2\"}.fa-flask:before{content:\"\\F0C3\"}.fa-cut:before,.fa-scissors:before{content:\"\\F0C4\"}.fa-copy:before,.fa-files-o:before{content:\"\\F0C5\"}.fa-paperclip:before{content:\"\\F0C6\"}.fa-floppy-o:before,.fa-save:before{content:\"\\F0C7\"}.fa-square:before{content:\"\\F0C8\"}.fa-bars:before,.fa-navicon:before,.fa-reorder:before{content:\"\\F0C9\"}.fa-list-ul:before{content:\"\\F0CA\"}.fa-list-ol:before{content:\"\\F0CB\"}.fa-strikethrough:before{content:\"\\F0CC\"}.fa-underline:before{content:\"\\F0CD\"}.fa-table:before{content:\"\\F0CE\"}.fa-magic:before{content:\"\\F0D0\"}.fa-truck:before{content:\"\\F0D1\"}.fa-pinterest:before{content:\"\\F0D2\"}.fa-pinterest-square:before{content:\"\\F0D3\"}.fa-google-plus-square:before{content:\"\\F0D4\"}.fa-google-plus:before{content:\"\\F0D5\"}.fa-money:before{content:\"\\F0D6\"}.fa-caret-down:before{content:\"\\F0D7\"}.fa-caret-up:before{content:\"\\F0D8\"}.fa-caret-left:before{content:\"\\F0D9\"}.fa-caret-right:before{content:\"\\F0DA\"}.fa-columns:before{content:\"\\F0DB\"}.fa-sort:before,.fa-unsorted:before{content:\"\\F0DC\"}.fa-sort-desc:before,.fa-sort-down:before{content:\"\\F0DD\"}.fa-sort-asc:before,.fa-sort-up:before{content:\"\\F0DE\"}.fa-envelope:before{content:\"\\F0E0\"}.fa-linkedin:before{content:\"\\F0E1\"}.fa-rotate-left:before,.fa-undo:before{content:\"\\F0E2\"}.fa-gavel:before,.fa-legal:before{content:\"\\F0E3\"}.fa-dashboard:before,.fa-tachometer:before{content:\"\\F0E4\"}.fa-comment-o:before{content:\"\\F0E5\"}.fa-comments-o:before{content:\"\\F0E6\"}.fa-bolt:before,.fa-flash:before{content:\"\\F0E7\"}.fa-sitemap:before{content:\"\\F0E8\"}.fa-umbrella:before{content:\"\\F0E9\"}.fa-clipboard:before,.fa-paste:before{content:\"\\F0EA\"}.fa-lightbulb-o:before{content:\"\\F0EB\"}.fa-exchange:before{content:\"\\F0EC\"}.fa-cloud-download:before{content:\"\\F0ED\"}.fa-cloud-upload:before{content:\"\\F0EE\"}.fa-user-md:before{content:\"\\F0F0\"}.fa-stethoscope:before{content:\"\\F0F1\"}.fa-suitcase:before{content:\"\\F0F2\"}.fa-bell-o:before{content:\"\\F0A2\"}.fa-coffee:before{content:\"\\F0F4\"}.fa-cutlery:before{content:\"\\F0F5\"}.fa-file-text-o:before{content:\"\\F0F6\"}.fa-building-o:before{content:\"\\F0F7\"}.fa-hospital-o:before{content:\"\\F0F8\"}.fa-ambulance:before{content:\"\\F0F9\"}.fa-medkit:before{content:\"\\F0FA\"}.fa-fighter-jet:before{content:\"\\F0FB\"}.fa-beer:before{content:\"\\F0FC\"}.fa-h-square:before{content:\"\\F0FD\"}.fa-plus-square:before{content:\"\\F0FE\"}.fa-angle-double-left:before{content:\"\\F100\"}.fa-angle-double-right:before{content:\"\\F101\"}.fa-angle-double-up:before{content:\"\\F102\"}.fa-angle-double-down:before{content:\"\\F103\"}.fa-angle-left:before{content:\"\\F104\"}.fa-angle-right:before{content:\"\\F105\"}.fa-angle-up:before{content:\"\\F106\"}.fa-angle-down:before{content:\"\\F107\"}.fa-desktop:before{content:\"\\F108\"}.fa-laptop:before{content:\"\\F109\"}.fa-tablet:before{content:\"\\F10A\"}.fa-mobile-phone:before,.fa-mobile:before{content:\"\\F10B\"}.fa-circle-o:before{content:\"\\F10C\"}.fa-quote-left:before{content:\"\\F10D\"}.fa-quote-right:before{content:\"\\F10E\"}.fa-spinner:before{content:\"\\F110\"}.fa-circle:before{content:\"\\F111\"}.fa-mail-reply:before,.fa-reply:before{content:\"\\F112\"}.fa-github-alt:before{content:\"\\F113\"}.fa-folder-o:before{content:\"\\F114\"}.fa-folder-open-o:before{content:\"\\F115\"}.fa-smile-o:before{content:\"\\F118\"}.fa-frown-o:before{content:\"\\F119\"}.fa-meh-o:before{content:\"\\F11A\"}.fa-gamepad:before{content:\"\\F11B\"}.fa-keyboard-o:before{content:\"\\F11C\"}.fa-flag-o:before{content:\"\\F11D\"}.fa-flag-checkered:before{content:\"\\F11E\"}.fa-terminal:before{content:\"\\F120\"}.fa-code:before{content:\"\\F121\"}.fa-mail-reply-all:before,.fa-reply-all:before{content:\"\\F122\"}.fa-star-half-empty:before,.fa-star-half-full:before,.fa-star-half-o:before{content:\"\\F123\"}.fa-location-arrow:before{content:\"\\F124\"}.fa-crop:before{content:\"\\F125\"}.fa-code-fork:before{content:\"\\F126\"}.fa-chain-broken:before,.fa-unlink:before{content:\"\\F127\"}.fa-question:before{content:\"\\F128\"}.fa-info:before{content:\"\\F129\"}.fa-exclamation:before{content:\"\\F12A\"}.fa-superscript:before{content:\"\\F12B\"}.fa-subscript:before{content:\"\\F12C\"}.fa-eraser:before{content:\"\\F12D\"}.fa-puzzle-piece:before{content:\"\\F12E\"}.fa-microphone:before{content:\"\\F130\"}.fa-microphone-slash:before{content:\"\\F131\"}.fa-shield:before{content:\"\\F132\"}.fa-calendar-o:before{content:\"\\F133\"}.fa-fire-extinguisher:before{content:\"\\F134\"}.fa-rocket:before{content:\"\\F135\"}.fa-maxcdn:before{content:\"\\F136\"}.fa-chevron-circle-left:before{content:\"\\F137\"}.fa-chevron-circle-right:before{content:\"\\F138\"}.fa-chevron-circle-up:before{content:\"\\F139\"}.fa-chevron-circle-down:before{content:\"\\F13A\"}.fa-html5:before{content:\"\\F13B\"}.fa-css3:before{content:\"\\F13C\"}.fa-anchor:before{content:\"\\F13D\"}.fa-unlock-alt:before{content:\"\\F13E\"}.fa-bullseye:before{content:\"\\F140\"}.fa-ellipsis-h:before{content:\"\\F141\"}.fa-ellipsis-v:before{content:\"\\F142\"}.fa-rss-square:before{content:\"\\F143\"}.fa-play-circle:before{content:\"\\F144\"}.fa-ticket:before{content:\"\\F145\"}.fa-minus-square:before{content:\"\\F146\"}.fa-minus-square-o:before{content:\"\\F147\"}.fa-level-up:before{content:\"\\F148\"}.fa-level-down:before{content:\"\\F149\"}.fa-check-square:before{content:\"\\F14A\"}.fa-pencil-square:before{content:\"\\F14B\"}.fa-external-link-square:before{content:\"\\F14C\"}.fa-share-square:before{content:\"\\F14D\"}.fa-compass:before{content:\"\\F14E\"}.fa-caret-square-o-down:before,.fa-toggle-down:before{content:\"\\F150\"}.fa-caret-square-o-up:before,.fa-toggle-up:before{content:\"\\F151\"}.fa-caret-square-o-right:before,.fa-toggle-right:before{content:\"\\F152\"}.fa-eur:before,.fa-euro:before{content:\"\\F153\"}.fa-gbp:before{content:\"\\F154\"}.fa-dollar:before,.fa-usd:before{content:\"\\F155\"}.fa-inr:before,.fa-rupee:before{content:\"\\F156\"}.fa-cny:before,.fa-jpy:before,.fa-rmb:before,.fa-yen:before{content:\"\\F157\"}.fa-rouble:before,.fa-rub:before,.fa-ruble:before{content:\"\\F158\"}.fa-krw:before,.fa-won:before{content:\"\\F159\"}.fa-bitcoin:before,.fa-btc:before{content:\"\\F15A\"}.fa-file:before{content:\"\\F15B\"}.fa-file-text:before{content:\"\\F15C\"}.fa-sort-alpha-asc:before{content:\"\\F15D\"}.fa-sort-alpha-desc:before{content:\"\\F15E\"}.fa-sort-amount-asc:before{content:\"\\F160\"}.fa-sort-amount-desc:before{content:\"\\F161\"}.fa-sort-numeric-asc:before{content:\"\\F162\"}.fa-sort-numeric-desc:before{content:\"\\F163\"}.fa-thumbs-up:before{content:\"\\F164\"}.fa-thumbs-down:before{content:\"\\F165\"}.fa-youtube-square:before{content:\"\\F166\"}.fa-youtube:before{content:\"\\F167\"}.fa-xing:before{content:\"\\F168\"}.fa-xing-square:before{content:\"\\F169\"}.fa-youtube-play:before{content:\"\\F16A\"}.fa-dropbox:before{content:\"\\F16B\"}.fa-stack-overflow:before{content:\"\\F16C\"}.fa-instagram:before{content:\"\\F16D\"}.fa-flickr:before{content:\"\\F16E\"}.fa-adn:before{content:\"\\F170\"}.fa-bitbucket:before{content:\"\\F171\"}.fa-bitbucket-square:before{content:\"\\F172\"}.fa-tumblr:before{content:\"\\F173\"}.fa-tumblr-square:before{content:\"\\F174\"}.fa-long-arrow-down:before{content:\"\\F175\"}.fa-long-arrow-up:before{content:\"\\F176\"}.fa-long-arrow-left:before{content:\"\\F177\"}.fa-long-arrow-right:before{content:\"\\F178\"}.fa-apple:before{content:\"\\F179\"}.fa-windows:before{content:\"\\F17A\"}.fa-android:before{content:\"\\F17B\"}.fa-linux:before{content:\"\\F17C\"}.fa-dribbble:before{content:\"\\F17D\"}.fa-skype:before{content:\"\\F17E\"}.fa-foursquare:before{content:\"\\F180\"}.fa-trello:before{content:\"\\F181\"}.fa-female:before{content:\"\\F182\"}.fa-male:before{content:\"\\F183\"}.fa-gittip:before,.fa-gratipay:before{content:\"\\F184\"}.fa-sun-o:before{content:\"\\F185\"}.fa-moon-o:before{content:\"\\F186\"}.fa-archive:before{content:\"\\F187\"}.fa-bug:before{content:\"\\F188\"}.fa-vk:before{content:\"\\F189\"}.fa-weibo:before{content:\"\\F18A\"}.fa-renren:before{content:\"\\F18B\"}.fa-pagelines:before{content:\"\\F18C\"}.fa-stack-exchange:before{content:\"\\F18D\"}.fa-arrow-circle-o-right:before{content:\"\\F18E\"}.fa-arrow-circle-o-left:before{content:\"\\F190\"}.fa-caret-square-o-left:before,.fa-toggle-left:before{content:\"\\F191\"}.fa-dot-circle-o:before{content:\"\\F192\"}.fa-wheelchair:before{content:\"\\F193\"}.fa-vimeo-square:before{content:\"\\F194\"}.fa-try:before,.fa-turkish-lira:before{content:\"\\F195\"}.fa-plus-square-o:before{content:\"\\F196\"}.fa-space-shuttle:before{content:\"\\F197\"}.fa-slack:before{content:\"\\F198\"}.fa-envelope-square:before{content:\"\\F199\"}.fa-wordpress:before{content:\"\\F19A\"}.fa-openid:before{content:\"\\F19B\"}.fa-bank:before,.fa-institution:before,.fa-university:before{content:\"\\F19C\"}.fa-graduation-cap:before,.fa-mortar-board:before{content:\"\\F19D\"}.fa-yahoo:before{content:\"\\F19E\"}.fa-google:before{content:\"\\F1A0\"}.fa-reddit:before{content:\"\\F1A1\"}.fa-reddit-square:before{content:\"\\F1A2\"}.fa-stumbleupon-circle:before{content:\"\\F1A3\"}.fa-stumbleupon:before{content:\"\\F1A4\"}.fa-delicious:before{content:\"\\F1A5\"}.fa-digg:before{content:\"\\F1A6\"}.fa-pied-piper:before{content:\"\\F1A7\"}.fa-pied-piper-alt:before{content:\"\\F1A8\"}.fa-drupal:before{content:\"\\F1A9\"}.fa-joomla:before{content:\"\\F1AA\"}.fa-language:before{content:\"\\F1AB\"}.fa-fax:before{content:\"\\F1AC\"}.fa-building:before{content:\"\\F1AD\"}.fa-child:before{content:\"\\F1AE\"}.fa-paw:before{content:\"\\F1B0\"}.fa-spoon:before{content:\"\\F1B1\"}.fa-cube:before{content:\"\\F1B2\"}.fa-cubes:before{content:\"\\F1B3\"}.fa-behance:before{content:\"\\F1B4\"}.fa-behance-square:before{content:\"\\F1B5\"}.fa-steam:before{content:\"\\F1B6\"}.fa-steam-square:before{content:\"\\F1B7\"}.fa-recycle:before{content:\"\\F1B8\"}.fa-automobile:before,.fa-car:before{content:\"\\F1B9\"}.fa-cab:before,.fa-taxi:before{content:\"\\F1BA\"}.fa-tree:before{content:\"\\F1BB\"}.fa-spotify:before{content:\"\\F1BC\"}.fa-deviantart:before{content:\"\\F1BD\"}.fa-soundcloud:before{content:\"\\F1BE\"}.fa-database:before{content:\"\\F1C0\"}.fa-file-pdf-o:before{content:\"\\F1C1\"}.fa-file-word-o:before{content:\"\\F1C2\"}.fa-file-excel-o:before{content:\"\\F1C3\"}.fa-file-powerpoint-o:before{content:\"\\F1C4\"}.fa-file-image-o:before,.fa-file-photo-o:before,.fa-file-picture-o:before{content:\"\\F1C5\"}.fa-file-archive-o:before,.fa-file-zip-o:before{content:\"\\F1C6\"}.fa-file-audio-o:before,.fa-file-sound-o:before{content:\"\\F1C7\"}.fa-file-movie-o:before,.fa-file-video-o:before{content:\"\\F1C8\"}.fa-file-code-o:before{content:\"\\F1C9\"}.fa-vine:before{content:\"\\F1CA\"}.fa-codepen:before{content:\"\\F1CB\"}.fa-jsfiddle:before{content:\"\\F1CC\"}.fa-life-bouy:before,.fa-life-buoy:before,.fa-life-ring:before,.fa-life-saver:before,.fa-support:before{content:\"\\F1CD\"}.fa-circle-o-notch:before{content:\"\\F1CE\"}.fa-ra:before,.fa-rebel:before{content:\"\\F1D0\"}.fa-empire:before,.fa-ge:before{content:\"\\F1D1\"}.fa-git-square:before{content:\"\\F1D2\"}.fa-git:before{content:\"\\F1D3\"}.fa-hacker-news:before{content:\"\\F1D4\"}.fa-tencent-weibo:before{content:\"\\F1D5\"}.fa-qq:before{content:\"\\F1D6\"}.fa-wechat:before,.fa-weixin:before{content:\"\\F1D7\"}.fa-paper-plane:before,.fa-send:before{content:\"\\F1D8\"}.fa-paper-plane-o:before,.fa-send-o:before{content:\"\\F1D9\"}.fa-history:before{content:\"\\F1DA\"}.fa-circle-thin:before,.fa-genderless:before{content:\"\\F1DB\"}.fa-header:before{content:\"\\F1DC\"}.fa-paragraph:before{content:\"\\F1DD\"}.fa-sliders:before{content:\"\\F1DE\"}.fa-share-alt:before{content:\"\\F1E0\"}.fa-share-alt-square:before{content:\"\\F1E1\"}.fa-bomb:before{content:\"\\F1E2\"}.fa-futbol-o:before,.fa-soccer-ball-o:before{content:\"\\F1E3\"}.fa-tty:before{content:\"\\F1E4\"}.fa-binoculars:before{content:\"\\F1E5\"}.fa-plug:before{content:\"\\F1E6\"}.fa-slideshare:before{content:\"\\F1E7\"}.fa-twitch:before{content:\"\\F1E8\"}.fa-yelp:before{content:\"\\F1E9\"}.fa-newspaper-o:before{content:\"\\F1EA\"}.fa-wifi:before{content:\"\\F1EB\"}.fa-calculator:before{content:\"\\F1EC\"}.fa-paypal:before{content:\"\\F1ED\"}.fa-google-wallet:before{content:\"\\F1EE\"}.fa-cc-visa:before{content:\"\\F1F0\"}.fa-cc-mastercard:before{content:\"\\F1F1\"}.fa-cc-discover:before{content:\"\\F1F2\"}.fa-cc-amex:before{content:\"\\F1F3\"}.fa-cc-paypal:before{content:\"\\F1F4\"}.fa-cc-stripe:before{content:\"\\F1F5\"}.fa-bell-slash:before{content:\"\\F1F6\"}.fa-bell-slash-o:before{content:\"\\F1F7\"}.fa-trash:before{content:\"\\F1F8\"}.fa-copyright:before{content:\"\\F1F9\"}.fa-at:before{content:\"\\F1FA\"}.fa-eyedropper:before{content:\"\\F1FB\"}.fa-paint-brush:before{content:\"\\F1FC\"}.fa-birthday-cake:before{content:\"\\F1FD\"}.fa-area-chart:before{content:\"\\F1FE\"}.fa-pie-chart:before{content:\"\\F200\"}.fa-line-chart:before{content:\"\\F201\"}.fa-lastfm:before{content:\"\\F202\"}.fa-lastfm-square:before{content:\"\\F203\"}.fa-toggle-off:before{content:\"\\F204\"}.fa-toggle-on:before{content:\"\\F205\"}.fa-bicycle:before{content:\"\\F206\"}.fa-bus:before{content:\"\\F207\"}.fa-ioxhost:before{content:\"\\F208\"}.fa-angellist:before{content:\"\\F209\"}.fa-cc:before{content:\"\\F20A\"}.fa-ils:before,.fa-shekel:before,.fa-sheqel:before{content:\"\\F20B\"}.fa-meanpath:before{content:\"\\F20C\"}.fa-buysellads:before{content:\"\\F20D\"}.fa-connectdevelop:before{content:\"\\F20E\"}.fa-dashcube:before{content:\"\\F210\"}.fa-forumbee:before{content:\"\\F211\"}.fa-leanpub:before{content:\"\\F212\"}.fa-sellsy:before{content:\"\\F213\"}.fa-shirtsinbulk:before{content:\"\\F214\"}.fa-simplybuilt:before{content:\"\\F215\"}.fa-skyatlas:before{content:\"\\F216\"}.fa-cart-plus:before{content:\"\\F217\"}.fa-cart-arrow-down:before{content:\"\\F218\"}.fa-diamond:before{content:\"\\F219\"}.fa-ship:before{content:\"\\F21A\"}.fa-user-secret:before{content:\"\\F21B\"}.fa-motorcycle:before{content:\"\\F21C\"}.fa-street-view:before{content:\"\\F21D\"}.fa-heartbeat:before{content:\"\\F21E\"}.fa-venus:before{content:\"\\F221\"}.fa-mars:before{content:\"\\F222\"}.fa-mercury:before{content:\"\\F223\"}.fa-transgender:before{content:\"\\F224\"}.fa-transgender-alt:before{content:\"\\F225\"}.fa-venus-double:before{content:\"\\F226\"}.fa-mars-double:before{content:\"\\F227\"}.fa-venus-mars:before{content:\"\\F228\"}.fa-mars-stroke:before{content:\"\\F229\"}.fa-mars-stroke-v:before{content:\"\\F22A\"}.fa-mars-stroke-h:before{content:\"\\F22B\"}.fa-neuter:before{content:\"\\F22C\"}.fa-facebook-official:before{content:\"\\F230\"}.fa-pinterest-p:before{content:\"\\F231\"}.fa-whatsapp:before{content:\"\\F232\"}.fa-server:before{content:\"\\F233\"}.fa-user-plus:before{content:\"\\F234\"}.fa-user-times:before{content:\"\\F235\"}.fa-bed:before,.fa-hotel:before{content:\"\\F236\"}.fa-viacoin:before{content:\"\\F237\"}.fa-train:before{content:\"\\F238\"}.fa-subway:before{content:\"\\F239\"}.fa-medium:before{content:\"\\F23A\"}.jqvmap-label{position:absolute;display:none;border-radius:3px;background:#292929;color:#fff;font-family:sans-serif,Verdana;font-size:smaller;padding:3px}.jqvmap-zoomin,.jqvmap-zoomout{position:absolute;left:10px;border-radius:3px;background:#000;padding:3px;color:#fff;width:10px;height:10px;cursor:pointer;line-height:10px;text-align:center}.jqvmap-zoomin{top:10px}.jqvmap-zoomout{top:30px}.jqvmap-region{cursor:pointer}.jqvmap-ajax_response{width:100%;height:500px}.metismenu .arrow{float:right;line-height:1.42857}.metismenu .glyphicon.arrow:before{content:\"\\E079\"}.metismenu .active>a>.glyphicon.arrow:before{content:\"\\E114\"}.metismenu .fa.arrow:before{content:\"\\F104\"}.metismenu .active>a>.fa.arrow:before{content:\"\\F107\"}.metismenu .ion.arrow:before{content:\"\\F3D2\"}.metismenu .active>a>.ion.arrow:before{content:\"\\F3D0\"}.metismenu .plus-times{float:right}.metismenu .fa.plus-times:before{content:\"\\F067\"}.metismenu .active>a>.fa.plus-times{transform:rotate(45deg)}.metismenu .plus-minus{float:right}.metismenu .fa.plus-minus:before{content:\"\\F067\"}.metismenu .active>a>.fa.plus-minus:before{content:\"\\F068\"}.metismenu .collapse{display:none}.metismenu .collapse.in{display:block}.metismenu .collapsing{position:relative;height:0;overflow:hidden;transition-timing-function:ease;transition-duration:.35s;transition-property:height,visibility}#nprogress{pointer-events:none}#nprogress .bar{background:#29d;position:fixed;z-index:1031;top:0;left:0;width:100%;height:2px}#nprogress .peg{display:block;position:absolute;right:0;width:100px;height:100%;box-shadow:0 0 10px #29d,0 0 5px #29d;opacity:1;transform:rotate(3deg) translate(0,-4px)}#nprogress .spinner{display:block;position:fixed;z-index:1031;top:15px;right:15px}#nprogress .spinner-icon{width:18px;height:18px;box-sizing:border-box;border:solid 2px transparent;border-top-color:#29d;border-left-color:#29d;border-radius:50%;animation:nprogress-spinner .4s linear infinite}.nprogress-custom-parent{overflow:hidden;position:relative}.nprogress-custom-parent #nprogress .bar,.nprogress-custom-parent #nprogress .spinner{position:absolute}@keyframes nprogress-spinner{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}/*! Quill Editor v0.20.1\r\n *  https://quilljs.com/\r\n *  Copyright (c) 2014, Jason Chen\r\n *  Copyright (c) 2013, salesforce.com\r\n */.ql-image-tooltip{padding:10px;width:300px}.ql-image-tooltip:after{clear:both;content:\"\";display:table}.ql-image-tooltip a{border:1px solid #000;box-sizing:border-box;display:inline-block;float:left;padding:5px;text-align:center;width:50%}.ql-image-tooltip img{bottom:0;left:0;margin:auto;max-height:100%;max-width:100%;position:absolute;right:0;top:0}.ql-image-tooltip .input{box-sizing:border-box;width:100%}.ql-image-tooltip .preview{margin:10px 0;position:relative;border:1px dashed #000;height:200px}.ql-image-tooltip .preview span{display:inline-block;position:absolute;text-align:center;top:40%;width:100%}.ql-link-tooltip{padding:5px 10px}.ql-link-tooltip input.input{width:170px}.ql-link-tooltip a.done,.ql-link-tooltip input.input{display:none}.ql-link-tooltip a.change{margin-right:4px}.ql-link-tooltip.editing a.done,.ql-link-tooltip.editing input.input{display:inline-block}.ql-link-tooltip.editing a.change,.ql-link-tooltip.editing a.remove,.ql-link-tooltip.editing a.url{display:none}.ql-multi-cursor{position:absolute;left:0;top:0;z-index:1000}.ql-multi-cursor .cursor{margin-left:-1px;position:absolute}.ql-multi-cursor .cursor-flag{bottom:100%;position:absolute;white-space:nowrap}.ql-multi-cursor .cursor-name{display:inline-block;color:#fff;padding:2px 8px}.ql-multi-cursor .cursor-caret{height:100%;position:absolute;width:2px}.ql-multi-cursor .cursor.hidden .cursor-flag{display:none}.ql-multi-cursor .cursor.top .cursor-flag{bottom:auto;top:100%}.ql-multi-cursor .cursor.right .cursor-flag{right:-2px}.ql-paste-manager{left:-100000px;position:absolute;top:50%}.ql-toolbar{box-sizing:border-box}.ql-tooltip{background-color:#fff;border:1px solid #000;box-sizing:border-box;position:absolute;top:0;white-space:nowrap;z-index:2000}.ql-tooltip a{cursor:pointer;text-decoration:none}.ql-container{box-sizing:border-box;cursor:text;font-family:Helvetica,Arial,sans-serif;font-size:13px;height:100%;line-height:1.42;margin:0;overflow-x:hidden;overflow-y:auto;padding:12px 15px;position:relative}.ql-editor{box-sizing:border-box;min-height:100%;outline:0;-moz-tab-size:4;-o-tab-size:4;tab-size:4;white-space:pre-wrap}.ql-editor div{margin:0;padding:0}.ql-editor a{text-decoration:underline}.ql-editor b{font-weight:700}.ql-editor i{font-style:italic}.ql-editor s{text-decoration:line-through}.ql-editor u{text-decoration:underline}.ql-editor a,.ql-editor b,.ql-editor i,.ql-editor s,.ql-editor span,.ql-editor u{background-color:inherit}.ql-editor img{max-width:100%}.ql-editor blockquote,.ql-editor ol,.ql-editor ul{margin:0 0 0 2em;padding:0}.ql-editor ol{list-style-type:decimal}.ql-editor ul{list-style-type:disc}.ql-editor.ql-ie-10 br,.ql-editor.ql-ie-9 br{display:none}/*! Quill Editor v0.20.1\r\n *  https://quilljs.com/\r\n *  Copyright (c) 2014, Jason Chen\r\n *  Copyright (c) 2013, salesforce.com\r\n */.ql-image-tooltip{padding:10px;width:300px}.ql-image-tooltip:after{clear:both;content:\"\";display:table}.ql-image-tooltip a{border:1px solid #000;box-sizing:border-box;display:inline-block;float:left;padding:5px;text-align:center;width:50%}.ql-image-tooltip img{bottom:0;left:0;margin:auto;max-height:100%;max-width:100%;position:absolute;right:0;top:0}.ql-image-tooltip .input{box-sizing:border-box;width:100%}.ql-image-tooltip .preview{margin:10px 0;position:relative;border:1px dashed #000;height:200px}.ql-image-tooltip .preview span{display:inline-block;position:absolute;text-align:center;top:40%;width:100%}.ql-link-tooltip{padding:5px 10px}.ql-link-tooltip input.input{width:170px}.ql-link-tooltip a.done,.ql-link-tooltip input.input{display:none}.ql-link-tooltip a.change{margin-right:4px}.ql-link-tooltip.editing a.done,.ql-link-tooltip.editing input.input{display:inline-block}.ql-link-tooltip.editing a.change,.ql-link-tooltip.editing a.remove,.ql-link-tooltip.editing a.url{display:none}.ql-multi-cursor{position:absolute;left:0;top:0;z-index:1000}.ql-multi-cursor .cursor{margin-left:-1px;position:absolute}.ql-multi-cursor .cursor-flag{bottom:100%;position:absolute;white-space:nowrap}.ql-multi-cursor .cursor-name{display:inline-block;color:#fff;padding:2px 8px}.ql-multi-cursor .cursor-caret{height:100%;position:absolute;width:2px}.ql-multi-cursor .cursor.hidden .cursor-flag{display:none}.ql-multi-cursor .cursor.top .cursor-flag{bottom:auto;top:100%}.ql-multi-cursor .cursor.right .cursor-flag{right:-2px}.ql-paste-manager{left:-100000px;position:absolute;top:50%}.ql-toolbar{box-sizing:border-box}.ql-tooltip{background-color:#fff;border:1px solid #000;box-sizing:border-box;position:absolute;top:0;white-space:nowrap;z-index:2000}.ql-tooltip a{cursor:pointer;text-decoration:none}.ql-container{box-sizing:border-box;cursor:text;font-family:Helvetica,Arial,sans-serif;font-size:13px;height:100%;line-height:1.42;margin:0;overflow-x:hidden;overflow-y:auto;padding:12px 15px;position:relative}.ql-editor{box-sizing:border-box;min-height:100%;outline:0;-moz-tab-size:4;-o-tab-size:4;tab-size:4;white-space:pre-wrap}.ql-editor div{margin:0;padding:0}.ql-editor a{text-decoration:underline}.ql-editor b{font-weight:700}.ql-editor i{font-style:italic}.ql-editor s{text-decoration:line-through}.ql-editor u{text-decoration:underline}.ql-editor a,.ql-editor b,.ql-editor i,.ql-editor s,.ql-editor span,.ql-editor u{background-color:inherit}.ql-editor img{max-width:100%}.ql-editor blockquote,.ql-editor ol,.ql-editor ul{margin:0 0 0 2em;padding:0}.ql-editor ol{list-style-type:decimal}.ql-editor ul{list-style-type:disc}.ql-editor.ql-ie-10 br,.ql-editor.ql-ie-9 br{display:none}.ql-snow .ql-image-tooltip a{border:1px solid #06c}.ql-snow .ql-image-tooltip a.insert{background-color:#06c;color:#fff}.ql-snow .ql-image-tooltip .preview{border-color:#ccc;color:#ccc}.ql-snow .ql-link-tooltip a,.ql-snow .ql-link-tooltip span{line-height:25px}.ql-snow .ql-multi-cursor .cursor-name{border-radius:4px;font-size:11px;font-family:Arial;margin-left:-50%;padding:4px 10px}.ql-snow .ql-multi-cursor .cursor-triangle{border-left:4px solid transparent;border-right:4px solid transparent;height:0;margin-left:-3px;width:0}.ql-snow .ql-multi-cursor .cursor.left .cursor-name{margin-left:-8px}.ql-snow .ql-multi-cursor .cursor.right .cursor-flag{right:auto}.ql-snow .ql-multi-cursor .cursor.right .cursor-name{margin-left:-100%;margin-right:-8px}.ql-snow .ql-multi-cursor .cursor-triangle.bottom{border-top:4px solid transparent;display:block;margin-bottom:-1px}.ql-snow .ql-multi-cursor .cursor-triangle.top{border-bottom:4px solid transparent;display:none;margin-top:-1px}.ql-snow .ql-multi-cursor .cursor.top .cursor-triangle.bottom{display:none}.ql-snow .ql-multi-cursor .cursor.top .cursor-triangle.top{display:block}.ql-snow.ql-toolbar{box-sizing:border-box;padding:8px;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none}.ql-snow.ql-toolbar .ql-format-group{display:inline-block;margin-right:15px;vertical-align:middle}.ql-snow.ql-toolbar .ql-format-separator{box-sizing:border-box;background-color:#ddd;display:inline-block;height:14px;margin-left:4px;margin-right:4px;vertical-align:middle;width:1px}.ql-snow.ql-toolbar .ql-format-button{box-sizing:border-box;display:inline-block;height:24px;line-height:24px;vertical-align:middle;background-position:center center;background-repeat:no-repeat;background-size:18px 18px;box-sizing:border-box;cursor:pointer;text-align:center;width:24px}.ql-snow.ql-toolbar .ql-picker{box-sizing:border-box;color:#444;display:inline-block;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:500;position:relative}.ql-snow.ql-toolbar .ql-picker .ql-picker-label{box-sizing:border-box;display:inline-block;height:24px;line-height:24px;vertical-align:middle;background-color:#fff;background-position:right center;background-repeat:no-repeat;background-size:18px 18px;border:1px solid transparent;cursor:pointer;position:relative;width:100%}.ql-snow.ql-toolbar .ql-picker .ql-picker-label.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-label:hover{color:#06c}.ql-snow.ql-toolbar .ql-picker .ql-picker-options{background-color:#fff;border:1px solid transparent;box-sizing:border-box;display:none;padding:4px 8px;position:absolute;width:100%}.ql-snow.ql-toolbar .ql-picker .ql-picker-options .ql-picker-item{background-position:center center;background-repeat:no-repeat;background-size:18px 18px;box-sizing:border-box;cursor:pointer;display:block;padding-bottom:5px;padding-top:5px}.ql-snow.ql-toolbar .ql-picker .ql-picker-options .ql-picker-item.ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-options .ql-picker-item:hover{color:#06c}.ql-snow.ql-toolbar .ql-picker.ql-expanded .ql-picker-label{border-color:#ccc;color:#ccc;z-index:2}.ql-snow.ql-toolbar .ql-picker.ql-expanded .ql-picker-options{border-color:#ccc;box-shadow:rgba(0,0,0,.2) 0 2px 8px;display:block;margin-top:-1px;z-index:1}.ql-snow.ql-toolbar .ql-picker.ql-color-picker .ql-picker-label{background-position:center center;width:28px}.ql-snow.ql-toolbar .ql-picker.ql-color-picker .ql-picker-options{padding:5px;width:152px}.ql-snow.ql-toolbar .ql-picker.ql-color-picker .ql-picker-options .ql-picker-item{border:1px solid transparent;float:left;height:16px;margin:2px;padding:0;width:16px}.ql-snow.ql-toolbar .ql-picker.ql-color-picker .ql-picker-options .ql-picker-item.ql-primary-color{margin-bottom:8px}.ql-snow.ql-toolbar .ql-picker.ql-color-picker .ql-picker-options .ql-picker-item.ql-selected,.ql-snow.ql-toolbar .ql-picker.ql-color-picker .ql-picker-options .ql-picker-item:hover{border-color:#000}.ql-snow.ql-toolbar .ql-picker.ql-font{width:105px}.ql-snow.ql-toolbar .ql-picker.ql-size{width:80px}.ql-snow.ql-toolbar .ql-picker.ql-font .ql-picker-label,.ql-snow.ql-toolbar .ql-picker.ql-size .ql-picker-label{padding-left:8px;padding-right:8px}.ql-snow.ql-toolbar .ql-picker.ql-align .ql-picker-label{background-position:center center;width:28px}.ql-snow.ql-toolbar .ql-picker.ql-align .ql-picker-item{box-sizing:border-box;display:inline-block;height:24px;line-height:24px;vertical-align:middle;padding:0;width:28px}.ql-snow.ql-toolbar .ql-picker.ql-align .ql-picker-options{padding:4px 0}.ql-snow.ql-toolbar .ql-picker .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAKlBMVEUAAABJSUlAQEBERERFRUVERERERERERERERERFRUVEREREREREREREREQJcW6NAAAADXRSTlMAFRzExcbLzM/Q0dLbKbcyLwAAADVJREFUCNdjYCAeMKYJQFnSdzdCWbl3r0NZvnev4tFre/cKlNV79yaUpXP3EJTFtEqBBHcAAHyoDQk0vM/lAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-picker.ql-expanded .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAdElEQVR42mP4//8/VfBINGjVqlUMhw4dEj148OBpEAaxQWKkGgQz5BIQ/4fiSyAxkg2CuuQ/Gj5DjkFHsRh0jJwwwooHzCCQ145g8dpRcgw6j8WgCyQbtH//fhmgxttIhtwGiZETRjDDLoIwiA0UG820FGAA5b25+qRqGXcAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-picker.ql-active:not(.ql-expanded) .ql-picker-label,.ql-snow.ql-toolbar:not(.ios) .ql-picker:not(.ql-expanded) .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAKlBMVEUAAAAAYc4AZMgAZcwAZs0AZs0AZs0AZ8wAZswAZs0AZswAZswAZswAZsx12LPhAAAADXRSTlMAFRzExcbLzM/Q0dLbKbcyLwAAADVJREFUCNdjYCAeMKYJQFnSdzdCWbl3r0NZvnev4tFre/cKlNV79yaUpXP3EJTFtEqBBHcAAHyoDQk0vM/lAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-bold,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bold],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bold],.ql-snow.ql-toolbar .ql-picker.ql-bold .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAYFBMVEUAAACAgIBAQEA5OTlAQEBERERAQEBERERERERERERDQ0NERERERERERERDQ0NERERERERFRUVERERERERFRUVERERERERERERERERERERERERERERERERERERERERERESN6WzHAAAAH3RSTlMAAggJDA8cQEtTWHF/i4yTpau+xMXX3O7v8/f6+/z+qN9w2AAAAFZJREFUeNqlzMcSgCAMRVEsYO+9vv//S9FhNIYld5HFmSTCqQ66dazkRzA1lPSQGRZGIsDMKMxRW7+2yCIcyf/QUyUGSnc+dkaqoFumM32pf2BqY+HUBfQaCPgVIBc1AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-bold.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bold].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bold].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-bold .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-bold:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=bold]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=bold]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-bold .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAYFBMVEUAAAAAgP8AYL8AccYAatUAZswAZMgAZMsAZswAZcsAZcsAZssAZssAZ80AZswAZs0AZswAZ8wAZswAZcwAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsxCU9XcAAAAH3RSTlMAAggJDA8cQEtTWHF/i4yTpau+xMXX3O7v8/f6+/z+qN9w2AAAAFZJREFUeNqlzMcSgCAMRVEsYO+9vv//S9FhNIYld5HFmSTCqQ66dazkRzA1lPSQGRZGIsDMKMxRW7+2yCIcyf/QUyUGSnc+dkaqoFumM32pf2BqY+HUBfQaCPgVIBc1AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-italic,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=italic],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=italic],.ql-snow.ql-toolbar .ql-picker.ql-italic .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAi0lEQVR42mMYvoARl4SLi0sNkGoAYmY0qf+MjIztu3fvrkYWZGLADZhB8pS4CN1lQUBqLRDvAQJXHMqIstEISp8BEZQYZAIi/v//f5ZSg0xBBCMj4ymyDQKGjxKQEgLiV8DweUS2QUBXGEOZp0EEJV4zgdJnKDLo379/JsS6iJHSFA0DTDhT9CiAAQBbWyIY/pd4rQAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-italic.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=italic].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=italic].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-italic .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-italic:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=italic]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=italic]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-italic .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAk0lEQVR42u3SsQ3CMBBA0X/2BozACMQswg4EMQMUdOyQVdggdpagZAc4ihjJjYmU66K8xpZsfdnSsVxCzTFdEW6AB0oKcqdrLhQcNaK+PLc79QfapLTDgz8cU9Tv8ibZQqIBgI8OxhexH29KPz90jltgA7zownN+6C0Nowhg+JqEvCZbSDSHNDJBLBNdctWJXv18Ad5dJL0jVfDhAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-underline,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=underline],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=underline],.ql-snow.ql-toolbar .ql-picker.ql-underline .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAM1BMVEUAAABLS0tFRUVDQ0NERERDQ0NFRUVFRUVERERDQ0NERERFRUVERERERERERERERERERESvCHKbAAAAEHRSTlMAERpMbW6Bgry9xMXh5PP51ZZfkwAAAEdJREFUeNq9yEEKgDAMRNHERDWq6dz/tFLBQUC6KfRtPnzpsh/sC2AHrcRUo0iuDXONI7gMxVW9wIQWPFb5sMgMk5YTdMmvGw2DA8yS9di7AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-underline.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=underline].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=underline].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-underline .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-underline:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=underline]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=underline]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-underline .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAM1BMVEUAAAAAadIAYs4AZc0AZcwAZswAZ84AZswAZs0AZ8wAZcwAZs0AZswAZswAZswAZswAZsycBlETAAAAEHRSTlMAERpMbW6Bgry9xMXh5PP51ZZfkwAAAEdJREFUeNq9yEEKgDAMRNHERDWq6dz/tFLBQUC6KfRtPnzpsh/sC2AHrcRUo0iuDXONI7gMxVW9wIQWPFb5sMgMk5YTdMmvGw2DA8yS9di7AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-strike,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=strike],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=strike],.ql-snow.ql-toolbar .ql-picker.ql-strike .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAn1BMVEUAAAAAAACAgIBAQEA7OztAQEBLS0tHR0dAQEBJSUlGRkZERERCQkJERERDQ0NERERERERDQ0NFRUVERERERERERERERERERERFRUVERERERERERERFRUVDQ0NFRUVERERFRUVFRUVERERFRUVFRUVFRUVERERFRUVFRUVERERERERERERERERERERERERERERERERERERERERERERERERfrjwTAAAANHRSTlMAAQIMDRAREhQVKCk6PEhLT1xkZWZ4e4CCg4SIiZucoaersLK2wcTFydLX2ODi5err8fX3BKZfrQAAAH5JREFUGBmlwOEWgTAYBuC3isgMxCYAmwRh++7/2qRzttP/HnQTZjdjilkALzhR4wBvQiaLk8WXOJwlHVHjYgxnSmbeR0swGEkpxWZ3vt7fL/w9P4/ist+KdZ7zYYiWiCnScFYiRq1HFo4mxaKIKdJw0ooaVQovkaW1pUzQyQ86Agx4yKmWPAAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-strike.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=strike].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=strike].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-strike .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-strike:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=strike]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=strike]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-strike .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAolBMVEUAAAAAAP8AgP8AatUAYsQAYM8AadIAY8YAZswAYc4AZswAZM0AZcoAZswAZ8oAZswAZMsAZ8oAZswAZcoAZ8sAZswAZssAZssAZs0AZswAZ8wAZs0AZ8wAZs0AZswAZ8wAZ8wAZs0AZ8wAZ8wAZs0AZs0AZs0AZcwAZs0AZcwAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsyiCU+yAAAANXRSTlMAAQIMDRAREhQVKCk6PEhLT1xkZWZ4e4CAgoOEiImbnKGnq7CytsHExcnS19jg4uXq6/H190B1i7AAAAB/SURBVBgZpcDhFoEwGAbgt4pIBmImAJsEYfvu/9ZU52yn/z3oxk/vWuczD453psYRzoR0GkaLHzFYSzqhwvgY1pT0vI8WbzASQvDt/nJ7fN6ovb7P/HrYrTdZxoY+WoJEkoK14iEqPTKwFMkkCBJJClZcUqOM4USiMKYQETr5A2SVDLpJv6ZtAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-link,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=link],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=link],.ql-snow.ql-toolbar .ql-picker.ql-link .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAllBMVEUAAAD///9VVVVJSUk5OTlAQEBHR0dFRUVCQkJHR0dBQUFCQkJGRkZDQ0NGRkZFRUVCQkJDQ0NERERDQ0NERERFRUVERERFRUVDQ0NERERFRUVERERERERFRUVERERERERERERERERFRUVERERFRUVFRUVERERERERERERERERERERERERERERERERERERERERERERERETx5KUoAAAAMXRSTlMAAAYHCQwZGiMkJzIzOUJOYGNlfoCJl5ibnaCxtLa8xsfIycrQ1OHi5uvs7e/19vn8NGTYeAAAAJdJREFUeNqN0McOgkAARdGnFJWiKGBhEEFpSn3//3OGjMmQ6MK7PMuLxVe/CXDTPl5DJmk3cOTTmZE7MDQES11RyhBY5vQU9aOB2z3gWVFMsXywYx3t9Q9tXsyDjlOVLQlOyanOL1ibkqB7l5odM01QSJqK6GdXmGwUHVhowImJIr2iMI9sLUWwa5LtFjPCSjSJBUl//HoDlmQPy0DFuCkAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-link.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=link].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=link].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-link .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-link:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=link]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=link]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-link .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAmVBMVEUAAAD///8AVdUAbdsAccYAatUAZswAYs4AZswAY80AacsAZswAZM0AZ8kAZM0AZcsAZcoAZMsAZcoAZcoAZssAZs0AZs0AZ8wAZs0AZswAZs0AZswAZs0AZswAZs0AZs0AZs0AZ8wAZswAZcwAZs0AZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsy/jsjWAAAAMnRSTlMAAAYHCQwZGiMkJzIzOUJOYGNlfoCAiZeYm52gsbS2vMbHyMnK0NTh4ubr7O3v9fb5/BM/koAAAACXSURBVHjajdDbEoFQAIXhpROqiAjaSdGJSq33fzjTbDO7GS78l9/lj9lXvwnw0le8gEzSuufAhzshr2doCpaGopQhoOX0Fb0GE9fbnidFMYV2Z8c62hgfWj6Z7zqOVY4kuCXHuqBgbUmC4Z9rdsx0QSFpLGKQXWCxUbRloQNHJoqMisI6sLUVwalJtitMCHPRJDYk/fHrDdIHECSPJag6AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-image,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=image],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=image],.ql-snow.ql-toolbar .ql-picker.ql-image .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAElBMVEUAAABERERERERFRUVEREREREQbmEZBAAAABXRSTlMAeMTFxj7M9NAAAABBSURBVAjXY2DAD1RDQSAYyAqFABALLANmMRnAWMwODIIMUFnGUAEIS1A0NADMYgTqhLBY4SyEKXCTTcGMEAJuAgBa9RKl6Fva+wAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-image.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=image].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=image].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-image .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-image:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=image]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=image]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-image .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAElBMVEUAAAAAZswAZcwAZs0AZs0AZszYB6XUAAAABXRSTlMAeMTFxj7M9NAAAABBSURBVAjXY2DAD1RDQSAYyAqFABALLANmMRnAWMwODIIMUFnGUAEIS1A0NADMYgTqhLBY4SyEKXCTTcGMEAJuAgBa9RKl6Fva+wAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-list,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=list],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=list],.ql-snow.ql-toolbar .ql-picker.ql-list .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAS1BMVEUAAABCQkJFRUVGRkZFRUVCQkJFRUVDQ0NFRUVFRUVFRUVERERERERERERERERFRUVERERERERERERERERERERERERERERERERERET32eciAAAAGHRSTlMAMjRCQ0lOfYKQlJmaocTFxuHi5OXm9falfyKhAAAATElEQVR42mMgFnCKYIpJMDDwSUABP1yIHyYkABYRlBAmwngucV50IXZGIXTjmQTZ0I0XIcp4DjEedCFWFlF041mZRdCN5xDjZiAdAACXwgbrzvG+ZgAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-list.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=list].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=list].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-list .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-list:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=list]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=list]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-list .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAS1BMVEUAAAAAZswAZ8kAZM0AZ8oAZcsAZcsAZswAZswAZ80AZs0AZs0AZ80AZ8wAZcwAZs0AZs0AZswAZswAZswAZswAZswAZswAZswAZswCB3gJAAAAGHRSTlMAMjRCQ0lOfYKQlJmaocTFxuHi5OXm9falfyKhAAAATElEQVR42mMgFnCKYIpJMDDwSUABP1yIHyYkABYRlBAmwngucV50IXZGIXTjmQTZ0I0XIcp4DjEedCFWFlF041mZRdCN5xDjZiAdAACXwgbrzvG+ZgAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-bullet,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bullet],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bullet],.ql-snow.ql-toolbar .ql-picker.ql-bullet .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAABERERFRUVERERERETRGyWnAAAABHRSTlMAxMXG4b8ciAAAABxJREFUCNdjYMAPhBhdgMAJyFJmArGcGRgGXAcA/t0ImAOSO9kAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-bullet.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bullet].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bullet].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-bullet .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-bullet:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=bullet]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=bullet]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-bullet .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAAAAZcwAZs0AZs0AZsyEYJIjAAAABHRSTlMAxMXG4b8ciAAAABxJREFUCNdjYMAPhBhdgMAJyFJmArGcGRgGXAcA/t0ImAOSO9kAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-authorship,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=authorship],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=authorship],.ql-snow.ql-toolbar .ql-picker.ql-authorship .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAARVBMVEUAAABFRUVFRUUAAAAAAABERERDQ0NEREQAAABERERERERERERERERERERFRUVERERERERERERERERERERERERERERERERVeSBUAAAAFnRSTlMAMDtOT1JfYmassMfN09Ta6vD4+fz9w8DTTwAAAExJREFUGBmVwEkSgCAMBMBRQUEU4zb/f6oFF5KbNLp4EQ8rkxnWQ76whBRYkYwwxo08ZijDzWJBs7La0ZysLjSJVUKXKSgOhQuKw08fJOYE1SddZQoAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-authorship.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=authorship].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=authorship].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-authorship .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-authorship:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=authorship]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=authorship]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-authorship .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAARVBMVEUAAAAAZcoAaMsAZc4AZ8sAZ8oAZswAZcsAZ80AZs0AZ8wAZ8wAZswAZswAZswAZs0AZswAZswAZswAZswAZswAZswAZszAoUIuAAAAFnRSTlMAMDtOT1JfYmassMfN09Ta6vD4+fz9w8DTTwAAAExJREFUGBmVwEkSgCAMBMBRQUEU4zb/f6oFF5KbNLp4EQ8rkxnWQ76whBRYkYwwxo08ZijDzWJBs7La0ZysLjSJVUKXKSgOhQuKw08fJOYE1SddZQoAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-color,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=color],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=color],.ql-snow.ql-toolbar .ql-picker.ql-color .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAgVBMVEUAAAAAAACAgIBAQEBVVVVDQ0NGRkZGRkZFRUVERERDQ0NDQ0NDQ0NCQkIAAABFRUUAAABDQ0NEREREREREREQAAABDQ0NDQ0NERERFRUVERERERERERERDQ0NERERERERFRUVFRUVERERERERERERERERERERERERERERERERERERLPkdWAAAAKnRSTlMAAQIEBhMWISUtLkVMTU5OT1BTVlpmeX6OkJmdvL3GztTj5/Hy8/b3/f5utmv0AAAAX0lEQVR42pXIRQ6AQABDUdzd3bX3PyCWwAwr+Is2ecyvuKriXmQD5otKoKBFQz+sKkU5khQZKdK8yMoyiQTFOIseEbqLWv6mAPW+bAPvJmN0j/N7nfmTFRI5Jzk0fWwD4sYJPnqIyzwAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-color.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=color].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=color].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-color .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-color:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=color]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=color]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-color .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAgVBMVEUAAAAAAP8AgP8AgL8AVdUAa8kAaNEAZMkAZ8gAZswAZM0AZMsAZc0AZ8oAZcsAZc4AZ8sAZswAZcsAZc0AZswAZ80AZcoAZcoAZs0AZ80AZs0AZs0AZs0AZ8wAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsy3JBcuAAAAKnRSTlMAAQIEBhMWISUtLkVMTU5OT1BTVlpmeX6OkJmdvL3GztTj5/Hy8/b3/f5utmv0AAAAX0lEQVR42pXIRQ6AQABDUdzd3bX3PyCWwAwr+Is2ecyvuKriXmQB5otKoKBFQz+sKkU5khQZKdK8yMoyiQTFOIseEbqLWv6mAPW+bAPvJmN0j/N7nfmTHRI5Jzk0fWwD4foJPqgJbeoAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-background,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=background],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=background],.ql-snow.ql-toolbar .ql-picker.ql-background .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAnFBMVEUAAAAAAACAgIBAQEAAAABVVVUAAAAAAAAAAABDQ0MAAABGRkZGRkYAAABFRUVERERDQ0MAAAAAAAAAAAAAAABDQ0MAAABDQ0MAAABCQkJFRUVDQ0NERERERERERERDQ0NDQ0NERERFRUVERERERERERERDQ0NERERERERFRUVFRUVERERERERERERERERERERERERERERERERERETMTXVbAAAAM3RSTlMAAQIEBgYHCBMTFBYhIyUtLjE2N0JFS0xNTU5QU1ZaeX6OkJmdvL3GztTj5/Hy8/b3/f5Qd6EEAAAAf0lEQVR42o2PRw6DQBRDHVJISCUhvTd69/3vhgT6MLPDmoX15KfRR++c6mdKgVIOTRFoeJ6hE+tCnjXRgUv+oc02jJNyrYk/vj/8jhRxnheLVZHNupn1Yp3nVIgzjhoUDlvxQR/AIOBtKbNjerUB+x7vhZjARPkLyslbYIe+qQDqMQxGJwkBGwAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-background.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=background].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=background].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-background .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-background:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=background]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=background]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-background .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAMAAABhEH5lAAAAllBMVEUAAAAAAP8AgP8AgL8AVdUAbbYAYL8Aa8kAZswAaNEAZMkAZswAZ8gAZswAZM0AaMsAaNAAZswAZM0AZMsAZswAZc0AZ8oAZ80AZcsAZswAZcsAZc0AZswAZcoAZcoAZs0AZ80AZs0AZs0AZs0AZ8wAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsy8dW5vAAAAMXRSTlMAAQIEBgcIExQWISMlLS4xNjdCRUtMTU1OUFNWWnl+jpCZnby9xs7U4+fx8vP29/3+dqGBzgAAAH5JREFUeNqNj0cOg0AUQx1CgFQS0nujd9//ckigDzM7rFlYT34afYzOuX2WFCjl0BWBRhAYOnEu5EkTPfjkH9pswzSr15r44/vDr6mI87JarKrCHmbOi22ethDPTDoUT3vxwRDAJOJtKbNjfnUB957uhVjATPkLyslbYIexaQB/ngudkm14XQAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-left,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=left],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=left],.ql-snow.ql-toolbar .ql-picker.ql-left .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAABERERFRUVERERERETRGyWnAAAABHRSTlMAxMXG4b8ciAAAAClJREFUCNdjYMAPRFxcnCAsFRcXZwYiAFCHC0STCpjlTJwOJwaYDoIaAKIACBBRNsu4AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-left.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=left].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=left].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-left .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-left:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=left]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=left]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-left .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAAAAZcwAZs0AZs0AZsyEYJIjAAAABHRSTlMAxMXG4b8ciAAAAClJREFUCNdjYMAPRFxcnCAsFRcXZwYiAFCHC0STCpjlTJwOJwaYDoIaAKIACBBRNsu4AAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-right,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=right],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=right],.ql-snow.ql-toolbar .ql-picker.ql-right .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAABERERFRUVERERERETRGyWnAAAABHRSTlMAxMXG4b8ciAAAAChJREFUCNdjYCAIRFxcnCAsFRcXZ2KUu0B0qIBZzgzEaXFigGkhpAMAmbwIEMJ9k/cAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-right.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=right].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=right].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-right .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-right:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=right]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=right]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-right .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAAAAZcwAZs0AZs0AZsyEYJIjAAAABHRSTlMAxMXG4b8ciAAAAChJREFUCNdjYCAIRFxcnCAsFRcXZ2KUu0B0qIBZzgzEaXFigGkhpAMAmbwIEMJ9k/cAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-center,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=center],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=center],.ql-snow.ql-toolbar .ql-picker.ql-center .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAABERERFRUVERERERETRGyWnAAAABHRSTlMAxMXG4b8ciAAAAC1JREFUCNdjYCAAGF1cXBTALCYgy4CBIBBxAQEnIEsFzHJmIMYKiCVMYBYhSwCyqQhMfft6AQAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-center.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=center].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=center].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-center .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-center:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=center]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=center]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-center .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAAAAZcwAZs0AZs0AZsyEYJIjAAAABHRSTlMAxMXG4b8ciAAAAC1JREFUCNdjYCAAGF1cXBTALCYgy4CBIBBxAQEnIEsFzHJmIMYKiCVMYBYhSwCyqQhMfft6AQAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-justify,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=justify],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=justify],.ql-snow.ql-toolbar .ql-picker.ql-justify .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAAAD1BMVEUAAABERERFRUVERERERETRGyWnAAAABHRSTlMAxMXG4b8ciAAAABpJREFUCNdjYMAPRFxAwAnIUgGznBkYBlwHAJGzCjB/C3owAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-justify.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=justify].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=justify].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-justify .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-justify:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=justify]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=justify]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-justify .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAALklEQVR42mMYvoARzko9cwTIsyZR+zGGWcZgPUwIMUZGShwyGtijgT0a2EMMAADESwwWta/i5QAAAABJRU5ErkJggg==)}@media (-webkit-min-device-pixel-ratio:2){.ql-snow.ql-toolbar .ql-picker .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAIVBMVEUAAABCQkJDQ0NDQ0NERERERERERERERERERERERERERERehmmoAAAACnRSTlMATVRbaeXo6fz+NPhZJgAAAF9JREFUKM9jYBjkQC0JXYS5a4UBmpDFqlXN6IpWrUJTprEKCJpQhLJAQsswhZaiCImDhAJp5kMxkPGJZLjLEiQ0GUWIZdaqVSsdUM33XLVqCpqVLLPQFTEwmAcP9qQAAFUgKabkwE6gAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-picker.ql-expanded .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAJFBMVEWqqqr////AwMDAwMDAwMDBwcHBwcHBwcHBwcHBwcHBwcHBwcEexLCPAAAAC3RSTlMAAE1UW2nl6On8/tZA57EAAABxSURBVHjazc4hFkBAGMTxL3AAp+AGniYiyaLnBETHoKkknbc7l7OrzW7zhP3HX5mRxCskEsknEaZoU6VDNbAyRRugSqICpoVotnT7dBFllnpefPuHUpjGD78aSztRfAK65cUOOIQpPnXrkFSDEFFB0APtK1HCkKpz1wAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-picker.ql-active:not(.ql-expanded) .ql-picker-label,.ql-snow.ql-toolbar:not(.ios) .ql-picker:not(.ql-expanded) .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAIVBMVEUAAAAAZ8oAZMsAZc0AZswAZswAZswAZswAZswAZswAZswhMkyGAAAACnRSTlMATVRbaeXo6fz+NPhZJgAAAF9JREFUKM9jYBjkQC0JXYS5a4UBmpDFqlXN6IpWrUJTprEKCJpQhLJAQsswhZaiCImDhAJp5kMxkPGJZLjLEiQ0GUWIZdaqVSsdUM33XLVqCpqVLLPQFTEwmAcP9qQAAFUgKabkwE6gAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-bold,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bold],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bold],.ql-snow.ql-toolbar .ql-picker.ql-bold .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAxlBMVEUAAABVVVUzMzNVVVVJSUlGRkZAQEBJSUlAQEBAQEBAQEBHR0dCQkJGRkZAQEBGRkZCQkJERERDQ0NDQ0NGRkZERERDQ0NFRUVCQkJFRUVERERDQ0NDQ0NFRUVDQ0NERERERERERERERERERERERERERERERERERERFRUVDQ0NERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERfjmwgAAAAQXRSTlMAAwUGBwsMDhAUGBkbHSAhIykuOUJERUpNUVZYXGRne3yAi4+SmqWmq67R1tfY2dve5ujp7/Dy8/T19vf4+fv8/mUg1b0AAACrSURBVDjL5dPFDgJBEEXRxt3d3d11gPv/P8WCEAgZuno/b1WLk1TqJaWUI1Jc8852Mqz5bdHHALDK2CF+ckgYIHp/0GtypxpHYKlFSqkycJeQD7hIKADMJFQHulrkSrYs2MflCnZZgzKvo7RJmZeSAWIf1V3nihSGAG19BUq1gKmEQsBZQkHAklATmOuQN5zvP4COQQWnmIxuFfERWOTsXmrztWg8qHqUU/IEzOhNFx6Ncl4AAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-bold.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bold].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bold].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-bold .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-bold:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=bold]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=bold]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-bold .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAxlBMVEUAAAAAVaoAZswAVdUAbdsAXdEAatUAbcgAYM8AZswAasoAZswAaNAAasoAaMcAZMkAZswAZM0AZM0AZ8kAZM0AZcsAZMsAZMsAZ8oAZc0AZc0AZcsAZ8oAZswAZssAZssAZcwAZssAZ80AZs0AZ8wAZ80AZswAZ8wAZ8wAZ8wAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsyeO+aMAAAAQXRSTlMAAwUGBwsMDhAUGBkbHSAhIykuOUJERUpNUVZYXGRne3yAi4+SmqWmq67R1tfY2dve5ujp7/Dy8/T19vf4+fv8/mUg1b0AAACrSURBVDjL5dPFDgJBEEXRxt3d3d11gPv/P8WCEAgZuno/b1WLk1TqJaWUI1Jc8852Mqz5bdHHALDK2CF+ckgYIHp/0GtypxpHYKlFSqkycJeQD7hIKADMJFQHulrkSrYs2MflCnZZgzKvo7RJmZeSAWIf1V3nihSGAG19BUq1gKmEQsBZQkHAklATmOuQN5zvP4COQQWnmIxuFfERWOTsXmrztWg8qHqUU/IEzOhNFx6Ncl4AAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-italic,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=italic],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=italic],.ql-snow.ql-toolbar .ql-picker.ql-italic .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAjVBMVEUAAAAAAACAgIBAQEBVVVVAQEBAQEBCQkJCQkJFRUVDQ0NBQUFDQ0NDQ0NDQ0NFRUVERERERERERERDQ0NERERDQ0NERERERERERERFRUVFRUVERERFRUVERERERERDQ0NERERERERERERDQ0NFRUVEREREREREREREREREREREREREREREREREREREREQUqV1+AAAALnRSTlMAAQIEBggMGyMlKisuUFhZXmJmb3R9hIiKjZGTlKWprrG0uL3BxObt8PL19/j9SqrrawAAAIJJREFUOMvl0jUOQgEQRVHc3d1dzv6XRwch+WRq4NYnmVdMKvU35RZXz+7LQiJqe6uXiDrvqJuI8vM7ALd14fOwIabR+i1agUmfUA1QGedMgJrYRZPGGEVoh0ZgMmeUAlTBMbrWwiZCEwwitEc9MNkLigGq4RBda2MVoRn6X/jfv9YDjuYgGnCpSqcAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-italic.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=italic].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=italic].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-italic .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-italic:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=italic]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=italic]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-italic .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAjVBMVEUAAAAAAP8AgP8AgL8AVdUAYL8AatUAaNAAZswAZ8gAZ8gAZcoAZM0AZswAZcsAZMsAZMsAZcsAZ8sAZcoAZcoAZswAZs0AZ8wAZs0AZ8wAZswAZs0AZs0AZswAZ8wAZ8wAZs0AZswAZ8wAZ8wAZs0AZcwAZswAZswAZswAZswAZswAZswAZswAZswAZsyyI9XbAAAALnRSTlMAAQIEBggMGyMlKisuUFhZXmJmb3R9hIiKjZGTlKWprrG0uL3BxObt8PL19/j9SqrrawAAAIJJREFUOMvl0jUOQgEQRVHc3d1dzv6XRwch+WRq4NYnmVdMKvU35RZXz+7LQiJqe6uXiDrvqJuI8vM7ALd14fOwIabR+i1agUmfUA1QGedMgJrYRZPGGEVoh0ZgMmeUAlTBMbrWwiZCEwwitEc9MNkLigGq4RBda2MVoRn6X/jfv9YDjuYgGnCpSqcAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-underline,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=underline],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=underline],.ql-snow.ql-toolbar .ql-picker.ql-underline .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAWlBMVEUAAAAAAAAzMzNAQEBGRkZERERERERCQkJERERDQ0NFRUVERERERERFRUVERERERERERERFRUVERERERERERERDQ0NFRUVERERERERERERERERERERERERERET15sOLAAAAHXRSTlMAAQUMLC04TU9UVYePkJKkxMXG2Nrf4+jz9/n6/qlZ0HQAAACUSURBVHja7Y3BDsIgEAW3UCmCFatQxLL//5uuiQ0py1EPxs5tHhMW/oMhxoF5TUSMzGuQqH2PfiO60yiLStIHi260qqKKNLDI0XouOpI6Fh1f/x9W6xOpYZHwNM/9u5lJvACGzvSQRiWlOiUkNDSwuMFCi87mkmTbQRvt18aXWwxhXFiW4IyAr3LBJtMmmtrRFT7ME0B0HEswIOSJAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-underline.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=underline].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=underline].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-underline .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-underline:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=underline]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=underline]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-underline .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAWlBMVEUAAAAAAP8AZswAatUAaMsAZswAZM0AZ8oAZMsAZMsAZswAZswAZs0AZ80AZ8wAZ8wAZcwAZs0AZs0AZswAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZszogqY1AAAAHXRSTlMAAQUMLC04TU9UVYePkJKkxMXG2Nrf4+jz9/n6/qlZ0HQAAACUSURBVHja7Y3BDsIgEAW3UCmCFatQxLL//5uuiQ0py1EPxs5tHhMW/oMhxoF5TUSMzGuQqH2PfiO60yiLStIHi260qqKKNLDI0XouOpI6Fh1f/x9W6xOpYZHwNM/9u5lJvACGzvSQRiWlOiUkNDSwuMFCi87mkmTbQRvt18aXWwxhXFiW4IyAr3LBJtMmmtrRFT7ME0B0HEswIOSJAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-strike,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=strike],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=strike],.ql-snow.ql-toolbar .ql-picker.ql-strike .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAABLFBMVEUAAACAgIBVVVVAQEAzMzNVVVVAQEA5OTlNTU1JSUlERERHR0dDQ0NGRkZDQ0NAQEBCQkJAQEBGRkZAQEBGRkZERERBQUFERERGRkZCQkJGRkZERERFRUVERERDQ0NFRUVERERDQ0NFRUVCQkJDQ0NFRUVCQkJDQ0NERERDQ0NERERERERDQ0NFRUVERERERERERERERERFRUVERERDQ0NFRUVERERERERFRUVERERERERDQ0NDQ0NFRUVERERERERFRUVERERERERFRUVERERERERDQ0NERERFRUVERERERERERERFRUVERERERERERERERERFRUVERERERERERERFRUVERERERERERERERERERERERERERERERERERERERERERERERERERERERET5TTiyAAAAY3RSTlMAAgMEBQYICQoODxITFhcYGxwdICEtLzEzNjc4P0BFRkdISk1YWWBjaWtsdHZ3f4CHiImKjJGSk5SVl5ufo6Smp625uru8vb/BwsPExcbMzs/Q0dPi4+Tl6+zv8PL19vf4+/z2SQ4sAAABE0lEQVQ4y2NgGDmAV8c5PCkxxFGDE6cSDuOEZCiI0WXGroY/OBkJeHJhU8Pkm4wCXBixKFIHyUTqibJzS5lEgNhqWBT5AMWD+CFsHg8gxxuLoniguCyMIwLkxGFRBPKZDKEw8gMqCuAloEgb7HADMTZ8ijisjHTUlCSFOdgFxeVUNPXM7Z38QmJ9EApQxFFCyxeuxhtFPC7U39nBQl9LVV5CiAMpiFDEOYQlldR0jGwM8DmOVVDRLBpkpDIBr/KBXOBKKNSEgYpiMUQjgaLChBQ5A0W94AHO6wXkumEoUgY5NcpUUYCFRUDBNAqHw22T0YAdNp9bo6qxZMLqI4VAhJIgBZwelzZ0D4uLC3M3lB5B5QgAFQdgZ6NzzvYAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-strike.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=strike].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=strike].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-strike .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-strike:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=strike]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=strike]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-strike .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAABLFBMVEUAAAAAgP8AVaoAgL8AZswAVdUAYL8AccYAZswAbcgAZswAY8YAa8kAaNEAZMgAasoAaNAAZMgAasoAaMcAZMkAZswAZ8kAaMsAZM0AaMsAZswAZM0AZcoAZMsAZMsAZswAZc0AZ8oAZMsAZ8oAZcsAZMsAZcoAZMsAZswAZssAZssAZcoAZssAZcwAZssAZs0AZswAZ8wAZs0AZs0AZswAZswAZ8wAZs0AZs0AZ80AZ8wAZswAZ8wAZs0AZ8wAZ8wAZs0AZs0AZswAZ8wAZs0AZs0AZ8wAZcwAZs0AZ8wAZswAZcwAZs0AZs0AZ8wAZswAZswAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswL5dPDAAAAY3RSTlMAAgMEBQYICQoODxITFhcYGxwdICEtLzEzNjc4P0BFRkdISk1YWWBjaWtsdHZ3f4CHiImKjJGSk5SVl5ufo6Smp625uru8vb/BwsPExcbMzs/Q0dPi4+Tl6+zv8PL19vf4+/z2SQ4sAAABE0lEQVQ4y2NgGDmAV8c5PCkxxFGDE6cSDuOEZCiI0WXGroY/OBkJeHJhU8Pkm4wCXBixKFIHyUTqibJzS5lEgNhqWBT5AMWD+CFsHg8gxxuLoniguCyMIwLkxGFRBPKZDKEw8gMqCuAloEgb7HADMTZ8ijisjHTUlCSFOdgFxeVUNPXM7Z38QmJ9EApQxFFCyxeuxhtFPC7U39nBQl9LVV5CiAMpiFDEOYQlldR0jGwM8DmOVVDRLBpkpDIBr/KBXOBKKNSEgYpiMUQjgaLChBQ5A0W94AHO6wXkumEoUgY5NcpUUYCFRUDBNAqHw22T0YAdNp9bo6qxZMLqI4VAhJIgBZwelzZ0D4uLC3M3lB5B5QgAFQdgZ6NzzvYAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-link,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=link],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=link],.ql-snow.ql-toolbar .ql-picker.ql-link .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAABDlBMVEUAAAD///8AAACAgIBVVVVAQEAzMzNVVVVAQEBNTU1HR0dAQEBJSUlGRkZDQ0NAQEBERERHR0dGRkZDQ0NBQUFGRkZERERCQkJGRkZFRUVCQkJFRUVERERDQ0NDQ0NCQkJFRUVDQ0NERERDQ0NFRUVDQ0NFRUVFRUVFRUVFRUVERERDQ0NFRUVERERFRUVERERERERDQ0NFRUVFRUVERERERERERERERERFRUVERERERERERERFRUVDQ0NERERERERFRUVERERERERERERERERERERERERERERERERERERERERFRUVERERERERERERERERERERERERERERERERERERERERERERERERERERERESFPz0UAAAAWXRSTlMAAAECAwQFBggKEhQVFhccHiQoKissLTIzNDpGR0hMTU5QUlRVW12BgoaHjI2PmJmam5ygpKWosbKztLW6vcDD0NLT2Nna3N7g4eLj5Ofo6err7u/w8vn7/A90CXkAAAFqSURBVDjLzdTHUgJREIXho8yo6JgFc0LFjAkVMZAFJYrCzP/+L+JCtJipS5U7Patbt79Vd1dr6BfRHyBJUiie6dSSiwrEh2aeAPAO7cEoUqWXdHgQirQAOh7A46gZzVQBzsfmSgAnRhR6AjiS5OQAd9aE4t9GmqoCCRPKAGe9zzhQDxlQBzpjknab9c2RD2DBgGrgzUlqQnfrHlg3oGug6Eh1oFsAEtvLVhAteUBuSjseP2lfzQf6dARQjY/s9SncY9uH7DQA7+ky/XkI+8YSfvRVC6k3AO4s34BHT90+1N2yYq8A+/5V0Wyi0ac2NJkD3KgfSaGF9QRQ9oCC5JSAiyCStA2k9jzISooCFQNaBlpWrJBdkTThQsOA7DYQ+3pbKeDWgHQFvDiSNJwEWDWheRfIOZKVBLiRCekYoBiZSAHkx83IfgDABXielhkpfAcAkJ/WICTrwAXgZlyDkRS9rDRu1wJL98/u0yeVYHcP1mwWWgAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-link.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=link].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=link].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-link .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-link:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=link]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=link]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-link .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAABDlBMVEUAAAD///8AAP8AgP8AVaoAgL8AZswAVdUAYL8AZswAY8YAZswAYc4AaNEAZMgAZMgAZswAY80AZswAZ8gAZcoAaMsAZswAZswAZM0AZ8kAZcoAZswAZc0AZ8oAZc0AZ8oAZcsAZswAZ8oAZMsAZswAZc0AZcsAZ84AZswAZ84AZswAZswAZ8wAZs0AZs0AZs0AZ80AZswAZ8wAZswAZ8wAZswAZs0AZs0AZs0AZ8wAZswAZ8wAZ8wAZ8wAZs0AZswAZs0AZswAZswAZswAZswAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsxCnEEHAAAAWXRSTlMAAAECAwQFBggKEhQVFhccHiQoKissLTIzNDpGR0hMTU5QUlRVW12BgoaHjI2PmJmam5ygpKWosbKztLW6vcDD0NLT2Nna3N7g4eLj5Ofo6err7u/w8vn7/A90CXkAAAFqSURBVDjLzdTHUgJREIXho8yo6JgFc0LFjAkVMZAFJYrCzP/+L+JCtJipS5U7Patbt79Vd1dr6BfRHyBJUiie6dSSiwrEh2aeAPAO7cEoUqWXdHgQirQAOh7A46gZzVQBzsfmSgAnRhR6AjiS5OQAd9aE4t9GmqoCCRPKAGe9zzhQDxlQBzpjknab9c2RD2DBgGrgzUlqQnfrHlg3oGug6Eh1oFsAEtvLVhAteUBuSjseP2lfzQf6dARQjY/s9SncY9uH7DQA7+ky/XkI+8YSfvRVC6k3AO4s34BHT90+1N2yYq8A+/5V0Wyi0ac2NJkD3KgfSaGF9QRQ9oCC5JSAiyCStA2k9jzISooCFQNaBlpWrJBdkTThQsOA7DYQ+3pbKeDWgHQFvDiSNJwEWDWheRfIOZKVBLiRCekYoBiZSAHkx83IfgDABXielhkpfAcAkJ/WICTrwAXgZlyDkRS9rDRu1wJL98/u0yeVYHcP1mwWWgAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-image,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=image],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=image],.ql-snow.ql-toolbar .ql-picker.ql-image .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAFVBMVEUAAABCQkJEREREREREREREREREREQL6X1nAAAABnRSTlMATXjl6OmAFiJpAAAAZklEQVR42sXQsQ3AIAxEUeQZoKdyzwg0DALo9h8hiCYXo4R0/MbSK1ycO5EHlScVpj4Jj97p/vtJPi9U+kptXIlMIY2r1b4XIBpSoDJJFIyYtKohAWBIV8Ke9kv8X7WwtEmBKbkDXfWkWdehkaSCAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-image.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=image].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=image].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-image .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-image:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=image]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=image]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-image .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAFVBMVEUAAAAAZ8oAZswAZswAZswAZswAZsx4QzxlAAAABnRSTlMATXjl6OmAFiJpAAAAZklEQVR42sXQsQ3AIAxEUeQZoKdyzwg0DALo9h8hiCYXo4R0/MbSK1ycO5EHlScVpj4Jj97p/vtJPi9U+kptXIlMIY2r1b4XIBpSoDJJFIyYtKohAWBIV8Ke9kv8X7WwtEmBKbkDXfWkWdehkaSCAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-list,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=list],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=list],.ql-snow.ql-toolbar .ql-picker.ql-list .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAw1BMVEUAAAAAAABVVVVAQEBERERAQEBJSUlGRkZHR0dFRUVCQkJERERAQEBGRkZDQ0NFRUVDQ0NCQkJGRkZDQ0NCQkJERERDQ0NFRUVERERFRUVERERDQ0NERERERERDQ0NFRUVERERERERERERERERERERERERERERFRUVERERERERERERFRUVERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERESFbZw4AAAAQHRSTlMAAQYIDxAVFhkaGx4gKCo0NTY3OU10fYKIiYqMj56fo6SmqKmvtLe6vr/ExcbLz9fh4uXm5+jp7O/w8vP3+vv9Z7IwDAAAAK1JREFUOMvV0scOglAQQFGwYO+oiIq9YldEFPX+/1e5cGEii2FFdNY3b/JORlF+dAqNrS1GQyDEW+9Id/gaRw9EgQacMNEhuO4caD7rlgDS/2yAVWTiia53HWeEaMLzwUKIdvt08n4TxLMptc1UEo/38YqCuGZzKknimxDi6jpa8Vjn6I4kcQNgLkSmVSvjizeeb9ITbzxXxxLETatSxRfEWwAzicC4uANN+at5AdptTQ0Ubk4LAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-list.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=list].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=list].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-list .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-list:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=list]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=list]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-list .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAw1BMVEUAAAAAAP8AVdUAYL8AZswAYM8AYc4AaNEAZswAYs4AaNAAZswAaMcAZswAZ8gAZ8kAZcoAaMsAZswAZ8kAZ8oAZcoAZswAZswAZ8wAZs0AZs0AZswAZs0AZs0AZ8wAZs0AZ8wAZ8wAZs0AZ8wAZswAZswAZs0AZ8wAZswAZcwAZcwAZs0AZs0AZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZszno9YmAAAAQHRSTlMAAQYIDxAVFhkaGx4gKCo0NTY3OU10fYKIiYqMj56fo6SmqKmvtLe6vr/ExcbLz9fh4uXm5+jp7O/w8vP3+vv9Z7IwDAAAAK1JREFUOMvV0scOglAQQFGwYO+oiIq9YldEFPX+/1e5cGEii2FFdNY3b/JORlF+dAqNrS1GQyDEW+9Id/gaRw9EgQacMNEhuO4caD7rlgDS/2yAVWTiia53HWeEaMLzwUKIdvt08n4TxLMptc1UEo/38YqCuGZzKknimxDi6jpa8Vjn6I4kcQNgLkSmVSvjizeeb9ITbzxXxxLETatSxRfEWwAzicC4uANN+at5AdptTQ0Ubk4LAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-bullet,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bullet],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bullet],.ql-snow.ql-toolbar .ql-picker.ql-bullet .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAABCQkJEREREREREREREREQc4xmxAAAABXRSTlMATeXo6UtNtyIAAAAzSURBVCjPY2AYACBsyCAcCgOGYCHTYAZTuFAwRCgISSgILCSiyCACF1JkGBgw6voBcj0AFsUtDasGrUcAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-bullet.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=bullet].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=bullet].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-bullet .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-bullet:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=bullet]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=bullet]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-bullet .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAAAAZ8oAZswAZswAZswAZsxixJGvAAAABXRSTlMATeXo6UtNtyIAAAAzSURBVCjPY2AYACBsyCAcCgOGYCHTYAZTuFAwRCgISSgILCSiyCACF1JkGBgw6voBcj0AFsUtDasGrUcAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-authorship,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=authorship],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=authorship],.ql-snow.ql-toolbar .ql-picker.ql-authorship .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAllBMVEUAAACAgIBAQEBCQkIAAABCQkJAQEBGRkZERERERERCQkJGRkZDQ0NDQ0NDQ0MAAAAAAAAAAABDQ0NFRUVERERFRUVERERFRUVERERFRUVERERERERERERERERERERERERERERFRUVEREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREQe3JVeAAAAMXRSTlMAAhgbHx8gIS0xMjM5VFdcXWZyd3yChImPkKy4yMrO0tPj5ebq7e7v8PLz9/j6/P3+mEwo9QAAAJxJREFUGBnVwNcOgjAYBeCj4l7FjeAGUZzn/V9O0kikSftf44c/0A+Tc9iFqHll7tKEJKAWQLKjtockpZZC8qL2hiSjlkESUYsgmVNbQtKhNoCgNrwz95w14NTe8Os2gUP9wJ8p7NYsebRg06NhAZsVDRFstjQksMlogs2Rhhg2o5glpxGqz1O+g/JQUL6TQkH5TmMUPOU7jD1U1AdG8S1kERvjygAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-authorship.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=authorship].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=authorship].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-authorship .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-authorship:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=authorship]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=authorship]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-authorship .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAllBMVEUAAAAAgP8AasoAaNAAY84AaMcAZMkAZswAaMsAZswAZM0AZ8kAZMsAZ8oAZ8oAZcsAZc4AZ80AZcwAZcwAZcwAZswAZs0AZs0AZs0AZ80AZs0AZ8wAZswAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsyCDIYeAAAAMXRSTlMAAhgbHyAhLTEyMzlUV1xdXWZyd3yChImPkKy4yMrO0tPj5ebq7e7v8PLz9/j6/P3+PxHOPAAAAJxJREFUGBnVwNcOgjAYBeCj1j0q7oEbRHGe9385SSORJu1/jR/+QGcdn9ctiNSVmYuCZEljCcmOxh6ShEYCyYvGG5KURgpJSCOEZEpjDkmTRheCSu/OzHNSg1djw6/bCB7VA3/GcFux4FGHS5uWGVwWtIRw2dISwyWlDS5HWiK49CMWnPooP6UDD62Q04GXRk4HXgPk1DDwGCiU1AcZWy1RmD8CRQAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-color,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=color],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=color],.ql-snow.ql-toolbar .ql-picker.ql-color .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAz1BMVEUAAAAAAACAgIBVVVVAQEBVVVU5OTk7OztLS0tHR0dGRkZCQkIAAABERERDQ0NDQ0NDQ0NDQ0NGRkZERERERERCQkJFRUVERERFRUVEREQAAAAAAABDQ0NFRUVEREQAAABERERFRUVERERDQ0NDQ0NERERERERERERERERERERERERERERERERERERFRUVFRUVERERERERERERERERERERDQ0NERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERbYaT1AAAARHRSTlMAAQIDBAYJDRESFhsfIiYqNUFCREtNVVZZWlxdY2RlZm1zdXZ9hI6Tl6Sws7nExcnS09XY2d/g5ejp6+zt8PP09/n9/idH/qoAAADKSURBVBgZ1cDXUsJAAIXhg2KMGruxsGoUe8cWoij1f/9nYiZDGJjsLrfwaRHEWRZrhuAXWoH8zgBO5VVpADTktU9uVz5P5B7lsdUn19+U2x3w+gbcyilsA0cnwP+qXOpAWl1pAhdyqKZAXboGvpZkdwi0Q2m9CxzI7oUJz7LaYdJgWzYPTLmXxUaPKZ01ld0A7xXllr+BK5VlwLlGLoFPlWXQCjQSduBDZfFPM9bY8V+6p7kXmcTBRCqYxMmoYBKnmgqRSRxqkebUEKsKOlxMa6IbAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-color.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=color].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=color].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-color .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-color:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=color]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=color]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-color .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAA0lBMVEUAAAAAAP8AgP8AVaoAgL8AVdUAccYAYsQAadIAY8YAaNEAaNAAY84AacsAZckAZ8gAZcoAZswAZM0AZcsAZswAZ8oAZswAZc0AZMsAZswAZ8oAZcsAZc4AZMsAZswAZcoAZ80AZcwAZswAZssAZssAZswAZs0AZs0AZs0AZ8wAZ8wAZ8wAZ8wAZswAZcwAZs0AZcwAZswAZswAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswVaivDAAAARXRSTlMAAQIDBAYJDRESFhsfIiYqNUFCREtNVVZZWlxdXWNkZWZtc3V2fYSOk5eksLO5xMXJ0tPV2Nnf4OXo6evs7fDz9Pf5/f6Y2SWXAAAAy0lEQVQYGdXA11LCQACF4YNijBq7sbCWKPaOLURREPjf/5WYyRAGJrvLLXyaB3GWxZoi+IFWIL9TgBN5VRoADXntktuWzyO5B3ls9Mj11uV2C7y8AjdyCtvAwRHwtyyXOpBWl5rAuRyqKVCXroDPBdntA+1QWv0H9mT3zJgnWW0xrr8pm3sm3MlircuEzorKroG3inKLX8ClyjLgTEMXwIfKMmgFGgo78K6y+LsZa+TwN93RzItM4mAiFUziZFQwiVNNheg4cahFmlEDFzs7cwmPHM8AAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-background,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=background],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=background],.ql-snow.ql-toolbar .ql-picker.ql-background .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAA4VBMVEUAAAAAAACAgIBVVVVAQEBVVVU5OTk7OztLS0tHR0dGRkZCQkJERERDQ0NDQ0NDQ0NDQ0NERERCQkJEREQAAAADAwMGBgZDQ0NEREQODg5ERERDQ0NFRUVERERERERERERDQ0MiIiJDQ0MmJiZEREQrKytEREREREQyMjIyMjJEREREREREREQ4ODhERERERERFRUVFRUVERERERERERERERERAQEBERERERERBQUFERERERERERERBQUFERERERERERERBQUFERERERERERERDQ0NERERERERDQ0NERERERESZD8GyAAAASnRSTlMAAQIDBAYJDRESFhsiJio1QURJS01QU1RWWVpjZGVtdXZ4fYCEiI6TnZ6ksLO3ucTFydLT193g4OLl5ebn6enq6+7w8vP39/n+/rihcb4AAADbSURBVHjazZPFDsMwEERdZkpTZmbmpszd//+grhpFSaS1e+khc1jbmrG1z7KZdSXLgvo79M9ziKCkKJIeoUPJA8AxKT6H5QGVE3dlmwJqKqaLwVdRIV1fDfVEdKGXGnoFBXQtDIwnWJp8uswd/XQWy8XD7aqD9srp2uJQ5NElVuiWGKvisLFz6Bpo3ryM+R84iXO6GoFBQ5ouAka9wyRdF0waUHSBpzl09xF0dTRmNnXu2OOiTNDtAKCg7W3jYk7QnQGObu0KvVeAJUFXU9aS/h5Sp0VFtui/s6w+XSJAbiVJ3G0AAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-background.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=background].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=background].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-background .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-background:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=background]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=background]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-background .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAA5FBMVEUAAAAAAP8AgP8AVaoAgL8AZswAVdUAYL8AccYAYsQAadIAY8YAaNEAasoAZswAYsQAaNAAacsAZckAadEAZ8gAZcoAZswAZswAZMkAZM0AZcsAZ8sAZswAaM0AZ8oAZ80AZswAZc0AZMsAZswAZMsAZswAZcoAZcwAZswAZssAZssAZswAZs0AZs0AZs0AZ8wAZ8wAZ8wAZ8wAZswAZcwAZs0AZcwAZswAZswAZs0AZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZswAZsxJPDLdAAAAS3RSTlMAAQIDBAUGCAkNERIWGBkaGyImJyo1N0FCQkRFS0xNTVVWWVpjZGVtc3V2fYSOk5eksLO5xMXJ0tPV2Nnf4OXo6evs7fDz9Pf5/f60OfwzAAABG0lEQVR42s2T6VKDQBCEGyUJoqgSjcYg8dZ43/EieCUa5/3fx661qMAu7O98P4bZnq5lZlkwvXS7k1hf1BTdZFEsFpvUMU15IU7TuKiYJu9d5MODZZ8WcCBk39ZVAKcvpG+ZrgNsimIdTtV0TeBGFNewdBWORTFesUx3QcP9A8N59XT+kPWdPYavOQQVXfVYTtz6gI8jvfUsdRNWe8ApHy8z5ftgm8WhDyx8M4nKumoBd5LjVkkaAdYkz+8qpQLqtK+kwKU5XRPLP1JgNF8y3RkLjw4Us69cnMDb0qdLqR9myjEXz2brNPG2NSKQqOGPRJ5gEr8NYoT/9yHE7mfShoarovYptDw7kiWLyZTbNZBa9saK33tDWZlPK39U3ELkzhssBgAAAABJRU5ErkJggg==)}.ql-snow.ql-toolbar .ql-format-button.ql-left,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=left],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=left],.ql-snow.ql-toolbar .ql-picker.ql-left .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAABCQkJEREREREREREREREQc4xmxAAAABXRSTlMATeXo6UtNtyIAAABCSURBVCjPY2AYACAcCgaGSEKmEKFgTKEgJCERiJAiw0ACqOuR/WCKLBSMKRSE7PqB9YMwuttRnBqMKRSEGvYD6HYAD8opyeJDvUUAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-left.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=left].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=left].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-left .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-left:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=left]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=left]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-left .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAAAAZ8oAZswAZswAZswAZsxixJGvAAAABXRSTlMATeXo6UtNtyIAAABCSURBVCjPY2AYACAcCgaGSEKmEKFgTKEgJCERiJAiw0ACqOuR/WCKLBSMKRSE7PqB9YMwuttRnBqMKRSEGvYD6HYAD8opyeJDvUUAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-right,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=right],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=right],.ql-snow.ql-toolbar .ql-picker.ql-right .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAABCQkJEREREREREREREREQc4xmxAAAABXRSTlMATeXo6UtNtyIAAABCSURBVCjPY2AYMCAcCgaGSEKmEKFgTKEgJCERiJDiwLob2fWmyELBmEJByO4eWNejuN8QNZCRw94U3fUo7h8Q1wMAuRspyVIXC2UAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-right.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=right].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=right].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-right .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-right:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=right]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=right]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-right .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAAAAZ8oAZswAZswAZswAZsxixJGvAAAABXRSTlMATeXo6UtNtyIAAABCSURBVCjPY2AYMCAcCgaGSEKmEKFgTKEgJCERiJDiwLob2fWmyELBmEJByO4eWNejuN8QNZCRw94U3fUo7h8Q1wMAuRspyVIXC2UAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-center,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=center],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=center],.ql-snow.ql-toolbar .ql-picker.ql-center .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAABCQkJEREREREREREREREQc4xmxAAAABXRSTlMATeXo6UtNtyIAAABCSURBVCjPY2AYGCAcCgaGSEKmEKFgTKEgJCERiJAiw4ABqNORPWCKLBSMKRSE7PQB9oAwuuNR3BqMKRSEGvID53gA5GspyQ9EElMAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-center.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=center].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=center].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-center .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-center:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=center]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=center]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-center .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAAAAZ8oAZswAZswAZswAZsxixJGvAAAABXRSTlMATeXo6UtNtyIAAABCSURBVCjPY2AYGCAcCgaGSEKmEKFgTKEgJCERiJAiw4ABqNORPWCKLBSMKRSE7PQB9oAwuuNR3BqMKRSEGvID53gA5GspyQ9EElMAAAAASUVORK5CYII=)}.ql-snow.ql-toolbar .ql-format-button.ql-justify,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=justify],.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=justify],.ql-snow.ql-toolbar .ql-picker.ql-justify .ql-picker-label{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAABCQkJEREREREREREREREQc4xmxAAAABXRSTlMATeXo6UtNtyIAAAAoSURBVCjPY2AYACAcigQMwUKmyELBmEJBYCERZCFFhoEBo64fINcDAAcQNGkJNhVcAAAAAElFTkSuQmCC)}.ql-snow.ql-toolbar .ql-format-button.ql-justify.ql-active,.ql-snow.ql-toolbar .ql-picker .ql-picker-item[data-value=justify].ql-selected,.ql-snow.ql-toolbar .ql-picker .ql-picker-label[data-value=justify].ql-active,.ql-snow.ql-toolbar .ql-picker.ql-justify .ql-picker-label.ql-active,.ql-snow.ql-toolbar:not(.ios) .ql-format-button.ql-justify:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-item[data-value=justify]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker .ql-picker-label[data-value=justify]:hover,.ql-snow.ql-toolbar:not(.ios) .ql-picker.ql-justify .ql-picker-label:hover{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkBAMAAAATLoWrAAAAElBMVEUAAAAAZ8oAZswAZswAZswAZsxixJGvAAAABXRSTlMATeXo6UtNtyIAAAAoSURBVCjPY2AYACAcigQMwUKmyELBmEJBYCERZCFFhoEBo64fINcDAAcQNGkJNhVcAAAAAElFTkSuQmCC)}}.ql-snow .ql-tooltip{border:1px solid #ccc;box-shadow:0 0 5px #ddd;color:#222}.ql-snow .ql-tooltip a{color:#06c}.ql-snow .ql-tooltip .input{border:1px solid #ccc;margin:0;padding:5px}.ql-snow a{color:#06c}@keyframes passing-through{0%{opacity:0;transform:translateY(40px)}30%,70%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}@keyframes slide-in{0%{opacity:0;transform:translateY(40px)}30%{opacity:1;transform:translateY(0)}}@keyframes pulse{0%{transform:scale(1)}10%{transform:scale(1.1)}20%{transform:scale(1)}}.dropzone,.dropzone *{box-sizing:border-box}.dropzone{min-height:150px;border:2px solid rgba(0,0,0,.3);background:#fff;padding:20px 20px}.dropzone.dz-clickable{cursor:pointer}.dropzone.dz-clickable *{cursor:default}.dropzone.dz-clickable .dz-message,.dropzone.dz-clickable .dz-message *{cursor:pointer}.dropzone.dz-started .dz-message{display:none}.dropzone.dz-drag-hover{border-style:solid}.dropzone.dz-drag-hover .dz-message{opacity:.5}.dropzone .dz-message{text-align:center;margin:2em 0}.dropzone .dz-preview{position:relative;display:inline-block;vertical-align:top;margin:16px;min-height:100px}.dropzone .dz-preview:hover{z-index:1000}.dropzone .dz-preview:hover .dz-details{opacity:1}.dropzone .dz-preview.dz-file-preview .dz-image{border-radius:20px;background:#999;background:linear-gradient(to bottom,#eee,#ddd)}.dropzone .dz-preview.dz-file-preview .dz-details{opacity:1}.dropzone .dz-preview.dz-image-preview{background:#fff}.dropzone .dz-preview.dz-image-preview .dz-details{transition:opacity .2s linear}.dropzone .dz-preview .dz-remove{font-size:14px;text-align:center;display:block;cursor:pointer;border:none}.dropzone .dz-preview .dz-remove:hover{text-decoration:underline}.dropzone .dz-preview:hover .dz-details{opacity:1}.dropzone .dz-preview .dz-details{z-index:20;position:absolute;top:0;left:0;opacity:0;font-size:13px;min-width:100%;max-width:100%;padding:2em 1em;text-align:center;color:rgba(0,0,0,.9);line-height:150%}.dropzone .dz-preview .dz-details .dz-size{margin-bottom:1em;font-size:16px}.dropzone .dz-preview .dz-details .dz-filename{white-space:nowrap}.dropzone .dz-preview .dz-details .dz-filename:hover span{border:1px solid rgba(200,200,200,.8);background-color:rgba(255,255,255,.8)}.dropzone .dz-preview .dz-details .dz-filename:not(:hover){overflow:hidden;text-overflow:ellipsis}.dropzone .dz-preview .dz-details .dz-filename:not(:hover) span{border:1px solid transparent}.dropzone .dz-preview .dz-details .dz-filename span,.dropzone .dz-preview .dz-details .dz-size span{background-color:rgba(255,255,255,.4);padding:0 .4em;border-radius:3px}.dropzone .dz-preview:hover .dz-image img{transform:scale(1.05,1.05);filter:blur(8px)}.dropzone .dz-preview .dz-image{border-radius:20px;overflow:hidden;width:120px;height:120px;position:relative;display:block;z-index:10}.dropzone .dz-preview .dz-image img{display:block}.dropzone .dz-preview.dz-success .dz-success-mark{animation:passing-through 3s cubic-bezier(.77,0,.175,1)}.dropzone .dz-preview.dz-error .dz-error-mark{opacity:1;animation:slide-in 3s cubic-bezier(.77,0,.175,1)}.dropzone .dz-preview .dz-error-mark,.dropzone .dz-preview .dz-success-mark{pointer-events:none;opacity:0;z-index:500;position:absolute;display:block;top:50%;left:50%;margin-left:-27px;margin-top:-27px}.dropzone .dz-preview .dz-error-mark svg,.dropzone .dz-preview .dz-success-mark svg{display:block;width:54px;height:54px}.dropzone .dz-preview.dz-processing .dz-progress{opacity:1;transition:all .2s linear}.dropzone .dz-preview.dz-complete .dz-progress{opacity:0;transition:opacity .4s ease-in}.dropzone .dz-preview:not(.dz-processing) .dz-progress{animation:pulse 6s ease infinite}.dropzone .dz-preview .dz-progress{opacity:1;z-index:1000;pointer-events:none;position:absolute;height:16px;left:50%;top:50%;margin-top:-8px;width:80px;margin-left:-40px;background:rgba(255,255,255,.9);-webkit-transform:scale(1);border-radius:8px;overflow:hidden}.dropzone .dz-preview .dz-progress .dz-upload{background:#333;background:linear-gradient(to bottom,#666,#444);position:absolute;top:0;left:0;bottom:0;width:0;transition:width .3s ease-in-out}.dropzone .dz-preview.dz-error .dz-error-message{display:block}.dropzone .dz-preview.dz-error:hover .dz-error-message{opacity:1;pointer-events:auto}.dropzone .dz-preview .dz-error-message{pointer-events:none;z-index:1000;position:absolute;display:block;display:none;opacity:0;transition:opacity .3s ease;border-radius:8px;font-size:13px;top:130px;left:-10px;width:140px;background:#be2626;background:linear-gradient(to bottom,#be2626,#a92222);padding:.5em 1.2em;color:#fff}.dropzone .dz-preview .dz-error-message:after{content:'';position:absolute;top:-6px;left:64px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:6px solid #be2626}/*!\r\n * Bootstrap v4.0.0-alpha.2 (http://getbootstrap.com)\r\n * Copyright 2011-2015 Twitter, Inc.\r\n * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)\r\n *//*! normalize.css v3.0.3 | MIT License | github.com/necolas/normalize.css */html{font-family:sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}body{margin:0}article,aside,details,figcaption,figure,footer,header,hgroup,main,menu,nav,section,summary{display:block}audio,canvas,progress,video{display:inline-block;vertical-align:baseline}audio:not([controls]){display:none;height:0}[hidden],template{display:none}a{background-color:transparent}a:active{outline:0}a:hover{outline:0}abbr[title]{border-bottom:1px dotted}b,strong{font-weight:700}dfn{font-style:italic}h1{margin:.67em 0;font-size:2em}mark{color:#000;background:#ff0}small{font-size:80%}sub,sup{position:relative;font-size:75%;line-height:0;vertical-align:baseline}sup{top:-.5em}sub{bottom:-.25em}img{border:0}svg:not(:root){overflow:hidden}figure{margin:1em 40px}hr{height:0;box-sizing:content-box}pre{overflow:auto}code,kbd,pre,samp{font-family:monospace,monospace;font-size:1em}button,input,optgroup,select,textarea{margin:0;font:inherit;color:inherit}button{overflow:visible}button,select{text-transform:none}button,html input[type=button],input[type=reset],input[type=submit]{-webkit-appearance:button;cursor:pointer}button[disabled],html input[disabled]{cursor:default}button::-moz-focus-inner,input::-moz-focus-inner{padding:0;border:0}input{line-height:normal}input[type=checkbox],input[type=radio]{box-sizing:border-box;padding:0}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{height:auto}input[type=search]{box-sizing:content-box;-webkit-appearance:textfield}input[type=search]::-webkit-search-cancel-button,input[type=search]::-webkit-search-decoration{-webkit-appearance:none}fieldset{padding:.35em .625em .75em;margin:0 2px;border:1px solid silver}legend{padding:0;border:0}textarea{overflow:auto}optgroup{font-weight:700}table{border-spacing:0;border-collapse:collapse}td,th{padding:0}@media print{*,::after,::before{text-shadow:none!important;box-shadow:none!important}a,a:visited{text-decoration:underline}abbr[title]::after{content:\" (\" attr(title) \")\"}blockquote,pre{border:1px solid #999;page-break-inside:avoid}thead{display:table-header-group}img,tr{page-break-inside:avoid}img{max-width:100%!important}h2,h3,p{orphans:3;widows:3}h2,h3{page-break-after:avoid}.navbar{display:none}.btn>.caret,.dropup>.btn>.caret{border-top-color:#000!important}.label{border:1px solid #000}.table{border-collapse:collapse!important}.table td,.table th{background-color:#fff!important}.table-bordered td,.table-bordered th{border:1px solid #ddd!important}}html{box-sizing:border-box}*,::after,::before{box-sizing:inherit}@-moz-viewport{width:device-width}@-ms-viewport{width:device-width}@-webkit-viewport{width:device-width}@-o-viewport{width:device-width}@viewport{width:device-width}html{font-size:16px;-webkit-tap-highlight-color:transparent}body{font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;font-size:1rem;line-height:1.5;color:#373a3c;background-color:#fff}[tabindex=\"-1\"]:focus{outline:0!important}h1,h2,h3,h4,h5,h6{margin-top:0;margin-bottom:.5rem}p{margin-top:0;margin-bottom:1rem}abbr[data-original-title],abbr[title]{cursor:help;border-bottom:1px dotted #818a91}address{margin-bottom:1rem;font-style:normal;line-height:inherit}dl,ol,ul{margin-top:0;margin-bottom:1rem}ol ol,ol ul,ul ol,ul ul{margin-bottom:0}dt{font-weight:700}dd{margin-bottom:.5rem;margin-left:0}blockquote{margin:0 0 1rem}a{color:#0275d8;text-decoration:none}a:focus,a:hover{color:#014c8c;text-decoration:underline}a:focus{outline:thin dotted;outline:5px auto -webkit-focus-ring-color;outline-offset:-2px}pre{margin-top:0;margin-bottom:1rem}figure{margin:0 0 1rem}img{vertical-align:middle}[role=button]{cursor:pointer}[role=button],a,area,button,input,label,select,summary,textarea{-ms-touch-action:manipulation;touch-action:manipulation}table{background-color:transparent}caption{padding-top:.75rem;padding-bottom:.75rem;color:#818a91;text-align:left;caption-side:bottom}th{text-align:left}label{display:inline-block;margin-bottom:.5rem}button:focus{outline:1px dotted;outline:5px auto -webkit-focus-ring-color}button,input,select,textarea{margin:0;line-height:inherit;border-radius:0}textarea{resize:vertical}fieldset{min-width:0;padding:0;margin:0;border:0}legend{display:block;width:100%;padding:0;margin-bottom:.5rem;font-size:1.5rem;line-height:inherit}input[type=search]{box-sizing:inherit;-webkit-appearance:none}output{display:inline-block}[hidden]{display:none!important}.h1,.h2,.h3,.h4,.h5,.h6,h1,h2,h3,h4,h5,h6{margin-bottom:.5rem;font-family:inherit;font-weight:500;line-height:1.1;color:inherit}h1{font-size:2.5rem}h2{font-size:2rem}h3{font-size:1.75rem}h4{font-size:1.5rem}h5{font-size:1.25rem}h6{font-size:1rem}.h1{font-size:2.5rem}.h2{font-size:2rem}.h3{font-size:1.75rem}.h4{font-size:1.5rem}.h5{font-size:1.25rem}.h6{font-size:1rem}.lead{font-size:1.25rem;font-weight:300}.display-1{font-size:6rem;font-weight:300}.display-2{font-size:5.5rem;font-weight:300}.display-3{font-size:4.5rem;font-weight:300}.display-4{font-size:3.5rem;font-weight:300}hr{margin-top:1rem;margin-bottom:1rem;border:0;border-top:1px solid rgba(0,0,0,.1)}.small,small{font-size:80%;font-weight:400}.mark,mark{padding:.2em;background-color:#fcf8e3}.list-unstyled{padding-left:0;list-style:none}.list-inline{padding-left:0;list-style:none}.list-inline-item{display:inline-block}.list-inline-item:not(:last-child){margin-right:5px}.dl-horizontal{margin-right:-1.875rem;margin-left:-1.875rem}.dl-horizontal::after{display:table;clear:both;content:\"\"}.initialism{font-size:90%;text-transform:uppercase}.blockquote{padding:.5rem 1rem;margin-bottom:1rem;font-size:1.25rem;border-left:.25rem solid #eceeef}.blockquote-footer{display:block;font-size:80%;line-height:1.5;color:#818a91}.blockquote-footer::before{content:\"\\2014   \\A0\"}.blockquote-reverse{padding-right:1rem;padding-left:0;text-align:right;border-right:.25rem solid #eceeef;border-left:0}.blockquote-reverse .blockquote-footer::before{content:\"\"}.blockquote-reverse .blockquote-footer::after{content:\"\\A0   \\2014\"}.carousel-inner>.carousel-item>a>img,.carousel-inner>.carousel-item>img,.img-fluid{display:block;max-width:100%;height:auto}.img-rounded{border-radius:.3rem}.img-thumbnail{display:inline-block;max-width:100%;height:auto;padding:.25rem;line-height:1.5;background-color:#fff;border:1px solid #ddd;border-radius:.25rem;transition:all .2s ease-in-out}.img-circle{border-radius:50%}.figure{display:inline-block}.figure-img{margin-bottom:.5rem;line-height:1}.figure-caption{font-size:90%;color:#818a91}code,kbd,pre,samp{font-family:Menlo,Monaco,Consolas,\"Courier New\",monospace}code{padding:.2rem .4rem;font-size:90%;color:#bd4147;background-color:#f7f7f9;border-radius:.25rem}kbd{padding:.2rem .4rem;font-size:90%;color:#fff;background-color:#333;border-radius:.2rem}kbd kbd{padding:0;font-size:100%;font-weight:700}pre{display:block;margin-top:0;margin-bottom:1rem;font-size:90%;line-height:1.5;color:#373a3c}pre code{padding:0;font-size:inherit;color:inherit;background-color:transparent;border-radius:0}.pre-scrollable{max-height:340px;overflow-y:scroll}.container{padding-right:.9375rem;padding-left:.9375rem;margin-right:auto;margin-left:auto}.container::after{display:table;clear:both;content:\"\"}@media (min-width:544px){.container{max-width:576px}}@media (min-width:768px){.container{max-width:720px}}@media (min-width:992px){.container{max-width:940px}}@media (min-width:1200px){.container{max-width:1140px}}.container-fluid{padding-right:.9375rem;padding-left:.9375rem;margin-right:auto;margin-left:auto}.container-fluid::after{display:table;clear:both;content:\"\"}.row{margin-right:-.9375rem;margin-left:-.9375rem}.row::after{display:table;clear:both;content:\"\"}.col-lg-1,.col-lg-10,.col-lg-11,.col-lg-12,.col-lg-2,.col-lg-3,.col-lg-4,.col-lg-5,.col-lg-6,.col-lg-7,.col-lg-8,.col-lg-9,.col-md-1,.col-md-10,.col-md-11,.col-md-12,.col-md-2,.col-md-3,.col-md-4,.col-md-5,.col-md-6,.col-md-7,.col-md-8,.col-md-9,.col-sm-1,.col-sm-10,.col-sm-11,.col-sm-12,.col-sm-2,.col-sm-3,.col-sm-4,.col-sm-5,.col-sm-6,.col-sm-7,.col-sm-8,.col-sm-9,.col-xl-1,.col-xl-10,.col-xl-11,.col-xl-12,.col-xl-2,.col-xl-3,.col-xl-4,.col-xl-5,.col-xl-6,.col-xl-7,.col-xl-8,.col-xl-9,.col-xs-1,.col-xs-10,.col-xs-11,.col-xs-12,.col-xs-2,.col-xs-3,.col-xs-4,.col-xs-5,.col-xs-6,.col-xs-7,.col-xs-8,.col-xs-9{position:relative;min-height:1px;padding-right:.9375rem;padding-left:.9375rem}.col-xs-1,.col-xs-10,.col-xs-11,.col-xs-12,.col-xs-2,.col-xs-3,.col-xs-4,.col-xs-5,.col-xs-6,.col-xs-7,.col-xs-8,.col-xs-9{float:left}.col-xs-1{width:8.333333%}.col-xs-2{width:16.666667%}.col-xs-3{width:25%}.col-xs-4{width:33.333333%}.col-xs-5{width:41.666667%}.col-xs-6{width:50%}.col-xs-7{width:58.333333%}.col-xs-8{width:66.666667%}.col-xs-9{width:75%}.col-xs-10{width:83.333333%}.col-xs-11{width:91.666667%}.col-xs-12{width:100%}.col-xs-pull-0{right:auto}.col-xs-pull-1{right:8.333333%}.col-xs-pull-2{right:16.666667%}.col-xs-pull-3{right:25%}.col-xs-pull-4{right:33.333333%}.col-xs-pull-5{right:41.666667%}.col-xs-pull-6{right:50%}.col-xs-pull-7{right:58.333333%}.col-xs-pull-8{right:66.666667%}.col-xs-pull-9{right:75%}.col-xs-pull-10{right:83.333333%}.col-xs-pull-11{right:91.666667%}.col-xs-pull-12{right:100%}.col-xs-push-0{left:auto}.col-xs-push-1{left:8.333333%}.col-xs-push-2{left:16.666667%}.col-xs-push-3{left:25%}.col-xs-push-4{left:33.333333%}.col-xs-push-5{left:41.666667%}.col-xs-push-6{left:50%}.col-xs-push-7{left:58.333333%}.col-xs-push-8{left:66.666667%}.col-xs-push-9{left:75%}.col-xs-push-10{left:83.333333%}.col-xs-push-11{left:91.666667%}.col-xs-push-12{left:100%}.col-xs-offset-0{margin-left:0}.col-xs-offset-1{margin-left:8.333333%}.col-xs-offset-2{margin-left:16.666667%}.col-xs-offset-3{margin-left:25%}.col-xs-offset-4{margin-left:33.333333%}.col-xs-offset-5{margin-left:41.666667%}.col-xs-offset-6{margin-left:50%}.col-xs-offset-7{margin-left:58.333333%}.col-xs-offset-8{margin-left:66.666667%}.col-xs-offset-9{margin-left:75%}.col-xs-offset-10{margin-left:83.333333%}.col-xs-offset-11{margin-left:91.666667%}.col-xs-offset-12{margin-left:100%}@media (min-width:544px){.col-sm-1,.col-sm-10,.col-sm-11,.col-sm-12,.col-sm-2,.col-sm-3,.col-sm-4,.col-sm-5,.col-sm-6,.col-sm-7,.col-sm-8,.col-sm-9{float:left}.col-sm-1{width:8.333333%}.col-sm-2{width:16.666667%}.col-sm-3{width:25%}.col-sm-4{width:33.333333%}.col-sm-5{width:41.666667%}.col-sm-6{width:50%}.col-sm-7{width:58.333333%}.col-sm-8{width:66.666667%}.col-sm-9{width:75%}.col-sm-10{width:83.333333%}.col-sm-11{width:91.666667%}.col-sm-12{width:100%}.col-sm-pull-0{right:auto}.col-sm-pull-1{right:8.333333%}.col-sm-pull-2{right:16.666667%}.col-sm-pull-3{right:25%}.col-sm-pull-4{right:33.333333%}.col-sm-pull-5{right:41.666667%}.col-sm-pull-6{right:50%}.col-sm-pull-7{right:58.333333%}.col-sm-pull-8{right:66.666667%}.col-sm-pull-9{right:75%}.col-sm-pull-10{right:83.333333%}.col-sm-pull-11{right:91.666667%}.col-sm-pull-12{right:100%}.col-sm-push-0{left:auto}.col-sm-push-1{left:8.333333%}.col-sm-push-2{left:16.666667%}.col-sm-push-3{left:25%}.col-sm-push-4{left:33.333333%}.col-sm-push-5{left:41.666667%}.col-sm-push-6{left:50%}.col-sm-push-7{left:58.333333%}.col-sm-push-8{left:66.666667%}.col-sm-push-9{left:75%}.col-sm-push-10{left:83.333333%}.col-sm-push-11{left:91.666667%}.col-sm-push-12{left:100%}.col-sm-offset-0{margin-left:0}.col-sm-offset-1{margin-left:8.333333%}.col-sm-offset-2{margin-left:16.666667%}.col-sm-offset-3{margin-left:25%}.col-sm-offset-4{margin-left:33.333333%}.col-sm-offset-5{margin-left:41.666667%}.col-sm-offset-6{margin-left:50%}.col-sm-offset-7{margin-left:58.333333%}.col-sm-offset-8{margin-left:66.666667%}.col-sm-offset-9{margin-left:75%}.col-sm-offset-10{margin-left:83.333333%}.col-sm-offset-11{margin-left:91.666667%}.col-sm-offset-12{margin-left:100%}}@media (min-width:768px){.col-md-1,.col-md-10,.col-md-11,.col-md-12,.col-md-2,.col-md-3,.col-md-4,.col-md-5,.col-md-6,.col-md-7,.col-md-8,.col-md-9{float:left}.col-md-1{width:8.333333%}.col-md-2{width:16.666667%}.col-md-3{width:25%}.col-md-4{width:33.333333%}.col-md-5{width:41.666667%}.col-md-6{width:50%}.col-md-7{width:58.333333%}.col-md-8{width:66.666667%}.col-md-9{width:75%}.col-md-10{width:83.333333%}.col-md-11{width:91.666667%}.col-md-12{width:100%}.col-md-pull-0{right:auto}.col-md-pull-1{right:8.333333%}.col-md-pull-2{right:16.666667%}.col-md-pull-3{right:25%}.col-md-pull-4{right:33.333333%}.col-md-pull-5{right:41.666667%}.col-md-pull-6{right:50%}.col-md-pull-7{right:58.333333%}.col-md-pull-8{right:66.666667%}.col-md-pull-9{right:75%}.col-md-pull-10{right:83.333333%}.col-md-pull-11{right:91.666667%}.col-md-pull-12{right:100%}.col-md-push-0{left:auto}.col-md-push-1{left:8.333333%}.col-md-push-2{left:16.666667%}.col-md-push-3{left:25%}.col-md-push-4{left:33.333333%}.col-md-push-5{left:41.666667%}.col-md-push-6{left:50%}.col-md-push-7{left:58.333333%}.col-md-push-8{left:66.666667%}.col-md-push-9{left:75%}.col-md-push-10{left:83.333333%}.col-md-push-11{left:91.666667%}.col-md-push-12{left:100%}.col-md-offset-0{margin-left:0}.col-md-offset-1{margin-left:8.333333%}.col-md-offset-2{margin-left:16.666667%}.col-md-offset-3{margin-left:25%}.col-md-offset-4{margin-left:33.333333%}.col-md-offset-5{margin-left:41.666667%}.col-md-offset-6{margin-left:50%}.col-md-offset-7{margin-left:58.333333%}.col-md-offset-8{margin-left:66.666667%}.col-md-offset-9{margin-left:75%}.col-md-offset-10{margin-left:83.333333%}.col-md-offset-11{margin-left:91.666667%}.col-md-offset-12{margin-left:100%}}@media (min-width:992px){.col-lg-1,.col-lg-10,.col-lg-11,.col-lg-12,.col-lg-2,.col-lg-3,.col-lg-4,.col-lg-5,.col-lg-6,.col-lg-7,.col-lg-8,.col-lg-9{float:left}.col-lg-1{width:8.333333%}.col-lg-2{width:16.666667%}.col-lg-3{width:25%}.col-lg-4{width:33.333333%}.col-lg-5{width:41.666667%}.col-lg-6{width:50%}.col-lg-7{width:58.333333%}.col-lg-8{width:66.666667%}.col-lg-9{width:75%}.col-lg-10{width:83.333333%}.col-lg-11{width:91.666667%}.col-lg-12{width:100%}.col-lg-pull-0{right:auto}.col-lg-pull-1{right:8.333333%}.col-lg-pull-2{right:16.666667%}.col-lg-pull-3{right:25%}.col-lg-pull-4{right:33.333333%}.col-lg-pull-5{right:41.666667%}.col-lg-pull-6{right:50%}.col-lg-pull-7{right:58.333333%}.col-lg-pull-8{right:66.666667%}.col-lg-pull-9{right:75%}.col-lg-pull-10{right:83.333333%}.col-lg-pull-11{right:91.666667%}.col-lg-pull-12{right:100%}.col-lg-push-0{left:auto}.col-lg-push-1{left:8.333333%}.col-lg-push-2{left:16.666667%}.col-lg-push-3{left:25%}.col-lg-push-4{left:33.333333%}.col-lg-push-5{left:41.666667%}.col-lg-push-6{left:50%}.col-lg-push-7{left:58.333333%}.col-lg-push-8{left:66.666667%}.col-lg-push-9{left:75%}.col-lg-push-10{left:83.333333%}.col-lg-push-11{left:91.666667%}.col-lg-push-12{left:100%}.col-lg-offset-0{margin-left:0}.col-lg-offset-1{margin-left:8.333333%}.col-lg-offset-2{margin-left:16.666667%}.col-lg-offset-3{margin-left:25%}.col-lg-offset-4{margin-left:33.333333%}.col-lg-offset-5{margin-left:41.666667%}.col-lg-offset-6{margin-left:50%}.col-lg-offset-7{margin-left:58.333333%}.col-lg-offset-8{margin-left:66.666667%}.col-lg-offset-9{margin-left:75%}.col-lg-offset-10{margin-left:83.333333%}.col-lg-offset-11{margin-left:91.666667%}.col-lg-offset-12{margin-left:100%}}@media (min-width:1200px){.col-xl-1,.col-xl-10,.col-xl-11,.col-xl-12,.col-xl-2,.col-xl-3,.col-xl-4,.col-xl-5,.col-xl-6,.col-xl-7,.col-xl-8,.col-xl-9{float:left}.col-xl-1{width:8.333333%}.col-xl-2{width:16.666667%}.col-xl-3{width:25%}.col-xl-4{width:33.333333%}.col-xl-5{width:41.666667%}.col-xl-6{width:50%}.col-xl-7{width:58.333333%}.col-xl-8{width:66.666667%}.col-xl-9{width:75%}.col-xl-10{width:83.333333%}.col-xl-11{width:91.666667%}.col-xl-12{width:100%}.col-xl-pull-0{right:auto}.col-xl-pull-1{right:8.333333%}.col-xl-pull-2{right:16.666667%}.col-xl-pull-3{right:25%}.col-xl-pull-4{right:33.333333%}.col-xl-pull-5{right:41.666667%}.col-xl-pull-6{right:50%}.col-xl-pull-7{right:58.333333%}.col-xl-pull-8{right:66.666667%}.col-xl-pull-9{right:75%}.col-xl-pull-10{right:83.333333%}.col-xl-pull-11{right:91.666667%}.col-xl-pull-12{right:100%}.col-xl-push-0{left:auto}.col-xl-push-1{left:8.333333%}.col-xl-push-2{left:16.666667%}.col-xl-push-3{left:25%}.col-xl-push-4{left:33.333333%}.col-xl-push-5{left:41.666667%}.col-xl-push-6{left:50%}.col-xl-push-7{left:58.333333%}.col-xl-push-8{left:66.666667%}.col-xl-push-9{left:75%}.col-xl-push-10{left:83.333333%}.col-xl-push-11{left:91.666667%}.col-xl-push-12{left:100%}.col-xl-offset-0{margin-left:0}.col-xl-offset-1{margin-left:8.333333%}.col-xl-offset-2{margin-left:16.666667%}.col-xl-offset-3{margin-left:25%}.col-xl-offset-4{margin-left:33.333333%}.col-xl-offset-5{margin-left:41.666667%}.col-xl-offset-6{margin-left:50%}.col-xl-offset-7{margin-left:58.333333%}.col-xl-offset-8{margin-left:66.666667%}.col-xl-offset-9{margin-left:75%}.col-xl-offset-10{margin-left:83.333333%}.col-xl-offset-11{margin-left:91.666667%}.col-xl-offset-12{margin-left:100%}}.table{width:100%;max-width:100%;margin-bottom:1rem}.table td,.table th{padding:.75rem;line-height:1.5;vertical-align:top;border-top:1px solid #eceeef}.table thead th{vertical-align:bottom;border-bottom:2px solid #eceeef}.table tbody+tbody{border-top:2px solid #eceeef}.table .table{background-color:#fff}.table-sm td,.table-sm th{padding:.3rem}.table-bordered{border:1px solid #eceeef}.table-bordered td,.table-bordered th{border:1px solid #eceeef}.table-bordered thead td,.table-bordered thead th{border-bottom-width:2px}.table-striped tbody tr:nth-of-type(odd){background-color:#f9f9f9}.table-hover tbody tr:hover{background-color:#f5f5f5}.table-active,.table-active>td,.table-active>th{background-color:#f5f5f5}.table-hover .table-active:hover{background-color:#e8e8e8}.table-hover .table-active:hover>td,.table-hover .table-active:hover>th{background-color:#e8e8e8}.table-success,.table-success>td,.table-success>th{background-color:#dff0d8}.table-hover .table-success:hover{background-color:#d0e9c6}.table-hover .table-success:hover>td,.table-hover .table-success:hover>th{background-color:#d0e9c6}.table-info,.table-info>td,.table-info>th{background-color:#d9edf7}.table-hover .table-info:hover{background-color:#c4e3f3}.table-hover .table-info:hover>td,.table-hover .table-info:hover>th{background-color:#c4e3f3}.table-warning,.table-warning>td,.table-warning>th{background-color:#fcf8e3}.table-hover .table-warning:hover{background-color:#faf2cc}.table-hover .table-warning:hover>td,.table-hover .table-warning:hover>th{background-color:#faf2cc}.table-danger,.table-danger>td,.table-danger>th{background-color:#f2dede}.table-hover .table-danger:hover{background-color:#ebcccc}.table-hover .table-danger:hover>td,.table-hover .table-danger:hover>th{background-color:#ebcccc}.table-responsive{display:block;width:100%;min-height:.01%;overflow-x:auto}.thead-inverse th{color:#fff;background-color:#373a3c}.thead-default th{color:#55595c;background-color:#eceeef}.table-inverse{color:#eceeef;background-color:#373a3c}.table-inverse.table-bordered{border:0}.table-inverse td,.table-inverse th,.table-inverse thead th{border-color:#55595c}.table-reflow thead{float:left}.table-reflow tbody{display:block;white-space:nowrap}.table-reflow td,.table-reflow th{border-top:1px solid #eceeef;border-left:1px solid #eceeef}.table-reflow td:last-child,.table-reflow th:last-child{border-right:1px solid #eceeef}.table-reflow tbody:last-child tr:last-child td,.table-reflow tbody:last-child tr:last-child th,.table-reflow tfoot:last-child tr:last-child td,.table-reflow tfoot:last-child tr:last-child th,.table-reflow thead:last-child tr:last-child td,.table-reflow thead:last-child tr:last-child th{border-bottom:1px solid #eceeef}.table-reflow tr{float:left}.table-reflow tr td,.table-reflow tr th{display:block!important;border:1px solid #eceeef}.form-control{display:block;width:100%;padding:.375rem .75rem;font-size:1rem;line-height:1.5;color:#55595c;background-color:#fff;background-image:none;border:1px solid #ccc;border-radius:.25rem}.form-control::-ms-expand{background-color:transparent;border:0}.form-control:focus{border-color:#66afe9;outline:0}.form-control:-ms-input-placeholder{color:#999;opacity:1}.form-control::placeholder{color:#999;opacity:1}.form-control:disabled,.form-control[readonly]{background-color:#eceeef;opacity:1}.form-control:disabled{cursor:not-allowed}.form-control-file,.form-control-range{display:block}.form-control-label{padding:.375rem .75rem;margin-bottom:0}@media screen and (-webkit-min-device-pixel-ratio:0){input[type=date].form-control,input[type=datetime-local].form-control,input[type=month].form-control,input[type=time].form-control{line-height:2.25rem}.input-group-sm input[type=date].form-control,.input-group-sm input[type=datetime-local].form-control,.input-group-sm input[type=month].form-control,.input-group-sm input[type=time].form-control,input[type=date].input-sm,input[type=datetime-local].input-sm,input[type=month].input-sm,input[type=time].input-sm{line-height:1.8625rem}.input-group-lg input[type=date].form-control,.input-group-lg input[type=datetime-local].form-control,.input-group-lg input[type=month].form-control,.input-group-lg input[type=time].form-control,input[type=date].input-lg,input[type=datetime-local].input-lg,input[type=month].input-lg,input[type=time].input-lg{line-height:3.166667rem}}.form-control-static{min-height:2.25rem;padding-top:.375rem;padding-bottom:.375rem;margin-bottom:0}.form-control-static.form-control-lg,.form-control-static.form-control-sm,.input-group-lg>.form-control-static.form-control,.input-group-lg>.form-control-static.input-group-addon,.input-group-lg>.input-group-btn>.form-control-static.btn,.input-group-sm>.form-control-static.form-control,.input-group-sm>.form-control-static.input-group-addon,.input-group-sm>.input-group-btn>.form-control-static.btn{padding-right:0;padding-left:0}.form-control-sm,.input-group-sm>.form-control,.input-group-sm>.input-group-addon,.input-group-sm>.input-group-btn>.btn{padding:.275rem .75rem;font-size:.875rem;line-height:1.5;border-radius:.2rem}.form-control-lg,.input-group-lg>.form-control,.input-group-lg>.input-group-addon,.input-group-lg>.input-group-btn>.btn{padding:.75rem 1.25rem;font-size:1.25rem;line-height:1.333333;border-radius:.3rem}.form-group{margin-bottom:1rem}.checkbox,.radio{position:relative;display:block;margin-bottom:.75rem}.checkbox label,.radio label{padding-left:1.25rem;margin-bottom:0;font-weight:400;cursor:pointer}.checkbox label input:only-child,.radio label input:only-child{position:static}.checkbox input[type=checkbox],.checkbox-inline input[type=checkbox],.radio input[type=radio],.radio-inline input[type=radio]{position:absolute;margin-top:.25rem;margin-left:-1.25rem}.checkbox+.checkbox,.radio+.radio{margin-top:-.25rem}.checkbox-inline,.radio-inline{position:relative;display:inline-block;padding-left:1.25rem;margin-bottom:0;font-weight:400;vertical-align:middle;cursor:pointer}.checkbox-inline+.checkbox-inline,.radio-inline+.radio-inline{margin-top:0;margin-left:.75rem}input[type=checkbox].disabled,input[type=checkbox]:disabled,input[type=radio].disabled,input[type=radio]:disabled{cursor:not-allowed}.checkbox-inline.disabled,.radio-inline.disabled{cursor:not-allowed}.checkbox.disabled label,.radio.disabled label{cursor:not-allowed}.form-control-danger,.form-control-success,.form-control-warning{padding-right:2.25rem;background-repeat:no-repeat;background-position:center right .5625rem;background-size:1.4625rem 1.4625rem}.has-success .checkbox,.has-success .checkbox-inline,.has-success .form-control-label,.has-success .radio,.has-success .radio-inline,.has-success .text-help,.has-success.checkbox label,.has-success.checkbox-inline label,.has-success.radio label,.has-success.radio-inline label{color:#5cb85c}.has-success .form-control{border-color:#5cb85c}.has-success .input-group-addon{color:#5cb85c;background-color:#eaf6ea;border-color:#5cb85c}.has-success .form-control-feedback{color:#5cb85c}.has-success .form-control-success{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MTIgNzkyIj48cGF0aCBmaWxsPSIjNWNiODVjIiBkPSJNMjMzLjggNjEwYy0xMy4zIDAtMjYtNi0zNC0xNi44TDkwLjUgNDQ4LjhDNzYuMyA0MzAgODAgNDAzLjMgOTguOCAzODljMTguOC0xNC4yIDQ1LjUtMTAuNCA1OS44IDguNGw3MiA5NUw0NTEuMyAyNDJjMTIuNS0yMCAzOC44LTI2LjIgNTguOC0xMy43IDIwIDEyLjQgMjYgMzguNyAxMy43IDU4LjhMMjcwIDU5MGMtNy40IDEyLTIwLjIgMTkuNC0zNC4zIDIwaC0yeiIvPjwvc3ZnPg==)}.has-warning .checkbox,.has-warning .checkbox-inline,.has-warning .form-control-label,.has-warning .radio,.has-warning .radio-inline,.has-warning .text-help,.has-warning.checkbox label,.has-warning.checkbox-inline label,.has-warning.radio label,.has-warning.radio-inline label{color:#f0ad4e}.has-warning .form-control{border-color:#f0ad4e}.has-warning .input-group-addon{color:#f0ad4e;background-color:#fff;border-color:#f0ad4e}.has-warning .form-control-feedback{color:#f0ad4e}.has-warning .form-control-warning{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MTIgNzkyIj48cGF0aCBmaWxsPSIjZjBhZDRlIiBkPSJNNjAzIDY0MC4ybC0yNzguNS01MDljLTMuOC02LjYtMTAuOC0xMC42LTE4LjUtMTAuNnMtMTQuNyA0LTE4LjUgMTAuNkw5IDY0MC4yYy0zLjcgNi41LTMuNiAxNC40LjIgMjAuOCAzLjggNi41IDEwLjggMTAuNCAxOC4zIDEwLjRoNTU3YzcuNiAwIDE0LjYtNCAxOC40LTEwLjQgMy41LTYuNCAzLjYtMTQuNCAwLTIwLjh6bS0yNjYuNC0zMGgtNjEuMlY1NDloNjEuMnY2MS4yem0wLTEwN2gtNjEuMlYzMDRoNjEuMnYxOTl6Ii8+PC9zdmc+)}.has-danger .checkbox,.has-danger .checkbox-inline,.has-danger .form-control-label,.has-danger .radio,.has-danger .radio-inline,.has-danger .text-help,.has-danger.checkbox label,.has-danger.checkbox-inline label,.has-danger.radio label,.has-danger.radio-inline label{color:#d9534f}.has-danger .form-control{border-color:#d9534f}.has-danger .input-group-addon{color:#d9534f;background-color:#fdf7f7;border-color:#d9534f}.has-danger .form-control-feedback{color:#d9534f}.has-danger .form-control-danger{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MTIgNzkyIj48cGF0aCBmaWxsPSIjZDk1MzRmIiBkPSJNNDQ3IDU0NC40Yy0xNC40IDE0LjQtMzcuNiAxNC40LTUyIDBsLTg5LTkyLjctODkgOTIuN2MtMTQuNSAxNC40LTM3LjcgMTQuNC01MiAwLTE0LjQtMTQuNC0xNC40LTM3LjYgMC01Mmw5Mi40LTk2LjMtOTIuNC05Ni4zYy0xNC40LTE0LjQtMTQuNC0zNy42IDAtNTJzMzcuNi0xNC4zIDUyIDBsODkgOTIuOCA4OS4yLTkyLjdjMTQuNC0xNC40IDM3LjYtMTQuNCA1MiAwIDE0LjMgMTQuNCAxNC4zIDM3LjYgMCA1MkwzNTQuNiAzOTZsOTIuNCA5Ni40YzE0LjQgMTQuNCAxNC40IDM3LjYgMCA1MnoiLz48L3N2Zz4=)}@media (min-width:544px){.form-inline .form-group{display:inline-block;margin-bottom:0;vertical-align:middle}.form-inline .form-control{display:inline-block;width:auto;vertical-align:middle}.form-inline .form-control-static{display:inline-block}.form-inline .input-group{display:inline-table;vertical-align:middle}.form-inline .input-group .form-control,.form-inline .input-group .input-group-addon,.form-inline .input-group .input-group-btn{width:auto}.form-inline .input-group>.form-control{width:100%}.form-inline .form-control-label{margin-bottom:0;vertical-align:middle}.form-inline .checkbox,.form-inline .radio{display:inline-block;margin-top:0;margin-bottom:0;vertical-align:middle}.form-inline .checkbox label,.form-inline .radio label{padding-left:0}.form-inline .checkbox input[type=checkbox],.form-inline .radio input[type=radio]{position:relative;margin-left:0}.form-inline .has-feedback .form-control-feedback{top:0}}.btn{display:inline-block;padding:.375rem 1rem;font-size:1rem;font-weight:400;line-height:1.5;text-align:center;white-space:nowrap;vertical-align:middle;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;border:1px solid transparent;border-radius:.25rem}.btn.active.focus,.btn.active:focus,.btn.focus,.btn:active.focus,.btn:active:focus,.btn:focus{outline:thin dotted;outline:5px auto -webkit-focus-ring-color;outline-offset:-2px}.btn:focus,.btn:hover{text-decoration:none}.btn.focus{text-decoration:none}.btn.active,.btn:active{background-image:none;outline:0}.btn.disabled,.btn:disabled{cursor:not-allowed;opacity:.65}a.btn.disabled,fieldset[disabled] a.btn{pointer-events:none}.btn-primary{color:#fff;background-color:#0275d8;border-color:#0275d8}.btn-primary:hover{color:#fff;background-color:#025aa5;border-color:#01549b}.btn-primary.focus,.btn-primary:focus{color:#fff;background-color:#025aa5;border-color:#01549b}.btn-primary.active,.btn-primary:active,.open>.btn-primary.dropdown-toggle{color:#fff;background-color:#025aa5;background-image:none;border-color:#01549b}.btn-primary.active.focus,.btn-primary.active:focus,.btn-primary.active:hover,.btn-primary:active.focus,.btn-primary:active:focus,.btn-primary:active:hover,.open>.btn-primary.dropdown-toggle.focus,.open>.btn-primary.dropdown-toggle:focus,.open>.btn-primary.dropdown-toggle:hover{color:#fff;background-color:#014682;border-color:#01315a}.btn-primary.disabled.focus,.btn-primary.disabled:focus,.btn-primary:disabled.focus,.btn-primary:disabled:focus{background-color:#0275d8;border-color:#0275d8}.btn-primary.disabled:hover,.btn-primary:disabled:hover{background-color:#0275d8;border-color:#0275d8}.btn-secondary{color:#373a3c;background-color:#fff;border-color:#ccc}.btn-secondary:hover{color:#373a3c;background-color:#e6e6e6;border-color:#adadad}.btn-secondary.focus,.btn-secondary:focus{color:#373a3c;background-color:#e6e6e6;border-color:#adadad}.btn-secondary.active,.btn-secondary:active,.open>.btn-secondary.dropdown-toggle{color:#373a3c;background-color:#e6e6e6;background-image:none;border-color:#adadad}.btn-secondary.active.focus,.btn-secondary.active:focus,.btn-secondary.active:hover,.btn-secondary:active.focus,.btn-secondary:active:focus,.btn-secondary:active:hover,.open>.btn-secondary.dropdown-toggle.focus,.open>.btn-secondary.dropdown-toggle:focus,.open>.btn-secondary.dropdown-toggle:hover{color:#373a3c;background-color:#d4d4d4;border-color:#8c8c8c}.btn-secondary.disabled.focus,.btn-secondary.disabled:focus,.btn-secondary:disabled.focus,.btn-secondary:disabled:focus{background-color:#fff;border-color:#ccc}.btn-secondary.disabled:hover,.btn-secondary:disabled:hover{background-color:#fff;border-color:#ccc}.btn-info{color:#fff;background-color:#5bc0de;border-color:#5bc0de}.btn-info:hover{color:#fff;background-color:#31b0d5;border-color:#2aabd2}.btn-info.focus,.btn-info:focus{color:#fff;background-color:#31b0d5;border-color:#2aabd2}.btn-info.active,.btn-info:active,.open>.btn-info.dropdown-toggle{color:#fff;background-color:#31b0d5;background-image:none;border-color:#2aabd2}.btn-info.active.focus,.btn-info.active:focus,.btn-info.active:hover,.btn-info:active.focus,.btn-info:active:focus,.btn-info:active:hover,.open>.btn-info.dropdown-toggle.focus,.open>.btn-info.dropdown-toggle:focus,.open>.btn-info.dropdown-toggle:hover{color:#fff;background-color:#269abc;border-color:#1f7e9a}.btn-info.disabled.focus,.btn-info.disabled:focus,.btn-info:disabled.focus,.btn-info:disabled:focus{background-color:#5bc0de;border-color:#5bc0de}.btn-info.disabled:hover,.btn-info:disabled:hover{background-color:#5bc0de;border-color:#5bc0de}.btn-success{color:#fff;background-color:#5cb85c;border-color:#5cb85c}.btn-success:hover{color:#fff;background-color:#449d44;border-color:#419641}.btn-success.focus,.btn-success:focus{color:#fff;background-color:#449d44;border-color:#419641}.btn-success.active,.btn-success:active,.open>.btn-success.dropdown-toggle{color:#fff;background-color:#449d44;background-image:none;border-color:#419641}.btn-success.active.focus,.btn-success.active:focus,.btn-success.active:hover,.btn-success:active.focus,.btn-success:active:focus,.btn-success:active:hover,.open>.btn-success.dropdown-toggle.focus,.open>.btn-success.dropdown-toggle:focus,.open>.btn-success.dropdown-toggle:hover{color:#fff;background-color:#398439;border-color:#2d672d}.btn-success.disabled.focus,.btn-success.disabled:focus,.btn-success:disabled.focus,.btn-success:disabled:focus{background-color:#5cb85c;border-color:#5cb85c}.btn-success.disabled:hover,.btn-success:disabled:hover{background-color:#5cb85c;border-color:#5cb85c}.btn-warning{color:#fff;background-color:#f0ad4e;border-color:#f0ad4e}.btn-warning:hover{color:#fff;background-color:#ec971f;border-color:#eb9316}.btn-warning.focus,.btn-warning:focus{color:#fff;background-color:#ec971f;border-color:#eb9316}.btn-warning.active,.btn-warning:active,.open>.btn-warning.dropdown-toggle{color:#fff;background-color:#ec971f;background-image:none;border-color:#eb9316}.btn-warning.active.focus,.btn-warning.active:focus,.btn-warning.active:hover,.btn-warning:active.focus,.btn-warning:active:focus,.btn-warning:active:hover,.open>.btn-warning.dropdown-toggle.focus,.open>.btn-warning.dropdown-toggle:focus,.open>.btn-warning.dropdown-toggle:hover{color:#fff;background-color:#d58512;border-color:#b06d0f}.btn-warning.disabled.focus,.btn-warning.disabled:focus,.btn-warning:disabled.focus,.btn-warning:disabled:focus{background-color:#f0ad4e;border-color:#f0ad4e}.btn-warning.disabled:hover,.btn-warning:disabled:hover{background-color:#f0ad4e;border-color:#f0ad4e}.btn-danger{color:#fff;background-color:#d9534f;border-color:#d9534f}.btn-danger:hover{color:#fff;background-color:#c9302c;border-color:#c12e2a}.btn-danger.focus,.btn-danger:focus{color:#fff;background-color:#c9302c;border-color:#c12e2a}.btn-danger.active,.btn-danger:active,.open>.btn-danger.dropdown-toggle{color:#fff;background-color:#c9302c;background-image:none;border-color:#c12e2a}.btn-danger.active.focus,.btn-danger.active:focus,.btn-danger.active:hover,.btn-danger:active.focus,.btn-danger:active:focus,.btn-danger:active:hover,.open>.btn-danger.dropdown-toggle.focus,.open>.btn-danger.dropdown-toggle:focus,.open>.btn-danger.dropdown-toggle:hover{color:#fff;background-color:#ac2925;border-color:#8b211e}.btn-danger.disabled.focus,.btn-danger.disabled:focus,.btn-danger:disabled.focus,.btn-danger:disabled:focus{background-color:#d9534f;border-color:#d9534f}.btn-danger.disabled:hover,.btn-danger:disabled:hover{background-color:#d9534f;border-color:#d9534f}.btn-primary-outline{color:#0275d8;background-color:transparent;background-image:none;border-color:#0275d8}.btn-primary-outline.active,.btn-primary-outline.focus,.btn-primary-outline:active,.btn-primary-outline:focus,.open>.btn-primary-outline.dropdown-toggle{color:#fff;background-color:#0275d8;border-color:#0275d8}.btn-primary-outline:hover{color:#fff;background-color:#0275d8;border-color:#0275d8}.btn-primary-outline.disabled.focus,.btn-primary-outline.disabled:focus,.btn-primary-outline:disabled.focus,.btn-primary-outline:disabled:focus{border-color:#43a7fd}.btn-primary-outline.disabled:hover,.btn-primary-outline:disabled:hover{border-color:#43a7fd}.btn-secondary-outline{color:#ccc;background-color:transparent;background-image:none;border-color:#ccc}.btn-secondary-outline.active,.btn-secondary-outline.focus,.btn-secondary-outline:active,.btn-secondary-outline:focus,.open>.btn-secondary-outline.dropdown-toggle{color:#fff;background-color:#ccc;border-color:#ccc}.btn-secondary-outline:hover{color:#fff;background-color:#ccc;border-color:#ccc}.btn-secondary-outline.disabled.focus,.btn-secondary-outline.disabled:focus,.btn-secondary-outline:disabled.focus,.btn-secondary-outline:disabled:focus{border-color:#fff}.btn-secondary-outline.disabled:hover,.btn-secondary-outline:disabled:hover{border-color:#fff}.btn-info-outline{color:#5bc0de;background-color:transparent;background-image:none;border-color:#5bc0de}.btn-info-outline.active,.btn-info-outline.focus,.btn-info-outline:active,.btn-info-outline:focus,.open>.btn-info-outline.dropdown-toggle{color:#fff;background-color:#5bc0de;border-color:#5bc0de}.btn-info-outline:hover{color:#fff;background-color:#5bc0de;border-color:#5bc0de}.btn-info-outline.disabled.focus,.btn-info-outline.disabled:focus,.btn-info-outline:disabled.focus,.btn-info-outline:disabled:focus{border-color:#b0e1ef}.btn-info-outline.disabled:hover,.btn-info-outline:disabled:hover{border-color:#b0e1ef}.btn-success-outline{color:#5cb85c;background-color:transparent;background-image:none;border-color:#5cb85c}.btn-success-outline.active,.btn-success-outline.focus,.btn-success-outline:active,.btn-success-outline:focus,.open>.btn-success-outline.dropdown-toggle{color:#fff;background-color:#5cb85c;border-color:#5cb85c}.btn-success-outline:hover{color:#fff;background-color:#5cb85c;border-color:#5cb85c}.btn-success-outline.disabled.focus,.btn-success-outline.disabled:focus,.btn-success-outline:disabled.focus,.btn-success-outline:disabled:focus{border-color:#a3d7a3}.btn-success-outline.disabled:hover,.btn-success-outline:disabled:hover{border-color:#a3d7a3}.btn-warning-outline{color:#f0ad4e;background-color:transparent;background-image:none;border-color:#f0ad4e}.btn-warning-outline.active,.btn-warning-outline.focus,.btn-warning-outline:active,.btn-warning-outline:focus,.open>.btn-warning-outline.dropdown-toggle{color:#fff;background-color:#f0ad4e;border-color:#f0ad4e}.btn-warning-outline:hover{color:#fff;background-color:#f0ad4e;border-color:#f0ad4e}.btn-warning-outline.disabled.focus,.btn-warning-outline.disabled:focus,.btn-warning-outline:disabled.focus,.btn-warning-outline:disabled:focus{border-color:#f8d9ac}.btn-warning-outline.disabled:hover,.btn-warning-outline:disabled:hover{border-color:#f8d9ac}.btn-danger-outline{color:#d9534f;background-color:transparent;background-image:none;border-color:#d9534f}.btn-danger-outline.active,.btn-danger-outline.focus,.btn-danger-outline:active,.btn-danger-outline:focus,.open>.btn-danger-outline.dropdown-toggle{color:#fff;background-color:#d9534f;border-color:#d9534f}.btn-danger-outline:hover{color:#fff;background-color:#d9534f;border-color:#d9534f}.btn-danger-outline.disabled.focus,.btn-danger-outline.disabled:focus,.btn-danger-outline:disabled.focus,.btn-danger-outline:disabled:focus{border-color:#eba5a3}.btn-danger-outline.disabled:hover,.btn-danger-outline:disabled:hover{border-color:#eba5a3}.btn-link{font-weight:400;color:#0275d8;border-radius:0}.btn-link,.btn-link.active,.btn-link:active,.btn-link:disabled{background-color:transparent}.btn-link,.btn-link:active,.btn-link:focus{border-color:transparent}.btn-link:hover{border-color:transparent}.btn-link:focus,.btn-link:hover{color:#014c8c;text-decoration:underline;background-color:transparent}.btn-link:disabled:focus,.btn-link:disabled:hover{color:#818a91;text-decoration:none}.btn-group-lg>.btn,.btn-lg{padding:.75rem 1.25rem;font-size:1.25rem;line-height:1.333333;border-radius:.3rem}.btn-group-sm>.btn,.btn-sm{padding:.25rem .75rem;font-size:.875rem;line-height:1.5;border-radius:.2rem}.btn-block{display:block;width:100%}.btn-block+.btn-block{margin-top:5px}input[type=button].btn-block,input[type=reset].btn-block,input[type=submit].btn-block{width:100%}.fade{opacity:0;transition:opacity .15s linear}.fade.in{opacity:1}.collapse{display:none}.collapse.in{display:block}.collapsing{position:relative;height:0;overflow:hidden;transition-timing-function:ease;transition-duration:.35s;transition-property:height}.dropdown,.dropup{position:relative}.dropdown-toggle::after{display:inline-block;width:0;height:0;margin-right:.25rem;margin-left:.25rem;vertical-align:middle;content:\"\";border-top:.3em solid;border-right:.3em solid transparent;border-left:.3em solid transparent}.dropdown-toggle:focus{outline:0}.dropup .dropdown-toggle::after{border-top:0;border-bottom:.3em solid}.dropdown-menu{position:absolute;top:100%;left:0;z-index:1000;display:none;float:left;min-width:160px;padding:5px 0;margin:2px 0 0;font-size:1rem;color:#373a3c;text-align:left;list-style:none;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.15);border-radius:.25rem}.dropdown-divider{height:1px;margin:.5rem 0;overflow:hidden;background-color:#e5e5e5}.dropdown-item{display:block;width:100%;padding:3px 20px;clear:both;font-weight:400;line-height:1.5;color:#373a3c;text-align:inherit;white-space:nowrap;background:0 0;border:0}.dropdown-item:focus,.dropdown-item:hover{color:#2b2d2f;text-decoration:none;background-color:#f5f5f5}.dropdown-item.active,.dropdown-item.active:focus,.dropdown-item.active:hover{color:#fff;text-decoration:none;background-color:#0275d8;outline:0}.dropdown-item.disabled,.dropdown-item.disabled:focus,.dropdown-item.disabled:hover{color:#818a91}.dropdown-item.disabled:focus,.dropdown-item.disabled:hover{text-decoration:none;cursor:not-allowed;background-color:transparent;background-image:none}.open>.dropdown-menu{display:block}.open>a{outline:0}.dropdown-menu-right{right:0;left:auto}.dropdown-menu-left{right:auto;left:0}.dropdown-header{display:block;padding:3px 20px;font-size:.875rem;line-height:1.5;color:#818a91;white-space:nowrap}.dropdown-backdrop{position:fixed;top:0;right:0;bottom:0;left:0;z-index:990}.pull-right>.dropdown-menu{right:0;left:auto}.dropup .caret,.navbar-fixed-bottom .dropdown .caret{content:\"\";border-top:0;border-bottom:.3em solid}.dropup .dropdown-menu,.navbar-fixed-bottom .dropdown .dropdown-menu{top:auto;bottom:100%;margin-bottom:2px}.btn-group,.btn-group-vertical{position:relative;display:inline-block;vertical-align:middle}.btn-group-vertical>.btn,.btn-group>.btn{position:relative;float:left}.btn-group-vertical>.btn.active,.btn-group-vertical>.btn:active,.btn-group-vertical>.btn:focus,.btn-group>.btn.active,.btn-group>.btn:active,.btn-group>.btn:focus{z-index:2}.btn-group-vertical>.btn:hover,.btn-group>.btn:hover{z-index:2}.btn-group .btn+.btn,.btn-group .btn+.btn-group,.btn-group .btn-group+.btn,.btn-group .btn-group+.btn-group{margin-left:-1px}.btn-toolbar{margin-left:-5px}.btn-toolbar::after{display:table;clear:both;content:\"\"}.btn-toolbar .btn-group,.btn-toolbar .input-group{float:left}.btn-toolbar>.btn,.btn-toolbar>.btn-group,.btn-toolbar>.input-group{margin-left:5px}.btn-group>.btn:not(:first-child):not(:last-child):not(.dropdown-toggle){border-radius:0}.btn-group>.btn:first-child{margin-left:0}.btn-group>.btn:first-child:not(:last-child):not(.dropdown-toggle){border-top-right-radius:0;border-bottom-right-radius:0}.btn-group>.btn:last-child:not(:first-child),.btn-group>.dropdown-toggle:not(:first-child){border-top-left-radius:0;border-bottom-left-radius:0}.btn-group>.btn-group{float:left}.btn-group>.btn-group:not(:first-child):not(:last-child)>.btn{border-radius:0}.btn-group>.btn-group:first-child:not(:last-child)>.btn:last-child,.btn-group>.btn-group:first-child:not(:last-child)>.dropdown-toggle{border-top-right-radius:0;border-bottom-right-radius:0}.btn-group>.btn-group:last-child:not(:first-child)>.btn:first-child{border-top-left-radius:0;border-bottom-left-radius:0}.btn-group .dropdown-toggle:active,.btn-group.open .dropdown-toggle{outline:0}.btn-group>.btn+.dropdown-toggle{padding-right:8px;padding-left:8px}.btn-group-lg.btn-group>.btn+.dropdown-toggle,.btn-group>.btn-lg+.dropdown-toggle{padding-right:12px;padding-left:12px}.btn .caret{margin-left:0}.btn-group-lg>.btn .caret,.btn-lg .caret{border-width:.3em .3em 0;border-bottom-width:0}.dropup .btn-group-lg>.btn .caret,.dropup .btn-lg .caret{border-width:0 .3em .3em}.btn-group-vertical>.btn,.btn-group-vertical>.btn-group,.btn-group-vertical>.btn-group>.btn{display:block;float:none;width:100%;max-width:100%}.btn-group-vertical>.btn-group::after{display:table;clear:both;content:\"\"}.btn-group-vertical>.btn-group>.btn{float:none}.btn-group-vertical>.btn+.btn,.btn-group-vertical>.btn+.btn-group,.btn-group-vertical>.btn-group+.btn,.btn-group-vertical>.btn-group+.btn-group{margin-top:-1px;margin-left:0}.btn-group-vertical>.btn:not(:first-child):not(:last-child){border-radius:0}.btn-group-vertical>.btn:first-child:not(:last-child){border-top-right-radius:.25rem;border-bottom-right-radius:0;border-bottom-left-radius:0}.btn-group-vertical>.btn:last-child:not(:first-child){border-top-left-radius:0;border-top-right-radius:0;border-bottom-left-radius:.25rem}.btn-group-vertical>.btn-group:not(:first-child):not(:last-child)>.btn{border-radius:0}.btn-group-vertical>.btn-group:first-child:not(:last-child)>.btn:last-child,.btn-group-vertical>.btn-group:first-child:not(:last-child)>.dropdown-toggle{border-bottom-right-radius:0;border-bottom-left-radius:0}.btn-group-vertical>.btn-group:last-child:not(:first-child)>.btn:first-child{border-top-left-radius:0;border-top-right-radius:0}[data-toggle=buttons]>.btn input[type=checkbox],[data-toggle=buttons]>.btn input[type=radio],[data-toggle=buttons]>.btn-group>.btn input[type=checkbox],[data-toggle=buttons]>.btn-group>.btn input[type=radio]{position:absolute;clip:rect(0,0,0,0);pointer-events:none}.input-group{position:relative;display:table;border-collapse:separate}.input-group .form-control{position:relative;z-index:2;float:left;width:100%;margin-bottom:0}.input-group .form-control:active,.input-group .form-control:focus,.input-group .form-control:hover{z-index:3}.input-group .form-control,.input-group-addon,.input-group-btn{display:table-cell}.input-group .form-control:not(:first-child):not(:last-child),.input-group-addon:not(:first-child):not(:last-child),.input-group-btn:not(:first-child):not(:last-child){border-radius:0}.input-group-addon,.input-group-btn{width:1%;white-space:nowrap;vertical-align:middle}.input-group-addon{padding:.375rem .75rem;font-size:1rem;font-weight:400;line-height:1;color:#55595c;text-align:center;background-color:#eceeef;border:1px solid #ccc;border-radius:.25rem}.input-group-addon.form-control-sm,.input-group-sm>.input-group-addon,.input-group-sm>.input-group-btn>.input-group-addon.btn{padding:.275rem .75rem;font-size:.875rem;border-radius:.2rem}.input-group-addon.form-control-lg,.input-group-lg>.input-group-addon,.input-group-lg>.input-group-btn>.input-group-addon.btn{padding:.75rem 1.25rem;font-size:1.25rem;border-radius:.3rem}.input-group-addon input[type=checkbox],.input-group-addon input[type=radio]{margin-top:0}.input-group .form-control:first-child,.input-group-addon:first-child,.input-group-btn:first-child>.btn,.input-group-btn:first-child>.btn-group>.btn,.input-group-btn:first-child>.dropdown-toggle,.input-group-btn:last-child>.btn-group:not(:last-child)>.btn,.input-group-btn:last-child>.btn:not(:last-child):not(.dropdown-toggle){border-top-right-radius:0;border-bottom-right-radius:0}.input-group-addon:first-child{border-right:0}.input-group .form-control:last-child,.input-group-addon:last-child,.input-group-btn:first-child>.btn-group:not(:first-child)>.btn,.input-group-btn:first-child>.btn:not(:first-child),.input-group-btn:last-child>.btn,.input-group-btn:last-child>.btn-group>.btn,.input-group-btn:last-child>.dropdown-toggle{border-top-left-radius:0;border-bottom-left-radius:0}.input-group-addon:last-child{border-left:0}.input-group-btn{position:relative;font-size:0;white-space:nowrap}.input-group-btn>.btn{position:relative}.input-group-btn>.btn+.btn{margin-left:-1px}.input-group-btn>.btn:active,.input-group-btn>.btn:focus,.input-group-btn>.btn:hover{z-index:3}.input-group-btn:first-child>.btn,.input-group-btn:first-child>.btn-group{margin-right:-1px}.input-group-btn:last-child>.btn,.input-group-btn:last-child>.btn-group{z-index:2;margin-left:-1px}.input-group-btn:last-child>.btn-group:active,.input-group-btn:last-child>.btn-group:focus,.input-group-btn:last-child>.btn-group:hover,.input-group-btn:last-child>.btn:active,.input-group-btn:last-child>.btn:focus,.input-group-btn:last-child>.btn:hover{z-index:3}.c-input{position:relative;display:inline;padding-left:1.5rem;color:#555;cursor:pointer}.c-input>input{position:absolute;z-index:-1;opacity:0}.c-input>input:checked~.c-indicator{color:#fff;background-color:#0074d9}.c-input>input:focus~.c-indicator{box-shadow:0 0 0 .075rem #fff,0 0 0 .2rem #0074d9}.c-input>input:active~.c-indicator{color:#fff;background-color:#84c6ff}.c-input+.c-input{margin-left:1rem}.c-indicator{position:absolute;top:0;left:0;display:block;width:1rem;height:1rem;font-size:65%;line-height:1rem;color:#eee;text-align:center;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#eee;background-repeat:no-repeat;background-position:center center;background-size:50% 50%}.c-checkbox .c-indicator{border-radius:.25rem}.c-checkbox input:checked~.c-indicator{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgOCA4IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA4IDgiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTYuNCwxTDUuNywxLjdMMi45LDQuNUwyLjEsMy43TDEuNCwzTDAsNC40bDAuNywwLjdsMS41LDEuNWwwLjcsMC43bDAuNy0wLjdsMy41LTMuNWwwLjctMC43TDYuNCwxTDYuNCwxeiINCgkvPg0KPC9zdmc+DQo=)}.c-checkbox input:indeterminate~.c-indicator{background-color:#0074d9;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iOHB4IiBoZWlnaHQ9IjhweCIgdmlld0JveD0iMCAwIDggOCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgOCA4IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik0wLDN2Mmg4VjNIMHoiLz4NCjwvc3ZnPg0K)}.c-radio .c-indicator{border-radius:50%}.c-radio input:checked~.c-indicator{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNy4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgOCA4IiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA4IDgiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTQsMUMyLjMsMSwxLDIuMywxLDRzMS4zLDMsMywzczMtMS4zLDMtM1M1LjcsMSw0LDF6Ii8+DQo8L3N2Zz4NCg==)}.c-inputs-stacked .c-input{display:inline}.c-inputs-stacked .c-input::after{display:block;margin-bottom:.25rem;content:\"\"}.c-inputs-stacked .c-input+.c-input{margin-left:0}.c-select{display:inline-block;max-width:100%;-webkit-appearance:none;padding:.375rem 1.75rem .375rem .75rem;color:#55595c;vertical-align:middle;background:#fff url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAUCAMAAACzvE1FAAAADFBMVEUzMzMzMzMzMzMzMzMKAG/3AAAAA3RSTlMAf4C/aSLHAAAAPElEQVR42q3NMQ4AIAgEQTn//2cLdRKppSGzBYwzVXvznNWs8C58CiussPJj8h6NwgorrKRdTvuV9v16Afn0AYFOB7aYAAAAAElFTkSuQmCC) no-repeat right .75rem center;background-size:8px 10px;border:1px solid #ccc;-moz-appearance:none}.c-select:focus{border-color:#51a7e8;outline:0}.c-select::-ms-expand{opacity:0}.c-select-sm{padding-top:3px;padding-bottom:3px;font-size:12px}.c-select-sm:not([multiple]){height:26px;min-height:26px}.file{position:relative;display:inline-block;height:2.5rem;cursor:pointer}.file input{min-width:14rem;margin:0;opacity:0}.file-custom{position:absolute;top:0;right:0;left:0;z-index:5;height:2.5rem;padding:.5rem 1rem;line-height:1.5;color:#555;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#fff;border:1px solid #ddd;border-radius:.25rem}.file-custom::after{content:\"Choose file...\"}.file-custom::before{position:absolute;top:-.075rem;right:-.075rem;bottom:-.075rem;z-index:6;display:block;height:2.5rem;padding:.5rem 1rem;line-height:1.5;color:#555;content:\"Browse\";background-color:#eee;border:1px solid #ddd;border-radius:0 .25rem .25rem 0}.nav{padding-left:0;margin-bottom:0;list-style:none}.nav-link{display:inline-block}.nav-link:focus,.nav-link:hover{text-decoration:none}.nav-link.disabled{color:#818a91}.nav-link.disabled,.nav-link.disabled:focus,.nav-link.disabled:hover{color:#818a91;cursor:not-allowed;background-color:transparent}.nav-inline .nav-item{display:inline-block}.nav-inline .nav-item+.nav-item,.nav-inline .nav-link+.nav-link{margin-left:1rem}.nav-tabs{border-bottom:1px solid #ddd}.nav-tabs::after{display:table;clear:both;content:\"\"}.nav-tabs .nav-item{float:left;margin-bottom:-1px}.nav-tabs .nav-item+.nav-item{margin-left:.2rem}.nav-tabs .nav-link{display:block;padding:.5em 1em;border:1px solid transparent;border-radius:.25rem .25rem 0 0}.nav-tabs .nav-link:focus,.nav-tabs .nav-link:hover{border-color:#eceeef #eceeef #ddd}.nav-tabs .nav-link.disabled,.nav-tabs .nav-link.disabled:focus,.nav-tabs .nav-link.disabled:hover{color:#818a91;background-color:transparent;border-color:transparent}.nav-tabs .nav-item.open .nav-link,.nav-tabs .nav-item.open .nav-link:focus,.nav-tabs .nav-item.open .nav-link:hover,.nav-tabs .nav-link.active,.nav-tabs .nav-link.active:focus,.nav-tabs .nav-link.active:hover{color:#55595c;background-color:#fff;border-color:#ddd #ddd transparent}.nav-pills::after{display:table;clear:both;content:\"\"}.nav-pills .nav-item{float:left}.nav-pills .nav-item+.nav-item{margin-left:.2rem}.nav-pills .nav-link{display:block;padding:.5em 1em;border-radius:.25rem}.nav-pills .nav-item.open .nav-link,.nav-pills .nav-item.open .nav-link:focus,.nav-pills .nav-item.open .nav-link:hover,.nav-pills .nav-link.active,.nav-pills .nav-link.active:focus,.nav-pills .nav-link.active:hover{color:#fff;cursor:default;background-color:#0275d8}.nav-stacked .nav-item{display:block;float:none}.nav-stacked .nav-item+.nav-item{margin-top:.2rem;margin-left:0}.tab-content>.tab-pane{display:none}.tab-content>.active{display:block}.nav-tabs .dropdown-menu{margin-top:-1px;border-top-left-radius:0;border-top-right-radius:0}.navbar{position:relative;padding:.5rem 1rem}.navbar::after{display:table;clear:both;content:\"\"}@media (min-width:544px){.navbar{border-radius:.25rem}}.navbar-full{z-index:1000}@media (min-width:544px){.navbar-full{border-radius:0}}.navbar-fixed-bottom,.navbar-fixed-top{position:fixed;right:0;left:0;z-index:1030}@media (min-width:544px){.navbar-fixed-bottom,.navbar-fixed-top{border-radius:0}}.navbar-fixed-top{top:0}.navbar-fixed-bottom{bottom:0}.navbar-sticky-top{position:-webkit-sticky;position:sticky;top:0;z-index:1030;width:100%}@media (min-width:544px){.navbar-sticky-top{border-radius:0}}.navbar-brand{float:left;padding-top:.25rem;padding-bottom:.25rem;margin-right:1rem;font-size:1.25rem}.navbar-brand:focus,.navbar-brand:hover{text-decoration:none}.navbar-brand>img{display:block}.navbar-divider{float:left;width:1px;padding-top:.425rem;padding-bottom:.425rem;margin-right:1rem;margin-left:1rem;overflow:hidden}.navbar-divider::before{content:\"\\A0\"}.navbar-toggler{padding:.5rem .75rem;font-size:1.25rem;line-height:1;background:0 0;border:1px solid transparent;border-radius:.25rem}.navbar-toggler:focus,.navbar-toggler:hover{text-decoration:none}@media (min-width:544px){.navbar-toggleable-xs{display:block!important}}@media (min-width:768px){.navbar-toggleable-sm{display:block!important}}@media (min-width:992px){.navbar-toggleable-md{display:block!important}}.navbar-nav .nav-item{float:left}.navbar-nav .nav-link{display:block;padding-top:.425rem;padding-bottom:.425rem}.navbar-nav .nav-link+.nav-link{margin-left:1rem}.navbar-nav .nav-item+.nav-item{margin-left:1rem}.navbar-light .navbar-brand{color:rgba(0,0,0,.8)}.navbar-light .navbar-brand:focus,.navbar-light .navbar-brand:hover{color:rgba(0,0,0,.8)}.navbar-light .navbar-nav .nav-link{color:rgba(0,0,0,.3)}.navbar-light .navbar-nav .nav-link:focus,.navbar-light .navbar-nav .nav-link:hover{color:rgba(0,0,0,.6)}.navbar-light .navbar-nav .active>.nav-link,.navbar-light .navbar-nav .active>.nav-link:focus,.navbar-light .navbar-nav .active>.nav-link:hover,.navbar-light .navbar-nav .nav-link.active,.navbar-light .navbar-nav .nav-link.active:focus,.navbar-light .navbar-nav .nav-link.active:hover,.navbar-light .navbar-nav .nav-link.open,.navbar-light .navbar-nav .nav-link.open:focus,.navbar-light .navbar-nav .nav-link.open:hover,.navbar-light .navbar-nav .open>.nav-link,.navbar-light .navbar-nav .open>.nav-link:focus,.navbar-light .navbar-nav .open>.nav-link:hover{color:rgba(0,0,0,.8)}.navbar-light .navbar-divider{background-color:rgba(0,0,0,.075)}.navbar-dark .navbar-brand{color:#fff}.navbar-dark .navbar-brand:focus,.navbar-dark .navbar-brand:hover{color:#fff}.navbar-dark .navbar-nav .nav-link{color:rgba(255,255,255,.5)}.navbar-dark .navbar-nav .nav-link:focus,.navbar-dark .navbar-nav .nav-link:hover{color:rgba(255,255,255,.75)}.navbar-dark .navbar-nav .active>.nav-link,.navbar-dark .navbar-nav .active>.nav-link:focus,.navbar-dark .navbar-nav .active>.nav-link:hover,.navbar-dark .navbar-nav .nav-link.active,.navbar-dark .navbar-nav .nav-link.active:focus,.navbar-dark .navbar-nav .nav-link.active:hover,.navbar-dark .navbar-nav .nav-link.open,.navbar-dark .navbar-nav .nav-link.open:focus,.navbar-dark .navbar-nav .nav-link.open:hover,.navbar-dark .navbar-nav .open>.nav-link,.navbar-dark .navbar-nav .open>.nav-link:focus,.navbar-dark .navbar-nav .open>.nav-link:hover{color:#fff}.navbar-dark .navbar-divider{background-color:rgba(255,255,255,.075)}.card{position:relative;display:block;margin-bottom:.75rem;background-color:#fff;border:1px solid #e5e5e5;border-radius:.25rem}.card-block{padding:1.25rem}.card-title{margin-bottom:.75rem}.card-subtitle{margin-top:-.375rem;margin-bottom:0}.card-text:last-child{margin-bottom:0}.card-link:hover{text-decoration:none}.card-link+.card-link{margin-left:1.25rem}.card>.list-group:first-child .list-group-item:first-child{border-radius:.25rem .25rem 0 0}.card>.list-group:last-child .list-group-item:last-child{border-radius:0 0 .25rem .25rem}.card-header{padding:.75rem 1.25rem;background-color:#f5f5f5;border-bottom:1px solid #e5e5e5}.card-header:first-child{border-radius:.25rem .25rem 0 0}.card-footer{padding:.75rem 1.25rem;background-color:#f5f5f5;border-top:1px solid #e5e5e5}.card-footer:last-child{border-radius:0 0 .25rem .25rem}.card-primary{background-color:#0275d8;border-color:#0275d8}.card-success{background-color:#5cb85c;border-color:#5cb85c}.card-info{background-color:#5bc0de;border-color:#5bc0de}.card-warning{background-color:#f0ad4e;border-color:#f0ad4e}.card-danger{background-color:#d9534f;border-color:#d9534f}.card-primary-outline{background-color:transparent;border-color:#0275d8}.card-secondary-outline{background-color:transparent;border-color:#ccc}.card-info-outline{background-color:transparent;border-color:#5bc0de}.card-success-outline{background-color:transparent;border-color:#5cb85c}.card-warning-outline{background-color:transparent;border-color:#f0ad4e}.card-danger-outline{background-color:transparent;border-color:#d9534f}.card-inverse .card-footer,.card-inverse .card-header{border-bottom:1px solid rgba(255,255,255,.2)}.card-inverse .card-blockquote,.card-inverse .card-footer,.card-inverse .card-header,.card-inverse .card-title{color:#fff}.card-inverse .card-blockquote>footer,.card-inverse .card-link,.card-inverse .card-text{color:rgba(255,255,255,.65)}.card-inverse .card-link:focus,.card-inverse .card-link:hover{color:#fff}.card-blockquote{padding:0;margin-bottom:0;border-left:0}.card-img{border-radius:.25rem}.card-img-overlay{position:absolute;top:0;right:0;bottom:0;left:0;padding:1.25rem}.card-img-top{border-radius:.25rem .25rem 0 0}.card-img-bottom{border-radius:0 0 .25rem .25rem}@media (min-width:544px){.card-deck{display:table;table-layout:fixed;border-spacing:1.25rem 0}.card-deck .card{display:table-cell;width:1%;vertical-align:top}.card-deck-wrapper{margin-right:-1.25rem;margin-left:-1.25rem}}@media (min-width:544px){.card-group{display:table;width:100%;table-layout:fixed}.card-group .card{display:table-cell;vertical-align:top}.card-group .card+.card{margin-left:0;border-left:0}.card-group .card:first-child{border-top-right-radius:0;border-bottom-right-radius:0}.card-group .card:first-child .card-img-top{border-top-right-radius:0}.card-group .card:first-child .card-img-bottom{border-bottom-right-radius:0}.card-group .card:last-child{border-top-left-radius:0;border-bottom-left-radius:0}.card-group .card:last-child .card-img-top{border-top-left-radius:0}.card-group .card:last-child .card-img-bottom{border-bottom-left-radius:0}.card-group .card:not(:first-child):not(:last-child){border-radius:0}.card-group .card:not(:first-child):not(:last-child) .card-img-bottom,.card-group .card:not(:first-child):not(:last-child) .card-img-top{border-radius:0}}@media (min-width:544px){.card-columns{column-count:3;column-gap:1.25rem}.card-columns .card{display:inline-block;width:100%}}.breadcrumb{padding:.75rem 1rem;margin-bottom:1rem;list-style:none;background-color:#eceeef;border-radius:.25rem}.breadcrumb::after{display:table;clear:both;content:\"\"}.breadcrumb>li{float:left}.breadcrumb>li+li::before{padding-right:.5rem;padding-left:.5rem;color:#818a91;content:\"/\"}.breadcrumb>.active{color:#818a91}.pagination{display:inline-block;padding-left:0;margin-top:1rem;margin-bottom:1rem;border-radius:.25rem}.page-item{display:inline}.page-item:first-child .page-link{margin-left:0;border-top-left-radius:.25rem;border-bottom-left-radius:.25rem}.page-item:last-child .page-link{border-top-right-radius:.25rem;border-bottom-right-radius:.25rem}.page-item.active .page-link,.page-item.active .page-link:focus,.page-item.active .page-link:hover{z-index:2;color:#fff;cursor:default;background-color:#0275d8;border-color:#0275d8}.page-item.disabled .page-link,.page-item.disabled .page-link:focus,.page-item.disabled .page-link:hover{color:#818a91;cursor:not-allowed;background-color:#fff;border-color:#ddd}.page-link{position:relative;float:left;padding:.5rem .75rem;margin-left:-1px;line-height:1.5;color:#0275d8;text-decoration:none;background-color:#fff;border:1px solid #ddd}.page-link:focus,.page-link:hover{color:#014c8c;background-color:#eceeef;border-color:#ddd}.pagination-lg .page-link{padding:.75rem 1.5rem;font-size:1.25rem;line-height:1.333333}.pagination-lg .page-item:first-child .page-link{border-top-left-radius:.3rem;border-bottom-left-radius:.3rem}.pagination-lg .page-item:last-child .page-link{border-top-right-radius:.3rem;border-bottom-right-radius:.3rem}.pagination-sm .page-link{padding:.275rem .75rem;font-size:.875rem;line-height:1.5}.pagination-sm .page-item:first-child .page-link{border-top-left-radius:.2rem;border-bottom-left-radius:.2rem}.pagination-sm .page-item:last-child .page-link{border-top-right-radius:.2rem;border-bottom-right-radius:.2rem}.pager{padding-left:0;margin-top:1rem;margin-bottom:1rem;text-align:center;list-style:none}.pager::after{display:table;clear:both;content:\"\"}.pager li{display:inline}.pager li>a,.pager li>span{display:inline-block;padding:5px 14px;background-color:#fff;border:1px solid #ddd;border-radius:15px}.pager li>a:focus,.pager li>a:hover{text-decoration:none;background-color:#eceeef}.pager .disabled>a,.pager .disabled>a:focus,.pager .disabled>a:hover{color:#818a91;cursor:not-allowed;background-color:#fff}.pager .disabled>span{color:#818a91;cursor:not-allowed;background-color:#fff}.pager-next>a,.pager-next>span{float:right}.pager-prev>a,.pager-prev>span{float:left}.label{display:inline-block;padding:.25em .4em;font-size:75%;font-weight:700;line-height:1;color:#fff;text-align:center;white-space:nowrap;vertical-align:baseline;border-radius:.25rem}.label:empty{display:none}.btn .label{position:relative;top:-1px}a.label:focus,a.label:hover{color:#fff;text-decoration:none;cursor:pointer}.label-pill{padding-right:.6em;padding-left:.6em;border-radius:10rem}.label-default{background-color:#818a91}.label-default[href]:focus,.label-default[href]:hover{background-color:#687077}.label-primary{background-color:#0275d8}.label-primary[href]:focus,.label-primary[href]:hover{background-color:#025aa5}.label-success{background-color:#5cb85c}.label-success[href]:focus,.label-success[href]:hover{background-color:#449d44}.label-info{background-color:#5bc0de}.label-info[href]:focus,.label-info[href]:hover{background-color:#31b0d5}.label-warning{background-color:#f0ad4e}.label-warning[href]:focus,.label-warning[href]:hover{background-color:#ec971f}.label-danger{background-color:#d9534f}.label-danger[href]:focus,.label-danger[href]:hover{background-color:#c9302c}.jumbotron{padding:2rem 1rem;margin-bottom:2rem;background-color:#eceeef;border-radius:.3rem}@media (min-width:544px){.jumbotron{padding:4rem 2rem}}.jumbotron-hr{border-top-color:#d0d5d8}.jumbotron-fluid{padding-right:0;padding-left:0;border-radius:0}.alert{padding:15px;margin-bottom:1rem;border:1px solid transparent;border-radius:.25rem}.alert>p,.alert>ul{margin-bottom:0}.alert>p+p{margin-top:5px}.alert-heading{color:inherit}.alert-link{font-weight:700}.alert-dismissible{padding-right:35px}.alert-dismissible .close{position:relative;top:-2px;right:-21px;color:inherit}.alert-success{color:#3c763d;background-color:#dff0d8;border-color:#d0e9c6}.alert-success hr{border-top-color:#c1e2b3}.alert-success .alert-link{color:#2b542c}.alert-info{color:#31708f;background-color:#d9edf7;border-color:#bcdff1}.alert-info hr{border-top-color:#a6d5ec}.alert-info .alert-link{color:#245269}.alert-warning{color:#8a6d3b;background-color:#fcf8e3;border-color:#faf2cc}.alert-warning hr{border-top-color:#f7ecb5}.alert-warning .alert-link{color:#66512c}.alert-danger{color:#a94442;background-color:#f2dede;border-color:#ebcccc}.alert-danger hr{border-top-color:#e4b9b9}.alert-danger .alert-link{color:#843534}@keyframes progress-bar-stripes{from{background-position:1rem 0}to{background-position:0 0}}.progress{display:block;width:100%;height:1rem;margin-bottom:1rem}.progress[value]{-webkit-appearance:none;color:#0074d9;border:0;-moz-appearance:none;appearance:none}.progress[value]::-webkit-progress-bar{background-color:#eee;border-radius:.25rem}.progress[value]::-webkit-progress-value::before{content:attr(value)}.progress[value]::-webkit-progress-value{background-color:#0074d9;border-top-left-radius:.25rem;border-bottom-left-radius:.25rem}.progress[value=\"100\"]::-webkit-progress-value{border-top-right-radius:.25rem;border-bottom-right-radius:.25rem}@media screen and (min-width:0\\0){.progress{background-color:#eee;border-radius:.25rem}.progress-bar{display:inline-block;height:1rem;text-indent:-999rem;background-color:#0074d9;border-top-left-radius:.25rem;border-bottom-left-radius:.25rem}.progress[width^=\"0\"]{min-width:2rem;color:#818a91;background-color:transparent;background-image:none}.progress[width=\"100%\"]{border-top-right-radius:.25rem;border-bottom-right-radius:.25rem}}.progress-striped[value]::-webkit-progress-value{background-image:linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);background-size:1rem 1rem}.progress-striped[value]::-moz-progress-bar{background-image:linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);background-size:1rem 1rem}@media screen and (min-width:0\\0){.progress-bar-striped{background-image:linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);background-size:1rem 1rem}}.progress-animated[value]::-webkit-progress-value{animation:progress-bar-stripes 2s linear infinite}.progress-animated[value]::-moz-progress-bar{animation:progress-bar-stripes 2s linear infinite}@media screen and (min-width:0\\0){.progress-animated .progress-bar-striped{animation:progress-bar-stripes 2s linear infinite}}.progress-success[value]::-webkit-progress-value{background-color:#5cb85c}.progress-success[value]::-moz-progress-bar{background-color:#5cb85c}@media screen and (min-width:0\\0){.progress-success .progress-bar{background-color:#5cb85c}}.progress-info[value]::-webkit-progress-value{background-color:#5bc0de}.progress-info[value]::-moz-progress-bar{background-color:#5bc0de}@media screen and (min-width:0\\0){.progress-info .progress-bar{background-color:#5bc0de}}.progress-warning[value]::-webkit-progress-value{background-color:#f0ad4e}.progress-warning[value]::-moz-progress-bar{background-color:#f0ad4e}@media screen and (min-width:0\\0){.progress-warning .progress-bar{background-color:#f0ad4e}}.progress-danger[value]::-webkit-progress-value{background-color:#d9534f}.progress-danger[value]::-moz-progress-bar{background-color:#d9534f}@media screen and (min-width:0\\0){.progress-danger .progress-bar{background-color:#d9534f}}.media{margin-top:15px}.media:first-child{margin-top:0}.media,.media-body{overflow:hidden;zoom:1}.media-body{width:10000px}.media-body,.media-left,.media-right{display:table-cell;vertical-align:top}.media-middle{vertical-align:middle}.media-bottom{vertical-align:bottom}.media-object{display:block}.media-object.img-thumbnail{max-width:none}.media-right{padding-left:10px}.media-left{padding-right:10px}.media-heading{margin-top:0;margin-bottom:5px}.media-list{padding-left:0;list-style:none}.list-group{padding-left:0;margin-bottom:0}.list-group-item{position:relative;display:block;padding:.75rem 1.25rem;margin-bottom:-1px;background-color:#fff;border:1px solid #ddd}.list-group-item:first-child{border-top-left-radius:.25rem;border-top-right-radius:.25rem}.list-group-item:last-child{margin-bottom:0;border-bottom-right-radius:.25rem;border-bottom-left-radius:.25rem}.list-group-flush .list-group-item{border-width:1px 0;border-radius:0}.list-group-flush:first-child .list-group-item:first-child{border-top:0}.list-group-flush:last-child .list-group-item:last-child{border-bottom:0}a.list-group-item,button.list-group-item{width:100%;color:#555;text-align:inherit}a.list-group-item .list-group-item-heading,button.list-group-item .list-group-item-heading{color:#333}a.list-group-item:focus,a.list-group-item:hover,button.list-group-item:focus,button.list-group-item:hover{color:#555;text-decoration:none;background-color:#f5f5f5}.list-group-item.disabled,.list-group-item.disabled:focus,.list-group-item.disabled:hover{color:#818a91;cursor:not-allowed;background-color:#eceeef}.list-group-item.disabled .list-group-item-heading,.list-group-item.disabled:focus .list-group-item-heading,.list-group-item.disabled:hover .list-group-item-heading{color:inherit}.list-group-item.disabled .list-group-item-text,.list-group-item.disabled:focus .list-group-item-text,.list-group-item.disabled:hover .list-group-item-text{color:#818a91}.list-group-item.active,.list-group-item.active:focus,.list-group-item.active:hover{z-index:2;color:#fff;background-color:#0275d8;border-color:#0275d8}.list-group-item.active .list-group-item-heading,.list-group-item.active .list-group-item-heading>.small,.list-group-item.active .list-group-item-heading>small,.list-group-item.active:focus .list-group-item-heading,.list-group-item.active:focus .list-group-item-heading>.small,.list-group-item.active:focus .list-group-item-heading>small,.list-group-item.active:hover .list-group-item-heading,.list-group-item.active:hover .list-group-item-heading>.small,.list-group-item.active:hover .list-group-item-heading>small{color:inherit}.list-group-item.active .list-group-item-text,.list-group-item.active:focus .list-group-item-text,.list-group-item.active:hover .list-group-item-text{color:#a8d6fe}.list-group-item-success{color:#3c763d;background-color:#dff0d8}a.list-group-item-success,button.list-group-item-success{color:#3c763d}a.list-group-item-success .list-group-item-heading,button.list-group-item-success .list-group-item-heading{color:inherit}a.list-group-item-success:focus,a.list-group-item-success:hover,button.list-group-item-success:focus,button.list-group-item-success:hover{color:#3c763d;background-color:#d0e9c6}a.list-group-item-success.active,a.list-group-item-success.active:focus,a.list-group-item-success.active:hover,button.list-group-item-success.active,button.list-group-item-success.active:focus,button.list-group-item-success.active:hover{color:#fff;background-color:#3c763d;border-color:#3c763d}.list-group-item-info{color:#31708f;background-color:#d9edf7}a.list-group-item-info,button.list-group-item-info{color:#31708f}a.list-group-item-info .list-group-item-heading,button.list-group-item-info .list-group-item-heading{color:inherit}a.list-group-item-info:focus,a.list-group-item-info:hover,button.list-group-item-info:focus,button.list-group-item-info:hover{color:#31708f;background-color:#c4e3f3}a.list-group-item-info.active,a.list-group-item-info.active:focus,a.list-group-item-info.active:hover,button.list-group-item-info.active,button.list-group-item-info.active:focus,button.list-group-item-info.active:hover{color:#fff;background-color:#31708f;border-color:#31708f}.list-group-item-warning{color:#8a6d3b;background-color:#fcf8e3}a.list-group-item-warning,button.list-group-item-warning{color:#8a6d3b}a.list-group-item-warning .list-group-item-heading,button.list-group-item-warning .list-group-item-heading{color:inherit}a.list-group-item-warning:focus,a.list-group-item-warning:hover,button.list-group-item-warning:focus,button.list-group-item-warning:hover{color:#8a6d3b;background-color:#faf2cc}a.list-group-item-warning.active,a.list-group-item-warning.active:focus,a.list-group-item-warning.active:hover,button.list-group-item-warning.active,button.list-group-item-warning.active:focus,button.list-group-item-warning.active:hover{color:#fff;background-color:#8a6d3b;border-color:#8a6d3b}.list-group-item-danger{color:#a94442;background-color:#f2dede}a.list-group-item-danger,button.list-group-item-danger{color:#a94442}a.list-group-item-danger .list-group-item-heading,button.list-group-item-danger .list-group-item-heading{color:inherit}a.list-group-item-danger:focus,a.list-group-item-danger:hover,button.list-group-item-danger:focus,button.list-group-item-danger:hover{color:#a94442;background-color:#ebcccc}a.list-group-item-danger.active,a.list-group-item-danger.active:focus,a.list-group-item-danger.active:hover,button.list-group-item-danger.active,button.list-group-item-danger.active:focus,button.list-group-item-danger.active:hover{color:#fff;background-color:#a94442;border-color:#a94442}.list-group-item-heading{margin-top:0;margin-bottom:5px}.list-group-item-text{margin-bottom:0;line-height:1.3}.embed-responsive{position:relative;display:block;height:0;padding:0;overflow:hidden}.embed-responsive .embed-responsive-item,.embed-responsive embed,.embed-responsive iframe,.embed-responsive object,.embed-responsive video{position:absolute;top:0;bottom:0;left:0;width:100%;height:100%;border:0}.embed-responsive-21by9{padding-bottom:42.857143%}.embed-responsive-16by9{padding-bottom:56.25%}.embed-responsive-4by3{padding-bottom:75%}.embed-responsive-1by1{padding-bottom:100%}.close{float:right;font-size:1.5rem;font-weight:700;line-height:1;color:#000;text-shadow:0 1px 0 #fff;opacity:.2}.close:focus,.close:hover{color:#000;text-decoration:none;cursor:pointer;opacity:.5}button.close{-webkit-appearance:none;padding:0;cursor:pointer;background:0 0;border:0}.modal-open{overflow:hidden}.modal{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1050;display:none;overflow:hidden;-webkit-overflow-scrolling:touch;outline:0}.modal.fade .modal-dialog{transition:transform .3s ease-out;transform:translate(0,-25%)}.modal.in .modal-dialog{transform:translate(0,0)}.modal-open .modal{overflow-x:hidden;overflow-y:auto}.modal-dialog{position:relative;width:auto;margin:10px}.modal-content{position:relative;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.2);border-radius:.3rem;outline:0}.modal-backdrop{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1040;background-color:#000}.modal-backdrop.fade{opacity:0}.modal-backdrop.in{opacity:.5}.modal-header{padding:15px;border-bottom:1px solid #e5e5e5}.modal-header::after{display:table;clear:both;content:\"\"}.modal-header .close{margin-top:-2px}.modal-title{margin:0;line-height:1.5}.modal-body{position:relative;padding:15px}.modal-footer{padding:15px;text-align:right;border-top:1px solid #e5e5e5}.modal-footer::after{display:table;clear:both;content:\"\"}.modal-footer .btn+.btn{margin-bottom:0;margin-left:5px}.modal-footer .btn-group .btn+.btn{margin-left:-1px}.modal-footer .btn-block+.btn-block{margin-left:0}.modal-scrollbar-measure{position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll}@media (min-width:544px){.modal-dialog{width:600px;margin:30px auto}.modal-sm{width:300px}}@media (min-width:768px){.modal-lg{width:900px}}.tooltip{position:absolute;z-index:1070;display:block;font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;font-size:.875rem;font-style:normal;font-weight:400;line-height:1.5;text-align:left;text-align:start;text-decoration:none;text-shadow:none;text-transform:none;letter-spacing:normal;word-break:normal;word-spacing:normal;word-wrap:normal;white-space:normal;opacity:0;line-break:auto}.tooltip.in{opacity:.9}.tooltip.bs-tether-element-attached-bottom,.tooltip.tooltip-top{padding:5px 0;margin-top:-3px}.tooltip.bs-tether-element-attached-bottom .tooltip-arrow,.tooltip.tooltip-top .tooltip-arrow{bottom:0;left:50%;margin-left:-5px;border-width:5px 5px 0;border-top-color:#000}.tooltip.bs-tether-element-attached-left,.tooltip.tooltip-right{padding:0 5px;margin-left:3px}.tooltip.bs-tether-element-attached-left .tooltip-arrow,.tooltip.tooltip-right .tooltip-arrow{top:50%;left:0;margin-top:-5px;border-width:5px 5px 5px 0;border-right-color:#000}.tooltip.bs-tether-element-attached-top,.tooltip.tooltip-bottom{padding:5px 0;margin-top:3px}.tooltip.bs-tether-element-attached-top .tooltip-arrow,.tooltip.tooltip-bottom .tooltip-arrow{top:0;left:50%;margin-left:-5px;border-width:0 5px 5px;border-bottom-color:#000}.tooltip.bs-tether-element-attached-right,.tooltip.tooltip-left{padding:0 5px;margin-left:-3px}.tooltip.bs-tether-element-attached-right .tooltip-arrow,.tooltip.tooltip-left .tooltip-arrow{top:50%;right:0;margin-top:-5px;border-width:5px 0 5px 5px;border-left-color:#000}.tooltip-inner{max-width:200px;padding:3px 8px;color:#fff;text-align:center;background-color:#000;border-radius:.25rem}.tooltip-arrow{position:absolute;width:0;height:0;border-color:transparent;border-style:solid}.popover{position:absolute;top:0;left:0;z-index:1060;display:block;max-width:276px;padding:1px;font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;font-size:.875rem;font-style:normal;font-weight:400;line-height:1.5;text-align:left;text-align:start;text-decoration:none;text-shadow:none;text-transform:none;letter-spacing:normal;word-break:normal;word-spacing:normal;word-wrap:normal;white-space:normal;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.2);border-radius:.3rem;line-break:auto}.popover.bs-tether-element-attached-bottom,.popover.popover-top{margin-top:-10px}.popover.bs-tether-element-attached-bottom .popover-arrow,.popover.popover-top .popover-arrow{bottom:-11px;left:50%;margin-left:-11px;border-top-color:rgba(0,0,0,.25);border-bottom-width:0}.popover.bs-tether-element-attached-bottom .popover-arrow::after,.popover.popover-top .popover-arrow::after{bottom:1px;margin-left:-10px;content:\"\";border-top-color:#fff;border-bottom-width:0}.popover.bs-tether-element-attached-left,.popover.popover-right{margin-left:10px}.popover.bs-tether-element-attached-left .popover-arrow,.popover.popover-right .popover-arrow{top:50%;left:-11px;margin-top:-11px;border-right-color:rgba(0,0,0,.25);border-left-width:0}.popover.bs-tether-element-attached-left .popover-arrow::after,.popover.popover-right .popover-arrow::after{bottom:-10px;left:1px;content:\"\";border-right-color:#fff;border-left-width:0}.popover.bs-tether-element-attached-top,.popover.popover-bottom{margin-top:10px}.popover.bs-tether-element-attached-top .popover-arrow,.popover.popover-bottom .popover-arrow{top:-11px;left:50%;margin-left:-11px;border-top-width:0;border-bottom-color:rgba(0,0,0,.25)}.popover.bs-tether-element-attached-top .popover-arrow::after,.popover.popover-bottom .popover-arrow::after{top:1px;margin-left:-10px;content:\"\";border-top-width:0;border-bottom-color:#fff}.popover.bs-tether-element-attached-right,.popover.popover-left{margin-left:-10px}.popover.bs-tether-element-attached-right .popover-arrow,.popover.popover-left .popover-arrow{top:50%;right:-11px;margin-top:-11px;border-right-width:0;border-left-color:rgba(0,0,0,.25)}.popover.bs-tether-element-attached-right .popover-arrow::after,.popover.popover-left .popover-arrow::after{right:1px;bottom:-10px;content:\"\";border-right-width:0;border-left-color:#fff}.popover-title{padding:8px 14px;margin:0;font-size:1rem;background-color:#f7f7f7;border-bottom:1px solid #ebebeb;border-radius:-.7rem -.7rem 0 0}.popover-content{padding:9px 14px}.popover-arrow,.popover-arrow::after{position:absolute;display:block;width:0;height:0;border-color:transparent;border-style:solid}.popover-arrow{border-width:11px}.popover-arrow::after{content:\"\";border-width:10px}.carousel{position:relative}.carousel-inner{position:relative;width:100%;overflow:hidden}.carousel-inner>.carousel-item{position:relative;display:none;transition:.6s ease-in-out left}.carousel-inner>.carousel-item>a>img,.carousel-inner>.carousel-item>img{line-height:1}@media all and (transform-3d),(-webkit-transform-3d){.carousel-inner>.carousel-item{transition:transform .6s ease-in-out;-webkit-backface-visibility:hidden;backface-visibility:hidden;perspective:1000px}.carousel-inner>.carousel-item.active.right,.carousel-inner>.carousel-item.next{left:0;transform:translate3d(100%,0,0)}.carousel-inner>.carousel-item.active.left,.carousel-inner>.carousel-item.prev{left:0;transform:translate3d(-100%,0,0)}.carousel-inner>.carousel-item.active,.carousel-inner>.carousel-item.next.left,.carousel-inner>.carousel-item.prev.right{left:0;transform:translate3d(0,0,0)}}.carousel-inner>.active,.carousel-inner>.next,.carousel-inner>.prev{display:block}.carousel-inner>.active{left:0}.carousel-inner>.next,.carousel-inner>.prev{position:absolute;top:0;width:100%}.carousel-inner>.next{left:100%}.carousel-inner>.prev{left:-100%}.carousel-inner>.next.left,.carousel-inner>.prev.right{left:0}.carousel-inner>.active.left{left:-100%}.carousel-inner>.active.right{left:100%}.carousel-control{position:absolute;top:0;bottom:0;left:0;width:15%;font-size:20px;color:#fff;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.6);opacity:.5}.carousel-control.left{background-image:linear-gradient(to right,rgba(0,0,0,.5) 0,rgba(0,0,0,.0001) 100%);background-repeat:repeat-x}.carousel-control.right{right:0;left:auto;background-image:linear-gradient(to right,rgba(0,0,0,.0001) 0,rgba(0,0,0,.5) 100%);background-repeat:repeat-x}.carousel-control:focus,.carousel-control:hover{color:#fff;text-decoration:none;outline:0;opacity:.9}.carousel-control .icon-next,.carousel-control .icon-prev{position:absolute;top:50%;z-index:5;display:inline-block;width:20px;height:20px;margin-top:-10px;font-family:serif;line-height:1}.carousel-control .icon-prev{left:50%;margin-left:-10px}.carousel-control .icon-next{right:50%;margin-right:-10px}.carousel-control .icon-prev::before{content:\"\\2039\"}.carousel-control .icon-next::before{content:\"\\203A\"}.carousel-indicators{position:absolute;bottom:10px;left:50%;z-index:15;width:60%;padding-left:0;margin-left:-30%;text-align:center;list-style:none}.carousel-indicators li{display:inline-block;width:10px;height:10px;margin:1px;text-indent:-999px;cursor:pointer;background-color:transparent;border:1px solid #fff;border-radius:10px}.carousel-indicators .active{width:12px;height:12px;margin:0;background-color:#fff}.carousel-caption{position:absolute;right:15%;bottom:20px;left:15%;z-index:10;padding-top:20px;padding-bottom:20px;color:#fff;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.6)}.carousel-caption .btn{text-shadow:none}@media (min-width:544px){.carousel-control .icon-next,.carousel-control .icon-prev{width:30px;height:30px;margin-top:-15px;font-size:30px}.carousel-control .icon-prev{margin-left:-15px}.carousel-control .icon-next{margin-right:-15px}.carousel-caption{right:20%;left:20%;padding-bottom:30px}.carousel-indicators{bottom:20px}}.clearfix::after{display:table;clear:both;content:\"\"}.center-block{display:block;margin-right:auto;margin-left:auto}.pull-xs-left{float:left!important}.pull-xs-right{float:right!important}.pull-xs-none{float:none!important}@media (min-width:544px){.pull-sm-left{float:left!important}.pull-sm-right{float:right!important}.pull-sm-none{float:none!important}}@media (min-width:768px){.pull-md-left{float:left!important}.pull-md-right{float:right!important}.pull-md-none{float:none!important}}@media (min-width:992px){.pull-lg-left{float:left!important}.pull-lg-right{float:right!important}.pull-lg-none{float:none!important}}@media (min-width:1200px){.pull-xl-left{float:left!important}.pull-xl-right{float:right!important}.pull-xl-none{float:none!important}}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}.sr-only-focusable:active,.sr-only-focusable:focus{position:static;width:auto;height:auto;margin:0;overflow:visible;clip:auto}.invisible{visibility:hidden!important}.text-hide{font:\"0/0\" a;color:transparent;text-shadow:none;background-color:transparent;border:0}.text-justify{text-align:justify!important}.text-nowrap{white-space:nowrap!important}.text-truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.text-xs-left{text-align:left!important}.text-xs-right{text-align:right!important}.text-xs-center{text-align:center!important}@media (min-width:544px){.text-sm-left{text-align:left!important}.text-sm-right{text-align:right!important}.text-sm-center{text-align:center!important}}@media (min-width:768px){.text-md-left{text-align:left!important}.text-md-right{text-align:right!important}.text-md-center{text-align:center!important}}@media (min-width:992px){.text-lg-left{text-align:left!important}.text-lg-right{text-align:right!important}.text-lg-center{text-align:center!important}}@media (min-width:1200px){.text-xl-left{text-align:left!important}.text-xl-right{text-align:right!important}.text-xl-center{text-align:center!important}}.text-lowercase{text-transform:lowercase!important}.text-uppercase{text-transform:uppercase!important}.text-capitalize{text-transform:capitalize!important}.font-weight-normal{font-weight:400}.font-weight-bold{font-weight:700}.font-italic{font-style:italic}.text-muted{color:#818a91}.text-primary{color:#0275d8!important}a.text-primary:focus,a.text-primary:hover{color:#025aa5}.text-success{color:#5cb85c!important}a.text-success:focus,a.text-success:hover{color:#449d44}.text-info{color:#5bc0de!important}a.text-info:focus,a.text-info:hover{color:#31b0d5}.text-warning{color:#f0ad4e!important}a.text-warning:focus,a.text-warning:hover{color:#ec971f}.text-danger{color:#d9534f!important}a.text-danger:focus,a.text-danger:hover{color:#c9302c}.bg-inverse{color:#eceeef;background-color:#373a3c}.bg-faded{background-color:#f7f7f9}.bg-primary{color:#fff!important;background-color:#0275d8!important}a.bg-primary:focus,a.bg-primary:hover{background-color:#025aa5}.bg-success{color:#fff!important;background-color:#5cb85c!important}a.bg-success:focus,a.bg-success:hover{background-color:#449d44}.bg-info{color:#fff!important;background-color:#5bc0de!important}a.bg-info:focus,a.bg-info:hover{background-color:#31b0d5}.bg-warning{color:#fff!important;background-color:#f0ad4e!important}a.bg-warning:focus,a.bg-warning:hover{background-color:#ec971f}.bg-danger{color:#fff!important;background-color:#d9534f!important}a.bg-danger:focus,a.bg-danger:hover{background-color:#c9302c}.m-x-auto{margin-right:auto!important;margin-left:auto!important}.m-a-0{margin:0 0!important}.m-t-0{margin-top:0!important}.m-r-0{margin-right:0!important}.m-b-0{margin-bottom:0!important}.m-l-0{margin-left:0!important}.m-x-0{margin-right:0!important;margin-left:0!important}.m-y-0{margin-top:0!important;margin-bottom:0!important}.m-a-1{margin:1rem 1rem!important}.m-t-1{margin-top:1rem!important}.m-r-1{margin-right:1rem!important}.m-b-1{margin-bottom:1rem!important}.m-l-1{margin-left:1rem!important}.m-x-1{margin-right:1rem!important;margin-left:1rem!important}.m-y-1{margin-top:1rem!important;margin-bottom:1rem!important}.m-a-2{margin:1.5rem 1.5rem!important}.m-t-2{margin-top:1.5rem!important}.m-r-2{margin-right:1.5rem!important}.m-b-2{margin-bottom:1.5rem!important}.m-l-2{margin-left:1.5rem!important}.m-x-2{margin-right:1.5rem!important;margin-left:1.5rem!important}.m-y-2{margin-top:1.5rem!important;margin-bottom:1.5rem!important}.m-a-3{margin:3rem 3rem!important}.m-t-3{margin-top:3rem!important}.m-r-3{margin-right:3rem!important}.m-b-3{margin-bottom:3rem!important}.m-l-3{margin-left:3rem!important}.m-x-3{margin-right:3rem!important;margin-left:3rem!important}.m-y-3{margin-top:3rem!important;margin-bottom:3rem!important}.p-a-0{padding:0 0!important}.p-t-0{padding-top:0!important}.p-r-0{padding-right:0!important}.p-b-0{padding-bottom:0!important}.p-l-0{padding-left:0!important}.p-x-0{padding-right:0!important;padding-left:0!important}.p-y-0{padding-top:0!important;padding-bottom:0!important}.p-a-1{padding:1rem 1rem!important}.p-t-1{padding-top:1rem!important}.p-r-1{padding-right:1rem!important}.p-b-1{padding-bottom:1rem!important}.p-l-1{padding-left:1rem!important}.p-x-1{padding-right:1rem!important;padding-left:1rem!important}.p-y-1{padding-top:1rem!important;padding-bottom:1rem!important}.p-a-2{padding:1.5rem 1.5rem!important}.p-t-2{padding-top:1.5rem!important}.p-r-2{padding-right:1.5rem!important}.p-b-2{padding-bottom:1.5rem!important}.p-l-2{padding-left:1.5rem!important}.p-x-2{padding-right:1.5rem!important;padding-left:1.5rem!important}.p-y-2{padding-top:1.5rem!important;padding-bottom:1.5rem!important}.p-a-3{padding:3rem 3rem!important}.p-t-3{padding-top:3rem!important}.p-r-3{padding-right:3rem!important}.p-b-3{padding-bottom:3rem!important}.p-l-3{padding-left:3rem!important}.p-x-3{padding-right:3rem!important;padding-left:3rem!important}.p-y-3{padding-top:3rem!important;padding-bottom:3rem!important}.pos-f-t{position:fixed;top:0;right:0;left:0;z-index:1030}.hidden-xs-up{display:none!important}@media (max-width:543px){.hidden-xs-down{display:none!important}}@media (min-width:544px){.hidden-sm-up{display:none!important}}@media (max-width:767px){.hidden-sm-down{display:none!important}}@media (min-width:768px){.hidden-md-up{display:none!important}}@media (max-width:991px){.hidden-md-down{display:none!important}}@media (min-width:992px){.hidden-lg-up{display:none!important}}@media (max-width:1199px){.hidden-lg-down{display:none!important}}@media (min-width:1200px){.hidden-xl-up{display:none!important}}.hidden-xl-down{display:none!important}.visible-print-block{display:none!important}@media print{.visible-print-block{display:block!important}}.visible-print-inline{display:none!important}@media print{.visible-print-inline{display:inline!important}}.visible-print-inline-block{display:none!important}@media print{.visible-print-inline-block{display:inline-block!important}}@media print{.hidden-print{display:none!important}}.morris-hover{position:absolute;z-index:1000}.morris-hover.morris-default-style{border-radius:10px;padding:6px;color:#666;background:rgba(255,255,255,.8);border:solid 2px rgba(230,230,230,.8);font-family:sans-serif;font-size:12px;text-align:center}.morris-hover.morris-default-style .morris-hover-row-label{font-weight:700;margin:.25em 0}.morris-hover.morris-default-style .morris-hover-point{white-space:nowrap;margin:.1em 0}", ""]);

// exports


/***/ }),

/***/ 673:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "fontawesome-webfont.f7c2b4b747b1a225eb8d.eot";

/***/ }),

/***/ 674:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "fontawesome-webfont.f7c2b4b747b1a225eb8d.eot";

/***/ }),

/***/ 675:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "fontawesome-webfont.139e74e298bca37a25d2.svg";

/***/ }),

/***/ 74:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = __webpack_require__(108)
var ieee754 = __webpack_require__(154)
var isArray = __webpack_require__(155)

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(41)))

/***/ }),

/***/ 959:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "fontawesome-webfont.706450d7bba6374ca02f.ttf";

/***/ }),

/***/ 960:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "fontawesome-webfont.97493d3f11c0a3bd5cbd.woff2";

/***/ }),

/***/ 961:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "fontawesome-webfont.d9ee23d59d0e0e727b51.woff";

/***/ }),

/***/ 965:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(372);
__webpack_require__(374);
module.exports = __webpack_require__(373);


/***/ })

},[965]);
//# sourceMappingURL=styles.bundle.js.map