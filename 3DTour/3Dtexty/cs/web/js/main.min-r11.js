! function() {
    "use strict";

    function a(b, d) {
        function e(a, b) {
            return function() {
                return a.apply(b, arguments)
            }
        }
        var f;
        if (d = d || {}, this.trackingClick = !1, this.trackingClickStart = 0, this.targetElement = null, this.touchStartX = 0, this.touchStartY = 0, this.lastTouchIdentifier = 0, this.touchBoundary = d.touchBoundary || 10, this.layer = b, this.tapDelay = d.tapDelay || 200, this.tapTimeout = d.tapTimeout || 700, !a.notNeeded(b)) {
            for (var g = ["onMouse", "onClick", "onTouchStart", "onTouchMove", "onTouchEnd", "onTouchCancel"], h = this, i = 0, j = g.length; j > i; i++) h[g[i]] = e(h[g[i]], h);
            c && (b.addEventListener("mouseover", this.onMouse, !0), b.addEventListener("mousedown", this.onMouse, !0), b.addEventListener("mouseup", this.onMouse, !0)), b.addEventListener("click", this.onClick, !0), b.addEventListener("touchstart", this.onTouchStart, !1), b.addEventListener("touchmove", this.onTouchMove, !1), b.addEventListener("touchend", this.onTouchEnd, !1), b.addEventListener("touchcancel", this.onTouchCancel, !1), Event.prototype.stopImmediatePropagation || (b.removeEventListener = function(a, c, d) {
                var e = Node.prototype.removeEventListener;
                "click" === a ? e.call(b, a, c.hijacked || c, d) : e.call(b, a, c, d)
            }, b.addEventListener = function(a, c, d) {
                var e = Node.prototype.addEventListener;
                "click" === a ? e.call(b, a, c.hijacked || (c.hijacked = function(a) {
                    a.propagationStopped || c(a)
                }), d) : e.call(b, a, c, d)
            }), "function" == typeof b.onclick && (f = b.onclick, b.addEventListener("click", function(a) {
                f(a)
            }, !1), b.onclick = null)
        }
    }
    var b = navigator.userAgent.indexOf("Windows Phone") >= 0,
        c = navigator.userAgent.indexOf("Android") > 0 && !b,
        d = /iP(ad|hone|od)/.test(navigator.userAgent) && !b,
        e = d && /OS 4_\d(_\d)?/.test(navigator.userAgent),
        f = d && /OS [6-7]_\d/.test(navigator.userAgent),
        g = navigator.userAgent.indexOf("BB10") > 0;
    a.prototype.needsClick = function(a) {
        switch (a.nodeName.toLowerCase()) {
            case "button":
            case "select":
            case "textarea":
                if (a.disabled) return !0;
                break;
            case "input":
                if (d && "file" === a.type || a.disabled) return !0;
                break;
            case "label":
            case "iframe":
            case "video":
                return !0
        }
        return /\bneedsclick\b/.test(a.className)
    }, a.prototype.needsFocus = function(a) {
        switch (a.nodeName.toLowerCase()) {
            case "textarea":
                return !0;
            case "select":
                return !c;
            case "input":
                switch (a.type) {
                    case "button":
                    case "checkbox":
                    case "file":
                    case "image":
                    case "radio":
                    case "submit":
                        return !1
                }
                return !a.disabled && !a.readOnly;
            default:
                return /\bneedsfocus\b/.test(a.className)
        }
    }, a.prototype.sendClick = function(a, b) {
        var c, d;
        document.activeElement && document.activeElement !== a && document.activeElement.blur(), d = b.changedTouches[0], c = document.createEvent("MouseEvents"), c.initMouseEvent(this.determineEventType(a), !0, !0, window, 1, d.screenX, d.screenY, d.clientX, d.clientY, !1, !1, !1, !1, 0, null), c.forwardedTouchEvent = !0, a.dispatchEvent(c)
    }, a.prototype.determineEventType = function(a) {
        return c && "select" === a.tagName.toLowerCase() ? "mousedown" : "click"
    }, a.prototype.focus = function(a) {
        var b;
        d && a.setSelectionRange && 0 !== a.type.indexOf("date") && "time" !== a.type && "month" !== a.type ? (b = a.value.length, a.setSelectionRange(b, b)) : a.focus()
    }, a.prototype.updateScrollParent = function(a) {
        var b, c;
        if (b = a.fastClickScrollParent, !b || !b.contains(a)) {
            c = a;
            do {
                if (c.scrollHeight > c.offsetHeight) {
                    b = c, a.fastClickScrollParent = c;
                    break
                }
                c = c.parentElement
            } while (c)
        }
        b && (b.fastClickLastScrollTop = b.scrollTop)
    }, a.prototype.getTargetElementFromEventTarget = function(a) {
        return a.nodeType === Node.TEXT_NODE ? a.parentNode : a
    }, a.prototype.onTouchStart = function(a) {
        var b, c, f;
        if (a.targetTouches.length > 1) return !0;
        if (b = this.getTargetElementFromEventTarget(a.target), c = a.targetTouches[0], d) {
            if (f = window.getSelection(), f.rangeCount && !f.isCollapsed) return !0;
            if (!e) {
                if (c.identifier && c.identifier === this.lastTouchIdentifier) return a.preventDefault(), !1;
                this.lastTouchIdentifier = c.identifier, this.updateScrollParent(b)
            }
        }
        return this.trackingClick = !0, this.trackingClickStart = a.timeStamp, this.targetElement = b, this.touchStartX = c.pageX, this.touchStartY = c.pageY, a.timeStamp - this.lastClickTime < this.tapDelay && a.preventDefault(), !0
    }, a.prototype.touchHasMoved = function(a) {
        var b = a.changedTouches[0],
            c = this.touchBoundary;
        return Math.abs(b.pageX - this.touchStartX) > c || Math.abs(b.pageY - this.touchStartY) > c ? !0 : !1
    }, a.prototype.onTouchMove = function(a) {
        return this.trackingClick ? ((this.targetElement !== this.getTargetElementFromEventTarget(a.target) || this.touchHasMoved(a)) && (this.trackingClick = !1, this.targetElement = null), !0) : !0
    }, a.prototype.findControl = function(a) {
        return void 0 !== a.control ? a.control : a.htmlFor ? document.getElementById(a.htmlFor) : a.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea")
    }, a.prototype.onTouchEnd = function(a) {
        var b, g, h, i, j, k = this.targetElement;
        if (!this.trackingClick) return !0;
        if (a.timeStamp - this.lastClickTime < this.tapDelay) return this.cancelNextClick = !0, !0;
        if (a.timeStamp - this.trackingClickStart > this.tapTimeout) return !0;
        if (this.cancelNextClick = !1, this.lastClickTime = a.timeStamp, g = this.trackingClickStart, this.trackingClick = !1, this.trackingClickStart = 0, f && (j = a.changedTouches[0], k = document.elementFromPoint(j.pageX - window.pageXOffset, j.pageY - window.pageYOffset) || k, k.fastClickScrollParent = this.targetElement.fastClickScrollParent), h = k.tagName.toLowerCase(), "label" === h) {
            if (b = this.findControl(k)) {
                if (this.focus(k), c) return !1;
                k = b
            }
        } else if (this.needsFocus(k)) return a.timeStamp - g > 100 || d && window.top !== window && "input" === h ? (this.targetElement = null, !1) : (this.focus(k), this.sendClick(k, a), d && "select" === h || (this.targetElement = null, a.preventDefault()), !1);
        return d && !e && (i = k.fastClickScrollParent, i && i.fastClickLastScrollTop !== i.scrollTop) ? !0 : (this.needsClick(k) || (a.preventDefault(), this.sendClick(k, a)), !1)
    }, a.prototype.onTouchCancel = function() {
        this.trackingClick = !1, this.targetElement = null
    }, a.prototype.onMouse = function(a) {
        return this.targetElement ? a.forwardedTouchEvent ? !0 : a.cancelable && (!this.needsClick(this.targetElement) || this.cancelNextClick) ? (a.stopImmediatePropagation ? a.stopImmediatePropagation() : a.propagationStopped = !0, a.stopPropagation(), a.preventDefault(), !1) : !0 : !0
    }, a.prototype.onClick = function(a) {
        var b;
        return this.trackingClick ? (this.targetElement = null, this.trackingClick = !1, !0) : "submit" === a.target.type && 0 === a.detail ? !0 : (b = this.onMouse(a), b || (this.targetElement = null), b)
    }, a.prototype.destroy = function() {
        var a = this.layer;
        c && (a.removeEventListener("mouseover", this.onMouse, !0), a.removeEventListener("mousedown", this.onMouse, !0), a.removeEventListener("mouseup", this.onMouse, !0)), a.removeEventListener("click", this.onClick, !0), a.removeEventListener("touchstart", this.onTouchStart, !1), a.removeEventListener("touchmove", this.onTouchMove, !1), a.removeEventListener("touchend", this.onTouchEnd, !1), a.removeEventListener("touchcancel", this.onTouchCancel, !1)
    }, a.notNeeded = function(a) {
        var b, d, e, f;
        if ("undefined" == typeof window.ontouchstart) return !0;
        if (d = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1]) {
            if (!c) return !0;
            if (b = document.querySelector("meta[name=viewport]")) {
                if (-1 !== b.content.indexOf("user-scalable=no")) return !0;
                if (d > 31 && document.documentElement.scrollWidth <= window.outerWidth) return !0
            }
        }
        if (g && (e = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/), e[1] >= 10 && e[2] >= 3 && (b = document.querySelector("meta[name=viewport]")))) {
            if (-1 !== b.content.indexOf("user-scalable=no")) return !0;
            if (document.documentElement.scrollWidth <= window.outerWidth) return !0
        }
        return "none" === a.style.msTouchAction || "manipulation" === a.style.touchAction ? !0 : (f = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1], f >= 27 && (b = document.querySelector("meta[name=viewport]"), b && (-1 !== b.content.indexOf("user-scalable=no") || document.documentElement.scrollWidth <= window.outerWidth)) ? !0 : "none" === a.style.touchAction || "manipulation" === a.style.touchAction ? !0 : !1)
    }, a.attach = function(b, c) {
        return new a(b, c)
    }, "function" == typeof define && "object" == typeof define.amd && define.amd ? define(function() {
        return a
    }) : "undefined" != typeof module && module.exports ? (module.exports = a.attach, module.exports.FastClick = a) : window.FastClick = a
}(),
function(a) {
    var b = navigator.userAgent;
    a.HTMLPictureElement && /ecko/.test(b) && b.match(/rv\:(\d+)/) && RegExp.$1 < 41 && addEventListener("resize", function() {
        var b, c = document.createElement("source"),
            d = function(a) {
                var b, d, e = a.parentNode;
                "PICTURE" === e.nodeName.toUpperCase() ? (b = c.cloneNode(), e.insertBefore(b, e.firstElementChild), setTimeout(function() {
                    e.removeChild(b)
                })) : (!a._pfLastSize || a.offsetWidth > a._pfLastSize) && (a._pfLastSize = a.offsetWidth, d = a.sizes, a.sizes += ",100vw", setTimeout(function() {
                    a.sizes = d
                }))
            },
            e = function() {
                var a, b = document.querySelectorAll("picture > img, img[srcset][sizes]");
                for (a = 0; a < b.length; a++) d(b[a])
            },
            f = function() {
                clearTimeout(b), b = setTimeout(e, 99)
            },
            g = a.matchMedia && matchMedia("(orientation: landscape)"),
            h = function() {
                f(), g && g.addListener && g.addListener(f)
            };
        return c.srcset = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", /^[c|i]|d$/.test(document.readyState || "") ? h() : document.addEventListener("DOMContentLoaded", h), f
    }())
}(window),
function(a, b, c) {
    "use strict";

    function d(a) {
        return " " === a || "	" === a || "\n" === a || "\f" === a || "\r" === a
    }

    function e(b, c) {
        var d = new a.Image;
        return d.onerror = function() {
            z[b] = !1, aa()
        }, d.onload = function() {
            z[b] = 1 === d.width, aa()
        }, d.src = c, "pending"
    }

    function f() {
        L = !1, O = a.devicePixelRatio, M = {}, N = {}, s.DPR = O || 1, P.width = Math.max(a.innerWidth || 0, y.clientWidth), P.height = Math.max(a.innerHeight || 0, y.clientHeight), P.vw = P.width / 100, P.vh = P.height / 100, r = [P.height, P.width, O].join("-"), P.em = s.getEmValue(), P.rem = P.em
    }

    function g(a, b, c, d) {
        var e, f, g, h;
        return "saveData" === A.algorithm ? a > 2.7 ? h = c + 1 : (f = b - c, e = Math.pow(a - .6, 1.5), g = f * e, d && (g += .1 * e), h = a + g) : h = c > 1 ? Math.sqrt(a * b) : a, h > c
    }

    function h(a) {
        var b, c = s.getSet(a),
            d = !1;
        "pending" !== c && (d = r, c && (b = s.setRes(c), s.applySetCandidate(b, a))), a[s.ns].evaled = d
    }

    function i(a, b) {
        return a.res - b.res
    }

    function j(a, b, c) {
        var d;
        return !c && b && (c = a[s.ns].sets, c = c && c[c.length - 1]), d = k(b, c), d && (b = s.makeUrl(b), a[s.ns].curSrc = b, a[s.ns].curCan = d, d.res || _(d, d.set.sizes)), d
    }

    function k(a, b) {
        var c, d, e;
        if (a && b)
            for (e = s.parseSet(b), a = s.makeUrl(a), c = 0; c < e.length; c++)
                if (a === s.makeUrl(e[c].url)) {
                    d = e[c];
                    break
                }
        return d
    }

    function l(a, b) {
        var c, d, e, f, g = a.getElementsByTagName("source");
        for (c = 0, d = g.length; d > c; c++) e = g[c], e[s.ns] = !0, f = e.getAttribute("srcset"), f && b.push({
            srcset: f,
            media: e.getAttribute("media"),
            type: e.getAttribute("type"),
            sizes: e.getAttribute("sizes")
        })
    }

    function m(a, b) {
        function c(b) {
            var c, d = b.exec(a.substring(m));
            return d ? (c = d[0], m += c.length, c) : void 0
        }

        function e() {
            var a, c, d, e, f, i, j, k, l, m = !1,
                o = {};
            for (e = 0; e < h.length; e++) f = h[e], i = f[f.length - 1], j = f.substring(0, f.length - 1), k = parseInt(j, 10), l = parseFloat(j), W.test(j) && "w" === i ? ((a || c) && (m = !0), 0 === k ? m = !0 : a = k) : X.test(j) && "x" === i ? ((a || c || d) && (m = !0), 0 > l ? m = !0 : c = l) : W.test(j) && "h" === i ? ((d || c) && (m = !0), 0 === k ? m = !0 : d = k) : m = !0;
            m || (o.url = g, a && (o.w = a), c && (o.d = c), d && (o.h = d), d || c || a || (o.d = 1), 1 === o.d && (b.has1x = !0), o.set = b, n.push(o))
        }

        function f() {
            for (c(S), i = "", j = "in descriptor";;) {
                if (k = a.charAt(m), "in descriptor" === j)
                    if (d(k)) i && (h.push(i), i = "", j = "after descriptor");
                    else {
                        if ("," === k) return m += 1, i && h.push(i), void e();
                        if ("(" === k) i += k, j = "in parens";
                        else {
                            if ("" === k) return i && h.push(i), void e();
                            i += k
                        }
                    } else if ("in parens" === j)
                    if (")" === k) i += k, j = "in descriptor";
                    else {
                        if ("" === k) return h.push(i), void e();
                        i += k
                    } else if ("after descriptor" === j)
                    if (d(k));
                    else {
                        if ("" === k) return void e();
                        j = "in descriptor", m -= 1
                    }
                m += 1
            }
        }
        for (var g, h, i, j, k, l = a.length, m = 0, n = [];;) {
            if (c(T), m >= l) return n;
            g = c(U), h = [], "," === g.slice(-1) ? (g = g.replace(V, ""), e()) : f()
        }
    }

    function n(a) {
        function b(a) {
            function b() {
                f && (g.push(f), f = "")
            }

            function c() {
                g[0] && (h.push(g), g = [])
            }
            for (var e, f = "", g = [], h = [], i = 0, j = 0, k = !1;;) {
                if (e = a.charAt(j), "" === e) return b(), c(), h;
                if (k) {
                    if ("*" === e && "/" === a[j + 1]) {
                        k = !1, j += 2, b();
                        continue
                    }
                    j += 1
                } else {
                    if (d(e)) {
                        if (a.charAt(j - 1) && d(a.charAt(j - 1)) || !f) {
                            j += 1;
                            continue
                        }
                        if (0 === i) {
                            b(), j += 1;
                            continue
                        }
                        e = " "
                    } else if ("(" === e) i += 1;
                    else if (")" === e) i -= 1;
                    else {
                        if ("," === e) {
                            b(), c(), j += 1;
                            continue
                        }
                        if ("/" === e && "*" === a.charAt(j + 1)) {
                            k = !0, j += 2;
                            continue
                        }
                    }
                    f += e, j += 1
                }
            }
        }

        function c(a) {
            return k.test(a) && parseFloat(a) >= 0 ? !0 : l.test(a) ? !0 : "0" === a || "-0" === a || "+0" === a ? !0 : !1
        }
        var e, f, g, h, i, j, k = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i,
            l = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i;
        for (f = b(a), g = f.length, e = 0; g > e; e++)
            if (h = f[e], i = h[h.length - 1], c(i)) {
                if (j = i, h.pop(), 0 === h.length) return j;
                if (h = h.join(" "), s.matchesMedia(h)) return j
            }
        return "100vw"
    }
    b.createElement("picture");
    var o, p, q, r, s = {},
        t = function() {},
        u = b.createElement("img"),
        v = u.getAttribute,
        w = u.setAttribute,
        x = u.removeAttribute,
        y = b.documentElement,
        z = {},
        A = {
            algorithm: ""
        },
        B = "data-pfsrc",
        C = B + "set",
        D = navigator.userAgent,
        E = /rident/.test(D) || /ecko/.test(D) && D.match(/rv\:(\d+)/) && RegExp.$1 > 35,
        F = "currentSrc",
        G = /\s+\+?\d+(e\d+)?w/,
        H = /(\([^)]+\))?\s*(.+)/,
        I = a.picturefillCFG,
        J = "position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)",
        K = "font-size:100%!important;",
        L = !0,
        M = {},
        N = {},
        O = a.devicePixelRatio,
        P = {
            px: 1,
            "in": 96
        },
        Q = b.createElement("a"),
        R = !1,
        S = /^[ \t\n\r\u000c]+/,
        T = /^[, \t\n\r\u000c]+/,
        U = /^[^ \t\n\r\u000c]+/,
        V = /[,]+$/,
        W = /^\d+$/,
        X = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,
        Y = function(a, b, c, d) {
            a.addEventListener ? a.addEventListener(b, c, d || !1) : a.attachEvent && a.attachEvent("on" + b, c)
        },
        Z = function(a) {
            var b = {};
            return function(c) {
                return c in b || (b[c] = a(c)), b[c]
            }
        },
        $ = function() {
            var a = /^([\d\.]+)(em|vw|px)$/,
                b = function() {
                    for (var a = arguments, b = 0, c = a[0]; ++b in a;) c = c.replace(a[b], a[++b]);
                    return c
                },
                c = Z(function(a) {
                    return "return " + b((a || "").toLowerCase(), /\band\b/g, "&&", /,/g, "||", /min-([a-z-\s]+):/g, "e.$1>=", /max-([a-z-\s]+):/g, "e.$1<=", /calc([^)]+)/g, "($1)", /(\d+[\.]*[\d]*)([a-z]+)/g, "($1 * e.$2)", /^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/gi, "") + ";"
                });
            return function(b, d) {
                var e;
                if (!(b in M))
                    if (M[b] = !1, d && (e = b.match(a))) M[b] = e[1] * P[e[2]];
                    else try {
                        M[b] = new Function("e", c(b))(P)
                    } catch (f) {}
                    return M[b]
            }
        }(),
        _ = function(a, b) {
            return a.w ? (a.cWidth = s.calcListLength(b || "100vw"), a.res = a.w / a.cWidth) : a.res = a.d, a
        },
        aa = function(a) {
            var c, d, e, f = a || {};
            if (f.elements && 1 === f.elements.nodeType && ("IMG" === f.elements.nodeName.toUpperCase() ? f.elements = [f.elements] : (f.context = f.elements, f.elements = null)), c = f.elements || s.qsa(f.context || b, f.reevaluate || f.reselect ? s.sel : s.selShort), e = c.length) {
                for (s.setupRun(f), R = !0, d = 0; e > d; d++) s.fillImg(c[d], f);
                s.teardownRun(f)
            }
        };
    o = a.console && console.warn ? function(a) {
        console.warn(a)
    } : t, F in u || (F = "src"), z["image/jpeg"] = !0, z["image/gif"] = !0, z["image/png"] = !0, z["image/svg+xml"] = b.implementation.hasFeature("http://wwwindow.w3.org/TR/SVG11/feature#Image", "1.1"), s.ns = ("pf" + (new Date).getTime()).substr(0, 9), s.supSrcset = "srcset" in u, s.supSizes = "sizes" in u, s.supPicture = !!a.HTMLPictureElement, s.supSrcset && s.supPicture && !s.supSizes && ! function(a) {
        u.srcset = "data:,a", a.src = "data:,a", s.supSrcset = u.complete === a.complete, s.supPicture = s.supSrcset && s.supPicture
    }(b.createElement("img")), s.selShort = "picture>img,img[srcset]", s.sel = s.selShort, s.cfg = A, s.supSrcset && (s.sel += ",img[" + C + "]"), s.DPR = O || 1, s.u = P, s.types = z, q = s.supSrcset && !s.supSizes, s.setSize = t, s.makeUrl = Z(function(a) {
        return Q.href = a, Q.href
    }), s.qsa = function(a, b) {
        return a.querySelectorAll(b)
    }, s.matchesMedia = function() {
        return a.matchMedia && (matchMedia("(min-width: 0.1em)") || {}).matches ? s.matchesMedia = function(a) {
            return !a || matchMedia(a).matches
        } : s.matchesMedia = s.mMQ, s.matchesMedia.apply(this, arguments)
    }, s.mMQ = function(a) {
        return a ? $(a) : !0
    }, s.calcLength = function(a) {
        var b = $(a, !0) || !1;
        return 0 > b && (b = !1), b
    }, s.supportsType = function(a) {
        return a ? z[a] : !0
    }, s.parseSize = Z(function(a) {
        var b = (a || "").match(H);
        return {
            media: b && b[1],
            length: b && b[2]
        }
    }), s.parseSet = function(a) {
        return a.cands || (a.cands = m(a.srcset, a)), a.cands
    }, s.getEmValue = function() {
        var a;
        if (!p && (a = b.body)) {
            var c = b.createElement("div"),
                d = y.style.cssText,
                e = a.style.cssText;
            c.style.cssText = J, y.style.cssText = K, a.style.cssText = K, a.appendChild(c), p = c.offsetWidth, a.removeChild(c), p = parseFloat(p, 10), y.style.cssText = d, a.style.cssText = e
        }
        return p || 16
    }, s.calcListLength = function(a) {
        if (!(a in N) || A.uT) {
            var b = s.calcLength(n(a));
            N[a] = b ? b : P.width
        }
        return N[a]
    }, s.setRes = function(a) {
        var b;
        if (a) {
            b = s.parseSet(a);
            for (var c = 0, d = b.length; d > c; c++) _(b[c], a.sizes)
        }
        return b
    }, s.setRes.res = _, s.applySetCandidate = function(a, b) {
        if (a.length) {
            var c, d, e, f, h, k, l, m, n, o = b[s.ns],
                p = s.DPR;
            if (k = o.curSrc || b[F], l = o.curCan || j(b, k, a[0].set), l && l.set === a[0].set && (n = E && !b.complete && l.res - .1 > p, n || (l.cached = !0, l.res >= p && (h = l))), !h)
                for (a.sort(i), f = a.length, h = a[f - 1], d = 0; f > d; d++)
                    if (c = a[d], c.res >= p) {
                        e = d - 1, h = a[e] && (n || k !== s.makeUrl(c.url)) && g(a[e].res, c.res, p, a[e].cached) ? a[e] : c;
                        break
                    }
            h && (m = s.makeUrl(h.url), o.curSrc = m, o.curCan = h, m !== k && s.setSrc(b, h), s.setSize(b))
        }
    }, s.setSrc = function(a, b) {
        var c;
        a.src = b.url, "image/svg+xml" === b.set.type && (c = a.style.width, a.style.width = a.offsetWidth + 1 + "px", a.offsetWidth + 1 && (a.style.width = c))
    }, s.getSet = function(a) {
        var b, c, d, e = !1,
            f = a[s.ns].sets;
        for (b = 0; b < f.length && !e; b++)
            if (c = f[b], c.srcset && s.matchesMedia(c.media) && (d = s.supportsType(c.type))) {
                "pending" === d && (c = d), e = c;
                break
            }
        return e
    }, s.parseSets = function(a, b, d) {
        var e, f, g, h, i = b && "PICTURE" === b.nodeName.toUpperCase(),
            j = a[s.ns];
        (j.src === c || d.src) && (j.src = v.call(a, "src"), j.src ? w.call(a, B, j.src) : x.call(a, B)), (j.srcset === c || d.srcset || !s.supSrcset || a.srcset) && (e = v.call(a, "srcset"), j.srcset = e, h = !0), j.sets = [], i && (j.pic = !0, l(b, j.sets)), j.srcset ? (f = {
            srcset: j.srcset,
            sizes: v.call(a, "sizes")
        }, j.sets.push(f), g = (q || j.src) && G.test(j.srcset || ""), g || !j.src || k(j.src, f) || f.has1x || (f.srcset += ", " + j.src, f.cands.push({
            url: j.src,
            d: 1,
            set: f
        }))) : j.src && j.sets.push({
            srcset: j.src,
            sizes: null
        }), j.curCan = null, j.curSrc = c, j.supported = !(i || f && !s.supSrcset || g), h && s.supSrcset && !j.supported && (e ? (w.call(a, C, e), a.srcset = "") : x.call(a, C)), j.supported && !j.srcset && (!j.src && a.src || a.src !== s.makeUrl(j.src)) && (null === j.src ? a.removeAttribute("src") : a.src = j.src), j.parsed = !0
    }, s.fillImg = function(a, b) {
        var c, d = b.reselect || b.reevaluate;
        a[s.ns] || (a[s.ns] = {}), c = a[s.ns], (d || c.evaled !== r) && ((!c.parsed || b.reevaluate) && s.parseSets(a, a.parentNode, b), c.supported ? c.evaled = r : h(a))
    }, s.setupRun = function() {
        (!R || L || O !== a.devicePixelRatio) && f()
    }, s.supPicture ? (aa = t, s.fillImg = t) : ! function() {
        var c, d = a.attachEvent ? /d$|^c/ : /d$|^c|^i/,
            e = function() {
                var a = b.readyState || "";
                f = setTimeout(e, "loading" === a ? 200 : 999), b.body && (s.fillImgs(), c = c || d.test(a), c && clearTimeout(f))
            },
            f = setTimeout(e, b.body ? 9 : 99),
            g = function(a, b) {
                var c, d, e = function() {
                    var f = new Date - d;
                    b > f ? c = setTimeout(e, b - f) : (c = null, a())
                };
                return function() {
                    d = new Date, c || (c = setTimeout(e, b))
                }
            },
            h = y.clientHeight,
            i = function() {
                L = Math.max(a.innerWidth || 0, y.clientWidth) !== P.width || y.clientHeight !== h, h = y.clientHeight, L && s.fillImgs()
            };
        Y(a, "resize", g(i, 99)), Y(b, "readystatechange", e)
    }(), s.picturefill = aa, s.fillImgs = aa, s.teardownRun = t, aa._ = s, a.picturefillCFG = {
        pf: s,
        push: function(a) {
            var b = a.shift();
            "function" == typeof s[b] ? s[b].apply(s, a) : (A[b] = a[0], R && s.fillImgs({
                reselect: !0
            }))
        }
    };
    for (; I && I.length;) a.picturefillCFG.push(I.shift());
    a.picturefill = aa, "object" == typeof module && "object" == typeof module.exports ? module.exports = aa : "function" == typeof define && define.amd && define("picturefill", function() {
        return aa
    }), s.supPicture || (z["image/webp"] = e("image/webp", "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA=="))
}(window, document),
function a(b, c, d) {
    function e(g, h) {
        if (!c[g]) {
            if (!b[g]) {
                var i = "function" == typeof require && require;
                if (!h && i) return i(g, !0);
                if (f) return f(g, !0);
                var j = new Error("Cannot find module '" + g + "'");
                throw j.code = "MODULE_NOT_FOUND", j
            }
            var k = c[g] = {
                exports: {}
            };
            b[g][0].call(k.exports, function(a) {
                var c = b[g][1][a];
                return e(c ? c : a)
            }, k, k.exports, a, b, c, d)
        }
        return c[g].exports
    }
    for (var f = "function" == typeof require && require, g = 0; g < d.length; g++) e(d[g]);
    return e
}({
    1: [function(a, b, c) {
        "use strict";

        function d(a, b) {
            if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
        }
        c.__esModule = !0;
        var e = -1,
            f = 0,
            g = 1,
            h = 2,
            i = "0s",
            j = "1.5s",
            k = "2s",
            l = "2s",
            m = "3s",
            n = 3e3,
            o = 11250,
            p = "carousel__container--animated",
            q = function() {
                function a(b, c, f, g) {
                    var o = this;
                    if (d(this, a), null !== b) {
                        this.carouselEl = b, this.headerEl = c, this.docBodyEl = f, this.windowEl = g, this.clipEl = b.querySelector(".carousel__clip"), this.containerEl = b.querySelector(".carousel__container"), this.topEl = b.querySelector(".carousel__top"), this.bottomEl = b.querySelector(".carousel__bottom"), this.items = b.querySelectorAll(".carousel__item"), this.dotsEl = b.querySelector(".carousel__dots"), this.nextEl = b.querySelector(".carousel__next"), this.currentItem = 0, this.isDragging = !1, this.dragStartEvent = null, this.dragMoveEvent = null, this.movement = e, this.started = !1, this.timer = null, this.setContainerPosition(this.getContainerPosition());
                        var p = this.items.item(0),
                            q = this.items.item(this.items.length - 1),
                            r = p.cloneNode(!0),
                            s = q.cloneNode(!0);
                        r.classList.add("carousel__item--active"), r.querySelector(".carousel__placeholder").classList.add("hide"), this.firstItemClone = this.containerEl.appendChild(r), this.lastItemClone = this.containerEl.insertBefore(s, p);
                        var t = p.querySelector(".carousel__bottom-content"),
                            u = p.querySelector(".carousel__quote"),
                            v = p.querySelector(".carousel__author");
                        t.style.animationDelay = i, t.style.webkitAnimationDelay = i, t.style.oAnimationDelay = i, t.style.animationDuration = l, t.style.webkitAnimationDuration = l, t.style.oAnimationDuration = l, u.style.animationDelay = j, u.style.webkitAnimationDelay = j, u.style.oAnimationDelay = j, u.style.animationDuration = m, u.style.webkitAnimationDuration = m, u.style.oAnimationDuration = m, v.style.animationDelay = k, v.style.webkitAnimationDelay = k, v.style.oAnimationDelay = k, v.style.animationDuration = m, v.style.webkitAnimationDuration = m, v.style.oAnimationDuration = m;
                        var w = function(a) {
                            a.stopPropagation()
                        };
                        [].forEach.call(this.containerEl.querySelectorAll(".carousel__item"), function(a) {
                            var b = a.querySelector(".carousel__author"),
                                c = a.querySelector(".carousel__quote");
                            b.addEventListener("webkitAnimationEnd", w), b.addEventListener("animationend", w), c.addEventListener("webkitAnimationEnd", w), c.addEventListener("animationend", w)
                        }), this.windowEl.navigator.userAgent.match(/mobile/gi) || this.windowEl.navigator.userAgent.match(/tablet/gi) ? this.windowEl.addEventListener("orientationchange", function() {
                            o.resize()
                        }) : this.windowEl.addEventListener("resize", function() {
                            o.resize()
                        }), this.windowEl.addEventListener("scroll", function() {
                            o.start(), o.movement !== e && (o.movement = h)
                        }), this.nextEl.addEventListener("click", function() {
                            o.setTimer(), o.normalizePosition(), o.next()
                        }), setTimeout(function() {
                            o.start()
                        }, n), setTimeout(function() {
                            o.resize()
                        }, 1)
                    }
                }
                return a.prototype.start = function() {
                    var a = this;
                    if (!this.started) {
                        var b = this.items.item(0);
                        b.classList.add("carousel__item--active");
                        var c = function() {
                                a.movement = f, b.querySelector(".carousel__placeholder").classList.add("hide"), a.nextEl.classList.remove("carousel__next--hidden"), a.dotsEl.classList.remove("carousel__dots--hidden")
                            },
                            d = b.querySelector(".carousel__bottom-content");
                        d.addEventListener("webkitAnimationEnd", c), d.addEventListener("animationend", c), this.started = !0, this.setTimer();
                        var e = function(b) {
                                a.dragStart(b)
                            },
                            g = function(b) {
                                a.dragMove(b)
                            },
                            h = function(b) {
                                a.dragEnd(b)
                            };
                        this.windowEl.navigator.userAgent.match(/mobile/gi) || this.windowEl.navigator.userAgent.match(/tablet/gi) ? (this.clipEl.addEventListener("touchstart", e), this.clipEl.addEventListener("touchmove", g), this.clipEl.addEventListener("touchend", h), this.clipEl.addEventListener("touchcancel", h)) : (this.clipEl.addEventListener("mousedown", e), this.clipEl.addEventListener("mousemove", g), this.clipEl.addEventListener("mouseup", h), this.clipEl.addEventListener("mouseleave", h))
                    }
                }, a.prototype.setTimer = function() {
                    var a = this;
                    null !== this.timer && clearInterval(this.timer), this.timer = setInterval(function() {
                        a.normalizePosition(), a.next()
                    }, o)
                }, a.prototype.setContainerPosition = function(a) {
                    this.containerEl.style.transform = "translate3d(" + a + "px, 0, 0)", this.containerEl.style.webkitTransform = "translate3d(" + a + "px, 0, 0)", this.containerEl.style.msTransform = "translate3d(" + a + "px, 0, 0)", this.containerEl.style.oTransform = "translate3d(" + a + "px, 0, 0)"
                }, a.prototype.getContainerCurrentPosition = function() {
                    var a = getComputedStyle(this.containerEl),
                        b = a.transform || a.webkitTransform || a.msTransform || a.oTransform,
                        c = b.substring(b.indexOf("(") + 1, b.indexOf(")")).split(",");
                    return 0 === c.length ? this.getContainerPosition() : b.indexOf("translate3d") > -1 ? c.length > 0 ? parseInt(c[0], 10) || this.getContainerPosition() : this.getContainerPosition() : b.indexOf("matrix") > -1 && c.length > 4 ? parseInt(c[4], 10) || this.getContainerPosition() : this.getContainerPosition()
                }, a.prototype.resize = function() {
                    this.containerEl.classList.remove(p);
                    var a = this.clipEl.clientWidth,
                        b = this.windowEl.innerHeight - this.headerEl.clientHeight;
                    [].forEach.call(this.containerEl.querySelectorAll(".carousel__item"), function(c) {
                        c.style.width = a + "px", c.style.height = b + "px"
                    }), this.clipEl.style.height = b + "px", this.containerEl.style.height = b + "px", this.containerEl.style.width = this.clipEl.clientWidth * (this.items.length + 2) + "px";
                    var c = this.getContainerPosition();
                    this.setContainerPosition(c)
                }, a.prototype.normalizePosition = function() {
                    var a = this.clipEl.clientWidth,
                        b = this.getContainerCurrentPosition();
                    if (this.currentItem < 0) this.currentItem += this.items.length, b -= this.items.length * a;
                    else {
                        if (this.currentItem !== this.items.length) return;
                        this.currentItem = 0, b += this.items.length * a
                    }
                    this.containerEl.classList.remove(p), this.setContainerPosition(b), this.containerEl.getBoundingClientRect(), this.containerEl.classList.add(p)
                }, a.prototype.next = function() {
                    return this.currentItem += 1, this.move()
                }, a.prototype.previous = function() {
                    return this.currentItem -= 1, this.move()
                }, a.prototype.getContainerPosition = function() {
                    return -1 * this.clipEl.clientWidth * (this.currentItem + 1)
                }, a.prototype.move = function() {
                    var a = this,
                        b = this.getContainerPosition();
                    this.containerEl.classList.contains(p) || this.containerEl.classList.add(p), this.setContainerPosition(b);
                    var c = this.dotsEl.querySelector(".carousel__dot--active");
                    c && c.classList.remove("carousel__dot--active");
                    var d = this.currentItem,
                        g = this.items.item(d);
                    if (d === this.items.length ? (d = 0, g = this.items.item(0)) : -1 === d ? (d = this.items.length - 1, g = this.lastItemClone, this.items.item(d).classList.add("carousel__item--active"), this.items.item(d).querySelector(".carousel__placeholder").classList.add("hide")) : d === this.items.length - 1 && (this.lastItemClone.classList.add("carousel__item--active"), this.lastItemClone.querySelector(".carousel__placeholder").classList.add("hide"), g = this.items.item(d)), this.dotsEl.querySelectorAll(".carousel__dot").item(d).classList.add("carousel__dot--active"), !g.classList.contains("carousel__item--active")) {
                        g.classList.add("carousel__item--active"), this.nextEl.classList.add("carousel__next--hidden"), this.dotsEl.classList.add("carousel__dots--hidden"), this.movement = e;
                        var h = function() {
                                a.movement = f, g.querySelector(".carousel__placeholder").classList.add("hide"), a.nextEl.classList.remove("carousel__next--hidden"), a.dotsEl.classList.remove("carousel__dots--hidden")
                            },
                            i = g.querySelector(".carousel__bottom-content");
                        i.addEventListener("webkitAnimationEnd", h), i.addEventListener("animationend", h)
                    }
                }, a.prototype.dragStart = function(a) {
                    return this.movement === e || a.target.classList.contains("carousel__next") || a.target.parentElement.classList.contains("carousel__next") ? this : (clearInterval(this.timer), this.normalizePosition(), this.isDragging = !0, this.dragStartEvent = a, this.dragStartPosition = this.getContainerCurrentPosition(), this.setContainerPosition(this.dragStartPosition), this)
                }, a.prototype.dragMove = function(a) {
                    if (!this.isDragging || this.movement === h || this.movement === e) return this;
                    var b = this.coordinates(this.dragStartEvent),
                        c = this.coordinates(a),
                        d = b.x - c.x,
                        i = b.y - c.y,
                        j = this.dragStartPosition,
                        k = d / i;
                    return this.movement === f && (Math.abs(d) > 5 || Math.abs(i) > 5) && (Math.abs(k) > 1 ? (this.movement = g, this.containerEl.classList.remove(p)) : this.movement = h), this.movement === g && (a.preventDefault(), a.stopPropagation(), j -= d, this.setContainerPosition(j)), this.dragMoveEvent = a, this
                }, a.prototype.dragEnd = function(a) {
                    if (!this.isDragging || this.movement === e) return this;
                    var b = a.timeStamp - this.dragStartEvent.timeStamp,
                        c = this.coordinates(this.dragStartEvent),
                        d = this.coordinates(this.dragMoveEvent),
                        g = c.x - d.x,
                        h = g > 0,
                        i = Math.abs(g) / b,
                        j = Math.abs(g) > this.clipEl.clientWidth / 2 || i > .35;
                    return this.isDragging = !1, this.dragStartEvent = null, this.dragStartPosition = this.getContainerPosition(), this.dragMoveEvent = null, this.movement = f, this.setTimer(), j ? h ? this.next() : this.previous() : this.move()
                }, a.prototype.coordinates = function(a) {
                    if (null === a) return {};
                    if (a.type.match(/touch/)) {
                        if (a.touches.length > 0) return {
                            x: a.pageX || a.touches[0].clientX,
                            y: a.pageY || a.touches[0].clientY
                        }
                    } else if (a.type.match(/mouse/)) return {
                        x: a.clientX,
                        y: a.clientY
                    };
                    return {}
                }, a
            }();
        c["default"] = q, b.exports = c["default"]
    }, {}],
    2: [function(a, b, c) {
        "use strict";

        function d(a) {
            return a && a.__esModule ? a : {
                "default": a
            }
        }

        function e(a, b) {
            if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
        }
        c.__esModule = !0;
        var f = a("./scroll-blocker.js"),
            g = d(f),
            h = function() {
                function a(b, c, d, f, h, i) {
                    var j = this;
                    if (e(this, a), null !== b) {
                        this.toggleEl = b, this.overlayEl = c, this.sideEl = d, this.navigationEl = f, this.docBodyEl = h, this.windowEl = i, this.isDragging = !1, this.dragStartEvent = null, this.dragMoveEvent = null, this.isMenuOpen = !1, this.ScrollBlockerInstance = new g["default"](h);
                        var k = 768,
                            l = function(a) {
                                j.windowEl.matchMedia("(min-width: " + k + "px)").matches || j.dragStart(a)
                            },
                            m = function(a) {
                                j.windowEl.matchMedia("(min-width: " + k + "px)").matches || j.dragMove(a)
                            },
                            n = function(a) {
                                j.windowEl.matchMedia("(min-width: " + k + "px)").matches || j.dragEnd(a)
                            };
                        window.navigator.userAgent.match(/mobile/gi) || window.navigator.userAgent.match(/tablet/gi) ? (this.navigationEl.addEventListener("touchstart", l), this.navigationEl.addEventListener("touchmove", m), this.navigationEl.addEventListener("touchend", n), this.navigationEl.addEventListener("touchcancel", n)) : (this.navigationEl.addEventListener("mousedown", l), this.navigationEl.addEventListener("mousemove", m), this.navigationEl.addEventListener("mouseup", n), this.navigationEl.addEventListener("mouseleave", n)), this.toggleEl.addEventListener("click", function() {
                            j.toggleMenu()
                        })
                    }
                }
                return a.prototype.toggleMenu = function() {
                    var a = "has-navigation-open",
                        b = "navigation--open",
                        c = "navigation__side--open",
                        d = "navigation__overlay--open",
                        e = "navigation__toggle--toggled",
                        f = function(a, b) {
                            a.classList.contains(b) ? a.classList.remove(b) : a.classList.add(b)
                        };
                    f(this.docBodyEl, a), f(this.navigationEl, b), f(this.sideEl, c), f(this.overlayEl, d), f(this.toggleEl, e), this.isMenuOpen ? (this.isMenuOpen = !1, this.ScrollBlockerInstance.stopBlocking()) : (this.isMenuOpen = !0, this.ScrollBlockerInstance.startBlocking())
                }, a.prototype.coordinates = function(a) {
                    if (null === a) return {};
                    if (a.type.match(/touch/)) {
                        if (a.touches.length > 0) return {
                            x: a.pageX || a.touches[0].clientX,
                            y: a.pageY || a.touches[0].clientY
                        }
                    } else if (a.type.match(/mouse/)) return {
                        x: a.clientX,
                        y: a.clientY
                    };
                    return {}
                }, a.prototype.dragStart = function(a) {
                    this.isDragging = !0, this.dragStartEvent = a, this.navigationEl.classList.remove("navigation--animated")
                }, a.prototype.dragMove = function(a) {
                    if (this.isDragging) {
                        this.dragMoveEvent = a;
                        var b = this.coordinates(this.dragStartEvent),
                            c = this.coordinates(a),
                            d = b.x - c.x;
                        0 > d && (d = 0);
                        var e = 100 * d / this.navigationEl.clientWidth;
                        this.navigationEl.style.transform = "translate(-" + e + "%, 0)", this.navigationEl.style.webkitTransform = "translate(-" + e + "%, 0)", this.navigationEl.style.msTransform = "translate(-" + e + "%, 0)", this.navigationEl.style.oTransform = "translate(-" + e + "%, 0)", this.overlayEl.style.opacity = "" + (1 - e / 100)
                    }
                }, a.prototype.dragEnd = function(a) {
                    if (this.isDragging) {
                        var b = a.timeStamp - this.dragStartEvent.timeStamp,
                            c = this.coordinates(this.dragStartEvent),
                            d = this.coordinates(this.dragMoveEvent),
                            e = c.x - d.x,
                            f = Math.abs(e) / b,
                            g = Math.abs(e) > this.navigationEl.clientWidth / 2 || f > .35;
                        this.isDragging = !1, this.dragStartEvent = null, this.dragMoveEvent = null, this.navigationEl.classList.add("navigation--animated"), this.navigationEl.removeAttribute("style"), this.overlayEl.removeAttribute("style"), g && this.toggleMenu()
                    }
                }, a
            }();
        c["default"] = h, b.exports = c["default"]
    }, {
        "./scroll-blocker.js": 5
    }],
    3: [function(a, b, c) {
        "use strict";

        function d(a) {
            return a && a.__esModule ? a : {
                "default": a
            }
        }
        var e = a("./carousel"),
            f = d(e),
            g = a("./main-menu"),
            h = d(g),
            i = a("./modal"),
            j = d(i),
            k = a("./scroll-spy"),
            l = d(k);
        document.createElement("picture"), window.oncontextmenu = function() {
            return !1
        }, "addEventListener" in document && document.addEventListener("DOMContentLoaded", function() {
            FastClick.attach(document.body)
        }, !1), new f["default"](document.getElementById("carousel"), document.querySelector("header.header"), document.body, window), new h["default"](document.getElementById("menu-toggle"), document.getElementById("menu-overlay"), document.getElementById("menu-side"), document.getElementById("menu-navigation"), document.body, window), new j["default"](document.getElementById("modal"), document.querySelectorAll('[data-toggle="modal"]'), document.body), new l["default"](document.body, window)
    }, {
        "./carousel": 1,
        "./main-menu": 2,
        "./modal": 4,
        "./scroll-spy": 6
    }],
    4: [function(a, b, c) {
        "use strict";

        function d(a) {
            return a && a.__esModule ? a : {
                "default": a
            }
        }

        function e(a, b) {
            if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
        }
        c.__esModule = !0;
        var f = a("./scroll-blocker.js"),
            g = d(f),
            h = function() {
                function a(b, c, d) {
                    e(this, a), null !== b && (this.documentBodyEl = d, this.modalEl = b, this.toggleEls = c, this.ScrollBlockerInstance = new g["default"](d), this.init())
                }
                return a.prototype.init = function() {
                    var a = this,
                        b = this.modalEl.querySelector("#modal-content"),
                        c = function() {
                            a.documentBodyEl.classList.remove("has-modal-open"), a.modalEl.classList.remove("modal--open"), a.ScrollBlockerInstance.stopBlocking()
                        },
                        d = function(d, e) {
                            var f = e.dataset.modalContent;
                            if (d.preventDefault(), f) {
                                b.innerHTML = "";
                                var g = a.documentBodyEl.querySelector("#" + f);
                                g && (b.innerHTML = g.innerHTML)
                            }
                            a.documentBodyEl.classList.add("has-modal-open"), a.modalEl.classList.add("modal--open");
                            var h = a.modalEl.querySelector('[data-toggle="modal-close"]');
                            h.addEventListener("click", function() {
                                c()
                            }), a.modalEl.scrollTop = 0, a.ScrollBlockerInstance.startBlocking()
                        };
                    [].forEach.call(this.toggleEls, function(a) {
                        a.addEventListener("click", function(a) {
                            d(a, this)
                        })
                    });
                    var e = this.modalEl.querySelector("#modal-dialog");
                    e.addEventListener("click", function(a) {
                        "modal-dialog" === a.target.id && c()
                    })
                }, a
            }();
        c["default"] = h, b.exports = c["default"]
    }, {
        "./scroll-blocker.js": 5
    }],
    5: [function(a, b, c) {
        "use strict";

        function d(a, b) {
            if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
        }
        c.__esModule = !0;
        var e = function() {
            function a(b) {
                d(this, a), this.docBodyEl = b, this.docBodyScrollTop = null
            }
            return a.prototype.startBlocking = function() {
                return this.docBodyEl.classList.contains("block-scrolling") ? void(this.docBodyScrollTop = -1 * parseInt(this.docBodyEl.style.marginTop)) : (this.docBodyScrollTop = this.docBodyEl.scrollTop, this.docBodyEl.style.marginTop = -1 * this.docBodyEl.scrollTop + "px", void this.docBodyEl.classList.add("block-scrolling"))
            }, a.prototype.stopBlocking = function() {
                var a = this.docBodyEl.classList;
                !a.contains("block-scrolling") || a.contains("has-modal-open") || a.contains("has-navigation-open") || (this.docBodyEl.classList.remove("block-scrolling"), this.docBodyEl.removeAttribute("style"), this.docBodyEl.scrollTop = this.docBodyScrollTop, this.docBodyScrollTop = null)
            }, a
        }();
        c["default"] = e, b.exports = c["default"]
    }, {}],
    6: [function(a, b, c) {
        "use strict";

        function d(a, b) {
            if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
        }
        c.__esModule = !0;
        var e = function() {
            function a(b, c) {
                var e = this;
                d(this, a), c && (this.windowEl = c, this.docBodyEl = b, this.windowEl.addEventListener("scroll", function() {
                    e.checkElementsPosition()
                }), this.windowEl.onload = function() {
                    setTimeout(function() {
                        e.checkElementsPosition()
                    }, 1)
                })
            }
            return a.prototype.checkElementsPosition = function() {
                var a = this,
                    b = this.docBodyEl.querySelectorAll(".scroll__spy--hidden"),
                    c = 80;
                [].forEach.call(b, function(b) {
                    if (b.getBoundingClientRect().top + c < a.windowEl.innerHeight)
                        for (var d = 0; b.classList.item(d);) {
                            var e = b.classList.item(d),
                                f = "scroll__spy--";
                            e.substring(0, f.length) !== f ? d++ : b.classList.remove(e)
                        }
                })
            }, a
        }();
        c["default"] = e, b.exports = c["default"]
    }, {}]
}, {}, [3]);
