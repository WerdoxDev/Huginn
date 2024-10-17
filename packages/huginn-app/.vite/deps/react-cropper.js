import {
  Cropper
} from "./chunk-NSNPBK7L.js";
import {
  require_react
} from "./chunk-KT3DMWWZ.js";
import {
  __toESM
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/react-cropper@2.3.3/node_modules/react-cropper/dist/react-cropper.es.js
var import_react = __toESM(require_react());
var n = function() {
  return n = Object.assign || function(e2) {
    for (var r2, o2 = 1, t = arguments.length; o2 < t; o2++) for (var n2 in r2 = arguments[o2]) Object.prototype.hasOwnProperty.call(r2, n2) && (e2[n2] = r2[n2]);
    return e2;
  }, n.apply(this, arguments);
};
function a(e2, r2) {
  var o2 = {};
  for (var t in e2) Object.prototype.hasOwnProperty.call(e2, t) && r2.indexOf(t) < 0 && (o2[t] = e2[t]);
  if (null != e2 && "function" == typeof Object.getOwnPropertySymbols) {
    var n2 = 0;
    for (t = Object.getOwnPropertySymbols(e2); n2 < t.length; n2++) r2.indexOf(t[n2]) < 0 && Object.prototype.propertyIsEnumerable.call(e2, t[n2]) && (o2[t[n2]] = e2[t[n2]]);
  }
  return o2;
}
var c = ["aspectRatio", "autoCrop", "autoCropArea", "background", "center", "checkCrossOrigin", "checkOrientation", "cropBoxMovable", "cropBoxResizable", "data", "dragMode", "guides", "highlight", "initialAspectRatio", "minCanvasHeight", "minCanvasWidth", "minContainerHeight", "minContainerWidth", "minCropBoxHeight", "minCropBoxWidth", "modal", "movable", "preview", "responsive", "restore", "rotatable", "scalable", "toggleDragModeOnDblclick", "viewMode", "wheelZoomRatio", "zoomOnTouch", "zoomOnWheel", "zoomable", "cropstart", "cropmove", "cropend", "crop", "zoom", "ready"];
var i = { opacity: 0, maxWidth: "100%" };
var l = import_react.default.forwardRef(function(l2, s) {
  var u = a(l2, []), p = u.dragMode, d = void 0 === p ? "crop" : p, v = u.src, f = u.style, m = u.className, g = u.crossOrigin, y = u.scaleX, b = u.scaleY, h = u.enable, O = u.zoomTo, T = u.rotateTo, z = u.alt, C = void 0 === z ? "picture" : z, w = u.ready, x = u.onInitialized, j = a(u, ["dragMode", "src", "style", "className", "crossOrigin", "scaleX", "scaleY", "enable", "zoomTo", "rotateTo", "alt", "ready", "onInitialized"]), M = { scaleY: b, scaleX: y, enable: h, zoomTo: O, rotateTo: T }, E = function() {
    for (var o2 = [], t = 0; t < arguments.length; t++) o2[t] = arguments[t];
    var n2 = (0, import_react.useRef)(null);
    return import_react.default.useEffect(function() {
      o2.forEach(function(e2) {
        e2 && ("function" == typeof e2 ? e2(n2.current) : e2.current = n2.current);
      });
    }, [o2]), n2;
  }(s, (0, import_react.useRef)(null));
  (0, import_react.useEffect)(function() {
    var e2;
    (null === (e2 = E.current) || void 0 === e2 ? void 0 : e2.cropper) && "number" == typeof O && E.current.cropper.zoomTo(O);
  }, [u.zoomTo]), (0, import_react.useEffect)(function() {
    var e2;
    (null === (e2 = E.current) || void 0 === e2 ? void 0 : e2.cropper) && void 0 !== v && E.current.cropper.reset().clear().replace(v);
  }, [v]), (0, import_react.useEffect)(function() {
    if (null !== E.current) {
      var e2 = new Cropper(E.current, n(n({ dragMode: d }, j), { ready: function(e3) {
        null !== e3.currentTarget && function(e4, r2) {
          void 0 === r2 && (r2 = {});
          var o2 = r2.enable, t = void 0 === o2 || o2, n2 = r2.scaleX, a2 = void 0 === n2 ? 1 : n2, c2 = r2.scaleY, i2 = void 0 === c2 ? 1 : c2, l3 = r2.zoomTo, s2 = void 0 === l3 ? 0 : l3, u2 = r2.rotateTo;
          t ? e4.enable() : e4.disable(), e4.scaleX(a2), e4.scaleY(i2), void 0 !== u2 && e4.rotateTo(u2), s2 > 0 && e4.zoomTo(s2);
        }(e3.currentTarget.cropper, M), w && w(e3);
      } }));
      x && x(e2);
    }
    return function() {
      var e3, r2;
      null === (r2 = null === (e3 = E.current) || void 0 === e3 ? void 0 : e3.cropper) || void 0 === r2 || r2.destroy();
    };
  }, [E]);
  var R = function(e2) {
    return c.reduce(function(e3, r2) {
      var o2 = e3, t = r2;
      return o2[t], a(o2, ["symbol" == typeof t ? t : t + ""]);
    }, e2);
  }(n(n({}, j), { crossOrigin: g, src: v, alt: C }));
  return import_react.default.createElement("div", { style: f, className: m }, import_react.default.createElement("img", n({}, R, { style: i, ref: E })));
});
export {
  l as Cropper,
  l as default
};
//# sourceMappingURL=react-cropper.js.map
