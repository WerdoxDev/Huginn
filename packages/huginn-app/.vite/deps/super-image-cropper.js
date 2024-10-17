import {
  Cropper
} from "./chunk-NSNPBK7L.js";
import {
  __commonJS,
  __require,
  __toESM
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/js-binary-schema-parser@2.0.3/node_modules/js-binary-schema-parser/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.deno/js-binary-schema-parser@2.0.3/node_modules/js-binary-schema-parser/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.loop = exports2.conditional = exports2.parse = void 0;
    var parse = function parse2(stream2, schema) {
      var result = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      var parent = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : result;
      if (Array.isArray(schema)) {
        schema.forEach(function(partSchema) {
          return parse2(stream2, partSchema, result, parent);
        });
      } else if (typeof schema === "function") {
        schema(stream2, result, parent, parse2);
      } else {
        var key = Object.keys(schema)[0];
        if (Array.isArray(schema[key])) {
          parent[key] = {};
          parse2(stream2, schema[key], result, parent[key]);
        } else {
          parent[key] = schema[key](stream2, result, parent, parse2);
        }
      }
      return result;
    };
    exports2.parse = parse;
    var conditional = function conditional2(schema, conditionFunc) {
      return function(stream2, result, parent, parse2) {
        if (conditionFunc(stream2, result, parent)) {
          parse2(stream2, schema, result, parent);
        }
      };
    };
    exports2.conditional = conditional;
    var loop = function loop2(schema, continueFunc) {
      return function(stream2, result, parent, parse2) {
        var arr = [];
        var lastStreamPos = stream2.pos;
        while (continueFunc(stream2, result, parent)) {
          var newParent = {};
          parse2(stream2, schema, result, newParent);
          if (stream2.pos === lastStreamPos) {
            break;
          }
          lastStreamPos = stream2.pos;
          arr.push(newParent);
        }
        return arr;
      };
    };
    exports2.loop = loop;
  }
});

// ../../node_modules/.deno/js-binary-schema-parser@2.0.3/node_modules/js-binary-schema-parser/lib/parsers/uint8.js
var require_uint8 = __commonJS({
  "../../node_modules/.deno/js-binary-schema-parser@2.0.3/node_modules/js-binary-schema-parser/lib/parsers/uint8.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.readBits = exports2.readArray = exports2.readUnsigned = exports2.readString = exports2.peekBytes = exports2.readBytes = exports2.peekByte = exports2.readByte = exports2.buildStream = void 0;
    var buildStream = function buildStream2(uint8Data) {
      return {
        data: uint8Data,
        pos: 0
      };
    };
    exports2.buildStream = buildStream;
    var readByte = function readByte2() {
      return function(stream2) {
        return stream2.data[stream2.pos++];
      };
    };
    exports2.readByte = readByte;
    var peekByte = function peekByte2() {
      var offset = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
      return function(stream2) {
        return stream2.data[stream2.pos + offset];
      };
    };
    exports2.peekByte = peekByte;
    var readBytes = function readBytes2(length) {
      return function(stream2) {
        return stream2.data.subarray(stream2.pos, stream2.pos += length);
      };
    };
    exports2.readBytes = readBytes;
    var peekBytes = function peekBytes2(length) {
      return function(stream2) {
        return stream2.data.subarray(stream2.pos, stream2.pos + length);
      };
    };
    exports2.peekBytes = peekBytes;
    var readString = function readString2(length) {
      return function(stream2) {
        return Array.from(readBytes(length)(stream2)).map(function(value) {
          return String.fromCharCode(value);
        }).join("");
      };
    };
    exports2.readString = readString;
    var readUnsigned = function readUnsigned2(littleEndian) {
      return function(stream2) {
        var bytes = readBytes(2)(stream2);
        return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1];
      };
    };
    exports2.readUnsigned = readUnsigned;
    var readArray = function readArray2(byteSize, totalOrFunc) {
      return function(stream2, result, parent) {
        var total = typeof totalOrFunc === "function" ? totalOrFunc(stream2, result, parent) : totalOrFunc;
        var parser = readBytes(byteSize);
        var arr = new Array(total);
        for (var i = 0; i < total; i++) {
          arr[i] = parser(stream2);
        }
        return arr;
      };
    };
    exports2.readArray = readArray;
    var subBitsTotal = function subBitsTotal2(bits, startIndex, length) {
      var result = 0;
      for (var i = 0; i < length; i++) {
        result += bits[startIndex + i] && Math.pow(2, length - i - 1);
      }
      return result;
    };
    var readBits = function readBits2(schema) {
      return function(stream2) {
        var _byte = readByte()(stream2);
        var bits = new Array(8);
        for (var i = 0; i < 8; i++) {
          bits[7 - i] = !!(_byte & 1 << i);
        }
        return Object.keys(schema).reduce(function(res, key) {
          var def = schema[key];
          if (def.length) {
            res[key] = subBitsTotal(bits, def.index, def.length);
          } else {
            res[key] = bits[def.index];
          }
          return res;
        }, {});
      };
    };
    exports2.readBits = readBits;
  }
});

// ../../node_modules/.deno/js-binary-schema-parser@2.0.3/node_modules/js-binary-schema-parser/lib/schemas/gif.js
var require_gif = __commonJS({
  "../../node_modules/.deno/js-binary-schema-parser@2.0.3/node_modules/js-binary-schema-parser/lib/schemas/gif.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = void 0;
    var _ = require_lib();
    var _uint = require_uint8();
    var subBlocksSchema = {
      blocks: function blocks(stream2) {
        var terminator = 0;
        var chunks = [];
        var streamSize = stream2.data.length;
        var total = 0;
        for (var size = (0, _uint.readByte)()(stream2); size !== terminator; size = (0, _uint.readByte)()(stream2)) {
          if (!size) break;
          if (stream2.pos + size >= streamSize) {
            var availableSize = streamSize - stream2.pos;
            chunks.push((0, _uint.readBytes)(availableSize)(stream2));
            total += availableSize;
            break;
          }
          chunks.push((0, _uint.readBytes)(size)(stream2));
          total += size;
        }
        var result = new Uint8Array(total);
        var offset = 0;
        for (var i = 0; i < chunks.length; i++) {
          result.set(chunks[i], offset);
          offset += chunks[i].length;
        }
        return result;
      }
    };
    var gceSchema = (0, _.conditional)({
      gce: [{
        codes: (0, _uint.readBytes)(2)
      }, {
        byteSize: (0, _uint.readByte)()
      }, {
        extras: (0, _uint.readBits)({
          future: {
            index: 0,
            length: 3
          },
          disposal: {
            index: 3,
            length: 3
          },
          userInput: {
            index: 6
          },
          transparentColorGiven: {
            index: 7
          }
        })
      }, {
        delay: (0, _uint.readUnsigned)(true)
      }, {
        transparentColorIndex: (0, _uint.readByte)()
      }, {
        terminator: (0, _uint.readByte)()
      }]
    }, function(stream2) {
      var codes = (0, _uint.peekBytes)(2)(stream2);
      return codes[0] === 33 && codes[1] === 249;
    });
    var imageSchema = (0, _.conditional)({
      image: [{
        code: (0, _uint.readByte)()
      }, {
        descriptor: [{
          left: (0, _uint.readUnsigned)(true)
        }, {
          top: (0, _uint.readUnsigned)(true)
        }, {
          width: (0, _uint.readUnsigned)(true)
        }, {
          height: (0, _uint.readUnsigned)(true)
        }, {
          lct: (0, _uint.readBits)({
            exists: {
              index: 0
            },
            interlaced: {
              index: 1
            },
            sort: {
              index: 2
            },
            future: {
              index: 3,
              length: 2
            },
            size: {
              index: 5,
              length: 3
            }
          })
        }]
      }, (0, _.conditional)({
        lct: (0, _uint.readArray)(3, function(stream2, result, parent) {
          return Math.pow(2, parent.descriptor.lct.size + 1);
        })
      }, function(stream2, result, parent) {
        return parent.descriptor.lct.exists;
      }), {
        data: [{
          minCodeSize: (0, _uint.readByte)()
        }, subBlocksSchema]
      }]
    }, function(stream2) {
      return (0, _uint.peekByte)()(stream2) === 44;
    });
    var textSchema = (0, _.conditional)({
      text: [{
        codes: (0, _uint.readBytes)(2)
      }, {
        blockSize: (0, _uint.readByte)()
      }, {
        preData: function preData(stream2, result, parent) {
          return (0, _uint.readBytes)(parent.text.blockSize)(stream2);
        }
      }, subBlocksSchema]
    }, function(stream2) {
      var codes = (0, _uint.peekBytes)(2)(stream2);
      return codes[0] === 33 && codes[1] === 1;
    });
    var applicationSchema = (0, _.conditional)({
      application: [{
        codes: (0, _uint.readBytes)(2)
      }, {
        blockSize: (0, _uint.readByte)()
      }, {
        id: function id(stream2, result, parent) {
          return (0, _uint.readString)(parent.blockSize)(stream2);
        }
      }, subBlocksSchema]
    }, function(stream2) {
      var codes = (0, _uint.peekBytes)(2)(stream2);
      return codes[0] === 33 && codes[1] === 255;
    });
    var commentSchema = (0, _.conditional)({
      comment: [{
        codes: (0, _uint.readBytes)(2)
      }, subBlocksSchema]
    }, function(stream2) {
      var codes = (0, _uint.peekBytes)(2)(stream2);
      return codes[0] === 33 && codes[1] === 254;
    });
    var schema = [
      {
        header: [{
          signature: (0, _uint.readString)(3)
        }, {
          version: (0, _uint.readString)(3)
        }]
      },
      {
        lsd: [{
          width: (0, _uint.readUnsigned)(true)
        }, {
          height: (0, _uint.readUnsigned)(true)
        }, {
          gct: (0, _uint.readBits)({
            exists: {
              index: 0
            },
            resolution: {
              index: 1,
              length: 3
            },
            sort: {
              index: 4
            },
            size: {
              index: 5,
              length: 3
            }
          })
        }, {
          backgroundColorIndex: (0, _uint.readByte)()
        }, {
          pixelAspectRatio: (0, _uint.readByte)()
        }]
      },
      (0, _.conditional)({
        gct: (0, _uint.readArray)(3, function(stream2, result) {
          return Math.pow(2, result.lsd.gct.size + 1);
        })
      }, function(stream2, result) {
        return result.lsd.gct.exists;
      }),
      // content frames
      {
        frames: (0, _.loop)([gceSchema, applicationSchema, commentSchema, imageSchema, textSchema], function(stream2) {
          var nextCode = (0, _uint.peekByte)()(stream2);
          return nextCode === 33 || nextCode === 44;
        })
      }
    ];
    var _default = schema;
    exports2["default"] = _default;
  }
});

// ../../node_modules/.deno/gifuct-js@2.1.2/node_modules/gifuct-js/lib/deinterlace.js
var require_deinterlace = __commonJS({
  "../../node_modules/.deno/gifuct-js@2.1.2/node_modules/gifuct-js/lib/deinterlace.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.deinterlace = void 0;
    var deinterlace = function deinterlace2(pixels, width) {
      var newPixels = new Array(pixels.length);
      var rows = pixels.length / width;
      var cpRow = function cpRow2(toRow2, fromRow2) {
        var fromPixels = pixels.slice(fromRow2 * width, (fromRow2 + 1) * width);
        newPixels.splice.apply(newPixels, [toRow2 * width, width].concat(fromPixels));
      };
      var offsets = [0, 4, 2, 1];
      var steps = [8, 8, 4, 2];
      var fromRow = 0;
      for (var pass = 0; pass < 4; pass++) {
        for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
          cpRow(toRow, fromRow);
          fromRow++;
        }
      }
      return newPixels;
    };
    exports2.deinterlace = deinterlace;
  }
});

