// \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.iterator;
	function p(e) {
		return typeof e != "object" || !e ? null : (e = f && e[f] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var m = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, h = Object.assign, g = {};
	function _(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	_.prototype.isReactComponent = {}, _.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, _.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function v() {}
	v.prototype = _.prototype;
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	var b = y.prototype = new v();
	b.constructor = y, h(b, _.prototype), b.isPureReactComponent = !0;
	var x = Array.isArray, ee = Object.prototype.hasOwnProperty, S = { current: null }, C = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function te(e, n, r) {
		var i, a = {}, o = null, s = null;
		if (n != null) for (i in n.ref !== void 0 && (s = n.ref), n.key !== void 0 && (o = "" + n.key), n) ee.call(n, i) && !C.hasOwnProperty(i) && (a[i] = n[i]);
		var c = arguments.length - 2;
		if (c === 1) a.children = r;
		else if (1 < c) {
			for (var l = Array(c), u = 0; u < c; u++) l[u] = arguments[u + 2];
			a.children = l;
		}
		if (e && e.defaultProps) for (i in c = e.defaultProps, c) a[i] === void 0 && (a[i] = c[i]);
		return {
			$$typeof: t,
			type: e,
			key: o,
			ref: s,
			props: a,
			_owner: S.current
		};
	}
	function ne(e, n) {
		return {
			$$typeof: t,
			type: e.type,
			key: n,
			ref: e.ref,
			props: e.props,
			_owner: e._owner
		};
	}
	function re(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ie(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ae = /\/+/g;
	function oe(e, t) {
		return typeof e == "object" && e && e.key != null ? ie("" + e.key) : t.toString(36);
	}
	function se(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n: c = !0;
			}
		}
		if (c) return c = e, o = o(c), e = a === "" ? "." + oe(c, 0) : a, x(o) ? (i = "", e != null && (i = e.replace(ae, "$&/") + "/"), se(o, r, i, "", function(e) {
			return e;
		})) : o != null && (re(o) && (o = ne(o, i + (!o.key || c && c.key === o.key ? "" : ("" + o.key).replace(ae, "$&/") + "/") + e)), r.push(o)), 1;
		if (c = 0, a = a === "" ? "." : a + ":", x(e)) for (var l = 0; l < e.length; l++) {
			s = e[l];
			var u = a + oe(s, l);
			c += se(s, r, i, u, o);
		}
		else if (u = p(e), typeof u == "function") for (e = u.call(e), l = 0; !(s = e.next()).done;) s = s.value, u = a + oe(s, l++), c += se(s, r, i, u, o);
		else if (s === "object") throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		return c;
	}
	function ce(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return se(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function le(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var w = { current: null }, ue = { transition: null }, de = {
		ReactCurrentDispatcher: w,
		ReactCurrentBatchConfig: ue,
		ReactCurrentOwner: S
	};
	function fe() {
		throw Error("act(...) is not supported in production builds of React.");
	}
	e.Children = {
		map: ce,
		forEach: function(e, t, n) {
			ce(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ce(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ce(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!re(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	}, e.Component = _, e.Fragment = r, e.Profiler = a, e.PureComponent = y, e.StrictMode = i, e.Suspense = l, e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = de, e.act = fe, e.cloneElement = function(e, n, r) {
		if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
		var i = h({}, e.props), a = e.key, o = e.ref, s = e._owner;
		if (n != null) {
			if (n.ref !== void 0 && (o = n.ref, s = S.current), n.key !== void 0 && (a = "" + n.key), e.type && e.type.defaultProps) var c = e.type.defaultProps;
			for (l in n) ee.call(n, l) && !C.hasOwnProperty(l) && (i[l] = n[l] === void 0 && c !== void 0 ? c[l] : n[l]);
		}
		var l = arguments.length - 2;
		if (l === 1) i.children = r;
		else if (1 < l) {
			c = Array(l);
			for (var u = 0; u < l; u++) c[u] = arguments[u + 2];
			i.children = c;
		}
		return {
			$$typeof: t,
			type: e.type,
			key: a,
			ref: o,
			props: i,
			_owner: s
		};
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null,
			_defaultValue: null,
			_globalName: null
		}, e.Provider = {
			$$typeof: o,
			_context: e
		}, e.Consumer = e;
	}, e.createElement = te, e.createFactory = function(e) {
		var t = te.bind(null, e);
		return t.type = e, t;
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = re, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: le
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = ue.transition;
		ue.transition = {};
		try {
			e();
		} finally {
			ue.transition = t;
		}
	}, e.unstable_act = fe, e.useCallback = function(e, t) {
		return w.current.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.current.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e) {
		return w.current.useDeferredValue(e);
	}, e.useEffect = function(e, t) {
		return w.current.useEffect(e, t);
	}, e.useId = function() {
		return w.current.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.current.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.current.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.current.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.current.useMemo(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.current.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.current.useRef(e);
	}, e.useState = function(e) {
		return w.current.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.current.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.current.useTransition();
	}, e.version = "18.3.1";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = typeof setTimeout == "function" ? setTimeout : null, _ = typeof clearTimeout == "function" ? clearTimeout : null, v = typeof setImmediate < "u" ? setImmediate : null;
	typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
	function y(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function b(e) {
		if (h = !1, y(e), !m) {
			if (n(c) !== null) m = !0, ce(x);
			else {
				var t = n(l);
				t !== null && le(b, t.startTime - e);
			}
		}
	}
	function x(t, i) {
		m = !1, h && (h = !1, _(C), C = -1), p = !0;
		var a = f;
		try {
			for (y(i), d = n(c); d !== null && (!(d.expirationTime > i) || t && !re());) {
				var o = d.callback;
				if (typeof o == "function") {
					d.callback = null, f = d.priorityLevel;
					var s = o(d.expirationTime <= i);
					i = e.unstable_now(), typeof s == "function" ? d.callback = s : d === n(c) && r(c), y(i);
				} else r(c);
				d = n(c);
			}
			if (d !== null) var u = !0;
			else {
				var g = n(l);
				g !== null && le(b, g.startTime - i), u = !1;
			}
			return u;
		} finally {
			d = null, f = a, p = !1;
		}
	}
	var ee = !1, S = null, C = -1, te = 5, ne = -1;
	function re() {
		return !(e.unstable_now() - ne < te);
	}
	function ie() {
		if (S !== null) {
			var t = e.unstable_now();
			ne = t;
			var n = !0;
			try {
				n = S(!0, t);
			} finally {
				n ? ae() : (ee = !1, S = null);
			}
		} else ee = !1;
	}
	var ae;
	if (typeof v == "function") ae = function() {
		v(ie);
	};
	else if (typeof MessageChannel < "u") {
		var oe = new MessageChannel(), se = oe.port2;
		oe.port1.onmessage = ie, ae = function() {
			se.postMessage(null);
		};
	} else ae = function() {
		g(ie, 0);
	};
	function ce(e) {
		S = e, ee || (ee = !0, ae());
	}
	function le(t, n) {
		C = g(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_continueExecution = function() {
		m || p || (m = !0, ce(x));
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : te = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_getFirstCallbackNode = function() {
		return n(c);
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_pauseExecution = function() {}, e.unstable_requestPaint = function() {}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (_(C), C = -1) : h = !0, le(b, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, ce(x))), r;
	}, e.unstable_shouldYield = re, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u(), n = f();
	function r(e) {
		for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	var i = /* @__PURE__ */ new Set(), a = {};
	function o(e, t) {
		s(e, t), s(e + "Capture", t);
	}
	function s(e, t) {
		for (a[e] = t, e = 0; e < t.length; e++) i.add(t[e]);
	}
	var c = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, l = Object.prototype.hasOwnProperty, d = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, p = {}, m = {};
	function h(e) {
		return l.call(m, e) ? !0 : l.call(p, e) ? !1 : d.test(e) ? m[e] = !0 : (p[e] = !0, !1);
	}
	function g(e, t, n, r) {
		if (n !== null && n.type === 0) return !1;
		switch (typeof t) {
			case "function":
			case "symbol": return !0;
			case "boolean": return r ? !1 : n === null ? (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-") : !n.acceptsBooleans;
			default: return !1;
		}
	}
	function _(e, t, n, r) {
		if (t == null || g(e, t, n, r)) return !0;
		if (r) return !1;
		if (n !== null) switch (n.type) {
			case 3: return !t;
			case 4: return !1 === t;
			case 5: return isNaN(t);
			case 6: return isNaN(t) || 1 > t;
		}
		return !1;
	}
	function v(e, t, n, r, i, a, o) {
		this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = i, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = a, this.removeEmptyString = o;
	}
	var y = {};
	"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
		y[e] = new v(e, 0, !1, e, null, !1, !1);
	}), [
		["acceptCharset", "accept-charset"],
		["className", "class"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"]
	].forEach(function(e) {
		var t = e[0];
		y[t] = new v(t, 1, !1, e[1], null, !1, !1);
	}), [
		"contentEditable",
		"draggable",
		"spellCheck",
		"value"
	].forEach(function(e) {
		y[e] = new v(e, 2, !1, e.toLowerCase(), null, !1, !1);
	}), [
		"autoReverse",
		"externalResourcesRequired",
		"focusable",
		"preserveAlpha"
	].forEach(function(e) {
		y[e] = new v(e, 2, !1, e, null, !1, !1);
	}), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
		y[e] = new v(e, 3, !1, e.toLowerCase(), null, !1, !1);
	}), [
		"checked",
		"multiple",
		"muted",
		"selected"
	].forEach(function(e) {
		y[e] = new v(e, 3, !0, e, null, !1, !1);
	}), ["capture", "download"].forEach(function(e) {
		y[e] = new v(e, 4, !1, e, null, !1, !1);
	}), [
		"cols",
		"rows",
		"size",
		"span"
	].forEach(function(e) {
		y[e] = new v(e, 6, !1, e, null, !1, !1);
	}), ["rowSpan", "start"].forEach(function(e) {
		y[e] = new v(e, 5, !1, e.toLowerCase(), null, !1, !1);
	});
	var b = /[\-:]([a-z])/g;
	function x(e) {
		return e[1].toUpperCase();
	}
	"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
		var t = e.replace(b, x);
		y[t] = new v(t, 1, !1, e, null, !1, !1);
	}), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
		var t = e.replace(b, x);
		y[t] = new v(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
	}), [
		"xml:base",
		"xml:lang",
		"xml:space"
	].forEach(function(e) {
		var t = e.replace(b, x);
		y[t] = new v(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
	}), ["tabIndex", "crossOrigin"].forEach(function(e) {
		y[e] = new v(e, 1, !1, e.toLowerCase(), null, !1, !1);
	}), y.xlinkHref = new v("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), [
		"src",
		"href",
		"action",
		"formAction"
	].forEach(function(e) {
		y[e] = new v(e, 1, !1, e.toLowerCase(), null, !0, !0);
	});
	function ee(e, t, n, r) {
		var i = y.hasOwnProperty(t) ? y[t] : null;
		(i === null ? r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N" : i.type !== 0) && (_(t, n, i, r) && (n = null), r || i === null ? h(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : i.mustUseProperty ? e[i.propertyName] = n === null ? i.type !== 3 && "" : n : (t = i.attributeName, r = i.attributeNamespace, n === null ? e.removeAttribute(t) : (i = i.type, n = i === 3 || i === 4 && !0 === n ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
	}
	var S = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, C = Symbol.for("react.element"), te = Symbol.for("react.portal"), ne = Symbol.for("react.fragment"), re = Symbol.for("react.strict_mode"), ie = Symbol.for("react.profiler"), ae = Symbol.for("react.provider"), oe = Symbol.for("react.context"), se = Symbol.for("react.forward_ref"), ce = Symbol.for("react.suspense"), le = Symbol.for("react.suspense_list"), w = Symbol.for("react.memo"), ue = Symbol.for("react.lazy"), de = Symbol.for("react.offscreen"), fe = Symbol.iterator;
	function pe(e) {
		return typeof e != "object" || !e ? null : (e = fe && e[fe] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var T = Object.assign, me;
	function he(e) {
		if (me === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			me = t && t[1] || "";
		}
		return "\n" + me + e;
	}
	var ge = !1;
	function _e(e, t) {
		if (!e || ge) return "";
		ge = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			if (t) {
				if (t = function() {
					throw Error();
				}, Object.defineProperty(t.prototype, "props", { set: function() {
					throw Error();
				} }), typeof Reflect == "object" && Reflect.construct) {
					try {
						Reflect.construct(t, []);
					} catch (e) {
						var r = e;
					}
					Reflect.construct(e, [], t);
				} else {
					try {
						t.call();
					} catch (e) {
						r = e;
					}
					e.call(t.prototype);
				}
			} else {
				try {
					throw Error();
				} catch (e) {
					r = e;
				}
				e();
			}
		} catch (t) {
			if (t && r && typeof t.stack == "string") {
				for (var i = t.stack.split("\n"), a = r.stack.split("\n"), o = i.length - 1, s = a.length - 1; 1 <= o && 0 <= s && i[o] !== a[s];) s--;
				for (; 1 <= o && 0 <= s; o--, s--) if (i[o] !== a[s]) {
					if (o !== 1 || s !== 1) do
						if (o--, s--, 0 > s || i[o] !== a[s]) {
							var c = "\n" + i[o].replace(" at new ", " at ");
							return e.displayName && c.includes("<anonymous>") && (c = c.replace("<anonymous>", e.displayName)), c;
						}
					while (1 <= o && 0 <= s);
					break;
				}
			}
		} finally {
			ge = !1, Error.prepareStackTrace = n;
		}
		return (e = e ? e.displayName || e.name : "") ? he(e) : "";
	}
	function ve(e) {
		switch (e.tag) {
			case 5: return he(e.type);
			case 16: return he("Lazy");
			case 13: return he("Suspense");
			case 19: return he("SuspenseList");
			case 0:
			case 2:
			case 15: return e = _e(e.type, !1), e;
			case 11: return e = _e(e.type.render, !1), e;
			case 1: return e = _e(e.type, !0), e;
			default: return "";
		}
	}
	function ye(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case ne: return "Fragment";
			case te: return "Portal";
			case ie: return "Profiler";
			case re: return "StrictMode";
			case ce: return "Suspense";
			case le: return "SuspenseList";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case oe: return (e.displayName || "Context") + ".Consumer";
			case ae: return (e._context.displayName || "Context") + ".Provider";
			case se:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case w: return t = e.displayName || null, t === null ? ye(e.type) || "Memo" : t;
			case ue:
				t = e._payload, e = e._init;
				try {
					return ye(e(t));
				} catch {}
		}
		return null;
	}
	function be(e) {
		var t = e.type;
		switch (e.tag) {
			case 24: return "Cache";
			case 9: return (t.displayName || "Context") + ".Consumer";
			case 10: return (t._context.displayName || "Context") + ".Provider";
			case 18: return "DehydratedFragment";
			case 11: return e = t.render, e = e.displayName || e.name || "", t.displayName || (e === "" ? "ForwardRef" : "ForwardRef(" + e + ")");
			case 7: return "Fragment";
			case 5: return t;
			case 4: return "Portal";
			case 3: return "Root";
			case 6: return "Text";
			case 16: return ye(t);
			case 8: return t === re ? "StrictMode" : "Mode";
			case 22: return "Offscreen";
			case 12: return "Profiler";
			case 21: return "Scope";
			case 13: return "Suspense";
			case 19: return "SuspenseList";
			case 25: return "TracingMarker";
			case 1:
			case 0:
			case 17:
			case 2:
			case 14:
			case 15:
				if (typeof t == "function") return t.displayName || t.name || null;
				if (typeof t == "string") return t;
		}
		return null;
	}
	function xe(e) {
		switch (typeof e) {
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function Se(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Ce(e) {
		var t = Se(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
		if (!e.hasOwnProperty(t) && n !== void 0 && typeof n.get == "function" && typeof n.set == "function") {
			var i = n.get, a = n.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					r = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: n.enumerable }), {
				getValue: function() {
					return r;
				},
				setValue: function(e) {
					r = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function we(e) {
		e._valueTracker ||= Ce(e);
	}
	function Te(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Se(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Ee(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function De(e, t) {
		var n = t.checked;
		return T({}, t, {
			defaultChecked: void 0,
			defaultValue: void 0,
			value: void 0,
			checked: n ?? e._wrapperState.initialChecked
		});
	}
	function Oe(e, t) {
		var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked == null ? t.defaultChecked : t.checked;
		n = xe(t.value == null ? n : t.value), e._wrapperState = {
			initialChecked: r,
			initialValue: n,
			controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null
		};
	}
	function ke(e, t) {
		t = t.checked, t != null && ee(e, "checked", t, !1);
	}
	function Ae(e, t) {
		ke(e, t);
		var n = xe(t.value), r = t.type;
		if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
		else if (r === "submit" || r === "reset") {
			e.removeAttribute("value");
			return;
		}
		t.hasOwnProperty("value") ? Me(e, t.type, n) : t.hasOwnProperty("defaultValue") && Me(e, t.type, xe(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
	}
	function je(e, t, n) {
		if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
			var r = t.type;
			if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
			t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
		}
		n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
	}
	function Me(e, t, n) {
		(t !== "number" || Ee(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
	}
	var Ne = Array.isArray;
	function Pe(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + xe(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Fe(e, t) {
		if (t.dangerouslySetInnerHTML != null) throw Error(r(91));
		return T({}, t, {
			value: void 0,
			defaultValue: void 0,
			children: "" + e._wrapperState.initialValue
		});
	}
	function Ie(e, t) {
		var n = t.value;
		if (n == null) {
			if (n = t.children, t = t.defaultValue, n != null) {
				if (t != null) throw Error(r(92));
				if (Ne(n)) {
					if (1 < n.length) throw Error(r(93));
					n = n[0];
				}
				t = n;
			}
			t ??= "", n = t;
		}
		e._wrapperState = { initialValue: xe(n) };
	}
	function Le(e, t) {
		var n = xe(t.value), r = xe(t.defaultValue);
		n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
	}
	function Re(e) {
		var t = e.textContent;
		t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
	}
	function ze(e) {
		switch (e) {
			case "svg": return "http://www.w3.org/2000/svg";
			case "math": return "http://www.w3.org/1998/Math/MathML";
			default: return "http://www.w3.org/1999/xhtml";
		}
	}
	function Be(e, t) {
		return e == null || e === "http://www.w3.org/1999/xhtml" ? ze(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
	}
	var Ve, E = function(e) {
		return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, i) {
			MSApp.execUnsafeLocalFunction(function() {
				return e(t, n, r, i);
			});
		} : e;
	}(function(e, t) {
		if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
		else {
			for (Ve ||= document.createElement("div"), Ve.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Ve.firstChild; e.firstChild;) e.removeChild(e.firstChild);
			for (; t.firstChild;) e.appendChild(t.firstChild);
		}
	});
	function He(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Ue = {
		animationIterationCount: !0,
		aspectRatio: !0,
		borderImageOutset: !0,
		borderImageSlice: !0,
		borderImageWidth: !0,
		boxFlex: !0,
		boxFlexGroup: !0,
		boxOrdinalGroup: !0,
		columnCount: !0,
		columns: !0,
		flex: !0,
		flexGrow: !0,
		flexPositive: !0,
		flexShrink: !0,
		flexNegative: !0,
		flexOrder: !0,
		gridArea: !0,
		gridRow: !0,
		gridRowEnd: !0,
		gridRowSpan: !0,
		gridRowStart: !0,
		gridColumn: !0,
		gridColumnEnd: !0,
		gridColumnSpan: !0,
		gridColumnStart: !0,
		fontWeight: !0,
		lineClamp: !0,
		lineHeight: !0,
		opacity: !0,
		order: !0,
		orphans: !0,
		tabSize: !0,
		widows: !0,
		zIndex: !0,
		zoom: !0,
		fillOpacity: !0,
		floodOpacity: !0,
		stopOpacity: !0,
		strokeDasharray: !0,
		strokeDashoffset: !0,
		strokeMiterlimit: !0,
		strokeOpacity: !0,
		strokeWidth: !0
	}, We = [
		"Webkit",
		"ms",
		"Moz",
		"O"
	];
	Object.keys(Ue).forEach(function(e) {
		We.forEach(function(t) {
			t = t + e.charAt(0).toUpperCase() + e.substring(1), Ue[t] = Ue[e];
		});
	});
	function Ge(e, t, n) {
		return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Ue.hasOwnProperty(e) && Ue[e] ? ("" + t).trim() : t + "px";
	}
	function Ke(e, t) {
		for (var n in e = e.style, t) if (t.hasOwnProperty(n)) {
			var r = n.indexOf("--") === 0, i = Ge(n, t[n], r);
			n === "float" && (n = "cssFloat"), r ? e.setProperty(n, i) : e[n] = i;
		}
	}
	var qe = T({ menuitem: !0 }, {
		area: !0,
		base: !0,
		br: !0,
		col: !0,
		embed: !0,
		hr: !0,
		img: !0,
		input: !0,
		keygen: !0,
		link: !0,
		meta: !0,
		param: !0,
		source: !0,
		track: !0,
		wbr: !0
	});
	function Je(e, t) {
		if (t) {
			if (qe[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(r(137, e));
			if (t.dangerouslySetInnerHTML != null) {
				if (t.children != null) throw Error(r(60));
				if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(r(61));
			}
			if (t.style != null && typeof t.style != "object") throw Error(r(62));
		}
	}
	function Ye(e, t) {
		if (e.indexOf("-") === -1) return typeof t.is == "string";
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Xe = null;
	function Ze(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var Qe = null, $e = null, et = null;
	function tt(e) {
		if (e = Yi(e)) {
			if (typeof Qe != "function") throw Error(r(280));
			var t = e.stateNode;
			t && (t = Zi(t), Qe(e.stateNode, e.type, t));
		}
	}
	function nt(e) {
		$e ? et ? et.push(e) : et = [e] : $e = e;
	}
	function rt() {
		if ($e) {
			var e = $e, t = et;
			if (et = $e = null, tt(e), t) for (e = 0; e < t.length; e++) tt(t[e]);
		}
	}
	function it(e, t) {
		return e(t);
	}
	function at() {}
	var ot = !1;
	function st(e, t, n) {
		if (ot) return e(t, n);
		ot = !0;
		try {
			return it(e, t, n);
		} finally {
			ot = !1, ($e !== null || et !== null) && (at(), rt());
		}
	}
	function ct(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var i = Zi(n);
		if (i === null) return null;
		n = i[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(i = !i.disabled) || (e = e.type, i = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !i;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(r(231, t, typeof n));
		return n;
	}
	var lt = !1;
	if (c) try {
		var ut = {};
		Object.defineProperty(ut, "passive", { get: function() {
			lt = !0;
		} }), window.addEventListener("test", ut, ut), window.removeEventListener("test", ut, ut);
	} catch {
		lt = !1;
	}
	function dt(e, t, n, r, i, a, o, s, c) {
		var l = Array.prototype.slice.call(arguments, 3);
		try {
			t.apply(n, l);
		} catch (e) {
			this.onError(e);
		}
	}
	var ft = !1, pt = null, mt = !1, ht = null, gt = { onError: function(e) {
		ft = !0, pt = e;
	} };
	function _t(e, t, n, r, i, a, o, s, c) {
		ft = !1, pt = null, dt.apply(gt, arguments);
	}
	function vt(e, t, n, i, a, o, s, c, l) {
		if (_t.apply(this, arguments), ft) {
			if (ft) {
				var u = pt;
				ft = !1, pt = null;
			} else throw Error(r(198));
			mt || (mt = !0, ht = u);
		}
	}
	function yt(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function bt(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function xt(e) {
		if (yt(e) !== e) throw Error(r(188));
	}
	function St(e) {
		var t = e.alternate;
		if (!t) {
			if (t = yt(e), t === null) throw Error(r(188));
			return t === e ? e : null;
		}
		for (var n = e, i = t;;) {
			var a = n.return;
			if (a === null) break;
			var o = a.alternate;
			if (o === null) {
				if (i = a.return, i !== null) {
					n = i;
					continue;
				}
				break;
			}
			if (a.child === o.child) {
				for (o = a.child; o;) {
					if (o === n) return xt(a), e;
					if (o === i) return xt(a), t;
					o = o.sibling;
				}
				throw Error(r(188));
			}
			if (n.return !== i.return) n = a, i = o;
			else {
				for (var s = !1, c = a.child; c;) {
					if (c === n) {
						s = !0, n = a, i = o;
						break;
					}
					if (c === i) {
						s = !0, i = a, n = o;
						break;
					}
					c = c.sibling;
				}
				if (!s) {
					for (c = o.child; c;) {
						if (c === n) {
							s = !0, n = o, i = a;
							break;
						}
						if (c === i) {
							s = !0, i = o, n = a;
							break;
						}
						c = c.sibling;
					}
					if (!s) throw Error(r(189));
				}
			}
			if (n.alternate !== i) throw Error(r(190));
		}
		if (n.tag !== 3) throw Error(r(188));
		return n.stateNode.current === n ? e : t;
	}
	function Ct(e) {
		return e = St(e), e === null ? null : wt(e);
	}
	function wt(e) {
		if (e.tag === 5 || e.tag === 6) return e;
		for (e = e.child; e !== null;) {
			var t = wt(e);
			if (t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var Tt = n.unstable_scheduleCallback, Et = n.unstable_cancelCallback, Dt = n.unstable_shouldYield, Ot = n.unstable_requestPaint, D = n.unstable_now, kt = n.unstable_getCurrentPriorityLevel, At = n.unstable_ImmediatePriority, jt = n.unstable_UserBlockingPriority, Mt = n.unstable_NormalPriority, Nt = n.unstable_LowPriority, Pt = n.unstable_IdlePriority, Ft = null, It = null;
	function Lt(e) {
		if (It && typeof It.onCommitFiberRoot == "function") try {
			It.onCommitFiberRoot(Ft, e, void 0, (e.current.flags & 128) == 128);
		} catch {}
	}
	var Rt = Math.clz32 ? Math.clz32 : Vt, zt = Math.log, Bt = Math.LN2;
	function Vt(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (zt(e) / Bt | 0) | 0;
	}
	var Ht = 64, Ut = 4194304;
	function Wt(e) {
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 4194240;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
			case 67108864: return e & 130023424;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 1073741824;
			default: return e;
		}
	}
	function Gt(e, t) {
		var n = e.pendingLanes;
		if (n === 0) return 0;
		var r = 0, i = e.suspendedLanes, a = e.pingedLanes, o = n & 268435455;
		if (o !== 0) {
			var s = o & ~i;
			s === 0 ? (a &= o, a !== 0 && (r = Wt(a))) : r = Wt(s);
		} else o = n & ~i, o === 0 ? a !== 0 && (r = Wt(a)) : r = Wt(o);
		if (r === 0) return 0;
		if (t !== 0 && t !== r && (t & i) === 0 && (i = r & -r, a = t & -t, i >= a || i === 16 && a & 4194240)) return t;
		if (r & 4 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t;) n = 31 - Rt(t), i = 1 << n, r |= e[n], t &= ~i;
		return r;
	}
	function Kt(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4: return t + 250;
			case 8:
			case 16:
			case 32:
			case 64:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
			case 67108864: return -1;
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function qt(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes; 0 < a;) {
			var o = 31 - Rt(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Kt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
	}
	function Jt(e) {
		return e = e.pendingLanes & -1073741825, e === 0 ? e & 1073741824 ? 1073741824 : 0 : e;
	}
	function Yt() {
		var e = Ht;
		return Ht <<= 1, !(Ht & 4194240) && (Ht = 64), e;
	}
	function Xt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Zt(e, t, n) {
		e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Rt(t), e[t] = n;
	}
	function Qt(e, t) {
		var n = e.pendingLanes & ~t;
		e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
		var r = e.eventTimes;
		for (e = e.expirationTimes; 0 < n;) {
			var i = 31 - Rt(n), a = 1 << i;
			t[i] = 0, r[i] = -1, e[i] = -1, n &= ~a;
		}
	}
	function $t(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Rt(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	var O = 0;
	function en(e) {
		return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
	}
	var tn, nn, rn, an, on, sn = !1, cn = [], ln = null, un = null, dn = null, fn = /* @__PURE__ */ new Map(), pn = /* @__PURE__ */ new Map(), mn = [], hn = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
	function gn(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				ln = null;
				break;
			case "dragenter":
			case "dragleave":
				un = null;
				break;
			case "mouseover":
			case "mouseout":
				dn = null;
				break;
			case "pointerover":
			case "pointerout":
				fn.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": pn.delete(t.pointerId);
		}
	}
	function _n(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Yi(t), t !== null && nn(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function vn(e, t, n, r, i) {
		switch (t) {
			case "focusin": return ln = _n(ln, e, t, n, r, i), !0;
			case "dragenter": return un = _n(un, e, t, n, r, i), !0;
			case "mouseover": return dn = _n(dn, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return fn.set(a, _n(fn.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, pn.set(a, _n(pn.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function yn(e) {
		var t = Ji(e.target);
		if (t !== null) {
			var n = yt(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = bt(n), t !== null) {
						e.blockedOn = t, on(e.priority, function() {
							rn(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function bn(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = jn(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Xe = r, n.target.dispatchEvent(r), Xe = null;
			} else return t = Yi(n), t !== null && nn(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function xn(e, t, n) {
		bn(e) && n.delete(t);
	}
	function Sn() {
		sn = !1, ln !== null && bn(ln) && (ln = null), un !== null && bn(un) && (un = null), dn !== null && bn(dn) && (dn = null), fn.forEach(xn), pn.forEach(xn);
	}
	function Cn(e, t) {
		e.blockedOn === t && (e.blockedOn = null, sn || (sn = !0, n.unstable_scheduleCallback(n.unstable_NormalPriority, Sn)));
	}
	function wn(e) {
		function t(t) {
			return Cn(t, e);
		}
		if (0 < cn.length) {
			Cn(cn[0], e);
			for (var n = 1; n < cn.length; n++) {
				var r = cn[n];
				r.blockedOn === e && (r.blockedOn = null);
			}
		}
		for (ln !== null && Cn(ln, e), un !== null && Cn(un, e), dn !== null && Cn(dn, e), fn.forEach(t), pn.forEach(t), n = 0; n < mn.length; n++) r = mn[n], r.blockedOn === e && (r.blockedOn = null);
		for (; 0 < mn.length && (n = mn[0], n.blockedOn === null);) yn(n), n.blockedOn === null && mn.shift();
	}
	var Tn = S.ReactCurrentBatchConfig, En = !0;
	function Dn(e, t, n, r) {
		var i = O, a = Tn.transition;
		Tn.transition = null;
		try {
			O = 1, kn(e, t, n, r);
		} finally {
			O = i, Tn.transition = a;
		}
	}
	function On(e, t, n, r) {
		var i = O, a = Tn.transition;
		Tn.transition = null;
		try {
			O = 4, kn(e, t, n, r);
		} finally {
			O = i, Tn.transition = a;
		}
	}
	function kn(e, t, n, r) {
		if (En) {
			var i = jn(e, t, n, r);
			if (i === null) bi(e, t, r, An, n), gn(e, r);
			else if (vn(i, e, t, n, r)) r.stopPropagation();
			else if (gn(e, r), t & 4 && -1 < hn.indexOf(e)) {
				for (; i !== null;) {
					var a = Yi(i);
					if (a !== null && tn(a), a = jn(e, t, n, r), a === null && bi(e, t, r, An, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else bi(e, t, r, null, n);
		}
	}
	var An = null;
	function jn(e, t, n, r) {
		if (An = null, e = Ze(r), e = Ji(e), e !== null) {
			if (t = yt(e), t === null) e = null;
			else if (n = t.tag, n === 13) {
				if (e = bt(t), e !== null) return e;
				e = null;
			} else if (n === 3) {
				if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
				e = null;
			} else t !== e && (e = null);
		}
		return An = e, null;
	}
	function Mn(e) {
		switch (e) {
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 1;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "toggle":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 4;
			case "message": switch (kt()) {
				case At: return 1;
				case jt: return 4;
				case Mt:
				case Nt: return 16;
				case Pt: return 536870912;
				default: return 16;
			}
			default: return 16;
		}
	}
	var Nn = null, Pn = null, Fn = null;
	function In() {
		if (Fn) return Fn;
		var e, t = Pn, n = t.length, r, i = "value" in Nn ? Nn.value : Nn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Fn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Ln(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Rn() {
		return !0;
	}
	function zn() {
		return !1;
	}
	function k(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Rn : zn, this.isPropagationStopped = zn, this;
		}
		return T(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Rn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Rn);
			},
			persist: function() {},
			isPersistent: Rn
		}), t;
	}
	var Bn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Vn = k(Bn), Hn = T({}, Bn, {
		view: 0,
		detail: 0
	}), Un = k(Hn), Wn, Gn, Kn, qn = T({}, Hn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: ir,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Kn && (Kn && e.type === "mousemove" ? (Wn = e.screenX - Kn.screenX, Gn = e.screenY - Kn.screenY) : Gn = Wn = 0, Kn = e), Wn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Gn;
		}
	}), Jn = k(qn), Yn = k(T({}, qn, { dataTransfer: 0 })), Xn = k(T({}, Hn, { relatedTarget: 0 })), Zn = k(T({}, Bn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Qn = k(T({}, Bn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), $n = k(T({}, Bn, { data: 0 })), er = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, tr = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, nr = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function rr(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = nr[e]) ? !!t[e] : !1;
	}
	function ir() {
		return rr;
	}
	var ar = k(T({}, Hn, {
		key: function(e) {
			if (e.key) {
				var t = er[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Ln(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? tr[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: ir,
		charCode: function(e) {
			return e.type === "keypress" ? Ln(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Ln(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), or = k(T({}, qn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), sr = k(T({}, Hn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: ir
	})), cr = k(T({}, Bn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), lr = k(T({}, qn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), ur = [
		9,
		13,
		27,
		32
	], dr = c && "CompositionEvent" in window, fr = null;
	c && "documentMode" in document && (fr = document.documentMode);
	var pr = c && "TextEvent" in window && !fr, mr = c && (!dr || fr && 8 < fr && 11 >= fr), hr = " ", gr = !1;
	function _r(e, t) {
		switch (e) {
			case "keyup": return ur.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function vr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var yr = !1;
	function br(e, t) {
		switch (e) {
			case "compositionend": return vr(t);
			case "keypress": return t.which === 32 ? (gr = !0, hr) : null;
			case "textInput": return e = t.data, e === hr && gr ? null : e;
			default: return null;
		}
	}
	function xr(e, t) {
		if (yr) return e === "compositionend" || !dr && _r(e, t) ? (e = In(), Fn = Pn = Nn = null, yr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return mr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var Sr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function Cr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!Sr[e.type] : t === "textarea";
	}
	function wr(e, t, n, r) {
		nt(r), t = Si(t, "onChange"), 0 < t.length && (n = new Vn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var Tr = null, Er = null;
	function Dr(e) {
		vi(e, 0);
	}
	function Or(e) {
		if (Te(Xi(e))) return e;
	}
	function kr(e, t) {
		if (e === "change") return t;
	}
	var Ar = !1;
	if (c) {
		var jr;
		if (c) {
			var Mr = "oninput" in document;
			if (!Mr) {
				var Nr = document.createElement("div");
				Nr.setAttribute("oninput", "return;"), Mr = typeof Nr.oninput == "function";
			}
			jr = Mr;
		} else jr = !1;
		Ar = jr && (!document.documentMode || 9 < document.documentMode);
	}
	function Pr() {
		Tr && (Tr.detachEvent("onpropertychange", Fr), Er = Tr = null);
	}
	function Fr(e) {
		if (e.propertyName === "value" && Or(Er)) {
			var t = [];
			wr(t, Er, e, Ze(e)), st(Dr, t);
		}
	}
	function Ir(e, t, n) {
		e === "focusin" ? (Pr(), Tr = t, Er = n, Tr.attachEvent("onpropertychange", Fr)) : e === "focusout" && Pr();
	}
	function Lr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return Or(Er);
	}
	function Rr(e, t) {
		if (e === "click") return Or(t);
	}
	function zr(e, t) {
		if (e === "input" || e === "change") return Or(t);
	}
	function Br(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Vr = typeof Object.is == "function" ? Object.is : Br;
	function Hr(e, t) {
		if (Vr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!l.call(t, i) || !Vr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Ur(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Wr(e, t) {
		var n = Ur(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Ur(n);
		}
	}
	function Gr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Gr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Kr() {
		for (var e = window, t = Ee(); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Ee(e.document);
		}
		return t;
	}
	function qr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	function Jr(e) {
		var t = Kr(), n = e.focusedElem, r = e.selectionRange;
		if (t !== n && n && n.ownerDocument && Gr(n.ownerDocument.documentElement, n)) {
			if (r !== null && qr(n)) {
				if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
				else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
					e = e.getSelection();
					var i = n.textContent.length, a = Math.min(r.start, i);
					r = r.end === void 0 ? a : Math.min(r.end, i), !e.extend && a > r && (i = r, r = a, a = i), i = Wr(n, a);
					var o = Wr(n, r);
					i && o && (e.rangeCount !== 1 || e.anchorNode !== i.node || e.anchorOffset !== i.offset || e.focusNode !== o.node || e.focusOffset !== o.offset) && (t = t.createRange(), t.setStart(i.node, i.offset), e.removeAllRanges(), a > r ? (e.addRange(t), e.extend(o.node, o.offset)) : (t.setEnd(o.node, o.offset), e.addRange(t)));
				}
			}
			for (t = [], e = n; e = e.parentNode;) e.nodeType === 1 && t.push({
				element: e,
				left: e.scrollLeft,
				top: e.scrollTop
			});
			for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
		}
	}
	var Yr = c && "documentMode" in document && 11 >= document.documentMode, Xr = null, Zr = null, Qr = null, $r = !1;
	function ei(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		$r || Xr == null || Xr !== Ee(r) || (r = Xr, "selectionStart" in r && qr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Qr && Hr(Qr, r) || (Qr = r, r = Si(Zr, "onSelect"), 0 < r.length && (t = new Vn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Xr)));
	}
	function ti(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var ni = {
		animationend: ti("Animation", "AnimationEnd"),
		animationiteration: ti("Animation", "AnimationIteration"),
		animationstart: ti("Animation", "AnimationStart"),
		transitionend: ti("Transition", "TransitionEnd")
	}, ri = {}, ii = {};
	c && (ii = document.createElement("div").style, "AnimationEvent" in window || (delete ni.animationend.animation, delete ni.animationiteration.animation, delete ni.animationstart.animation), "TransitionEvent" in window || delete ni.transitionend.transition);
	function ai(e) {
		if (ri[e]) return ri[e];
		if (!ni[e]) return e;
		var t = ni[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in ii) return ri[e] = t[n];
		return e;
	}
	var oi = ai("animationend"), si = ai("animationiteration"), ci = ai("animationstart"), li = ai("transitionend"), ui = /* @__PURE__ */ new Map(), di = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	function fi(e, t) {
		ui.set(e, t), o(t, [e]);
	}
	for (var pi = 0; pi < di.length; pi++) {
		var mi = di[pi];
		fi(mi.toLowerCase(), "on" + (mi[0].toUpperCase() + mi.slice(1)));
	}
	fi(oi, "onAnimationEnd"), fi(si, "onAnimationIteration"), fi(ci, "onAnimationStart"), fi("dblclick", "onDoubleClick"), fi("focusin", "onFocus"), fi("focusout", "onBlur"), fi(li, "onTransitionEnd"), s("onMouseEnter", ["mouseout", "mouseover"]), s("onMouseLeave", ["mouseout", "mouseover"]), s("onPointerEnter", ["pointerout", "pointerover"]), s("onPointerLeave", ["pointerout", "pointerover"]), o("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), o("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), o("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), o("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), o("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), o("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var hi = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), gi = new Set("cancel close invalid load scroll toggle".split(" ").concat(hi));
	function _i(e, t, n) {
		var r = e.type || "unknown-event";
		e.currentTarget = n, vt(r, t, void 0, e), e.currentTarget = null;
	}
	function vi(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					_i(i, s, l), a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					_i(i, s, l), a = c;
				}
			}
		}
		if (mt) throw e = ht, mt = !1, ht = null, e;
	}
	function A(e, t) {
		var n = t[Gi];
		n === void 0 && (n = t[Gi] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (yi(t, e, 2, !1), n.add(r));
	}
	function j(e, t, n) {
		var r = 0;
		t && (r |= 4), yi(n, e, r, t);
	}
	var M = "_reactListening" + Math.random().toString(36).slice(2);
	function N(e) {
		if (!e[M]) {
			e[M] = !0, i.forEach(function(t) {
				t !== "selectionchange" && (gi.has(t) || j(t, !1, e), j(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[M] || (t[M] = !0, j("selectionchange", !1, t));
		}
	}
	function yi(e, t, n, r) {
		switch (Mn(t)) {
			case 1:
				var i = Dn;
				break;
			case 4:
				i = On;
				break;
			default: i = kn;
		}
		n = i.bind(null, t, n, e), i = void 0, !lt || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function bi(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var o = r.tag;
			if (o === 3 || o === 4) {
				var s = r.stateNode.containerInfo;
				if (s === i || s.nodeType === 8 && s.parentNode === i) break;
				if (o === 4) for (o = r.return; o !== null;) {
					var c = o.tag;
					if ((c === 3 || c === 4) && (c = o.stateNode.containerInfo, c === i || c.nodeType === 8 && c.parentNode === i)) return;
					o = o.return;
				}
				for (; s !== null;) {
					if (o = Ji(s), o === null) return;
					if (c = o.tag, c === 5 || c === 6) {
						r = a = o;
						continue a;
					}
					s = s.parentNode;
				}
			}
			r = r.return;
		}
		st(function() {
			var r = a, i = Ze(n), o = [];
			a: {
				var s = ui.get(e);
				if (s !== void 0) {
					var c = Vn, l = e;
					switch (e) {
						case "keypress": if (Ln(n) === 0) break a;
						case "keydown":
						case "keyup":
							c = ar;
							break;
						case "focusin":
							l = "focus", c = Xn;
							break;
						case "focusout":
							l = "blur", c = Xn;
							break;
						case "beforeblur":
						case "afterblur":
							c = Xn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							c = Jn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							c = Yn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							c = sr;
							break;
						case oi:
						case si:
						case ci:
							c = Zn;
							break;
						case li:
							c = cr;
							break;
						case "scroll":
							c = Un;
							break;
						case "wheel":
							c = lr;
							break;
						case "copy":
						case "cut":
						case "paste":
							c = Qn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup": c = or;
					}
					var u = !!(t & 4), d = !u && e === "scroll", f = u ? s === null ? null : s + "Capture" : s;
					u = [];
					for (var p = r, m; p !== null;) {
						m = p;
						var h = m.stateNode;
						if (m.tag === 5 && h !== null && (m = h, f !== null && (h = ct(p, f), h != null && u.push(xi(p, h, m)))), d) break;
						p = p.return;
					}
					0 < u.length && (s = new c(s, l, null, n, i), o.push({
						event: s,
						listeners: u
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (s = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", s && n !== Xe && (l = n.relatedTarget || n.fromElement) && (Ji(l) || l[Wi])) break a;
					if ((c || s) && (s = i.window === i ? i : (s = i.ownerDocument) ? s.defaultView || s.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Ji(l) : null, l !== null && (d = yt(l), l !== d || l.tag !== 5 && l.tag !== 6) && (l = null)) : (c = null, l = r), c !== l)) {
						if (u = Jn, h = "onMouseLeave", f = "onMouseEnter", p = "mouse", (e === "pointerout" || e === "pointerover") && (u = or, h = "onPointerLeave", f = "onPointerEnter", p = "pointer"), d = c == null ? s : Xi(c), m = l == null ? s : Xi(l), s = new u(h, p + "leave", c, n, i), s.target = d, s.relatedTarget = m, h = null, Ji(i) === r && (u = new u(f, p + "enter", l, n, i), u.target = m, u.relatedTarget = d, h = u), d = h, c && l) b: {
							for (u = c, f = l, p = 0, m = u; m; m = Ci(m)) p++;
							for (m = 0, h = f; h; h = Ci(h)) m++;
							for (; 0 < p - m;) u = Ci(u), p--;
							for (; 0 < m - p;) f = Ci(f), m--;
							for (; p--;) {
								if (u === f || f !== null && u === f.alternate) break b;
								u = Ci(u), f = Ci(f);
							}
							u = null;
						}
						else u = null;
						c !== null && wi(o, s, c, u, !1), l !== null && d !== null && wi(o, d, l, u, !0);
					}
				}
				a: {
					if (s = r ? Xi(r) : window, c = s.nodeName && s.nodeName.toLowerCase(), c === "select" || c === "input" && s.type === "file") var g = kr;
					else if (Cr(s)) {
						if (Ar) g = zr;
						else {
							g = Lr;
							var _ = Ir;
						}
					} else (c = s.nodeName) && c.toLowerCase() === "input" && (s.type === "checkbox" || s.type === "radio") && (g = Rr);
					if (g &&= g(e, r)) {
						wr(o, g, n, i);
						break a;
					}
					_ && _(e, s, r), e === "focusout" && (_ = s._wrapperState) && _.controlled && s.type === "number" && Me(s, "number", s.value);
				}
				switch (_ = r ? Xi(r) : window, e) {
					case "focusin":
						(Cr(_) || _.contentEditable === "true") && (Xr = _, Zr = r, Qr = null);
						break;
					case "focusout":
						Qr = Zr = Xr = null;
						break;
					case "mousedown":
						$r = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						$r = !1, ei(o, n, i);
						break;
					case "selectionchange": if (Yr) break;
					case "keydown":
					case "keyup": ei(o, n, i);
				}
				var v;
				if (dr) b: {
					switch (e) {
						case "compositionstart":
							var y = "onCompositionStart";
							break b;
						case "compositionend":
							y = "onCompositionEnd";
							break b;
						case "compositionupdate":
							y = "onCompositionUpdate";
							break b;
					}
					y = void 0;
				}
				else yr ? _r(e, n) && (y = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (y = "onCompositionStart");
				y && (mr && n.locale !== "ko" && (yr || y !== "onCompositionStart" ? y === "onCompositionEnd" && yr && (v = In()) : (Nn = i, Pn = "value" in Nn ? Nn.value : Nn.textContent, yr = !0)), _ = Si(r, y), 0 < _.length && (y = new $n(y, e, null, n, i), o.push({
					event: y,
					listeners: _
				}), v ? y.data = v : (v = vr(n), v !== null && (y.data = v)))), (v = pr ? br(e, n) : xr(e, n)) && (r = Si(r, "onBeforeInput"), 0 < r.length && (i = new $n("onBeforeInput", "beforeinput", null, n, i), o.push({
					event: i,
					listeners: r
				}), i.data = v));
			}
			vi(o, t);
		});
	}
	function xi(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Si(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			i.tag === 5 && a !== null && (i = a, a = ct(e, n), a != null && r.unshift(xi(e, a, i)), a = ct(e, t), a != null && r.push(xi(e, a, i))), e = e.return;
		}
		return r;
	}
	function Ci(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5);
		return e || null;
	}
	function wi(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (c !== null && c === r) break;
			s.tag === 5 && l !== null && (s = l, i ? (c = ct(n, a), c != null && o.unshift(xi(n, c, s))) : i || (c = ct(n, a), c != null && o.push(xi(n, c, s)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Ti = /\r\n?/g, Ei = /\u0000|\uFFFD/g;
	function Di(e) {
		return (typeof e == "string" ? e : "" + e).replace(Ti, "\n").replace(Ei, "");
	}
	function Oi(e, t, n) {
		if (t = Di(t), Di(e) !== t && n) throw Error(r(425));
	}
	function ki() {}
	var Ai = null, ji = null;
	function Mi(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Ni = typeof setTimeout == "function" ? setTimeout : void 0, Pi = typeof clearTimeout == "function" ? clearTimeout : void 0, Fi = typeof Promise == "function" ? Promise : void 0, Ii = typeof queueMicrotask == "function" ? queueMicrotask : Fi === void 0 ? Ni : function(e) {
		return Fi.resolve(null).then(e).catch(Li);
	};
	function Li(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Ri(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$") {
					if (r === 0) {
						e.removeChild(i), wn(t);
						return;
					}
					r--;
				} else n !== "$" && n !== "$?" && n !== "$!" || r++;
			}
			n = i;
		} while (n);
		wn(t);
	}
	function zi(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
				if (t === "/$") return null;
			}
		}
		return e;
	}
	function Bi(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?") {
					if (t === 0) return e;
					t--;
				} else n === "/$" && t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	var Vi = Math.random().toString(36).slice(2), Hi = "__reactFiber$" + Vi, Ui = "__reactProps$" + Vi, Wi = "__reactContainer$" + Vi, Gi = "__reactEvents$" + Vi, Ki = "__reactListeners$" + Vi, qi = "__reactHandles$" + Vi;
	function Ji(e) {
		var t = e[Hi];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[Wi] || n[Hi]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Bi(e); e !== null;) {
					if (n = e[Hi]) return n;
					e = Bi(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Yi(e) {
		return e = e[Hi] || e[Wi], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
	}
	function Xi(e) {
		if (e.tag === 5 || e.tag === 6) return e.stateNode;
		throw Error(r(33));
	}
	function Zi(e) {
		return e[Ui] || null;
	}
	var Qi = [], $i = -1;
	function ea(e) {
		return { current: e };
	}
	function P(e) {
		0 > $i || (e.current = Qi[$i], Qi[$i] = null, $i--);
	}
	function F(e, t) {
		$i++, Qi[$i] = e.current, e.current = t;
	}
	var ta = {}, I = ea(ta), na = ea(!1), ra = ta;
	function ia(e, t) {
		var n = e.type.contextTypes;
		if (!n) return ta;
		var r = e.stateNode;
		if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
		var i = {}, a;
		for (a in n) i[a] = t[a];
		return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = i), i;
	}
	function aa(e) {
		return e = e.childContextTypes, e != null;
	}
	function oa() {
		P(na), P(I);
	}
	function sa(e, t, n) {
		if (I.current !== ta) throw Error(r(168));
		F(I, t), F(na, n);
	}
	function ca(e, t, n) {
		var i = e.stateNode;
		if (t = t.childContextTypes, typeof i.getChildContext != "function") return n;
		for (var a in i = i.getChildContext(), i) if (!(a in t)) throw Error(r(108, be(e) || "Unknown", a));
		return T({}, n, i);
	}
	function la(e) {
		return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || ta, ra = I.current, F(I, e), F(na, na.current), !0;
	}
	function ua(e, t, n) {
		var i = e.stateNode;
		if (!i) throw Error(r(169));
		n ? (e = ca(e, t, ra), i.__reactInternalMemoizedMergedChildContext = e, P(na), P(I), F(I, e)) : P(na), F(na, n);
	}
	var da = null, fa = !1, pa = !1;
	function ma(e) {
		da === null ? da = [e] : da.push(e);
	}
	function ha(e) {
		fa = !0, ma(e);
	}
	function ga() {
		if (!pa && da !== null) {
			pa = !0;
			var e = 0, t = O;
			try {
				var n = da;
				for (O = 1; e < n.length; e++) {
					var r = n[e];
					do
						r = r(!0);
					while (r !== null);
				}
				da = null, fa = !1;
			} catch (t) {
				throw da !== null && (da = da.slice(e + 1)), Tt(At, ga), t;
			} finally {
				O = t, pa = !1;
			}
		}
		return null;
	}
	var _a = [], va = 0, ya = null, ba = 0, xa = [], Sa = 0, Ca = null, wa = 1, Ta = "";
	function Ea(e, t) {
		_a[va++] = ba, _a[va++] = ya, ya = e, ba = t;
	}
	function Da(e, t, n) {
		xa[Sa++] = wa, xa[Sa++] = Ta, xa[Sa++] = Ca, Ca = e;
		var r = wa;
		e = Ta;
		var i = 32 - Rt(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Rt(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, wa = 1 << 32 - Rt(t) + i | n << i | r, Ta = a + e;
		} else wa = 1 << a | n << i | r, Ta = e;
	}
	function Oa(e) {
		e.return !== null && (Ea(e, 1), Da(e, 1, 0));
	}
	function ka(e) {
		for (; e === ya;) ya = _a[--va], _a[va] = null, ba = _a[--va], _a[va] = null;
		for (; e === Ca;) Ca = xa[--Sa], xa[Sa] = null, Ta = xa[--Sa], xa[Sa] = null, wa = xa[--Sa], xa[Sa] = null;
	}
	var Aa = null, ja = null, L = !1, Ma = null;
	function Na(e, t) {
		var n = Kl(5, null, null, 0);
		n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
	}
	function Pa(e, t) {
		switch (e.tag) {
			case 5:
				var n = e.type;
				return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null && (e.stateNode = t, Aa = e, ja = zi(t.firstChild), !0);
			case 6: return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null && (e.stateNode = t, Aa = e, ja = null, !0);
			case 13: return t = t.nodeType === 8 ? t : null, t !== null && (n = Ca === null ? null : {
				id: wa,
				overflow: Ta
			}, e.memoizedState = {
				dehydrated: t,
				treeContext: n,
				retryLane: 1073741824
			}, n = Kl(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Aa = e, ja = null, !0);
			default: return !1;
		}
	}
	function Fa(e) {
		return !!(e.mode & 1) && !(e.flags & 128);
	}
	function Ia(e) {
		if (L) {
			var t = ja;
			if (t) {
				var n = t;
				if (!Pa(e, t)) {
					if (Fa(e)) throw Error(r(418));
					t = zi(n.nextSibling);
					var i = Aa;
					t && Pa(e, t) ? Na(i, n) : (e.flags = e.flags & -4097 | 2, L = !1, Aa = e);
				}
			} else {
				if (Fa(e)) throw Error(r(418));
				e.flags = e.flags & -4097 | 2, L = !1, Aa = e;
			}
		}
	}
	function La(e) {
		for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13;) e = e.return;
		Aa = e;
	}
	function Ra(e) {
		if (e !== Aa) return !1;
		if (!L) return La(e), L = !0, !1;
		var t;
		if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Mi(e.type, e.memoizedProps)), t &&= ja) {
			if (Fa(e)) throw za(), Error(r(418));
			for (; t;) Na(e, t), t = zi(t.nextSibling);
		}
		if (La(e), e.tag === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(r(317));
			a: {
				for (e = e.nextSibling, t = 0; e;) {
					if (e.nodeType === 8) {
						var n = e.data;
						if (n === "/$") {
							if (t === 0) {
								ja = zi(e.nextSibling);
								break a;
							}
							t--;
						} else n !== "$" && n !== "$!" && n !== "$?" || t++;
					}
					e = e.nextSibling;
				}
				ja = null;
			}
		} else ja = Aa ? zi(e.stateNode.nextSibling) : null;
		return !0;
	}
	function za() {
		for (var e = ja; e;) e = zi(e.nextSibling);
	}
	function Ba() {
		ja = Aa = null, L = !1;
	}
	function Va(e) {
		Ma === null ? Ma = [e] : Ma.push(e);
	}
	var Ha = S.ReactCurrentBatchConfig;
	function Ua(e, t, n) {
		if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
			if (n._owner) {
				if (n = n._owner, n) {
					if (n.tag !== 1) throw Error(r(309));
					var i = n.stateNode;
				}
				if (!i) throw Error(r(147, e));
				var a = i, o = "" + e;
				return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === o ? t.ref : (t = function(e) {
					var t = a.refs;
					e === null ? delete t[o] : t[o] = e;
				}, t._stringRef = o, t);
			}
			if (typeof e != "string") throw Error(r(284));
			if (!n._owner) throw Error(r(290, e));
		}
		return e;
	}
	function Wa(e, t) {
		throw e = Object.prototype.toString.call(t), Error(r(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
	}
	function Ga(e) {
		var t = e._init;
		return t(e._payload);
	}
	function Ka(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function i(e, t) {
			for (e = /* @__PURE__ */ new Map(); t !== null;) t.key === null ? e.set(t.index, t) : e.set(t.key, t), t = t.sibling;
			return e;
		}
		function a(e, t) {
			return e = Yl(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 2, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 2), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = $l(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === ne ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === ue && Ga(i) === t.type) ? (r = a(t, n.props), r.ref = Ua(e, t, n), r.return = e, r) : (r = Xl(n.type, n.key, n.props, null, e.mode, r), r.ref = Ua(e, t, n), r.return = e, r);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = eu(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Zl(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number") return t = $l("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case C: return n = Xl(t.type, t.key, t.props, null, e.mode, n), n.ref = Ua(e, null, t), n.return = e, n;
					case te: return t = eu(t, e.mode, n), t.return = e, t;
					case ue:
						var r = t._init;
						return f(e, r(t._payload), n);
				}
				if (Ne(t) || pe(t)) return t = Zl(t, e.mode, n, null), t.return = e, t;
				Wa(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case C: return n.key === i ? l(e, t, n, r) : null;
					case te: return n.key === i ? u(e, t, n, r) : null;
					case ue: return i = n._init, p(e, t, i(n._payload), r);
				}
				if (Ne(n) || pe(n)) return i === null ? d(e, t, n, r, null) : null;
				Wa(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case C: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case te: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case ue:
						var a = r._init;
						return m(e, t, n, a(r._payload), i);
				}
				if (Ne(r) || pe(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				Wa(t, r);
			}
			return null;
		}
		function h(r, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(r, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(r, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(r, d), L && Ea(r, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(r, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return L && Ea(r, h), l;
			}
			for (d = i(r, d); h < s.length; h++) g = m(d, r, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(r, e);
			}), L && Ea(r, h), l;
		}
		function g(a, s, c, l) {
			var u = pe(c);
			if (typeof u != "function") throw Error(r(150));
			if (c = u.call(c), c == null) throw Error(r(151));
			for (var d = u = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), L && Ea(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return L && Ea(a, g), u;
			}
			for (h = i(a, h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), L && Ea(a, g), u;
		}
		function _(e, r, i, o) {
			if (typeof i == "object" && i && i.type === ne && i.key === null && (i = i.props.children), typeof i == "object" && i) {
				switch (i.$$typeof) {
					case C:
						a: {
							for (var c = i.key, l = r; l !== null;) {
								if (l.key === c) {
									if (c = i.type, c === ne) {
										if (l.tag === 7) {
											n(e, l.sibling), r = a(l, i.props.children), r.return = e, e = r;
											break a;
										}
									} else if (l.elementType === c || typeof c == "object" && c && c.$$typeof === ue && Ga(c) === l.type) {
										n(e, l.sibling), r = a(l, i.props), r.ref = Ua(e, l, i), r.return = e, e = r;
										break a;
									}
									n(e, l);
									break;
								}
								t(e, l), l = l.sibling;
							}
							i.type === ne ? (r = Zl(i.props.children, e.mode, o, i.key), r.return = e, e = r) : (o = Xl(i.type, i.key, i.props, null, e.mode, o), o.ref = Ua(e, r, i), o.return = e, e = o);
						}
						return s(e);
					case te:
						a: {
							for (l = i.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === i.containerInfo && r.stateNode.implementation === i.implementation) {
										n(e, r.sibling), r = a(r, i.children || []), r.return = e, e = r;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							r = eu(i, e.mode, o), r.return = e, e = r;
						}
						return s(e);
					case ue: return l = i._init, _(e, r, l(i._payload), o);
				}
				if (Ne(i)) return h(e, r, i, o);
				if (pe(i)) return g(e, r, i, o);
				Wa(e, i);
			}
			return typeof i == "string" && i !== "" || typeof i == "number" ? (i = "" + i, r !== null && r.tag === 6 ? (n(e, r.sibling), r = a(r, i), r.return = e, e = r) : (n(e, r), r = $l(i, e.mode, o), r.return = e, e = r), s(e)) : n(e, r);
		}
		return _;
	}
	var qa = Ka(!0), Ja = Ka(!1), Ya = ea(null), Xa = null, Za = null, Qa = null;
	function $a() {
		Qa = Za = Xa = null;
	}
	function eo(e) {
		var t = Ya.current;
		P(Ya), e._currentValue = t;
	}
	function to(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function no(e, t) {
		Xa = e, Qa = Za = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Vs = !0), e.firstContext = null);
	}
	function ro(e) {
		var t = e._currentValue;
		if (Qa !== e) {
			if (e = {
				context: e,
				memoizedValue: t,
				next: null
			}, Za === null) {
				if (Xa === null) throw Error(r(308));
				Za = e, Xa.dependencies = {
					lanes: 0,
					firstContext: e
				};
			} else Za = Za.next = e;
		}
		return t;
	}
	var io = null;
	function ao(e) {
		io === null ? io = [e] : io.push(e);
	}
	function oo(e, t, n, r) {
		var i = t.interleaved;
		return i === null ? (n.next = n, ao(t)) : (n.next = i.next, i.next = n), t.interleaved = n, so(e, r);
	}
	function so(e, t) {
		e.lanes |= t;
		var n = e.alternate;
		for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null;) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
		return n.tag === 3 ? n.stateNode : null;
	}
	var co = !1;
	function lo(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				interleaved: null,
				lanes: 0
			},
			effects: null
		};
	}
	function uo(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			effects: e.effects
		});
	}
	function fo(e, t) {
		return {
			eventTime: e,
			lane: t,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function po(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, q & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, so(e, n);
		}
		return i = r.interleaved, i === null ? (t.next = t, ao(r)) : (t.next = i.next, i.next = t), r.interleaved = t, so(e, n);
	}
	function mo(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194240)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, $t(e, n);
		}
	}
	function ho(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						eventTime: n.eventTime,
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: n.callback,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				effects: r.effects
			}, e.updateQueue = n;
		} else e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	function go(e, t, n, r) {
		var i = e.updateQueue;
		co = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane, p = s.eventTime;
				if ((r & f) === f) {
					u !== null && (u = u.next = {
						eventTime: p,
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: s.callback,
						next: null
					});
					a: {
						var m = e, h = s;
						switch (f = t, p = n, h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(p, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(p, d, f) : m, f == null) break a;
								d = T({}, d, f);
								break a;
							case 2: co = !0;
						}
					}
					s.callback !== null && s.lane !== 0 && (e.flags |= 64, f = i.effects, f === null ? i.effects = [s] : f.push(s));
				} else p = {
					eventTime: p,
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					f = s, s = f.next, f.next = null, i.lastBaseUpdate = f, i.shared.pending = null;
				}
			} while (1);
			if (u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, t = i.shared.interleaved, t !== null) {
				i = t;
				do
					o |= i.lane, i = i.next;
				while (i !== t);
			} else a === null && (i.shared.lanes = 0);
			Xc |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function _o(e, t, n) {
		if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
			var i = e[t], a = i.callback;
			if (a !== null) {
				if (i.callback = null, i = n, typeof a != "function") throw Error(r(191, a));
				a.call(i);
			}
		}
	}
	var vo = {}, yo = ea(vo), bo = ea(vo), xo = ea(vo);
	function So(e) {
		if (e === vo) throw Error(r(174));
		return e;
	}
	function Co(e, t) {
		switch (F(xo, t), F(bo, e), F(yo, vo), e = t.nodeType, e) {
			case 9:
			case 11:
				t = (t = t.documentElement) ? t.namespaceURI : Be(null, "");
				break;
			default: e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Be(t, e);
		}
		P(yo), F(yo, t);
	}
	function wo() {
		P(yo), P(bo), P(xo);
	}
	function To(e) {
		So(xo.current);
		var t = So(yo.current), n = Be(t, e.type);
		t !== n && (F(bo, e), F(yo, n));
	}
	function Eo(e) {
		bo.current === e && (P(yo), P(bo));
	}
	var R = ea(0);
	function Do(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var Oo = [];
	function ko() {
		for (var e = 0; e < Oo.length; e++) Oo[e]._workInProgressVersionPrimary = null;
		Oo.length = 0;
	}
	var Ao = S.ReactCurrentDispatcher, jo = S.ReactCurrentBatchConfig, Mo = 0, z = null, B = null, V = null, No = !1, Po = !1, Fo = 0, Io = 0;
	function H() {
		throw Error(r(321));
	}
	function Lo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Vr(e[n], t[n])) return !1;
		return !0;
	}
	function Ro(e, t, n, i, a, o) {
		if (Mo = o, z = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Ao.current = e === null || e.memoizedState === null ? xs : Ss, e = n(i, a), Po) {
			o = 0;
			do {
				if (Po = !1, Fo = 0, 25 <= o) throw Error(r(301));
				o += 1, V = B = null, t.updateQueue = null, Ao.current = Cs, e = n(i, a);
			} while (Po);
		}
		if (Ao.current = bs, t = B !== null && B.next !== null, Mo = 0, V = B = z = null, No = !1, t) throw Error(r(300));
		return e;
	}
	function zo() {
		var e = Fo !== 0;
		return Fo = 0, e;
	}
	function Bo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return V === null ? z.memoizedState = V = e : V = V.next = e, V;
	}
	function Vo() {
		if (B === null) {
			var e = z.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = B.next;
		var t = V === null ? z.memoizedState : V.next;
		if (t !== null) V = t, B = e;
		else {
			if (e === null) throw Error(r(310));
			B = e, e = {
				memoizedState: B.memoizedState,
				baseState: B.baseState,
				baseQueue: B.baseQueue,
				queue: B.queue,
				next: null
			}, V === null ? z.memoizedState = V = e : V = V.next = e;
		}
		return V;
	}
	function Ho(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Uo(e) {
		var t = Vo(), n = t.queue;
		if (n === null) throw Error(r(311));
		n.lastRenderedReducer = e;
		var i = B, a = i.baseQueue, o = n.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			i.baseQueue = a = o, n.pending = null;
		}
		if (a !== null) {
			o = a.next, i = i.baseState;
			var c = s = null, l = null, u = o;
			do {
				var d = u.lane;
				if ((Mo & d) === d) l !== null && (l = l.next = {
					lane: 0,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}), i = u.hasEagerState ? u.eagerState : e(i, u.action);
				else {
					var f = {
						lane: d,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					};
					l === null ? (c = l = f, s = i) : l = l.next = f, z.lanes |= d, Xc |= d;
				}
				u = u.next;
			} while (u !== null && u !== o);
			l === null ? s = i : l.next = c, Vr(i, t.memoizedState) || (Vs = !0), t.memoizedState = i, t.baseState = s, t.baseQueue = l, n.lastRenderedState = i;
		}
		if (e = n.interleaved, e !== null) {
			a = e;
			do
				o = a.lane, z.lanes |= o, Xc |= o, a = a.next;
			while (a !== e);
		} else a === null && (n.lanes = 0);
		return [t.memoizedState, n.dispatch];
	}
	function Wo(e) {
		var t = Vo(), n = t.queue;
		if (n === null) throw Error(r(311));
		n.lastRenderedReducer = e;
		var i = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Vr(o, t.memoizedState) || (Vs = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, i];
	}
	function Go() {}
	function Ko(e, t) {
		var n = z, i = Vo(), a = t(), o = !Vr(i.memoizedState, a);
		if (o && (i.memoizedState = a, Vs = !0), i = i.queue, is(Yo.bind(null, n, i, e), [e]), i.getSnapshot !== t || o || V !== null && V.memoizedState.tag & 1) {
			if (n.flags |= 2048, $o(9, Jo.bind(null, n, i, a, t), void 0, null), J === null) throw Error(r(349));
			Mo & 30 || qo(n, t, a);
		}
		return a;
	}
	function qo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = z.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, z.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Jo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Xo(t) && Zo(e);
	}
	function Yo(e, t, n) {
		return n(function() {
			Xo(t) && Zo(e);
		});
	}
	function Xo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Vr(e, n);
		} catch {
			return !0;
		}
	}
	function Zo(e) {
		var t = so(e, 1);
		t !== null && hl(t, e, 1, -1);
	}
	function Qo(e) {
		var t = Bo();
		return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = {
			pending: null,
			interleaved: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Ho,
			lastRenderedState: e
		}, t.queue = e, e = e.dispatch = gs.bind(null, z, e), [t.memoizedState, e];
	}
	function $o(e, t, n, r) {
		return e = {
			tag: e,
			create: t,
			destroy: n,
			deps: r,
			next: null
		}, t = z.updateQueue, t === null ? (t = {
			lastEffect: null,
			stores: null
		}, z.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
	}
	function es() {
		return Vo().memoizedState;
	}
	function ts(e, t, n, r) {
		var i = Bo();
		z.flags |= e, i.memoizedState = $o(1 | t, n, void 0, r === void 0 ? null : r);
	}
	function ns(e, t, n, r) {
		var i = Vo();
		r = r === void 0 ? null : r;
		var a = void 0;
		if (B !== null) {
			var o = B.memoizedState;
			if (a = o.destroy, r !== null && Lo(r, o.deps)) {
				i.memoizedState = $o(t, n, a, r);
				return;
			}
		}
		z.flags |= e, i.memoizedState = $o(1 | t, n, a, r);
	}
	function rs(e, t) {
		return ts(8390656, 8, e, t);
	}
	function is(e, t) {
		return ns(2048, 8, e, t);
	}
	function as(e, t) {
		return ns(4, 2, e, t);
	}
	function os(e, t) {
		return ns(4, 4, e, t);
	}
	function ss(e, t) {
		if (typeof t == "function") return e = e(), t(e), function() {
			t(null);
		};
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function cs(e, t, n) {
		return n = n == null ? null : n.concat([e]), ns(4, 4, ss.bind(null, t, e), n);
	}
	function ls() {}
	function us(e, t) {
		var n = Vo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return r !== null && t !== null && Lo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ds(e, t) {
		var n = Vo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return r !== null && t !== null && Lo(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
	}
	function fs(e, t, n) {
		return Mo & 21 ? (Vr(n, t) || (n = Yt(), z.lanes |= n, Xc |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Vs = !0), e.memoizedState = n);
	}
	function ps(e, t) {
		var n = O;
		O = n !== 0 && 4 > n ? n : 4, e(!0);
		var r = jo.transition;
		jo.transition = {};
		try {
			e(!1), t();
		} finally {
			O = n, jo.transition = r;
		}
	}
	function ms() {
		return Vo().memoizedState;
	}
	function hs(e, t, n) {
		var r = ml(e);
		if (n = {
			lane: r,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, _s(e)) vs(t, n);
		else if (n = oo(e, t, n, r), n !== null) {
			var i = Q();
			hl(n, e, r, i), ys(n, t, r);
		}
	}
	function gs(e, t, n) {
		var r = ml(e), i = {
			lane: r,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (_s(e)) vs(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Vr(s, o)) {
					var c = t.interleaved;
					c === null ? (i.next = i, ao(t)) : (i.next = c.next, c.next = i), t.interleaved = i;
					return;
				}
			} catch {}
			n = oo(e, t, i, r), n !== null && (i = Q(), hl(n, e, r, i), ys(n, t, r));
		}
	}
	function _s(e) {
		var t = e.alternate;
		return e === z || t !== null && t === z;
	}
	function vs(e, t) {
		Po = No = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function ys(e, t, n) {
		if (n & 4194240) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, $t(e, n);
		}
	}
	var bs = {
		readContext: ro,
		useCallback: H,
		useContext: H,
		useEffect: H,
		useImperativeHandle: H,
		useInsertionEffect: H,
		useLayoutEffect: H,
		useMemo: H,
		useReducer: H,
		useRef: H,
		useState: H,
		useDebugValue: H,
		useDeferredValue: H,
		useTransition: H,
		useMutableSource: H,
		useSyncExternalStore: H,
		useId: H,
		unstable_isNewReconciler: !1
	}, xs = {
		readContext: ro,
		useCallback: function(e, t) {
			return Bo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: ro,
		useEffect: rs,
		useImperativeHandle: function(e, t, n) {
			return n = n == null ? null : n.concat([e]), ts(4194308, 4, ss.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return ts(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			return ts(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = Bo();
			return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
		},
		useReducer: function(e, t, n) {
			var r = Bo();
			return t = n === void 0 ? t : n(t), r.memoizedState = r.baseState = t, e = {
				pending: null,
				interleaved: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: t
			}, r.queue = e, e = e.dispatch = hs.bind(null, z, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = Bo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: Qo,
		useDebugValue: ls,
		useDeferredValue: function(e) {
			return Bo().memoizedState = e;
		},
		useTransition: function() {
			var e = Qo(!1), t = e[0];
			return e = ps.bind(null, e[1]), Bo().memoizedState = e, [t, e];
		},
		useMutableSource: function() {},
		useSyncExternalStore: function(e, t, n) {
			var i = z, a = Bo();
			if (L) {
				if (n === void 0) throw Error(r(407));
				n = n();
			} else {
				if (n = t(), J === null) throw Error(r(349));
				Mo & 30 || qo(i, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, rs(Yo.bind(null, i, o, e), [e]), i.flags |= 2048, $o(9, Jo.bind(null, i, o, n, t), void 0, null), n;
		},
		useId: function() {
			var e = Bo(), t = J.identifierPrefix;
			if (L) {
				var n = Ta, r = wa;
				n = (r & ~(1 << 32 - Rt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = Fo++, 0 < n && (t += "H" + n.toString(32)), t += ":";
			} else n = Io++, t = ":" + t + "r" + n.toString(32) + ":";
			return e.memoizedState = t;
		},
		unstable_isNewReconciler: !1
	}, Ss = {
		readContext: ro,
		useCallback: us,
		useContext: ro,
		useEffect: is,
		useImperativeHandle: cs,
		useInsertionEffect: as,
		useLayoutEffect: os,
		useMemo: ds,
		useReducer: Uo,
		useRef: es,
		useState: function() {
			return Uo(Ho);
		},
		useDebugValue: ls,
		useDeferredValue: function(e) {
			return fs(Vo(), B.memoizedState, e);
		},
		useTransition: function() {
			return [Uo(Ho)[0], Vo().memoizedState];
		},
		useMutableSource: Go,
		useSyncExternalStore: Ko,
		useId: ms,
		unstable_isNewReconciler: !1
	}, Cs = {
		readContext: ro,
		useCallback: us,
		useContext: ro,
		useEffect: is,
		useImperativeHandle: cs,
		useInsertionEffect: as,
		useLayoutEffect: os,
		useMemo: ds,
		useReducer: Wo,
		useRef: es,
		useState: function() {
			return Wo(Ho);
		},
		useDebugValue: ls,
		useDeferredValue: function(e) {
			var t = Vo();
			return B === null ? t.memoizedState = e : fs(t, B.memoizedState, e);
		},
		useTransition: function() {
			return [Wo(Ho)[0], Vo().memoizedState];
		},
		useMutableSource: Go,
		useSyncExternalStore: Ko,
		useId: ms,
		unstable_isNewReconciler: !1
	};
	function ws(e, t) {
		if (e && e.defaultProps) {
			for (var n in t = T({}, t), e = e.defaultProps, e) t[n] === void 0 && (t[n] = e[n]);
			return t;
		}
		return t;
	}
	function Ts(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : T({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Es = {
		isMounted: function(e) {
			return (e = e._reactInternals) ? yt(e) === e : !1;
		},
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = Q(), i = ml(e), a = fo(r, i);
			a.payload = t, n != null && (a.callback = n), t = po(e, a, i), t !== null && (hl(t, e, i, r), mo(t, e, i));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = Q(), i = ml(e), a = fo(r, i);
			a.tag = 1, a.payload = t, n != null && (a.callback = n), t = po(e, a, i), t !== null && (hl(t, e, i, r), mo(t, e, i));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = Q(), r = ml(e), i = fo(n, r);
			i.tag = 2, t != null && (i.callback = t), t = po(e, i, r), t !== null && (hl(t, e, r, n), mo(t, e, r));
		}
	};
	function Ds(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Hr(n, r) || !Hr(i, a) : !0;
	}
	function Os(e, t, n) {
		var r = !1, i = ta, a = t.contextType;
		return typeof a == "object" && a ? a = ro(a) : (i = aa(t) ? ra : I.current, r = t.contextTypes, a = (r = r != null) ? ia(e, i) : ta), t = new t(n, a), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Es, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = i, e.__reactInternalMemoizedMaskedChildContext = a), t;
	}
	function ks(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Es.enqueueReplaceState(t, t.state, null);
	}
	function As(e, t, n, r) {
		var i = e.stateNode;
		i.props = n, i.state = e.memoizedState, i.refs = {}, lo(e);
		var a = t.contextType;
		typeof a == "object" && a ? i.context = ro(a) : (a = aa(t) ? ra : I.current, i.context = ia(e, a)), i.state = e.memoizedState, a = t.getDerivedStateFromProps, typeof a == "function" && (Ts(e, t, a, n), i.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (t = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), t !== i.state && Es.enqueueReplaceState(i, i.state, null), go(e, n, i, r), i.state = e.memoizedState), typeof i.componentDidMount == "function" && (e.flags |= 4194308);
	}
	function js(e, t) {
		try {
			var n = "", r = t;
			do
				n += ve(r), r = r.return;
			while (r);
			var i = n;
		} catch (e) {
			i = "\nError generating stack: " + e.message + "\n" + e.stack;
		}
		return {
			value: e,
			source: t,
			stack: i,
			digest: null
		};
	}
	function Ms(e, t, n) {
		return {
			value: e,
			source: null,
			stack: n ?? null,
			digest: t ?? null
		};
	}
	function Ns(e, t) {
		try {
			console.error(t.value);
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	var Ps = typeof WeakMap == "function" ? WeakMap : Map;
	function Fs(e, t, n) {
		n = fo(-1, n), n.tag = 3, n.payload = { element: null };
		var r = t.value;
		return n.callback = function() {
			il || (il = !0, al = r), Ns(e, t);
		}, n;
	}
	function Is(e, t, n) {
		n = fo(-1, n), n.tag = 3;
		var r = e.type.getDerivedStateFromError;
		if (typeof r == "function") {
			var i = t.value;
			n.payload = function() {
				return r(i);
			}, n.callback = function() {
				Ns(e, t);
			};
		}
		var a = e.stateNode;
		return a !== null && typeof a.componentDidCatch == "function" && (n.callback = function() {
			Ns(e, t), typeof r != "function" && (ol === null ? ol = /* @__PURE__ */ new Set([this]) : ol.add(this));
			var n = t.stack;
			this.componentDidCatch(t.value, { componentStack: n === null ? "" : n });
		}), n;
	}
	function Ls(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Ps();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (i.add(n), e = zl.bind(null, e, t, n), t.then(e, e));
	}
	function Rs(e) {
		do {
			var t;
			if ((t = e.tag === 13) && (t = e.memoizedState, t = t === null || t.dehydrated !== null), t) return e;
			e = e.return;
		} while (e !== null);
		return null;
	}
	function zs(e, t, n, r, i) {
		return e.mode & 1 ? (e.flags |= 65536, e.lanes = i, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = fo(-1, 1), t.tag = 2, po(n, t, 1))), n.lanes |= 1), e);
	}
	var Bs = S.ReactCurrentOwner, Vs = !1;
	function Hs(e, t, n, r) {
		t.child = e === null ? Ja(t, null, n, r) : qa(t, e.child, n, r);
	}
	function Us(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		return no(t, i), r = Ro(e, t, n, r, a, i), n = zo(), e !== null && !Vs ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, lc(e, t, i)) : (L && n && Oa(t), t.flags |= 1, Hs(e, t, r, i), t.child);
	}
	function Ws(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ql(a) && a.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = a, Gs(e, t, a, r, i)) : (e = Xl(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, (e.lanes & i) === 0) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Hr : n, n(o, r) && e.ref === t.ref) return lc(e, t, i);
		}
		return t.flags |= 1, e = Yl(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Gs(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Hr(a, r) && e.ref === t.ref) {
				if (Vs = !1, t.pendingProps = r = a, (e.lanes & i) !== 0) e.flags & 131072 && (Vs = !0);
				else return t.lanes = e.lanes, lc(e, t, i);
			}
		}
		return Js(e, t, n, r, i);
	}
	function Ks(e, t, n) {
		var r = t.pendingProps, i = r.children, a = e === null ? null : e.memoizedState;
		if (r.mode === "hidden") {
			if (!(t.mode & 1)) t.memoizedState = {
				baseLanes: 0,
				cachePool: null,
				transitions: null
			}, F(Jc, qc), qc |= n;
			else {
				if (!(n & 1073741824)) return e = a === null ? n : a.baseLanes | n, t.lanes = t.childLanes = 1073741824, t.memoizedState = {
					baseLanes: e,
					cachePool: null,
					transitions: null
				}, t.updateQueue = null, F(Jc, qc), qc |= e, null;
				t.memoizedState = {
					baseLanes: 0,
					cachePool: null,
					transitions: null
				}, r = a === null ? n : a.baseLanes, F(Jc, qc), qc |= r;
			}
		} else a === null ? r = n : (r = a.baseLanes | n, t.memoizedState = null), F(Jc, qc), qc |= r;
		return Hs(e, t, i, n), t.child;
	}
	function qs(e, t) {
		var n = t.ref;
		(e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
	}
	function Js(e, t, n, r, i) {
		var a = aa(n) ? ra : I.current;
		return a = ia(t, a), no(t, i), n = Ro(e, t, n, r, a, i), r = zo(), e !== null && !Vs ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~i, lc(e, t, i)) : (L && r && Oa(t), t.flags |= 1, Hs(e, t, n, i), t.child);
	}
	function Ys(e, t, n, r, i) {
		if (aa(n)) {
			var a = !0;
			la(t);
		} else a = !1;
		if (no(t, i), t.stateNode === null) cc(e, t), Os(t, n, r), As(t, n, r, i), r = !0;
		else if (e === null) {
			var o = t.stateNode, s = t.memoizedProps;
			o.props = s;
			var c = o.context, l = n.contextType;
			typeof l == "object" && l ? l = ro(l) : (l = aa(n) ? ra : I.current, l = ia(t, l));
			var u = n.getDerivedStateFromProps, d = typeof u == "function" || typeof o.getSnapshotBeforeUpdate == "function";
			d || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== r || c !== l) && ks(t, o, r, l), co = !1;
			var f = t.memoizedState;
			o.state = f, go(t, r, o, i), c = t.memoizedState, s !== r || f !== c || na.current || co ? (typeof u == "function" && (Ts(t, n, u, r), c = t.memoizedState), (s = co || Ds(t, n, s, r, f, c, l)) ? (d || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(), typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()), typeof o.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), o.props = r, o.state = c, o.context = l, r = s) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			o = t.stateNode, uo(e, t), s = t.memoizedProps, l = t.type === t.elementType ? s : ws(t.type, s), o.props = l, d = t.pendingProps, f = o.context, c = n.contextType, typeof c == "object" && c ? c = ro(c) : (c = aa(n) ? ra : I.current, c = ia(t, c));
			var p = n.getDerivedStateFromProps;
			(u = typeof p == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (s !== d || f !== c) && ks(t, o, r, c), co = !1, f = t.memoizedState, o.state = f, go(t, r, o, i);
			var m = t.memoizedState;
			s !== d || f !== m || na.current || co ? (typeof p == "function" && (Ts(t, n, p, r), m = t.memoizedState), (l = co || Ds(t, n, l, r, f, m, c) || !1) ? (u || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(r, m, c), typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(r, m, c)), typeof o.componentDidUpdate == "function" && (t.flags |= 4), typeof o.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = m), o.props = r, o.state = m, o.context = c, r = l) : (typeof o.componentDidUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof o.getSnapshotBeforeUpdate != "function" || s === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return Xs(e, t, n, r, a, i);
	}
	function Xs(e, t, n, r, i, a) {
		qs(e, t);
		var o = !!(t.flags & 128);
		if (!r && !o) return i && ua(t, n, !1), lc(e, t, a);
		r = t.stateNode, Bs.current = t;
		var s = o && typeof n.getDerivedStateFromError != "function" ? null : r.render();
		return t.flags |= 1, e !== null && o ? (t.child = qa(t, e.child, null, a), t.child = qa(t, null, s, a)) : Hs(e, t, s, a), t.memoizedState = r.state, i && ua(t, n, !0), t.child;
	}
	function Zs(e) {
		var t = e.stateNode;
		t.pendingContext ? sa(e, t.pendingContext, t.pendingContext !== t.context) : t.context && sa(e, t.context, !1), Co(e, t.containerInfo);
	}
	function Qs(e, t, n, r, i) {
		return Ba(), Va(i), t.flags |= 256, Hs(e, t, n, r), t.child;
	}
	var $s = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0
	};
	function ec(e) {
		return {
			baseLanes: e,
			cachePool: null,
			transitions: null
		};
	}
	function tc(e, t, n) {
		var r = t.pendingProps, i = R.current, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(i & 2)), s ? (a = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (i |= 1), F(R, i & 1), e === null) return Ia(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.lanes = t.mode & 1 ? e.data === "$!" ? 8 : 1073741824 : 1, null) : (o = r.children, e = r.fallback, a ? (r = t.mode, a = t.child, o = {
			mode: "hidden",
			children: o
		}, !(r & 1) && a !== null ? (a.childLanes = 0, a.pendingProps = o) : a = Ql(o, r, 0, null), e = Zl(e, r, n, null), a.return = t, e.return = t, a.sibling = e, t.child = a, t.child.memoizedState = ec(n), t.memoizedState = $s, e) : nc(t, o));
		if (i = e.memoizedState, i !== null && (s = i.dehydrated, s !== null)) return ic(e, t, o, r, s, i, n);
		if (a) {
			a = r.fallback, o = t.mode, i = e.child, s = i.sibling;
			var c = {
				mode: "hidden",
				children: r.children
			};
			return !(o & 1) && t.child !== i ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = Yl(i, c), r.subtreeFlags = i.subtreeFlags & 14680064), s === null ? (a = Zl(a, o, n, null), a.flags |= 2) : a = Yl(s, a), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, o = e.child.memoizedState, o = o === null ? ec(n) : {
				baseLanes: o.baseLanes | n,
				cachePool: null,
				transitions: o.transitions
			}, a.memoizedState = o, a.childLanes = e.childLanes & ~n, t.memoizedState = $s, r;
		}
		return a = e.child, e = a.sibling, r = Yl(a, {
			mode: "visible",
			children: r.children
		}), !(t.mode & 1) && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
	}
	function nc(e, t) {
		return t = Ql({
			mode: "visible",
			children: t
		}, e.mode, 0, null), t.return = e, e.child = t;
	}
	function rc(e, t, n, r) {
		return r !== null && Va(r), qa(t, e.child, null, n), e = nc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function ic(e, t, n, i, a, o, s) {
		if (n) return t.flags & 256 ? (t.flags &= -257, i = Ms(Error(r(422))), rc(e, t, s, i)) : t.memoizedState === null ? (o = i.fallback, a = t.mode, i = Ql({
			mode: "visible",
			children: i.children
		}, a, 0, null), o = Zl(o, a, s, null), o.flags |= 2, i.return = t, o.return = t, i.sibling = o, t.child = i, t.mode & 1 && qa(t, e.child, null, s), t.child.memoizedState = ec(s), t.memoizedState = $s, o) : (t.child = e.child, t.flags |= 128, null);
		if (!(t.mode & 1)) return rc(e, t, s, null);
		if (a.data === "$!") {
			if (i = a.nextSibling && a.nextSibling.dataset, i) var c = i.dgst;
			return i = c, o = Error(r(419)), i = Ms(o, i, void 0), rc(e, t, s, i);
		}
		if (c = (s & e.childLanes) !== 0, Vs || c) {
			if (i = J, i !== null) {
				switch (s & -s) {
					case 4:
						a = 2;
						break;
					case 16:
						a = 8;
						break;
					case 64:
					case 128:
					case 256:
					case 512:
					case 1024:
					case 2048:
					case 4096:
					case 8192:
					case 16384:
					case 32768:
					case 65536:
					case 131072:
					case 262144:
					case 524288:
					case 1048576:
					case 2097152:
					case 4194304:
					case 8388608:
					case 16777216:
					case 33554432:
					case 67108864:
						a = 32;
						break;
					case 536870912:
						a = 268435456;
						break;
					default: a = 0;
				}
				a = (a & (i.suspendedLanes | s)) === 0 ? a : 0, a !== 0 && a !== o.retryLane && (o.retryLane = a, so(e, a), hl(i, e, a, -1));
			}
			return kl(), i = Ms(Error(r(421))), rc(e, t, s, i);
		}
		return a.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Vl.bind(null, e), a._reactRetry = t, null) : (e = o.treeContext, ja = zi(a.nextSibling), Aa = t, L = !0, Ma = null, e !== null && (xa[Sa++] = wa, xa[Sa++] = Ta, xa[Sa++] = Ca, wa = e.id, Ta = e.overflow, Ca = t), t = nc(t, i.children), t.flags |= 4096, t);
	}
	function ac(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), to(e.return, t, n);
	}
	function oc(e, t, n, r, i) {
		var a = e.memoizedState;
		a === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i
		} : (a.isBackwards = t, a.rendering = null, a.renderingStartTime = 0, a.last = r, a.tail = n, a.tailMode = i);
	}
	function sc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		if (Hs(e, t, r.children, n), r = R.current, r & 2) r = r & 1 | 2, t.flags |= 128;
		else {
			if (e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
				if (e.tag === 13) e.memoizedState !== null && ac(e, n, t);
				else if (e.tag === 19) ac(e, n, t);
				else if (e.child !== null) {
					e.child.return = e, e = e.child;
					continue;
				}
				if (e === t) break a;
				for (; e.sibling === null;) {
					if (e.return === null || e.return === t) break a;
					e = e.return;
				}
				e.sibling.return = e.return, e = e.sibling;
			}
			r &= 1;
		}
		if (F(R, r), !(t.mode & 1)) t.memoizedState = null;
		else switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && Do(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), oc(t, !1, i, n, a);
				break;
			case "backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Do(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				oc(t, !0, n, null, a);
				break;
			case "together":
				oc(t, !1, null, null, void 0);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function cc(e, t) {
		!(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
	}
	function lc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Xc |= t.lanes, (n & t.childLanes) === 0) return null;
		if (e !== null && t.child !== e.child) throw Error(r(153));
		if (t.child !== null) {
			for (e = t.child, n = Yl(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Yl(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function uc(e, t, n) {
		switch (t.tag) {
			case 3:
				Zs(t), Ba();
				break;
			case 5:
				To(t);
				break;
			case 1:
				aa(t.type) && la(t);
				break;
			case 4:
				Co(t, t.stateNode.containerInfo);
				break;
			case 10:
				var r = t.type._context, i = t.memoizedProps.value;
				F(Ya, r._currentValue), r._currentValue = i;
				break;
			case 13:
				if (r = t.memoizedState, r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (F(R, R.current & 1), e = lc(e, t, n), e === null ? null : e.sibling) : tc(e, t, n) : (F(R, R.current & 1), t.flags |= 128, null);
				F(R, R.current & 1);
				break;
			case 19:
				if (r = (n & t.childLanes) !== 0, e.flags & 128) {
					if (r) return sc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), F(R, R.current), r) break;
				return null;
			case 22:
			case 23: return t.lanes = 0, Ks(e, t, n);
		}
		return lc(e, t, n);
	}
	var dc = function(e, t) {
		for (var n = t.child; n !== null;) {
			if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
			else if (n.tag !== 4 && n.child !== null) {
				n.child.return = n, n = n.child;
				continue;
			}
			if (n === t) break;
			for (; n.sibling === null;) {
				if (n.return === null || n.return === t) return;
				n = n.return;
			}
			n.sibling.return = n.return, n = n.sibling;
		}
	}, fc = function(e, t, n, r) {
		var i = e.memoizedProps;
		if (i !== r) {
			e = t.stateNode, So(yo.current);
			var o = null;
			switch (n) {
				case "input":
					i = De(e, i), r = De(e, r), o = [];
					break;
				case "select":
					i = T({}, i, { value: void 0 }), r = T({}, r, { value: void 0 }), o = [];
					break;
				case "textarea":
					i = Fe(e, i), r = Fe(e, r), o = [];
					break;
				default: typeof i.onClick != "function" && typeof r.onClick == "function" && (e.onclick = ki);
			}
			Je(n, r);
			var s;
			for (u in n = null, i) if (!r.hasOwnProperty(u) && i.hasOwnProperty(u) && i[u] != null) {
				if (u === "style") {
					var c = i[u];
					for (s in c) c.hasOwnProperty(s) && (n ||= {}, n[s] = "");
				} else u !== "dangerouslySetInnerHTML" && u !== "children" && u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && u !== "autoFocus" && (a.hasOwnProperty(u) ? o ||= [] : (o ||= []).push(u, null));
			}
			for (u in r) {
				var l = r[u];
				if (c = i?.[u], r.hasOwnProperty(u) && l !== c && (l != null || c != null)) {
					if (u === "style") {
						if (c) {
							for (s in c) !c.hasOwnProperty(s) || l && l.hasOwnProperty(s) || (n ||= {}, n[s] = "");
							for (s in l) l.hasOwnProperty(s) && c[s] !== l[s] && (n ||= {}, n[s] = l[s]);
						} else n || (o ||= [], o.push(u, n)), n = l;
					} else u === "dangerouslySetInnerHTML" ? (l = l ? l.__html : void 0, c = c ? c.__html : void 0, l != null && c !== l && (o ||= []).push(u, l)) : u === "children" ? typeof l != "string" && typeof l != "number" || (o ||= []).push(u, "" + l) : u !== "suppressContentEditableWarning" && u !== "suppressHydrationWarning" && (a.hasOwnProperty(u) ? (l != null && u === "onScroll" && A("scroll", e), o || c === l || (o = [])) : (o ||= []).push(u, l));
				}
			}
			n && (o ||= []).push("style", n);
			var u = o;
			(t.updateQueue = u) && (t.flags |= 4);
		}
	}, pc = function(e, t, n, r) {
		n !== r && (t.flags |= 4);
	};
	function mc(e, t) {
		if (!L) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function U(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 14680064, r |= i.flags & 14680064, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function hc(e, t, n) {
		var i = t.pendingProps;
		switch (ka(t), t.tag) {
			case 2:
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return U(t), null;
			case 1: return aa(t.type) && oa(), U(t), null;
			case 3: return i = t.stateNode, wo(), P(na), P(I), ko(), i.pendingContext && (i.context = i.pendingContext, i.pendingContext = null), (e === null || e.child === null) && (Ra(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Ma !== null && (yl(Ma), Ma = null))), U(t), null;
			case 5:
				Eo(t);
				var o = So(xo.current);
				if (n = t.type, e !== null && t.stateNode != null) fc(e, t, n, i, o), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
				else {
					if (!i) {
						if (t.stateNode === null) throw Error(r(166));
						return U(t), null;
					}
					if (e = So(yo.current), Ra(t)) {
						i = t.stateNode, n = t.type;
						var s = t.memoizedProps;
						switch (i[Hi] = t, i[Ui] = s, e = !!(t.mode & 1), n) {
							case "dialog":
								A("cancel", i), A("close", i);
								break;
							case "iframe":
							case "object":
							case "embed":
								A("load", i);
								break;
							case "video":
							case "audio":
								for (o = 0; o < hi.length; o++) A(hi[o], i);
								break;
							case "source":
								A("error", i);
								break;
							case "img":
							case "image":
							case "link":
								A("error", i), A("load", i);
								break;
							case "details":
								A("toggle", i);
								break;
							case "input":
								Oe(i, s), A("invalid", i);
								break;
							case "select":
								i._wrapperState = { wasMultiple: !!s.multiple }, A("invalid", i);
								break;
							case "textarea": Ie(i, s), A("invalid", i);
						}
						for (var c in Je(n, s), o = null, s) if (s.hasOwnProperty(c)) {
							var l = s[c];
							c === "children" ? typeof l == "string" ? i.textContent !== l && (!0 !== s.suppressHydrationWarning && Oi(i.textContent, l, e), o = ["children", l]) : typeof l == "number" && i.textContent !== "" + l && (!0 !== s.suppressHydrationWarning && Oi(i.textContent, l, e), o = ["children", "" + l]) : a.hasOwnProperty(c) && l != null && c === "onScroll" && A("scroll", i);
						}
						switch (n) {
							case "input":
								we(i), je(i, s, !0);
								break;
							case "textarea":
								we(i), Re(i);
								break;
							case "select":
							case "option": break;
							default: typeof s.onClick == "function" && (i.onclick = ki);
						}
						i = o, t.updateQueue = i, i !== null && (t.flags |= 4);
					} else {
						c = o.nodeType === 9 ? o : o.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = ze(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = c.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof i.is == "string" ? e = c.createElement(n, { is: i.is }) : (e = c.createElement(n), n === "select" && (c = e, i.multiple ? c.multiple = !0 : i.size && (c.size = i.size))) : e = c.createElementNS(e, n), e[Hi] = t, e[Ui] = i, dc(e, t, !1, !1), t.stateNode = e;
						a: {
							switch (c = Ye(n, i), n) {
								case "dialog":
									A("cancel", e), A("close", e), o = i;
									break;
								case "iframe":
								case "object":
								case "embed":
									A("load", e), o = i;
									break;
								case "video":
								case "audio":
									for (o = 0; o < hi.length; o++) A(hi[o], e);
									o = i;
									break;
								case "source":
									A("error", e), o = i;
									break;
								case "img":
								case "image":
								case "link":
									A("error", e), A("load", e), o = i;
									break;
								case "details":
									A("toggle", e), o = i;
									break;
								case "input":
									Oe(e, i), o = De(e, i), A("invalid", e);
									break;
								case "option":
									o = i;
									break;
								case "select":
									e._wrapperState = { wasMultiple: !!i.multiple }, o = T({}, i, { value: void 0 }), A("invalid", e);
									break;
								case "textarea":
									Ie(e, i), o = Fe(e, i), A("invalid", e);
									break;
								default: o = i;
							}
							for (s in Je(n, o), l = o, l) if (l.hasOwnProperty(s)) {
								var u = l[s];
								s === "style" ? Ke(e, u) : s === "dangerouslySetInnerHTML" ? (u = u ? u.__html : void 0, u != null && E(e, u)) : s === "children" ? typeof u == "string" ? (n !== "textarea" || u !== "") && He(e, u) : typeof u == "number" && He(e, "" + u) : s !== "suppressContentEditableWarning" && s !== "suppressHydrationWarning" && s !== "autoFocus" && (a.hasOwnProperty(s) ? u != null && s === "onScroll" && A("scroll", e) : u != null && ee(e, s, u, c));
							}
							switch (n) {
								case "input":
									we(e), je(e, i, !1);
									break;
								case "textarea":
									we(e), Re(e);
									break;
								case "option":
									i.value != null && e.setAttribute("value", "" + xe(i.value));
									break;
								case "select":
									e.multiple = !!i.multiple, s = i.value, s == null ? i.defaultValue != null && Pe(e, !!i.multiple, i.defaultValue, !0) : Pe(e, !!i.multiple, s, !1);
									break;
								default: typeof o.onClick == "function" && (e.onclick = ki);
							}
							switch (n) {
								case "button":
								case "input":
								case "select":
								case "textarea":
									i = !!i.autoFocus;
									break a;
								case "img":
									i = !0;
									break a;
								default: i = !1;
							}
						}
						i && (t.flags |= 4);
					}
					t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
				}
				return U(t), null;
			case 6:
				if (e && t.stateNode != null) pc(e, t, e.memoizedProps, i);
				else {
					if (typeof i != "string" && t.stateNode === null) throw Error(r(166));
					if (n = So(xo.current), So(yo.current), Ra(t)) {
						if (i = t.stateNode, n = t.memoizedProps, i[Hi] = t, (s = i.nodeValue !== n) && (e = Aa, e !== null)) switch (e.tag) {
							case 3:
								Oi(i.nodeValue, n, !!(e.mode & 1));
								break;
							case 5: !0 !== e.memoizedProps.suppressHydrationWarning && Oi(i.nodeValue, n, !!(e.mode & 1));
						}
						s && (t.flags |= 4);
					} else i = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(i), i[Hi] = t, t.stateNode = i;
				}
				return U(t), null;
			case 13:
				if (P(R), i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (L && ja !== null && t.mode & 1 && !(t.flags & 128)) za(), Ba(), t.flags |= 98560, s = !1;
					else if (s = Ra(t), i !== null && i.dehydrated !== null) {
						if (e === null) {
							if (!s) throw Error(r(318));
							if (s = t.memoizedState, s = s === null ? null : s.dehydrated, !s) throw Error(r(317));
							s[Hi] = t;
						} else Ba(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						U(t), s = !1;
					} else Ma !== null && (yl(Ma), Ma = null), s = !0;
					if (!s) return t.flags & 65536 ? t : null;
				}
				return t.flags & 128 ? (t.lanes = n, t) : (i = i !== null, i !== (e !== null && e.memoizedState !== null) && i && (t.child.flags |= 8192, t.mode & 1 && (e === null || R.current & 1 ? Z === 0 && (Z = 3) : kl())), t.updateQueue !== null && (t.flags |= 4), U(t), null);
			case 4: return wo(), e === null && N(t.stateNode.containerInfo), U(t), null;
			case 10: return eo(t.type._context), U(t), null;
			case 17: return aa(t.type) && oa(), U(t), null;
			case 19:
				if (P(R), s = t.memoizedState, s === null) return U(t), null;
				if (i = !!(t.flags & 128), c = s.rendering, c === null) {
					if (i) mc(s, !1);
					else {
						if (Z !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (c = Do(e), c !== null) {
								for (t.flags |= 128, mc(s, !1), i = c.updateQueue, i !== null && (t.updateQueue = i, t.flags |= 4), t.subtreeFlags = 0, i = n, n = t.child; n !== null;) s = n, e = i, s.flags &= 14680066, c = s.alternate, c === null ? (s.childLanes = 0, s.lanes = e, s.child = null, s.subtreeFlags = 0, s.memoizedProps = null, s.memoizedState = null, s.updateQueue = null, s.dependencies = null, s.stateNode = null) : (s.childLanes = c.childLanes, s.lanes = c.lanes, s.child = c.child, s.subtreeFlags = 0, s.deletions = null, s.memoizedProps = c.memoizedProps, s.memoizedState = c.memoizedState, s.updateQueue = c.updateQueue, s.type = c.type, e = c.dependencies, s.dependencies = e === null ? null : {
									lanes: e.lanes,
									firstContext: e.firstContext
								}), n = n.sibling;
								return F(R, R.current & 1 | 2), t.child;
							}
							e = e.sibling;
						}
						s.tail !== null && D() > nl && (t.flags |= 128, i = !0, mc(s, !1), t.lanes = 4194304);
					}
				} else {
					if (!i) {
						if (e = Do(c), e !== null) {
							if (t.flags |= 128, i = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), mc(s, !0), s.tail === null && s.tailMode === "hidden" && !c.alternate && !L) return U(t), null;
						} else 2 * D() - s.renderingStartTime > nl && n !== 1073741824 && (t.flags |= 128, i = !0, mc(s, !1), t.lanes = 4194304);
					}
					s.isBackwards ? (c.sibling = t.child, t.child = c) : (n = s.last, n === null ? t.child = c : n.sibling = c, s.last = c);
				}
				return s.tail === null ? (U(t), null) : (t = s.tail, s.rendering = t, s.tail = t.sibling, s.renderingStartTime = D(), t.sibling = null, n = R.current, F(R, i ? n & 1 | 2 : n & 1), t);
			case 22:
			case 23: return Tl(), i = t.memoizedState !== null, e !== null && e.memoizedState !== null !== i && (t.flags |= 8192), i && t.mode & 1 ? qc & 1073741824 && (U(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : U(t), null;
			case 24: return null;
			case 25: return null;
		}
		throw Error(r(156, t.tag));
	}
	function gc(e, t) {
		switch (ka(t), t.tag) {
			case 1: return aa(t.type) && oa(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return wo(), P(na), P(I), ko(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 5: return Eo(t), null;
			case 13:
				if (P(R), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(r(340));
					Ba();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return P(R), null;
			case 4: return wo(), null;
			case 10: return eo(t.type._context), null;
			case 22:
			case 23: return Tl(), null;
			case 24: return null;
			default: return null;
		}
	}
	var _c = !1, W = !1, vc = typeof WeakSet == "function" ? WeakSet : Set, G = null;
	function yc(e, t) {
		var n = e.ref;
		if (n !== null) {
			if (typeof n == "function") try {
				n(null);
			} catch (n) {
				$(e, t, n);
			}
			else n.current = null;
		}
	}
	function bc(e, t, n) {
		try {
			n();
		} catch (n) {
			$(e, t, n);
		}
	}
	var xc = !1;
	function Sc(e, t) {
		if (Ai = En, e = Kr(), qr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var i = n.getSelection && n.getSelection();
				if (i && i.rangeCount !== 0) {
					n = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (ji = {
			focusedElem: e,
			selectionRange: n
		}, En = !1, G = t; G !== null;) if (t = G, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, G = e;
		else for (; G !== null;) {
			t = G;
			try {
				var h = t.alternate;
				if (t.flags & 1024) switch (t.tag) {
					case 0:
					case 11:
					case 15: break;
					case 1:
						if (h !== null) {
							var g = h.memoizedProps, _ = h.memoizedState, v = t.stateNode;
							v.__reactInternalSnapshotBeforeUpdate = v.getSnapshotBeforeUpdate(t.elementType === t.type ? g : ws(t.type, g), _);
						}
						break;
					case 3:
						var y = t.stateNode.containerInfo;
						y.nodeType === 1 ? y.textContent = "" : y.nodeType === 9 && y.documentElement && y.removeChild(y.documentElement);
						break;
					case 5:
					case 6:
					case 4:
					case 17: break;
					default: throw Error(r(163));
				}
			} catch (e) {
				$(t, t.return, e);
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, G = e;
				break;
			}
			G = t.return;
		}
		return h = xc, xc = !1, h;
	}
	function Cc(e, t, n) {
		var r = t.updateQueue;
		if (r = r === null ? null : r.lastEffect, r !== null) {
			var i = r = r.next;
			do {
				if ((i.tag & e) === e) {
					var a = i.destroy;
					i.destroy = void 0, a !== void 0 && bc(t, n, a);
				}
				i = i.next;
			} while (i !== r);
		}
	}
	function wc(e, t) {
		if (t = t.updateQueue, t = t === null ? null : t.lastEffect, t !== null) {
			var n = t = t.next;
			do {
				if ((n.tag & e) === e) {
					var r = n.create;
					n.destroy = r();
				}
				n = n.next;
			} while (n !== t);
		}
	}
	function Tc(e) {
		var t = e.ref;
		if (t !== null) {
			var n = e.stateNode;
			switch (e.tag) {
				case 5:
					e = n;
					break;
				default: e = n;
			}
			typeof t == "function" ? t(e) : t.current = e;
		}
	}
	function Ec(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, Ec(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Hi], delete t[Ui], delete t[Gi], delete t[Ki], delete t[qi])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	function Dc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 4;
	}
	function Oc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Dc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function kc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = ki));
		else if (r !== 4 && (e = e.child, e !== null)) for (kc(e, t, n), e = e.sibling; e !== null;) kc(e, t, n), e = e.sibling;
	}
	function Ac(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (e = e.child, e !== null)) for (Ac(e, t, n), e = e.sibling; e !== null;) Ac(e, t, n), e = e.sibling;
	}
	var K = null, jc = !1;
	function Mc(e, t, n) {
		for (n = n.child; n !== null;) Nc(e, t, n), n = n.sibling;
	}
	function Nc(e, t, n) {
		if (It && typeof It.onCommitFiberUnmount == "function") try {
			It.onCommitFiberUnmount(Ft, n);
		} catch {}
		switch (n.tag) {
			case 5: W || yc(n, t);
			case 6:
				var r = K, i = jc;
				K = null, Mc(e, t, n), K = r, jc = i, K !== null && (jc ? (e = K, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : K.removeChild(n.stateNode));
				break;
			case 18:
				K !== null && (jc ? (e = K, n = n.stateNode, e.nodeType === 8 ? Ri(e.parentNode, n) : e.nodeType === 1 && Ri(e, n), wn(e)) : Ri(K, n.stateNode));
				break;
			case 4:
				r = K, i = jc, K = n.stateNode.containerInfo, jc = !0, Mc(e, t, n), K = r, jc = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				if (!W && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
					i = r = r.next;
					do {
						var a = i, o = a.destroy;
						a = a.tag, o !== void 0 && (a & 2 || a & 4) && bc(n, t, o), i = i.next;
					} while (i !== r);
				}
				Mc(e, t, n);
				break;
			case 1:
				if (!W && (yc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
					r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
				} catch (e) {
					$(n, t, e);
				}
				Mc(e, t, n);
				break;
			case 21:
				Mc(e, t, n);
				break;
			case 22:
				n.mode & 1 ? (W = (r = W) || n.memoizedState !== null, Mc(e, t, n), W = r) : Mc(e, t, n);
				break;
			default: Mc(e, t, n);
		}
	}
	function Pc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			e.updateQueue = null;
			var n = e.stateNode;
			n === null && (n = e.stateNode = new vc()), t.forEach(function(t) {
				var r = Hl.bind(null, e, t);
				n.has(t) || (n.add(t), t.then(r, r));
			});
		}
	}
	function Fc(e, t) {
		var n = t.deletions;
		if (n !== null) for (var i = 0; i < n.length; i++) {
			var a = n[i];
			try {
				var o = e, s = t, c = s;
				a: for (; c !== null;) {
					switch (c.tag) {
						case 5:
							K = c.stateNode, jc = !1;
							break a;
						case 3:
							K = c.stateNode.containerInfo, jc = !0;
							break a;
						case 4:
							K = c.stateNode.containerInfo, jc = !0;
							break a;
					}
					c = c.return;
				}
				if (K === null) throw Error(r(160));
				Nc(o, s, a), K = null, jc = !1;
				var l = a.alternate;
				l !== null && (l.return = null), a.return = null;
			} catch (e) {
				$(a, t, e);
			}
		}
		if (t.subtreeFlags & 12854) for (t = t.child; t !== null;) Ic(t, e), t = t.sibling;
	}
	function Ic(e, t) {
		var n = e.alternate, i = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (Fc(t, e), Lc(e), i & 4) {
					try {
						Cc(3, e, e.return), wc(3, e);
					} catch (t) {
						$(e, e.return, t);
					}
					try {
						Cc(5, e, e.return);
					} catch (t) {
						$(e, e.return, t);
					}
				}
				break;
			case 1:
				Fc(t, e), Lc(e), i & 512 && n !== null && yc(n, n.return);
				break;
			case 5:
				if (Fc(t, e), Lc(e), i & 512 && n !== null && yc(n, n.return), e.flags & 32) {
					var a = e.stateNode;
					try {
						He(a, "");
					} catch (t) {
						$(e, e.return, t);
					}
				}
				if (i & 4 && (a = e.stateNode, a != null)) {
					var o = e.memoizedProps, s = n === null ? o : n.memoizedProps, c = e.type, l = e.updateQueue;
					if (e.updateQueue = null, l !== null) try {
						c === "input" && o.type === "radio" && o.name != null && ke(a, o), Ye(c, s);
						var u = Ye(c, o);
						for (s = 0; s < l.length; s += 2) {
							var d = l[s], f = l[s + 1];
							d === "style" ? Ke(a, f) : d === "dangerouslySetInnerHTML" ? E(a, f) : d === "children" ? He(a, f) : ee(a, d, f, u);
						}
						switch (c) {
							case "input":
								Ae(a, o);
								break;
							case "textarea":
								Le(a, o);
								break;
							case "select":
								var p = a._wrapperState.wasMultiple;
								a._wrapperState.wasMultiple = !!o.multiple;
								var m = o.value;
								m == null ? p !== !!o.multiple && (o.defaultValue == null ? Pe(a, !!o.multiple, o.multiple ? [] : "", !1) : Pe(a, !!o.multiple, o.defaultValue, !0)) : Pe(a, !!o.multiple, m, !1);
						}
						a[Ui] = o;
					} catch (t) {
						$(e, e.return, t);
					}
				}
				break;
			case 6:
				if (Fc(t, e), Lc(e), i & 4) {
					if (e.stateNode === null) throw Error(r(162));
					a = e.stateNode, o = e.memoizedProps;
					try {
						a.nodeValue = o;
					} catch (t) {
						$(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Fc(t, e), Lc(e), i & 4 && n !== null && n.memoizedState.isDehydrated) try {
					wn(t.containerInfo);
				} catch (t) {
					$(e, e.return, t);
				}
				break;
			case 4:
				Fc(t, e), Lc(e);
				break;
			case 13:
				Fc(t, e), Lc(e), a = e.child, a.flags & 8192 && (o = a.memoizedState !== null, a.stateNode.isHidden = o, !o || a.alternate !== null && a.alternate.memoizedState !== null || (tl = D())), i & 4 && Pc(e);
				break;
			case 22:
				if (d = n !== null && n.memoizedState !== null, e.mode & 1 ? (W = (u = W) || d, Fc(t, e), W = u) : Fc(t, e), Lc(e), i & 8192) {
					if (u = e.memoizedState !== null, (e.stateNode.isHidden = u) && !d && e.mode & 1) for (G = e, d = e.child; d !== null;) {
						for (f = G = d; G !== null;) {
							switch (p = G, m = p.child, p.tag) {
								case 0:
								case 11:
								case 14:
								case 15:
									Cc(4, p, p.return);
									break;
								case 1:
									yc(p, p.return);
									var h = p.stateNode;
									if (typeof h.componentWillUnmount == "function") {
										i = p, n = p.return;
										try {
											t = i, h.props = t.memoizedProps, h.state = t.memoizedState, h.componentWillUnmount();
										} catch (e) {
											$(i, n, e);
										}
									}
									break;
								case 5:
									yc(p, p.return);
									break;
								case 22: if (p.memoizedState !== null) {
									Vc(f);
									continue;
								}
							}
							m === null ? Vc(f) : (m.return = p, G = m);
						}
						d = d.sibling;
					}
					a: for (d = null, f = e;;) {
						if (f.tag === 5) {
							if (d === null) {
								d = f;
								try {
									a = f.stateNode, u ? (o = a.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (c = f.stateNode, l = f.memoizedProps.style, s = l != null && l.hasOwnProperty("display") ? l.display : null, c.style.display = Ge("display", s));
								} catch (t) {
									$(e, e.return, t);
								}
							}
						} else if (f.tag === 6) {
							if (d === null) try {
								f.stateNode.nodeValue = u ? "" : f.memoizedProps;
							} catch (t) {
								$(e, e.return, t);
							}
						} else if ((f.tag !== 22 && f.tag !== 23 || f.memoizedState === null || f === e) && f.child !== null) {
							f.child.return = f, f = f.child;
							continue;
						}
						if (f === e) break a;
						for (; f.sibling === null;) {
							if (f.return === null || f.return === e) break a;
							d === f && (d = null), f = f.return;
						}
						d === f && (d = null), f.sibling.return = f.return, f = f.sibling;
					}
				}
				break;
			case 19:
				Fc(t, e), Lc(e), i & 4 && Pc(e);
				break;
			case 21: break;
			default: Fc(t, e), Lc(e);
		}
	}
	function Lc(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				a: {
					for (var n = e.return; n !== null;) {
						if (Dc(n)) {
							var i = n;
							break a;
						}
						n = n.return;
					}
					throw Error(r(160));
				}
				switch (i.tag) {
					case 5:
						var a = i.stateNode;
						i.flags & 32 && (He(a, ""), i.flags &= -33), Ac(e, Oc(e), a);
						break;
					case 3:
					case 4:
						var o = i.stateNode.containerInfo;
						kc(e, Oc(e), o);
						break;
					default: throw Error(r(161));
				}
			} catch (t) {
				$(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Rc(e, t, n) {
		G = e, zc(e, t, n);
	}
	function zc(e, t, n) {
		for (var r = !!(e.mode & 1); G !== null;) {
			var i = G, a = i.child;
			if (i.tag === 22 && r) {
				var o = i.memoizedState !== null || _c;
				if (!o) {
					var s = i.alternate, c = s !== null && s.memoizedState !== null || W;
					s = _c;
					var l = W;
					if (_c = o, (W = c) && !l) for (G = i; G !== null;) o = G, c = o.child, o.tag === 22 && o.memoizedState !== null || c === null ? Hc(i) : (c.return = o, G = c);
					for (; a !== null;) G = a, zc(a, t, n), a = a.sibling;
					G = i, _c = s, W = l;
				}
				Bc(e, t, n);
			} else i.subtreeFlags & 8772 && a !== null ? (a.return = i, G = a) : Bc(e, t, n);
		}
	}
	function Bc(e) {
		for (; G !== null;) {
			var t = G;
			if (t.flags & 8772) {
				var n = t.alternate;
				try {
					if (t.flags & 8772) switch (t.tag) {
						case 0:
						case 11:
						case 15:
							W || wc(5, t);
							break;
						case 1:
							var i = t.stateNode;
							if (t.flags & 4 && !W) {
								if (n === null) i.componentDidMount();
								else {
									var a = t.elementType === t.type ? n.memoizedProps : ws(t.type, n.memoizedProps);
									i.componentDidUpdate(a, n.memoizedState, i.__reactInternalSnapshotBeforeUpdate);
								}
							}
							var o = t.updateQueue;
							o !== null && _o(t, o, i);
							break;
						case 3:
							var s = t.updateQueue;
							if (s !== null) {
								if (n = null, t.child !== null) switch (t.child.tag) {
									case 5:
										n = t.child.stateNode;
										break;
									case 1: n = t.child.stateNode;
								}
								_o(t, s, n);
							}
							break;
						case 5:
							var c = t.stateNode;
							if (n === null && t.flags & 4) {
								n = c;
								var l = t.memoizedProps;
								switch (t.type) {
									case "button":
									case "input":
									case "select":
									case "textarea":
										l.autoFocus && n.focus();
										break;
									case "img": l.src && (n.src = l.src);
								}
							}
							break;
						case 6: break;
						case 4: break;
						case 12: break;
						case 13:
							if (t.memoizedState === null) {
								var u = t.alternate;
								if (u !== null) {
									var d = u.memoizedState;
									if (d !== null) {
										var f = d.dehydrated;
										f !== null && wn(f);
									}
								}
							}
							break;
						case 19:
						case 17:
						case 21:
						case 22:
						case 23:
						case 25: break;
						default: throw Error(r(163));
					}
					W || t.flags & 512 && Tc(t);
				} catch (e) {
					$(t, t.return, e);
				}
			}
			if (t === e) {
				G = null;
				break;
			}
			if (n = t.sibling, n !== null) {
				n.return = t.return, G = n;
				break;
			}
			G = t.return;
		}
	}
	function Vc(e) {
		for (; G !== null;) {
			var t = G;
			if (t === e) {
				G = null;
				break;
			}
			var n = t.sibling;
			if (n !== null) {
				n.return = t.return, G = n;
				break;
			}
			G = t.return;
		}
	}
	function Hc(e) {
		for (; G !== null;) {
			var t = G;
			try {
				switch (t.tag) {
					case 0:
					case 11:
					case 15:
						var n = t.return;
						try {
							wc(4, t);
						} catch (e) {
							$(t, n, e);
						}
						break;
					case 1:
						var r = t.stateNode;
						if (typeof r.componentDidMount == "function") {
							var i = t.return;
							try {
								r.componentDidMount();
							} catch (e) {
								$(t, i, e);
							}
						}
						var a = t.return;
						try {
							Tc(t);
						} catch (e) {
							$(t, a, e);
						}
						break;
					case 5:
						var o = t.return;
						try {
							Tc(t);
						} catch (e) {
							$(t, o, e);
						}
				}
			} catch (e) {
				$(t, t.return, e);
			}
			if (t === e) {
				G = null;
				break;
			}
			var s = t.sibling;
			if (s !== null) {
				s.return = t.return, G = s;
				break;
			}
			G = t.return;
		}
	}
	var Uc = Math.ceil, Wc = S.ReactCurrentDispatcher, Gc = S.ReactCurrentOwner, Kc = S.ReactCurrentBatchConfig, q = 0, J = null, Y = null, X = 0, qc = 0, Jc = ea(0), Z = 0, Yc = null, Xc = 0, Zc = 0, Qc = 0, $c = null, el = null, tl = 0, nl = Infinity, rl = null, il = !1, al = null, ol = null, sl = !1, cl = null, ll = 0, ul = 0, dl = null, fl = -1, pl = 0;
	function Q() {
		return q & 6 ? D() : fl === -1 ? fl = D() : fl;
	}
	function ml(e) {
		return e.mode & 1 ? q & 2 && X !== 0 ? X & -X : Ha.transition === null ? (e = O, e === 0 && (e = window.event, e = e === void 0 ? 16 : Mn(e.type)), e) : (pl === 0 && (pl = Yt()), pl) : 1;
	}
	function hl(e, t, n, i) {
		if (50 < ul) throw ul = 0, dl = null, Error(r(185));
		Zt(e, n, i), q & 2 && e === J || (e === J && (!(q & 2) && (Zc |= n), Z === 4 && xl(e, X)), gl(e, i), n === 1 && q === 0 && !(t.mode & 1) && (nl = D() + 500, fa && ga()));
	}
	function gl(e, t) {
		var n = e.callbackNode;
		qt(e, t);
		var r = Gt(e, e === J ? X : 0);
		if (r === 0) n !== null && Et(n), e.callbackNode = null, e.callbackPriority = 0;
		else if (t = r & -r, e.callbackPriority !== t) {
			if (n != null && Et(n), t === 1) e.tag === 0 ? ha(Sl.bind(null, e)) : ma(Sl.bind(null, e)), Ii(function() {
				!(q & 6) && ga();
			}), n = null;
			else {
				switch (en(r)) {
					case 1:
						n = At;
						break;
					case 4:
						n = jt;
						break;
					case 16:
						n = Mt;
						break;
					case 536870912:
						n = Pt;
						break;
					default: n = Mt;
				}
				n = Wl(n, _l.bind(null, e));
			}
			e.callbackPriority = t, e.callbackNode = n;
		}
	}
	function _l(e, t) {
		if (fl = -1, pl = 0, q & 6) throw Error(r(327));
		var n = e.callbackNode;
		if (Ll() && e.callbackNode !== n) return null;
		var i = Gt(e, e === J ? X : 0);
		if (i === 0) return null;
		if (i & 30 || (i & e.expiredLanes) !== 0 || t) t = Al(e, i);
		else {
			t = i;
			var a = q;
			q |= 2;
			var o = Ol();
			(J !== e || X !== t) && (rl = null, nl = D() + 500, El(e, t));
			do
				try {
					Ml();
					break;
				} catch (t) {
					Dl(e, t);
				}
			while (1);
			$a(), Wc.current = o, q = a, Y === null ? (J = null, X = 0, t = Z) : t = 0;
		}
		if (t !== 0) {
			if (t === 2 && (a = Jt(e), a !== 0 && (i = a, t = vl(e, a))), t === 1) throw n = Yc, El(e, 0), xl(e, i), gl(e, D()), n;
			if (t === 6) xl(e, i);
			else {
				if (a = e.current.alternate, !(i & 30) && !bl(a) && (t = Al(e, i), t === 2 && (o = Jt(e), o !== 0 && (i = o, t = vl(e, o))), t === 1)) throw n = Yc, El(e, 0), xl(e, i), gl(e, D()), n;
				switch (e.finishedWork = a, e.finishedLanes = i, t) {
					case 0:
					case 1: throw Error(r(345));
					case 2:
						Fl(e, el, rl);
						break;
					case 3:
						if (xl(e, i), (i & 130023424) === i && (t = tl + 500 - D(), 10 < t)) {
							if (Gt(e, 0) !== 0) break;
							if (a = e.suspendedLanes, (a & i) !== i) {
								Q(), e.pingedLanes |= e.suspendedLanes & a;
								break;
							}
							e.timeoutHandle = Ni(Fl.bind(null, e, el, rl), t);
							break;
						}
						Fl(e, el, rl);
						break;
					case 4:
						if (xl(e, i), (i & 4194240) === i) break;
						for (t = e.eventTimes, a = -1; 0 < i;) {
							var s = 31 - Rt(i);
							o = 1 << s, s = t[s], s > a && (a = s), i &= ~o;
						}
						if (i = a, i = D() - i, i = (120 > i ? 120 : 480 > i ? 480 : 1080 > i ? 1080 : 1920 > i ? 1920 : 3e3 > i ? 3e3 : 4320 > i ? 4320 : 1960 * Uc(i / 1960)) - i, 10 < i) {
							e.timeoutHandle = Ni(Fl.bind(null, e, el, rl), i);
							break;
						}
						Fl(e, el, rl);
						break;
					case 5:
						Fl(e, el, rl);
						break;
					default: throw Error(r(329));
				}
			}
		}
		return gl(e, D()), e.callbackNode === n ? _l.bind(null, e) : null;
	}
	function vl(e, t) {
		var n = $c;
		return e.current.memoizedState.isDehydrated && (El(e, t).flags |= 256), e = Al(e, t), e !== 2 && (t = el, el = n, t !== null && yl(t)), e;
	}
	function yl(e) {
		el === null ? el = e : el.push.apply(el, e);
	}
	function bl(e) {
		for (var t = e;;) {
			if (t.flags & 16384) {
				var n = t.updateQueue;
				if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
					var i = n[r], a = i.getSnapshot;
					i = i.value;
					try {
						if (!Vr(a(), i)) return !1;
					} catch {
						return !1;
					}
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function xl(e, t) {
		for (t &= ~Qc, t &= ~Zc, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t;) {
			var n = 31 - Rt(t), r = 1 << n;
			e[n] = -1, t &= ~r;
		}
	}
	function Sl(e) {
		if (q & 6) throw Error(r(327));
		Ll();
		var t = Gt(e, 0);
		if (!(t & 1)) return gl(e, D()), null;
		var n = Al(e, t);
		if (e.tag !== 0 && n === 2) {
			var i = Jt(e);
			i !== 0 && (t = i, n = vl(e, i));
		}
		if (n === 1) throw n = Yc, El(e, 0), xl(e, t), gl(e, D()), n;
		if (n === 6) throw Error(r(345));
		return e.finishedWork = e.current.alternate, e.finishedLanes = t, Fl(e, el, rl), gl(e, D()), null;
	}
	function Cl(e, t) {
		var n = q;
		q |= 1;
		try {
			return e(t);
		} finally {
			q = n, q === 0 && (nl = D() + 500, fa && ga());
		}
	}
	function wl(e) {
		cl !== null && cl.tag === 0 && !(q & 6) && Ll();
		var t = q;
		q |= 1;
		var n = Kc.transition, r = O;
		try {
			if (Kc.transition = null, O = 1, e) return e();
		} finally {
			O = r, Kc.transition = n, q = t, !(q & 6) && ga();
		}
	}
	function Tl() {
		qc = Jc.current, P(Jc);
	}
	function El(e, t) {
		e.finishedWork = null, e.finishedLanes = 0;
		var n = e.timeoutHandle;
		if (n !== -1 && (e.timeoutHandle = -1, Pi(n)), Y !== null) for (n = Y.return; n !== null;) {
			var r = n;
			switch (ka(r), r.tag) {
				case 1:
					r = r.type.childContextTypes, r != null && oa();
					break;
				case 3:
					wo(), P(na), P(I), ko();
					break;
				case 5:
					Eo(r);
					break;
				case 4:
					wo();
					break;
				case 13:
					P(R);
					break;
				case 19:
					P(R);
					break;
				case 10:
					eo(r.type._context);
					break;
				case 22:
				case 23: Tl();
			}
			n = n.return;
		}
		if (J = e, Y = e = Yl(e.current, null), X = qc = t, Z = 0, Yc = null, Qc = Zc = Xc = 0, el = $c = null, io !== null) {
			for (t = 0; t < io.length; t++) if (n = io[t], r = n.interleaved, r !== null) {
				n.interleaved = null;
				var i = r.next, a = n.pending;
				if (a !== null) {
					var o = a.next;
					a.next = i, r.next = o;
				}
				n.pending = r;
			}
			io = null;
		}
		return e;
	}
	function Dl(e, t) {
		do {
			var n = Y;
			try {
				if ($a(), Ao.current = bs, No) {
					for (var i = z.memoizedState; i !== null;) {
						var a = i.queue;
						a !== null && (a.pending = null), i = i.next;
					}
					No = !1;
				}
				if (Mo = 0, V = B = z = null, Po = !1, Fo = 0, Gc.current = null, n === null || n.return === null) {
					Z = 1, Yc = t, Y = null;
					break;
				}
				a: {
					var o = e, s = n.return, c = n, l = t;
					if (t = X, c.flags |= 32768, typeof l == "object" && l && typeof l.then == "function") {
						var u = l, d = c, f = d.tag;
						if (!(d.mode & 1) && (f === 0 || f === 11 || f === 15)) {
							var p = d.alternate;
							p ? (d.updateQueue = p.updateQueue, d.memoizedState = p.memoizedState, d.lanes = p.lanes) : (d.updateQueue = null, d.memoizedState = null);
						}
						var m = Rs(s);
						if (m !== null) {
							m.flags &= -257, zs(m, s, c, o, t), m.mode & 1 && Ls(o, u, t), t = m, l = u;
							var h = t.updateQueue;
							if (h === null) {
								var g = /* @__PURE__ */ new Set();
								g.add(l), t.updateQueue = g;
							} else h.add(l);
							break a;
						}
						if (!(t & 1)) {
							Ls(o, u, t), kl();
							break a;
						}
						l = Error(r(426));
					} else if (L && c.mode & 1) {
						var _ = Rs(s);
						if (_ !== null) {
							!(_.flags & 65536) && (_.flags |= 256), zs(_, s, c, o, t), Va(js(l, c));
							break a;
						}
					}
					o = l = js(l, c), Z !== 4 && (Z = 2), $c === null ? $c = [o] : $c.push(o), o = s;
					do {
						switch (o.tag) {
							case 3:
								o.flags |= 65536, t &= -t, o.lanes |= t;
								var v = Fs(o, l, t);
								ho(o, v);
								break a;
							case 1:
								c = l;
								var y = o.type, b = o.stateNode;
								if (!(o.flags & 128) && (typeof y.getDerivedStateFromError == "function" || b !== null && typeof b.componentDidCatch == "function" && (ol === null || !ol.has(b)))) {
									o.flags |= 65536, t &= -t, o.lanes |= t;
									var x = Is(o, c, t);
									ho(o, x);
									break a;
								}
						}
						o = o.return;
					} while (o !== null);
				}
				Pl(n);
			} catch (e) {
				t = e, Y === n && n !== null && (Y = n = n.return);
				continue;
			}
			break;
		} while (1);
	}
	function Ol() {
		var e = Wc.current;
		return Wc.current = bs, e === null ? bs : e;
	}
	function kl() {
		(Z === 0 || Z === 3 || Z === 2) && (Z = 4), J === null || !(Xc & 268435455) && !(Zc & 268435455) || xl(J, X);
	}
	function Al(e, t) {
		var n = q;
		q |= 2;
		var i = Ol();
		(J !== e || X !== t) && (rl = null, El(e, t));
		do
			try {
				jl();
				break;
			} catch (t) {
				Dl(e, t);
			}
		while (1);
		if ($a(), q = n, Wc.current = i, Y !== null) throw Error(r(261));
		return J = null, X = 0, Z;
	}
	function jl() {
		for (; Y !== null;) Nl(Y);
	}
	function Ml() {
		for (; Y !== null && !Dt();) Nl(Y);
	}
	function Nl(e) {
		var t = Ul(e.alternate, e, qc);
		e.memoizedProps = e.pendingProps, t === null ? Pl(e) : Y = t, Gc.current = null;
	}
	function Pl(e) {
		var t = e;
		do {
			var n = t.alternate;
			if (e = t.return, t.flags & 32768) {
				if (n = gc(n, t), n !== null) {
					n.flags &= 32767, Y = n;
					return;
				}
				if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
				else {
					Z = 6, Y = null;
					return;
				}
			} else if (n = hc(n, t, qc), n !== null) {
				Y = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				Y = t;
				return;
			}
			Y = t = e;
		} while (t !== null);
		Z === 0 && (Z = 5);
	}
	function Fl(e, t, n) {
		var r = O, i = Kc.transition;
		try {
			Kc.transition = null, O = 1, Il(e, t, n, r);
		} finally {
			Kc.transition = i, O = r;
		}
		return null;
	}
	function Il(e, t, n, i) {
		do
			Ll();
		while (cl !== null);
		if (q & 6) throw Error(r(327));
		n = e.finishedWork;
		var a = e.finishedLanes;
		if (n === null) return null;
		if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(r(177));
		e.callbackNode = null, e.callbackPriority = 0;
		var o = n.lanes | n.childLanes;
		if (Qt(e, o), e === J && (Y = J = null, X = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || sl || (sl = !0, Wl(Mt, function() {
			return Ll(), null;
		})), o = !!(n.flags & 15990), n.subtreeFlags & 15990 || o) {
			o = Kc.transition, Kc.transition = null;
			var s = O;
			O = 1;
			var c = q;
			q |= 4, Gc.current = null, Sc(e, n), Ic(n, e), Jr(ji), En = !!Ai, ji = Ai = null, e.current = n, Rc(n, e, a), Ot(), q = c, O = s, Kc.transition = o;
		} else e.current = n;
		if (sl && (sl = !1, cl = e, ll = a), o = e.pendingLanes, o === 0 && (ol = null), Lt(n.stateNode, i), gl(e, D()), t !== null) for (i = e.onRecoverableError, n = 0; n < t.length; n++) a = t[n], i(a.value, {
			componentStack: a.stack,
			digest: a.digest
		});
		if (il) throw il = !1, e = al, al = null, e;
		return ll & 1 && e.tag !== 0 && Ll(), o = e.pendingLanes, o & 1 ? e === dl ? ul++ : (ul = 0, dl = e) : ul = 0, ga(), null;
	}
	function Ll() {
		if (cl !== null) {
			var e = en(ll), t = Kc.transition, n = O;
			try {
				if (Kc.transition = null, O = 16 > e ? 16 : e, cl === null) var i = !1;
				else {
					if (e = cl, cl = null, ll = 0, q & 6) throw Error(r(331));
					var a = q;
					for (q |= 4, G = e.current; G !== null;) {
						var o = G, s = o.child;
						if (G.flags & 16) {
							var c = o.deletions;
							if (c !== null) {
								for (var l = 0; l < c.length; l++) {
									var u = c[l];
									for (G = u; G !== null;) {
										var d = G;
										switch (d.tag) {
											case 0:
											case 11:
											case 15: Cc(8, d, o);
										}
										var f = d.child;
										if (f !== null) f.return = d, G = f;
										else for (; G !== null;) {
											d = G;
											var p = d.sibling, m = d.return;
											if (Ec(d), d === u) {
												G = null;
												break;
											}
											if (p !== null) {
												p.return = m, G = p;
												break;
											}
											G = m;
										}
									}
								}
								var h = o.alternate;
								if (h !== null) {
									var g = h.child;
									if (g !== null) {
										h.child = null;
										do {
											var _ = g.sibling;
											g.sibling = null, g = _;
										} while (g !== null);
									}
								}
								G = o;
							}
						}
						if (o.subtreeFlags & 2064 && s !== null) s.return = o, G = s;
						else b: for (; G !== null;) {
							if (o = G, o.flags & 2048) switch (o.tag) {
								case 0:
								case 11:
								case 15: Cc(9, o, o.return);
							}
							var v = o.sibling;
							if (v !== null) {
								v.return = o.return, G = v;
								break b;
							}
							G = o.return;
						}
					}
					var y = e.current;
					for (G = y; G !== null;) {
						s = G;
						var b = s.child;
						if (s.subtreeFlags & 2064 && b !== null) b.return = s, G = b;
						else b: for (s = y; G !== null;) {
							if (c = G, c.flags & 2048) try {
								switch (c.tag) {
									case 0:
									case 11:
									case 15: wc(9, c);
								}
							} catch (e) {
								$(c, c.return, e);
							}
							if (c === s) {
								G = null;
								break b;
							}
							var x = c.sibling;
							if (x !== null) {
								x.return = c.return, G = x;
								break b;
							}
							G = c.return;
						}
					}
					if (q = a, ga(), It && typeof It.onPostCommitFiberRoot == "function") try {
						It.onPostCommitFiberRoot(Ft, e);
					} catch {}
					i = !0;
				}
				return i;
			} finally {
				O = n, Kc.transition = t;
			}
		}
		return !1;
	}
	function Rl(e, t, n) {
		t = js(n, t), t = Fs(e, t, 1), e = po(e, t, 1), t = Q(), e !== null && (Zt(e, 1, t), gl(e, t));
	}
	function $(e, t, n) {
		if (e.tag === 3) Rl(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Rl(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (ol === null || !ol.has(r))) {
					e = js(n, e), e = Is(t, e, 1), t = po(t, e, 1), e = Q(), t !== null && (Zt(t, 1, e), gl(t, e));
					break;
				}
			}
			t = t.return;
		}
	}
	function zl(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), t = Q(), e.pingedLanes |= e.suspendedLanes & n, J === e && (X & n) === n && (Z === 4 || Z === 3 && (X & 130023424) === X && 500 > D() - tl ? El(e, 0) : Qc |= n), gl(e, t);
	}
	function Bl(e, t) {
		t === 0 && (e.mode & 1 ? (t = Ut, Ut <<= 1, !(Ut & 130023424) && (Ut = 4194304)) : t = 1);
		var n = Q();
		e = so(e, t), e !== null && (Zt(e, t, n), gl(e, n));
	}
	function Vl(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Bl(e, n);
	}
	function Hl(e, t) {
		var n = 0;
		switch (e.tag) {
			case 13:
				var i = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				i = e.stateNode;
				break;
			default: throw Error(r(314));
		}
		i !== null && i.delete(t), Bl(e, n);
	}
	var Ul = function(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps || na.current) Vs = !0;
			else {
				if ((e.lanes & n) === 0 && !(t.flags & 128)) return Vs = !1, uc(e, t, n);
				Vs = !!(e.flags & 131072);
			}
		} else Vs = !1, L && t.flags & 1048576 && Da(t, ba, t.index);
		switch (t.lanes = 0, t.tag) {
			case 2:
				var i = t.type;
				cc(e, t), e = t.pendingProps;
				var a = ia(t, I.current);
				no(t, n), a = Ro(null, t, i, e, a, n);
				var o = zo();
				return t.flags |= 1, typeof a == "object" && a && typeof a.render == "function" && a.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, aa(i) ? (o = !0, la(t)) : o = !1, t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, lo(t), a.updater = Es, t.stateNode = a, a._reactInternals = t, As(t, i, e, n), t = Xs(null, t, i, !0, o, n)) : (t.tag = 0, L && o && Oa(t), Hs(null, t, a, n), t = t.child), t;
			case 16:
				i = t.elementType;
				a: {
					switch (cc(e, t), e = t.pendingProps, a = i._init, i = a(i._payload), t.type = i, a = t.tag = Jl(i), e = ws(i, e), a) {
						case 0:
							t = Js(null, t, i, e, n);
							break a;
						case 1:
							t = Ys(null, t, i, e, n);
							break a;
						case 11:
							t = Us(null, t, i, e, n);
							break a;
						case 14:
							t = Ws(null, t, i, ws(i.type, e), n);
							break a;
					}
					throw Error(r(306, i, ""));
				}
				return t;
			case 0: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : ws(i, a), Js(e, t, i, a, n);
			case 1: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : ws(i, a), Ys(e, t, i, a, n);
			case 3:
				a: {
					if (Zs(t), e === null) throw Error(r(387));
					i = t.pendingProps, o = t.memoizedState, a = o.element, uo(e, t), go(t, i, null, n);
					var s = t.memoizedState;
					if (i = s.element, o.isDehydrated) {
						if (o = {
							element: i,
							isDehydrated: !1,
							cache: s.cache,
							pendingSuspenseBoundaries: s.pendingSuspenseBoundaries,
							transitions: s.transitions
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							a = js(Error(r(423)), t), t = Qs(e, t, i, n, a);
							break a;
						}
						if (i !== a) {
							a = js(Error(r(424)), t), t = Qs(e, t, i, n, a);
							break a;
						}
						for (ja = zi(t.stateNode.containerInfo.firstChild), Aa = t, L = !0, Ma = null, n = Ja(t, null, i, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Ba(), i === a) {
							t = lc(e, t, n);
							break a;
						}
						Hs(e, t, i, n);
					}
					t = t.child;
				}
				return t;
			case 5: return To(t), e === null && Ia(t), i = t.type, a = t.pendingProps, o = e === null ? null : e.memoizedProps, s = a.children, Mi(i, a) ? s = null : o !== null && Mi(i, o) && (t.flags |= 32), qs(e, t), Hs(e, t, s, n), t.child;
			case 6: return e === null && Ia(t), null;
			case 13: return tc(e, t, n);
			case 4: return Co(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = qa(t, null, i, n) : Hs(e, t, i, n), t.child;
			case 11: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : ws(i, a), Us(e, t, i, a, n);
			case 7: return Hs(e, t, t.pendingProps, n), t.child;
			case 8: return Hs(e, t, t.pendingProps.children, n), t.child;
			case 12: return Hs(e, t, t.pendingProps.children, n), t.child;
			case 10:
				a: {
					if (i = t.type._context, a = t.pendingProps, o = t.memoizedProps, s = a.value, F(Ya, i._currentValue), i._currentValue = s, o !== null) {
						if (Vr(o.value, s)) {
							if (o.children === a.children && !na.current) {
								t = lc(e, t, n);
								break a;
							}
						} else for (o = t.child, o !== null && (o.return = t); o !== null;) {
							var c = o.dependencies;
							if (c !== null) {
								s = o.child;
								for (var l = c.firstContext; l !== null;) {
									if (l.context === i) {
										if (o.tag === 1) {
											l = fo(-1, n & -n), l.tag = 2;
											var u = o.updateQueue;
											if (u !== null) {
												u = u.shared;
												var d = u.pending;
												d === null ? l.next = l : (l.next = d.next, d.next = l), u.pending = l;
											}
										}
										o.lanes |= n, l = o.alternate, l !== null && (l.lanes |= n), to(o.return, n, t), c.lanes |= n;
										break;
									}
									l = l.next;
								}
							} else if (o.tag === 10) s = o.type === t.type ? null : o.child;
							else if (o.tag === 18) {
								if (s = o.return, s === null) throw Error(r(341));
								s.lanes |= n, c = s.alternate, c !== null && (c.lanes |= n), to(s, n, t), s = o.sibling;
							} else s = o.child;
							if (s !== null) s.return = o;
							else for (s = o; s !== null;) {
								if (s === t) {
									s = null;
									break;
								}
								if (o = s.sibling, o !== null) {
									o.return = s.return, s = o;
									break;
								}
								s = s.return;
							}
							o = s;
						}
					}
					Hs(e, t, a.children, n), t = t.child;
				}
				return t;
			case 9: return a = t.type, i = t.pendingProps.children, no(t, n), a = ro(a), i = i(a), t.flags |= 1, Hs(e, t, i, n), t.child;
			case 14: return i = t.type, a = ws(i, t.pendingProps), a = ws(i.type, a), Ws(e, t, i, a, n);
			case 15: return Gs(e, t, t.type, t.pendingProps, n);
			case 17: return i = t.type, a = t.pendingProps, a = t.elementType === i ? a : ws(i, a), cc(e, t), t.tag = 1, aa(i) ? (e = !0, la(t)) : e = !1, no(t, n), Os(t, i, a), As(t, i, a, n), Xs(null, t, i, !0, e, n);
			case 19: return sc(e, t, n);
			case 22: return Ks(e, t, n);
		}
		throw Error(r(156, t.tag));
	};
	function Wl(e, t) {
		return Tt(e, t);
	}
	function Gl(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function Kl(e, t, n, r) {
		return new Gl(e, t, n, r);
	}
	function ql(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Jl(e) {
		if (typeof e == "function") return +!!ql(e);
		if (e != null) {
			if (e = e.$$typeof, e === se) return 11;
			if (e === w) return 14;
		}
		return 2;
	}
	function Yl(e, t) {
		var n = e.alternate;
		return n === null ? (n = Kl(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
	}
	function Xl(e, t, n, i, a, o) {
		var s = 2;
		if (i = e, typeof e == "function") ql(e) && (s = 1);
		else if (typeof e == "string") s = 5;
		else a: switch (e) {
			case ne: return Zl(n.children, a, o, t);
			case re:
				s = 8, a |= 8;
				break;
			case ie: return e = Kl(12, n, t, a | 2), e.elementType = ie, e.lanes = o, e;
			case ce: return e = Kl(13, n, t, a), e.elementType = ce, e.lanes = o, e;
			case le: return e = Kl(19, n, t, a), e.elementType = le, e.lanes = o, e;
			case de: return Ql(n, a, o, t);
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case ae:
						s = 10;
						break a;
					case oe:
						s = 9;
						break a;
					case se:
						s = 11;
						break a;
					case w:
						s = 14;
						break a;
					case ue:
						s = 16, i = null;
						break a;
				}
				throw Error(r(130, e == null ? e : typeof e, ""));
		}
		return t = Kl(s, n, t, a), t.elementType = e, t.type = i, t.lanes = o, t;
	}
	function Zl(e, t, n, r) {
		return e = Kl(7, e, r, t), e.lanes = n, e;
	}
	function Ql(e, t, n, r) {
		return e = Kl(22, e, r, t), e.elementType = de, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
	}
	function $l(e, t, n) {
		return e = Kl(6, e, null, t), e.lanes = n, e;
	}
	function eu(e, t, n) {
		return t = Kl(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	function tu(e, t, n, r, i) {
		this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Xt(0), this.expirationTimes = Xt(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Xt(0), this.identifierPrefix = r, this.onRecoverableError = i, this.mutableSourceEagerHydrationData = null;
	}
	function nu(e, t, n, r, i, a, o, s, c) {
		return e = new tu(e, t, n, s, c), t === 1 ? (t = 1, !0 === a && (t |= 8)) : t = 0, a = Kl(3, null, null, t), e.current = a, a.stateNode = e, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: null,
			transitions: null,
			pendingSuspenseBoundaries: null
		}, lo(a), e;
	}
	function ru(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: te,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	function iu(e) {
		if (!e) return ta;
		e = e._reactInternals;
		a: {
			if (yt(e) !== e || e.tag !== 1) throw Error(r(170));
			var t = e;
			do {
				switch (t.tag) {
					case 3:
						t = t.stateNode.context;
						break a;
					case 1: if (aa(t.type)) {
						t = t.stateNode.__reactInternalMemoizedMergedChildContext;
						break a;
					}
				}
				t = t.return;
			} while (t !== null);
			throw Error(r(171));
		}
		if (e.tag === 1) {
			var n = e.type;
			if (aa(n)) return ca(e, n, t);
		}
		return t;
	}
	function au(e, t, n, r, i, a, o, s, c) {
		return e = nu(n, r, !0, e, i, a, o, s, c), e.context = iu(null), n = e.current, r = Q(), i = ml(n), a = fo(r, i), a.callback = t ?? null, po(n, a, i), e.current.lanes = i, Zt(e, i, r), gl(e, r), e;
	}
	function ou(e, t, n, r) {
		var i = t.current, a = Q(), o = ml(i);
		return n = iu(n), t.context === null ? t.context = n : t.pendingContext = n, t = fo(a, o), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = po(i, t, o), e !== null && (hl(e, i, o, a), mo(e, i, o)), o;
	}
	function su(e) {
		if (e = e.current, !e.child) return null;
		switch (e.child.tag) {
			case 5: return e.child.stateNode;
			default: return e.child.stateNode;
		}
	}
	function cu(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function lu(e, t) {
		cu(e, t), (e = e.alternate) && cu(e, t);
	}
	function uu() {
		return null;
	}
	var du = typeof reportError == "function" ? reportError : function(e) {
		console.error(e);
	};
	function fu(e) {
		this._internalRoot = e;
	}
	pu.prototype.render = fu.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(r(409));
		ou(e, t, null, null);
	}, pu.prototype.unmount = fu.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			wl(function() {
				ou(null, e, null, null);
			}), t[Wi] = null;
		}
	};
	function pu(e) {
		this._internalRoot = e;
	}
	pu.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = an();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < mn.length && t !== 0 && t < mn[n].priority; n++);
			mn.splice(n, 0, e), n === 0 && yn(e);
		}
	};
	function mu(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function hu(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
	}
	function gu() {}
	function _u(e, t, n, r, i) {
		if (i) {
			if (typeof r == "function") {
				var a = r;
				r = function() {
					var e = su(o);
					a.call(e);
				};
			}
			var o = au(t, r, e, 0, null, !1, !1, "", gu);
			return e._reactRootContainer = o, e[Wi] = o.current, N(e.nodeType === 8 ? e.parentNode : e), wl(), o;
		}
		for (; i = e.lastChild;) e.removeChild(i);
		if (typeof r == "function") {
			var s = r;
			r = function() {
				var e = su(c);
				s.call(e);
			};
		}
		var c = nu(e, 0, !1, null, null, !1, !1, "", gu);
		return e._reactRootContainer = c, e[Wi] = c.current, N(e.nodeType === 8 ? e.parentNode : e), wl(function() {
			ou(t, c, n, r);
		}), c;
	}
	function vu(e, t, n, r, i) {
		var a = n._reactRootContainer;
		if (a) {
			var o = a;
			if (typeof i == "function") {
				var s = i;
				i = function() {
					var e = su(o);
					s.call(e);
				};
			}
			ou(t, o, e, i);
		} else o = _u(n, t, e, i, r);
		return su(o);
	}
	tn = function(e) {
		switch (e.tag) {
			case 3:
				var t = e.stateNode;
				if (t.current.memoizedState.isDehydrated) {
					var n = Wt(t.pendingLanes);
					n !== 0 && ($t(t, n | 1), gl(t, D()), !(q & 6) && (nl = D() + 500, ga()));
				}
				break;
			case 13: wl(function() {
				var t = so(e, 1);
				t !== null && hl(t, e, 1, Q());
			}), lu(e, 1);
		}
	}, nn = function(e) {
		if (e.tag === 13) {
			var t = so(e, 134217728);
			t !== null && hl(t, e, 134217728, Q()), lu(e, 134217728);
		}
	}, rn = function(e) {
		if (e.tag === 13) {
			var t = ml(e), n = so(e, t);
			n !== null && hl(n, e, t, Q()), lu(e, t);
		}
	}, an = function() {
		return O;
	}, on = function(e, t) {
		var n = O;
		try {
			return O = e, t();
		} finally {
			O = n;
		}
	}, Qe = function(e, t, n) {
		switch (t) {
			case "input":
				if (Ae(e, n), t = n.name, n.type === "radio" && t != null) {
					for (n = e; n.parentNode;) n = n.parentNode;
					for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + "][type=\"radio\"]"), t = 0; t < n.length; t++) {
						var i = n[t];
						if (i !== e && i.form === e.form) {
							var a = Zi(i);
							if (!a) throw Error(r(90));
							Te(i), Ae(i, a);
						}
					}
				}
				break;
			case "textarea":
				Le(e, n);
				break;
			case "select": t = n.value, t != null && Pe(e, !!n.multiple, t, !1);
		}
	}, it = Cl, at = wl;
	var yu = {
		usingClientEntryPoint: !1,
		Events: [
			Yi,
			Xi,
			Zi,
			nt,
			rt,
			Cl
		]
	}, bu = {
		findFiberByHostInstance: Ji,
		bundleType: 0,
		version: "18.3.1",
		rendererPackageName: "react-dom"
	}, xu = {
		bundleType: bu.bundleType,
		version: bu.version,
		rendererPackageName: bu.rendererPackageName,
		rendererConfig: bu.rendererConfig,
		overrideHookState: null,
		overrideHookStateDeletePath: null,
		overrideHookStateRenamePath: null,
		overrideProps: null,
		overridePropsDeletePath: null,
		overridePropsRenamePath: null,
		setErrorHandler: null,
		setSuspenseHandler: null,
		scheduleUpdate: null,
		currentDispatcherRef: S.ReactCurrentDispatcher,
		findHostInstanceByFiber: function(e) {
			return e = Ct(e), e === null ? null : e.stateNode;
		},
		findFiberByHostInstance: bu.findFiberByHostInstance || uu,
		findHostInstancesForRefresh: null,
		scheduleRefresh: null,
		scheduleRoot: null,
		setRefreshHandler: null,
		getCurrentFiber: null,
		reconcilerVersion: "18.3.1-next-f1338f8080-20240426"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Su = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Su.isDisabled && Su.supportsFiber) try {
			Ft = Su.inject(xu), It = Su;
		} catch {}
	}
	e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = yu, e.createPortal = function(e, t) {
		var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!mu(t)) throw Error(r(200));
		return ru(e, t, null, n);
	}, e.createRoot = function(e, t) {
		if (!mu(e)) throw Error(r(299));
		var n = !1, i = "", a = du;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onRecoverableError !== void 0 && (a = t.onRecoverableError)), t = nu(e, 1, !1, null, null, n, !1, i, a), e[Wi] = t.current, N(e.nodeType === 8 ? e.parentNode : e), new fu(t);
	}, e.findDOMNode = function(e) {
		if (e == null) return null;
		if (e.nodeType === 1) return e;
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(r(188)) : (e = Object.keys(e).join(","), Error(r(268, e)));
		return e = Ct(t), e = e === null ? null : e.stateNode, e;
	}, e.flushSync = function(e) {
		return wl(e);
	}, e.hydrate = function(e, t, n) {
		if (!hu(t)) throw Error(r(200));
		return vu(null, e, t, !0, n);
	}, e.hydrateRoot = function(e, t, n) {
		if (!mu(e)) throw Error(r(405));
		var i = n != null && n.hydratedSources || null, a = !1, o = "", s = du;
		if (n != null && (!0 === n.unstable_strictMode && (a = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (s = n.onRecoverableError)), t = au(t, null, e, 1, n ?? null, a, !1, o, s), e[Wi] = t.current, N(e), i) for (e = 0; e < i.length; e++) n = i[e], a = n._getVersion, a = a(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, a] : t.mutableSourceEagerHydrationData.push(n, a);
		return new pu(t);
	}, e.render = function(e, t, n) {
		if (!hu(t)) throw Error(r(200));
		return vu(null, e, t, !1, n);
	}, e.unmountComponentAtNode = function(e) {
		if (!hu(e)) throw Error(r(40));
		return e._reactRootContainer ? (wl(function() {
			vu(null, null, e, !1, function() {
				e._reactRootContainer = null, e[Wi] = null;
			});
		}), !0) : !1;
	}, e.unstable_batchedUpdates = Cl, e.unstable_renderSubtreeIntoContainer = function(e, t, n, i) {
		if (!hu(n)) throw Error(r(200));
		if (e == null || e._reactInternals === void 0) throw Error(r(38));
		return vu(e, t, n, !1, i);
	}, e.version = "18.3.1-next-f1338f8080-20240426";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = m();
	e.createRoot = t.createRoot, e.hydrateRoot = t.hydrateRoot;
}));
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@remix-run/router/dist/router.js
function g() {
	return g = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, g.apply(null, arguments);
}
var _;
(function(e) {
	e.Pop = "POP", e.Push = "PUSH", e.Replace = "REPLACE";
})(_ ||= {});
function v(e) {
	e === void 0 && (e = {});
	let { initialEntries: t = ["/"], initialIndex: n, v5Compat: r = !1 } = e, i;
	i = t.map((e, t) => u(e, typeof e == "string" ? null : e.state, t === 0 ? "default" : void 0));
	let a = c(n ?? i.length - 1), o = _.Pop, s = null;
	function c(e) {
		return Math.min(Math.max(e, 0), i.length - 1);
	}
	function l() {
		return i[a];
	}
	function u(e, t, n) {
		t === void 0 && (t = null);
		let r = ee(i ? l().pathname : "/", e, t, n);
		return b(r.pathname.charAt(0) === "/", "relative pathnames are not supported in memory history: " + JSON.stringify(e)), r;
	}
	function d(e) {
		return typeof e == "string" ? e : S(e);
	}
	return {
		get index() {
			return a;
		},
		get action() {
			return o;
		},
		get location() {
			return l();
		},
		createHref: d,
		createURL(e) {
			return new URL(d(e), "http://localhost");
		},
		encodeLocation(e) {
			let t = typeof e == "string" ? C(e) : e;
			return {
				pathname: t.pathname || "",
				search: t.search || "",
				hash: t.hash || ""
			};
		},
		push(e, t) {
			o = _.Push;
			let n = u(e, t);
			a += 1, i.splice(a, i.length, n), r && s && s({
				action: o,
				location: n,
				delta: 1
			});
		},
		replace(e, t) {
			o = _.Replace;
			let n = u(e, t);
			i[a] = n, r && s && s({
				action: o,
				location: n,
				delta: 0
			});
		},
		go(e) {
			o = _.Pop;
			let t = c(a + e), n = i[t];
			a = t, s && s({
				action: o,
				location: n,
				delta: e
			});
		},
		listen(e) {
			return s = e, () => {
				s = null;
			};
		}
	};
}
function y(e, t) {
	if (e === !1 || e == null) throw Error(t);
}
function b(e, t) {
	if (!e) {
		typeof console < "u" && console.warn(t);
		try {
			throw Error(t);
		} catch {}
	}
}
function x() {
	return Math.random().toString(36).substr(2, 8);
}
function ee(e, t, n, r) {
	return n === void 0 && (n = null), g({
		pathname: typeof e == "string" ? e : e.pathname,
		search: "",
		hash: ""
	}, typeof t == "string" ? C(t) : t, {
		state: n,
		key: t && t.key || r || x()
	});
}
function S(e) {
	let { pathname: t = "/", search: n = "", hash: r = "" } = e;
	return n && n !== "?" && (t += n.charAt(0) === "?" ? n : "?" + n), r && r !== "#" && (t += r.charAt(0) === "#" ? r : "#" + r), t;
}
function C(e) {
	let t = {};
	if (e) {
		let n = e.indexOf("#");
		n >= 0 && (t.hash = e.substr(n), e = e.substr(0, n));
		let r = e.indexOf("?");
		r >= 0 && (t.search = e.substr(r), e = e.substr(0, r)), e && (t.pathname = e);
	}
	return t;
}
var te;
(function(e) {
	e.data = "data", e.deferred = "deferred", e.redirect = "redirect", e.error = "error";
})(te ||= {});
function ne(e, t) {
	if (t === "/") return e;
	if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
	let n = t.endsWith("/") ? t.length - 1 : t.length, r = e.charAt(n);
	return r && r !== "/" ? null : e.slice(n) || "/";
}
function re(e, t) {
	t === void 0 && (t = "/");
	let { pathname: n, search: r = "", hash: i = "" } = typeof e == "string" ? C(e) : e, a;
	return n ? (n = le(n), a = n.startsWith("/") ? ie(n.substring(1), "/") : ie(n, t)) : a = t, {
		pathname: a,
		search: ue(r),
		hash: de(i)
	};
}
function ie(e, t) {
	let n = t.replace(/\/+$/, "").split("/");
	return e.split("/").forEach((e) => {
		e === ".." ? n.length > 1 && n.pop() : e !== "." && n.push(e);
	}), n.length > 1 ? n.join("/") : "/";
}
function ae(e, t, n, r) {
	return "Cannot include a '" + e + "' character in a manually specified " + ("`to." + t + "` field [" + JSON.stringify(r) + "].  Please separate it out to the ") + ("`to." + n + "` field. Alternatively you may provide the full path as ") + "a string in <Link to=\"...\"> and the router will parse it for you.";
}
function oe(e) {
	return e.filter((e, t) => t === 0 || e.route.path && e.route.path.length > 0);
}
function se(e, t) {
	let n = oe(e);
	return t ? n.map((e, t) => t === n.length - 1 ? e.pathname : e.pathnameBase) : n.map((e) => e.pathnameBase);
}
function ce(e, t, n, r) {
	r === void 0 && (r = !1);
	let i;
	typeof e == "string" ? i = C(e) : (i = g({}, e), y(!i.pathname || !i.pathname.includes("?"), ae("?", "pathname", "search", i)), y(!i.pathname || !i.pathname.includes("#"), ae("#", "pathname", "hash", i)), y(!i.search || !i.search.includes("#"), ae("#", "search", "hash", i)));
	let a = e === "" || i.pathname === "", o = a ? "/" : i.pathname, s;
	if (o == null) s = n;
	else {
		let e = t.length - 1;
		if (!r && o.startsWith("..")) {
			let t = o.split("/");
			for (; t[0] === "..";) t.shift(), --e;
			i.pathname = t.join("/");
		}
		s = e >= 0 ? t[e] : "/";
	}
	let c = re(i, s), l = o && o !== "/" && o.endsWith("/"), u = (a || o === ".") && n.endsWith("/");
	return !c.pathname.endsWith("/") && (l || u) && (c.pathname += "/"), c;
}
var le = (e) => e.replace(/\/\/+/g, "/"), w = (e) => le(e.join("/")), ue = (e) => !e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e, de = (e) => !e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e, fe = [
	"post",
	"put",
	"patch",
	"delete"
];
new Set(fe);
var pe = ["get", ...fe];
new Set(pe);
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/react-router/dist/index.js
var T = /* @__PURE__ */ c(u());
function me() {
	return me = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, me.apply(null, arguments);
}
var he = /*#__PURE__*/ T.createContext(null), ge = /*#__PURE__*/ T.createContext(null), _e = /*#__PURE__*/ T.createContext(null), ve = /*#__PURE__*/ T.createContext({
	outlet: null,
	matches: [],
	isDataRoute: !1
});
function ye() {
	return T.useContext(_e) != null;
}
function be() {
	return !ye() && y(!1), T.useContext(_e).location;
}
function xe(e) {
	T.useContext(ge).static || T.useLayoutEffect(e);
}
function Se() {
	let { isDataRoute: e } = T.useContext(ve);
	return e ? ke() : Ce();
}
function Ce() {
	!ye() && y(!1);
	let e = T.useContext(he), { basename: t, future: n, navigator: r } = T.useContext(ge), { matches: i } = T.useContext(ve), { pathname: a } = be(), o = JSON.stringify(se(i, n.v7_relativeSplatPath)), s = T.useRef(!1);
	return xe(() => {
		s.current = !0;
	}), T.useCallback(function(n, i) {
		if (i === void 0 && (i = {}), !s.current) return;
		if (typeof n == "number") {
			r.go(n);
			return;
		}
		let c = ce(n, JSON.parse(o), a, i.relative === "path");
		e == null && t !== "/" && (c.pathname = c.pathname === "/" ? t : w([t, c.pathname])), (i.replace ? r.replace : r.push)(c, i.state, i);
	}, [
		t,
		r,
		o,
		a,
		e
	]);
}
T.Component;
var we = /*#__PURE__*/ function(e) {
	return e.UseBlocker = "useBlocker", e.UseRevalidator = "useRevalidator", e.UseNavigateStable = "useNavigate", e;
}(we || {}), Te = /*#__PURE__*/ function(e) {
	return e.UseBlocker = "useBlocker", e.UseLoaderData = "useLoaderData", e.UseActionData = "useActionData", e.UseRouteError = "useRouteError", e.UseNavigation = "useNavigation", e.UseRouteLoaderData = "useRouteLoaderData", e.UseMatches = "useMatches", e.UseRevalidator = "useRevalidator", e.UseNavigateStable = "useNavigate", e.UseRouteId = "useRouteId", e;
}(Te || {});
function Ee(e) {
	let t = T.useContext(he);
	return !t && y(!1), t;
}
function De(e) {
	let t = T.useContext(ve);
	return !t && y(!1), t;
}
function Oe(e) {
	let t = De(e), n = t.matches[t.matches.length - 1];
	return !n.route.id && y(!1), n.route.id;
}
function ke() {
	let { router: e } = Ee(we.UseNavigateStable), t = Oe(Te.UseNavigateStable), n = T.useRef(!1);
	return xe(() => {
		n.current = !0;
	}), T.useCallback(function(r, i) {
		i === void 0 && (i = {}), n.current && (typeof r == "number" ? e.navigate(r) : e.navigate(r, me({ fromRouteId: t }, i)));
	}, [e, t]);
}
var Ae = (e, t, n) => ("" + t + ("You can use the `" + e + "` future flag to opt-in early. ") + ("For more information, see " + n + "."), void 0);
function je(e, t) {
	e?.v7_startTransition === void 0 && Ae("v7_startTransition", "React Router will begin wrapping state updates in `React.startTransition` in v7", "https://reactrouter.com/v6/upgrading/future#v7_starttransition"), e?.v7_relativeSplatPath !== void 0 || t && t.v7_relativeSplatPath !== void 0 || Ae("v7_relativeSplatPath", "Relative route resolution within Splat routes is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath"), t && (t.v7_fetcherPersist === void 0 && Ae("v7_fetcherPersist", "The persistence behavior of fetchers is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_fetcherpersist"), t.v7_normalizeFormMethod === void 0 && Ae("v7_normalizeFormMethod", "Casing of `formMethod` fields is being normalized to uppercase in v7", "https://reactrouter.com/v6/upgrading/future#v7_normalizeformmethod"), t.v7_partialHydration === void 0 && Ae("v7_partialHydration", "`RouterProvider` hydration behavior is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_partialhydration"), t.v7_skipActionErrorRevalidation === void 0 && Ae("v7_skipActionErrorRevalidation", "The revalidation behavior after 4xx/5xx `action` responses is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_skipactionerrorrevalidation"));
}
var Me = T.startTransition;
function Ne(e) {
	let { basename: t, children: n, initialEntries: r, initialIndex: i, future: a } = e, o = T.useRef();
	o.current ??= v({
		initialEntries: r,
		initialIndex: i,
		v5Compat: !0
	});
	let s = o.current, [c, l] = T.useState({
		action: s.action,
		location: s.location
	}), { v7_startTransition: u } = a || {}, d = T.useCallback((e) => {
		u && Me ? Me(() => l(e)) : l(e);
	}, [l, u]);
	return T.useLayoutEffect(() => s.listen(d), [s, d]), T.useEffect(() => je(a), [a]), /*#__PURE__*/ T.createElement(Pe, {
		basename: t,
		children: n,
		location: c.location,
		navigationType: c.action,
		navigator: s,
		future: a
	});
}
function Pe(e) {
	let { basename: t = "/", children: n = null, location: r, navigationType: i = _.Pop, navigator: a, static: o = !1, future: s } = e;
	ye() && y(!1);
	let c = t.replace(/^\/*/, "/"), l = T.useMemo(() => ({
		basename: c,
		navigator: a,
		static: o,
		future: me({ v7_relativeSplatPath: !1 }, s)
	}), [
		c,
		s,
		a,
		o
	]);
	typeof r == "string" && (r = C(r));
	let { pathname: u = "/", search: d = "", hash: f = "", state: p = null, key: m = "default" } = r, h = T.useMemo(() => {
		let e = ne(u, c);
		return e == null ? null : {
			location: {
				pathname: e,
				search: d,
				hash: f,
				state: p,
				key: m
			},
			navigationType: i
		};
	}, [
		c,
		u,
		d,
		f,
		p,
		m,
		i
	]);
	return h == null ? null : /*#__PURE__*/ T.createElement(ge.Provider, { value: l }, /*#__PURE__*/ T.createElement(_e.Provider, {
		children: n,
		value: h
	}));
}
var Fe = /*#__PURE__*/ function(e) {
	return e[e.pending = 0] = "pending", e[e.success = 1] = "success", e[e.error = 2] = "error", e;
}(Fe || {});
new Promise(() => {}), T.Component;
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/primitive/dist/index.mjs
var Ie = h();
typeof window < "u" && window.document && window.document.createElement;
function Le(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return function(r) {
		if (e?.(r), n === !1 || !r.defaultPrevented) return t?.(r);
	};
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
function Re(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
function ze(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = Re(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : Re(e[t], null);
			}
		};
	};
}
function Be(...e) {
	return T.useCallback(ze(...e), e);
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/react/cjs/react-jsx-runtime.production.min.js
var Ve = /* @__PURE__ */ o(((e) => {
	var t = u(), n = Symbol.for("react.element"), r = Symbol.for("react.fragment"), i = Object.prototype.hasOwnProperty, a = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, o = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function s(e, t, r) {
		var s, c = {}, l = null, u = null;
		for (s in r !== void 0 && (l = "" + r), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (u = t.ref), t) i.call(t, s) && !o.hasOwnProperty(s) && (c[s] = t[s]);
		if (e && e.defaultProps) for (s in t = e.defaultProps, t) c[s] === void 0 && (c[s] = t[s]);
		return {
			$$typeof: n,
			type: e,
			key: l,
			ref: u,
			props: c,
			_owner: a.current
		};
	}
	e.Fragment = r, e.jsx = s, e.jsxs = s;
})), E = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Ve();
})))();
function He(e, t) {
	let n = T.createContext(t);
	n.displayName = e + "Context";
	let r = (e) => {
		let { children: t, ...r } = e, i = T.useMemo(() => r, Object.values(r));
		return /* @__PURE__ */ (0, E.jsx)(n.Provider, {
			value: i,
			children: t
		});
	};
	r.displayName = e + "Provider";
	function i(r) {
		let i = T.useContext(n);
		if (i) return i;
		if (t !== void 0) return t;
		throw Error(`\`${r}\` must be used within \`${e}\``);
	}
	return [r, i];
}
function Ue(e, t = []) {
	let n = [];
	function r(t, r) {
		let i = T.createContext(r);
		i.displayName = t + "Context";
		let a = n.length;
		n = [...n, r];
		let o = (t) => {
			let { scope: n, children: r, ...o } = t, s = n?.[e]?.[a] || i, c = T.useMemo(() => o, Object.values(o));
			return /* @__PURE__ */ (0, E.jsx)(s.Provider, {
				value: c,
				children: r
			});
		};
		o.displayName = t + "Provider";
		function s(n, o) {
			let s = o?.[e]?.[a] || i, c = T.useContext(s);
			if (c) return c;
			if (r !== void 0) return r;
			throw Error(`\`${n}\` must be used within \`${t}\``);
		}
		return [o, s];
	}
	let i = () => {
		let t = n.map((e) => T.createContext(e));
		return function(n) {
			let r = n?.[e] || t;
			return T.useMemo(() => ({ [`__scope${e}`]: {
				...n,
				[e]: r
			} }), [n, r]);
		};
	};
	return i.scopeName = e, [r, We(i, ...t)];
}
function We(...e) {
	let t = e[0];
	if (e.length === 1) return t;
	let n = () => {
		let n = e.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return function(e) {
			let r = n.reduce((t, { useScope: n, scopeName: r }) => {
				let i = n(e)[`__scope${r}`];
				return {
					...t,
					...i
				};
			}, {});
			return T.useMemo(() => ({ [`__scope${t.scopeName}`]: r }), [r]);
		};
	};
	return n.scopeName = t.scopeName, n;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var Ge = globalThis?.document ? T.useLayoutEffect : () => {}, Ke = T.useId || (() => void 0), qe = 0;
function Je(e) {
	let [t, n] = T.useState(Ke());
	return Ge(() => {
		e || n((e) => e ?? String(qe++));
	}, [e]), e || (t ? `radix-${t}` : "");
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var Ye = T.useInsertionEffect || Ge;
function Xe({ prop: e, defaultProp: t, onChange: n = () => {}, caller: r }) {
	let [i, a, o] = Ze({
		defaultProp: t,
		onChange: n
	}), s = e !== void 0, c = s ? e : i;
	{
		let t = T.useRef(e !== void 0);
		T.useEffect(() => {
			let e = t.current;
			e !== s && console.warn(`${r} is changing from ${e ? "controlled" : "uncontrolled"} to ${s ? "controlled" : "uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`), t.current = s;
		}, [s, r]);
	}
	return [c, T.useCallback((t) => {
		if (s) {
			let n = Qe(t) ? t(e) : t;
			n !== e && o.current?.(n);
		} else a(t);
	}, [
		s,
		e,
		a,
		o
	])];
}
function Ze({ defaultProp: e, onChange: t }) {
	let [n, r] = T.useState(e), i = T.useRef(n), a = T.useRef(t);
	return Ye(() => {
		a.current = t;
	}, [t]), T.useEffect(() => {
		i.current !== n && (a.current?.(n), i.current = n);
	}, [n, i]), [
		n,
		r,
		a
	];
}
function Qe(e) {
	return typeof e == "function";
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-slot/dist/index.mjs
var $e = /* @__PURE__ */ c(m(), 1);
// @__NO_SIDE_EFFECTS__
function et(e) {
	let t = T.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		st(r) && typeof dt == "function" && (r = dt(r._payload)), T.Children.forEach(r, (e) => {
			if (at(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				st(n) && typeof dt == "function" && (n = dt(n._payload)), a = nt(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = T.cloneElement(a, void 0, s) : !o && T.Children.count(r) === 1 && T.isValidElement(r) && (a = r);
		let c = a ? it(a) : void 0, l = Be(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? ut(e) : lt(e));
			return r;
		}
		let u = rt(i, a.props ?? {});
		return a.type !== T.Fragment && (u.ref = n ? l : c), T.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
var tt = Symbol.for("radix.slottable"), nt = (e, t) => {
	if ("child" in e.props) {
		let t = e.props.child;
		return T.isValidElement(t) ? T.cloneElement(t, void 0, e.props.children(t.props.children)) : null;
	}
	return T.isValidElement(t) ? t : null;
};
function rt(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" && (n[r] = [i, a].filter(Boolean).join(" "));
	}
	return {
		...e,
		...n
	};
}
function it(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
function at(e) {
	return T.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === tt;
}
var ot = Symbol.for("react.lazy");
function st(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === ot && "_payload" in e && ct(e._payload);
}
function ct(e) {
	return typeof e == "object" && !!e && "then" in e;
}
var lt = (e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, ut = (e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, dt = T.use, ft = [
	"a",
	"button",
	"div",
	"form",
	"h2",
	"h3",
	"img",
	"input",
	"label",
	"li",
	"nav",
	"ol",
	"p",
	"select",
	"span",
	"svg",
	"ul"
].reduce((e, t) => {
	let n = /* @__PURE__ */ et(`Primitive.${t}`), r = T.forwardRef((e, r) => {
		let { asChild: i, ...a } = e, o = i ? n : t;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, E.jsx)(o, {
			...a,
			ref: r
		});
	});
	return r.displayName = `Primitive.${t}`, {
		...e,
		[t]: r
	};
}, {});
function pt(e, t) {
	e && $e.flushSync(() => e.dispatchEvent(t));
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
function mt(e) {
	let t = T.useRef(e);
	return T.useEffect(() => {
		t.current = e;
	}), T.useMemo(() => ((...e) => t.current?.(...e)), []);
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-use-escape-keydown/dist/index.mjs
function ht(e, t = globalThis?.document) {
	let n = mt(e);
	T.useEffect(() => {
		let e = (e) => {
			e.key === "Escape" && n(e);
		};
		return t.addEventListener("keydown", e, { capture: !0 }), () => t.removeEventListener("keydown", e, { capture: !0 });
	}, [n, t]);
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var gt = "DismissableLayer", _t = "dismissableLayer.update", vt = "dismissableLayer.pointerDownOutside", yt = "dismissableLayer.focusOutside", bt, xt = T.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set()
}), St = T.forwardRef((e, t) => {
	let { disableOutsidePointerEvents: n = !1, onEscapeKeyDown: r, onPointerDownOutside: i, onFocusOutside: a, onInteractOutside: o, onDismiss: s, ...c } = e, l = T.useContext(xt), [u, d] = T.useState(null), f = u?.ownerDocument ?? globalThis?.document, [, p] = T.useState({}), m = Be(t, (e) => d(e)), h = Array.from(l.layers), [g] = [...l.layersWithOutsidePointerEventsDisabled].slice(-1), _ = h.indexOf(g), v = u ? h.indexOf(u) : -1, y = l.layersWithOutsidePointerEventsDisabled.size > 0, b = v >= _, x = Tt((e) => {
		let t = e.target, n = [...l.branches].some((e) => e.contains(t));
		b && !n && (i?.(e), o?.(e), e.defaultPrevented || s?.());
	}, f), ee = Et((e) => {
		let t = e.target;
		[...l.branches].some((e) => e.contains(t)) || (a?.(e), o?.(e), e.defaultPrevented || s?.());
	}, f);
	return ht((e) => {
		v === l.layers.size - 1 && (r?.(e), !e.defaultPrevented && s && (e.preventDefault(), s()));
	}, f), T.useEffect(() => {
		if (u) return n && (l.layersWithOutsidePointerEventsDisabled.size === 0 && (bt = f.body.style.pointerEvents, f.body.style.pointerEvents = "none"), l.layersWithOutsidePointerEventsDisabled.add(u)), l.layers.add(u), Dt(), () => {
			n && (l.layersWithOutsidePointerEventsDisabled.delete(u), l.layersWithOutsidePointerEventsDisabled.size === 0 && (f.body.style.pointerEvents = bt));
		};
	}, [
		u,
		f,
		n,
		l
	]), T.useEffect(() => () => {
		u && (l.layers.delete(u), l.layersWithOutsidePointerEventsDisabled.delete(u), Dt());
	}, [u, l]), T.useEffect(() => {
		let e = () => p({});
		return document.addEventListener(_t, e), () => document.removeEventListener(_t, e);
	}, []), /* @__PURE__ */ (0, E.jsx)(ft.div, {
		...c,
		ref: m,
		style: {
			pointerEvents: y ? b ? "auto" : "none" : void 0,
			...e.style
		},
		onFocusCapture: Le(e.onFocusCapture, ee.onFocusCapture),
		onBlurCapture: Le(e.onBlurCapture, ee.onBlurCapture),
		onPointerDownCapture: Le(e.onPointerDownCapture, x.onPointerDownCapture)
	});
});
St.displayName = gt;
var Ct = "DismissableLayerBranch", wt = T.forwardRef((e, t) => {
	let n = T.useContext(xt), r = T.useRef(null), i = Be(t, r);
	return T.useEffect(() => {
		let e = r.current;
		if (e) return n.branches.add(e), () => {
			n.branches.delete(e);
		};
	}, [n.branches]), /* @__PURE__ */ (0, E.jsx)(ft.div, {
		...e,
		ref: i
	});
});
wt.displayName = Ct;
function Tt(e, t = globalThis?.document) {
	let n = mt(e), r = T.useRef(!1), i = T.useRef(() => {});
	return T.useEffect(() => {
		let e = (e) => {
			if (e.target && !r.current) {
				let r = function() {
					Ot(vt, n, a, { discrete: !0 });
				}, a = { originalEvent: e };
				e.pointerType === "touch" ? (t.removeEventListener("click", i.current), i.current = r, t.addEventListener("click", i.current, { once: !0 })) : r();
			} else t.removeEventListener("click", i.current);
			r.current = !1;
		}, a = window.setTimeout(() => {
			t.addEventListener("pointerdown", e);
		}, 0);
		return () => {
			window.clearTimeout(a), t.removeEventListener("pointerdown", e), t.removeEventListener("click", i.current);
		};
	}, [t, n]), { onPointerDownCapture: () => r.current = !0 };
}
function Et(e, t = globalThis?.document) {
	let n = mt(e), r = T.useRef(!1);
	return T.useEffect(() => {
		let e = (e) => {
			e.target && !r.current && Ot(yt, n, { originalEvent: e }, { discrete: !1 });
		};
		return t.addEventListener("focusin", e), () => t.removeEventListener("focusin", e);
	}, [t, n]), {
		onFocusCapture: () => r.current = !0,
		onBlurCapture: () => r.current = !1
	};
}
function Dt() {
	let e = new CustomEvent(_t);
	document.dispatchEvent(e);
}
function Ot(e, t, n, { discrete: r }) {
	let i = n.originalEvent.target, a = new CustomEvent(e, {
		bubbles: !1,
		cancelable: !0,
		detail: n
	});
	t && i.addEventListener(e, t, { once: !0 }), r ? pt(i, a) : i.dispatchEvent(a);
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var D = "focusScope.autoFocusOnMount", kt = "focusScope.autoFocusOnUnmount", At = {
	bubbles: !1,
	cancelable: !0
}, jt = "FocusScope", Mt = T.forwardRef((e, t) => {
	let { loop: n = !1, trapped: r = !1, onMountAutoFocus: i, onUnmountAutoFocus: a, ...o } = e, [s, c] = T.useState(null), l = mt(i), u = mt(a), d = T.useRef(null), f = Be(t, (e) => c(e)), p = T.useRef({
		paused: !1,
		pause() {
			this.paused = !0;
		},
		resume() {
			this.paused = !1;
		}
	}).current;
	T.useEffect(() => {
		if (r) {
			let e = function(e) {
				if (p.paused || !s) return;
				let t = e.target;
				s.contains(t) ? d.current = t : zt(d.current, { select: !0 });
			}, t = function(e) {
				if (p.paused || !s) return;
				let t = e.relatedTarget;
				t !== null && (s.contains(t) || zt(d.current, { select: !0 }));
			}, n = function(e) {
				if (document.activeElement === document.body) for (let t of e) t.removedNodes.length > 0 && zt(s);
			};
			document.addEventListener("focusin", e), document.addEventListener("focusout", t);
			let r = new MutationObserver(n);
			return s && r.observe(s, {
				childList: !0,
				subtree: !0
			}), () => {
				document.removeEventListener("focusin", e), document.removeEventListener("focusout", t), r.disconnect();
			};
		}
	}, [
		r,
		s,
		p.paused
	]), T.useEffect(() => {
		if (s) {
			Bt.add(p);
			let e = document.activeElement;
			if (!s.contains(e)) {
				let t = new CustomEvent(D, At);
				s.addEventListener(D, l), s.dispatchEvent(t), t.defaultPrevented || (Nt(Ut(Ft(s)), { select: !0 }), document.activeElement === e && zt(s));
			}
			return () => {
				s.removeEventListener(D, l), setTimeout(() => {
					let t = new CustomEvent(kt, At);
					s.addEventListener(kt, u), s.dispatchEvent(t), t.defaultPrevented || zt(e ?? document.body, { select: !0 }), s.removeEventListener(kt, u), Bt.remove(p);
				}, 0);
			};
		}
	}, [
		s,
		l,
		u,
		p
	]);
	let m = T.useCallback((e) => {
		if (!n && !r || p.paused) return;
		let t = e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey, i = document.activeElement;
		if (t && i) {
			let t = e.currentTarget, [r, a] = Pt(t);
			r && a ? !e.shiftKey && i === a ? (e.preventDefault(), n && zt(r, { select: !0 })) : e.shiftKey && i === r && (e.preventDefault(), n && zt(a, { select: !0 })) : i === t && e.preventDefault();
		}
	}, [
		n,
		r,
		p.paused
	]);
	return /* @__PURE__ */ (0, E.jsx)(ft.div, {
		tabIndex: -1,
		...o,
		ref: f,
		onKeyDown: m
	});
});
Mt.displayName = jt;
function Nt(e, { select: t = !1 } = {}) {
	let n = document.activeElement;
	for (let r of e) if (zt(r, { select: t }), document.activeElement !== n) return;
}
function Pt(e) {
	let t = Ft(e);
	return [It(t, e), It(t.reverse(), e)];
}
function Ft(e) {
	let t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: (e) => {
		let t = e.tagName === "INPUT" && e.type === "hidden";
		return e.disabled || e.hidden || t ? NodeFilter.FILTER_SKIP : e.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	} });
	for (; n.nextNode();) t.push(n.currentNode);
	return t;
}
function It(e, t) {
	for (let n of e) if (!Lt(n, { upTo: t })) return n;
}
function Lt(e, { upTo: t }) {
	if (getComputedStyle(e).visibility === "hidden") return !0;
	for (; e;) {
		if (t !== void 0 && e === t) return !1;
		if (getComputedStyle(e).display === "none") return !0;
		e = e.parentElement;
	}
	return !1;
}
function Rt(e) {
	return e instanceof HTMLInputElement && "select" in e;
}
function zt(e, { select: t = !1 } = {}) {
	if (e && e.focus) {
		let n = document.activeElement;
		e.focus({ preventScroll: !0 }), e !== n && Rt(e) && t && e.select();
	}
}
var Bt = Vt();
function Vt() {
	let e = [];
	return {
		add(t) {
			let n = e[0];
			t !== n && n?.pause(), e = Ht(e, t), e.unshift(t);
		},
		remove(t) {
			e = Ht(e, t), e[0]?.resume();
		}
	};
}
function Ht(e, t) {
	let n = [...e], r = n.indexOf(t);
	return r !== -1 && n.splice(r, 1), n;
}
function Ut(e) {
	return e.filter((e) => e.tagName !== "A");
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-portal/dist/index.mjs
var Wt = "Portal", Gt = T.forwardRef((e, t) => {
	let { container: n, ...r } = e, [i, a] = T.useState(!1);
	Ge(() => a(!0), []);
	let o = n || i && globalThis?.document?.body;
	return o ? $e.createPortal(/* @__PURE__ */ (0, E.jsx)(ft.div, {
		...r,
		ref: t
	}), o) : null;
});
Gt.displayName = Wt;
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-presence/dist/index.mjs
function Kt(e, t) {
	return T.useReducer((e, n) => t[e][n] ?? e, e);
}
var qt = (e) => {
	let { present: t, children: n } = e, r = Jt(t), i = typeof n == "function" ? n({ present: r.isPresent }) : T.Children.only(n), a = Xt(r.ref, Qt(i));
	return typeof n == "function" || r.isPresent ? T.cloneElement(i, { ref: a }) : null;
};
qt.displayName = "Presence";
function Jt(e) {
	let [t, n] = T.useState(), r = T.useRef(null), i = T.useRef(e), a = T.useRef("none"), [o, s] = Kt(e ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	return T.useEffect(() => {
		let e = Zt(r.current);
		a.current = o === "mounted" ? e : "none";
	}, [o]), Ge(() => {
		let t = r.current, n = i.current;
		if (n !== e) {
			let r = a.current, o = Zt(t);
			e ? s("MOUNT") : o === "none" || t?.display === "none" ? s("UNMOUNT") : s(n && r !== o ? "ANIMATION_OUT" : "UNMOUNT"), i.current = e;
		}
	}, [e, s]), Ge(() => {
		if (t) {
			let e, n = t.ownerDocument.defaultView ?? window, o = (a) => {
				let o = Zt(r.current).includes(CSS.escape(a.animationName));
				if (a.target === t && o && (s("ANIMATION_END"), !i.current)) {
					let r = t.style.animationFillMode;
					t.style.animationFillMode = "forwards", e = n.setTimeout(() => {
						t.style.animationFillMode === "forwards" && (t.style.animationFillMode = r);
					});
				}
			}, c = (e) => {
				e.target === t && (a.current = Zt(r.current));
			};
			return t.addEventListener("animationstart", c), t.addEventListener("animationcancel", o), t.addEventListener("animationend", o), () => {
				n.clearTimeout(e), t.removeEventListener("animationstart", c), t.removeEventListener("animationcancel", o), t.removeEventListener("animationend", o);
			};
		}
		s("ANIMATION_END");
	}, [t, s]), {
		isPresent: ["mounted", "unmountSuspended"].includes(o),
		ref: T.useCallback((e) => {
			r.current = e ? getComputedStyle(e) : null, n(e);
		}, [])
	};
}
function Yt(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
function Xt(...e) {
	let t = T.useRef(e);
	return t.current = e, T.useCallback((e) => {
		let n = t.current, r = !1, i = n.map((t) => {
			let n = Yt(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				typeof t == "function" ? t() : Yt(n[e], null);
			}
		};
	}, []);
}
function Zt(e) {
	return e?.animationName || "none";
}
function Qt(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/@radix-ui/react-focus-guards/dist/index.mjs
var $t = 0, O = null;
function en() {
	T.useEffect(() => {
		O ||= {
			start: tn(),
			end: tn()
		};
		let { start: e, end: t } = O;
		return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), $t++, () => {
			$t === 1 && (O?.start.remove(), O?.end.remove(), O = null), $t = Math.max(0, $t - 1);
		};
	}, []);
}
function tn() {
	let e = document.createElement("span");
	return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/tslib/tslib.es6.mjs
var nn = function() {
	return nn = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, nn.apply(this, arguments);
};
function rn(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function an(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var on = "right-scroll-bar-position", sn = "width-before-scroll-bar", cn = "with-scroll-bars-hidden", ln = "--removed-body-scroll-bar-size";
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/use-callback-ref/dist/es2015/assignRef.js
function un(e, t) {
	return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/use-callback-ref/dist/es2015/useRef.js
function dn(e, t) {
	var n = (0, T.useState)(function() {
		return {
			value: e,
			callback: t,
			facade: {
				get current() {
					return n.value;
				},
				set current(e) {
					var t = n.value;
					t !== e && (n.value = e, n.callback(e, t));
				}
			}
		};
	})[0];
	return n.callback = t, n.facade;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/use-callback-ref/dist/es2015/useMergeRef.js
var fn = typeof window < "u" ? T.useLayoutEffect : T.useEffect, pn = /* @__PURE__ */ new WeakMap();
function mn(e, t) {
	var n = dn(t || null, function(t) {
		return e.forEach(function(e) {
			return un(e, t);
		});
	});
	return fn(function() {
		var t = pn.get(n);
		if (t) {
			var r = new Set(t), i = new Set(e), a = n.current;
			r.forEach(function(e) {
				i.has(e) || un(e, null);
			}), i.forEach(function(e) {
				r.has(e) || un(e, a);
			});
		}
		pn.set(n, e);
	}, [e]), n;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/use-sidecar/dist/es2015/medium.js
function hn(e) {
	return e;
}
function gn(e, t) {
	t === void 0 && (t = hn);
	var n = [], r = !1;
	return {
		read: function() {
			if (r) throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
			return n.length ? n[n.length - 1] : e;
		},
		useMedium: function(e) {
			var i = t(e, r);
			return n.push(i), function() {
				n = n.filter(function(e) {
					return e !== i;
				});
			};
		},
		assignSyncMedium: function(e) {
			for (r = !0; n.length;) {
				var t = n;
				n = [], t.forEach(e);
			}
			n = {
				push: function(t) {
					return e(t);
				},
				filter: function() {
					return n;
				}
			};
		},
		assignMedium: function(e) {
			r = !0;
			var t = [];
			if (n.length) {
				var i = n;
				n = [], i.forEach(e), t = n;
			}
			var a = function() {
				var n = t;
				t = [], n.forEach(e);
			}, o = function() {
				return Promise.resolve().then(a);
			};
			o(), n = {
				push: function(e) {
					t.push(e), o();
				},
				filter: function(e) {
					return t = t.filter(e), n;
				}
			};
		}
	};
}
function _n(e) {
	e === void 0 && (e = {});
	var t = gn(null);
	return t.options = nn({
		async: !0,
		ssr: !1
	}, e), t;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/use-sidecar/dist/es2015/exports.js
var vn = function(e) {
	var t = e.sideCar, n = rn(e, ["sideCar"]);
	if (!t) throw Error("Sidecar: please provide `sideCar` property to import the right car");
	var r = t.read();
	if (!r) throw Error("Sidecar medium not found");
	return T.createElement(r, nn({}, n));
};
vn.isSideCarExport = !0;
function yn(e, t) {
	return e.useMedium(t), vn;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/react-remove-scroll/dist/es2015/medium.js
var bn = _n(), xn = function() {}, Sn = T.forwardRef(function(e, t) {
	var n = T.useRef(null), r = T.useState({
		onScrollCapture: xn,
		onWheelCapture: xn,
		onTouchMoveCapture: xn
	}), i = r[0], a = r[1], o = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, g = e.allowPinchZoom, _ = e.as, v = _ === void 0 ? "div" : _, y = e.gapMode, b = rn(e, [
		"forwardProps",
		"children",
		"className",
		"removeScrollBar",
		"enabled",
		"shards",
		"sideCar",
		"noRelative",
		"noIsolation",
		"inert",
		"allowPinchZoom",
		"as",
		"gapMode"
	]), x = f, ee = mn([n, t]), S = nn(nn({}, b), i);
	return T.createElement(T.Fragment, null, u && T.createElement(x, {
		sideCar: bn,
		removeScrollBar: l,
		shards: d,
		noRelative: p,
		noIsolation: m,
		inert: h,
		setCallbacks: a,
		allowPinchZoom: !!g,
		lockRef: n,
		gapMode: y
	}), o ? T.cloneElement(T.Children.only(s), nn(nn({}, S), { ref: ee })) : T.createElement(v, nn({}, S, {
		className: c,
		ref: ee
	}), s));
});
Sn.defaultProps = {
	enabled: !0,
	removeScrollBar: !0,
	inert: !1
}, Sn.classNames = {
	fullWidth: sn,
	zeroRight: on
};
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/get-nonce/dist/es2015/index.js
var Cn = function() {
	if (typeof __webpack_nonce__ < "u") return __webpack_nonce__;
};
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/react-style-singleton/dist/es2015/singleton.js
function wn() {
	if (!document) return null;
	var e = document.createElement("style");
	e.type = "text/css";
	var t = Cn();
	return t && e.setAttribute("nonce", t), e;
}
function Tn(e, t) {
	e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function En(e) {
	(document.head || document.getElementsByTagName("head")[0]).appendChild(e);
}
var Dn = function() {
	var e = 0, t = null;
	return {
		add: function(n) {
			e == 0 && (t = wn()) && (Tn(t, n), En(t)), e++;
		},
		remove: function() {
			e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
		}
	};
}, On = function() {
	var e = Dn();
	return function(t, n) {
		T.useEffect(function() {
			return e.add(t), function() {
				e.remove();
			};
		}, [t && n]);
	};
}, kn = function() {
	var e = On();
	return function(t) {
		var n = t.styles, r = t.dynamic;
		return e(n, r), null;
	};
}, An = {
	left: 0,
	top: 0,
	right: 0,
	gap: 0
}, jn = function(e) {
	return parseInt(e || "", 10) || 0;
}, Mn = function(e) {
	var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], i = t[e === "padding" ? "paddingRight" : "marginRight"];
	return [
		jn(n),
		jn(r),
		jn(i)
	];
}, Nn = function(e) {
	if (e === void 0 && (e = "margin"), typeof window > "u") return An;
	var t = Mn(e), n = document.documentElement.clientWidth, r = window.innerWidth;
	return {
		left: t[0],
		top: t[1],
		right: t[2],
		gap: Math.max(0, r - n + t[2] - t[0])
	};
}, Pn = kn(), Fn = "data-scroll-locked", In = function(e, t, n, r) {
	var i = e.left, a = e.top, o = e.right, s = e.gap;
	return n === void 0 && (n = "margin"), `
  .${cn} {
   overflow: hidden ${r};
   padding-right: ${s}px ${r};
  }
  body[${Fn}] {
    overflow: hidden ${r};
    overscroll-behavior: contain;
    ${[
		t && `position: relative ${r};`,
		n === "margin" && `
    padding-left: ${i}px;
    padding-top: ${a}px;
    padding-right: ${o}px;
    margin-left:0;
    margin-top:0;
    margin-right: ${s}px ${r};
    `,
		n === "padding" && `padding-right: ${s}px ${r};`
	].filter(Boolean).join("")}
  }
  
  .${on} {
    right: ${s}px ${r};
  }
  
  .${sn} {
    margin-right: ${s}px ${r};
  }
  
  .${on} .${on} {
    right: 0 ${r};
  }
  
  .${sn} .${sn} {
    margin-right: 0 ${r};
  }
  
  body[${Fn}] {
    ${ln}: ${s}px;
  }
`;
}, Ln = function() {
	var e = parseInt(document.body.getAttribute("data-scroll-locked") || "0", 10);
	return isFinite(e) ? e : 0;
}, Rn = function() {
	T.useEffect(function() {
		return document.body.setAttribute(Fn, (Ln() + 1).toString()), function() {
			var e = Ln() - 1;
			e <= 0 ? document.body.removeAttribute(Fn) : document.body.setAttribute(Fn, e.toString());
		};
	}, []);
}, zn = function(e) {
	var t = e.noRelative, n = e.noImportant, r = e.gapMode, i = r === void 0 ? "margin" : r;
	Rn();
	var a = T.useMemo(function() {
		return Nn(i);
	}, [i]);
	return T.createElement(Pn, { styles: In(a, !t, i, n ? "" : "!important") });
}, k = !1;
if (typeof window < "u") try {
	var Bn = Object.defineProperty({}, "passive", { get: function() {
		return k = !0, !0;
	} });
	window.addEventListener("test", Bn, Bn), window.removeEventListener("test", Bn, Bn);
} catch {
	k = !1;
}
var Vn = k ? { passive: !1 } : !1, Hn = function(e) {
	return e.tagName === "TEXTAREA";
}, Un = function(e, t) {
	if (!(e instanceof Element)) return !1;
	var n = window.getComputedStyle(e);
	return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !Hn(e) && n[t] === "visible");
}, Wn = function(e) {
	return Un(e, "overflowY");
}, Gn = function(e) {
	return Un(e, "overflowX");
}, Kn = function(e, t) {
	var n = t.ownerDocument, r = t;
	do {
		if (typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host), Yn(e, r)) {
			var i = Xn(e, r);
			if (i[1] > i[2]) return !0;
		}
		r = r.parentNode;
	} while (r && r !== n.body);
	return !1;
}, qn = function(e) {
	return [
		e.scrollTop,
		e.scrollHeight,
		e.clientHeight
	];
}, Jn = function(e) {
	return [
		e.scrollLeft,
		e.scrollWidth,
		e.clientWidth
	];
}, Yn = function(e, t) {
	return e === "v" ? Wn(t) : Gn(t);
}, Xn = function(e, t) {
	return e === "v" ? qn(t) : Jn(t);
}, Zn = function(e, t) {
	return e === "h" && t === "rtl" ? -1 : 1;
}, Qn = function(e, t, n, r, i) {
	var a = Zn(e, window.getComputedStyle(t).direction), o = a * r, s = n.target, c = t.contains(s), l = !1, u = o > 0, d = 0, f = 0;
	do {
		if (!s) break;
		var p = Xn(e, s), m = p[0], h = p[1] - p[2] - a * m;
		(m || h) && Yn(e, s) && (d += h, f += m);
		var g = s.parentNode;
		s = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
	} while (!c && s !== document.body || c && (t.contains(s) || t === s));
	return (u && (i && Math.abs(d) < 1 || !i && o > d) || !u && (i && Math.abs(f) < 1 || !i && -o > f)) && (l = !0), l;
}, $n = function(e) {
	return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, er = function(e) {
	return [e.deltaX, e.deltaY];
}, tr = function(e) {
	return e && "current" in e ? e.current : e;
}, nr = function(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}, rr = function(e) {
	return `
  .block-interactivity-${e} {pointer-events: none;}
  .allow-interactivity-${e} {pointer-events: all;}
`;
}, ir = 0, ar = [];
function or(e) {
	var t = T.useRef([]), n = T.useRef([0, 0]), r = T.useRef(), i = T.useState(ir++)[0], a = T.useState(kn)[0], o = T.useRef(e);
	T.useEffect(function() {
		o.current = e;
	}, [e]), T.useEffect(function() {
		if (e.inert) {
			document.body.classList.add(`block-interactivity-${i}`);
			var t = an([e.lockRef.current], (e.shards || []).map(tr), !0).filter(Boolean);
			return t.forEach(function(e) {
				return e.classList.add(`allow-interactivity-${i}`);
			}), function() {
				document.body.classList.remove(`block-interactivity-${i}`), t.forEach(function(e) {
					return e.classList.remove(`allow-interactivity-${i}`);
				});
			};
		}
	}, [
		e.inert,
		e.lockRef.current,
		e.shards
	]);
	var s = T.useCallback(function(e, t) {
		if ("touches" in e && e.touches.length === 2 || e.type === "wheel" && e.ctrlKey) return !o.current.allowPinchZoom;
		var i = $n(e), a = n.current, s = "deltaX" in e ? e.deltaX : a[0] - i[0], c = "deltaY" in e ? e.deltaY : a[1] - i[1], l, u = e.target, d = Math.abs(s) > Math.abs(c) ? "h" : "v";
		if ("touches" in e && d === "h" && u.type === "range") return !1;
		var f = window.getSelection(), p = f && f.anchorNode;
		if (p && (p === u || p.contains(u))) return !1;
		var m = Kn(d, u);
		if (!m) return !0;
		if (m ? l = d : (l = d === "v" ? "h" : "v", m = Kn(d, u)), !m) return !1;
		if (!r.current && "changedTouches" in e && (s || c) && (r.current = l), !l) return !0;
		var h = r.current || l;
		return Qn(h, t, e, h === "h" ? s : c, !0);
	}, []), c = T.useCallback(function(e) {
		var n = e;
		if (ar.length && ar[ar.length - 1] === a) {
			var r = "deltaY" in n ? er(n) : $n(n), i = t.current.filter(function(e) {
				return e.name === n.type && (e.target === n.target || n.target === e.shadowParent) && nr(e.delta, r);
			})[0];
			if (i && i.should) n.cancelable && n.preventDefault();
			else if (!i) {
				var c = (o.current.shards || []).map(tr).filter(Boolean).filter(function(e) {
					return e.contains(n.target);
				});
				(c.length > 0 ? s(n, c[0]) : !o.current.noIsolation) && n.cancelable && n.preventDefault();
			}
		}
	}, []), l = T.useCallback(function(e, n, r, i) {
		var a = {
			name: e,
			delta: n,
			target: r,
			should: i,
			shadowParent: sr(r)
		};
		t.current.push(a), setTimeout(function() {
			t.current = t.current.filter(function(e) {
				return e !== a;
			});
		}, 1);
	}, []), u = T.useCallback(function(e) {
		n.current = $n(e), r.current = void 0;
	}, []), d = T.useCallback(function(t) {
		l(t.type, er(t), t.target, s(t, e.lockRef.current));
	}, []), f = T.useCallback(function(t) {
		l(t.type, $n(t), t.target, s(t, e.lockRef.current));
	}, []);
	T.useEffect(function() {
		return ar.push(a), e.setCallbacks({
			onScrollCapture: d,
			onWheelCapture: d,
			onTouchMoveCapture: f
		}), document.addEventListener("wheel", c, Vn), document.addEventListener("touchmove", c, Vn), document.addEventListener("touchstart", u, Vn), function() {
			ar = ar.filter(function(e) {
				return e !== a;
			}), document.removeEventListener("wheel", c, Vn), document.removeEventListener("touchmove", c, Vn), document.removeEventListener("touchstart", u, Vn);
		};
	}, []);
	var p = e.removeScrollBar, m = e.inert;
	return T.createElement(T.Fragment, null, m ? T.createElement(a, { styles: rr(i) }) : null, p ? T.createElement(zn, {
		noRelative: e.noRelative,
		gapMode: e.gapMode
	}) : null);
}
function sr(e) {
	for (var t = null; e !== null;) e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
	return t;
}
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/react-remove-scroll/dist/es2015/sidecar.js
var cr = yn(bn, or), lr = T.forwardRef(function(e, t) {
	return T.createElement(Sn, nn({}, e, {
		ref: t,
		sideCar: cr
	}));
});
lr.classNames = Sn.classNames;
// ../../../../3dafa372fddf/hans-crafted-stories/node_modules/aria-hidden/dist/es2015/index.js
var ur = function(e) {
	return typeof document > "u" ? null : (Array.isArray(e) ? e[0] : e).ownerDocument.body;
}, dr = /* @__PURE__ */ new WeakMap(), fr = /* @__PURE__ */ new WeakMap(), pr = {}, mr = 0, hr = function(e) {
	return e && (e.host || hr(e.parentNode));
}, gr = function(e, t) {
	return t.map(function(t) {
		if (e.contains(t)) return t;
		var n = hr(t);
		return n && e.contains(n) ? n : (console.error("aria-hidden", t, "in not contained inside", e, ". Doing nothing"), null);
	}).filter(function(e) {
		return !!e;
	});
}, _r = function(e, t, n, r) {
	var i = gr(t, Array.isArray(e) ? e : [e]);
	pr[n] || (pr[n] = /* @__PURE__ */ new WeakMap());
	var a = pr[n], o = [], s = /* @__PURE__ */ new Set(), c = new Set(i), l = function(e) {
		e && !s.has(e) && (s.add(e), l(e.parentNode));
	};
	i.forEach(l);
	var u = function(e) {
		e && !c.has(e) && Array.prototype.forEach.call(e.children, function(e) {
			if (s.has(e)) u(e);
			else try {
				var t = e.getAttribute(r), i = t !== null && t !== "false", c = (dr.get(e) || 0) + 1, l = (a.get(e) || 0) + 1;
				dr.set(e, c), a.set(e, l), o.push(e), c === 1 && i && fr.set(e, !0), l === 1 && e.setAttribute(n, "true"), i || e.setAttribute(r, "true");
			} catch (t) {
				console.error("aria-hidden: cannot operate on ", e, t);
			}
		});
	};
	return u(t), s.clear(), mr++, function() {
		o.forEach(function(e) {
			var t = dr.get(e) - 1, i = a.get(e) - 1;
			dr.set(e, t), a.set(e, i), t || (fr.has(e) || e.removeAttribute(r), fr.delete(e)), i || e.removeAttribute(n);
		}), mr--, mr || (dr = /* @__PURE__ */ new WeakMap(), dr = /* @__PURE__ */ new WeakMap(), fr = /* @__PURE__ */ new WeakMap(), pr = {});
	};
}, vr = function(e, t, n) {
	n === void 0 && (n = "data-aria-hidden");
	var r = Array.from(Array.isArray(e) ? e : [e]), i = t || ur(e);
	return i ? (r.push.apply(r, Array.from(i.querySelectorAll("[aria-live], script"))), _r(r, i, n, "aria-hidden")) : function() {
		return null;
	};
}, yr = "Dialog", [br, xr] = Ue(yr), [Sr, Cr] = br(yr), wr = (e) => {
	let { __scopeDialog: t, children: n, open: r, defaultOpen: i, onOpenChange: a, modal: o = !0 } = e, s = T.useRef(null), c = T.useRef(null), [l, u] = Xe({
		prop: r,
		defaultProp: i ?? !1,
		onChange: a,
		caller: yr
	});
	return /* @__PURE__ */ (0, E.jsx)(Sr, {
		scope: t,
		triggerRef: s,
		contentRef: c,
		contentId: Je(),
		titleId: Je(),
		descriptionId: Je(),
		open: l,
		onOpenChange: u,
		onOpenToggle: T.useCallback(() => u((e) => !e), [u]),
		modal: o,
		children: n
	});
};
wr.displayName = yr;
var Tr = "DialogTrigger", Er = T.forwardRef((e, t) => {
	let { __scopeDialog: n, ...r } = e, i = Cr(Tr, n), a = Be(t, i.triggerRef);
	return /* @__PURE__ */ (0, E.jsx)(ft.button, {
		type: "button",
		"aria-haspopup": "dialog",
		"aria-expanded": i.open,
		"aria-controls": i.open ? i.contentId : void 0,
		"data-state": Kr(i.open),
		...r,
		ref: a,
		onClick: Le(e.onClick, i.onOpenToggle)
	});
});
Er.displayName = Tr;
var Dr = "DialogPortal", [Or, kr] = br(Dr, { forceMount: void 0 }), Ar = (e) => {
	let { __scopeDialog: t, forceMount: n, children: r, container: i } = e, a = Cr(Dr, t);
	return /* @__PURE__ */ (0, E.jsx)(Or, {
		scope: t,
		forceMount: n,
		children: T.Children.map(r, (e) => /* @__PURE__ */ (0, E.jsx)(qt, {
			present: n || a.open,
			children: /* @__PURE__ */ (0, E.jsx)(Gt, {
				asChild: !0,
				container: i,
				children: e
			})
		}))
	});
};
Ar.displayName = Dr;
var jr = "DialogOverlay", Mr = T.forwardRef((e, t) => {
	let n = kr(jr, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = Cr(jr, e.__scopeDialog);
	return a.modal ? /* @__PURE__ */ (0, E.jsx)(qt, {
		present: r || a.open,
		children: /* @__PURE__ */ (0, E.jsx)(Pr, {
			...i,
			ref: t
		})
	}) : null;
});
Mr.displayName = jr;
var Nr = /* @__PURE__ */ et("DialogOverlay.RemoveScroll"), Pr = T.forwardRef((e, t) => {
	let { __scopeDialog: n, ...r } = e, i = Cr(jr, n);
	return /* @__PURE__ */ (0, E.jsx)(lr, {
		as: Nr,
		allowPinchZoom: !0,
		shards: [i.contentRef],
		children: /* @__PURE__ */ (0, E.jsx)(ft.div, {
			"data-state": Kr(i.open),
			...r,
			ref: t,
			style: {
				pointerEvents: "auto",
				...r.style
			}
		})
	});
}), Fr = "DialogContent", Ir = T.forwardRef((e, t) => {
	let n = kr(Fr, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = Cr(Fr, e.__scopeDialog);
	return /* @__PURE__ */ (0, E.jsx)(qt, {
		present: r || a.open,
		children: a.modal ? /* @__PURE__ */ (0, E.jsx)(Lr, {
			...i,
			ref: t
		}) : /* @__PURE__ */ (0, E.jsx)(Rr, {
			...i,
			ref: t
		})
	});
});
Ir.displayName = Fr;
var Lr = T.forwardRef((e, t) => {
	let n = Cr(Fr, e.__scopeDialog), r = T.useRef(null), i = Be(t, n.contentRef, r);
	return T.useEffect(() => {
		let e = r.current;
		if (e) return vr(e);
	}, []), /* @__PURE__ */ (0, E.jsx)(zr, {
		...e,
		ref: i,
		trapFocus: n.open,
		disableOutsidePointerEvents: n.open,
		onCloseAutoFocus: Le(e.onCloseAutoFocus, (e) => {
			e.preventDefault(), n.triggerRef.current?.focus();
		}),
		onPointerDownOutside: Le(e.onPointerDownOutside, (e) => {
			let t = e.detail.originalEvent, n = t.button === 0 && t.ctrlKey === !0;
			(t.button === 2 || n) && e.preventDefault();
		}),
		onFocusOutside: Le(e.onFocusOutside, (e) => e.preventDefault())
	});
}), Rr = T.forwardRef((e, t) => {
	let n = Cr(Fr, e.__scopeDialog), r = T.useRef(!1), i = T.useRef(!1);
	return /* @__PURE__ */ (0, E.jsx)(zr, {
		...e,
		ref: t,
		trapFocus: !1,
		disableOutsidePointerEvents: !1,
		onCloseAutoFocus: (t) => {
			e.onCloseAutoFocus?.(t), t.defaultPrevented || (r.current || n.triggerRef.current?.focus(), t.preventDefault()), r.current = !1, i.current = !1;
		},
		onInteractOutside: (t) => {
			e.onInteractOutside?.(t), t.defaultPrevented || (r.current = !0, t.detail.originalEvent.type === "pointerdown" && (i.current = !0));
			let a = t.target;
			n.triggerRef.current?.contains(a) && t.preventDefault(), t.detail.originalEvent.type === "focusin" && i.current && t.preventDefault();
		}
	});
}), zr = T.forwardRef((e, t) => {
	let { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: i, onCloseAutoFocus: a, ...o } = e, s = Cr(Fr, n), c = T.useRef(null), l = Be(t, c);
	return en(), /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [/* @__PURE__ */ (0, E.jsx)(Mt, {
		asChild: !0,
		loop: !0,
		trapped: r,
		onMountAutoFocus: i,
		onUnmountAutoFocus: a,
		children: /* @__PURE__ */ (0, E.jsx)(St, {
			role: "dialog",
			id: s.contentId,
			"aria-describedby": s.descriptionId,
			"aria-labelledby": s.titleId,
			"data-state": Kr(s.open),
			...o,
			ref: l,
			onDismiss: () => s.onOpenChange(!1)
		})
	}), /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [/* @__PURE__ */ (0, E.jsx)(Xr, { titleId: s.titleId }), /* @__PURE__ */ (0, E.jsx)(Qr, {
		contentRef: c,
		descriptionId: s.descriptionId
	})] })] });
}), Br = "DialogTitle", Vr = T.forwardRef((e, t) => {
	let { __scopeDialog: n, ...r } = e, i = Cr(Br, n);
	return /* @__PURE__ */ (0, E.jsx)(ft.h2, {
		id: i.titleId,
		...r,
		ref: t
	});
});
Vr.displayName = Br;
var Hr = "DialogDescription", Ur = T.forwardRef((e, t) => {
	let { __scopeDialog: n, ...r } = e, i = Cr(Hr, n);
	return /* @__PURE__ */ (0, E.jsx)(ft.p, {
		id: i.descriptionId,
		...r,
		ref: t
	});
});
Ur.displayName = Hr;
var Wr = "DialogClose", Gr = T.forwardRef((e, t) => {
	let { __scopeDialog: n, ...r } = e, i = Cr(Wr, n);
	return /* @__PURE__ */ (0, E.jsx)(ft.button, {
		type: "button",
		...r,
		ref: t,
		onClick: Le(e.onClick, () => i.onOpenChange(!1))
	});
});
Gr.displayName = Wr;
function Kr(e) {
	return e ? "open" : "closed";
}
var qr = "DialogTitleWarning", [Jr, Yr] = He(qr, {
	contentName: Fr,
	titleName: Br,
	docsSlug: "dialog"
}), Xr = ({ titleId: e }) => {
	let t = Yr(qr), n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
	return T.useEffect(() => {
		e && (document.getElementById(e) || console.error(n));
	}, [n, e]), null;
}, Zr = "DialogDescriptionWarning", Qr = ({ contentRef: e, descriptionId: t }) => {
	let n = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${Yr(Zr).contentName}}.`;
	return T.useEffect(() => {
		let r = e.current?.getAttribute("aria-describedby");
		t && r && (document.getElementById(t) || console.warn(n));
	}, [
		n,
		e,
		t
	]), null;
}, $r = wr, ei = Ar, ti = Mr, ni = Ir, ri = Vr, ii = Ur, ai = Gr, oi = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), si = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), ci = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, li = (0, T.forwardRef)(({ color: e = "currentColor", size: t = 24, strokeWidth: n = 2, absoluteStrokeWidth: r, className: i = "", children: a, iconNode: o, ...s }, c) => (0, T.createElement)("svg", {
	ref: c,
	...ci,
	width: t,
	height: t,
	stroke: e,
	strokeWidth: r ? Number(n) * 24 / Number(t) : n,
	className: si("lucide", i),
	...s
}, [...o.map(([e, t]) => (0, T.createElement)(e, t)), ...Array.isArray(a) ? a : [a]])), ui = (e, t) => {
	let n = (0, T.forwardRef)(({ className: n, ...r }, i) => (0, T.createElement)(li, {
		ref: i,
		iconNode: t,
		className: si(`lucide-${oi(e)}`, n),
		...r
	}));
	return n.displayName = `${e}`, n;
}, di = ui("ArrowDown", [["path", {
	d: "M12 5v14",
	key: "s699le"
}], ["path", {
	d: "m19 12-7 7-7-7",
	key: "1idqje"
}]]), fi = ui("ArrowLeft", [["path", {
	d: "m12 19-7-7 7-7",
	key: "1l729n"
}], ["path", {
	d: "M19 12H5",
	key: "x3x0zl"
}]]), pi = ui("ArrowRight", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "m12 5 7 7-7 7",
	key: "xquz4c"
}]]), mi = ui("ArrowUpRight", [["path", {
	d: "M7 7h10v10",
	key: "1tivn9"
}], ["path", {
	d: "M7 17 17 7",
	key: "1vkiza"
}]]), hi = ui("Expand", [
	["path", {
		d: "m21 21-6-6m6 6v-4.8m0 4.8h-4.8",
		key: "1c15vz"
	}],
	["path", {
		d: "M3 16.2V21m0 0h4.8M3 21l6-6",
		key: "1fsnz2"
	}],
	["path", {
		d: "M21 7.8V3m0 0h-4.8M21 3l-6 6",
		key: "hawz9i"
	}],
	["path", {
		d: "M3 7.8V3m0 0h4.8M3 3l6 6",
		key: "u9ee12"
	}]
]), gi = ui("X", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]), _i = [
	{
		id: "blik",
		title: "De blik",
		intro: "Een open blik, warm licht en ruimte om even te blijven.",
		coverId: "een-open-blik"
	},
	{
		id: "toen-nu",
		title: "Toen en nu",
		intro: "Twee leeftijden vinden elkaar in een kleine spiegeling.",
		coverId: "toen-in-nu"
	},
	{
		id: "speelruimte",
		title: "Speelruimte",
		intro: "Naast de ernst mag ook iets onverwachts bestaan.",
		coverId: "een-beetje-te-veel"
	},
	{
		id: "volgorde",
		title: "Volgordestudies",
		intro: "Schetsen van de hoes, met voorgestelde trackvolgordes.",
		coverId: "volgordestudie-01"
	}
], vi = {
	"de-belofte": "iets-dichterbij",
	"de-beeldtaal": "de-bril-in-de-hand",
	"toen-en-nu": "vooruitkijken",
	"de-achterkant": "volgordestudie-02"
};
function A(e) {
	return e === null ? null : Object.prototype.hasOwnProperty.call(vi, e) ? vi[e] : e;
}
var j = (e) => `/images/music/iets-moois-story/${e}.webp`, M = (e) => `/images/music/iets-moois-story/${e}-320.webp`, N = [
	{
		id: "een-open-blik",
		src: j("een-open-blik"),
		thumbnail: M("een-open-blik"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon houdt een zonnebril met violet licht vast tegen een diepgroene achtergrond.",
		title: "Een open blik",
		caption: "Een open blik is het vertrekpunt. Diep groen en bordeaux geven de stem een rustige plek.",
		chapter: "blik",
		status: "Beeldstudie"
	},
	{
		id: "ruimte-om-te-blijven",
		src: j("ruimte-om-te-blijven"),
		thumbnail: M("ruimte-om-te-blijven"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon zit in een houten stoel, met een zonnebril op zijn schoot en veel groen om hem heen.",
		title: "Ruimte om te blijven",
		caption: "De stoel, de stof en de losse houding houden het beeld alledaags. Er hoeft even niets.",
		chapter: "blik",
		status: "Beeldstudie"
	},
	{
		id: "een-beetje-licht",
		src: j("een-beetje-licht"),
		thumbnail: M("een-beetje-licht"),
		width: 1254,
		height: 1254,
		alt: "Portret van Jowikroon in een zwart shirt, met warm licht langs zijn gezicht en een donkere achtergrond.",
		title: "Een beetje licht",
		caption: "Warm licht raakt één kant van het gezicht. De schaduw laat iets open.",
		chapter: "blik",
		status: "Beeldstudie"
	},
	{
		id: "iets-dichterbij",
		src: j("iets-dichterbij"),
		thumbnail: M("iets-dichterbij"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon leunt naar voren met de zonnebril in zijn hand, tegen een groene achtergrond.",
		title: "Iets dichterbij",
		caption: "Een kleine beweging naar voren maakt de afstand kleiner. Het beeld zoekt contact zonder alles uit te leggen.",
		chapter: "blik",
		status: "Beeldstudie"
	},
	{
		id: "de-bril-in-de-hand",
		src: j("de-bril-in-de-hand"),
		thumbnail: M("de-bril-in-de-hand"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon kijkt recht vooruit en houdt zijn zonnebril horizontaal voor zijn borst.",
		title: "De bril in de hand",
		caption: "De bril zakt, de blik blijft. Het violet verschijnt alleen als klein spoor.",
		chapter: "blik",
		status: "Beeldstudie"
	},
	{
		id: "toen-in-nu",
		src: j("toen-in-nu"),
		thumbnail: M("toen-in-nu"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon kijkt over zijn zonnebril; in één glas verschijnt het gezicht van een kind.",
		title: "Toen in nu",
		caption: "In de bril verschijnt een jongere blik. Wat je meedraagt, blijft soms onverwacht dichtbij.",
		chapter: "toen-nu",
		status: "Beeldstudie"
	},
	{
		id: "nu-in-toen",
		src: j("nu-in-toen"),
		thumbnail: M("nu-in-toen"),
		width: 1254,
		height: 1254,
		alt: "Een jongen in een groen jasje kijkt over zijn zonnebril, met een volwassen gezicht in de lens.",
		title: "Nu in toen",
		caption: "De spiegeling draait om: het kind kijkt terug, de volwassene reist mee. Twee leeftijden delen één beeld.",
		chapter: "toen-nu",
		status: "Beeldstudie"
	},
	{
		id: "wat-meereist",
		src: j("wat-meereist"),
		thumbnail: M("wat-meereist"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon draagt een zonnebril waarin een kind wordt weerspiegeld, met warm tegenlicht in zijn haar.",
		title: "Wat meereist",
		caption: "Eén lens bewaart een glimp van vroeger. Het warme licht houdt de twee tijden bij elkaar.",
		chapter: "toen-nu",
		status: "Beeldstudie"
	},
	{
		id: "vooruitkijken",
		src: j("vooruitkijken"),
		thumbnail: M("vooruitkijken"),
		width: 1254,
		height: 1254,
		alt: "Een jongen in een grijze coltrui kijkt omhoog; zijn zonnebril weerspiegelt een volwassen portret.",
		title: "Vooruitkijken",
		caption: "Een kind kijkt voorbij de rand van het beeld. In het glas is de toekomst al even aanwezig.",
		chapter: "toen-nu",
		status: "Beeldstudie"
	},
	{
		id: "dezelfde-glimlach",
		src: j("dezelfde-glimlach"),
		thumbnail: M("dezelfde-glimlach"),
		width: 1254,
		height: 1254,
		alt: "Een jongen in een bordeaux jasje tilt zijn zonnebril op, met een volwassen versie van hetzelfde gebaar in het glas.",
		title: "Dezelfde glimlach",
		caption: "Het gebaar keert terug, met jaren ertussen. Een kleine glimlach mag het verhaal openbreken.",
		chapter: "toen-nu",
		status: "Beeldstudie"
	},
	{
		id: "een-beetje-te-veel",
		src: j("een-beetje-te-veel"),
		thumbnail: M("een-beetje-te-veel"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon houdt een buitengewoon grote koffiekop vast, met een dun violet lijntje in het keramiek.",
		title: "Een beetje te veel",
		caption: "Een vertrouwde koffiekop krijgt een onmogelijke maat. Het kleine violette spoor blijft.",
		chapter: "speelruimte",
		status: "Beeldstudie"
	},
	{
		id: "een-lichte-tegenstem",
		src: j("een-lichte-tegenstem"),
		thumbnail: M("een-lichte-tegenstem"),
		width: 1254,
		height: 1254,
		alt: "Jowikroon heeft een grote paarse veer op zijn bordeaux jasje en houdt een zonnebril vast.",
		title: "Een lichte tegenstem",
		caption: "Een paarse veer doorbreekt de rustige lijnen. Er mag iets onverwachts naast de ernst bestaan.",
		chapter: "speelruimte",
		status: "Beeldstudie"
	},
	{
		id: "volgordestudie-01",
		src: j("volgordestudie-01"),
		thumbnail: M("volgordestudie-01"),
		width: 1254,
		height: 1254,
		alt: "Hoesstudie met vijf genummerde liedtitels naast Jowikroon, die naar zijn bril kijkt; gemarkeerd als voorgestelde volgorde.",
		title: "Volgordestudie · 01",
		caption: "Een schets van hoe de liedjes elkaar kunnen opvolgen. De afgebeelde volgorde is een voorstel.",
		chapter: "volgorde",
		status: "Volgordestudie"
	},
	{
		id: "volgordestudie-02",
		src: j("volgordestudie-02"),
		thumbnail: M("volgordestudie-02"),
		width: 1254,
		height: 1254,
		alt: "Hoesstudie met zeven liedtitels zonder nummers, naast een hand met zonnebril; gemarkeerd als voorgestelde volgorde.",
		title: "Volgordestudie · 02",
		caption: "Meer titels krijgen ruimte naast een alledaags gebaar. Ook deze volgorde is een ontwerpstudie.",
		chapter: "volgorde",
		status: "Volgordestudie"
	},
	{
		id: "volgordestudie-03",
		src: j("volgordestudie-03"),
		thumbnail: M("volgordestudie-03"),
		width: 1254,
		height: 1254,
		alt: "Hoesstudie met zes genummerde liedtitels, een hand en een zonnebril op schoot; gemarkeerd als voorgestelde volgorde.",
		title: "Volgordestudie · 03",
		caption: "Hand, bril en veel groen geven de titels adem. De afgebeelde tracklijst is nog een voorstel.",
		chapter: "volgorde",
		status: "Volgordestudie"
	}
], yi = N.find((e) => e.id === "toen-in-nu");
function bi({ image: e, onReady: t, onRetry: n }) {
	let [r, i] = (0, T.useState)("loading"), [a, o] = (0, T.useState)(0), s = (0, T.useRef)(null);
	return (0, T.useEffect)(() => {
		s.current?.complete && s.current.naturalWidth > 0 && (i("ready"), t());
	}, [t]), /* @__PURE__ */ (0, E.jsxs)("div", {
		className: "avs-artwork",
		"data-state": r,
		"aria-busy": r === "loading",
		children: [
			/* @__PURE__ */ (0, E.jsx)("div", {
				className: "avs-artwork__preview",
				style: { backgroundImage: `url(${e.thumbnail})` },
				"aria-hidden": "true"
			}),
			r !== "error" && /* @__PURE__ */ (0, E.jsx)("img", {
				ref: s,
				src: `${e.src}${a ? `?retry=${a}` : ""}`,
				width: e.width,
				height: e.height,
				alt: e.alt,
				decoding: "async",
				onLoad: () => {
					i("ready"), t();
				},
				onError: () => i("error")
			}),
			r === "loading" && /* @__PURE__ */ (0, E.jsx)("span", {
				className: "avs-artwork__status",
				role: "status",
				children: "Beeld laden…"
			}),
			r === "error" && /* @__PURE__ */ (0, E.jsxs)("div", {
				className: "avs-artwork__error",
				role: "status",
				children: [
					/* @__PURE__ */ (0, E.jsx)("p", { children: "Dit beeld kon niet laden." }),
					/* @__PURE__ */ (0, E.jsx)("button", {
						type: "button",
						onClick: () => {
							n(), o((e) => e + 1), i("loading");
						},
						children: "Opnieuw proberen"
					}),
					/* @__PURE__ */ (0, E.jsx)("span", { children: "Je kunt ook verder naar het volgende beeld." })
				]
			})
		]
	});
}
function xi() {
	let e = be(), t = Se(), n = A(new URLSearchParams(e.search).get("beeld")), r = N.findIndex((e) => e.id === n), i = N[r], a = !!i, o = _i.find((e) => e.id === i?.chapter), s = (0, T.useRef)(null), c = (0, T.useRef)(null), l = (0, T.useRef)(null), u = (0, T.useRef)(null), d = (0, T.useRef)(null), f = (0, T.useRef)(null), p = (0, T.useRef)(null), m = (0, T.useRef)([]), h = (0, T.useRef)(null), g = (0, T.useRef)(!1), _ = (0, T.useRef)(!1), [v, y] = (0, T.useState)(null), b = (0, T.useCallback)(() => y(i?.id ?? null), [i?.id]);
	function x(n, a, o = !1) {
		let l = N[n];
		if (!l) return;
		if (n === r) {
			o && f.current?.focus({ preventScroll: !0 }), d.current && (d.current.scrollTop = 0);
			return;
		}
		_.current = o;
		let u = new URLSearchParams(e.search);
		u.set("beeld", l.id), a && (s.current = a, c.current = a.getBoundingClientRect().top), t({
			pathname: e.pathname,
			search: u.toString(),
			hash: e.hash
		}, {
			replace: !!i,
			preventScrollReset: !0,
			state: i ? e.state : {
				...e.state,
				albumVisualStory: e.pathname
			}
		});
	}
	function ee() {
		if (!g.current) {
			if (g.current = !0, e.state?.albumVisualStory === e.pathname) t(-1);
			else {
				let n = new URLSearchParams(e.search);
				n.delete("beeld"), t({
					pathname: e.pathname,
					search: n.toString(),
					hash: e.hash
				}, {
					replace: !0,
					preventScrollReset: !0,
					state: e.state
				});
			}
		}
	}
	(0, T.useEffect)(() => {
		g.current = !1;
	}, [e.key]), (0, T.useEffect)(() => {
		if (!a) return;
		let e = window.history.scrollRestoration;
		return window.history.scrollRestoration = "manual", () => {
			window.history.scrollRestoration = e;
		};
	}, [a]), (0, T.useEffect)(() => {
		if (!i) return;
		let e = m.current[r];
		if (_.current &&= (f.current?.focus({ preventScroll: !0 }), !1), d.current && (d.current.scrollTop = 0), e && p.current) {
			let t = e.getBoundingClientRect(), n = p.current.getBoundingClientRect();
			t.left < n.left ? p.current.scrollLeft += t.left - n.left - 8 : t.right > n.right && (p.current.scrollLeft += t.right - n.right + 8);
		}
	}, [i, r]), (0, T.useEffect)(() => {
		if (!i || v !== i.id || document.visibilityState === "hidden" || navigator.connection?.saveData) return;
		let e = N[r + 1];
		if (e) {
			let t = new Image();
			t.src = e.src;
		}
	}, [
		i,
		r,
		v
	]);
	function S(e) {
		if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.target.closest("select, input, textarea, [contenteditable=true]")) return;
		let t = e.key === "ArrowLeft" ? Math.max(0, r - 1) : e.key === "ArrowRight" ? Math.min(N.length - 1, r + 1) : e.key === "Home" ? 0 : e.key === "End" ? N.length - 1 : void 0;
		t !== void 0 && (e.preventDefault(), t !== r && x(t, void 0, !!e.target.closest("[data-gallery-thumbnail]")));
	}
	function C(e) {
		let t = h.current;
		if (h.current = null, !t || e.changedTouches.length !== 1 || (window.visualViewport?.scale ?? 1) > 1) return;
		let n = e.changedTouches[0].clientX - t.x, i = e.changedTouches[0].clientY - t.y;
		Math.abs(n) > 60 && Math.abs(n) > Math.abs(i) * 1.5 && x(r + (n < 0 ? 1 : -1));
	}
	return /* @__PURE__ */ (0, E.jsxs)("section", {
		className: "avs-story",
		id: "album-world",
		"aria-labelledby": "avs-heading",
		children: [
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "ma-section-heading",
				children: [/* @__PURE__ */ (0, E.jsxs)("div", { children: [/* @__PURE__ */ (0, E.jsx)("p", {
					className: "ma-eyebrow",
					children: "IETS MOOIS / Het beeldverhaal"
				}), /* @__PURE__ */ (0, E.jsxs)("h2", {
					id: "avs-heading",
					children: [
						"Eén gezicht.",
						/* @__PURE__ */ (0, E.jsx)("br", {}),
						"Meer dan één verhaal."
					]
				})] }), /* @__PURE__ */ (0, E.jsx)("p", {
					className: "avs-intro",
					children: "Een open blik. Iets van toen. En ruimte voor wat jij erin ziet."
				})]
			}),
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "avs-story__layout",
				children: [/* @__PURE__ */ (0, E.jsxs)("button", {
					ref: l,
					type: "button",
					className: "avs-cover",
					"aria-haspopup": "dialog",
					onClick: (e) => x(N.indexOf(yi), e.currentTarget),
					children: [/* @__PURE__ */ (0, E.jsx)("img", {
						src: yi.src,
						width: yi.width,
						height: yi.height,
						alt: "Jowikroon kijkt over zijn bril. In het glas kijkt een kind terug.",
						loading: "lazy",
						decoding: "async"
					}), /* @__PURE__ */ (0, E.jsxs)("span", {
						className: "avs-cover__action",
						children: [/* @__PURE__ */ (0, E.jsxs)("span", { children: [/* @__PURE__ */ (0, E.jsx)(hi, {
							size: 17,
							"aria-hidden": "true"
						}), "Open het beeldverhaal"] }), /* @__PURE__ */ (0, E.jsxs)("span", { children: [
							N.length,
							" beelden ",
							/* @__PURE__ */ (0, E.jsx)(mi, {
								size: 19,
								"aria-hidden": "true"
							})
						] })]
					})]
				}), /* @__PURE__ */ (0, E.jsxs)("div", {
					className: "avs-entry",
					children: [
						/* @__PURE__ */ (0, E.jsxs)("div", {
							className: "avs-entry__intro",
							children: [/* @__PURE__ */ (0, E.jsx)("p", {
								className: "ma-eyebrow",
								children: "Begin waar je iets herkent"
							}), /* @__PURE__ */ (0, E.jsx)("p", { children: "De blik, het licht, de kleine afwijking. Vier ingangen in de wereld van de plaat." })]
						}),
						/* @__PURE__ */ (0, E.jsx)("div", {
							className: "avs-lasers",
							role: "group",
							"aria-label": "Kies een ingang in het beeldverhaal",
							children: _i.map((e, t) => {
								let n = N.find((t) => t.id === e.coverId), r = N.filter((t) => t.chapter === e.id).length;
								return /* @__PURE__ */ (0, E.jsxs)("button", {
									type: "button",
									className: "avs-laser",
									"aria-haspopup": "dialog",
									onClick: (e) => x(N.indexOf(n), e.currentTarget),
									children: [
										/* @__PURE__ */ (0, E.jsx)("img", {
											src: n.thumbnail,
											width: 64,
											height: 64,
											alt: "",
											loading: "lazy",
											decoding: "async"
										}),
										/* @__PURE__ */ (0, E.jsxs)("span", {
											className: "avs-laser__copy",
											children: [/* @__PURE__ */ (0, E.jsxs)("span", {
												className: "avs-laser__index",
												children: [
													"0",
													t + 1,
													" / ",
													r,
													" beelden"
												]
											}), /* @__PURE__ */ (0, E.jsx)("strong", { children: e.title })]
										}),
										/* @__PURE__ */ (0, E.jsx)(mi, {
											size: 20,
											className: "avs-laser__arrow",
											"aria-hidden": "true"
										})
									]
								}, e.id);
							})
						}),
						/* @__PURE__ */ (0, E.jsxs)("a", {
							href: "#album-origin",
							className: "avs-reading-link",
							children: ["Liever eerst de woorden? ", /* @__PURE__ */ (0, E.jsxs)("span", { children: ["Lees het verhaal ", /* @__PURE__ */ (0, E.jsx)(di, {
								size: 15,
								"aria-hidden": "true"
							})] })]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, E.jsx)($r, {
				open: !!i,
				onOpenChange: (e) => {
					e || ee();
				},
				children: /* @__PURE__ */ (0, E.jsxs)(ei, { children: [/* @__PURE__ */ (0, E.jsx)(ti, { className: "avs-backdrop" }), /* @__PURE__ */ (0, E.jsxs)(ni, {
					className: "avs-dialog",
					lang: "nl",
					onKeyDown: S,
					onOpenAutoFocus: (e) => {
						e.preventDefault(), u.current?.focus();
					},
					onCloseAutoFocus: (e) => {
						e.preventDefault(), s.current?.isConnected ? (s.current.focus({ preventScroll: !0 }), c.current !== null && window.scrollBy({
							top: s.current.getBoundingClientRect().top - c.current,
							behavior: "instant"
						})) : l.current?.focus();
					},
					children: [/* @__PURE__ */ (0, E.jsxs)("header", {
						className: "avs-dialog__header",
						children: [/* @__PURE__ */ (0, E.jsxs)("div", { children: [/* @__PURE__ */ (0, E.jsx)(ri, { children: "IETS MOOIS" }), /* @__PURE__ */ (0, E.jsx)(ii, { children: "Het album in beelden" })] }), /* @__PURE__ */ (0, E.jsxs)(ai, {
							ref: u,
							type: "button",
							className: "avs-close",
							"aria-label": "Sluit het beeldverhaal",
							children: [/* @__PURE__ */ (0, E.jsx)("span", { children: "Sluiten" }), /* @__PURE__ */ (0, E.jsx)(gi, {
								size: 21,
								"aria-hidden": "true"
							})]
						})]
					}), i && /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [
						/* @__PURE__ */ (0, E.jsxs)("div", {
							className: "avs-dialog__body",
							ref: d,
							children: [/* @__PURE__ */ (0, E.jsxs)("figure", {
								className: "avs-figure",
								ref: f,
								tabIndex: -1,
								"aria-label": `Beeld ${r + 1} van ${N.length}: ${i.title}`,
								onTouchStart: (e) => {
									h.current = e.touches.length === 1 ? {
										x: e.touches[0].clientX,
										y: e.touches[0].clientY
									} : null;
								},
								onTouchEnd: C,
								onTouchCancel: () => {
									h.current = null;
								},
								children: [/* @__PURE__ */ (0, E.jsx)(bi, {
									image: i,
									onReady: b,
									onRetry: () => f.current?.focus({ preventScroll: !0 })
								}, i.id), /* @__PURE__ */ (0, E.jsxs)("figcaption", {
									className: "avs-caption",
									children: [
										/* @__PURE__ */ (0, E.jsxs)("span", {
											className: "avs-caption__chapter",
											children: [o?.title, i.status === "Volgordestudie" && " / Voorgestelde volgorde"]
										}),
										/* @__PURE__ */ (0, E.jsx)("h3", { children: i.title }),
										/* @__PURE__ */ (0, E.jsx)("p", { children: i.caption })
									]
								})]
							}), /* @__PURE__ */ (0, E.jsxs)("div", {
								className: "avs-dialog__rail",
								children: [/* @__PURE__ */ (0, E.jsxs)("div", {
									className: "avs-chapter-select",
									children: [/* @__PURE__ */ (0, E.jsx)("label", {
										htmlFor: "avs-chapter",
										children: "Ontdek een ander hoofdstuk"
									}), /* @__PURE__ */ (0, E.jsx)("select", {
										id: "avs-chapter",
										value: i.chapter,
										onChange: (e) => {
											x(N.findIndex((t) => t.chapter === e.target.value), void 0, !0);
										},
										children: _i.map((e) => /* @__PURE__ */ (0, E.jsx)("option", {
											value: e.id,
											children: e.title
										}, e.id))
									})]
								}), /* @__PURE__ */ (0, E.jsxs)("div", {
									className: "avs-thumbnail-area",
									children: [/* @__PURE__ */ (0, E.jsxs)("p", { children: [
										"Alle ",
										N.length,
										" beelden"
									] }), /* @__PURE__ */ (0, E.jsx)("div", {
										className: "avs-thumbnails",
										ref: p,
										role: "group",
										"aria-label": `Kies uit alle ${N.length} beelden`,
										children: N.map((e, t) => /* @__PURE__ */ (0, E.jsxs)("button", {
											type: "button",
											"data-gallery-thumbnail": e.id,
											ref: (e) => {
												m.current[t] = e;
											},
											tabIndex: t === r ? 0 : -1,
											"aria-label": `Beeld ${t + 1}: ${e.title}`,
											"aria-current": t === r ? "true" : void 0,
											onClick: () => x(t, void 0, !0),
											children: [/* @__PURE__ */ (0, E.jsx)("img", {
												src: e.thumbnail,
												width: 60,
												height: 60,
												alt: "",
												loading: "lazy",
												decoding: "async"
											}), /* @__PURE__ */ (0, E.jsx)("span", {
												"aria-hidden": "true",
												children: String(t + 1).padStart(2, "0")
											})]
										}, e.id))
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, E.jsxs)("footer", {
							className: "avs-controls",
							children: [
								/* @__PURE__ */ (0, E.jsxs)("button", {
									type: "button",
									onClick: () => x(r - 1),
									"aria-disabled": r === 0,
									"aria-label": "Vorig beeld",
									children: [/* @__PURE__ */ (0, E.jsx)(fi, {
										size: 20,
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, E.jsx)("span", { children: "Vorige" })]
								}),
								/* @__PURE__ */ (0, E.jsxs)("p", { children: [/* @__PURE__ */ (0, E.jsxs)("span", {
									className: "avs-counter",
									children: [String(r + 1).padStart(2, "0"), /* @__PURE__ */ (0, E.jsxs)("span", { children: [" / ", N.length] })]
								}), /* @__PURE__ */ (0, E.jsx)("span", {
									className: "avs-key-hint",
									children: "← → bladeren · Esc sluiten"
								})] }),
								/* @__PURE__ */ (0, E.jsxs)("button", {
									type: "button",
									onClick: () => x(r + 1),
									"aria-disabled": r === N.length - 1,
									"aria-label": "Volgend beeld",
									children: [/* @__PURE__ */ (0, E.jsx)("span", { children: "Volgende" }), /* @__PURE__ */ (0, E.jsx)(pi, {
										size: 20,
										"aria-hidden": "true"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, E.jsxs)("p", {
							className: "avs-sr-only",
							role: "status",
							"aria-live": "polite",
							"aria-atomic": "true",
							children: [
								"Beeld ",
								r + 1,
								" van ",
								N.length,
								": ",
								i.title,
								"."
							]
						})
					] })]
				})] })
			})
		]
	});
}
// src/lib/fontCss.ts
function Si(e, t) {
	if (typeof document > "u" || document.getElementById(e)) return;
	let n = document.createElement("link");
	n.id = e, n.rel = "stylesheet", n.href = t, document.head.appendChild(n);
}
var Ci = {
	writing: "https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=jetbrains-mono@400,500&display=swap",
	musicV2: "https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=general-sans@400,500,600,700&f[]=cabinet-grotesk@500,700,800&f[]=jetbrains-mono@400,500&display=swap",
	articleV2: "https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=jetbrains-mono@400,500&display=swap",
	writeCms: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600&display=swap"
}, wi = document.getElementById("root"), Ti = wi.dataset.entry || "/music/albums/iets-moois/brand";
if (wi.dataset.failFirst === "true") {
	let e = N.find((e) => e.id === "toen-in-nu"), t = e.src;
	e.src = "/gallery-review/intentional-missing-artwork.webp";
	let n = (r) => {
		r.target instanceof HTMLImageElement && r.target.closest(".avs-artwork") && r.target.src.includes("/gallery-review/intentional-missing-artwork.webp") && (e.src = t, document.removeEventListener("error", n, !0));
	};
	document.addEventListener("error", n, !0);
}
Si("fonts-albums", Ci.writing), (0, Ie.createRoot)(wi).render(/* @__PURE__ */ (0, E.jsx)(Ne, {
	initialEntries: [Ti],
	children: /* @__PURE__ */ (0, E.jsx)("article", {
		className: "ma-page ma-page--editorial ma-theme--warm",
		lang: "nl",
		children: /* @__PURE__ */ (0, E.jsxs)("div", {
			className: "ma-page__inner",
			children: [/* @__PURE__ */ (0, E.jsx)(xi, {}), /* @__PURE__ */ (0, E.jsx)("section", {
				id: "origin",
				style: {
					padding: "48px 0",
					color: "#b8c2ba"
				},
				children: /* @__PURE__ */ (0, E.jsx)("p", { children: "Geïsoleerde componentcontrole. De volledige verhaalpagina staat buiten deze testweergave." })
			})]
		})
	})
}));
