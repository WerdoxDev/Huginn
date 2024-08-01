var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) =>
   function __init() {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res;
   };
var __commonJS = (cb, mod) =>
   function __require() {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
   };
var __export = (target, all) => {
   for (var name2 in all) __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from3, except, desc) => {
   if ((from3 && typeof from3 === "object") || typeof from3 === "function") {
      for (let key of __getOwnPropNames(from3))
         if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from3[key], enumerable: !(desc = __getOwnPropDesc(from3, key)) || desc.enumerable });
   }
   return to;
};
var __toESM = (mod, isNodeMode, target) => (
   (target = mod != null ? __create(__getProtoOf(mod)) : {}),
   __copyProps(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod,
   )
);

// .wrangler/tmp/bundle-9HH9g4/checked-fetch.js
function checkURL(request2, init3) {
   const url =
      request2 instanceof URL ? request2 : new URL((typeof request2 === "string" ? new Request(request2, init3) : request2).url);
   if (url.port && url.port !== "443" && url.protocol === "https:") {
      if (!urls.has(url.toString())) {
         urls.add(url.toString());
         console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`,
         );
      }
   }
}
var urls;
var init_checked_fetch = __esm({
   ".wrangler/tmp/bundle-9HH9g4/checked-fetch.js"() {
      "use strict";
      urls = /* @__PURE__ */ new Set();
      globalThis.fetch = new Proxy(globalThis.fetch, {
         apply(target, thisArg, argArray) {
            const [request2, init3] = argArray;
            checkURL(request2, init3);
            return Reflect.apply(target, thisArg, argArray);
         },
      });
   },
});

// ../../node_modules/@esbuild-plugins/node-globals-polyfill/process.js
function defaultSetTimout() {
   throw new Error("setTimeout has not been defined");
}
function defaultClearTimeout() {
   throw new Error("clearTimeout has not been defined");
}
function runTimeout(fun) {
   if (cachedSetTimeout === setTimeout) {
      return setTimeout(fun, 0);
   }
   if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
      cachedSetTimeout = setTimeout;
      return setTimeout(fun, 0);
   }
   try {
      return cachedSetTimeout(fun, 0);
   } catch (e) {
      try {
         return cachedSetTimeout.call(null, fun, 0);
      } catch (e2) {
         return cachedSetTimeout.call(this, fun, 0);
      }
   }
}
function runClearTimeout(marker) {
   if (cachedClearTimeout === clearTimeout) {
      return clearTimeout(marker);
   }
   if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
      cachedClearTimeout = clearTimeout;
      return clearTimeout(marker);
   }
   try {
      return cachedClearTimeout(marker);
   } catch (e) {
      try {
         return cachedClearTimeout.call(null, marker);
      } catch (e2) {
         return cachedClearTimeout.call(this, marker);
      }
   }
}
function cleanUpNextTick() {
   if (!draining || !currentQueue) {
      return;
   }
   draining = false;
   if (currentQueue.length) {
      queue = currentQueue.concat(queue);
   } else {
      queueIndex = -1;
   }
   if (queue.length) {
      drainQueue();
   }
}
function drainQueue() {
   if (draining) {
      return;
   }
   var timeout = runTimeout(cleanUpNextTick);
   draining = true;
   var len = queue.length;
   while (len) {
      currentQueue = queue;
      queue = [];
      while (++queueIndex < len) {
         if (currentQueue) {
            currentQueue[queueIndex].run();
         }
      }
      queueIndex = -1;
      len = queue.length;
   }
   currentQueue = null;
   draining = false;
   runClearTimeout(timeout);
}
function nextTick(fun) {
   var args = new Array(arguments.length - 1);
   if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
         args[i - 1] = arguments[i];
      }
   }
   queue.push(new Item(fun, args));
   if (queue.length === 1 && !draining) {
      runTimeout(drainQueue);
   }
}
function Item(fun, array) {
   this.fun = fun;
   this.array = array;
}
function noop() {}
function binding(name2) {
   throw new Error("process.binding is not supported");
}
function cwd() {
   return "/";
}
function chdir(dir) {
   throw new Error("process.chdir is not supported");
}
function umask() {
   return 0;
}
function hrtime(previousTimestamp) {
   var clocktime = performanceNow.call(performance) * 1e-3;
   var seconds = Math.floor(clocktime);
   var nanoseconds = Math.floor((clocktime % 1) * 1e9);
   if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      if (nanoseconds < 0) {
         seconds--;
         nanoseconds += 1e9;
      }
   }
   return [seconds, nanoseconds];
}
function uptime() {
   var currentTime = /* @__PURE__ */ new Date();
   var dif = currentTime - startTime;
   return dif / 1e3;
}
var cachedSetTimeout,
   cachedClearTimeout,
   queue,
   draining,
   currentQueue,
   queueIndex,
   title,
   platform,
   browser,
   env,
   argv,
   version,
   versions,
   release,
   config,
   on,
   addListener,
   once,
   off,
   removeListener,
   removeAllListeners,
   emit,
   performance,
   performanceNow,
   startTime,
   process,
   defines;
var init_process = __esm({
   "../../node_modules/@esbuild-plugins/node-globals-polyfill/process.js"() {
      cachedSetTimeout = defaultSetTimout;
      cachedClearTimeout = defaultClearTimeout;
      if (typeof globalThis.setTimeout === "function") {
         cachedSetTimeout = setTimeout;
      }
      if (typeof globalThis.clearTimeout === "function") {
         cachedClearTimeout = clearTimeout;
      }
      queue = [];
      draining = false;
      queueIndex = -1;
      Item.prototype.run = function () {
         this.fun.apply(null, this.array);
      };
      title = "browser";
      platform = "browser";
      browser = true;
      env = {};
      argv = [];
      version = "";
      versions = {};
      release = {};
      config = {};
      on = noop;
      addListener = noop;
      once = noop;
      off = noop;
      removeListener = noop;
      removeAllListeners = noop;
      emit = noop;
      performance = globalThis.performance || {};
      performanceNow =
         performance.now ||
         performance.mozNow ||
         performance.msNow ||
         performance.oNow ||
         performance.webkitNow ||
         function () {
            return /* @__PURE__ */ new Date().getTime();
         };
      startTime = /* @__PURE__ */ new Date();
      process = {
         nextTick,
         title,
         browser,
         env,
         argv,
         version,
         versions,
         on,
         addListener,
         once,
         off,
         removeListener,
         removeAllListeners,
         emit,
         binding,
         cwd,
         chdir,
         umask,
         hrtime,
         platform,
         release,
         config,
         uptime,
      };
      defines = {};
      Object.keys(defines).forEach(key => {
         const segs = key.split(".");
         let target = process;
         for (let i = 0; i < segs.length; i++) {
            const seg = segs[i];
            if (i === segs.length - 1) {
               target[seg] = defines[key];
            } else {
               target = target[seg] || (target[seg] = {});
            }
         }
      });
   },
});

// ../../node_modules/@esbuild-plugins/node-globals-polyfill/Buffer.js
function init() {
   inited = true;
   var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
   for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
   }
   revLookup["-".charCodeAt(0)] = 62;
   revLookup["_".charCodeAt(0)] = 63;
}
function base64toByteArray(b64) {
   if (!inited) {
      init();
   }
   var i, j, l, tmp, placeHolders, arr;
   var len = b64.length;
   if (len % 4 > 0) {
      throw new Error("Invalid string. Length must be a multiple of 4");
   }
   placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
   arr = new Arr((len * 3) / 4 - placeHolders);
   l = placeHolders > 0 ? len - 4 : len;
   var L = 0;
   for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp =
         (revLookup[b64.charCodeAt(i)] << 18) |
         (revLookup[b64.charCodeAt(i + 1)] << 12) |
         (revLookup[b64.charCodeAt(i + 2)] << 6) |
         revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 255;
      arr[L++] = (tmp >> 8) & 255;
      arr[L++] = tmp & 255;
   }
   if (placeHolders === 2) {
      tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 255;
   } else if (placeHolders === 1) {
      tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 255;
      arr[L++] = tmp & 255;
   }
   return arr;
}
function tripletToBase64(num) {
   return lookup[(num >> 18) & 63] + lookup[(num >> 12) & 63] + lookup[(num >> 6) & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
   var tmp;
   var output = [];
   for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase64(tmp));
   }
   return output.join("");
}
function base64fromByteArray(uint8) {
   if (!inited) {
      init();
   }
   var tmp;
   var len = uint8.length;
   var extraBytes = len % 3;
   var output = "";
   var parts = [];
   var maxChunkLength = 16383;
   for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
   }
   if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[(tmp << 4) & 63];
      output += "==";
   } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup[tmp >> 10];
      output += lookup[(tmp >> 4) & 63];
      output += lookup[(tmp << 2) & 63];
      output += "=";
   }
   parts.push(output);
   return parts.join("");
}
function kMaxLength() {
   return Buffer2.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function createBuffer(that, length) {
   if (kMaxLength() < length) {
      throw new RangeError("Invalid typed array length");
   }
   if (Buffer2.TYPED_ARRAY_SUPPORT) {
      that = new Uint8Array(length);
      that.__proto__ = Buffer2.prototype;
   } else {
      if (that === null) {
         that = new Buffer2(length);
      }
      that.length = length;
   }
   return that;
}
function Buffer2(arg, encodingOrOffset, length) {
   if (!Buffer2.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer2)) {
      return new Buffer2(arg, encodingOrOffset, length);
   }
   if (typeof arg === "number") {
      if (typeof encodingOrOffset === "string") {
         throw new Error("If encoding is specified then the first argument must be a string");
      }
      return allocUnsafe(this, arg);
   }
   return from(this, arg, encodingOrOffset, length);
}
function from(that, value, encodingOrOffset, length) {
   if (typeof value === "number") {
      throw new TypeError('"value" argument must not be a number');
   }
   if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length);
   }
   if (typeof value === "string") {
      return fromString(that, value, encodingOrOffset);
   }
   return fromObject(that, value);
}
function assertSize(size) {
   if (typeof size !== "number") {
      throw new TypeError('"size" argument must be a number');
   } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
   }
}
function alloc(that, size, fill3, encoding) {
   assertSize(size);
   if (size <= 0) {
      return createBuffer(that, size);
   }
   if (fill3 !== void 0) {
      return typeof encoding === "string" ? createBuffer(that, size).fill(fill3, encoding) : createBuffer(that, size).fill(fill3);
   }
   return createBuffer(that, size);
}
function allocUnsafe(that, size) {
   assertSize(size);
   that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
   if (!Buffer2.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
         that[i] = 0;
      }
   }
   return that;
}
function fromString(that, string, encoding) {
   if (typeof encoding !== "string" || encoding === "") {
      encoding = "utf8";
   }
   if (!Buffer2.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
   }
   var length = byteLength(string, encoding) | 0;
   that = createBuffer(that, length);
   var actual = that.write(string, encoding);
   if (actual !== length) {
      that = that.slice(0, actual);
   }
   return that;
}
function fromArrayLike(that, array) {
   var length = array.length < 0 ? 0 : checked(array.length) | 0;
   that = createBuffer(that, length);
   for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
   }
   return that;
}
function fromArrayBuffer(that, array, byteOffset, length) {
   array.byteLength;
   if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError("'offset' is out of bounds");
   }
   if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError("'length' is out of bounds");
   }
   if (byteOffset === void 0 && length === void 0) {
      array = new Uint8Array(array);
   } else if (length === void 0) {
      array = new Uint8Array(array, byteOffset);
   } else {
      array = new Uint8Array(array, byteOffset, length);
   }
   if (Buffer2.TYPED_ARRAY_SUPPORT) {
      that = array;
      that.__proto__ = Buffer2.prototype;
   } else {
      that = fromArrayLike(that, array);
   }
   return that;
}
function fromObject(that, obj) {
   if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);
      if (that.length === 0) {
         return that;
      }
      obj.copy(that, 0, 0, len);
      return that;
   }
   if (obj) {
      if ((typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer) || "length" in obj) {
         if (typeof obj.length !== "number" || isnan(obj.length)) {
            return createBuffer(that, 0);
         }
         return fromArrayLike(that, obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
         return fromArrayLike(that, obj.data);
      }
   }
   throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
}
function checked(length) {
   if (length >= kMaxLength()) {
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
   }
   return length | 0;
}
function internalIsBuffer(b) {
   return !!(b != null && b._isBuffer);
}
function byteLength(string, encoding) {
   if (internalIsBuffer(string)) {
      return string.length;
   }
   if (
      typeof ArrayBuffer !== "undefined" &&
      typeof ArrayBuffer.isView === "function" &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)
   ) {
      return string.byteLength;
   }
   if (typeof string !== "string") {
      string = "" + string;
   }
   var len = string.length;
   if (len === 0) return 0;
   var loweredCase = false;
   for (;;) {
      switch (encoding) {
         case "ascii":
         case "latin1":
         case "binary":
            return len;
         case "utf8":
         case "utf-8":
         case void 0:
            return utf8ToBytes(string).length;
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
            return len * 2;
         case "hex":
            return len >>> 1;
         case "base64":
            return base64ToBytes(string).length;
         default:
            if (loweredCase) return utf8ToBytes(string).length;
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
      }
   }
}
function slowToString(encoding, start, end) {
   var loweredCase = false;
   if (start === void 0 || start < 0) {
      start = 0;
   }
   if (start > this.length) {
      return "";
   }
   if (end === void 0 || end > this.length) {
      end = this.length;
   }
   if (end <= 0) {
      return "";
   }
   end >>>= 0;
   start >>>= 0;
   if (end <= start) {
      return "";
   }
   if (!encoding) encoding = "utf8";
   while (true) {
      switch (encoding) {
         case "hex":
            return hexSlice(this, start, end);
         case "utf8":
         case "utf-8":
            return utf8Slice(this, start, end);
         case "ascii":
            return asciiSlice(this, start, end);
         case "latin1":
         case "binary":
            return latin1Slice(this, start, end);
         case "base64":
            return base64Slice(this, start, end);
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
            return utf16leSlice(this, start, end);
         default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
      }
   }
}
function swap(b, n, m2) {
   var i = b[n];
   b[n] = b[m2];
   b[m2] = i;
}
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
   if (buffer.length === 0) return -1;
   if (typeof byteOffset === "string") {
      encoding = byteOffset;
      byteOffset = 0;
   } else if (byteOffset > 2147483647) {
      byteOffset = 2147483647;
   } else if (byteOffset < -2147483648) {
      byteOffset = -2147483648;
   }
   byteOffset = +byteOffset;
   if (isNaN(byteOffset)) {
      byteOffset = dir ? 0 : buffer.length - 1;
   }
   if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
   if (byteOffset >= buffer.length) {
      if (dir) return -1;
      else byteOffset = buffer.length - 1;
   } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1;
   }
   if (typeof val === "string") {
      val = Buffer2.from(val, encoding);
   }
   if (internalIsBuffer(val)) {
      if (val.length === 0) {
         return -1;
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
   } else if (typeof val === "number") {
      val = val & 255;
      if (Buffer2.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
         if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
         } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
         }
      }
      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
   }
   throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
   var indexSize = 1;
   var arrLength = arr.length;
   var valLength = val.length;
   if (encoding !== void 0) {
      encoding = String(encoding).toLowerCase();
      if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
         if (arr.length < 2 || val.length < 2) {
            return -1;
         }
         indexSize = 2;
         arrLength /= 2;
         valLength /= 2;
         byteOffset /= 2;
      }
   }
   function read2(buf, i2) {
      if (indexSize === 1) {
         return buf[i2];
      } else {
         return buf.readUInt16BE(i2 * indexSize);
      }
   }
   var i;
   if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
         if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
         } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
         }
      }
   } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
         var found = true;
         for (var j = 0; j < valLength; j++) {
            if (read2(arr, i + j) !== read2(val, j)) {
               found = false;
               break;
            }
         }
         if (found) return i;
      }
   }
   return -1;
}
function hexWrite(buf, string, offset, length) {
   offset = Number(offset) || 0;
   var remaining = buf.length - offset;
   if (!length) {
      length = remaining;
   } else {
      length = Number(length);
      if (length > remaining) {
         length = remaining;
      }
   }
   var strLen = string.length;
   if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
   if (length > strLen / 2) {
      length = strLen / 2;
   }
   for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
   }
   return i;
}
function utf8Write(buf, string, offset, length) {
   return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
   return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function latin1Write(buf, string, offset, length) {
   return asciiWrite(buf, string, offset, length);
}
function base64Write(buf, string, offset, length) {
   return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
   return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
function base64Slice(buf, start, end) {
   if (start === 0 && end === buf.length) {
      return base64fromByteArray(buf);
   } else {
      return base64fromByteArray(buf.slice(start, end));
   }
}
function utf8Slice(buf, start, end) {
   end = Math.min(buf.length, end);
   var res = [];
   var i = start;
   while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
      if (i + bytesPerSequence <= end) {
         var secondByte, thirdByte, fourthByte, tempCodePoint;
         switch (bytesPerSequence) {
            case 1:
               if (firstByte < 128) {
                  codePoint = firstByte;
               }
               break;
            case 2:
               secondByte = buf[i + 1];
               if ((secondByte & 192) === 128) {
                  tempCodePoint = ((firstByte & 31) << 6) | (secondByte & 63);
                  if (tempCodePoint > 127) {
                     codePoint = tempCodePoint;
                  }
               }
               break;
            case 3:
               secondByte = buf[i + 1];
               thirdByte = buf[i + 2];
               if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = ((firstByte & 15) << 12) | ((secondByte & 63) << 6) | (thirdByte & 63);
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                     codePoint = tempCodePoint;
                  }
               }
               break;
            case 4:
               secondByte = buf[i + 1];
               thirdByte = buf[i + 2];
               fourthByte = buf[i + 3];
               if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = ((firstByte & 15) << 18) | ((secondByte & 63) << 12) | ((thirdByte & 63) << 6) | (fourthByte & 63);
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                     codePoint = tempCodePoint;
                  }
               }
         }
      }
      if (codePoint === null) {
         codePoint = 65533;
         bytesPerSequence = 1;
      } else if (codePoint > 65535) {
         codePoint -= 65536;
         res.push(((codePoint >>> 10) & 1023) | 55296);
         codePoint = 56320 | (codePoint & 1023);
      }
      res.push(codePoint);
      i += bytesPerSequence;
   }
   return decodeCodePointsArray(res);
}
function decodeCodePointsArray(codePoints) {
   var len = codePoints.length;
   if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints);
   }
   var res = "";
   var i = 0;
   while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH)));
   }
   return res;
}
function asciiSlice(buf, start, end) {
   var ret = "";
   end = Math.min(buf.length, end);
   for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 127);
   }
   return ret;
}
function latin1Slice(buf, start, end) {
   var ret = "";
   end = Math.min(buf.length, end);
   for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
   }
   return ret;
}
function hexSlice(buf, start, end) {
   var len = buf.length;
   if (!start || start < 0) start = 0;
   if (!end || end < 0 || end > len) end = len;
   var out = "";
   for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
   }
   return out;
}
function utf16leSlice(buf, start, end) {
   var bytes = buf.slice(start, end);
   var res = "";
   for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
   }
   return res;
}
function checkOffset(offset, ext, length) {
   if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
   if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
}
function checkInt(buf, value, offset, ext, max, min) {
   if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
   if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
   if (offset + ext > buf.length) throw new RangeError("Index out of range");
}
function objectWriteUInt16(buf, value, offset, littleEndian) {
   if (value < 0) value = 65535 + value + 1;
   for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (255 << (8 * (littleEndian ? i : 1 - i)))) >>> ((littleEndian ? i : 1 - i) * 8);
   }
}
function objectWriteUInt32(buf, value, offset, littleEndian) {
   if (value < 0) value = 4294967295 + value + 1;
   for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> ((littleEndian ? i : 3 - i) * 8)) & 255;
   }
}
function checkIEEE754(buf, value, offset, ext, max, min) {
   if (offset + ext > buf.length) throw new RangeError("Index out of range");
   if (offset < 0) throw new RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
   if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
   }
   ieee754write(buf, value, offset, littleEndian, 23, 4);
   return offset + 4;
}
function writeDouble(buf, value, offset, littleEndian, noAssert) {
   if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
   }
   ieee754write(buf, value, offset, littleEndian, 52, 8);
   return offset + 8;
}
function base64clean(str) {
   str = stringtrim(str).replace(INVALID_BASE64_RE, "");
   if (str.length < 2) return "";
   while (str.length % 4 !== 0) {
      str = str + "=";
   }
   return str;
}
function stringtrim(str) {
   if (str.trim) return str.trim();
   return str.replace(/^\s+|\s+$/g, "");
}
function toHex(n) {
   if (n < 16) return "0" + n.toString(16);
   return n.toString(16);
}
function utf8ToBytes(string, units) {
   units = units || Infinity;
   var codePoint;
   var length = string.length;
   var leadSurrogate = null;
   var bytes = [];
   for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);
      if (codePoint > 55295 && codePoint < 57344) {
         if (!leadSurrogate) {
            if (codePoint > 56319) {
               if ((units -= 3) > -1) bytes.push(239, 191, 189);
               continue;
            } else if (i + 1 === length) {
               if ((units -= 3) > -1) bytes.push(239, 191, 189);
               continue;
            }
            leadSurrogate = codePoint;
            continue;
         }
         if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
         }
         codePoint = (((leadSurrogate - 55296) << 10) | (codePoint - 56320)) + 65536;
      } else if (leadSurrogate) {
         if ((units -= 3) > -1) bytes.push(239, 191, 189);
      }
      leadSurrogate = null;
      if (codePoint < 128) {
         if ((units -= 1) < 0) break;
         bytes.push(codePoint);
      } else if (codePoint < 2048) {
         if ((units -= 2) < 0) break;
         bytes.push((codePoint >> 6) | 192, (codePoint & 63) | 128);
      } else if (codePoint < 65536) {
         if ((units -= 3) < 0) break;
         bytes.push((codePoint >> 12) | 224, ((codePoint >> 6) & 63) | 128, (codePoint & 63) | 128);
      } else if (codePoint < 1114112) {
         if ((units -= 4) < 0) break;
         bytes.push((codePoint >> 18) | 240, ((codePoint >> 12) & 63) | 128, ((codePoint >> 6) & 63) | 128, (codePoint & 63) | 128);
      } else {
         throw new Error("Invalid code point");
      }
   }
   return bytes;
}
function asciiToBytes(str) {
   var byteArray = [];
   for (var i = 0; i < str.length; ++i) {
      byteArray.push(str.charCodeAt(i) & 255);
   }
   return byteArray;
}
function utf16leToBytes(str, units) {
   var c2, hi, lo;
   var byteArray = [];
   for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c2 = str.charCodeAt(i);
      hi = c2 >> 8;
      lo = c2 % 256;
      byteArray.push(lo);
      byteArray.push(hi);
   }
   return byteArray;
}
function base64ToBytes(str) {
   return base64toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
   for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
   }
   return i;
}
function isnan(val) {
   return val !== val;
}
function isBuffer(obj) {
   return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
}
function isFastBuffer(obj) {
   return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function isSlowBuffer(obj) {
   return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer(obj.slice(0, 0));
}
function ieee754read(buffer, offset, isLE, mLen, nBytes) {
   var e, m2;
   var eLen = nBytes * 8 - mLen - 1;
   var eMax = (1 << eLen) - 1;
   var eBias = eMax >> 1;
   var nBits = -7;
   var i = isLE ? nBytes - 1 : 0;
   var d = isLE ? -1 : 1;
   var s = buffer[offset + i];
   i += d;
   e = s & ((1 << -nBits) - 1);
   s >>= -nBits;
   nBits += eLen;
   for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
   m2 = e & ((1 << -nBits) - 1);
   e >>= -nBits;
   nBits += mLen;
   for (; nBits > 0; m2 = m2 * 256 + buffer[offset + i], i += d, nBits -= 8) {}
   if (e === 0) {
      e = 1 - eBias;
   } else if (e === eMax) {
      return m2 ? NaN : (s ? -1 : 1) * Infinity;
   } else {
      m2 = m2 + Math.pow(2, mLen);
      e = e - eBias;
   }
   return (s ? -1 : 1) * m2 * Math.pow(2, e - mLen);
}
function ieee754write(buffer, value, offset, isLE, mLen, nBytes) {
   var e, m2, c2;
   var eLen = nBytes * 8 - mLen - 1;
   var eMax = (1 << eLen) - 1;
   var eBias = eMax >> 1;
   var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
   var i = isLE ? 0 : nBytes - 1;
   var d = isLE ? 1 : -1;
   var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;
   value = Math.abs(value);
   if (isNaN(value) || value === Infinity) {
      m2 = isNaN(value) ? 1 : 0;
      e = eMax;
   } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c2 = Math.pow(2, -e)) < 1) {
         e--;
         c2 *= 2;
      }
      if (e + eBias >= 1) {
         value += rt / c2;
      } else {
         value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c2 >= 2) {
         e++;
         c2 /= 2;
      }
      if (e + eBias >= eMax) {
         m2 = 0;
         e = eMax;
      } else if (e + eBias >= 1) {
         m2 = (value * c2 - 1) * Math.pow(2, mLen);
         e = e + eBias;
      } else {
         m2 = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
         e = 0;
      }
   }
   for (; mLen >= 8; buffer[offset + i] = m2 & 255, i += d, m2 /= 256, mLen -= 8) {}
   e = (e << mLen) | m2;
   eLen += mLen;
   for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {}
   buffer[offset + i - d] |= s * 128;
}
var lookup, revLookup, Arr, inited, MAX_ARGUMENTS_LENGTH, INVALID_BASE64_RE;
var init_Buffer = __esm({
   "../../node_modules/@esbuild-plugins/node-globals-polyfill/Buffer.js"() {
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      lookup = [];
      revLookup = [];
      Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      inited = false;
      Buffer2.TYPED_ARRAY_SUPPORT = globalThis.TYPED_ARRAY_SUPPORT !== void 0 ? globalThis.TYPED_ARRAY_SUPPORT : true;
      Buffer2.poolSize = 8192;
      Buffer2._augment = function (arr) {
         arr.__proto__ = Buffer2.prototype;
         return arr;
      };
      Buffer2.from = function (value, encodingOrOffset, length) {
         return from(null, value, encodingOrOffset, length);
      };
      Buffer2.kMaxLength = kMaxLength();
      if (Buffer2.TYPED_ARRAY_SUPPORT) {
         Buffer2.prototype.__proto__ = Uint8Array.prototype;
         Buffer2.__proto__ = Uint8Array;
         if (typeof Symbol !== "undefined" && Symbol.species && Buffer2[Symbol.species] === Buffer2) {
         }
      }
      Buffer2.alloc = function (size, fill3, encoding) {
         return alloc(null, size, fill3, encoding);
      };
      Buffer2.allocUnsafe = function (size) {
         return allocUnsafe(null, size);
      };
      Buffer2.allocUnsafeSlow = function (size) {
         return allocUnsafe(null, size);
      };
      Buffer2.isBuffer = isBuffer;
      Buffer2.compare = function compare(a, b) {
         if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
            throw new TypeError("Arguments must be Buffers");
         }
         if (a === b) return 0;
         var x = a.length;
         var y = b.length;
         for (var i = 0, len = Math.min(x, y); i < len; ++i) {
            if (a[i] !== b[i]) {
               x = a[i];
               y = b[i];
               break;
            }
         }
         if (x < y) return -1;
         if (y < x) return 1;
         return 0;
      };
      Buffer2.isEncoding = function isEncoding(encoding) {
         switch (String(encoding).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "latin1":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
               return true;
            default:
               return false;
         }
      };
      Buffer2.concat = function concat(list, length) {
         if (!Array.isArray(list)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
         }
         if (list.length === 0) {
            return Buffer2.alloc(0);
         }
         var i;
         if (length === void 0) {
            length = 0;
            for (i = 0; i < list.length; ++i) {
               length += list[i].length;
            }
         }
         var buffer = Buffer2.allocUnsafe(length);
         var pos = 0;
         for (i = 0; i < list.length; ++i) {
            var buf = list[i];
            if (!internalIsBuffer(buf)) {
               throw new TypeError('"list" argument must be an Array of Buffers');
            }
            buf.copy(buffer, pos);
            pos += buf.length;
         }
         return buffer;
      };
      Buffer2.byteLength = byteLength;
      Buffer2.prototype._isBuffer = true;
      Buffer2.prototype.swap16 = function swap16() {
         var len = this.length;
         if (len % 2 !== 0) {
            throw new RangeError("Buffer size must be a multiple of 16-bits");
         }
         for (var i = 0; i < len; i += 2) {
            swap(this, i, i + 1);
         }
         return this;
      };
      Buffer2.prototype.swap32 = function swap32() {
         var len = this.length;
         if (len % 4 !== 0) {
            throw new RangeError("Buffer size must be a multiple of 32-bits");
         }
         for (var i = 0; i < len; i += 4) {
            swap(this, i, i + 3);
            swap(this, i + 1, i + 2);
         }
         return this;
      };
      Buffer2.prototype.swap64 = function swap64() {
         var len = this.length;
         if (len % 8 !== 0) {
            throw new RangeError("Buffer size must be a multiple of 64-bits");
         }
         for (var i = 0; i < len; i += 8) {
            swap(this, i, i + 7);
            swap(this, i + 1, i + 6);
            swap(this, i + 2, i + 5);
            swap(this, i + 3, i + 4);
         }
         return this;
      };
      Buffer2.prototype.toString = function toString2() {
         var length = this.length | 0;
         if (length === 0) return "";
         if (arguments.length === 0) return utf8Slice(this, 0, length);
         return slowToString.apply(this, arguments);
      };
      Buffer2.prototype.equals = function equals(b) {
         if (!internalIsBuffer(b)) throw new TypeError("Argument must be a Buffer");
         if (this === b) return true;
         return Buffer2.compare(this, b) === 0;
      };
      Buffer2.prototype.compare = function compare2(target, start, end, thisStart, thisEnd) {
         if (!internalIsBuffer(target)) {
            throw new TypeError("Argument must be a Buffer");
         }
         if (start === void 0) {
            start = 0;
         }
         if (end === void 0) {
            end = target ? target.length : 0;
         }
         if (thisStart === void 0) {
            thisStart = 0;
         }
         if (thisEnd === void 0) {
            thisEnd = this.length;
         }
         if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
            throw new RangeError("out of range index");
         }
         if (thisStart >= thisEnd && start >= end) {
            return 0;
         }
         if (thisStart >= thisEnd) {
            return -1;
         }
         if (start >= end) {
            return 1;
         }
         start >>>= 0;
         end >>>= 0;
         thisStart >>>= 0;
         thisEnd >>>= 0;
         if (this === target) return 0;
         var x = thisEnd - thisStart;
         var y = end - start;
         var len = Math.min(x, y);
         var thisCopy = this.slice(thisStart, thisEnd);
         var targetCopy = target.slice(start, end);
         for (var i = 0; i < len; ++i) {
            if (thisCopy[i] !== targetCopy[i]) {
               x = thisCopy[i];
               y = targetCopy[i];
               break;
            }
         }
         if (x < y) return -1;
         if (y < x) return 1;
         return 0;
      };
      Buffer2.prototype.includes = function includes(val, byteOffset, encoding) {
         return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer2.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
         return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer2.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
         return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      Buffer2.prototype.write = function write(string, offset, length, encoding) {
         if (offset === void 0) {
            encoding = "utf8";
            length = this.length;
            offset = 0;
         } else if (length === void 0 && typeof offset === "string") {
            encoding = offset;
            length = this.length;
            offset = 0;
         } else if (isFinite(offset)) {
            offset = offset | 0;
            if (isFinite(length)) {
               length = length | 0;
               if (encoding === void 0) encoding = "utf8";
            } else {
               encoding = length;
               length = void 0;
            }
         } else {
            throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
         }
         var remaining = this.length - offset;
         if (length === void 0 || length > remaining) length = remaining;
         if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
            throw new RangeError("Attempt to write outside buffer bounds");
         }
         if (!encoding) encoding = "utf8";
         var loweredCase = false;
         for (;;) {
            switch (encoding) {
               case "hex":
                  return hexWrite(this, string, offset, length);
               case "utf8":
               case "utf-8":
                  return utf8Write(this, string, offset, length);
               case "ascii":
                  return asciiWrite(this, string, offset, length);
               case "latin1":
               case "binary":
                  return latin1Write(this, string, offset, length);
               case "base64":
                  return base64Write(this, string, offset, length);
               case "ucs2":
               case "ucs-2":
               case "utf16le":
               case "utf-16le":
                  return ucs2Write(this, string, offset, length);
               default:
                  if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                  encoding = ("" + encoding).toLowerCase();
                  loweredCase = true;
            }
         }
      };
      Buffer2.prototype.toJSON = function toJSON() {
         return {
            type: "Buffer",
            data: Array.prototype.slice.call(this._arr || this, 0),
         };
      };
      MAX_ARGUMENTS_LENGTH = 4096;
      Buffer2.prototype.slice = function slice(start, end) {
         var len = this.length;
         start = ~~start;
         end = end === void 0 ? len : ~~end;
         if (start < 0) {
            start += len;
            if (start < 0) start = 0;
         } else if (start > len) {
            start = len;
         }
         if (end < 0) {
            end += len;
            if (end < 0) end = 0;
         } else if (end > len) {
            end = len;
         }
         if (end < start) end = start;
         var newBuf;
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            newBuf = this.subarray(start, end);
            newBuf.__proto__ = Buffer2.prototype;
         } else {
            var sliceLen = end - start;
            newBuf = new Buffer2(sliceLen, void 0);
            for (var i = 0; i < sliceLen; ++i) {
               newBuf[i] = this[i + start];
            }
         }
         return newBuf;
      };
      Buffer2.prototype.readUIntLE = function readUIntLE(offset, byteLength3, noAssert) {
         offset = offset | 0;
         byteLength3 = byteLength3 | 0;
         if (!noAssert) checkOffset(offset, byteLength3, this.length);
         var val = this[offset];
         var mul = 1;
         var i = 0;
         while (++i < byteLength3 && (mul *= 256)) {
            val += this[offset + i] * mul;
         }
         return val;
      };
      Buffer2.prototype.readUIntBE = function readUIntBE(offset, byteLength3, noAssert) {
         offset = offset | 0;
         byteLength3 = byteLength3 | 0;
         if (!noAssert) {
            checkOffset(offset, byteLength3, this.length);
         }
         var val = this[offset + --byteLength3];
         var mul = 1;
         while (byteLength3 > 0 && (mul *= 256)) {
            val += this[offset + --byteLength3] * mul;
         }
         return val;
      };
      Buffer2.prototype.readUInt8 = function readUInt8(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 1, this.length);
         return this[offset];
      };
      Buffer2.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 2, this.length);
         return this[offset] | (this[offset + 1] << 8);
      };
      Buffer2.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 2, this.length);
         return (this[offset] << 8) | this[offset + 1];
      };
      Buffer2.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 4, this.length);
         return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + this[offset + 3] * 16777216;
      };
      Buffer2.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 4, this.length);
         return this[offset] * 16777216 + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
      };
      Buffer2.prototype.readIntLE = function readIntLE(offset, byteLength3, noAssert) {
         offset = offset | 0;
         byteLength3 = byteLength3 | 0;
         if (!noAssert) checkOffset(offset, byteLength3, this.length);
         var val = this[offset];
         var mul = 1;
         var i = 0;
         while (++i < byteLength3 && (mul *= 256)) {
            val += this[offset + i] * mul;
         }
         mul *= 128;
         if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
         return val;
      };
      Buffer2.prototype.readIntBE = function readIntBE(offset, byteLength3, noAssert) {
         offset = offset | 0;
         byteLength3 = byteLength3 | 0;
         if (!noAssert) checkOffset(offset, byteLength3, this.length);
         var i = byteLength3;
         var mul = 1;
         var val = this[offset + --i];
         while (i > 0 && (mul *= 256)) {
            val += this[offset + --i] * mul;
         }
         mul *= 128;
         if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
         return val;
      };
      Buffer2.prototype.readInt8 = function readInt8(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 1, this.length);
         if (!(this[offset] & 128)) return this[offset];
         return (255 - this[offset] + 1) * -1;
      };
      Buffer2.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 2, this.length);
         var val = this[offset] | (this[offset + 1] << 8);
         return val & 32768 ? val | 4294901760 : val;
      };
      Buffer2.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 2, this.length);
         var val = this[offset + 1] | (this[offset] << 8);
         return val & 32768 ? val | 4294901760 : val;
      };
      Buffer2.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 4, this.length);
         return this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24);
      };
      Buffer2.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 4, this.length);
         return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3];
      };
      Buffer2.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 4, this.length);
         return ieee754read(this, offset, true, 23, 4);
      };
      Buffer2.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 4, this.length);
         return ieee754read(this, offset, false, 23, 4);
      };
      Buffer2.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 8, this.length);
         return ieee754read(this, offset, true, 52, 8);
      };
      Buffer2.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
         if (!noAssert) checkOffset(offset, 8, this.length);
         return ieee754read(this, offset, false, 52, 8);
      };
      Buffer2.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength3, noAssert) {
         value = +value;
         offset = offset | 0;
         byteLength3 = byteLength3 | 0;
         if (!noAssert) {
            var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
            checkInt(this, value, offset, byteLength3, maxBytes, 0);
         }
         var mul = 1;
         var i = 0;
         this[offset] = value & 255;
         while (++i < byteLength3 && (mul *= 256)) {
            this[offset + i] = (value / mul) & 255;
         }
         return offset + byteLength3;
      };
      Buffer2.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength3, noAssert) {
         value = +value;
         offset = offset | 0;
         byteLength3 = byteLength3 | 0;
         if (!noAssert) {
            var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
            checkInt(this, value, offset, byteLength3, maxBytes, 0);
         }
         var i = byteLength3 - 1;
         var mul = 1;
         this[offset + i] = value & 255;
         while (--i >= 0 && (mul *= 256)) {
            this[offset + i] = (value / mul) & 255;
         }
         return offset + byteLength3;
      };
      Buffer2.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
         if (!Buffer2.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
         this[offset] = value & 255;
         return offset + 1;
      };
      Buffer2.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value & 255;
            this[offset + 1] = value >>> 8;
         } else {
            objectWriteUInt16(this, value, offset, true);
         }
         return offset + 2;
      };
      Buffer2.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 8;
            this[offset + 1] = value & 255;
         } else {
            objectWriteUInt16(this, value, offset, false);
         }
         return offset + 2;
      };
      Buffer2.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset + 3] = value >>> 24;
            this[offset + 2] = value >>> 16;
            this[offset + 1] = value >>> 8;
            this[offset] = value & 255;
         } else {
            objectWriteUInt32(this, value, offset, true);
         }
         return offset + 4;
      };
      Buffer2.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 24;
            this[offset + 1] = value >>> 16;
            this[offset + 2] = value >>> 8;
            this[offset + 3] = value & 255;
         } else {
            objectWriteUInt32(this, value, offset, false);
         }
         return offset + 4;
      };
      Buffer2.prototype.writeIntLE = function writeIntLE(value, offset, byteLength3, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) {
            var limit = Math.pow(2, 8 * byteLength3 - 1);
            checkInt(this, value, offset, byteLength3, limit - 1, -limit);
         }
         var i = 0;
         var mul = 1;
         var sub = 0;
         this[offset] = value & 255;
         while (++i < byteLength3 && (mul *= 256)) {
            if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
               sub = 1;
            }
            this[offset + i] = (((value / mul) >> 0) - sub) & 255;
         }
         return offset + byteLength3;
      };
      Buffer2.prototype.writeIntBE = function writeIntBE(value, offset, byteLength3, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) {
            var limit = Math.pow(2, 8 * byteLength3 - 1);
            checkInt(this, value, offset, byteLength3, limit - 1, -limit);
         }
         var i = byteLength3 - 1;
         var mul = 1;
         var sub = 0;
         this[offset + i] = value & 255;
         while (--i >= 0 && (mul *= 256)) {
            if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
               sub = 1;
            }
            this[offset + i] = (((value / mul) >> 0) - sub) & 255;
         }
         return offset + byteLength3;
      };
      Buffer2.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
         if (!Buffer2.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
         if (value < 0) value = 255 + value + 1;
         this[offset] = value & 255;
         return offset + 1;
      };
      Buffer2.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value & 255;
            this[offset + 1] = value >>> 8;
         } else {
            objectWriteUInt16(this, value, offset, true);
         }
         return offset + 2;
      };
      Buffer2.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 8;
            this[offset + 1] = value & 255;
         } else {
            objectWriteUInt16(this, value, offset, false);
         }
         return offset + 2;
      };
      Buffer2.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value & 255;
            this[offset + 1] = value >>> 8;
            this[offset + 2] = value >>> 16;
            this[offset + 3] = value >>> 24;
         } else {
            objectWriteUInt32(this, value, offset, true);
         }
         return offset + 4;
      };
      Buffer2.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
         value = +value;
         offset = offset | 0;
         if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
         if (value < 0) value = 4294967295 + value + 1;
         if (Buffer2.TYPED_ARRAY_SUPPORT) {
            this[offset] = value >>> 24;
            this[offset + 1] = value >>> 16;
            this[offset + 2] = value >>> 8;
            this[offset + 3] = value & 255;
         } else {
            objectWriteUInt32(this, value, offset, false);
         }
         return offset + 4;
      };
      Buffer2.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
         return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer2.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
         return writeFloat(this, value, offset, false, noAssert);
      };
      Buffer2.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
         return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer2.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
         return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer2.prototype.copy = function copy(target, targetStart, start, end) {
         if (!start) start = 0;
         if (!end && end !== 0) end = this.length;
         if (targetStart >= target.length) targetStart = target.length;
         if (!targetStart) targetStart = 0;
         if (end > 0 && end < start) end = start;
         if (end === start) return 0;
         if (target.length === 0 || this.length === 0) return 0;
         if (targetStart < 0) {
            throw new RangeError("targetStart out of bounds");
         }
         if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
         if (end < 0) throw new RangeError("sourceEnd out of bounds");
         if (end > this.length) end = this.length;
         if (target.length - targetStart < end - start) {
            end = target.length - targetStart + start;
         }
         var len = end - start;
         var i;
         if (this === target && start < targetStart && targetStart < end) {
            for (i = len - 1; i >= 0; --i) {
               target[i + targetStart] = this[i + start];
            }
         } else if (len < 1e3 || !Buffer2.TYPED_ARRAY_SUPPORT) {
            for (i = 0; i < len; ++i) {
               target[i + targetStart] = this[i + start];
            }
         } else {
            Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
         }
         return len;
      };
      Buffer2.prototype.fill = function fill(val, start, end, encoding) {
         if (typeof val === "string") {
            if (typeof start === "string") {
               encoding = start;
               start = 0;
               end = this.length;
            } else if (typeof end === "string") {
               encoding = end;
               end = this.length;
            }
            if (val.length === 1) {
               var code = val.charCodeAt(0);
               if (code < 256) {
                  val = code;
               }
            }
            if (encoding !== void 0 && typeof encoding !== "string") {
               throw new TypeError("encoding must be a string");
            }
            if (typeof encoding === "string" && !Buffer2.isEncoding(encoding)) {
               throw new TypeError("Unknown encoding: " + encoding);
            }
         } else if (typeof val === "number") {
            val = val & 255;
         }
         if (start < 0 || this.length < start || this.length < end) {
            throw new RangeError("Out of range index");
         }
         if (end <= start) {
            return this;
         }
         start = start >>> 0;
         end = end === void 0 ? this.length : end >>> 0;
         if (!val) val = 0;
         var i;
         if (typeof val === "number") {
            for (i = start; i < end; ++i) {
               this[i] = val;
            }
         } else {
            var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer2(val, encoding).toString());
            var len = bytes.length;
            for (i = 0; i < end - start; ++i) {
               this[i + start] = bytes[i % len];
            }
         }
         return this;
      };
      INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
   },
});

// ../../node_modules/@esbuild-plugins/node-globals-polyfill/_buffer.js
var init_buffer = __esm({
   "../../node_modules/@esbuild-plugins/node-globals-polyfill/_buffer.js"() {
      init_Buffer();
   },
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
   "wrangler-modules-watch:wrangler:modules-watch"() {
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
   },
});

// ../../node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
   "../../node_modules/wrangler/templates/modules-watch-stub.js"() {
      init_wrangler_modules_watch();
   },
});

// ../../node_modules/magic-bytes.js/dist/model/toHex.js
var require_toHex = __commonJS({
   "../../node_modules/magic-bytes.js/dist/model/toHex.js"(exports) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.fromHex = exports.toHex = void 0;
      var hex = num => new Number(num).toString(16).toLowerCase();
      var toHex3 = num => `0x${hex(num).length === 1 ? "0" + hex(num) : hex(num)}`;
      exports.toHex = toHex3;
      var fromHex = hex2 => new Number(hex2);
      exports.fromHex = fromHex;
   },
});

// ../../node_modules/magic-bytes.js/dist/model/tree.js
var require_tree = __commonJS({
   "../../node_modules/magic-bytes.js/dist/model/tree.js"(exports) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createComplexNode = exports.createNode = exports.merge = void 0;
      var createMatch = leaf => ({
         typename: leaf.typename,
         mime: leaf.info.mime,
         extension: leaf.info.extension,
      });
      var isMatchingNode = (tree, path) => tree && path.length === 0;
      var head = arr => arr[0];
      var tail = arr => arr.slice(1, arr.length);
      var merge2 = (node, tree) => {
         if (node.bytes.length === 0) return tree;
         const currentByte = head(node.bytes);
         const path = tail(node.bytes);
         const currentTree = tree.bytes[currentByte];
         if (isMatchingNode(currentTree, path)) {
            const matchingNode = tree.bytes[currentByte];
            tree.bytes[currentByte] = {
               ...matchingNode,
               matches: [...(matchingNode.matches ? matchingNode.matches : []), createMatch(node)],
            };
            return tree;
         }
         if (tree.bytes[currentByte]) {
            tree.bytes[currentByte] = exports.merge(exports.createNode(node.typename, path, node.info), tree.bytes[currentByte]);
            return tree;
         }
         if (!tree.bytes[currentByte]) {
            tree.bytes[currentByte] = {
               ...tree.bytes[currentByte],
               ...exports.createComplexNode(node.typename, path, node.info),
            };
         }
         return tree;
      };
      exports.merge = merge2;
      var createNode = (typename, bytes, info) => {
         return { typename, bytes, info: info ? info : {} };
      };
      exports.createNode = createNode;
      var createComplexNode = (typename, bytes, info) => {
         let obj = {
            bytes: {},
            matches: void 0,
         };
         const currentKey = head(bytes);
         const path = tail(bytes);
         if (bytes.length === 0) {
            return {
               matches: [
                  createMatch({
                     typename,
                     info: info ? { extension: info.extension, mime: info.mime } : {},
                  }),
               ],
               bytes: {},
            };
         }
         obj.bytes[currentKey] = exports.createComplexNode(typename, path, info);
         return obj;
      };
      exports.createComplexNode = createComplexNode;
   },
});

// ../../node_modules/magic-bytes.js/dist/model/pattern-tree.js
var require_pattern_tree = __commonJS({
   "../../node_modules/magic-bytes.js/dist/model/pattern-tree.js"(exports) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      Object.defineProperty(exports, "__esModule", { value: true });
      var toHex_1 = require_toHex();
      var tree_1 = require_tree();
      var tree = {
         noOffset: null,
         offset: {},
      };
      var add = (typename, signature, additionalInfo, offset) => {
         if (offset) {
            const existing = tree.offset[toHex_1.toHex(offset)];
            if (!existing) {
               tree.offset[toHex_1.toHex(offset)] = tree_1.createComplexNode(
                  typename,
                  signature.map(e => e.toLowerCase()),
                  additionalInfo,
               );
            } else {
               const merged = tree_1.merge(
                  tree_1.createNode(
                     typename,
                     signature.map(e => e.toLowerCase()),
                     additionalInfo,
                  ),
                  { ...existing },
               );
               tree.offset[toHex_1.toHex(offset)] = merged;
            }
         } else {
            if (tree.noOffset === null) {
               tree.noOffset = tree_1.createComplexNode(
                  typename,
                  signature.map(e => e.toLowerCase()),
                  additionalInfo,
               );
            } else {
               tree.noOffset = tree_1.merge(
                  tree_1.createNode(
                     typename,
                     signature.map(e => e.toLowerCase()),
                     additionalInfo,
                  ),
                  tree.noOffset,
               );
            }
         }
      };
      add("gif", ["0x47", "0x49", "0x46", "0x38", "0x37", "0x61"], {
         mime: "image/gif",
         extension: "gif",
      });
      add("gif", ["0x47", "0x49", "0x46", "0x38", "0x39", "0x61"], {
         mime: "image/gif",
         extension: "gif",
      });
      add("jpg", ["0xFF", "0xD8", "0xFF"], {
         mime: "image/jpeg",
         extension: "jpeg",
      });
      add("webp", ["0x52", "0x49", "0x46", "0x46", "?", "?", "?", "?", "0x57", "0x45", "0x42", "0x50"], {
         mime: "image/webp",
         extension: "webp",
      });
      add("heif", ["0x66", "0x74", "0x79", "0x70", "0x6D", "0x69", "0x66", "0x31"], { mime: "image/heif", extension: "heif" }, 4);
      add("heif", ["0x66", "0x74", "0x79", "0x70", "0x68", "0x65", "0x69", "0x63"], { mime: "image/heif", extension: "heic" }, 4);
      add("rpm", ["0xed", "0xab", "0xee", "0xdb"]);
      add("bin", ["0x53", "0x50", "0x30", "0x31"], {
         mime: "application/octet-stream",
         extension: "bin",
      });
      add("pic", ["0x00"]);
      add("pif", ["0x00"]);
      add("sea", ["0x00"]);
      add("ytr", ["0x00"]);
      add("mp4", ["0x66", "0x74", "0x79", "0x70"], { mime: "video/mp4", extension: "mp4" }, 4);
      add("ttf", ["0x00", "0x01", "0x00", "0x00", "0x00"], {
         mime: "font/ttf",
         extension: "ttf",
      });
      add("otf", ["0x4F", "0x54", "0x54", "0x4F"], {
         mime: "font/otf",
         extension: "otf",
      });
      add("eot", ["0x50", "0x4C"], {
         mime: "application/vnd.ms-fontobject",
         extension: "eot",
      });
      add("woff", ["0x77", "0x4F", "0x46", "0x46"], {
         mime: "font/woff",
         extension: "woff",
      });
      add("woff2", ["0x77", "0x4F", "0x46", "0x32"], {
         mime: "font/woff2",
         extension: "woff2",
      });
      add("pdb", [
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
      ]);
      add("dba", ["0xBE", "0xBA", "0xFE", "0xCA"]);
      add("dba2", ["0x00", "0x01", "0x42", "0x44"]);
      add("tda", ["0x00", "0x01", "0x44", "0x54"]);
      add("tda2", ["0x00", "0x01", "0x00", "0x00"]);
      add("ico", ["0x00", "0x00", "0x01", "0x00"], {
         mime: "image/x-icon",
         extension: "ico",
      });
      add("3gp", ["0x66", "0x74", "0x79", "0x70", "0x33", "0x67"]);
      add("z", ["0x1F", "0x9D"]);
      add("tar.z", ["0x1F", "0xA0"]);
      add("bac", ["0x42", "0x41", "0x43", "0x4B", "0x4D", "0x49", "0x4B", "0x45", "0x44", "0x49", "0x53", "0x4B"]);
      add("bz2", ["0x42", "0x5A", "0x68"], {
         mime: "application/x-bzip2",
         extension: "bz2",
      });
      add("tif", ["0x49", "0x49", "0x2A", "0x00"], {
         mime: "image/tiff",
         extension: "tif",
      });
      add("tiff", ["0x4D", "0x4D", "0x00", "0x2A"], {
         mime: "image/tiff",
         extension: "tiff",
      });
      add("cr2", ["0x49", "0x49", "0x2A", "0x00", "0x10", "0x00", "0x00", "0x00", "0x43", "0x52"]);
      add("cin", ["0x80", "0x2A", "0x5F", "0xD7"]);
      add("cin1", ["0x52", "0x4E", "0x43", "0x01"]);
      add("cin2", ["0x52", "0x4E", "0x43", "0x02"]);
      add("dpx", ["0x53", "0x44", "0x50", "0x58"]);
      add("dpx2", ["0x58", "0x50", "0x44", "0x53"]);
      add("exr", ["0x76", "0x2F", "0x31", "0x01"]);
      add("bpg", ["0x42", "0x50", "0x47", "0xFB"]);
      add("ilbm", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x49", "0x4C", "0x42", "0x4D"]);
      add("8svx", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x38", "0x53", "0x56", "0x58"]);
      add("acbm", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x41", "0x43", "0x42", "0x4D"]);
      add("anbm", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x41", "0x4E", "0x42", "0x4D"]);
      add("anim", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x41", "0x4E", "0x49", "0x4D"]);
      add("faxx", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x46", "0x41", "0x58", "0x58"]);
      add("ftxt", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x46", "0x54", "0x58", "0x54"]);
      add("smus", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x53", "0x4D", "0x55", "0x53"]);
      add("cmus", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x43", "0x4D", "0x55", "0x53"]);
      add("yuvn", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x59", "0x55", "0x56", "0x4E"]);
      add("iff", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x46", "0x41", "0x4E", "0x54"]);
      add("aiff", ["0x46", "0x4F", "0x52", "0x4D", "?", "?", "?", "?", "0x41", "0x49", "0x46", "0x46"], {
         mime: "audio/x-aiff",
         extension: "aiff",
      });
      add("idx", ["0x49", "0x4E", "0x44", "0x58"]);
      add("lz", ["0x4C", "0x5A", "0x49", "0x50"]);
      add("exe", ["0x4D", "0x5A"]);
      add("zip", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/zip",
         extension: "zip",
      });
      add("zip", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/zip",
         extension: "zip",
      });
      add("zip", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/zip",
         extension: "zip",
      });
      add("jar", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/java-archive",
         extension: "jar",
      });
      add("jar", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/java-archive",
         extension: "jar",
      });
      add("jar", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/java-archive",
         extension: "jar",
      });
      add("odt", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.oasis.opendocument.text",
         extension: "odt",
      });
      add("odt", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.oasis.opendocument.text",
         extension: "odt",
      });
      add("odt", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.oasis.opendocument.text",
         extension: "odt",
      });
      add("ods", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.oasis.opendocument.spreadsheet",
         extension: "ods",
      });
      add("ods", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.oasis.opendocument.spreadsheet",
         extension: "ods",
      });
      add("ods", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.oasis.opendocument.spreadsheet",
         extension: "ods",
      });
      add("odp", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.oasis.opendocument.presentation",
         extension: "odp",
      });
      add("odp", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.oasis.opendocument.presentation",
         extension: "odp",
      });
      add("odp", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.oasis.opendocument.presentation",
         extension: "odp",
      });
      add("docx", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         extension: "docx",
      });
      add("docx", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         extension: "docx",
      });
      add("docx", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         extension: "docx",
      });
      add("xlsx", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         extension: "xlsx",
      });
      add("xlsx", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         extension: "xlsx",
      });
      add("xlsx", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         extension: "xlsx",
      });
      add("pptx", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
         extension: "pptx",
      });
      add("pptx", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
         extension: "pptx",
      });
      add("pptx", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
         extension: "pptx",
      });
      add("vsdx", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.ms-visio.drawing",
         extension: "vsdx",
      });
      add("vsdx", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.ms-visio.drawing",
         extension: "vsdx",
      });
      add("vsdx", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.ms-visio.drawing",
         extension: "vsdx",
      });
      add("apk", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.android.package-archive",
         extension: "apk",
      });
      add("apk", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.android.package-archive",
         extension: "apk",
      });
      add("apk", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.android.package-archive",
         extension: "apk",
      });
      add("aar", ["0x50", "0x4B", "0x03", "0x04"], {
         mime: "application/vnd.android.package-archive",
         extension: "aar",
      });
      add("aar", ["0x50", "0x4B", "0x05", "0x06"], {
         mime: "application/vnd.android.package-archive",
         extension: "aar",
      });
      add("aar", ["0x50", "0x4B", "0x07", "0x08"], {
         mime: "application/vnd.android.package-archive",
         extension: "aar",
      });
      add("rar", ["0x52", "0x61", "0x72", "0x21", "0x1A", "0x07", "0x00"], {
         mime: "application/vnd.rar",
         extension: "rar",
      });
      add("rar", ["0x52", "0x61", "0x72", "0x21", "0x1A", "0x07", "0x01", "0x00"], {
         mime: "application/vnd.rar",
         extension: "rar",
      });
      add("rar", ["0x7F", "0x45", "0x4C", "0x46"], {
         mime: "application/vnd.rar",
         extension: "rar",
      });
      add("png", ["0x89", "0x50", "0x4E", "0x47", "0x0D", "0x0A", "0x1A", "0x0A"], {
         mime: "image/png",
         extension: "png",
      });
      add("apng", ["0x89", "0x50", "0x4E", "0x47", "0x0D", "0x0A", "0x1A", "0x0A"], {
         mime: "image/apng",
         extension: "apng",
      });
      add("class", ["0xCA", "0xFE", "0xBA", "0xBE"]);
      add("class", ["0xEF", "0xBB", "0xBF"]);
      add("class", ["0xFE", "0xed", "0xFA", "0xCE"], void 0, 4096);
      add("class", ["0xFE", "0xed", "0xFA", "0xCF"], void 0, 4096);
      add("class", ["0xCE", "0xFA", "0xed", "0xFE"]);
      add("class", ["0xCF", "0xFA", "0xed", "0xFE"]);
      add("class", ["0xFF", "0xFE"]);
      add("class", ["0xFF", "0xFE"]);
      add("class", ["0xFF", "0xFE", "0x00", "0x00"]);
      add("ps", ["0x25", "0x21", "0x50", "0x53"], {
         mime: "application/postscript",
         extension: ".ps",
      });
      add("pdf", ["0x25", "0x50", "0x44", "0x46"], {
         mime: "application/pdf",
         extension: "pdf",
      });
      add("asf", [
         "0x30",
         "0x26",
         "0xB2",
         "0x75",
         "0x8E",
         "0x66",
         "0xCF",
         "0x11",
         "0xA6",
         "0xD9",
         "0x00",
         "0xAA",
         "0x00",
         "0x62",
         "0xCE",
         "0x6C",
      ]);
      add("wma", [
         "0x30",
         "0x26",
         "0xB2",
         "0x75",
         "0x8E",
         "0x66",
         "0xCF",
         "0x11",
         "0xA6",
         "0xD9",
         "0x00",
         "0xAA",
         "0x00",
         "0x62",
         "0xCE",
         "0x6C",
      ]);
      add("wmv", [
         "0x30",
         "0x26",
         "0xB2",
         "0x75",
         "0x8E",
         "0x66",
         "0xCF",
         "0x11",
         "0xA6",
         "0xD9",
         "0x00",
         "0xAA",
         "0x00",
         "0x62",
         "0xCE",
         "0x6C",
      ]);
      add("deploymentimage", ["0x24", "0x53", "0x44", "0x49", "0x30", "0x30", "0x30", "0x31"]);
      add(
         "ogv",
         [
            "0x4F",
            "0x67",
            "0x67",
            "0x53",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "0x80",
            "0x74",
            "0x68",
            "0x65",
            "0x6F",
            "0x72",
            "0x61",
         ],
         {
            mime: "video/ogg",
            extension: "ogv",
         },
      );
      add(
         "ogm",
         [
            "0x4F",
            "0x67",
            "0x67",
            "0x53",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "0x01",
            "0x76",
            "0x69",
            "0x64",
            "0x65",
            "0x6F",
            "0x00",
         ],
         {
            mime: "video/ogg",
            extension: "ogm",
         },
      );
      add(
         "oga",
         [
            "0x4F",
            "0x67",
            "0x67",
            "0x53",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "0x7F",
            "0x46",
            "0x4C",
            "0x41",
            "0x43",
         ],
         {
            mime: "audio/ogg",
            extension: "oga",
         },
      );
      add(
         "spx",
         [
            "0x4F",
            "0x67",
            "0x67",
            "0x53",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "0x53",
            "0x70",
            "0x65",
            "0x65",
            "0x78",
            "0x20",
            "0x20",
         ],
         {
            mime: "audio/ogg",
            extension: "spx",
         },
      );
      add(
         "ogg",
         [
            "0x4F",
            "0x67",
            "0x67",
            "0x53",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "?",
            "0x01",
            "0x76",
            "0x6F",
            "0x72",
            "0x62",
            "0x69",
            "0x73",
         ],
         {
            mime: "audio/ogg",
            extension: "ogg",
         },
      );
      add("ogx", ["0x4F", "0x67", "0x67", "0x53"], {
         mime: "application/ogg",
         extension: "ogx",
      });
      add("psd", ["0x38", "0x42", "0x50", "0x53"], {
         mime: "application/x-photoshop",
         extension: "psd",
      });
      add("clip", ["0x43", "0x53", "0x46", "0x43", "0x48", "0x55", "0x4e", "0x4b"]);
      add("wav", ["0x52", "0x49", "0x46", "0x46", "?", "?", "?", "?", "0x57", "0x41", "0x56", "0x45"], {
         mime: "audio/x-wav",
         extension: "wav",
      });
      add("avi", ["0x52", "0x49", "0x46", "0x46", "?", "?", "?", "?", "0x41", "0x56", "0x49", "0x20"], {
         mime: "video/x-msvideo",
         extension: "avi",
      });
      add("mp3", ["0xFF", "0xFB"], { mime: "audio/mpeg", extension: "mp3" });
      add("mp3", ["0xFF", "0xF3"], { mime: "audio/mpeg", extension: "mp3" });
      add("mp3", ["0xFF", "0xF2"], { mime: "audio/mpeg", extension: "mp3" });
      add("mp3", ["0x49", "0x44", "0x33"], { mime: "audio/mpeg", extension: "mp3" });
      add("bmp", ["0x42", "0x4D"], { mime: "image/bmp", extension: "bmp" });
      add("iso", ["0x43", "0x44", "0x30", "0x30", "0x31"]);
      add("flac", ["0x66", "0x4C", "0x61", "0x43"]);
      add("mid", ["0x4D", "0x54", "0x68", "0x64"], {
         mime: "audio/midi",
         extension: "mid",
      });
      add("midi", ["0x4D", "0x54", "0x68", "0x64"], {
         mime: "audio/midi",
         extension: "midi",
      });
      add("doc", ["0xD0", "0xCF", "0x11", "0xE0", "0xA1", "0xB1", "0x1A", "0xE1"], {
         mime: "application/msword",
         extension: "doc",
      });
      add("xls", ["0xD0", "0xCF", "0x11", "0xE0", "0xA1", "0xB1", "0x1A", "0xE1"], {
         mime: "application/vnd.ms-excel",
         extension: "xls",
      });
      add("ppt", ["0xD0", "0xCF", "0x11", "0xE0", "0xA1", "0xB1", "0x1A", "0xE1"], {
         mime: "application/vnd.ms-powerpoint",
         extension: "ppt",
      });
      add("msg", ["0xD0", "0xCF", "0x11", "0xE0", "0xA1", "0xB1", "0x1A", "0xE1"]);
      add("dex", ["0x64", "0x65", "0x78", "0x0A", "0x30", "0x33", "0x35", "0x00"]);
      add("vmdk", ["0x4B", "0x44", "0x4D"]);
      add("crx", ["0x43", "0x72", "0x32", "0x34"]);
      add("fh8", ["0x41", "0x47", "0x44", "0x33"]);
      add("cwk", [
         "0x05",
         "0x07",
         "0x00",
         "0x00",
         "0x42",
         "0x4F",
         "0x42",
         "0x4F",
         "0x05",
         "0x07",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x01",
      ]);
      add("cwk", [
         "0x06",
         "0x07",
         "0xE1",
         "0x00",
         "0x42",
         "0x4F",
         "0x42",
         "0x4F",
         "0x06",
         "0x07",
         "0xE1",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x00",
         "0x01",
      ]);
      add("toast", ["0x45", "0x52", "0x02", "0x00", "0x00", "0x00"]);
      add("toast", ["0x8B", "0x45", "0x52", "0x02", "0x00", "0x00", "0x00"]);
      add("dmg", ["0x78", "0x01", "0x73", "0x0D", "0x62", "0x62", "0x60"]);
      add("xar", ["0x78", "0x61", "0x72", "0x21"]);
      add("dat", ["0x50", "0x4D", "0x4F", "0x43", "0x43", "0x4D", "0x4F", "0x43"]);
      add("nes", ["0x4E", "0x45", "0x53", "0x1A"]);
      add(
         "tar",
         ["0x75", "0x73", "0x74", "0x61", "0x72", "0x00", "0x30", "0x30"],
         {
            // As per Mozilla documentation available at:
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
            // or wikipedia page:
            // https://en.wikipedia.org/wiki/List_of_archive_formats
            mime: "application/x-tar",
            extension: "tar",
         },
         257,
      );
      add(
         "tar",
         ["0x75", "0x73", "0x74", "0x61", "0x72", "0x20", "0x20", "0x00"],
         {
            mime: "application/x-tar",
            extension: "tar",
         },
         257,
      );
      add("tox", ["0x74", "0x6F", "0x78", "0x33"]);
      add("mlv", ["0x4D", "0x4C", "0x56", "0x49"]);
      add("windowsupdate", ["0x44", "0x43", "0x4D", "0x01", "0x50", "0x41", "0x33", "0x30"]);
      add("7z", ["0x37", "0x7A", "0xBC", "0xAF", "0x27", "0x1C"], {
         mime: "application/x-7z-compressed",
         extension: "7z",
      });
      add("gz", ["0x1F", "0x8B"], { mime: "application/gzip", extension: "gz" });
      add("tar.gz", ["0x1F", "0x8B"], {
         mime: "application/gzip",
         extension: "tar.gz",
      });
      add("xz", ["0xFD", "0x37", "0x7A", "0x58", "0x5A", "0x00", "0x00"], {
         mime: "application/gzip",
         extension: "xz",
      });
      add("tar.xz", ["0xFD", "0x37", "0x7A", "0x58", "0x5A", "0x00", "0x00"], {
         mime: "application/gzip",
         extension: "tar.xz",
      });
      add("lz2", ["0x04", "0x22", "0x4D", "0x18"]);
      add("cab", ["0x4D", "0x53", "0x43", "0x46"]);
      add("mkv", ["0x1A", "0x45", "0xDF", "0xA3"], {
         mime: "video/x-matroska",
         extension: "mkv",
      });
      add("mka", ["0x1A", "0x45", "0xDF", "0xA3"], {
         mime: "audio/x-matroska",
         extension: "mka",
      });
      add("mks", ["0x1A", "0x45", "0xDF", "0xA3"], {
         mime: "video/x-matroska",
         extension: "mks",
      });
      add("mk3d", ["0x1A", "0x45", "0xDF", "0xA3"]);
      add("webm", ["0x1A", "0x45", "0xDF", "0xA3"], {
         mime: "audio/webm",
         extension: "webm",
      });
      add("dcm", ["0x44", "0x49", "0x43", "0x4D"], void 0, 128);
      add("xml", ["0x3C", "0x3f", "0x78", "0x6d", "0x6C", "0x20"], {
         mime: "application/xml",
         extension: "xml",
      });
      add("wasm", ["0x00", "0x61", "0x73", "0x6d"], {
         mime: "application/wasm",
         extension: "wasm",
      });
      add("lep", ["0xCF", "0x84", "0x01"]);
      add("swf", ["0x43", "0x57", "0x53"], {
         mime: "application/x-shockwave-flash",
         extension: "swf",
      });
      add("swf", ["0x46", "0x57", "0x53"], {
         mime: "application/x-shockwave-flash",
         extension: "swf",
      });
      add("deb", ["0x21", "0x3C", "0x61", "0x72", "0x63", "0x68", "0x3E"]);
      add("rtf", ["0x7B", "0x5C", "0x72", "0x74", "0x66", "0x31"], {
         mime: "application/rtf",
         extension: "rtf",
      });
      add("m2p", ["0x00", "0x00", "0x01", "0xBA"]);
      add("vob", ["0x00", "0x00", "0x01", "0xBA"]);
      add("mpg", ["0x00", "0x00", "0x01", "0xBA"], {
         mime: "video/mpeg",
         extension: "mpg",
      });
      add("mpeg", ["0x00", "0x00", "0x01", "0xBA"], {
         mime: "video/mpeg",
         extension: "mpeg",
      });
      add("mpeg", ["0x47"], { mime: "video/mpeg", extension: "mpeg" });
      add("mpeg", ["0x00", "0x00", "0x01", "0xB3"], {
         mime: "video/mpeg",
         extension: "mpeg",
      });
      add(
         "mov",
         ["0x66", "0x72", "0x65", "0x65"],
         {
            mime: "video/quicktime",
            extension: "mov",
         },
         4,
      );
      add(
         "mov",
         ["0x6D", "0x64", "0x61", "0x74"],
         {
            mime: "video/quicktime",
            extension: "mov",
         },
         4,
      );
      add(
         "mov",
         ["0x6D", "0x6F", "0x6F", "0x76"],
         {
            mime: "video/quicktime",
            extension: "mov",
         },
         4,
      );
      add(
         "mov",
         ["0x77", "0x69", "0x64", "0x65"],
         {
            mime: "video/quicktime",
            extension: "mov",
         },
         4,
      );
      add(
         "mov",
         ["0x66", "0x74", "0x79", "0x70", "0x71", "0x74"],
         {
            mime: "video/quicktime",
            extension: "mov",
         },
         4,
      );
      add("hl2demo", ["0x48", "0x4C", "0x32", "0x44", "0x45", "0x4D", "0x4F"]);
      add("txt", ["0xEF", "0xBB", "0xBF"], {
         mime: "text/plain; charset=UTF-8",
         extension: "txt",
      });
      add("txt", ["0xFF", "0xFE"], {
         mime: "text/plain; charset=UTF-16LE",
         extension: "txt",
      });
      add("txt", ["0xFE", "0xFF"], {
         mime: "text/plain; charset=UTF-16BE",
         extension: "txt",
      });
      add("txt", ["0xFF", "0xFE", "0x00", "0x00"], {
         mime: "text/plain; charset=UTF-32LE",
         extension: "txt",
      });
      add("txt", ["0x00", "0x00", "0xFE", "0xFF"], {
         mime: "text/plain; charset=UTF-32BE",
         extension: "txt",
      });
      add("SubRip", ["0x31", "0x0D", "0x0A", "0x30", "0x30", "0x3A"], {
         mime: "application/x-subrip",
         extension: "srt",
      });
      add("WebVTT", ["0xEF", "0xBB", "0xBF", "0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x0A"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0xEF", "0xBB", "0xBF", "0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x0D"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0xEF", "0xBB", "0xBF", "0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x20"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0xEF", "0xBB", "0xBF", "0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x09"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x0A"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x0D"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x20"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("WebVTT", ["0x57", "0x45", "0x42", "0x56", "0x54", "0x54", "0x09"], {
         mime: "text/vtt",
         extension: "vtt",
      });
      add("Json", ["0x7B"], {
         mime: "application/json",
         extension: ".json",
      });
      add("Json", ["0x5B"], {
         mime: "application/json",
         extension: ".json",
      });
      add("ELF", ["0x7F", "0x45", "0x4C", "0x46"], {
         mime: "application/x-executable",
         extension: ".elf",
      });
      add("Mach-O", ["0xFE", "0xED", "0xFA", "0xC"], {
         mime: "application/x-mach-binary",
         extension: ".o",
      });
      add("Mach-O", ["0xFE", "0xED", "0xFA", "0xCF"], {
         mime: "application/x-executable",
         extension: "elf",
      });
      add("EML", ["0x52", "0x65", "0x63", "0x65", "0x69", "0x76", "0x65", "0x64", "0x3A"], {
         mime: "message/rfc822",
         extension: ".eml",
      });
      add("SVG", ["0x3c", "0x73", "0x76", "0x67"], {
         mime: "image/svg+xml",
         extension: "svg",
      });
      exports.default = () => tree;
   },
});

// ../../node_modules/magic-bytes.js/dist/index.js
var require_dist = __commonJS({
   "../../node_modules/magic-bytes.js/dist/index.js"(exports) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      var __importDefault =
         (exports && exports.__importDefault) ||
         function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
         };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.filetypeextension = exports.filetypemime = exports.filetypename = exports.filetypeinfo = void 0;
      var pattern_tree_1 = __importDefault(require_pattern_tree());
      var toHex_1 = require_toHex();
      var patternTree = pattern_tree_1.default();
      var filetypeinfo2 = bytes => {
         let tree = patternTree;
         for (const k2 of Object.keys(tree.offset)) {
            const offset = toHex_1.fromHex(k2);
            const offsetExceedsFile = offset >= bytes.length;
            if (offsetExceedsFile) {
               continue;
            }
            const node = patternTree.offset[k2];
            const guessed = walkTree(offset, bytes, node);
            if (guessed.length > 0) {
               return guessed;
            }
         }
         if (tree.noOffset === null) {
            return [];
         }
         return walkTree(0, bytes, tree.noOffset);
      };
      exports.filetypeinfo = filetypeinfo2;
      var walkTree = (index, bytes, node) => {
         let step = node;
         let guessFile = [];
         while (true) {
            const currentByte = toHex_1.toHex(bytes[index]);
            if (step.bytes["?"] && !step.bytes[currentByte]) {
               step = step.bytes["?"];
            } else {
               step = step.bytes[currentByte];
            }
            if (!step) {
               return guessFile;
            }
            if (step && step.matches) {
               guessFile = step.matches.slice(0);
            }
            index += 1;
         }
      };
      exports.default = exports.filetypeinfo;
      var filetypename = bytes => exports.filetypeinfo(bytes).map(e => e.typename);
      exports.filetypename = filetypename;
      var filetypemime = bytes =>
         exports
            .filetypeinfo(bytes)
            .map(e => (e.mime ? e.mime : null))
            .filter(x => x !== null);
      exports.filetypemime = filetypemime;
      var filetypeextension = bytes =>
         exports
            .filetypeinfo(bytes)
            .map(e => (e.extension ? e.extension : null))
            .filter(x => x !== null);
      exports.filetypeextension = filetypeextension;
   },
});

// ../../node_modules/@prisma/client/runtime/wasm.js
var require_wasm = __commonJS({
   "../../node_modules/@prisma/client/runtime/wasm.js"(exports, module) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      var vo = Object.create;
      var Rt2 = Object.defineProperty;
      var To = Object.getOwnPropertyDescriptor;
      var Co = Object.getOwnPropertyNames;
      var Ro = Object.getPrototypeOf;
      var Ao = Object.prototype.hasOwnProperty;
      var se = (e, t) => () => (e && (t = e((e = 0))), t);
      var _e2 = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
      var At2 = (e, t) => {
         for (var r in t) Rt2(e, r, { get: t[r], enumerable: true });
      };
      var Wr2 = (e, t, r, n) => {
         if ((t && typeof t == "object") || typeof t == "function")
            for (let i of Co(t))
               !Ao.call(e, i) && i !== r && Rt2(e, i, { get: () => t[i], enumerable: !(n = To(t, i)) || n.enumerable });
         return e;
      };
      var De2 = (e, t, r) => (
         (r = e != null ? vo(Ro(e)) : {}), Wr2(t || !e || !e.__esModule ? Rt2(r, "default", { value: e, enumerable: true }) : r, e)
      );
      var So = e => Wr2(Rt2({}, "__esModule", { value: true }), e);
      function cr(e, t) {
         if (((t = t.toLowerCase()), t === "utf8" || t === "utf-8")) return new h(Lo.encode(e));
         if (t === "base64" || t === "base64url")
            return (
               (e = e.replace(/-/g, "+").replace(/_/g, "/")),
               (e = e.replace(/[^A-Za-z0-9+/]/g, "")),
               new h([...atob(e)].map(r => r.charCodeAt(0)))
            );
         if (t === "binary" || t === "ascii" || t === "latin1" || t === "latin-1") return new h([...e].map(r => r.charCodeAt(0)));
         if (t === "ucs2" || t === "ucs-2" || t === "utf16le" || t === "utf-16le") {
            let r = new h(e.length * 2),
               n = new DataView(r.buffer);
            for (let i = 0; i < e.length; i++) n.setUint16(i * 2, e.charCodeAt(i), true);
            return r;
         }
         if (t === "hex") {
            let r = new h(e.length / 2);
            for (let n = 0, i = 0; i < e.length; i += 2, n++) r[n] = parseInt(e.slice(i, i + 2), 16);
            return r;
         }
         Hr2(`encoding "${t}"`);
      }
      function Oo(e) {
         let r = Object.getOwnPropertyNames(DataView.prototype).filter(a => a.startsWith("get") || a.startsWith("set")),
            n = r.map(a => a.replace("get", "read").replace("set", "write")),
            i = (a, u2) =>
               function (y = 0) {
                  return $(y, "offset"), Y(y, "offset"), q2(y, "offset", this.length - 1), new DataView(this.buffer)[r[a]](y, u2);
               },
            o2 = (a, u2) =>
               function (y, T2 = 0) {
                  let C = r[a].match(/set(\w+\d+)/)[1].toLowerCase(),
                     O = Mo[C];
                  return (
                     $(T2, "offset"),
                     Y(T2, "offset"),
                     q2(T2, "offset", this.length - 1),
                     ko(y, "value", O[0], O[1]),
                     new DataView(this.buffer)[r[a]](T2, y, u2),
                     T2 + parseInt(r[a].match(/\d+/)[0]) / 8
                  );
               },
            s = a => {
               a.forEach(u2 => {
                  u2.includes("Uint") && (e[u2.replace("Uint", "UInt")] = e[u2]),
                     u2.includes("Float64") && (e[u2.replace("Float64", "Double")] = e[u2]),
                     u2.includes("Float32") && (e[u2.replace("Float32", "Float")] = e[u2]);
               });
            };
         n.forEach((a, u2) => {
            a.startsWith("read") && ((e[a] = i(u2, false)), (e[a + "LE"] = i(u2, true)), (e[a + "BE"] = i(u2, false))),
               a.startsWith("write") && ((e[a] = o2(u2, false)), (e[a + "LE"] = o2(u2, true)), (e[a + "BE"] = o2(u2, false))),
               s([a, a + "LE", a + "BE"]);
         });
      }
      function Hr2(e) {
         throw new Error(`Buffer polyfill does not implement "${e}"`);
      }
      function St(e, t) {
         if (!(e instanceof Uint8Array)) throw new TypeError(`The "${t}" argument must be an instance of Buffer or Uint8Array`);
      }
      function q2(e, t, r = Do + 1) {
         if (e < 0 || e > r) {
            let n = new RangeError(`The value of "${t}" is out of range. It must be >= 0 && <= ${r}. Received ${e}`);
            throw ((n.code = "ERR_OUT_OF_RANGE"), n);
         }
      }
      function $(e, t) {
         if (typeof e != "number") {
            let r = new TypeError(`The "${t}" argument must be of type number. Received type ${typeof e}.`);
            throw ((r.code = "ERR_INVALID_ARG_TYPE"), r);
         }
      }
      function Y(e, t) {
         if (!Number.isInteger(e) || Number.isNaN(e)) {
            let r = new RangeError(`The value of "${t}" is out of range. It must be an integer. Received ${e}`);
            throw ((r.code = "ERR_OUT_OF_RANGE"), r);
         }
      }
      function ko(e, t, r, n) {
         if (e < r || e > n) {
            let i = new RangeError(`The value of "${t}" is out of range. It must be >= ${r} and <= ${n}. Received ${e}`);
            throw ((i.code = "ERR_OUT_OF_RANGE"), i);
         }
      }
      function Kr(e, t) {
         if (typeof e != "string") {
            let r = new TypeError(`The "${t}" argument must be of type string. Received type ${typeof e}`);
            throw ((r.code = "ERR_INVALID_ARG_TYPE"), r);
         }
      }
      function Fo(e, t = "utf8") {
         return h.from(e, t);
      }
      var h;
      var Mo;
      var Lo;
      var Io;
      var _o;
      var Do;
      var b;
      var mr;
      var c2 = se(() => {
         "use strict";
         h = class e extends Uint8Array {
            constructor() {
               super(...arguments);
               this._isBuffer = true;
            }
            get offset() {
               return this.byteOffset;
            }
            static alloc(r, n = 0, i = "utf8") {
               return Kr(i, "encoding"), e.allocUnsafe(r).fill(n, i);
            }
            static allocUnsafe(r) {
               return e.from(r);
            }
            static allocUnsafeSlow(r) {
               return e.from(r);
            }
            static isBuffer(r) {
               return r && !!r._isBuffer;
            }
            static byteLength(r, n = "utf8") {
               if (typeof r == "string") return cr(r, n).byteLength;
               if (r && r.byteLength) return r.byteLength;
               let i = new TypeError('The "string" argument must be of type string or an instance of Buffer or ArrayBuffer.');
               throw ((i.code = "ERR_INVALID_ARG_TYPE"), i);
            }
            static isEncoding(r) {
               return _o.includes(r);
            }
            static compare(r, n) {
               St(r, "buff1"), St(n, "buff2");
               for (let i = 0; i < r.length; i++) {
                  if (r[i] < n[i]) return -1;
                  if (r[i] > n[i]) return 1;
               }
               return r.length === n.length ? 0 : r.length > n.length ? 1 : -1;
            }
            static from(r, n = "utf8") {
               if (r && typeof r == "object" && r.type === "Buffer") return new e(r.data);
               if (typeof r == "number") return new e(new Uint8Array(r));
               if (typeof r == "string") return cr(r, n);
               if (ArrayBuffer.isView(r)) {
                  let { byteOffset: i, byteLength: o2, buffer: s } = r;
                  return "map" in r && typeof r.map == "function"
                     ? new e(
                          r.map(a => a % 256),
                          i,
                          o2,
                       )
                     : new e(s, i, o2);
               }
               if (r && typeof r == "object" && ("length" in r || "byteLength" in r || "buffer" in r)) return new e(r);
               throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
            }
            static concat(r, n) {
               if (r.length === 0) return e.alloc(0);
               let i = [].concat(...r.map(s => [...s])),
                  o2 = e.alloc(n !== void 0 ? n : i.length);
               return o2.set(n !== void 0 ? i.slice(0, n) : i), o2;
            }
            slice(r = 0, n = this.length) {
               return this.subarray(r, n);
            }
            subarray(r = 0, n = this.length) {
               return Object.setPrototypeOf(super.subarray(r, n), e.prototype);
            }
            reverse() {
               return super.reverse(), this;
            }
            readIntBE(r, n) {
               $(r, "offset"), Y(r, "offset"), q2(r, "offset", this.length - 1), $(n, "byteLength"), Y(n, "byteLength");
               let i = new DataView(this.buffer, r, n),
                  o2 = 0;
               for (let s = 0; s < n; s++) o2 = o2 * 256 + i.getUint8(s);
               return i.getUint8(0) & 128 && (o2 -= Math.pow(256, n)), o2;
            }
            readIntLE(r, n) {
               $(r, "offset"), Y(r, "offset"), q2(r, "offset", this.length - 1), $(n, "byteLength"), Y(n, "byteLength");
               let i = new DataView(this.buffer, r, n),
                  o2 = 0;
               for (let s = 0; s < n; s++) o2 += i.getUint8(s) * Math.pow(256, s);
               return i.getUint8(n - 1) & 128 && (o2 -= Math.pow(256, n)), o2;
            }
            readUIntBE(r, n) {
               $(r, "offset"), Y(r, "offset"), q2(r, "offset", this.length - 1), $(n, "byteLength"), Y(n, "byteLength");
               let i = new DataView(this.buffer, r, n),
                  o2 = 0;
               for (let s = 0; s < n; s++) o2 = o2 * 256 + i.getUint8(s);
               return o2;
            }
            readUintBE(r, n) {
               return this.readUIntBE(r, n);
            }
            readUIntLE(r, n) {
               $(r, "offset"), Y(r, "offset"), q2(r, "offset", this.length - 1), $(n, "byteLength"), Y(n, "byteLength");
               let i = new DataView(this.buffer, r, n),
                  o2 = 0;
               for (let s = 0; s < n; s++) o2 += i.getUint8(s) * Math.pow(256, s);
               return o2;
            }
            readUintLE(r, n) {
               return this.readUIntLE(r, n);
            }
            writeIntBE(r, n, i) {
               return (r = r < 0 ? r + Math.pow(256, i) : r), this.writeUIntBE(r, n, i);
            }
            writeIntLE(r, n, i) {
               return (r = r < 0 ? r + Math.pow(256, i) : r), this.writeUIntLE(r, n, i);
            }
            writeUIntBE(r, n, i) {
               $(n, "offset"), Y(n, "offset"), q2(n, "offset", this.length - 1), $(i, "byteLength"), Y(i, "byteLength");
               let o2 = new DataView(this.buffer, n, i);
               for (let s = i - 1; s >= 0; s--) o2.setUint8(s, r & 255), (r = r / 256);
               return n + i;
            }
            writeUintBE(r, n, i) {
               return this.writeUIntBE(r, n, i);
            }
            writeUIntLE(r, n, i) {
               $(n, "offset"), Y(n, "offset"), q2(n, "offset", this.length - 1), $(i, "byteLength"), Y(i, "byteLength");
               let o2 = new DataView(this.buffer, n, i);
               for (let s = 0; s < i; s++) o2.setUint8(s, r & 255), (r = r / 256);
               return n + i;
            }
            writeUintLE(r, n, i) {
               return this.writeUIntLE(r, n, i);
            }
            toJSON() {
               return { type: "Buffer", data: Array.from(this) };
            }
            swap16() {
               let r = new DataView(this.buffer, this.byteOffset, this.byteLength);
               for (let n = 0; n < this.length; n += 2) r.setUint16(n, r.getUint16(n, true), false);
               return this;
            }
            swap32() {
               let r = new DataView(this.buffer, this.byteOffset, this.byteLength);
               for (let n = 0; n < this.length; n += 4) r.setUint32(n, r.getUint32(n, true), false);
               return this;
            }
            swap64() {
               let r = new DataView(this.buffer, this.byteOffset, this.byteLength);
               for (let n = 0; n < this.length; n += 8) r.setBigUint64(n, r.getBigUint64(n, true), false);
               return this;
            }
            compare(r, n = 0, i = r.length, o2 = 0, s = this.length) {
               return (
                  St(r, "target"),
                  $(n, "targetStart"),
                  $(i, "targetEnd"),
                  $(o2, "sourceStart"),
                  $(s, "sourceEnd"),
                  q2(n, "targetStart"),
                  q2(i, "targetEnd", r.length),
                  q2(o2, "sourceStart"),
                  q2(s, "sourceEnd", this.length),
                  e.compare(this.slice(o2, s), r.slice(n, i))
               );
            }
            equals(r) {
               return St(r, "otherBuffer"), this.length === r.length && this.every((n, i) => n === r[i]);
            }
            copy(r, n = 0, i = 0, o2 = this.length) {
               q2(n, "targetStart"), q2(i, "sourceStart", this.length), q2(o2, "sourceEnd"), (n >>>= 0), (i >>>= 0), (o2 >>>= 0);
               let s = 0;
               for (; i < o2 && !(this[i] === void 0 || r[n] === void 0); ) (r[n] = this[i]), s++, i++, n++;
               return s;
            }
            write(r, n, i, o2 = "utf8") {
               let s = typeof n == "string" ? 0 : (n ?? 0),
                  a = typeof i == "string" ? this.length - s : (i ?? this.length - s);
               return (
                  (o2 = typeof n == "string" ? n : typeof i == "string" ? i : o2),
                  $(s, "offset"),
                  $(a, "length"),
                  q2(s, "offset", this.length),
                  q2(a, "length", this.length),
                  (o2 === "ucs2" || o2 === "ucs-2" || o2 === "utf16le" || o2 === "utf-16le") && (a = a - (a % 2)),
                  cr(r, o2).copy(this, s, 0, a)
               );
            }
            fill(r = 0, n = 0, i = this.length, o2 = "utf-8") {
               let s = typeof n == "string" ? 0 : n,
                  a = typeof i == "string" ? this.length : i;
               if (
                  ((o2 = typeof n == "string" ? n : typeof i == "string" ? i : o2),
                  (r = e.from(typeof r == "number" ? [r] : (r ?? []), o2)),
                  Kr(o2, "encoding"),
                  q2(s, "offset", this.length),
                  q2(a, "end", this.length),
                  r.length !== 0)
               )
                  for (let u2 = s; u2 < a; u2 += r.length)
                     super.set(r.slice(0, r.length + u2 >= this.length ? this.length - u2 : r.length), u2);
               return this;
            }
            includes(r, n = null, i = "utf-8") {
               return this.indexOf(r, n, i) !== -1;
            }
            lastIndexOf(r, n = null, i = "utf-8") {
               return this.indexOf(r, n, i, true);
            }
            indexOf(r, n = null, i = "utf-8", o2 = false) {
               let s = o2 ? this.findLastIndex.bind(this) : this.findIndex.bind(this);
               i = typeof n == "string" ? n : i;
               let a = e.from(typeof r == "number" ? [r] : r, i),
                  u2 = typeof n == "string" ? 0 : n;
               return (
                  (u2 = typeof n == "number" ? u2 : null),
                  (u2 = Number.isNaN(u2) ? null : u2),
                  (u2 ??= o2 ? this.length : 0),
                  (u2 = u2 < 0 ? this.length + u2 : u2),
                  a.length === 0 && o2 === false
                     ? u2 >= this.length
                        ? this.length
                        : u2
                     : a.length === 0 && o2 === true
                       ? (u2 >= this.length ? this.length : u2) || this.length
                       : s((y, T2) => (o2 ? T2 <= u2 : T2 >= u2) && this[T2] === a[0] && a.every((O, A) => this[T2 + A] === O))
               );
            }
            toString(r = "utf8", n = 0, i = this.length) {
               if (((n = n < 0 ? 0 : n), (r = r.toString().toLowerCase()), i <= 0)) return "";
               if (r === "utf8" || r === "utf-8") return Io.decode(this.slice(n, i));
               if (r === "base64" || r === "base64url") {
                  let o2 = btoa(this.reduce((s, a) => s + mr(a), ""));
                  return r === "base64url" ? o2.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : o2;
               }
               if (r === "binary" || r === "ascii" || r === "latin1" || r === "latin-1")
                  return this.slice(n, i).reduce((o2, s) => o2 + mr(s & (r === "ascii" ? 127 : 255)), "");
               if (r === "ucs2" || r === "ucs-2" || r === "utf16le" || r === "utf-16le") {
                  let o2 = new DataView(this.buffer.slice(n, i));
                  return Array.from({ length: o2.byteLength / 2 }, (s, a) =>
                     a * 2 + 1 < o2.byteLength ? mr(o2.getUint16(a * 2, true)) : "",
                  ).join("");
               }
               if (r === "hex") return this.slice(n, i).reduce((o2, s) => o2 + s.toString(16).padStart(2, "0"), "");
               Hr2(`encoding "${r}"`);
            }
            toLocaleString() {
               return this.toString();
            }
            inspect() {
               return `<Buffer ${this.toString("hex")
                  .match(/.{1,2}/g)
                  .join(" ")}>`;
            }
         };
         (Mo = {
            int8: [-128, 127],
            int16: [-32768, 32767],
            int32: [-2147483648, 2147483647],
            uint8: [0, 255],
            uint16: [0, 65535],
            uint32: [0, 4294967295],
            float32: [-1 / 0, 1 / 0],
            float64: [-1 / 0, 1 / 0],
            bigint64: [-0x8000000000000000n, 0x7fffffffffffffffn],
            biguint64: [0n, 0xffffffffffffffffn],
         }),
            (Lo = new TextEncoder()),
            (Io = new TextDecoder()),
            (_o = [
               "utf8",
               "utf-8",
               "hex",
               "base64",
               "ascii",
               "binary",
               "base64url",
               "ucs2",
               "ucs-2",
               "utf16le",
               "utf-16le",
               "latin1",
               "latin-1",
            ]),
            (Do = 4294967295);
         Oo(h.prototype);
         (b = new Proxy(Fo, {
            construct(e, [t, r]) {
               return h.from(t, r);
            },
            get(e, t) {
               return h[t];
            },
         })),
            (mr = String.fromCodePoint);
      });
      var g;
      var m2 = se(() => {
         "use strict";
         g = {
            nextTick: (e, ...t) => {
               setTimeout(() => {
                  e(...t);
               }, 0);
            },
            env: {},
            version: "",
            cwd: () => "/",
            stderr: {},
            argv: ["/bin/node"],
         };
      });
      var x;
      var p = se(() => {
         "use strict";
         x =
            globalThis.performance ??
            (() => {
               let e = Date.now();
               return { now: () => Date.now() - e };
            })();
      });
      var E;
      var d = se(() => {
         "use strict";
         E = () => {};
         E.prototype = E;
      });
      var w;
      var f2 = se(() => {
         "use strict";
         w = class {
            constructor(t) {
               this.value = t;
            }
            deref() {
               return this.value;
            }
         };
      });
      function Zr2(e, t) {
         var r,
            n,
            i,
            o2,
            s,
            a,
            u2,
            y,
            T2 = e.constructor,
            C = T2.precision;
         if (!e.s || !t.s) return t.s || (t = new T2(e)), U ? D2(t, C) : t;
         if (((u2 = e.d), (y = t.d), (s = e.e), (i = t.e), (u2 = u2.slice()), (o2 = s - i), o2)) {
            for (
               o2 < 0 ? ((n = u2), (o2 = -o2), (a = y.length)) : ((n = y), (i = s), (a = u2.length)),
                  s = Math.ceil(C / N2),
                  a = s > a ? s + 1 : a + 1,
                  o2 > a && ((o2 = a), (n.length = 1)),
                  n.reverse();
               o2--;

            )
               n.push(0);
            n.reverse();
         }
         for (a = u2.length, o2 = y.length, a - o2 < 0 && ((o2 = a), (n = y), (y = u2), (u2 = n)), r = 0; o2; )
            (r = ((u2[--o2] = u2[o2] + y[o2] + r) / j) | 0), (u2[o2] %= j);
         for (r && (u2.unshift(r), ++i), a = u2.length; u2[--a] == 0; ) u2.pop();
         return (t.d = u2), (t.e = i), U ? D2(t, C) : t;
      }
      function le2(e, t, r) {
         if (e !== ~~e || e < t || e > r) throw Error(Ae + e);
      }
      function ae(e) {
         var t,
            r,
            n,
            i = e.length - 1,
            o2 = "",
            s = e[0];
         if (i > 0) {
            for (o2 += s, t = 1; t < i; t++) (n = e[t] + ""), (r = N2 - n.length), r && (o2 += Ee(r)), (o2 += n);
            (s = e[t]), (n = s + ""), (r = N2 - n.length), r && (o2 += Ee(r));
         } else if (s === 0) return "0";
         for (; s % 10 === 0; ) s /= 10;
         return o2 + s;
      }
      function en(e, t) {
         var r,
            n,
            i,
            o2,
            s,
            a,
            u2 = 0,
            y = 0,
            T2 = e.constructor,
            C = T2.precision;
         if (V2(e) > 16) throw Error(dr2 + V2(e));
         if (!e.s) return new T2(Z);
         for (t == null ? ((U = false), (a = C)) : (a = t), s = new T2(0.03125); e.abs().gte(0.1); ) (e = e.times(s)), (y += 5);
         for (n = ((Math.log(Re(2, y)) / Math.LN10) * 2 + 5) | 0, a += n, r = i = o2 = new T2(Z), T2.precision = a; ; ) {
            if (
               ((i = D2(i.times(e), a)), (r = r.times(++u2)), (s = o2.plus(ge(i, r, a))), ae(s.d).slice(0, a) === ae(o2.d).slice(0, a))
            ) {
               for (; y--; ) o2 = D2(o2.times(o2), a);
               return (T2.precision = C), t == null ? ((U = true), D2(o2, C)) : o2;
            }
            o2 = s;
         }
      }
      function V2(e) {
         for (var t = e.e * N2, r = e.d[0]; r >= 10; r /= 10) t++;
         return t;
      }
      function pr(e, t, r) {
         if (t > e.LN10.sd()) throw ((U = true), r && (e.precision = r), Error(re + "LN10 precision limit exceeded"));
         return D2(new e(e.LN10), t);
      }
      function Ee(e) {
         for (var t = ""; e--; ) t += "0";
         return t;
      }
      function et(e, t) {
         var r,
            n,
            i,
            o2,
            s,
            a,
            u2,
            y,
            T2,
            C = 1,
            O = 10,
            A = e,
            M = A.d,
            S = A.constructor,
            L = S.precision;
         if (A.s < 1) throw Error(re + (A.s ? "NaN" : "-Infinity"));
         if (A.eq(Z)) return new S(0);
         if ((t == null ? ((U = false), (y = L)) : (y = t), A.eq(10))) return t == null && (U = true), pr(S, y);
         if (((y += O), (S.precision = y), (r = ae(M)), (n = r.charAt(0)), (o2 = V2(A)), Math.abs(o2) < 15e14)) {
            for (; (n < 7 && n != 1) || (n == 1 && r.charAt(1) > 3); ) (A = A.times(e)), (r = ae(A.d)), (n = r.charAt(0)), C++;
            (o2 = V2(A)), n > 1 ? ((A = new S("0." + r)), o2++) : (A = new S(n + "." + r.slice(1)));
         } else
            return (
               (u2 = pr(S, y + 2, L).times(o2 + "")),
               (A = et(new S(n + "." + r.slice(1)), y - O).plus(u2)),
               (S.precision = L),
               t == null ? ((U = true), D2(A, L)) : A
            );
         for (a = s = A = ge(A.minus(Z), A.plus(Z), y), T2 = D2(A.times(A), y), i = 3; ; ) {
            if (((s = D2(s.times(T2), y)), (u2 = a.plus(ge(s, new S(i), y))), ae(u2.d).slice(0, y) === ae(a.d).slice(0, y)))
               return (
                  (a = a.times(2)),
                  o2 !== 0 && (a = a.plus(pr(S, y + 2, L).times(o2 + ""))),
                  (a = ge(a, new S(C), y)),
                  (S.precision = L),
                  t == null ? ((U = true), D2(a, L)) : a
               );
            (a = u2), (i += 2);
         }
      }
      function zr2(e, t) {
         var r, n, i;
         for (
            (r = t.indexOf(".")) > -1 && (t = t.replace(".", "")),
               (n = t.search(/e/i)) > 0
                  ? (r < 0 && (r = n), (r += +t.slice(n + 1)), (t = t.substring(0, n)))
                  : r < 0 && (r = t.length),
               n = 0;
            t.charCodeAt(n) === 48;

         )
            ++n;
         for (i = t.length; t.charCodeAt(i - 1) === 48; ) --i;
         if (((t = t.slice(n, i)), t)) {
            if (((i -= n), (r = r - n - 1), (e.e = Ne(r / N2)), (e.d = []), (n = (r + 1) % N2), r < 0 && (n += N2), n < i)) {
               for (n && e.d.push(+t.slice(0, n)), i -= N2; n < i; ) e.d.push(+t.slice(n, (n += N2)));
               (t = t.slice(n)), (n = N2 - t.length);
            } else n -= i;
            for (; n--; ) t += "0";
            if ((e.d.push(+t), U && (e.e > Ot || e.e < -Ot))) throw Error(dr2 + r);
         } else (e.s = 0), (e.e = 0), (e.d = [0]);
         return e;
      }
      function D2(e, t, r) {
         var n,
            i,
            o2,
            s,
            a,
            u2,
            y,
            T2,
            C = e.d;
         for (s = 1, o2 = C[0]; o2 >= 10; o2 /= 10) s++;
         if (((n = t - s), n < 0)) (n += N2), (i = t), (y = C[(T2 = 0)]);
         else {
            if (((T2 = Math.ceil((n + 1) / N2)), (o2 = C.length), T2 >= o2)) return e;
            for (y = o2 = C[T2], s = 1; o2 >= 10; o2 /= 10) s++;
            (n %= N2), (i = n - N2 + s);
         }
         if (
            (r !== void 0 &&
               ((o2 = Re(10, s - i - 1)),
               (a = (y / o2) % 10 | 0),
               (u2 = t < 0 || C[T2 + 1] !== void 0 || y % o2),
               (u2 =
                  r < 4
                     ? (a || u2) && (r == 0 || r == (e.s < 0 ? 3 : 2))
                     : a > 5 ||
                       (a == 5 &&
                          (r == 4 ||
                             u2 ||
                             (r == 6 && (n > 0 ? (i > 0 ? y / Re(10, s - i) : 0) : C[T2 - 1]) % 10 & 1) ||
                             r == (e.s < 0 ? 8 : 7))))),
            t < 1 || !C[0])
         )
            return (
               u2
                  ? ((o2 = V2(e)), (C.length = 1), (t = t - o2 - 1), (C[0] = Re(10, (N2 - (t % N2)) % N2)), (e.e = Ne(-t / N2) || 0))
                  : ((C.length = 1), (C[0] = e.e = e.s = 0)),
               e
            );
         if (
            (n == 0
               ? ((C.length = T2), (o2 = 1), T2--)
               : ((C.length = T2 + 1), (o2 = Re(10, N2 - n)), (C[T2] = i > 0 ? ((y / Re(10, s - i)) % Re(10, i) | 0) * o2 : 0)),
            u2)
         )
            for (;;)
               if (T2 == 0) {
                  (C[0] += o2) == j && ((C[0] = 1), ++e.e);
                  break;
               } else {
                  if (((C[T2] += o2), C[T2] != j)) break;
                  (C[T2--] = 0), (o2 = 1);
               }
         for (n = C.length; C[--n] === 0; ) C.pop();
         if (U && (e.e > Ot || e.e < -Ot)) throw Error(dr2 + V2(e));
         return e;
      }
      function tn(e, t) {
         var r,
            n,
            i,
            o2,
            s,
            a,
            u2,
            y,
            T2,
            C,
            O = e.constructor,
            A = O.precision;
         if (!e.s || !t.s) return t.s ? (t.s = -t.s) : (t = new O(e)), U ? D2(t, A) : t;
         if (((u2 = e.d), (C = t.d), (n = t.e), (y = e.e), (u2 = u2.slice()), (s = y - n), s)) {
            for (
               T2 = s < 0,
                  T2 ? ((r = u2), (s = -s), (a = C.length)) : ((r = C), (n = y), (a = u2.length)),
                  i = Math.max(Math.ceil(A / N2), a) + 2,
                  s > i && ((s = i), (r.length = 1)),
                  r.reverse(),
                  i = s;
               i--;

            )
               r.push(0);
            r.reverse();
         } else {
            for (i = u2.length, a = C.length, T2 = i < a, T2 && (a = i), i = 0; i < a; i++)
               if (u2[i] != C[i]) {
                  T2 = u2[i] < C[i];
                  break;
               }
            s = 0;
         }
         for (T2 && ((r = u2), (u2 = C), (C = r), (t.s = -t.s)), a = u2.length, i = C.length - a; i > 0; --i) u2[a++] = 0;
         for (i = C.length; i > s; ) {
            if (u2[--i] < C[i]) {
               for (o2 = i; o2 && u2[--o2] === 0; ) u2[o2] = j - 1;
               --u2[o2], (u2[i] += j);
            }
            u2[i] -= C[i];
         }
         for (; u2[--a] === 0; ) u2.pop();
         for (; u2[0] === 0; u2.shift()) --n;
         return u2[0] ? ((t.d = u2), (t.e = n), U ? D2(t, A) : t) : new O(0);
      }
      function Se(e, t, r) {
         var n,
            i = V2(e),
            o2 = ae(e.d),
            s = o2.length;
         return (
            t
               ? (r && (n = r - s) > 0
                    ? (o2 = o2.charAt(0) + "." + o2.slice(1) + Ee(n))
                    : s > 1 && (o2 = o2.charAt(0) + "." + o2.slice(1)),
                 (o2 = o2 + (i < 0 ? "e" : "e+") + i))
               : i < 0
                 ? ((o2 = "0." + Ee(-i - 1) + o2), r && (n = r - s) > 0 && (o2 += Ee(n)))
                 : i >= s
                   ? ((o2 += Ee(i + 1 - s)), r && (n = r - i - 1) > 0 && (o2 = o2 + "." + Ee(n)))
                   : ((n = i + 1) < s && (o2 = o2.slice(0, n) + "." + o2.slice(n)),
                     r && (n = r - s) > 0 && (i + 1 === s && (o2 += "."), (o2 += Ee(n)))),
            e.s < 0 ? "-" + o2 : o2
         );
      }
      function Yr(e, t) {
         if (e.length > t) return (e.length = t), true;
      }
      function rn(e) {
         var t, r, n;
         function i(o2) {
            var s = this;
            if (!(s instanceof i)) return new i(o2);
            if (((s.constructor = i), o2 instanceof i)) {
               (s.s = o2.s), (s.e = o2.e), (s.d = (o2 = o2.d) ? o2.slice() : o2);
               return;
            }
            if (typeof o2 == "number") {
               if (o2 * 0 !== 0) throw Error(Ae + o2);
               if (o2 > 0) s.s = 1;
               else if (o2 < 0) (o2 = -o2), (s.s = -1);
               else {
                  (s.s = 0), (s.e = 0), (s.d = [0]);
                  return;
               }
               if (o2 === ~~o2 && o2 < 1e7) {
                  (s.e = 0), (s.d = [o2]);
                  return;
               }
               return zr2(s, o2.toString());
            } else if (typeof o2 != "string") throw Error(Ae + o2);
            if ((o2.charCodeAt(0) === 45 ? ((o2 = o2.slice(1)), (s.s = -1)) : (s.s = 1), Uo.test(o2))) zr2(s, o2);
            else throw Error(Ae + o2);
         }
         if (
            ((i.prototype = R),
            (i.ROUND_UP = 0),
            (i.ROUND_DOWN = 1),
            (i.ROUND_CEIL = 2),
            (i.ROUND_FLOOR = 3),
            (i.ROUND_HALF_UP = 4),
            (i.ROUND_HALF_DOWN = 5),
            (i.ROUND_HALF_EVEN = 6),
            (i.ROUND_HALF_CEIL = 7),
            (i.ROUND_HALF_FLOOR = 8),
            (i.clone = rn),
            (i.config = i.set = Bo),
            e === void 0 && (e = {}),
            e)
         )
            for (n = ["precision", "rounding", "toExpNeg", "toExpPos", "LN10"], t = 0; t < n.length; )
               e.hasOwnProperty((r = n[t++])) || (e[r] = this[r]);
         return i.config(e), i;
      }
      function Bo(e) {
         if (!e || typeof e != "object") throw Error(re + "Object expected");
         var t,
            r,
            n,
            i = ["precision", 1, Fe2, "rounding", 0, 8, "toExpNeg", -1 / 0, 0, "toExpPos", 0, 1 / 0];
         for (t = 0; t < i.length; t += 3)
            if ((n = e[(r = i[t])]) !== void 0)
               if (Ne(n) === n && n >= i[t + 1] && n <= i[t + 2]) this[r] = n;
               else throw Error(Ae + r + ": " + n);
         if ((n = e[(r = "LN10")]) !== void 0)
            if (n == Math.LN10) this[r] = new this(n);
            else throw Error(Ae + r + ": " + n);
         return this;
      }
      var Fe2;
      var No;
      var fr;
      var U;
      var re;
      var Ae;
      var dr2;
      var Ne;
      var Re;
      var Uo;
      var Z;
      var j;
      var N2;
      var Xr2;
      var Ot;
      var R;
      var ge;
      var fr;
      var kt;
      var nn = se(() => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         (Fe2 = 1e9),
            (No = {
               precision: 20,
               rounding: 4,
               toExpNeg: -7,
               toExpPos: 21,
               LN10: "2.302585092994045684017991454684364207601101488628772976033327900967572609677352480235997205089598298341967784042286",
            }),
            (U = true),
            (re = "[DecimalError] "),
            (Ae = re + "Invalid argument: "),
            (dr2 = re + "Exponent out of range: "),
            (Ne = Math.floor),
            (Re = Math.pow),
            (Uo = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i),
            (j = 1e7),
            (N2 = 7),
            (Xr2 = 9007199254740991),
            (Ot = Ne(Xr2 / N2)),
            (R = {});
         R.absoluteValue = R.abs = function () {
            var e = new this.constructor(this);
            return e.s && (e.s = 1), e;
         };
         R.comparedTo = R.cmp = function (e) {
            var t,
               r,
               n,
               i,
               o2 = this;
            if (((e = new o2.constructor(e)), o2.s !== e.s)) return o2.s || -e.s;
            if (o2.e !== e.e) return (o2.e > e.e) ^ (o2.s < 0) ? 1 : -1;
            for (n = o2.d.length, i = e.d.length, t = 0, r = n < i ? n : i; t < r; ++t)
               if (o2.d[t] !== e.d[t]) return (o2.d[t] > e.d[t]) ^ (o2.s < 0) ? 1 : -1;
            return n === i ? 0 : (n > i) ^ (o2.s < 0) ? 1 : -1;
         };
         R.decimalPlaces = R.dp = function () {
            var e = this,
               t = e.d.length - 1,
               r = (t - e.e) * N2;
            if (((t = e.d[t]), t)) for (; t % 10 == 0; t /= 10) r--;
            return r < 0 ? 0 : r;
         };
         R.dividedBy = R.div = function (e) {
            return ge(this, new this.constructor(e));
         };
         R.dividedToIntegerBy = R.idiv = function (e) {
            var t = this,
               r = t.constructor;
            return D2(ge(t, new r(e), 0, 1), r.precision);
         };
         R.equals = R.eq = function (e) {
            return !this.cmp(e);
         };
         R.exponent = function () {
            return V2(this);
         };
         R.greaterThan = R.gt = function (e) {
            return this.cmp(e) > 0;
         };
         R.greaterThanOrEqualTo = R.gte = function (e) {
            return this.cmp(e) >= 0;
         };
         R.isInteger = R.isint = function () {
            return this.e > this.d.length - 2;
         };
         R.isNegative = R.isneg = function () {
            return this.s < 0;
         };
         R.isPositive = R.ispos = function () {
            return this.s > 0;
         };
         R.isZero = function () {
            return this.s === 0;
         };
         R.lessThan = R.lt = function (e) {
            return this.cmp(e) < 0;
         };
         R.lessThanOrEqualTo = R.lte = function (e) {
            return this.cmp(e) < 1;
         };
         R.logarithm = R.log = function (e) {
            var t,
               r = this,
               n = r.constructor,
               i = n.precision,
               o2 = i + 5;
            if (e === void 0) e = new n(10);
            else if (((e = new n(e)), e.s < 1 || e.eq(Z))) throw Error(re + "NaN");
            if (r.s < 1) throw Error(re + (r.s ? "NaN" : "-Infinity"));
            return r.eq(Z) ? new n(0) : ((U = false), (t = ge(et(r, o2), et(e, o2), o2)), (U = true), D2(t, i));
         };
         R.minus = R.sub = function (e) {
            var t = this;
            return (e = new t.constructor(e)), t.s == e.s ? tn(t, e) : Zr2(t, ((e.s = -e.s), e));
         };
         R.modulo = R.mod = function (e) {
            var t,
               r = this,
               n = r.constructor,
               i = n.precision;
            if (((e = new n(e)), !e.s)) throw Error(re + "NaN");
            return r.s ? ((U = false), (t = ge(r, e, 0, 1).times(e)), (U = true), r.minus(t)) : D2(new n(r), i);
         };
         R.naturalExponential = R.exp = function () {
            return en(this);
         };
         R.naturalLogarithm = R.ln = function () {
            return et(this);
         };
         R.negated = R.neg = function () {
            var e = new this.constructor(this);
            return (e.s = -e.s || 0), e;
         };
         R.plus = R.add = function (e) {
            var t = this;
            return (e = new t.constructor(e)), t.s == e.s ? Zr2(t, e) : tn(t, ((e.s = -e.s), e));
         };
         R.precision = R.sd = function (e) {
            var t,
               r,
               n,
               i = this;
            if (e !== void 0 && e !== !!e && e !== 1 && e !== 0) throw Error(Ae + e);
            if (((t = V2(i) + 1), (n = i.d.length - 1), (r = n * N2 + 1), (n = i.d[n]), n)) {
               for (; n % 10 == 0; n /= 10) r--;
               for (n = i.d[0]; n >= 10; n /= 10) r++;
            }
            return e && t > r ? t : r;
         };
         R.squareRoot = R.sqrt = function () {
            var e,
               t,
               r,
               n,
               i,
               o2,
               s,
               a = this,
               u2 = a.constructor;
            if (a.s < 1) {
               if (!a.s) return new u2(0);
               throw Error(re + "NaN");
            }
            for (
               e = V2(a),
                  U = false,
                  i = Math.sqrt(+a),
                  i == 0 || i == 1 / 0
                     ? ((t = ae(a.d)),
                       (t.length + e) % 2 == 0 && (t += "0"),
                       (i = Math.sqrt(t)),
                       (e = Ne((e + 1) / 2) - (e < 0 || e % 2)),
                       i == 1 / 0 ? (t = "5e" + e) : ((t = i.toExponential()), (t = t.slice(0, t.indexOf("e") + 1) + e)),
                       (n = new u2(t)))
                     : (n = new u2(i.toString())),
                  r = u2.precision,
                  i = s = r + 3;
               ;

            )
               if (((o2 = n), (n = o2.plus(ge(a, o2, s + 2)).times(0.5)), ae(o2.d).slice(0, s) === (t = ae(n.d)).slice(0, s))) {
                  if (((t = t.slice(s - 3, s + 1)), i == s && t == "4999")) {
                     if ((D2(o2, r + 1, 0), o2.times(o2).eq(a))) {
                        n = o2;
                        break;
                     }
                  } else if (t != "9999") break;
                  s += 4;
               }
            return (U = true), D2(n, r);
         };
         R.times = R.mul = function (e) {
            var t,
               r,
               n,
               i,
               o2,
               s,
               a,
               u2,
               y,
               T2 = this,
               C = T2.constructor,
               O = T2.d,
               A = (e = new C(e)).d;
            if (!T2.s || !e.s) return new C(0);
            for (
               e.s *= T2.s,
                  r = T2.e + e.e,
                  u2 = O.length,
                  y = A.length,
                  u2 < y && ((o2 = O), (O = A), (A = o2), (s = u2), (u2 = y), (y = s)),
                  o2 = [],
                  s = u2 + y,
                  n = s;
               n--;

            )
               o2.push(0);
            for (n = y; --n >= 0; ) {
               for (t = 0, i = u2 + n; i > n; ) (a = o2[i] + A[n] * O[i - n - 1] + t), (o2[i--] = a % j | 0), (t = (a / j) | 0);
               o2[i] = (o2[i] + t) % j | 0;
            }
            for (; !o2[--s]; ) o2.pop();
            return t ? ++r : o2.shift(), (e.d = o2), (e.e = r), U ? D2(e, C.precision) : e;
         };
         R.toDecimalPlaces = R.todp = function (e, t) {
            var r = this,
               n = r.constructor;
            return (
               (r = new n(r)),
               e === void 0 ? r : (le2(e, 0, Fe2), t === void 0 ? (t = n.rounding) : le2(t, 0, 8), D2(r, e + V2(r) + 1, t))
            );
         };
         R.toExponential = function (e, t) {
            var r,
               n = this,
               i = n.constructor;
            return (
               e === void 0
                  ? (r = Se(n, true))
                  : (le2(e, 0, Fe2),
                    t === void 0 ? (t = i.rounding) : le2(t, 0, 8),
                    (n = D2(new i(n), e + 1, t)),
                    (r = Se(n, true, e + 1))),
               r
            );
         };
         R.toFixed = function (e, t) {
            var r,
               n,
               i = this,
               o2 = i.constructor;
            return e === void 0
               ? Se(i)
               : (le2(e, 0, Fe2),
                 t === void 0 ? (t = o2.rounding) : le2(t, 0, 8),
                 (n = D2(new o2(i), e + V2(i) + 1, t)),
                 (r = Se(n.abs(), false, e + V2(n) + 1)),
                 i.isneg() && !i.isZero() ? "-" + r : r);
         };
         R.toInteger = R.toint = function () {
            var e = this,
               t = e.constructor;
            return D2(new t(e), V2(e) + 1, t.rounding);
         };
         R.toNumber = function () {
            return +this;
         };
         R.toPower = R.pow = function (e) {
            var t,
               r,
               n,
               i,
               o2,
               s,
               a = this,
               u2 = a.constructor,
               y = 12,
               T2 = +(e = new u2(e));
            if (!e.s) return new u2(Z);
            if (((a = new u2(a)), !a.s)) {
               if (e.s < 1) throw Error(re + "Infinity");
               return a;
            }
            if (a.eq(Z)) return a;
            if (((n = u2.precision), e.eq(Z))) return D2(a, n);
            if (((t = e.e), (r = e.d.length - 1), (s = t >= r), (o2 = a.s), s)) {
               if ((r = T2 < 0 ? -T2 : T2) <= Xr2) {
                  for (
                     i = new u2(Z), t = Math.ceil(n / N2 + 4), U = false;
                     r % 2 && ((i = i.times(a)), Yr(i.d, t)), (r = Ne(r / 2)), r !== 0;

                  )
                     (a = a.times(a)), Yr(a.d, t);
                  return (U = true), e.s < 0 ? new u2(Z).div(i) : D2(i, n);
               }
            } else if (o2 < 0) throw Error(re + "NaN");
            return (
               (o2 = o2 < 0 && e.d[Math.max(t, r)] & 1 ? -1 : 1),
               (a.s = 1),
               (U = false),
               (i = e.times(et(a, n + y))),
               (U = true),
               (i = en(i)),
               (i.s = o2),
               i
            );
         };
         R.toPrecision = function (e, t) {
            var r,
               n,
               i = this,
               o2 = i.constructor;
            return (
               e === void 0
                  ? ((r = V2(i)), (n = Se(i, r <= o2.toExpNeg || r >= o2.toExpPos)))
                  : (le2(e, 1, Fe2),
                    t === void 0 ? (t = o2.rounding) : le2(t, 0, 8),
                    (i = D2(new o2(i), e, t)),
                    (r = V2(i)),
                    (n = Se(i, e <= r || r <= o2.toExpNeg, e))),
               n
            );
         };
         R.toSignificantDigits = R.tosd = function (e, t) {
            var r = this,
               n = r.constructor;
            return (
               e === void 0 ? ((e = n.precision), (t = n.rounding)) : (le2(e, 1, Fe2), t === void 0 ? (t = n.rounding) : le2(t, 0, 8)),
               D2(new n(r), e, t)
            );
         };
         R.toString =
            R.valueOf =
            R.val =
            R.toJSON =
            R[Symbol.for("nodejs.util.inspect.custom")] =
               function () {
                  var e = this,
                     t = V2(e),
                     r = e.constructor;
                  return Se(e, t <= r.toExpNeg || t >= r.toExpPos);
               };
         ge = (function () {
            function e(n, i) {
               var o2,
                  s = 0,
                  a = n.length;
               for (n = n.slice(); a--; ) (o2 = n[a] * i + s), (n[a] = o2 % j | 0), (s = (o2 / j) | 0);
               return s && n.unshift(s), n;
            }
            function t(n, i, o2, s) {
               var a, u2;
               if (o2 != s) u2 = o2 > s ? 1 : -1;
               else
                  for (a = u2 = 0; a < o2; a++)
                     if (n[a] != i[a]) {
                        u2 = n[a] > i[a] ? 1 : -1;
                        break;
                     }
               return u2;
            }
            function r(n, i, o2) {
               for (var s = 0; o2--; ) (n[o2] -= s), (s = n[o2] < i[o2] ? 1 : 0), (n[o2] = s * j + n[o2] - i[o2]);
               for (; !n[0] && n.length > 1; ) n.shift();
            }
            return function (n, i, o2, s) {
               var a,
                  u2,
                  y,
                  T2,
                  C,
                  O,
                  A,
                  M,
                  S,
                  L,
                  ne,
                  z2,
                  Ie,
                  k2,
                  Ce,
                  ur,
                  ie,
                  Tt,
                  Ct = n.constructor,
                  Po = n.s == i.s ? 1 : -1,
                  oe2 = n.d,
                  B2 = i.d;
               if (!n.s) return new Ct(n);
               if (!i.s) throw Error(re + "Division by zero");
               for (u2 = n.e - i.e, ie = B2.length, Ce = oe2.length, A = new Ct(Po), M = A.d = [], y = 0; B2[y] == (oe2[y] || 0); )
                  ++y;
               if (
                  (B2[y] > (oe2[y] || 0) && --u2,
                  o2 == null ? (z2 = o2 = Ct.precision) : s ? (z2 = o2 + (V2(n) - V2(i)) + 1) : (z2 = o2),
                  z2 < 0)
               )
                  return new Ct(0);
               if (((z2 = (z2 / N2 + 2) | 0), (y = 0), ie == 1))
                  for (T2 = 0, B2 = B2[0], z2++; (y < Ce || T2) && z2--; y++)
                     (Ie = T2 * j + (oe2[y] || 0)), (M[y] = (Ie / B2) | 0), (T2 = Ie % B2 | 0);
               else {
                  for (
                     T2 = (j / (B2[0] + 1)) | 0,
                        T2 > 1 && ((B2 = e(B2, T2)), (oe2 = e(oe2, T2)), (ie = B2.length), (Ce = oe2.length)),
                        k2 = ie,
                        S = oe2.slice(0, ie),
                        L = S.length;
                     L < ie;

                  )
                     S[L++] = 0;
                  (Tt = B2.slice()), Tt.unshift(0), (ur = B2[0]), B2[1] >= j / 2 && ++ur;
                  do
                     (T2 = 0),
                        (a = t(B2, S, ie, L)),
                        a < 0
                           ? ((ne = S[0]),
                             ie != L && (ne = ne * j + (S[1] || 0)),
                             (T2 = (ne / ur) | 0),
                             T2 > 1
                                ? (T2 >= j && (T2 = j - 1),
                                  (C = e(B2, T2)),
                                  (O = C.length),
                                  (L = S.length),
                                  (a = t(C, S, O, L)),
                                  a == 1 && (T2--, r(C, ie < O ? Tt : B2, O)))
                                : (T2 == 0 && (a = T2 = 1), (C = B2.slice())),
                             (O = C.length),
                             O < L && C.unshift(0),
                             r(S, C, L),
                             a == -1 && ((L = S.length), (a = t(B2, S, ie, L)), a < 1 && (T2++, r(S, ie < L ? Tt : B2, L))),
                             (L = S.length))
                           : a === 0 && (T2++, (S = [0])),
                        (M[y++] = T2),
                        a && S[0] ? (S[L++] = oe2[k2] || 0) : ((S = [oe2[k2]]), (L = 1));
                  while ((k2++ < Ce || S[0] !== void 0) && z2--);
               }
               return M[0] || M.shift(), (A.e = u2), D2(A, s ? o2 + V2(A) + 1 : o2);
            };
         })();
         fr = rn(No);
         Z = new fr(1);
         kt = fr;
      });
      var v2;
      var ue2;
      var l = se(() => {
         "use strict";
         nn();
         (v2 = class extends kt {
            static isDecimal(t) {
               return t instanceof kt;
            }
            static random(t = 20) {
               {
                  let n = crypto.getRandomValues(new Uint8Array(t)).reduce((i, o2) => i + o2, "");
                  return new kt(`0.${n.slice(0, t)}`);
               }
            }
         }),
            (ue2 = v2);
      });
      function $o() {
         return false;
      }
      var Vo;
      var qo;
      var ln;
      var un = se(() => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         (Vo = {}), (qo = { existsSync: $o, promises: Vo }), (ln = qo);
      });
      function Ko(...e) {
         return e.join("/");
      }
      function Ho(...e) {
         return e.join("/");
      }
      var vn;
      var zo;
      var Yo;
      var rt;
      var Tn = se(() => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         (vn = "/"), (zo = { sep: vn }), (Yo = { resolve: Ko, posix: zo, join: Ho, sep: vn }), (rt = Yo);
      });
      var _t2;
      var Rn = se(() => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         _t2 = class {
            constructor() {
               this.events = {};
            }
            on(t, r) {
               return this.events[t] || (this.events[t] = []), this.events[t].push(r), this;
            }
            emit(t, ...r) {
               return this.events[t]
                  ? (this.events[t].forEach(n => {
                       n(...r);
                    }),
                    true)
                  : false;
            }
         };
      });
      var Sn = _e2((Mc, An) => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         An.exports = (e, t = 1, r) => {
            if (((r = { indent: " ", includeEmptyLines: false, ...r }), typeof e != "string"))
               throw new TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof e}\``);
            if (typeof t != "number") throw new TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof t}\``);
            if (typeof r.indent != "string")
               throw new TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof r.indent}\``);
            if (t === 0) return e;
            let n = r.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
            return e.replace(n, r.indent.repeat(t));
         };
      });
      var Mn = _e2((Jc, kn) => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         kn.exports = ({ onlyFirst: e = false } = {}) => {
            let t = [
               "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
               "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
            ].join("|");
            return new RegExp(t, e ? void 0 : "g");
         };
      });
      var In = _e2((Xc, Ln) => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         var ns = Mn();
         Ln.exports = e => (typeof e == "string" ? e.replace(ns(), "") : e);
      });
      var Nn = _e2((Sf, as) => {
         as.exports = {
            name: "@prisma/engines-version",
            version: "5.17.0-31.393aa359c9ad4a4bb28630fb5613f9c281cde053",
            main: "index.js",
            types: "index.d.ts",
            license: "Apache-2.0",
            author: "Tim Suchanek <suchanek@prisma.io>",
            prisma: { enginesVersion: "393aa359c9ad4a4bb28630fb5613f9c281cde053" },
            repository: { type: "git", url: "https://github.com/prisma/engines-wrapper.git", directory: "packages/engines-version" },
            devDependencies: { "@types/node": "18.19.34", typescript: "4.9.5" },
            files: ["index.js", "index.d.ts"],
            scripts: { build: "tsc -d" },
         };
      });
      var Un = _e2(() => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
      });
      var Br = _e2((vC, Oi) => {
         "use strict";
         c2();
         m2();
         p();
         d();
         f2();
         l();
         Oi.exports = (function () {
            function e(t, r, n, i, o2) {
               return t < r || n < r ? (t > n ? n + 1 : t + 1) : i === o2 ? r : r + 1;
            }
            return function (t, r) {
               if (t === r) return 0;
               if (t.length > r.length) {
                  var n = t;
                  (t = r), (r = n);
               }
               for (var i = t.length, o2 = r.length; i > 0 && t.charCodeAt(i - 1) === r.charCodeAt(o2 - 1); ) i--, o2--;
               for (var s = 0; s < i && t.charCodeAt(s) === r.charCodeAt(s); ) s++;
               if (((i -= s), (o2 -= s), i === 0 || o2 < 3)) return o2;
               var a = 0,
                  u2,
                  y,
                  T2,
                  C,
                  O,
                  A,
                  M,
                  S,
                  L,
                  ne,
                  z2,
                  Ie,
                  k2 = [];
               for (u2 = 0; u2 < i; u2++) k2.push(u2 + 1), k2.push(t.charCodeAt(s + u2));
               for (var Ce = k2.length - 1; a < o2 - 3; )
                  for (
                     L = r.charCodeAt(s + (y = a)),
                        ne = r.charCodeAt(s + (T2 = a + 1)),
                        z2 = r.charCodeAt(s + (C = a + 2)),
                        Ie = r.charCodeAt(s + (O = a + 3)),
                        A = a += 4,
                        u2 = 0;
                     u2 < Ce;
                     u2 += 2
                  )
                     (M = k2[u2]),
                        (S = k2[u2 + 1]),
                        (y = e(M, y, T2, L, S)),
                        (T2 = e(y, T2, C, ne, S)),
                        (C = e(T2, C, O, z2, S)),
                        (A = e(C, O, A, Ie, S)),
                        (k2[u2] = A),
                        (O = C),
                        (C = T2),
                        (T2 = y),
                        (y = M);
               for (; a < o2; )
                  for (L = r.charCodeAt(s + (y = a)), A = ++a, u2 = 0; u2 < Ce; u2 += 2)
                     (M = k2[u2]), (k2[u2] = A = e(M, y, A, L, k2[u2 + 1])), (y = M);
               return A;
            };
         })();
      });
      var Wa = {};
      At2(Wa, {
         Debug: () => wr,
         Decimal: () => ue2,
         Extensions: () => gr,
         MetricsClient: () => $e,
         NotFoundError: () => ye,
         PrismaClientInitializationError: () => I,
         PrismaClientKnownRequestError: () => Q2,
         PrismaClientRustPanicError: () => be,
         PrismaClientUnknownRequestError: () => J,
         PrismaClientValidationError: () => G2,
         Public: () => hr,
         Sql: () => X,
         defineDmmfProperty: () => Fn,
         empty: () => $n,
         getPrismaClient: () => wo,
         getRuntime: () => ve2,
         join: () => Bn,
         makeStrictEnum: () => Eo,
         objectEnumValues: () => Nt,
         raw: () => kr,
         sqltag: () => Mr2,
         warnEnvConflicts: () => void 0,
         warnOnce: () => st,
      });
      module.exports = So(Wa);
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var gr = {};
      At2(gr, { defineExtension: () => on3, getExtensionContext: () => sn });
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function on3(e) {
         return typeof e == "function" ? e : t => t.$extends(e);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function sn(e) {
         return e;
      }
      var hr = {};
      At2(hr, { validator: () => an });
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function an(...e) {
         return t => t;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var yr;
      var cn;
      var mn;
      var pn;
      var dn = true;
      typeof g < "u" &&
         (({ FORCE_COLOR: yr, NODE_DISABLE_COLORS: cn, NO_COLOR: mn, TERM: pn } = g.env || {}), (dn = g.stdout && g.stdout.isTTY));
      var jo = { enabled: !cn && mn == null && pn !== "dumb" && ((yr != null && yr !== "0") || dn) };
      function F2(e, t) {
         let r = new RegExp(`\\x1b\\[${t}m`, "g"),
            n = `\x1B[${e}m`,
            i = `\x1B[${t}m`;
         return function (o2) {
            return !jo.enabled || o2 == null ? o2 : n + (~("" + o2).indexOf(i) ? o2.replace(r, i + n) : o2) + i;
         };
      }
      var Xl = F2(0, 0);
      var Mt2 = F2(1, 22);
      var Lt = F2(2, 22);
      var Zl = F2(3, 23);
      var fn = F2(4, 24);
      var eu = F2(7, 27);
      var tu = F2(8, 28);
      var ru = F2(9, 29);
      var nu = F2(30, 39);
      var Ue = F2(31, 39);
      var gn = F2(32, 39);
      var hn = F2(33, 39);
      var yn = F2(34, 39);
      var iu = F2(35, 39);
      var bn = F2(36, 39);
      var ou = F2(37, 39);
      var wn = F2(90, 39);
      var su = F2(90, 39);
      var au = F2(40, 49);
      var lu = F2(41, 49);
      var uu = F2(42, 49);
      var cu = F2(43, 49);
      var mu = F2(44, 49);
      var pu = F2(45, 49);
      var du = F2(46, 49);
      var fu = F2(47, 49);
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Qo = 100;
      var En = ["green", "yellow", "blue", "magenta", "cyan", "red"];
      var It2 = [];
      var xn = Date.now();
      var Jo = 0;
      var br2 = typeof g < "u" ? g.env : {};
      globalThis.DEBUG ??= br2.DEBUG ?? "";
      globalThis.DEBUG_COLORS ??= br2.DEBUG_COLORS ? br2.DEBUG_COLORS === "true" : true;
      var tt = {
         enable(e) {
            typeof e == "string" && (globalThis.DEBUG = e);
         },
         disable() {
            let e = globalThis.DEBUG;
            return (globalThis.DEBUG = ""), e;
         },
         enabled(e) {
            let t = globalThis.DEBUG.split(",").map(i => i.replace(/[.+?^${}()|[\]\\]/g, "\\$&")),
               r = t.some(i => (i === "" || i[0] === "-" ? false : e.match(RegExp(i.split("*").join(".*") + "$")))),
               n = t.some(i => (i === "" || i[0] !== "-" ? false : e.match(RegExp(i.slice(1).split("*").join(".*") + "$"))));
            return r && !n;
         },
         log: (...e) => {
            let [t, r, ...n] = e;
            (console.warn ?? console.log)(`${t} ${r}`, ...n);
         },
         formatters: {},
      };
      function Go(e) {
         let t = { color: En[Jo++ % En.length], enabled: tt.enabled(e), namespace: e, log: tt.log, extend: () => {} },
            r = (...n) => {
               let { enabled: i, namespace: o2, color: s, log: a } = t;
               if ((n.length !== 0 && It2.push([o2, ...n]), It2.length > Qo && It2.shift(), tt.enabled(o2) || i)) {
                  let u2 = n.map(T2 => (typeof T2 == "string" ? T2 : Wo(T2))),
                     y = `+${Date.now() - xn}ms`;
                  (xn = Date.now()), a(o2, ...u2, y);
               }
            };
         return new Proxy(r, { get: (n, i) => t[i], set: (n, i, o2) => (t[i] = o2) });
      }
      var wr = new Proxy(Go, { get: (e, t) => tt[t], set: (e, t, r) => (tt[t] = r) });
      function Wo(e, t = 2) {
         let r = /* @__PURE__ */ new Set();
         return JSON.stringify(
            e,
            (n, i) => {
               if (typeof i == "object" && i !== null) {
                  if (r.has(i)) return "[Circular *]";
                  r.add(i);
               } else if (typeof i == "bigint") return i.toString();
               return i;
            },
            t,
         );
      }
      function Pn() {
         It2.length = 0;
      }
      var ee = wr;
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Er = [
         "darwin",
         "darwin-arm64",
         "debian-openssl-1.0.x",
         "debian-openssl-1.1.x",
         "debian-openssl-3.0.x",
         "rhel-openssl-1.0.x",
         "rhel-openssl-1.1.x",
         "rhel-openssl-3.0.x",
         "linux-arm64-openssl-1.1.x",
         "linux-arm64-openssl-1.0.x",
         "linux-arm64-openssl-3.0.x",
         "linux-arm-openssl-1.1.x",
         "linux-arm-openssl-1.0.x",
         "linux-arm-openssl-3.0.x",
         "linux-musl",
         "linux-musl-openssl-3.0.x",
         "linux-musl-arm64-openssl-1.1.x",
         "linux-musl-arm64-openssl-3.0.x",
         "linux-nixos",
         "linux-static-x64",
         "linux-static-arm64",
         "windows",
         "freebsd11",
         "freebsd12",
         "freebsd13",
         "freebsd14",
         "freebsd15",
         "openbsd",
         "netbsd",
         "arm",
      ];
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Cn = "library";
      function nt(e) {
         let t = Xo();
         return t || (e?.config.engineType === "library" ? "library" : e?.config.engineType === "binary" ? "binary" : Cn);
      }
      function Xo() {
         let e = g.env.PRISMA_CLIENT_ENGINE_TYPE;
         return e === "library" ? "library" : e === "binary" ? "binary" : void 0;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Oe;
      (t => {
         let e;
         (k2 => (
            (k2.findUnique = "findUnique"),
            (k2.findUniqueOrThrow = "findUniqueOrThrow"),
            (k2.findFirst = "findFirst"),
            (k2.findFirstOrThrow = "findFirstOrThrow"),
            (k2.findMany = "findMany"),
            (k2.create = "create"),
            (k2.createMany = "createMany"),
            (k2.createManyAndReturn = "createManyAndReturn"),
            (k2.update = "update"),
            (k2.updateMany = "updateMany"),
            (k2.upsert = "upsert"),
            (k2.delete = "delete"),
            (k2.deleteMany = "deleteMany"),
            (k2.groupBy = "groupBy"),
            (k2.count = "count"),
            (k2.aggregate = "aggregate"),
            (k2.findRaw = "findRaw"),
            (k2.aggregateRaw = "aggregateRaw")
         ))((e = t.ModelAction ||= {}));
      })((Oe ||= {}));
      var ot = {};
      At2(ot, { error: () => ts2, info: () => es2, log: () => Zo, query: () => rs, should: () => On, tags: () => it, warn: () => xr });
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var it = { error: Ue("prisma:error"), warn: hn("prisma:warn"), info: bn("prisma:info"), query: yn("prisma:query") };
      var On = { warn: () => !g.env.PRISMA_DISABLE_WARNINGS };
      function Zo(...e) {
         console.log(...e);
      }
      function xr(e, ...t) {
         On.warn() && console.warn(`${it.warn} ${e}`, ...t);
      }
      function es2(e, ...t) {
         console.info(`${it.info} ${e}`, ...t);
      }
      function ts2(e, ...t) {
         console.error(`${it.error} ${e}`, ...t);
      }
      function rs(e, ...t) {
         console.log(`${it.query} ${e}`, ...t);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Dt(e, t) {
         if (!e)
            throw new Error(
               `${t}. This should never happen. If you see this error, please, open an issue at https://pris.ly/prisma-prisma-bug-report`,
            );
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function he(e, t) {
         throw new Error(t);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Pr(e, t) {
         return Object.prototype.hasOwnProperty.call(e, t);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var vr = (e, t) => e.reduce((r, n) => ((r[t(n)] = n), r), {});
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Be(e, t) {
         let r = {};
         for (let n of Object.keys(e)) r[n] = t(e[n], n);
         return r;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Tr2(e, t) {
         if (e.length === 0) return;
         let r = e[0];
         for (let n = 1; n < e.length; n++) t(r, e[n]) < 0 && (r = e[n]);
         return r;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function K(e, t) {
         Object.defineProperty(e, "name", { value: t, configurable: true });
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var _n = /* @__PURE__ */ new Set();
      var st = (e, t, ...r) => {
         _n.has(e) || (_n.add(e), xr(t, ...r));
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Q2 = class extends Error {
         constructor(t, { code: r, clientVersion: n, meta: i, batchRequestIdx: o2 }) {
            super(t),
               (this.name = "PrismaClientKnownRequestError"),
               (this.code = r),
               (this.clientVersion = n),
               (this.meta = i),
               Object.defineProperty(this, "batchRequestIdx", { value: o2, enumerable: false, writable: true });
         }
         get [Symbol.toStringTag]() {
            return "PrismaClientKnownRequestError";
         }
      };
      K(Q2, "PrismaClientKnownRequestError");
      var ye = class extends Q2 {
         constructor(t, r) {
            super(t, { code: "P2025", clientVersion: r }), (this.name = "NotFoundError");
         }
      };
      K(ye, "NotFoundError");
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var I = class e extends Error {
         constructor(t, r, n) {
            super(t),
               (this.name = "PrismaClientInitializationError"),
               (this.clientVersion = r),
               (this.errorCode = n),
               Error.captureStackTrace(e);
         }
         get [Symbol.toStringTag]() {
            return "PrismaClientInitializationError";
         }
      };
      K(I, "PrismaClientInitializationError");
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var be = class extends Error {
         constructor(t, r) {
            super(t), (this.name = "PrismaClientRustPanicError"), (this.clientVersion = r);
         }
         get [Symbol.toStringTag]() {
            return "PrismaClientRustPanicError";
         }
      };
      K(be, "PrismaClientRustPanicError");
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var J = class extends Error {
         constructor(t, { clientVersion: r, batchRequestIdx: n }) {
            super(t),
               (this.name = "PrismaClientUnknownRequestError"),
               (this.clientVersion = r),
               Object.defineProperty(this, "batchRequestIdx", { value: n, writable: true, enumerable: false });
         }
         get [Symbol.toStringTag]() {
            return "PrismaClientUnknownRequestError";
         }
      };
      K(J, "PrismaClientUnknownRequestError");
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var G2 = class extends Error {
         constructor(r, { clientVersion: n }) {
            super(r);
            this.name = "PrismaClientValidationError";
            this.clientVersion = n;
         }
         get [Symbol.toStringTag]() {
            return "PrismaClientValidationError";
         }
      };
      K(G2, "PrismaClientValidationError");
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var $e = class {
         constructor(t) {
            this._engine = t;
         }
         prometheus(t) {
            return this._engine.metrics({ format: "prometheus", ...t });
         }
         json(t) {
            return this._engine.metrics({ format: "json", ...t });
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function at(e) {
         let t;
         return {
            get() {
               return t || (t = { value: e() }), t.value;
            },
         };
      }
      function Fn(e, t) {
         let r = at(() => is(t));
         Object.defineProperty(e, "dmmf", { get: () => r.get() });
      }
      function is(e) {
         throw new Error("Prisma.dmmf is not available when running in edge runtimes.");
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ft = Symbol();
      var Rr2 = /* @__PURE__ */ new WeakMap();
      var we = class {
         constructor(t) {
            t === Ft
               ? Rr2.set(this, `Prisma.${this._getName()}`)
               : Rr2.set(this, `new Prisma.${this._getNamespace()}.${this._getName()}()`);
         }
         _getName() {
            return this.constructor.name;
         }
         toString() {
            return Rr2.get(this);
         }
      };
      var lt = class extends we {
         _getNamespace() {
            return "NullTypes";
         }
      };
      var ut = class extends lt {};
      Ar2(ut, "DbNull");
      var ct = class extends lt {};
      Ar2(ct, "JsonNull");
      var mt = class extends lt {};
      Ar2(mt, "AnyNull");
      var Nt = {
         classes: { DbNull: ut, JsonNull: ct, AnyNull: mt },
         instances: { DbNull: new ut(Ft), JsonNull: new ct(Ft), AnyNull: new mt(Ft) },
      };
      function Ar2(e, t) {
         Object.defineProperty(e, "name", { value: t, configurable: true });
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function pt(e) {
         return {
            ok: false,
            error: e,
            map() {
               return pt(e);
            },
            flatMap() {
               return pt(e);
            },
         };
      }
      var Sr = class {
         constructor() {
            this.registeredErrors = [];
         }
         consumeError(t) {
            return this.registeredErrors[t];
         }
         registerNewError(t) {
            let r = 0;
            for (; this.registeredErrors[r] !== void 0; ) r++;
            return (this.registeredErrors[r] = { error: t }), r;
         }
      };
      var Or = e => {
         let t = new Sr(),
            r = ke(t, e.startTransaction.bind(e)),
            n = {
               adapterName: e.adapterName,
               errorRegistry: t,
               queryRaw: ke(t, e.queryRaw.bind(e)),
               executeRaw: ke(t, e.executeRaw.bind(e)),
               provider: e.provider,
               startTransaction: async (...i) => (await r(...i)).map(s => os2(t, s)),
            };
         return e.getConnectionInfo && (n.getConnectionInfo = ss2(t, e.getConnectionInfo.bind(e))), n;
      };
      var os2 = (e, t) => ({
         adapterName: t.adapterName,
         provider: t.provider,
         options: t.options,
         queryRaw: ke(e, t.queryRaw.bind(t)),
         executeRaw: ke(e, t.executeRaw.bind(t)),
         commit: ke(e, t.commit.bind(t)),
         rollback: ke(e, t.rollback.bind(t)),
      });
      function ke(e, t) {
         return async (...r) => {
            try {
               return await t(...r);
            } catch (n) {
               let i = e.registerNewError(n);
               return pt({ kind: "GenericJs", id: i });
            }
         };
      }
      function ss2(e, t) {
         return (...r) => {
            try {
               return t(...r);
            } catch (n) {
               let i = e.registerNewError(n);
               return pt({ kind: "GenericJs", id: i });
            }
         };
      }
      var bo = De2(Nn());
      var mO = De2(Un());
      Rn();
      un();
      Tn();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var X = class e {
         constructor(t, r) {
            if (t.length - 1 !== r.length)
               throw t.length === 0
                  ? new TypeError("Expected at least 1 string")
                  : new TypeError(`Expected ${t.length} strings to have ${t.length - 1} values`);
            let n = r.reduce((s, a) => s + (a instanceof e ? a.values.length : 1), 0);
            (this.values = new Array(n)), (this.strings = new Array(n + 1)), (this.strings[0] = t[0]);
            let i = 0,
               o2 = 0;
            for (; i < r.length; ) {
               let s = r[i++],
                  a = t[i];
               if (s instanceof e) {
                  this.strings[o2] += s.strings[0];
                  let u2 = 0;
                  for (; u2 < s.values.length; ) (this.values[o2++] = s.values[u2++]), (this.strings[o2] = s.strings[u2]);
                  this.strings[o2] += a;
               } else (this.values[o2++] = s), (this.strings[o2] = a);
            }
         }
         get sql() {
            let t = this.strings.length,
               r = 1,
               n = this.strings[0];
            for (; r < t; ) n += `?${this.strings[r++]}`;
            return n;
         }
         get statement() {
            let t = this.strings.length,
               r = 1,
               n = this.strings[0];
            for (; r < t; ) n += `:${r}${this.strings[r++]}`;
            return n;
         }
         get text() {
            let t = this.strings.length,
               r = 1,
               n = this.strings[0];
            for (; r < t; ) n += `$${r}${this.strings[r++]}`;
            return n;
         }
         inspect() {
            return { sql: this.sql, statement: this.statement, text: this.text, values: this.values };
         }
      };
      function Bn(e, t = ",", r = "", n = "") {
         if (e.length === 0)
            throw new TypeError("Expected `join([])` to be called with an array of multiple elements, but got an empty array");
         return new X([r, ...Array(e.length - 1).fill(t), n], e);
      }
      function kr(e) {
         return new X([e], []);
      }
      var $n = kr("");
      function Mr2(e, ...t) {
         return new X(e, t);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function dt(e) {
         return {
            getKeys() {
               return Object.keys(e);
            },
            getPropertyValue(t) {
               return e[t];
            },
         };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function H(e, t) {
         return {
            getKeys() {
               return [e];
            },
            getPropertyValue() {
               return t();
            },
         };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ce = class {
         constructor() {
            this._map = /* @__PURE__ */ new Map();
         }
         get(t) {
            return this._map.get(t)?.value;
         }
         set(t, r) {
            this._map.set(t, { value: r });
         }
         getOrCreate(t, r) {
            let n = this._map.get(t);
            if (n) return n.value;
            let i = r();
            return this.set(t, i), i;
         }
      };
      function Me(e) {
         let t = new ce();
         return {
            getKeys() {
               return e.getKeys();
            },
            getPropertyValue(r) {
               return t.getOrCreate(r, () => e.getPropertyValue(r));
            },
            getPropertyDescriptor(r) {
               return e.getPropertyDescriptor?.(r);
            },
         };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ut = { enumerable: true, configurable: true, writable: true };
      function Bt2(e) {
         let t = new Set(e);
         return {
            getOwnPropertyDescriptor: () => Ut,
            has: (r, n) => t.has(n),
            set: (r, n, i) => t.add(n) && Reflect.set(r, n, i),
            ownKeys: () => [...t],
         };
      }
      var Vn = Symbol.for("nodejs.util.inspect.custom");
      function me(e, t) {
         let r = ls2(t),
            n = /* @__PURE__ */ new Set(),
            i = new Proxy(e, {
               get(o2, s) {
                  if (n.has(s)) return o2[s];
                  let a = r.get(s);
                  return a ? a.getPropertyValue(s) : o2[s];
               },
               has(o2, s) {
                  if (n.has(s)) return true;
                  let a = r.get(s);
                  return a ? (a.has?.(s) ?? true) : Reflect.has(o2, s);
               },
               ownKeys(o2) {
                  let s = qn(Reflect.ownKeys(o2), r),
                     a = qn(Array.from(r.keys()), r);
                  return [.../* @__PURE__ */ new Set([...s, ...a, ...n])];
               },
               set(o2, s, a) {
                  return r.get(s)?.getPropertyDescriptor?.(s)?.writable === false ? false : (n.add(s), Reflect.set(o2, s, a));
               },
               getOwnPropertyDescriptor(o2, s) {
                  let a = Reflect.getOwnPropertyDescriptor(o2, s);
                  if (a && !a.configurable) return a;
                  let u2 = r.get(s);
                  return u2 ? (u2.getPropertyDescriptor ? { ...Ut, ...u2?.getPropertyDescriptor(s) } : Ut) : a;
               },
               defineProperty(o2, s, a) {
                  return n.add(s), Reflect.defineProperty(o2, s, a);
               },
            });
         return (
            (i[Vn] = function () {
               let o2 = { ...this };
               return delete o2[Vn], o2;
            }),
            i
         );
      }
      function ls2(e) {
         let t = /* @__PURE__ */ new Map();
         for (let r of e) {
            let n = r.getKeys();
            for (let i of n) t.set(i, r);
         }
         return t;
      }
      function qn(e, t) {
         return e.filter(r => t.get(r)?.has?.(r) ?? true);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Ve(e) {
         return {
            getKeys() {
               return e;
            },
            has() {
               return false;
            },
            getPropertyValue() {},
         };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function $t(e, t) {
         return { batch: e, transaction: t?.kind === "batch" ? { isolationLevel: t.options.isolationLevel } : void 0 };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var qe2 = class {
         constructor(t = 0, r) {
            this.context = r;
            this.lines = [];
            this.currentLine = "";
            this.currentIndent = 0;
            this.currentIndent = t;
         }
         write(t) {
            return typeof t == "string" ? (this.currentLine += t) : t.write(this), this;
         }
         writeJoined(t, r, n = (i, o2) => o2.write(i)) {
            let i = r.length - 1;
            for (let o2 = 0; o2 < r.length; o2++) n(r[o2], this), o2 !== i && this.write(t);
            return this;
         }
         writeLine(t) {
            return this.write(t).newLine();
         }
         newLine() {
            this.lines.push(this.indentedCurrentLine()), (this.currentLine = ""), (this.marginSymbol = void 0);
            let t = this.afterNextNewLineCallback;
            return (this.afterNextNewLineCallback = void 0), t?.(), this;
         }
         withIndent(t) {
            return this.indent(), t(this), this.unindent(), this;
         }
         afterNextNewline(t) {
            return (this.afterNextNewLineCallback = t), this;
         }
         indent() {
            return this.currentIndent++, this;
         }
         unindent() {
            return this.currentIndent > 0 && this.currentIndent--, this;
         }
         addMarginSymbol(t) {
            return (this.marginSymbol = t), this;
         }
         toString() {
            return this.lines.concat(this.indentedCurrentLine()).join(`
`);
         }
         getCurrentLineLength() {
            return this.currentLine.length;
         }
         indentedCurrentLine() {
            let t = this.currentLine.padStart(this.currentLine.length + 2 * this.currentIndent);
            return this.marginSymbol ? this.marginSymbol + t.slice(1) : t;
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function jn(e) {
         return e.substring(0, 1).toLowerCase() + e.substring(1);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function je(e) {
         return e instanceof Date || Object.prototype.toString.call(e) === "[object Date]";
      }
      function Vt(e) {
         return e.toString() !== "Invalid Date";
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      l();
      function Qe(e) {
         return v2.isDecimal(e)
            ? true
            : e !== null &&
                 typeof e == "object" &&
                 typeof e.s == "number" &&
                 typeof e.e == "number" &&
                 typeof e.toFixed == "function" &&
                 Array.isArray(e.d);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ft = class {
         constructor(t, r, n, i, o2) {
            (this.modelName = t), (this.name = r), (this.typeName = n), (this.isList = i), (this.isEnum = o2);
         }
         _toGraphQLInputType() {
            let t = this.isList ? "List" : "",
               r = this.isEnum ? "Enum" : "";
            return `${t}${r}${this.typeName}FieldRefInput<${this.modelName}>`;
         }
      };
      function Je2(e) {
         return e instanceof ft;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var qt = class {
         constructor(t) {
            this.value = t;
         }
         write(t) {
            t.write(this.value);
         }
         markAsError() {
            this.value.markAsError();
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var jt = e => e;
      var Qt = { bold: jt, red: jt, green: jt, dim: jt, enabled: false };
      var Qn = { bold: Mt2, red: Ue, green: gn, dim: Lt, enabled: true };
      var Ge = {
         write(e) {
            e.writeLine(",");
         },
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var pe2 = class {
         constructor(t) {
            this.contents = t;
            this.isUnderlined = false;
            this.color = t2 => t2;
         }
         underline() {
            return (this.isUnderlined = true), this;
         }
         setColor(t) {
            return (this.color = t), this;
         }
         write(t) {
            let r = t.getCurrentLineLength();
            t.write(this.color(this.contents)),
               this.isUnderlined &&
                  t.afterNextNewline(() => {
                     t.write(" ".repeat(r)).writeLine(this.color("~".repeat(this.contents.length)));
                  });
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var xe = class {
         constructor() {
            this.hasError = false;
         }
         markAsError() {
            return (this.hasError = true), this;
         }
      };
      var We = class extends xe {
         constructor() {
            super(...arguments);
            this.items = [];
         }
         addItem(r) {
            return this.items.push(new qt(r)), this;
         }
         getField(r) {
            return this.items[r];
         }
         getPrintWidth() {
            return this.items.length === 0 ? 2 : Math.max(...this.items.map(n => n.value.getPrintWidth())) + 2;
         }
         write(r) {
            if (this.items.length === 0) {
               this.writeEmpty(r);
               return;
            }
            this.writeWithItems(r);
         }
         writeEmpty(r) {
            let n = new pe2("[]");
            this.hasError && n.setColor(r.context.colors.red).underline(), r.write(n);
         }
         writeWithItems(r) {
            let { colors: n } = r.context;
            r
               .writeLine("[")
               .withIndent(() => r.writeJoined(Ge, this.items).newLine())
               .write("]"),
               this.hasError &&
                  r.afterNextNewline(() => {
                     r.writeLine(n.red("~".repeat(this.getPrintWidth())));
                  });
         }
         asObject() {}
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Jn = ": ";
      var Jt2 = class {
         constructor(t, r) {
            this.name = t;
            this.value = r;
            this.hasError = false;
         }
         markAsError() {
            this.hasError = true;
         }
         getPrintWidth() {
            return this.name.length + this.value.getPrintWidth() + Jn.length;
         }
         write(t) {
            let r = new pe2(this.name);
            this.hasError && r.underline().setColor(t.context.colors.red), t.write(r).write(Jn).write(this.value);
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ke2 = class e extends xe {
         constructor() {
            super(...arguments);
            this.fields = {};
            this.suggestions = [];
         }
         addField(r) {
            this.fields[r.name] = r;
         }
         addSuggestion(r) {
            this.suggestions.push(r);
         }
         getField(r) {
            return this.fields[r];
         }
         getDeepField(r) {
            let [n, ...i] = r,
               o2 = this.getField(n);
            if (!o2) return;
            let s = o2;
            for (let a of i) {
               let u2;
               if (
                  (s.value instanceof e ? (u2 = s.value.getField(a)) : s.value instanceof We && (u2 = s.value.getField(Number(a))),
                  !u2)
               )
                  return;
               s = u2;
            }
            return s;
         }
         getDeepFieldValue(r) {
            return r.length === 0 ? this : this.getDeepField(r)?.value;
         }
         hasField(r) {
            return !!this.getField(r);
         }
         removeAllFields() {
            this.fields = {};
         }
         removeField(r) {
            delete this.fields[r];
         }
         getFields() {
            return this.fields;
         }
         isEmpty() {
            return Object.keys(this.fields).length === 0;
         }
         getFieldValue(r) {
            return this.getField(r)?.value;
         }
         getDeepSubSelectionValue(r) {
            let n = this;
            for (let i of r) {
               if (!(n instanceof e)) return;
               let o2 = n.getSubSelectionValue(i);
               if (!o2) return;
               n = o2;
            }
            return n;
         }
         getDeepSelectionParent(r) {
            let n = this.getSelectionParent();
            if (!n) return;
            let i = n;
            for (let o2 of r) {
               let s = i.value.getFieldValue(o2);
               if (!s || !(s instanceof e)) return;
               let a = s.getSelectionParent();
               if (!a) return;
               i = a;
            }
            return i;
         }
         getSelectionParent() {
            let r = this.getField("select")?.value.asObject();
            if (r) return { kind: "select", value: r };
            let n = this.getField("include")?.value.asObject();
            if (n) return { kind: "include", value: n };
         }
         getSubSelectionValue(r) {
            return this.getSelectionParent()?.value.fields[r].value;
         }
         getPrintWidth() {
            let r = Object.values(this.fields);
            return r.length == 0 ? 2 : Math.max(...r.map(i => i.getPrintWidth())) + 2;
         }
         write(r) {
            let n = Object.values(this.fields);
            if (n.length === 0 && this.suggestions.length === 0) {
               this.writeEmpty(r);
               return;
            }
            this.writeWithContents(r, n);
         }
         asObject() {
            return this;
         }
         writeEmpty(r) {
            let n = new pe2("{}");
            this.hasError && n.setColor(r.context.colors.red).underline(), r.write(n);
         }
         writeWithContents(r, n) {
            r.writeLine("{").withIndent(() => {
               r.writeJoined(Ge, [...n, ...this.suggestions]).newLine();
            }),
               r.write("}"),
               this.hasError &&
                  r.afterNextNewline(() => {
                     r.writeLine(r.context.colors.red("~".repeat(this.getPrintWidth())));
                  });
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var W2 = class extends xe {
         constructor(r) {
            super();
            this.text = r;
         }
         getPrintWidth() {
            return this.text.length;
         }
         write(r) {
            let n = new pe2(this.text);
            this.hasError && n.underline().setColor(r.context.colors.red), r.write(n);
         }
         asObject() {}
      };
      var Lr = class {
         constructor(t) {
            this.errorMessages = [];
            this.arguments = t;
         }
         write(t) {
            t.write(this.arguments);
         }
         addErrorMessage(t) {
            this.errorMessages.push(t);
         }
         renderAllMessages(t) {
            return this.errorMessages.map(r => r(t)).join(`
`);
         }
      };
      function He(e) {
         return new Lr(Gn(e));
      }
      function Gn(e) {
         let t = new Ke2();
         for (let [r, n] of Object.entries(e)) {
            let i = new Jt2(r, Wn(n));
            t.addField(i);
         }
         return t;
      }
      function Wn(e) {
         if (typeof e == "string") return new W2(JSON.stringify(e));
         if (typeof e == "number" || typeof e == "boolean") return new W2(String(e));
         if (typeof e == "bigint") return new W2(`${e}n`);
         if (e === null) return new W2("null");
         if (e === void 0) return new W2("undefined");
         if (Qe(e)) return new W2(`new Prisma.Decimal("${e.toFixed()}")`);
         if (e instanceof Uint8Array)
            return b.isBuffer(e) ? new W2(`Buffer.alloc(${e.byteLength})`) : new W2(`new Uint8Array(${e.byteLength})`);
         if (e instanceof Date) {
            let t = Vt(e) ? e.toISOString() : "Invalid Date";
            return new W2(`new Date("${t}")`);
         }
         return e instanceof we
            ? new W2(`Prisma.${e._getName()}`)
            : Je2(e)
              ? new W2(`prisma.${jn(e.modelName)}.$fields.${e.name}`)
              : Array.isArray(e)
                ? cs(e)
                : typeof e == "object"
                  ? Gn(e)
                  : new W2(Object.prototype.toString.call(e));
      }
      function cs(e) {
         let t = new We();
         for (let r of e) t.addItem(Wn(r));
         return t;
      }
      function Gt(e, t) {
         let r = t === "pretty" ? Qn : Qt,
            n = e.renderAllMessages(r),
            i = new qe2(0, { colors: r }).write(e).toString();
         return { message: n, args: i };
      }
      function Kn(e) {
         if (e === void 0) return "";
         let t = He(e);
         return new qe2(0, { colors: Qt }).write(t).toString();
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ms = "P2037";
      function Wt({ error: e, user_facing_error: t }, r, n) {
         return t.error_code
            ? new Q2(ps(t, n), { code: t.error_code, clientVersion: r, meta: t.meta, batchRequestIdx: t.batch_request_idx })
            : new J(e, { clientVersion: r, batchRequestIdx: t.batch_request_idx });
      }
      function ps(e, t) {
         let r = e.message;
         return (
            (t === "postgresql" || t === "postgres" || t === "mysql") &&
               e.error_code === ms &&
               (r += `
Prisma Accelerate has built-in connection pooling to prevent such errors: https://pris.ly/client/error-accelerate`),
            r
         );
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ir2 = class {
         getLocation() {
            return null;
         }
      };
      function Pe(e) {
         return typeof $EnabledCallSite == "function" && e !== "minimal" ? new $EnabledCallSite() : new Ir2();
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Hn = { _avg: true, _count: true, _sum: true, _min: true, _max: true };
      function ze(e = {}) {
         let t = fs(e);
         return Object.entries(t).reduce((n, [i, o2]) => (Hn[i] !== void 0 ? (n.select[i] = { select: o2 }) : (n[i] = o2), n), {
            select: {},
         });
      }
      function fs(e = {}) {
         return typeof e._count == "boolean" ? { ...e, _count: { _all: e._count } } : e;
      }
      function Kt2(e = {}) {
         return t => (typeof e._count == "boolean" && (t._count = t._count._all), t);
      }
      function zn2(e, t) {
         let r = Kt2(e);
         return t({ action: "aggregate", unpacker: r, argsMapper: ze })(e);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function gs2(e = {}) {
         let { select: t, ...r } = e;
         return typeof t == "object" ? ze({ ...r, _count: t }) : ze({ ...r, _count: { _all: true } });
      }
      function hs(e = {}) {
         return typeof e.select == "object" ? t => Kt2(e)(t)._count : t => Kt2(e)(t)._count._all;
      }
      function Yn2(e, t) {
         return t({ action: "count", unpacker: hs(e), argsMapper: gs2 })(e);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function ys(e = {}) {
         let t = ze(e);
         if (Array.isArray(t.by)) for (let r of t.by) typeof r == "string" && (t.select[r] = true);
         else typeof t.by == "string" && (t.select[t.by] = true);
         return t;
      }
      function bs2(e = {}) {
         return t => (
            typeof e?._count == "boolean" &&
               t.forEach(r => {
                  r._count = r._count._all;
               }),
            t
         );
      }
      function Xn(e, t) {
         return t({ action: "groupBy", unpacker: bs2(e), argsMapper: ys })(e);
      }
      function Zn(e, t, r) {
         if (t === "aggregate") return n => zn2(n, r);
         if (t === "count") return n => Yn2(n, r);
         if (t === "groupBy") return n => Xn(n, r);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function ei(e, t) {
         let r = t.fields.filter(i => !i.relationName),
            n = vr(r, i => i.name);
         return new Proxy(
            {},
            {
               get(i, o2) {
                  if (o2 in i || typeof o2 == "symbol") return i[o2];
                  let s = n[o2];
                  if (s) return new ft(e, o2, s.type, s.isList, s.kind === "enum");
               },
               ...Bt2(Object.keys(n)),
            },
         );
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ti = e => (Array.isArray(e) ? e : e.split("."));
      var _r2 = (e, t) => ti(t).reduce((r, n) => r && r[n], e);
      var ri = (e, t, r) => ti(t).reduceRight((n, i, o2, s) => Object.assign({}, _r2(e, s.slice(0, o2)), { [i]: n }), r);
      function ws(e, t) {
         return e === void 0 || t === void 0 ? [] : [...t, "select", e];
      }
      function Es2(e, t, r) {
         return t === void 0 ? (e ?? {}) : ri(t, r, e || true);
      }
      function Dr2(e, t, r, n, i, o2) {
         let a = e._runtimeDataModel.models[t].fields.reduce((u2, y) => ({ ...u2, [y.name]: y }), {});
         return u2 => {
            let y = Pe(e._errorFormat),
               T2 = ws(n, i),
               C = Es2(u2, o2, T2),
               O = r({ dataPath: T2, callsite: y })(C),
               A = xs2(e, t);
            return new Proxy(O, {
               get(M, S) {
                  if (!A.includes(S)) return M[S];
                  let ne = [a[S].type, r, S],
                     z2 = [T2, C];
                  return Dr2(e, ...ne, ...z2);
               },
               ...Bt2([...A, ...Object.getOwnPropertyNames(O)]),
            });
         };
      }
      function xs2(e, t) {
         return e._runtimeDataModel.models[t].fields.filter(r => r.kind === "object").map(r => r.name);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ps = De2(Sn());
      var vs = { red: Ue, gray: wn, dim: Lt, bold: Mt2, underline: fn, highlightSource: e => e.highlight() };
      var Ts = { red: e => e, gray: e => e, dim: e => e, bold: e => e, underline: e => e, highlightSource: e => e };
      function Cs2({ message: e, originalMethod: t, isPanic: r, callArguments: n }) {
         return { functionName: `prisma.${t}()`, message: e, isPanic: r ?? false, callArguments: n };
      }
      function Rs({ functionName: e, location: t, message: r, isPanic: n, contextLines: i, callArguments: o2 }, s) {
         let a = [""],
            u2 = t ? " in" : ":";
         if (
            (n
               ? (a.push(s.red(`Oops, an unknown error occurred! This is ${s.bold("on us")}, you did nothing wrong.`)),
                 a.push(s.red(`It occurred in the ${s.bold(`\`${e}\``)} invocation${u2}`)))
               : a.push(s.red(`Invalid ${s.bold(`\`${e}\``)} invocation${u2}`)),
            t && a.push(s.underline(As2(t))),
            i)
         ) {
            a.push("");
            let y = [i.toString()];
            o2 && (y.push(o2), y.push(s.dim(")"))), a.push(y.join("")), o2 && a.push("");
         } else a.push(""), o2 && a.push(o2), a.push("");
         return (
            a.push(r),
            a.join(`
`)
         );
      }
      function As2(e) {
         let t = [e.fileName];
         return e.lineNumber && t.push(String(e.lineNumber)), e.columnNumber && t.push(String(e.columnNumber)), t.join(":");
      }
      function Ye(e) {
         let t = e.showColors ? vs : Ts,
            r;
         return typeof $getTemplateParameters < "u" ? (r = $getTemplateParameters(e, t)) : (r = Cs2(e)), Rs(r, t);
      }
      function ni(e, t, r, n) {
         return e === Oe.ModelAction.findFirstOrThrow || e === Oe.ModelAction.findUniqueOrThrow ? Ss2(t, r, n) : n;
      }
      function Ss2(e, t, r) {
         return async n => {
            if ("rejectOnNotFound" in n.args) {
               let o2 = Ye({
                  originalMethod: n.clientMethod,
                  callsite: n.callsite,
                  message: "'rejectOnNotFound' option is not supported",
               });
               throw new G2(o2, { clientVersion: t });
            }
            return await r(n).catch(o2 => {
               throw o2 instanceof Q2 && o2.code === "P2025" ? new ye(`No ${e} found`, t) : o2;
            });
         };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function de2(e) {
         return e.replace(/^./, t => t.toLowerCase());
      }
      var Os = ["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "create", "update", "upsert", "delete"];
      var ks = ["aggregate", "count", "groupBy"];
      function Fr2(e, t) {
         let r = e._extensions.getAllModelExtensions(t) ?? {},
            n = [Ms(e, t), Is(e, t), dt(r), H("name", () => t), H("$name", () => t), H("$parent", () => e._appliedParent)];
         return me({}, n);
      }
      function Ms(e, t) {
         let r = de2(t),
            n = Object.keys(Oe.ModelAction).concat("count");
         return {
            getKeys() {
               return n;
            },
            getPropertyValue(i) {
               let o2 = i,
                  s = u2 => e._request(u2);
               s = ni(o2, t, e._clientVersion, s);
               let a = u2 => y => {
                  let T2 = Pe(e._errorFormat);
                  return e._createPrismaPromise(C => {
                     let O = {
                        args: y,
                        dataPath: [],
                        action: o2,
                        model: t,
                        clientMethod: `${r}.${i}`,
                        jsModelName: r,
                        transaction: C,
                        callsite: T2,
                     };
                     return s({ ...O, ...u2 });
                  });
               };
               return Os.includes(o2) ? Dr2(e, t, a) : Ls(i) ? Zn(e, i, a) : a({});
            },
         };
      }
      function Ls(e) {
         return ks.includes(e);
      }
      function Is(e, t) {
         return Me(
            H("fields", () => {
               let r = e._runtimeDataModel.models[t];
               return ei(t, r);
            }),
         );
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function ii(e) {
         return e.replace(/^./, t => t.toUpperCase());
      }
      var Nr2 = Symbol();
      function gt(e) {
         let t = [_s(e), H(Nr2, () => e), H("$parent", () => e._appliedParent)],
            r = e._extensions.getAllClientExtensions();
         return r && t.push(dt(r)), me(e, t);
      }
      function _s(e) {
         let t = Object.keys(e._runtimeDataModel.models),
            r = t.map(de2),
            n = [...new Set(t.concat(r))];
         return Me({
            getKeys() {
               return n;
            },
            getPropertyValue(i) {
               let o2 = ii(i);
               if (e._runtimeDataModel.models[o2] !== void 0) return Fr2(e, o2);
               if (e._runtimeDataModel.models[i] !== void 0) return Fr2(e, i);
            },
            getPropertyDescriptor(i) {
               if (!r.includes(i)) return { enumerable: false };
            },
         });
      }
      function oi(e) {
         return e[Nr2] ? e[Nr2] : e;
      }
      function si(e) {
         if (typeof e == "function") return e(this);
         if (e.client?.__AccelerateEngine) {
            let r = e.client.__AccelerateEngine;
            this._originalClient._engine = new r(this._originalClient._accelerateEngineConfig);
         }
         let t = Object.create(this._originalClient, {
            _extensions: { value: this._extensions.append(e) },
            _appliedParent: { value: this, configurable: true },
            $use: { value: void 0 },
            $on: { value: void 0 },
         });
         return gt(t);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function ai({ result: e, modelName: t, select: r, omit: n, extensions: i }) {
         let o2 = i.getAllComputedFields(t);
         if (!o2) return e;
         let s = [],
            a = [];
         for (let u2 of Object.values(o2)) {
            if (n) {
               if (n[u2.name]) continue;
               let y = u2.needs.filter(T2 => n[T2]);
               y.length > 0 && a.push(Ve(y));
            } else if (r) {
               if (!r[u2.name]) continue;
               let y = u2.needs.filter(T2 => !r[T2]);
               y.length > 0 && a.push(Ve(y));
            }
            Ds(e, u2.needs) && s.push(Fs(u2, me(e, s)));
         }
         return s.length > 0 || a.length > 0 ? me(e, [...s, ...a]) : e;
      }
      function Ds(e, t) {
         return t.every(r => Pr(e, r));
      }
      function Fs(e, t) {
         return Me(H(e.name, () => e.compute(t)));
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Ht2({ visitor: e, result: t, args: r, runtimeDataModel: n, modelName: i }) {
         if (Array.isArray(t)) {
            for (let s = 0; s < t.length; s++) t[s] = Ht2({ result: t[s], args: r, modelName: i, runtimeDataModel: n, visitor: e });
            return t;
         }
         let o2 = e(t, i, r) ?? t;
         return (
            r.include && li({ includeOrSelect: r.include, result: o2, parentModelName: i, runtimeDataModel: n, visitor: e }),
            r.select && li({ includeOrSelect: r.select, result: o2, parentModelName: i, runtimeDataModel: n, visitor: e }),
            o2
         );
      }
      function li({ includeOrSelect: e, result: t, parentModelName: r, runtimeDataModel: n, visitor: i }) {
         for (let [o2, s] of Object.entries(e)) {
            if (!s || t[o2] == null) continue;
            let u2 = n.models[r].fields.find(T2 => T2.name === o2);
            if (!u2 || u2.kind !== "object" || !u2.relationName) continue;
            let y = typeof s == "object" ? s : {};
            t[o2] = Ht2({ visitor: i, result: t[o2], args: y, modelName: u2.type, runtimeDataModel: n });
         }
      }
      function ui({ result: e, modelName: t, args: r, extensions: n, runtimeDataModel: i, globalOmit: o2 }) {
         return n.isEmpty() || e == null || typeof e != "object" || !i.models[t]
            ? e
            : Ht2({
                 result: e,
                 args: r ?? {},
                 modelName: t,
                 runtimeDataModel: i,
                 visitor: (a, u2, y) => {
                    let T2 = de2(u2);
                    return ai({
                       result: a,
                       modelName: T2,
                       select: y.select,
                       omit: y.select ? void 0 : { ...o2?.[T2], ...y.omit },
                       extensions: n,
                    });
                 },
              });
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      l();
      function ci(e) {
         if (e instanceof X) return Ns(e);
         if (Array.isArray(e)) {
            let r = [e[0]];
            for (let n = 1; n < e.length; n++) r[n] = ht(e[n]);
            return r;
         }
         let t = {};
         for (let r in e) t[r] = ht(e[r]);
         return t;
      }
      function Ns(e) {
         return new X(e.strings, e.values);
      }
      function ht(e) {
         if (typeof e != "object" || e == null || e instanceof we || Je2(e)) return e;
         if (Qe(e)) return new ue2(e.toFixed());
         if (je(e)) return /* @__PURE__ */ new Date(+e);
         if (ArrayBuffer.isView(e)) return e.slice(0);
         if (Array.isArray(e)) {
            let t = e.length,
               r;
            for (r = Array(t); t--; ) r[t] = ht(e[t]);
            return r;
         }
         if (typeof e == "object") {
            let t = {};
            for (let r in e)
               r === "__proto__"
                  ? Object.defineProperty(t, r, { value: ht(e[r]), configurable: true, enumerable: true, writable: true })
                  : (t[r] = ht(e[r]));
            return t;
         }
         he(e, "Unknown value");
      }
      function pi(e, t, r, n = 0) {
         return e._createPrismaPromise(i => {
            let o2 = t.customDataProxyFetch;
            return (
               "transaction" in t &&
                  i !== void 0 &&
                  (t.transaction?.kind === "batch" && t.transaction.lock.then(), (t.transaction = i)),
               n === r.length
                  ? e._executeRequest(t)
                  : r[n]({
                       model: t.model,
                       operation: t.model ? t.action : t.clientMethod,
                       args: ci(t.args ?? {}),
                       __internalParams: t,
                       query: (s, a = t) => {
                          let u2 = a.customDataProxyFetch;
                          return (a.customDataProxyFetch = hi(o2, u2)), (a.args = s), pi(e, a, r, n + 1);
                       },
                    })
            );
         });
      }
      function di(e, t) {
         let { jsModelName: r, action: n, clientMethod: i } = t,
            o2 = r ? n : i;
         if (e._extensions.isEmpty()) return e._executeRequest(t);
         let s = e._extensions.getAllQueryCallbacks(r ?? "$none", o2);
         return pi(e, t, s);
      }
      function fi(e) {
         return t => {
            let r = { requests: t },
               n = t[0].extensions.getAllBatchQueryCallbacks();
            return n.length ? gi(r, n, 0, e) : e(r);
         };
      }
      function gi(e, t, r, n) {
         if (r === t.length) return n(e);
         let i = e.customDataProxyFetch,
            o2 = e.requests[0].transaction;
         return t[r]({
            args: {
               queries: e.requests.map(s => ({ model: s.modelName, operation: s.action, args: s.args })),
               transaction: o2 ? { isolationLevel: o2.kind === "batch" ? o2.isolationLevel : void 0 } : void 0,
            },
            __internalParams: e,
            query(s, a = e) {
               let u2 = a.customDataProxyFetch;
               return (a.customDataProxyFetch = hi(i, u2)), gi(a, t, r + 1, n);
            },
         });
      }
      var mi = e => e;
      function hi(e = mi, t = mi) {
         return r => e(t(r));
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function bi(e, t, r) {
         let n = de2(r);
         return !t.result || !(t.result.$allModels || t.result[n])
            ? e
            : Us({ ...e, ...yi(t.name, e, t.result.$allModels), ...yi(t.name, e, t.result[n]) });
      }
      function Us(e) {
         let t = new ce(),
            r = (n, i) => t.getOrCreate(n, () => (i.has(n) ? [n] : (i.add(n), e[n] ? e[n].needs.flatMap(o2 => r(o2, i)) : [n])));
         return Be(e, n => ({ ...n, needs: r(n.name, /* @__PURE__ */ new Set()) }));
      }
      function yi(e, t, r) {
         return r
            ? Be(r, ({ needs: n, compute: i }, o2) => ({
                 name: o2,
                 needs: n ? Object.keys(n).filter(s => n[s]) : [],
                 compute: Bs(t, o2, i),
              }))
            : {};
      }
      function Bs(e, t, r) {
         let n = e?.[t]?.compute;
         return n ? i => r({ ...i, [t]: n(i) }) : r;
      }
      function wi(e, t) {
         if (!t) return e;
         let r = { ...e };
         for (let n of Object.values(t)) if (e[n.name]) for (let i of n.needs) r[i] = true;
         return r;
      }
      function Ei(e, t) {
         if (!t) return e;
         let r = { ...e };
         for (let n of Object.values(t)) if (!e[n.name]) for (let i of n.needs) delete r[i];
         return r;
      }
      var zt = class {
         constructor(t, r) {
            this.extension = t;
            this.previous = r;
            this.computedFieldsCache = new ce();
            this.modelExtensionsCache = new ce();
            this.queryCallbacksCache = new ce();
            this.clientExtensions = at(() =>
               this.extension.client
                  ? { ...this.previous?.getAllClientExtensions(), ...this.extension.client }
                  : this.previous?.getAllClientExtensions(),
            );
            this.batchCallbacks = at(() => {
               let t2 = this.previous?.getAllBatchQueryCallbacks() ?? [],
                  r2 = this.extension.query?.$__internalBatch;
               return r2 ? t2.concat(r2) : t2;
            });
         }
         getAllComputedFields(t) {
            return this.computedFieldsCache.getOrCreate(t, () => bi(this.previous?.getAllComputedFields(t), this.extension, t));
         }
         getAllClientExtensions() {
            return this.clientExtensions.get();
         }
         getAllModelExtensions(t) {
            return this.modelExtensionsCache.getOrCreate(t, () => {
               let r = de2(t);
               return !this.extension.model || !(this.extension.model[r] || this.extension.model.$allModels)
                  ? this.previous?.getAllModelExtensions(t)
                  : { ...this.previous?.getAllModelExtensions(t), ...this.extension.model.$allModels, ...this.extension.model[r] };
            });
         }
         getAllQueryCallbacks(t, r) {
            return this.queryCallbacksCache.getOrCreate(`${t}:${r}`, () => {
               let n = this.previous?.getAllQueryCallbacks(t, r) ?? [],
                  i = [],
                  o2 = this.extension.query;
               return !o2 || !(o2[t] || o2.$allModels || o2[r] || o2.$allOperations)
                  ? n
                  : (o2[t] !== void 0 &&
                       (o2[t][r] !== void 0 && i.push(o2[t][r]), o2[t].$allOperations !== void 0 && i.push(o2[t].$allOperations)),
                    t !== "$none" &&
                       o2.$allModels !== void 0 &&
                       (o2.$allModels[r] !== void 0 && i.push(o2.$allModels[r]),
                       o2.$allModels.$allOperations !== void 0 && i.push(o2.$allModels.$allOperations)),
                    o2[r] !== void 0 && i.push(o2[r]),
                    o2.$allOperations !== void 0 && i.push(o2.$allOperations),
                    n.concat(i));
            });
         }
         getAllBatchQueryCallbacks() {
            return this.batchCallbacks.get();
         }
      };
      var Yt2 = class e {
         constructor(t) {
            this.head = t;
         }
         static empty() {
            return new e();
         }
         static single(t) {
            return new e(new zt(t));
         }
         isEmpty() {
            return this.head === void 0;
         }
         append(t) {
            return new e(new zt(t, this.head));
         }
         getAllComputedFields(t) {
            return this.head?.getAllComputedFields(t);
         }
         getAllClientExtensions() {
            return this.head?.getAllClientExtensions();
         }
         getAllModelExtensions(t) {
            return this.head?.getAllModelExtensions(t);
         }
         getAllQueryCallbacks(t, r) {
            return this.head?.getAllQueryCallbacks(t, r) ?? [];
         }
         getAllBatchQueryCallbacks() {
            return this.head?.getAllBatchQueryCallbacks() ?? [];
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var xi = ee("prisma:client");
      var Pi = { Vercel: "vercel", "Netlify CI": "netlify" };
      function vi({ postinstall: e, ciName: t, clientVersion: r }) {
         if ((xi("checkPlatformCaching:postinstall", e), xi("checkPlatformCaching:ciName", t), e === true && t && t in Pi)) {
            let n = `Prisma has detected that this project was built on ${t}, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered. To fix this, make sure to run the \`prisma generate\` command during the build process.

Learn how: https://pris.ly/d/${Pi[t]}-build`;
            throw (console.error(n), new I(n, r));
         }
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Ti(e, t) {
         return e ? (e.datasources ? e.datasources : e.datasourceUrl ? { [t[0]]: { url: e.datasourceUrl } } : {}) : {};
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var $s = "Cloudflare-Workers";
      var Vs = "node";
      function Ci() {
         return typeof Netlify == "object"
            ? "netlify"
            : typeof EdgeRuntime == "string"
              ? "edge-light"
              : globalThis.navigator?.userAgent === $s
                ? "workerd"
                : globalThis.Deno
                  ? "deno"
                  : globalThis.__lagon__
                    ? "lagon"
                    : globalThis.process?.release?.name === Vs
                      ? "node"
                      : globalThis.Bun
                        ? "bun"
                        : globalThis.fastly
                          ? "fastly"
                          : "unknown";
      }
      var qs = {
         node: "Node.js",
         workerd: "Cloudflare Workers",
         deno: "Deno and Deno Deploy",
         netlify: "Netlify Edge Functions",
         "edge-light":
            "Edge Runtime (Vercel Edge Functions, Vercel Edge Middleware, Next.js (Pages Router) Edge API Routes, Next.js (App Router) Edge Route Handlers or Next.js Middleware)",
      };
      function ve2() {
         let e = Ci();
         return { id: e, prettyName: qs[e] || e, isEdge: ["workerd", "deno", "netlify", "edge-light"].includes(e) };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Xt({ inlineDatasources: e, overrideDatasources: t, env: r, clientVersion: n }) {
         let i,
            o2 = Object.keys(e)[0],
            s = e[o2]?.url,
            a = t[o2]?.url;
         if (
            (o2 === void 0 ? (i = void 0) : a ? (i = a) : s?.value ? (i = s.value) : s?.fromEnvVar && (i = r[s.fromEnvVar]),
            s?.fromEnvVar !== void 0 && i === void 0)
         )
            throw ve2().id === "workerd"
               ? new I(
                    `error: Environment variable not found: ${s.fromEnvVar}.

In Cloudflare module Workers, environment variables are available only in the Worker's \`env\` parameter of \`fetch\`.
To solve this, provide the connection string directly: https://pris.ly/d/cloudflare-datasource-url`,
                    n,
                 )
               : new I(`error: Environment variable not found: ${s.fromEnvVar}.`, n);
         if (i === void 0) throw new I("error: Missing URL environment variable, value, or override.", n);
         return i;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Ri2(e) {
         if (e?.kind === "itx") return e.options.id;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ur;
      var Ai = {
         async loadLibrary(e) {
            let { clientVersion: t, adapter: r, engineWasm: n } = e;
            if (r === void 0)
               throw new I(`The \`adapter\` option for \`PrismaClient\` is required in this context (${ve2().prettyName})`, t);
            if (n === void 0) throw new I("WASM engine was unexpectedly `undefined`", t);
            Ur === void 0 &&
               (Ur = (async () => {
                  let o2 = n.getRuntime(),
                     s = await n.getQueryEngineWasmModule();
                  if (s == null) throw new I("The loaded wasm module was unexpectedly `undefined` or `null` once loaded", t);
                  let a = { "./query_engine_bg.js": o2 },
                     u2 = new WebAssembly.Instance(s, a);
                  return o2.__wbg_set_wasm(u2.exports), o2.QueryEngine;
               })());
            let i = await Ur;
            return {
               debugPanic() {
                  return Promise.reject("{}");
               },
               dmmf() {
                  return Promise.resolve("{}");
               },
               version() {
                  return { commit: "unknown", version: "unknown" };
               },
               QueryEngine: i,
            };
         },
      };
      var js = "P2036";
      var fe = ee("prisma:client:libraryEngine");
      function Qs(e) {
         return e.item_type === "query" && "query" in e;
      }
      function Js(e) {
         return "level" in e ? e.level === "error" && e.message === "PANIC" : false;
      }
      var ET = [...Er, "native"];
      var yt = class {
         constructor(t, r) {
            this.name = "LibraryEngine";
            (this.libraryLoader = r ?? Ai),
               (this.config = t),
               (this.libraryStarted = false),
               (this.logQueries = t.logQueries ?? false),
               (this.logLevel = t.logLevel ?? "error"),
               (this.logEmitter = t.logEmitter),
               (this.datamodel = t.inlineSchema),
               t.enableDebugLogs && (this.logLevel = "debug");
            let n = Object.keys(t.overrideDatasources)[0],
               i = t.overrideDatasources[n]?.url;
            n !== void 0 && i !== void 0 && (this.datasourceOverrides = { [n]: i }),
               (this.libraryInstantiationPromise = this.instantiateLibrary());
         }
         async applyPendingMigrations() {
            throw new Error("Cannot call this method from this type of engine instance");
         }
         async transaction(t, r, n) {
            await this.start();
            let i = JSON.stringify(r),
               o2;
            if (t === "start") {
               let a = JSON.stringify({ max_wait: n.maxWait, timeout: n.timeout, isolation_level: n.isolationLevel });
               o2 = await this.engine?.startTransaction(a, i);
            } else
               t === "commit"
                  ? (o2 = await this.engine?.commitTransaction(n.id, i))
                  : t === "rollback" && (o2 = await this.engine?.rollbackTransaction(n.id, i));
            let s = this.parseEngineResponse(o2);
            if (Gs(s)) {
               let a = this.getExternalAdapterError(s);
               throw a ? a.error : new Q2(s.message, { code: s.error_code, clientVersion: this.config.clientVersion, meta: s.meta });
            }
            return s;
         }
         async instantiateLibrary() {
            if ((fe("internalSetup"), this.libraryInstantiationPromise)) return this.libraryInstantiationPromise;
            (this.binaryTarget = await this.getCurrentBinaryTarget()), await this.loadEngine(), this.version();
         }
         async getCurrentBinaryTarget() {}
         parseEngineResponse(t) {
            if (!t) throw new J("Response from the Engine was empty", { clientVersion: this.config.clientVersion });
            try {
               return JSON.parse(t);
            } catch {
               throw new J("Unable to JSON.parse response from engine", { clientVersion: this.config.clientVersion });
            }
         }
         async loadEngine() {
            if (!this.engine) {
               this.QueryEngineConstructor ||
                  ((this.library = await this.libraryLoader.loadLibrary(this.config)),
                  (this.QueryEngineConstructor = this.library.QueryEngine));
               try {
                  let t = new w(this),
                     { adapter: r } = this.config;
                  r && fe("Using driver adapter: %O", r),
                     (this.engine = new this.QueryEngineConstructor(
                        {
                           datamodel: this.datamodel,
                           env: g.env,
                           logQueries: this.config.logQueries ?? false,
                           ignoreEnvVarErrors: true,
                           datasourceOverrides: this.datasourceOverrides ?? {},
                           logLevel: this.logLevel,
                           configDir: this.config.cwd,
                           engineProtocol: "json",
                        },
                        n => {
                           t.deref()?.logger(n);
                        },
                        r,
                     ));
               } catch (t) {
                  let r = t,
                     n = this.parseInitError(r.message);
                  throw typeof n == "string" ? r : new I(n.message, this.config.clientVersion, n.error_code);
               }
            }
         }
         logger(t) {
            let r = this.parseEngineResponse(t);
            if (r) {
               if ("span" in r) {
                  this.config.tracingHelper.createEngineSpan(r);
                  return;
               }
               (r.level = r?.level.toLowerCase() ?? "unknown"),
                  Qs(r)
                     ? this.logEmitter.emit("query", {
                          timestamp: /* @__PURE__ */ new Date(),
                          query: r.query,
                          params: r.params,
                          duration: Number(r.duration_ms),
                          target: r.module_path,
                       })
                     : (Js(r),
                       this.logEmitter.emit(r.level, {
                          timestamp: /* @__PURE__ */ new Date(),
                          message: r.message,
                          target: r.module_path,
                       }));
            }
         }
         parseInitError(t) {
            try {
               return JSON.parse(t);
            } catch {}
            return t;
         }
         parseRequestError(t) {
            try {
               return JSON.parse(t);
            } catch {}
            return t;
         }
         onBeforeExit() {
            throw new Error(
               '"beforeExit" hook is not applicable to the library engine since Prisma 5.0.0, it is only relevant and implemented for the binary engine. Please add your event listener to the `process` object directly instead.',
            );
         }
         async start() {
            if ((await this.libraryInstantiationPromise, await this.libraryStoppingPromise, this.libraryStartingPromise))
               return fe(`library already starting, this.libraryStarted: ${this.libraryStarted}`), this.libraryStartingPromise;
            if (this.libraryStarted) return;
            let t = async () => {
               fe("library starting");
               try {
                  let r = { traceparent: this.config.tracingHelper.getTraceParent() };
                  await this.engine?.connect(JSON.stringify(r)), (this.libraryStarted = true), fe("library started");
               } catch (r) {
                  let n = this.parseInitError(r.message);
                  throw typeof n == "string" ? r : new I(n.message, this.config.clientVersion, n.error_code);
               } finally {
                  this.libraryStartingPromise = void 0;
               }
            };
            return (this.libraryStartingPromise = this.config.tracingHelper.runInChildSpan("connect", t)), this.libraryStartingPromise;
         }
         async stop() {
            if ((await this.libraryStartingPromise, await this.executingQueryPromise, this.libraryStoppingPromise))
               return fe("library is already stopping"), this.libraryStoppingPromise;
            if (!this.libraryStarted) return;
            let t = async () => {
               await new Promise(n => setTimeout(n, 5)), fe("library stopping");
               let r = { traceparent: this.config.tracingHelper.getTraceParent() };
               await this.engine?.disconnect(JSON.stringify(r)),
                  (this.libraryStarted = false),
                  (this.libraryStoppingPromise = void 0),
                  fe("library stopped");
            };
            return (
               (this.libraryStoppingPromise = this.config.tracingHelper.runInChildSpan("disconnect", t)), this.libraryStoppingPromise
            );
         }
         version() {
            return (this.versionInfo = this.library?.version()), this.versionInfo?.version ?? "unknown";
         }
         debugPanic(t) {
            return this.library?.debugPanic(t);
         }
         async request(t, { traceparent: r, interactiveTransaction: n }) {
            fe(`sending request, this.libraryStarted: ${this.libraryStarted}`);
            let i = JSON.stringify({ traceparent: r }),
               o2 = JSON.stringify(t);
            try {
               await this.start(), (this.executingQueryPromise = this.engine?.query(o2, i, n?.id)), (this.lastQuery = o2);
               let s = this.parseEngineResponse(await this.executingQueryPromise);
               if (s.errors)
                  throw s.errors.length === 1
                     ? this.buildQueryError(s.errors[0])
                     : new J(JSON.stringify(s.errors), { clientVersion: this.config.clientVersion });
               if (this.loggerRustPanic) throw this.loggerRustPanic;
               return { data: s, elapsed: 0 };
            } catch (s) {
               if (s instanceof I) throw s;
               s.code === "GenericFailure" && s.message?.startsWith("PANIC:");
               let a = this.parseRequestError(s.message);
               throw typeof a == "string"
                  ? s
                  : new J(
                       `${a.message}
${a.backtrace}`,
                       { clientVersion: this.config.clientVersion },
                    );
            }
         }
         async requestBatch(t, { transaction: r, traceparent: n }) {
            fe("requestBatch");
            let i = $t(t, r);
            await this.start(),
               (this.lastQuery = JSON.stringify(i)),
               (this.executingQueryPromise = this.engine.query(this.lastQuery, JSON.stringify({ traceparent: n }), Ri2(r)));
            let o2 = await this.executingQueryPromise,
               s = this.parseEngineResponse(o2);
            if (s.errors)
               throw s.errors.length === 1
                  ? this.buildQueryError(s.errors[0])
                  : new J(JSON.stringify(s.errors), { clientVersion: this.config.clientVersion });
            let { batchResult: a, errors: u2 } = s;
            if (Array.isArray(a))
               return a.map(y =>
                  y.errors && y.errors.length > 0
                     ? (this.loggerRustPanic ?? this.buildQueryError(y.errors[0]))
                     : { data: y, elapsed: 0 },
               );
            throw u2 && u2.length === 1 ? new Error(u2[0].error) : new Error(JSON.stringify(s));
         }
         buildQueryError(t) {
            t.user_facing_error.is_panic;
            let r = this.getExternalAdapterError(t.user_facing_error);
            return r ? r.error : Wt(t, this.config.clientVersion, this.config.activeProvider);
         }
         getExternalAdapterError(t) {
            if (t.error_code === js && this.config.adapter) {
               let r = t.meta?.id;
               Dt(typeof r == "number", "Malformed external JS error received from the engine");
               let n = this.config.adapter.errorRegistry.consumeError(r);
               return Dt(n, "External error with reported id was not registered"), n;
            }
         }
         async metrics(t) {
            await this.start();
            let r = await this.engine.metrics(JSON.stringify(t));
            return t.format === "prometheus" ? r : this.parseEngineResponse(r);
         }
      };
      function Gs(e) {
         return typeof e == "object" && e !== null && e.error_code !== void 0;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var bt =
         "Accelerate has not been setup correctly. Make sure your client is using `.$extends(withAccelerate())`. See https://pris.ly/d/accelerate-getting-started";
      var Zt = class {
         constructor(t) {
            this.config = t;
            this.name = "AccelerateEngine";
            this.resolveDatasourceUrl = this.config.accelerateUtils?.resolveDatasourceUrl;
            this.getBatchRequestPayload = this.config.accelerateUtils?.getBatchRequestPayload;
            this.prismaGraphQLToJSError = this.config.accelerateUtils?.prismaGraphQLToJSError;
            this.PrismaClientUnknownRequestError = this.config.accelerateUtils?.PrismaClientUnknownRequestError;
            this.PrismaClientInitializationError = this.config.accelerateUtils?.PrismaClientInitializationError;
            this.PrismaClientKnownRequestError = this.config.accelerateUtils?.PrismaClientKnownRequestError;
            this.debug = this.config.accelerateUtils?.debug;
            this.engineVersion = this.config.accelerateUtils?.engineVersion;
            this.clientVersion = this.config.accelerateUtils?.clientVersion;
         }
         onBeforeExit(t) {}
         async start() {}
         async stop() {}
         version(t) {
            return "unknown";
         }
         transaction(t, r, n) {
            throw new I(bt, this.config.clientVersion);
         }
         metrics(t) {
            throw new I(bt, this.config.clientVersion);
         }
         request(t, r) {
            throw new I(bt, this.config.clientVersion);
         }
         requestBatch(t, r) {
            throw new I(bt, this.config.clientVersion);
         }
         applyPendingMigrations() {
            throw new I(bt, this.config.clientVersion);
         }
      };
      function Si({ copyEngine: e = true }, t) {
         let r;
         try {
            r = Xt({
               inlineDatasources: t.inlineDatasources,
               overrideDatasources: t.overrideDatasources,
               env: { ...t.env, ...g.env },
               clientVersion: t.clientVersion,
            });
         } catch {}
         e &&
            r?.startsWith("prisma://") &&
            st(
               "recommend--no-engine",
               "In production, we recommend using `prisma generate --no-engine` (See: `prisma generate --help`)",
            );
         let n = nt(t.generator),
            i = !!(r?.startsWith("prisma://") || !e),
            o2 = !!t.adapter,
            s = n === "library",
            a = n === "binary";
         if ((i && o2) || (o2 && false)) {
            let u2;
            throw (
               (e
                  ? r?.startsWith("prisma://")
                     ? (u2 = [
                          "Prisma Client was configured to use the `adapter` option but the URL was a `prisma://` URL.",
                          "Please either use the `prisma://` URL or remove the `adapter` from the Prisma Client constructor.",
                       ])
                     : (u2 = ["Prisma Client was configured to use both the `adapter` and Accelerate, please chose one."])
                  : (u2 = [
                       "Prisma Client was configured to use the `adapter` option but `prisma generate` was run with `--no-engine`.",
                       "Please run `prisma generate` without `--no-engine` to be able to use Prisma Client with the adapter.",
                    ]),
               new G2(
                  u2.join(`
`),
                  { clientVersion: t.clientVersion },
               ))
            );
         }
         if (o2) return new yt(t);
         if (i) return new Zt(t);
         {
            let u2 = [
               `PrismaClient failed to initialize because it wasn't configured to run in this environment (${ve2().prettyName}).`,
               "In order to run Prisma Client in an edge runtime, you will need to configure one of the following options:",
               "- Enable Driver Adapters: https://pris.ly/d/driver-adapters",
               "- Enable Accelerate: https://pris.ly/d/accelerate",
            ];
            throw new G2(
               u2.join(`
`),
               { clientVersion: t.clientVersion },
            );
         }
         throw new G2("Invalid client engine type, please use `library` or `binary`", { clientVersion: t.clientVersion });
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function er({ generator: e }) {
         return e?.previewFeatures ?? [];
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Xe2(e) {
         return e.substring(0, 1).toLowerCase() + e.substring(1);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var _i = De2(Br());
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Li(e, t, r) {
         let n = Ii2(e),
            i = Ws(n),
            o2 = Hs(i);
         o2 ? tr(o2, t, r) : t.addErrorMessage(() => "Unknown error");
      }
      function Ii2(e) {
         return e.errors.flatMap(t => (t.kind === "Union" ? Ii2(t) : [t]));
      }
      function Ws(e) {
         let t = /* @__PURE__ */ new Map(),
            r = [];
         for (let n of e) {
            if (n.kind !== "InvalidArgumentType") {
               r.push(n);
               continue;
            }
            let i = `${n.selectionPath.join(".")}:${n.argumentPath.join(".")}`,
               o2 = t.get(i);
            o2
               ? t.set(i, { ...n, argument: { ...n.argument, typeNames: Ks(o2.argument.typeNames, n.argument.typeNames) } })
               : t.set(i, n);
         }
         return r.push(...t.values()), r;
      }
      function Ks(e, t) {
         return [...new Set(e.concat(t))];
      }
      function Hs(e) {
         return Tr2(e, (t, r) => {
            let n = ki(t),
               i = ki(r);
            return n !== i ? n - i : Mi(t) - Mi(r);
         });
      }
      function ki(e) {
         let t = 0;
         return (
            Array.isArray(e.selectionPath) && (t += e.selectionPath.length),
            Array.isArray(e.argumentPath) && (t += e.argumentPath.length),
            t
         );
      }
      function Mi(e) {
         switch (e.kind) {
            case "InvalidArgumentValue":
            case "ValueTooLarge":
               return 20;
            case "InvalidArgumentType":
               return 10;
            case "RequiredArgumentMissing":
               return -10;
            default:
               return 0;
         }
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var te2 = class {
         constructor(t, r) {
            this.name = t;
            this.value = r;
            this.isRequired = false;
         }
         makeRequired() {
            return (this.isRequired = true), this;
         }
         write(t) {
            let {
               colors: { green: r },
            } = t.context;
            t.addMarginSymbol(r(this.isRequired ? "+" : "?")),
               t.write(r(this.name)),
               this.isRequired || t.write(r("?")),
               t.write(r(": ")),
               typeof this.value == "string" ? t.write(r(this.value)) : t.write(this.value);
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var wt = class {
         constructor() {
            this.fields = [];
         }
         addField(t, r) {
            return (
               this.fields.push({
                  write(n) {
                     let { green: i, dim: o2 } = n.context.colors;
                     n.write(i(o2(`${t}: ${r}`))).addMarginSymbol(i(o2("+")));
                  },
               }),
               this
            );
         }
         write(t) {
            let {
               colors: { green: r },
            } = t.context;
            t.writeLine(r("{"))
               .withIndent(() => {
                  t.writeJoined(Ge, this.fields).newLine();
               })
               .write(r("}"))
               .addMarginSymbol(r("+"));
         }
      };
      function tr(e, t, r) {
         switch (e.kind) {
            case "MutuallyExclusiveFields":
               zs(e, t);
               break;
            case "IncludeOnScalar":
               Ys(e, t);
               break;
            case "EmptySelection":
               Xs(e, t, r);
               break;
            case "UnknownSelectionField":
               ra(e, t);
               break;
            case "UnknownArgument":
               na(e, t);
               break;
            case "UnknownInputField":
               ia(e, t);
               break;
            case "RequiredArgumentMissing":
               oa(e, t);
               break;
            case "InvalidArgumentType":
               sa(e, t);
               break;
            case "InvalidArgumentValue":
               aa(e, t);
               break;
            case "ValueTooLarge":
               la(e, t);
               break;
            case "SomeFieldsMissing":
               ua(e, t);
               break;
            case "TooManyFieldsGiven":
               ca(e, t);
               break;
            case "Union":
               Li(e, t, r);
               break;
            default:
               throw new Error("not implemented: " + e.kind);
         }
      }
      function zs(e, t) {
         let r = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         r && (r.getField(e.firstField)?.markAsError(), r.getField(e.secondField)?.markAsError()),
            t.addErrorMessage(
               n =>
                  `Please ${n.bold("either")} use ${n.green(`\`${e.firstField}\``)} or ${n.green(`\`${e.secondField}\``)}, but ${n.red("not both")} at the same time.`,
            );
      }
      function Ys(e, t) {
         let [r, n] = Et(e.selectionPath),
            i = e.outputType,
            o2 = t.arguments.getDeepSelectionParent(r)?.value;
         if (o2 && (o2.getField(n)?.markAsError(), i))
            for (let s of i.fields) s.isRelation && o2.addSuggestion(new te2(s.name, "true"));
         t.addErrorMessage(s => {
            let a = `Invalid scalar field ${s.red(`\`${n}\``)} for ${s.bold("include")} statement`;
            return (
               i ? (a += ` on model ${s.bold(i.name)}. ${xt2(s)}`) : (a += "."),
               (a += `
Note that ${s.bold("include")} statements only accept relation fields.`),
               a
            );
         });
      }
      function Xs(e, t, r) {
         let n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         if (n) {
            let i = n.getField("omit")?.value.asObject();
            if (i) {
               Zs(e, t, i);
               return;
            }
            if (n.hasField("select")) {
               ea(e, t);
               return;
            }
         }
         if (r?.[Xe2(e.outputType.name)]) {
            ta(e, t);
            return;
         }
         t.addErrorMessage(() => `Unknown field at "${e.selectionPath.join(".")} selection"`);
      }
      function Zs(e, t, r) {
         r.removeAllFields();
         for (let n of e.outputType.fields) r.addSuggestion(new te2(n.name, "false"));
         t.addErrorMessage(
            n =>
               `The ${n.red("omit")} statement includes every field of the model ${n.bold(e.outputType.name)}. At least one field must be included in the result`,
         );
      }
      function ea(e, t) {
         let r = e.outputType,
            n = t.arguments.getDeepSelectionParent(e.selectionPath)?.value,
            i = n?.isEmpty() ?? false;
         n && (n.removeAllFields(), Ni(n, r)),
            t.addErrorMessage(o2 =>
               i
                  ? `The ${o2.red("`select`")} statement for type ${o2.bold(r.name)} must not be empty. ${xt2(o2)}`
                  : `The ${o2.red("`select`")} statement for type ${o2.bold(r.name)} needs ${o2.bold("at least one truthy value")}.`,
            );
      }
      function ta(e, t) {
         let r = new wt();
         for (let i of e.outputType.fields) i.isRelation || r.addField(i.name, "false");
         let n = new te2("omit", r).makeRequired();
         if (e.selectionPath.length === 0) t.arguments.addSuggestion(n);
         else {
            let [i, o2] = Et(e.selectionPath),
               a = t.arguments.getDeepSelectionParent(i)?.value.asObject()?.getField(o2);
            if (a) {
               let u2 = a?.value.asObject() ?? new Ke2();
               u2.addSuggestion(n), (a.value = u2);
            }
         }
         t.addErrorMessage(
            i =>
               `The global ${i.red("omit")} configuration excludes every field of the model ${i.bold(e.outputType.name)}. At least one field must be included in the result`,
         );
      }
      function ra(e, t) {
         let [r, n] = Et(e.selectionPath),
            i = t.arguments.getDeepSubSelectionValue(r)?.asObject(),
            o2;
         if (i) {
            let s = i.getFieldValue("select")?.asObject(),
               a = i.getFieldValue("include")?.asObject(),
               u2 = i.getFieldValue("omit")?.asObject();
            s?.hasField(n)
               ? ((o2 = "select"), s.getField(n)?.markAsError(), Ni(s, e.outputType))
               : a?.hasField(n)
                 ? ((o2 = "include"), a.getField(n)?.markAsError(), ma(a, e.outputType))
                 : u2?.hasField(n) && ((o2 = "omit"), u2.getField(n)?.markAsError(), pa(u2, e.outputType));
         }
         t.addErrorMessage(s => {
            let a = [`Unknown field ${s.red(`\`${n}\``)}`];
            return (
               o2 && a.push(`for ${s.bold(o2)} statement`),
               a.push(`on model ${s.bold(`\`${e.outputType.name}\``)}.`),
               a.push(xt2(s)),
               a.join(" ")
            );
         });
      }
      function na(e, t) {
         let r = e.argumentPath[0],
            n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         n && (n.getField(r)?.markAsError(), da(n, e.arguments)),
            t.addErrorMessage(i =>
               Di(
                  i,
                  r,
                  e.arguments.map(o2 => o2.name),
               ),
            );
      }
      function ia(e, t) {
         let [r, n] = Et(e.argumentPath),
            i = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         if (i) {
            i.getDeepField(e.argumentPath)?.markAsError();
            let o2 = i.getDeepFieldValue(r)?.asObject();
            o2 && Ui(o2, e.inputType);
         }
         t.addErrorMessage(o2 =>
            Di(
               o2,
               n,
               e.inputType.fields.map(s => s.name),
            ),
         );
      }
      function Di(e, t, r) {
         let n = [`Unknown argument \`${e.red(t)}\`.`],
            i = ga(t, r);
         return i && n.push(`Did you mean \`${e.green(i)}\`?`), r.length > 0 && n.push(xt2(e)), n.join(" ");
      }
      function oa(e, t) {
         let r;
         t.addErrorMessage(u2 =>
            r?.value instanceof W2 && r.value.text === "null"
               ? `Argument \`${u2.green(o2)}\` must not be ${u2.red("null")}.`
               : `Argument \`${u2.green(o2)}\` is missing.`,
         );
         let n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         if (!n) return;
         let [i, o2] = Et(e.argumentPath),
            s = new wt(),
            a = n.getDeepFieldValue(i)?.asObject();
         if (a)
            if (((r = a.getField(o2)), r && a.removeField(o2), e.inputTypes.length === 1 && e.inputTypes[0].kind === "object")) {
               for (let u2 of e.inputTypes[0].fields) s.addField(u2.name, u2.typeNames.join(" | "));
               a.addSuggestion(new te2(o2, s).makeRequired());
            } else {
               let u2 = e.inputTypes.map(Fi).join(" | ");
               a.addSuggestion(new te2(o2, u2).makeRequired());
            }
      }
      function Fi(e) {
         return e.kind === "list" ? `${Fi(e.elementType)}[]` : e.name;
      }
      function sa(e, t) {
         let r = e.argument.name,
            n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         n && n.getDeepFieldValue(e.argumentPath)?.markAsError(),
            t.addErrorMessage(i => {
               let o2 = rr(
                  "or",
                  e.argument.typeNames.map(s => i.green(s)),
               );
               return `Argument \`${i.bold(r)}\`: Invalid value provided. Expected ${o2}, provided ${i.red(e.inferredType)}.`;
            });
      }
      function aa(e, t) {
         let r = e.argument.name,
            n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         n && n.getDeepFieldValue(e.argumentPath)?.markAsError(),
            t.addErrorMessage(i => {
               let o2 = [`Invalid value for argument \`${i.bold(r)}\``];
               if ((e.underlyingError && o2.push(`: ${e.underlyingError}`), o2.push("."), e.argument.typeNames.length > 0)) {
                  let s = rr(
                     "or",
                     e.argument.typeNames.map(a => i.green(a)),
                  );
                  o2.push(` Expected ${s}.`);
               }
               return o2.join("");
            });
      }
      function la(e, t) {
         let r = e.argument.name,
            n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject(),
            i;
         if (n) {
            let s = n.getDeepField(e.argumentPath)?.value;
            s?.markAsError(), s instanceof W2 && (i = s.text);
         }
         t.addErrorMessage(o2 => {
            let s = ["Unable to fit value"];
            return i && s.push(o2.red(i)), s.push(`into a 64-bit signed integer for field \`${o2.bold(r)}\``), s.join(" ");
         });
      }
      function ua(e, t) {
         let r = e.argumentPath[e.argumentPath.length - 1],
            n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();
         if (n) {
            let i = n.getDeepFieldValue(e.argumentPath)?.asObject();
            i && Ui(i, e.inputType);
         }
         t.addErrorMessage(i => {
            let o2 = [`Argument \`${i.bold(r)}\` of type ${i.bold(e.inputType.name)} needs`];
            return (
               e.constraints.minFieldCount === 1
                  ? e.constraints.requiredFields
                     ? o2.push(
                          `${i.green("at least one of")} ${rr(
                             "or",
                             e.constraints.requiredFields.map(s => `\`${i.bold(s)}\``),
                          )} arguments.`,
                       )
                     : o2.push(`${i.green("at least one")} argument.`)
                  : o2.push(`${i.green(`at least ${e.constraints.minFieldCount}`)} arguments.`),
               o2.push(xt2(i)),
               o2.join(" ")
            );
         });
      }
      function ca(e, t) {
         let r = e.argumentPath[e.argumentPath.length - 1],
            n = t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject(),
            i = [];
         if (n) {
            let o2 = n.getDeepFieldValue(e.argumentPath)?.asObject();
            o2 && (o2.markAsError(), (i = Object.keys(o2.getFields())));
         }
         t.addErrorMessage(o2 => {
            let s = [`Argument \`${o2.bold(r)}\` of type ${o2.bold(e.inputType.name)} needs`];
            return (
               e.constraints.minFieldCount === 1 && e.constraints.maxFieldCount == 1
                  ? s.push(`${o2.green("exactly one")} argument,`)
                  : e.constraints.maxFieldCount == 1
                    ? s.push(`${o2.green("at most one")} argument,`)
                    : s.push(`${o2.green(`at most ${e.constraints.maxFieldCount}`)} arguments,`),
               s.push(
                  `but you provided ${rr(
                     "and",
                     i.map(a => o2.red(a)),
                  )}. Please choose`,
               ),
               e.constraints.maxFieldCount === 1 ? s.push("one.") : s.push(`${e.constraints.maxFieldCount}.`),
               s.join(" ")
            );
         });
      }
      function Ni(e, t) {
         for (let r of t.fields) e.hasField(r.name) || e.addSuggestion(new te2(r.name, "true"));
      }
      function ma(e, t) {
         for (let r of t.fields) r.isRelation && !e.hasField(r.name) && e.addSuggestion(new te2(r.name, "true"));
      }
      function pa(e, t) {
         for (let r of t.fields) !e.hasField(r.name) && !r.isRelation && e.addSuggestion(new te2(r.name, "true"));
      }
      function da(e, t) {
         for (let r of t) e.hasField(r.name) || e.addSuggestion(new te2(r.name, r.typeNames.join(" | ")));
      }
      function Ui(e, t) {
         if (t.kind === "object")
            for (let r of t.fields) e.hasField(r.name) || e.addSuggestion(new te2(r.name, r.typeNames.join(" | ")));
      }
      function Et(e) {
         let t = [...e],
            r = t.pop();
         if (!r) throw new Error("unexpected empty path");
         return [t, r];
      }
      function xt2({ green: e, enabled: t }) {
         return "Available options are " + (t ? `listed in ${e("green")}` : "marked with ?") + ".";
      }
      function rr(e, t) {
         if (t.length === 1) return t[0];
         let r = [...t],
            n = r.pop();
         return `${r.join(", ")} ${e} ${n}`;
      }
      var fa = 3;
      function ga(e, t) {
         let r = 1 / 0,
            n;
         for (let i of t) {
            let o2 = (0, _i.default)(e, i);
            o2 > fa || (o2 < r && ((r = o2), (n = i)));
         }
         return n;
      }
      function nr2({ args: e, errors: t, errorFormat: r, callsite: n, originalMethod: i, clientVersion: o2, globalOmit: s }) {
         let a = He(e);
         for (let C of t) tr(C, a, s);
         let { message: u2, args: y } = Gt(a, r),
            T2 = Ye({ message: u2, callsite: n, originalMethod: i, showColors: r === "pretty", callArguments: y });
         throw new G2(T2, { clientVersion: o2 });
      }
      var ha = {
         findUnique: "findUnique",
         findUniqueOrThrow: "findUniqueOrThrow",
         findFirst: "findFirst",
         findFirstOrThrow: "findFirstOrThrow",
         findMany: "findMany",
         count: "aggregate",
         create: "createOne",
         createMany: "createMany",
         createManyAndReturn: "createManyAndReturn",
         update: "updateOne",
         updateMany: "updateMany",
         upsert: "upsertOne",
         delete: "deleteOne",
         deleteMany: "deleteMany",
         executeRaw: "executeRaw",
         queryRaw: "queryRaw",
         aggregate: "aggregate",
         groupBy: "groupBy",
         runCommandRaw: "runCommandRaw",
         findRaw: "findRaw",
         aggregateRaw: "aggregateRaw",
      };
      function Bi({
         modelName: e,
         action: t,
         args: r,
         runtimeDataModel: n,
         extensions: i,
         callsite: o2,
         clientMethod: s,
         errorFormat: a,
         clientVersion: u2,
         previewFeatures: y,
         globalOmit: T2,
      }) {
         let C = new $r({
            runtimeDataModel: n,
            modelName: e,
            action: t,
            rootArgs: r,
            callsite: o2,
            extensions: i,
            selectionPath: [],
            argumentPath: [],
            originalMethod: s,
            errorFormat: a,
            clientVersion: u2,
            previewFeatures: y,
            globalOmit: T2,
         });
         return { modelName: e, action: ha[t], query: Pt(r, C) };
      }
      function Pt({ select: e, include: t, ...r } = {}, n) {
         let i;
         return n.isPreviewFeatureOn("omitApi") && ((i = r.omit), delete r.omit), { arguments: Vi(r, n), selection: ya(e, t, i, n) };
      }
      function ya(e, t, r, n) {
         return e
            ? (t
                 ? n.throwValidationError({
                      kind: "MutuallyExclusiveFields",
                      firstField: "include",
                      secondField: "select",
                      selectionPath: n.getSelectionPath(),
                   })
                 : r &&
                   n.isPreviewFeatureOn("omitApi") &&
                   n.throwValidationError({
                      kind: "MutuallyExclusiveFields",
                      firstField: "omit",
                      secondField: "select",
                      selectionPath: n.getSelectionPath(),
                   }),
              xa(e, n))
            : ba(n, t, r);
      }
      function ba(e, t, r) {
         let n = {};
         return (
            e.modelOrType && !e.isRawAction() && ((n.$composites = true), (n.$scalars = true)),
            t && wa2(n, t, e),
            e.isPreviewFeatureOn("omitApi") && Ea(n, r, e),
            n
         );
      }
      function wa2(e, t, r) {
         for (let [n, i] of Object.entries(t)) {
            if (i === false) {
               e[n] = false;
               continue;
            }
            let o2 = r.findField(n);
            if (
               (o2 &&
                  o2.kind !== "object" &&
                  r.throwValidationError({
                     kind: "IncludeOnScalar",
                     selectionPath: r.getSelectionPath().concat(n),
                     outputType: r.getOutputTypeDescription(),
                  }),
               o2)
            ) {
               e[n] = Pt(i === true ? {} : i, r.nestSelection(n));
               continue;
            }
            if (i === true) {
               e[n] = true;
               continue;
            }
            e[n] = Pt(i, r.nestSelection(n));
         }
      }
      function Ea(e, t, r) {
         let n = r.getComputedFields(),
            i = { ...r.getGlobalOmit(), ...t },
            o2 = Ei(i, n);
         for (let [s, a] of Object.entries(o2)) {
            let u2 = r.findField(s);
            (n?.[s] && !u2) || (e[s] = !a);
         }
      }
      function xa(e, t) {
         let r = {},
            n = t.getComputedFields(),
            i = wi(e, n);
         for (let [o2, s] of Object.entries(i)) {
            let a = t.findField(o2);
            if (!(n?.[o2] && !a)) {
               if (s === false) {
                  r[o2] = false;
                  continue;
               }
               if (s === true) {
                  a?.kind === "object" ? (r[o2] = Pt({}, t.nestSelection(o2))) : (r[o2] = true);
                  continue;
               }
               r[o2] = Pt(s, t.nestSelection(o2));
            }
         }
         return r;
      }
      function $i(e, t) {
         if (e === null) return null;
         if (typeof e == "string" || typeof e == "number" || typeof e == "boolean") return e;
         if (typeof e == "bigint") return { $type: "BigInt", value: String(e) };
         if (je(e)) {
            if (Vt(e)) return { $type: "DateTime", value: e.toISOString() };
            t.throwValidationError({
               kind: "InvalidArgumentValue",
               selectionPath: t.getSelectionPath(),
               argumentPath: t.getArgumentPath(),
               argument: { name: t.getArgumentName(), typeNames: ["Date"] },
               underlyingError: "Provided Date object is invalid",
            });
         }
         if (Je2(e)) return { $type: "FieldRef", value: { _ref: e.name, _container: e.modelName } };
         if (Array.isArray(e)) return Pa(e, t);
         if (ArrayBuffer.isView(e)) return { $type: "Bytes", value: b.from(e).toString("base64") };
         if (va2(e)) return e.values;
         if (Qe(e)) return { $type: "Decimal", value: e.toFixed() };
         if (e instanceof we) {
            if (e !== Nt.instances[e._getName()]) throw new Error("Invalid ObjectEnumValue");
            return { $type: "Enum", value: e._getName() };
         }
         if (Ta(e)) return e.toJSON();
         if (typeof e == "object") return Vi(e, t);
         t.throwValidationError({
            kind: "InvalidArgumentValue",
            selectionPath: t.getSelectionPath(),
            argumentPath: t.getArgumentPath(),
            argument: { name: t.getArgumentName(), typeNames: [] },
            underlyingError: `We could not serialize ${Object.prototype.toString.call(e)} value. Serialize the object to JSON or implement a ".toJSON()" method on it`,
         });
      }
      function Vi(e, t) {
         if (e.$type) return { $type: "Raw", value: e };
         let r = {};
         for (let n in e) {
            let i = e[n];
            i !== void 0 && (r[n] = $i(i, t.nestArgument(n)));
         }
         return r;
      }
      function Pa(e, t) {
         let r = [];
         for (let n = 0; n < e.length; n++) {
            let i = t.nestArgument(String(n)),
               o2 = e[n];
            o2 === void 0 &&
               t.throwValidationError({
                  kind: "InvalidArgumentValue",
                  selectionPath: i.getSelectionPath(),
                  argumentPath: i.getArgumentPath(),
                  argument: { name: `${t.getArgumentName()}[${n}]`, typeNames: [] },
                  underlyingError: "Can not use `undefined` value within array. Use `null` or filter out `undefined` values",
               }),
               r.push($i(o2, i));
         }
         return r;
      }
      function va2(e) {
         return typeof e == "object" && e !== null && e.__prismaRawParameters__ === true;
      }
      function Ta(e) {
         return typeof e == "object" && e !== null && typeof e.toJSON == "function";
      }
      var $r = class e {
         constructor(t) {
            this.params = t;
            this.params.modelName &&
               (this.modelOrType =
                  this.params.runtimeDataModel.models[this.params.modelName] ??
                  this.params.runtimeDataModel.types[this.params.modelName]);
         }
         throwValidationError(t) {
            nr2({
               errors: [t],
               originalMethod: this.params.originalMethod,
               args: this.params.rootArgs ?? {},
               callsite: this.params.callsite,
               errorFormat: this.params.errorFormat,
               clientVersion: this.params.clientVersion,
               globalOmit: this.params.globalOmit,
            });
         }
         getSelectionPath() {
            return this.params.selectionPath;
         }
         getArgumentPath() {
            return this.params.argumentPath;
         }
         getArgumentName() {
            return this.params.argumentPath[this.params.argumentPath.length - 1];
         }
         getOutputTypeDescription() {
            if (!(!this.params.modelName || !this.modelOrType))
               return {
                  name: this.params.modelName,
                  fields: this.modelOrType.fields.map(t => ({ name: t.name, typeName: "boolean", isRelation: t.kind === "object" })),
               };
         }
         isRawAction() {
            return ["executeRaw", "queryRaw", "runCommandRaw", "findRaw", "aggregateRaw"].includes(this.params.action);
         }
         isPreviewFeatureOn(t) {
            return this.params.previewFeatures.includes(t);
         }
         getComputedFields() {
            if (this.params.modelName) return this.params.extensions.getAllComputedFields(this.params.modelName);
         }
         findField(t) {
            return this.modelOrType?.fields.find(r => r.name === t);
         }
         nestSelection(t) {
            let r = this.findField(t),
               n = r?.kind === "object" ? r.type : void 0;
            return new e({ ...this.params, modelName: n, selectionPath: this.params.selectionPath.concat(t) });
         }
         getGlobalOmit() {
            return this.params.modelName && this.shouldApplyGlobalOmit()
               ? (this.params.globalOmit?.[Xe2(this.params.modelName)] ?? {})
               : {};
         }
         shouldApplyGlobalOmit() {
            switch (this.params.action) {
               case "findFirst":
               case "findFirstOrThrow":
               case "findUniqueOrThrow":
               case "findMany":
               case "upsert":
               case "findUnique":
               case "createManyAndReturn":
               case "create":
               case "update":
               case "delete":
                  return true;
               case "executeRaw":
               case "aggregateRaw":
               case "runCommandRaw":
               case "findRaw":
               case "createMany":
               case "deleteMany":
               case "groupBy":
               case "updateMany":
               case "count":
               case "aggregate":
               case "queryRaw":
                  return false;
               default:
                  he(this.params.action, "Unknown action");
            }
         }
         nestArgument(t) {
            return new e({ ...this.params, argumentPath: this.params.argumentPath.concat(t) });
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var qi = e => ({ command: e });
      c2();
      m2();
      p();
      d();
      f2();
      l();
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ji = e => e.strings.reduce((t, r, n) => `${t}@P${n}${r}`);
      c2();
      m2();
      p();
      d();
      f2();
      l();
      l();
      function vt(e) {
         try {
            return Qi(e, "fast");
         } catch {
            return Qi(e, "slow");
         }
      }
      function Qi(e, t) {
         return JSON.stringify(e.map(r => Ca(r, t)));
      }
      function Ca(e, t) {
         return typeof e == "bigint"
            ? { prisma__type: "bigint", prisma__value: e.toString() }
            : je(e)
              ? { prisma__type: "date", prisma__value: e.toJSON() }
              : ue2.isDecimal(e)
                ? { prisma__type: "decimal", prisma__value: e.toJSON() }
                : b.isBuffer(e)
                  ? { prisma__type: "bytes", prisma__value: e.toString("base64") }
                  : Ra(e) || ArrayBuffer.isView(e)
                    ? { prisma__type: "bytes", prisma__value: b.from(e).toString("base64") }
                    : typeof e == "object" && t === "slow"
                      ? Gi(e)
                      : e;
      }
      function Ra(e) {
         return e instanceof ArrayBuffer || e instanceof SharedArrayBuffer
            ? true
            : typeof e == "object" && e !== null
              ? e[Symbol.toStringTag] === "ArrayBuffer" || e[Symbol.toStringTag] === "SharedArrayBuffer"
              : false;
      }
      function Gi(e) {
         if (typeof e != "object" || e === null) return e;
         if (typeof e.toJSON == "function") return e.toJSON();
         if (Array.isArray(e)) return e.map(Ji);
         let t = {};
         for (let r of Object.keys(e)) t[r] = Ji(e[r]);
         return t;
      }
      function Ji(e) {
         return typeof e == "bigint" ? e.toString() : Gi(e);
      }
      var Aa = /^(\s*alter\s)/i;
      var Wi = ee("prisma:client");
      function Vr2(e, t, r, n) {
         if (!(e !== "postgresql" && e !== "cockroachdb") && r.length > 0 && Aa.exec(t))
            throw new Error(`Running ALTER using ${n} is not supported
Using the example below you can still execute your query with Prisma, but please note that it is vulnerable to SQL injection attacks and requires you to take care of input sanitization.

Example:
  await prisma.$executeRawUnsafe(\`ALTER USER prisma WITH PASSWORD '\${password}'\`)

More Information: https://pris.ly/d/execute-raw
`);
      }
      var qr =
         ({ clientMethod: e, activeProvider: t }) =>
         r => {
            let n = "",
               i;
            if (Array.isArray(r)) {
               let [o2, ...s] = r;
               (n = o2), (i = { values: vt(s || []), __prismaRawParameters__: true });
            } else
               switch (t) {
                  case "sqlite":
                  case "mysql": {
                     (n = r.sql), (i = { values: vt(r.values), __prismaRawParameters__: true });
                     break;
                  }
                  case "cockroachdb":
                  case "postgresql":
                  case "postgres": {
                     (n = r.text), (i = { values: vt(r.values), __prismaRawParameters__: true });
                     break;
                  }
                  case "sqlserver": {
                     (n = ji(r)), (i = { values: vt(r.values), __prismaRawParameters__: true });
                     break;
                  }
                  default:
                     throw new Error(`The ${t} provider does not support ${e}`);
               }
            return i?.values ? Wi(`prisma.${e}(${n}, ${i.values})`) : Wi(`prisma.${e}(${n})`), { query: n, parameters: i };
         };
      var Ki = {
         requestArgsToMiddlewareArgs(e) {
            return [e.strings, ...e.values];
         },
         middlewareArgsToRequestArgs(e) {
            let [t, ...r] = e;
            return new X(t, r);
         },
      };
      var Hi = {
         requestArgsToMiddlewareArgs(e) {
            return [e];
         },
         middlewareArgsToRequestArgs(e) {
            return e[0];
         },
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function jr(e) {
         return function (r) {
            let n,
               i = (o2 = e) => {
                  try {
                     return o2 === void 0 || o2?.kind === "itx" ? (n ??= zi(r(o2))) : zi(r(o2));
                  } catch (s) {
                     return Promise.reject(s);
                  }
               };
            return {
               then(o2, s) {
                  return i().then(o2, s);
               },
               catch(o2) {
                  return i().catch(o2);
               },
               finally(o2) {
                  return i().finally(o2);
               },
               requestTransaction(o2) {
                  let s = i(o2);
                  return s.requestTransaction ? s.requestTransaction(o2) : s;
               },
               [Symbol.toStringTag]: "PrismaPromise",
            };
         };
      }
      function zi(e) {
         return typeof e.then == "function" ? e : Promise.resolve(e);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Yi = {
         isEnabled() {
            return false;
         },
         getTraceParent() {
            return "00-10-10-00";
         },
         async createEngineSpan() {},
         getActiveContext() {},
         runInChildSpan(e, t) {
            return t();
         },
      };
      var Qr = class {
         isEnabled() {
            return this.getGlobalTracingHelper().isEnabled();
         }
         getTraceParent(t) {
            return this.getGlobalTracingHelper().getTraceParent(t);
         }
         createEngineSpan(t) {
            return this.getGlobalTracingHelper().createEngineSpan(t);
         }
         getActiveContext() {
            return this.getGlobalTracingHelper().getActiveContext();
         }
         runInChildSpan(t, r) {
            return this.getGlobalTracingHelper().runInChildSpan(t, r);
         }
         getGlobalTracingHelper() {
            return globalThis.PRISMA_INSTRUMENTATION?.helper ?? Yi;
         }
      };
      function Xi(e) {
         return e.includes("tracing") ? new Qr() : Yi;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function Zi(e, t = () => {}) {
         let r,
            n = new Promise(i => (r = i));
         return {
            then(i) {
               return --e === 0 && r(t()), i?.(n);
            },
         };
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Sa = ["$connect", "$disconnect", "$on", "$transaction", "$use", "$extends"];
      var eo = Sa;
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function to(e) {
         return typeof e == "string"
            ? e
            : e.reduce(
                 (t, r) => {
                    let n = typeof r == "string" ? r : r.level;
                    return n === "query" ? t : t && (r === "info" || t === "info") ? "info" : n;
                 },
                 void 0,
              );
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ir = class {
         constructor() {
            this._middlewares = [];
         }
         use(t) {
            this._middlewares.push(t);
         }
         get(t) {
            return this._middlewares[t];
         }
         has(t) {
            return !!this._middlewares[t];
         }
         length() {
            return this._middlewares.length;
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var io = De2(In());
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function or(e) {
         return typeof e.batchRequestIdx == "number";
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      l();
      function sr(e) {
         return e === null ? e : Array.isArray(e) ? e.map(sr) : typeof e == "object" ? (Oa(e) ? ka(e) : Be(e, sr)) : e;
      }
      function Oa(e) {
         return e !== null && typeof e == "object" && typeof e.$type == "string";
      }
      function ka({ $type: e, value: t }) {
         switch (e) {
            case "BigInt":
               return BigInt(t);
            case "Bytes":
               return b.from(t, "base64");
            case "DateTime":
               return new Date(t);
            case "Decimal":
               return new ue2(t);
            case "Json":
               return JSON.parse(t);
            default:
               he(t, "Unknown tagged value");
         }
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function ro(e) {
         if (e.action !== "findUnique" && e.action !== "findUniqueOrThrow") return;
         let t = [];
         return (
            e.modelName && t.push(e.modelName),
            e.query.arguments && t.push(Jr2(e.query.arguments)),
            t.push(Jr2(e.query.selection)),
            t.join("")
         );
      }
      function Jr2(e) {
         return `(${Object.keys(e)
            .sort()
            .map(r => {
               let n = e[r];
               return typeof n == "object" && n !== null ? `(${r} ${Jr2(n)})` : r;
            })
            .join(" ")})`;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ma = {
         aggregate: false,
         aggregateRaw: false,
         createMany: true,
         createManyAndReturn: true,
         createOne: true,
         deleteMany: true,
         deleteOne: true,
         executeRaw: true,
         findFirst: false,
         findFirstOrThrow: false,
         findMany: false,
         findRaw: false,
         findUnique: false,
         findUniqueOrThrow: false,
         groupBy: false,
         queryRaw: false,
         runCommandRaw: true,
         updateMany: true,
         updateOne: true,
         upsertOne: true,
      };
      function Gr(e) {
         return Ma[e];
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ar2 = class {
         constructor(t) {
            this.options = t;
            this.tickActive = false;
            this.batches = {};
         }
         request(t) {
            let r = this.options.batchBy(t);
            return r
               ? (this.batches[r] ||
                    ((this.batches[r] = []),
                    this.tickActive ||
                       ((this.tickActive = true),
                       g.nextTick(() => {
                          this.dispatchBatches(), (this.tickActive = false);
                       }))),
                 new Promise((n, i) => {
                    this.batches[r].push({ request: t, resolve: n, reject: i });
                 }))
               : this.options.singleLoader(t);
         }
         dispatchBatches() {
            for (let t in this.batches) {
               let r = this.batches[t];
               delete this.batches[t],
                  r.length === 1
                     ? this.options
                          .singleLoader(r[0].request)
                          .then(n => {
                             n instanceof Error ? r[0].reject(n) : r[0].resolve(n);
                          })
                          .catch(n => {
                             r[0].reject(n);
                          })
                     : (r.sort((n, i) => this.options.batchOrder(n.request, i.request)),
                       this.options
                          .batchLoader(r.map(n => n.request))
                          .then(n => {
                             if (n instanceof Error) for (let i = 0; i < r.length; i++) r[i].reject(n);
                             else
                                for (let i = 0; i < r.length; i++) {
                                   let o2 = n[i];
                                   o2 instanceof Error ? r[i].reject(o2) : r[i].resolve(o2);
                                }
                          })
                          .catch(n => {
                             for (let i = 0; i < r.length; i++) r[i].reject(n);
                          }));
            }
         }
         get [Symbol.toStringTag]() {
            return "DataLoader";
         }
      };
      c2();
      m2();
      p();
      d();
      f2();
      l();
      l();
      function Le2(e, t) {
         if (t === null) return t;
         switch (e) {
            case "bigint":
               return BigInt(t);
            case "bytes":
               return b.from(t, "base64");
            case "decimal":
               return new ue2(t);
            case "datetime":
            case "date":
               return new Date(t);
            case "time":
               return /* @__PURE__ */ new Date(`1970-01-01T${t}Z`);
            case "bigint-array":
               return t.map(r => Le2("bigint", r));
            case "bytes-array":
               return t.map(r => Le2("bytes", r));
            case "decimal-array":
               return t.map(r => Le2("decimal", r));
            case "datetime-array":
               return t.map(r => Le2("datetime", r));
            case "date-array":
               return t.map(r => Le2("date", r));
            case "time-array":
               return t.map(r => Le2("time", r));
            default:
               return t;
         }
      }
      function no(e) {
         let t = [],
            r = La(e);
         for (let n = 0; n < e.rows.length; n++) {
            let i = e.rows[n],
               o2 = { ...r };
            for (let s = 0; s < i.length; s++) o2[e.columns[s]] = Le2(e.types[s], i[s]);
            t.push(o2);
         }
         return t;
      }
      function La(e) {
         let t = {};
         for (let r = 0; r < e.columns.length; r++) t[e.columns[r]] = null;
         return t;
      }
      var Ia = ee("prisma:client:request_handler");
      var lr2 = class {
         constructor(t, r) {
            (this.logEmitter = r),
               (this.client = t),
               (this.dataloader = new ar2({
                  batchLoader: fi(async ({ requests: n, customDataProxyFetch: i }) => {
                     let { transaction: o2, otelParentCtx: s } = n[0],
                        a = n.map(C => C.protocolQuery),
                        u2 = this.client._tracingHelper.getTraceParent(s),
                        y = n.some(C => Gr(C.protocolQuery.action));
                     return (
                        await this.client._engine.requestBatch(a, {
                           traceparent: u2,
                           transaction: _a2(o2),
                           containsWrite: y,
                           customDataProxyFetch: i,
                        })
                     ).map((C, O) => {
                        if (C instanceof Error) return C;
                        try {
                           return this.mapQueryEngineResult(n[O], C);
                        } catch (A) {
                           return A;
                        }
                     });
                  }),
                  singleLoader: async n => {
                     let i = n.transaction?.kind === "itx" ? oo(n.transaction) : void 0,
                        o2 = await this.client._engine.request(n.protocolQuery, {
                           traceparent: this.client._tracingHelper.getTraceParent(),
                           interactiveTransaction: i,
                           isWrite: Gr(n.protocolQuery.action),
                           customDataProxyFetch: n.customDataProxyFetch,
                        });
                     return this.mapQueryEngineResult(n, o2);
                  },
                  batchBy: n => (n.transaction?.id ? `transaction-${n.transaction.id}` : ro(n.protocolQuery)),
                  batchOrder(n, i) {
                     return n.transaction?.kind === "batch" && i.transaction?.kind === "batch"
                        ? n.transaction.index - i.transaction.index
                        : 0;
                  },
               }));
         }
         async request(t) {
            try {
               return await this.dataloader.request(t);
            } catch (r) {
               let { clientMethod: n, callsite: i, transaction: o2, args: s, modelName: a } = t;
               this.handleAndLogRequestError({
                  error: r,
                  clientMethod: n,
                  callsite: i,
                  transaction: o2,
                  args: s,
                  modelName: a,
                  globalOmit: t.globalOmit,
               });
            }
         }
         mapQueryEngineResult({ dataPath: t, unpacker: r }, n) {
            let i = n?.data,
               o2 = n?.elapsed,
               s = this.unpack(i, t, r);
            return g.env.PRISMA_CLIENT_GET_TIME ? { data: s, elapsed: o2 } : s;
         }
         handleAndLogRequestError(t) {
            try {
               this.handleRequestError(t);
            } catch (r) {
               throw (
                  (this.logEmitter &&
                     this.logEmitter.emit("error", {
                        message: r.message,
                        target: t.clientMethod,
                        timestamp: /* @__PURE__ */ new Date(),
                     }),
                  r)
               );
            }
         }
         handleRequestError({ error: t, clientMethod: r, callsite: n, transaction: i, args: o2, modelName: s, globalOmit: a }) {
            if ((Ia(t), Da(t, i) || t instanceof ye)) throw t;
            if (t instanceof Q2 && Fa(t)) {
               let y = so(t.meta);
               nr2({
                  args: o2,
                  errors: [y],
                  callsite: n,
                  errorFormat: this.client._errorFormat,
                  originalMethod: r,
                  clientVersion: this.client._clientVersion,
                  globalOmit: a,
               });
            }
            let u2 = t.message;
            if (
               (n &&
                  (u2 = Ye({
                     callsite: n,
                     originalMethod: r,
                     isPanic: t.isPanic,
                     showColors: this.client._errorFormat === "pretty",
                     message: u2,
                  })),
               (u2 = this.sanitizeMessage(u2)),
               t.code)
            ) {
               let y = s ? { modelName: s, ...t.meta } : t.meta;
               throw new Q2(u2, {
                  code: t.code,
                  clientVersion: this.client._clientVersion,
                  meta: y,
                  batchRequestIdx: t.batchRequestIdx,
               });
            } else {
               if (t.isPanic) throw new be(u2, this.client._clientVersion);
               if (t instanceof J) throw new J(u2, { clientVersion: this.client._clientVersion, batchRequestIdx: t.batchRequestIdx });
               if (t instanceof I) throw new I(u2, this.client._clientVersion);
               if (t instanceof be) throw new be(u2, this.client._clientVersion);
            }
            throw ((t.clientVersion = this.client._clientVersion), t);
         }
         sanitizeMessage(t) {
            return this.client._errorFormat && this.client._errorFormat !== "pretty" ? (0, io.default)(t) : t;
         }
         unpack(t, r, n) {
            if (!t || (t.data && (t = t.data), !t)) return t;
            let i = Object.keys(t)[0],
               o2 = Object.values(t)[0],
               s = r.filter(y => y !== "select" && y !== "include"),
               a = _r2(o2, s),
               u2 = i === "queryRaw" ? no(a) : sr(a);
            return n ? n(u2) : u2;
         }
         get [Symbol.toStringTag]() {
            return "RequestHandler";
         }
      };
      function _a2(e) {
         if (e) {
            if (e.kind === "batch") return { kind: "batch", options: { isolationLevel: e.isolationLevel } };
            if (e.kind === "itx") return { kind: "itx", options: oo(e) };
            he(e, "Unknown transaction kind");
         }
      }
      function oo(e) {
         return { id: e.id, payload: e.payload };
      }
      function Da(e, t) {
         return or(e) && t?.kind === "batch" && e.batchRequestIdx !== t.index;
      }
      function Fa(e) {
         return e.code === "P2009" || e.code === "P2012";
      }
      function so(e) {
         if (e.kind === "Union") return { kind: "Union", errors: e.errors.map(so) };
         if (Array.isArray(e.selectionPath)) {
            let [, ...t] = e.selectionPath;
            return { ...e, selectionPath: t };
         }
         return e;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var ao = "5.17.0";
      var lo = ao;
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var fo = De2(Br());
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var _2 = class extends Error {
         constructor(t) {
            super(
               t +
                  `
Read more at https://pris.ly/d/client-constructor`,
            ),
               (this.name = "PrismaClientConstructorValidationError");
         }
         get [Symbol.toStringTag]() {
            return "PrismaClientConstructorValidationError";
         }
      };
      K(_2, "PrismaClientConstructorValidationError");
      var uo = ["datasources", "datasourceUrl", "errorFormat", "adapter", "log", "transactionOptions", "omit", "__internal"];
      var co = ["pretty", "colorless", "minimal"];
      var mo = ["info", "query", "warn", "error"];
      var Ua = {
         datasources: (e, { datasourceNames: t }) => {
            if (e) {
               if (typeof e != "object" || Array.isArray(e))
                  throw new _2(`Invalid value ${JSON.stringify(e)} for "datasources" provided to PrismaClient constructor`);
               for (let [r, n] of Object.entries(e)) {
                  if (!t.includes(r)) {
                     let i = Ze2(r, t) || ` Available datasources: ${t.join(", ")}`;
                     throw new _2(`Unknown datasource ${r} provided to PrismaClient constructor.${i}`);
                  }
                  if (typeof n != "object" || Array.isArray(n))
                     throw new _2(`Invalid value ${JSON.stringify(e)} for datasource "${r}" provided to PrismaClient constructor.
It should have this form: { url: "CONNECTION_STRING" }`);
                  if (n && typeof n == "object")
                     for (let [i, o2] of Object.entries(n)) {
                        if (i !== "url")
                           throw new _2(`Invalid value ${JSON.stringify(e)} for datasource "${r}" provided to PrismaClient constructor.
It should have this form: { url: "CONNECTION_STRING" }`);
                        if (typeof o2 != "string")
                           throw new _2(`Invalid value ${JSON.stringify(o2)} for datasource "${r}" provided to PrismaClient constructor.
It should have this form: { url: "CONNECTION_STRING" }`);
                     }
               }
            }
         },
         adapter: (e, t) => {
            if (e === null) return;
            if (e === void 0)
               throw new _2('"adapter" property must not be undefined, use null to conditionally disable driver adapters.');
            if (!er(t).includes("driverAdapters"))
               throw new _2(
                  '"adapter" property can only be provided to PrismaClient constructor when "driverAdapters" preview feature is enabled.',
               );
            if (nt() === "binary")
               throw new _2('Cannot use a driver adapter with the "binary" Query Engine. Please use the "library" Query Engine.');
         },
         datasourceUrl: e => {
            if (typeof e < "u" && typeof e != "string")
               throw new _2(`Invalid value ${JSON.stringify(e)} for "datasourceUrl" provided to PrismaClient constructor.
Expected string or undefined.`);
         },
         errorFormat: e => {
            if (e) {
               if (typeof e != "string")
                  throw new _2(`Invalid value ${JSON.stringify(e)} for "errorFormat" provided to PrismaClient constructor.`);
               if (!co.includes(e)) {
                  let t = Ze2(e, co);
                  throw new _2(`Invalid errorFormat ${e} provided to PrismaClient constructor.${t}`);
               }
            }
         },
         log: e => {
            if (!e) return;
            if (!Array.isArray(e)) throw new _2(`Invalid value ${JSON.stringify(e)} for "log" provided to PrismaClient constructor.`);
            function t(r) {
               if (typeof r == "string" && !mo.includes(r)) {
                  let n = Ze2(r, mo);
                  throw new _2(`Invalid log level "${r}" provided to PrismaClient constructor.${n}`);
               }
            }
            for (let r of e) {
               t(r);
               let n = {
                  level: t,
                  emit: i => {
                     let o2 = ["stdout", "event"];
                     if (!o2.includes(i)) {
                        let s = Ze2(i, o2);
                        throw new _2(
                           `Invalid value ${JSON.stringify(i)} for "emit" in logLevel provided to PrismaClient constructor.${s}`,
                        );
                     }
                  },
               };
               if (r && typeof r == "object")
                  for (let [i, o2] of Object.entries(r))
                     if (n[i]) n[i](o2);
                     else throw new _2(`Invalid property ${i} for "log" provided to PrismaClient constructor`);
            }
         },
         transactionOptions: e => {
            if (!e) return;
            let t = e.maxWait;
            if (t != null && t <= 0)
               throw new _2(
                  `Invalid value ${t} for maxWait in "transactionOptions" provided to PrismaClient constructor. maxWait needs to be greater than 0`,
               );
            let r = e.timeout;
            if (r != null && r <= 0)
               throw new _2(
                  `Invalid value ${r} for timeout in "transactionOptions" provided to PrismaClient constructor. timeout needs to be greater than 0`,
               );
         },
         omit: (e, t) => {
            if (typeof e != "object") throw new _2('"omit" option is expected to be an object.');
            if (e === null) throw new _2('"omit" option can not be `null`');
            let r = [];
            for (let [n, i] of Object.entries(e)) {
               let o2 = $a(n, t.runtimeDataModel);
               if (!o2) {
                  r.push({ kind: "UnknownModel", modelKey: n });
                  continue;
               }
               for (let [s, a] of Object.entries(i)) {
                  let u2 = o2.fields.find(y => y.name === s);
                  if (!u2) {
                     r.push({ kind: "UnknownField", modelKey: n, fieldName: s });
                     continue;
                  }
                  if (u2.relationName) {
                     r.push({ kind: "RelationInOmit", modelKey: n, fieldName: s });
                     continue;
                  }
                  typeof a != "boolean" && r.push({ kind: "InvalidFieldValue", modelKey: n, fieldName: s });
               }
            }
            if (r.length > 0) throw new _2(Va(e, r));
         },
         __internal: e => {
            if (!e) return;
            let t = ["debug", "engine", "configOverride"];
            if (typeof e != "object") throw new _2(`Invalid value ${JSON.stringify(e)} for "__internal" to PrismaClient constructor`);
            for (let [r] of Object.entries(e))
               if (!t.includes(r)) {
                  let n = Ze2(r, t);
                  throw new _2(`Invalid property ${JSON.stringify(r)} for "__internal" provided to PrismaClient constructor.${n}`);
               }
         },
      };
      function go(e, t) {
         for (let [r, n] of Object.entries(e)) {
            if (!uo.includes(r)) {
               let i = Ze2(r, uo);
               throw new _2(`Unknown property ${r} provided to PrismaClient constructor.${i}`);
            }
            Ua[r](n, t);
         }
         if (e.datasourceUrl && e.datasources)
            throw new _2('Can not use "datasourceUrl" and "datasources" options at the same time. Pick one of them');
      }
      function Ze2(e, t) {
         if (t.length === 0 || typeof e != "string") return "";
         let r = Ba(e, t);
         return r ? ` Did you mean "${r}"?` : "";
      }
      function Ba(e, t) {
         if (t.length === 0) return null;
         let r = t.map(i => ({ value: i, distance: (0, fo.default)(e, i) }));
         r.sort((i, o2) => (i.distance < o2.distance ? -1 : 1));
         let n = r[0];
         return n.distance < 3 ? n.value : null;
      }
      function $a(e, t) {
         return po(t.models, e) ?? po(t.types, e);
      }
      function po(e, t) {
         let r = Object.keys(e).find(n => Xe2(n) === t);
         if (r) return e[r];
      }
      function Va(e, t) {
         let r = He(e);
         for (let o2 of t)
            switch (o2.kind) {
               case "UnknownModel":
                  r.arguments.getField(o2.modelKey)?.markAsError(), r.addErrorMessage(() => `Unknown model name: ${o2.modelKey}.`);
                  break;
               case "UnknownField":
                  r.arguments.getDeepField([o2.modelKey, o2.fieldName])?.markAsError(),
                     r.addErrorMessage(() => `Model "${o2.modelKey}" does not have a field named "${o2.fieldName}".`);
                  break;
               case "RelationInOmit":
                  r.arguments.getDeepField([o2.modelKey, o2.fieldName])?.markAsError(),
                     r.addErrorMessage(() => 'Relations are already excluded by default and can not be specified in "omit".');
                  break;
               case "InvalidFieldValue":
                  r.arguments.getDeepFieldValue([o2.modelKey, o2.fieldName])?.markAsError(),
                     r.addErrorMessage(() => "Omit field option value must be a boolean.");
                  break;
            }
         let { message: n, args: i } = Gt(r, "colorless");
         return `Error validating "omit" option:

${i}

${n}`;
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      function ho(e) {
         return e.length === 0
            ? Promise.resolve([])
            : new Promise((t, r) => {
                 let n = new Array(e.length),
                    i = null,
                    o2 = false,
                    s = 0,
                    a = () => {
                       o2 || (s++, s === e.length && ((o2 = true), i ? r(i) : t(n)));
                    },
                    u2 = y => {
                       o2 || ((o2 = true), r(y));
                    };
                 for (let y = 0; y < e.length; y++)
                    e[y].then(
                       T2 => {
                          (n[y] = T2), a();
                       },
                       T2 => {
                          if (!or(T2)) {
                             u2(T2);
                             return;
                          }
                          T2.batchRequestIdx === y ? u2(T2) : (i || (i = T2), a());
                       },
                    );
              });
      }
      var Te = ee("prisma:client");
      typeof globalThis == "object" && (globalThis.NODE_CLIENT = true);
      var qa = { requestArgsToMiddlewareArgs: e => e, middlewareArgsToRequestArgs: e => e };
      var ja = Symbol.for("prisma.client.transaction.id");
      var Qa = {
         id: 0,
         nextId() {
            return ++this.id;
         },
      };
      function wo(e) {
         class t {
            constructor(n) {
               this._originalClient = this;
               this._middlewares = new ir();
               this._createPrismaPromise = jr();
               this.$extends = si;
               (e = n?.__internal?.configOverride?.(e) ?? e), vi(e), n && go(n, e);
               let i = new _t2().on("error", () => {});
               (this._extensions = Yt2.empty()),
                  (this._previewFeatures = er(e)),
                  (this._clientVersion = e.clientVersion ?? lo),
                  (this._activeProvider = e.activeProvider),
                  (this._globalOmit = n?.omit),
                  (this._tracingHelper = Xi(this._previewFeatures));
               let o2 = {
                     rootEnvPath: e.relativeEnvPaths.rootEnvPath && rt.resolve(e.dirname, e.relativeEnvPaths.rootEnvPath),
                     schemaEnvPath: e.relativeEnvPaths.schemaEnvPath && rt.resolve(e.dirname, e.relativeEnvPaths.schemaEnvPath),
                  },
                  s;
               if (n?.adapter) {
                  s = Or(n.adapter);
                  let u2 = e.activeProvider === "postgresql" ? "postgres" : e.activeProvider;
                  if (s.provider !== u2)
                     throw new I(
                        `The Driver Adapter \`${s.adapterName}\`, based on \`${s.provider}\`, is not compatible with the provider \`${u2}\` specified in the Prisma schema.`,
                        this._clientVersion,
                     );
                  if (n.datasources || n.datasourceUrl !== void 0)
                     throw new I(
                        "Custom datasource configuration is not compatible with Prisma Driver Adapters. Please define the database connection string directly in the Driver Adapter configuration.",
                        this._clientVersion,
                     );
               }
               let a = e.injectableEdgeEnv?.();
               try {
                  let u2 = n ?? {},
                     y = u2.__internal ?? {},
                     T2 = y.debug === true;
                  T2 && ee.enable("prisma:client");
                  let C = rt.resolve(e.dirname, e.relativePath);
                  ln.existsSync(C) || (C = e.dirname), Te("dirname", e.dirname), Te("relativePath", e.relativePath), Te("cwd", C);
                  let O = y.engine || {};
                  if (
                     (u2.errorFormat
                        ? (this._errorFormat = u2.errorFormat)
                        : g.env.NODE_ENV === "production"
                          ? (this._errorFormat = "minimal")
                          : g.env.NO_COLOR
                            ? (this._errorFormat = "colorless")
                            : (this._errorFormat = "colorless"),
                     (this._runtimeDataModel = e.runtimeDataModel),
                     (this._engineConfig = {
                        cwd: C,
                        dirname: e.dirname,
                        enableDebugLogs: T2,
                        allowTriggerPanic: O.allowTriggerPanic,
                        datamodelPath: rt.join(e.dirname, e.filename ?? "schema.prisma"),
                        prismaPath: O.binaryPath ?? void 0,
                        engineEndpoint: O.endpoint,
                        generator: e.generator,
                        showColors: this._errorFormat === "pretty",
                        logLevel: u2.log && to(u2.log),
                        logQueries:
                           u2.log &&
                           !!(typeof u2.log == "string"
                              ? u2.log === "query"
                              : u2.log.find(A => (typeof A == "string" ? A === "query" : A.level === "query"))),
                        env: a?.parsed ?? {},
                        flags: [],
                        engineWasm: e.engineWasm,
                        clientVersion: e.clientVersion,
                        engineVersion: e.engineVersion,
                        previewFeatures: this._previewFeatures,
                        activeProvider: e.activeProvider,
                        inlineSchema: e.inlineSchema,
                        overrideDatasources: Ti(u2, e.datasourceNames),
                        inlineDatasources: e.inlineDatasources,
                        inlineSchemaHash: e.inlineSchemaHash,
                        tracingHelper: this._tracingHelper,
                        transactionOptions: {
                           maxWait: u2.transactionOptions?.maxWait ?? 2e3,
                           timeout: u2.transactionOptions?.timeout ?? 5e3,
                           isolationLevel: u2.transactionOptions?.isolationLevel,
                        },
                        logEmitter: i,
                        isBundled: e.isBundled,
                        adapter: s,
                     }),
                     (this._accelerateEngineConfig = {
                        ...this._engineConfig,
                        accelerateUtils: {
                           resolveDatasourceUrl: Xt,
                           getBatchRequestPayload: $t,
                           prismaGraphQLToJSError: Wt,
                           PrismaClientUnknownRequestError: J,
                           PrismaClientInitializationError: I,
                           PrismaClientKnownRequestError: Q2,
                           debug: ee("prisma:client:accelerateEngine"),
                           engineVersion: bo.version,
                           clientVersion: e.clientVersion,
                        },
                     }),
                     Te("clientVersion", e.clientVersion),
                     (this._engine = Si(e, this._engineConfig)),
                     (this._requestHandler = new lr2(this, i)),
                     u2.log)
                  )
                     for (let A of u2.log) {
                        let M = typeof A == "string" ? A : A.emit === "stdout" ? A.level : null;
                        M &&
                           this.$on(M, S => {
                              ot.log(`${ot.tags[M] ?? ""}`, S.message || S.query);
                           });
                     }
                  this._metrics = new $e(this._engine);
               } catch (u2) {
                  throw ((u2.clientVersion = this._clientVersion), u2);
               }
               return (this._appliedParent = gt(this));
            }
            get [Symbol.toStringTag]() {
               return "PrismaClient";
            }
            $use(n) {
               this._middlewares.use(n);
            }
            $on(n, i) {
               n === "beforeExit" ? this._engine.onBeforeExit(i) : n && this._engineConfig.logEmitter.on(n, i);
            }
            $connect() {
               try {
                  return this._engine.start();
               } catch (n) {
                  throw ((n.clientVersion = this._clientVersion), n);
               }
            }
            async $disconnect() {
               try {
                  await this._engine.stop();
               } catch (n) {
                  throw ((n.clientVersion = this._clientVersion), n);
               } finally {
                  Pn();
               }
            }
            $executeRawInternal(n, i, o2, s) {
               let a = this._activeProvider;
               return this._request({
                  action: "executeRaw",
                  args: o2,
                  transaction: n,
                  clientMethod: i,
                  argsMapper: qr({ clientMethod: i, activeProvider: a }),
                  callsite: Pe(this._errorFormat),
                  dataPath: [],
                  middlewareArgsMapper: s,
               });
            }
            $executeRaw(n, ...i) {
               return this._createPrismaPromise(o2 => {
                  if (n.raw !== void 0 || n.sql !== void 0) {
                     let [s, a] = yo(n, i);
                     return (
                        Vr2(
                           this._activeProvider,
                           s.text,
                           s.values,
                           Array.isArray(n) ? "prisma.$executeRaw`<SQL>`" : "prisma.$executeRaw(sql`<SQL>`)",
                        ),
                        this.$executeRawInternal(o2, "$executeRaw", s, a)
                     );
                  }
                  throw new G2(
                     "`$executeRaw` is a tag function, please use it like the following:\n```\nconst result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`\n```\n\nOr read our docs at https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#executeraw\n",
                     { clientVersion: this._clientVersion },
                  );
               });
            }
            $executeRawUnsafe(n, ...i) {
               return this._createPrismaPromise(
                  o2 => (
                     Vr2(this._activeProvider, n, i, "prisma.$executeRawUnsafe(<SQL>, [...values])"),
                     this.$executeRawInternal(o2, "$executeRawUnsafe", [n, ...i])
                  ),
               );
            }
            $runCommandRaw(n) {
               if (e.activeProvider !== "mongodb")
                  throw new G2(`The ${e.activeProvider} provider does not support $runCommandRaw. Use the mongodb provider.`, {
                     clientVersion: this._clientVersion,
                  });
               return this._createPrismaPromise(i =>
                  this._request({
                     args: n,
                     clientMethod: "$runCommandRaw",
                     dataPath: [],
                     action: "runCommandRaw",
                     argsMapper: qi,
                     callsite: Pe(this._errorFormat),
                     transaction: i,
                  }),
               );
            }
            async $queryRawInternal(n, i, o2, s) {
               let a = this._activeProvider;
               return this._request({
                  action: "queryRaw",
                  args: o2,
                  transaction: n,
                  clientMethod: i,
                  argsMapper: qr({ clientMethod: i, activeProvider: a }),
                  callsite: Pe(this._errorFormat),
                  dataPath: [],
                  middlewareArgsMapper: s,
               });
            }
            $queryRaw(n, ...i) {
               return this._createPrismaPromise(o2 => {
                  if (n.raw !== void 0 || n.sql !== void 0) return this.$queryRawInternal(o2, "$queryRaw", ...yo(n, i));
                  throw new G2(
                     "`$queryRaw` is a tag function, please use it like the following:\n```\nconst result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`\n```\n\nOr read our docs at https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw\n",
                     { clientVersion: this._clientVersion },
                  );
               });
            }
            $queryRawUnsafe(n, ...i) {
               return this._createPrismaPromise(o2 => this.$queryRawInternal(o2, "$queryRawUnsafe", [n, ...i]));
            }
            _transactionWithArray({ promises: n, options: i }) {
               let o2 = Qa.nextId(),
                  s = Zi(n.length),
                  a = n.map((u2, y) => {
                     if (u2?.[Symbol.toStringTag] !== "PrismaPromise")
                        throw new Error(
                           "All elements of the array need to be Prisma Client promises. Hint: Please make sure you are not awaiting the Prisma client calls you intended to pass in the $transaction function.",
                        );
                     let T2 = i?.isolationLevel ?? this._engineConfig.transactionOptions.isolationLevel,
                        C = { kind: "batch", id: o2, index: y, isolationLevel: T2, lock: s };
                     return u2.requestTransaction?.(C) ?? u2;
                  });
               return ho(a);
            }
            async _transactionWithCallback({ callback: n, options: i }) {
               let o2 = { traceparent: this._tracingHelper.getTraceParent() },
                  s = {
                     maxWait: i?.maxWait ?? this._engineConfig.transactionOptions.maxWait,
                     timeout: i?.timeout ?? this._engineConfig.transactionOptions.timeout,
                     isolationLevel: i?.isolationLevel ?? this._engineConfig.transactionOptions.isolationLevel,
                  },
                  a = await this._engine.transaction("start", o2, s),
                  u2;
               try {
                  let y = { kind: "itx", ...a };
                  (u2 = await n(this._createItxClient(y))), await this._engine.transaction("commit", o2, a);
               } catch (y) {
                  throw (await this._engine.transaction("rollback", o2, a).catch(() => {}), y);
               }
               return u2;
            }
            _createItxClient(n) {
               return gt(
                  me(oi(this), [
                     H("_appliedParent", () => this._appliedParent._createItxClient(n)),
                     H("_createPrismaPromise", () => jr(n)),
                     H(ja, () => n.id),
                     Ve(eo),
                  ]),
               );
            }
            $transaction(n, i) {
               let o2;
               typeof n == "function"
                  ? this._engineConfig.adapter?.adapterName === "@prisma/adapter-d1"
                     ? (o2 = () => {
                          throw new Error(
                             "Cloudflare D1 does not support interactive transactions. We recommend you to refactor your queries with that limitation in mind, and use batch transactions with `prisma.$transactions([])` where applicable.",
                          );
                       })
                     : (o2 = () => this._transactionWithCallback({ callback: n, options: i }))
                  : (o2 = () => this._transactionWithArray({ promises: n, options: i }));
               let s = { name: "transaction", attributes: { method: "$transaction" } };
               return this._tracingHelper.runInChildSpan(s, o2);
            }
            _request(n) {
               n.otelParentCtx = this._tracingHelper.getActiveContext();
               let i = n.middlewareArgsMapper ?? qa,
                  o2 = {
                     args: i.requestArgsToMiddlewareArgs(n.args),
                     dataPath: n.dataPath,
                     runInTransaction: !!n.transaction,
                     action: n.action,
                     model: n.model,
                  },
                  s = {
                     middleware: { name: "middleware", middleware: true, attributes: { method: "$use" }, active: false },
                     operation: {
                        name: "operation",
                        attributes: { method: o2.action, model: o2.model, name: o2.model ? `${o2.model}.${o2.action}` : o2.action },
                     },
                  },
                  a = -1,
                  u2 = async y => {
                     let T2 = this._middlewares.get(++a);
                     if (T2) return this._tracingHelper.runInChildSpan(s.middleware, L => T2(y, ne => (L?.end(), u2(ne))));
                     let { runInTransaction: C, args: O, ...A } = y,
                        M = { ...n, ...A };
                     O && (M.args = i.middlewareArgsToRequestArgs(O)), n.transaction !== void 0 && C === false && delete M.transaction;
                     let S = await di(this, M);
                     return M.model
                        ? ui({
                             result: S,
                             modelName: M.model,
                             args: M.args,
                             extensions: this._extensions,
                             runtimeDataModel: this._runtimeDataModel,
                             globalOmit: this._globalOmit,
                          })
                        : S;
                  };
               return this._tracingHelper.runInChildSpan(s.operation, () => u2(o2));
            }
            async _executeRequest({
               args: n,
               clientMethod: i,
               dataPath: o2,
               callsite: s,
               action: a,
               model: u2,
               argsMapper: y,
               transaction: T2,
               unpacker: C,
               otelParentCtx: O,
               customDataProxyFetch: A,
            }) {
               try {
                  n = y ? y(n) : n;
                  let M = { name: "serialize" },
                     S = this._tracingHelper.runInChildSpan(M, () =>
                        Bi({
                           modelName: u2,
                           runtimeDataModel: this._runtimeDataModel,
                           action: a,
                           args: n,
                           clientMethod: i,
                           callsite: s,
                           extensions: this._extensions,
                           errorFormat: this._errorFormat,
                           clientVersion: this._clientVersion,
                           previewFeatures: this._previewFeatures,
                           globalOmit: this._globalOmit,
                        }),
                     );
                  return (
                     ee.enabled("prisma:client") &&
                        (Te("Prisma Client call:"),
                        Te(`prisma.${i}(${Kn(n)})`),
                        Te("Generated request:"),
                        Te(
                           JSON.stringify(S, null, 2) +
                              `
`,
                        )),
                     T2?.kind === "batch" && (await T2.lock),
                     this._requestHandler.request({
                        protocolQuery: S,
                        modelName: u2,
                        action: a,
                        clientMethod: i,
                        dataPath: o2,
                        callsite: s,
                        args: n,
                        extensions: this._extensions,
                        transaction: T2,
                        unpacker: C,
                        otelParentCtx: O,
                        otelChildCtx: this._tracingHelper.getActiveContext(),
                        globalOmit: this._globalOmit,
                        customDataProxyFetch: A,
                     })
                  );
               } catch (M) {
                  throw ((M.clientVersion = this._clientVersion), M);
               }
            }
            get $metrics() {
               if (!this._hasPreviewFlag("metrics"))
                  throw new G2("`metrics` preview feature must be enabled in order to access metrics API", {
                     clientVersion: this._clientVersion,
                  });
               return this._metrics;
            }
            _hasPreviewFlag(n) {
               return !!this._engineConfig.previewFeatures?.includes(n);
            }
            $applyPendingMigrations() {
               return this._engine.applyPendingMigrations();
            }
         }
         return t;
      }
      function yo(e, t) {
         return Ja(e) ? [new X(e, t), Ki] : [e, Hi];
      }
      function Ja(e) {
         return Array.isArray(e) && Array.isArray(e.raw);
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      var Ga = /* @__PURE__ */ new Set([
         "toJSON",
         "$$typeof",
         "asymmetricMatch",
         Symbol.iterator,
         Symbol.toStringTag,
         Symbol.isConcatSpreadable,
         Symbol.toPrimitive,
      ]);
      function Eo(e) {
         return new Proxy(e, {
            get(t, r) {
               if (r in t) return t[r];
               if (!Ga.has(r)) throw new TypeError(`Invalid enum value: ${String(r)}`);
            },
         });
      }
      c2();
      m2();
      p();
      d();
      f2();
      l();
      l();
   },
});

// ../../node_modules/.prisma/client/query_engine_bg.js
var require_query_engine_bg = __commonJS({
   "../../node_modules/.prisma/client/query_engine_bg.js"(exports, module) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      var F2 = Object.defineProperty;
      var R = Object.getOwnPropertyDescriptor;
      var B2 = Object.getOwnPropertyNames;
      var U = Object.prototype.hasOwnProperty;
      var D2 = (n, t) => {
         for (var e in t) F2(n, e, { get: t[e], enumerable: true });
      };
      var N2 = (n, t, e, o2) => {
         if ((t && typeof t == "object") || typeof t == "function")
            for (let _2 of B2(t))
               !U.call(n, _2) && _2 !== e && F2(n, _2, { get: () => t[_2], enumerable: !(o2 = R(t, _2)) || o2.enumerable });
         return n;
      };
      var C = n => N2(F2({}, "__esModule", { value: true }), n);
      var vt = {};
      D2(vt, {
         QueryEngine: () => Z,
         __wbg_String_88810dfeb4021902: () => Dn,
         __wbg_buffer_344d9b41efe96da7: () => Cn,
         __wbg_call_53fc3abd42e24ec8: () => gt,
         __wbg_call_669127b9d730c650: () => Zn,
         __wbg_crypto_58f13aa23ffcb166: () => Jn,
         __wbg_done_bc26bf4ada718266: () => rt,
         __wbg_entries_6d727b73ee02b7ce: () => Tt,
         __wbg_getRandomValues_504510b5564925af: () => Wn,
         __wbg_getTime_ed6ee333b702f8fc: () => an,
         __wbg_get_2aff440840bb6202: () => ct,
         __wbg_get_4a9aa5157afeb382: () => nt,
         __wbg_get_94990005bd6ca07c: () => Un,
         __wbg_getwithrefkey_5e6d9547403deab8: () => Rn,
         __wbg_globalThis_17eff828815f7d84: () => st,
         __wbg_global_46f939f6541643c5: () => ft,
         __wbg_has_cdf8b85f6e903c80: () => un,
         __wbg_instanceof_ArrayBuffer_c7cc317e5c29cc0d: () => ht,
         __wbg_instanceof_Promise_cfbcc42300367513: () => ln,
         __wbg_instanceof_Uint8Array_19e6f142a5e7e1e1: () => mt,
         __wbg_isArray_38525be7442aa21e: () => bt,
         __wbg_isSafeInteger_c38b0a16d0c7cef7: () => lt,
         __wbg_iterator_7ee1a391d310f8e4: () => yn,
         __wbg_length_a5587d6cd79ab197: () => yt,
         __wbg_length_cace2e0b3ddc0502: () => pn,
         __wbg_msCrypto_abcb1295e768d1f2: () => Kn,
         __wbg_new0_ad75dd38f92424e2: () => fn,
         __wbg_new_08236689f0afb357: () => qn,
         __wbg_new_1b94180eeb48f2a2: () => In,
         __wbg_new_c728d68b8b34487e: () => kn,
         __wbg_new_d8a000788389a31e: () => $n,
         __wbg_new_feb65b865d980ae2: () => en,
         __wbg_newnoargs_ccdcae30fd002262: () => at,
         __wbg_newwithbyteoffsetandlength_2dc04d99088b15e3: () => Ln,
         __wbg_newwithlength_13b5319ab422dcf6: () => Xn,
         __wbg_next_15da6a3df9290720: () => _t2,
         __wbg_next_1989a20442400aaa: () => et,
         __wbg_node_523d7bd03ef69fba: () => Hn,
         __wbg_now_4579335d3581594c: () => gn,
         __wbg_now_8ed1a4454e40ecd1: () => bn,
         __wbg_parse_3f0cb48976ca4123: () => sn,
         __wbg_process_5b786e71d465a513: () => Vn,
         __wbg_push_fd3233d09cf81821: () => Bn,
         __wbg_randomFillSync_a0d98aa11c81fe89: () => zn2,
         __wbg_require_2784e593a4674877: () => Gn,
         __wbg_resolve_a3252b2860f0a09e: () => It2,
         __wbg_self_3fad056edded10bd: () => it,
         __wbg_setTimeout_631fe61f31fa2fad: () => rn,
         __wbg_set_0ac78a2bc07da03c: () => Fn,
         __wbg_set_3355b9f2d3092e3b: () => vn,
         __wbg_set_40f7786a25a9cc7e: () => dt,
         __wbg_set_841ac57cff3d672b: () => Mn,
         __wbg_set_dcfd613a3420f908: () => pt,
         __wbg_set_wasm: () => L,
         __wbg_stringify_4039297315a25b00: () => wt,
         __wbg_subarray_6ca5cfa7fbb9abbe: () => Pn,
         __wbg_then_1bbc9edafd859b06: () => Ft,
         __wbg_then_89e1c559530b85cf: () => qt,
         __wbg_valueOf_ff4b62641803432a: () => tt,
         __wbg_value_0570714ff7d75f35: () => ot,
         __wbg_versions_c2ab80650590b6a2: () => Qn,
         __wbg_window_a4f46c98a61d4089: () => ut,
         __wbindgen_bigint_from_i64: () => Tn,
         __wbindgen_bigint_from_u64: () => Sn,
         __wbindgen_bigint_get_as_i64: () => At2,
         __wbindgen_boolean_get: () => xn,
         __wbindgen_cb_drop: () => Ot,
         __wbindgen_closure_wrapper7123: () => kt,
         __wbindgen_debug_string: () => St,
         __wbindgen_error_new: () => tn,
         __wbindgen_in: () => An,
         __wbindgen_is_bigint: () => mn,
         __wbindgen_is_function: () => Yn2,
         __wbindgen_is_object: () => dn,
         __wbindgen_is_string: () => En,
         __wbindgen_is_undefined: () => cn,
         __wbindgen_jsval_eq: () => jn,
         __wbindgen_jsval_loose_eq: () => xt2,
         __wbindgen_memory: () => Nn,
         __wbindgen_number_get: () => hn,
         __wbindgen_number_new: () => On,
         __wbindgen_object_clone_ref: () => _n,
         __wbindgen_object_drop_ref: () => wn,
         __wbindgen_string_get: () => nn,
         __wbindgen_string_new: () => on3,
         __wbindgen_throw: () => jt,
         debug_panic: () => K,
         getBuildTimeInfo: () => G2,
      });
      module.exports = C(vt);
      var h = () => {};
      h.prototype = h;
      var c2;
      function L(n) {
         c2 = n;
      }
      var w = new Array(128).fill(void 0);
      w.push(void 0, null, true, false);
      function r(n) {
         return w[n];
      }
      var a = 0;
      var T2 = null;
      function A() {
         return (T2 === null || T2.byteLength === 0) && (T2 = new Uint8Array(c2.memory.buffer)), T2;
      }
      var $ = typeof TextEncoder > "u" ? (0, module.require)("util").TextEncoder : TextEncoder;
      var S = new $("utf-8");
      var z2 =
         typeof S.encodeInto == "function"
            ? function (n, t) {
                 return S.encodeInto(n, t);
              }
            : function (n, t) {
                 const e = S.encode(n);
                 return t.set(e), { read: n.length, written: e.length };
              };
      function g(n, t, e) {
         if (e === void 0) {
            const s = S.encode(n),
               p = t(s.length, 1) >>> 0;
            return (
               A()
                  .subarray(p, p + s.length)
                  .set(s),
               (a = s.length),
               p
            );
         }
         let o2 = n.length,
            _2 = t(o2, 1) >>> 0;
         const f2 = A();
         let u2 = 0;
         for (; u2 < o2; u2++) {
            const s = n.charCodeAt(u2);
            if (s > 127) break;
            f2[_2 + u2] = s;
         }
         if (u2 !== o2) {
            u2 !== 0 && (n = n.slice(u2)), (_2 = e(_2, o2, (o2 = u2 + n.length * 3), 1) >>> 0);
            const s = A().subarray(_2 + u2, _2 + o2),
               p = z2(n, s);
            (u2 += p.written), (_2 = e(_2, o2, u2, 1) >>> 0);
         }
         return (a = u2), _2;
      }
      function y(n) {
         return n == null;
      }
      var j = null;
      function d() {
         return (j === null || j.byteLength === 0) && (j = new Int32Array(c2.memory.buffer)), j;
      }
      var P = typeof TextDecoder > "u" ? (0, module.require)("util").TextDecoder : TextDecoder;
      var k2 = new P("utf-8", { ignoreBOM: true, fatal: true });
      k2.decode();
      function x(n, t) {
         return (n = n >>> 0), k2.decode(A().subarray(n, n + t));
      }
      var m2 = w.length;
      function i(n) {
         m2 === w.length && w.push(w.length + 1);
         const t = m2;
         return (m2 = w[t]), (w[t] = n), t;
      }
      function W2(n) {
         n < 132 || ((w[n] = m2), (m2 = n));
      }
      function b(n) {
         const t = r(n);
         return W2(n), t;
      }
      var O = null;
      function J() {
         return (O === null || O.byteLength === 0) && (O = new Float64Array(c2.memory.buffer)), O;
      }
      var q2 = null;
      function V2() {
         return (q2 === null || q2.byteLength === 0) && (q2 = new BigInt64Array(c2.memory.buffer)), q2;
      }
      function I(n) {
         const t = typeof n;
         if (t == "number" || t == "boolean" || n == null) return `${n}`;
         if (t == "string") return `"${n}"`;
         if (t == "symbol") {
            const _2 = n.description;
            return _2 == null ? "Symbol" : `Symbol(${_2})`;
         }
         if (t == "function") {
            const _2 = n.name;
            return typeof _2 == "string" && _2.length > 0 ? `Function(${_2})` : "Function";
         }
         if (Array.isArray(n)) {
            const _2 = n.length;
            let f2 = "[";
            _2 > 0 && (f2 += I(n[0]));
            for (let u2 = 1; u2 < _2; u2++) f2 += ", " + I(n[u2]);
            return (f2 += "]"), f2;
         }
         const e = /\[object ([^\]]+)\]/.exec(toString.call(n));
         let o2;
         if (e.length > 1) o2 = e[1];
         else return toString.call(n);
         if (o2 == "Object")
            try {
               return "Object(" + JSON.stringify(n) + ")";
            } catch {
               return "Object";
            }
         return n instanceof Error
            ? `${n.name}: ${n.message}
${n.stack}`
            : o2;
      }
      var v2 =
         typeof FinalizationRegistry > "u"
            ? { register: () => {}, unregister: () => {} }
            : new FinalizationRegistry(n => {
                 c2.__wbindgen_export_2.get(n.dtor)(n.a, n.b);
              });
      function Q2(n, t, e, o2) {
         const _2 = { a: n, b: t, cnt: 1, dtor: e },
            f2 = (...u2) => {
               _2.cnt++;
               const s = _2.a;
               _2.a = 0;
               try {
                  return o2(s, _2.b, ...u2);
               } finally {
                  --_2.cnt === 0 ? (c2.__wbindgen_export_2.get(_2.dtor)(s, _2.b), v2.unregister(_2)) : (_2.a = s);
               }
            };
         return (f2.original = _2), v2.register(f2, _2, _2), f2;
      }
      function H(n, t, e) {
         c2._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h554ff6a6704ac014(
            n,
            t,
            i(e),
         );
      }
      function G2() {
         const n = c2.getBuildTimeInfo();
         return b(n);
      }
      function K(n) {
         try {
            const f2 = c2.__wbindgen_add_to_stack_pointer(-16);
            var t = y(n) ? 0 : g(n, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               e = a;
            c2.debug_panic(f2, t, e);
            var o2 = d()[f2 / 4 + 0],
               _2 = d()[f2 / 4 + 1];
            if (_2) throw b(o2);
         } finally {
            c2.__wbindgen_add_to_stack_pointer(16);
         }
      }
      function l(n, t) {
         try {
            return n.apply(this, t);
         } catch (e) {
            c2.__wbindgen_exn_store(i(e));
         }
      }
      function X(n, t, e, o2) {
         c2.wasm_bindgen__convert__closures__invoke2_mut__h3412307291f32ce1(n, t, i(e), i(o2));
      }
      var Y =
         typeof FinalizationRegistry > "u"
            ? { register: () => {}, unregister: () => {} }
            : new FinalizationRegistry(n => c2.__wbg_queryengine_free(n >>> 0));
      var Z = class {
         __destroy_into_raw() {
            const t = this.__wbg_ptr;
            return (this.__wbg_ptr = 0), Y.unregister(this), t;
         }
         free() {
            const t = this.__destroy_into_raw();
            c2.__wbg_queryengine_free(t);
         }
         constructor(t, e, o2) {
            try {
               const s = c2.__wbindgen_add_to_stack_pointer(-16);
               c2.queryengine_new(s, i(t), i(e), i(o2));
               var _2 = d()[s / 4 + 0],
                  f2 = d()[s / 4 + 1],
                  u2 = d()[s / 4 + 2];
               if (u2) throw b(f2);
               return (this.__wbg_ptr = _2 >>> 0), this;
            } finally {
               c2.__wbindgen_add_to_stack_pointer(16);
            }
         }
         connect(t) {
            const e = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               o2 = a,
               _2 = c2.queryengine_connect(this.__wbg_ptr, e, o2);
            return b(_2);
         }
         disconnect(t) {
            const e = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               o2 = a,
               _2 = c2.queryengine_disconnect(this.__wbg_ptr, e, o2);
            return b(_2);
         }
         query(t, e, o2) {
            const _2 = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               f2 = a,
               u2 = g(e, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               s = a;
            var p = y(o2) ? 0 : g(o2, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               E = a;
            const M = c2.queryengine_query(this.__wbg_ptr, _2, f2, u2, s, p, E);
            return b(M);
         }
         startTransaction(t, e) {
            const o2 = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               _2 = a,
               f2 = g(e, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               u2 = a,
               s = c2.queryengine_startTransaction(this.__wbg_ptr, o2, _2, f2, u2);
            return b(s);
         }
         commitTransaction(t, e) {
            const o2 = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               _2 = a,
               f2 = g(e, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               u2 = a,
               s = c2.queryengine_commitTransaction(this.__wbg_ptr, o2, _2, f2, u2);
            return b(s);
         }
         rollbackTransaction(t, e) {
            const o2 = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               _2 = a,
               f2 = g(e, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               u2 = a,
               s = c2.queryengine_rollbackTransaction(this.__wbg_ptr, o2, _2, f2, u2);
            return b(s);
         }
         metrics(t) {
            const e = g(t, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
               o2 = a,
               _2 = c2.queryengine_metrics(this.__wbg_ptr, e, o2);
            return b(_2);
         }
      };
      function nn(n, t) {
         const e = r(t),
            o2 = typeof e == "string" ? e : void 0;
         var _2 = y(o2) ? 0 : g(o2, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
            f2 = a;
         (d()[n / 4 + 1] = f2), (d()[n / 4 + 0] = _2);
      }
      function tn(n, t) {
         const e = new Error(x(n, t));
         return i(e);
      }
      function en(n, t) {
         try {
            var e = { a: n, b: t },
               o2 = (f2, u2) => {
                  const s = e.a;
                  e.a = 0;
                  try {
                     return X(s, e.b, f2, u2);
                  } finally {
                     e.a = s;
                  }
               };
            const _2 = new Promise(o2);
            return i(_2);
         } finally {
            e.a = e.b = 0;
         }
      }
      function rn(n, t) {
         return setTimeout(r(n), t >>> 0);
      }
      function on3(n, t) {
         const e = x(n, t);
         return i(e);
      }
      function _n(n) {
         const t = r(n);
         return i(t);
      }
      function cn(n) {
         return r(n) === void 0;
      }
      function un() {
         return l(function (n, t) {
            return Reflect.has(r(n), r(t));
         }, arguments);
      }
      function sn() {
         return l(function (n, t) {
            const e = JSON.parse(x(n, t));
            return i(e);
         }, arguments);
      }
      function fn() {
         return i(/* @__PURE__ */ new Date());
      }
      function an(n) {
         return r(n).getTime();
      }
      function bn(n) {
         return r(n).now();
      }
      function gn() {
         return Date.now();
      }
      function ln(n) {
         let t;
         try {
            t = r(n) instanceof Promise;
         } catch {
            t = false;
         }
         return t;
      }
      function dn(n) {
         const t = r(n);
         return typeof t == "object" && t !== null;
      }
      function wn(n) {
         b(n);
      }
      function pn(n) {
         return r(n).length;
      }
      function yn() {
         return i(Symbol.iterator);
      }
      function xn(n) {
         const t = r(n);
         return typeof t == "boolean" ? (t ? 1 : 0) : 2;
      }
      function mn(n) {
         return typeof r(n) == "bigint";
      }
      function hn(n, t) {
         const e = r(t),
            o2 = typeof e == "number" ? e : void 0;
         (J()[n / 8 + 1] = y(o2) ? 0 : o2), (d()[n / 4 + 0] = !y(o2));
      }
      function Tn(n) {
         return i(n);
      }
      function An(n, t) {
         return r(n) in r(t);
      }
      function Sn(n) {
         const t = BigInt.asUintN(64, n);
         return i(t);
      }
      function jn(n, t) {
         return r(n) === r(t);
      }
      function On(n) {
         return i(n);
      }
      function qn() {
         const n = new Array();
         return i(n);
      }
      function Fn(n, t, e) {
         r(n)[t >>> 0] = b(e);
      }
      function In() {
         return i(/* @__PURE__ */ new Map());
      }
      function kn() {
         const n = new Object();
         return i(n);
      }
      function vn(n, t, e) {
         const o2 = r(n).set(r(t), r(e));
         return i(o2);
      }
      function En(n) {
         return typeof r(n) == "string";
      }
      function Mn(n, t, e) {
         r(n)[b(t)] = b(e);
      }
      function Rn(n, t) {
         const e = r(n)[r(t)];
         return i(e);
      }
      function Bn(n, t) {
         return r(n).push(r(t));
      }
      function Un() {
         return l(function (n, t) {
            const e = r(n)[b(t)];
            return i(e);
         }, arguments);
      }
      function Dn(n, t) {
         const e = String(r(t)),
            o2 = g(e, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
            _2 = a;
         (d()[n / 4 + 1] = _2), (d()[n / 4 + 0] = o2);
      }
      function Nn() {
         const n = c2.memory;
         return i(n);
      }
      function Cn(n) {
         const t = r(n).buffer;
         return i(t);
      }
      function Ln(n, t, e) {
         const o2 = new Uint8Array(r(n), t >>> 0, e >>> 0);
         return i(o2);
      }
      function $n(n) {
         const t = new Uint8Array(r(n));
         return i(t);
      }
      function zn2() {
         return l(function (n, t) {
            r(n).randomFillSync(b(t));
         }, arguments);
      }
      function Pn(n, t, e) {
         const o2 = r(n).subarray(t >>> 0, e >>> 0);
         return i(o2);
      }
      function Wn() {
         return l(function (n, t) {
            r(n).getRandomValues(r(t));
         }, arguments);
      }
      function Jn(n) {
         const t = r(n).crypto;
         return i(t);
      }
      function Vn(n) {
         const t = r(n).process;
         return i(t);
      }
      function Qn(n) {
         const t = r(n).versions;
         return i(t);
      }
      function Hn(n) {
         const t = r(n).node;
         return i(t);
      }
      function Gn() {
         return l(function () {
            const n = module.require;
            return i(n);
         }, arguments);
      }
      function Kn(n) {
         const t = r(n).msCrypto;
         return i(t);
      }
      function Xn(n) {
         const t = new Uint8Array(n >>> 0);
         return i(t);
      }
      function Yn2(n) {
         return typeof r(n) == "function";
      }
      function Zn() {
         return l(function (n, t) {
            const e = r(n).call(r(t));
            return i(e);
         }, arguments);
      }
      function nt(n, t) {
         const e = r(n)[t >>> 0];
         return i(e);
      }
      function tt(n) {
         return r(n).valueOf();
      }
      function et() {
         return l(function (n) {
            const t = r(n).next();
            return i(t);
         }, arguments);
      }
      function rt(n) {
         return r(n).done;
      }
      function ot(n) {
         const t = r(n).value;
         return i(t);
      }
      function _t2(n) {
         const t = r(n).next;
         return i(t);
      }
      function ct() {
         return l(function (n, t) {
            const e = Reflect.get(r(n), r(t));
            return i(e);
         }, arguments);
      }
      function it() {
         return l(function () {
            const n = self.self;
            return i(n);
         }, arguments);
      }
      function ut() {
         return l(function () {
            const n = window.window;
            return i(n);
         }, arguments);
      }
      function st() {
         return l(function () {
            const n = globalThis.globalThis;
            return i(n);
         }, arguments);
      }
      function ft() {
         return l(function () {
            const n = globalThis.global;
            return i(n);
         }, arguments);
      }
      function at(n, t) {
         const e = new h(x(n, t));
         return i(e);
      }
      function bt(n) {
         return Array.isArray(r(n));
      }
      function gt() {
         return l(function (n, t, e) {
            const o2 = r(n).call(r(t), r(e));
            return i(o2);
         }, arguments);
      }
      function lt(n) {
         return Number.isSafeInteger(r(n));
      }
      function dt() {
         return l(function (n, t, e) {
            return Reflect.set(r(n), r(t), r(e));
         }, arguments);
      }
      function wt() {
         return l(function (n) {
            const t = JSON.stringify(r(n));
            return i(t);
         }, arguments);
      }
      function pt(n, t, e) {
         r(n).set(r(t), e >>> 0);
      }
      function yt(n) {
         return r(n).length;
      }
      function xt2(n, t) {
         return r(n) == r(t);
      }
      function mt(n) {
         let t;
         try {
            t = r(n) instanceof Uint8Array;
         } catch {
            t = false;
         }
         return t;
      }
      function ht(n) {
         let t;
         try {
            t = r(n) instanceof ArrayBuffer;
         } catch {
            t = false;
         }
         return t;
      }
      function Tt(n) {
         const t = Object.entries(r(n));
         return i(t);
      }
      function At2(n, t) {
         const e = r(t),
            o2 = typeof e == "bigint" ? e : void 0;
         (V2()[n / 8 + 1] = y(o2) ? BigInt(0) : o2), (d()[n / 4 + 0] = !y(o2));
      }
      function St(n, t) {
         const e = I(r(t)),
            o2 = g(e, c2.__wbindgen_malloc, c2.__wbindgen_realloc),
            _2 = a;
         (d()[n / 4 + 1] = _2), (d()[n / 4 + 0] = o2);
      }
      function jt(n, t) {
         throw new Error(x(n, t));
      }
      function Ot(n) {
         const t = b(n).original;
         return t.cnt-- == 1 ? ((t.a = 0), true) : false;
      }
      function qt(n, t) {
         const e = r(n).then(r(t));
         return i(e);
      }
      function Ft(n, t, e) {
         const o2 = r(n).then(r(t), r(e));
         return i(o2);
      }
      function It2(n) {
         const t = Promise.resolve(r(n));
         return i(t);
      }
      function kt(n, t, e) {
         const o2 = Q2(n, t, 327, H);
         return i(o2);
      }
   },
});

// ../../node_modules/.prisma/client/wasm-worker-loader.mjs
var wasm_worker_loader_exports = {};
__export(wasm_worker_loader_exports, {
   default: () => wasm_worker_loader_default,
});
var wasm_worker_loader_default;
var init_wasm_worker_loader = __esm({
   "../../node_modules/.prisma/client/wasm-worker-loader.mjs"() {
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      wasm_worker_loader_default = import("./b6258fc2cf2ac36a0d65cd2f79b8408fa6fb5dcd-query_engine_bg.wasm");
   },
});

// ../../node_modules/.prisma/client/wasm.js
var require_wasm2 = __commonJS({
   "../../node_modules/.prisma/client/wasm.js"(exports) {
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      Object.defineProperty(exports, "__esModule", { value: true });
      var {
         PrismaClientKnownRequestError: PrismaClientKnownRequestError2,
         PrismaClientUnknownRequestError: PrismaClientUnknownRequestError2,
         PrismaClientRustPanicError: PrismaClientRustPanicError2,
         PrismaClientInitializationError: PrismaClientInitializationError2,
         PrismaClientValidationError: PrismaClientValidationError2,
         NotFoundError: NotFoundError2,
         getPrismaClient: getPrismaClient2,
         sqltag: sqltag2,
         empty: empty2,
         join: join3,
         raw: raw3,
         Decimal: Decimal2,
         Debug: Debug3,
         objectEnumValues: objectEnumValues2,
         makeStrictEnum: makeStrictEnum2,
         Extensions: Extensions2,
         warnOnce: warnOnce2,
         defineDmmfProperty: defineDmmfProperty2,
         Public: Public2,
         getRuntime: getRuntime2,
      } = require_wasm();
      var Prisma9 = {};
      exports.Prisma = Prisma9;
      exports.$Enums = {};
      Prisma9.prismaVersion = {
         client: "5.17.0",
         engine: "393aa359c9ad4a4bb28630fb5613f9c281cde053",
      };
      Prisma9.PrismaClientKnownRequestError = PrismaClientKnownRequestError2;
      Prisma9.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError2;
      Prisma9.PrismaClientRustPanicError = PrismaClientRustPanicError2;
      Prisma9.PrismaClientInitializationError = PrismaClientInitializationError2;
      Prisma9.PrismaClientValidationError = PrismaClientValidationError2;
      Prisma9.NotFoundError = NotFoundError2;
      Prisma9.Decimal = Decimal2;
      Prisma9.sql = sqltag2;
      Prisma9.empty = empty2;
      Prisma9.join = join3;
      Prisma9.raw = raw3;
      Prisma9.validator = Public2.validator;
      Prisma9.getExtensionContext = Extensions2.getExtensionContext;
      Prisma9.defineExtension = Extensions2.defineExtension;
      Prisma9.DbNull = objectEnumValues2.instances.DbNull;
      Prisma9.JsonNull = objectEnumValues2.instances.JsonNull;
      Prisma9.AnyNull = objectEnumValues2.instances.AnyNull;
      Prisma9.NullTypes = {
         DbNull: objectEnumValues2.classes.DbNull,
         JsonNull: objectEnumValues2.classes.JsonNull,
         AnyNull: objectEnumValues2.classes.AnyNull,
      };
      exports.Prisma.TransactionIsolationLevel = makeStrictEnum2({
         ReadUncommitted: "ReadUncommitted",
         ReadCommitted: "ReadCommitted",
         RepeatableRead: "RepeatableRead",
         Serializable: "Serializable",
      });
      exports.Prisma.UserScalarFieldEnum = {
         id: "id",
         username: "username",
         displayName: "displayName",
         email: "email",
         avatar: "avatar",
         password: "password",
         flags: "flags",
         system: "system",
      };
      exports.Prisma.ChannelScalarFieldEnum = {
         id: "id",
         icon: "icon",
         lastMessageId: "lastMessageId",
         name: "name",
         ownerId: "ownerId",
         type: "type",
      };
      exports.Prisma.MessageScalarFieldEnum = {
         id: "id",
         authorId: "authorId",
         channelId: "channelId",
         content: "content",
         createdAt: "createdAt",
         editedAt: "editedAt",
         attachments: "attachments",
         reactions: "reactions",
         pinned: "pinned",
         type: "type",
         flags: "flags",
      };
      exports.Prisma.RelationshipScalarFieldEnum = {
         id: "id",
         type: "type",
         nickname: "nickname",
         since: "since",
         ownerId: "ownerId",
         userId: "userId",
      };
      exports.Prisma.SortOrder = {
         asc: "asc",
         desc: "desc",
      };
      exports.Prisma.QueryMode = {
         default: "default",
         insensitive: "insensitive",
      };
      exports.Prisma.NullsOrder = {
         first: "first",
         last: "last",
      };
      exports.Prisma.ModelName = {
         User: "User",
         Channel: "Channel",
         Message: "Message",
         Relationship: "Relationship",
      };
      var config3 = {
         generator: {
            name: "client",
            provider: {
               fromEnvVar: null,
               value: "prisma-client-js",
            },
            output: {
               value: "E:\\JS\\huginn-monorepo\\node_modules\\@prisma\\client",
               fromEnvVar: null,
            },
            config: {
               engineType: "library",
            },
            binaryTargets: [
               {
                  fromEnvVar: null,
                  value: "windows",
                  native: true,
               },
            ],
            previewFeatures: ["driverAdapters", "omitApi"],
            sourceFilePath: "E:\\JS\\huginn-monorepo\\packages\\huginn-server\\prisma\\schema.prisma",
         },
         relativeEnvPaths: {
            rootEnvPath: null,
            schemaEnvPath: "../../../packages/huginn-server/.env",
         },
         relativePath: "../../../packages/huginn-server/prisma",
         clientVersion: "5.17.0",
         engineVersion: "393aa359c9ad4a4bb28630fb5613f9c281cde053",
         datasourceNames: ["db"],
         activeProvider: "postgresql",
         postinstall: false,
         inlineDatasources: {
            db: {
               url: {
                  fromEnvVar: "POSTGRESQL_URL",
                  value: null,
               },
            },
         },
         inlineSchema:
            'generator client {\n  provider        = "prisma-client-js"\n  previewFeatures = ["omitApi", "driverAdapters"]\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("POSTGRESQL_URL")\n}\n\nmodel User {\n  id                   BigInt         @id\n  username             String         @unique\n  displayName          String\n  email                String         @unique\n  avatar               String\n  password             String\n  flags                Int            @db.SmallInt\n  system               Boolean        @default(false)\n  includedChannels     Channel[]      @relation("channel_recipients")\n  ownedChannels        Channel[]      @relation("channel_owner")\n  tempDeletedChannels  Channel[]      @relation("channel_temp_deleted")\n  messages             Message[]\n  mentionedMessages    Message[]      @relation("message_mentions")\n  relationships        Relationship[] @relation("relation_owner")\n  relatedRelationships Relationship[] @relation("relation_user")\n}\n\nmodel Channel {\n  id                 BigInt    @id\n  icon               String?\n  lastMessageId      BigInt?\n  name               String?\n  owner              User?     @relation("channel_owner", fields: [ownerId], references: [id])\n  ownerId            BigInt?\n  recipients         User[]    @relation("channel_recipients")\n  messages           Message[]\n  type               Int\n  tempDeletedByUsers User[]    @relation("channel_temp_deleted")\n}\n\nmodel Message {\n  id          BigInt    @id\n  author      User      @relation(fields: [authorId], references: [id])\n  authorId    BigInt\n  channel     Channel   @relation(fields: [channelId], references: [id])\n  channelId   BigInt\n  content     String\n  createdAt   DateTime\n  editedAt    DateTime?\n  mentions    User[]    @relation("message_mentions")\n  attachments String[]\n  reactions   String[]\n  pinned      Boolean\n  type        Int\n  flags       Int?      @db.SmallInt\n}\n\n// model ChannelsOnUsers {\n//   user      User    @relation(fields: [userId], references: [id])\n//   userId    BigInt\n//   channel   Channel @relation(fields: [channelId], references: [id])\n//   channelId BigInt\n\n//   @@id([userId, channelId])\n// }\n\n// model UserMentionsOnMessages {\n//   user      User    @relation(fields: [userId], references: [id])\n//   userId    BigInt\n//   message   Message @relation(fields: [messageId], references: [id])\n//   messageId BigInt\n\n//   @@id([userId, messageId])\n// }\n\nmodel Relationship {\n  id       BigInt    @id\n  type     Int       @db.SmallInt\n  nickname String\n  since    DateTime?\n  owner    User      @relation("relation_owner", fields: [ownerId], references: [id])\n  ownerId  BigInt\n  user     User      @relation("relation_user", fields: [userId], references: [id])\n  userId   BigInt\n}\n',
         inlineSchemaHash: "9af718abcbd820bb20e0cc76a304d99a1e4af86b428f53d519e7dddebed41672",
         copyEngine: true,
      };
      config3.dirname = "/";
      config3.runtimeDataModel = JSON.parse(
         '{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"BigInt"},{"name":"username","kind":"scalar","type":"String"},{"name":"displayName","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"flags","kind":"scalar","type":"Int"},{"name":"system","kind":"scalar","type":"Boolean"},{"name":"includedChannels","kind":"object","type":"Channel","relationName":"channel_recipients"},{"name":"ownedChannels","kind":"object","type":"Channel","relationName":"channel_owner"},{"name":"tempDeletedChannels","kind":"object","type":"Channel","relationName":"channel_temp_deleted"},{"name":"messages","kind":"object","type":"Message","relationName":"MessageToUser"},{"name":"mentionedMessages","kind":"object","type":"Message","relationName":"message_mentions"},{"name":"relationships","kind":"object","type":"Relationship","relationName":"relation_owner"},{"name":"relatedRelationships","kind":"object","type":"Relationship","relationName":"relation_user"}],"dbName":null},"Channel":{"fields":[{"name":"id","kind":"scalar","type":"BigInt"},{"name":"icon","kind":"scalar","type":"String"},{"name":"lastMessageId","kind":"scalar","type":"BigInt"},{"name":"name","kind":"scalar","type":"String"},{"name":"owner","kind":"object","type":"User","relationName":"channel_owner"},{"name":"ownerId","kind":"scalar","type":"BigInt"},{"name":"recipients","kind":"object","type":"User","relationName":"channel_recipients"},{"name":"messages","kind":"object","type":"Message","relationName":"ChannelToMessage"},{"name":"type","kind":"scalar","type":"Int"},{"name":"tempDeletedByUsers","kind":"object","type":"User","relationName":"channel_temp_deleted"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"BigInt"},{"name":"author","kind":"object","type":"User","relationName":"MessageToUser"},{"name":"authorId","kind":"scalar","type":"BigInt"},{"name":"channel","kind":"object","type":"Channel","relationName":"ChannelToMessage"},{"name":"channelId","kind":"scalar","type":"BigInt"},{"name":"content","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"editedAt","kind":"scalar","type":"DateTime"},{"name":"mentions","kind":"object","type":"User","relationName":"message_mentions"},{"name":"attachments","kind":"scalar","type":"String"},{"name":"reactions","kind":"scalar","type":"String"},{"name":"pinned","kind":"scalar","type":"Boolean"},{"name":"type","kind":"scalar","type":"Int"},{"name":"flags","kind":"scalar","type":"Int"}],"dbName":null},"Relationship":{"fields":[{"name":"id","kind":"scalar","type":"BigInt"},{"name":"type","kind":"scalar","type":"Int"},{"name":"nickname","kind":"scalar","type":"String"},{"name":"since","kind":"scalar","type":"DateTime"},{"name":"owner","kind":"object","type":"User","relationName":"relation_owner"},{"name":"ownerId","kind":"scalar","type":"BigInt"},{"name":"user","kind":"object","type":"User","relationName":"relation_user"},{"name":"userId","kind":"scalar","type":"BigInt"}],"dbName":null}},"enums":{},"types":{}}',
      );
      defineDmmfProperty2(exports.Prisma, config3.runtimeDataModel);
      config3.engineWasm = {
         getRuntime: () => require_query_engine_bg(),
         getQueryEngineWasmModule: async () => {
            const loader = (await Promise.resolve().then(() => (init_wasm_worker_loader(), wasm_worker_loader_exports))).default;
            const engine = (await loader).default;
            return engine;
         },
      };
      config3.injectableEdgeEnv = () => ({
         parsed: {
            POSTGRESQL_URL:
               (typeof globalThis !== "undefined" && globalThis["POSTGRESQL_URL"]) ||
               (typeof process !== "undefined" && process.env && process.env.POSTGRESQL_URL) ||
               void 0,
         },
      });
      if (
         (typeof globalThis !== "undefined" && globalThis["DEBUG"]) ||
         (typeof process !== "undefined" && process.env && process.env.DEBUG) ||
         void 0
      ) {
         Debug3.enable(
            (typeof globalThis !== "undefined" && globalThis["DEBUG"]) ||
               (typeof process !== "undefined" && process.env && process.env.DEBUG) ||
               void 0,
         );
      }
      var PrismaClient2 = getPrismaClient2(config3);
      exports.PrismaClient = PrismaClient2;
      Object.assign(exports, Prisma9);
   },
});

// ../../node_modules/.prisma/client/default.js
var require_default = __commonJS({
   "../../node_modules/.prisma/client/default.js"(exports, module) {
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      module.exports = { ...require_wasm2() };
   },
});

// ../../node_modules/@prisma/client/default.js
var require_default2 = __commonJS({
   "../../node_modules/@prisma/client/default.js"(exports, module) {
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      module.exports = {
         ...require_default(),
      };
   },
});

// ../../node_modules/@prisma/debug/dist/index.js
var require_dist2 = __commonJS({
   "../../node_modules/@prisma/debug/dist/index.js"(exports, module) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      var __defProp3 = Object.defineProperty;
      var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames2 = Object.getOwnPropertyNames;
      var __hasOwnProp2 = Object.prototype.hasOwnProperty;
      var __export2 = (target, all) => {
         for (var name2 in all) __defProp3(target, name2, { get: all[name2], enumerable: true });
      };
      var __copyProps2 = (to, from3, except, desc) => {
         if ((from3 && typeof from3 === "object") || typeof from3 === "function") {
            for (let key of __getOwnPropNames2(from3))
               if (!__hasOwnProp2.call(to, key) && key !== except)
                  __defProp3(to, key, {
                     get: () => from3[key],
                     enumerable: !(desc = __getOwnPropDesc2(from3, key)) || desc.enumerable,
                  });
         }
         return to;
      };
      var __toCommonJS = mod => __copyProps2(__defProp3({}, "__esModule", { value: true }), mod);
      var src_exports2 = {};
      __export2(src_exports2, {
         Debug: () => Debug3,
         clearLogs: () => clearLogs,
         default: () => src_default2,
         getLogs: () => getLogs,
      });
      module.exports = __toCommonJS(src_exports2);
      var colors_exports = {};
      __export2(colors_exports, {
         $: () => $,
         bgBlack: () => bgBlack,
         bgBlue: () => bgBlue,
         bgCyan: () => bgCyan,
         bgGreen: () => bgGreen,
         bgMagenta: () => bgMagenta,
         bgRed: () => bgRed,
         bgWhite: () => bgWhite,
         bgYellow: () => bgYellow,
         black: () => black,
         blue: () => blue,
         bold: () => bold,
         cyan: () => cyan,
         dim: () => dim,
         gray: () => gray,
         green: () => green,
         grey: () => grey,
         hidden: () => hidden,
         inverse: () => inverse,
         italic: () => italic,
         magenta: () => magenta,
         red: () => red,
         reset: () => reset,
         strikethrough: () => strikethrough,
         underline: () => underline,
         white: () => white,
         yellow: () => yellow,
      });
      var FORCE_COLOR;
      var NODE_DISABLE_COLORS;
      var NO_COLOR;
      var TERM;
      var isTTY = true;
      if (typeof process !== "undefined") {
         ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
         isTTY = process.stdout && process.stdout.isTTY;
      }
      var $ = {
         enabled:
            !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && ((FORCE_COLOR != null && FORCE_COLOR !== "0") || isTTY),
      };
      function init3(x, y) {
         let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
         let open = `\x1B[${x}m`,
            close = `\x1B[${y}m`;
         return function (txt) {
            if (!$.enabled || txt == null) return txt;
            return open + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) + close;
         };
      }
      var reset = init3(0, 0);
      var bold = init3(1, 22);
      var dim = init3(2, 22);
      var italic = init3(3, 23);
      var underline = init3(4, 24);
      var inverse = init3(7, 27);
      var hidden = init3(8, 28);
      var strikethrough = init3(9, 29);
      var black = init3(30, 39);
      var red = init3(31, 39);
      var green = init3(32, 39);
      var yellow = init3(33, 39);
      var blue = init3(34, 39);
      var magenta = init3(35, 39);
      var cyan = init3(36, 39);
      var white = init3(37, 39);
      var gray = init3(90, 39);
      var grey = init3(90, 39);
      var bgBlack = init3(40, 49);
      var bgRed = init3(41, 49);
      var bgGreen = init3(42, 49);
      var bgYellow = init3(43, 49);
      var bgBlue = init3(44, 49);
      var bgMagenta = init3(45, 49);
      var bgCyan = init3(46, 49);
      var bgWhite = init3(47, 49);
      var MAX_ARGS_HISTORY = 100;
      var COLORS = ["green", "yellow", "blue", "magenta", "cyan", "red"];
      var argsHistory = [];
      var lastTimestamp = Date.now();
      var lastColor = 0;
      var processEnv = typeof process !== "undefined" ? process.env : {};
      globalThis.DEBUG ??= processEnv.DEBUG ?? "";
      globalThis.DEBUG_COLORS ??= processEnv.DEBUG_COLORS ? processEnv.DEBUG_COLORS === "true" : true;
      var topProps = {
         enable(namespace) {
            if (typeof namespace === "string") {
               globalThis.DEBUG = namespace;
            }
         },
         disable() {
            const prev = globalThis.DEBUG;
            globalThis.DEBUG = "";
            return prev;
         },
         // this is the core logic to check if logging should happen or not
         enabled(namespace) {
            const listenedNamespaces = globalThis.DEBUG.split(",").map(s => {
               return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
            });
            const isListened = listenedNamespaces.some(listenedNamespace => {
               if (listenedNamespace === "" || listenedNamespace[0] === "-") return false;
               return namespace.match(RegExp(listenedNamespace.split("*").join(".*") + "$"));
            });
            const isExcluded = listenedNamespaces.some(listenedNamespace => {
               if (listenedNamespace === "" || listenedNamespace[0] !== "-") return false;
               return namespace.match(RegExp(listenedNamespace.slice(1).split("*").join(".*") + "$"));
            });
            return isListened && !isExcluded;
         },
         log: (...args) => {
            const [namespace, format2, ...rest] = args;
            const logWithFormatting = console.warn ?? console.log;
            logWithFormatting(`${namespace} ${format2}`, ...rest);
         },
         formatters: {},
         // not implemented
      };
      function debugCreate(namespace) {
         const instanceProps = {
            color: COLORS[lastColor++ % COLORS.length],
            enabled: topProps.enabled(namespace),
            namespace,
            log: topProps.log,
            extend: () => {},
            // not implemented
         };
         const debugCall = (...args) => {
            const { enabled, namespace: namespace2, color, log: log2 } = instanceProps;
            if (args.length !== 0) {
               argsHistory.push([namespace2, ...args]);
            }
            if (argsHistory.length > MAX_ARGS_HISTORY) {
               argsHistory.shift();
            }
            if (topProps.enabled(namespace2) || enabled) {
               const stringArgs = args.map(arg => {
                  if (typeof arg === "string") {
                     return arg;
                  }
                  return safeStringify(arg);
               });
               const ms = `+${Date.now() - lastTimestamp}ms`;
               lastTimestamp = Date.now();
               if (globalThis.DEBUG_COLORS) {
                  log2(colors_exports[color](bold(namespace2)), ...stringArgs, colors_exports[color](ms));
               } else {
                  log2(namespace2, ...stringArgs, ms);
               }
            }
         };
         return new Proxy(debugCall, {
            get: (_2, prop) => instanceProps[prop],
            set: (_2, prop, value) => (instanceProps[prop] = value),
         });
      }
      var Debug3 = new Proxy(debugCreate, {
         get: (_2, prop) => topProps[prop],
         set: (_2, prop, value) => (topProps[prop] = value),
      });
      function safeStringify(value, indent = 2) {
         const cache = /* @__PURE__ */ new Set();
         return JSON.stringify(
            value,
            (key, value2) => {
               if (typeof value2 === "object" && value2 !== null) {
                  if (cache.has(value2)) {
                     return `[Circular *]`;
                  }
                  cache.add(value2);
               } else if (typeof value2 === "bigint") {
                  return value2.toString();
               }
               return value2;
            },
            indent,
         );
      }
      function getLogs(numChars = 7500) {
         const logs = argsHistory
            .map(([namespace, ...args]) => {
               return `${namespace} ${args
                  .map(arg => {
                     if (typeof arg === "string") {
                        return arg;
                     } else {
                        return JSON.stringify(arg);
                     }
                  })
                  .join(" ")}`;
            })
            .join("\n");
         if (logs.length < numChars) {
            return logs;
         }
         return logs.slice(-numChars);
      }
      function clearLogs() {
         argsHistory.length = 0;
      }
      var src_default2 = Debug3;
   },
});

// ../../node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
   "../../node_modules/postgres-array/index.js"(exports) {
      "use strict";
      init_checked_fetch();
      init_modules_watch_stub();
      init_process();
      init_buffer();
      exports.parse = function (source, transform) {
         return parsePostgresArray(source, transform);
      };
      function parsePostgresArray(source, transform, nested = false) {
         let character = "";
         let quote = false;
         let position = 0;
         let dimension = 0;
         const entries = [];
         let recorded = "";
         const newEntry = function (includeEmpty) {
            let entry = recorded;
            if (entry.length > 0 || includeEmpty) {
               if (entry === "NULL" && !includeEmpty) {
                  entry = null;
               }
               if (entry !== null && transform) {
                  entry = transform(entry);
               }
               entries.push(entry);
               recorded = "";
            }
         };
         if (source[0] === "[") {
            while (position < source.length) {
               const char = source[position++];
               if (char === "=") {
                  break;
               }
            }
         }
         while (position < source.length) {
            let escaped = false;
            character = source[position++];
            if (character === "\\") {
               character = source[position++];
               escaped = true;
            }
            if (character === "{" && !quote) {
               dimension++;
               if (dimension > 1) {
                  const parser = parsePostgresArray(source.substr(position - 1), transform, true);
                  entries.push(parser.entries);
                  position += parser.position - 2;
               }
            } else if (character === "}" && !quote) {
               dimension--;
               if (!dimension) {
                  newEntry();
                  if (nested) {
                     return {
                        entries,
                        position,
                     };
                  }
               }
            } else if (character === '"' && !escaped) {
               if (quote) {
                  newEntry(true);
               }
               quote = !quote;
            } else if (character === "," && !quote) {
               newEntry();
            } else {
               recorded += character;
            }
         }
         if (dimension !== 0) {
            throw new Error("array dimension not balanced");
         }
         return entries;
      }
   },
});

// .wrangler/tmp/bundle-9HH9g4/middleware-loader.entry.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// .wrangler/tmp/bundle-9HH9g4/middleware-insertion-facade.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// src/index.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// src/server.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../huginn-shared/index.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../huginn-shared/lib/api-types.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../huginn-shared/lib/gateway-types.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../huginn-shared/lib/rest-types.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../huginn-shared/lib/constants.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var constants = {
   USERNAME_MIN_LENGTH: 4,
   USERNAME_MAX_LENGTH: 20,
   DISPLAY_NAME_MIN_LENGTH: 1,
   DISPLAY_NAME_MAX_LENGTH: 32,
   PASSWORD_MIN_LENGTH: 4,
   ACCESS_TOKEN_EXPIRE_TIME: "1d",
   REFRESH_TOKEN_EXPIRE_TIME: "7d",
   EMAIL_REGEX:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
   HEARTBEAT_INTERVAL: 1e4,
};

// ../huginn-shared/lib/routes.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var CDNRoutes = {
   /**
    * Route for:
    * - POST '/avatars/{user.id}'
    */
   uploadAvatar(userId) {
      return `/avatars/${userId}`;
   },
   /**
    * Route for:
    * - GET '/avatars/{user.id}/{avatar.hash}.{type}'
    */
   avatar(userId, hash, type) {
      return `/avatars/${userId}/${hash}.${type}`;
   },
};

// ../huginn-shared/lib/snowflake.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/@sapphire/snowflake/dist/esm/index.mjs
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var __defProp2 = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
   key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : (obj[key] = value);
var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
   __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
   return value;
};
var IncrementSymbol = Symbol("@sapphire/snowflake.increment");
var EpochSymbol = Symbol("@sapphire/snowflake.epoch");
var ProcessIdSymbol = Symbol("@sapphire/snowflake.processId");
var WorkerIdSymbol = Symbol("@sapphire/snowflake.workerId");
var MaximumWorkerId = 0b11111n;
var MaximumProcessId = 0b11111n;
var MaximumIncrement = 0b111111111111n;
var _a;
var _b;
var _c;
var _d;
var _Snowflake = class _Snowflake2 {
   /**
    * @param epoch the epoch to use
    */
   constructor(epoch2) {
      __publicField(this, "decode", this.deconstruct);
      __publicField(this, _a);
      __publicField(this, _b, 0n);
      __publicField(this, _c, 1n);
      __publicField(this, _d, 0n);
      this[EpochSymbol] = BigInt(epoch2 instanceof Date ? epoch2.getTime() : epoch2);
   }
   /**
    * The epoch for this snowflake
    */
   get epoch() {
      return this[EpochSymbol];
   }
   /**
    * Gets the configured process ID
    */
   get processId() {
      return this[ProcessIdSymbol];
   }
   /**
    * Sets the process ID that will be used by default for the {@link generate} method
    * @param value The new value, will be coerced to BigInt and masked with `0b11111n`
    */
   set processId(value) {
      this[ProcessIdSymbol] = BigInt(value) & MaximumProcessId;
   }
   /**
    * Gets the configured worker ID
    */
   get workerId() {
      return this[WorkerIdSymbol];
   }
   /**
    * Sets the worker ID that will be used by default for the {@link generate} method
    * @param value The new value, will be coerced to BigInt and masked with `0b11111n`
    */
   set workerId(value) {
      this[WorkerIdSymbol] = BigInt(value) & MaximumWorkerId;
   }
   /**
    * Generates a snowflake given an epoch and optionally a timestamp
    * @param options options to pass into the generator, see {@link SnowflakeGenerateOptions}
    *
    * **note** when `increment` is not provided it defaults to the private `increment` of the instance
    * @example
    * ```typescript
    * const epoch = new Date('2000-01-01T00:00:00.000Z');
    * const snowflake = new Snowflake(epoch).generate();
    * ```
    * @returns A unique snowflake
    */
   generate({
      increment,
      timestamp: timestamp2 = Date.now(),
      workerId = this[WorkerIdSymbol],
      processId = this[ProcessIdSymbol],
   } = {}) {
      if (timestamp2 instanceof Date) timestamp2 = BigInt(timestamp2.getTime());
      else if (typeof timestamp2 === "number") timestamp2 = BigInt(timestamp2);
      else if (typeof timestamp2 !== "bigint") {
         throw new TypeError(`"timestamp" argument must be a number, bigint, or Date (received ${typeof timestamp2})`);
      }
      if (typeof increment !== "bigint") {
         increment = this[IncrementSymbol];
         this[IncrementSymbol] = (increment + 1n) & MaximumIncrement;
      }
      return (
         ((timestamp2 - this[EpochSymbol]) << 22n) |
         ((workerId & MaximumWorkerId) << 17n) |
         ((processId & MaximumProcessId) << 12n) |
         (increment & MaximumIncrement)
      );
   }
   /**
    * Deconstructs a snowflake given a snowflake ID
    * @param id the snowflake to deconstruct
    * @returns a deconstructed snowflake
    * @example
    * ```typescript
    * const epoch = new Date('2000-01-01T00:00:00.000Z');
    * const snowflake = new Snowflake(epoch).deconstruct('3971046231244935168');
    * ```
    */
   deconstruct(id) {
      const bigIntId = BigInt(id);
      const epoch2 = this[EpochSymbol];
      return {
         id: bigIntId,
         timestamp: (bigIntId >> 22n) + epoch2,
         workerId: (bigIntId >> 17n) & MaximumWorkerId,
         processId: (bigIntId >> 12n) & MaximumProcessId,
         increment: bigIntId & MaximumIncrement,
         epoch: epoch2,
      };
   }
   /**
    * Retrieves the timestamp field's value from a snowflake.
    * @param id The snowflake to get the timestamp value from.
    * @returns The UNIX timestamp that is stored in `id`.
    */
   timestampFrom(id) {
      return Number((BigInt(id) >> 22n) + this[EpochSymbol]);
   }
   /**
    * Returns a number indicating whether a reference snowflake comes before, or after, or is same as the given
    * snowflake in sort order.
    * @param a The first snowflake to compare.
    * @param b The second snowflake to compare.
    * @returns `-1` if `a` is older than `b`, `0` if `a` and `b` are equals, `1` if `a` is newer than `b`.
    * @example Sort snowflakes in ascending order
    * ```typescript
    * const ids = ['737141877803057244', '1056191128120082432', '254360814063058944'];
    * console.log(ids.sort((a, b) => Snowflake.compare(a, b)));
    * // → ['254360814063058944', '737141877803057244', '1056191128120082432'];
    * ```
    * @example Sort snowflakes in descending order
    * ```typescript
    * const ids = ['737141877803057244', '1056191128120082432', '254360814063058944'];
    * console.log(ids.sort((a, b) => -Snowflake.compare(a, b)));
    * // → ['1056191128120082432', '737141877803057244', '254360814063058944'];
    * ```
    */
   static compare(a, b) {
      const typeA = typeof a;
      return typeA === typeof b ? (typeA === "string" ? cmpString(a, b) : cmpBigInt(a, b)) : cmpBigInt(BigInt(a), BigInt(b));
   }
};
(_a = EpochSymbol), (_b = IncrementSymbol), (_c = ProcessIdSymbol), (_d = WorkerIdSymbol);
__name(_Snowflake, "Snowflake");
var Snowflake = _Snowflake;
function cmpBigInt(a, b) {
   return a === b ? 0 : a < b ? -1 : 1;
}
__name(cmpBigInt, "cmpBigInt");
function cmpString(a, b) {
   return a === b ? 0 : a.length < b.length ? -1 : a.length > b.length ? 1 : a < b ? -1 : 1;
}
__name(cmpString, "cmpString");
var DiscordSnowflake = new Snowflake(1420070400000n);
var TwitterSnowflake = new Snowflake(1288834974657n);

// ../huginn-shared/lib/snowflake.ts
var epoch = /* @__PURE__ */ new Date("2023-01-01T00:00:00.000Z");
var globalSnowflake = new Snowflake(epoch);
var snowflake = {
   generateString() {
      const value = globalSnowflake.generate();
      return value.toString();
   },
   generate() {
      const value = globalSnowflake.generate();
      return value;
   },
};

// ../huginn-shared/lib/utils.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function omit(data, keys2) {
   const result = { ...data };
   for (const key of keys2) {
      delete result[key];
   }
   return result;
}
function omitArray(data, keys2) {
   const result = [];
   for (const obj of [...data]) {
      const modifiedObj = { ...obj };
      for (const key of keys2) {
         delete modifiedObj[key];
      }
      result.push(modifiedObj);
   }
   return result;
}
function isObject(item) {
   return item !== null && typeof item === "object" && !Array.isArray(item);
}
function deepMerge(target, source) {
   const output = { ...target };
   if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
         const sourceKey = key;
         const targetKey = key;
         if (isObject(source[sourceKey])) {
            if (!(key in target)) {
               output[key] = source[sourceKey];
            } else {
               output[key] = deepMerge(target[targetKey], source[sourceKey]);
            }
         } else {
            output[key] = source[sourceKey];
         }
      });
   }
   return output;
}
function merge(...objects) {
   return objects.reduce((acc, obj) => deepMerge(acc, obj), {});
}
function idFix(obj) {
   if (Array.isArray(obj)) {
      return obj.map(item => idFix(item));
   } else if (obj instanceof Date) {
      return obj;
   } else if (typeof obj === "object" && obj !== null) {
      const newObj = {};
      for (const key in obj) {
         if (typeof obj[key] === "bigint") {
            newObj[key] = obj[key].toString();
         } else if (typeof obj[key] === "object") {
            newObj[key] = idFix(obj[key]);
         } else {
            newObj[key] = obj[key];
         }
      }
      return newObj;
   } else {
      return obj;
   }
}
function isOpcode(data, opcode) {
   if (data && typeof data === "object") {
      return "op" in data && data.op === opcode;
   }
   return false;
}

// ../huginn-shared/lib/errors.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var Field = {
   required() {
      return ["This field is required", "REQUIRED" /* REQUIRED */];
   },
   invalidLogin() {
      return ["Login or password is invalid", "INVALID_LOGIN" /* INVALID_LOGIN */];
   },
   wrongLength(min, max) {
      let text = "";
      if (max && min) text = `This should be between ${min}-${max} characters`;
      else if (min) text = text = `This must be atleast ${min} characters long`;
      else if (max) text = `This must be at most ${max} characters long`;
      else text = "This is invalid";
      return [text, "BASE_TYPE_TOO_SHORT" /* TOO_SHORT */];
   },
   emailInvalid() {
      return ["Email is invalid", "EMAIL_INVALID" /* EMAIL_INVALID */];
   },
   emailInUse() {
      return ["Email is already registered", "EMAIL_IN_USE" /* EMAIL_IN_USE */];
   },
   usernameTaken() {
      return ["Username is already taken", "USERNAME_TAKEN" /* USERNAME_TAKEN */];
   },
   passwordIncorrect() {
      return ["Password is incorrect", "PASSWORD_INCORRECT" /* PASSWORD_INCORRECT */];
   },
};
var Error2 = {
   unauthorized() {
      return ["Unauthorized", 0 /* NONE */];
   },
   serverError() {
      return ["Server Error", 0 /* NONE */];
   },
   fileNotFound() {
      return ["File Not Found", 0 /* NONE */];
   },
   malformedBody() {
      return ["Malformed Body", 0 /* NONE */];
   },
   websocketFail() {
      return ["Websocket Upgrade Failed", 0 /* NONE */];
   },
   invalidFormBody() {
      return ["Invalid Form Body", 20001 /* INVALID_FORM_BODY */];
   },
   unknownUser(userId) {
      return [`Unknown User (${userId})`, 10004 /* UNKNOWN_USER */];
   },
   unknownChannel(channelId) {
      return [`Unknown Channel (${channelId})`, 10005 /* UNKNOWN_CHANNEL */];
   },
   unknownMessage(messageId) {
      return [`Unknown Message (${messageId})`, 10002 /* UNKNOWN_MESSAGE */];
   },
   unknownRelationship(relationshipId) {
      return [`Unknown Relationship (${relationshipId})`, 10006 /* UNKNOWN_RELATIONSHIP */];
   },
   noUserWithUsername() {
      return ["No user with specified username was found", 30001 /* USERNAME_NOT_FOUND */];
   },
   relationshipSelfRequest() {
      return ["Cannot send friend request to self", 30002 /* RELATION_SELF_REQUEST */];
   },
   relationshipExists() {
      return ["You are already friends with this user", 30003 /* RELATION_EXISTS */];
   },
};

// ../huginn-shared/lib/rest-utils.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_magic_bytes = __toESM(require_dist(), 1);
function isBufferLike(value) {
   return value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Uint8ClampedArray;
}
function parseResponse(response) {
   if (response.headers.get("Content-Type")?.startsWith("application/json")) {
      return response.json();
   } else if (response.headers.get("Content-Type")?.startsWith("text/plain")) {
      return response.text();
   }
   return response.arrayBuffer();
}
function resolveRequest(request2) {
   let query = "";
   let finalBody;
   let additionalHeaders = {};
   if (request2.query) {
      query = `?${request2.query}`;
   }
   const headers = {};
   if (request2.auth) {
      if (!request2.token) {
         throw new Error("Expected token for a request, but wasn't present " + request2.fullRoute);
      }
      headers.Authorization = `${request2.authPrefix} ${request2.token}`;
   }
   if (request2.reason?.length) {
      headers["X-Log-Reason"] = encodeURIComponent(request2.reason);
   }
   const url = `${request2.root}${request2.fullRoute}${query}`;
   if (request2.files?.length) {
      const formData = new FormData();
      for (const [index, file] of request2.files.entries()) {
         const fileKey = file.key ?? `files[${index}]`;
         if (isBufferLike(file.data)) {
            let contentType = file.contentType;
            if (!contentType) {
               const [parsedType] = (0, import_magic_bytes.default)(file.data);
               if (parsedType) {
                  contentType = parsedType.mime ?? "application/octet-stream";
               }
            }
            formData.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
         } else {
            formData.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
         }
      }
      if (request2.body) {
         if (request2.appendToFormData) {
            for (const [key, value] of Object.entries(request2.body)) {
               formData.append(key, value);
            }
         } else {
            formData.append("payload_json", JSON.stringify(request2.body));
         }
      }
      finalBody = formData;
   } else if (request2.body) {
      finalBody = JSON.stringify(request2.body);
      additionalHeaders = { "Content-Type": "application/json" };
   }
   const method = request2.method.toUpperCase();
   const fetchOptions = {
      // If for some reason we pass a body to a GET or HEAD request, remove the body
      body: ["GET", "HEAD"].includes(method) ? null : finalBody,
      headers: { ...request2.headers, ...headers, ...additionalHeaders },
      method,
   };
   return { url, fetchOptions };
}

// ../huginn-shared/lib/http-error.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var HTTPError = class extends Error {
   /**
    * @param status - The status code of the response
    * @param statusText - The status text of the response
    * @param method - The method of the request that erred
    * @param url - The url of the request that erred
    * @param bodyData - The unparsed data for the request that errored
    */
   constructor(status, statusText, method, url, bodyData) {
      super(statusText);
      this.status = status;
      this.method = method;
      this.url = url;
      this.requestBody = { files: bodyData.files, json: bodyData.body };
   }
   requestBody;
   name = HTTPError.name;
};

// ../huginn-shared/lib/file-resolver.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function resolveBuffer(data) {
   const regex = /^data:.+\/(.+);base64,(.*)$/;
   const matches = data.match(regex);
   if (matches) {
      const data2 = matches[2];
      return Buffer2.from(data2, "base64");
   }
   return Buffer2.from("", "base64");
}

// node_modules/hono/dist/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/hono.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/hono-base.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/compose.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/context.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/request.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/utils/body.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var parseBody = async (request2, options = /* @__PURE__ */ Object.create(null)) => {
   const { all = false, dot = false } = options;
   const headers = request2 instanceof HonoRequest ? request2.raw.headers : request2.headers;
   const contentType = headers.get("Content-Type");
   if (
      (contentType !== null && contentType.startsWith("multipart/form-data")) ||
      (contentType !== null && contentType.startsWith("application/x-www-form-urlencoded"))
   ) {
      return parseFormData(request2, { all, dot });
   }
   return {};
};
async function parseFormData(request2, options) {
   const formData = await request2.formData();
   if (formData) {
      return convertFormDataToBodyData(formData, options);
   }
   return {};
}
function convertFormDataToBodyData(formData, options) {
   const form = /* @__PURE__ */ Object.create(null);
   formData.forEach((value, key) => {
      const shouldParseAllValues = options.all || key.endsWith("[]");
      if (!shouldParseAllValues) {
         form[key] = value;
      } else {
         handleParsingAllValues(form, key, value);
      }
   });
   if (options.dot) {
      Object.entries(form).forEach(([key, value]) => {
         const shouldParseDotValues = key.includes(".");
         if (shouldParseDotValues) {
            handleParsingNestedValues(form, key, value);
            delete form[key];
         }
      });
   }
   return form;
}
var handleParsingAllValues = (form, key, value) => {
   if (form[key] !== void 0) {
      if (Array.isArray(form[key])) {
         form[key].push(value);
      } else {
         form[key] = [form[key], value];
      }
   } else {
      form[key] = value;
   }
};
var handleParsingNestedValues = (form, key, value) => {
   let nestedForm = form;
   const keys2 = key.split(".");
   keys2.forEach((key2, index) => {
      if (index === keys2.length - 1) {
         nestedForm[key2] = value;
      } else {
         if (
            !nestedForm[key2] ||
            typeof nestedForm[key2] !== "object" ||
            Array.isArray(nestedForm[key2]) ||
            nestedForm[key2] instanceof File
         ) {
            nestedForm[key2] = /* @__PURE__ */ Object.create(null);
         }
         nestedForm = nestedForm[key2];
      }
   });
};

// node_modules/hono/dist/utils/url.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var splitPath = path => {
   const paths = path.split("/");
   if (paths[0] === "") {
      paths.shift();
   }
   return paths;
};
var splitRoutingPath = routePath => {
   const { groups, path } = extractGroupsFromPath(routePath);
   const paths = splitPath(path);
   return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = path => {
   const groups = [];
   path = path.replace(/\{[^}]+\}/g, (match, index) => {
      const mark = `@${index}`;
      groups.push([mark, match]);
      return mark;
   });
   return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
   for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = paths.length - 1; j >= 0; j--) {
         if (paths[j].includes(mark)) {
            paths[j] = paths[j].replace(mark, groups[i][1]);
            break;
         }
      }
   }
   return paths;
};
var patternCache = {};
var getPattern = label => {
   if (label === "*") {
      return "*";
   }
   const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
   if (match) {
      if (!patternCache[label]) {
         if (match[2]) {
            patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
         } else {
            patternCache[label] = [label, match[1], true];
         }
      }
      return patternCache[label];
   }
   return null;
};
var tryDecodeURI = str => {
   try {
      return decodeURI(str);
   } catch {
      return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, match => {
         try {
            return decodeURI(match);
         } catch {
            return match;
         }
      });
   }
};
var getPath = request2 => {
   const url = request2.url;
   const start = url.indexOf("/", 8);
   let i = start;
   for (; i < url.length; i++) {
      const charCode = url.charCodeAt(i);
      if (charCode === 37) {
         const queryIndex = url.indexOf("?", i);
         const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
         return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
      } else if (charCode === 63) {
         break;
      }
   }
   return url.slice(start, i);
};
var getPathNoStrict = request2 => {
   const result = getPath(request2);
   return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
};
var mergePath = (...paths) => {
   let p = "";
   let endsWithSlash = false;
   for (let path of paths) {
      if (p[p.length - 1] === "/") {
         p = p.slice(0, -1);
         endsWithSlash = true;
      }
      if (path[0] !== "/") {
         path = `/${path}`;
      }
      if (path === "/" && endsWithSlash) {
         p = `${p}/`;
      } else if (path !== "/") {
         p = `${p}${path}`;
      }
      if (path === "/" && p === "") {
         p = "/";
      }
   }
   return p;
};
var checkOptionalParameter = path => {
   if (!path.match(/\:.+\?$/)) {
      return null;
   }
   const segments = path.split("/");
   const results = [];
   let basePath = "";
   segments.forEach(segment => {
      if (segment !== "" && !/\:/.test(segment)) {
         basePath += "/" + segment;
      } else if (/\:/.test(segment)) {
         if (/\?/.test(segment)) {
            if (results.length === 0 && basePath === "") {
               results.push("/");
            } else {
               results.push(basePath);
            }
            const optionalSegment = segment.replace("?", "");
            basePath += "/" + optionalSegment;
            results.push(basePath);
         } else {
            basePath += "/" + segment;
         }
      }
   });
   return results.filter((v2, i, a) => a.indexOf(v2) === i);
};
var _decodeURI = value => {
   if (!/[%+]/.test(value)) {
      return value;
   }
   if (value.indexOf("+") !== -1) {
      value = value.replace(/\+/g, " ");
   }
   return /%/.test(value) ? decodeURIComponent_(value) : value;
};
var _getQueryParam = (url, key, multiple) => {
   let encoded;
   if (!multiple && key && !/[%+]/.test(key)) {
      let keyIndex2 = url.indexOf(`?${key}`, 8);
      if (keyIndex2 === -1) {
         keyIndex2 = url.indexOf(`&${key}`, 8);
      }
      while (keyIndex2 !== -1) {
         const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
         if (trailingKeyCode === 61) {
            const valueIndex = keyIndex2 + key.length + 2;
            const endIndex = url.indexOf("&", valueIndex);
            return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
         } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
            return "";
         }
         keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
      }
      encoded = /[%+]/.test(url);
      if (!encoded) {
         return void 0;
      }
   }
   const results = {};
   encoded ??= /[%+]/.test(url);
   let keyIndex = url.indexOf("?", 8);
   while (keyIndex !== -1) {
      const nextKeyIndex = url.indexOf("&", keyIndex + 1);
      let valueIndex = url.indexOf("=", keyIndex);
      if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
         valueIndex = -1;
      }
      let name2 = url.slice(keyIndex + 1, valueIndex === -1 ? (nextKeyIndex === -1 ? void 0 : nextKeyIndex) : valueIndex);
      if (encoded) {
         name2 = _decodeURI(name2);
      }
      keyIndex = nextKeyIndex;
      if (name2 === "") {
         continue;
      }
      let value;
      if (valueIndex === -1) {
         value = "";
      } else {
         value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
         if (encoded) {
            value = _decodeURI(value);
         }
      }
      if (multiple) {
         if (!(results[name2] && Array.isArray(results[name2]))) {
            results[name2] = [];
         }
         results[name2].push(value);
      } else {
         results[name2] ??= value;
      }
   }
   return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
   return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
   raw;
   #validatedData;
   #matchResult;
   routeIndex = 0;
   path;
   bodyCache = {};
   constructor(request2, path = "/", matchResult = [[]]) {
      this.raw = request2;
      this.path = path;
      this.#matchResult = matchResult;
      this.#validatedData = {};
   }
   param(key) {
      return key ? this.getDecodedParam(key) : this.getAllDecodedParams();
   }
   getDecodedParam(key) {
      const paramKey = this.#matchResult[0][this.routeIndex][1][key];
      const param = this.getParamValue(paramKey);
      return param ? (/\%/.test(param) ? decodeURIComponent_(param) : param) : void 0;
   }
   getAllDecodedParams() {
      const decoded = {};
      const keys2 = Object.keys(this.#matchResult[0][this.routeIndex][1]);
      for (const key of keys2) {
         const value = this.getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
         if (value && typeof value === "string") {
            decoded[key] = /\%/.test(value) ? decodeURIComponent_(value) : value;
         }
      }
      return decoded;
   }
   getParamValue(paramKey) {
      return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
   }
   query(key) {
      return getQueryParam(this.url, key);
   }
   queries(key) {
      return getQueryParams(this.url, key);
   }
   header(name2) {
      if (name2) {
         return this.raw.headers.get(name2.toLowerCase()) ?? void 0;
      }
      const headerData = {};
      this.raw.headers.forEach((value, key) => {
         headerData[key] = value;
      });
      return headerData;
   }
   async parseBody(options) {
      return (this.bodyCache.parsedBody ??= await parseBody(this, options));
   }
   cachedBody = key => {
      const { bodyCache, raw: raw3 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
         return cachedBody;
      }
      const anyCachedKey = Object.keys(bodyCache)[0];
      if (anyCachedKey) {
         return bodyCache[anyCachedKey].then(body => {
            if (anyCachedKey === "json") {
               body = JSON.stringify(body);
            }
            return new Response(body)[key]();
         });
      }
      return (bodyCache[key] = raw3[key]());
   };
   json() {
      return this.cachedBody("json");
   }
   text() {
      return this.cachedBody("text");
   }
   arrayBuffer() {
      return this.cachedBody("arrayBuffer");
   }
   blob() {
      return this.cachedBody("blob");
   }
   formData() {
      return this.cachedBody("formData");
   }
   addValidatedData(target, data) {
      this.#validatedData[target] = data;
   }
   valid(target) {
      return this.#validatedData[target];
   }
   get url() {
      return this.raw.url;
   }
   get method() {
      return this.raw.method;
   }
   get matchedRoutes() {
      return this.#matchResult[0].map(([[, route]]) => route);
   }
   get routePath() {
      return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
   }
};

// node_modules/hono/dist/utils/html.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var HtmlEscapedCallbackPhase = {
   Stringify: 1,
   BeforeStream: 2,
   Stream: 3,
};
var raw2 = (value, callbacks) => {
   const escapedString = new String(value);
   escapedString.isEscaped = true;
   escapedString.callbacks = callbacks;
   return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
   const callbacks = str.callbacks;
   if (!callbacks?.length) {
      return Promise.resolve(str);
   }
   if (buffer) {
      buffer[0] += str;
   } else {
      buffer = [str];
   }
   const resStr = Promise.all(callbacks.map(c2 => c2({ phase, buffer, context }))).then(res =>
      Promise.all(res.filter(Boolean).map(str2 => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]),
   );
   if (preserveCallbacks) {
      return raw2(await resStr, callbacks);
   } else {
      return resStr;
   }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = (headers, map = {}) => {
   Object.entries(map).forEach(([key, value]) => headers.set(key, value));
   return headers;
};
var Context = class {
   #rawRequest;
   #req;
   env = {};
   #var;
   finalized = false;
   error;
   #status = 200;
   #executionCtx;
   #headers;
   #preparedHeaders;
   #res;
   #isFresh = true;
   #layout;
   #renderer;
   #notFoundHandler;
   #matchResult;
   #path;
   constructor(req, options) {
      this.#rawRequest = req;
      if (options) {
         this.#executionCtx = options.executionCtx;
         this.env = options.env;
         this.#notFoundHandler = options.notFoundHandler;
         this.#path = options.path;
         this.#matchResult = options.matchResult;
      }
   }
   get req() {
      this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
      return this.#req;
   }
   get event() {
      if (this.#executionCtx && "respondWith" in this.#executionCtx) {
         return this.#executionCtx;
      } else {
         throw Error("This context has no FetchEvent");
      }
   }
   get executionCtx() {
      if (this.#executionCtx) {
         return this.#executionCtx;
      } else {
         throw Error("This context has no ExecutionContext");
      }
   }
   get res() {
      this.#isFresh = false;
      return (this.#res ||= new Response("404 Not Found", { status: 404 }));
   }
   set res(_res) {
      this.#isFresh = false;
      if (this.#res && _res) {
         this.#res.headers.delete("content-type");
         for (const [k2, v2] of this.#res.headers.entries()) {
            if (k2 === "set-cookie") {
               const cookies = this.#res.headers.getSetCookie();
               _res.headers.delete("set-cookie");
               for (const cookie of cookies) {
                  _res.headers.append("set-cookie", cookie);
               }
            } else {
               _res.headers.set(k2, v2);
            }
         }
      }
      this.#res = _res;
      this.finalized = true;
   }
   render = (...args) => {
      this.#renderer ??= content => this.html(content);
      return this.#renderer(...args);
   };
   setLayout = layout => (this.#layout = layout);
   getLayout = () => this.#layout;
   setRenderer = renderer => {
      this.#renderer = renderer;
   };
   header = (name2, value, options) => {
      if (value === void 0) {
         if (this.#headers) {
            this.#headers.delete(name2);
         } else if (this.#preparedHeaders) {
            delete this.#preparedHeaders[name2.toLocaleLowerCase()];
         }
         if (this.finalized) {
            this.res.headers.delete(name2);
         }
         return;
      }
      if (options?.append) {
         if (!this.#headers) {
            this.#isFresh = false;
            this.#headers = new Headers(this.#preparedHeaders);
            this.#preparedHeaders = {};
         }
         this.#headers.append(name2, value);
      } else {
         if (this.#headers) {
            this.#headers.set(name2, value);
         } else {
            this.#preparedHeaders ??= {};
            this.#preparedHeaders[name2.toLowerCase()] = value;
         }
      }
      if (this.finalized) {
         if (options?.append) {
            this.res.headers.append(name2, value);
         } else {
            this.res.headers.set(name2, value);
         }
      }
   };
   status = status => {
      this.#isFresh = false;
      this.#status = status;
   };
   set = (key, value) => {
      this.#var ??= /* @__PURE__ */ new Map();
      this.#var.set(key, value);
   };
   get = key => {
      return this.#var ? this.#var.get(key) : void 0;
   };
   get var() {
      if (!this.#var) {
         return {};
      }
      return Object.fromEntries(this.#var);
   }
   newResponse = (data, arg, headers) => {
      if (this.#isFresh && !headers && !arg && this.#status === 200) {
         return new Response(data, {
            headers: this.#preparedHeaders,
         });
      }
      if (arg && typeof arg !== "number") {
         const header = new Headers(arg.headers);
         if (this.#headers) {
            this.#headers.forEach((v2, k2) => {
               if (k2 === "set-cookie") {
                  header.append(k2, v2);
               } else {
                  header.set(k2, v2);
               }
            });
         }
         const headers2 = setHeaders(header, this.#preparedHeaders);
         return new Response(data, {
            headers: headers2,
            status: arg.status ?? this.#status,
         });
      }
      const status = typeof arg === "number" ? arg : this.#status;
      this.#preparedHeaders ??= {};
      this.#headers ??= new Headers();
      setHeaders(this.#headers, this.#preparedHeaders);
      if (this.#res) {
         this.#res.headers.forEach((v2, k2) => {
            if (k2 === "set-cookie") {
               this.#headers?.append(k2, v2);
            } else {
               this.#headers?.set(k2, v2);
            }
         });
         setHeaders(this.#headers, this.#preparedHeaders);
      }
      headers ??= {};
      for (const [k2, v2] of Object.entries(headers)) {
         if (typeof v2 === "string") {
            this.#headers.set(k2, v2);
         } else {
            this.#headers.delete(k2);
            for (const v22 of v2) {
               this.#headers.append(k2, v22);
            }
         }
      }
      return new Response(data, {
         status,
         headers: this.#headers,
      });
   };
   body = (data, arg, headers) => {
      return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
   };
   text = (text, arg, headers) => {
      if (!this.#preparedHeaders) {
         if (this.#isFresh && !headers && !arg) {
            return new Response(text);
         }
         this.#preparedHeaders = {};
      }
      this.#preparedHeaders["content-type"] = TEXT_PLAIN;
      return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
   };
   json = (object, arg, headers) => {
      const body = JSON.stringify(object);
      this.#preparedHeaders ??= {};
      this.#preparedHeaders["content-type"] = "application/json; charset=UTF-8";
      return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
   };
   html = (html, arg, headers) => {
      this.#preparedHeaders ??= {};
      this.#preparedHeaders["content-type"] = "text/html; charset=UTF-8";
      if (typeof html === "object") {
         if (!(html instanceof Promise)) {
            html = html.toString();
         }
         if (html instanceof Promise) {
            return html
               .then(html2 => resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}))
               .then(html2 => {
                  return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
               });
         }
      }
      return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
   };
   redirect = (location, status) => {
      this.#headers ??= new Headers();
      this.#headers.set("Location", location);
      return this.newResponse(null, status ?? 302);
   };
   notFound = () => {
      this.#notFoundHandler ??= () => new Response();
      return this.#notFoundHandler(this);
   };
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
   return (context, next) => {
      let index = -1;
      return dispatch(0);
      async function dispatch(i) {
         if (i <= index) {
            throw new Error("next() called multiple times");
         }
         index = i;
         let res;
         let isError2 = false;
         let handler;
         if (middleware[i]) {
            handler = middleware[i][0][0];
            if (context instanceof Context) {
               context.req.routeIndex = i;
            }
         } else {
            handler = (i === middleware.length && next) || void 0;
         }
         if (!handler) {
            if (context instanceof Context && context.finalized === false && onNotFound) {
               res = await onNotFound(context);
            }
         } else {
            try {
               res = await handler(context, () => {
                  return dispatch(i + 1);
               });
            } catch (err2) {
               if (err2 instanceof Error && context instanceof Context && onError) {
                  context.error = err2;
                  res = await onError(err2, context);
                  isError2 = true;
               } else {
                  throw err2;
               }
            }
         }
         if (res && (context.finalized === false || isError2)) {
            context.res = res;
         }
         return context;
      }
   };
};

// node_modules/hono/dist/router.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {};

// node_modules/hono/dist/hono-base.js
var COMPOSED_HANDLER = Symbol("composedHandler");
var notFoundHandler = c2 => {
   return c2.text("404 Not Found", 404);
};
var errorHandler = (err2, c2) => {
   if ("getResponse" in err2) {
      return err2.getResponse();
   }
   console.error(err2);
   return c2.text("Internal Server Error", 500);
};
var Hono = class {
   get;
   post;
   put;
   delete;
   options;
   patch;
   all;
   on;
   use;
   router;
   getPath;
   _basePath = "/";
   #path = "/";
   routes = [];
   constructor(options = {}) {
      const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
      allMethods.forEach(method => {
         this[method] = (args1, ...args) => {
            if (typeof args1 === "string") {
               this.#path = args1;
            } else {
               this.addRoute(method, this.#path, args1);
            }
            args.forEach(handler => {
               if (typeof handler !== "string") {
                  this.addRoute(method, this.#path, handler);
               }
            });
            return this;
         };
      });
      this.on = (method, path, ...handlers) => {
         for (const p of [path].flat()) {
            this.#path = p;
            for (const m2 of [method].flat()) {
               handlers.map(handler => {
                  this.addRoute(m2.toUpperCase(), this.#path, handler);
               });
            }
         }
         return this;
      };
      this.use = (arg1, ...handlers) => {
         if (typeof arg1 === "string") {
            this.#path = arg1;
         } else {
            this.#path = "*";
            handlers.unshift(arg1);
         }
         handlers.forEach(handler => {
            this.addRoute(METHOD_NAME_ALL, this.#path, handler);
         });
         return this;
      };
      const strict = options.strict ?? true;
      delete options.strict;
      Object.assign(this, options);
      this.getPath = strict ? (options.getPath ?? getPath) : getPathNoStrict;
   }
   clone() {
      const clone = new Hono({
         router: this.router,
         getPath: this.getPath,
      });
      clone.routes = this.routes;
      return clone;
   }
   notFoundHandler = notFoundHandler;
   errorHandler = errorHandler;
   route(path, app22) {
      const subApp = this.basePath(path);
      app22.routes.map(r => {
         let handler;
         if (app22.errorHandler === errorHandler) {
            handler = r.handler;
         } else {
            handler = async (c2, next) => (await compose([], app22.errorHandler)(c2, () => r.handler(c2, next))).res;
            handler[COMPOSED_HANDLER] = r.handler;
         }
         subApp.addRoute(r.method, r.path, handler);
      });
      return this;
   }
   basePath(path) {
      const subApp = this.clone();
      subApp._basePath = mergePath(this._basePath, path);
      return subApp;
   }
   onError = handler => {
      this.errorHandler = handler;
      return this;
   };
   notFound = handler => {
      this.notFoundHandler = handler;
      return this;
   };
   mount(path, applicationHandler, options) {
      let replaceRequest;
      let optionHandler;
      if (options) {
         if (typeof options === "function") {
            optionHandler = options;
         } else {
            optionHandler = options.optionHandler;
            replaceRequest = options.replaceRequest;
         }
      }
      const getOptions = optionHandler
         ? c2 => {
              const options2 = optionHandler(c2);
              return Array.isArray(options2) ? options2 : [options2];
           }
         : c2 => {
              let executionContext = void 0;
              try {
                 executionContext = c2.executionCtx;
              } catch {}
              return [c2.env, executionContext];
           };
      replaceRequest ||= (() => {
         const mergedPath = mergePath(this._basePath, path);
         const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
         return request2 => {
            const url = new URL(request2.url);
            url.pathname = url.pathname.slice(pathPrefixLength) || "/";
            return new Request(url, request2);
         };
      })();
      const handler = async (c2, next) => {
         const res = await applicationHandler(replaceRequest(c2.req.raw), ...getOptions(c2));
         if (res) {
            return res;
         }
         await next();
      };
      this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
      return this;
   }
   addRoute(method, path, handler) {
      method = method.toUpperCase();
      path = mergePath(this._basePath, path);
      const r = { path, method, handler };
      this.router.add(method, path, [handler, r]);
      this.routes.push(r);
   }
   matchRoute(method, path) {
      return this.router.match(method, path);
   }
   handleError(err2, c2) {
      if (err2 instanceof Error) {
         return this.errorHandler(err2, c2);
      }
      throw err2;
   }
   dispatch(request2, executionCtx, env3, method) {
      if (method === "HEAD") {
         return (async () => new Response(null, await this.dispatch(request2, executionCtx, env3, "GET")))();
      }
      const path = this.getPath(request2, { env: env3 });
      const matchResult = this.matchRoute(method, path);
      const c2 = new Context(request2, {
         path,
         matchResult,
         env: env3,
         executionCtx,
         notFoundHandler: this.notFoundHandler,
      });
      if (matchResult[0].length === 1) {
         let res;
         try {
            res = matchResult[0][0][0][0](c2, async () => {
               c2.res = await this.notFoundHandler(c2);
            });
         } catch (err2) {
            return this.handleError(err2, c2);
         }
         return res instanceof Promise
            ? res
                 .then(resolved => resolved || (c2.finalized ? c2.res : this.notFoundHandler(c2)))
                 .catch(err2 => this.handleError(err2, c2))
            : (res ?? this.notFoundHandler(c2));
      }
      const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
      return (async () => {
         try {
            const context = await composed(c2);
            if (!context.finalized) {
               throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
            }
            return context.res;
         } catch (err2) {
            return this.handleError(err2, c2);
         }
      })();
   }
   fetch = (request2, ...rest) => {
      return this.dispatch(request2, rest[1], rest[0], request2.method);
   };
   request = (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
         if (requestInit !== void 0) {
            input = new Request(input, requestInit);
         }
         return this.fetch(input, Env, executionCtx);
      }
      input = input.toString();
      const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
      const req = new Request(path, requestInit);
      return this.fetch(req, Env, executionCtx);
   };
   fire = () => {
      addEventListener("fetch", event => {
         event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
      });
   };
};

// node_modules/hono/dist/router/reg-exp-router/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/router/reg-exp-router/router.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/router/reg-exp-router/node.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
   if (a.length === 1) {
      return b.length === 1 ? (a < b ? -1 : 1) : -1;
   }
   if (b.length === 1) {
      return 1;
   }
   if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
      return 1;
   } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
      return -1;
   }
   if (a === LABEL_REG_EXP_STR) {
      return 1;
   } else if (b === LABEL_REG_EXP_STR) {
      return -1;
   }
   return a.length === b.length ? (a < b ? -1 : 1) : b.length - a.length;
}
var Node = class {
   index;
   varIndex;
   children = /* @__PURE__ */ Object.create(null);
   insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
      if (tokens.length === 0) {
         if (this.index !== void 0) {
            throw PATH_ERROR;
         }
         if (pathErrorCheckOnly) {
            return;
         }
         this.index = index;
         return;
      }
      const [token, ...restTokens] = tokens;
      const pattern =
         token === "*"
            ? restTokens.length === 0
               ? ["", "", ONLY_WILDCARD_REG_EXP_STR]
               : ["", "", LABEL_REG_EXP_STR]
            : token === "/*"
              ? ["", "", TAIL_WILDCARD_REG_EXP_STR]
              : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let node;
      if (pattern) {
         const name2 = pattern[1];
         let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
         if (name2 && pattern[2]) {
            regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
            if (/\((?!\?:)/.test(regexpStr)) {
               throw PATH_ERROR;
            }
         }
         node = this.children[regexpStr];
         if (!node) {
            if (Object.keys(this.children).some(k2 => k2 !== ONLY_WILDCARD_REG_EXP_STR && k2 !== TAIL_WILDCARD_REG_EXP_STR)) {
               throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
               return;
            }
            node = this.children[regexpStr] = new Node();
            if (name2 !== "") {
               node.varIndex = context.varIndex++;
            }
         }
         if (!pathErrorCheckOnly && name2 !== "") {
            paramMap.push([name2, node.varIndex]);
         }
      } else {
         node = this.children[token];
         if (!node) {
            if (
               Object.keys(this.children).some(
                  k2 => k2.length > 1 && k2 !== ONLY_WILDCARD_REG_EXP_STR && k2 !== TAIL_WILDCARD_REG_EXP_STR,
               )
            ) {
               throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
               return;
            }
            node = this.children[token] = new Node();
         }
      }
      node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
   }
   buildRegExpStr() {
      const childKeys = Object.keys(this.children).sort(compareKey);
      const strList = childKeys.map(k2 => {
         const c2 = this.children[k2];
         return (
            (typeof c2.varIndex === "number" ? `(${k2})@${c2.varIndex}` : regExpMetaChars.has(k2) ? `\\${k2}` : k2) +
            c2.buildRegExpStr()
         );
      });
      if (typeof this.index === "number") {
         strList.unshift(`#${this.index}`);
      }
      if (strList.length === 0) {
         return "";
      }
      if (strList.length === 1) {
         return strList[0];
      }
      return "(?:" + strList.join("|") + ")";
   }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var Trie = class {
   context = { varIndex: 0 };
   root = new Node();
   insert(path, index, pathErrorCheckOnly) {
      const paramAssoc = [];
      const groups = [];
      for (let i = 0; ; ) {
         let replaced = false;
         path = path.replace(/\{[^}]+\}/g, m2 => {
            const mark = `@\\${i}`;
            groups[i] = [mark, m2];
            i++;
            replaced = true;
            return mark;
         });
         if (!replaced) {
            break;
         }
      }
      const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
      for (let i = groups.length - 1; i >= 0; i--) {
         const [mark] = groups[i];
         for (let j = tokens.length - 1; j >= 0; j--) {
            if (tokens[j].indexOf(mark) !== -1) {
               tokens[j] = tokens[j].replace(mark, groups[i][1]);
               break;
            }
         }
      }
      this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
      return paramAssoc;
   }
   buildRegExp() {
      let regexp = this.root.buildRegExpStr();
      if (regexp === "") {
         return [/^$/, [], []];
      }
      let captureIndex = 0;
      const indexReplacementMap = [];
      const paramReplacementMap = [];
      regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_2, handlerIndex, paramIndex) => {
         if (typeof handlerIndex !== "undefined") {
            indexReplacementMap[++captureIndex] = Number(handlerIndex);
            return "$()";
         }
         if (typeof paramIndex !== "undefined") {
            paramReplacementMap[Number(paramIndex)] = ++captureIndex;
            return "";
         }
         return "";
      });
      return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
   }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
   return (wildcardRegExpCache[path] ??= new RegExp(
      path === "*" ? "" : `^${path.replace(/\/\*$|([.\\+*[^\]$()])/g, (_2, metaChar) => (metaChar ? `\\${metaChar}` : "(?:|/.*)"))}$`,
   ));
}
function clearWildcardRegExpCache() {
   wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
   const trie = new Trie();
   const handlerData = [];
   if (routes.length === 0) {
      return nullMatcher;
   }
   const routesWithStaticPathFlag = routes
      .map(route => [!/\*|\/:/.test(route[0]), ...route])
      .sort(([isStaticA, pathA], [isStaticB, pathB]) => (isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length));
   const staticMap = /* @__PURE__ */ Object.create(null);
   for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
      const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
      if (pathErrorCheckOnly) {
         staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
      } else {
         j++;
      }
      let paramAssoc;
      try {
         paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
      } catch (e) {
         throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
      }
      if (pathErrorCheckOnly) {
         continue;
      }
      handlerData[j] = handlers.map(([h, paramCount]) => {
         const paramIndexMap = /* @__PURE__ */ Object.create(null);
         paramCount -= 1;
         for (; paramCount >= 0; paramCount--) {
            const [key, value] = paramAssoc[paramCount];
            paramIndexMap[key] = value;
         }
         return [h, paramIndexMap];
      });
   }
   const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
   for (let i = 0, len = handlerData.length; i < len; i++) {
      for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
         const map = handlerData[i][j]?.[1];
         if (!map) {
            continue;
         }
         const keys2 = Object.keys(map);
         for (let k2 = 0, len3 = keys2.length; k2 < len3; k2++) {
            map[keys2[k2]] = paramReplacementMap[map[keys2[k2]]];
         }
      }
   }
   const handlerMap = [];
   for (const i in indexReplacementMap) {
      handlerMap[i] = handlerData[indexReplacementMap[i]];
   }
   return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
   if (!middleware) {
      return void 0;
   }
   for (const k2 of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
      if (buildWildcardRegExp(k2).test(path)) {
         return [...middleware[k2]];
      }
   }
   return void 0;
}
var RegExpRouter = class {
   name = "RegExpRouter";
   middleware;
   routes;
   constructor() {
      this.middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
      this.routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
   }
   add(method, path, handler) {
      const { middleware, routes } = this;
      if (!middleware || !routes) {
         throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
      }
      if (!middleware[method]) {
         [middleware, routes].forEach(handlerMap => {
            handlerMap[method] = /* @__PURE__ */ Object.create(null);
            Object.keys(handlerMap[METHOD_NAME_ALL]).forEach(p => {
               handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
            });
         });
      }
      if (path === "/*") {
         path = "*";
      }
      const paramCount = (path.match(/\/:/g) || []).length;
      if (/\*$/.test(path)) {
         const re = buildWildcardRegExp(path);
         if (method === METHOD_NAME_ALL) {
            Object.keys(middleware).forEach(m2 => {
               middleware[m2][path] ||=
                  findMiddleware(middleware[m2], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
            });
         } else {
            middleware[method][path] ||=
               findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
         }
         Object.keys(middleware).forEach(m2 => {
            if (method === METHOD_NAME_ALL || method === m2) {
               Object.keys(middleware[m2]).forEach(p => {
                  re.test(p) && middleware[m2][p].push([handler, paramCount]);
               });
            }
         });
         Object.keys(routes).forEach(m2 => {
            if (method === METHOD_NAME_ALL || method === m2) {
               Object.keys(routes[m2]).forEach(p => re.test(p) && routes[m2][p].push([handler, paramCount]));
            }
         });
         return;
      }
      const paths = checkOptionalParameter(path) || [path];
      for (let i = 0, len = paths.length; i < len; i++) {
         const path2 = paths[i];
         Object.keys(routes).forEach(m2 => {
            if (method === METHOD_NAME_ALL || method === m2) {
               routes[m2][path2] ||= [
                  ...(findMiddleware(middleware[m2], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []),
               ];
               routes[m2][path2].push([handler, paramCount - len + i + 1]);
            }
         });
      }
   }
   match(method, path) {
      clearWildcardRegExpCache();
      const matchers = this.buildAllMatchers();
      this.match = (method2, path2) => {
         const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
         const staticMatch = matcher[2][path2];
         if (staticMatch) {
            return staticMatch;
         }
         const match = path2.match(matcher[0]);
         if (!match) {
            return [[], emptyParam];
         }
         const index = match.indexOf("", 1);
         return [matcher[1][index], match];
      };
      return this.match(method, path);
   }
   buildAllMatchers() {
      const matchers = /* @__PURE__ */ Object.create(null);
      [...Object.keys(this.routes), ...Object.keys(this.middleware)].forEach(method => {
         matchers[method] ||= this.buildMatcher(method);
      });
      this.middleware = this.routes = void 0;
      return matchers;
   }
   buildMatcher(method) {
      const routes = [];
      let hasOwnRoute = method === METHOD_NAME_ALL;
      [this.middleware, this.routes].forEach(r => {
         const ownRoute = r[method] ? Object.keys(r[method]).map(path => [path, r[method][path]]) : [];
         if (ownRoute.length !== 0) {
            hasOwnRoute ||= true;
            routes.push(...ownRoute);
         } else if (method !== METHOD_NAME_ALL) {
            routes.push(...Object.keys(r[METHOD_NAME_ALL]).map(path => [path, r[METHOD_NAME_ALL][path]]));
         }
      });
      if (!hasOwnRoute) {
         return null;
      } else {
         return buildMatcherFromPreprocessedRoutes(routes);
      }
   }
};

// node_modules/hono/dist/router/smart-router/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/router/smart-router/router.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var SmartRouter = class {
   name = "SmartRouter";
   routers = [];
   routes = [];
   constructor(init3) {
      Object.assign(this, init3);
   }
   add(method, path, handler) {
      if (!this.routes) {
         throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
      }
      this.routes.push([method, path, handler]);
   }
   match(method, path) {
      if (!this.routes) {
         throw new Error("Fatal error");
      }
      const { routers, routes } = this;
      const len = routers.length;
      let i = 0;
      let res;
      for (; i < len; i++) {
         const router = routers[i];
         try {
            routes.forEach(args => {
               router.add(...args);
            });
            res = router.match(method, path);
         } catch (e) {
            if (e instanceof UnsupportedPathError) {
               continue;
            }
            throw e;
         }
         this.match = router.match.bind(router);
         this.routers = [router];
         this.routes = void 0;
         break;
      }
      if (i === len) {
         throw new Error("Fatal error");
      }
      this.name = `SmartRouter + ${this.activeRouter.name}`;
      return res;
   }
   get activeRouter() {
      if (this.routes || this.routers.length !== 1) {
         throw new Error("No active router has been determined yet.");
      }
      return this.routers[0];
   }
};

// node_modules/hono/dist/router/trie-router/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/router/trie-router/router.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/router/trie-router/node.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var Node2 = class {
   methods;
   children;
   patterns;
   order = 0;
   name;
   params = /* @__PURE__ */ Object.create(null);
   constructor(method, handler, children) {
      this.children = children || /* @__PURE__ */ Object.create(null);
      this.methods = [];
      this.name = "";
      if (method && handler) {
         const m2 = /* @__PURE__ */ Object.create(null);
         m2[method] = { handler, possibleKeys: [], score: 0, name: this.name };
         this.methods = [m2];
      }
      this.patterns = [];
   }
   insert(method, path, handler) {
      this.name = `${method} ${path}`;
      this.order = ++this.order;
      let curNode = this;
      const parts = splitRoutingPath(path);
      const possibleKeys = [];
      for (let i = 0, len = parts.length; i < len; i++) {
         const p = parts[i];
         if (Object.keys(curNode.children).includes(p)) {
            curNode = curNode.children[p];
            const pattern2 = getPattern(p);
            if (pattern2) {
               possibleKeys.push(pattern2[1]);
            }
            continue;
         }
         curNode.children[p] = new Node2();
         const pattern = getPattern(p);
         if (pattern) {
            curNode.patterns.push(pattern);
            possibleKeys.push(pattern[1]);
         }
         curNode = curNode.children[p];
      }
      if (!curNode.methods.length) {
         curNode.methods = [];
      }
      const m2 = /* @__PURE__ */ Object.create(null);
      const handlerSet = {
         handler,
         possibleKeys: possibleKeys.filter((v2, i, a) => a.indexOf(v2) === i),
         name: this.name,
         score: this.order,
      };
      m2[method] = handlerSet;
      curNode.methods.push(m2);
      return curNode;
   }
   gHSets(node, method, nodeParams, params) {
      const handlerSets = [];
      for (let i = 0, len = node.methods.length; i < len; i++) {
         const m2 = node.methods[i];
         const handlerSet = m2[method] || m2[METHOD_NAME_ALL];
         const processedSet = /* @__PURE__ */ Object.create(null);
         if (handlerSet !== void 0) {
            handlerSet.params = /* @__PURE__ */ Object.create(null);
            handlerSet.possibleKeys.forEach(key => {
               const processed = processedSet[handlerSet.name];
               handlerSet.params[key] = params[key] && !processed ? params[key] : (nodeParams[key] ?? params[key]);
               processedSet[handlerSet.name] = true;
            });
            handlerSets.push(handlerSet);
         }
      }
      return handlerSets;
   }
   search(method, path) {
      const handlerSets = [];
      this.params = /* @__PURE__ */ Object.create(null);
      const curNode = this;
      let curNodes = [curNode];
      const parts = splitPath(path);
      for (let i = 0, len = parts.length; i < len; i++) {
         const part = parts[i];
         const isLast = i === len - 1;
         const tempNodes = [];
         for (let j = 0, len2 = curNodes.length; j < len2; j++) {
            const node = curNodes[j];
            const nextNode = node.children[part];
            if (nextNode) {
               nextNode.params = node.params;
               if (isLast === true) {
                  if (nextNode.children["*"]) {
                     handlerSets.push(
                        ...this.gHSets(nextNode.children["*"], method, node.params, /* @__PURE__ */ Object.create(null)),
                     );
                  }
                  handlerSets.push(...this.gHSets(nextNode, method, node.params, /* @__PURE__ */ Object.create(null)));
               } else {
                  tempNodes.push(nextNode);
               }
            }
            for (let k2 = 0, len3 = node.patterns.length; k2 < len3; k2++) {
               const pattern = node.patterns[k2];
               const params = { ...node.params };
               if (pattern === "*") {
                  const astNode = node.children["*"];
                  if (astNode) {
                     handlerSets.push(...this.gHSets(astNode, method, node.params, /* @__PURE__ */ Object.create(null)));
                     tempNodes.push(astNode);
                  }
                  continue;
               }
               if (part === "") {
                  continue;
               }
               const [key, name2, matcher] = pattern;
               const child = node.children[key];
               const restPathString = parts.slice(i).join("/");
               if (matcher instanceof RegExp && matcher.test(restPathString)) {
                  params[name2] = restPathString;
                  handlerSets.push(...this.gHSets(child, method, node.params, params));
                  continue;
               }
               if (matcher === true || (matcher instanceof RegExp && matcher.test(part))) {
                  if (typeof key === "string") {
                     params[name2] = part;
                     if (isLast === true) {
                        handlerSets.push(...this.gHSets(child, method, params, node.params));
                        if (child.children["*"]) {
                           handlerSets.push(...this.gHSets(child.children["*"], method, params, node.params));
                        }
                     } else {
                        child.params = params;
                        tempNodes.push(child);
                     }
                  }
               }
            }
         }
         curNodes = tempNodes;
      }
      const results = handlerSets.sort((a, b) => {
         return a.score - b.score;
      });
      return [results.map(({ handler, params }) => [handler, params])];
   }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
   name = "TrieRouter";
   node;
   constructor() {
      this.node = new Node2();
   }
   add(method, path, handler) {
      const results = checkOptionalParameter(path);
      if (results) {
         for (const p of results) {
            this.node.insert(method, p, handler);
         }
         return;
      }
      this.node.insert(method, path, handler);
   }
   match(method, path) {
      return this.node.search(method, path);
   }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
   constructor(options = {}) {
      super(options);
      this.router =
         options.router ??
         new SmartRouter({
            routers: [new RegExpRouter(), new TrieRouter()],
         });
   }
};

// node_modules/hono/dist/middleware/cors/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var cors = options => {
   const defaults = {
      origin: "*",
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      allowHeaders: [],
      exposeHeaders: [],
   };
   const opts = {
      ...defaults,
      ...options,
   };
   const findAllowOrigin = (optsOrigin => {
      if (typeof optsOrigin === "string") {
         return () => optsOrigin;
      } else if (typeof optsOrigin === "function") {
         return optsOrigin;
      } else {
         return origin => (optsOrigin.includes(origin) ? origin : optsOrigin[0]);
      }
   })(opts.origin);
   return async function cors2(c2, next) {
      function set(key, value) {
         c2.res.headers.set(key, value);
      }
      const allowOrigin = findAllowOrigin(c2.req.header("origin") || "", c2);
      if (allowOrigin) {
         set("Access-Control-Allow-Origin", allowOrigin);
      }
      if (opts.origin !== "*") {
         const existingVary = c2.req.header("Vary");
         if (existingVary) {
            set("Vary", existingVary);
         } else {
            set("Vary", "Origin");
         }
      }
      if (opts.credentials) {
         set("Access-Control-Allow-Credentials", "true");
      }
      if (opts.exposeHeaders?.length) {
         set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
      }
      if (c2.req.method === "OPTIONS") {
         if (opts.maxAge != null) {
            set("Access-Control-Max-Age", opts.maxAge.toString());
         }
         if (opts.allowMethods?.length) {
            set("Access-Control-Allow-Methods", opts.allowMethods.join(","));
         }
         let headers = opts.allowHeaders;
         if (!headers?.length) {
            const requestHeaders = c2.req.header("Access-Control-Request-Headers");
            if (requestHeaders) {
               headers = requestHeaders.split(/\s*,\s*/);
            }
         }
         if (headers?.length) {
            set("Access-Control-Allow-Headers", headers.join(","));
            c2.res.headers.append("Vary", "Access-Control-Request-Headers");
         }
         c2.res.headers.delete("Content-Length");
         c2.res.headers.delete("Content-Type");
         return new Response(null, {
            headers: c2.res.headers,
            status: 204,
            statusText: c2.res.statusText,
         });
      }
      await next();
   };
};

// node-modules-polyfills:process
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function defaultSetTimout2() {
   throw new Error("setTimeout has not been defined");
}
function defaultClearTimeout2() {
   throw new Error("clearTimeout has not been defined");
}
var cachedSetTimeout2 = defaultSetTimout2;
var cachedClearTimeout2 = defaultClearTimeout2;
if (typeof globalThis.setTimeout === "function") {
   cachedSetTimeout2 = setTimeout;
}
if (typeof globalThis.clearTimeout === "function") {
   cachedClearTimeout2 = clearTimeout;
}
function runTimeout2(fun) {
   if (cachedSetTimeout2 === setTimeout) {
      return setTimeout(fun, 0);
   }
   if ((cachedSetTimeout2 === defaultSetTimout2 || !cachedSetTimeout2) && setTimeout) {
      cachedSetTimeout2 = setTimeout;
      return setTimeout(fun, 0);
   }
   try {
      return cachedSetTimeout2(fun, 0);
   } catch (e) {
      try {
         return cachedSetTimeout2.call(null, fun, 0);
      } catch (e2) {
         return cachedSetTimeout2.call(this, fun, 0);
      }
   }
}
function runClearTimeout2(marker) {
   if (cachedClearTimeout2 === clearTimeout) {
      return clearTimeout(marker);
   }
   if ((cachedClearTimeout2 === defaultClearTimeout2 || !cachedClearTimeout2) && clearTimeout) {
      cachedClearTimeout2 = clearTimeout;
      return clearTimeout(marker);
   }
   try {
      return cachedClearTimeout2(marker);
   } catch (e) {
      try {
         return cachedClearTimeout2.call(null, marker);
      } catch (e2) {
         return cachedClearTimeout2.call(this, marker);
      }
   }
}
var queue2 = [];
var draining2 = false;
var currentQueue2;
var queueIndex2 = -1;
function cleanUpNextTick2() {
   if (!draining2 || !currentQueue2) {
      return;
   }
   draining2 = false;
   if (currentQueue2.length) {
      queue2 = currentQueue2.concat(queue2);
   } else {
      queueIndex2 = -1;
   }
   if (queue2.length) {
      drainQueue2();
   }
}
function drainQueue2() {
   if (draining2) {
      return;
   }
   var timeout = runTimeout2(cleanUpNextTick2);
   draining2 = true;
   var len = queue2.length;
   while (len) {
      currentQueue2 = queue2;
      queue2 = [];
      while (++queueIndex2 < len) {
         if (currentQueue2) {
            currentQueue2[queueIndex2].run();
         }
      }
      queueIndex2 = -1;
      len = queue2.length;
   }
   currentQueue2 = null;
   draining2 = false;
   runClearTimeout2(timeout);
}
function nextTick2(fun) {
   var args = new Array(arguments.length - 1);
   if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
         args[i - 1] = arguments[i];
      }
   }
   queue2.push(new Item2(fun, args));
   if (queue2.length === 1 && !draining2) {
      runTimeout2(drainQueue2);
   }
}
function Item2(fun, array) {
   this.fun = fun;
   this.array = array;
}
Item2.prototype.run = function () {
   this.fun.apply(null, this.array);
};
var title2 = "browser";
var platform2 = "browser";
var browser2 = true;
var env2 = {};
var argv2 = [];
var version2 = "";
var versions2 = {};
var release2 = {};
var config2 = {};
function noop2() {}
var on2 = noop2;
var addListener2 = noop2;
var once2 = noop2;
var off2 = noop2;
var removeListener2 = noop2;
var removeAllListeners2 = noop2;
var emit2 = noop2;
function binding2(name2) {
   throw new Error("process.binding is not supported");
}
function cwd2() {
   return "/";
}
function chdir2(dir) {
   throw new Error("process.chdir is not supported");
}
function umask2() {
   return 0;
}
var performance2 = globalThis.performance || {};
var performanceNow2 =
   performance2.now ||
   performance2.mozNow ||
   performance2.msNow ||
   performance2.oNow ||
   performance2.webkitNow ||
   function () {
      return /* @__PURE__ */ new Date().getTime();
   };
function hrtime2(previousTimestamp) {
   var clocktime = performanceNow2.call(performance2) * 1e-3;
   var seconds = Math.floor(clocktime);
   var nanoseconds = Math.floor((clocktime % 1) * 1e9);
   if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      if (nanoseconds < 0) {
         seconds--;
         nanoseconds += 1e9;
      }
   }
   return [seconds, nanoseconds];
}
var startTime2 = /* @__PURE__ */ new Date();
function uptime2() {
   var currentTime = /* @__PURE__ */ new Date();
   var dif = currentTime - startTime2;
   return dif / 1e3;
}
var browser$1 = {
   nextTick: nextTick2,
   title: title2,
   browser: browser2,
   env: env2,
   argv: argv2,
   version: version2,
   versions: versions2,
   on: on2,
   addListener: addListener2,
   once: once2,
   off: off2,
   removeListener: removeListener2,
   removeAllListeners: removeAllListeners2,
   emit: emit2,
   binding: binding2,
   cwd: cwd2,
   chdir: chdir2,
   umask: umask2,
   hrtime: hrtime2,
   platform: platform2,
   release: release2,
   config: config2,
   uptime: uptime2,
};
var process_default = browser$1;

// package.json
var version3 = "0.3-dev";

// src/db/index.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client7 = __toESM(require_default2(), 1);

// src/db/auth.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client = __toESM(require_default2(), 1);
var authExtention = import_client.Prisma.defineExtension({
   name: "auth",
   model: {
      user: {
         async findByCredentials(credentials) {
            const user = await prisma.user.findFirst({
               where: {
                  AND: [
                     { password: credentials.password },
                     { OR: [{ email: credentials.email }, { username: credentials.username }] },
                  ],
               },
            });
            assertObj("findByCredentials", user, "NULL_USER" /* NULL_USER */);
            return user;
         },
         async registerNew(user) {
            const displayName = user.displayName || user.username;
            const newUser = await prisma.user.create({
               data: {
                  id: snowflake.generate(),
                  username: user.username,
                  displayName,
                  password: user.password,
                  email: user.email,
                  avatar: "test-avatar",
                  flags: 0 /* NONE */,
                  system: false,
               },
            });
            assertObj("registerNew", newUser, "NULL_USER" /* NULL_USER */);
            return newUser;
         },
      },
   },
});
var auth_default = authExtention;

// src/db/user.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client2 = __toESM(require_default2(), 1);
var userExtention = import_client2.Prisma.defineExtension({
   model: {
      user: {
         async getById(id, include) {
            assertId("getById", id);
            const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, include });
            assertObj("getById", user, "NULL_USER" /* NULL_USER */, id);
            return user;
         },
         async getByUsername(username, include) {
            const user = await prisma.user.findUnique({ where: { username }, include });
            assertObj("getByUsername", user, "NULL_USER" /* NULL_USER */, username);
            return user;
         },
         async edit(id, editedUser) {
            assertId("edit", id);
            const updatedUser = await prisma.user.update({ where: { id: BigInt(id) }, data: { ...editedUser } });
            assertObj("edit", updatedUser, "NULL_USER" /* NULL_USER */, id);
            return updatedUser;
         },
         async assertUserExists(methodName, id) {
            assertId(methodName, id);
            const userExists = await prisma.user.exists({ id: BigInt(id) });
            assertCondition(methodName, !userExists, "NULL_USER" /* NULL_USER */, id);
         },
         async hasChannel(userId, channelId) {
            assertId("hasChannel", userId, channelId);
            const hasAccess = await prisma.user.exists({
               id: BigInt(userId),
               OR: [{ includedChannels: { some: { id: BigInt(channelId) } } }, { ownedChannels: { some: { id: BigInt(channelId) } } }],
            });
            return hasAccess;
         },
      },
   },
});
var user_default = userExtention;

// src/db/channel.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client4 = __toESM(require_default2(), 1);

// src/db/error.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client3 = __toESM(require_default2(), 1);
var DBError = class extends Error {
   constructor(error2, methodName, cause) {
      super(
         `Unhandeled Database Error => ${methodName} => ${error2.name}: ${error2.message} ${error2.cause ? `(${error2.cause})` : ""}`,
         {
            cause,
         },
      );
      this.error = error2;
      this.flattenError(this.error);
   }
   isErrorType(type) {
      if (this.error instanceof Error) {
         return this.error.message === type;
      }
   }
   flattenError(error2) {
      if (error2 instanceof DBError) {
         this.error = error2.error;
         this.flattenError(error2.error);
      }
   }
};
function assertId(methodName, ...ids) {
   try {
      for (const id of ids) BigInt(id);
   } catch (e) {
      throw new DBError(Error("INVALID_ID" /* INVALID_ID */, { cause: "Provided ID was not BigInt compatible" }), methodName);
   }
}
function assertObj(methodName, obj, errorType, cause) {
   if (obj === null || typeof obj !== "object") {
      throw new DBError(Error(errorType, { cause }), methodName);
   }
}
function assertCondition(methodName, shouldAssert, errorType, cause) {
   if (shouldAssert) {
      throw new DBError(Error(errorType, { cause }), methodName);
   }
}
function isDBError(object) {
   if (object !== null && typeof object === "object" && object instanceof DBError && object.error instanceof Error) {
      return true;
   }
   return false;
}
function isPrismaError(object) {
   if (
      object !== null &&
      typeof object === "object" &&
      (object instanceof import_client3.Prisma.PrismaClientKnownRequestError ||
         object instanceof import_client3.Prisma.PrismaClientUnknownRequestError ||
         object instanceof import_client3.Prisma.PrismaClientValidationError)
   ) {
      return true;
   }
   return false;
}

// src/db/channel.ts
var channelExtention = import_client4.Prisma.defineExtension({
   model: {
      channel: {
         async getById(id, include) {
            assertId("getById", id);
            const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, include });
            assertObj("getById", channel, "NULL_CHANNEL" /* NULL_CHANNEL */, id);
            return channel;
         },
         async getUserChannels(userId, includeDeleted, include) {
            await prisma.user.assertUserExists("getUserChannels", userId);
            const dmChannels = await prisma.channel.findMany({
               where: {
                  recipients: { some: { id: BigInt(userId) } },
                  type: 0 /* DM */,
                  tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : {},
               },
               include,
               omit: { icon: true, ownerId: true, name: true },
            });
            const groupChannels = await prisma.channel.findMany({
               where: {
                  recipients: { some: { id: BigInt(userId) } },
                  type: 1 /* GROUP_DM */,
                  tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : {},
               },
               include,
            });
            const channels = [...groupChannels, ...dmChannels];
            assertObj("getUserChannels", channels, "NULL_CHANNEL" /* NULL_CHANNEL */);
            return channels;
         },
         async createDM(initiatorId, recipients, include) {
            await prisma.user.assertUserExists("createDM", initiatorId);
            for (const recipientId of recipients) {
               await prisma.user.assertUserExists("createDM", recipientId);
            }
            let channel;
            const isGroup = recipients.length > 1;
            const recipientsConnect = [{ id: BigInt(initiatorId) }, ...recipients.map(x => ({ id: BigInt(x) }))];
            const existingChannel = await prisma.channel.findFirst({
               where: { recipients: { every: { OR: [{ id: BigInt(recipients[0]) }, { id: BigInt(initiatorId) }] } } },
            });
            if (!isGroup && existingChannel) {
               channel = await prisma.channel.update({
                  where: { id: existingChannel.id },
                  data: { tempDeletedByUsers: { disconnect: { id: BigInt(initiatorId) } } },
                  include,
                  omit: { icon: true, name: true, ownerId: true },
               });
            } else if (!isGroup) {
               channel = await prisma.channel.create({
                  data: {
                     id: snowflake.generate(),
                     type: 0 /* DM */,
                     lastMessageId: null,
                     recipients: {
                        connect: recipientsConnect,
                     },
                  },
                  include,
                  omit: { icon: true, name: true, ownerId: true },
               });
            } else if (isGroup) {
               channel = await prisma.channel.create({
                  data: {
                     id: snowflake.generate(),
                     type: 1 /* GROUP_DM */,
                     name: null,
                     icon: null,
                     lastMessageId: null,
                     ownerId: BigInt(initiatorId),
                     recipients: {
                        connect: recipientsConnect,
                     },
                  },
                  include,
               });
            }
            assertObj("createDM", channel, "NULL_CHANNEL" /* NULL_CHANNEL */);
            return channel;
         },
         async deleteDM(channelId, userId, include) {
            await prisma.channel.assertChannelExists("deleteDM", channelId);
            await prisma.user.assertUserExists("deleteDM", userId);
            const channel = await prisma.channel.update({
               where: { id: BigInt(channelId) },
               data: { tempDeletedByUsers: { connect: { id: BigInt(userId) } } },
               include,
            });
            return channel;
         },
         async assertChannelExists(methodName, id) {
            assertId(methodName, id);
            const channelExists = await prisma.channel.exists({ id: BigInt(id) });
            assertCondition(methodName, !channelExists, "NULL_CHANNEL" /* NULL_CHANNEL */, id);
         },
      },
   },
});
var channel_default = channelExtention;

// src/db/message.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client5 = __toESM(require_default2(), 1);
var messagesExtention = import_client5.Prisma.defineExtension({
   model: {
      message: {
         async getById(channelId, messageId, include) {
            assertId("getById", channelId, messageId);
            await prisma.channel.assertChannelExists("getById", channelId);
            const message2 = await prisma.message.findUnique({
               where: { channelId: BigInt(channelId), id: BigInt(messageId) },
               include,
            });
            assertObj("getById", message2, "NULL_MESSAGE" /* NULL_MESSAGE */, messageId);
            return message2;
         },
         async getMessages(channelId, limit, before, after, include) {
            await prisma.channel.assertChannelExists("getMessages", channelId);
            const cursor = after ?? before;
            const direction = after ? "forward" : before ? "backward" : "none";
            const messages = await prisma.message.findMany({
               where: { channelId: BigInt(channelId) },
               include,
               cursor: cursor ? { id: BigInt(cursor) } : void 0,
               skip: direction === "none" ? void 0 : 1,
               take: (direction === "forward" ? 1 : -1) * limit,
            });
            assertObj("getMessages", messages, "NULL_MESSAGE" /* NULL_MESSAGE */);
            return messages;
         },
         async createDefaultMessage(authorId, channelId, content, attachments, flags, include) {
            await prisma.user.assertUserExists("createDefaultMessage", authorId);
            await prisma.channel.assertChannelExists("createDefaultMessage", channelId);
            const message2 = await prisma.message.create({
               data: {
                  id: snowflake.generate(),
                  type: 0 /* DEFAULT */,
                  channelId: BigInt(channelId),
                  content: content ?? "",
                  attachments,
                  authorId: BigInt(authorId),
                  createdAt: /* @__PURE__ */ new Date(),
                  editedAt: null,
                  pinned: false,
                  reactions: [],
                  flags,
               },
               include,
            });
            await prisma.channel.update({ where: { id: BigInt(channelId) }, data: { lastMessageId: message2.id } });
            assertObj("createDefaultMessage", message2, "NULL_MESSAGE" /* NULL_MESSAGE */);
            return message2;
         },
      },
   },
});
var message_default = messagesExtention;

// src/db/relationship.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client6 = __toESM(require_default2(), 1);
var relationshipExtention = import_client6.Prisma.defineExtension({
   model: {
      relationship: {
         async getByUserId(ownerId, userId, include) {
            assertId("getByUserId", ownerId, userId);
            const relationship = await prisma.relationship.findFirst({
               where: { ownerId: BigInt(ownerId), userId: BigInt(userId) },
               include,
            });
            assertObj("getById", relationship, "NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */, `${ownerId}, ${userId}`);
            return relationship;
         },
         async getUserRelationships(userId, include) {
            await prisma.user.assertUserExists("getUserRelationships", userId);
            const relationships = await prisma.relationship.findMany({ where: { ownerId: BigInt(userId) }, include });
            assertObj("getUserRelationships", relationships, "NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */);
            return relationships;
         },
         async deleteByUserId(ownerId, userId) {
            assertId("deleteByUserId", ownerId, userId);
            const relation = await prisma.relationship.findFirst({ where: { userId: BigInt(userId), ownerId: BigInt(ownerId) } });
            assertObj("deleteByUserId", relation, "NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */);
            const oppositeRelation = await prisma.relationship.findFirst({
               where: { userId: BigInt(ownerId), ownerId: BigInt(userId) },
            });
            assertObj("deleteByUserId", oppositeRelation, "NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */);
            const deleteRelation = prisma.relationship.delete({ where: { id: relation.id } });
            const deleteOppositeRelation = prisma.relationship.delete({ where: { id: oppositeRelation.id } });
            await prisma.$transaction([deleteRelation, deleteOppositeRelation]);
         },
         async createRelationship(senderId, recieverId, include) {
            await prisma.user.assertUserExists("createRelationship", senderId);
            await prisma.user.assertUserExists("createRelationship", recieverId);
            const incomingExists = await prisma.relationship.exists({
               ownerId: BigInt(senderId),
               userId: BigInt(recieverId),
               type: 3 /* PENDING_INCOMING */,
            });
            if (incomingExists) {
               await prisma.relationship.updateMany({
                  where: {
                     OR: [
                        { ownerId: BigInt(senderId), userId: BigInt(recieverId) },
                        { ownerId: BigInt(recieverId), userId: BigInt(senderId) },
                     ],
                  },
                  data: { type: 1 /* FRIEND */, since: /* @__PURE__ */ new Date() },
               });
               const relationships2 = await prisma.relationship.findMany({
                  where: {
                     OR: [
                        { ownerId: BigInt(senderId), userId: BigInt(recieverId) },
                        { ownerId: BigInt(recieverId), userId: BigInt(senderId) },
                     ],
                  },
                  include,
               });
               return relationships2;
            }
            const createOutgoing = prisma.relationship.create({
               data: {
                  id: snowflake.generate(),
                  nickname: "",
                  type: 4 /* PENDING_OUTGOING */,
                  ownerId: BigInt(senderId),
                  userId: BigInt(recieverId),
                  since: null,
               },
               include,
            });
            const createIncoming = prisma.relationship.create({
               data: {
                  id: snowflake.generate(),
                  nickname: "",
                  type: 3 /* PENDING_INCOMING */,
                  ownerId: BigInt(recieverId),
                  userId: BigInt(senderId),
                  since: null,
               },
               include,
            });
            const relationships = await prisma.$transaction([createOutgoing, createIncoming]);
            assertObj("createRelationship", relationships, "NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */);
            return relationships;
         },
         async assertRelationshipExists(methodName, id) {
            assertId(methodName, id);
            const relationshipExists = await prisma.relationship.exists({ id: BigInt(id) });
            assertCondition(methodName, !relationshipExists, "NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */, id);
         },
      },
   },
});
var relationship_default = relationshipExtention;

// ../../node_modules/@prisma/pg-worker/dist/index.mjs
var dist_exports = {};
__export(dist_exports, {
   Client: () => export_Client,
   Pool: () => export_Pool,
   default: () => va,
   types: () => export_types,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node-modules-polyfills:buffer
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var lookup2 = [];
var revLookup2 = [];
var Arr2 = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
var inited2 = false;
function init2() {
   inited2 = true;
   var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
   for (var i = 0, len = code.length; i < len; ++i) {
      lookup2[i] = code[i];
      revLookup2[code.charCodeAt(i)] = i;
   }
   revLookup2["-".charCodeAt(0)] = 62;
   revLookup2["_".charCodeAt(0)] = 63;
}
function toByteArray(b64) {
   if (!inited2) {
      init2();
   }
   var i, j, l, tmp, placeHolders, arr;
   var len = b64.length;
   if (len % 4 > 0) {
      throw new Error("Invalid string. Length must be a multiple of 4");
   }
   placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
   arr = new Arr2((len * 3) / 4 - placeHolders);
   l = placeHolders > 0 ? len - 4 : len;
   var L = 0;
   for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp =
         (revLookup2[b64.charCodeAt(i)] << 18) |
         (revLookup2[b64.charCodeAt(i + 1)] << 12) |
         (revLookup2[b64.charCodeAt(i + 2)] << 6) |
         revLookup2[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 255;
      arr[L++] = (tmp >> 8) & 255;
      arr[L++] = tmp & 255;
   }
   if (placeHolders === 2) {
      tmp = (revLookup2[b64.charCodeAt(i)] << 2) | (revLookup2[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 255;
   } else if (placeHolders === 1) {
      tmp =
         (revLookup2[b64.charCodeAt(i)] << 10) | (revLookup2[b64.charCodeAt(i + 1)] << 4) | (revLookup2[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 255;
      arr[L++] = tmp & 255;
   }
   return arr;
}
function tripletToBase642(num) {
   return lookup2[(num >> 18) & 63] + lookup2[(num >> 12) & 63] + lookup2[(num >> 6) & 63] + lookup2[num & 63];
}
function encodeChunk2(uint8, start, end) {
   var tmp;
   var output = [];
   for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase642(tmp));
   }
   return output.join("");
}
function fromByteArray(uint8) {
   if (!inited2) {
      init2();
   }
   var tmp;
   var len = uint8.length;
   var extraBytes = len % 3;
   var output = "";
   var parts = [];
   var maxChunkLength = 16383;
   for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk2(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
   }
   if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup2[tmp >> 2];
      output += lookup2[(tmp << 4) & 63];
      output += "==";
   } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup2[tmp >> 10];
      output += lookup2[(tmp >> 4) & 63];
      output += lookup2[(tmp << 2) & 63];
      output += "=";
   }
   parts.push(output);
   return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
   var e, m2;
   var eLen = nBytes * 8 - mLen - 1;
   var eMax = (1 << eLen) - 1;
   var eBias = eMax >> 1;
   var nBits = -7;
   var i = isLE ? nBytes - 1 : 0;
   var d = isLE ? -1 : 1;
   var s = buffer[offset + i];
   i += d;
   e = s & ((1 << -nBits) - 1);
   s >>= -nBits;
   nBits += eLen;
   for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
   m2 = e & ((1 << -nBits) - 1);
   e >>= -nBits;
   nBits += mLen;
   for (; nBits > 0; m2 = m2 * 256 + buffer[offset + i], i += d, nBits -= 8) {}
   if (e === 0) {
      e = 1 - eBias;
   } else if (e === eMax) {
      return m2 ? NaN : (s ? -1 : 1) * Infinity;
   } else {
      m2 = m2 + Math.pow(2, mLen);
      e = e - eBias;
   }
   return (s ? -1 : 1) * m2 * Math.pow(2, e - mLen);
}
function write2(buffer, value, offset, isLE, mLen, nBytes) {
   var e, m2, c2;
   var eLen = nBytes * 8 - mLen - 1;
   var eMax = (1 << eLen) - 1;
   var eBias = eMax >> 1;
   var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
   var i = isLE ? 0 : nBytes - 1;
   var d = isLE ? 1 : -1;
   var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;
   value = Math.abs(value);
   if (isNaN(value) || value === Infinity) {
      m2 = isNaN(value) ? 1 : 0;
      e = eMax;
   } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c2 = Math.pow(2, -e)) < 1) {
         e--;
         c2 *= 2;
      }
      if (e + eBias >= 1) {
         value += rt / c2;
      } else {
         value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c2 >= 2) {
         e++;
         c2 /= 2;
      }
      if (e + eBias >= eMax) {
         m2 = 0;
         e = eMax;
      } else if (e + eBias >= 1) {
         m2 = (value * c2 - 1) * Math.pow(2, mLen);
         e = e + eBias;
      } else {
         m2 = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
         e = 0;
      }
   }
   for (; mLen >= 8; buffer[offset + i] = m2 & 255, i += d, m2 /= 256, mLen -= 8) {}
   e = (e << mLen) | m2;
   eLen += mLen;
   for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {}
   buffer[offset + i - d] |= s * 128;
}
var toString3 = {}.toString;
var isArray =
   Array.isArray ||
   function (arr) {
      return toString3.call(arr) == "[object Array]";
   };
var INSPECT_MAX_BYTES = 50;
Buffer3.TYPED_ARRAY_SUPPORT = globalThis.TYPED_ARRAY_SUPPORT !== void 0 ? globalThis.TYPED_ARRAY_SUPPORT : true;
var _kMaxLength = kMaxLength2();
function kMaxLength2() {
   return Buffer3.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function createBuffer2(that, length) {
   if (kMaxLength2() < length) {
      throw new RangeError("Invalid typed array length");
   }
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      that = new Uint8Array(length);
      that.__proto__ = Buffer3.prototype;
   } else {
      if (that === null) {
         that = new Buffer3(length);
      }
      that.length = length;
   }
   return that;
}
function Buffer3(arg, encodingOrOffset, length) {
   if (!Buffer3.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer3)) {
      return new Buffer3(arg, encodingOrOffset, length);
   }
   if (typeof arg === "number") {
      if (typeof encodingOrOffset === "string") {
         throw new Error("If encoding is specified then the first argument must be a string");
      }
      return allocUnsafe2(this, arg);
   }
   return from2(this, arg, encodingOrOffset, length);
}
Buffer3.poolSize = 8192;
Buffer3._augment = function (arr) {
   arr.__proto__ = Buffer3.prototype;
   return arr;
};
function from2(that, value, encodingOrOffset, length) {
   if (typeof value === "number") {
      throw new TypeError('"value" argument must not be a number');
   }
   if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return fromArrayBuffer2(that, value, encodingOrOffset, length);
   }
   if (typeof value === "string") {
      return fromString2(that, value, encodingOrOffset);
   }
   return fromObject2(that, value);
}
Buffer3.from = function (value, encodingOrOffset, length) {
   return from2(null, value, encodingOrOffset, length);
};
if (Buffer3.TYPED_ARRAY_SUPPORT) {
   Buffer3.prototype.__proto__ = Uint8Array.prototype;
   Buffer3.__proto__ = Uint8Array;
}
function assertSize2(size) {
   if (typeof size !== "number") {
      throw new TypeError('"size" argument must be a number');
   } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
   }
}
function alloc2(that, size, fill3, encoding) {
   assertSize2(size);
   if (size <= 0) {
      return createBuffer2(that, size);
   }
   if (fill3 !== void 0) {
      return typeof encoding === "string" ? createBuffer2(that, size).fill(fill3, encoding) : createBuffer2(that, size).fill(fill3);
   }
   return createBuffer2(that, size);
}
Buffer3.alloc = function (size, fill3, encoding) {
   return alloc2(null, size, fill3, encoding);
};
function allocUnsafe2(that, size) {
   assertSize2(size);
   that = createBuffer2(that, size < 0 ? 0 : checked2(size) | 0);
   if (!Buffer3.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
         that[i] = 0;
      }
   }
   return that;
}
Buffer3.allocUnsafe = function (size) {
   return allocUnsafe2(null, size);
};
Buffer3.allocUnsafeSlow = function (size) {
   return allocUnsafe2(null, size);
};
function fromString2(that, string, encoding) {
   if (typeof encoding !== "string" || encoding === "") {
      encoding = "utf8";
   }
   if (!Buffer3.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
   }
   var length = byteLength2(string, encoding) | 0;
   that = createBuffer2(that, length);
   var actual = that.write(string, encoding);
   if (actual !== length) {
      that = that.slice(0, actual);
   }
   return that;
}
function fromArrayLike2(that, array) {
   var length = array.length < 0 ? 0 : checked2(array.length) | 0;
   that = createBuffer2(that, length);
   for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
   }
   return that;
}
function fromArrayBuffer2(that, array, byteOffset, length) {
   array.byteLength;
   if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError("'offset' is out of bounds");
   }
   if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError("'length' is out of bounds");
   }
   if (byteOffset === void 0 && length === void 0) {
      array = new Uint8Array(array);
   } else if (length === void 0) {
      array = new Uint8Array(array, byteOffset);
   } else {
      array = new Uint8Array(array, byteOffset, length);
   }
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      that = array;
      that.__proto__ = Buffer3.prototype;
   } else {
      that = fromArrayLike2(that, array);
   }
   return that;
}
function fromObject2(that, obj) {
   if (internalIsBuffer2(obj)) {
      var len = checked2(obj.length) | 0;
      that = createBuffer2(that, len);
      if (that.length === 0) {
         return that;
      }
      obj.copy(that, 0, 0, len);
      return that;
   }
   if (obj) {
      if ((typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer) || "length" in obj) {
         if (typeof obj.length !== "number" || isnan2(obj.length)) {
            return createBuffer2(that, 0);
         }
         return fromArrayLike2(that, obj);
      }
      if (obj.type === "Buffer" && isArray(obj.data)) {
         return fromArrayLike2(that, obj.data);
      }
   }
   throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
}
function checked2(length) {
   if (length >= kMaxLength2()) {
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength2().toString(16) + " bytes");
   }
   return length | 0;
}
Buffer3.isBuffer = isBuffer2;
function internalIsBuffer2(b) {
   return !!(b != null && b._isBuffer);
}
Buffer3.compare = function compare3(a, b) {
   if (!internalIsBuffer2(a) || !internalIsBuffer2(b)) {
      throw new TypeError("Arguments must be Buffers");
   }
   if (a === b) return 0;
   var x = a.length;
   var y = b.length;
   for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
         x = a[i];
         y = b[i];
         break;
      }
   }
   if (x < y) return -1;
   if (y < x) return 1;
   return 0;
};
Buffer3.isEncoding = function isEncoding2(encoding) {
   switch (String(encoding).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
         return true;
      default:
         return false;
   }
};
Buffer3.concat = function concat2(list, length) {
   if (!isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
   }
   if (list.length === 0) {
      return Buffer3.alloc(0);
   }
   var i;
   if (length === void 0) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
         length += list[i].length;
      }
   }
   var buffer = Buffer3.allocUnsafe(length);
   var pos = 0;
   for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer2(buf)) {
         throw new TypeError('"list" argument must be an Array of Buffers');
      }
      buf.copy(buffer, pos);
      pos += buf.length;
   }
   return buffer;
};
function byteLength2(string, encoding) {
   if (internalIsBuffer2(string)) {
      return string.length;
   }
   if (
      typeof ArrayBuffer !== "undefined" &&
      typeof ArrayBuffer.isView === "function" &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)
   ) {
      return string.byteLength;
   }
   if (typeof string !== "string") {
      string = "" + string;
   }
   var len = string.length;
   if (len === 0) return 0;
   var loweredCase = false;
   for (;;) {
      switch (encoding) {
         case "ascii":
         case "latin1":
         case "binary":
            return len;
         case "utf8":
         case "utf-8":
         case void 0:
            return utf8ToBytes2(string).length;
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
            return len * 2;
         case "hex":
            return len >>> 1;
         case "base64":
            return base64ToBytes2(string).length;
         default:
            if (loweredCase) return utf8ToBytes2(string).length;
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
      }
   }
}
Buffer3.byteLength = byteLength2;
function slowToString2(encoding, start, end) {
   var loweredCase = false;
   if (start === void 0 || start < 0) {
      start = 0;
   }
   if (start > this.length) {
      return "";
   }
   if (end === void 0 || end > this.length) {
      end = this.length;
   }
   if (end <= 0) {
      return "";
   }
   end >>>= 0;
   start >>>= 0;
   if (end <= start) {
      return "";
   }
   if (!encoding) encoding = "utf8";
   while (true) {
      switch (encoding) {
         case "hex":
            return hexSlice2(this, start, end);
         case "utf8":
         case "utf-8":
            return utf8Slice2(this, start, end);
         case "ascii":
            return asciiSlice2(this, start, end);
         case "latin1":
         case "binary":
            return latin1Slice2(this, start, end);
         case "base64":
            return base64Slice2(this, start, end);
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
            return utf16leSlice2(this, start, end);
         default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
      }
   }
}
Buffer3.prototype._isBuffer = true;
function swap2(b, n, m2) {
   var i = b[n];
   b[n] = b[m2];
   b[m2] = i;
}
Buffer3.prototype.swap16 = function swap162() {
   var len = this.length;
   if (len % 2 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 16-bits");
   }
   for (var i = 0; i < len; i += 2) {
      swap2(this, i, i + 1);
   }
   return this;
};
Buffer3.prototype.swap32 = function swap322() {
   var len = this.length;
   if (len % 4 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 32-bits");
   }
   for (var i = 0; i < len; i += 4) {
      swap2(this, i, i + 3);
      swap2(this, i + 1, i + 2);
   }
   return this;
};
Buffer3.prototype.swap64 = function swap642() {
   var len = this.length;
   if (len % 8 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 64-bits");
   }
   for (var i = 0; i < len; i += 8) {
      swap2(this, i, i + 7);
      swap2(this, i + 1, i + 6);
      swap2(this, i + 2, i + 5);
      swap2(this, i + 3, i + 4);
   }
   return this;
};
Buffer3.prototype.toString = function toString4() {
   var length = this.length | 0;
   if (length === 0) return "";
   if (arguments.length === 0) return utf8Slice2(this, 0, length);
   return slowToString2.apply(this, arguments);
};
Buffer3.prototype.equals = function equals2(b) {
   if (!internalIsBuffer2(b)) throw new TypeError("Argument must be a Buffer");
   if (this === b) return true;
   return Buffer3.compare(this, b) === 0;
};
Buffer3.prototype.inspect = function inspect() {
   var str = "";
   var max = INSPECT_MAX_BYTES;
   if (this.length > 0) {
      str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
      if (this.length > max) str += " ... ";
   }
   return "<Buffer " + str + ">";
};
Buffer3.prototype.compare = function compare4(target, start, end, thisStart, thisEnd) {
   if (!internalIsBuffer2(target)) {
      throw new TypeError("Argument must be a Buffer");
   }
   if (start === void 0) {
      start = 0;
   }
   if (end === void 0) {
      end = target ? target.length : 0;
   }
   if (thisStart === void 0) {
      thisStart = 0;
   }
   if (thisEnd === void 0) {
      thisEnd = this.length;
   }
   if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError("out of range index");
   }
   if (thisStart >= thisEnd && start >= end) {
      return 0;
   }
   if (thisStart >= thisEnd) {
      return -1;
   }
   if (start >= end) {
      return 1;
   }
   start >>>= 0;
   end >>>= 0;
   thisStart >>>= 0;
   thisEnd >>>= 0;
   if (this === target) return 0;
   var x = thisEnd - thisStart;
   var y = end - start;
   var len = Math.min(x, y);
   var thisCopy = this.slice(thisStart, thisEnd);
   var targetCopy = target.slice(start, end);
   for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
         x = thisCopy[i];
         y = targetCopy[i];
         break;
      }
   }
   if (x < y) return -1;
   if (y < x) return 1;
   return 0;
};
function bidirectionalIndexOf2(buffer, val, byteOffset, encoding, dir) {
   if (buffer.length === 0) return -1;
   if (typeof byteOffset === "string") {
      encoding = byteOffset;
      byteOffset = 0;
   } else if (byteOffset > 2147483647) {
      byteOffset = 2147483647;
   } else if (byteOffset < -2147483648) {
      byteOffset = -2147483648;
   }
   byteOffset = +byteOffset;
   if (isNaN(byteOffset)) {
      byteOffset = dir ? 0 : buffer.length - 1;
   }
   if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
   if (byteOffset >= buffer.length) {
      if (dir) return -1;
      else byteOffset = buffer.length - 1;
   } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1;
   }
   if (typeof val === "string") {
      val = Buffer3.from(val, encoding);
   }
   if (internalIsBuffer2(val)) {
      if (val.length === 0) {
         return -1;
      }
      return arrayIndexOf2(buffer, val, byteOffset, encoding, dir);
   } else if (typeof val === "number") {
      val = val & 255;
      if (Buffer3.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
         if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
         } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
         }
      }
      return arrayIndexOf2(buffer, [val], byteOffset, encoding, dir);
   }
   throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf2(arr, val, byteOffset, encoding, dir) {
   var indexSize = 1;
   var arrLength = arr.length;
   var valLength = val.length;
   if (encoding !== void 0) {
      encoding = String(encoding).toLowerCase();
      if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
         if (arr.length < 2 || val.length < 2) {
            return -1;
         }
         indexSize = 2;
         arrLength /= 2;
         valLength /= 2;
         byteOffset /= 2;
      }
   }
   function read2(buf, i2) {
      if (indexSize === 1) {
         return buf[i2];
      } else {
         return buf.readUInt16BE(i2 * indexSize);
      }
   }
   var i;
   if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
         if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
         } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
         }
      }
   } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
         var found = true;
         for (var j = 0; j < valLength; j++) {
            if (read2(arr, i + j) !== read2(val, j)) {
               found = false;
               break;
            }
         }
         if (found) return i;
      }
   }
   return -1;
}
Buffer3.prototype.includes = function includes2(val, byteOffset, encoding) {
   return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer3.prototype.indexOf = function indexOf2(val, byteOffset, encoding) {
   return bidirectionalIndexOf2(this, val, byteOffset, encoding, true);
};
Buffer3.prototype.lastIndexOf = function lastIndexOf2(val, byteOffset, encoding) {
   return bidirectionalIndexOf2(this, val, byteOffset, encoding, false);
};
function hexWrite2(buf, string, offset, length) {
   offset = Number(offset) || 0;
   var remaining = buf.length - offset;
   if (!length) {
      length = remaining;
   } else {
      length = Number(length);
      if (length > remaining) {
         length = remaining;
      }
   }
   var strLen = string.length;
   if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
   if (length > strLen / 2) {
      length = strLen / 2;
   }
   for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
   }
   return i;
}
function utf8Write2(buf, string, offset, length) {
   return blitBuffer2(utf8ToBytes2(string, buf.length - offset), buf, offset, length);
}
function asciiWrite2(buf, string, offset, length) {
   return blitBuffer2(asciiToBytes2(string), buf, offset, length);
}
function latin1Write2(buf, string, offset, length) {
   return asciiWrite2(buf, string, offset, length);
}
function base64Write2(buf, string, offset, length) {
   return blitBuffer2(base64ToBytes2(string), buf, offset, length);
}
function ucs2Write2(buf, string, offset, length) {
   return blitBuffer2(utf16leToBytes2(string, buf.length - offset), buf, offset, length);
}
Buffer3.prototype.write = function write3(string, offset, length, encoding) {
   if (offset === void 0) {
      encoding = "utf8";
      length = this.length;
      offset = 0;
   } else if (length === void 0 && typeof offset === "string") {
      encoding = offset;
      length = this.length;
      offset = 0;
   } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
         length = length | 0;
         if (encoding === void 0) encoding = "utf8";
      } else {
         encoding = length;
         length = void 0;
      }
   } else {
      throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
   }
   var remaining = this.length - offset;
   if (length === void 0 || length > remaining) length = remaining;
   if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError("Attempt to write outside buffer bounds");
   }
   if (!encoding) encoding = "utf8";
   var loweredCase = false;
   for (;;) {
      switch (encoding) {
         case "hex":
            return hexWrite2(this, string, offset, length);
         case "utf8":
         case "utf-8":
            return utf8Write2(this, string, offset, length);
         case "ascii":
            return asciiWrite2(this, string, offset, length);
         case "latin1":
         case "binary":
            return latin1Write2(this, string, offset, length);
         case "base64":
            return base64Write2(this, string, offset, length);
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
            return ucs2Write2(this, string, offset, length);
         default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
      }
   }
};
Buffer3.prototype.toJSON = function toJSON2() {
   return {
      type: "Buffer",
      data: Array.prototype.slice.call(this._arr || this, 0),
   };
};
function base64Slice2(buf, start, end) {
   if (start === 0 && end === buf.length) {
      return fromByteArray(buf);
   } else {
      return fromByteArray(buf.slice(start, end));
   }
}
function utf8Slice2(buf, start, end) {
   end = Math.min(buf.length, end);
   var res = [];
   var i = start;
   while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
      if (i + bytesPerSequence <= end) {
         var secondByte, thirdByte, fourthByte, tempCodePoint;
         switch (bytesPerSequence) {
            case 1:
               if (firstByte < 128) {
                  codePoint = firstByte;
               }
               break;
            case 2:
               secondByte = buf[i + 1];
               if ((secondByte & 192) === 128) {
                  tempCodePoint = ((firstByte & 31) << 6) | (secondByte & 63);
                  if (tempCodePoint > 127) {
                     codePoint = tempCodePoint;
                  }
               }
               break;
            case 3:
               secondByte = buf[i + 1];
               thirdByte = buf[i + 2];
               if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = ((firstByte & 15) << 12) | ((secondByte & 63) << 6) | (thirdByte & 63);
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                     codePoint = tempCodePoint;
                  }
               }
               break;
            case 4:
               secondByte = buf[i + 1];
               thirdByte = buf[i + 2];
               fourthByte = buf[i + 3];
               if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = ((firstByte & 15) << 18) | ((secondByte & 63) << 12) | ((thirdByte & 63) << 6) | (fourthByte & 63);
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                     codePoint = tempCodePoint;
                  }
               }
         }
      }
      if (codePoint === null) {
         codePoint = 65533;
         bytesPerSequence = 1;
      } else if (codePoint > 65535) {
         codePoint -= 65536;
         res.push(((codePoint >>> 10) & 1023) | 55296);
         codePoint = 56320 | (codePoint & 1023);
      }
      res.push(codePoint);
      i += bytesPerSequence;
   }
   return decodeCodePointsArray2(res);
}
var MAX_ARGUMENTS_LENGTH2 = 4096;
function decodeCodePointsArray2(codePoints) {
   var len = codePoints.length;
   if (len <= MAX_ARGUMENTS_LENGTH2) {
      return String.fromCharCode.apply(String, codePoints);
   }
   var res = "";
   var i = 0;
   while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH2)));
   }
   return res;
}
function asciiSlice2(buf, start, end) {
   var ret = "";
   end = Math.min(buf.length, end);
   for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 127);
   }
   return ret;
}
function latin1Slice2(buf, start, end) {
   var ret = "";
   end = Math.min(buf.length, end);
   for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
   }
   return ret;
}
function hexSlice2(buf, start, end) {
   var len = buf.length;
   if (!start || start < 0) start = 0;
   if (!end || end < 0 || end > len) end = len;
   var out = "";
   for (var i = start; i < end; ++i) {
      out += toHex2(buf[i]);
   }
   return out;
}
function utf16leSlice2(buf, start, end) {
   var bytes = buf.slice(start, end);
   var res = "";
   for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
   }
   return res;
}
Buffer3.prototype.slice = function slice2(start, end) {
   var len = this.length;
   start = ~~start;
   end = end === void 0 ? len : ~~end;
   if (start < 0) {
      start += len;
      if (start < 0) start = 0;
   } else if (start > len) {
      start = len;
   }
   if (end < 0) {
      end += len;
      if (end < 0) end = 0;
   } else if (end > len) {
      end = len;
   }
   if (end < start) end = start;
   var newBuf;
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer3.prototype;
   } else {
      var sliceLen = end - start;
      newBuf = new Buffer3(sliceLen, void 0);
      for (var i = 0; i < sliceLen; ++i) {
         newBuf[i] = this[i + start];
      }
   }
   return newBuf;
};
function checkOffset2(offset, ext, length) {
   if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
   if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
}
Buffer3.prototype.readUIntLE = function readUIntLE2(offset, byteLength3, noAssert) {
   offset = offset | 0;
   byteLength3 = byteLength3 | 0;
   if (!noAssert) checkOffset2(offset, byteLength3, this.length);
   var val = this[offset];
   var mul = 1;
   var i = 0;
   while (++i < byteLength3 && (mul *= 256)) {
      val += this[offset + i] * mul;
   }
   return val;
};
Buffer3.prototype.readUIntBE = function readUIntBE2(offset, byteLength3, noAssert) {
   offset = offset | 0;
   byteLength3 = byteLength3 | 0;
   if (!noAssert) {
      checkOffset2(offset, byteLength3, this.length);
   }
   var val = this[offset + --byteLength3];
   var mul = 1;
   while (byteLength3 > 0 && (mul *= 256)) {
      val += this[offset + --byteLength3] * mul;
   }
   return val;
};
Buffer3.prototype.readUInt8 = function readUInt82(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 1, this.length);
   return this[offset];
};
Buffer3.prototype.readUInt16LE = function readUInt16LE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 2, this.length);
   return this[offset] | (this[offset + 1] << 8);
};
Buffer3.prototype.readUInt16BE = function readUInt16BE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 2, this.length);
   return (this[offset] << 8) | this[offset + 1];
};
Buffer3.prototype.readUInt32LE = function readUInt32LE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 4, this.length);
   return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + this[offset + 3] * 16777216;
};
Buffer3.prototype.readUInt32BE = function readUInt32BE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 4, this.length);
   return this[offset] * 16777216 + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
};
Buffer3.prototype.readIntLE = function readIntLE2(offset, byteLength3, noAssert) {
   offset = offset | 0;
   byteLength3 = byteLength3 | 0;
   if (!noAssert) checkOffset2(offset, byteLength3, this.length);
   var val = this[offset];
   var mul = 1;
   var i = 0;
   while (++i < byteLength3 && (mul *= 256)) {
      val += this[offset + i] * mul;
   }
   mul *= 128;
   if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
   return val;
};
Buffer3.prototype.readIntBE = function readIntBE2(offset, byteLength3, noAssert) {
   offset = offset | 0;
   byteLength3 = byteLength3 | 0;
   if (!noAssert) checkOffset2(offset, byteLength3, this.length);
   var i = byteLength3;
   var mul = 1;
   var val = this[offset + --i];
   while (i > 0 && (mul *= 256)) {
      val += this[offset + --i] * mul;
   }
   mul *= 128;
   if (val >= mul) val -= Math.pow(2, 8 * byteLength3);
   return val;
};
Buffer3.prototype.readInt8 = function readInt82(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 1, this.length);
   if (!(this[offset] & 128)) return this[offset];
   return (255 - this[offset] + 1) * -1;
};
Buffer3.prototype.readInt16LE = function readInt16LE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 2, this.length);
   var val = this[offset] | (this[offset + 1] << 8);
   return val & 32768 ? val | 4294901760 : val;
};
Buffer3.prototype.readInt16BE = function readInt16BE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 2, this.length);
   var val = this[offset + 1] | (this[offset] << 8);
   return val & 32768 ? val | 4294901760 : val;
};
Buffer3.prototype.readInt32LE = function readInt32LE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 4, this.length);
   return this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24);
};
Buffer3.prototype.readInt32BE = function readInt32BE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 4, this.length);
   return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3];
};
Buffer3.prototype.readFloatLE = function readFloatLE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 4, this.length);
   return read(this, offset, true, 23, 4);
};
Buffer3.prototype.readFloatBE = function readFloatBE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 4, this.length);
   return read(this, offset, false, 23, 4);
};
Buffer3.prototype.readDoubleLE = function readDoubleLE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 8, this.length);
   return read(this, offset, true, 52, 8);
};
Buffer3.prototype.readDoubleBE = function readDoubleBE2(offset, noAssert) {
   if (!noAssert) checkOffset2(offset, 8, this.length);
   return read(this, offset, false, 52, 8);
};
function checkInt2(buf, value, offset, ext, max, min) {
   if (!internalIsBuffer2(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
   if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
   if (offset + ext > buf.length) throw new RangeError("Index out of range");
}
Buffer3.prototype.writeUIntLE = function writeUIntLE2(value, offset, byteLength3, noAssert) {
   value = +value;
   offset = offset | 0;
   byteLength3 = byteLength3 | 0;
   if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
      checkInt2(this, value, offset, byteLength3, maxBytes, 0);
   }
   var mul = 1;
   var i = 0;
   this[offset] = value & 255;
   while (++i < byteLength3 && (mul *= 256)) {
      this[offset + i] = (value / mul) & 255;
   }
   return offset + byteLength3;
};
Buffer3.prototype.writeUIntBE = function writeUIntBE2(value, offset, byteLength3, noAssert) {
   value = +value;
   offset = offset | 0;
   byteLength3 = byteLength3 | 0;
   if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength3) - 1;
      checkInt2(this, value, offset, byteLength3, maxBytes, 0);
   }
   var i = byteLength3 - 1;
   var mul = 1;
   this[offset + i] = value & 255;
   while (--i >= 0 && (mul *= 256)) {
      this[offset + i] = (value / mul) & 255;
   }
   return offset + byteLength3;
};
Buffer3.prototype.writeUInt8 = function writeUInt82(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 1, 255, 0);
   if (!Buffer3.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
   this[offset] = value & 255;
   return offset + 1;
};
function objectWriteUInt162(buf, value, offset, littleEndian) {
   if (value < 0) value = 65535 + value + 1;
   for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (255 << (8 * (littleEndian ? i : 1 - i)))) >>> ((littleEndian ? i : 1 - i) * 8);
   }
}
Buffer3.prototype.writeUInt16LE = function writeUInt16LE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 2, 65535, 0);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
   } else {
      objectWriteUInt162(this, value, offset, true);
   }
   return offset + 2;
};
Buffer3.prototype.writeUInt16BE = function writeUInt16BE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 2, 65535, 0);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
   } else {
      objectWriteUInt162(this, value, offset, false);
   }
   return offset + 2;
};
function objectWriteUInt322(buf, value, offset, littleEndian) {
   if (value < 0) value = 4294967295 + value + 1;
   for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> ((littleEndian ? i : 3 - i) * 8)) & 255;
   }
}
Buffer3.prototype.writeUInt32LE = function writeUInt32LE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 4, 4294967295, 0);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
   } else {
      objectWriteUInt322(this, value, offset, true);
   }
   return offset + 4;
};
Buffer3.prototype.writeUInt32BE = function writeUInt32BE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 4, 4294967295, 0);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
   } else {
      objectWriteUInt322(this, value, offset, false);
   }
   return offset + 4;
};
Buffer3.prototype.writeIntLE = function writeIntLE2(value, offset, byteLength3, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength3 - 1);
      checkInt2(this, value, offset, byteLength3, limit - 1, -limit);
   }
   var i = 0;
   var mul = 1;
   var sub = 0;
   this[offset] = value & 255;
   while (++i < byteLength3 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
         sub = 1;
      }
      this[offset + i] = (((value / mul) >> 0) - sub) & 255;
   }
   return offset + byteLength3;
};
Buffer3.prototype.writeIntBE = function writeIntBE2(value, offset, byteLength3, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength3 - 1);
      checkInt2(this, value, offset, byteLength3, limit - 1, -limit);
   }
   var i = byteLength3 - 1;
   var mul = 1;
   var sub = 0;
   this[offset + i] = value & 255;
   while (--i >= 0 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
         sub = 1;
      }
      this[offset + i] = (((value / mul) >> 0) - sub) & 255;
   }
   return offset + byteLength3;
};
Buffer3.prototype.writeInt8 = function writeInt82(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 1, 127, -128);
   if (!Buffer3.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
   if (value < 0) value = 255 + value + 1;
   this[offset] = value & 255;
   return offset + 1;
};
Buffer3.prototype.writeInt16LE = function writeInt16LE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 2, 32767, -32768);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
   } else {
      objectWriteUInt162(this, value, offset, true);
   }
   return offset + 2;
};
Buffer3.prototype.writeInt16BE = function writeInt16BE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 2, 32767, -32768);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
   } else {
      objectWriteUInt162(this, value, offset, false);
   }
   return offset + 2;
};
Buffer3.prototype.writeInt32LE = function writeInt32LE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 4, 2147483647, -2147483648);
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
   } else {
      objectWriteUInt322(this, value, offset, true);
   }
   return offset + 4;
};
Buffer3.prototype.writeInt32BE = function writeInt32BE2(value, offset, noAssert) {
   value = +value;
   offset = offset | 0;
   if (!noAssert) checkInt2(this, value, offset, 4, 2147483647, -2147483648);
   if (value < 0) value = 4294967295 + value + 1;
   if (Buffer3.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
   } else {
      objectWriteUInt322(this, value, offset, false);
   }
   return offset + 4;
};
function checkIEEE7542(buf, value, offset, ext, max, min) {
   if (offset + ext > buf.length) throw new RangeError("Index out of range");
   if (offset < 0) throw new RangeError("Index out of range");
}
function writeFloat2(buf, value, offset, littleEndian, noAssert) {
   if (!noAssert) {
      checkIEEE7542(buf, value, offset, 4);
   }
   write2(buf, value, offset, littleEndian, 23, 4);
   return offset + 4;
}
Buffer3.prototype.writeFloatLE = function writeFloatLE2(value, offset, noAssert) {
   return writeFloat2(this, value, offset, true, noAssert);
};
Buffer3.prototype.writeFloatBE = function writeFloatBE2(value, offset, noAssert) {
   return writeFloat2(this, value, offset, false, noAssert);
};
function writeDouble2(buf, value, offset, littleEndian, noAssert) {
   if (!noAssert) {
      checkIEEE7542(buf, value, offset, 8);
   }
   write2(buf, value, offset, littleEndian, 52, 8);
   return offset + 8;
}
Buffer3.prototype.writeDoubleLE = function writeDoubleLE2(value, offset, noAssert) {
   return writeDouble2(this, value, offset, true, noAssert);
};
Buffer3.prototype.writeDoubleBE = function writeDoubleBE2(value, offset, noAssert) {
   return writeDouble2(this, value, offset, false, noAssert);
};
Buffer3.prototype.copy = function copy2(target, targetStart, start, end) {
   if (!start) start = 0;
   if (!end && end !== 0) end = this.length;
   if (targetStart >= target.length) targetStart = target.length;
   if (!targetStart) targetStart = 0;
   if (end > 0 && end < start) end = start;
   if (end === start) return 0;
   if (target.length === 0 || this.length === 0) return 0;
   if (targetStart < 0) {
      throw new RangeError("targetStart out of bounds");
   }
   if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
   if (end < 0) throw new RangeError("sourceEnd out of bounds");
   if (end > this.length) end = this.length;
   if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
   }
   var len = end - start;
   var i;
   if (this === target && start < targetStart && targetStart < end) {
      for (i = len - 1; i >= 0; --i) {
         target[i + targetStart] = this[i + start];
      }
   } else if (len < 1e3 || !Buffer3.TYPED_ARRAY_SUPPORT) {
      for (i = 0; i < len; ++i) {
         target[i + targetStart] = this[i + start];
      }
   } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
   }
   return len;
};
Buffer3.prototype.fill = function fill2(val, start, end, encoding) {
   if (typeof val === "string") {
      if (typeof start === "string") {
         encoding = start;
         start = 0;
         end = this.length;
      } else if (typeof end === "string") {
         encoding = end;
         end = this.length;
      }
      if (val.length === 1) {
         var code = val.charCodeAt(0);
         if (code < 256) {
            val = code;
         }
      }
      if (encoding !== void 0 && typeof encoding !== "string") {
         throw new TypeError("encoding must be a string");
      }
      if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
         throw new TypeError("Unknown encoding: " + encoding);
      }
   } else if (typeof val === "number") {
      val = val & 255;
   }
   if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError("Out of range index");
   }
   if (end <= start) {
      return this;
   }
   start = start >>> 0;
   end = end === void 0 ? this.length : end >>> 0;
   if (!val) val = 0;
   var i;
   if (typeof val === "number") {
      for (i = start; i < end; ++i) {
         this[i] = val;
      }
   } else {
      var bytes = internalIsBuffer2(val) ? val : utf8ToBytes2(new Buffer3(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
         this[i + start] = bytes[i % len];
      }
   }
   return this;
};
var INVALID_BASE64_RE2 = /[^+\/0-9A-Za-z-_]/g;
function base64clean2(str) {
   str = stringtrim2(str).replace(INVALID_BASE64_RE2, "");
   if (str.length < 2) return "";
   while (str.length % 4 !== 0) {
      str = str + "=";
   }
   return str;
}
function stringtrim2(str) {
   if (str.trim) return str.trim();
   return str.replace(/^\s+|\s+$/g, "");
}
function toHex2(n) {
   if (n < 16) return "0" + n.toString(16);
   return n.toString(16);
}
function utf8ToBytes2(string, units) {
   units = units || Infinity;
   var codePoint;
   var length = string.length;
   var leadSurrogate = null;
   var bytes = [];
   for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);
      if (codePoint > 55295 && codePoint < 57344) {
         if (!leadSurrogate) {
            if (codePoint > 56319) {
               if ((units -= 3) > -1) bytes.push(239, 191, 189);
               continue;
            } else if (i + 1 === length) {
               if ((units -= 3) > -1) bytes.push(239, 191, 189);
               continue;
            }
            leadSurrogate = codePoint;
            continue;
         }
         if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
         }
         codePoint = (((leadSurrogate - 55296) << 10) | (codePoint - 56320)) + 65536;
      } else if (leadSurrogate) {
         if ((units -= 3) > -1) bytes.push(239, 191, 189);
      }
      leadSurrogate = null;
      if (codePoint < 128) {
         if ((units -= 1) < 0) break;
         bytes.push(codePoint);
      } else if (codePoint < 2048) {
         if ((units -= 2) < 0) break;
         bytes.push((codePoint >> 6) | 192, (codePoint & 63) | 128);
      } else if (codePoint < 65536) {
         if ((units -= 3) < 0) break;
         bytes.push((codePoint >> 12) | 224, ((codePoint >> 6) & 63) | 128, (codePoint & 63) | 128);
      } else if (codePoint < 1114112) {
         if ((units -= 4) < 0) break;
         bytes.push((codePoint >> 18) | 240, ((codePoint >> 12) & 63) | 128, ((codePoint >> 6) & 63) | 128, (codePoint & 63) | 128);
      } else {
         throw new Error("Invalid code point");
      }
   }
   return bytes;
}
function asciiToBytes2(str) {
   var byteArray = [];
   for (var i = 0; i < str.length; ++i) {
      byteArray.push(str.charCodeAt(i) & 255);
   }
   return byteArray;
}
function utf16leToBytes2(str, units) {
   var c2, hi, lo;
   var byteArray = [];
   for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c2 = str.charCodeAt(i);
      hi = c2 >> 8;
      lo = c2 % 256;
      byteArray.push(lo);
      byteArray.push(hi);
   }
   return byteArray;
}
function base64ToBytes2(str) {
   return toByteArray(base64clean2(str));
}
function blitBuffer2(src, dst, offset, length) {
   for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
   }
   return i;
}
function isnan2(val) {
   return val !== val;
}
function isBuffer2(obj) {
   return obj != null && (!!obj._isBuffer || isFastBuffer2(obj) || isSlowBuffer2(obj));
}
function isFastBuffer2(obj) {
   return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function isSlowBuffer2(obj) {
   return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer2(obj.slice(0, 0));
}

// node-modules-polyfills:events
var events_exports = {};
__export(events_exports, {
   EventEmitter: () => EventEmitter,
   default: () => events_default,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var domain;
function EventHandlers() {}
EventHandlers.prototype = /* @__PURE__ */ Object.create(null);
function EventEmitter() {
   EventEmitter.init.call(this);
}
var events_default = EventEmitter;
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.usingDomains = false;
EventEmitter.prototype.domain = void 0;
EventEmitter.prototype._events = void 0;
EventEmitter.prototype._maxListeners = void 0;
EventEmitter.defaultMaxListeners = 10;
EventEmitter.init = function () {
   this.domain = null;
   if (EventEmitter.usingDomains) {
      if (domain.active && !(this instanceof domain.Domain)) {
         this.domain = domain.active;
      }
   }
   if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
   }
   this._maxListeners = this._maxListeners || void 0;
};
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
   if (typeof n !== "number" || n < 0 || isNaN(n)) throw new TypeError('"n" argument must be a positive number');
   this._maxListeners = n;
   return this;
};
function $getMaxListeners(that) {
   if (that._maxListeners === void 0) return EventEmitter.defaultMaxListeners;
   return that._maxListeners;
}
EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
   return $getMaxListeners(this);
};
function emitNone(handler, isFn, self2) {
   if (isFn) handler.call(self2);
   else {
      var len = handler.length;
      var listeners2 = arrayClone(handler, len);
      for (var i = 0; i < len; ++i) listeners2[i].call(self2);
   }
}
function emitOne(handler, isFn, self2, arg1) {
   if (isFn) handler.call(self2, arg1);
   else {
      var len = handler.length;
      var listeners2 = arrayClone(handler, len);
      for (var i = 0; i < len; ++i) listeners2[i].call(self2, arg1);
   }
}
function emitTwo(handler, isFn, self2, arg1, arg2) {
   if (isFn) handler.call(self2, arg1, arg2);
   else {
      var len = handler.length;
      var listeners2 = arrayClone(handler, len);
      for (var i = 0; i < len; ++i) listeners2[i].call(self2, arg1, arg2);
   }
}
function emitThree(handler, isFn, self2, arg1, arg2, arg3) {
   if (isFn) handler.call(self2, arg1, arg2, arg3);
   else {
      var len = handler.length;
      var listeners2 = arrayClone(handler, len);
      for (var i = 0; i < len; ++i) listeners2[i].call(self2, arg1, arg2, arg3);
   }
}
function emitMany(handler, isFn, self2, args) {
   if (isFn) handler.apply(self2, args);
   else {
      var len = handler.length;
      var listeners2 = arrayClone(handler, len);
      for (var i = 0; i < len; ++i) listeners2[i].apply(self2, args);
   }
}
EventEmitter.prototype.emit = function emit3(type) {
   var er, handler, len, args, i, events, domain2;
   var needDomainExit = false;
   var doError = type === "error";
   events = this._events;
   if (events) doError = doError && events.error == null;
   else if (!doError) return false;
   domain2 = this.domain;
   if (doError) {
      er = arguments[1];
      if (domain2) {
         if (!er) er = new Error('Uncaught, unspecified "error" event');
         er.domainEmitter = this;
         er.domain = domain2;
         er.domainThrown = false;
         domain2.emit("error", er);
      } else if (er instanceof Error) {
         throw er;
      } else {
         var err2 = new Error('Uncaught, unspecified "error" event. (' + er + ")");
         err2.context = er;
         throw err2;
      }
      return false;
   }
   handler = events[type];
   if (!handler) return false;
   var isFn = typeof handler === "function";
   len = arguments.length;
   switch (len) {
      case 1:
         emitNone(handler, isFn, this);
         break;
      case 2:
         emitOne(handler, isFn, this, arguments[1]);
         break;
      case 3:
         emitTwo(handler, isFn, this, arguments[1], arguments[2]);
         break;
      case 4:
         emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
         break;
      default:
         args = new Array(len - 1);
         for (i = 1; i < len; i++) args[i - 1] = arguments[i];
         emitMany(handler, isFn, this, args);
   }
   if (needDomainExit) domain2.exit();
   return true;
};
function _addListener(target, type, listener, prepend) {
   var m2;
   var events;
   var existing;
   if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
   events = target._events;
   if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
   } else {
      if (events.newListener) {
         target.emit("newListener", type, listener.listener ? listener.listener : listener);
         events = target._events;
      }
      existing = events[type];
   }
   if (!existing) {
      existing = events[type] = listener;
      ++target._eventsCount;
   } else {
      if (typeof existing === "function") {
         existing = events[type] = prepend ? [listener, existing] : [existing, listener];
      } else {
         if (prepend) {
            existing.unshift(listener);
         } else {
            existing.push(listener);
         }
      }
      if (!existing.warned) {
         m2 = $getMaxListeners(target);
         if (m2 && m2 > 0 && existing.length > m2) {
            existing.warned = true;
            var w = new Error(
               "Possible EventEmitter memory leak detected. " +
                  existing.length +
                  " " +
                  type +
                  " listeners added. Use emitter.setMaxListeners() to increase limit",
            );
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            emitWarning(w);
         }
      }
   }
   return target;
}
function emitWarning(e) {
   typeof console.warn === "function" ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener3(type, listener) {
   return _addListener(this, type, listener, false);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.prependListener = function prependListener(type, listener) {
   return _addListener(this, type, listener, true);
};
function _onceWrap(target, type, listener) {
   var fired = false;
   function g() {
      target.removeListener(type, g);
      if (!fired) {
         fired = true;
         listener.apply(target, arguments);
      }
   }
   g.listener = listener;
   return g;
}
EventEmitter.prototype.once = function once3(type, listener) {
   if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
   this.on(type, _onceWrap(this, type, listener));
   return this;
};
EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
   if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
   this.prependListener(type, _onceWrap(this, type, listener));
   return this;
};
EventEmitter.prototype.removeListener = function removeListener3(type, listener) {
   var list, events, position, i, originalListener;
   if (typeof listener !== "function") throw new TypeError('"listener" argument must be a function');
   events = this._events;
   if (!events) return this;
   list = events[type];
   if (!list) return this;
   if (list === listener || (list.listener && list.listener === listener)) {
      if (--this._eventsCount === 0) this._events = new EventHandlers();
      else {
         delete events[type];
         if (events.removeListener) this.emit("removeListener", type, list.listener || listener);
      }
   } else if (typeof list !== "function") {
      position = -1;
      for (i = list.length; i-- > 0; ) {
         if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
         }
      }
      if (position < 0) return this;
      if (list.length === 1) {
         list[0] = void 0;
         if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
         } else {
            delete events[type];
         }
      } else {
         spliceOne(list, position);
      }
      if (events.removeListener) this.emit("removeListener", type, originalListener || listener);
   }
   return this;
};
EventEmitter.prototype.removeAllListeners = function removeAllListeners3(type) {
   var listeners2, events;
   events = this._events;
   if (!events) return this;
   if (!events.removeListener) {
      if (arguments.length === 0) {
         this._events = new EventHandlers();
         this._eventsCount = 0;
      } else if (events[type]) {
         if (--this._eventsCount === 0) this._events = new EventHandlers();
         else delete events[type];
      }
      return this;
   }
   if (arguments.length === 0) {
      var keys2 = Object.keys(events);
      for (var i = 0, key; i < keys2.length; ++i) {
         key = keys2[i];
         if (key === "removeListener") continue;
         this.removeAllListeners(key);
      }
      this.removeAllListeners("removeListener");
      this._events = new EventHandlers();
      this._eventsCount = 0;
      return this;
   }
   listeners2 = events[type];
   if (typeof listeners2 === "function") {
      this.removeListener(type, listeners2);
   } else if (listeners2) {
      do {
         this.removeListener(type, listeners2[listeners2.length - 1]);
      } while (listeners2[0]);
   }
   return this;
};
EventEmitter.prototype.listeners = function listeners(type) {
   var evlistener;
   var ret;
   var events = this._events;
   if (!events) ret = [];
   else {
      evlistener = events[type];
      if (!evlistener) ret = [];
      else if (typeof evlistener === "function") ret = [evlistener.listener || evlistener];
      else ret = unwrapListeners(evlistener);
   }
   return ret;
};
EventEmitter.listenerCount = function (emitter, type) {
   if (typeof emitter.listenerCount === "function") {
      return emitter.listenerCount(type);
   } else {
      return listenerCount.call(emitter, type);
   }
};
EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
   var events = this._events;
   if (events) {
      var evlistener = events[type];
      if (typeof evlistener === "function") {
         return 1;
      } else if (evlistener) {
         return evlistener.length;
      }
   }
   return 0;
}
EventEmitter.prototype.eventNames = function eventNames() {
   return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};
function spliceOne(list, index) {
   for (var i = index, k2 = i + 1, n = list.length; k2 < n; i += 1, k2 += 1) list[i] = list[k2];
   list.pop();
}
function arrayClone(arr, i) {
   var copy3 = new Array(i);
   while (i--) copy3[i] = arr[i];
   return copy3;
}
function unwrapListeners(arr) {
   var ret = new Array(arr.length);
   for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
   }
   return ret;
}

// node-modules-polyfills:crypto
var crypto_exports = {};
__export(crypto_exports, {
   default: () => crypto_default,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var crypto_default = {};

// node-modules-polyfills:path
var path_exports = {};
__export(path_exports, {
   basename: () => basename,
   default: () => path_default,
   delimiter: () => delimiter,
   dirname: () => dirname,
   extname: () => extname,
   isAbsolute: () => isAbsolute,
   join: () => join2,
   normalize: () => normalize,
   relative: () => relative,
   resolve: () => resolve,
   sep: () => sep,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function normalizeArray(parts, allowAboveRoot) {
   var up = 0;
   for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
         parts.splice(i, 1);
      } else if (last === "..") {
         parts.splice(i, 1);
         up++;
      } else if (up) {
         parts.splice(i, 1);
         up--;
      }
   }
   if (allowAboveRoot) {
      for (; up--; up) {
         parts.unshift("..");
      }
   }
   return parts;
}
var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath2 = function (filename) {
   return splitPathRe.exec(filename).slice(1);
};
function resolve() {
   var resolvedPath = "",
      resolvedAbsolute = false;
   for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? arguments[i] : "/";
      if (typeof path !== "string") {
         throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
         continue;
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = path.charAt(0) === "/";
   }
   resolvedPath = normalizeArray(
      filter(resolvedPath.split("/"), function (p) {
         return !!p;
      }),
      !resolvedAbsolute,
   ).join("/");
   return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
}
function normalize(path) {
   var isPathAbsolute = isAbsolute(path),
      trailingSlash = substr(path, -1) === "/";
   path = normalizeArray(
      filter(path.split("/"), function (p) {
         return !!p;
      }),
      !isPathAbsolute,
   ).join("/");
   if (!path && !isPathAbsolute) {
      path = ".";
   }
   if (path && trailingSlash) {
      path += "/";
   }
   return (isPathAbsolute ? "/" : "") + path;
}
function isAbsolute(path) {
   return path.charAt(0) === "/";
}
function join2() {
   var paths = Array.prototype.slice.call(arguments, 0);
   return normalize(
      filter(paths, function (p, index) {
         if (typeof p !== "string") {
            throw new TypeError("Arguments to path.join must be strings");
         }
         return p;
      }).join("/"),
   );
}
function relative(from3, to) {
   from3 = resolve(from3).substr(1);
   to = resolve(to).substr(1);
   function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
         if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
         if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
   }
   var fromParts = trim(from3.split("/"));
   var toParts = trim(to.split("/"));
   var length = Math.min(fromParts.length, toParts.length);
   var samePartsLength = length;
   for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
         samePartsLength = i;
         break;
      }
   }
   var outputParts = [];
   for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
   }
   outputParts = outputParts.concat(toParts.slice(samePartsLength));
   return outputParts.join("/");
}
var sep = "/";
var delimiter = ":";
function dirname(path) {
   var result = splitPath2(path),
      root = result[0],
      dir = result[1];
   if (!root && !dir) {
      return ".";
   }
   if (dir) {
      dir = dir.substr(0, dir.length - 1);
   }
   return root + dir;
}
function basename(path, ext) {
   var f2 = splitPath2(path)[2];
   if (ext && f2.substr(-1 * ext.length) === ext) {
      f2 = f2.substr(0, f2.length - ext.length);
   }
   return f2;
}
function extname(path) {
   return splitPath2(path)[3];
}
var path_default = {
   extname,
   basename,
   dirname,
   sep,
   delimiter,
   relative,
   join: join2,
   isAbsolute,
   normalize,
   resolve,
};
function filter(xs2, f2) {
   if (xs2.filter) return xs2.filter(f2);
   var res = [];
   for (var i = 0; i < xs2.length; i++) {
      if (f2(xs2[i], i, xs2)) res.push(xs2[i]);
   }
   return res;
}
var substr =
   "ab".substr(-1) === "b"
      ? function (str, start, len) {
           return str.substr(start, len);
        }
      : function (str, start, len) {
           if (start < 0) start = str.length + start;
           return str.substr(start, len);
        };

// node-modules-polyfills:stream
var stream_exports = {};
__export(stream_exports, {
   Duplex: () => Duplex,
   PassThrough: () => PassThrough,
   Readable: () => Readable,
   Stream: () => Stream,
   Transform: () => Transform,
   Writable: () => Writable,
   default: () => stream_default,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node-modules-polyfills:util
var util_exports = {};
__export(util_exports, {
   _extend: () => _extend,
   debuglog: () => debuglog,
   default: () => util_default,
   deprecate: () => deprecate,
   format: () => format,
   inherits: () => inherits_default,
   inspect: () => inspect2,
   isArray: () => isArray2,
   isBoolean: () => isBoolean,
   isBuffer: () => isBuffer3,
   isDate: () => isDate,
   isError: () => isError,
   isFunction: () => isFunction,
   isNull: () => isNull,
   isNullOrUndefined: () => isNullOrUndefined,
   isNumber: () => isNumber,
   isObject: () => isObject2,
   isPrimitive: () => isPrimitive,
   isRegExp: () => isRegExp,
   isString: () => isString,
   isSymbol: () => isSymbol,
   isUndefined: () => isUndefined,
   log: () => log,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/inherits.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var inherits;
if (typeof Object.create === "function") {
   inherits = function inherits2(ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
         constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true,
         },
      });
   };
} else {
   inherits = function inherits2(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
   };
}
var inherits_default = inherits;

// node-modules-polyfills:util
var formatRegExp = /%[sdj%]/g;
function format(f2) {
   if (!isString(f2)) {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
         objects.push(inspect2(arguments[i]));
      }
      return objects.join(" ");
   }
   var i = 1;
   var args = arguments;
   var len = args.length;
   var str = String(f2).replace(formatRegExp, function (x2) {
      if (x2 === "%%") return "%";
      if (i >= len) return x2;
      switch (x2) {
         case "%s":
            return String(args[i++]);
         case "%d":
            return Number(args[i++]);
         case "%j":
            try {
               return JSON.stringify(args[i++]);
            } catch (_2) {
               return "[Circular]";
            }
         default:
            return x2;
      }
   });
   for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject2(x)) {
         str += " " + x;
      } else {
         str += " " + inspect2(x);
      }
   }
   return str;
}
function deprecate(fn, msg) {
   if (isUndefined(globalThis.process)) {
      return function () {
         return deprecate(fn, msg).apply(this, arguments);
      };
   }
   if (process_default.noDeprecation === true) {
      return fn;
   }
   var warned = false;
   function deprecated() {
      if (!warned) {
         if (process_default.throwDeprecation) {
            throw new Error(msg);
         } else if (process_default.traceDeprecation) {
            console.trace(msg);
         } else {
            console.error(msg);
         }
         warned = true;
      }
      return fn.apply(this, arguments);
   }
   return deprecated;
}
var debugs = {};
var debugEnviron;
function debuglog(set) {
   if (isUndefined(debugEnviron)) debugEnviron = process_default.env.NODE_DEBUG || "";
   set = set.toUpperCase();
   if (!debugs[set]) {
      if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
         var pid = 0;
         debugs[set] = function () {
            var msg = format.apply(null, arguments);
            console.error("%s %d: %s", set, pid, msg);
         };
      } else {
         debugs[set] = function () {};
      }
   }
   return debugs[set];
}
function inspect2(obj, opts) {
   var ctx = {
      seen: [],
      stylize: stylizeNoColor,
   };
   if (arguments.length >= 3) ctx.depth = arguments[2];
   if (arguments.length >= 4) ctx.colors = arguments[3];
   if (isBoolean(opts)) {
      ctx.showHidden = opts;
   } else if (opts) {
      _extend(ctx, opts);
   }
   if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
   if (isUndefined(ctx.depth)) ctx.depth = 2;
   if (isUndefined(ctx.colors)) ctx.colors = false;
   if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
   if (ctx.colors) ctx.stylize = stylizeWithColor;
   return formatValue(ctx, obj, ctx.depth);
}
inspect2.colors = {
   bold: [1, 22],
   italic: [3, 23],
   underline: [4, 24],
   inverse: [7, 27],
   white: [37, 39],
   grey: [90, 39],
   black: [30, 39],
   blue: [34, 39],
   cyan: [36, 39],
   green: [32, 39],
   magenta: [35, 39],
   red: [31, 39],
   yellow: [33, 39],
};
inspect2.styles = {
   special: "cyan",
   number: "yellow",
   boolean: "yellow",
   undefined: "grey",
   null: "bold",
   string: "green",
   date: "magenta",
   // "name": intentionally not styling
   regexp: "red",
};
function stylizeWithColor(str, styleType) {
   var style = inspect2.styles[styleType];
   if (style) {
      return "\x1B[" + inspect2.colors[style][0] + "m" + str + "\x1B[" + inspect2.colors[style][1] + "m";
   } else {
      return str;
   }
}
function stylizeNoColor(str, styleType) {
   return str;
}
function arrayToHash(array) {
   var hash = {};
   array.forEach(function (val, idx) {
      hash[val] = true;
   });
   return hash;
}
function formatValue(ctx, value, recurseTimes) {
   if (
      ctx.customInspect &&
      value &&
      isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
      value.inspect !== inspect2 && // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)
   ) {
      var ret = value.inspect(recurseTimes, ctx);
      if (!isString(ret)) {
         ret = formatValue(ctx, ret, recurseTimes);
      }
      return ret;
   }
   var primitive = formatPrimitive(ctx, value);
   if (primitive) {
      return primitive;
   }
   var keys2 = Object.keys(value);
   var visibleKeys = arrayToHash(keys2);
   if (ctx.showHidden) {
      keys2 = Object.getOwnPropertyNames(value);
   }
   if (isError(value) && (keys2.indexOf("message") >= 0 || keys2.indexOf("description") >= 0)) {
      return formatError(value);
   }
   if (keys2.length === 0) {
      if (isFunction(value)) {
         var name2 = value.name ? ": " + value.name : "";
         return ctx.stylize("[Function" + name2 + "]", "special");
      }
      if (isRegExp(value)) {
         return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
      }
      if (isDate(value)) {
         return ctx.stylize(Date.prototype.toString.call(value), "date");
      }
      if (isError(value)) {
         return formatError(value);
      }
   }
   var base = "",
      array = false,
      braces = ["{", "}"];
   if (isArray2(value)) {
      array = true;
      braces = ["[", "]"];
   }
   if (isFunction(value)) {
      var n = value.name ? ": " + value.name : "";
      base = " [Function" + n + "]";
   }
   if (isRegExp(value)) {
      base = " " + RegExp.prototype.toString.call(value);
   }
   if (isDate(value)) {
      base = " " + Date.prototype.toUTCString.call(value);
   }
   if (isError(value)) {
      base = " " + formatError(value);
   }
   if (keys2.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
   }
   if (recurseTimes < 0) {
      if (isRegExp(value)) {
         return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
      } else {
         return ctx.stylize("[Object]", "special");
      }
   }
   ctx.seen.push(value);
   var output;
   if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys2);
   } else {
      output = keys2.map(function (key) {
         return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
   }
   ctx.seen.pop();
   return reduceToSingleString(output, base, braces);
}
function formatPrimitive(ctx, value) {
   if (isUndefined(value)) return ctx.stylize("undefined", "undefined");
   if (isString(value)) {
      var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
      return ctx.stylize(simple, "string");
   }
   if (isNumber(value)) return ctx.stylize("" + value, "number");
   if (isBoolean(value)) return ctx.stylize("" + value, "boolean");
   if (isNull(value)) return ctx.stylize("null", "null");
}
function formatError(value) {
   return "[" + Error.prototype.toString.call(value) + "]";
}
function formatArray(ctx, value, recurseTimes, visibleKeys, keys2) {
   var output = [];
   for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
         output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
      } else {
         output.push("");
      }
   }
   keys2.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
         output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
      }
   });
   return output;
}
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
   var name2, str, desc;
   desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
   if (desc.get) {
      if (desc.set) {
         str = ctx.stylize("[Getter/Setter]", "special");
      } else {
         str = ctx.stylize("[Getter]", "special");
      }
   } else {
      if (desc.set) {
         str = ctx.stylize("[Setter]", "special");
      }
   }
   if (!hasOwnProperty(visibleKeys, key)) {
      name2 = "[" + key + "]";
   }
   if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
         if (isNull(recurseTimes)) {
            str = formatValue(ctx, desc.value, null);
         } else {
            str = formatValue(ctx, desc.value, recurseTimes - 1);
         }
         if (str.indexOf("\n") > -1) {
            if (array) {
               str = str
                  .split("\n")
                  .map(function (line) {
                     return "  " + line;
                  })
                  .join("\n")
                  .substr(2);
            } else {
               str =
                  "\n" +
                  str
                     .split("\n")
                     .map(function (line) {
                        return "   " + line;
                     })
                     .join("\n");
            }
         }
      } else {
         str = ctx.stylize("[Circular]", "special");
      }
   }
   if (isUndefined(name2)) {
      if (array && key.match(/^\d+$/)) {
         return str;
      }
      name2 = JSON.stringify("" + key);
      if (name2.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
         name2 = name2.substr(1, name2.length - 2);
         name2 = ctx.stylize(name2, "name");
      } else {
         name2 = name2
            .replace(/'/g, "\\'")
            .replace(/\\"/g, '"')
            .replace(/(^"|"$)/g, "'");
         name2 = ctx.stylize(name2, "string");
      }
   }
   return name2 + ": " + str;
}
function reduceToSingleString(output, base, braces) {
   var numLinesEst = 0;
   var length = output.reduce(function (prev, cur) {
      numLinesEst++;
      if (cur.indexOf("\n") >= 0) numLinesEst++;
      return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
   }, 0);
   if (length > 60) {
      return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
   }
   return braces[0] + base + " " + output.join(", ") + " " + braces[1];
}
function isArray2(ar2) {
   return Array.isArray(ar2);
}
function isBoolean(arg) {
   return typeof arg === "boolean";
}
function isNull(arg) {
   return arg === null;
}
function isNullOrUndefined(arg) {
   return arg == null;
}
function isNumber(arg) {
   return typeof arg === "number";
}
function isString(arg) {
   return typeof arg === "string";
}
function isSymbol(arg) {
   return typeof arg === "symbol";
}
function isUndefined(arg) {
   return arg === void 0;
}
function isRegExp(re) {
   return isObject2(re) && objectToString(re) === "[object RegExp]";
}
function isObject2(arg) {
   return typeof arg === "object" && arg !== null;
}
function isDate(d) {
   return isObject2(d) && objectToString(d) === "[object Date]";
}
function isError(e) {
   return isObject2(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
}
function isFunction(arg) {
   return typeof arg === "function";
}
function isPrimitive(arg) {
   return (
      arg === null ||
      typeof arg === "boolean" ||
      typeof arg === "number" ||
      typeof arg === "string" ||
      typeof arg === "symbol" || // ES6 symbol
      typeof arg === "undefined"
   );
}
function isBuffer3(maybeBuf) {
   return Buffer2.isBuffer(maybeBuf);
}
function objectToString(o2) {
   return Object.prototype.toString.call(o2);
}
function pad(n) {
   return n < 10 ? "0" + n.toString(10) : n.toString(10);
}
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function timestamp() {
   var d = /* @__PURE__ */ new Date();
   var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":");
   return [d.getDate(), months[d.getMonth()], time].join(" ");
}
function log() {
   console.log("%s - %s", timestamp(), format.apply(null, arguments));
}
function _extend(origin, add) {
   if (!add || !isObject2(add)) return origin;
   var keys2 = Object.keys(add);
   var i = keys2.length;
   while (i--) {
      origin[keys2[i]] = add[keys2[i]];
   }
   return origin;
}
function hasOwnProperty(obj, prop) {
   return Object.prototype.hasOwnProperty.call(obj, prop);
}
var util_default = {
   inherits: inherits_default,
   _extend,
   log,
   isBuffer: isBuffer3,
   isPrimitive,
   isFunction,
   isError,
   isDate,
   isObject: isObject2,
   isRegExp,
   isUndefined,
   isSymbol,
   isString,
   isNumber,
   isNullOrUndefined,
   isNull,
   isBoolean,
   isArray: isArray2,
   inspect: inspect2,
   deprecate,
   format,
   debuglog,
};

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/duplex.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/readable.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/buffer-list.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var buffer_list_default = BufferList;
function BufferList() {
   this.head = null;
   this.tail = null;
   this.length = 0;
}
BufferList.prototype.push = function (v2) {
   var entry = { data: v2, next: null };
   if (this.length > 0) this.tail.next = entry;
   else this.head = entry;
   this.tail = entry;
   ++this.length;
};
BufferList.prototype.unshift = function (v2) {
   var entry = { data: v2, next: this.head };
   if (this.length === 0) this.tail = entry;
   this.head = entry;
   ++this.length;
};
BufferList.prototype.shift = function () {
   if (this.length === 0) return;
   var ret = this.head.data;
   if (this.length === 1) this.head = this.tail = null;
   else this.head = this.head.next;
   --this.length;
   return ret;
};
BufferList.prototype.clear = function () {
   this.head = this.tail = null;
   this.length = 0;
};
BufferList.prototype.join = function (s) {
   if (this.length === 0) return "";
   var p = this.head;
   var ret = "" + p.data;
   while ((p = p.next)) {
      ret += s + p.data;
   }
   return ret;
};
BufferList.prototype.concat = function (n) {
   if (this.length === 0) return Buffer3.alloc(0);
   if (this.length === 1) return this.head.data;
   var ret = Buffer3.allocUnsafe(n >>> 0);
   var p = this.head;
   var i = 0;
   while (p) {
      p.data.copy(ret, i);
      i += p.data.length;
      p = p.next;
   }
   return ret;
};

// node-modules-polyfills:string_decoder
var string_decoder_exports = {};
__export(string_decoder_exports, {
   StringDecoder: () => StringDecoder,
});
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var isBufferEncoding =
   Buffer3.isEncoding ||
   function (encoding) {
      switch (encoding && encoding.toLowerCase()) {
         case "hex":
         case "utf8":
         case "utf-8":
         case "ascii":
         case "binary":
         case "base64":
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
         case "raw":
            return true;
         default:
            return false;
      }
   };
function assertEncoding(encoding) {
   if (encoding && !isBufferEncoding(encoding)) {
      throw new Error("Unknown encoding: " + encoding);
   }
}
function StringDecoder(encoding) {
   this.encoding = (encoding || "utf8").toLowerCase().replace(/[-_]/, "");
   assertEncoding(encoding);
   switch (this.encoding) {
      case "utf8":
         this.surrogateSize = 3;
         break;
      case "ucs2":
      case "utf16le":
         this.surrogateSize = 2;
         this.detectIncompleteChar = utf16DetectIncompleteChar;
         break;
      case "base64":
         this.surrogateSize = 3;
         this.detectIncompleteChar = base64DetectIncompleteChar;
         break;
      default:
         this.write = passThroughWrite;
         return;
   }
   this.charBuffer = new Buffer3(6);
   this.charReceived = 0;
   this.charLength = 0;
}
StringDecoder.prototype.write = function (buffer) {
   var charStr = "";
   while (this.charLength) {
      var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;
      buffer.copy(this.charBuffer, this.charReceived, 0, available);
      this.charReceived += available;
      if (this.charReceived < this.charLength) {
         return "";
      }
      buffer = buffer.slice(available, buffer.length);
      charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
      var charCode = charStr.charCodeAt(charStr.length - 1);
      if (charCode >= 55296 && charCode <= 56319) {
         this.charLength += this.surrogateSize;
         charStr = "";
         continue;
      }
      this.charReceived = this.charLength = 0;
      if (buffer.length === 0) {
         return charStr;
      }
      break;
   }
   this.detectIncompleteChar(buffer);
   var end = buffer.length;
   if (this.charLength) {
      buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
      end -= this.charReceived;
   }
   charStr += buffer.toString(this.encoding, 0, end);
   var end = charStr.length - 1;
   var charCode = charStr.charCodeAt(end);
   if (charCode >= 55296 && charCode <= 56319) {
      var size = this.surrogateSize;
      this.charLength += size;
      this.charReceived += size;
      this.charBuffer.copy(this.charBuffer, size, 0, size);
      buffer.copy(this.charBuffer, 0, 0, size);
      return charStr.substring(0, end);
   }
   return charStr;
};
StringDecoder.prototype.detectIncompleteChar = function (buffer) {
   var i = buffer.length >= 3 ? 3 : buffer.length;
   for (; i > 0; i--) {
      var c2 = buffer[buffer.length - i];
      if (i == 1 && c2 >> 5 == 6) {
         this.charLength = 2;
         break;
      }
      if (i <= 2 && c2 >> 4 == 14) {
         this.charLength = 3;
         break;
      }
      if (i <= 3 && c2 >> 3 == 30) {
         this.charLength = 4;
         break;
      }
   }
   this.charReceived = i;
};
StringDecoder.prototype.end = function (buffer) {
   var res = "";
   if (buffer && buffer.length) res = this.write(buffer);
   if (this.charReceived) {
      var cr = this.charReceived;
      var buf = this.charBuffer;
      var enc = this.encoding;
      res += buf.slice(0, cr).toString(enc);
   }
   return res;
};
function passThroughWrite(buffer) {
   return buffer.toString(this.encoding);
}
function utf16DetectIncompleteChar(buffer) {
   this.charReceived = buffer.length % 2;
   this.charLength = this.charReceived ? 2 : 0;
}
function base64DetectIncompleteChar(buffer) {
   this.charReceived = buffer.length % 3;
   this.charLength = this.charReceived ? 3 : 0;
}

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/readable.js
Readable.ReadableState = ReadableState;
var debug = debuglog("stream");
inherits_default(Readable, events_default);
function prependListener2(emitter, event, fn) {
   if (typeof emitter.prependListener === "function") {
      return emitter.prependListener(event, fn);
   } else {
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
   }
}
function listenerCount2(emitter, type) {
   return emitter.listeners(type).length;
}
function ReadableState(options, stream) {
   options = options || {};
   this.objectMode = !!options.objectMode;
   if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
   var hwm = options.highWaterMark;
   var defaultHwm = this.objectMode ? 16 : 16 * 1024;
   this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
   this.highWaterMark = ~~this.highWaterMark;
   this.buffer = new buffer_list_default();
   this.length = 0;
   this.pipes = null;
   this.pipesCount = 0;
   this.flowing = null;
   this.ended = false;
   this.endEmitted = false;
   this.reading = false;
   this.sync = true;
   this.needReadable = false;
   this.emittedReadable = false;
   this.readableListening = false;
   this.resumeScheduled = false;
   this.defaultEncoding = options.defaultEncoding || "utf8";
   this.ranOut = false;
   this.awaitDrain = 0;
   this.readingMore = false;
   this.decoder = null;
   this.encoding = null;
   if (options.encoding) {
      this.decoder = new StringDecoder(options.encoding);
      this.encoding = options.encoding;
   }
}
function Readable(options) {
   if (!(this instanceof Readable)) return new Readable(options);
   this._readableState = new ReadableState(options, this);
   this.readable = true;
   if (options && typeof options.read === "function") this._read = options.read;
   events_default.call(this);
}
Readable.prototype.push = function (chunk, encoding) {
   var state = this._readableState;
   if (!state.objectMode && typeof chunk === "string") {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
         chunk = Buffer2.from(chunk, encoding);
         encoding = "";
      }
   }
   return readableAddChunk(this, state, chunk, encoding, false);
};
Readable.prototype.unshift = function (chunk) {
   var state = this._readableState;
   return readableAddChunk(this, state, chunk, "", true);
};
Readable.prototype.isPaused = function () {
   return this._readableState.flowing === false;
};
function readableAddChunk(stream, state, chunk, encoding, addToFront) {
   var er = chunkInvalid(state, chunk);
   if (er) {
      stream.emit("error", er);
   } else if (chunk === null) {
      state.reading = false;
      onEofChunk(stream, state);
   } else if (state.objectMode || (chunk && chunk.length > 0)) {
      if (state.ended && !addToFront) {
         var e = new Error("stream.push() after EOF");
         stream.emit("error", e);
      } else if (state.endEmitted && addToFront) {
         var _e2 = new Error("stream.unshift() after end event");
         stream.emit("error", _e2);
      } else {
         var skipAdd;
         if (state.decoder && !addToFront && !encoding) {
            chunk = state.decoder.write(chunk);
            skipAdd = !state.objectMode && chunk.length === 0;
         }
         if (!addToFront) state.reading = false;
         if (!skipAdd) {
            if (state.flowing && state.length === 0 && !state.sync) {
               stream.emit("data", chunk);
               stream.read(0);
            } else {
               state.length += state.objectMode ? 1 : chunk.length;
               if (addToFront) state.buffer.unshift(chunk);
               else state.buffer.push(chunk);
               if (state.needReadable) emitReadable(stream);
            }
         }
         maybeReadMore(stream, state);
      }
   } else if (!addToFront) {
      state.reading = false;
   }
   return needMoreData(state);
}
function needMoreData(state) {
   return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}
Readable.prototype.setEncoding = function (enc) {
   this._readableState.decoder = new StringDecoder(enc);
   this._readableState.encoding = enc;
   return this;
};
var MAX_HWM = 8388608;
function computeNewHighWaterMark(n) {
   if (n >= MAX_HWM) {
      n = MAX_HWM;
   } else {
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
   }
   return n;
}
function howMuchToRead(n, state) {
   if (n <= 0 || (state.length === 0 && state.ended)) return 0;
   if (state.objectMode) return 1;
   if (n !== n) {
      if (state.flowing && state.length) return state.buffer.head.data.length;
      else return state.length;
   }
   if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
   if (n <= state.length) return n;
   if (!state.ended) {
      state.needReadable = true;
      return 0;
   }
   return state.length;
}
Readable.prototype.read = function (n) {
   debug("read", n);
   n = parseInt(n, 10);
   var state = this._readableState;
   var nOrig = n;
   if (n !== 0) state.emittedReadable = false;
   if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
      debug("read: emitReadable", state.length, state.ended);
      if (state.length === 0 && state.ended) endReadable(this);
      else emitReadable(this);
      return null;
   }
   n = howMuchToRead(n, state);
   if (n === 0 && state.ended) {
      if (state.length === 0) endReadable(this);
      return null;
   }
   var doRead = state.needReadable;
   debug("need readable", doRead);
   if (state.length === 0 || state.length - n < state.highWaterMark) {
      doRead = true;
      debug("length less than watermark", doRead);
   }
   if (state.ended || state.reading) {
      doRead = false;
      debug("reading or ended", doRead);
   } else if (doRead) {
      debug("do read");
      state.reading = true;
      state.sync = true;
      if (state.length === 0) state.needReadable = true;
      this._read(state.highWaterMark);
      state.sync = false;
      if (!state.reading) n = howMuchToRead(nOrig, state);
   }
   var ret;
   if (n > 0) ret = fromList(n, state);
   else ret = null;
   if (ret === null) {
      state.needReadable = true;
      n = 0;
   } else {
      state.length -= n;
   }
   if (state.length === 0) {
      if (!state.ended) state.needReadable = true;
      if (nOrig !== n && state.ended) endReadable(this);
   }
   if (ret !== null) this.emit("data", ret);
   return ret;
};
function chunkInvalid(state, chunk) {
   var er = null;
   if (!Buffer2.isBuffer(chunk) && typeof chunk !== "string" && chunk !== null && chunk !== void 0 && !state.objectMode) {
      er = new TypeError("Invalid non-string/buffer chunk");
   }
   return er;
}
function onEofChunk(stream, state) {
   if (state.ended) return;
   if (state.decoder) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) {
         state.buffer.push(chunk);
         state.length += state.objectMode ? 1 : chunk.length;
      }
   }
   state.ended = true;
   emitReadable(stream);
}
function emitReadable(stream) {
   var state = stream._readableState;
   state.needReadable = false;
   if (!state.emittedReadable) {
      debug("emitReadable", state.flowing);
      state.emittedReadable = true;
      if (state.sync) nextTick2(emitReadable_, stream);
      else emitReadable_(stream);
   }
}
function emitReadable_(stream) {
   debug("emit readable");
   stream.emit("readable");
   flow(stream);
}
function maybeReadMore(stream, state) {
   if (!state.readingMore) {
      state.readingMore = true;
      nextTick2(maybeReadMore_, stream, state);
   }
}
function maybeReadMore_(stream, state) {
   var len = state.length;
   while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
      debug("maybeReadMore read 0");
      stream.read(0);
      if (len === state.length) break;
      else len = state.length;
   }
   state.readingMore = false;
}
Readable.prototype._read = function (n) {
   this.emit("error", new Error("not implemented"));
};
Readable.prototype.pipe = function (dest, pipeOpts) {
   var src = this;
   var state = this._readableState;
   switch (state.pipesCount) {
      case 0:
         state.pipes = dest;
         break;
      case 1:
         state.pipes = [state.pipes, dest];
         break;
      default:
         state.pipes.push(dest);
         break;
   }
   state.pipesCount += 1;
   debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
   var doEnd = !pipeOpts || pipeOpts.end !== false;
   var endFn = doEnd ? onend2 : cleanup;
   if (state.endEmitted) nextTick2(endFn);
   else src.once("end", endFn);
   dest.on("unpipe", onunpipe);
   function onunpipe(readable) {
      debug("onunpipe");
      if (readable === src) {
         cleanup();
      }
   }
   function onend2() {
      debug("onend");
      dest.end();
   }
   var ondrain = pipeOnDrain(src);
   dest.on("drain", ondrain);
   var cleanedUp = false;
   function cleanup() {
      debug("cleanup");
      dest.removeListener("close", onclose);
      dest.removeListener("finish", onfinish);
      dest.removeListener("drain", ondrain);
      dest.removeListener("error", onerror);
      dest.removeListener("unpipe", onunpipe);
      src.removeListener("end", onend2);
      src.removeListener("end", cleanup);
      src.removeListener("data", ondata);
      cleanedUp = true;
      if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
   }
   var increasedAwaitDrain = false;
   src.on("data", ondata);
   function ondata(chunk) {
      debug("ondata");
      increasedAwaitDrain = false;
      var ret = dest.write(chunk);
      if (false === ret && !increasedAwaitDrain) {
         if (
            ((state.pipesCount === 1 && state.pipes === dest) || (state.pipesCount > 1 && indexOf3(state.pipes, dest) !== -1)) &&
            !cleanedUp
         ) {
            debug("false write response, pause", src._readableState.awaitDrain);
            src._readableState.awaitDrain++;
            increasedAwaitDrain = true;
         }
         src.pause();
      }
   }
   function onerror(er) {
      debug("onerror", er);
      unpipe();
      dest.removeListener("error", onerror);
      if (listenerCount2(dest, "error") === 0) dest.emit("error", er);
   }
   prependListener2(dest, "error", onerror);
   function onclose() {
      dest.removeListener("finish", onfinish);
      unpipe();
   }
   dest.once("close", onclose);
   function onfinish() {
      debug("onfinish");
      dest.removeListener("close", onclose);
      unpipe();
   }
   dest.once("finish", onfinish);
   function unpipe() {
      debug("unpipe");
      src.unpipe(dest);
   }
   dest.emit("pipe", src);
   if (!state.flowing) {
      debug("pipe resume");
      src.resume();
   }
   return dest;
};
function pipeOnDrain(src) {
   return function () {
      var state = src._readableState;
      debug("pipeOnDrain", state.awaitDrain);
      if (state.awaitDrain) state.awaitDrain--;
      if (state.awaitDrain === 0 && src.listeners("data").length) {
         state.flowing = true;
         flow(src);
      }
   };
}
Readable.prototype.unpipe = function (dest) {
   var state = this._readableState;
   if (state.pipesCount === 0) return this;
   if (state.pipesCount === 1) {
      if (dest && dest !== state.pipes) return this;
      if (!dest) dest = state.pipes;
      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;
      if (dest) dest.emit("unpipe", this);
      return this;
   }
   if (!dest) {
      var dests = state.pipes;
      var len = state.pipesCount;
      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;
      for (var _i = 0; _i < len; _i++) {
         dests[_i].emit("unpipe", this);
      }
      return this;
   }
   var i = indexOf3(state.pipes, dest);
   if (i === -1) return this;
   state.pipes.splice(i, 1);
   state.pipesCount -= 1;
   if (state.pipesCount === 1) state.pipes = state.pipes[0];
   dest.emit("unpipe", this);
   return this;
};
Readable.prototype.on = function (ev, fn) {
   var res = events_default.prototype.on.call(this, ev, fn);
   if (ev === "data") {
      if (this._readableState.flowing !== false) this.resume();
   } else if (ev === "readable") {
      var state = this._readableState;
      if (!state.endEmitted && !state.readableListening) {
         state.readableListening = state.needReadable = true;
         state.emittedReadable = false;
         if (!state.reading) {
            nextTick2(nReadingNextTick, this);
         } else if (state.length) {
            emitReadable(this, state);
         }
      }
   }
   return res;
};
Readable.prototype.addListener = Readable.prototype.on;
function nReadingNextTick(self2) {
   debug("readable nexttick read 0");
   self2.read(0);
}
Readable.prototype.resume = function () {
   var state = this._readableState;
   if (!state.flowing) {
      debug("resume");
      state.flowing = true;
      resume(this, state);
   }
   return this;
};
function resume(stream, state) {
   if (!state.resumeScheduled) {
      state.resumeScheduled = true;
      nextTick2(resume_, stream, state);
   }
}
function resume_(stream, state) {
   if (!state.reading) {
      debug("resume read 0");
      stream.read(0);
   }
   state.resumeScheduled = false;
   state.awaitDrain = 0;
   stream.emit("resume");
   flow(stream);
   if (state.flowing && !state.reading) stream.read(0);
}
Readable.prototype.pause = function () {
   debug("call pause flowing=%j", this._readableState.flowing);
   if (false !== this._readableState.flowing) {
      debug("pause");
      this._readableState.flowing = false;
      this.emit("pause");
   }
   return this;
};
function flow(stream) {
   var state = stream._readableState;
   debug("flow", state.flowing);
   while (state.flowing && stream.read() !== null) {}
}
Readable.prototype.wrap = function (stream) {
   var state = this._readableState;
   var paused2 = false;
   var self2 = this;
   stream.on("end", function () {
      debug("wrapped end");
      if (state.decoder && !state.ended) {
         var chunk = state.decoder.end();
         if (chunk && chunk.length) self2.push(chunk);
      }
      self2.push(null);
   });
   stream.on("data", function (chunk) {
      debug("wrapped data");
      if (state.decoder) chunk = state.decoder.write(chunk);
      if (state.objectMode && (chunk === null || chunk === void 0)) return;
      else if (!state.objectMode && (!chunk || !chunk.length)) return;
      var ret = self2.push(chunk);
      if (!ret) {
         paused2 = true;
         stream.pause();
      }
   });
   for (var i in stream) {
      if (this[i] === void 0 && typeof stream[i] === "function") {
         this[i] = (function (method) {
            return function () {
               return stream[method].apply(stream, arguments);
            };
         })(i);
      }
   }
   var events = ["error", "close", "destroy", "pause", "resume"];
   forEach(events, function (ev) {
      stream.on(ev, self2.emit.bind(self2, ev));
   });
   self2._read = function (n) {
      debug("wrapped _read", n);
      if (paused2) {
         paused2 = false;
         stream.resume();
      }
   };
   return self2;
};
Readable._fromList = fromList;
function fromList(n, state) {
   if (state.length === 0) return null;
   var ret;
   if (state.objectMode) ret = state.buffer.shift();
   else if (!n || n >= state.length) {
      if (state.decoder) ret = state.buffer.join("");
      else if (state.buffer.length === 1) ret = state.buffer.head.data;
      else ret = state.buffer.concat(state.length);
      state.buffer.clear();
   } else {
      ret = fromListPartial(n, state.buffer, state.decoder);
   }
   return ret;
}
function fromListPartial(n, list, hasStrings) {
   var ret;
   if (n < list.head.data.length) {
      ret = list.head.data.slice(0, n);
      list.head.data = list.head.data.slice(n);
   } else if (n === list.head.data.length) {
      ret = list.shift();
   } else {
      ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
   }
   return ret;
}
function copyFromBufferString(n, list) {
   var p = list.head;
   var c2 = 1;
   var ret = p.data;
   n -= ret.length;
   while ((p = p.next)) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;
      else ret += str.slice(0, n);
      n -= nb;
      if (n === 0) {
         if (nb === str.length) {
            ++c2;
            if (p.next) list.head = p.next;
            else list.head = list.tail = null;
         } else {
            list.head = p;
            p.data = str.slice(nb);
         }
         break;
      }
      ++c2;
   }
   list.length -= c2;
   return ret;
}
function copyFromBuffer(n, list) {
   var ret = Buffer2.allocUnsafe(n);
   var p = list.head;
   var c2 = 1;
   p.data.copy(ret);
   n -= p.data.length;
   while ((p = p.next)) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;
      if (n === 0) {
         if (nb === buf.length) {
            ++c2;
            if (p.next) list.head = p.next;
            else list.head = list.tail = null;
         } else {
            list.head = p;
            p.data = buf.slice(nb);
         }
         break;
      }
      ++c2;
   }
   list.length -= c2;
   return ret;
}
function endReadable(stream) {
   var state = stream._readableState;
   if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
   if (!state.endEmitted) {
      state.ended = true;
      nextTick2(endReadableNT, state, stream);
   }
}
function endReadableNT(state, stream) {
   if (!state.endEmitted && state.length === 0) {
      state.endEmitted = true;
      stream.readable = false;
      stream.emit("end");
   }
}
function forEach(xs2, f2) {
   for (var i = 0, l = xs2.length; i < l; i++) {
      f2(xs2[i], i);
   }
}
function indexOf3(xs2, x) {
   for (var i = 0, l = xs2.length; i < l; i++) {
      if (xs2[i] === x) return i;
   }
   return -1;
}

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/writable.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
Writable.WritableState = WritableState;
inherits_default(Writable, EventEmitter);
function nop() {}
function WriteReq(chunk, encoding, cb) {
   this.chunk = chunk;
   this.encoding = encoding;
   this.callback = cb;
   this.next = null;
}
function WritableState(options, stream) {
   Object.defineProperty(this, "buffer", {
      get: deprecate(function () {
         return this.getBuffer();
      }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead."),
   });
   options = options || {};
   this.objectMode = !!options.objectMode;
   if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
   var hwm = options.highWaterMark;
   var defaultHwm = this.objectMode ? 16 : 16 * 1024;
   this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
   this.highWaterMark = ~~this.highWaterMark;
   this.needDrain = false;
   this.ending = false;
   this.ended = false;
   this.finished = false;
   var noDecode = options.decodeStrings === false;
   this.decodeStrings = !noDecode;
   this.defaultEncoding = options.defaultEncoding || "utf8";
   this.length = 0;
   this.writing = false;
   this.corked = 0;
   this.sync = true;
   this.bufferProcessing = false;
   this.onwrite = function (er) {
      onwrite(stream, er);
   };
   this.writecb = null;
   this.writelen = 0;
   this.bufferedRequest = null;
   this.lastBufferedRequest = null;
   this.pendingcb = 0;
   this.prefinished = false;
   this.errorEmitted = false;
   this.bufferedRequestCount = 0;
   this.corkedRequestsFree = new CorkedRequest(this);
}
WritableState.prototype.getBuffer = function writableStateGetBuffer() {
   var current = this.bufferedRequest;
   var out = [];
   while (current) {
      out.push(current);
      current = current.next;
   }
   return out;
};
function Writable(options) {
   if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);
   this._writableState = new WritableState(options, this);
   this.writable = true;
   if (options) {
      if (typeof options.write === "function") this._write = options.write;
      if (typeof options.writev === "function") this._writev = options.writev;
   }
   EventEmitter.call(this);
}
Writable.prototype.pipe = function () {
   this.emit("error", new Error("Cannot pipe, not readable"));
};
function writeAfterEnd(stream, cb) {
   var er = new Error("write after end");
   stream.emit("error", er);
   nextTick2(cb, er);
}
function validChunk(stream, state, chunk, cb) {
   var valid = true;
   var er = false;
   if (chunk === null) {
      er = new TypeError("May not write null values to stream");
   } else if (!Buffer3.isBuffer(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
      er = new TypeError("Invalid non-string/buffer chunk");
   }
   if (er) {
      stream.emit("error", er);
      nextTick2(cb, er);
      valid = false;
   }
   return valid;
}
Writable.prototype.write = function (chunk, encoding, cb) {
   var state = this._writableState;
   var ret = false;
   if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
   }
   if (Buffer3.isBuffer(chunk)) encoding = "buffer";
   else if (!encoding) encoding = state.defaultEncoding;
   if (typeof cb !== "function") cb = nop;
   if (state.ended) writeAfterEnd(this, cb);
   else if (validChunk(this, state, chunk, cb)) {
      state.pendingcb++;
      ret = writeOrBuffer(this, state, chunk, encoding, cb);
   }
   return ret;
};
Writable.prototype.cork = function () {
   var state = this._writableState;
   state.corked++;
};
Writable.prototype.uncork = function () {
   var state = this._writableState;
   if (state.corked) {
      state.corked--;
      if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest)
         clearBuffer(this, state);
   }
};
Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
   if (typeof encoding === "string") encoding = encoding.toLowerCase();
   if (
      !(
         ["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf(
            (encoding + "").toLowerCase(),
         ) > -1
      )
   )
      throw new TypeError("Unknown encoding: " + encoding);
   this._writableState.defaultEncoding = encoding;
   return this;
};
function decodeChunk(state, chunk, encoding) {
   if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
      chunk = Buffer3.from(chunk, encoding);
   }
   return chunk;
}
function writeOrBuffer(stream, state, chunk, encoding, cb) {
   chunk = decodeChunk(state, chunk, encoding);
   if (Buffer3.isBuffer(chunk)) encoding = "buffer";
   var len = state.objectMode ? 1 : chunk.length;
   state.length += len;
   var ret = state.length < state.highWaterMark;
   if (!ret) state.needDrain = true;
   if (state.writing || state.corked) {
      var last = state.lastBufferedRequest;
      state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
      if (last) {
         last.next = state.lastBufferedRequest;
      } else {
         state.bufferedRequest = state.lastBufferedRequest;
      }
      state.bufferedRequestCount += 1;
   } else {
      doWrite(stream, state, false, len, chunk, encoding, cb);
   }
   return ret;
}
function doWrite(stream, state, writev, len, chunk, encoding, cb) {
   state.writelen = len;
   state.writecb = cb;
   state.writing = true;
   state.sync = true;
   if (writev) stream._writev(chunk, state.onwrite);
   else stream._write(chunk, encoding, state.onwrite);
   state.sync = false;
}
function onwriteError(stream, state, sync, er, cb) {
   --state.pendingcb;
   if (sync) nextTick2(cb, er);
   else cb(er);
   stream._writableState.errorEmitted = true;
   stream.emit("error", er);
}
function onwriteStateUpdate(state) {
   state.writing = false;
   state.writecb = null;
   state.length -= state.writelen;
   state.writelen = 0;
}
function onwrite(stream, er) {
   var state = stream._writableState;
   var sync = state.sync;
   var cb = state.writecb;
   onwriteStateUpdate(state);
   if (er) onwriteError(stream, state, sync, er, cb);
   else {
      var finished = needFinish(state);
      if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
         clearBuffer(stream, state);
      }
      if (sync) {
         nextTick2(afterWrite, stream, state, finished, cb);
      } else {
         afterWrite(stream, state, finished, cb);
      }
   }
}
function afterWrite(stream, state, finished, cb) {
   if (!finished) onwriteDrain(stream, state);
   state.pendingcb--;
   cb();
   finishMaybe(stream, state);
}
function onwriteDrain(stream, state) {
   if (state.length === 0 && state.needDrain) {
      state.needDrain = false;
      stream.emit("drain");
   }
}
function clearBuffer(stream, state) {
   state.bufferProcessing = true;
   var entry = state.bufferedRequest;
   if (stream._writev && entry && entry.next) {
      var l = state.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state.corkedRequestsFree;
      holder.entry = entry;
      var count = 0;
      while (entry) {
         buffer[count] = entry;
         entry = entry.next;
         count += 1;
      }
      doWrite(stream, state, true, state.length, buffer, "", holder.finish);
      state.pendingcb++;
      state.lastBufferedRequest = null;
      if (holder.next) {
         state.corkedRequestsFree = holder.next;
         holder.next = null;
      } else {
         state.corkedRequestsFree = new CorkedRequest(state);
      }
   } else {
      while (entry) {
         var chunk = entry.chunk;
         var encoding = entry.encoding;
         var cb = entry.callback;
         var len = state.objectMode ? 1 : chunk.length;
         doWrite(stream, state, false, len, chunk, encoding, cb);
         entry = entry.next;
         if (state.writing) {
            break;
         }
      }
      if (entry === null) state.lastBufferedRequest = null;
   }
   state.bufferedRequestCount = 0;
   state.bufferedRequest = entry;
   state.bufferProcessing = false;
}
Writable.prototype._write = function (chunk, encoding, cb) {
   cb(new Error("not implemented"));
};
Writable.prototype._writev = null;
Writable.prototype.end = function (chunk, encoding, cb) {
   var state = this._writableState;
   if (typeof chunk === "function") {
      cb = chunk;
      chunk = null;
      encoding = null;
   } else if (typeof encoding === "function") {
      cb = encoding;
      encoding = null;
   }
   if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
   if (state.corked) {
      state.corked = 1;
      this.uncork();
   }
   if (!state.ending && !state.finished) endWritable(this, state, cb);
};
function needFinish(state) {
   return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function prefinish(stream, state) {
   if (!state.prefinished) {
      state.prefinished = true;
      stream.emit("prefinish");
   }
}
function finishMaybe(stream, state) {
   var need = needFinish(state);
   if (need) {
      if (state.pendingcb === 0) {
         prefinish(stream, state);
         state.finished = true;
         stream.emit("finish");
      } else {
         prefinish(stream, state);
      }
   }
   return need;
}
function endWritable(stream, state, cb) {
   state.ending = true;
   finishMaybe(stream, state);
   if (cb) {
      if (state.finished) nextTick2(cb);
      else stream.once("finish", cb);
   }
   state.ended = true;
   stream.writable = false;
}
function CorkedRequest(state) {
   var _this = this;
   this.next = null;
   this.entry = null;
   this.finish = function (err2) {
      var entry = _this.entry;
      _this.entry = null;
      while (entry) {
         var cb = entry.callback;
         state.pendingcb--;
         cb(err2);
         entry = entry.next;
      }
      if (state.corkedRequestsFree) {
         state.corkedRequestsFree.next = _this;
      } else {
         state.corkedRequestsFree = _this;
      }
   };
}

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/duplex.js
inherits_default(Duplex, Readable);
var keys = Object.keys(Writable.prototype);
for (v2 = 0; v2 < keys.length; v2++) {
   method = keys[v2];
   if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}
var method;
var v2;
function Duplex(options) {
   if (!(this instanceof Duplex)) return new Duplex(options);
   Readable.call(this, options);
   Writable.call(this, options);
   if (options && options.readable === false) this.readable = false;
   if (options && options.writable === false) this.writable = false;
   this.allowHalfOpen = true;
   if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
   this.once("end", onend);
}
function onend() {
   if (this.allowHalfOpen || this._writableState.ended) return;
   nextTick2(onEndNT, this);
}
function onEndNT(self2) {
   self2.end();
}

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/transform.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
inherits_default(Transform, Duplex);
function TransformState(stream) {
   this.afterTransform = function (er, data) {
      return afterTransform(stream, er, data);
   };
   this.needTransform = false;
   this.transforming = false;
   this.writecb = null;
   this.writechunk = null;
   this.writeencoding = null;
}
function afterTransform(stream, er, data) {
   var ts2 = stream._transformState;
   ts2.transforming = false;
   var cb = ts2.writecb;
   if (!cb) return stream.emit("error", new Error("no writecb in Transform class"));
   ts2.writechunk = null;
   ts2.writecb = null;
   if (data !== null && data !== void 0) stream.push(data);
   cb(er);
   var rs = stream._readableState;
   rs.reading = false;
   if (rs.needReadable || rs.length < rs.highWaterMark) {
      stream._read(rs.highWaterMark);
   }
}
function Transform(options) {
   if (!(this instanceof Transform)) return new Transform(options);
   Duplex.call(this, options);
   this._transformState = new TransformState(this);
   var stream = this;
   this._readableState.needReadable = true;
   this._readableState.sync = false;
   if (options) {
      if (typeof options.transform === "function") this._transform = options.transform;
      if (typeof options.flush === "function") this._flush = options.flush;
   }
   this.once("prefinish", function () {
      if (typeof this._flush === "function")
         this._flush(function (er) {
            done(stream, er);
         });
      else done(stream);
   });
}
Transform.prototype.push = function (chunk, encoding) {
   this._transformState.needTransform = false;
   return Duplex.prototype.push.call(this, chunk, encoding);
};
Transform.prototype._transform = function (chunk, encoding, cb) {
   throw new Error("Not implemented");
};
Transform.prototype._write = function (chunk, encoding, cb) {
   var ts2 = this._transformState;
   ts2.writecb = cb;
   ts2.writechunk = chunk;
   ts2.writeencoding = encoding;
   if (!ts2.transforming) {
      var rs = this._readableState;
      if (ts2.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
   }
};
Transform.prototype._read = function (n) {
   var ts2 = this._transformState;
   if (ts2.writechunk !== null && ts2.writecb && !ts2.transforming) {
      ts2.transforming = true;
      this._transform(ts2.writechunk, ts2.writeencoding, ts2.afterTransform);
   } else {
      ts2.needTransform = true;
   }
};
function done(stream, er) {
   if (er) return stream.emit("error", er);
   var ws = stream._writableState;
   var ts2 = stream._transformState;
   if (ws.length) throw new Error("Calling transform done when ws.length != 0");
   if (ts2.transforming) throw new Error("Calling transform done when still transforming");
   return stream.push(null);
}

// ../../node_modules/rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
inherits_default(PassThrough, Transform);
function PassThrough(options) {
   if (!(this instanceof PassThrough)) return new PassThrough(options);
   Transform.call(this, options);
}
PassThrough.prototype._transform = function (chunk, encoding, cb) {
   cb(null, chunk);
};

// node-modules-polyfills:stream
inherits_default(Stream, events_default);
Stream.Readable = Readable;
Stream.Writable = Writable;
Stream.Duplex = Duplex;
Stream.Transform = Transform;
Stream.PassThrough = PassThrough;
Stream.Stream = Stream;
var stream_default = Stream;
function Stream() {
   events_default.call(this);
}
Stream.prototype.pipe = function (dest, options) {
   var source = this;
   function ondata(chunk) {
      if (dest.writable) {
         if (false === dest.write(chunk) && source.pause) {
            source.pause();
         }
      }
   }
   source.on("data", ondata);
   function ondrain() {
      if (source.readable && source.resume) {
         source.resume();
      }
   }
   dest.on("drain", ondrain);
   if (!dest._isStdio && (!options || options.end !== false)) {
      source.on("end", onend2);
      source.on("close", onclose);
   }
   var didOnEnd = false;
   function onend2() {
      if (didOnEnd) return;
      didOnEnd = true;
      dest.end();
   }
   function onclose() {
      if (didOnEnd) return;
      didOnEnd = true;
      if (typeof dest.destroy === "function") dest.destroy();
   }
   function onerror(er) {
      cleanup();
      if (events_default.listenerCount(this, "error") === 0) {
         throw er;
      }
   }
   source.on("error", onerror);
   dest.on("error", onerror);
   function cleanup() {
      source.removeListener("data", ondata);
      dest.removeListener("drain", ondrain);
      source.removeListener("end", onend2);
      source.removeListener("close", onclose);
      source.removeListener("error", onerror);
      dest.removeListener("error", onerror);
      source.removeListener("end", cleanup);
      source.removeListener("close", cleanup);
      dest.removeListener("close", cleanup);
   }
   source.on("end", cleanup);
   source.on("close", cleanup);
   dest.on("close", cleanup);
   dest.emit("pipe", source);
   return dest;
};

// ../../node_modules/@prisma/pg-worker/dist/index.mjs
var bs = Object.create;
var pe = Object.defineProperty;
var Es = Object.getOwnPropertyDescriptor;
var Cs = Object.getOwnPropertyNames;
var xs = Object.getPrototypeOf;
var As = Object.prototype.hasOwnProperty;
var q = (r, e) => () => (r && (e = r((r = 0))), e);
var v = (r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports);
var De = (r, e) => {
   for (var t in e) pe(r, t, { get: e[t], enumerable: true });
};
var de = (r, e, t, s) => {
   if ((e && typeof e == "object") || typeof e == "function")
      for (let n of Cs(e)) !As.call(r, n) && n !== t && pe(r, n, { get: () => e[n], enumerable: !(s = Es(e, n)) || s.enumerable });
   return r;
};
var _ = (r, e, t) => (de(r, e, "default"), t && de(t, e, "default"));
var Le = (r, e, t) => (
   (t = r != null ? bs(xs(r)) : {}), de(e || !r || !r.__esModule ? pe(t, "default", { value: r, enumerable: true }) : t, r)
);
var T = r => de(pe({}, "__esModule", { value: true }), r);
var f;
var o = q(() => {
   "use strict";
   f = {
      nextTick: (r, ...e) => {
         setTimeout(() => {
            r(...e);
         }, 0);
      },
      env: {},
      version: "",
      cwd: () => "/",
      stderr: {},
      argv: ["/bin/node"],
   };
});
var m;
var u = q(() => {
   "use strict";
   m =
      globalThis.performance ??
      (() => {
         let r = Date.now();
         return { now: () => Date.now() - r };
      })();
});
var c = q(() => {
   "use strict";
});
var k = {};
var V = q(() => {
   "use strict";
   o();
   u();
   c();
   _(k, events_exports);
});
var qe = v(Nt => {
   "use strict";
   o();
   u();
   c();
   Nt.parse = function (r, e) {
      return new Oe(r, e).parse();
   };
   var Oe = class r {
      constructor(e, t) {
         (this.source = e),
            (this.transform = t || Ps),
            (this.position = 0),
            (this.entries = []),
            (this.recorded = []),
            (this.dimension = 0);
      }
      isEof() {
         return this.position >= this.source.length;
      }
      nextCharacter() {
         var e = this.source[this.position++];
         return e === "\\" ? { value: this.source[this.position++], escaped: true } : { value: e, escaped: false };
      }
      record(e) {
         this.recorded.push(e);
      }
      newEntry(e) {
         var t;
         (this.recorded.length > 0 || e) &&
            ((t = this.recorded.join("")),
            t === "NULL" && !e && (t = null),
            t !== null && (t = this.transform(t)),
            this.entries.push(t),
            (this.recorded = []));
      }
      consumeDimensions() {
         if (this.source[0] === "[")
            for (; !this.isEof(); ) {
               var e = this.nextCharacter();
               if (e.value === "=") break;
            }
      }
      parse(e) {
         var t, s, n;
         for (this.consumeDimensions(); !this.isEof(); )
            if (((t = this.nextCharacter()), t.value === "{" && !n))
               this.dimension++,
                  this.dimension > 1 &&
                     ((s = new r(this.source.substr(this.position - 1), this.transform)),
                     this.entries.push(s.parse(true)),
                     (this.position += s.position - 2));
            else if (t.value === "}" && !n) {
               if ((this.dimension--, !this.dimension && (this.newEntry(), e))) return this.entries;
            } else
               t.value === '"' && !t.escaped
                  ? (n && this.newEntry(true), (n = !n))
                  : t.value === "," && !n
                    ? this.newEntry()
                    : this.record(t.value);
         if (this.dimension !== 0) throw new Error("array dimension not balanced");
         return this.entries;
      }
   };
   function Ps(r) {
      return r;
   }
});
var Fe = v((La, Ut) => {
   "use strict";
   o();
   u();
   c();
   var Ts = qe();
   Ut.exports = {
      create: function (r, e) {
         return {
            parse: function () {
               return Ts.parse(r, e);
            },
         };
      },
   };
});
var Ht = v((Ba, Gt) => {
   "use strict";
   o();
   u();
   c();
   var Ms = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/,
      Rs = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/,
      Is = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/,
      ks = /^-?infinity$/;
   Gt.exports = function (e) {
      if (ks.test(e)) return Number(e.replace("i", "I"));
      var t = Ms.exec(e);
      if (!t) return Ds(e) || null;
      var s = !!t[8],
         n = parseInt(t[1], 10);
      s && (n = jt(n));
      var i = parseInt(t[2], 10) - 1,
         a = t[3],
         l = parseInt(t[4], 10),
         p = parseInt(t[5], 10),
         d = parseInt(t[6], 10),
         w = t[7];
      w = w ? 1e3 * parseFloat(w) : 0;
      var S,
         b = Ls(e);
      return (
         b != null
            ? ((S = new Date(Date.UTC(n, i, a, l, p, d, w))), Be(n) && S.setUTCFullYear(n), b !== 0 && S.setTime(S.getTime() - b))
            : ((S = new Date(n, i, a, l, p, d, w)), Be(n) && S.setFullYear(n)),
         S
      );
   };
   function Ds(r) {
      var e = Rs.exec(r);
      if (e) {
         var t = parseInt(e[1], 10),
            s = !!e[4];
         s && (t = jt(t));
         var n = parseInt(e[2], 10) - 1,
            i = e[3],
            a = new Date(t, n, i);
         return Be(t) && a.setFullYear(t), a;
      }
   }
   function Ls(r) {
      if (r.endsWith("+00")) return 0;
      var e = Is.exec(r.split(" ")[1]);
      if (e) {
         var t = e[1];
         if (t === "Z") return 0;
         var s = t === "-" ? -1 : 1,
            n = parseInt(e[2], 10) * 3600 + parseInt(e[3] || 0, 10) * 60 + parseInt(e[4] || 0, 10);
         return n * s * 1e3;
      }
   }
   function jt(r) {
      return -(r - 1);
   }
   function Be(r) {
      return r >= 0 && r < 100;
   }
});
var Kt = v((ja, Wt) => {
   "use strict";
   o();
   u();
   c();
   Wt.exports = qs;
   var Os = Object.prototype.hasOwnProperty;
   function qs(r) {
      for (var e = 1; e < arguments.length; e++) {
         var t = arguments[e];
         for (var s in t) Os.call(t, s) && (r[s] = t[s]);
      }
      return r;
   }
});
var Yt = v((Ka, zt) => {
   "use strict";
   o();
   u();
   c();
   var Fs = Kt();
   zt.exports = z2;
   function z2(r) {
      if (!(this instanceof z2)) return new z2(r);
      Fs(this, Ys(r));
   }
   var Bs = ["seconds", "minutes", "hours", "days", "months", "years"];
   z2.prototype.toPostgres = function () {
      var r = Bs.filter(this.hasOwnProperty, this);
      return (
         this.milliseconds && r.indexOf("seconds") < 0 && r.push("seconds"),
         r.length === 0
            ? "0"
            : r
                 .map(function (e) {
                    var t = this[e] || 0;
                    return (
                       e === "seconds" && this.milliseconds && (t = (t + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "")),
                       t + " " + e
                    );
                 }, this)
                 .join(" ")
      );
   };
   var Qs = { years: "Y", months: "M", days: "D", hours: "H", minutes: "M", seconds: "S" },
      Ns = ["years", "months", "days"],
      Us = ["hours", "minutes", "seconds"];
   z2.prototype.toISOString = z2.prototype.toISO = function () {
      var r = Ns.map(t, this).join(""),
         e = Us.map(t, this).join("");
      return "P" + r + "T" + e;
      function t(s) {
         var n = this[s] || 0;
         return s === "seconds" && this.milliseconds && (n = (n + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "")), n + Qs[s];
      }
   };
   var Qe = "([+-]?\\d+)",
      js = Qe + "\\s+years?",
      Gs = Qe + "\\s+mons?",
      Hs = Qe + "\\s+days?",
      Ws = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?",
      Ks = new RegExp(
         [js, Gs, Hs, Ws]
            .map(function (r) {
               return "(" + r + ")?";
            })
            .join("\\s*"),
      ),
      Vt = { years: 2, months: 4, days: 6, hours: 9, minutes: 10, seconds: 11, milliseconds: 12 },
      Vs = ["hours", "minutes", "seconds", "milliseconds"];
   function zs(r) {
      var e = r + "000000".slice(r.length);
      return parseInt(e, 10) / 1e3;
   }
   function Ys(r) {
      if (!r) return {};
      var e = Ks.exec(r),
         t = e[8] === "-";
      return Object.keys(Vt).reduce(function (s, n) {
         var i = Vt[n],
            a = e[i];
         return !a || ((a = n === "milliseconds" ? zs(a) : parseInt(a, 10)), !a) || (t && ~Vs.indexOf(n) && (a *= -1), (s[n] = a)), s;
      }, {});
   }
});
var Jt = v(($a, $t) => {
   "use strict";
   o();
   u();
   c();
   $t.exports = function (e) {
      if (/^\\x/.test(e)) return new Buffer3(e.substr(2), "hex");
      for (var t = "", s = 0; s < e.length; )
         if (e[s] !== "\\") (t += e[s]), ++s;
         else if (/[0-7]{3}/.test(e.substr(s + 1, 3))) (t += String.fromCharCode(parseInt(e.substr(s + 1, 3), 8))), (s += 4);
         else {
            for (var n = 1; s + n < e.length && e[s + n] === "\\"; ) n++;
            for (var i = 0; i < Math.floor(n / 2); ++i) t += "\\";
            s += Math.floor(n / 2) * 2;
         }
      return new Buffer3(t, "binary");
   };
});
var nr = v((eo, sr) => {
   "use strict";
   o();
   u();
   c();
   var re = qe(),
      se = Fe(),
      me = Ht(),
      Xt = Yt(),
      er = Jt();
   function ye(r) {
      return function (t) {
         return t === null ? t : r(t);
      };
   }
   function tr(r) {
      return r === null ? r : r === "TRUE" || r === "t" || r === "true" || r === "y" || r === "yes" || r === "on" || r === "1";
   }
   function $s(r) {
      return r ? re.parse(r, tr) : null;
   }
   function Js(r) {
      return parseInt(r, 10);
   }
   function Ne(r) {
      return r ? re.parse(r, ye(Js)) : null;
   }
   function Zs(r) {
      return r
         ? re.parse(
              r,
              ye(function (e) {
                 return rr(e).trim();
              }),
           )
         : null;
   }
   var Xs = function (r) {
         if (!r) return null;
         var e = se.create(r, function (t) {
            return t !== null && (t = He(t)), t;
         });
         return e.parse();
      },
      Ue = function (r) {
         if (!r) return null;
         var e = se.create(r, function (t) {
            return t !== null && (t = parseFloat(t)), t;
         });
         return e.parse();
      },
      L = function (r) {
         if (!r) return null;
         var e = se.create(r);
         return e.parse();
      },
      je = function (r) {
         if (!r) return null;
         var e = se.create(r, function (t) {
            return t !== null && (t = me(t)), t;
         });
         return e.parse();
      },
      en = function (r) {
         if (!r) return null;
         var e = se.create(r, function (t) {
            return t !== null && (t = Xt(t)), t;
         });
         return e.parse();
      },
      tn = function (r) {
         return r ? re.parse(r, ye(er)) : null;
      },
      Ge = function (r) {
         return parseInt(r, 10);
      },
      rr = function (r) {
         var e = String(r);
         return /^\d+$/.test(e) ? e : r;
      },
      Zt = function (r) {
         return r ? re.parse(r, ye(JSON.parse)) : null;
      },
      He = function (r) {
         return r[0] !== "(" ? null : ((r = r.substring(1, r.length - 1).split(",")), { x: parseFloat(r[0]), y: parseFloat(r[1]) });
      },
      rn = function (r) {
         if (r[0] !== "<" && r[1] !== "(") return null;
         for (var e = "(", t = "", s = false, n = 2; n < r.length - 1; n++) {
            if ((s || (e += r[n]), r[n] === ")")) {
               s = true;
               continue;
            } else if (!s) continue;
            r[n] !== "," && (t += r[n]);
         }
         var i = He(e);
         return (i.radius = parseFloat(t)), i;
      },
      sn = function (r) {
         r(20, rr),
            r(21, Ge),
            r(23, Ge),
            r(26, Ge),
            r(700, parseFloat),
            r(701, parseFloat),
            r(16, tr),
            r(1082, me),
            r(1114, me),
            r(1184, me),
            r(600, He),
            r(651, L),
            r(718, rn),
            r(1e3, $s),
            r(1001, tn),
            r(1005, Ne),
            r(1007, Ne),
            r(1028, Ne),
            r(1016, Zs),
            r(1017, Xs),
            r(1021, Ue),
            r(1022, Ue),
            r(1231, Ue),
            r(1014, L),
            r(1015, L),
            r(1008, L),
            r(1009, L),
            r(1040, L),
            r(1041, L),
            r(1115, je),
            r(1182, je),
            r(1185, je),
            r(1186, Xt),
            r(1187, en),
            r(17, er),
            r(114, JSON.parse.bind(JSON)),
            r(3802, JSON.parse.bind(JSON)),
            r(199, Zt),
            r(3807, Zt),
            r(3907, L),
            r(2951, L),
            r(791, L),
            r(1183, L),
            r(1270, L);
      };
   sr.exports = { init: sn };
});
var ar = v((no, ir) => {
   "use strict";
   o();
   u();
   c();
   var R = 1e6;
   function nn(r) {
      var e = r.readInt32BE(0),
         t = r.readUInt32BE(4),
         s = "";
      e < 0 && ((e = ~e + (t === 0)), (t = (~t + 1) >>> 0), (s = "-"));
      var n = "",
         i,
         a,
         l,
         p,
         d,
         w;
      {
         if (
            ((i = e % R),
            (e = (e / R) >>> 0),
            (a = 4294967296 * i + t),
            (t = (a / R) >>> 0),
            (l = "" + (a - R * t)),
            t === 0 && e === 0)
         )
            return s + l + n;
         for (p = "", d = 6 - l.length, w = 0; w < d; w++) p += "0";
         n = p + l + n;
      }
      {
         if (
            ((i = e % R),
            (e = (e / R) >>> 0),
            (a = 4294967296 * i + t),
            (t = (a / R) >>> 0),
            (l = "" + (a - R * t)),
            t === 0 && e === 0)
         )
            return s + l + n;
         for (p = "", d = 6 - l.length, w = 0; w < d; w++) p += "0";
         n = p + l + n;
      }
      {
         if (
            ((i = e % R),
            (e = (e / R) >>> 0),
            (a = 4294967296 * i + t),
            (t = (a / R) >>> 0),
            (l = "" + (a - R * t)),
            t === 0 && e === 0)
         )
            return s + l + n;
         for (p = "", d = 6 - l.length, w = 0; w < d; w++) p += "0";
         n = p + l + n;
      }
      return (i = e % R), (a = 4294967296 * i + t), (l = "" + (a % R)), s + l + n;
   }
   ir.exports = nn;
});
var lr = v((uo, hr) => {
   "use strict";
   o();
   u();
   c();
   var an = ar(),
      E = function (r, e, t, s, n) {
         (t = t || 0),
            (s = s || false),
            (n =
               n ||
               function (I, Ie, ke) {
                  return I * Math.pow(2, ke) + Ie;
               });
         var i = t >> 3,
            a = function (I) {
               return s ? ~I & 255 : I;
            },
            l = 255,
            p = 8 - (t % 8);
         e < p && ((l = (255 << (8 - e)) & 255), (p = e)), t && (l = l >> t % 8);
         var d = 0;
         (t % 8) + e >= 8 && (d = n(0, a(r[i]) & l, p));
         for (var w = (e + t) >> 3, S = i + 1; S < w; S++) d = n(d, a(r[S]), 8);
         var b = (e + t) % 8;
         return b > 0 && (d = n(d, a(r[w]) >> (8 - b), b)), d;
      },
      cr = function (r, e, t) {
         var s = Math.pow(2, t - 1) - 1,
            n = E(r, 1),
            i = E(r, t, 1);
         if (i === 0) return 0;
         var a = 1,
            l = function (d, w, S) {
               d === 0 && (d = 1);
               for (var b = 1; b <= S; b++) (a /= 2), (w & (1 << (S - b))) > 0 && (d += a);
               return d;
            },
            p = E(r, e, t + 1, false, l);
         return i == Math.pow(2, t + 1) - 1
            ? p === 0
               ? n === 0
                  ? 1 / 0
                  : -1 / 0
               : NaN
            : (n === 0 ? 1 : -1) * Math.pow(2, i - s) * p;
      },
      on3 = function (r) {
         return E(r, 1) == 1 ? -1 * (E(r, 15, 1, true) + 1) : E(r, 15, 1);
      },
      or = function (r) {
         return E(r, 1) == 1 ? -1 * (E(r, 31, 1, true) + 1) : E(r, 31, 1);
      },
      un = function (r) {
         return cr(r, 23, 8);
      },
      cn = function (r) {
         return cr(r, 52, 11);
      },
      hn = function (r) {
         var e = E(r, 16, 32);
         if (e == 49152) return NaN;
         for (var t = Math.pow(1e4, E(r, 16, 16)), s = 0, n = [], i = E(r, 16), a = 0; a < i; a++)
            (s += E(r, 16, 64 + 16 * a) * t), (t /= 1e4);
         var l = Math.pow(10, E(r, 16, 48));
         return ((e === 0 ? 1 : -1) * Math.round(s * l)) / l;
      },
      ur = function (r, e) {
         var t = E(e, 1),
            s = E(e, 63, 1),
            n = new Date(((t === 0 ? 1 : -1) * s) / 1e3 + 9466848e5);
         return (
            r || n.setTime(n.getTime() + n.getTimezoneOffset() * 6e4),
            (n.usec = s % 1e3),
            (n.getMicroSeconds = function () {
               return this.usec;
            }),
            (n.setMicroSeconds = function (i) {
               this.usec = i;
            }),
            (n.getUTCMicroSeconds = function () {
               return this.usec;
            }),
            n
         );
      },
      ne = function (r) {
         for (var e = E(r, 32), t = E(r, 32, 32), s = E(r, 32, 64), n = 96, i = [], a = 0; a < e; a++)
            (i[a] = E(r, 32, n)), (n += 32), (n += 32);
         var l = function (d) {
               var w = E(r, 32, n);
               if (((n += 32), w == 4294967295)) return null;
               var S;
               if (d == 23 || d == 20) return (S = E(r, w * 8, n)), (n += w * 8), S;
               if (d == 25) return (S = r.toString(this.encoding, n >> 3, (n += w << 3) >> 3)), S;
               console.log("ERROR: ElementType not implemented: " + d);
            },
            p = function (d, w) {
               var S = [],
                  b;
               if (d.length > 1) {
                  var I = d.shift();
                  for (b = 0; b < I; b++) S[b] = p(d, w);
                  d.unshift(I);
               } else for (b = 0; b < d[0]; b++) S[b] = l(w);
               return S;
            };
         return p(i, s);
      },
      ln = function (r) {
         return r.toString("utf8");
      },
      fn = function (r) {
         return r === null ? null : E(r, 8) > 0;
      },
      dn = function (r) {
         r(20, an),
            r(21, on3),
            r(23, or),
            r(26, or),
            r(1700, hn),
            r(700, un),
            r(701, cn),
            r(16, fn),
            r(1114, ur.bind(null, false)),
            r(1184, ur.bind(null, true)),
            r(1e3, ne),
            r(1007, ne),
            r(1016, ne),
            r(1008, ne),
            r(1009, ne),
            r(25, ln);
      };
   hr.exports = { init: dn };
});
var dr = v((fo, fr) => {
   "use strict";
   o();
   u();
   c();
   fr.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096,
   };
});
var oe = v(ae => {
   "use strict";
   o();
   u();
   c();
   var pn = nr(),
      mn = lr(),
      yn = Fe(),
      gn = dr();
   ae.getTypeParser = _n;
   ae.setTypeParser = wn;
   ae.arrayParser = yn;
   ae.builtins = gn;
   var ie = { text: {}, binary: {} };
   function pr(r) {
      return String(r);
   }
   function _n(r, e) {
      return (e = e || "text"), (ie[e] && ie[e][r]) || pr;
   }
   function wn(r, e, t) {
      typeof e == "function" && ((t = e), (e = "text")), (ie[e][r] = t);
   }
   pn.init(function (r, e) {
      ie.text[r] = e;
   });
   mn.init(function (r, e) {
      ie.binary[r] = e;
   });
});
var ue = v((So, We) => {
   "use strict";
   o();
   u();
   c();
   We.exports = {
      host: "localhost",
      user: f.platform === "win32" ? f.env.USERNAME : f.env.USER,
      database: void 0,
      password: null,
      connectionString: void 0,
      port: 5432,
      rows: 0,
      binary: false,
      max: 10,
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      statement_timeout: false,
      lock_timeout: false,
      idle_in_transaction_session_timeout: false,
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0,
   };
   var Y = oe(),
      vn = Y.getTypeParser(20, "text"),
      Sn = Y.getTypeParser(1016, "text");
   We.exports.__defineSetter__("parseInt8", function (r) {
      Y.setTypeParser(20, "text", r ? Y.getTypeParser(23, "text") : vn),
         Y.setTypeParser(1016, "text", r ? Y.getTypeParser(1007, "text") : Sn);
   });
});
var _e = v((xo, yr) => {
   "use strict";
   o();
   u();
   c();
   var bn = ue();
   function En(r) {
      var e = r.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + e + '"';
   }
   function mr(r) {
      for (var e = "{", t = 0; t < r.length; t++)
         if ((t > 0 && (e = e + ","), r[t] === null || typeof r[t] > "u")) e = e + "NULL";
         else if (Array.isArray(r[t])) e = e + mr(r[t]);
         else if (ArrayBuffer.isView(r[t])) {
            var s = r[t];
            if (!(s instanceof Buffer3)) {
               var n = Buffer3.from(s.buffer, s.byteOffset, s.byteLength);
               n.length === s.byteLength ? (s = n) : (s = n.slice(s.byteOffset, s.byteOffset + s.byteLength));
            }
            e += "\\\\x" + s.toString("hex");
         } else e += En(ge(r[t]));
      return (e = e + "}"), e;
   }
   var ge = function (r, e) {
      if (r == null) return null;
      if (r instanceof Buffer3) return r;
      if (ArrayBuffer.isView(r)) {
         var t = Buffer3.from(r.buffer, r.byteOffset, r.byteLength);
         return t.length === r.byteLength ? t : t.slice(r.byteOffset, r.byteOffset + r.byteLength);
      }
      return r instanceof Date
         ? bn.parseInputDatesAsUTC
            ? An(r)
            : xn(r)
         : Array.isArray(r)
           ? mr(r)
           : typeof r == "object"
             ? Cn(r, e)
             : r.toString();
   };
   function Cn(r, e) {
      if (r && typeof r.toPostgres == "function") {
         if (((e = e || []), e.indexOf(r) !== -1))
            throw new Error('circular reference detected while preparing "' + r + '" for query');
         return e.push(r), ge(r.toPostgres(ge), e);
      }
      return JSON.stringify(r);
   }
   function P(r, e) {
      for (r = "" + r; r.length < e; ) r = "0" + r;
      return r;
   }
   function xn(r) {
      var e = -r.getTimezoneOffset(),
         t = r.getFullYear(),
         s = t < 1;
      s && (t = Math.abs(t) + 1);
      var n =
         P(t, 4) +
         "-" +
         P(r.getMonth() + 1, 2) +
         "-" +
         P(r.getDate(), 2) +
         "T" +
         P(r.getHours(), 2) +
         ":" +
         P(r.getMinutes(), 2) +
         ":" +
         P(r.getSeconds(), 2) +
         "." +
         P(r.getMilliseconds(), 3);
      return e < 0 ? ((n += "-"), (e *= -1)) : (n += "+"), (n += P(Math.floor(e / 60), 2) + ":" + P(e % 60, 2)), s && (n += " BC"), n;
   }
   function An(r) {
      var e = r.getUTCFullYear(),
         t = e < 1;
      t && (e = Math.abs(e) + 1);
      var s =
         P(e, 4) +
         "-" +
         P(r.getUTCMonth() + 1, 2) +
         "-" +
         P(r.getUTCDate(), 2) +
         "T" +
         P(r.getUTCHours(), 2) +
         ":" +
         P(r.getUTCMinutes(), 2) +
         ":" +
         P(r.getUTCSeconds(), 2) +
         "." +
         P(r.getUTCMilliseconds(), 3);
      return (s += "+00:00"), t && (s += " BC"), s;
   }
   function Pn(r, e, t) {
      return (
         (r = typeof r == "string" ? { text: r } : r),
         e && (typeof e == "function" ? (r.callback = e) : (r.values = e)),
         t && (r.callback = t),
         r
      );
   }
   var Tn = function (r) {
         return '"' + r.replace(/"/g, '""') + '"';
      },
      Mn = function (r) {
         for (var e = false, t = "'", s = 0; s < r.length; s++) {
            var n = r[s];
            n === "'" ? (t += n + n) : n === "\\" ? ((t += n + n), (e = true)) : (t += n);
         }
         return (t += "'"), e === true && (t = " E" + t), t;
      };
   yr.exports = {
      prepareValue: function (e) {
         return ge(e);
      },
      normalizeQueryConfig: Pn,
      escapeIdentifier: Tn,
      escapeLiteral: Mn,
   };
});
var B = {};
var Ke = q(() => {
   "use strict";
   o();
   u();
   c();
   _(B, crypto_exports);
});
var _r = v((Do, gr) => {
   "use strict";
   o();
   u();
   c();
   var ce = (Ke(), T(B));
   function Ve(r) {
      return ce.createHash("md5").update(r, "utf-8").digest("hex");
   }
   function Rn(r, e, t) {
      var s = Ve(e + r),
         n = Ve(Buffer3.concat([Buffer3.from(s), t]));
      return "md5" + n;
   }
   function In(r) {
      return ce.createHash("sha256").update(r).digest();
   }
   function kn(r, e) {
      return ce.createHmac("sha256", r).update(e).digest();
   }
   async function Dn(r, e, t) {
      return ce.pbkdf2Sync(r, e, t, 32, "sha256");
   }
   gr.exports = { postgresMd5PasswordHash: Rn, randomBytes: ce.randomBytes, deriveKey: Dn, sha256: In, hmacSha256: kn, md5: Ve };
});
var br = v((Fo, Sr) => {
   "use strict";
   o();
   u();
   c();
   var wr = (Ke(), T(B));
   Sr.exports = { postgresMd5PasswordHash: On, randomBytes: Ln, deriveKey: Bn, sha256: qn, hmacSha256: Fn, md5: ze };
   var vr = wr.webcrypto || globalThis.crypto,
      $ = vr.subtle,
      Ye = new TextEncoder();
   function Ln(r) {
      return vr.getRandomValues(Buffer3.alloc(r));
   }
   async function ze(r) {
      try {
         return wr.createHash("md5").update(r, "utf-8").digest("hex");
      } catch {
         let t = typeof r == "string" ? Ye.encode(r) : r,
            s = await $.digest("MD5", t);
         return Array.from(new Uint8Array(s))
            .map(n => n.toString(16).padStart(2, "0"))
            .join("");
      }
   }
   async function On(r, e, t) {
      var s = await ze(e + r),
         n = await ze(Buffer3.concat([Buffer3.from(s), t]));
      return "md5" + n;
   }
   async function qn(r) {
      return await $.digest("SHA-256", r);
   }
   async function Fn(r, e) {
      let t = await $.importKey("raw", r, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await $.sign("HMAC", t, Ye.encode(e));
   }
   async function Bn(r, e, t) {
      let s = await $.importKey("raw", Ye.encode(r), "PBKDF2", false, ["deriveBits"]),
         n = { name: "PBKDF2", hash: "SHA-256", salt: e, iterations: t };
      return await $.deriveBits(n, s, 32 * 8, ["deriveBits"]);
   }
});
var Je = v((Uo, $e) => {
   "use strict";
   o();
   u();
   c();
   var Qn = parseInt(f.versions && f.versions.node && f.versions.node.split(".")[0]) < 15;
   Qn ? ($e.exports = _r()) : ($e.exports = br());
});
var Ar = v((Wo, xr) => {
   "use strict";
   o();
   u();
   c();
   var K = Je();
   function Nn(r) {
      if (r.indexOf("SCRAM-SHA-256") === -1) throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
      let e = K.randomBytes(18).toString("base64");
      return { mechanism: "SCRAM-SHA-256", clientNonce: e, response: "n,,n=*,r=" + e, message: "SASLInitialResponse" };
   }
   async function Un(r, e, t) {
      if (r.message !== "SASLInitialResponse") throw new Error("SASL: Last message was not SASLInitialResponse");
      if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      if (e === "") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      if (typeof t != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      let s = Hn(t);
      if (s.nonce.startsWith(r.clientNonce)) {
         if (s.nonce.length === r.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      var n = "n=*,r=" + r.clientNonce,
         i = "r=" + s.nonce + ",s=" + s.salt + ",i=" + s.iteration,
         a = "c=biws,r=" + s.nonce,
         l = n + "," + i + "," + a,
         p = Buffer3.from(s.salt, "base64"),
         d = await K.deriveKey(e, p, s.iteration),
         w = await K.hmacSha256(d, "Client Key"),
         S = await K.sha256(w),
         b = await K.hmacSha256(S, l),
         I = Kn(Buffer3.from(w), Buffer3.from(b)).toString("base64"),
         Ie = await K.hmacSha256(d, "Server Key"),
         ke = await K.hmacSha256(Ie, l);
      (r.message = "SASLResponse"), (r.serverSignature = Buffer3.from(ke).toString("base64")), (r.response = a + ",p=" + I);
   }
   function jn(r, e) {
      if (r.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
      if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      let { serverSignature: t } = Wn(e);
      if (t !== r.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
   }
   function Gn(r) {
      if (typeof r != "string") throw new TypeError("SASL: text must be a string");
      return r
         .split("")
         .map((e, t) => r.charCodeAt(t))
         .every(e => (e >= 33 && e <= 43) || (e >= 45 && e <= 126));
   }
   function Er(r) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(r);
   }
   function Cr(r) {
      if (typeof r != "string") throw new TypeError("SASL: attribute pairs text must be a string");
      return new Map(
         r.split(",").map(e => {
            if (!/^.=/.test(e)) throw new Error("SASL: Invalid attribute pair entry");
            let t = e[0],
               s = e.substring(2);
            return [t, s];
         }),
      );
   }
   function Hn(r) {
      let e = Cr(r),
         t = e.get("r");
      if (t) {
         if (!Gn(t)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      let s = e.get("s");
      if (s) {
         if (!Er(s)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      let n = e.get("i");
      if (n) {
         if (!/^[1-9][0-9]*$/.test(n)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      let i = parseInt(n, 10);
      return { nonce: t, salt: s, iteration: i };
   }
   function Wn(r) {
      let t = Cr(r).get("v");
      if (t) {
         if (!Er(t)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      } else throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      return { serverSignature: t };
   }
   function Kn(r, e) {
      if (!Buffer3.isBuffer(r)) throw new TypeError("first argument must be a Buffer");
      if (!Buffer3.isBuffer(e)) throw new TypeError("second argument must be a Buffer");
      if (r.length !== e.length) throw new Error("Buffer lengths must match");
      if (r.length === 0) throw new Error("Buffers cannot be empty");
      return Buffer3.from(r.map((t, s) => r[s] ^ e[s]));
   }
   xr.exports = { startSession: Nn, continueSession: Un, finalizeSession: jn };
});
var Tr = v((Yo, Pr) => {
   "use strict";
   o();
   u();
   c();
   var Vn = oe();
   function we(r) {
      (this._types = r || Vn), (this.text = {}), (this.binary = {});
   }
   we.prototype.getOverrides = function (r) {
      switch (r) {
         case "text":
            return this.text;
         case "binary":
            return this.binary;
         default:
            return {};
      }
   };
   we.prototype.setTypeParser = function (r, e, t) {
      typeof e == "function" && ((t = e), (e = "text")), (this.getOverrides(e)[r] = t);
   };
   we.prototype.getTypeParser = function (r, e) {
      return (e = e || "text"), this.getOverrides(e)[r] || this._types.getTypeParser(r, e);
   };
   Pr.exports = we;
});
var Mr = v(() => {
   "use strict";
   o();
   u();
   c();
});
var Ze = {};
De(Ze, { default: () => Yn, existsSync: () => Rr, promises: () => Ir });
function Rr() {
   return false;
}
var Ir;
var zn;
var Yn;
var Xe = q(() => {
   "use strict";
   o();
   u();
   c();
   (Ir = {}), (zn = { existsSync: Rr, promises: Ir }), (Yn = zn);
});
var Dr = v((ou, kr) => {
   "use strict";
   o();
   u();
   c();
   function et(r) {
      if (r.charAt(0) === "/") {
         let l = r.split(" ");
         return { host: l[0], database: l[1] };
      }
      let e = {},
         t,
         s = false;
      / |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(r) && (r = encodeURI(r).replace(/\%25(\d\d)/g, "%$1"));
      try {
         t = new URL(r, "postgres://base");
      } catch {
         (t = new URL(r.replace("@/", "@___DUMMY___/"), "postgres://base")), (s = true);
      }
      for (let l of t.searchParams.entries()) e[l[0]] = l[1];
      if (
         ((e.user = e.user || decodeURIComponent(t.username)),
         (e.password = e.password || decodeURIComponent(t.password)),
         t.protocol == "socket:")
      )
         return (
            (e.host = decodeURI(t.pathname)),
            (e.database = t.searchParams.get("db")),
            (e.client_encoding = t.searchParams.get("encoding")),
            e
         );
      let n = s ? "" : t.hostname;
      e.host ? n && /^%2f/i.test(n) && (t.pathname = n + t.pathname) : (e.host = decodeURIComponent(n)), e.port || (e.port = t.port);
      let i = t.pathname.slice(1) || null;
      (e.database = i ? decodeURI(i) : null),
         (e.ssl === "true" || e.ssl === "1") && (e.ssl = true),
         e.ssl === "0" && (e.ssl = false),
         (e.sslcert || e.sslkey || e.sslrootcert || e.sslmode) && (e.ssl = {});
      let a = e.sslcert || e.sslkey || e.sslrootcert ? (Xe(), T(Ze)) : null;
      switch (
         (e.sslcert && (e.ssl.cert = a.readFileSync(e.sslcert).toString()),
         e.sslkey && (e.ssl.key = a.readFileSync(e.sslkey).toString()),
         e.sslrootcert && (e.ssl.ca = a.readFileSync(e.sslrootcert).toString()),
         e.sslmode)
      ) {
         case "disable": {
            e.ssl = false;
            break;
         }
         case "prefer":
         case "require":
         case "verify-ca":
         case "verify-full":
            break;
         case "no-verify": {
            e.ssl.rejectUnauthorized = false;
            break;
         }
      }
      return e;
   }
   kr.exports = et;
   et.parse = et;
});
var Fr = v((lu, qr) => {
   "use strict";
   o();
   u();
   c();
   var $n = Mr(),
      Or = ue(),
      Lr = Dr().parse,
      M = function (r, e, t) {
         return t === void 0 ? (t = f.env["PG" + r.toUpperCase()]) : t === false || (t = f.env[t]), e[r] || t || Or[r];
      },
      Jn = function () {
         switch (f.env.PGSSLMODE) {
            case "disable":
               return false;
            case "prefer":
            case "require":
            case "verify-ca":
            case "verify-full":
               return true;
            case "no-verify":
               return { rejectUnauthorized: false };
         }
         return Or.ssl;
      },
      J = function (r) {
         return "'" + ("" + r).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
      },
      O = function (r, e, t) {
         var s = e[t];
         s != null && r.push(t + "=" + J(s));
      },
      tt = class {
         constructor(e) {
            (e = typeof e == "string" ? Lr(e) : e || {}),
               e.connectionString && (e = Object.assign({}, e, Lr(e.connectionString))),
               (this.user = M("user", e)),
               (this.database = M("database", e)),
               this.database === void 0 && (this.database = this.user),
               (this.port = parseInt(M("port", e), 10)),
               (this.host = M("host", e)),
               Object.defineProperty(this, "password", {
                  configurable: true,
                  enumerable: false,
                  writable: true,
                  value: M("password", e),
               }),
               (this.binary = M("binary", e)),
               (this.options = M("options", e)),
               (this.ssl = typeof e.ssl > "u" ? Jn() : e.ssl),
               typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = true),
               this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: false }),
               this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }),
               (this.client_encoding = M("client_encoding", e)),
               (this.replication = M("replication", e)),
               (this.isDomainSocket = !(this.host || "").indexOf("/")),
               (this.application_name = M("application_name", e, "PGAPPNAME")),
               (this.fallback_application_name = M("fallback_application_name", e, false)),
               (this.statement_timeout = M("statement_timeout", e, false)),
               (this.lock_timeout = M("lock_timeout", e, false)),
               (this.idle_in_transaction_session_timeout = M("idle_in_transaction_session_timeout", e, false)),
               (this.query_timeout = M("query_timeout", e, false)),
               e.connectionTimeoutMillis === void 0
                  ? (this.connect_timeout = f.env.PGCONNECT_TIMEOUT || 0)
                  : (this.connect_timeout = Math.floor(e.connectionTimeoutMillis / 1e3)),
               e.keepAlive === false ? (this.keepalives = 0) : e.keepAlive === true && (this.keepalives = 1),
               typeof e.keepAliveInitialDelayMillis == "number" &&
                  (this.keepalives_idle = Math.floor(e.keepAliveInitialDelayMillis / 1e3));
         }
         getLibpqConnectionString(e) {
            var t = [];
            O(t, this, "user"),
               O(t, this, "password"),
               O(t, this, "port"),
               O(t, this, "application_name"),
               O(t, this, "fallback_application_name"),
               O(t, this, "connect_timeout"),
               O(t, this, "options");
            var s = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
            if (
               (O(t, s, "sslmode"),
               O(t, s, "sslca"),
               O(t, s, "sslkey"),
               O(t, s, "sslcert"),
               O(t, s, "sslrootcert"),
               this.database && t.push("dbname=" + J(this.database)),
               this.replication && t.push("replication=" + J(this.replication)),
               this.host && t.push("host=" + J(this.host)),
               this.isDomainSocket)
            )
               return e(null, t.join(" "));
            this.client_encoding && t.push("client_encoding=" + J(this.client_encoding)),
               $n.lookup(this.host, function (n, i) {
                  return n ? e(n, null) : (t.push("hostaddr=" + J(i)), e(null, t.join(" ")));
               });
         }
      };
   qr.exports = tt;
});
var Nr = v((mu, Qr) => {
   "use strict";
   o();
   u();
   c();
   var Zn = oe(),
      Br = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/,
      rt = class {
         constructor(e, t) {
            (this.command = null),
               (this.rowCount = null),
               (this.oid = null),
               (this.rows = []),
               (this.fields = []),
               (this._parsers = void 0),
               (this._types = t),
               (this.RowCtor = null),
               (this.rowAsArray = e === "array"),
               this.rowAsArray && (this.parseRow = this._parseRowAsArray),
               (this._prebuiltEmptyResultObject = null);
         }
         addCommandComplete(e) {
            var t;
            e.text ? (t = Br.exec(e.text)) : (t = Br.exec(e.command)),
               t &&
                  ((this.command = t[1]),
                  t[3]
                     ? ((this.oid = parseInt(t[2], 10)), (this.rowCount = parseInt(t[3], 10)))
                     : t[2] && (this.rowCount = parseInt(t[2], 10)));
         }
         _parseRowAsArray(e) {
            for (var t = new Array(e.length), s = 0, n = e.length; s < n; s++) {
               var i = e[s];
               i !== null ? (t[s] = this._parsers[s](i)) : (t[s] = null);
            }
            return t;
         }
         parseRow(e) {
            for (var t = { ...this._prebuiltEmptyResultObject }, s = 0, n = e.length; s < n; s++) {
               var i = e[s],
                  a = this.fields[s].name;
               i !== null ? (t[a] = this._parsers[s](i)) : (t[a] = null);
            }
            return t;
         }
         addRow(e) {
            this.rows.push(e);
         }
         addFields(e) {
            (this.fields = e), this.fields.length && (this._parsers = new Array(e.length));
            for (var t = {}, s = 0; s < e.length; s++) {
               var n = e[s];
               (t[n.name] = null),
                  this._types
                     ? (this._parsers[s] = this._types.getTypeParser(n.dataTypeID, n.format || "text"))
                     : (this._parsers[s] = Zn.getTypeParser(n.dataTypeID, n.format || "text"));
            }
            this._prebuiltEmptyResultObject = { ...t };
         }
      };
   Qr.exports = rt;
});
var Hr = v((wu, Gr) => {
   "use strict";
   o();
   u();
   c();
   var { EventEmitter: Xn } = (V(), T(k)),
      Ur = Nr(),
      jr = _e(),
      st = class extends Xn {
         constructor(e, t, s) {
            super(),
               (e = jr.normalizeQueryConfig(e, t, s)),
               (this.text = e.text),
               (this.values = e.values),
               (this.rows = e.rows),
               (this.types = e.types),
               (this.name = e.name),
               (this.binary = e.binary),
               (this.portal = e.portal || ""),
               (this.callback = e.callback),
               (this._rowMode = e.rowMode),
               f.domain && e.callback && (this.callback = f.domain.bind(e.callback)),
               (this._result = new Ur(this._rowMode, this.types)),
               (this._results = this._result),
               (this._canceledDueToError = false);
         }
         requiresPreparation() {
            return this.name || this.rows ? true : !this.text || !this.values ? false : this.values.length > 0;
         }
         _checkForMultirow() {
            this._result.command &&
               (Array.isArray(this._results) || (this._results = [this._result]),
               (this._result = new Ur(this._rowMode, this.types)),
               this._results.push(this._result));
         }
         handleRowDescription(e) {
            this._checkForMultirow(),
               this._result.addFields(e.fields),
               (this._accumulateRows = this.callback || !this.listeners("row").length);
         }
         handleDataRow(e) {
            let t;
            if (!this._canceledDueToError) {
               try {
                  t = this._result.parseRow(e.fields);
               } catch (s) {
                  this._canceledDueToError = s;
                  return;
               }
               this.emit("row", t, this._result), this._accumulateRows && this._result.addRow(t);
            }
         }
         handleCommandComplete(e, t) {
            this._checkForMultirow(), this._result.addCommandComplete(e), this.rows && t.sync();
         }
         handleEmptyQuery(e) {
            this.rows && e.sync();
         }
         handleError(e, t) {
            if ((this._canceledDueToError && ((e = this._canceledDueToError), (this._canceledDueToError = false)), this.callback))
               return this.callback(e);
            this.emit("error", e);
         }
         handleReadyForQuery(e) {
            if (this._canceledDueToError) return this.handleError(this._canceledDueToError, e);
            if (this.callback)
               try {
                  this.callback(null, this._results);
               } catch (t) {
                  f.nextTick(() => {
                     throw t;
                  });
               }
            this.emit("end", this._results);
         }
         submit(e) {
            if (typeof this.text != "string" && typeof this.name != "string")
               return new Error("A query must have either text or a name. Supplying neither is unsupported.");
            let t = e.parsedStatements[this.name];
            return this.text && t && this.text !== t
               ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`)
               : this.values && !Array.isArray(this.values)
                 ? new Error("Query values must be an array")
                 : (this.requiresPreparation() ? this.prepare(e) : e.query(this.text), null);
         }
         hasBeenParsed(e) {
            return this.name && e.parsedStatements[this.name];
         }
         handlePortalSuspended(e) {
            this._getRows(e, this.rows);
         }
         _getRows(e, t) {
            e.execute({ portal: this.portal, rows: t }), t ? e.flush() : e.sync();
         }
         prepare(e) {
            this.hasBeenParsed(e) || e.parse({ text: this.text, name: this.name, types: this.types });
            try {
               e.bind({
                  portal: this.portal,
                  statement: this.name,
                  values: this.values,
                  binary: this.binary,
                  valueMapper: jr.prepareValue,
               });
            } catch (t) {
               this.handleError(t, e);
               return;
            }
            e.describe({ type: "P", name: this.portal || "" }), this._getRows(e, this.rows);
         }
         handleCopyInResponse(e) {
            e.sendCopyFail("No source stream defined");
         }
         handleCopyData(e, t) {}
      };
   Gr.exports = st;
});
var ve = v(() => {
   "use strict";
   o();
   u();
   c();
});
var _t = v(g => {
   "use strict";
   o();
   u();
   c();
   Object.defineProperty(g, "__esModule", { value: true });
   g.NoticeMessage =
      g.DataRowMessage =
      g.CommandCompleteMessage =
      g.ReadyForQueryMessage =
      g.NotificationResponseMessage =
      g.BackendKeyDataMessage =
      g.AuthenticationMD5Password =
      g.ParameterStatusMessage =
      g.ParameterDescriptionMessage =
      g.RowDescriptionMessage =
      g.Field =
      g.CopyResponse =
      g.CopyDataMessage =
      g.DatabaseError =
      g.copyDone =
      g.emptyQuery =
      g.replicationStart =
      g.portalSuspended =
      g.noData =
      g.closeComplete =
      g.bindComplete =
      g.parseComplete =
         void 0;
   g.parseComplete = { name: "parseComplete", length: 5 };
   g.bindComplete = { name: "bindComplete", length: 5 };
   g.closeComplete = { name: "closeComplete", length: 5 };
   g.noData = { name: "noData", length: 5 };
   g.portalSuspended = { name: "portalSuspended", length: 5 };
   g.replicationStart = { name: "replicationStart", length: 4 };
   g.emptyQuery = { name: "emptyQuery", length: 4 };
   g.copyDone = { name: "copyDone", length: 4 };
   var nt = class extends Error {
      constructor(e, t, s) {
         super(e), (this.length = t), (this.name = s);
      }
   };
   g.DatabaseError = nt;
   var it = class {
      constructor(e, t) {
         (this.length = e), (this.chunk = t), (this.name = "copyData");
      }
   };
   g.CopyDataMessage = it;
   var at = class {
      constructor(e, t, s, n) {
         (this.length = e), (this.name = t), (this.binary = s), (this.columnTypes = new Array(n));
      }
   };
   g.CopyResponse = at;
   var ot = class {
      constructor(e, t, s, n, i, a, l) {
         (this.name = e),
            (this.tableID = t),
            (this.columnID = s),
            (this.dataTypeID = n),
            (this.dataTypeSize = i),
            (this.dataTypeModifier = a),
            (this.format = l);
      }
   };
   g.Field = ot;
   var ut = class {
      constructor(e, t) {
         (this.length = e), (this.fieldCount = t), (this.name = "rowDescription"), (this.fields = new Array(this.fieldCount));
      }
   };
   g.RowDescriptionMessage = ut;
   var ct = class {
      constructor(e, t) {
         (this.length = e),
            (this.parameterCount = t),
            (this.name = "parameterDescription"),
            (this.dataTypeIDs = new Array(this.parameterCount));
      }
   };
   g.ParameterDescriptionMessage = ct;
   var ht = class {
      constructor(e, t, s) {
         (this.length = e), (this.parameterName = t), (this.parameterValue = s), (this.name = "parameterStatus");
      }
   };
   g.ParameterStatusMessage = ht;
   var lt = class {
      constructor(e, t) {
         (this.length = e), (this.salt = t), (this.name = "authenticationMD5Password");
      }
   };
   g.AuthenticationMD5Password = lt;
   var ft = class {
      constructor(e, t, s) {
         (this.length = e), (this.processID = t), (this.secretKey = s), (this.name = "backendKeyData");
      }
   };
   g.BackendKeyDataMessage = ft;
   var dt = class {
      constructor(e, t, s, n) {
         (this.length = e), (this.processId = t), (this.channel = s), (this.payload = n), (this.name = "notification");
      }
   };
   g.NotificationResponseMessage = dt;
   var pt = class {
      constructor(e, t) {
         (this.length = e), (this.status = t), (this.name = "readyForQuery");
      }
   };
   g.ReadyForQueryMessage = pt;
   var mt = class {
      constructor(e, t) {
         (this.length = e), (this.text = t), (this.name = "commandComplete");
      }
   };
   g.CommandCompleteMessage = mt;
   var yt = class {
      constructor(e, t) {
         (this.length = e), (this.fields = t), (this.name = "dataRow"), (this.fieldCount = t.length);
      }
   };
   g.DataRowMessage = yt;
   var gt = class {
      constructor(e, t) {
         (this.length = e), (this.message = t), (this.name = "notice");
      }
   };
   g.NoticeMessage = gt;
});
var Wr = v(Se => {
   "use strict";
   o();
   u();
   c();
   Object.defineProperty(Se, "__esModule", { value: true });
   Se.Writer = void 0;
   var wt = class {
      constructor(e = 256) {
         (this.size = e), (this.offset = 5), (this.headerPosition = 0), (this.buffer = Buffer3.allocUnsafe(e));
      }
      ensure(e) {
         var t = this.buffer.length - this.offset;
         if (t < e) {
            var s = this.buffer,
               n = s.length + (s.length >> 1) + e;
            (this.buffer = Buffer3.allocUnsafe(n)), s.copy(this.buffer);
         }
      }
      addInt32(e) {
         return (
            this.ensure(4),
            (this.buffer[this.offset++] = (e >>> 24) & 255),
            (this.buffer[this.offset++] = (e >>> 16) & 255),
            (this.buffer[this.offset++] = (e >>> 8) & 255),
            (this.buffer[this.offset++] = (e >>> 0) & 255),
            this
         );
      }
      addInt16(e) {
         return this.ensure(2), (this.buffer[this.offset++] = (e >>> 8) & 255), (this.buffer[this.offset++] = (e >>> 0) & 255), this;
      }
      addCString(e) {
         if (!e) this.ensure(1);
         else {
            var t = Buffer3.byteLength(e);
            this.ensure(t + 1), this.buffer.write(e, this.offset, "utf-8"), (this.offset += t);
         }
         return (this.buffer[this.offset++] = 0), this;
      }
      addString(e = "") {
         var t = Buffer3.byteLength(e);
         return this.ensure(t), this.buffer.write(e, this.offset), (this.offset += t), this;
      }
      add(e) {
         return this.ensure(e.length), e.copy(this.buffer, this.offset), (this.offset += e.length), this;
      }
      join(e) {
         if (e) {
            this.buffer[this.headerPosition] = e;
            let t = this.offset - (this.headerPosition + 1);
            this.buffer.writeInt32BE(t, this.headerPosition + 1);
         }
         return this.buffer.slice(e ? 0 : 5, this.offset);
      }
      flush(e) {
         var t = this.join(e);
         return (this.offset = 5), (this.headerPosition = 0), (this.buffer = Buffer3.allocUnsafe(this.size)), t;
      }
   };
   Se.Writer = wt;
});
var Vr = v(Ee => {
   "use strict";
   o();
   u();
   c();
   Object.defineProperty(Ee, "__esModule", { value: true });
   Ee.serialize = void 0;
   var vt = Wr(),
      C = new vt.Writer(),
      ei = r => {
         C.addInt16(3).addInt16(0);
         for (let s of Object.keys(r)) C.addCString(s).addCString(r[s]);
         C.addCString("client_encoding").addCString("UTF8");
         var e = C.addCString("").flush(),
            t = e.length + 4;
         return new vt.Writer().addInt32(t).add(e).flush();
      },
      ti = () => {
         let r = Buffer3.allocUnsafe(8);
         return r.writeInt32BE(8, 0), r.writeInt32BE(80877103, 4), r;
      },
      ri = r => C.addCString(r).flush(112),
      si = function (r, e) {
         return C.addCString(r).addInt32(Buffer3.byteLength(e)).addString(e), C.flush(112);
      },
      ni = function (r) {
         return C.addString(r).flush(112);
      },
      ii = r => C.addCString(r).flush(81),
      Kr = [],
      ai = r => {
         let e = r.name || "";
         e.length > 63 &&
            (console.error("Warning! Postgres only supports 63 characters for query names."),
            console.error("You supplied %s (%s)", e, e.length),
            console.error("This can cause conflicts and silent errors executing queries"));
         let t = r.types || Kr;
         for (var s = t.length, n = C.addCString(e).addCString(r.text).addInt16(s), i = 0; i < s; i++) n.addInt32(t[i]);
         return C.flush(80);
      },
      Z = new vt.Writer(),
      oi = function (r, e) {
         for (let t = 0; t < r.length; t++) {
            let s = e ? e(r[t], t) : r[t];
            s == null
               ? (C.addInt16(0), Z.addInt32(-1))
               : s instanceof Buffer3
                 ? (C.addInt16(1), Z.addInt32(s.length), Z.add(s))
                 : (C.addInt16(0), Z.addInt32(Buffer3.byteLength(s)), Z.addString(s));
         }
      },
      ui = (r = {}) => {
         let e = r.portal || "",
            t = r.statement || "",
            s = r.binary || false,
            n = r.values || Kr,
            i = n.length;
         return (
            C.addCString(e).addCString(t),
            C.addInt16(i),
            oi(n, r.valueMapper),
            C.addInt16(i),
            C.add(Z.flush()),
            C.addInt16(s ? 1 : 0),
            C.flush(66)
         );
      },
      ci = Buffer3.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]),
      hi = r => {
         if (!r || (!r.portal && !r.rows)) return ci;
         let e = r.portal || "",
            t = r.rows || 0,
            s = Buffer3.byteLength(e),
            n = 4 + s + 1 + 4,
            i = Buffer3.allocUnsafe(1 + n);
         return (i[0] = 69), i.writeInt32BE(n, 1), i.write(e, 5, "utf-8"), (i[s + 5] = 0), i.writeUInt32BE(t, i.length - 4), i;
      },
      li = (r, e) => {
         let t = Buffer3.allocUnsafe(16);
         return (
            t.writeInt32BE(16, 0), t.writeInt16BE(1234, 4), t.writeInt16BE(5678, 6), t.writeInt32BE(r, 8), t.writeInt32BE(e, 12), t
         );
      },
      St = (r, e) => {
         let s = 4 + Buffer3.byteLength(e) + 1,
            n = Buffer3.allocUnsafe(1 + s);
         return (n[0] = r), n.writeInt32BE(s, 1), n.write(e, 5, "utf-8"), (n[s] = 0), n;
      },
      fi = C.addCString("P").flush(68),
      di = C.addCString("S").flush(68),
      pi = r => (r.name ? St(68, `${r.type}${r.name || ""}`) : r.type === "P" ? fi : di),
      mi = r => {
         let e = `${r.type}${r.name || ""}`;
         return St(67, e);
      },
      yi = r => C.add(r).flush(100),
      gi = r => St(102, r),
      be = r => Buffer3.from([r, 0, 0, 0, 4]),
      _i = be(72),
      wi = be(83),
      vi = be(88),
      Si = be(99),
      bi = {
         startup: ei,
         password: ri,
         requestSsl: ti,
         sendSASLInitialResponseMessage: si,
         sendSCRAMClientFinalMessage: ni,
         query: ii,
         parse: ai,
         bind: ui,
         execute: hi,
         describe: pi,
         close: mi,
         flush: () => _i,
         sync: () => wi,
         end: () => vi,
         copyData: yi,
         copyDone: () => Si,
         copyFail: gi,
         cancel: li,
      };
   Ee.serialize = bi;
});
var zr = v(Ce => {
   "use strict";
   o();
   u();
   c();
   Object.defineProperty(Ce, "__esModule", { value: true });
   Ce.BufferReader = void 0;
   var Ei = Buffer3.allocUnsafe(0),
      bt = class {
         constructor(e = 0) {
            (this.offset = e), (this.buffer = Ei), (this.encoding = "utf-8");
         }
         setBuffer(e, t) {
            (this.offset = e), (this.buffer = t);
         }
         int16() {
            let e = this.buffer.readInt16BE(this.offset);
            return (this.offset += 2), e;
         }
         byte() {
            let e = this.buffer[this.offset];
            return this.offset++, e;
         }
         int32() {
            let e = this.buffer.readInt32BE(this.offset);
            return (this.offset += 4), e;
         }
         string(e) {
            let t = this.buffer.toString(this.encoding, this.offset, this.offset + e);
            return (this.offset += e), t;
         }
         cstring() {
            let e = this.offset,
               t = e;
            for (; this.buffer[t++] !== 0; );
            return (this.offset = t), this.buffer.toString(this.encoding, e, t - 1);
         }
         bytes(e) {
            let t = this.buffer.slice(this.offset, this.offset + e);
            return (this.offset += e), t;
         }
      };
   Ce.BufferReader = bt;
});
var Jr = v(xe => {
   "use strict";
   o();
   u();
   c();
   Object.defineProperty(xe, "__esModule", { value: true });
   xe.Parser = void 0;
   var x = _t(),
      Ci = zr(),
      Et = 1,
      xi = 4,
      Yr = Et + xi,
      $r = Buffer3.allocUnsafe(0),
      Ct = class {
         constructor(e) {
            if (
               ((this.buffer = $r),
               (this.bufferLength = 0),
               (this.bufferOffset = 0),
               (this.reader = new Ci.BufferReader()),
               e?.mode === "binary")
            )
               throw new Error("Binary mode not supported yet");
            this.mode = e?.mode || "text";
         }
         parse(e, t) {
            this.mergeBuffer(e);
            let s = this.bufferOffset + this.bufferLength,
               n = this.bufferOffset;
            for (; n + Yr <= s; ) {
               let i = this.buffer[n],
                  a = this.buffer.readUInt32BE(n + Et),
                  l = Et + a;
               if (l + n <= s) {
                  let p = this.handlePacket(n + Yr, i, a, this.buffer);
                  t(p), (n += l);
               } else break;
            }
            n === s
               ? ((this.buffer = $r), (this.bufferLength = 0), (this.bufferOffset = 0))
               : ((this.bufferLength = s - n), (this.bufferOffset = n));
         }
         mergeBuffer(e) {
            if (this.bufferLength > 0) {
               let t = this.bufferLength + e.byteLength;
               if (t + this.bufferOffset > this.buffer.byteLength) {
                  let n;
                  if (t <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) n = this.buffer;
                  else {
                     let i = this.buffer.byteLength * 2;
                     for (; t >= i; ) i *= 2;
                     n = Buffer3.allocUnsafe(i);
                  }
                  this.buffer.copy(n, 0, this.bufferOffset, this.bufferOffset + this.bufferLength),
                     (this.buffer = n),
                     (this.bufferOffset = 0);
               }
               e.copy(this.buffer, this.bufferOffset + this.bufferLength), (this.bufferLength = t);
            } else (this.buffer = e), (this.bufferOffset = 0), (this.bufferLength = e.byteLength);
         }
         handlePacket(e, t, s, n) {
            switch (t) {
               case 50:
                  return x.bindComplete;
               case 49:
                  return x.parseComplete;
               case 51:
                  return x.closeComplete;
               case 110:
                  return x.noData;
               case 115:
                  return x.portalSuspended;
               case 99:
                  return x.copyDone;
               case 87:
                  return x.replicationStart;
               case 73:
                  return x.emptyQuery;
               case 68:
                  return this.parseDataRowMessage(e, s, n);
               case 67:
                  return this.parseCommandCompleteMessage(e, s, n);
               case 90:
                  return this.parseReadyForQueryMessage(e, s, n);
               case 65:
                  return this.parseNotificationMessage(e, s, n);
               case 82:
                  return this.parseAuthenticationResponse(e, s, n);
               case 83:
                  return this.parseParameterStatusMessage(e, s, n);
               case 75:
                  return this.parseBackendKeyData(e, s, n);
               case 69:
                  return this.parseErrorMessage(e, s, n, "error");
               case 78:
                  return this.parseErrorMessage(e, s, n, "notice");
               case 84:
                  return this.parseRowDescriptionMessage(e, s, n);
               case 116:
                  return this.parseParameterDescriptionMessage(e, s, n);
               case 71:
                  return this.parseCopyInMessage(e, s, n);
               case 72:
                  return this.parseCopyOutMessage(e, s, n);
               case 100:
                  return this.parseCopyData(e, s, n);
               default:
                  return new x.DatabaseError("received invalid response: " + t.toString(16), s, "error");
            }
         }
         parseReadyForQueryMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.string(1);
            return new x.ReadyForQueryMessage(t, n);
         }
         parseCommandCompleteMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.cstring();
            return new x.CommandCompleteMessage(t, n);
         }
         parseCopyData(e, t, s) {
            let n = s.slice(e, e + (t - 4));
            return new x.CopyDataMessage(t, n);
         }
         parseCopyInMessage(e, t, s) {
            return this.parseCopyMessage(e, t, s, "copyInResponse");
         }
         parseCopyOutMessage(e, t, s) {
            return this.parseCopyMessage(e, t, s, "copyOutResponse");
         }
         parseCopyMessage(e, t, s, n) {
            this.reader.setBuffer(e, s);
            let i = this.reader.byte() !== 0,
               a = this.reader.int16(),
               l = new x.CopyResponse(t, n, i, a);
            for (let p = 0; p < a; p++) l.columnTypes[p] = this.reader.int16();
            return l;
         }
         parseNotificationMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.int32(),
               i = this.reader.cstring(),
               a = this.reader.cstring();
            return new x.NotificationResponseMessage(t, n, i, a);
         }
         parseRowDescriptionMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.int16(),
               i = new x.RowDescriptionMessage(t, n);
            for (let a = 0; a < n; a++) i.fields[a] = this.parseField();
            return i;
         }
         parseField() {
            let e = this.reader.cstring(),
               t = this.reader.int32(),
               s = this.reader.int16(),
               n = this.reader.int32(),
               i = this.reader.int16(),
               a = this.reader.int32(),
               l = this.reader.int16() === 0 ? "text" : "binary";
            return new x.Field(e, t, s, n, i, a, l);
         }
         parseParameterDescriptionMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.int16(),
               i = new x.ParameterDescriptionMessage(t, n);
            for (let a = 0; a < n; a++) i.dataTypeIDs[a] = this.reader.int32();
            return i;
         }
         parseDataRowMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.int16(),
               i = new Array(n);
            for (let a = 0; a < n; a++) {
               let l = this.reader.int32();
               i[a] = l === -1 ? null : this.reader.string(l);
            }
            return new x.DataRowMessage(t, i);
         }
         parseParameterStatusMessage(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.cstring(),
               i = this.reader.cstring();
            return new x.ParameterStatusMessage(t, n, i);
         }
         parseBackendKeyData(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.int32(),
               i = this.reader.int32();
            return new x.BackendKeyDataMessage(t, n, i);
         }
         parseAuthenticationResponse(e, t, s) {
            this.reader.setBuffer(e, s);
            let n = this.reader.int32(),
               i = { name: "authenticationOk", length: t };
            switch (n) {
               case 0:
                  break;
               case 3:
                  i.length === 8 && (i.name = "authenticationCleartextPassword");
                  break;
               case 5:
                  if (i.length === 12) {
                     i.name = "authenticationMD5Password";
                     let l = this.reader.bytes(4);
                     return new x.AuthenticationMD5Password(t, l);
                  }
                  break;
               case 10:
                  (i.name = "authenticationSASL"), (i.mechanisms = []);
                  let a;
                  do (a = this.reader.cstring()), a && i.mechanisms.push(a);
                  while (a);
                  break;
               case 11:
                  (i.name = "authenticationSASLContinue"), (i.data = this.reader.string(t - 8));
                  break;
               case 12:
                  (i.name = "authenticationSASLFinal"), (i.data = this.reader.string(t - 8));
                  break;
               default:
                  throw new Error("Unknown authenticationOk message type " + n);
            }
            return i;
         }
         parseErrorMessage(e, t, s, n) {
            this.reader.setBuffer(e, s);
            let i = {},
               a = this.reader.string(1);
            for (; a !== "\0"; ) (i[a] = this.reader.cstring()), (a = this.reader.string(1));
            let l = i.M,
               p = n === "notice" ? new x.NoticeMessage(t, l) : new x.DatabaseError(l, t, n);
            return (
               (p.severity = i.S),
               (p.code = i.C),
               (p.detail = i.D),
               (p.hint = i.H),
               (p.position = i.P),
               (p.internalPosition = i.p),
               (p.internalQuery = i.q),
               (p.where = i.W),
               (p.schema = i.s),
               (p.table = i.t),
               (p.column = i.c),
               (p.dataType = i.d),
               (p.constraint = i.n),
               (p.file = i.F),
               (p.line = i.L),
               (p.routine = i.R),
               p
            );
         }
      };
   xe.Parser = Ct;
});
var xt = v(j => {
   "use strict";
   o();
   u();
   c();
   Object.defineProperty(j, "__esModule", { value: true });
   j.DatabaseError = j.serialize = j.parse = void 0;
   var Ai = _t();
   Object.defineProperty(j, "DatabaseError", {
      enumerable: true,
      get: function () {
         return Ai.DatabaseError;
      },
   });
   var Pi = Vr();
   Object.defineProperty(j, "serialize", {
      enumerable: true,
      get: function () {
         return Pi.serialize;
      },
   });
   var Ti = Jr();
   function Mi(r, e) {
      let t = new Ti.Parser();
      return r.on("data", s => t.parse(s, e)), new Promise(s => r.on("end", () => s()));
   }
   j.parse = Mi;
});
var Zr = {};
De(Zr, { CloudflareSocket: () => At });
function Ii(r) {
   if (r instanceof Uint8Array || r instanceof ArrayBuffer) {
      let e = Buffer3.from(r).toString("hex");
      return `
>>> STR: "${new TextDecoder().decode(r).replace(/\n/g, "\\n")}"
>>> HEX: ${e}
`;
   } else return r;
}
function D(...r) {
   Ri && console.log(...r.map(Ii));
}
var At;
var Ri;
var Xr = q(() => {
   "use strict";
   o();
   u();
   c();
   V();
   (At = class extends k.EventEmitter {
      constructor(e) {
         super(),
            (this.ssl = e),
            (this.writable = false),
            (this.destroyed = false),
            (this._upgrading = false),
            (this._upgraded = false),
            (this._cfSocket = null),
            (this._cfWriter = null),
            (this._cfReader = null);
      }
      setNoDelay() {
         return this;
      }
      setKeepAlive() {
         return this;
      }
      ref() {
         return this;
      }
      unref() {
         return this;
      }
      async connect(e, t, s) {
         try {
            D("connecting"), s && this.once("connect", s);
            let n = this.ssl ? { secureTransport: "starttls" } : {},
               { connect: i } = await import("cloudflare:sockets");
            return (
               (this._cfSocket = i(`${t}:${e}`, n)),
               (this._cfWriter = this._cfSocket.writable.getWriter()),
               this._addClosedHandler(),
               (this._cfReader = this._cfSocket.readable.getReader()),
               this.ssl ? this._listenOnce().catch(a => this.emit("error", a)) : this._listen().catch(a => this.emit("error", a)),
               await this._cfWriter.ready,
               D("socket ready"),
               (this.writable = true),
               this.emit("connect"),
               this
            );
         } catch (n) {
            this.emit("error", n);
         }
      }
      async _listen() {
         for (;;) {
            D("awaiting receive from CF socket");
            let { done: e, value: t } = await this._cfReader.read();
            if ((D("CF socket received:", e, t), e)) {
               D("done");
               break;
            }
            this.emit("data", Buffer3.from(t));
         }
      }
      async _listenOnce() {
         D("awaiting first receive from CF socket");
         let { done: e, value: t } = await this._cfReader.read();
         D("First CF socket received:", e, t), this.emit("data", Buffer3.from(t));
      }
      write(e, t = "utf8", s = () => {}) {
         return e.length === 0
            ? s()
            : (typeof e == "string" && (e = Buffer3.from(e, t)),
              D("sending data direct:", e),
              this._cfWriter.write(e).then(
                 () => {
                    D("data sent"), s();
                 },
                 n => {
                    D("send error", n), s(n);
                 },
              ),
              true);
      }
      end(e = Buffer3.alloc(0), t = "utf8", s = () => {}) {
         return (
            D("ending CF socket"),
            this.write(e, t, n => {
               this._cfSocket.close(), s && s(n);
            }),
            this
         );
      }
      destroy(e) {
         return D("destroying CF socket", e), (this.destroyed = true), this.end();
      }
      startTls(e) {
         if (this._upgraded) {
            this.emit("error", "Cannot call `startTls()` more than once on a socket");
            return;
         }
         this._cfWriter.releaseLock(),
            this._cfReader.releaseLock(),
            (this._upgrading = true),
            (this._cfSocket = this._cfSocket.startTls(e)),
            (this._cfWriter = this._cfSocket.writable.getWriter()),
            (this._cfReader = this._cfSocket.readable.getReader()),
            this._addClosedHandler(),
            this._listen().catch(t => this.emit("error", t));
      }
      _addClosedHandler() {
         this._cfSocket.closed
            .then(() => {
               this._upgrading
                  ? ((this._upgrading = false), (this._upgraded = true))
                  : (D("CF socket closed"), (this._cfSocket = null), this.emit("close"));
            })
            .catch(e => this.emit("error", e));
      }
   }),
      (Ri = false);
});
var es = v(() => {
   "use strict";
   o();
   u();
   c();
});
var ts = v((oc, Pt) => {
   "use strict";
   o();
   u();
   c();
   Pt.exports.getStream = function (e) {
      let t = ve();
      if (typeof t.Socket == "function") return new t.Socket();
      {
         let { CloudflareSocket: s } = (Xr(), T(Zr));
         return new s(e);
      }
   };
   Pt.exports.getSecureStream = function (e) {
      var t = es();
      return t.connect ? t.connect(e) : (e.socket.startTls(e), e.socket);
   };
});
var Mt = v((fc, rs) => {
   "use strict";
   o();
   u();
   c();
   var lc = ve(),
      ki = (V(), T(k)).EventEmitter,
      { parse: Di, serialize: A } = xt(),
      { getStream: Li, getSecureStream: Oi } = ts(),
      qi = A.flush(),
      Fi = A.sync(),
      Bi = A.end(),
      Tt = class extends ki {
         constructor(e) {
            super(),
               (e = e || {}),
               (this.stream = e.stream || Li(e.ssl)),
               typeof this.stream == "function" && (this.stream = this.stream(e)),
               (this._keepAlive = e.keepAlive),
               (this._keepAliveInitialDelayMillis = e.keepAliveInitialDelayMillis),
               (this.lastBuffer = false),
               (this.parsedStatements = {}),
               (this.ssl = e.ssl || false),
               (this._ending = false),
               (this._emitMessage = false);
            var t = this;
            this.on("newListener", function (s) {
               s === "message" && (t._emitMessage = true);
            });
         }
         connect(e, t) {
            var s = this;
            (this._connecting = true),
               this.stream.setNoDelay(true),
               this.stream.connect(e, t),
               this.stream.once("connect", function () {
                  s._keepAlive && s.stream.setKeepAlive(true, s._keepAliveInitialDelayMillis), s.emit("connect");
               });
            let n = function (i) {
               (s._ending && (i.code === "ECONNRESET" || i.code === "EPIPE")) || s.emit("error", i);
            };
            if (
               (this.stream.on("error", n),
               this.stream.on("close", function () {
                  s.emit("end");
               }),
               !this.ssl)
            )
               return this.attachListeners(this.stream);
            this.stream.once("data", function (i) {
               var a = i.toString("utf8");
               switch (a) {
                  case "S":
                     break;
                  case "N":
                     return s.stream.end(), s.emit("error", new Error("The server does not support SSL connections"));
                  default:
                     return s.stream.end(), s.emit("error", new Error("There was an error establishing an SSL connection"));
               }
               let l = { socket: s.stream };
               s.ssl !== true && (Object.assign(l, s.ssl), "key" in s.ssl && (l.key = s.ssl.key));
               var p = ve();
               p.isIP && p.isIP(t) === 0 && (l.servername = t);
               try {
                  s.stream = Oi(l);
               } catch (d) {
                  return s.emit("error", d);
               }
               s.attachListeners(s.stream), s.stream.on("error", n), s.emit("sslconnect");
            });
         }
         attachListeners(e) {
            Di(e, t => {
               var s = t.name === "error" ? "errorMessage" : t.name;
               this._emitMessage && this.emit("message", t), this.emit(s, t);
            });
         }
         requestSsl() {
            this.stream.write(A.requestSsl());
         }
         startup(e) {
            this.stream.write(A.startup(e));
         }
         cancel(e, t) {
            this._send(A.cancel(e, t));
         }
         password(e) {
            this._send(A.password(e));
         }
         sendSASLInitialResponseMessage(e, t) {
            this._send(A.sendSASLInitialResponseMessage(e, t));
         }
         sendSCRAMClientFinalMessage(e) {
            this._send(A.sendSCRAMClientFinalMessage(e));
         }
         _send(e) {
            return this.stream.writable ? this.stream.write(e) : false;
         }
         query(e) {
            this._send(A.query(e));
         }
         parse(e) {
            this._send(A.parse(e));
         }
         bind(e) {
            this._send(A.bind(e));
         }
         execute(e) {
            this._send(A.execute(e));
         }
         flush() {
            this.stream.writable && this.stream.write(qi);
         }
         sync() {
            (this._ending = true), this._send(Fi);
         }
         ref() {
            this.stream.ref();
         }
         unref() {
            this.stream.unref();
         }
         end() {
            if (((this._ending = true), !this._connecting || !this.stream.writable)) {
               this.stream.end();
               return;
            }
            return this.stream.write(Bi, () => {
               this.stream.end();
            });
         }
         close(e) {
            this._send(A.close(e));
         }
         describe(e) {
            this._send(A.describe(e));
         }
         sendCopyFromChunk(e) {
            this._send(A.copyData(e));
         }
         endCopyFrom() {
            this._send(A.copyDone());
         }
         sendCopyFail(e) {
            this._send(A.copyFail(e));
         }
      };
   rs.exports = Tt;
});
var Q = {};
var Rt = q(() => {
   "use strict";
   o();
   u();
   c();
   _(Q, path_exports);
});
var N = {};
var It = q(() => {
   "use strict";
   o();
   u();
   c();
   _(N, stream_exports);
});
var G = {};
var ss = q(() => {
   "use strict";
   o();
   u();
   c();
   _(G, string_decoder_exports);
});
var os = v((Tc, as) => {
   "use strict";
   o();
   u();
   c();
   var { Transform: Qi } = (It(), T(N)),
      { StringDecoder: Ni } = (ss(), T(G)),
      H = Symbol("last"),
      Ae = Symbol("decoder");
   function Ui(r, e, t) {
      let s;
      if (this.overflow) {
         if (((s = this[Ae].write(r).split(this.matcher)), s.length === 1)) return t();
         s.shift(), (this.overflow = false);
      } else (this[H] += this[Ae].write(r)), (s = this[H].split(this.matcher));
      this[H] = s.pop();
      for (let n = 0; n < s.length; n++)
         try {
            is(this, this.mapper(s[n]));
         } catch (i) {
            return t(i);
         }
      if (((this.overflow = this[H].length > this.maxLength), this.overflow && !this.skipOverflow)) {
         t(new Error("maximum buffer reached"));
         return;
      }
      t();
   }
   function ji(r) {
      if (((this[H] += this[Ae].end()), this[H]))
         try {
            is(this, this.mapper(this[H]));
         } catch (e) {
            return r(e);
         }
      r();
   }
   function is(r, e) {
      e !== void 0 && r.push(e);
   }
   function ns(r) {
      return r;
   }
   function Gi(r, e, t) {
      switch (((r = r || /\r?\n/), (e = e || ns), (t = t || {}), arguments.length)) {
         case 1:
            typeof r == "function"
               ? ((e = r), (r = /\r?\n/))
               : typeof r == "object" && !(r instanceof RegExp) && ((t = r), (r = /\r?\n/));
            break;
         case 2:
            typeof r == "function" ? ((t = e), (e = r), (r = /\r?\n/)) : typeof e == "object" && ((t = e), (e = ns));
      }
      (t = Object.assign({}, t)), (t.autoDestroy = true), (t.transform = Ui), (t.flush = ji), (t.readableObjectMode = true);
      let s = new Qi(t);
      return (
         (s[H] = ""),
         (s[Ae] = new Ni("utf8")),
         (s.matcher = r),
         (s.mapper = e),
         (s.maxLength = t.maxLength),
         (s.skipOverflow = t.skipOverflow || false),
         (s.overflow = false),
         (s._destroy = function (n, i) {
            (this._writableState.errorEmitted = false), i(n);
         }),
         s
      );
   }
   as.exports = Gi;
});
var W = {};
var us = q(() => {
   "use strict";
   o();
   u();
   c();
   _(W, util_exports);
});
var ls = v((qc, U) => {
   "use strict";
   o();
   u();
   c();
   var cs = (Rt(), T(Q)),
      Hi = (It(), T(N)).Stream,
      Wi = os(),
      hs = (us(), T(W)),
      Ki = 5432,
      Pe = f.platform === "win32",
      he = f.stderr,
      Vi = 56,
      zi = 7,
      Yi = 61440,
      $i = 32768;
   function Ji(r) {
      return (r & Yi) == $i;
   }
   var X = ["host", "port", "database", "user", "password"],
      kt = X.length,
      Zi = X[kt - 1];
   function Dt() {
      var r = he instanceof Hi && he.writable === true;
      if (r) {
         var e = Array.prototype.slice.call(arguments).concat(`
`);
         he.write(hs.format.apply(hs, e));
      }
   }
   Object.defineProperty(U.exports, "isWin", {
      get: function () {
         return Pe;
      },
      set: function (r) {
         Pe = r;
      },
   });
   U.exports.warnTo = function (r) {
      var e = he;
      return (he = r), e;
   };
   U.exports.getFileName = function (r) {
      var e = r || f.env,
         t = e.PGPASSFILE || (Pe ? cs.join(e.APPDATA || "./", "postgresql", "pgpass.conf") : cs.join(e.HOME || "./", ".pgpass"));
      return t;
   };
   U.exports.usePgPass = function (r, e) {
      return Object.prototype.hasOwnProperty.call(f.env, "PGPASSWORD")
         ? false
         : Pe
           ? true
           : ((e = e || "<unkn>"),
             Ji(r.mode)
                ? r.mode & (Vi | zi)
                   ? (Dt('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', e), false)
                   : true
                : (Dt('WARNING: password file "%s" is not a plain file', e), false));
   };
   var Xi = (U.exports.match = function (r, e) {
      return X.slice(0, -1).reduce(function (t, s, n) {
         return n == 1 && Number(r[s] || Ki) === Number(e[s]) ? t && true : t && (e[s] === "*" || e[s] === r[s]);
      }, true);
   });
   U.exports.getPassword = function (r, e, t) {
      var s,
         n = e.pipe(Wi());
      function i(p) {
         var d = ea(p);
         d && ta(d) && Xi(r, d) && ((s = d[Zi]), n.end());
      }
      var a = function () {
            e.destroy(), t(s);
         },
         l = function (p) {
            e.destroy(), Dt("WARNING: error on reading file: %s", p), t(void 0);
         };
      e.on("error", l), n.on("data", i).on("end", a).on("error", l);
   };
   var ea = (U.exports.parseLine = function (r) {
         if (r.length < 11 || r.match(/^\s+#/)) return null;
         for (
            var e = "",
               t = "",
               s = 0,
               n = 0,
               i = 0,
               a = {},
               l = false,
               p = function (w, S, b) {
                  var I = r.substring(S, b);
                  Object.hasOwnProperty.call(f.env, "PGPASS_NO_DEESCAPE") || (I = I.replace(/\\([:\\])/g, "$1")), (a[X[w]] = I);
               },
               d = 0;
            d < r.length - 1;
            d += 1
         ) {
            if (((e = r.charAt(d + 1)), (t = r.charAt(d)), (l = s == kt - 1), l)) {
               p(s, n);
               break;
            }
            d >= 0 && e == ":" && t !== "\\" && (p(s, n, d + 1), (n = d + 2), (s += 1));
         }
         return (a = Object.keys(a).length === kt ? a : null), a;
      }),
      ta = (U.exports.isValidEntry = function (r) {
         for (
            var e = {
                  0: function (a) {
                     return a.length > 0;
                  },
                  1: function (a) {
                     return a === "*" ? true : ((a = Number(a)), isFinite(a) && a > 0 && a < 9007199254740992 && Math.floor(a) === a);
                  },
                  2: function (a) {
                     return a.length > 0;
                  },
                  3: function (a) {
                     return a.length > 0;
                  },
                  4: function (a) {
                     return a.length > 0;
                  },
               },
               t = 0;
            t < X.length;
            t += 1
         ) {
            var s = e[t],
               n = r[X[t]] || "",
               i = s(n);
            if (!i) return false;
         }
         return true;
      });
});
var ds = v((Uc, Lt) => {
   "use strict";
   o();
   u();
   c();
   var Nc = (Rt(), T(Q)),
      fs = (Xe(), T(Ze)),
      Te = ls();
   Lt.exports = function (r, e) {
      var t = Te.getFileName();
      fs.stat(t, function (s, n) {
         if (s || !Te.usePgPass(n, t)) return e(void 0);
         var i = fs.createReadStream(t);
         Te.getPassword(r, i, e);
      });
   };
   Lt.exports.warnTo = Te.warnTo;
});
var gs = v((Wc, ys) => {
   "use strict";
   o();
   u();
   c();
   var ra = (V(), T(k)).EventEmitter,
      ps = _e(),
      Ot = Ar(),
      sa = Tr(),
      na = Fr(),
      ms = Hr(),
      ia = ue(),
      aa = Mt(),
      oa = Je(),
      Me = class extends ra {
         constructor(e) {
            super(),
               (this.connectionParameters = new na(e)),
               (this.user = this.connectionParameters.user),
               (this.database = this.connectionParameters.database),
               (this.port = this.connectionParameters.port),
               (this.host = this.connectionParameters.host),
               Object.defineProperty(this, "password", {
                  configurable: true,
                  enumerable: false,
                  writable: true,
                  value: this.connectionParameters.password,
               }),
               (this.replication = this.connectionParameters.replication);
            var t = e || {};
            (this._Promise = t.Promise || globalThis.Promise),
               (this._types = new sa(t.types)),
               (this._ending = false),
               (this._ended = false),
               (this._connecting = false),
               (this._connected = false),
               (this._connectionError = false),
               (this._queryable = true),
               (this.connection =
                  t.connection ||
                  new aa({
                     stream: t.stream,
                     ssl: this.connectionParameters.ssl,
                     keepAlive: t.keepAlive || false,
                     keepAliveInitialDelayMillis: t.keepAliveInitialDelayMillis || 0,
                     encoding: this.connectionParameters.client_encoding || "utf8",
                  })),
               (this.queryQueue = []),
               (this.binary = t.binary || ia.binary),
               (this.processID = null),
               (this.secretKey = null),
               (this.ssl = this.connectionParameters.ssl || false),
               this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }),
               (this._connectionTimeoutMillis = t.connectionTimeoutMillis || 0);
         }
         _errorAllQueries(e) {
            let t = s => {
               f.nextTick(() => {
                  s.handleError(e, this.connection);
               });
            };
            this.activeQuery && (t(this.activeQuery), (this.activeQuery = null)),
               this.queryQueue.forEach(t),
               (this.queryQueue.length = 0);
         }
         _connect(e) {
            var t = this,
               s = this.connection;
            if (((this._connectionCallback = e), this._connecting || this._connected)) {
               let n = new Error("Client has already been connected. You cannot reuse a client.");
               f.nextTick(() => {
                  e(n);
               });
               return;
            }
            (this._connecting = true),
               this.connectionTimeoutHandle,
               this._connectionTimeoutMillis > 0 &&
                  (this.connectionTimeoutHandle = setTimeout(() => {
                     (s._ending = true), s.stream.destroy(new Error("timeout expired"));
                  }, this._connectionTimeoutMillis)),
               this.host && this.host.indexOf("/") === 0
                  ? s.connect(this.host + "/.s.PGSQL." + this.port)
                  : s.connect(this.port, this.host),
               s.on("connect", function () {
                  t.ssl ? s.requestSsl() : s.startup(t.getStartupConf());
               }),
               s.on("sslconnect", function () {
                  s.startup(t.getStartupConf());
               }),
               this._attachListeners(s),
               s.once("end", () => {
                  let n = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
                  clearTimeout(this.connectionTimeoutHandle),
                     this._errorAllQueries(n),
                     (this._ended = true),
                     this._ending ||
                        (this._connecting && !this._connectionError
                           ? this._connectionCallback
                              ? this._connectionCallback(n)
                              : this._handleErrorEvent(n)
                           : this._connectionError || this._handleErrorEvent(n)),
                     f.nextTick(() => {
                        this.emit("end");
                     });
               });
         }
         connect(e) {
            if (e) {
               this._connect(e);
               return;
            }
            return new this._Promise((t, s) => {
               this._connect(n => {
                  n ? s(n) : t();
               });
            });
         }
         _attachListeners(e) {
            e.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)),
               e.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)),
               e.on("authenticationSASL", this._handleAuthSASL.bind(this)),
               e.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)),
               e.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)),
               e.on("backendKeyData", this._handleBackendKeyData.bind(this)),
               e.on("error", this._handleErrorEvent.bind(this)),
               e.on("errorMessage", this._handleErrorMessage.bind(this)),
               e.on("readyForQuery", this._handleReadyForQuery.bind(this)),
               e.on("notice", this._handleNotice.bind(this)),
               e.on("rowDescription", this._handleRowDescription.bind(this)),
               e.on("dataRow", this._handleDataRow.bind(this)),
               e.on("portalSuspended", this._handlePortalSuspended.bind(this)),
               e.on("emptyQuery", this._handleEmptyQuery.bind(this)),
               e.on("commandComplete", this._handleCommandComplete.bind(this)),
               e.on("parseComplete", this._handleParseComplete.bind(this)),
               e.on("copyInResponse", this._handleCopyInResponse.bind(this)),
               e.on("copyData", this._handleCopyData.bind(this)),
               e.on("notification", this._handleNotification.bind(this));
         }
         _checkPgPass(e) {
            let t = this.connection;
            if (typeof this.password == "function")
               this._Promise
                  .resolve()
                  .then(() => this.password())
                  .then(s => {
                     if (s !== void 0) {
                        if (typeof s != "string") {
                           t.emit("error", new TypeError("Password must be a string"));
                           return;
                        }
                        this.connectionParameters.password = this.password = s;
                     } else this.connectionParameters.password = this.password = null;
                     e();
                  })
                  .catch(s => {
                     t.emit("error", s);
                  });
            else if (this.password !== null) e();
            else
               try {
                  ds()(this.connectionParameters, n => {
                     n !== void 0 && (this.connectionParameters.password = this.password = n), e();
                  });
               } catch (s) {
                  this.emit("error", s);
               }
         }
         _handleAuthCleartextPassword(e) {
            this._checkPgPass(() => {
               this.connection.password(this.password);
            });
         }
         _handleAuthMD5Password(e) {
            this._checkPgPass(async () => {
               try {
                  let t = await oa.postgresMd5PasswordHash(this.user, this.password, e.salt);
                  this.connection.password(t);
               } catch (t) {
                  this.emit("error", t);
               }
            });
         }
         _handleAuthSASL(e) {
            this._checkPgPass(() => {
               try {
                  (this.saslSession = Ot.startSession(e.mechanisms)),
                     this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
               } catch (t) {
                  this.connection.emit("error", t);
               }
            });
         }
         async _handleAuthSASLContinue(e) {
            try {
               await Ot.continueSession(this.saslSession, this.password, e.data),
                  this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
            } catch (t) {
               this.connection.emit("error", t);
            }
         }
         _handleAuthSASLFinal(e) {
            try {
               Ot.finalizeSession(this.saslSession, e.data), (this.saslSession = null);
            } catch (t) {
               this.connection.emit("error", t);
            }
         }
         _handleBackendKeyData(e) {
            (this.processID = e.processID), (this.secretKey = e.secretKey);
         }
         _handleReadyForQuery(e) {
            this._connecting &&
               ((this._connecting = false),
               (this._connected = true),
               clearTimeout(this.connectionTimeoutHandle),
               this._connectionCallback && (this._connectionCallback(null, this), (this._connectionCallback = null)),
               this.emit("connect"));
            let { activeQuery: t } = this;
            (this.activeQuery = null),
               (this.readyForQuery = true),
               t && t.handleReadyForQuery(this.connection),
               this._pulseQueryQueue();
         }
         _handleErrorWhileConnecting(e) {
            if (!this._connectionError) {
               if (((this._connectionError = true), clearTimeout(this.connectionTimeoutHandle), this._connectionCallback))
                  return this._connectionCallback(e);
               this.emit("error", e);
            }
         }
         _handleErrorEvent(e) {
            if (this._connecting) return this._handleErrorWhileConnecting(e);
            (this._queryable = false), this._errorAllQueries(e), this.emit("error", e);
         }
         _handleErrorMessage(e) {
            if (this._connecting) return this._handleErrorWhileConnecting(e);
            let t = this.activeQuery;
            if (!t) {
               this._handleErrorEvent(e);
               return;
            }
            (this.activeQuery = null), t.handleError(e, this.connection);
         }
         _handleRowDescription(e) {
            this.activeQuery.handleRowDescription(e);
         }
         _handleDataRow(e) {
            this.activeQuery.handleDataRow(e);
         }
         _handlePortalSuspended(e) {
            this.activeQuery.handlePortalSuspended(this.connection);
         }
         _handleEmptyQuery(e) {
            this.activeQuery.handleEmptyQuery(this.connection);
         }
         _handleCommandComplete(e) {
            this.activeQuery.handleCommandComplete(e, this.connection);
         }
         _handleParseComplete(e) {
            this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text);
         }
         _handleCopyInResponse(e) {
            this.activeQuery.handleCopyInResponse(this.connection);
         }
         _handleCopyData(e) {
            this.activeQuery.handleCopyData(e, this.connection);
         }
         _handleNotification(e) {
            this.emit("notification", e);
         }
         _handleNotice(e) {
            this.emit("notice", e);
         }
         getStartupConf() {
            var e = this.connectionParameters,
               t = { user: e.user, database: e.database },
               s = e.application_name || e.fallback_application_name;
            return (
               s && (t.application_name = s),
               e.replication && (t.replication = "" + e.replication),
               e.statement_timeout && (t.statement_timeout = String(parseInt(e.statement_timeout, 10))),
               e.lock_timeout && (t.lock_timeout = String(parseInt(e.lock_timeout, 10))),
               e.idle_in_transaction_session_timeout &&
                  (t.idle_in_transaction_session_timeout = String(parseInt(e.idle_in_transaction_session_timeout, 10))),
               e.options && (t.options = e.options),
               t
            );
         }
         cancel(e, t) {
            if (e.activeQuery === t) {
               var s = this.connection;
               this.host && this.host.indexOf("/") === 0
                  ? s.connect(this.host + "/.s.PGSQL." + this.port)
                  : s.connect(this.port, this.host),
                  s.on("connect", function () {
                     s.cancel(e.processID, e.secretKey);
                  });
            } else e.queryQueue.indexOf(t) !== -1 && e.queryQueue.splice(e.queryQueue.indexOf(t), 1);
         }
         setTypeParser(e, t, s) {
            return this._types.setTypeParser(e, t, s);
         }
         getTypeParser(e, t) {
            return this._types.getTypeParser(e, t);
         }
         escapeIdentifier(e) {
            return ps.escapeIdentifier(e);
         }
         escapeLiteral(e) {
            return ps.escapeLiteral(e);
         }
         _pulseQueryQueue() {
            if (this.readyForQuery === true)
               if (((this.activeQuery = this.queryQueue.shift()), this.activeQuery)) {
                  (this.readyForQuery = false), (this.hasExecuted = true);
                  let e = this.activeQuery.submit(this.connection);
                  e &&
                     f.nextTick(() => {
                        this.activeQuery.handleError(e, this.connection), (this.readyForQuery = true), this._pulseQueryQueue();
                     });
               } else this.hasExecuted && ((this.activeQuery = null), this.emit("drain"));
         }
         query(e, t, s) {
            var n, i, a, l, p;
            if (e == null) throw new TypeError("Client was passed a null or undefined query");
            return (
               typeof e.submit == "function"
                  ? ((a = e.query_timeout || this.connectionParameters.query_timeout),
                    (i = n = e),
                    typeof t == "function" && (n.callback = n.callback || t))
                  : ((a = this.connectionParameters.query_timeout),
                    (n = new ms(e, t, s)),
                    n.callback ||
                       (i = new this._Promise((d, w) => {
                          n.callback = (S, b) => (S ? w(S) : d(b));
                       }).catch(d => {
                          throw (Error.captureStackTrace(d), d);
                       }))),
               a &&
                  ((p = n.callback),
                  (l = setTimeout(() => {
                     var d = new Error("Query read timeout");
                     f.nextTick(() => {
                        n.handleError(d, this.connection);
                     }),
                        p(d),
                        (n.callback = () => {});
                     var w = this.queryQueue.indexOf(n);
                     w > -1 && this.queryQueue.splice(w, 1), this._pulseQueryQueue();
                  }, a)),
                  (n.callback = (d, w) => {
                     clearTimeout(l), p(d, w);
                  })),
               this.binary && !n.binary && (n.binary = true),
               n._result && !n._result._types && (n._result._types = this._types),
               this._queryable
                  ? this._ending
                     ? (f.nextTick(() => {
                          n.handleError(new Error("Client was closed and is not queryable"), this.connection);
                       }),
                       i)
                     : (this.queryQueue.push(n), this._pulseQueryQueue(), i)
                  : (f.nextTick(() => {
                       n.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
                    }),
                    i)
            );
         }
         ref() {
            this.connection.ref();
         }
         unref() {
            this.connection.unref();
         }
         end(e) {
            if (((this._ending = true), !this.connection._connecting || this._ended))
               if (e) e();
               else return this._Promise.resolve();
            if ((this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), e))
               this.connection.once("end", e);
            else
               return new this._Promise(t => {
                  this.connection.once("end", t);
               });
         }
      };
   Me.Query = ms;
   ys.exports = Me;
});
var Ss = v((Yc, vs) => {
   "use strict";
   o();
   u();
   c();
   var ua = (V(), T(k)).EventEmitter,
      _s = function () {},
      ws = (r, e) => {
         let t = r.findIndex(e);
         return t === -1 ? void 0 : r.splice(t, 1)[0];
      },
      qt = class {
         constructor(e, t, s) {
            (this.client = e), (this.idleListener = t), (this.timeoutId = s);
         }
      },
      ee = class {
         constructor(e) {
            this.callback = e;
         }
      };
   function ca() {
      throw new Error("Release called on client which has already been released to the pool.");
   }
   function Re(r, e) {
      if (e) return { callback: e, result: void 0 };
      let t,
         s,
         n = function (a, l) {
            a ? t(a) : s(l);
         },
         i = new r(function (a, l) {
            (s = a), (t = l);
         }).catch(a => {
            throw (Error.captureStackTrace(a), a);
         });
      return { callback: n, result: i };
   }
   function ha(r, e) {
      return function t(s) {
         (s.client = e),
            e.removeListener("error", t),
            e.on("error", () => {
               r.log("additional client error after disconnection due to error", s);
            }),
            r._remove(e),
            r.emit("error", s, e);
      };
   }
   var Ft = class extends ua {
      constructor(e, t) {
         super(),
            (this.options = Object.assign({}, e)),
            e != null &&
               "password" in e &&
               Object.defineProperty(this.options, "password", {
                  configurable: true,
                  enumerable: false,
                  writable: true,
                  value: e.password,
               }),
            e != null && e.ssl && e.ssl.key && Object.defineProperty(this.options.ssl, "key", { enumerable: false }),
            (this.options.max = this.options.max || this.options.poolSize || 10),
            (this.options.maxUses = this.options.maxUses || 1 / 0),
            (this.options.allowExitOnIdle = this.options.allowExitOnIdle || false),
            (this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0),
            (this.log = this.options.log || function () {}),
            (this.Client = this.options.Client || t || le().Client),
            (this.Promise = this.options.Promise || globalThis.Promise),
            typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4),
            (this._clients = []),
            (this._idle = []),
            (this._expired = /* @__PURE__ */ new WeakSet()),
            (this._pendingQueue = []),
            (this._endCallback = void 0),
            (this.ending = false),
            (this.ended = false);
      }
      _isFull() {
         return this._clients.length >= this.options.max;
      }
      _pulseQueue() {
         if ((this.log("pulse queue"), this.ended)) {
            this.log("pulse queue ended");
            return;
         }
         if (this.ending) {
            this.log("pulse queue on ending"),
               this._idle.length &&
                  this._idle.slice().map(t => {
                     this._remove(t.client);
                  }),
               this._clients.length || ((this.ended = true), this._endCallback());
            return;
         }
         if (!this._pendingQueue.length) {
            this.log("no queued requests");
            return;
         }
         if (!this._idle.length && this._isFull()) return;
         let e = this._pendingQueue.shift();
         if (this._idle.length) {
            let t = this._idle.pop();
            clearTimeout(t.timeoutId);
            let s = t.client;
            s.ref && s.ref();
            let n = t.idleListener;
            return this._acquireClient(s, e, n, false);
         }
         if (!this._isFull()) return this.newClient(e);
         throw new Error("unexpected condition");
      }
      _remove(e) {
         let t = ws(this._idle, s => s.client === e);
         t !== void 0 && clearTimeout(t.timeoutId),
            (this._clients = this._clients.filter(s => s !== e)),
            e.end(),
            this.emit("remove", e);
      }
      connect(e) {
         if (this.ending) {
            let n = new Error("Cannot use a pool after calling end on the pool");
            return e ? e(n) : this.Promise.reject(n);
         }
         let t = Re(this.Promise, e),
            s = t.result;
         if (this._isFull() || this._idle.length) {
            if ((this._idle.length && f.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis))
               return this._pendingQueue.push(new ee(t.callback)), s;
            let n = (l, p, d) => {
                  clearTimeout(a), t.callback(l, p, d);
               },
               i = new ee(n),
               a = setTimeout(() => {
                  ws(this._pendingQueue, l => l.callback === n),
                     (i.timedOut = true),
                     t.callback(new Error("timeout exceeded when trying to connect"));
               }, this.options.connectionTimeoutMillis);
            return this._pendingQueue.push(i), s;
         }
         return this.newClient(new ee(t.callback)), s;
      }
      newClient(e) {
         let t = new this.Client(this.options);
         this._clients.push(t);
         let s = ha(this, t);
         this.log("checking client timeout");
         let n,
            i = false;
         this.options.connectionTimeoutMillis &&
            (n = setTimeout(() => {
               this.log("ending client due to timeout"), (i = true), t.connection ? t.connection.stream.destroy() : t.end();
            }, this.options.connectionTimeoutMillis)),
            this.log("connecting new client"),
            t.connect(a => {
               if ((n && clearTimeout(n), t.on("error", s), a))
                  this.log("client failed to connect", a),
                     (this._clients = this._clients.filter(l => l !== t)),
                     i && (a.message = "Connection terminated due to connection timeout"),
                     this._pulseQueue(),
                     e.timedOut || e.callback(a, void 0, _s);
               else {
                  if ((this.log("new client connected"), this.options.maxLifetimeSeconds !== 0)) {
                     let l = setTimeout(() => {
                        this.log("ending client due to expired lifetime"),
                           this._expired.add(t),
                           this._idle.findIndex(d => d.client === t) !== -1 &&
                              this._acquireClient(t, new ee((d, w, S) => S()), s, false);
                     }, this.options.maxLifetimeSeconds * 1e3);
                     l.unref(), t.once("end", () => clearTimeout(l));
                  }
                  return this._acquireClient(t, e, s, true);
               }
            });
      }
      _acquireClient(e, t, s, n) {
         n && this.emit("connect", e),
            this.emit("acquire", e),
            (e.release = this._releaseOnce(e, s)),
            e.removeListener("error", s),
            t.timedOut
               ? n && this.options.verify
                  ? this.options.verify(e, e.release)
                  : e.release()
               : n && this.options.verify
                 ? this.options.verify(e, i => {
                      if (i) return e.release(i), t.callback(i, void 0, _s);
                      t.callback(void 0, e, e.release);
                   })
                 : t.callback(void 0, e, e.release);
      }
      _releaseOnce(e, t) {
         let s = false;
         return n => {
            s && ca(), (s = true), this._release(e, t, n);
         };
      }
      _release(e, t, s) {
         if (
            (e.on("error", t),
            (e._poolUseCount = (e._poolUseCount || 0) + 1),
            this.emit("release", s, e),
            s || this.ending || !e._queryable || e._ending || e._poolUseCount >= this.options.maxUses)
         ) {
            e._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(e), this._pulseQueue();
            return;
         }
         if (this._expired.has(e)) {
            this.log("remove expired client"), this._expired.delete(e), this._remove(e), this._pulseQueue();
            return;
         }
         let i;
         this.options.idleTimeoutMillis &&
            ((i = setTimeout(() => {
               this.log("remove idle client"), this._remove(e);
            }, this.options.idleTimeoutMillis)),
            this.options.allowExitOnIdle && i.unref()),
            this.options.allowExitOnIdle && e.unref(),
            this._idle.push(new qt(e, t, i)),
            this._pulseQueue();
      }
      query(e, t, s) {
         if (typeof e == "function") {
            let i = Re(this.Promise, e);
            return (
               setImmediate(function () {
                  return i.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
               }),
               i.result
            );
         }
         typeof t == "function" && ((s = t), (t = void 0));
         let n = Re(this.Promise, s);
         return (
            (s = n.callback),
            this.connect((i, a) => {
               if (i) return s(i);
               let l = false,
                  p = d => {
                     l || ((l = true), a.release(d), s(d));
                  };
               a.once("error", p), this.log("dispatching query");
               try {
                  a.query(e, t, (d, w) => {
                     if ((this.log("query dispatched"), a.removeListener("error", p), !l))
                        return (l = true), a.release(d), d ? s(d) : s(void 0, w);
                  });
               } catch (d) {
                  return a.release(d), s(d);
               }
            }),
            n.result
         );
      }
      end(e) {
         if ((this.log("ending"), this.ending)) {
            let s = new Error("Called end on pool more than once");
            return e ? e(s) : this.Promise.reject(s);
         }
         this.ending = true;
         let t = Re(this.Promise, e);
         return (this._endCallback = t.callback), this._pulseQueue(), t.result;
      }
      get waitingCount() {
         return this._pendingQueue.length;
      }
      get idleCount() {
         return this._idle.length;
      }
      get expiredCount() {
         return this._clients.reduce((e, t) => e + (this._expired.has(t) ? 1 : 0), 0);
      }
      get totalCount() {
         return this._clients.length;
      }
   };
   vs.exports = Ft;
});
var Bt = v(() => {
   "use strict";
   o();
   u();
   c();
});
var le = v((ih, fe) => {
   "use strict";
   o();
   u();
   c();
   var la = gs(),
      fa = ue(),
      da = Mt(),
      pa = Ss(),
      { DatabaseError: ma } = xt(),
      { escapeIdentifier: ya, escapeLiteral: ga } = _e(),
      _a2 = r =>
         class extends pa {
            constructor(t) {
               super(t, r);
            }
         },
      Qt = function (r) {
         (this.defaults = fa),
            (this.Client = r),
            (this.Query = this.Client.Query),
            (this.Pool = _a2(this.Client)),
            (this._pools = []),
            (this.Connection = da),
            (this.types = oe()),
            (this.DatabaseError = ma),
            (this.escapeIdentifier = ya),
            (this.escapeLiteral = ga);
      };
   typeof f.env.NODE_PG_FORCE_NATIVE < "u"
      ? (fe.exports = new Qt(Bt()))
      : ((fe.exports = new Qt(la)),
        Object.defineProperty(fe.exports, "native", {
           configurable: true,
           enumerable: false,
           get() {
              var r = null;
              try {
                 r = new Qt(Bt());
              } catch (e) {
                 if (e.code !== "MODULE_NOT_FOUND") throw e;
              }
              return Object.defineProperty(fe.exports, "native", { value: r }), r;
           },
        }));
});
var F = {};
De(F, { Client: () => te.Client, Pool: () => te.Pool, default: () => va, types: () => te.types });
o();
u();
c();
var wa = Le(le());
_(F, Le(le()));
var te = Le(le());
var va = wa;
var export_Client = te.Client;
var export_Pool = te.Pool;
var export_types = te.types;

// ../../node_modules/@prisma/adapter-pg-worker/dist/index.mjs
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/@prisma/driver-adapter-utils/dist/index.mjs
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_debug = __toESM(require_dist2(), 1);
function ok(value) {
   return {
      ok: true,
      value,
      map(fn) {
         return ok(fn(value));
      },
      flatMap(fn) {
         return fn(value);
      },
   };
}
function err(error2) {
   return {
      ok: false,
      error: error2,
      map() {
         return err(error2);
      },
      flatMap() {
         return err(error2);
      },
   };
}
var ColumnTypeEnum = {
   // Scalars
   Int32: 0,
   Int64: 1,
   Float: 2,
   Double: 3,
   Numeric: 4,
   Boolean: 5,
   Character: 6,
   Text: 7,
   Date: 8,
   Time: 9,
   DateTime: 10,
   Json: 11,
   Enum: 12,
   Bytes: 13,
   Set: 14,
   Uuid: 15,
   // Arrays
   Int32Array: 64,
   Int64Array: 65,
   FloatArray: 66,
   DoubleArray: 67,
   NumericArray: 68,
   BooleanArray: 69,
   CharacterArray: 70,
   TextArray: 71,
   DateArray: 72,
   TimeArray: 73,
   DateTimeArray: 74,
   JsonArray: 75,
   EnumArray: 76,
   BytesArray: 77,
   UuidArray: 78,
   // Custom
   UnknownNumber: 128,
};

// ../../node_modules/@prisma/adapter-pg-worker/dist/index.mjs
var import_postgres_array = __toESM(require_postgres_array(), 1);
var name = "@prisma/adapter-pg-worker";
var { types } = dist_exports;
var { builtins: ScalarColumnType, getTypeParser } = types;
var ArrayColumnType = {
   BIT_ARRAY: 1561,
   BOOL_ARRAY: 1e3,
   BYTEA_ARRAY: 1001,
   BPCHAR_ARRAY: 1014,
   CHAR_ARRAY: 1002,
   CIDR_ARRAY: 651,
   DATE_ARRAY: 1182,
   FLOAT4_ARRAY: 1021,
   FLOAT8_ARRAY: 1022,
   INET_ARRAY: 1041,
   INT2_ARRAY: 1005,
   INT4_ARRAY: 1007,
   INT8_ARRAY: 1016,
   JSONB_ARRAY: 3807,
   JSON_ARRAY: 199,
   MONEY_ARRAY: 791,
   NUMERIC_ARRAY: 1231,
   OID_ARRAY: 1028,
   TEXT_ARRAY: 1009,
   TIMESTAMP_ARRAY: 1115,
   TIME_ARRAY: 1183,
   UUID_ARRAY: 2951,
   VARBIT_ARRAY: 1563,
   VARCHAR_ARRAY: 1015,
   XML_ARRAY: 143,
};
var _UnsupportedNativeDataType = class _UnsupportedNativeDataType2 extends Error {
   constructor(code) {
      super();
      this.type = _UnsupportedNativeDataType2.typeNames[code] || "Unknown";
      this.message = `Unsupported column type ${this.type}`;
   }
};
_UnsupportedNativeDataType.typeNames = {
   16: "bool",
   17: "bytea",
   18: "char",
   19: "name",
   20: "int8",
   21: "int2",
   22: "int2vector",
   23: "int4",
   24: "regproc",
   25: "text",
   26: "oid",
   27: "tid",
   28: "xid",
   29: "cid",
   30: "oidvector",
   32: "pg_ddl_command",
   71: "pg_type",
   75: "pg_attribute",
   81: "pg_proc",
   83: "pg_class",
   114: "json",
   142: "xml",
   194: "pg_node_tree",
   269: "table_am_handler",
   325: "index_am_handler",
   600: "point",
   601: "lseg",
   602: "path",
   603: "box",
   604: "polygon",
   628: "line",
   650: "cidr",
   700: "float4",
   701: "float8",
   705: "unknown",
   718: "circle",
   774: "macaddr8",
   790: "money",
   829: "macaddr",
   869: "inet",
   1033: "aclitem",
   1042: "bpchar",
   1043: "varchar",
   1082: "date",
   1083: "time",
   1114: "timestamp",
   1184: "timestamptz",
   1186: "interval",
   1266: "timetz",
   1560: "bit",
   1562: "varbit",
   1700: "numeric",
   1790: "refcursor",
   2202: "regprocedure",
   2203: "regoper",
   2204: "regoperator",
   2205: "regclass",
   2206: "regtype",
   2249: "record",
   2275: "cstring",
   2276: "any",
   2277: "anyarray",
   2278: "void",
   2279: "trigger",
   2280: "language_handler",
   2281: "internal",
   2283: "anyelement",
   2287: "_record",
   2776: "anynonarray",
   2950: "uuid",
   2970: "txid_snapshot",
   3115: "fdw_handler",
   3220: "pg_lsn",
   3310: "tsm_handler",
   3361: "pg_ndistinct",
   3402: "pg_dependencies",
   3500: "anyenum",
   3614: "tsvector",
   3615: "tsquery",
   3642: "gtsvector",
   3734: "regconfig",
   3769: "regdictionary",
   3802: "jsonb",
   3831: "anyrange",
   3838: "event_trigger",
   3904: "int4range",
   3906: "numrange",
   3908: "tsrange",
   3910: "tstzrange",
   3912: "daterange",
   3926: "int8range",
   4072: "jsonpath",
   4089: "regnamespace",
   4096: "regrole",
   4191: "regcollation",
   4451: "int4multirange",
   4532: "nummultirange",
   4533: "tsmultirange",
   4534: "tstzmultirange",
   4535: "datemultirange",
   4536: "int8multirange",
   4537: "anymultirange",
   4538: "anycompatiblemultirange",
   4600: "pg_brin_bloom_summary",
   4601: "pg_brin_minmax_multi_summary",
   5017: "pg_mcv_list",
   5038: "pg_snapshot",
   5069: "xid8",
   5077: "anycompatible",
   5078: "anycompatiblearray",
   5079: "anycompatiblenonarray",
   5080: "anycompatiblerange",
};
var UnsupportedNativeDataType = _UnsupportedNativeDataType;
function fieldToColumnType(fieldTypeId) {
   switch (fieldTypeId) {
      case ScalarColumnType.INT2:
      case ScalarColumnType.INT4:
         return ColumnTypeEnum.Int32;
      case ScalarColumnType.INT8:
         return ColumnTypeEnum.Int64;
      case ScalarColumnType.FLOAT4:
         return ColumnTypeEnum.Float;
      case ScalarColumnType.FLOAT8:
         return ColumnTypeEnum.Double;
      case ScalarColumnType.BOOL:
         return ColumnTypeEnum.Boolean;
      case ScalarColumnType.DATE:
         return ColumnTypeEnum.Date;
      case ScalarColumnType.TIME:
      case ScalarColumnType.TIMETZ:
         return ColumnTypeEnum.Time;
      case ScalarColumnType.TIMESTAMP:
      case ScalarColumnType.TIMESTAMPTZ:
         return ColumnTypeEnum.DateTime;
      case ScalarColumnType.NUMERIC:
      case ScalarColumnType.MONEY:
         return ColumnTypeEnum.Numeric;
      case ScalarColumnType.JSON:
      case ScalarColumnType.JSONB:
         return ColumnTypeEnum.Json;
      case ScalarColumnType.UUID:
         return ColumnTypeEnum.Uuid;
      case ScalarColumnType.OID:
         return ColumnTypeEnum.Int64;
      case ScalarColumnType.BPCHAR:
      case ScalarColumnType.TEXT:
      case ScalarColumnType.VARCHAR:
      case ScalarColumnType.BIT:
      case ScalarColumnType.VARBIT:
      case ScalarColumnType.INET:
      case ScalarColumnType.CIDR:
      case ScalarColumnType.XML:
         return ColumnTypeEnum.Text;
      case ScalarColumnType.BYTEA:
         return ColumnTypeEnum.Bytes;
      case ArrayColumnType.INT2_ARRAY:
      case ArrayColumnType.INT4_ARRAY:
         return ColumnTypeEnum.Int32Array;
      case ArrayColumnType.FLOAT4_ARRAY:
         return ColumnTypeEnum.FloatArray;
      case ArrayColumnType.FLOAT8_ARRAY:
         return ColumnTypeEnum.DoubleArray;
      case ArrayColumnType.NUMERIC_ARRAY:
      case ArrayColumnType.MONEY_ARRAY:
         return ColumnTypeEnum.NumericArray;
      case ArrayColumnType.BOOL_ARRAY:
         return ColumnTypeEnum.BooleanArray;
      case ArrayColumnType.CHAR_ARRAY:
         return ColumnTypeEnum.CharacterArray;
      case ArrayColumnType.BPCHAR_ARRAY:
      case ArrayColumnType.TEXT_ARRAY:
      case ArrayColumnType.VARCHAR_ARRAY:
      case ArrayColumnType.VARBIT_ARRAY:
      case ArrayColumnType.BIT_ARRAY:
      case ArrayColumnType.INET_ARRAY:
      case ArrayColumnType.CIDR_ARRAY:
      case ArrayColumnType.XML_ARRAY:
         return ColumnTypeEnum.TextArray;
      case ArrayColumnType.DATE_ARRAY:
         return ColumnTypeEnum.DateArray;
      case ArrayColumnType.TIME_ARRAY:
         return ColumnTypeEnum.TimeArray;
      case ArrayColumnType.TIMESTAMP_ARRAY:
         return ColumnTypeEnum.DateTimeArray;
      case ArrayColumnType.JSON_ARRAY:
      case ArrayColumnType.JSONB_ARRAY:
         return ColumnTypeEnum.JsonArray;
      case ArrayColumnType.BYTEA_ARRAY:
         return ColumnTypeEnum.BytesArray;
      case ArrayColumnType.UUID_ARRAY:
         return ColumnTypeEnum.UuidArray;
      case ArrayColumnType.INT8_ARRAY:
      case ArrayColumnType.OID_ARRAY:
         return ColumnTypeEnum.Int64Array;
      default:
         if (fieldTypeId >= 1e4) {
            return ColumnTypeEnum.Text;
         }
         throw new UnsupportedNativeDataType(fieldTypeId);
   }
}
function normalize_array(element_normalizer) {
   return str => (0, import_postgres_array.parse)(str, element_normalizer);
}
function normalize_numeric(numeric) {
   return numeric;
}
function normalize_date(date) {
   return date;
}
function normalize_timestamp(time) {
   return time;
}
function normalize_timestampz(time) {
   return time.split("+")[0];
}
function normalize_time(time) {
   return time;
}
function normalize_timez(time) {
   return time.split("+")[0];
}
function normalize_money(money) {
   return money.slice(1);
}
function toJson(json) {
   return json;
}
function encodeBuffer(buffer) {
   return Array.from(new Uint8Array(buffer));
}
var parsePgBytes = getTypeParser(ScalarColumnType.BYTEA);
var parseBytesArray = getTypeParser(ArrayColumnType.BYTEA_ARRAY);
function normalizeByteaArray(serializedBytesArray) {
   const buffers = parseBytesArray(serializedBytesArray);
   return buffers.map(buf => (buf ? encodeBuffer(buf) : null));
}
function convertBytes(serializedBytes) {
   const buffer = parsePgBytes(serializedBytes);
   return encodeBuffer(buffer);
}
function normalizeBit(bit) {
   return bit;
}
var customParsers = {
   [ScalarColumnType.NUMERIC]: normalize_numeric,
   [ArrayColumnType.NUMERIC_ARRAY]: normalize_array(normalize_numeric),
   [ScalarColumnType.TIME]: normalize_time,
   [ArrayColumnType.TIME_ARRAY]: normalize_array(normalize_time),
   [ScalarColumnType.TIMETZ]: normalize_timez,
   [ScalarColumnType.DATE]: normalize_date,
   [ArrayColumnType.DATE_ARRAY]: normalize_array(normalize_date),
   [ScalarColumnType.TIMESTAMP]: normalize_timestamp,
   [ArrayColumnType.TIMESTAMP_ARRAY]: normalize_array(normalize_timestamp),
   [ScalarColumnType.TIMESTAMPTZ]: normalize_timestampz,
   [ScalarColumnType.MONEY]: normalize_money,
   [ArrayColumnType.MONEY_ARRAY]: normalize_array(normalize_money),
   [ScalarColumnType.JSON]: toJson,
   [ScalarColumnType.JSONB]: toJson,
   [ScalarColumnType.BYTEA]: convertBytes,
   [ArrayColumnType.BYTEA_ARRAY]: normalizeByteaArray,
   [ArrayColumnType.BIT_ARRAY]: normalize_array(normalizeBit),
   [ArrayColumnType.VARBIT_ARRAY]: normalize_array(normalizeBit),
};
function fixArrayBufferValues(values) {
   for (let i = 0; i < values.length; i++) {
      const list = values[i];
      if (!Array.isArray(list)) {
         continue;
      }
      for (let j = 0; j < list.length; j++) {
         const listItem = list[j];
         if (ArrayBuffer.isView(listItem)) {
            list[j] = Buffer2.from(listItem.buffer, listItem.byteOffset, listItem.byteLength);
         }
      }
   }
   return values;
}
var types3 = export_types;
var debug2 = (0, import_debug.Debug)("prisma:driver-adapter:pg");
var PgQueryable = class {
   constructor(client) {
      this.client = client;
      this.provider = "postgres";
      this.adapterName = name;
   }
   /**
    * Execute a query given as SQL, interpolating the given parameters.
    */
   async queryRaw(query) {
      const tag2 = "[js::query_raw]";
      debug2(`${tag2} %O`, query);
      const res = await this.performIO(query);
      if (!res.ok) {
         return err(res.error);
      }
      const { fields, rows } = res.value;
      const columnNames = fields.map(field => field.name);
      let columnTypes = [];
      try {
         columnTypes = fields.map(field => fieldToColumnType(field.dataTypeID));
      } catch (e) {
         if (e instanceof UnsupportedNativeDataType) {
            return err({
               kind: "UnsupportedNativeDataType",
               type: e.type,
            });
         }
         throw e;
      }
      return ok({
         columnNames,
         columnTypes,
         rows,
      });
   }
   /**
    * Execute a query given as SQL, interpolating the given parameters and
    * returning the number of affected rows.
    * Note: Queryable expects a u64, but napi.rs only supports u32.
    */
   async executeRaw(query) {
      const tag2 = "[js::execute_raw]";
      debug2(`${tag2} %O`, query);
      return (await this.performIO(query)).map(({ rowCount: rowsAffected }) => rowsAffected ?? 0);
   }
   /**
    * Run a query against the database, returning the result set.
    * Should the query fail due to a connection error, the connection is
    * marked as unhealthy.
    */
   async performIO(query) {
      const { sql, args: values } = query;
      try {
         const result = await this.client.query(
            {
               text: sql,
               values: fixArrayBufferValues(values),
               rowMode: "array",
               types: {
                  // This is the error expected:
                  // No overload matches this call.
                  // The last overload gave the following error.
                  // Type '(oid: number, format?: any) => (json: string) => unknown' is not assignable to type '{ <T>(oid: number): TypeParser<string, string | T>; <T>(oid: number, format: "text"): TypeParser<string, string | T>; <T>(oid: number, format: "binary"): TypeParser<...>; }'.
                  //   Type '(json: string) => unknown' is not assignable to type 'TypeParser<Buffer, any>'.
                  //     Types of parameters 'json' and 'value' are incompatible.
                  //       Type 'Buffer' is not assignable to type 'string'.ts(2769)
                  //
                  // Because pg-types types expect us to handle both binary and text protocol versions,
                  // where as far we can see, pg will ever pass only text version.
                  //
                  // @ts-expect-error
                  getTypeParser: (oid, format2) => {
                     if (format2 === "text" && customParsers[oid]) {
                        return customParsers[oid];
                     }
                     return types3.getTypeParser(oid, format2);
                  },
               },
            },
            fixArrayBufferValues(values),
         );
         return ok(result);
      } catch (e) {
         const error2 = e;
         debug2("Error in performIO: %O", error2);
         if (e && typeof e.code === "string" && typeof e.severity === "string" && typeof e.message === "string") {
            return err({
               kind: "Postgres",
               code: e.code,
               severity: e.severity,
               message: e.message,
               detail: e.detail,
               column: e.column,
               hint: e.hint,
            });
         }
         throw error2;
      }
   }
};
var PgTransaction = class extends PgQueryable {
   constructor(client, options) {
      super(client);
      this.options = options;
   }
   async commit() {
      debug2(`[js::commit]`);
      this.client.release();
      return ok(void 0);
   }
   async rollback() {
      debug2(`[js::rollback]`);
      this.client.release();
      return ok(void 0);
   }
};
var PrismaPg = class extends PgQueryable {
   constructor(client, options) {
      if (!(client instanceof export_Pool)) {
         throw new TypeError(`PrismaPg must be initialized with an instance of Pool:
import { Pool } from 'pg'
const pool = new Pool({ connectionString: url })
const adapter = new PrismaPg(pool)
`);
      }
      super(client);
      this.options = options;
   }
   getConnectionInfo() {
      return ok({
         schemaName: this.options?.schema,
      });
   }
   async startTransaction() {
      const options = {
         usePhantomQuery: false,
      };
      const tag2 = "[js::startTransaction]";
      debug2(`${tag2} options: %O`, options);
      const connection = await this.client.connect();
      return ok(new PgTransaction(connection, options));
   }
};

// src/db/index.ts
var connectionString = `${process.env.DATABASE_URL}`;
var pool = new export_Pool({ connectionString });
var adapter = new PrismaPg(pool);
var prismaBase = new import_client7.PrismaClient({ adapter }).$extends({
   model: {
      $allModels: {
         async exists(where) {
            const context = import_client7.Prisma.getExtensionContext(this);
            const result = await context.findFirst({ where });
            return result !== null;
         },
      },
   },
});
var prisma = prismaBase
   .$extends(auth_default)
   .$extends(user_default)
   .$extends(channel_default)
   .$extends(message_default)
   .$extends(relationship_default);

// src/factory/error-factory.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var ErrorFactory = class {
   message;
   code;
   errors = {};
   constructor(message2, code) {
      this.message = message2;
      this.code = code;
   }
   errorRaw(name2, message2, code) {
      if (!this.errors[name2]) {
         this.errors[name2] = { _errors: [] };
      }
      this.errors[name2]._errors.push({ code, message: message2 });
      return this;
   }
   addError(name2, field) {
      return this.errorRaw(name2, field[0], field[1]);
   }
   toObject() {
      return {
         message: this.message,
         code: this.code,
         errors: this.hasErrors() ? this.errors : void 0,
      };
   }
   hasErrors() {
      return Object.keys(this.errors).length !== 0;
   }
};
function createErrorRaw(message2, code) {
   const factory = new ErrorFactory(message2, code);
   return factory;
}
function createError(error2) {
   return createErrorRaw(error2[0], error2[1]);
}

// src/gateway/server-gateway.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/consola/dist/browser.mjs
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/consola/dist/core.mjs
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var LogLevels = {
   silent: Number.NEGATIVE_INFINITY,
   fatal: 0,
   error: 0,
   warn: 1,
   log: 2,
   info: 3,
   success: 3,
   fail: 3,
   ready: 3,
   start: 3,
   box: 3,
   debug: 4,
   trace: 5,
   verbose: Number.POSITIVE_INFINITY,
};
var LogTypes = {
   // Silent
   silent: {
      level: -1,
   },
   // Level 0
   fatal: {
      level: LogLevels.fatal,
   },
   error: {
      level: LogLevels.error,
   },
   // Level 1
   warn: {
      level: LogLevels.warn,
   },
   // Level 2
   log: {
      level: LogLevels.log,
   },
   // Level 3
   info: {
      level: LogLevels.info,
   },
   success: {
      level: LogLevels.success,
   },
   fail: {
      level: LogLevels.fail,
   },
   ready: {
      level: LogLevels.info,
   },
   start: {
      level: LogLevels.info,
   },
   box: {
      level: LogLevels.info,
   },
   // Level 4
   debug: {
      level: LogLevels.debug,
   },
   // Level 5
   trace: {
      level: LogLevels.trace,
   },
   // Verbose
   verbose: {
      level: LogLevels.verbose,
   },
};
function isObject3(value) {
   return value !== null && typeof value === "object";
}
function _defu(baseObject, defaults, namespace = ".", merger) {
   if (!isObject3(defaults)) {
      return _defu(baseObject, {}, namespace, merger);
   }
   const object = Object.assign({}, defaults);
   for (const key in baseObject) {
      if (key === "__proto__" || key === "constructor") {
         continue;
      }
      const value = baseObject[key];
      if (value === null || value === void 0) {
         continue;
      }
      if (merger && merger(object, key, value, namespace)) {
         continue;
      }
      if (Array.isArray(value) && Array.isArray(object[key])) {
         object[key] = [...value, ...object[key]];
      } else if (isObject3(value) && isObject3(object[key])) {
         object[key] = _defu(value, object[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
      } else {
         object[key] = value;
      }
   }
   return object;
}
function createDefu(merger) {
   return (...arguments_) =>
      // eslint-disable-next-line unicorn/no-array-reduce
      arguments_.reduce((p, c2) => _defu(p, c2, "", merger), {});
}
var defu = createDefu();
function isPlainObject(obj) {
   return Object.prototype.toString.call(obj) === "[object Object]";
}
function isLogObj(arg) {
   if (!isPlainObject(arg)) {
      return false;
   }
   if (!arg.message && !arg.args) {
      return false;
   }
   if (arg.stack) {
      return false;
   }
   return true;
}
var paused = false;
var queue3 = [];
var Consola = class {
   constructor(options = {}) {
      const types4 = options.types || LogTypes;
      this.options = defu(
         {
            ...options,
            defaults: { ...options.defaults },
            level: _normalizeLogLevel(options.level, types4),
            reporters: [...(options.reporters || [])],
         },
         {
            types: LogTypes,
            throttle: 1e3,
            throttleMin: 5,
            formatOptions: {
               date: true,
               colors: false,
               compact: true,
            },
         },
      );
      for (const type in types4) {
         const defaults = {
            type,
            ...this.options.defaults,
            ...types4[type],
         };
         this[type] = this._wrapLogFn(defaults);
         this[type].raw = this._wrapLogFn(defaults, true);
      }
      if (this.options.mockFn) {
         this.mockTypes();
      }
      this._lastLog = {};
   }
   get level() {
      return this.options.level;
   }
   set level(level) {
      this.options.level = _normalizeLogLevel(level, this.options.types, this.options.level);
   }
   prompt(message2, opts) {
      if (!this.options.prompt) {
         throw new Error("prompt is not supported!");
      }
      return this.options.prompt(message2, opts);
   }
   create(options) {
      const instance = new Consola({
         ...this.options,
         ...options,
      });
      if (this._mockFn) {
         instance.mockTypes(this._mockFn);
      }
      return instance;
   }
   withDefaults(defaults) {
      return this.create({
         ...this.options,
         defaults: {
            ...this.options.defaults,
            ...defaults,
         },
      });
   }
   withTag(tag2) {
      return this.withDefaults({
         tag: this.options.defaults.tag ? this.options.defaults.tag + ":" + tag2 : tag2,
      });
   }
   addReporter(reporter) {
      this.options.reporters.push(reporter);
      return this;
   }
   removeReporter(reporter) {
      if (reporter) {
         const i = this.options.reporters.indexOf(reporter);
         if (i >= 0) {
            return this.options.reporters.splice(i, 1);
         }
      } else {
         this.options.reporters.splice(0);
      }
      return this;
   }
   setReporters(reporters) {
      this.options.reporters = Array.isArray(reporters) ? reporters : [reporters];
      return this;
   }
   wrapAll() {
      this.wrapConsole();
      this.wrapStd();
   }
   restoreAll() {
      this.restoreConsole();
      this.restoreStd();
   }
   wrapConsole() {
      for (const type in this.options.types) {
         if (!console["__" + type]) {
            console["__" + type] = console[type];
         }
         console[type] = this[type].raw;
      }
   }
   restoreConsole() {
      for (const type in this.options.types) {
         if (console["__" + type]) {
            console[type] = console["__" + type];
            delete console["__" + type];
         }
      }
   }
   wrapStd() {
      this._wrapStream(this.options.stdout, "log");
      this._wrapStream(this.options.stderr, "log");
   }
   _wrapStream(stream, type) {
      if (!stream) {
         return;
      }
      if (!stream.__write) {
         stream.__write = stream.write;
      }
      stream.write = data => {
         this[type].raw(String(data).trim());
      };
   }
   restoreStd() {
      this._restoreStream(this.options.stdout);
      this._restoreStream(this.options.stderr);
   }
   _restoreStream(stream) {
      if (!stream) {
         return;
      }
      if (stream.__write) {
         stream.write = stream.__write;
         delete stream.__write;
      }
   }
   pauseLogs() {
      paused = true;
   }
   resumeLogs() {
      paused = false;
      const _queue = queue3.splice(0);
      for (const item of _queue) {
         item[0]._logFn(item[1], item[2]);
      }
   }
   mockTypes(mockFn) {
      const _mockFn = mockFn || this.options.mockFn;
      this._mockFn = _mockFn;
      if (typeof _mockFn !== "function") {
         return;
      }
      for (const type in this.options.types) {
         this[type] = _mockFn(type, this.options.types[type]) || this[type];
         this[type].raw = this[type];
      }
   }
   _wrapLogFn(defaults, isRaw) {
      return (...args) => {
         if (paused) {
            queue3.push([this, defaults, args, isRaw]);
            return;
         }
         return this._logFn(defaults, args, isRaw);
      };
   }
   _logFn(defaults, args, isRaw) {
      if ((defaults.level || 0) > this.level) {
         return false;
      }
      const logObj = {
         date: /* @__PURE__ */ new Date(),
         args: [],
         ...defaults,
         level: _normalizeLogLevel(defaults.level, this.options.types),
      };
      if (!isRaw && args.length === 1 && isLogObj(args[0])) {
         Object.assign(logObj, args[0]);
      } else {
         logObj.args = [...args];
      }
      if (logObj.message) {
         logObj.args.unshift(logObj.message);
         delete logObj.message;
      }
      if (logObj.additional) {
         if (!Array.isArray(logObj.additional)) {
            logObj.additional = logObj.additional.split("\n");
         }
         logObj.args.push("\n" + logObj.additional.join("\n"));
         delete logObj.additional;
      }
      logObj.type = typeof logObj.type === "string" ? logObj.type.toLowerCase() : "log";
      logObj.tag = typeof logObj.tag === "string" ? logObj.tag : "";
      const resolveLog = (newLog = false) => {
         const repeated = (this._lastLog.count || 0) - this.options.throttleMin;
         if (this._lastLog.object && repeated > 0) {
            const args2 = [...this._lastLog.object.args];
            if (repeated > 1) {
               args2.push(`(repeated ${repeated} times)`);
            }
            this._log({ ...this._lastLog.object, args: args2 });
            this._lastLog.count = 1;
         }
         if (newLog) {
            this._lastLog.object = logObj;
            this._log(logObj);
         }
      };
      clearTimeout(this._lastLog.timeout);
      const diffTime = this._lastLog.time && logObj.date ? logObj.date.getTime() - this._lastLog.time.getTime() : 0;
      this._lastLog.time = logObj.date;
      if (diffTime < this.options.throttle) {
         try {
            const serializedLog = JSON.stringify([logObj.type, logObj.tag, logObj.args]);
            const isSameLog = this._lastLog.serialized === serializedLog;
            this._lastLog.serialized = serializedLog;
            if (isSameLog) {
               this._lastLog.count = (this._lastLog.count || 0) + 1;
               if (this._lastLog.count > this.options.throttleMin) {
                  this._lastLog.timeout = setTimeout(resolveLog, this.options.throttle);
                  return;
               }
            }
         } catch {}
      }
      resolveLog(true);
   }
   _log(logObj) {
      for (const reporter of this.options.reporters) {
         reporter.log(logObj, {
            options: this.options,
         });
      }
   }
};
function _normalizeLogLevel(input, types4 = {}, defaultLevel = 3) {
   if (input === void 0) {
      return defaultLevel;
   }
   if (typeof input === "number") {
      return input;
   }
   if (types4[input] && types4[input].level !== void 0) {
      return types4[input].level;
   }
   return defaultLevel;
}
Consola.prototype.add = Consola.prototype.addReporter;
Consola.prototype.remove = Consola.prototype.removeReporter;
Consola.prototype.clear = Consola.prototype.removeReporter;
Consola.prototype.withScope = Consola.prototype.withTag;
Consola.prototype.mock = Consola.prototype.mockTypes;
Consola.prototype.pause = Consola.prototype.pauseLogs;
Consola.prototype.resume = Consola.prototype.resumeLogs;
function createConsola(options = {}) {
   return new Consola(options);
}

// ../../node_modules/consola/dist/browser.mjs
var BrowserReporter = class {
   constructor(options) {
      this.options = { ...options };
      this.defaultColor = "#7f8c8d";
      this.levelColorMap = {
         0: "#c0392b",
         // Red
         1: "#f39c12",
         // Yellow
         3: "#00BCD4",
         // Cyan
      };
      this.typeColorMap = {
         success: "#2ecc71",
         // Green
      };
   }
   _getLogFn(level) {
      if (level < 1) {
         return console.__error || console.error;
      }
      if (level === 1) {
         return console.__warn || console.warn;
      }
      return console.__log || console.log;
   }
   log(logObj) {
      const consoleLogFn = this._getLogFn(logObj.level);
      const type = logObj.type === "log" ? "" : logObj.type;
      const tag2 = logObj.tag || "";
      const color = this.typeColorMap[logObj.type] || this.levelColorMap[logObj.level] || this.defaultColor;
      const style = `
      background: ${color};
      border-radius: 0.5em;
      color: white;
      font-weight: bold;
      padding: 2px 0.5em;
    `;
      const badge = `%c${[tag2, type].filter(Boolean).join(":")}`;
      if (typeof logObj.args[0] === "string") {
         consoleLogFn(
            `${badge}%c ${logObj.args[0]}`,
            style,
            // Empty string as style resets to default console style
            "",
            ...logObj.args.slice(1),
         );
      } else {
         consoleLogFn(badge, style, ...logObj.args);
      }
   }
};
function createConsola2(options = {}) {
   const consola2 = createConsola({
      reporters: options.reporters || [new BrowserReporter({})],
      prompt(message2, options2 = {}) {
         if (options2.type === "confirm") {
            return Promise.resolve(confirm(message2));
         }
         return Promise.resolve(prompt(message2));
      },
      ...options,
   });
   return consola2;
}
var consola = createConsola2();

// src/factory/token-factory.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/runtime/base64url.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/lib/buffer_utils.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/runtime/webcrypto.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var webcrypto_default = crypto;
var isCryptoKey = key => key instanceof CryptoKey;

// ../../node_modules/jose/dist/browser/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat3(...buffers) {
   const size = buffers.reduce((acc, { length }) => acc + length, 0);
   const buf = new Uint8Array(size);
   let i = 0;
   for (const buffer of buffers) {
      buf.set(buffer, i);
      i += buffer.length;
   }
   return buf;
}

// ../../node_modules/jose/dist/browser/runtime/base64url.js
var encodeBase64 = input => {
   let unencoded = input;
   if (typeof unencoded === "string") {
      unencoded = encoder.encode(unencoded);
   }
   const CHUNK_SIZE = 32768;
   const arr = [];
   for (let i = 0; i < unencoded.length; i += CHUNK_SIZE) {
      arr.push(String.fromCharCode.apply(null, unencoded.subarray(i, i + CHUNK_SIZE)));
   }
   return btoa(arr.join(""));
};
var encode = input => {
   return encodeBase64(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};
var decodeBase64 = encoded => {
   const binary = atob(encoded);
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
   }
   return bytes;
};
var decode = input => {
   let encoded = input;
   if (encoded instanceof Uint8Array) {
      encoded = decoder.decode(encoded);
   }
   encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
   try {
      return decodeBase64(encoded);
   } catch {
      throw new TypeError("The input to be decoded is not correctly encoded.");
   }
};

// ../../node_modules/jose/dist/browser/util/errors.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var JOSEError = class extends Error {
   static get code() {
      return "ERR_JOSE_GENERIC";
   }
   constructor(message2) {
      super(message2);
      this.code = "ERR_JOSE_GENERIC";
      this.name = this.constructor.name;
      Error.captureStackTrace?.(this, this.constructor);
   }
};
var JWTClaimValidationFailed = class extends JOSEError {
   static get code() {
      return "ERR_JWT_CLAIM_VALIDATION_FAILED";
   }
   constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
      super(message2);
      this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      this.claim = claim;
      this.reason = reason;
      this.payload = payload;
   }
};
var JWTExpired = class extends JOSEError {
   static get code() {
      return "ERR_JWT_EXPIRED";
   }
   constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
      super(message2);
      this.code = "ERR_JWT_EXPIRED";
      this.claim = claim;
      this.reason = reason;
      this.payload = payload;
   }
};
var JOSEAlgNotAllowed = class extends JOSEError {
   constructor() {
      super(...arguments);
      this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
   }
   static get code() {
      return "ERR_JOSE_ALG_NOT_ALLOWED";
   }
};
var JOSENotSupported = class extends JOSEError {
   constructor() {
      super(...arguments);
      this.code = "ERR_JOSE_NOT_SUPPORTED";
   }
   static get code() {
      return "ERR_JOSE_NOT_SUPPORTED";
   }
};
var JWSInvalid = class extends JOSEError {
   constructor() {
      super(...arguments);
      this.code = "ERR_JWS_INVALID";
   }
   static get code() {
      return "ERR_JWS_INVALID";
   }
};
var JWTInvalid = class extends JOSEError {
   constructor() {
      super(...arguments);
      this.code = "ERR_JWT_INVALID";
   }
   static get code() {
      return "ERR_JWT_INVALID";
   }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
   constructor() {
      super(...arguments);
      this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      this.message = "signature verification failed";
   }
   static get code() {
      return "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
   }
};

// ../../node_modules/jose/dist/browser/lib/crypto_key.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function unusable(name2, prop = "algorithm.name") {
   return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name2}`);
}
function isAlgorithm(algorithm, name2) {
   return algorithm.name === name2;
}
function getHashLength(hash) {
   return parseInt(hash.name.slice(4), 10);
}
function getNamedCurve(alg) {
   switch (alg) {
      case "ES256":
         return "P-256";
      case "ES384":
         return "P-384";
      case "ES512":
         return "P-521";
      default:
         throw new Error("unreachable");
   }
}
function checkUsage(key, usages) {
   if (usages.length && !usages.some(expected => key.usages.includes(expected))) {
      let msg = "CryptoKey does not support this operation, its usages must include ";
      if (usages.length > 2) {
         const last = usages.pop();
         msg += `one of ${usages.join(", ")}, or ${last}.`;
      } else if (usages.length === 2) {
         msg += `one of ${usages[0]} or ${usages[1]}.`;
      } else {
         msg += `${usages[0]}.`;
      }
      throw new TypeError(msg);
   }
}
function checkSigCryptoKey(key, alg, ...usages) {
   switch (alg) {
      case "HS256":
      case "HS384":
      case "HS512": {
         if (!isAlgorithm(key.algorithm, "HMAC")) throw unusable("HMAC");
         const expected = parseInt(alg.slice(2), 10);
         const actual = getHashLength(key.algorithm.hash);
         if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
         break;
      }
      case "RS256":
      case "RS384":
      case "RS512": {
         if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5")) throw unusable("RSASSA-PKCS1-v1_5");
         const expected = parseInt(alg.slice(2), 10);
         const actual = getHashLength(key.algorithm.hash);
         if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
         break;
      }
      case "PS256":
      case "PS384":
      case "PS512": {
         if (!isAlgorithm(key.algorithm, "RSA-PSS")) throw unusable("RSA-PSS");
         const expected = parseInt(alg.slice(2), 10);
         const actual = getHashLength(key.algorithm.hash);
         if (actual !== expected) throw unusable(`SHA-${expected}`, "algorithm.hash");
         break;
      }
      case "EdDSA": {
         if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
            throw unusable("Ed25519 or Ed448");
         }
         break;
      }
      case "ES256":
      case "ES384":
      case "ES512": {
         if (!isAlgorithm(key.algorithm, "ECDSA")) throw unusable("ECDSA");
         const expected = getNamedCurve(alg);
         const actual = key.algorithm.namedCurve;
         if (actual !== expected) throw unusable(expected, "algorithm.namedCurve");
         break;
      }
      default:
         throw new TypeError("CryptoKey does not support this operation");
   }
   checkUsage(key, usages);
}

// ../../node_modules/jose/dist/browser/lib/invalid_key_input.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function message(msg, actual, ...types4) {
   if (types4.length > 2) {
      const last = types4.pop();
      msg += `one of type ${types4.join(", ")}, or ${last}.`;
   } else if (types4.length === 2) {
      msg += `one of type ${types4[0]} or ${types4[1]}.`;
   } else {
      msg += `of type ${types4[0]}.`;
   }
   if (actual == null) {
      msg += ` Received ${actual}`;
   } else if (typeof actual === "function" && actual.name) {
      msg += ` Received function ${actual.name}`;
   } else if (typeof actual === "object" && actual != null) {
      if (actual.constructor?.name) {
         msg += ` Received an instance of ${actual.constructor.name}`;
      }
   }
   return msg;
}
var invalid_key_input_default = (actual, ...types4) => {
   return message("Key must be ", actual, ...types4);
};
function withAlg(alg, actual, ...types4) {
   return message(`Key for the ${alg} algorithm must be `, actual, ...types4);
}

// ../../node_modules/jose/dist/browser/runtime/is_key_like.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var is_key_like_default = key => {
   if (isCryptoKey(key)) {
      return true;
   }
   return key?.[Symbol.toStringTag] === "KeyObject";
};
var types2 = ["CryptoKey"];

// ../../node_modules/jose/dist/browser/lib/is_disjoint.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var isDisjoint = (...headers) => {
   const sources = headers.filter(Boolean);
   if (sources.length === 0 || sources.length === 1) {
      return true;
   }
   let acc;
   for (const header of sources) {
      const parameters = Object.keys(header);
      if (!acc || acc.size === 0) {
         acc = new Set(parameters);
         continue;
      }
      for (const parameter of parameters) {
         if (acc.has(parameter)) {
            return false;
         }
         acc.add(parameter);
      }
   }
   return true;
};
var is_disjoint_default = isDisjoint;

// ../../node_modules/jose/dist/browser/lib/is_object.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function isObjectLike(value) {
   return typeof value === "object" && value !== null;
}
function isObject4(input) {
   if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
      return false;
   }
   if (Object.getPrototypeOf(input) === null) {
      return true;
   }
   let proto = input;
   while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
   }
   return Object.getPrototypeOf(input) === proto;
}

// ../../node_modules/jose/dist/browser/runtime/check_key_length.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var check_key_length_default = (alg, key) => {
   if (alg.startsWith("RS") || alg.startsWith("PS")) {
      const { modulusLength } = key.algorithm;
      if (typeof modulusLength !== "number" || modulusLength < 2048) {
         throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
      }
   }
};

// ../../node_modules/jose/dist/browser/runtime/normalize_key.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/runtime/jwk_to_key.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function subtleMapping(jwk) {
   let algorithm;
   let keyUsages;
   switch (jwk.kty) {
      case "RSA": {
         switch (jwk.alg) {
            case "PS256":
            case "PS384":
            case "PS512":
               algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
               keyUsages = jwk.d ? ["sign"] : ["verify"];
               break;
            case "RS256":
            case "RS384":
            case "RS512":
               algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
               keyUsages = jwk.d ? ["sign"] : ["verify"];
               break;
            case "RSA-OAEP":
            case "RSA-OAEP-256":
            case "RSA-OAEP-384":
            case "RSA-OAEP-512":
               algorithm = {
                  name: "RSA-OAEP",
                  hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`,
               };
               keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
               break;
            default:
               throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
         }
         break;
      }
      case "EC": {
         switch (jwk.alg) {
            case "ES256":
               algorithm = { name: "ECDSA", namedCurve: "P-256" };
               keyUsages = jwk.d ? ["sign"] : ["verify"];
               break;
            case "ES384":
               algorithm = { name: "ECDSA", namedCurve: "P-384" };
               keyUsages = jwk.d ? ["sign"] : ["verify"];
               break;
            case "ES512":
               algorithm = { name: "ECDSA", namedCurve: "P-521" };
               keyUsages = jwk.d ? ["sign"] : ["verify"];
               break;
            case "ECDH-ES":
            case "ECDH-ES+A128KW":
            case "ECDH-ES+A192KW":
            case "ECDH-ES+A256KW":
               algorithm = { name: "ECDH", namedCurve: jwk.crv };
               keyUsages = jwk.d ? ["deriveBits"] : [];
               break;
            default:
               throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
         }
         break;
      }
      case "OKP": {
         switch (jwk.alg) {
            case "EdDSA":
               algorithm = { name: jwk.crv };
               keyUsages = jwk.d ? ["sign"] : ["verify"];
               break;
            case "ECDH-ES":
            case "ECDH-ES+A128KW":
            case "ECDH-ES+A192KW":
            case "ECDH-ES+A256KW":
               algorithm = { name: jwk.crv };
               keyUsages = jwk.d ? ["deriveBits"] : [];
               break;
            default:
               throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
         }
         break;
      }
      default:
         throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
   }
   return { algorithm, keyUsages };
}
var parse = async jwk => {
   if (!jwk.alg) {
      throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
   }
   const { algorithm, keyUsages } = subtleMapping(jwk);
   const rest = [algorithm, jwk.ext ?? false, jwk.key_ops ?? keyUsages];
   const keyData = { ...jwk };
   delete keyData.alg;
   delete keyData.use;
   return webcrypto_default.subtle.importKey("jwk", keyData, ...rest);
};
var jwk_to_key_default = parse;

// ../../node_modules/jose/dist/browser/runtime/normalize_key.js
var normalizeSecretKey = k2 => decode(k2);
var privCache;
var pubCache;
var isKeyObject = key => {
   return key?.[Symbol.toStringTag] === "KeyObject";
};
var importAndCache = async (cache, key, jwk, alg) => {
   let cached = cache.get(key);
   if (cached?.[alg]) {
      return cached[alg];
   }
   const cryptoKey = await jwk_to_key_default({ ...jwk, alg });
   if (!cached) {
      cache.set(key, { [alg]: cryptoKey });
   } else {
      cached[alg] = cryptoKey;
   }
   return cryptoKey;
};
var normalizePublicKey = (key, alg) => {
   if (isKeyObject(key)) {
      let jwk = key.export({ format: "jwk" });
      delete jwk.d;
      delete jwk.dp;
      delete jwk.dq;
      delete jwk.p;
      delete jwk.q;
      delete jwk.qi;
      if (jwk.k) {
         return normalizeSecretKey(jwk.k);
      }
      pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
      return importAndCache(pubCache, key, jwk, alg);
   }
   return key;
};
var normalizePrivateKey = (key, alg) => {
   if (isKeyObject(key)) {
      let jwk = key.export({ format: "jwk" });
      if (jwk.k) {
         return normalizeSecretKey(jwk.k);
      }
      privCache || (privCache = /* @__PURE__ */ new WeakMap());
      return importAndCache(privCache, key, jwk, alg);
   }
   return key;
};
var normalize_key_default = { normalizePublicKey, normalizePrivateKey };

// ../../node_modules/jose/dist/browser/lib/check_key_type.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var tag = key => key?.[Symbol.toStringTag];
var symmetricTypeCheck = (alg, key) => {
   if (key instanceof Uint8Array) return;
   if (!is_key_like_default(key)) {
      throw new TypeError(withAlg(alg, key, ...types2, "Uint8Array"));
   }
   if (key.type !== "secret") {
      throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
   }
};
var asymmetricTypeCheck = (alg, key, usage) => {
   if (!is_key_like_default(key)) {
      throw new TypeError(withAlg(alg, key, ...types2));
   }
   if (key.type === "secret") {
      throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
   }
   if (usage === "sign" && key.type === "public") {
      throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
   }
   if (usage === "decrypt" && key.type === "public") {
      throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
   }
   if (key.algorithm && usage === "verify" && key.type === "private") {
      throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
   }
   if (key.algorithm && usage === "encrypt" && key.type === "private") {
      throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
   }
};
var checkKeyType = (alg, key, usage) => {
   const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
   if (symmetric) {
      symmetricTypeCheck(alg, key);
   } else {
      asymmetricTypeCheck(alg, key, usage);
   }
};
var check_key_type_default = checkKeyType;

// ../../node_modules/jose/dist/browser/lib/validate_crit.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
   if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
      throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
   }
   if (!protectedHeader || protectedHeader.crit === void 0) {
      return /* @__PURE__ */ new Set();
   }
   if (
      !Array.isArray(protectedHeader.crit) ||
      protectedHeader.crit.length === 0 ||
      protectedHeader.crit.some(input => typeof input !== "string" || input.length === 0)
   ) {
      throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
   }
   let recognized;
   if (recognizedOption !== void 0) {
      recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
   } else {
      recognized = recognizedDefault;
   }
   for (const parameter of protectedHeader.crit) {
      if (!recognized.has(parameter)) {
         throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
      }
      if (joseHeader[parameter] === void 0) {
         throw new Err(`Extension Header Parameter "${parameter}" is missing`);
      }
      if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
         throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
      }
   }
   return new Set(protectedHeader.crit);
}
var validate_crit_default = validateCrit;

// ../../node_modules/jose/dist/browser/lib/validate_algorithms.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var validateAlgorithms = (option, algorithms) => {
   if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some(s => typeof s !== "string"))) {
      throw new TypeError(`"${option}" option must be an array of strings`);
   }
   if (!algorithms) {
      return void 0;
   }
   return new Set(algorithms);
};
var validate_algorithms_default = validateAlgorithms;

// ../../node_modules/jose/dist/browser/jws/compact/verify.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/jws/flattened/verify.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/runtime/verify.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/runtime/subtle_dsa.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function subtleDsa(alg, algorithm) {
   const hash = `SHA-${alg.slice(-3)}`;
   switch (alg) {
      case "HS256":
      case "HS384":
      case "HS512":
         return { hash, name: "HMAC" };
      case "PS256":
      case "PS384":
      case "PS512":
         return { hash, name: "RSA-PSS", saltLength: alg.slice(-3) >> 3 };
      case "RS256":
      case "RS384":
      case "RS512":
         return { hash, name: "RSASSA-PKCS1-v1_5" };
      case "ES256":
      case "ES384":
      case "ES512":
         return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
      case "EdDSA":
         return { name: algorithm.name };
      default:
         throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
   }
}

// ../../node_modules/jose/dist/browser/runtime/get_sign_verify_key.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
async function getCryptoKey(alg, key, usage) {
   if (usage === "sign") {
      key = await normalize_key_default.normalizePrivateKey(key, alg);
   }
   if (usage === "verify") {
      key = await normalize_key_default.normalizePublicKey(key, alg);
   }
   if (isCryptoKey(key)) {
      checkSigCryptoKey(key, alg, usage);
      return key;
   }
   if (key instanceof Uint8Array) {
      if (!alg.startsWith("HS")) {
         throw new TypeError(invalid_key_input_default(key, ...types2));
      }
      return webcrypto_default.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
   }
   throw new TypeError(invalid_key_input_default(key, ...types2, "Uint8Array"));
}

// ../../node_modules/jose/dist/browser/runtime/verify.js
var verify = async (alg, key, signature, data) => {
   const cryptoKey = await getCryptoKey(alg, key, "verify");
   check_key_length_default(alg, cryptoKey);
   const algorithm = subtleDsa(alg, cryptoKey.algorithm);
   try {
      return await webcrypto_default.subtle.verify(algorithm, cryptoKey, signature, data);
   } catch {
      return false;
   }
};
var verify_default = verify;

// ../../node_modules/jose/dist/browser/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
   if (!isObject4(jws)) {
      throw new JWSInvalid("Flattened JWS must be an object");
   }
   if (jws.protected === void 0 && jws.header === void 0) {
      throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
   }
   if (jws.protected !== void 0 && typeof jws.protected !== "string") {
      throw new JWSInvalid("JWS Protected Header incorrect type");
   }
   if (jws.payload === void 0) {
      throw new JWSInvalid("JWS Payload missing");
   }
   if (typeof jws.signature !== "string") {
      throw new JWSInvalid("JWS Signature missing or incorrect type");
   }
   if (jws.header !== void 0 && !isObject4(jws.header)) {
      throw new JWSInvalid("JWS Unprotected Header incorrect type");
   }
   let parsedProt = {};
   if (jws.protected) {
      try {
         const protectedHeader = decode(jws.protected);
         parsedProt = JSON.parse(decoder.decode(protectedHeader));
      } catch {
         throw new JWSInvalid("JWS Protected Header is invalid");
      }
   }
   if (!is_disjoint_default(parsedProt, jws.header)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
   }
   const joseHeader = {
      ...parsedProt,
      ...jws.header,
   };
   const extensions = validate_crit_default(
      JWSInvalid,
      /* @__PURE__ */ new Map([["b64", true]]),
      options?.crit,
      parsedProt,
      joseHeader,
   );
   let b64 = true;
   if (extensions.has("b64")) {
      b64 = parsedProt.b64;
      if (typeof b64 !== "boolean") {
         throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
   }
   const { alg } = joseHeader;
   if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
   }
   const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
   if (algorithms && !algorithms.has(alg)) {
      throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
   }
   if (b64) {
      if (typeof jws.payload !== "string") {
         throw new JWSInvalid("JWS Payload must be a string");
      }
   } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
      throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
   }
   let resolvedKey = false;
   if (typeof key === "function") {
      key = await key(parsedProt, jws);
      resolvedKey = true;
   }
   check_key_type_default(alg, key, "verify");
   const data = concat3(
      encoder.encode(jws.protected ?? ""),
      encoder.encode("."),
      typeof jws.payload === "string" ? encoder.encode(jws.payload) : jws.payload,
   );
   let signature;
   try {
      signature = decode(jws.signature);
   } catch {
      throw new JWSInvalid("Failed to base64url decode the signature");
   }
   const verified = await verify_default(alg, key, signature, data);
   if (!verified) {
      throw new JWSSignatureVerificationFailed();
   }
   let payload;
   if (b64) {
      try {
         payload = decode(jws.payload);
      } catch {
         throw new JWSInvalid("Failed to base64url decode the payload");
      }
   } else if (typeof jws.payload === "string") {
      payload = encoder.encode(jws.payload);
   } else {
      payload = jws.payload;
   }
   const result = { payload };
   if (jws.protected !== void 0) {
      result.protectedHeader = parsedProt;
   }
   if (jws.header !== void 0) {
      result.unprotectedHeader = jws.header;
   }
   if (resolvedKey) {
      return { ...result, key };
   }
   return result;
}

// ../../node_modules/jose/dist/browser/jws/compact/verify.js
async function compactVerify(jws, key, options) {
   if (jws instanceof Uint8Array) {
      jws = decoder.decode(jws);
   }
   if (typeof jws !== "string") {
      throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
   }
   const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
   if (length !== 3) {
      throw new JWSInvalid("Invalid Compact JWS");
   }
   const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
   const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
   if (typeof key === "function") {
      return { ...result, key: verified.key };
   }
   return result;
}

// ../../node_modules/jose/dist/browser/jwt/verify.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/lib/jwt_claims_set.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/lib/epoch.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var epoch_default = date => Math.floor(date.getTime() / 1e3);

// ../../node_modules/jose/dist/browser/lib/secs.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX =
   /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var secs_default = str => {
   const matched = REGEX.exec(str);
   if (!matched || (matched[4] && matched[1])) {
      throw new TypeError("Invalid time period format");
   }
   const value = parseFloat(matched[2]);
   const unit = matched[3].toLowerCase();
   let numericDate;
   switch (unit) {
      case "sec":
      case "secs":
      case "second":
      case "seconds":
      case "s":
         numericDate = Math.round(value);
         break;
      case "minute":
      case "minutes":
      case "min":
      case "mins":
      case "m":
         numericDate = Math.round(value * minute);
         break;
      case "hour":
      case "hours":
      case "hr":
      case "hrs":
      case "h":
         numericDate = Math.round(value * hour);
         break;
      case "day":
      case "days":
      case "d":
         numericDate = Math.round(value * day);
         break;
      case "week":
      case "weeks":
      case "w":
         numericDate = Math.round(value * week);
         break;
      default:
         numericDate = Math.round(value * year);
         break;
   }
   if (matched[1] === "-" || matched[4] === "ago") {
      return -numericDate;
   }
   return numericDate;
};

// ../../node_modules/jose/dist/browser/lib/jwt_claims_set.js
var normalizeTyp = value => value.toLowerCase().replace(/^application\//, "");
var checkAudiencePresence = (audPayload, audOption) => {
   if (typeof audPayload === "string") {
      return audOption.includes(audPayload);
   }
   if (Array.isArray(audPayload)) {
      return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
   }
   return false;
};
var jwt_claims_set_default = (protectedHeader, encodedPayload, options = {}) => {
   let payload;
   try {
      payload = JSON.parse(decoder.decode(encodedPayload));
   } catch {}
   if (!isObject4(payload)) {
      throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
   }
   const { typ } = options;
   if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
      throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
   }
   const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
   const presenceCheck = [...requiredClaims];
   if (maxTokenAge !== void 0) presenceCheck.push("iat");
   if (audience !== void 0) presenceCheck.push("aud");
   if (subject !== void 0) presenceCheck.push("sub");
   if (issuer !== void 0) presenceCheck.push("iss");
   for (const claim of new Set(presenceCheck.reverse())) {
      if (!(claim in payload)) {
         throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
      }
   }
   if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
      throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
   }
   if (subject && payload.sub !== subject) {
      throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
   }
   if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
      throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
   }
   let tolerance;
   switch (typeof options.clockTolerance) {
      case "string":
         tolerance = secs_default(options.clockTolerance);
         break;
      case "number":
         tolerance = options.clockTolerance;
         break;
      case "undefined":
         tolerance = 0;
         break;
      default:
         throw new TypeError("Invalid clockTolerance option type");
   }
   const { currentDate } = options;
   const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
   if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
      throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
   }
   if (payload.nbf !== void 0) {
      if (typeof payload.nbf !== "number") {
         throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
      }
      if (payload.nbf > now + tolerance) {
         throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
      }
   }
   if (payload.exp !== void 0) {
      if (typeof payload.exp !== "number") {
         throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
      }
      if (payload.exp <= now - tolerance) {
         throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
      }
   }
   if (maxTokenAge) {
      const age = now - payload.iat;
      const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
      if (age - tolerance > max) {
         throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
      }
      if (age < 0 - tolerance) {
         throw new JWTClaimValidationFailed(
            '"iat" claim timestamp check failed (it should be in the past)',
            payload,
            "iat",
            "check_failed",
         );
      }
   }
   return payload;
};

// ../../node_modules/jose/dist/browser/jwt/verify.js
async function jwtVerify(jwt, key, options) {
   const verified = await compactVerify(jwt, key, options);
   if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
   }
   const payload = jwt_claims_set_default(verified.protectedHeader, verified.payload, options);
   const result = { payload, protectedHeader: verified.protectedHeader };
   if (typeof key === "function") {
      return { ...result, key: verified.key };
   }
   return result;
}

// ../../node_modules/jose/dist/browser/jws/compact/sign.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/jws/flattened/sign.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/runtime/sign.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var sign = async (alg, key, data) => {
   const cryptoKey = await getCryptoKey(alg, key, "sign");
   check_key_length_default(alg, cryptoKey);
   const signature = await webcrypto_default.subtle.sign(subtleDsa(alg, cryptoKey.algorithm), cryptoKey, data);
   return new Uint8Array(signature);
};
var sign_default = sign;

// ../../node_modules/jose/dist/browser/jws/flattened/sign.js
var FlattenedSign = class {
   constructor(payload) {
      if (!(payload instanceof Uint8Array)) {
         throw new TypeError("payload must be an instance of Uint8Array");
      }
      this._payload = payload;
   }
   setProtectedHeader(protectedHeader) {
      if (this._protectedHeader) {
         throw new TypeError("setProtectedHeader can only be called once");
      }
      this._protectedHeader = protectedHeader;
      return this;
   }
   setUnprotectedHeader(unprotectedHeader) {
      if (this._unprotectedHeader) {
         throw new TypeError("setUnprotectedHeader can only be called once");
      }
      this._unprotectedHeader = unprotectedHeader;
      return this;
   }
   async sign(key, options) {
      if (!this._protectedHeader && !this._unprotectedHeader) {
         throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
      }
      if (!is_disjoint_default(this._protectedHeader, this._unprotectedHeader)) {
         throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
      }
      const joseHeader = {
         ...this._protectedHeader,
         ...this._unprotectedHeader,
      };
      const extensions = validate_crit_default(
         JWSInvalid,
         /* @__PURE__ */ new Map([["b64", true]]),
         options?.crit,
         this._protectedHeader,
         joseHeader,
      );
      let b64 = true;
      if (extensions.has("b64")) {
         b64 = this._protectedHeader.b64;
         if (typeof b64 !== "boolean") {
            throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
         }
      }
      const { alg } = joseHeader;
      if (typeof alg !== "string" || !alg) {
         throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
      }
      check_key_type_default(alg, key, "sign");
      let payload = this._payload;
      if (b64) {
         payload = encoder.encode(encode(payload));
      }
      let protectedHeader;
      if (this._protectedHeader) {
         protectedHeader = encoder.encode(encode(JSON.stringify(this._protectedHeader)));
      } else {
         protectedHeader = encoder.encode("");
      }
      const data = concat3(protectedHeader, encoder.encode("."), payload);
      const signature = await sign_default(alg, key, data);
      const jws = {
         signature: encode(signature),
         payload: "",
      };
      if (b64) {
         jws.payload = decoder.decode(payload);
      }
      if (this._unprotectedHeader) {
         jws.header = this._unprotectedHeader;
      }
      if (this._protectedHeader) {
         jws.protected = decoder.decode(protectedHeader);
      }
      return jws;
   }
};

// ../../node_modules/jose/dist/browser/jws/compact/sign.js
var CompactSign = class {
   constructor(payload) {
      this._flattened = new FlattenedSign(payload);
   }
   setProtectedHeader(protectedHeader) {
      this._flattened.setProtectedHeader(protectedHeader);
      return this;
   }
   async sign(key, options) {
      const jws = await this._flattened.sign(key, options);
      if (jws.payload === void 0) {
         throw new TypeError("use the flattened module for creating JWS with b64: false");
      }
      return `${jws.protected}.${jws.payload}.${jws.signature}`;
   }
};

// ../../node_modules/jose/dist/browser/jwt/sign.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/jose/dist/browser/jwt/produce.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function validateInput(label, input) {
   if (!Number.isFinite(input)) {
      throw new TypeError(`Invalid ${label} input`);
   }
   return input;
}
var ProduceJWT = class {
   constructor(payload = {}) {
      if (!isObject4(payload)) {
         throw new TypeError("JWT Claims Set MUST be an object");
      }
      this._payload = payload;
   }
   setIssuer(issuer) {
      this._payload = { ...this._payload, iss: issuer };
      return this;
   }
   setSubject(subject) {
      this._payload = { ...this._payload, sub: subject };
      return this;
   }
   setAudience(audience) {
      this._payload = { ...this._payload, aud: audience };
      return this;
   }
   setJti(jwtId) {
      this._payload = { ...this._payload, jti: jwtId };
      return this;
   }
   setNotBefore(input) {
      if (typeof input === "number") {
         this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
      } else if (input instanceof Date) {
         this._payload = { ...this._payload, nbf: validateInput("setNotBefore", epoch_default(input)) };
      } else {
         this._payload = { ...this._payload, nbf: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
      }
      return this;
   }
   setExpirationTime(input) {
      if (typeof input === "number") {
         this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
      } else if (input instanceof Date) {
         this._payload = { ...this._payload, exp: validateInput("setExpirationTime", epoch_default(input)) };
      } else {
         this._payload = { ...this._payload, exp: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
      }
      return this;
   }
   setIssuedAt(input) {
      if (typeof input === "undefined") {
         this._payload = { ...this._payload, iat: epoch_default(/* @__PURE__ */ new Date()) };
      } else if (input instanceof Date) {
         this._payload = { ...this._payload, iat: validateInput("setIssuedAt", epoch_default(input)) };
      } else if (typeof input === "string") {
         this._payload = {
            ...this._payload,
            iat: validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(input)),
         };
      } else {
         this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
      }
      return this;
   }
};

// ../../node_modules/jose/dist/browser/jwt/sign.js
var SignJWT = class extends ProduceJWT {
   setProtectedHeader(protectedHeader) {
      this._protectedHeader = protectedHeader;
      return this;
   }
   async sign(key, options) {
      const sig = new CompactSign(encoder.encode(JSON.stringify(this._payload)));
      sig.setProtectedHeader(this._protectedHeader);
      if (
         Array.isArray(this._protectedHeader?.crit) &&
         this._protectedHeader.crit.includes("b64") &&
         this._protectedHeader.b64 === false
      ) {
         throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
      }
      return sig.sign(key, options);
   }
};

// src/factory/token-factory.ts
var ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET ?? "");
var REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET ?? "");
var ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? "";
var REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "";
async function createTokens(payload, accessExpireTime, refreshExpireTime) {
   const accessToken = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(accessExpireTime)
      .setIssuedAt()
      .sign(ACCESS_TOKEN_SECRET_ENCODED);
   const refreshToken = await new SignJWT({ id: payload.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(refreshExpireTime)
      .sign(REFRESH_TOKEN_SECRET_ENCODED);
   return [accessToken, refreshToken];
}
async function verifyToken(token, secret = ACCESS_TOKEN_SECRET_ENCODED) {
   try {
      if (tokenInvalidator.isInvalid(token)) {
         return { valid: false, payload: null };
      }
      const jwt = await jwtVerify(token, secret);
      if (!("id" in jwt.payload)) {
         return { valid: false, payload: null };
      }
      return { valid: true, payload: jwt.payload };
   } catch (e) {
      return { valid: false, payload: null };
   }
}

// src/log-utils.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

var divider = hconsole.gray(">");
var startText = hconsole.bold(hconsole.gray("START"));
var endText = hconsole.bold(hconsole.gray("END"));
var requestDataText = hconsole.bold(hconsole.gray("REQUEST DATA"));
var responseDataText = hconsole.bold(hconsole.gray("RESPONSE DATA"));
var gatewayOpen = hconsole.bold(hconsole.cyan("GATEWAY OPEN"));
var gatewayClose = hconsole.bold(hconsole.red("GATEWAY CLOSE"));
var gatewayRecieve = hconsole.bold(hconsole.gray("GATEWAY RECIEVE"));
var gatewaySend = hconsole.bold(hconsole.gray("GATEWAY SEND"));
function logServerError(path, e) {
   hconsole.box(
      `${hconsole.bold(hconsole.red("Server Error:"))} ${hconsole.green(path)}
`,
      e,
   );
}
function logReject(path, method, error2, status) {
   const rejectText = hconsole.bold(hconsole.red("Rejected"));
   const methodText = hconsole.bold(hconsole.red(method));
   const pathText = hconsole.green(path);
   const statusText = status ? hconsole.bold(hconsole.red(` ${status} `)) : " ";
   let errorText = hconsole.red("Unknown Error");
   if (typeof error2 === "string") {
      errorText = hconsole.red(error2);
   } else if (typeof error2 === "object") {
      errorText = hconsole.red(`${error2.message} (${hconsole.bold(error2.code.toString())})`);
   }
   hconsole.info(`${endText} ${divider} ${rejectText} (${methodText}) ${divider} ${pathText} ${divider}${statusText}${errorText}
`);
}
function logResponse(path, status, data) {
   logData(path, responseDataText, data);
   const responseText = hconsole.bold(hconsole.magenta("Response"));
   const statusText = hconsole.bold(hconsole.magenta(status.toString()));
   const pathText = hconsole.green(path);
   hconsole.info(`${endText} ${divider} ${responseText} (${statusText}) ${divider} ${pathText}
`);
}
function logRequest(path, method, data) {
   const pathText = hconsole.green(path);
   const methodText = hconsole.bold(hconsole.cyan(method));
   const requestText = hconsole.bold(hconsole.cyan("Request"));
   hconsole.info(`${startText} ${divider} ${requestText} (${methodText}) ${divider} ${pathText}`);
   logData(path, requestDataText, data);
}
function logData(path, text, data) {
   const dataString = JSON.stringify(data);
   if (!dataString) {
      return;
   }
   const pathText = hconsole.green(path);
   let dataText = hconsole.gray(dataString);
   if (data !== null && typeof data === "object" && "content" in data) {
      const content = data.content.replaceAll("\n", " \\n ");
      dataText = hconsole.gray(`${hconsole.underline("Formatted")} > ${content}`);
   } else if (dataString.length > 100) {
      dataText = hconsole.gray("Data Too Long");
   }
   hconsole.info(`${text} ${divider} ${pathText} ${divider} ${dataText}`);
}
function logGatewayOpen() {
   hconsole.info(`${gatewayOpen}
`);
}
function logGatewayClose(code, reason) {
   const codeText = hconsole.red(code.toString());
   const reasonText = hconsole.gray(reason === "" ? "No reason" : reason);
   hconsole.info(`${gatewayClose} (${codeText}) ${divider} ${reasonText}
`);
}
function logGatewayRecieve(data, logHeartbeat) {
   if (data.op === 1 /* HEARTBEAT */ && !logHeartbeat) {
      return;
   }
   const opcodeText = hconsole.yellow(opcodeToText(data.op));
   const opcodeNumberText = hconsole.yellow(data.op.toString());
   let dataText = hconsole.gray(JSON.stringify(data.d));
   if (dataText.length > 100) {
      dataText = hconsole.gray("Data Too Long");
   }
   hconsole.info(`${gatewayRecieve} ${divider} ${opcodeText} (${opcodeNumberText}) ${divider} ${dataText}`);
}
function logGatewaySend(data, logHeartbeat) {
   if (data.op === 11 /* HEARTBEAT_ACK */ && !logHeartbeat) {
      return;
   }
   const opcodeText = hconsole.blue(data.t ? `${data.t} ${divider} ${opcodeToText(data.op)}` : opcodeToText(data.op));
   const opcodeNumberText = hconsole.blue(data.op.toString());
   let dataText = hconsole.gray(JSON.stringify(data.d) || "null");
   if (dataText.length > 100) {
      dataText = hconsole.gray("Data Too Long");
   }
   hconsole.info(`${gatewaySend} ${divider} ${opcodeText} (${opcodeNumberText}) ${divider} ${dataText}
`);
}
function opcodeToText(opcode) {
   switch (opcode) {
      case 0 /* DISPATCH */:
         return "Dispatch";
      case 1 /* HEARTBEAT */:
         return "Heartbeat";
      case 11 /* HEARTBEAT_ACK */:
         return "HeartbeatAck";
      case 10 /* HELLO */:
         return "Hello";
      case 2 /* IDENTIFY */:
         return "Identify";
      case 6 /* RESUME */:
         return "Resume";
      default:
         return "Unknown";
   }
}

// src/gateway/client-session.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var ClientSession = class extends EventEmitter {
   data;
   ws;
   sentMessages;
   subscribedTopics;
   hearbeatTimeout;
   sequence;
   constructor(ws, data) {
      super();
      this.ws = ws;
      this.data = data;
      this.sentMessages = /* @__PURE__ */ new Map();
      this.subscribedTopics = /* @__PURE__ */ new Set();
   }
   initialize() {
      this.subscribeClientEvents();
      this.startHeartbeatTimeout();
   }
   resetTimeout() {
      clearTimeout(this.hearbeatTimeout);
      this.startHeartbeatTimeout();
   }
   dispose() {
      clearTimeout(this.hearbeatTimeout);
      this.removeAllListeners();
   }
   subscribe(topic) {
      if (!this.ws.isSubscribed(topic)) {
         this.ws.subscribe(topic);
         this.subscribedTopics.add(topic);
      }
   }
   unsubscribe(topic) {
      if (this.ws.isSubscribed(topic)) {
         this.ws.unsubscribe(topic);
         this.subscribedTopics.delete(topic);
      }
   }
   isSubscribed(topic) {
      return this.subscribedTopics.has(topic);
   }
   increaseSequence() {
      this.sequence = this.sequence !== void 0 ? this.sequence + 1 : 0;
      return this.sequence;
   }
   addMessage(data) {
      this.sentMessages.set(data.s, data);
   }
   getMessages() {
      return this.sentMessages;
   }
   async subscribeClientEvents() {
      this.subscribe(this.data.user.id);
      const clientChannels = idFix(await prisma.channel.getUserChannels(this.data.user.id, true));
      for (const channel of clientChannels) {
         this.subscribe(channel.id);
      }
   }
   startHeartbeatTimeout() {
      const tolerance = 3e3;
      this.hearbeatTimeout = setTimeout(() => {
         this.emit("timeout", this.data);
         this.dispose();
         this.ws.close(4007 /* SESSION_TIMEOUT */, "SESSION_TIMEOUT");
      }, constants.HEARTBEAT_INTERVAL + tolerance);
   }
};

// src/gateway/gateway-utils.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function publishToTopic(topic, data) {
   logGatewaySend(data, false);
   gateway.sendToTopic(topic, data);
}
function dispatchToTopic(topic, t, d, s) {
   publishToTopic(topic, { op: 0 /* DISPATCH */, t, d, s });
}
function validateGatewayData(data) {
   if (data && typeof data === "object") {
      return "op" in data;
   }
   return false;
}

// src/gateway/server-gateway.ts
var ServerGateway = class {
   options;
   clients;
   cancelledClientDisconnects;
   constructor(options) {
      this.options = options;
      this.clients = /* @__PURE__ */ new Map();
      this.cancelledClientDisconnects = [];
   }
   onOpen(ws) {
      try {
         logGatewayOpen();
         const helloData = { op: 10 /* HELLO */, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
         this.send(ws, helloData);
      } catch (e) {
         ws.close(4e3 /* UNKNOWN */, "UNKNOWN");
      }
   }
   onClose(ws, code, reason) {
      this.clients.get(ws.data)?.dispose();
      if (code === 4009 /* INVALID_SESSION */) {
         this.clients.delete(ws.data);
      } else {
         this.queueClientDisconnect(ws.data);
      }
      logGatewayClose(code, reason);
   }
   async onMessage(ws, message2) {
      try {
         if (typeof message2 !== "string") {
            consola.error("Non string message type is not supported yet");
            return;
         }
         const data = JSON.parse(message2);
         if (!validateGatewayData(data)) {
            ws.close(4002 /* DECODE_ERROR */, "DECODE_ERROR");
            return;
         }
         logGatewayRecieve(data, this.options.logHeartbeat);
         if (isOpcode(data, 2 /* IDENTIFY */)) {
            await this.handleIdentify(ws, data);
         } else if (isOpcode(data, 6 /* RESUME */)) {
            this.handleResume(ws, data);
         } else if (!ws.data) {
            ws.close(4003 /* NOT_AUTHENTICATED */, "NOT_AUTHENTICATED");
            return;
         } else if (isOpcode(data, 1 /* HEARTBEAT */)) {
            this.handleHeartbeat(ws, data);
         } else {
            ws.close(4001 /* UNKNOWN_OPCODE */, "UNKNOWN_OPCODE");
         }
      } catch (e) {
         if (e instanceof SyntaxError) {
            ws.close(4002 /* DECODE_ERROR */, "DECODE_ERROR");
            return;
         }
         logServerError("/gateway", e);
         ws.close(4e3 /* UNKNOWN */, "UNKNOWN");
      }
   }
   getSession(userId) {
      return this.clients.get(userId);
   }
   sendToTopic(topic, data) {
      for (const client of this.clients.values()) {
         if (client.isSubscribed(topic)) {
            const newData = { ...data, s: client.increaseSequence() };
            client.addMessage(newData);
            client.ws.send(JSON.stringify(newData));
         }
      }
   }
   handleHeartbeat(ws, data) {
      const client = this.clients.get(ws.data);
      if (data.d !== client?.sequence) {
         ws.close(4006 /* INVALID_SEQ */, "INVALID_SEQ");
         return;
      }
      this.clients.get(ws.data)?.resetTimeout();
      const hearbeatAckData = { op: 11 /* HEARTBEAT_ACK */ };
      this.send(ws, hearbeatAckData);
   }
   async handleIdentify(ws, data) {
      const { valid, payload } = await verifyToken(data.d.token);
      if (!valid || !payload) {
         ws.close(4004 /* AUTHENTICATION_FAILED */, "AUTHENTICATION_FAILED");
         return;
      }
      if (this.clients.has(ws.data)) {
         ws.close(4005 /* ALREADY_AUTHENTICATED */, "ALREADY_AUTHENTICATED");
         return;
      }
      const user = idFix(await prisma.user.getById(payload.id));
      const sessionId = snowflake.generateString();
      ws.data = sessionId;
      const client = new ClientSession(ws, { user, sessionId });
      client.initialize();
      this.clients.set(sessionId, client);
      const readyData = {
         op: 0 /* DISPATCH */,
         d: { user, sessionId },
         t: "ready",
         s: client.increaseSequence(),
      };
      this.send(ws, readyData);
   }
   async handleResume(ws, data) {
      const { valid, payload } = await verifyToken(data.d.token);
      if (!valid || !payload) {
         ws.close(4004 /* AUTHENTICATION_FAILED */, "AUTHENTICATION_FAILED");
         return;
      }
      if (!this.clients.has(data.d.sessionId)) {
         ws.close(4009 /* INVALID_SESSION */, "INVALID_SESSION");
         return;
      }
      const client = this.clients.get(data.d.sessionId);
      if (!client) throw new Error("client was null in handleIdentify");
      if (!client.sequence || data.d.seq > client.sequence) {
         ws.close(4006 /* INVALID_SEQ */, "INVALID_SEQ");
         return;
      }
      ws.data = data.d.sessionId;
      client.ws = ws;
      client.initialize();
      this.cancelledClientDisconnects.push(data.d.sessionId);
      const messageQueue = client.getMessages();
      for (const [seq, _data] of messageQueue) {
         if (seq <= data.d.seq) {
            continue;
         }
         this.send(client.ws, _data);
      }
      const resumedData = { t: "resumed", op: 0 /* DISPATCH */, d: void 0, s: client.increaseSequence() };
      this.send(client.ws, resumedData);
   }
   queueClientDisconnect(sessionId) {
      setTimeout(() => {
         if (this.cancelledClientDisconnects.includes(sessionId)) {
            return;
         }
         this.clients.delete(sessionId);
      }, 1e3 * 30);
   }
   send(ws, data) {
      logGatewaySend(data, this.options.logHeartbeat);
      ws.send(JSON.stringify(data));
   }
};

// src/route-utils.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/helper/factory/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var Factory = class {
   initApp;
   constructor(init3) {
      this.initApp = init3?.initApp;
   }
   createApp = () => {
      const app22 = new Hono2();
      if (this.initApp) {
         this.initApp(app22);
      }
      return app22;
   };
   createMiddleware = middleware => middleware;
   createHandlers = (...handlers) => {
      return handlers.filter(handler => handler !== void 0);
   };
};
var createFactory = init3 => new Factory(init3);

// node_modules/hono/dist/validator/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/validator/validator.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/helper/cookie/index.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/utils/cookie.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse2 = (cookie, name2) => {
   const pairs = cookie.trim().split(";");
   return pairs.reduce((parsedCookie, pairStr) => {
      pairStr = pairStr.trim();
      const valueStartPos = pairStr.indexOf("=");
      if (valueStartPos === -1) {
         return parsedCookie;
      }
      const cookieName = pairStr.substring(0, valueStartPos).trim();
      if ((name2 && name2 !== cookieName) || !validCookieNameRegEx.test(cookieName)) {
         return parsedCookie;
      }
      let cookieValue = pairStr.substring(valueStartPos + 1).trim();
      if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
         cookieValue = cookieValue.slice(1, -1);
      }
      if (validCookieValueRegEx.test(cookieValue)) {
         parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
      }
      return parsedCookie;
   }, {});
};

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c2, key, prefix) => {
   const cookie = c2.req.raw.headers.get("Cookie");
   if (typeof key === "string") {
      if (!cookie) {
         return void 0;
      }
      let finalKey = key;
      if (prefix === "secure") {
         finalKey = "__Secure-" + key;
      } else if (prefix === "host") {
         finalKey = "__Host-" + key;
      }
      const obj2 = parse2(cookie, finalKey);
      return obj2[finalKey];
   }
   if (!cookie) {
      return {};
   }
   const obj = parse2(cookie);
   return obj;
};

// node_modules/hono/dist/http-exception.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var HTTPException = class extends Error {
   res;
   status;
   constructor(status = 500, options) {
      super(options?.message, { cause: options?.cause });
      this.res = options?.res;
      this.status = status;
   }
   getResponse() {
      if (this.res) {
         const newResponse = new Response(this.res.body, {
            status: this.status,
            headers: this.res.headers,
         });
         return newResponse;
      }
      return new Response(this.message, {
         status: this.status,
      });
   }
};

// node_modules/hono/dist/utils/buffer.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/utils/crypto.js
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
   const response = new Response(arrayBuffer, {
      headers: {
         "Content-Type": contentType,
      },
   });
   return response.formData();
};

// node_modules/hono/dist/validator/validator.js
var validator = (target, validationFunc) => {
   return async (c2, next) => {
      let value = {};
      const contentType = c2.req.header("Content-Type");
      switch (target) {
         case "json":
            if (!contentType || !/^application\/([a-z-\.]+\+)?json/.test(contentType)) {
               const message2 = `Invalid HTTP header: Content-Type=${contentType}`;
               throw new HTTPException(400, { message: message2 });
            }
            try {
               value = await c2.req.json();
            } catch {
               const message2 = "Malformed JSON in request body";
               throw new HTTPException(400, { message: message2 });
            }
            break;
         case "form": {
            if (!contentType) {
               break;
            }
            let formData;
            if (c2.req.bodyCache.formData) {
               formData = await c2.req.bodyCache.formData;
            } else {
               try {
                  const arrayBuffer = await c2.req.arrayBuffer();
                  formData = await bufferToFormData(arrayBuffer, contentType);
                  c2.req.bodyCache.formData = formData;
               } catch (e) {
                  let message2 = "Malformed FormData request.";
                  message2 += e instanceof Error ? ` ${e.message}` : ` ${String(e)}`;
                  throw new HTTPException(400, { message: message2 });
               }
            }
            const form = {};
            formData.forEach((value2, key) => {
               if (key.endsWith("[]")) {
                  if (form[key] === void 0) {
                     form[key] = [value2];
                  } else if (Array.isArray(form[key])) {
                     form[key].push(value2);
                  }
               } else {
                  form[key] = value2;
               }
            });
            value = form;
            break;
         }
         case "query":
            value = Object.fromEntries(
               Object.entries(c2.req.queries()).map(([k2, v2]) => {
                  return v2.length === 1 ? [k2, v2[0]] : [k2, v2];
               }),
            );
            break;
         case "param":
            value = c2.req.param();
            break;
         case "header":
            value = c2.req.header();
            break;
         case "cookie":
            value = getCookie(c2);
            break;
      }
      const res = await validationFunc(value, c2);
      if (res instanceof Response) {
         return res;
      }
      c2.req.addValidatedData(target, res);
      await next();
   };
};

// src/route-utils.ts
async function handleRequest(c2, onRequest, onError) {
   try {
      const result = await onRequest();
      return result;
   } catch (e) {
      let errorResult;
      if (isDBError(e)) {
         errorResult = onError?.(e);
         if (errorResult) {
            return errorResult;
         }
         if (e.isErrorType("INVALID_ID" /* INVALID_ID */)) {
            return invalidFormBody(c2);
         }
         if (e.isErrorType("NULL_USER" /* NULL_USER */)) {
            return notFound(c2, createError(Error2.unknownUser(e.error.cause)));
         }
         if (e.isErrorType("NULL_RELATIONSHIP" /* NULL_RELATIONSHIP */)) {
            return notFound(c2, createError(Error2.unknownRelationship(e.error.cause)));
         }
         if (e.isErrorType("NULL_CHANNEL" /* NULL_CHANNEL */)) {
            return notFound(c2, createError(Error2.unknownChannel(e.error.cause)));
         }
         if (e.isErrorType("NULL_MESSAGE" /* NULL_MESSAGE */)) {
            return notFound(c2, createError(Error2.unknownMessage(e.error.cause)));
         }
      }
      let otherError = e;
      if (isPrismaError(e)) {
         otherError = new DBError(e, "PRISMA ERROR");
      }
      return serverError(c2, otherError);
   }
}
function getJwt(c2) {
   return c2.get("jwtPayload");
}
function getRawToken(c2) {
   return c2.get("rawToken");
}
function error(c2, e, code = 400 /* BAD_REQUEST */) {
   return c2.json(e.toObject(), code);
}
function serverError(c2, e, log2 = true) {
   if (log2) {
      logServerError(c2.req.path, e);
   }
   return error(c2, createError(Error2.serverError()), 500 /* SERVER_ERROR */);
}
function unauthorized(c2) {
   return error(c2, createError(Error2.unauthorized()), 401 /* UNAUTHORIZED */);
}
function invalidFormBody(c2) {
   return error(c2, createError(Error2.invalidFormBody()));
}
function notFound(c2, factory) {
   return error(c2, factory, 404 /* NOT_FOUND */);
}
var hValidator = (target, schema10) =>
   // @ts-expect-error not types well
   validator(target, async (value, c2) => {
      const result = await schema10.safeParseAsync(value);
      if (!result.success) {
         return invalidFormBody(c2);
      }
      return result.data;
   });
function verifyJwt() {
   return createFactory().createMiddleware(async (c2, next) => {
      const bearer = c2.req.header("Authorization");
      if (!bearer) {
         return unauthorized(c2);
      }
      const token = bearer.split(" ")[1];
      const { valid, payload } = await verifyToken(token);
      if (!valid || !payload) {
         return unauthorized(c2);
      }
      if (!(await prisma.user.exists({ id: BigInt(payload.id) }))) {
         return unauthorized(c2);
      }
      c2.set("jwtPayload", payload);
      c2.set("rawToken", token);
      await next();
   });
}
async function tryGetBodyJson(reqOrRes) {
   try {
      return await reqOrRes.json();
   } catch (e) {
      return void 0;
   }
}
function getFileHash(file) {
   const hash = new Bun.CryptoHasher("md5").update(file, "hex").digest("hex");
   return hash;
}

// src/routes/route-merger.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// src/routes/auth/post-login.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// ../../node_modules/zod/lib/index.mjs
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var util;
(function (util2) {
   util2.assertEqual = val => val;
   function assertIs(_arg) {}
   util2.assertIs = assertIs;
   function assertNever(_x) {
      throw new Error();
   }
   util2.assertNever = assertNever;
   util2.arrayToEnum = items => {
      const obj = {};
      for (const item of items) {
         obj[item] = item;
      }
      return obj;
   };
   util2.getValidEnumValues = obj => {
      const validKeys = util2.objectKeys(obj).filter(k2 => typeof obj[obj[k2]] !== "number");
      const filtered = {};
      for (const k2 of validKeys) {
         filtered[k2] = obj[k2];
      }
      return util2.objectValues(filtered);
   };
   util2.objectValues = obj => {
      return util2.objectKeys(obj).map(function (e) {
         return obj[e];
      });
   };
   util2.objectKeys =
      typeof Object.keys === "function"
         ? obj => Object.keys(obj)
         : object => {
              const keys2 = [];
              for (const key in object) {
                 if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys2.push(key);
                 }
              }
              return keys2;
           };
   util2.find = (arr, checker) => {
      for (const item of arr) {
         if (checker(item)) return item;
      }
      return void 0;
   };
   util2.isInteger =
      typeof Number.isInteger === "function"
         ? val => Number.isInteger(val)
         : val => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
   function joinValues(array, separator = " | ") {
      return array.map(val => (typeof val === "string" ? `'${val}'` : val)).join(separator);
   }
   util2.joinValues = joinValues;
   util2.jsonStringifyReplacer = (_2, value) => {
      if (typeof value === "bigint") {
         return value.toString();
      }
      return value;
   };
})(util || (util = {}));
var objectUtil;
(function (objectUtil2) {
   objectUtil2.mergeShapes = (first, second) => {
      return {
         ...first,
         ...second,
         // second overwrites first
      };
   };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
   "string",
   "nan",
   "number",
   "integer",
   "float",
   "boolean",
   "date",
   "bigint",
   "symbol",
   "function",
   "undefined",
   "null",
   "array",
   "object",
   "unknown",
   "promise",
   "void",
   "never",
   "map",
   "set",
]);
var getParsedType = data => {
   const t = typeof data;
   switch (t) {
      case "undefined":
         return ZodParsedType.undefined;
      case "string":
         return ZodParsedType.string;
      case "number":
         return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
         return ZodParsedType.boolean;
      case "function":
         return ZodParsedType.function;
      case "bigint":
         return ZodParsedType.bigint;
      case "symbol":
         return ZodParsedType.symbol;
      case "object":
         if (Array.isArray(data)) {
            return ZodParsedType.array;
         }
         if (data === null) {
            return ZodParsedType.null;
         }
         if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
         }
         if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
         }
         if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
         }
         if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
         }
         return ZodParsedType.object;
      default:
         return ZodParsedType.unknown;
   }
};
var ZodIssueCode = util.arrayToEnum([
   "invalid_type",
   "invalid_literal",
   "custom",
   "invalid_union",
   "invalid_union_discriminator",
   "invalid_enum_value",
   "unrecognized_keys",
   "invalid_arguments",
   "invalid_return_type",
   "invalid_date",
   "invalid_string",
   "too_small",
   "too_big",
   "invalid_intersection_types",
   "not_multiple_of",
   "not_finite",
]);
var quotelessJson = obj => {
   const json = JSON.stringify(obj, null, 2);
   return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class extends Error {
   constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = sub => {
         this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
         this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
         Object.setPrototypeOf(this, actualProto);
      } else {
         this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
   }
   get errors() {
      return this.issues;
   }
   format(_mapper) {
      const mapper =
         _mapper ||
         function (issue) {
            return issue.message;
         };
      const fieldErrors = { _errors: [] };
      const processError = error2 => {
         for (const issue of error2.issues) {
            if (issue.code === "invalid_union") {
               issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
               processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
               processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
               fieldErrors._errors.push(mapper(issue));
            } else {
               let curr = fieldErrors;
               let i = 0;
               while (i < issue.path.length) {
                  const el = issue.path[i];
                  const terminal = i === issue.path.length - 1;
                  if (!terminal) {
                     curr[el] = curr[el] || { _errors: [] };
                  } else {
                     curr[el] = curr[el] || { _errors: [] };
                     curr[el]._errors.push(mapper(issue));
                  }
                  curr = curr[el];
                  i++;
               }
            }
         }
      };
      processError(this);
      return fieldErrors;
   }
   static assert(value) {
      if (!(value instanceof ZodError)) {
         throw new Error(`Not a ZodError: ${value}`);
      }
   }
   toString() {
      return this.message;
   }
   get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
   }
   get isEmpty() {
      return this.issues.length === 0;
   }
   flatten(mapper = issue => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
         if (sub.path.length > 0) {
            fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
            fieldErrors[sub.path[0]].push(mapper(sub));
         } else {
            formErrors.push(mapper(sub));
         }
      }
      return { formErrors, fieldErrors };
   }
   get formErrors() {
      return this.flatten();
   }
};
ZodError.create = issues => {
   const error2 = new ZodError(issues);
   return error2;
};
var errorMap = (issue, _ctx) => {
   let message2;
   switch (issue.code) {
      case ZodIssueCode.invalid_type:
         if (issue.received === ZodParsedType.undefined) {
            message2 = "Required";
         } else {
            message2 = `Expected ${issue.expected}, received ${issue.received}`;
         }
         break;
      case ZodIssueCode.invalid_literal:
         message2 = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
         break;
      case ZodIssueCode.unrecognized_keys:
         message2 = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
         break;
      case ZodIssueCode.invalid_union:
         message2 = `Invalid input`;
         break;
      case ZodIssueCode.invalid_union_discriminator:
         message2 = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
         break;
      case ZodIssueCode.invalid_enum_value:
         message2 = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
         break;
      case ZodIssueCode.invalid_arguments:
         message2 = `Invalid function arguments`;
         break;
      case ZodIssueCode.invalid_return_type:
         message2 = `Invalid function return type`;
         break;
      case ZodIssueCode.invalid_date:
         message2 = `Invalid date`;
         break;
      case ZodIssueCode.invalid_string:
         if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
               message2 = `Invalid input: must include "${issue.validation.includes}"`;
               if (typeof issue.validation.position === "number") {
                  message2 = `${message2} at one or more positions greater than or equal to ${issue.validation.position}`;
               }
            } else if ("startsWith" in issue.validation) {
               message2 = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
               message2 = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
               util.assertNever(issue.validation);
            }
         } else if (issue.validation !== "regex") {
            message2 = `Invalid ${issue.validation}`;
         } else {
            message2 = "Invalid";
         }
         break;
      case ZodIssueCode.too_small:
         if (issue.type === "array")
            message2 = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
         else if (issue.type === "string")
            message2 = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
         else if (issue.type === "number")
            message2 = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
         else if (issue.type === "date")
            message2 = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
         else message2 = "Invalid input";
         break;
      case ZodIssueCode.too_big:
         if (issue.type === "array")
            message2 = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
         else if (issue.type === "string")
            message2 = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
         else if (issue.type === "number")
            message2 = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
         else if (issue.type === "bigint")
            message2 = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
         else if (issue.type === "date")
            message2 = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
         else message2 = "Invalid input";
         break;
      case ZodIssueCode.custom:
         message2 = `Invalid input`;
         break;
      case ZodIssueCode.invalid_intersection_types:
         message2 = `Intersection results could not be merged`;
         break;
      case ZodIssueCode.not_multiple_of:
         message2 = `Number must be a multiple of ${issue.multipleOf}`;
         break;
      case ZodIssueCode.not_finite:
         message2 = "Number must be finite";
         break;
      default:
         message2 = _ctx.defaultError;
         util.assertNever(issue);
   }
   return { message: message2 };
};
var overrideErrorMap = errorMap;
function setErrorMap(map) {
   overrideErrorMap = map;
}
function getErrorMap() {
   return overrideErrorMap;
}
var makeIssue = params => {
   const { data, path, errorMaps, issueData } = params;
   const fullPath = [...path, ...(issueData.path || [])];
   const fullIssue = {
      ...issueData,
      path: fullPath,
   };
   if (issueData.message !== void 0) {
      return {
         ...issueData,
         path: fullPath,
         message: issueData.message,
      };
   }
   let errorMessage = "";
   const maps = errorMaps
      .filter(m2 => !!m2)
      .slice()
      .reverse();
   for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
   }
   return {
      ...issueData,
      path: fullPath,
      message: errorMessage,
   };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
   const overrideMap = getErrorMap();
   const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
         ctx.common.contextualErrorMap,
         ctx.schemaErrorMap,
         overrideMap,
         overrideMap === errorMap ? void 0 : errorMap,
         // then global default map
      ].filter(x => !!x),
   });
   ctx.common.issues.push(issue);
}
var ParseStatus = class {
   constructor() {
      this.value = "valid";
   }
   dirty() {
      if (this.value === "valid") this.value = "dirty";
   }
   abort() {
      if (this.value !== "aborted") this.value = "aborted";
   }
   static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
         if (s.status === "aborted") return INVALID;
         if (s.status === "dirty") status.dirty();
         arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
   }
   static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
         const key = await pair.key;
         const value = await pair.value;
         syncPairs.push({
            key,
            value,
         });
      }
      return ParseStatus.mergeObjectSync(status, syncPairs);
   }
   static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
         const { key, value } = pair;
         if (key.status === "aborted") return INVALID;
         if (value.status === "aborted") return INVALID;
         if (key.status === "dirty") status.dirty();
         if (value.status === "dirty") status.dirty();
         if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
         }
      }
      return { status: status.value, value: finalObject };
   }
};
var INVALID = Object.freeze({
   status: "aborted",
});
var DIRTY = value => ({ status: "dirty", value });
var OK = value => ({ status: "valid", value });
var isAborted = x => x.status === "aborted";
var isDirty = x => x.status === "dirty";
var isValid = x => x.status === "valid";
var isAsync = x => typeof Promise !== "undefined" && x instanceof Promise;
function __classPrivateFieldGet(receiver, state, kind, f2) {
   if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a getter");
   if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver))
      throw new TypeError("Cannot read private member from an object whose class did not declare it");
   return kind === "m" ? f2 : kind === "a" ? f2.call(receiver) : f2 ? f2.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f2) {
   if (kind === "m") throw new TypeError("Private method is not writable");
   if (kind === "a" && !f2) throw new TypeError("Private accessor was defined without a setter");
   if (typeof state === "function" ? receiver !== state || !f2 : !state.has(receiver))
      throw new TypeError("Cannot write private member to an object whose class did not declare it");
   return kind === "a" ? f2.call(receiver, value) : f2 ? (f2.value = value) : state.set(receiver, value), value;
}
var errorUtil;
(function (errorUtil2) {
   errorUtil2.errToObj = message2 => (typeof message2 === "string" ? { message: message2 } : message2 || {});
   errorUtil2.toString = message2 =>
      typeof message2 === "string" ? message2 : message2 === null || message2 === void 0 ? void 0 : message2.message;
})(errorUtil || (errorUtil = {}));
var _ZodEnum_cache;
var _ZodNativeEnum_cache;
var ParseInputLazyPath = class {
   constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
   }
   get path() {
      if (!this._cachedPath.length) {
         if (this._key instanceof Array) {
            this._cachedPath.push(...this._path, ...this._key);
         } else {
            this._cachedPath.push(...this._path, this._key);
         }
      }
      return this._cachedPath;
   }
};
var handleResult = (ctx, result) => {
   if (isValid(result)) {
      return { success: true, data: result.value };
   } else {
      if (!ctx.common.issues.length) {
         throw new Error("Validation failed but no issues detected.");
      }
      return {
         success: false,
         get error() {
            if (this._error) return this._error;
            const error2 = new ZodError(ctx.common.issues);
            this._error = error2;
            return this._error;
         },
      };
   }
};
function processCreateParams(params) {
   if (!params) return {};
   const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
   if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
   }
   if (errorMap2) return { errorMap: errorMap2, description };
   const customMap = (iss, ctx) => {
      var _a2, _b2;
      const { message: message2 } = params;
      if (iss.code === "invalid_enum_value") {
         return { message: message2 !== null && message2 !== void 0 ? message2 : ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
         return {
            message:
               (_a2 = message2 !== null && message2 !== void 0 ? message2 : required_error) !== null && _a2 !== void 0
                  ? _a2
                  : ctx.defaultError,
         };
      }
      if (iss.code !== "invalid_type") return { message: ctx.defaultError };
      return {
         message:
            (_b2 = message2 !== null && message2 !== void 0 ? message2 : invalid_type_error) !== null && _b2 !== void 0
               ? _b2
               : ctx.defaultError,
      };
   };
   return { errorMap: customMap, description };
}
var ZodType = class {
   constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
   }
   get description() {
      return this._def.description;
   }
   _getType(input) {
      return getParsedType(input.data);
   }
   _getOrReturnCtx(input, ctx) {
      return (
         ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
         }
      );
   }
   _processInputParams(input) {
      return {
         status: new ParseStatus(),
         ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
         },
      };
   }
   _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) {
         throw new Error("Synchronous parse encountered promise.");
      }
      return result;
   }
   _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
   }
   parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success) return result.data;
      throw result.error;
   }
   safeParse(data, params) {
      var _a2;
      const ctx = {
         common: {
            issues: [],
            async: (_a2 = params === null || params === void 0 ? void 0 : params.async) !== null && _a2 !== void 0 ? _a2 : false,
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
         },
         path: (params === null || params === void 0 ? void 0 : params.path) || [],
         schemaErrorMap: this._def.errorMap,
         parent: null,
         data,
         parsedType: getParsedType(data),
      };
      const result = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result);
   }
   async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success) return result.data;
      throw result.error;
   }
   async safeParseAsync(data, params) {
      const ctx = {
         common: {
            issues: [],
            contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            async: true,
         },
         path: (params === null || params === void 0 ? void 0 : params.path) || [],
         schemaErrorMap: this._def.errorMap,
         parent: null,
         data,
         parsedType: getParsedType(data),
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
   }
   refine(check, message2) {
      const getIssueProperties = val => {
         if (typeof message2 === "string" || typeof message2 === "undefined") {
            return { message: message2 };
         } else if (typeof message2 === "function") {
            return message2(val);
         } else {
            return message2;
         }
      };
      return this._refinement((val, ctx) => {
         const result = check(val);
         const setError = () =>
            ctx.addIssue({
               code: ZodIssueCode.custom,
               ...getIssueProperties(val),
            });
         if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then(data => {
               if (!data) {
                  setError();
                  return false;
               } else {
                  return true;
               }
            });
         }
         if (!result) {
            setError();
            return false;
         } else {
            return true;
         }
      });
   }
   refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
         if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
         } else {
            return true;
         }
      });
   }
   _refinement(refinement) {
      return new ZodEffects({
         schema: this,
         typeName: ZodFirstPartyTypeKind.ZodEffects,
         effect: { type: "refinement", refinement },
      });
   }
   superRefine(refinement) {
      return this._refinement(refinement);
   }
   optional() {
      return ZodOptional.create(this, this._def);
   }
   nullable() {
      return ZodNullable.create(this, this._def);
   }
   nullish() {
      return this.nullable().optional();
   }
   array() {
      return ZodArray.create(this, this._def);
   }
   promise() {
      return ZodPromise.create(this, this._def);
   }
   or(option) {
      return ZodUnion.create([this, option], this._def);
   }
   and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
   }
   transform(transform) {
      return new ZodEffects({
         ...processCreateParams(this._def),
         schema: this,
         typeName: ZodFirstPartyTypeKind.ZodEffects,
         effect: { type: "transform", transform },
      });
   }
   default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
         ...processCreateParams(this._def),
         innerType: this,
         defaultValue: defaultValueFunc,
         typeName: ZodFirstPartyTypeKind.ZodDefault,
      });
   }
   brand() {
      return new ZodBranded({
         typeName: ZodFirstPartyTypeKind.ZodBranded,
         type: this,
         ...processCreateParams(this._def),
      });
   }
   catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
         ...processCreateParams(this._def),
         innerType: this,
         catchValue: catchValueFunc,
         typeName: ZodFirstPartyTypeKind.ZodCatch,
      });
   }
   describe(description) {
      const This = this.constructor;
      return new This({
         ...this._def,
         description,
      });
   }
   pipe(target) {
      return ZodPipeline.create(this, target);
   }
   readonly() {
      return ZodReadonly.create(this);
   }
   isOptional() {
      return this.safeParse(void 0).success;
   }
   isNullable() {
      return this.safeParse(null).success;
   }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var durationRegex =
   /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6Regex =
   /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
   let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
   if (args.precision) {
      regex = `${regex}\\.\\d{${args.precision}}`;
   } else if (args.precision == null) {
      regex = `${regex}(\\.\\d+)?`;
   }
   return regex;
}
function timeRegex(args) {
   return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
   let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
   const opts = [];
   opts.push(args.local ? `Z?` : `Z`);
   if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
   regex = `${regex}(${opts.join("|")})`;
   return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version4) {
   if ((version4 === "v4" || !version4) && ipv4Regex.test(ip)) {
      return true;
   }
   if ((version4 === "v6" || !version4) && ipv6Regex.test(ip)) {
      return true;
   }
   return false;
}
var ZodString = class extends ZodType {
   _parse(input) {
      if (this._def.coerce) {
         input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
         const ctx2 = this._getOrReturnCtx(input);
         addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType,
         });
         return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
         if (check.kind === "min") {
            if (input.data.length < check.value) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: false,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "max") {
            if (input.data.length > check.value) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: false,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
               ctx = this._getOrReturnCtx(input, ctx);
               if (tooBig) {
                  addIssueToContext(ctx, {
                     code: ZodIssueCode.too_big,
                     maximum: check.value,
                     type: "string",
                     inclusive: true,
                     exact: true,
                     message: check.message,
                  });
               } else if (tooSmall) {
                  addIssueToContext(ctx, {
                     code: ZodIssueCode.too_small,
                     minimum: check.value,
                     type: "string",
                     inclusive: true,
                     exact: true,
                     message: check.message,
                  });
               }
               status.dirty();
            }
         } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "email",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "emoji") {
            if (!emojiRegex) {
               emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "emoji",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "uuid",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "nanoid",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "cuid",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "cuid2",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "ulid",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "url") {
            try {
               new URL(input.data);
            } catch (_a2) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "url",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "regex",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "trim") {
            input.data = input.data.trim();
         } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_string,
                  validation: { includes: check.value, position: check.position },
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
         } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
         } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_string,
                  validation: { startsWith: check.value },
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_string,
                  validation: { endsWith: check.value },
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_string,
                  validation: "datetime",
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_string,
                  validation: "date",
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_string,
                  validation: "time",
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "duration",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "ip",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  validation: "base64",
                  code: ZodIssueCode.invalid_string,
                  message: check.message,
               });
               status.dirty();
            }
         } else {
            util.assertNever(check);
         }
      }
      return { status: status.value, value: input.data };
   }
   _regex(regex, validation, message2) {
      return this.refinement(data => regex.test(data), {
         validation,
         code: ZodIssueCode.invalid_string,
         ...errorUtil.errToObj(message2),
      });
   }
   _addCheck(check) {
      return new ZodString({
         ...this._def,
         checks: [...this._def.checks, check],
      });
   }
   email(message2) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message2) });
   }
   url(message2) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message2) });
   }
   emoji(message2) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message2) });
   }
   uuid(message2) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message2) });
   }
   nanoid(message2) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message2) });
   }
   cuid(message2) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message2) });
   }
   cuid2(message2) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message2) });
   }
   ulid(message2) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message2) });
   }
   base64(message2) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message2) });
   }
   ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
   }
   datetime(options) {
      var _a2, _b2;
      if (typeof options === "string") {
         return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options,
         });
      }
      return this._addCheck({
         kind: "datetime",
         precision:
            typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined"
               ? null
               : options === null || options === void 0
                 ? void 0
                 : options.precision,
         offset: (_a2 = options === null || options === void 0 ? void 0 : options.offset) !== null && _a2 !== void 0 ? _a2 : false,
         local: (_b2 = options === null || options === void 0 ? void 0 : options.local) !== null && _b2 !== void 0 ? _b2 : false,
         ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
      });
   }
   date(message2) {
      return this._addCheck({ kind: "date", message: message2 });
   }
   time(options) {
      if (typeof options === "string") {
         return this._addCheck({
            kind: "time",
            precision: null,
            message: options,
         });
      }
      return this._addCheck({
         kind: "time",
         precision:
            typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined"
               ? null
               : options === null || options === void 0
                 ? void 0
                 : options.precision,
         ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
      });
   }
   duration(message2) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message2) });
   }
   regex(regex, message2) {
      return this._addCheck({
         kind: "regex",
         regex,
         ...errorUtil.errToObj(message2),
      });
   }
   includes(value, options) {
      return this._addCheck({
         kind: "includes",
         value,
         position: options === null || options === void 0 ? void 0 : options.position,
         ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
      });
   }
   startsWith(value, message2) {
      return this._addCheck({
         kind: "startsWith",
         value,
         ...errorUtil.errToObj(message2),
      });
   }
   endsWith(value, message2) {
      return this._addCheck({
         kind: "endsWith",
         value,
         ...errorUtil.errToObj(message2),
      });
   }
   min(minLength, message2) {
      return this._addCheck({
         kind: "min",
         value: minLength,
         ...errorUtil.errToObj(message2),
      });
   }
   max(maxLength, message2) {
      return this._addCheck({
         kind: "max",
         value: maxLength,
         ...errorUtil.errToObj(message2),
      });
   }
   length(len, message2) {
      return this._addCheck({
         kind: "length",
         value: len,
         ...errorUtil.errToObj(message2),
      });
   }
   /**
    * @deprecated Use z.string().min(1) instead.
    * @see {@link ZodString.min}
    */
   nonempty(message2) {
      return this.min(1, errorUtil.errToObj(message2));
   }
   trim() {
      return new ZodString({
         ...this._def,
         checks: [...this._def.checks, { kind: "trim" }],
      });
   }
   toLowerCase() {
      return new ZodString({
         ...this._def,
         checks: [...this._def.checks, { kind: "toLowerCase" }],
      });
   }
   toUpperCase() {
      return new ZodString({
         ...this._def,
         checks: [...this._def.checks, { kind: "toUpperCase" }],
      });
   }
   get isDatetime() {
      return !!this._def.checks.find(ch => ch.kind === "datetime");
   }
   get isDate() {
      return !!this._def.checks.find(ch => ch.kind === "date");
   }
   get isTime() {
      return !!this._def.checks.find(ch => ch.kind === "time");
   }
   get isDuration() {
      return !!this._def.checks.find(ch => ch.kind === "duration");
   }
   get isEmail() {
      return !!this._def.checks.find(ch => ch.kind === "email");
   }
   get isURL() {
      return !!this._def.checks.find(ch => ch.kind === "url");
   }
   get isEmoji() {
      return !!this._def.checks.find(ch => ch.kind === "emoji");
   }
   get isUUID() {
      return !!this._def.checks.find(ch => ch.kind === "uuid");
   }
   get isNANOID() {
      return !!this._def.checks.find(ch => ch.kind === "nanoid");
   }
   get isCUID() {
      return !!this._def.checks.find(ch => ch.kind === "cuid");
   }
   get isCUID2() {
      return !!this._def.checks.find(ch => ch.kind === "cuid2");
   }
   get isULID() {
      return !!this._def.checks.find(ch => ch.kind === "ulid");
   }
   get isIP() {
      return !!this._def.checks.find(ch => ch.kind === "ip");
   }
   get isBase64() {
      return !!this._def.checks.find(ch => ch.kind === "base64");
   }
   get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "min") {
            if (min === null || ch.value > min) min = ch.value;
         }
      }
      return min;
   }
   get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "max") {
            if (max === null || ch.value < max) max = ch.value;
         }
      }
      return max;
   }
};
ZodString.create = params => {
   var _a2;
   return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: (_a2 = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a2 !== void 0 ? _a2 : false,
      ...processCreateParams(params),
   });
};
function floatSafeRemainder(val, step) {
   const valDecCount = (val.toString().split(".")[1] || "").length;
   const stepDecCount = (step.toString().split(".")[1] || "").length;
   const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
   const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
   const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
   return (valInt % stepInt) / Math.pow(10, decCount);
}
var ZodNumber = class extends ZodType {
   constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
   }
   _parse(input) {
      if (this._def.coerce) {
         input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
         const ctx2 = this._getOrReturnCtx(input);
         addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType,
         });
         return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
         if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.invalid_type,
                  expected: "integer",
                  received: "float",
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "number",
                  inclusive: check.inclusive,
                  exact: false,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "number",
                  inclusive: check.inclusive,
                  exact: false,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.not_multiple_of,
                  multipleOf: check.value,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.not_finite,
                  message: check.message,
               });
               status.dirty();
            }
         } else {
            util.assertNever(check);
         }
      }
      return { status: status.value, value: input.data };
   }
   gte(value, message2) {
      return this.setLimit("min", value, true, errorUtil.toString(message2));
   }
   gt(value, message2) {
      return this.setLimit("min", value, false, errorUtil.toString(message2));
   }
   lte(value, message2) {
      return this.setLimit("max", value, true, errorUtil.toString(message2));
   }
   lt(value, message2) {
      return this.setLimit("max", value, false, errorUtil.toString(message2));
   }
   setLimit(kind, value, inclusive, message2) {
      return new ZodNumber({
         ...this._def,
         checks: [
            ...this._def.checks,
            {
               kind,
               value,
               inclusive,
               message: errorUtil.toString(message2),
            },
         ],
      });
   }
   _addCheck(check) {
      return new ZodNumber({
         ...this._def,
         checks: [...this._def.checks, check],
      });
   }
   int(message2) {
      return this._addCheck({
         kind: "int",
         message: errorUtil.toString(message2),
      });
   }
   positive(message2) {
      return this._addCheck({
         kind: "min",
         value: 0,
         inclusive: false,
         message: errorUtil.toString(message2),
      });
   }
   negative(message2) {
      return this._addCheck({
         kind: "max",
         value: 0,
         inclusive: false,
         message: errorUtil.toString(message2),
      });
   }
   nonpositive(message2) {
      return this._addCheck({
         kind: "max",
         value: 0,
         inclusive: true,
         message: errorUtil.toString(message2),
      });
   }
   nonnegative(message2) {
      return this._addCheck({
         kind: "min",
         value: 0,
         inclusive: true,
         message: errorUtil.toString(message2),
      });
   }
   multipleOf(value, message2) {
      return this._addCheck({
         kind: "multipleOf",
         value,
         message: errorUtil.toString(message2),
      });
   }
   finite(message2) {
      return this._addCheck({
         kind: "finite",
         message: errorUtil.toString(message2),
      });
   }
   safe(message2) {
      return this._addCheck({
         kind: "min",
         inclusive: true,
         value: Number.MIN_SAFE_INTEGER,
         message: errorUtil.toString(message2),
      })._addCheck({
         kind: "max",
         inclusive: true,
         value: Number.MAX_SAFE_INTEGER,
         message: errorUtil.toString(message2),
      });
   }
   get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "min") {
            if (min === null || ch.value > min) min = ch.value;
         }
      }
      return min;
   }
   get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "max") {
            if (max === null || ch.value < max) max = ch.value;
         }
      }
      return max;
   }
   get isInt() {
      return !!this._def.checks.find(ch => ch.kind === "int" || (ch.kind === "multipleOf" && util.isInteger(ch.value)));
   }
   get isFinite() {
      let max = null,
         min = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
         } else if (ch.kind === "min") {
            if (min === null || ch.value > min) min = ch.value;
         } else if (ch.kind === "max") {
            if (max === null || ch.value < max) max = ch.value;
         }
      }
      return Number.isFinite(min) && Number.isFinite(max);
   }
};
ZodNumber.create = params => {
   return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
      ...processCreateParams(params),
   });
};
var ZodBigInt = class extends ZodType {
   constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
   }
   _parse(input) {
      if (this._def.coerce) {
         input.data = BigInt(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
         const ctx2 = this._getOrReturnCtx(input);
         addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx2.parsedType,
         });
         return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
         if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  type: "bigint",
                  minimum: check.value,
                  inclusive: check.inclusive,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  type: "bigint",
                  maximum: check.value,
                  inclusive: check.inclusive,
                  message: check.message,
               });
               status.dirty();
            }
         } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.not_multiple_of,
                  multipleOf: check.value,
                  message: check.message,
               });
               status.dirty();
            }
         } else {
            util.assertNever(check);
         }
      }
      return { status: status.value, value: input.data };
   }
   gte(value, message2) {
      return this.setLimit("min", value, true, errorUtil.toString(message2));
   }
   gt(value, message2) {
      return this.setLimit("min", value, false, errorUtil.toString(message2));
   }
   lte(value, message2) {
      return this.setLimit("max", value, true, errorUtil.toString(message2));
   }
   lt(value, message2) {
      return this.setLimit("max", value, false, errorUtil.toString(message2));
   }
   setLimit(kind, value, inclusive, message2) {
      return new ZodBigInt({
         ...this._def,
         checks: [
            ...this._def.checks,
            {
               kind,
               value,
               inclusive,
               message: errorUtil.toString(message2),
            },
         ],
      });
   }
   _addCheck(check) {
      return new ZodBigInt({
         ...this._def,
         checks: [...this._def.checks, check],
      });
   }
   positive(message2) {
      return this._addCheck({
         kind: "min",
         value: BigInt(0),
         inclusive: false,
         message: errorUtil.toString(message2),
      });
   }
   negative(message2) {
      return this._addCheck({
         kind: "max",
         value: BigInt(0),
         inclusive: false,
         message: errorUtil.toString(message2),
      });
   }
   nonpositive(message2) {
      return this._addCheck({
         kind: "max",
         value: BigInt(0),
         inclusive: true,
         message: errorUtil.toString(message2),
      });
   }
   nonnegative(message2) {
      return this._addCheck({
         kind: "min",
         value: BigInt(0),
         inclusive: true,
         message: errorUtil.toString(message2),
      });
   }
   multipleOf(value, message2) {
      return this._addCheck({
         kind: "multipleOf",
         value,
         message: errorUtil.toString(message2),
      });
   }
   get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "min") {
            if (min === null || ch.value > min) min = ch.value;
         }
      }
      return min;
   }
   get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "max") {
            if (max === null || ch.value < max) max = ch.value;
         }
      }
      return max;
   }
};
ZodBigInt.create = params => {
   var _a2;
   return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: (_a2 = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a2 !== void 0 ? _a2 : false,
      ...processCreateParams(params),
   });
};
var ZodBoolean = class extends ZodType {
   _parse(input) {
      if (this._def.coerce) {
         input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      return OK(input.data);
   }
};
ZodBoolean.create = params => {
   return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
      ...processCreateParams(params),
   });
};
var ZodDate = class extends ZodType {
   _parse(input) {
      if (this._def.coerce) {
         input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
         const ctx2 = this._getOrReturnCtx(input);
         addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType,
         });
         return INVALID;
      }
      if (isNaN(input.data.getTime())) {
         const ctx2 = this._getOrReturnCtx(input);
         addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date,
         });
         return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
         if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  message: check.message,
                  inclusive: true,
                  exact: false,
                  minimum: check.value,
                  type: "date",
               });
               status.dirty();
            }
         } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
               ctx = this._getOrReturnCtx(input, ctx);
               addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  message: check.message,
                  inclusive: true,
                  exact: false,
                  maximum: check.value,
                  type: "date",
               });
               status.dirty();
            }
         } else {
            util.assertNever(check);
         }
      }
      return {
         status: status.value,
         value: new Date(input.data.getTime()),
      };
   }
   _addCheck(check) {
      return new ZodDate({
         ...this._def,
         checks: [...this._def.checks, check],
      });
   }
   min(minDate, message2) {
      return this._addCheck({
         kind: "min",
         value: minDate.getTime(),
         message: errorUtil.toString(message2),
      });
   }
   max(maxDate, message2) {
      return this._addCheck({
         kind: "max",
         value: maxDate.getTime(),
         message: errorUtil.toString(message2),
      });
   }
   get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "min") {
            if (min === null || ch.value > min) min = ch.value;
         }
      }
      return min != null ? new Date(min) : null;
   }
   get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
         if (ch.kind === "max") {
            if (max === null || ch.value < max) max = ch.value;
         }
      }
      return max != null ? new Date(max) : null;
   }
};
ZodDate.create = params => {
   return new ZodDate({
      checks: [],
      coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params),
   });
};
var ZodSymbol = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      return OK(input.data);
   }
};
ZodSymbol.create = params => {
   return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params),
   });
};
var ZodUndefined = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      return OK(input.data);
   }
};
ZodUndefined.create = params => {
   return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params),
   });
};
var ZodNull = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      return OK(input.data);
   }
};
ZodNull.create = params => {
   return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params),
   });
};
var ZodAny = class extends ZodType {
   constructor() {
      super(...arguments);
      this._any = true;
   }
   _parse(input) {
      return OK(input.data);
   }
};
ZodAny.create = params => {
   return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params),
   });
};
var ZodUnknown = class extends ZodType {
   constructor() {
      super(...arguments);
      this._unknown = true;
   }
   _parse(input) {
      return OK(input.data);
   }
};
ZodUnknown.create = params => {
   return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params),
   });
};
var ZodNever = class extends ZodType {
   _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
         code: ZodIssueCode.invalid_type,
         expected: ZodParsedType.never,
         received: ctx.parsedType,
      });
      return INVALID;
   }
};
ZodNever.create = params => {
   return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params),
   });
};
var ZodVoid = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      return OK(input.data);
   }
};
ZodVoid.create = params => {
   return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params),
   });
};
var ZodArray = class extends ZodType {
   _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      if (def.exactLength !== null) {
         const tooBig = ctx.data.length > def.exactLength.value;
         const tooSmall = ctx.data.length < def.exactLength.value;
         if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
               code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
               minimum: tooSmall ? def.exactLength.value : void 0,
               maximum: tooBig ? def.exactLength.value : void 0,
               type: "array",
               inclusive: true,
               exact: true,
               message: def.exactLength.message,
            });
            status.dirty();
         }
      }
      if (def.minLength !== null) {
         if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
               code: ZodIssueCode.too_small,
               minimum: def.minLength.value,
               type: "array",
               inclusive: true,
               exact: false,
               message: def.minLength.message,
            });
            status.dirty();
         }
      }
      if (def.maxLength !== null) {
         if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
               code: ZodIssueCode.too_big,
               maximum: def.maxLength.value,
               type: "array",
               inclusive: true,
               exact: false,
               message: def.maxLength.message,
            });
            status.dirty();
         }
      }
      if (ctx.common.async) {
         return Promise.all(
            [...ctx.data].map((item, i) => {
               return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            }),
         ).then(result2 => {
            return ParseStatus.mergeArray(status, result2);
         });
      }
      const result = [...ctx.data].map((item, i) => {
         return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
   }
   get element() {
      return this._def.type;
   }
   min(minLength, message2) {
      return new ZodArray({
         ...this._def,
         minLength: { value: minLength, message: errorUtil.toString(message2) },
      });
   }
   max(maxLength, message2) {
      return new ZodArray({
         ...this._def,
         maxLength: { value: maxLength, message: errorUtil.toString(message2) },
      });
   }
   length(len, message2) {
      return new ZodArray({
         ...this._def,
         exactLength: { value: len, message: errorUtil.toString(message2) },
      });
   }
   nonempty(message2) {
      return this.min(1, message2);
   }
};
ZodArray.create = (schema10, params) => {
   return new ZodArray({
      type: schema10,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params),
   });
};
function deepPartialify(schema10) {
   if (schema10 instanceof ZodObject) {
      const newShape = {};
      for (const key in schema10.shape) {
         const fieldSchema = schema10.shape[key];
         newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
         ...schema10._def,
         shape: () => newShape,
      });
   } else if (schema10 instanceof ZodArray) {
      return new ZodArray({
         ...schema10._def,
         type: deepPartialify(schema10.element),
      });
   } else if (schema10 instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema10.unwrap()));
   } else if (schema10 instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema10.unwrap()));
   } else if (schema10 instanceof ZodTuple) {
      return ZodTuple.create(schema10.items.map(item => deepPartialify(item)));
   } else {
      return schema10;
   }
}
var ZodObject = class extends ZodType {
   constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
   }
   _getCached() {
      if (this._cached !== null) return this._cached;
      const shape = this._def.shape();
      const keys2 = util.objectKeys(shape);
      return (this._cached = { shape, keys: keys2 });
   }
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
         const ctx2 = this._getOrReturnCtx(input);
         addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType,
         });
         return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
         for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
               extraKeys.push(key);
            }
         }
      }
      const pairs = [];
      for (const key of shapeKeys) {
         const keyValidator = shape[key];
         const value = ctx.data[key];
         pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data,
         });
      }
      if (this._def.catchall instanceof ZodNever) {
         const unknownKeys = this._def.unknownKeys;
         if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
               pairs.push({
                  key: { status: "valid", value: key },
                  value: { status: "valid", value: ctx.data[key] },
               });
            }
         } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
               addIssueToContext(ctx, {
                  code: ZodIssueCode.unrecognized_keys,
                  keys: extraKeys,
               });
               status.dirty();
            }
         } else if (unknownKeys === "strip");
         else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
         }
      } else {
         const catchall = this._def.catchall;
         for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
               key: { status: "valid", value: key },
               value: catchall._parse(
                  new ParseInputLazyPath(ctx, value, ctx.path, key),
                  //, ctx.child(key), value, getParsedType(value)
               ),
               alwaysSet: key in ctx.data,
            });
         }
      }
      if (ctx.common.async) {
         return Promise.resolve()
            .then(async () => {
               const syncPairs = [];
               for (const pair of pairs) {
                  const key = await pair.key;
                  const value = await pair.value;
                  syncPairs.push({
                     key,
                     value,
                     alwaysSet: pair.alwaysSet,
                  });
               }
               return syncPairs;
            })
            .then(syncPairs => {
               return ParseStatus.mergeObjectSync(status, syncPairs);
            });
      } else {
         return ParseStatus.mergeObjectSync(status, pairs);
      }
   }
   get shape() {
      return this._def.shape();
   }
   strict(message2) {
      errorUtil.errToObj;
      return new ZodObject({
         ...this._def,
         unknownKeys: "strict",
         ...(message2 !== void 0
            ? {
                 errorMap: (issue, ctx) => {
                    var _a2, _b2, _c2, _d2;
                    const defaultError =
                       (_c2 =
                          (_b2 = (_a2 = this._def).errorMap) === null || _b2 === void 0
                             ? void 0
                             : _b2.call(_a2, issue, ctx).message) !== null && _c2 !== void 0
                          ? _c2
                          : ctx.defaultError;
                    if (issue.code === "unrecognized_keys")
                       return {
                          message: (_d2 = errorUtil.errToObj(message2).message) !== null && _d2 !== void 0 ? _d2 : defaultError,
                       };
                    return {
                       message: defaultError,
                    };
                 },
              }
            : {}),
      });
   }
   strip() {
      return new ZodObject({
         ...this._def,
         unknownKeys: "strip",
      });
   }
   passthrough() {
      return new ZodObject({
         ...this._def,
         unknownKeys: "passthrough",
      });
   }
   // const AugmentFactory =
   //   <Def extends ZodObjectDef>(def: Def) =>
   //   <Augmentation extends ZodRawShape>(
   //     augmentation: Augmentation
   //   ): ZodObject<
   //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
   //     Def["unknownKeys"],
   //     Def["catchall"]
   //   > => {
   //     return new ZodObject({
   //       ...def,
   //       shape: () => ({
   //         ...def.shape(),
   //         ...augmentation,
   //       }),
   //     }) as any;
   //   };
   extend(augmentation) {
      return new ZodObject({
         ...this._def,
         shape: () => ({
            ...this._def.shape(),
            ...augmentation,
         }),
      });
   }
   /**
    * Prior to zod@1.0.12 there was a bug in the
    * inferred type of merged objects. Please
    * upgrade if you are experiencing issues.
    */
   merge(merging) {
      const merged = new ZodObject({
         unknownKeys: merging._def.unknownKeys,
         catchall: merging._def.catchall,
         shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape(),
         }),
         typeName: ZodFirstPartyTypeKind.ZodObject,
      });
      return merged;
   }
   // merge<
   //   Incoming extends AnyZodObject,
   //   Augmentation extends Incoming["shape"],
   //   NewOutput extends {
   //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
   //       ? Augmentation[k]["_output"]
   //       : k extends keyof Output
   //       ? Output[k]
   //       : never;
   //   },
   //   NewInput extends {
   //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
   //       ? Augmentation[k]["_input"]
   //       : k extends keyof Input
   //       ? Input[k]
   //       : never;
   //   }
   // >(
   //   merging: Incoming
   // ): ZodObject<
   //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
   //   Incoming["_def"]["unknownKeys"],
   //   Incoming["_def"]["catchall"],
   //   NewOutput,
   //   NewInput
   // > {
   //   const merged: any = new ZodObject({
   //     unknownKeys: merging._def.unknownKeys,
   //     catchall: merging._def.catchall,
   //     shape: () =>
   //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
   //     typeName: ZodFirstPartyTypeKind.ZodObject,
   //   }) as any;
   //   return merged;
   // }
   setKey(key, schema10) {
      return this.augment({ [key]: schema10 });
   }
   // merge<Incoming extends AnyZodObject>(
   //   merging: Incoming
   // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
   // ZodObject<
   //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
   //   Incoming["_def"]["unknownKeys"],
   //   Incoming["_def"]["catchall"]
   // > {
   //   // const mergedShape = objectUtil.mergeShapes(
   //   //   this._def.shape(),
   //   //   merging._def.shape()
   //   // );
   //   const merged: any = new ZodObject({
   //     unknownKeys: merging._def.unknownKeys,
   //     catchall: merging._def.catchall,
   //     shape: () =>
   //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
   //     typeName: ZodFirstPartyTypeKind.ZodObject,
   //   }) as any;
   //   return merged;
   // }
   catchall(index) {
      return new ZodObject({
         ...this._def,
         catchall: index,
      });
   }
   pick(mask) {
      const shape = {};
      util.objectKeys(mask).forEach(key => {
         if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
         }
      });
      return new ZodObject({
         ...this._def,
         shape: () => shape,
      });
   }
   omit(mask) {
      const shape = {};
      util.objectKeys(this.shape).forEach(key => {
         if (!mask[key]) {
            shape[key] = this.shape[key];
         }
      });
      return new ZodObject({
         ...this._def,
         shape: () => shape,
      });
   }
   /**
    * @deprecated
    */
   deepPartial() {
      return deepPartialify(this);
   }
   partial(mask) {
      const newShape = {};
      util.objectKeys(this.shape).forEach(key => {
         const fieldSchema = this.shape[key];
         if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
         } else {
            newShape[key] = fieldSchema.optional();
         }
      });
      return new ZodObject({
         ...this._def,
         shape: () => newShape,
      });
   }
   required(mask) {
      const newShape = {};
      util.objectKeys(this.shape).forEach(key => {
         if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
         } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
               newField = newField._def.innerType;
            }
            newShape[key] = newField;
         }
      });
      return new ZodObject({
         ...this._def,
         shape: () => newShape,
      });
   }
   keyof() {
      return createZodEnum(util.objectKeys(this.shape));
   }
};
ZodObject.create = (shape, params) => {
   return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params),
   });
};
ZodObject.strictCreate = (shape, params) => {
   return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params),
   });
};
ZodObject.lazycreate = (shape, params) => {
   return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params),
   });
};
var ZodUnion = class extends ZodType {
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
         for (const result of results) {
            if (result.result.status === "valid") {
               return result.result;
            }
         }
         for (const result of results) {
            if (result.result.status === "dirty") {
               ctx.common.issues.push(...result.ctx.common.issues);
               return result.result;
            }
         }
         const unionErrors = results.map(result => new ZodError(result.ctx.common.issues));
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors,
         });
         return INVALID;
      }
      if (ctx.common.async) {
         return Promise.all(
            options.map(async option => {
               const childCtx = {
                  ...ctx,
                  common: {
                     ...ctx.common,
                     issues: [],
                  },
                  parent: null,
               };
               return {
                  result: await option._parseAsync({
                     data: ctx.data,
                     path: ctx.path,
                     parent: childCtx,
                  }),
                  ctx: childCtx,
               };
            }),
         ).then(handleResults);
      } else {
         let dirty = void 0;
         const issues = [];
         for (const option of options) {
            const childCtx = {
               ...ctx,
               common: {
                  ...ctx.common,
                  issues: [],
               },
               parent: null,
            };
            const result = option._parseSync({
               data: ctx.data,
               path: ctx.path,
               parent: childCtx,
            });
            if (result.status === "valid") {
               return result;
            } else if (result.status === "dirty" && !dirty) {
               dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
               issues.push(childCtx.common.issues);
            }
         }
         if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
         }
         const unionErrors = issues.map(issues2 => new ZodError(issues2));
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors,
         });
         return INVALID;
      }
   }
   get options() {
      return this._def.options;
   }
};
ZodUnion.create = (types4, params) => {
   return new ZodUnion({
      options: types4,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params),
   });
};
var getDiscriminator = type => {
   if (type instanceof ZodLazy) {
      return getDiscriminator(type.schema);
   } else if (type instanceof ZodEffects) {
      return getDiscriminator(type.innerType());
   } else if (type instanceof ZodLiteral) {
      return [type.value];
   } else if (type instanceof ZodEnum) {
      return type.options;
   } else if (type instanceof ZodNativeEnum) {
      return util.objectValues(type.enum);
   } else if (type instanceof ZodDefault) {
      return getDiscriminator(type._def.innerType);
   } else if (type instanceof ZodUndefined) {
      return [void 0];
   } else if (type instanceof ZodNull) {
      return [null];
   } else if (type instanceof ZodOptional) {
      return [void 0, ...getDiscriminator(type.unwrap())];
   } else if (type instanceof ZodNullable) {
      return [null, ...getDiscriminator(type.unwrap())];
   } else if (type instanceof ZodBranded) {
      return getDiscriminator(type.unwrap());
   } else if (type instanceof ZodReadonly) {
      return getDiscriminator(type.unwrap());
   } else if (type instanceof ZodCatch) {
      return getDiscriminator(type._def.innerType);
   } else {
      return [];
   }
};
var ZodDiscriminatedUnion = class extends ZodType {
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator],
         });
         return INVALID;
      }
      if (ctx.common.async) {
         return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx,
         });
      } else {
         return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx,
         });
      }
   }
   get discriminator() {
      return this._def.discriminator;
   }
   get options() {
      return this._def.options;
   }
   get optionsMap() {
      return this._def.optionsMap;
   }
   /**
    * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
    * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
    * have a different value for each object in the union.
    * @param discriminator the name of the discriminator property
    * @param types an array of object schemas
    * @param params
    */
   static create(discriminator, options, params) {
      const optionsMap = /* @__PURE__ */ new Map();
      for (const type of options) {
         const discriminatorValues = getDiscriminator(type.shape[discriminator]);
         if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
         }
         for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
               throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
         }
      }
      return new ZodDiscriminatedUnion({
         typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
         discriminator,
         options,
         optionsMap,
         ...processCreateParams(params),
      });
   }
};
function mergeValues(a, b) {
   const aType = getParsedType(a);
   const bType = getParsedType(b);
   if (a === b) {
      return { valid: true, data: a };
   } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter(key => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
         const sharedValue = mergeValues(a[key], b[key]);
         if (!sharedValue.valid) {
            return { valid: false };
         }
         newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
   } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
         return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
         const itemA = a[index];
         const itemB = b[index];
         const sharedValue = mergeValues(itemA, itemB);
         if (!sharedValue.valid) {
            return { valid: false };
         }
         newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
   } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
   } else {
      return { valid: false };
   }
}
var ZodIntersection = class extends ZodType {
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
         if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
         }
         const merged = mergeValues(parsedLeft.value, parsedRight.value);
         if (!merged.valid) {
            addIssueToContext(ctx, {
               code: ZodIssueCode.invalid_intersection_types,
            });
            return INVALID;
         }
         if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
         }
         return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
         return Promise.all([
            this._def.left._parseAsync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            }),
            this._def.right._parseAsync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            }),
         ]).then(([left, right]) => handleParsed(left, right));
      } else {
         return handleParsed(
            this._def.left._parseSync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            }),
            this._def.right._parseSync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            }),
         );
      }
   }
};
ZodIntersection.create = (left, right, params) => {
   return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params),
   });
};
var ZodTuple = class extends ZodType {
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array",
         });
         return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array",
         });
         status.dirty();
      }
      const items = [...ctx.data]
         .map((item, itemIndex) => {
            const schema10 = this._def.items[itemIndex] || this._def.rest;
            if (!schema10) return null;
            return schema10._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
         })
         .filter(x => !!x);
      if (ctx.common.async) {
         return Promise.all(items).then(results => {
            return ParseStatus.mergeArray(status, results);
         });
      } else {
         return ParseStatus.mergeArray(status, items);
      }
   }
   get items() {
      return this._def.items;
   }
   rest(rest) {
      return new ZodTuple({
         ...this._def,
         rest,
      });
   }
};
ZodTuple.create = (schemas, params) => {
   if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
   }
   return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params),
   });
};
var ZodRecord = class extends ZodType {
   get keySchema() {
      return this._def.keyType;
   }
   get valueSchema() {
      return this._def.valueType;
   }
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
         pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data,
         });
      }
      if (ctx.common.async) {
         return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
         return ParseStatus.mergeObjectSync(status, pairs);
      }
   }
   get element() {
      return this._def.valueType;
   }
   static create(first, second, third) {
      if (second instanceof ZodType) {
         return new ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third),
         });
      }
      return new ZodRecord({
         keyType: ZodString.create(),
         valueType: first,
         typeName: ZodFirstPartyTypeKind.ZodRecord,
         ...processCreateParams(second),
      });
   }
};
var ZodMap = class extends ZodType {
   get keySchema() {
      return this._def.keyType;
   }
   get valueSchema() {
      return this._def.valueType;
   }
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
         return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
         };
      });
      if (ctx.common.async) {
         const finalMap = /* @__PURE__ */ new Map();
         return Promise.resolve().then(async () => {
            for (const pair of pairs) {
               const key = await pair.key;
               const value = await pair.value;
               if (key.status === "aborted" || value.status === "aborted") {
                  return INVALID;
               }
               if (key.status === "dirty" || value.status === "dirty") {
                  status.dirty();
               }
               finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
         });
      } else {
         const finalMap = /* @__PURE__ */ new Map();
         for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
               return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
               status.dirty();
            }
            finalMap.set(key.value, value.value);
         }
         return { status: status.value, value: finalMap };
      }
   }
};
ZodMap.create = (keyType, valueType, params) => {
   return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params),
   });
};
var ZodSet = class extends ZodType {
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
         if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
               code: ZodIssueCode.too_small,
               minimum: def.minSize.value,
               type: "set",
               inclusive: true,
               exact: false,
               message: def.minSize.message,
            });
            status.dirty();
         }
      }
      if (def.maxSize !== null) {
         if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
               code: ZodIssueCode.too_big,
               maximum: def.maxSize.value,
               type: "set",
               inclusive: true,
               exact: false,
               message: def.maxSize.message,
            });
            status.dirty();
         }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
         const parsedSet = /* @__PURE__ */ new Set();
         for (const element of elements2) {
            if (element.status === "aborted") return INVALID;
            if (element.status === "dirty") status.dirty();
            parsedSet.add(element.value);
         }
         return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
         return Promise.all(elements).then(elements2 => finalizeSet(elements2));
      } else {
         return finalizeSet(elements);
      }
   }
   min(minSize, message2) {
      return new ZodSet({
         ...this._def,
         minSize: { value: minSize, message: errorUtil.toString(message2) },
      });
   }
   max(maxSize, message2) {
      return new ZodSet({
         ...this._def,
         maxSize: { value: maxSize, message: errorUtil.toString(message2) },
      });
   }
   size(size, message2) {
      return this.min(size, message2).max(size, message2);
   }
   nonempty(message2) {
      return this.min(1, message2);
   }
};
ZodSet.create = (valueType, params) => {
   return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params),
   });
};
var ZodFunction = class extends ZodType {
   constructor() {
      super(...arguments);
      this.validate = this.implement;
   }
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.function,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      function makeArgsIssue(args, error2) {
         return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap].filter(x => !!x),
            issueData: {
               code: ZodIssueCode.invalid_arguments,
               argumentsError: error2,
            },
         });
      }
      function makeReturnsIssue(returns, error2) {
         return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap].filter(x => !!x),
            issueData: {
               code: ZodIssueCode.invalid_return_type,
               returnTypeError: error2,
            },
         });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
         const me = this;
         return OK(async function (...args) {
            const error2 = new ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch(e => {
               error2.addIssue(makeArgsIssue(args, e));
               throw error2;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch(e => {
               error2.addIssue(makeReturnsIssue(result, e));
               throw error2;
            });
            return parsedReturns;
         });
      } else {
         const me = this;
         return OK(function (...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
               throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
               throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
         });
      }
   }
   parameters() {
      return this._def.args;
   }
   returnType() {
      return this._def.returns;
   }
   args(...items) {
      return new ZodFunction({
         ...this._def,
         args: ZodTuple.create(items).rest(ZodUnknown.create()),
      });
   }
   returns(returnType) {
      return new ZodFunction({
         ...this._def,
         returns: returnType,
      });
   }
   implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
   }
   strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
   }
   static create(args, returns, params) {
      return new ZodFunction({
         args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
         returns: returns || ZodUnknown.create(),
         typeName: ZodFirstPartyTypeKind.ZodFunction,
         ...processCreateParams(params),
      });
   }
};
var ZodLazy = class extends ZodType {
   get schema() {
      return this._def.getter();
   }
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
   }
};
ZodLazy.create = (getter, params) => {
   return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params),
   });
};
var ZodLiteral = class extends ZodType {
   _parse(input) {
      if (input.data !== this._def.value) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value,
         });
         return INVALID;
      }
      return { status: "valid", value: input.data };
   }
   get value() {
      return this._def.value;
   }
};
ZodLiteral.create = (value, params) => {
   return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params),
   });
};
function createZodEnum(values, params) {
   return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params),
   });
}
var ZodEnum = class extends ZodType {
   constructor() {
      super(...arguments);
      _ZodEnum_cache.set(this, void 0);
   }
   _parse(input) {
      if (typeof input.data !== "string") {
         const ctx = this._getOrReturnCtx(input);
         const expectedValues = this._def.values;
         addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type,
         });
         return INVALID;
      }
      if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
         __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
      }
      if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
         const ctx = this._getOrReturnCtx(input);
         const expectedValues = this._def.values;
         addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues,
         });
         return INVALID;
      }
      return OK(input.data);
   }
   get options() {
      return this._def.values;
   }
   get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
         enumValues[val] = val;
      }
      return enumValues;
   }
   get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
         enumValues[val] = val;
      }
      return enumValues;
   }
   get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
         enumValues[val] = val;
      }
      return enumValues;
   }
   extract(values, newDef = this._def) {
      return ZodEnum.create(values, {
         ...this._def,
         ...newDef,
      });
   }
   exclude(values, newDef = this._def) {
      return ZodEnum.create(
         this.options.filter(opt => !values.includes(opt)),
         {
            ...this._def,
            ...newDef,
         },
      );
   }
};
_ZodEnum_cache = /* @__PURE__ */ new WeakMap();
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
   constructor() {
      super(...arguments);
      _ZodNativeEnum_cache.set(this, void 0);
   }
   _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
         const expectedValues = util.objectValues(nativeEnumValues);
         addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type,
         });
         return INVALID;
      }
      if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
         __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
      }
      if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
         const expectedValues = util.objectValues(nativeEnumValues);
         addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues,
         });
         return INVALID;
      }
      return OK(input.data);
   }
   get enum() {
      return this._def.values;
   }
};
_ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
ZodNativeEnum.create = (values, params) => {
   return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params),
   });
};
var ZodPromise = class extends ZodType {
   unwrap() {
      return this._def.type;
   }
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(
         promisified.then(data => {
            return this._def.type.parseAsync(data, {
               path: ctx.path,
               errorMap: ctx.common.contextualErrorMap,
            });
         }),
      );
   }
};
ZodPromise.create = (schema10, params) => {
   return new ZodPromise({
      type: schema10,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params),
   });
};
var ZodEffects = class extends ZodType {
   innerType() {
      return this._def.schema;
   }
   sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
   }
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
         addIssue: arg => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
               status.abort();
            } else {
               status.dirty();
            }
         },
         get path() {
            return ctx.path;
         },
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
         const processed = effect.transform(ctx.data, checkCtx);
         if (ctx.common.async) {
            return Promise.resolve(processed).then(async processed2 => {
               if (status.value === "aborted") return INVALID;
               const result = await this._def.schema._parseAsync({
                  data: processed2,
                  path: ctx.path,
                  parent: ctx,
               });
               if (result.status === "aborted") return INVALID;
               if (result.status === "dirty") return DIRTY(result.value);
               if (status.value === "dirty") return DIRTY(result.value);
               return result;
            });
         } else {
            if (status.value === "aborted") return INVALID;
            const result = this._def.schema._parseSync({
               data: processed,
               path: ctx.path,
               parent: ctx,
            });
            if (result.status === "aborted") return INVALID;
            if (result.status === "dirty") return DIRTY(result.value);
            if (status.value === "dirty") return DIRTY(result.value);
            return result;
         }
      }
      if (effect.type === "refinement") {
         const executeRefinement = acc => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
               return Promise.resolve(result);
            }
            if (result instanceof Promise) {
               throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
         };
         if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            });
            if (inner.status === "aborted") return INVALID;
            if (inner.status === "dirty") status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
         } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then(inner => {
               if (inner.status === "aborted") return INVALID;
               if (inner.status === "dirty") status.dirty();
               return executeRefinement(inner.value).then(() => {
                  return { status: status.value, value: inner.value };
               });
            });
         }
      }
      if (effect.type === "transform") {
         if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            });
            if (!isValid(base)) return base;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
               throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
         } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then(base => {
               if (!isValid(base)) return base;
               return Promise.resolve(effect.transform(base.value, checkCtx)).then(result => ({
                  status: status.value,
                  value: result,
               }));
            });
         }
      }
      util.assertNever(effect);
   }
};
ZodEffects.create = (schema10, effect, params) => {
   return new ZodEffects({
      schema: schema10,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params),
   });
};
ZodEffects.createWithPreprocess = (preprocess, schema10, params) => {
   return new ZodEffects({
      schema: schema10,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params),
   });
};
var ZodOptional = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
         return OK(void 0);
      }
      return this._def.innerType._parse(input);
   }
   unwrap() {
      return this._def.innerType;
   }
};
ZodOptional.create = (type, params) => {
   return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params),
   });
};
var ZodNullable = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
         return OK(null);
      }
      return this._def.innerType._parse(input);
   }
   unwrap() {
      return this._def.innerType;
   }
};
ZodNullable.create = (type, params) => {
   return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params),
   });
};
var ZodDefault = class extends ZodType {
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
         data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
         data,
         path: ctx.path,
         parent: ctx,
      });
   }
   removeDefault() {
      return this._def.innerType;
   }
};
ZodDefault.create = (type, params) => {
   return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params),
   });
};
var ZodCatch = class extends ZodType {
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
         ...ctx,
         common: {
            ...ctx.common,
            issues: [],
         },
      };
      const result = this._def.innerType._parse({
         data: newCtx.data,
         path: newCtx.path,
         parent: {
            ...newCtx,
         },
      });
      if (isAsync(result)) {
         return result.then(result2 => {
            return {
               status: "valid",
               value:
                  result2.status === "valid"
                     ? result2.value
                     : this._def.catchValue({
                          get error() {
                             return new ZodError(newCtx.common.issues);
                          },
                          input: newCtx.data,
                       }),
            };
         });
      } else {
         return {
            status: "valid",
            value:
               result.status === "valid"
                  ? result.value
                  : this._def.catchValue({
                       get error() {
                          return new ZodError(newCtx.common.issues);
                       },
                       input: newCtx.data,
                    }),
         };
      }
   }
   removeCatch() {
      return this._def.innerType;
   }
};
ZodCatch.create = (type, params) => {
   return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params),
   });
};
var ZodNaN = class extends ZodType {
   _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
         const ctx = this._getOrReturnCtx(input);
         addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType,
         });
         return INVALID;
      }
      return { status: "valid", value: input.data };
   }
};
ZodNaN.create = params => {
   return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params),
   });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
   _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
         data,
         path: ctx.path,
         parent: ctx,
      });
   }
   unwrap() {
      return this._def.type;
   }
};
var ZodPipeline = class extends ZodType {
   _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
         const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
               data: ctx.data,
               path: ctx.path,
               parent: ctx,
            });
            if (inResult.status === "aborted") return INVALID;
            if (inResult.status === "dirty") {
               status.dirty();
               return DIRTY(inResult.value);
            } else {
               return this._def.out._parseAsync({
                  data: inResult.value,
                  path: ctx.path,
                  parent: ctx,
               });
            }
         };
         return handleAsync();
      } else {
         const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx,
         });
         if (inResult.status === "aborted") return INVALID;
         if (inResult.status === "dirty") {
            status.dirty();
            return {
               status: "dirty",
               value: inResult.value,
            };
         } else {
            return this._def.out._parseSync({
               data: inResult.value,
               path: ctx.path,
               parent: ctx,
            });
         }
      }
   }
   static create(a, b) {
      return new ZodPipeline({
         in: a,
         out: b,
         typeName: ZodFirstPartyTypeKind.ZodPipeline,
      });
   }
};
var ZodReadonly = class extends ZodType {
   _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = data => {
         if (isValid(data)) {
            data.value = Object.freeze(data.value);
         }
         return data;
      };
      return isAsync(result) ? result.then(data => freeze(data)) : freeze(result);
   }
   unwrap() {
      return this._def.innerType;
   }
};
ZodReadonly.create = (type, params) => {
   return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params),
   });
};
function custom(check, params = {}, fatal) {
   if (check)
      return ZodAny.create().superRefine((data, ctx) => {
         var _a2, _b2;
         if (!check(data)) {
            const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
            const _fatal = (_b2 = (_a2 = p.fatal) !== null && _a2 !== void 0 ? _a2 : fatal) !== null && _b2 !== void 0 ? _b2 : true;
            const p2 = typeof p === "string" ? { message: p } : p;
            ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });
         }
      });
   return ZodAny.create();
}
var late = {
   object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind2) {
   ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
   ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
   ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
   ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
   ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
   ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
   ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
   ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
   ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
   ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
   ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
   ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
   ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
   ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
   ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
   ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
   ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
   ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
   ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
   ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
   ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
   ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
   ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
   ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
   ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
   ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
   ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
   ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
   ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
   ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
   ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
   ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
   ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
   ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
   ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
   ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (
   cls,
   params = {
      message: `Input not instance of ${cls.name}`,
   },
) => custom(data => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
   string: arg => ZodString.create({ ...arg, coerce: true }),
   number: arg => ZodNumber.create({ ...arg, coerce: true }),
   boolean: arg =>
      ZodBoolean.create({
         ...arg,
         coerce: true,
      }),
   bigint: arg => ZodBigInt.create({ ...arg, coerce: true }),
   date: arg => ZodDate.create({ ...arg, coerce: true }),
};
var NEVER = INVALID;
var z = /* @__PURE__ */ Object.freeze({
   __proto__: null,
   defaultErrorMap: errorMap,
   setErrorMap,
   getErrorMap,
   makeIssue,
   EMPTY_PATH,
   addIssueToContext,
   ParseStatus,
   INVALID,
   DIRTY,
   OK,
   isAborted,
   isDirty,
   isValid,
   isAsync,
   get util() {
      return util;
   },
   get objectUtil() {
      return objectUtil;
   },
   ZodParsedType,
   getParsedType,
   ZodType,
   datetimeRegex,
   ZodString,
   ZodNumber,
   ZodBigInt,
   ZodBoolean,
   ZodDate,
   ZodSymbol,
   ZodUndefined,
   ZodNull,
   ZodAny,
   ZodUnknown,
   ZodNever,
   ZodVoid,
   ZodArray,
   ZodObject,
   ZodUnion,
   ZodDiscriminatedUnion,
   ZodIntersection,
   ZodTuple,
   ZodRecord,
   ZodMap,
   ZodSet,
   ZodFunction,
   ZodLazy,
   ZodLiteral,
   ZodEnum,
   ZodNativeEnum,
   ZodPromise,
   ZodEffects,
   ZodTransformer: ZodEffects,
   ZodOptional,
   ZodNullable,
   ZodDefault,
   ZodCatch,
   ZodNaN,
   BRAND,
   ZodBranded,
   ZodPipeline,
   ZodReadonly,
   custom,
   Schema: ZodType,
   ZodSchema: ZodType,
   late,
   get ZodFirstPartyTypeKind() {
      return ZodFirstPartyTypeKind;
   },
   coerce,
   any: anyType,
   array: arrayType,
   bigint: bigIntType,
   boolean: booleanType,
   date: dateType,
   discriminatedUnion: discriminatedUnionType,
   effect: effectsType,
   enum: enumType,
   function: functionType,
   instanceof: instanceOfType,
   intersection: intersectionType,
   lazy: lazyType,
   literal: literalType,
   map: mapType,
   nan: nanType,
   nativeEnum: nativeEnumType,
   never: neverType,
   null: nullType,
   nullable: nullableType,
   number: numberType,
   object: objectType,
   oboolean,
   onumber,
   optional: optionalType,
   ostring,
   pipeline: pipelineType,
   preprocess: preprocessType,
   promise: promiseType,
   record: recordType,
   set: setType,
   strictObject: strictObjectType,
   string: stringType,
   symbol: symbolType,
   transformer: effectsType,
   tuple: tupleType,
   undefined: undefinedType,
   union: unionType,
   unknown: unknownType,
   void: voidType,
   NEVER,
   ZodIssueCode,
   quotelessJson,
   ZodError,
});

// src/routes/auth/post-login.ts
var schema = z.object({
   username: z.optional(z.string()),
   email: z.optional(z.string()),
   password: z.string(),
});
var app = new Hono2();
app.post("/auth/login", hValidator("json", schema), c2 =>
   handleRequest(
      c2,
      async () => {
         const body = c2.req.valid("json");
         const user = idFix(await prisma.user.findByCredentials(body));
         const [accessToken, refreshToken] = await createTokens(
            { id: user.id },
            constants.ACCESS_TOKEN_EXPIRE_TIME,
            constants.REFRESH_TOKEN_EXPIRE_TIME,
         );
         const json = { ...user, token: accessToken, refreshToken };
         return c2.json(json, 200 /* OK */);
      },
      e => {
         if (e.isErrorType("NULL_USER" /* NULL_USER */)) {
            return error(
               c2,
               createError(Error2.invalidFormBody())
                  .addError("login", Field.invalidLogin())
                  .addError("password", Field.invalidLogin()),
            );
         }
      },
   ),
);
var post_login_default = app;

// src/routes/auth/post-logout.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app2 = new Hono2();
app2.post("/auth/logout", verifyJwt(), c2 =>
   handleRequest(c2, () => {
      const token = getRawToken(c2);
      tokenInvalidator.invalidate(token);
      return c2.newResponse(null, 204 /* NO_CONTENT */);
   }),
);
var post_logout_default = app2;

// src/routes/auth/post-refresh-token.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var schema2 = z.object({ refreshToken: z.string() });
var app3 = new Hono2();
app3.post("/auth/refresh-token", hValidator("json", schema2), c2 =>
   handleRequest(c2, async () => {
      const body = c2.req.valid("json");
      const { payload } = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET_ENCODED);
      const [accessToken, refreshToken] = await createTokens(
         { id: payload?.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const json = { token: accessToken, refreshToken };
      return c2.json(json, 200 /* OK */);
   }),
);
var post_refresh_token_default = app3;

// src/routes/auth/post-register.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// src/validation.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function validateEmail(email, errorObject) {
   if (email && !email.match(constants.EMAIL_REGEX)) {
      errorObject.addError("email", Field.emailInvalid());
      return false;
   }
   return true;
}
function validateUsername(username, errorObject) {
   const [minLen, maxLen] = [constants.USERNAME_MIN_LENGTH, constants.USERNAME_MAX_LENGTH];
   if (username && (username.length < minLen || username.length > maxLen)) {
      errorObject.addError("username", Field.wrongLength(minLen, maxLen));
      return false;
   }
   return true;
}
function validateDisplayName(displayName, errorObject) {
   const [minLen, maxLen] = [constants.DISPLAY_NAME_MIN_LENGTH, constants.DISPLAY_NAME_MAX_LENGTH];
   if (displayName && (displayName.length < minLen || displayName.length > maxLen)) {
      errorObject.addError("displayName", Field.wrongLength(minLen, maxLen));
      return true;
   }
   return false;
}
function validateCorrectPassword(password, correctPassword, errorObject) {
   if (password && password !== correctPassword) {
      errorObject.addError("password", Field.passwordIncorrect());
      return false;
   }
   return true;
}
function validatePassword(password, errorObject) {
   if (password && password.length < constants.PASSWORD_MIN_LENGTH) {
      errorObject.addError("password", Field.wrongLength(constants.PASSWORD_MIN_LENGTH));
      return false;
   }
   return true;
}
async function validateEmailUnique(email, errorObject) {
   if (!email) {
      return true;
   }
   if (await prisma.user.exists({ email })) {
      errorObject.addError("email", Field.emailInUse());
      return false;
   }
   return true;
}
async function validateUsernameUnique(username, errorObject) {
   if (!username) {
      return true;
   }
   if (await prisma.user.exists({ username })) {
      errorObject?.addError("username", Field.usernameTaken());
      return false;
   }
   return true;
}

// src/routes/auth/post-register.ts
var schema3 = z.object({
   username: z.string(),
   displayName: z.string(),
   email: z.string(),
   password: z.string(),
});
var app4 = new Hono2();
app4.post("/auth/register", hValidator("json", schema3), async c2 =>
   handleRequest(c2, async () => {
      const body = c2.req.valid("json");
      body.username = body.username.toLowerCase();
      const formError = createError(Error2.invalidFormBody());
      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validatePassword(body.password, formError);
      validateEmail(body.email, formError);
      if (formError.hasErrors()) {
         return error(c2, formError);
      }
      const databaseError = createError(Error2.invalidFormBody());
      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);
      if (databaseError.hasErrors()) {
         return error(c2, databaseError);
      }
      const user = idFix(await prisma.user.registerNew(body));
      const [accessToken, refreshToken] = await createTokens(
         { id: user.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const json = { ...user, token: accessToken, refreshToken };
      return c2.json(json, 201 /* CREATED */);
   }),
);
var post_register_default = app4;

// src/routes/channel/delete-channel-bid.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// src/db/common.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var import_client8 = __toESM(require_default2(), 1);
var includeChannelRecipients = import_client8.Prisma.validator()({
   recipients: { select: { id: true, username: true, avatar: true, displayName: true } },
});
var excludeSelfChannelUser = id => import_client8.Prisma.validator()({ recipients: { where: { id: { not: BigInt(id) } } } });
var includeMessageAuthor = import_client8.Prisma.validator()({
   author: { select: { id: true, username: true, displayName: true, avatar: true, flags: true } },
});
var includeMessageMentions = import_client8.Prisma.validator()({
   mentions: { select: { id: true, username: true, displayName: true, avatar: true, flags: true } },
});
var includeRelationshipUser = import_client8.Prisma.validator()({
   user: { select: { id: true, username: true, displayName: true, avatar: true, flags: true } },
});

// src/routes/channel/delete-channel-bid.ts
var app5 = new Hono2();
app5.delete("/channels/:channelId", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const channelId = c2.req.param("channelId");
      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return notFound(c2, createError(Error2.unknownChannel(channelId)));
      }
      const channel = idFix(await prisma.channel.deleteDM(channelId, payload.id, includeChannelRecipients));
      dispatchToTopic(payload.id, "channel_delete", channel, 0);
      return c2.json(channel, 200 /* OK */);
   }),
);
var delete_channel_bid_default = app5;

// src/routes/channel/get-channel-bid.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app6 = new Hono2();
app6.get("/channels/:channelId", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const channelId = c2.req.param("channelId");
      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return notFound(c2, createError(Error2.unknownChannel(channelId)));
      }
      const channel = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));
      return c2.json(channel, 200 /* OK */);
   }),
);
var get_channel_bid_default = app6;

// src/routes/channel/get-channel-messages.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var schema4 = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });
var app7 = new Hono2();
app7.get("/channels/:channelId/messages", verifyJwt(), hValidator("query", schema4), c2 =>
   handleRequest(c2, async () => {
      const query = c2.req.valid("query");
      const limit = Number(query.limit) || 50;
      const before = query.before;
      const after = query.after;
      const channelId = c2.req.param("channelId");
      const messages = omitArray(
         idFix(await prisma.message.getMessages(channelId, limit, before, after, merge(includeMessageAuthor, includeMessageMentions))),
         ["authorId"],
      );
      await new Promise(r => setTimeout(r, 1e3));
      return c2.json(messages, 200 /* OK */);
   }),
);
var get_channel_messages_default = app7;

// src/routes/channel/get-message-bid.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app8 = new Hono2();
app8.get("/channels/:channelId/messages/:messageId", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const channelId = c2.req.param("channelId");
      const messageId = c2.req.param("messageId");
      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return unauthorized(c2);
      }
      const message2 = omit(
         idFix(await prisma.message.getById(channelId, messageId, merge(includeMessageAuthor, includeMessageMentions))),
         ["authorId"],
      );
      return c2.json(message2, 200 /* OK */);
   }),
);
var get_message_bid_default = app8;

// src/routes/channel/post-message.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var schema5 = z.object({
   content: z.optional(z.string()),
   attachments: z.optional(z.array(z.string())),
   flags: z.optional(z.number()),
   nonce: z.optional(z.union([z.number(), z.string()])),
});
var app9 = new Hono2();
app9.post("/channels/:channelId/messages", verifyJwt(), hValidator("json", schema5), c2 =>
   handleRequest(c2, async () => {
      const body = c2.req.valid("json");
      const payload = getJwt(c2);
      if (!body.content && !body.attachments) {
         return invalidFormBody(c2);
      }
      const channelId = c2.req.param("channelId");
      const message2 = omit(
         idFix(
            await prisma.message.createDefaultMessage(payload.id, channelId, body.content, body.attachments, body.flags, {
               author: true,
               mentions: true,
            }),
         ),
         ["authorId"],
      );
      message2.nonce = body.nonce;
      dispatchToTopic(channelId, "message_create", message2, 0);
      return c2.json(message2, 201 /* CREATED */);
   }),
);
var post_message_default = app9;

// src/routes/post-unique-username.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var schema6 = z.object({ username: z.string() });
var app10 = new Hono2();
app10.post("/unique-username", hValidator("json", schema6), c2 =>
   handleRequest(c2, async () => {
      const body = c2.req.valid("json");
      const isUnique = await validateUsernameUnique(body.username.toLowerCase());
      const json = { taken: !isUnique };
      return c2.json(json, 200 /* OK */);
   }),
);
var post_unique_username_default = app10;

// src/routes/relationship/delete-relationship-buid.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app11 = new Hono2();
app11.delete("/users/@me/relationships/:userId", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const userId = c2.req.param("userId");
      await prisma.relationship.deleteByUserId(payload.id, userId);
      dispatchToTopic(payload.id, "relationship_delete", userId, 0);
      dispatchToTopic(userId, "relationship_delete", payload.id, 0);
      return c2.newResponse(null, 200 /* OK */);
   }),
);
var delete_relationship_buid_default = app11;

// src/routes/relationship/get-relationship-buid.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app12 = new Hono2();
app12.get("/users/@me/relationships/:userId", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const userId = c2.req.param("userId");
      const relationship = idFix(
         omit(await prisma.relationship.getByUserId(payload.id, userId, includeRelationshipUser), ["ownerId", "userId"]),
      );
      return c2.json(relationship, 200 /* OK */);
   }),
);
var get_relationship_buid_default = app12;

// src/routes/relationship/get-user-relationships.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app13 = new Hono2();
app13.get("/users/@me/relationships", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const relationships = omitArray(idFix(await prisma.relationship.getUserRelationships(payload.id, includeRelationshipUser)), [
         "ownerId",
         "userId",
      ]);
      return c2.json(relationships, 200 /* OK */);
   }),
);
var get_user_relationships_default = app13;

// src/routes/relationship/post-put-relationship.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var schema7 = z.object({ username: z.string() });
var app14 = new Hono2();
async function requestRest(c2, userId) {
   const payload = getJwt(c2);
   if (userId === payload.id) {
      return error(c2, createError(Error2.relationshipSelfRequest()), 400 /* BAD_REQUEST */);
   }
   if (await prisma.relationship.exists({ ownerId: BigInt(payload.id), userId: BigInt(userId), type: 1 /* FRIEND */ })) {
      return error(c2, createError(Error2.relationshipExists()), 400 /* BAD_REQUEST */);
   }
   if (
      !(await prisma.relationship.exists({
         ownerId: BigInt(payload.id),
         userId: BigInt(userId),
         type: 4 /* PENDING_OUTGOING */,
      }))
   ) {
      const relationships = idFix(await prisma.relationship.createRelationship(payload.id, userId, { user: true }));
      dispatchToTopic(
         payload.id,
         "relationship_create",
         relationships.find(x => x.ownerId === payload.id),
         0,
      );
      dispatchToTopic(
         userId,
         "relationship_create",
         relationships.find(x => x.ownerId === userId),
         0,
      );
   }
   return c2.newResponse(null, 204 /* NO_CONTENT */);
}
app14.post("/users/@me/relationships", verifyJwt(), hValidator("json", schema7), c2 =>
   handleRequest(
      c2,
      async () => {
         const body = c2.req.valid("json");
         if (!body.username) {
            return error(c2, createError(Error2.invalidFormBody()));
         }
         const userId = idFix(await prisma.user.getByUsername(body.username)).id;
         return requestRest(c2, userId);
      },
      e => {
         if (e.isErrorType("NULL_USER" /* NULL_USER */)) {
            return error(c2, createError(Error2.noUserWithUsername()), 404 /* NOT_FOUND */);
         }
      },
   ),
);
app14.put("/users/@me/relationships/:userId", verifyJwt(), c2 =>
   handleRequest(
      c2,
      async () => {
         const userId = c2.req.param("userId");
         return requestRest(c2, userId);
      },
      e => {
         if (e.isErrorType("NULL_USER" /* NULL_USER */)) {
            return error(c2, createError(Error2.noUserWithUsername()), 404 /* NOT_FOUND */);
         }
      },
   ),
);
var post_put_relationship_default = app14;

// src/routes/user/get-current-user.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app15 = new Hono2();
app15.get("/users/@me", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const user = idFix(await prisma.user.getById(payload.id));
      return c2.json(user, 200 /* OK */);
   }),
);
var get_current_user_default = app15;

// src/routes/user/get-user-bid.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app16 = new Hono2();
app16.get("/users/:userId", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const user = idFix(omit(await prisma.user.getById(c2.req.param("userId")), ["email"]));
      return c2.json(user, 200 /* OK */);
   }),
);
var get_user_bid_default = app16;

// src/routes/user/get-user-channels.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app17 = new Hono2();
app17.get("/users/@me/channels", verifyJwt(), c2 =>
   handleRequest(c2, async () => {
      const payload = getJwt(c2);
      const channels = idFix(
         await prisma.channel.getUserChannels(payload.id, false, merge(includeChannelRecipients, excludeSelfChannelUser(payload.id))),
      );
      return c2.json(channels, 200 /* OK */);
   }),
);
var get_user_channels_default = app17;

// src/routes/user/patch-current-user.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();

// src/server-request.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var cdnRoot = env2.CDN_ROOT;
async function cdnUpload(fullRoute, options = {}) {
   if (!cdnRoot) {
      throw new Error("CDN Root was not configured");
   }
   return await request({ ...options, root: cdnRoot, method: "POST" /* POST */, fullRoute });
}
async function request(options) {
   const { url, fetchOptions } = resolveRequest(options);
   const response = await fetch(url, fetchOptions);
   if (response.ok) return parseResponse(response);
   if (response.status >= 500 && response.status < 600) {
      throw new HTTPError(response.status, response.statusText, options.method, url, fetchOptions);
   }
   return response;
}

// src/routes/user/patch-current-user.ts
var schema8 = z.object({
   email: z.optional(z.string()),
   username: z.optional(z.string()),
   displayName: z.optional(z.string()),
   avatar: z.optional(z.string()),
   password: z.optional(z.string()),
   newPassword: z.optional(z.string()),
});
var app18 = new Hono2();
app18.patch("/users/@me", verifyJwt(), hValidator("json", schema8), c2 =>
   handleRequest(c2, async () => {
      const body = c2.req.valid("json");
      const payload = getJwt(c2);
      const formError = createError(Error2.invalidFormBody());
      validateUsername(body.username, formError);
      validateDisplayName(body.displayName, formError);
      validateEmail(body.email, formError);
      if ((body.username ?? body.newPassword) && !body.password) {
         formError.addError("password", Field.required());
      }
      if (formError.hasErrors()) {
         return error(c2, formError);
      }
      const databaseError = createError(Error2.invalidFormBody());
      const user = idFix(await prisma.user.getById(payload.id));
      validateCorrectPassword(body.password, user.password || "", databaseError);
      await validateUsernameUnique(body.username, databaseError);
      await validateEmailUnique(body.email, databaseError);
      if (databaseError.hasErrors()) {
         return error(c2, databaseError);
      }
      let avatarHash;
      if (body.avatar) {
         const data = resolveBuffer(body.avatar);
         avatarHash = getFileHash(data);
         await cdnUpload(CDNRoutes.uploadAvatar(user.id), {
            files: [{ data: resolveBuffer(body.avatar), name: avatarHash }],
         });
      }
      const updatedUser = idFix(
         await prisma.user.edit(payload.id, {
            email: body.email,
            username: body.username,
            displayName: body.displayName,
            avatar: avatarHash,
            password: body.newPassword,
         }),
      );
      const [accessToken, refreshToken] = await createTokens(
         { id: payload.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );
      const json = { ...updatedUser, token: accessToken, refreshToken };
      return c2.json(json, 200 /* OK */);
   }),
);
var patch_current_user_default = app18;

// src/routes/user/post-channels.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var schema9 = z.object({ recipients: z.array(z.string()) });
var app19 = new Hono2();
app19.post("/users/@me/channels", verifyJwt(), hValidator("json", schema9), c2 =>
   handleRequest(c2, async () => {
      const body = c2.req.valid("json");
      const payload = getJwt(c2);
      if (body.recipients.length === 0) {
         return invalidFormBody(c2);
      }
      const channel = idFix(
         await prisma.channel.createDM(
            payload.id,
            body.recipients,
            merge(includeChannelRecipients, excludeSelfChannelUser(payload.id)),
         ),
      );
      for (const id of [payload.id, ...body.recipients]) {
         gateway.getSession(id)?.subscribe(channel.id);
      }
      dispatchToTopic(payload.id, "channel_create", channel, 0);
      return c2.json(channel, 201 /* CREATED */);
   }),
);
var post_channels_default = app19;

// src/routes/route-merger.ts
var app20 = new Hono2();
app20.route("/", post_unique_username_default);
app20.route("/", post_login_default);
app20.route("/", post_register_default);
app20.route("/", post_logout_default);
app20.route("/", post_refresh_token_default);
app20.route("/", get_message_bid_default);
app20.route("/", get_channel_bid_default);
app20.route("/", get_channel_messages_default);
app20.route("/", post_message_default);
app20.route("/", delete_channel_bid_default);
app20.route("/", get_current_user_default);
app20.route("/", get_user_bid_default);
app20.route("/", get_user_channels_default);
app20.route("/", post_channels_default);
app20.route("/", patch_current_user_default);
app20.route("/", get_relationship_buid_default);
app20.route("/", get_user_relationships_default);
app20.route("/", post_put_relationship_default);
app20.route("/", delete_relationship_buid_default);
var route_merger_default = app20;

// src/routes/test-routes.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var app21 = new Hono2();
app21.post("/test/:job", c2 =>
   handleRequest(c2, async () => {
      const deleteRelationships = prisma.relationship.deleteMany({ where: { owner: { username: { startsWith: "test" } } } });
      const deleteMessages = prisma.message.deleteMany({
         where: { OR: [{ author: { username: { startsWith: "test" } } }, { content: { startsWith: "test" } }] },
      });
      const deleteUsers = prisma.user.deleteMany({ where: { username: { startsWith: "test" } } });
      const deleteChannels = prisma.channel.deleteMany();
      if (c2.req.param("job") === "test-users") {
         await prisma.$transaction([deleteMessages, deleteRelationships, deleteUsers]);
      }
      if (c2.req.param("job") === "test-channels") {
         await prisma.$transaction([deleteMessages, deleteChannels]);
      }
      if (c2.req.param("job") === "test-messages") {
         await prisma.$transaction([deleteMessages]);
      }
      if (c2.req.param("job") === "test-relationships") {
         await prisma.$transaction([deleteRelationships]);
      }
      if (c2.req.param("job") === "conversation-messages") {
         await prisma.message.deleteMany();
      }
      return c2.text("", 200 /* OK */);
   }),
);
var test_routes_default = app21;

// src/token-invalidator.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var TokenInvalidator = class {
   invalidTokens = [];
   invalidate(token) {
      if (!this.invalidTokens.includes(token)) {
         this.invalidTokens.push(token);
      }
   }
   isInvalid(token) {
      return this.invalidTokens.includes(token);
   }
};

// src/server.ts
var hconsole = {
   log: console.log,
   info: console.log,
   start: console.log,
   error: console.error,
   box: console.log,
   success: console.log,
   green: s => s,
   bold: s => s,
   red: s => s,
   magenta: s => s,
   gray: s => s,
   cyan: s => s,
   yellow: s => s,
   underline: s => s,
   blue: s => s,
};
function startServer() {
   const connectionString2 = env2.MONGODB_CONNECTION_STRING;
   const serverHost = env2.SERVER_HOST;
   const serverPort = env2.SERVER_PORT;
   if (!connectionString2) {
      hconsole.error("Database config is not set correctly!");
      return;
   }
   if (!serverHost || !serverPort) {
      hconsole.error("Server config is not set correctly!");
      return;
   }
   hconsole.info(`Using version ${version3}`);
   hconsole.start("Starting server...");
   const app22 = new Hono2();
   app22.use("*", cors());
   app22.use("*", async (c2, next) => {
      if (c2.req.method === "OPTIONS") {
         return;
      }
      logRequest(c2.req.path, c2.req.method, await tryGetBodyJson(c2.req));
      await next();
      const response = c2.res.clone();
      if (c2.res.status >= 200 && c2.res.status < 300) {
         logResponse(c2.req.path, c2.res.status, await tryGetBodyJson(response));
      } else if (c2.res.status === 500) {
         logReject(c2.req.path, c2.req.method, "Server Error", c2.res.status);
      } else {
         logReject(c2.req.path, c2.req.method, await tryGetBodyJson(response), c2.res.status);
      }
   });
   app22.onError((e, c2) => {
      logServerError(c2.req.path, e);
      if (e instanceof SyntaxError) {
         return error(c2, createError(Error2.malformedBody()), 400 /* BAD_REQUEST */);
      }
      return serverError(c2, e, false);
   });
   app22.route("/", route_merger_default);
   app22.route("/", test_routes_default);
   app22.get("/", c2 => {
      return c2.html(
         '<div style="height:100%; display: flex; align-items:center; justify-content:center;"><div style="font-size: 2rem;">Huginn API Homepage</div></div>',
      );
   });
   hconsole.success("Server started!");
   hconsole.box(`Listening on ${hconsole.green("/* todo */")}`);
   return app22;
}
var gateway = new ServerGateway({ logHeartbeat: false });
var tokenInvalidator = new TokenInvalidator();

// src/index.ts
var server = startServer();
var src_default = server;

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var drainBody = async (request2, env3, _ctx, middlewareCtx) => {
   try {
      return await middlewareCtx.next(request2, env3);
   } finally {
      try {
         if (request2.body !== null && !request2.bodyUsed) {
            const reader = request2.body.getReader();
            while (!(await reader.read()).done) {}
         }
      } catch (e) {
         console.error("Failed to drain the unused request body.", e);
      }
   }
};
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
function reduceError(e) {
   return {
      name: e?.name,
      message: e?.message ?? String(e),
      stack: e?.stack,
      cause: e?.cause === void 0 ? void 0 : reduceError(e.cause),
   };
}
var jsonError = async (request2, env3, _ctx, middlewareCtx) => {
   try {
      return await middlewareCtx.next(request2, env3);
   } catch (e) {
      const error2 = reduceError(e);
      return Response.json(error2, {
         status: 500,
         headers: { "MF-Experimental-Error-Stack": "true" },
      });
   }
};
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-9HH9g4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [middleware_ensure_req_body_drained_default, middleware_miniflare3_json_error_default];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_modules_watch_stub();
init_process();
init_buffer();
var __facade_middleware__ = [];
function __facade_register__(...args) {
   __facade_middleware__.push(...args.flat());
}
function __facade_invokeChain__(request2, env3, ctx, dispatch, middlewareChain) {
   const [head, ...tail] = middlewareChain;
   const middlewareCtx = {
      dispatch,
      next(newRequest, newEnv) {
         return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
      },
   };
   return head(request2, env3, ctx, middlewareCtx);
}
function __facade_invoke__(request2, env3, ctx, dispatch, finalMiddleware) {
   return __facade_invokeChain__(request2, env3, ctx, dispatch, [...__facade_middleware__, finalMiddleware]);
}

// .wrangler/tmp/bundle-9HH9g4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
   constructor(scheduledTime, cron, noRetry) {
      this.scheduledTime = scheduledTime;
      this.cron = cron;
      this.#noRetry = noRetry;
   }
   #noRetry;
   noRetry() {
      if (!(this instanceof __Facade_ScheduledController__)) {
         throw new TypeError("Illegal invocation");
      }
      this.#noRetry();
   }
};
function wrapExportedHandler(worker) {
   if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
      return worker;
   }
   for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
      __facade_register__(middleware);
   }
   const fetchDispatcher = function (request2, env3, ctx) {
      if (worker.fetch === void 0) {
         throw new Error("Handler does not export a fetch() function.");
      }
      return worker.fetch(request2, env3, ctx);
   };
   return {
      ...worker,
      fetch(request2, env3, ctx) {
         const dispatcher = function (type, init3) {
            if (type === "scheduled" && worker.scheduled !== void 0) {
               const controller = new __Facade_ScheduledController__(Date.now(), init3.cron ?? "", () => {});
               return worker.scheduled(controller, env3, ctx);
            }
         };
         return __facade_invoke__(request2, env3, ctx, dispatcher, fetchDispatcher);
      },
   };
}
function wrapWorkerEntrypoint(klass) {
   if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
      return klass;
   }
   for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
      __facade_register__(middleware);
   }
   return class extends klass {
      #fetchDispatcher = (request2, env3, ctx) => {
         this.env = env3;
         this.ctx = ctx;
         if (super.fetch === void 0) {
            throw new Error("Entrypoint class does not define a fetch() function.");
         }
         return super.fetch(request2);
      };
      #dispatcher = (type, init3) => {
         if (type === "scheduled" && super.scheduled !== void 0) {
            const controller = new __Facade_ScheduledController__(Date.now(), init3.cron ?? "", () => {});
            return super.scheduled(controller);
         }
      };
      fetch(request2) {
         return __facade_invoke__(request2, this.env, this.ctx, this.#dispatcher, this.#fetchDispatcher);
      }
   };
}
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
   WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
   WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export { __INTERNAL_WRANGLER_MIDDLEWARE__, middleware_loader_entry_default as default };
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/*! Bundled license information:

@esbuild-plugins/node-globals-polyfill/Buffer.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   *)
*/
//# sourceMappingURL=index.js.map