// ../../node_modules/.deno/gifuct-js@2.1.2/node_modules/gifuct-js/lib/lzw.js
var require_lzw = __commonJS({
  "../../node_modules/.deno/gifuct-js@2.1.2/node_modules/gifuct-js/lib/lzw.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.lzw = void 0;
    var lzw = function lzw2(minCodeSize, data, pixelCount) {
      var MAX_STACK_SIZE = 4096;
      var nullCode = -1;
      var npix = pixelCount;
      var available, clear, code_mask, code_size, end_of_information, in_code, old_code, bits, code, i, datum, data_size, first, top, bi, pi;
      var dstPixels = new Array(pixelCount);
      var prefix = new Array(MAX_STACK_SIZE);
      var suffix = new Array(MAX_STACK_SIZE);
      var pixelStack = new Array(MAX_STACK_SIZE + 1);
      data_size = minCodeSize;
      clear = 1 << data_size;
      end_of_information = clear + 1;
      available = clear + 2;
      old_code = nullCode;
      code_size = data_size + 1;
      code_mask = (1 << code_size) - 1;
      for (code = 0; code < clear; code++) {
        prefix[code] = 0;
        suffix[code] = code;
      }
      var datum, bits, count, first, top, pi, bi;
      datum = bits = count = first = top = pi = bi = 0;
      for (i = 0; i < npix; ) {
        if (top === 0) {
          if (bits < code_size) {
            datum += data[bi] << bits;
            bits += 8;
            bi++;
            continue;
          }
          code = datum & code_mask;
          datum >>= code_size;
          bits -= code_size;
          if (code > available || code == end_of_information) {
            break;
          }
          if (code == clear) {
            code_size = data_size + 1;
            code_mask = (1 << code_size) - 1;
            available = clear + 2;
            old_code = nullCode;
            continue;
          }
          if (old_code == nullCode) {
            pixelStack[top++] = suffix[code];
            old_code = code;
            first = code;
            continue;
          }
          in_code = code;
          if (code == available) {
            pixelStack[top++] = first;
            code = old_code;
          }
          while (code > clear) {
            pixelStack[top++] = suffix[code];
            code = prefix[code];
          }
          first = suffix[code] & 255;
          pixelStack[top++] = first;
          if (available < MAX_STACK_SIZE) {
            prefix[available] = old_code;
            suffix[available] = first;
            available++;
            if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
              code_size++;
              code_mask += available;
            }
          }
          old_code = in_code;
        }
        top--;
        dstPixels[pi++] = pixelStack[top];
        i++;
      }
      for (i = pi; i < npix; i++) {
        dstPixels[i] = 0;
      }
      return dstPixels;
    };
    exports2.lzw = lzw;
  }
});

// ../../node_modules/.deno/gifuct-js@2.1.2/node_modules/gifuct-js/lib/index.js
var require_lib2 = __commonJS({
  "../../node_modules/.deno/gifuct-js@2.1.2/node_modules/gifuct-js/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.decompressFrames = exports2.decompressFrame = exports2.parseGIF = void 0;
    var _gif = _interopRequireDefault(require_gif());
    var _jsBinarySchemaParser = require_lib();
    var _uint = require_uint8();
    var _deinterlace = require_deinterlace();
    var _lzw = require_lzw();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    var parseGIF2 = function parseGIF3(arrayBuffer) {
      var byteData = new Uint8Array(arrayBuffer);
      return (0, _jsBinarySchemaParser.parse)((0, _uint.buildStream)(byteData), _gif["default"]);
    };
    exports2.parseGIF = parseGIF2;
    var generatePatch = function generatePatch2(image) {
      var totalPixels = image.pixels.length;
      var patchData = new Uint8ClampedArray(totalPixels * 4);
      for (var i = 0; i < totalPixels; i++) {
        var pos = i * 4;
        var colorIndex = image.pixels[i];
        var color = image.colorTable[colorIndex] || [0, 0, 0];
        patchData[pos] = color[0];
        patchData[pos + 1] = color[1];
        patchData[pos + 2] = color[2];
        patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0;
      }
      return patchData;
    };
    var decompressFrame = function decompressFrame2(frame, gct, buildImagePatch) {
      if (!frame.image) {
        console.warn("gif frame does not have associated image.");
        return;
      }
      var image = frame.image;
      var totalPixels = image.descriptor.width * image.descriptor.height;
      var pixels = (0, _lzw.lzw)(image.data.minCodeSize, image.data.blocks, totalPixels);
      if (image.descriptor.lct.interlaced) {
        pixels = (0, _deinterlace.deinterlace)(pixels, image.descriptor.width);
      }
      var resultImage = {
        pixels,
        dims: {
          top: frame.image.descriptor.top,
          left: frame.image.descriptor.left,
          width: frame.image.descriptor.width,
          height: frame.image.descriptor.height
        }
      };
      if (image.descriptor.lct && image.descriptor.lct.exists) {
        resultImage.colorTable = image.lct;
      } else {
        resultImage.colorTable = gct;
      }
      if (frame.gce) {
        resultImage.delay = (frame.gce.delay || 10) * 10;
        resultImage.disposalType = frame.gce.extras.disposal;
        if (frame.gce.extras.transparentColorGiven) {
          resultImage.transparentIndex = frame.gce.transparentColorIndex;
        }
      }
      if (buildImagePatch) {
        resultImage.patch = generatePatch(resultImage);
      }
      return resultImage;
    };
    exports2.decompressFrame = decompressFrame;
    var decompressFrames2 = function decompressFrames3(parsedGif, buildImagePatches) {
      return parsedGif.frames.filter(function(f) {
        return f.image;
      }).map(function(f) {
        return decompressFrame(f, parsedGif.gct, buildImagePatches);
      });
    };
    exports2.decompressFrames = decompressFrames2;
  }
});

// ../../node_modules/.deno/gif.js@0.2.0/node_modules/gif.js/dist/gif.js
var require_gif2 = __commonJS({
  "../../node_modules/.deno/gif.js@0.2.0/node_modules/gif.js/dist/gif.js"(exports2, module2) {
    (function(f) {
      if (typeof exports2 === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.GIF = f();
      }
    })(function() {
      var define2, module3, exports3;
      return function e(t, n, r) {
        function s(o2, u) {
          if (!n[o2]) {
            if (!t[o2]) {
              var a = typeof __require == "function" && __require;
              if (!u && a) return a(o2, true);
              if (i) return i(o2, true);
              var f = new Error("Cannot find module '" + o2 + "'");
              throw f.code = "MODULE_NOT_FOUND", f;
            }
            var l = n[o2] = { exports: {} };
            t[o2][0].call(l.exports, function(e2) {
              var n2 = t[o2][1][e2];
              return s(n2 ? n2 : e2);
            }, l, l.exports, e, t, n, r);
          }
          return n[o2].exports;
        }
        var i = typeof __require == "function" && __require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
      }({ 1: [function(require2, module4, exports4) {
        function EventEmitter() {
          this._events = this._events || {};
          this._maxListeners = this._maxListeners || void 0;
        }
        module4.exports = EventEmitter;
        EventEmitter.EventEmitter = EventEmitter;
        EventEmitter.prototype._events = void 0;
        EventEmitter.prototype._maxListeners = void 0;
        EventEmitter.defaultMaxListeners = 10;
        EventEmitter.prototype.setMaxListeners = function(n) {
          if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
          this._maxListeners = n;
          return this;
        };
        EventEmitter.prototype.emit = function(type) {
          var er, handler, len, args, i, listeners;
          if (!this._events) this._events = {};
          if (type === "error") {
            if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
              er = arguments[1];
              if (er instanceof Error) {
                throw er;
              } else {
                var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
                err.context = er;
                throw err;
              }
            }
          }
          handler = this._events[type];
          if (isUndefined(handler)) return false;
          if (isFunction(handler)) {
            switch (arguments.length) {
              case 1:
                handler.call(this);
                break;
              case 2:
                handler.call(this, arguments[1]);
                break;
              case 3:
                handler.call(this, arguments[1], arguments[2]);
                break;
              default:
                args = Array.prototype.slice.call(arguments, 1);
                handler.apply(this, args);
            }
          } else if (isObject(handler)) {
            args = Array.prototype.slice.call(arguments, 1);
            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++) listeners[i].apply(this, args);
          }
          return true;
        };
        EventEmitter.prototype.addListener = function(type, listener) {
          var m;
          if (!isFunction(listener)) throw TypeError("listener must be a function");
          if (!this._events) this._events = {};
          if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
          if (!this._events[type]) this._events[type] = listener;
          else if (isObject(this._events[type])) this._events[type].push(listener);
          else this._events[type] = [this._events[type], listener];
          if (isObject(this._events[type]) && !this._events[type].warned) {
            if (!isUndefined(this._maxListeners)) {
              m = this._maxListeners;
            } else {
              m = EventEmitter.defaultMaxListeners;
            }
            if (m && m > 0 && this._events[type].length > m) {
              this._events[type].warned = true;
              console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
              if (typeof console.trace === "function") {
                console.trace();
              }
            }
          }
          return this;
        };
        EventEmitter.prototype.on = EventEmitter.prototype.addListener;
        EventEmitter.prototype.once = function(type, listener) {
          if (!isFunction(listener)) throw TypeError("listener must be a function");
          var fired = false;
          function g() {
            this.removeListener(type, g);
            if (!fired) {
              fired = true;
              listener.apply(this, arguments);
            }
          }
          g.listener = listener;
          this.on(type, g);
          return this;
        };
        EventEmitter.prototype.removeListener = function(type, listener) {
          var list, position, length, i;
          if (!isFunction(listener)) throw TypeError("listener must be a function");
          if (!this._events || !this._events[type]) return this;
          list = this._events[type];
          length = list.length;
          position = -1;
          if (list === listener || isFunction(list.listener) && list.listener === listener) {
            delete this._events[type];
            if (this._events.removeListener) this.emit("removeListener", type, listener);
          } else if (isObject(list)) {
            for (i = length; i-- > 0; ) {
              if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                position = i;
                break;
              }
            }
            if (position < 0) return this;
            if (list.length === 1) {
              list.length = 0;
              delete this._events[type];
            } else {
              list.splice(position, 1);
            }
            if (this._events.removeListener) this.emit("removeListener", type, listener);
          }
          return this;
        };
        EventEmitter.prototype.removeAllListeners = function(type) {
          var key, listeners;
          if (!this._events) return this;
          if (!this._events.removeListener) {
            if (arguments.length === 0) this._events = {};
            else if (this._events[type]) delete this._events[type];
            return this;
          }
          if (arguments.length === 0) {
            for (key in this._events) {
              if (key === "removeListener") continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners("removeListener");
            this._events = {};
            return this;
          }
          listeners = this._events[type];
          if (isFunction(listeners)) {
            this.removeListener(type, listeners);
          } else if (listeners) {
            while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
          }
          delete this._events[type];
          return this;
        };
        EventEmitter.prototype.listeners = function(type) {
          var ret;
          if (!this._events || !this._events[type]) ret = [];
          else if (isFunction(this._events[type])) ret = [this._events[type]];
          else ret = this._events[type].slice();
          return ret;
        };
        EventEmitter.prototype.listenerCount = function(type) {
          if (this._events) {
            var evlistener = this._events[type];
            if (isFunction(evlistener)) return 1;
            else if (evlistener) return evlistener.length;
          }
          return 0;
        };
        EventEmitter.listenerCount = function(emitter, type) {
          return emitter.listenerCount(type);
        };
        function isFunction(arg) {
          return typeof arg === "function";
        }
        function isNumber(arg) {
          return typeof arg === "number";
        }
        function isObject(arg) {
          return typeof arg === "object" && arg !== null;
        }
        function isUndefined(arg) {
          return arg === void 0;
        }
      }, {}], 2: [function(require2, module4, exports4) {
        var UA, browser, mode, platform, ua;
        ua = navigator.userAgent.toLowerCase();
        platform = navigator.platform.toLowerCase();
        UA = ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, "unknown", 0];
        mode = UA[1] === "ie" && document.documentMode;
        browser = { name: UA[1] === "version" ? UA[3] : UA[1], version: mode || parseFloat(UA[1] === "opera" && UA[4] ? UA[4] : UA[2]), platform: { name: ua.match(/ip(?:ad|od|hone)/) ? "ios" : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ["other"])[0] } };
        browser[browser.name] = true;
        browser[browser.name + parseInt(browser.version, 10)] = true;
        browser.platform[browser.platform.name] = true;
        module4.exports = browser;
      }, {}], 3: [function(require2, module4, exports4) {
        var EventEmitter, GIF2, browser, extend = function(child, parent) {
          for (var key in parent) {
            if (hasProp.call(parent, key)) child[key] = parent[key];
          }
          function ctor() {
            this.constructor = child;
          }
          ctor.prototype = parent.prototype;
          child.prototype = new ctor();
          child.__super__ = parent.prototype;
          return child;
        }, hasProp = {}.hasOwnProperty, indexOf = [].indexOf || function(item) {
          for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
          }
          return -1;
        }, slice = [].slice;
        EventEmitter = require2("events").EventEmitter;
        browser = require2("./browser.coffee");
        GIF2 = function(superClass) {
          var defaults, frameDefaults;
          extend(GIF3, superClass);
          defaults = { workerScript: "gif.worker.js", workers: 2, repeat: 0, background: "#fff", quality: 10, width: null, height: null, transparent: null, debug: false, dither: false };
          frameDefaults = { delay: 500, copy: false };
          function GIF3(options) {
            var base, key, value;
            this.running = false;
            this.options = {};
            this.frames = [];
            this.freeWorkers = [];
            this.activeWorkers = [];
            this.setOptions(options);
            for (key in defaults) {
              value = defaults[key];
              if ((base = this.options)[key] == null) {
                base[key] = value;
              }
            }
          }
          GIF3.prototype.setOption = function(key, value) {
            this.options[key] = value;
            if (this._canvas != null && (key === "width" || key === "height")) {
              return this._canvas[key] = value;
            }
          };
          GIF3.prototype.setOptions = function(options) {
            var key, results, value;
            results = [];
            for (key in options) {
              if (!hasProp.call(options, key)) continue;
              value = options[key];
              results.push(this.setOption(key, value));
            }
            return results;
          };
          GIF3.prototype.addFrame = function(image, options) {
            var frame, key;
            if (options == null) {
              options = {};
            }
            frame = {};
            frame.transparent = this.options.transparent;
            for (key in frameDefaults) {
              frame[key] = options[key] || frameDefaults[key];
            }
            if (this.options.width == null) {
              this.setOption("width", image.width);
            }
            if (this.options.height == null) {
              this.setOption("height", image.height);
            }
            if (typeof ImageData !== "undefined" && ImageData !== null && image instanceof ImageData) {
              frame.data = image.data;
            } else if (typeof CanvasRenderingContext2D !== "undefined" && CanvasRenderingContext2D !== null && image instanceof CanvasRenderingContext2D || typeof WebGLRenderingContext !== "undefined" && WebGLRenderingContext !== null && image instanceof WebGLRenderingContext) {
              if (options.copy) {
                frame.data = this.getContextData(image);
              } else {
                frame.context = image;
              }
            } else if (image.childNodes != null) {
              if (options.copy) {
                frame.data = this.getImageData(image);
              } else {
                frame.image = image;
              }
            } else {
              throw new Error("Invalid image");
            }
            return this.frames.push(frame);
          };
          GIF3.prototype.render = function() {
            var i, j, numWorkers, ref;
            if (this.running) {
              throw new Error("Already running");
            }
            if (this.options.width == null || this.options.height == null) {
              throw new Error("Width and height must be set prior to rendering");
            }
            this.running = true;
            this.nextFrame = 0;
            this.finishedFrames = 0;
            this.imageParts = (function() {
              var j2, ref2, results;
              results = [];
              for (i = j2 = 0, ref2 = this.frames.length; 0 <= ref2 ? j2 < ref2 : j2 > ref2; i = 0 <= ref2 ? ++j2 : --j2) {
                results.push(null);
              }
              return results;
            }).call(this);
            numWorkers = this.spawnWorkers();
            if (this.options.globalPalette === true) {
              this.renderNextFrame();
            } else {
              for (i = j = 0, ref = numWorkers; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                this.renderNextFrame();
              }
            }
            this.emit("start");
            return this.emit("progress", 0);
          };
          GIF3.prototype.abort = function() {
            var worker;
            while (true) {
              worker = this.activeWorkers.shift();
              if (worker == null) {
                break;
              }
              this.log("killing active worker");
              worker.terminate();
            }
            this.running = false;
            return this.emit("abort");
          };
          GIF3.prototype.spawnWorkers = function() {
            var j, numWorkers, ref, results;
            numWorkers = Math.min(this.options.workers, this.frames.length);
            (function() {
              results = [];
              for (var j2 = ref = this.freeWorkers.length; ref <= numWorkers ? j2 < numWorkers : j2 > numWorkers; ref <= numWorkers ? j2++ : j2--) {
                results.push(j2);
              }
              return results;
            }).apply(this).forEach(/* @__PURE__ */ function(_this) {
              return function(i) {
                var worker;
                _this.log("spawning worker " + i);
                worker = new Worker(_this.options.workerScript);
                worker.onmessage = function(event) {
                  _this.activeWorkers.splice(_this.activeWorkers.indexOf(worker), 1);
                  _this.freeWorkers.push(worker);
                  return _this.frameFinished(event.data);
                };
                return _this.freeWorkers.push(worker);
              };
            }(this));
            return numWorkers;
          };
          GIF3.prototype.frameFinished = function(frame) {
            var i, j, ref;
            this.log("frame " + frame.index + " finished - " + this.activeWorkers.length + " active");
            this.finishedFrames++;
            this.emit("progress", this.finishedFrames / this.frames.length);
            this.imageParts[frame.index] = frame;
            if (this.options.globalPalette === true) {
              this.options.globalPalette = frame.globalPalette;
              this.log("global palette analyzed");
              if (this.frames.length > 2) {
                for (i = j = 1, ref = this.freeWorkers.length; 1 <= ref ? j < ref : j > ref; i = 1 <= ref ? ++j : --j) {
                  this.renderNextFrame();
                }
              }
            }
            if (indexOf.call(this.imageParts, null) >= 0) {
              return this.renderNextFrame();
            } else {
              return this.finishRendering();
            }
          };
          GIF3.prototype.finishRendering = function() {
            var data, frame, i, image, j, k, l, len, len1, len2, len3, offset, page, ref, ref1, ref2;
            len = 0;
            ref = this.imageParts;
            for (j = 0, len1 = ref.length; j < len1; j++) {
              frame = ref[j];
              len += (frame.data.length - 1) * frame.pageSize + frame.cursor;
            }
            len += frame.pageSize - frame.cursor;
            this.log("rendering finished - filesize " + Math.round(len / 1e3) + "kb");
            data = new Uint8Array(len);
            offset = 0;
            ref1 = this.imageParts;
            for (k = 0, len2 = ref1.length; k < len2; k++) {
              frame = ref1[k];
              ref2 = frame.data;
              for (i = l = 0, len3 = ref2.length; l < len3; i = ++l) {
                page = ref2[i];
                data.set(page, offset);
                if (i === frame.data.length - 1) {
                  offset += frame.cursor;
                } else {
                  offset += frame.pageSize;
                }
              }
            }
            image = new Blob([data], { type: "image/gif" });
            return this.emit("finished", image, data);
          };
          GIF3.prototype.renderNextFrame = function() {
            var frame, task, worker;
            if (this.freeWorkers.length === 0) {
              throw new Error("No free workers");
            }
            if (this.nextFrame >= this.frames.length) {
              return;
            }
            frame = this.frames[this.nextFrame++];
            worker = this.freeWorkers.shift();
            task = this.getTask(frame);
            this.log("starting frame " + (task.index + 1) + " of " + this.frames.length);
            this.activeWorkers.push(worker);
            return worker.postMessage(task);
          };
          GIF3.prototype.getContextData = function(ctx) {
            return ctx.getImageData(0, 0, this.options.width, this.options.height).data;
          };
          GIF3.prototype.getImageData = function(image) {
            var ctx;
            if (this._canvas == null) {
              this._canvas = document.createElement("canvas");
              this._canvas.width = this.options.width;
              this._canvas.height = this.options.height;
            }
            ctx = this._canvas.getContext("2d");
            ctx.setFill = this.options.background;
            ctx.fillRect(0, 0, this.options.width, this.options.height);
            ctx.drawImage(image, 0, 0);
            return this.getContextData(ctx);
          };
          GIF3.prototype.getTask = function(frame) {
            var index, task;
            index = this.frames.indexOf(frame);
            task = { index, last: index === this.frames.length - 1, delay: frame.delay, transparent: frame.transparent, width: this.options.width, height: this.options.height, quality: this.options.quality, dither: this.options.dither, globalPalette: this.options.globalPalette, repeat: this.options.repeat, canTransfer: browser.name === "chrome" };
            if (frame.data != null) {
              task.data = frame.data;
            } else if (frame.context != null) {
              task.data = this.getContextData(frame.context);
            } else if (frame.image != null) {
              task.data = this.getImageData(frame.image);
            } else {
              throw new Error("Invalid frame");
            }
            return task;
          };
          GIF3.prototype.log = function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            if (!this.options.debug) {
              return;
            }
            return console.log.apply(console, args);
          };
          return GIF3;
        }(EventEmitter);
        module4.exports = GIF2;
      }, { "./browser.coffee": 2, events: 1 }] }, {}, [3])(3);
    });
  }
});

