import {
  vs
} from "./chunk-ZSZVLUZE.js";
import {
  require_react
} from "./chunk-KT3DMWWZ.js";
import {
  __toESM
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/posthog-js@1.170.1/node_modules/posthog-js/react/dist/esm/index.js
var import_react = __toESM(require_react());
var PostHogContext = (0, import_react.createContext)({ client: vs });
function PostHogProvider(_a) {
  var children = _a.children, client = _a.client, apiKey = _a.apiKey, options = _a.options;
  var posthog = (0, import_react.useMemo)(function() {
    if (client && apiKey) {
      console.warn("[PostHog.js] You have provided both a client and an apiKey to PostHogProvider. The apiKey will be ignored in favour of the client.");
    }
    if (client && options) {
      console.warn("[PostHog.js] You have provided both a client and options to PostHogProvider. The options will be ignored in favour of the client.");
    }
    if (client) {
      return client;
    }
    if (apiKey) {
      if (vs.__loaded) {
        console.warn("[PostHog.js] was already loaded elsewhere. This may cause issues.");
      }
      vs.init(apiKey, options);
    }
    return vs;
  }, [client, apiKey]);
  return import_react.default.createElement(PostHogContext.Provider, { value: { client: posthog } }, children);
}
var usePostHog = function() {
  var client = (0, import_react.useContext)(PostHogContext).client;
  return client;
};
function useFeatureFlagEnabled(flag) {
  var client = usePostHog();
  var _a = (0, import_react.useState)(), featureEnabled = _a[0], setFeatureEnabled = _a[1];
  (0, import_react.useEffect)(function() {
    return client.onFeatureFlags(function() {
      setFeatureEnabled(client.isFeatureEnabled(flag));
    });
  }, [client, flag]);
  return featureEnabled;
}
function useFeatureFlagPayload(flag) {
  var client = usePostHog();
  var _a = (0, import_react.useState)(), featureFlagPayload = _a[0], setFeatureFlagPayload = _a[1];
  (0, import_react.useEffect)(function() {
    return client.onFeatureFlags(function() {
      setFeatureFlagPayload(client.getFeatureFlagPayload(flag));
    });
  }, [client, flag]);
  return featureFlagPayload;
}
function useActiveFeatureFlags() {
  var client = usePostHog();
  var _a = (0, import_react.useState)(), featureFlags = _a[0], setFeatureFlags = _a[1];
  (0, import_react.useEffect)(function() {
    return client.onFeatureFlags(function(flags) {
      setFeatureFlags(flags);
    });
  }, [client]);
  return featureFlags;
}
function useFeatureFlagVariantKey(flag) {
  var client = usePostHog();
  var _a = (0, import_react.useState)(), featureFlagVariantKey = _a[0], setFeatureFlagVariantKey = _a[1];
  (0, import_react.useEffect)(function() {
    return client.onFeatureFlags(function() {
      setFeatureFlagVariantKey(client.getFeatureFlag(flag));
    });
  }, [client, flag]);
  return featureFlagVariantKey;
}
var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function PostHogFeature(_a) {
  var flag = _a.flag, match = _a.match, children = _a.children, fallback = _a.fallback, visibilityObserverOptions = _a.visibilityObserverOptions, trackInteraction = _a.trackInteraction, trackView = _a.trackView, props = __rest(_a, ["flag", "match", "children", "fallback", "visibilityObserverOptions", "trackInteraction", "trackView"]);
  var payload = useFeatureFlagPayload(flag);
  var variant = useFeatureFlagVariantKey(flag);
  var shouldTrackInteraction = trackInteraction !== null && trackInteraction !== void 0 ? trackInteraction : true;
  var shouldTrackView = trackView !== null && trackView !== void 0 ? trackView : true;
  if (match === void 0 || variant === match) {
    var childNode = typeof children === "function" ? children(payload) : children;
    return import_react.default.createElement(VisibilityAndClickTracker, __assign({ flag, options: visibilityObserverOptions, trackInteraction: shouldTrackInteraction, trackView: shouldTrackView }, props), childNode);
  }
  return import_react.default.createElement(import_react.default.Fragment, null, fallback);
}
function captureFeatureInteraction(flag, posthog) {
  var _a;
  posthog.capture("$feature_interaction", { feature_flag: flag, $set: (_a = {}, _a["$feature_interaction/".concat(flag)] = true, _a) });
}
function captureFeatureView(flag, posthog) {
  posthog.capture("$feature_view", { feature_flag: flag });
}
function VisibilityAndClickTracker(_a) {
  var flag = _a.flag, children = _a.children, trackInteraction = _a.trackInteraction, trackView = _a.trackView, options = _a.options, props = __rest(_a, ["flag", "children", "trackInteraction", "trackView", "options"]);
  var ref = (0, import_react.useRef)(null);
  var posthog = usePostHog();
  var visibilityTrackedRef = (0, import_react.useRef)(false);
  var clickTrackedRef = (0, import_react.useRef)(false);
  var cachedOnClick = (0, import_react.useCallback)(function() {
    if (!clickTrackedRef.current && trackInteraction) {
      captureFeatureInteraction(flag, posthog);
      clickTrackedRef.current = true;
    }
  }, [flag, posthog, trackInteraction]);
  (0, import_react.useEffect)(function() {
    if (ref.current === null || !trackView)
      return;
    var onIntersect = function(entry) {
      if (!visibilityTrackedRef.current && entry.isIntersecting) {
        captureFeatureView(flag, posthog);
        visibilityTrackedRef.current = true;
      }
    };
    var observer = new IntersectionObserver(function(_a2) {
      var entry = _a2[0];
      return onIntersect(entry);
    }, __assign({ threshold: 0.1 }, options));
    observer.observe(ref.current);
    return function() {
      return observer.disconnect();
    };
  }, [flag, options, posthog, ref, trackView]);
  return import_react.default.createElement("div", __assign({ ref }, props, { onClick: cachedOnClick }), children);
}
export {
  PostHogContext,
  PostHogFeature,
  PostHogProvider,
  useActiveFeatureFlags,
  useFeatureFlagEnabled,
  useFeatureFlagPayload,
  useFeatureFlagVariantKey,
  usePostHog
};
//# sourceMappingURL=posthog-js_react.js.map