// ../../node_modules/.deno/file-type@10.11.0/node_modules/file-type/index.js
var require_file_type = __commonJS({
  "../../node_modules/.deno/file-type@10.11.0/node_modules/file-type/index.js"(exports, module) {
    "use strict";
    var toBytes = (s) => [...s].map((c) => c.charCodeAt(0));
    var xpiZipFilename = toBytes("META-INF/mozilla.rsa");
    var oxmlContentTypes = toBytes("[Content_Types].xml");
    var oxmlRels = toBytes("_rels/.rels");
    function readUInt64LE(buf, offset = 0) {
      let n = buf[offset];
      let mul = 1;
      let i = 0;
      while (++i < 8) {
        mul *= 256;
        n += buf[offset + i] * mul;
      }
      return n;
    }
    var fileType = (input) => {
      if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
        throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
      }
      const buf = input instanceof Uint8Array ? input : new Uint8Array(input);
      if (!(buf && buf.length > 1)) {
        return null;
      }
      const check = (header, options) => {
        options = Object.assign({
          offset: 0
        }, options);
        for (let i = 0; i < header.length; i++) {
          if (options.mask) {
            if (header[i] !== (options.mask[i] & buf[i + options.offset])) {
              return false;
            }
          } else if (header[i] !== buf[i + options.offset]) {
            return false;
          }
        }
        return true;
      };
      const checkString = (header, options) => check(toBytes(header), options);
      if (check([255, 216, 255])) {
        return {
          ext: "jpg",
          mime: "image/jpeg"
        };
      }
      if (check([137, 80, 78, 71, 13, 10, 26, 10])) {
        return {
          ext: "png",
          mime: "image/png"
        };
      }
      if (check([71, 73, 70])) {
        return {
          ext: "gif",
          mime: "image/gif"
        };
      }
      if (check([87, 69, 66, 80], { offset: 8 })) {
        return {
          ext: "webp",
          mime: "image/webp"
        };
      }
      if (check([70, 76, 73, 70])) {
        return {
          ext: "flif",
          mime: "image/flif"
        };
      }
      if ((check([73, 73, 42, 0]) || check([77, 77, 0, 42])) && check([67, 82], { offset: 8 })) {
        return {
          ext: "cr2",
          mime: "image/x-canon-cr2"
        };
      }
      if (check([73, 73, 42, 0]) || check([77, 77, 0, 42])) {
        return {
          ext: "tif",
          mime: "image/tiff"
        };
      }
      if (check([66, 77])) {
        return {
          ext: "bmp",
          mime: "image/bmp"
        };
      }
      if (check([73, 73, 188])) {
        return {
          ext: "jxr",
          mime: "image/vnd.ms-photo"
        };
      }
      if (check([56, 66, 80, 83])) {
        return {
          ext: "psd",
          mime: "image/vnd.adobe.photoshop"
        };
      }
      if (check([80, 75, 3, 4])) {
        if (check([109, 105, 109, 101, 116, 121, 112, 101, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 101, 112, 117, 98, 43, 122, 105, 112], { offset: 30 })) {
          return {
            ext: "epub",
            mime: "application/epub+zip"
          };
        }
        if (check(xpiZipFilename, { offset: 30 })) {
          return {
            ext: "xpi",
            mime: "application/x-xpinstall"
          };
        }
        if (checkString("mimetypeapplication/vnd.oasis.opendocument.text", { offset: 30 })) {
          return {
            ext: "odt",
            mime: "application/vnd.oasis.opendocument.text"
          };
        }
        if (checkString("mimetypeapplication/vnd.oasis.opendocument.spreadsheet", { offset: 30 })) {
          return {
            ext: "ods",
            mime: "application/vnd.oasis.opendocument.spreadsheet"
          };
        }
        if (checkString("mimetypeapplication/vnd.oasis.opendocument.presentation", { offset: 30 })) {
          return {
            ext: "odp",
            mime: "application/vnd.oasis.opendocument.presentation"
          };
        }
        const findNextZipHeaderIndex = (arr, startAt = 0) => arr.findIndex((el, i, arr2) => i >= startAt && arr2[i] === 80 && arr2[i + 1] === 75 && arr2[i + 2] === 3 && arr2[i + 3] === 4);
        let zipHeaderIndex = 0;
        let oxmlFound = false;
        let type = null;
        do {
          const offset = zipHeaderIndex + 30;
          if (!oxmlFound) {
            oxmlFound = check(oxmlContentTypes, { offset }) || check(oxmlRels, { offset });
          }
          if (!type) {
            if (checkString("word/", { offset })) {
              type = {
                ext: "docx",
                mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              };
            } else if (checkString("ppt/", { offset })) {
              type = {
                ext: "pptx",
                mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
              };
            } else if (checkString("xl/", { offset })) {
              type = {
                ext: "xlsx",
                mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              };
            }
          }
          if (oxmlFound && type) {
            return type;
          }
          zipHeaderIndex = findNextZipHeaderIndex(buf, offset);
        } while (zipHeaderIndex >= 0);
        if (type) {
          return type;
        }
      }
      if (check([80, 75]) && (buf[2] === 3 || buf[2] === 5 || buf[2] === 7) && (buf[3] === 4 || buf[3] === 6 || buf[3] === 8)) {
        return {
          ext: "zip",
          mime: "application/zip"
        };
      }
      if (check([117, 115, 116, 97, 114], { offset: 257 })) {
        return {
          ext: "tar",
          mime: "application/x-tar"
        };
      }
      if (check([82, 97, 114, 33, 26, 7]) && (buf[6] === 0 || buf[6] === 1)) {
        return {
          ext: "rar",
          mime: "application/x-rar-compressed"
        };
      }
      if (check([31, 139, 8])) {
        return {
          ext: "gz",
          mime: "application/gzip"
        };
      }
      if (check([66, 90, 104])) {
        return {
          ext: "bz2",
          mime: "application/x-bzip2"
        };
      }
      if (check([55, 122, 188, 175, 39, 28])) {
        return {
          ext: "7z",
          mime: "application/x-7z-compressed"
        };
      }
      if (check([120, 1])) {
        return {
          ext: "dmg",
          mime: "application/x-apple-diskimage"
        };
      }
      if (check([51, 103, 112, 53]) || // 3gp5
      check([0, 0, 0]) && check([102, 116, 121, 112], { offset: 4 }) && (check([109, 112, 52, 49], { offset: 8 }) || // MP41
      check([109, 112, 52, 50], { offset: 8 }) || // MP42
      check([105, 115, 111, 109], { offset: 8 }) || // ISOM
      check([105, 115, 111, 50], { offset: 8 }) || // ISO2
      check([109, 109, 112, 52], { offset: 8 }) || // MMP4
      check([77, 52, 86], { offset: 8 }) || // M4V
      check([100, 97, 115, 104], { offset: 8 }))) {
        return {
          ext: "mp4",
          mime: "video/mp4"
        };
      }
      if (check([77, 84, 104, 100])) {
        return {
          ext: "mid",
          mime: "audio/midi"
        };
      }
      if (check([26, 69, 223, 163])) {
        const sliced = buf.subarray(4, 4 + 4096);
        const idPos = sliced.findIndex((el, i, arr) => arr[i] === 66 && arr[i + 1] === 130);
        if (idPos !== -1) {
          const docTypePos = idPos + 3;
          const findDocType = (type) => [...type].every((c, i) => sliced[docTypePos + i] === c.charCodeAt(0));
          if (findDocType("matroska")) {
            return {
              ext: "mkv",
              mime: "video/x-matroska"
            };
          }
          if (findDocType("webm")) {
            return {
              ext: "webm",
              mime: "video/webm"
            };
          }
        }
      }
      if (check([0, 0, 0, 20, 102, 116, 121, 112, 113, 116, 32, 32]) || check([102, 114, 101, 101], { offset: 4 }) || // Type: `free`
      check([102, 116, 121, 112, 113, 116, 32, 32], { offset: 4 }) || check([109, 100, 97, 116], { offset: 4 }) || // MJPEG
      check([109, 111, 111, 118], { offset: 4 }) || // Type: `moov`
      check([119, 105, 100, 101], { offset: 4 })) {
        return {
          ext: "mov",
          mime: "video/quicktime"
        };
      }
      if (check([82, 73, 70, 70])) {
        if (check([65, 86, 73], { offset: 8 })) {
          return {
            ext: "avi",
            mime: "video/vnd.avi"
          };
        }
        if (check([87, 65, 86, 69], { offset: 8 })) {
          return {
            ext: "wav",
            mime: "audio/vnd.wave"
          };
        }
        if (check([81, 76, 67, 77], { offset: 8 })) {
          return {
            ext: "qcp",
            mime: "audio/qcelp"
          };
        }
      }
      if (check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
        let offset = 30;
        do {
          const objectSize = readUInt64LE(buf, offset + 16);
          if (check([145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101], { offset })) {
            if (check([64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43], { offset: offset + 24 })) {
              return {
                ext: "wma",
                mime: "audio/x-ms-wma"
              };
            }
            if (check([192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43], { offset: offset + 24 })) {
              return {
                ext: "wmv",
                mime: "video/x-ms-asf"
              };
            }
            break;
          }
          offset += objectSize;
        } while (offset + 24 <= buf.length);
        return {
          ext: "asf",
          mime: "application/vnd.ms-asf"
        };
      }
      if (check([0, 0, 1, 186]) || check([0, 0, 1, 179])) {
        return {
          ext: "mpg",
          mime: "video/mpeg"
        };
      }
      if (check([102, 116, 121, 112, 51, 103], { offset: 4 })) {
        return {
          ext: "3gp",
          mime: "video/3gpp"
        };
      }
      for (let start = 0; start < 2 && start < buf.length - 16; start++) {
        if (check([73, 68, 51], { offset: start }) || // ID3 header
        check([255, 226], { offset: start, mask: [255, 226] })) {
          return {
            ext: "mp3",
            mime: "audio/mpeg"
          };
        }
        if (check([255, 228], { offset: start, mask: [255, 228] })) {
          return {
            ext: "mp2",
            mime: "audio/mpeg"
          };
        }
        if (check([255, 248], { offset: start, mask: [255, 252] })) {
          return {
            ext: "mp2",
            mime: "audio/mpeg"
          };
        }
        if (check([255, 240], { offset: start, mask: [255, 252] })) {
          return {
            ext: "mp4",
            mime: "audio/mpeg"
          };
        }
      }
      if (check([102, 116, 121, 112, 77, 52, 65], { offset: 4 })) {
        return {
          // MPEG-4 layer 3 (audio)
          ext: "m4a",
          mime: "audio/mp4"
          // RFC 4337
        };
      }
      if (check([79, 112, 117, 115, 72, 101, 97, 100], { offset: 28 })) {
        return {
          ext: "opus",
          mime: "audio/opus"
        };
      }
      if (check([79, 103, 103, 83])) {
        if (check([128, 116, 104, 101, 111, 114, 97], { offset: 28 })) {
          return {
            ext: "ogv",
            mime: "video/ogg"
          };
        }
        if (check([1, 118, 105, 100, 101, 111, 0], { offset: 28 })) {
          return {
            ext: "ogm",
            mime: "video/ogg"
          };
        }
        if (check([127, 70, 76, 65, 67], { offset: 28 })) {
          return {
            ext: "oga",
            mime: "audio/ogg"
          };
        }
        if (check([83, 112, 101, 101, 120, 32, 32], { offset: 28 })) {
          return {
            ext: "spx",
            mime: "audio/ogg"
          };
        }
        if (check([1, 118, 111, 114, 98, 105, 115], { offset: 28 })) {
          return {
            ext: "ogg",
            mime: "audio/ogg"
          };
        }
        return {
          ext: "ogx",
          mime: "application/ogg"
        };
      }
      if (check([102, 76, 97, 67])) {
        return {
          ext: "flac",
          mime: "audio/x-flac"
        };
      }
      if (check([77, 65, 67, 32])) {
        return {
          ext: "ape",
          mime: "audio/ape"
        };
      }
      if (check([119, 118, 112, 107])) {
        return {
          ext: "wv",
          mime: "audio/wavpack"
        };
      }
      if (check([35, 33, 65, 77, 82, 10])) {
        return {
          ext: "amr",
          mime: "audio/amr"
        };
      }
      if (check([37, 80, 68, 70])) {
        return {
          ext: "pdf",
          mime: "application/pdf"
        };
      }
      if (check([77, 90])) {
        return {
          ext: "exe",
          mime: "application/x-msdownload"
        };
      }
      if ((buf[0] === 67 || buf[0] === 70) && check([87, 83], { offset: 1 })) {
        return {
          ext: "swf",
          mime: "application/x-shockwave-flash"
        };
      }
      if (check([123, 92, 114, 116, 102])) {
        return {
          ext: "rtf",
          mime: "application/rtf"
        };
      }
      if (check([0, 97, 115, 109])) {
        return {
          ext: "wasm",
          mime: "application/wasm"
        };
      }
      if (check([119, 79, 70, 70]) && (check([0, 1, 0, 0], { offset: 4 }) || check([79, 84, 84, 79], { offset: 4 }))) {
        return {
          ext: "woff",
          mime: "font/woff"
        };
      }
      if (check([119, 79, 70, 50]) && (check([0, 1, 0, 0], { offset: 4 }) || check([79, 84, 84, 79], { offset: 4 }))) {
        return {
          ext: "woff2",
          mime: "font/woff2"
        };
      }
      if (check([76, 80], { offset: 34 }) && (check([0, 0, 1], { offset: 8 }) || check([1, 0, 2], { offset: 8 }) || check([2, 0, 2], { offset: 8 }))) {
        return {
          ext: "eot",
          mime: "application/vnd.ms-fontobject"
        };
      }
      if (check([0, 1, 0, 0, 0])) {
        return {
          ext: "ttf",
          mime: "font/ttf"
        };
      }
      if (check([79, 84, 84, 79, 0])) {
        return {
          ext: "otf",
          mime: "font/otf"
        };
      }
      if (check([0, 0, 1, 0])) {
        return {
          ext: "ico",
          mime: "image/x-icon"
        };
      }
      if (check([0, 0, 2, 0])) {
        return {
          ext: "cur",
          mime: "image/x-icon"
        };
      }
      if (check([70, 76, 86, 1])) {
        return {
          ext: "flv",
          mime: "video/x-flv"
        };
      }
      if (check([37, 33])) {
        return {
          ext: "ps",
          mime: "application/postscript"
        };
      }
      if (check([253, 55, 122, 88, 90, 0])) {
        return {
          ext: "xz",
          mime: "application/x-xz"
        };
      }
      if (check([83, 81, 76, 105])) {
        return {
          ext: "sqlite",
          mime: "application/x-sqlite3"
        };
      }
      if (check([78, 69, 83, 26])) {
        return {
          ext: "nes",
          mime: "application/x-nintendo-nes-rom"
        };
      }
      if (check([67, 114, 50, 52])) {
        return {
          ext: "crx",
          mime: "application/x-google-chrome-extension"
        };
      }
      if (check([77, 83, 67, 70]) || check([73, 83, 99, 40])) {
        return {
          ext: "cab",
          mime: "application/vnd.ms-cab-compressed"
        };
      }
      if (check([33, 60, 97, 114, 99, 104, 62, 10, 100, 101, 98, 105, 97, 110, 45, 98, 105, 110, 97, 114, 121])) {
        return {
          ext: "deb",
          mime: "application/x-deb"
        };
      }
      if (check([33, 60, 97, 114, 99, 104, 62])) {
        return {
          ext: "ar",
          mime: "application/x-unix-archive"
        };
      }
      if (check([237, 171, 238, 219])) {
        return {
          ext: "rpm",
          mime: "application/x-rpm"
        };
      }
      if (check([31, 160]) || check([31, 157])) {
        return {
          ext: "Z",
          mime: "application/x-compress"
        };
      }
      if (check([76, 90, 73, 80])) {
        return {
          ext: "lz",
          mime: "application/x-lzip"
        };
      }
      if (check([208, 207, 17, 224, 161, 177, 26, 225])) {
        return {
          ext: "msi",
          mime: "application/x-msi"
        };
      }
      if (check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2])) {
        return {
          ext: "mxf",
          mime: "application/mxf"
        };
      }
      if (check([71], { offset: 4 }) && (check([71], { offset: 192 }) || check([71], { offset: 196 }))) {
        return {
          ext: "mts",
          mime: "video/mp2t"
        };
      }
      if (check([66, 76, 69, 78, 68, 69, 82])) {
        return {
          ext: "blend",
          mime: "application/x-blender"
        };
      }
      if (check([66, 80, 71, 251])) {
        return {
          ext: "bpg",
          mime: "image/bpg"
        };
      }
      if (check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10])) {
        if (check([106, 112, 50, 32], { offset: 20 })) {
          return {
            ext: "jp2",
            mime: "image/jp2"
          };
        }
        if (check([106, 112, 120, 32], { offset: 20 })) {
          return {
            ext: "jpx",
            mime: "image/jpx"
          };
        }
        if (check([106, 112, 109, 32], { offset: 20 })) {
          return {
            ext: "jpm",
            mime: "image/jpm"
          };
        }
        if (check([109, 106, 112, 50], { offset: 20 })) {
          return {
            ext: "mj2",
            mime: "image/mj2"
          };
        }
      }
      if (check([70, 79, 82, 77])) {
        return {
          ext: "aif",
          mime: "audio/aiff"
        };
      }
      if (checkString("<?xml ")) {
        return {
          ext: "xml",
          mime: "application/xml"
        };
      }
      if (check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 })) {
        return {
          ext: "mobi",
          mime: "application/x-mobipocket-ebook"
        };
      }
      if (check([102, 116, 121, 112], { offset: 4 })) {
        if (check([109, 105, 102, 49], { offset: 8 })) {
          return {
            ext: "heic",
            mime: "image/heif"
          };
        }
        if (check([109, 115, 102, 49], { offset: 8 })) {
          return {
            ext: "heic",
            mime: "image/heif-sequence"
          };
        }
        if (check([104, 101, 105, 99], { offset: 8 }) || check([104, 101, 105, 120], { offset: 8 })) {
          return {
            ext: "heic",
            mime: "image/heic"
          };
        }
        if (check([104, 101, 118, 99], { offset: 8 }) || check([104, 101, 118, 120], { offset: 8 })) {
          return {
            ext: "heic",
            mime: "image/heic-sequence"
          };
        }
      }
      if (check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10])) {
        return {
          ext: "ktx",
          mime: "image/ktx"
        };
      }
      if (check([68, 73, 67, 77], { offset: 128 })) {
        return {
          ext: "dcm",
          mime: "application/dicom"
        };
      }
      if (check([77, 80, 43])) {
        return {
          ext: "mpc",
          mime: "audio/x-musepack"
        };
      }
      if (check([77, 80, 67, 75])) {
        return {
          ext: "mpc",
          mime: "audio/x-musepack"
        };
      }
      if (check([66, 69, 71, 73, 78, 58])) {
        return {
          ext: "ics",
          mime: "text/calendar"
        };
      }
      if (check([103, 108, 84, 70, 2, 0, 0, 0])) {
        return {
          ext: "glb",
          mime: "model/gltf-binary"
        };
      }
      if (check([212, 195, 178, 161]) || check([161, 178, 195, 212])) {
        return {
          ext: "pcap",
          mime: "application/vnd.tcpdump.pcap"
        };
      }
      return null;
    };
    module.exports = fileType;
    module.exports.default = fileType;
    Object.defineProperty(fileType, "minimumBytes", { value: 4100 });
    module.exports.stream = (readableStream) => new Promise((resolve, reject) => {
      const stream = eval("require")("stream");
      readableStream.once("readable", () => {
        const pass = new stream.PassThrough();
        const chunk = readableStream.read(module.exports.minimumBytes) || readableStream.read();
        try {
          pass.fileType = fileType(chunk);
        } catch (error) {
          reject(error);
        }
        readableStream.unshift(chunk);
        if (stream.pipeline) {
          resolve(stream.pipeline(readableStream, pass, () => {
          }));
        } else {
          resolve(readableStream.pipe(pass));
        }
      });
    });
  }
});

// ../../node_modules/.deno/image-type@4.1.0/node_modules/image-type/index.js
var require_image_type = __commonJS({
  "../../node_modules/.deno/image-type@4.1.0/node_modules/image-type/index.js"(exports2, module2) {
    "use strict";
    var fileType2 = require_file_type();
    var imageExts = /* @__PURE__ */ new Set([
      "jpg",
      "png",
      "gif",
      "webp",
      "flif",
      "cr2",
      "tif",
      "bmp",
      "jxr",
      "psd",
      "ico",
      "bpg",
      "jp2",
      "jpm",
      "jpx",
      "heic",
      "cur",
      "dcm"
    ]);
    var imageType2 = (input) => {
      const ret = fileType2(input);
      return imageExts.has(ret && ret.ext) ? ret : null;
    };
    module2.exports = imageType2;
    module2.exports.default = imageType2;
    Object.defineProperty(imageType2, "minimumBytes", { value: fileType2.minimumBytes });
  }
});

// ../../node_modules/.deno/super-image-cropper@1.0.22/node_modules/super-image-cropper/dist/lib/decoder.js
var import_gifuct_js = __toESM(require_lib2());
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject2) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject2(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject2(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var Decoder = (
  /** @class */
  function() {
    function Decoder2(url) {
      Object.defineProperty(this, "url", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: url
      });
      Object.defineProperty(this, "parseGIF", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "validateAndFixFrame", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: function(gif) {
          var currentGce = null;
          for (var _i = 0, _a = gif.frames; _i < _a.length; _i++) {
            var frame = _a[_i];
            currentGce = frame.gce ? frame.gce : currentGce;
            if ("image" in frame && !("gce" in frame)) {
              frame.gce = currentGce;
            }
          }
        }
      });
    }
    Object.defineProperty(Decoder2.prototype, "decode", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return __awaiter(this, void 0, void 0, function() {
          var imageData;
          return __generator(this, function(_a) {
            switch (_a.label) {
              case 0:
                return [4, this.fetchImageData(this.url)];
              case 1:
                imageData = _a.sent();
                this.parseGIF = (0, import_gifuct_js.parseGIF)(imageData);
                this.validateAndFixFrame(this.parseGIF);
                return [2, this.parseGIF];
            }
          });
        });
      }
    });
    Object.defineProperty(Decoder2.prototype, "decompressFrames", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return __awaiter(this, void 0, void 0, function() {
          var parsedFrames, frames;
          return __generator(this, function(_a) {
            switch (_a.label) {
              case 0:
                if (!!this.parseGIF) return [3, 2];
                return [4, this.decode()];
              case 1:
                _a.sent();
                _a.label = 2;
              case 2:
                return [4, (0, import_gifuct_js.decompressFrames)(this.parseGIF, true)];
              case 3:
                parsedFrames = _a.sent();
                frames = this.generate2ImageData(parsedFrames);
                return [2, {
                  frames,
                  delays: parsedFrames.map(function(item) {
                    return item.delay;
                  }),
                  parsedFrames
                }];
            }
          });
        });
      }
    });
    Object.defineProperty(Decoder2.prototype, "generate2ImageData", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(parsedFrames) {
        return parsedFrames.map(function(item) {
          var frameDims = item === null || item === void 0 ? void 0 : item.dims;
          var image = new ImageData(frameDims.width, frameDims.height);
          image.data.set(item.patch);
          return image;
        });
      }
    });
    Object.defineProperty(Decoder2.prototype, "generate2ImageDataWithPixelsModified", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(frames, parsedFrames) {
        var _this = this;
        return frames.map(function(item, index) {
          var _a;
          var frameDims = (_a = parsedFrames[index]) === null || _a === void 0 ? void 0 : _a.dims;
          var lsd = _this.parseGIF.lsd;
          var image = new ImageData(lsd.width, lsd.height);
          image.data.set(new Uint8ClampedArray(item));
          return image;
        });
      }
    });
    Object.defineProperty(Decoder2.prototype, "fetchImageData", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(url) {
        return new Promise(function(resolve2, reject2) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = function(e) {
            if (!(e.target instanceof XMLHttpRequest))
              return;
            if (e.target.status !== 200 && e.target.status !== 304) {
              reject2("Status Error: " + e.target.status);
              return;
            }
            var data = e.target.response;
            if (data.toString().indexOf("ArrayBuffer") > 0) {
              data = new Uint8Array(data);
            }
            resolve2(data);
          };
          xhr.onerror = function(e) {
            reject2(e);
          };
          xhr.send();
        });
      }
    });
    Object.defineProperty(Decoder2.prototype, "handlePixels", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(frames) {
        var options = this.parseGIF.lsd;
        var size = options.width * options.height * 4;
        var readyFrames = [];
        for (var i = 0; i < frames.length; ++i) {
          var frame = frames[i];
          var typedArray = i === 0 || frames[i - 1].disposalType === 2 ? new Uint8ClampedArray(size) : readyFrames[i - 1].slice();
          readyFrames.push(this.putPixels(typedArray, frame, options));
        }
        return readyFrames;
      }
    });
    Object.defineProperty(Decoder2.prototype, "putPixels", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(typedArray, frame, gifSize) {
        if (!frame.dims)
          return typedArray;
        var _a = frame.dims, width = _a.width, height = _a.height, dy = _a.top, dx = _a.left;
        var offset = dy * gifSize.width + dx;
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            var pPos = y * width + x;
            var colorIndex = frame.pixels[pPos];
            var taPos = offset + y * gifSize.width + x;
            var color = frame.colorTable[colorIndex] || [0, 0, 0];
            if (colorIndex === frame.transparentIndex) {
              typedArray[taPos * 4] = 0;
              typedArray[taPos * 4 + 1] = 0;
              typedArray[taPos * 4 + 2] = 0;
              typedArray[taPos * 4 + 3] = 0;
            } else {
              typedArray[taPos * 4] = color[0];
              typedArray[taPos * 4 + 1] = color[1];
              typedArray[taPos * 4 + 2] = color[2];
              typedArray[taPos * 4 + 3] = 255;
            }
          }
        }
        return typedArray;
      }
    });
    return Decoder2;
  }()
);

// ../../node_modules/.deno/gif-build-worker-js@1.0.2/node_modules/gif-build-worker-js/dist/lib/gif.worker.js
var gif_worker_default = `(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){var NeuQuant=require("./TypedNeuQuant.js");var LZWEncoder=require("./LZWEncoder.js");function ByteArray(){this.page=-1;this.pages=[];this.newPage()}ByteArray.pageSize=4096;ByteArray.charMap={};for(var i=0;i<256;i++)ByteArray.charMap[i]=String.fromCharCode(i);ByteArray.prototype.newPage=function(){this.pages[++this.page]=new Uint8Array(ByteArray.pageSize);this.cursor=0};ByteArray.prototype.getData=function(){var rv="";for(var p=0;p<this.pages.length;p++){for(var i=0;i<ByteArray.pageSize;i++){rv+=ByteArray.charMap[this.pages[p][i]]}}return rv};ByteArray.prototype.writeByte=function(val){if(this.cursor>=ByteArray.pageSize)this.newPage();this.pages[this.page][this.cursor++]=val};ByteArray.prototype.writeUTFBytes=function(string){for(var l=string.length,i=0;i<l;i++)this.writeByte(string.charCodeAt(i))};ByteArray.prototype.writeBytes=function(array,offset,length){for(var l=length||array.length,i=offset||0;i<l;i++)this.writeByte(array[i])};function GIFEncoder(width,height){this.width=~~width;this.height=~~height;this.transparent=null;this.transIndex=0;this.repeat=-1;this.delay=0;this.image=null;this.pixels=null;this.indexedPixels=null;this.colorDepth=null;this.colorTab=null;this.neuQuant=null;this.usedEntry=new Array;this.palSize=7;this.dispose=-1;this.firstFrame=true;this.sample=10;this.dither=false;this.globalPalette=false;this.out=new ByteArray}GIFEncoder.prototype.setDelay=function(milliseconds){this.delay=Math.round(milliseconds/10)};GIFEncoder.prototype.setFrameRate=function(fps){this.delay=Math.round(100/fps)};GIFEncoder.prototype.setDispose=function(disposalCode){if(disposalCode>=0)this.dispose=disposalCode};GIFEncoder.prototype.setRepeat=function(repeat){this.repeat=repeat};GIFEncoder.prototype.setTransparent=function(color){this.transparent=color};GIFEncoder.prototype.addFrame=function(imageData){this.image=imageData;this.colorTab=this.globalPalette&&this.globalPalette.slice?this.globalPalette:null;this.getImagePixels();this.analyzePixels();if(this.globalPalette===true)this.globalPalette=this.colorTab;if(this.firstFrame){this.writeLSD();this.writePalette();if(this.repeat>=0){this.writeNetscapeExt()}}this.writeGraphicCtrlExt();this.writeImageDesc();if(!this.firstFrame&&!this.globalPalette)this.writePalette();this.writePixels();this.firstFrame=false};GIFEncoder.prototype.finish=function(){this.out.writeByte(59)};GIFEncoder.prototype.setQuality=function(quality){if(quality<1)quality=1;this.sample=quality};GIFEncoder.prototype.setDither=function(dither){if(dither===true)dither="FloydSteinberg";this.dither=dither};GIFEncoder.prototype.setGlobalPalette=function(palette){this.globalPalette=palette};GIFEncoder.prototype.getGlobalPalette=function(){return this.globalPalette&&this.globalPalette.slice&&this.globalPalette.slice(0)||this.globalPalette};GIFEncoder.prototype.writeHeader=function(){this.out.writeUTFBytes("GIF89a")};GIFEncoder.prototype.analyzePixels=function(){if(!this.colorTab){this.neuQuant=new NeuQuant(this.pixels,this.sample);this.neuQuant.buildColormap();this.colorTab=this.neuQuant.getColormap()}if(this.dither){this.ditherPixels(this.dither.replace("-serpentine",""),this.dither.match(/-serpentine/)!==null)}else{this.indexPixels()}this.pixels=null;this.colorDepth=8;this.palSize=7;if(this.transparent!==null){this.transIndex=this.findClosest(this.transparent,true)}};GIFEncoder.prototype.indexPixels=function(imgq){var nPix=this.pixels.length/3;this.indexedPixels=new Uint8Array(nPix);var k=0;for(var j=0;j<nPix;j++){var index=this.findClosestRGB(this.pixels[k++]&255,this.pixels[k++]&255,this.pixels[k++]&255);this.usedEntry[index]=true;this.indexedPixels[j]=index}};GIFEncoder.prototype.ditherPixels=function(kernel,serpentine){var kernels={FalseFloydSteinberg:[[3/8,1,0],[3/8,0,1],[2/8,1,1]],FloydSteinberg:[[7/16,1,0],[3/16,-1,1],[5/16,0,1],[1/16,1,1]],Stucki:[[8/42,1,0],[4/42,2,0],[2/42,-2,1],[4/42,-1,1],[8/42,0,1],[4/42,1,1],[2/42,2,1],[1/42,-2,2],[2/42,-1,2],[4/42,0,2],[2/42,1,2],[1/42,2,2]],Atkinson:[[1/8,1,0],[1/8,2,0],[1/8,-1,1],[1/8,0,1],[1/8,1,1],[1/8,0,2]]};if(!kernel||!kernels[kernel]){throw"Unknown dithering kernel: "+kernel}var ds=kernels[kernel];var index=0,height=this.height,width=this.width,data=this.pixels;var direction=serpentine?-1:1;this.indexedPixels=new Uint8Array(this.pixels.length/3);for(var y=0;y<height;y++){if(serpentine)direction=direction*-1;for(var x=direction==1?0:width-1,xend=direction==1?width:0;x!==xend;x+=direction){index=y*width+x;var idx=index*3;var r1=data[idx];var g1=data[idx+1];var b1=data[idx+2];idx=this.findClosestRGB(r1,g1,b1);this.usedEntry[idx]=true;this.indexedPixels[index]=idx;idx*=3;var r2=this.colorTab[idx];var g2=this.colorTab[idx+1];var b2=this.colorTab[idx+2];var er=r1-r2;var eg=g1-g2;var eb=b1-b2;for(var i=direction==1?0:ds.length-1,end=direction==1?ds.length:0;i!==end;i+=direction){var x1=ds[i][1];var y1=ds[i][2];if(x1+x>=0&&x1+x<width&&y1+y>=0&&y1+y<height){var d=ds[i][0];idx=index+x1+y1*width;idx*=3;data[idx]=Math.max(0,Math.min(255,data[idx]+er*d));data[idx+1]=Math.max(0,Math.min(255,data[idx+1]+eg*d));data[idx+2]=Math.max(0,Math.min(255,data[idx+2]+eb*d))}}}}};GIFEncoder.prototype.findClosest=function(c,used){return this.findClosestRGB((c&16711680)>>16,(c&65280)>>8,c&255,used)};GIFEncoder.prototype.findClosestRGB=function(r,g,b,used){if(this.colorTab===null)return-1;if(this.neuQuant&&!used){return this.neuQuant.lookupRGB(r,g,b)}var c=b|g<<8|r<<16;var minpos=0;var dmin=256*256*256;var len=this.colorTab.length;for(var i=0,index=0;i<len;index++){var dr=r-(this.colorTab[i++]&255);var dg=g-(this.colorTab[i++]&255);var db=b-(this.colorTab[i++]&255);var d=dr*dr+dg*dg+db*db;if((!used||this.usedEntry[index])&&d<dmin){dmin=d;minpos=index}}return minpos};GIFEncoder.prototype.getImagePixels=function(){var w=this.width;var h=this.height;this.pixels=new Uint8Array(w*h*3);var data=this.image;var srcPos=0;var count=0;for(var i=0;i<h;i++){for(var j=0;j<w;j++){this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];srcPos++}}};GIFEncoder.prototype.writeGraphicCtrlExt=function(){this.out.writeByte(33);this.out.writeByte(249);this.out.writeByte(4);var transp,disp;if(this.transparent===null){transp=0;disp=0}else{transp=1;disp=2}if(this.dispose>=0){disp=dispose&7}disp<<=2;this.out.writeByte(0|disp|0|transp);this.writeShort(this.delay);this.out.writeByte(this.transIndex);this.out.writeByte(0)};GIFEncoder.prototype.writeImageDesc=function(){this.out.writeByte(44);this.writeShort(0);this.writeShort(0);this.writeShort(this.width);this.writeShort(this.height);if(this.firstFrame||this.globalPalette){this.out.writeByte(0)}else{this.out.writeByte(128|0|0|0|this.palSize)}};GIFEncoder.prototype.writeLSD=function(){this.writeShort(this.width);this.writeShort(this.height);this.out.writeByte(128|112|0|this.palSize);this.out.writeByte(0);this.out.writeByte(0)};GIFEncoder.prototype.writeNetscapeExt=function(){this.out.writeByte(33);this.out.writeByte(255);this.out.writeByte(11);this.out.writeUTFBytes("NETSCAPE2.0");this.out.writeByte(3);this.out.writeByte(1);this.writeShort(this.repeat);this.out.writeByte(0)};GIFEncoder.prototype.writePalette=function(){this.out.writeBytes(this.colorTab);var n=3*256-this.colorTab.length;for(var i=0;i<n;i++)this.out.writeByte(0)};GIFEncoder.prototype.writeShort=function(pValue){this.out.writeByte(pValue&255);this.out.writeByte(pValue>>8&255)};GIFEncoder.prototype.writePixels=function(){var enc=new LZWEncoder(this.width,this.height,this.indexedPixels,this.colorDepth);enc.encode(this.out)};GIFEncoder.prototype.stream=function(){return this.out};module.exports=GIFEncoder},{"./LZWEncoder.js":2,"./TypedNeuQuant.js":3}],2:[function(require,module,exports){var EOF=-1;var BITS=12;var HSIZE=5003;var masks=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function LZWEncoder(width,height,pixels,colorDepth){var initCodeSize=Math.max(2,colorDepth);var accum=new Uint8Array(256);var htab=new Int32Array(HSIZE);var codetab=new Int32Array(HSIZE);var cur_accum,cur_bits=0;var a_count;var free_ent=0;var maxcode;var clear_flg=false;var g_init_bits,ClearCode,EOFCode;function char_out(c,outs){accum[a_count++]=c;if(a_count>=254)flush_char(outs)}function cl_block(outs){cl_hash(HSIZE);free_ent=ClearCode+2;clear_flg=true;output(ClearCode,outs)}function cl_hash(hsize){for(var i=0;i<hsize;++i)htab[i]=-1}function compress(init_bits,outs){var fcode,c,i,ent,disp,hsize_reg,hshift;g_init_bits=init_bits;clear_flg=false;n_bits=g_init_bits;maxcode=MAXCODE(n_bits);ClearCode=1<<init_bits-1;EOFCode=ClearCode+1;free_ent=ClearCode+2;a_count=0;ent=nextPixel();hshift=0;for(fcode=HSIZE;fcode<65536;fcode*=2)++hshift;hshift=8-hshift;hsize_reg=HSIZE;cl_hash(hsize_reg);output(ClearCode,outs);outer_loop:while((c=nextPixel())!=EOF){fcode=(c<<BITS)+ent;i=c<<hshift^ent;if(htab[i]===fcode){ent=codetab[i];continue}else if(htab[i]>=0){disp=hsize_reg-i;if(i===0)disp=1;do{if((i-=disp)<0)i+=hsize_reg;if(htab[i]===fcode){ent=codetab[i];continue outer_loop}}while(htab[i]>=0)}output(ent,outs);ent=c;if(free_ent<1<<BITS){codetab[i]=free_ent++;htab[i]=fcode}else{cl_block(outs)}}output(ent,outs);output(EOFCode,outs)}function encode(outs){outs.writeByte(initCodeSize);remaining=width*height;curPixel=0;compress(initCodeSize+1,outs);outs.writeByte(0)}function flush_char(outs){if(a_count>0){outs.writeByte(a_count);outs.writeBytes(accum,0,a_count);a_count=0}}function MAXCODE(n_bits){return(1<<n_bits)-1}function nextPixel(){if(remaining===0)return EOF;--remaining;var pix=pixels[curPixel++];return pix&255}function output(code,outs){cur_accum&=masks[cur_bits];if(cur_bits>0)cur_accum|=code<<cur_bits;else cur_accum=code;cur_bits+=n_bits;while(cur_bits>=8){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}if(free_ent>maxcode||clear_flg){if(clear_flg){maxcode=MAXCODE(n_bits=g_init_bits);clear_flg=false}else{++n_bits;if(n_bits==BITS)maxcode=1<<BITS;else maxcode=MAXCODE(n_bits)}}if(code==EOFCode){while(cur_bits>0){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}flush_char(outs)}}this.encode=encode}module.exports=LZWEncoder},{}],3:[function(require,module,exports){var ncycles=100;var netsize=256;var maxnetpos=netsize-1;var netbiasshift=4;var intbiasshift=16;var intbias=1<<intbiasshift;var gammashift=10;var gamma=1<<gammashift;var betashift=10;var beta=intbias>>betashift;var betagamma=intbias<<gammashift-betashift;var initrad=netsize>>3;var radiusbiasshift=6;var radiusbias=1<<radiusbiasshift;var initradius=initrad*radiusbias;var radiusdec=30;var alphabiasshift=10;var initalpha=1<<alphabiasshift;var alphadec;var radbiasshift=8;var radbias=1<<radbiasshift;var alpharadbshift=alphabiasshift+radbiasshift;var alpharadbias=1<<alpharadbshift;var prime1=499;var prime2=491;var prime3=487;var prime4=503;var minpicturebytes=3*prime4;function NeuQuant(pixels,samplefac){var network;var netindex;var bias;var freq;var radpower;function init(){network=[];netindex=new Int32Array(256);bias=new Int32Array(netsize);freq=new Int32Array(netsize);radpower=new Int32Array(netsize>>3);var i,v;for(i=0;i<netsize;i++){v=(i<<netbiasshift+8)/netsize;network[i]=new Float64Array([v,v,v,0]);freq[i]=intbias/netsize;bias[i]=0}}function unbiasnet(){for(var i=0;i<netsize;i++){network[i][0]>>=netbiasshift;network[i][1]>>=netbiasshift;network[i][2]>>=netbiasshift;network[i][3]=i}}function altersingle(alpha,i,b,g,r){network[i][0]-=alpha*(network[i][0]-b)/initalpha;network[i][1]-=alpha*(network[i][1]-g)/initalpha;network[i][2]-=alpha*(network[i][2]-r)/initalpha}function alterneigh(radius,i,b,g,r){var lo=Math.abs(i-radius);var hi=Math.min(i+radius,netsize);var j=i+1;var k=i-1;var m=1;var p,a;while(j<hi||k>lo){a=radpower[m++];if(j<hi){p=network[j++];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}if(k>lo){p=network[k--];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}}}function contest(b,g,r){var bestd=~(1<<31);var bestbiasd=bestd;var bestpos=-1;var bestbiaspos=bestpos;var i,n,dist,biasdist,betafreq;for(i=0;i<netsize;i++){n=network[i];dist=Math.abs(n[0]-b)+Math.abs(n[1]-g)+Math.abs(n[2]-r);if(dist<bestd){bestd=dist;bestpos=i}biasdist=dist-(bias[i]>>intbiasshift-netbiasshift);if(biasdist<bestbiasd){bestbiasd=biasdist;bestbiaspos=i}betafreq=freq[i]>>betashift;freq[i]-=betafreq;bias[i]+=betafreq<<gammashift}freq[bestpos]+=beta;bias[bestpos]-=betagamma;return bestbiaspos}function inxbuild(){var i,j,p,q,smallpos,smallval,previouscol=0,startpos=0;for(i=0;i<netsize;i++){p=network[i];smallpos=i;smallval=p[1];for(j=i+1;j<netsize;j++){q=network[j];if(q[1]<smallval){smallpos=j;smallval=q[1]}}q=network[smallpos];if(i!=smallpos){j=q[0];q[0]=p[0];p[0]=j;j=q[1];q[1]=p[1];p[1]=j;j=q[2];q[2]=p[2];p[2]=j;j=q[3];q[3]=p[3];p[3]=j}if(smallval!=previouscol){netindex[previouscol]=startpos+i>>1;for(j=previouscol+1;j<smallval;j++)netindex[j]=i;previouscol=smallval;startpos=i}}netindex[previouscol]=startpos+maxnetpos>>1;for(j=previouscol+1;j<256;j++)netindex[j]=maxnetpos}function inxsearch(b,g,r){var a,p,dist;var bestd=1e3;var best=-1;var i=netindex[g];var j=i-1;while(i<netsize||j>=0){if(i<netsize){p=network[i];dist=p[1]-g;if(dist>=bestd)i=netsize;else{i++;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}if(j>=0){p=network[j];dist=g-p[1];if(dist>=bestd)j=-1;else{j--;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}}return best}function learn(){var i;var lengthcount=pixels.length;var alphadec=30+(samplefac-1)/3;var samplepixels=lengthcount/(3*samplefac);var delta=~~(samplepixels/ncycles);var alpha=initalpha;var radius=initradius;var rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(i=0;i<rad;i++)radpower[i]=alpha*((rad*rad-i*i)*radbias/(rad*rad));var step;if(lengthcount<minpicturebytes){samplefac=1;step=3}else if(lengthcount%prime1!==0){step=3*prime1}else if(lengthcount%prime2!==0){step=3*prime2}else if(lengthcount%prime3!==0){step=3*prime3}else{step=3*prime4}var b,g,r,j;var pix=0;i=0;while(i<samplepixels){b=(pixels[pix]&255)<<netbiasshift;g=(pixels[pix+1]&255)<<netbiasshift;r=(pixels[pix+2]&255)<<netbiasshift;j=contest(b,g,r);altersingle(alpha,j,b,g,r);if(rad!==0)alterneigh(rad,j,b,g,r);pix+=step;if(pix>=lengthcount)pix-=lengthcount;i++;if(delta===0)delta=1;if(i%delta===0){alpha-=alpha/alphadec;radius-=radius/radiusdec;rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(j=0;j<rad;j++)radpower[j]=alpha*((rad*rad-j*j)*radbias/(rad*rad))}}}function buildColormap(){init();learn();unbiasnet();inxbuild()}this.buildColormap=buildColormap;function getColormap(){var map=[];var index=[];for(var i=0;i<netsize;i++)index[network[i][3]]=i;var k=0;for(var l=0;l<netsize;l++){var j=index[l];map[k++]=network[j][0];map[k++]=network[j][1];map[k++]=network[j][2]}return map}this.getColormap=getColormap;this.lookupRGB=inxsearch}module.exports=NeuQuant},{}],4:[function(require,module,exports){var GIFEncoder,renderFrame;GIFEncoder=require("./GIFEncoder.js");renderFrame=function(frame){var encoder,page,stream,transfer;encoder=new GIFEncoder(frame.width,frame.height);if(frame.index===0){encoder.writeHeader()}else{encoder.firstFrame=false}encoder.setTransparent(frame.transparent);encoder.setRepeat(frame.repeat);encoder.setDelay(frame.delay);encoder.setQuality(frame.quality);encoder.setDither(frame.dither);encoder.setGlobalPalette(frame.globalPalette);encoder.addFrame(frame.data);if(frame.last){encoder.finish()}if(frame.globalPalette===true){frame.globalPalette=encoder.getGlobalPalette()}stream=encoder.stream();frame.data=stream.pages;frame.cursor=stream.cursor;frame.pageSize=stream.constructor.pageSize;if(frame.canTransfer){transfer=function(){var i,len,ref,results;ref=frame.data;results=[];for(i=0,len=ref.length;i<len;i++){page=ref[i];results.push(page.buffer)}return results}();return self.postMessage(frame,transfer)}else{return self.postMessage(frame)}};self.onmessage=function(event){return renderFrame(event.data)}},{"./GIFEncoder.js":1}]},{},[4]);`;

// ../../node_modules/.deno/gif-build-worker-js@1.0.2/node_modules/gif-build-worker-js/dist/index.js
var transformToUrl = function() {
  var gifWorker2Blob = new Blob([GifWorker], { type: "application/javascript" });
  var workerScript = URL.createObjectURL(gifWorker2Blob);
  return workerScript;
};
var GifWorker = gif_worker_default;

// ../../node_modules/.deno/super-image-cropper@1.0.22/node_modules/super-image-cropper/dist/lib/synthetic-gif.js
var import_gif2 = __toESM(require_gif2());
var SyntheticGIF = (
  /** @class */
  function() {
    function SyntheticGIF2(_a) {
      var frames = _a.frames, commonCropOptions = _a.commonCropOptions, frameDelays = _a.frameDelays, _b = _a.gifJsOptions, gifJsOptions = _b === void 0 ? {} : _b, outputType = _a.outputType;
      Object.defineProperty(this, "cropperJsOpts", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "frames", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "frameDelays", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "gifJsOptions", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "outputType", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      this.cropperJsOpts = commonCropOptions.cropperJsOpts;
      this.frames = frames;
      this.frameDelays = frameDelays;
      this.gifJsOptions = gifJsOptions;
      this.outputType = outputType;
    }
    Object.defineProperty(SyntheticGIF2.prototype, "bootstrap", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var _this = this;
        return new Promise(function(resolve2, reject2) {
          var gifWorkerUrl = transformToUrl();
          var gifOptions = Object.assign({
            workers: 2,
            quality: 10,
            workerScript: gifWorkerUrl,
            width: _this.cropperJsOpts.width,
            height: _this.cropperJsOpts.height,
            transparent: "transparent"
          }, _this.gifJsOptions || {});
          var gif = new import_gif2.default(gifOptions);
          gif.on("finished", function(blob) {
            if (_this.outputType === OutputType.BLOB) {
              resolve2(blob);
            } else if (_this.outputType === OutputType.BASE64) {
              resolve2(_this.convertBlob2Base64(blob));
            } else {
              var blobUrl = window.URL.createObjectURL(blob);
              resolve2(blobUrl);
            }
          });
          _this.frames.forEach(function(frame, idx) {
            gif.addFrame(frame, { delay: _this.frameDelays[idx], copy: true });
          });
          gif.render();
        });
      }
    });
    Object.defineProperty(SyntheticGIF2.prototype, "convertBlob2Base64", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(blob) {
        return new Promise(function(resolve2, reject2) {
          var reader = new FileReader();
          reader.onload = function(event) {
            var _a;
            resolve2((_a = event === null || event === void 0 ? void 0 : event.target) === null || _a === void 0 ? void 0 : _a.result);
          };
          reader.onerror = function(e) {
            reject2(e);
          };
          reader.readAsDataURL(blob);
        });
      }
    });
    return SyntheticGIF2;
  }()
);

// ../../node_modules/.deno/super-image-cropper@1.0.22/node_modules/super-image-cropper/dist/lib/cropper.js
var __awaiter2 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject2) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject2(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject2(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator2 = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var FrameCropper = (
  /** @class */
  function() {
    function FrameCropper2(props) {
      Object.defineProperty(this, "frames", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "parsedFrames", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "commonCropOptions", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "convertorCanvas", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "containerCanvas", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "convertCtx", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "containerCtx", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "cropperJsOpts", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "offsetX", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 0
      });
      Object.defineProperty(this, "offsetY", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 0
      });
      Object.defineProperty(this, "containerCenterX", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 0
      });
      Object.defineProperty(this, "containerCenterY", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 0
      });
      Object.defineProperty(this, "resultFrames", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: []
      });
      this.init(props);
    }
    Object.defineProperty(FrameCropper2.prototype, "init", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(_a) {
        var commonCropOptions = _a.commonCropOptions;
        this.commonCropOptions = commonCropOptions;
        this.cropperJsOpts = commonCropOptions.cropperJsOpts;
        this.resultFrames = [];
        if (!this.containerCanvas || !this.convertorCanvas) {
          this.setupCanvas();
        }
        this.setCanvasWH();
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "cropGif", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(parsedFrameInfo) {
        var _a, _b;
        return __awaiter2(this, void 0, void 0, function() {
          var frames, parsedFrames, frameIdx, currentFrame, currentFrameParseInfo, imageData;
          return __generator2(this, function(_c) {
            frames = parsedFrameInfo.frames, parsedFrames = parsedFrameInfo.parsedFrames;
            this.frames = frames;
            this.parsedFrames = parsedFrames;
            frameIdx = 0;
            while (frameIdx < this.frames.length) {
              currentFrame = this.frames[frameIdx];
              currentFrameParseInfo = this.parsedFrames[frameIdx];
              if (currentFrameParseInfo.disposalType !== 1) {
                this.containerCtx.clearRect(0, 0, this.containerCanvas.width, this.containerCanvas.height);
              }
              if (this.containerCtx.globalCompositeOperation && ((_a = this.cropperJsOpts) === null || _a === void 0 ? void 0 : _a.background)) {
                this.containerCtx.fillStyle = ((_b = this.cropperJsOpts) === null || _b === void 0 ? void 0 : _b.background) || "";
                this.containerCtx.globalCompositeOperation = "destination-over";
                this.containerCtx.fillRect(0, 0, this.containerCanvas.width, this.containerCanvas.height);
                this.containerCtx.globalCompositeOperation = "source-over";
              }
              if (!currentFrame)
                continue;
              imageData = this.transformFrame(this.drawImgDataToCanvas(currentFrame, frameIdx));
              this.resultFrames.push(imageData);
              this.ifDebugRun(imageData, frameIdx);
              frameIdx++;
            }
            return [2, this.resultFrames];
          });
        });
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "cropStaticImage", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(canvasImageContainer) {
        return this.transformFrame(canvasImageContainer);
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "transformFrame", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(canvasImageContainer) {
        this.containerCtx.save();
        this.containerCtx.translate(this.containerCenterX, this.containerCenterY);
        this.containerCtx.rotate(this.cropperJsOpts.rotate * Math.PI / 180);
        this.containerCtx.scale(this.cropperJsOpts.scaleX, this.cropperJsOpts.scaleY);
        this.containerCtx.drawImage(canvasImageContainer, -this.convertorCanvas.width / 2, -this.convertorCanvas.height / 2);
        this.containerCtx.restore();
        var moveCropBoxDirection = this.commonCropOptions.withoutCropperJs ? -1 : 1;
        var imageData = this.containerCtx.getImageData(moveCropBoxDirection * this.cropperJsOpts.x + this.offsetX, moveCropBoxDirection * this.cropperJsOpts.y + this.offsetY, this.cropperJsOpts.width, this.cropperJsOpts.height);
        return imageData;
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "drawImgDataToCanvas", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(frame, index) {
        var _a;
        var dims = (_a = this.parsedFrames[index]) === null || _a === void 0 ? void 0 : _a.dims;
        this.convertCtx.clearRect(0, 0, this.convertorCanvas.width, this.convertorCanvas.height);
        this.convertCtx.putImageData(frame, dims.left, dims.top);
        return this.convertorCanvas;
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "ifDebugRun", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(imageData, index) {
        var isDebug = location.search.includes("isCropDebug=true");
        isDebug && index && this.renderEachFrame(imageData, index);
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "renderEachFrame", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(frame, index) {
        var _a;
        var dims = (_a = this.parsedFrames[index]) === null || _a === void 0 ? void 0 : _a.dims;
        var eachCanvas = document.createElement("canvas");
        eachCanvas.width = this.convertorCanvas.width;
        eachCanvas.height = this.convertorCanvas.height;
        var ctx = eachCanvas.getContext("2d");
        if (!ctx)
          return;
        ctx === null || ctx === void 0 ? void 0 : ctx.putImageData(frame, dims.left, dims.top);
        ctx.fillStyle = "red";
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 5;
        ctx.save();
        ctx.beginPath();
        ctx.font = "70px orbitron";
        ctx.fillText(String(index), 10, 50);
        ctx.restore();
        ctx.closePath();
        document.body.appendChild(eachCanvas);
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "setupCanvas", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var containerCanvas = this.containerCanvas = document.createElement("canvas");
        var convertorCanvas = this.convertorCanvas = document.createElement("canvas");
        containerCanvas.className = "containerCanvas";
        convertorCanvas.className = "convertorCanvas";
        containerCanvas.style.display = "none";
        convertorCanvas.style.display = "none";
        var containerCtx = containerCanvas.getContext("2d");
        var convertCtx = convertorCanvas.getContext("2d");
        containerCtx && (this.containerCtx = containerCtx);
        convertCtx && (this.convertCtx = convertCtx);
        document.body.appendChild(convertorCanvas);
        document.body.appendChild(containerCanvas);
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "setCanvasWH", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var radian = Math.PI / 180 * this.cropperJsOpts.rotate;
        var imageData = this.commonCropOptions.imageData;
        var rotatedBoxWidth = imageData.naturalWidth;
        var rotatedBoxHeight = imageData.naturalHeight;
        this.offsetX = -Math.min(this.cropperJsOpts.x, 0);
        this.offsetY = -Math.min(this.cropperJsOpts.y, 0);
        this.containerCenterX = this.offsetX + rotatedBoxWidth / 2;
        this.containerCenterY = this.offsetY + rotatedBoxHeight / 2;
        this.containerCanvas.width = Math.max(this.offsetX + rotatedBoxWidth, this.offsetX + this.cropperJsOpts.width, this.cropperJsOpts.x + this.cropperJsOpts.width);
        this.containerCanvas.height = Math.max(this.offsetY + rotatedBoxHeight, this.offsetY + this.cropperJsOpts.height, this.cropperJsOpts.y + this.cropperJsOpts.height);
        this.convertorCanvas.width = imageData.naturalWidth;
        this.convertorCanvas.height = imageData.naturalHeight;
        this.containerCtx.clearRect(0, 0, this.containerCanvas.width, this.containerCanvas.height);
        this.convertCtx.clearRect(0, 0, this.convertorCanvas.width, this.convertorCanvas.height);
      }
    });
    Object.defineProperty(FrameCropper2.prototype, "frameToImgData", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(ctx, frame) {
        if (!ctx)
          return;
        var totalPixels = frame.pixels.length;
        var imgData = ctx.createImageData(frame.dims.width, frame.dims.height);
        var patchData = imgData.data;
        for (var i = 0; i < totalPixels; i++) {
          var pos = i * 4;
          var colorIndex = frame.pixels[i];
          var color = frame.colorTable[colorIndex];
          patchData[pos] = color[0];
          patchData[pos + 1] = color[1];
          patchData[pos + 2] = color[2];
          patchData[pos + 3] = colorIndex !== frame.transparentIndex ? 255 : 0;
        }
        return imgData;
      }
    });
    return FrameCropper2;
  }()
);

// ../../node_modules/.deno/super-image-cropper@1.0.22/node_modules/super-image-cropper/dist/lib/helper.js
var import_image_type = __toESM(require_image_type());
var __awaiter3 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject2) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject2(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject2(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator3 = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var getImageInfo = function(params) {
  return __awaiter3(void 0, void 0, void 0, function() {
    var _a, src, imageInstance;
    return __generator3(this, function(_b) {
      switch (_b.label) {
        case 0:
          _a = params.src, src = _a === void 0 ? "" : _a;
          if (!src)
            return [2, {
              width: 0,
              height: 0,
              naturalWidth: 0,
              naturalHeight: 0
            }];
          return [4, loadImage(params)];
        case 1:
          imageInstance = _b.sent().imageInstance;
          return [2, {
            width: imageInstance.width,
            height: imageInstance.height,
            naturalWidth: imageInstance.naturalWidth,
            naturalHeight: imageInstance.naturalHeight
          }];
      }
    });
  });
};
var getImageType = function(imageBufferData) {
  return __awaiter3(void 0, void 0, void 0, function() {
    var imageTypeInfo;
    return __generator3(this, function(_a) {
      imageTypeInfo = (0, import_image_type.default)(new Uint8Array(imageBufferData));
      return [2, imageTypeInfo];
    });
  });
};
var loadImage = function(params) {
  var _a = params.src, src = _a === void 0 ? "" : _a, crossOrigin = params.crossOrigin;
  return new Promise(function(resolve2, reject2) {
    var image = new Image();
    if (typeof crossOrigin !== "undefined") {
      image.crossOrigin = crossOrigin;
    }
    image.onload = function(data) {
      return __awaiter3(void 0, void 0, void 0, function() {
        var _a2, _b;
        var _c;
        return __generator3(this, function(_d) {
          switch (_d.label) {
            case 0:
              _a2 = resolve2;
              _c = {
                imageInstance: image,
                data
              };
              _b = getImageType;
              return [4, transformImageData2ArrayBuffer(image)];
            case 1:
              return [4, _b.apply(void 0, [_d.sent()])];
            case 2:
              _a2.apply(void 0, [(_c.imageType = _d.sent(), _c)]);
              return [
                2
                /*return*/
              ];
          }
        });
      });
    };
    image.src = src;
    image.onerror = reject2;
  });
};
var transformImageData2ArrayBuffer = function(image) {
  var canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  var ctx = canvas.getContext("2d");
  ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, 0, 0);
  var dataUrl = canvas.toDataURL();
  var base64Data = dataUrl.split(",")[1];
  var binaryData = atob(base64Data);
  var len = binaryData.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  return bytes.buffer;
};

// ../../node_modules/.deno/super-image-cropper@1.0.22/node_modules/super-image-cropper/dist/index.js
var __awaiter4 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject2) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject2(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject2(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator4 = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var OutputType;
(function(OutputType2) {
  OutputType2["BASE64"] = "base64";
  OutputType2["BLOB"] = "blob";
  OutputType2["BLOB_URL"] = "blobURL";
})(OutputType || (OutputType = {}));
var SuperImageCropper = (
  /** @class */
  function() {
    function SuperImageCropper2() {
      Object.defineProperty(this, "cropperJsInstance", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "imageInstance", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "preImageSrc", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: ""
      });
      Object.defineProperty(this, "parsedFrameInfo", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "commonCropOptions", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "frameCropperInstance", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "inputCropperOptions", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0
      });
      Object.defineProperty(this, "imageTypeInfo", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: null
      });
    }
    Object.defineProperty(SuperImageCropper2.prototype, "crop", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(inputCropperOptions) {
        var _a;
        return __awaiter4(this, void 0, void 0, function() {
          var checkResult, resultFrames;
          return __generator4(this, function(_b) {
            switch (_b.label) {
              case 0:
                this.userInputValidator(inputCropperOptions);
                this.inputCropperOptions = this.cleanUserInput(inputCropperOptions);
                return [4, this.init()];
              case 1:
                _b.sent();
                return [4, this.decodeGIF()];
              case 2:
                _b.sent();
                return [4, this.checkIsStaticImage()];
              case 3:
                checkResult = _b.sent();
                if (!checkResult.isStatic) return [3, 4];
                return [2, this.handleStaticImage(checkResult.imageInfo.imageInstance)];
              case 4:
                return [4, this.cropFrames()];
              case 5:
                resultFrames = _b.sent();
                return [2, this.saveGif(resultFrames, ((_a = this.parsedFrameInfo) === null || _a === void 0 ? void 0 : _a.delays) || [])];
            }
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "init", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var _a, _b, _c;
        return __awaiter4(this, void 0, void 0, function() {
          var defaultOptions, targetConfig, imageData, _d;
          return __generator4(this, function(_e) {
            switch (_e.label) {
              case 0:
                this.cropperJsInstance = this.inputCropperOptions.cropperInstance;
                defaultOptions = {
                  width: 100,
                  height: 100,
                  scaleX: 1,
                  scaleY: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  left: 0,
                  top: 0
                };
                targetConfig = Object.assign(defaultOptions, this.inputCropperOptions.cropperJsOpts || {}, ((_a = this.cropperJsInstance) === null || _a === void 0 ? void 0 : _a.getData()) || {});
                _d = (_b = this.cropperJsInstance) === null || _b === void 0 ? void 0 : _b.getImageData();
                if (_d) return [3, 2];
                return [4, getImageInfo({
                  src: this.inputCropperOptions.src,
                  crossOrigin: this.inputCropperOptions.crossOrigin
                })];
              case 1:
                _d = _e.sent();
                _e.label = 2;
              case 2:
                imageData = _d || {};
                this.commonCropOptions = {
                  cropperJsOpts: this.imageDataFormat(targetConfig, imageData),
                  imageData,
                  cropBoxData: ((_c = this.cropperJsInstance) === null || _c === void 0 ? void 0 : _c.getCropBoxData()) || targetConfig,
                  withoutCropperJs: !this.cropperJsInstance
                };
                this.commonCropOptions.cropperJsOpts.rotate = this.normalizeRotate(this.commonCropOptions.cropperJsOpts.rotate);
                return [
                  2
                  /*return*/
                ];
            }
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "cleanUserInput", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(cropperOptions) {
        var cropperInstance = cropperOptions.cropperInstance;
        if (cropperInstance) {
          delete cropperOptions["cropperJsOpts"];
          delete cropperOptions["src"];
        }
        return cropperOptions;
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "userInputValidator", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(cropperOptions) {
        var cropperInstance = cropperOptions.cropperInstance, cropperJsOpts = cropperOptions.cropperJsOpts, src = cropperOptions.src;
        if (!cropperInstance) {
          if (!cropperJsOpts) {
            throw new Error("If cropperInstance is not specified, cropperJsOpts must be specified.");
          } else if (!src) {
            throw new Error("If cropperInstance is not specified, src must be specified.");
          }
        }
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "normalizeRotate", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(rotation) {
        return rotation < 0 ? 360 + rotation % 360 : rotation;
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "imageDataFormat", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(targetConfig, imageData) {
        targetConfig.left = targetConfig.x;
        targetConfig.top = targetConfig.y;
        targetConfig.width = targetConfig.width || imageData.naturalWidth;
        targetConfig.height = targetConfig.height || imageData.naturalHeight;
        return targetConfig;
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "createCropperInstance", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(options) {
        var _this = this;
        return new Promise(function(resolve2, reject2) {
          var _a, _b;
          if (!options.src) {
            throw new Error("Option src must be specified.");
          }
          var img = document.createElement("img");
          img.src = options.src;
          if (_this.imageInstance) {
            document.body.removeChild(_this.imageInstance);
            (_a = _this.cropperJsInstance) === null || _a === void 0 ? void 0 : _a.destroy();
          }
          _this.imageInstance = document.createElement("img");
          _this.imageInstance.src = options.src;
          _this.imageInstance.style.display = "none";
          document.body.append(_this.imageInstance);
          if (_this.preImageSrc !== options.src) {
            _this.preImageSrc = options.src;
            _this.imageInstance.src = options.src;
          }
          var newInstance = new Cropper(_this.imageInstance, {
            viewMode: 1,
            background: !!((_b = options.cropperJsOpts) === null || _b === void 0 ? void 0 : _b.background),
            data: options.cropperJsOpts,
            autoCrop: true
          });
          _this.imageInstance.addEventListener("ready", function() {
            var _a2;
            if (newInstance.cropper) {
              newInstance.cropper.style.display = "none";
              if (((_a2 = options.cropperJsOpts) === null || _a2 === void 0 ? void 0 : _a2.width) && _this.imageInstance) {
                _this.imageInstance.style.width = options.cropperJsOpts.width + "px";
              }
              resolve2(newInstance);
            }
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "decodeGIF", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var _a;
        return __awaiter4(this, void 0, void 0, function() {
          var decoder, parsedFrameInfo;
          return __generator4(this, function(_b) {
            switch (_b.label) {
              case 0:
                decoder = new Decoder(this.inputCropperOptions.src || ((_a = this.cropperJsInstance) === null || _a === void 0 ? void 0 : _a.url) || "");
                return [4, decoder.decompressFrames()];
              case 1:
                parsedFrameInfo = _b.sent();
                this.parsedFrameInfo = parsedFrameInfo;
                return [
                  2
                  /*return*/
                ];
            }
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "ensureFrameCropperExist", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        if (!this.frameCropperInstance) {
          this.frameCropperInstance = new FrameCropper({
            commonCropOptions: this.commonCropOptions
          });
        }
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "cropFrames", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        return __awaiter4(this, void 0, void 0, function() {
          return __generator4(this, function(_a) {
            this.ensureFrameCropperExist();
            this.frameCropperInstance.init({
              commonCropOptions: this.commonCropOptions
            });
            return [2, this.frameCropperInstance.cropGif(this.parsedFrameInfo)];
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "saveGif", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(resultFrames, frameDelays) {
        return __awaiter4(this, void 0, void 0, function() {
          var syntheticGIF;
          return __generator4(this, function(_a) {
            syntheticGIF = new SyntheticGIF({
              frames: resultFrames,
              commonCropOptions: this.commonCropOptions,
              frameDelays,
              gifJsOptions: this.inputCropperOptions.gifJsOptions,
              outputType: this.inputCropperOptions.outputType
            });
            return [2, syntheticGIF.bootstrap()];
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "checkIsStaticImage", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function() {
        var _a, _b, _c, _d;
        return __awaiter4(this, void 0, void 0, function() {
          var url, imageInfo;
          return __generator4(this, function(_e) {
            switch (_e.label) {
              case 0:
                url = (_b = (_a = this.cropperJsInstance) === null || _a === void 0 ? void 0 : _a.url) !== null && _b !== void 0 ? _b : (_c = this.inputCropperOptions) === null || _c === void 0 ? void 0 : _c.src;
                return [4, loadImage({
                  src: url,
                  crossOrigin: this.inputCropperOptions.crossOrigin
                })];
              case 1:
                imageInfo = _e.sent();
                return [2, {
                  isStatic: ((_d = imageInfo === null || imageInfo === void 0 ? void 0 : imageInfo.imageType) === null || _d === void 0 ? void 0 : _d.mime) !== "image/gif",
                  imageInfo
                }];
            }
          });
        });
      }
    });
    Object.defineProperty(SuperImageCropper2.prototype, "handleStaticImage", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(imageInstance) {
        return __awaiter4(this, void 0, void 0, function() {
          var canvas, ctx, croppedImageData;
          var _this = this;
          return __generator4(this, function(_a) {
            switch (_a.label) {
              case 0:
                canvas = document.createElement("canvas");
                ctx = canvas.getContext("2d");
                canvas.width = imageInstance.width;
                canvas.height = imageInstance.height;
                ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(imageInstance, 0, 0);
                this.ensureFrameCropperExist();
                this.frameCropperInstance.init({
                  commonCropOptions: this.commonCropOptions
                });
                return [4, this.frameCropperInstance.cropStaticImage(canvas)];
              case 1:
                croppedImageData = _a.sent();
                ctx === null || ctx === void 0 ? void 0 : ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = croppedImageData.width;
                canvas.height = croppedImageData.height;
                ctx === null || ctx === void 0 ? void 0 : ctx.putImageData(croppedImageData, 0, 0);
                return [2, new Promise(function(resolve2, reject2) {
                  var _a2, _b;
                  var _c = _this.inputCropperOptions.outputType, outputType = _c === void 0 ? OutputType.BLOB_URL : _c;
                  if (outputType === OutputType.BASE64) {
                    resolve2(canvas.toDataURL((_a2 = _this.imageTypeInfo) === null || _a2 === void 0 ? void 0 : _a2.mime));
                  } else {
                    canvas.toBlob(function(blob) {
                      if (!blob)
                        return reject2(null);
                      if (outputType === OutputType.BLOB) {
                        resolve2(blob);
                      } else {
                        var blobUrl = window.URL.createObjectURL(blob);
                        resolve2(blobUrl);
                      }
                    }, (_b = _this.imageTypeInfo) === null || _b === void 0 ? void 0 : _b.mime);
                  }
                })];
            }
          });
        });
      }
    });
    return SuperImageCropper2;
  }()
);
export {
  OutputType,
  SuperImageCropper
};
//# sourceMappingURL=super-image-cropper.js.map
