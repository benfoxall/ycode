import { c as create } from './common/error-8f9bf959.js';
import { c as createMutex } from './common/mutex-324572dd.js';
import { c as createCommonjsModule, a as commonjsGlobal, b as commonjsRequire } from './common/_commonjsHelpers-4f56b6ba.js';
import { O as Observable, g as getUnixTime, m as min, l as log10, s as setIfUndefined, h as fromBase64, v as varStorage, i as toBase64, j as createUint8ArrayFromArrayBuffer, w as writeVarUint, k as writeVarUint8Array, r as readVarUint, n as readVarUint8Array, o as encodeUtf8, p as readAny, d as createDecoder, a as writeVarString, t as toUint8Array, b as readVarString, c as createEncoder, q as writeAny, f as floor, u as writeUint8, x as readUint8 } from './common/function-d4886006.js';
import { e as encodeStateVector, a as encodeStateAsUpdate, b as applyUpdate, c as createModuleLogger, r as rand, u as uuidv4, B as BOLD, U as UNBOLD, G as GREY, d as UNCOLOR } from './common/yjs-d596c0e9.js';
import { A as Awareness, e as encodeAwarenessUpdate, r as removeAwarenessStates, a as applyAwarenessUpdate } from './common/awareness-96ffb3f7.js';

/* eslint-env browser */

const reconnectTimeoutBase = 1200;
const maxReconnectTimeout = 2500;
// @todo - this should depend on awareness.outdatedTime
const messageReconnectTimeout = 30000;

/**
 * @param {WebsocketClient} wsclient
 */
const setupWS = (wsclient) => {
  if (wsclient.shouldConnect && wsclient.ws === null) {
    const websocket = new WebSocket(wsclient.url);
    const binaryType = wsclient.binaryType;
    /**
     * @type {any}
     */
    let pingTimeout = null;
    if (binaryType) {
      websocket.binaryType = binaryType;
    }
    wsclient.ws = websocket;
    wsclient.connecting = true;
    wsclient.connected = false;
    websocket.onmessage = event => {
      wsclient.lastMessageReceived = getUnixTime();
      const data = event.data;
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      if (message && message.type === 'pong') {
        clearTimeout(pingTimeout);
        pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2);
      }
      wsclient.emit('message', [message, wsclient]);
    };
    /**
     * @param {any} error
     */
    const onclose = error => {
      if (wsclient.ws !== null) {
        wsclient.ws = null;
        wsclient.connecting = false;
        if (wsclient.connected) {
          wsclient.connected = false;
          wsclient.emit('disconnect', [{ type: 'disconnect', error }, wsclient]);
        } else {
          wsclient.unsuccessfulReconnects++;
        }
        // Start with no reconnect timeout and increase timeout by
        // log10(wsUnsuccessfulReconnects).
        // The idea is to increase reconnect timeout slowly and have no reconnect
        // timeout at the beginning (log(1) = 0)
        setTimeout(setupWS, min(log10(wsclient.unsuccessfulReconnects + 1) * reconnectTimeoutBase, maxReconnectTimeout), wsclient);
      }
      clearTimeout(pingTimeout);
    };
    const sendPing = () => {
      if (wsclient.ws === websocket) {
        wsclient.send({
          type: 'ping'
        });
      }
    };
    websocket.onclose = () => onclose(null);
    websocket.onerror = error => onclose(error);
    websocket.onopen = () => {
      wsclient.lastMessageReceived = getUnixTime();
      wsclient.connecting = false;
      wsclient.connected = true;
      wsclient.unsuccessfulReconnects = 0;
      wsclient.emit('connect', [{ type: 'connect' }, wsclient]);
      // set ping
      pingTimeout = setTimeout(sendPing, messageReconnectTimeout / 2);
    };
  }
};

/**
 * @extends Observable<string>
 */
class WebsocketClient extends Observable {
  /**
   * @param {string} url
   * @param {object} [opts]
   * @param {'arraybuffer' | 'blob' | null} [opts.binaryType] Set `ws.binaryType`
   */
  constructor (url, { binaryType } = {}) {
    super();
    this.url = url;
    /**
     * @type {WebSocket?}
     */
    this.ws = null;
    this.binaryType = binaryType || null;
    this.connected = false;
    this.connecting = false;
    this.unsuccessfulReconnects = 0;
    this.lastMessageReceived = 0;
    /**
     * Whether to connect to other peers or not
     * @type {boolean}
     */
    this.shouldConnect = true;
    this._checkInterval = setInterval(() => {
      if (this.connected && messageReconnectTimeout < getUnixTime() - this.lastMessageReceived) {
        // no message received in a long time - not even your own awareness
        // updates (which are updated every 15 seconds)
        /** @type {WebSocket} */ (this.ws).close();
      }
    }, messageReconnectTimeout / 2);
    setupWS(this);
  }

  /**
   * @param {any} message
   */
  send (message) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }

  destroy () {
    clearInterval(this._checkInterval);
    this.disconnect();
    super.destroy();
  }

  disconnect () {
    this.shouldConnect = false;
    if (this.ws !== null) {
      this.ws.close();
    }
  }

  connect () {
    this.shouldConnect = true;
    if (!this.connected && this.ws === null) {
      setupWS(this);
    }
  }
}

/**
 * Utility helpers to work with promises.
 *
 * @module promise
 */

/**
 * @param {Error} [reason]
 * @return {Promise<never>}
 */
const reject = reason => Promise.reject(reason);

/**
 * @template T
 * @param {T|void} res
 * @return {Promise<T|void>}
 */
const resolve = res => Promise.resolve(res);

/* eslint-env browser */

/**
 * @typedef {Object} Channel
 * @property {Set<Function>} Channel.subs
 * @property {any} Channel.bc
 */

/**
 * @type {Map<string, Channel>}
 */
const channels = new Map();

class LocalStoragePolyfill {
  /**
   * @param {string} room
   */
  constructor (room) {
    this.room = room;
    /**
     * @type {null|function({data:ArrayBuffer}):void}
     */
    this.onmessage = null;
    addEventListener('storage', e => e.key === room && this.onmessage !== null && this.onmessage({ data: fromBase64(e.newValue || '') }));
  }

  /**
   * @param {ArrayBuffer} buf
   */
  postMessage (buf) {
    varStorage.setItem(this.room, toBase64(createUint8ArrayFromArrayBuffer(buf)));
  }
}

// Use BroadcastChannel or Polyfill
const BC = typeof BroadcastChannel === 'undefined' ? LocalStoragePolyfill : BroadcastChannel;

/**
 * @param {string} room
 * @return {Channel}
 */
const getChannel = room =>
  setIfUndefined(channels, room, () => {
    const subs = new Set();
    const bc = new BC(room);
    /**
     * @param {{data:ArrayBuffer}} e
     */
    bc.onmessage = e => subs.forEach(sub => sub(e.data));
    return {
      bc, subs
    }
  });

/**
 * Subscribe to global `publish` events.
 *
 * @function
 * @param {string} room
 * @param {function(any):any} f
 */
const subscribe = (room, f) => getChannel(room).subs.add(f);

/**
 * Unsubscribe from `publish` global events.
 *
 * @function
 * @param {string} room
 * @param {function(any):any} f
 */
const unsubscribe = (room, f) => getChannel(room).subs.delete(f);

/**
 * Publish data to all subscribers (including subscribers on this tab)
 *
 * @function
 * @param {string} room
 * @param {any} data
 */
const publish = (room, data) => {
  const c = getChannel(room);
  c.bc.postMessage(data);
  c.subs.forEach(sub => sub(data));
};

var simplepeer_min = createCommonjsModule(function (module, exports) {
(function(e){module.exports=e();})(function(){var t=Math.floor,n=Math.abs,r=Math.pow;return function(){function d(s,e,n){function t(o,i){if(!e[o]){if(!s[o]){var l="function"==typeof commonjsRequire&&commonjsRequire;if(!i&&l)return l(o,!0);if(r)return r(o,!0);var c=new Error("Cannot find module '"+o+"'");throw c.code="MODULE_NOT_FOUND",c}var a=e[o]={exports:{}};s[o][0].call(a.exports,function(e){var r=s[o][1][e];return t(r||e)},a,a.exports,d,s,e,n);}return e[o].exports}for(var r="function"==typeof commonjsRequire&&commonjsRequire,a=0;a<n.length;a++)t(n[a]);return t}return d}()({1:[function(e,t,n){function r(e){var t=e.length;if(0<t%4)throw new Error("Invalid string. Length must be a multiple of 4");var n=e.indexOf("=");-1===n&&(n=t);var r=n===t?0:4-n%4;return [n,r]}function a(e,t,n){return 3*(t+n)/4-n}function o(e){var t,n,o=r(e),d=o[0],s=o[1],l=new p(a(e,d,s)),c=0,f=0<s?d-4:d;for(n=0;n<f;n+=4)t=u[e.charCodeAt(n)]<<18|u[e.charCodeAt(n+1)]<<12|u[e.charCodeAt(n+2)]<<6|u[e.charCodeAt(n+3)],l[c++]=255&t>>16,l[c++]=255&t>>8,l[c++]=255&t;return 2===s&&(t=u[e.charCodeAt(n)]<<2|u[e.charCodeAt(n+1)]>>4,l[c++]=255&t),1===s&&(t=u[e.charCodeAt(n)]<<10|u[e.charCodeAt(n+1)]<<4|u[e.charCodeAt(n+2)]>>2,l[c++]=255&t>>8,l[c++]=255&t),l}function d(e){return c[63&e>>18]+c[63&e>>12]+c[63&e>>6]+c[63&e]}function s(e,t,n){for(var r,a=[],o=t;o<n;o+=3)r=(16711680&e[o]<<16)+(65280&e[o+1]<<8)+(255&e[o+2]),a.push(d(r));return a.join("")}function l(e){for(var t,n=e.length,r=n%3,a=[],o=16383,d=0,l=n-r;d<l;d+=o)a.push(s(e,d,d+o>l?l:d+o));return 1===r?(t=e[n-1],a.push(c[t>>2]+c[63&t<<4]+"==")):2===r&&(t=(e[n-2]<<8)+e[n-1],a.push(c[t>>10]+c[63&t>>4]+c[63&t<<2]+"=")),a.join("")}n.byteLength=function(e){var t=r(e),n=t[0],a=t[1];return 3*(n+a)/4-a},n.toByteArray=o,n.fromByteArray=l;for(var c=[],u=[],p="undefined"==typeof Uint8Array?Array:Uint8Array,f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",g=0,h=f.length;g<h;++g)c[g]=f[g],u[f.charCodeAt(g)]=g;u[45]=62,u[95]=63;},{}],2:[function(){},{}],3:[function(e,t){function n(e){console&&console.warn&&console.warn(e);}function r(){r.init.call(this);}function a(e){if("function"!=typeof e)throw new TypeError("The \"listener\" argument must be of type Function. Received type "+typeof e)}function o(e){return void 0===e._maxListeners?r.defaultMaxListeners:e._maxListeners}function i(e,t,r,i){var d,s,l;if(a(r),s=e._events,void 0===s?(s=e._events=Object.create(null),e._eventsCount=0):(void 0!==s.newListener&&(e.emit("newListener",t,r.listener?r.listener:r),s=e._events),l=s[t]),void 0===l)l=s[t]=r,++e._eventsCount;else if("function"==typeof l?l=s[t]=i?[r,l]:[l,r]:i?l.unshift(r):l.push(r),d=o(e),0<d&&l.length>d&&!l.warned){l.warned=!0;var c=new Error("Possible EventEmitter memory leak detected. "+l.length+" "+(t+" listeners added. Use emitter.setMaxListeners() to increase limit"));c.name="MaxListenersExceededWarning",c.emitter=e,c.type=t,c.count=l.length,n(c);}return e}function d(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function s(e,t,n){var r={fired:!1,wrapFn:void 0,target:e,type:t,listener:n},a=d.bind(r);return a.listener=n,r.wrapFn=a,a}function l(e,t,n){var r=e._events;if(r===void 0)return [];var a=r[t];return void 0===a?[]:"function"==typeof a?n?[a.listener||a]:[a]:n?f(a):u(a,a.length)}function c(e){var t=this._events;if(t!==void 0){var n=t[e];if("function"==typeof n)return 1;if(void 0!==n)return n.length}return 0}function u(e,t){for(var n=Array(t),r=0;r<t;++r)n[r]=e[r];return n}function p(e,t){for(;t+1<e.length;t++)e[t]=e[t+1];e.pop();}function f(e){for(var t=Array(e.length),n=0;n<t.length;++n)t[n]=e[n].listener||e[n];return t}var g,h="object"==typeof Reflect?Reflect:null,_=h&&"function"==typeof h.apply?h.apply:function(e,t,n){return Function.prototype.apply.call(e,t,n)};g=h&&"function"==typeof h.ownKeys?h.ownKeys:Object.getOwnPropertySymbols?function(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:function(e){return Object.getOwnPropertyNames(e)};var m=Number.isNaN||function(e){return e!==e};t.exports=r,t.exports.once=function(e,t){return new Promise(function(n,r){function a(){o!==void 0&&e.removeListener("error",o),n([].slice.call(arguments));}var o;"error"!==t&&(o=function(n){e.removeListener(t,a),r(n);},e.once("error",o)),e.once(t,a);})},r.EventEmitter=r,r.prototype._events=void 0,r.prototype._eventsCount=0,r.prototype._maxListeners=void 0;var b=10;Object.defineProperty(r,"defaultMaxListeners",{enumerable:!0,get:function(){return b},set:function(e){if("number"!=typeof e||0>e||m(e))throw new RangeError("The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received "+e+".");b=e;}}),r.init=function(){(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)&&(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0;},r.prototype.setMaxListeners=function(e){if("number"!=typeof e||0>e||m(e))throw new RangeError("The value of \"n\" is out of range. It must be a non-negative number. Received "+e+".");return this._maxListeners=e,this},r.prototype.getMaxListeners=function(){return o(this)},r.prototype.emit=function(e){for(var t=[],n=1;n<arguments.length;n++)t.push(arguments[n]);var r="error"===e,a=this._events;if(a!==void 0)r=r&&a.error===void 0;else if(!r)return !1;if(r){var o;if(0<t.length&&(o=t[0]),o instanceof Error)throw o;var d=new Error("Unhandled error."+(o?" ("+o.message+")":""));throw d.context=o,d}var s=a[e];if(s===void 0)return !1;if("function"==typeof s)_(s,this,t);else for(var l=s.length,c=u(s,l),n=0;n<l;++n)_(c[n],this,t);return !0},r.prototype.addListener=function(e,t){return i(this,e,t,!1)},r.prototype.on=r.prototype.addListener,r.prototype.prependListener=function(e,t){return i(this,e,t,!0)},r.prototype.once=function(e,t){return a(t),this.on(e,s(this,e,t)),this},r.prototype.prependOnceListener=function(e,t){return a(t),this.prependListener(e,s(this,e,t)),this},r.prototype.removeListener=function(e,t){var n,r,o,d,s;if(a(t),r=this._events,void 0===r)return this;if(n=r[e],void 0===n)return this;if(n===t||n.listener===t)0==--this._eventsCount?this._events=Object.create(null):(delete r[e],r.removeListener&&this.emit("removeListener",e,n.listener||t));else if("function"!=typeof n){for(o=-1,d=n.length-1;0<=d;d--)if(n[d]===t||n[d].listener===t){s=n[d].listener,o=d;break}if(0>o)return this;0===o?n.shift():p(n,o),1===n.length&&(r[e]=n[0]),void 0!==r.removeListener&&this.emit("removeListener",e,s||t);}return this},r.prototype.off=r.prototype.removeListener,r.prototype.removeAllListeners=function(e){var t,n,r;if(n=this._events,void 0===n)return this;if(void 0===n.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==n[e]&&(0==--this._eventsCount?this._events=Object.create(null):delete n[e]),this;if(0===arguments.length){var a,o=Object.keys(n);for(r=0;r<o.length;++r)a=o[r],"removeListener"===a||this.removeAllListeners(a);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(t=n[e],"function"==typeof t)this.removeListener(e,t);else if(void 0!==t)for(r=t.length-1;0<=r;r--)this.removeListener(e,t[r]);return this},r.prototype.listeners=function(e){return l(this,e,!0)},r.prototype.rawListeners=function(e){return l(this,e,!1)},r.listenerCount=function(e,t){return "function"==typeof e.listenerCount?e.listenerCount(t):c.call(e,t)},r.prototype.listenerCount=c,r.prototype.eventNames=function(){return 0<this._eventsCount?g(this._events):[]};},{}],4:[function(e,t,n){(function(){(function(){var z=String.fromCharCode,K=Math.min;function t(e){if(2147483647<e)throw new RangeError("The value \""+e+"\" is invalid for option \"size\"");var t=new Uint8Array(e);return t.__proto__=o.prototype,t}function o(e,t,n){if("number"==typeof e){if("string"==typeof t)throw new TypeError("The \"string\" argument must be of type string. Received type number");return l(e)}return i(e,t,n)}function i(e,t,n){if("string"==typeof e)return c(e,t);if(ArrayBuffer.isView(e))return u(e);if(null==e)throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e);if(G(e,ArrayBuffer)||e&&G(e.buffer,ArrayBuffer))return p(e,t,n);if("number"==typeof e)throw new TypeError("The \"value\" argument must not be of type number. Received type number");var r=e.valueOf&&e.valueOf();if(null!=r&&r!==e)return o.from(r,t,n);var a=f(e);if(a)return a;if("undefined"!=typeof Symbol&&null!=Symbol.toPrimitive&&"function"==typeof e[Symbol.toPrimitive])return o.from(e[Symbol.toPrimitive]("string"),t,n);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof e)}function d(e){if("number"!=typeof e)throw new TypeError("\"size\" argument must be of type number");else if(0>e)throw new RangeError("The value \""+e+"\" is invalid for option \"size\"")}function s(e,n,r){return d(e),0>=e?t(e):void 0===n?t(e):"string"==typeof r?t(e).fill(n,r):t(e).fill(n)}function l(e){return d(e),t(0>e?0:0|g(e))}function c(e,n){if(("string"!=typeof n||""===n)&&(n="utf8"),!o.isEncoding(n))throw new TypeError("Unknown encoding: "+n);var r=0|h(e,n),a=t(r),i=a.write(e,n);return i!==r&&(a=a.slice(0,i)),a}function u(e){for(var n=0>e.length?0:0|g(e.length),r=t(n),a=0;a<n;a+=1)r[a]=255&e[a];return r}function p(e,t,n){if(0>t||e.byteLength<t)throw new RangeError("\"offset\" is outside of buffer bounds");if(e.byteLength<t+(n||0))throw new RangeError("\"length\" is outside of buffer bounds");var r;return r=void 0===t&&void 0===n?new Uint8Array(e):void 0===n?new Uint8Array(e,t):new Uint8Array(e,t,n),r.__proto__=o.prototype,r}function f(e){if(o.isBuffer(e)){var n=0|g(e.length),r=t(n);return 0===r.length?r:(e.copy(r,0,0,n),r)}return void 0===e.length?"Buffer"===e.type&&Array.isArray(e.data)?u(e.data):void 0:"number"!=typeof e.length||Y(e.length)?t(0):u(e)}function g(e){if(e>=2147483647)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+2147483647 .toString(16)+" bytes");return 0|e}function h(e,t){if(o.isBuffer(e))return e.length;if(ArrayBuffer.isView(e)||G(e,ArrayBuffer))return e.byteLength;if("string"!=typeof e)throw new TypeError("The \"string\" argument must be one of type string, Buffer, or ArrayBuffer. Received type "+typeof e);var n=e.length,r=2<arguments.length&&!0===arguments[2];if(!r&&0===n)return 0;for(var a=!1;;)switch(t){case"ascii":case"latin1":case"binary":return n;case"utf8":case"utf-8":return j(e).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*n;case"hex":return n>>>1;case"base64":return H(e).length;default:if(a)return r?-1:j(e).length;t=(""+t).toLowerCase(),a=!0;}}function _(e,t,n){var r=!1;if((void 0===t||0>t)&&(t=0),t>this.length)return "";if((void 0===n||n>this.length)&&(n=this.length),0>=n)return "";if(n>>>=0,t>>>=0,n<=t)return "";for(e||(e="utf8");;)switch(e){case"hex":return N(this,t,n);case"utf8":case"utf-8":return v(this,t,n);case"ascii":return A(this,t,n);case"latin1":case"binary":return x(this,t,n);case"base64":return T(this,t,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return I(this,t,n);default:if(r)throw new TypeError("Unknown encoding: "+e);e=(e+"").toLowerCase(),r=!0;}}function m(e,t,n){var r=e[t];e[t]=e[n],e[n]=r;}function b(e,t,n,r,a){if(0===e.length)return -1;if("string"==typeof n?(r=n,n=0):2147483647<n?n=2147483647:-2147483648>n&&(n=-2147483648),n=+n,Y(n)&&(n=a?0:e.length-1),0>n&&(n=e.length+n),n>=e.length){if(a)return -1;n=e.length-1;}else if(0>n)if(a)n=0;else return -1;if("string"==typeof t&&(t=o.from(t,r)),o.isBuffer(t))return 0===t.length?-1:y(e,t,n,r,a);if("number"==typeof t)return t&=255,"function"==typeof Uint8Array.prototype.indexOf?a?Uint8Array.prototype.indexOf.call(e,t,n):Uint8Array.prototype.lastIndexOf.call(e,t,n):y(e,[t],n,r,a);throw new TypeError("val must be string, number or Buffer")}function y(e,t,n,r,a){function o(e,t){return 1===d?e[t]:e.readUInt16BE(t*d)}var d=1,s=e.length,l=t.length;if(void 0!==r&&(r=(r+"").toLowerCase(),"ucs2"===r||"ucs-2"===r||"utf16le"===r||"utf-16le"===r)){if(2>e.length||2>t.length)return -1;d=2,s/=2,l/=2,n/=2;}var c;if(a){var u=-1;for(c=n;c<s;c++)if(o(e,c)!==o(t,-1===u?0:c-u))-1!==u&&(c-=c-u),u=-1;else if(-1===u&&(u=c),c-u+1===l)return u*d}else for(n+l>s&&(n=s-l),c=n;0<=c;c--){for(var p=!0,f=0;f<l;f++)if(o(e,c+f)!==o(t,f)){p=!1;break}if(p)return c}return -1}function C(e,t,n,r){n=+n||0;var a=e.length-n;r?(r=+r,r>a&&(r=a)):r=a;var o=t.length;r>o/2&&(r=o/2);for(var d,s=0;s<r;++s){if(d=parseInt(t.substr(2*s,2),16),Y(d))return s;e[n+s]=d;}return s}function w(e,t,n,r){return V(j(t,e.length-n),e,n,r)}function R(e,t,n,r){return V(q(t),e,n,r)}function E(e,t,n,r){return R(e,t,n,r)}function S(e,t,n,r){return V(H(t),e,n,r)}function k(e,t,n,r){return V(W(t,e.length-n),e,n,r)}function T(e,t,n){return 0===t&&n===e.length?X.fromByteArray(e):X.fromByteArray(e.slice(t,n))}function v(e,t,n){n=K(e.length,n);for(var r=[],a=t;a<n;){var o=e[a],d=null,s=239<o?4:223<o?3:191<o?2:1;if(a+s<=n){var l,c,u,p;1===s?128>o&&(d=o):2===s?(l=e[a+1],128==(192&l)&&(p=(31&o)<<6|63&l,127<p&&(d=p))):3===s?(l=e[a+1],c=e[a+2],128==(192&l)&&128==(192&c)&&(p=(15&o)<<12|(63&l)<<6|63&c,2047<p&&(55296>p||57343<p)&&(d=p))):4===s?(l=e[a+1],c=e[a+2],u=e[a+3],128==(192&l)&&128==(192&c)&&128==(192&u)&&(p=(15&o)<<18|(63&l)<<12|(63&c)<<6|63&u,65535<p&&1114112>p&&(d=p))):void 0;}null===d?(d=65533,s=1):65535<d&&(d-=65536,r.push(55296|1023&d>>>10),d=56320|1023&d),r.push(d),a+=s;}return L(r)}function L(e){var t=e.length;if(t<=4096)return z.apply(String,e);for(var n="",r=0;r<t;)n+=z.apply(String,e.slice(r,r+=4096));return n}function A(e,t,n){var r="";n=K(e.length,n);for(var a=t;a<n;++a)r+=z(127&e[a]);return r}function x(e,t,n){var r="";n=K(e.length,n);for(var a=t;a<n;++a)r+=z(e[a]);return r}function N(e,t,n){var r=e.length;(!t||0>t)&&(t=0),(!n||0>n||n>r)&&(n=r);for(var a="",o=t;o<n;++o)a+=U(e[o]);return a}function I(e,t,n){for(var r=e.slice(t,n),a="",o=0;o<r.length;o+=2)a+=z(r[o]+256*r[o+1]);return a}function P(e,t,n){if(0!=e%1||0>e)throw new RangeError("offset is not uint");if(e+t>n)throw new RangeError("Trying to access beyond buffer length")}function M(e,t,n,r,a,i){if(!o.isBuffer(e))throw new TypeError("\"buffer\" argument must be a Buffer instance");if(t>a||t<i)throw new RangeError("\"value\" argument is out of bounds");if(n+r>e.length)throw new RangeError("Index out of range")}function D(e,t,n,r){if(n+r>e.length)throw new RangeError("Index out of range");if(0>n)throw new RangeError("Index out of range")}function F(e,t,n,r,a){return t=+t,n>>>=0,a||D(e,t,n,4),$.write(e,t,n,r,23,4),n+4}function O(e,t,n,r,a){return t=+t,n>>>=0,a||D(e,t,n,8),$.write(e,t,n,r,52,8),n+8}function B(e){if(e=e.split("=")[0],e=e.trim().replace(J,""),2>e.length)return "";for(;0!=e.length%4;)e+="=";return e}function U(e){return 16>e?"0"+e.toString(16):e.toString(16)}function j(e,t){t=t||1/0;for(var n,r=e.length,a=null,o=[],d=0;d<r;++d){if(n=e.charCodeAt(d),55295<n&&57344>n){if(!a){if(56319<n){-1<(t-=3)&&o.push(239,191,189);continue}else if(d+1===r){-1<(t-=3)&&o.push(239,191,189);continue}a=n;continue}if(56320>n){-1<(t-=3)&&o.push(239,191,189),a=n;continue}n=(a-55296<<10|n-56320)+65536;}else a&&-1<(t-=3)&&o.push(239,191,189);if(a=null,128>n){if(0>(t-=1))break;o.push(n);}else if(2048>n){if(0>(t-=2))break;o.push(192|n>>6,128|63&n);}else if(65536>n){if(0>(t-=3))break;o.push(224|n>>12,128|63&n>>6,128|63&n);}else if(1114112>n){if(0>(t-=4))break;o.push(240|n>>18,128|63&n>>12,128|63&n>>6,128|63&n);}else throw new Error("Invalid code point")}return o}function q(e){for(var t=[],n=0;n<e.length;++n)t.push(255&e.charCodeAt(n));return t}function W(e,t){for(var n,r,a,o=[],d=0;d<e.length&&!(0>(t-=2));++d)n=e.charCodeAt(d),r=n>>8,a=n%256,o.push(a),o.push(r);return o}function H(e){return X.toByteArray(B(e))}function V(e,t,n,r){for(var a=0;a<r&&!(a+n>=t.length||a>=e.length);++a)t[a+n]=e[a];return a}function G(e,t){return e instanceof t||null!=e&&null!=e.constructor&&null!=e.constructor.name&&e.constructor.name===t.name}function Y(e){return e!==e}var X=e("base64-js"),$=e("ieee754");n.Buffer=o,n.SlowBuffer=function(e){return +e!=e&&(e=0),o.alloc(+e)},n.INSPECT_MAX_BYTES=50;n.kMaxLength=2147483647,o.TYPED_ARRAY_SUPPORT=function(){try{var e=new Uint8Array(1);return e.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===e.foo()}catch(t){return !1}}(),o.TYPED_ARRAY_SUPPORT||"undefined"==typeof console||"function"!=typeof console.error||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."),Object.defineProperty(o.prototype,"parent",{enumerable:!0,get:function(){return o.isBuffer(this)?this.buffer:void 0}}),Object.defineProperty(o.prototype,"offset",{enumerable:!0,get:function(){return o.isBuffer(this)?this.byteOffset:void 0}}),"undefined"!=typeof Symbol&&null!=Symbol.species&&o[Symbol.species]===o&&Object.defineProperty(o,Symbol.species,{value:null,configurable:!0,enumerable:!1,writable:!1}),o.poolSize=8192,o.from=function(e,t,n){return i(e,t,n)},o.prototype.__proto__=Uint8Array.prototype,o.__proto__=Uint8Array,o.alloc=function(e,t,n){return s(e,t,n)},o.allocUnsafe=function(e){return l(e)},o.allocUnsafeSlow=function(e){return l(e)},o.isBuffer=function(e){return null!=e&&!0===e._isBuffer&&e!==o.prototype},o.compare=function(e,t){if(G(e,Uint8Array)&&(e=o.from(e,e.offset,e.byteLength)),G(t,Uint8Array)&&(t=o.from(t,t.offset,t.byteLength)),!o.isBuffer(e)||!o.isBuffer(t))throw new TypeError("The \"buf1\", \"buf2\" arguments must be one of type Buffer or Uint8Array");if(e===t)return 0;for(var n=e.length,r=t.length,d=0,s=K(n,r);d<s;++d)if(e[d]!==t[d]){n=e[d],r=t[d];break}return n<r?-1:r<n?1:0},o.isEncoding=function(e){switch((e+"").toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return !0;default:return !1;}},o.concat=function(e,t){if(!Array.isArray(e))throw new TypeError("\"list\" argument must be an Array of Buffers");if(0===e.length)return o.alloc(0);var n;if(t===void 0)for(t=0,n=0;n<e.length;++n)t+=e[n].length;var r=o.allocUnsafe(t),a=0;for(n=0;n<e.length;++n){var d=e[n];if(G(d,Uint8Array)&&(d=o.from(d)),!o.isBuffer(d))throw new TypeError("\"list\" argument must be an Array of Buffers");d.copy(r,a),a+=d.length;}return r},o.byteLength=h,o.prototype._isBuffer=!0,o.prototype.swap16=function(){var e=this.length;if(0!=e%2)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var t=0;t<e;t+=2)m(this,t,t+1);return this},o.prototype.swap32=function(){var e=this.length;if(0!=e%4)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var t=0;t<e;t+=4)m(this,t,t+3),m(this,t+1,t+2);return this},o.prototype.swap64=function(){var e=this.length;if(0!=e%8)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var t=0;t<e;t+=8)m(this,t,t+7),m(this,t+1,t+6),m(this,t+2,t+5),m(this,t+3,t+4);return this},o.prototype.toString=function(){var e=this.length;return 0===e?"":0===arguments.length?v(this,0,e):_.apply(this,arguments)},o.prototype.toLocaleString=o.prototype.toString,o.prototype.equals=function(e){if(!o.isBuffer(e))throw new TypeError("Argument must be a Buffer");return this===e||0===o.compare(this,e)},o.prototype.inspect=function(){var e="",t=n.INSPECT_MAX_BYTES;return e=this.toString("hex",0,t).replace(/(.{2})/g,"$1 ").trim(),this.length>t&&(e+=" ... "),"<Buffer "+e+">"},o.prototype.compare=function(e,t,n,r,a){if(G(e,Uint8Array)&&(e=o.from(e,e.offset,e.byteLength)),!o.isBuffer(e))throw new TypeError("The \"target\" argument must be one of type Buffer or Uint8Array. Received type "+typeof e);if(void 0===t&&(t=0),void 0===n&&(n=e?e.length:0),void 0===r&&(r=0),void 0===a&&(a=this.length),0>t||n>e.length||0>r||a>this.length)throw new RangeError("out of range index");if(r>=a&&t>=n)return 0;if(r>=a)return -1;if(t>=n)return 1;if(t>>>=0,n>>>=0,r>>>=0,a>>>=0,this===e)return 0;for(var d=a-r,s=n-t,l=K(d,s),c=this.slice(r,a),u=e.slice(t,n),p=0;p<l;++p)if(c[p]!==u[p]){d=c[p],s=u[p];break}return d<s?-1:s<d?1:0},o.prototype.includes=function(e,t,n){return -1!==this.indexOf(e,t,n)},o.prototype.indexOf=function(e,t,n){return b(this,e,t,n,!0)},o.prototype.lastIndexOf=function(e,t,n){return b(this,e,t,n,!1)},o.prototype.write=function(e,t,n,r){if(void 0===t)r="utf8",n=this.length,t=0;else if(void 0===n&&"string"==typeof t)r=t,n=this.length,t=0;else if(isFinite(t))t>>>=0,isFinite(n)?(n>>>=0,void 0===r&&(r="utf8")):(r=n,n=void 0);else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");var a=this.length-t;if((void 0===n||n>a)&&(n=a),0<e.length&&(0>n||0>t)||t>this.length)throw new RangeError("Attempt to write outside buffer bounds");r||(r="utf8");for(var o=!1;;)switch(r){case"hex":return C(this,e,t,n);case"utf8":case"utf-8":return w(this,e,t,n);case"ascii":return R(this,e,t,n);case"latin1":case"binary":return E(this,e,t,n);case"base64":return S(this,e,t,n);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return k(this,e,t,n);default:if(o)throw new TypeError("Unknown encoding: "+r);r=(""+r).toLowerCase(),o=!0;}},o.prototype.toJSON=function(){return {type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};o.prototype.slice=function(e,t){var n=this.length;e=~~e,t=void 0===t?n:~~t,0>e?(e+=n,0>e&&(e=0)):e>n&&(e=n),0>t?(t+=n,0>t&&(t=0)):t>n&&(t=n),t<e&&(t=e);var r=this.subarray(e,t);return r.__proto__=o.prototype,r},o.prototype.readUIntLE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var r=this[e],a=1,o=0;++o<t&&(a*=256);)r+=this[e+o]*a;return r},o.prototype.readUIntBE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var r=this[e+--t],a=1;0<t&&(a*=256);)r+=this[e+--t]*a;return r},o.prototype.readUInt8=function(e,t){return e>>>=0,t||P(e,1,this.length),this[e]},o.prototype.readUInt16LE=function(e,t){return e>>>=0,t||P(e,2,this.length),this[e]|this[e+1]<<8},o.prototype.readUInt16BE=function(e,t){return e>>>=0,t||P(e,2,this.length),this[e]<<8|this[e+1]},o.prototype.readUInt32LE=function(e,t){return e>>>=0,t||P(e,4,this.length),(this[e]|this[e+1]<<8|this[e+2]<<16)+16777216*this[e+3]},o.prototype.readUInt32BE=function(e,t){return e>>>=0,t||P(e,4,this.length),16777216*this[e]+(this[e+1]<<16|this[e+2]<<8|this[e+3])},o.prototype.readIntLE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var a=this[e],o=1,d=0;++d<t&&(o*=256);)a+=this[e+d]*o;return o*=128,a>=o&&(a-=r(2,8*t)),a},o.prototype.readIntBE=function(e,t,n){e>>>=0,t>>>=0,n||P(e,t,this.length);for(var a=t,o=1,d=this[e+--a];0<a&&(o*=256);)d+=this[e+--a]*o;return o*=128,d>=o&&(d-=r(2,8*t)),d},o.prototype.readInt8=function(e,t){return e>>>=0,t||P(e,1,this.length),128&this[e]?-1*(255-this[e]+1):this[e]},o.prototype.readInt16LE=function(e,t){e>>>=0,t||P(e,2,this.length);var n=this[e]|this[e+1]<<8;return 32768&n?4294901760|n:n},o.prototype.readInt16BE=function(e,t){e>>>=0,t||P(e,2,this.length);var n=this[e+1]|this[e]<<8;return 32768&n?4294901760|n:n},o.prototype.readInt32LE=function(e,t){return e>>>=0,t||P(e,4,this.length),this[e]|this[e+1]<<8|this[e+2]<<16|this[e+3]<<24},o.prototype.readInt32BE=function(e,t){return e>>>=0,t||P(e,4,this.length),this[e]<<24|this[e+1]<<16|this[e+2]<<8|this[e+3]},o.prototype.readFloatLE=function(e,t){return e>>>=0,t||P(e,4,this.length),$.read(this,e,!0,23,4)},o.prototype.readFloatBE=function(e,t){return e>>>=0,t||P(e,4,this.length),$.read(this,e,!1,23,4)},o.prototype.readDoubleLE=function(e,t){return e>>>=0,t||P(e,8,this.length),$.read(this,e,!0,52,8)},o.prototype.readDoubleBE=function(e,t){return e>>>=0,t||P(e,8,this.length),$.read(this,e,!1,52,8)},o.prototype.writeUIntLE=function(e,t,n,a){if(e=+e,t>>>=0,n>>>=0,!a){var o=r(2,8*n)-1;M(this,e,t,n,o,0);}var d=1,s=0;for(this[t]=255&e;++s<n&&(d*=256);)this[t+s]=255&e/d;return t+n},o.prototype.writeUIntBE=function(e,t,n,a){if(e=+e,t>>>=0,n>>>=0,!a){var o=r(2,8*n)-1;M(this,e,t,n,o,0);}var d=n-1,s=1;for(this[t+d]=255&e;0<=--d&&(s*=256);)this[t+d]=255&e/s;return t+n},o.prototype.writeUInt8=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,1,255,0),this[t]=255&e,t+1},o.prototype.writeUInt16LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,65535,0),this[t]=255&e,this[t+1]=e>>>8,t+2},o.prototype.writeUInt16BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,65535,0),this[t]=e>>>8,this[t+1]=255&e,t+2},o.prototype.writeUInt32LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,4294967295,0),this[t+3]=e>>>24,this[t+2]=e>>>16,this[t+1]=e>>>8,this[t]=255&e,t+4},o.prototype.writeUInt32BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,4294967295,0),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e,t+4},o.prototype.writeIntLE=function(e,t,n,a){if(e=+e,t>>>=0,!a){var o=r(2,8*n-1);M(this,e,t,n,o-1,-o);}var d=0,s=1,l=0;for(this[t]=255&e;++d<n&&(s*=256);)0>e&&0===l&&0!==this[t+d-1]&&(l=1),this[t+d]=255&(e/s>>0)-l;return t+n},o.prototype.writeIntBE=function(e,t,n,a){if(e=+e,t>>>=0,!a){var o=r(2,8*n-1);M(this,e,t,n,o-1,-o);}var d=n-1,s=1,l=0;for(this[t+d]=255&e;0<=--d&&(s*=256);)0>e&&0===l&&0!==this[t+d+1]&&(l=1),this[t+d]=255&(e/s>>0)-l;return t+n},o.prototype.writeInt8=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,1,127,-128),0>e&&(e=255+e+1),this[t]=255&e,t+1},o.prototype.writeInt16LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,32767,-32768),this[t]=255&e,this[t+1]=e>>>8,t+2},o.prototype.writeInt16BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,2,32767,-32768),this[t]=e>>>8,this[t+1]=255&e,t+2},o.prototype.writeInt32LE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,2147483647,-2147483648),this[t]=255&e,this[t+1]=e>>>8,this[t+2]=e>>>16,this[t+3]=e>>>24,t+4},o.prototype.writeInt32BE=function(e,t,n){return e=+e,t>>>=0,n||M(this,e,t,4,2147483647,-2147483648),0>e&&(e=4294967295+e+1),this[t]=e>>>24,this[t+1]=e>>>16,this[t+2]=e>>>8,this[t+3]=255&e,t+4},o.prototype.writeFloatLE=function(e,t,n){return F(this,e,t,!0,n)},o.prototype.writeFloatBE=function(e,t,n){return F(this,e,t,!1,n)},o.prototype.writeDoubleLE=function(e,t,n){return O(this,e,t,!0,n)},o.prototype.writeDoubleBE=function(e,t,n){return O(this,e,t,!1,n)},o.prototype.copy=function(e,t,n,r){if(!o.isBuffer(e))throw new TypeError("argument should be a Buffer");if(n||(n=0),r||0===r||(r=this.length),t>=e.length&&(t=e.length),t||(t=0),0<r&&r<n&&(r=n),r===n)return 0;if(0===e.length||0===this.length)return 0;if(0>t)throw new RangeError("targetStart out of bounds");if(0>n||n>=this.length)throw new RangeError("Index out of range");if(0>r)throw new RangeError("sourceEnd out of bounds");r>this.length&&(r=this.length),e.length-t<r-n&&(r=e.length-t+n);var a=r-n;if(this===e&&"function"==typeof Uint8Array.prototype.copyWithin)this.copyWithin(t,n,r);else if(this===e&&n<t&&t<r)for(var d=a-1;0<=d;--d)e[d+t]=this[d+n];else Uint8Array.prototype.set.call(e,this.subarray(n,r),t);return a},o.prototype.fill=function(e,t,n,r){if("string"==typeof e){if("string"==typeof t?(r=t,t=0,n=this.length):"string"==typeof n&&(r=n,n=this.length),void 0!==r&&"string"!=typeof r)throw new TypeError("encoding must be a string");if("string"==typeof r&&!o.isEncoding(r))throw new TypeError("Unknown encoding: "+r);if(1===e.length){var a=e.charCodeAt(0);("utf8"===r&&128>a||"latin1"===r)&&(e=a);}}else "number"==typeof e&&(e&=255);if(0>t||this.length<t||this.length<n)throw new RangeError("Out of range index");if(n<=t)return this;t>>>=0,n=n===void 0?this.length:n>>>0,e||(e=0);var d;if("number"==typeof e)for(d=t;d<n;++d)this[d]=e;else {var s=o.isBuffer(e)?e:o.from(e,r),l=s.length;if(0===l)throw new TypeError("The value \""+e+"\" is invalid for argument \"value\"");for(d=0;d<n-t;++d)this[d+t]=s[d%l];}return this};var J=/[^+/0-9A-Za-z-_]/g;}).call(this);}).call(this,e("buffer").Buffer);},{"base64-js":1,buffer:4,ieee754:9}],5:[function(e,t,n){(function(a){(function(){function r(){let e;try{e=n.storage.getItem("debug");}catch(e){}return !e&&"undefined"!=typeof a&&"env"in a&&(e=a.env.DEBUG),e}n.formatArgs=function(e){if(e[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+e[0]+(this.useColors?"%c ":" ")+"+"+t.exports.humanize(this.diff),!this.useColors)return;const n="color: "+this.color;e.splice(1,0,n,"color: inherit");let r=0,a=0;e[0].replace(/%[a-zA-Z%]/g,e=>{"%%"===e||(r++,"%c"===e&&(a=r));}),e.splice(a,0,n);},n.save=function(e){try{e?n.storage.setItem("debug",e):n.storage.removeItem("debug");}catch(e){}},n.load=r,n.useColors=function(){return !!("undefined"!=typeof window&&window.process&&("renderer"===window.process.type||window.process.__nwjs))||!("undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))&&("undefined"!=typeof document&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||"undefined"!=typeof window&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&31<=parseInt(RegExp.$1,10)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))},n.storage=function(){try{return localStorage}catch(e){}}(),n.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"],n.log=console.debug||console.log||(()=>{}),t.exports=e("./common")(n);const{formatters:o}=t.exports;o.j=function(e){try{return JSON.stringify(e)}catch(e){return "[UnexpectedJSONParseError]: "+e.message}};}).call(this);}).call(this,e("_process"));},{"./common":6,_process:12}],6:[function(e,t){t.exports=function(t){function r(e){function t(...e){if(!t.enabled)return;const a=t,o=+new Date,i=o-(n||o);a.diff=i,a.prev=n,a.curr=o,n=o,e[0]=r.coerce(e[0]),"string"!=typeof e[0]&&e.unshift("%O");let d=0;e[0]=e[0].replace(/%([a-zA-Z%])/g,(t,n)=>{if("%%"===t)return t;d++;const o=r.formatters[n];if("function"==typeof o){const n=e[d];t=o.call(a,n),e.splice(d,1),d--;}return t}),r.formatArgs.call(a,e);const s=a.log||r.log;s.apply(a,e);}let n;return t.namespace=e,t.enabled=r.enabled(e),t.useColors=r.useColors(),t.color=r.selectColor(e),t.destroy=a,t.extend=o,"function"==typeof r.init&&r.init(t),r.instances.push(t),t}function a(){const e=r.instances.indexOf(this);return -1!==e&&(r.instances.splice(e,1),!0)}function o(e,t){const n=r(this.namespace+("undefined"==typeof t?":":t)+e);return n.log=this.log,n}function i(e){return e.toString().substring(2,e.toString().length-2).replace(/\.\*\?$/,"*")}return r.debug=r,r.default=r,r.coerce=function(e){return e instanceof Error?e.stack||e.message:e},r.disable=function(){const e=[...r.names.map(i),...r.skips.map(i).map(e=>"-"+e)].join(",");return r.enable(""),e},r.enable=function(e){r.save(e),r.names=[],r.skips=[];let t;const n=("string"==typeof e?e:"").split(/[\s,]+/),a=n.length;for(t=0;t<a;t++)n[t]&&(e=n[t].replace(/\*/g,".*?"),"-"===e[0]?r.skips.push(new RegExp("^"+e.substr(1)+"$")):r.names.push(new RegExp("^"+e+"$")));for(t=0;t<r.instances.length;t++){const e=r.instances[t];e.enabled=r.enabled(e.namespace);}},r.enabled=function(e){if("*"===e[e.length-1])return !0;let t,n;for(t=0,n=r.skips.length;t<n;t++)if(r.skips[t].test(e))return !1;for(t=0,n=r.names.length;t<n;t++)if(r.names[t].test(e))return !0;return !1},r.humanize=e("ms"),Object.keys(t).forEach(e=>{r[e]=t[e];}),r.instances=[],r.names=[],r.skips=[],r.formatters={},r.selectColor=function(e){let t=0;for(let n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n),t|=0;return r.colors[n(t)%r.colors.length]},r.enable(r.load()),r};},{ms:11}],7:[function(e,t){function n(e,t){for(const n in t)Object.defineProperty(e,n,{value:t[n],enumerable:!0,configurable:!0});return e}t.exports=function(e,t,r){if(!e||"string"==typeof e)throw new TypeError("Please pass an Error to err-code");r||(r={}),"object"==typeof t&&(r=t,t=void 0),null!=t&&(r.code=t);try{return n(e,r)}catch(t){r.message=e.message,r.stack=e.stack;const a=function(){};return a.prototype=Object.create(Object.getPrototypeOf(e)),n(new a,r)}};},{}],8:[function(e,t){t.exports=function(){if("undefined"==typeof window)return null;var e={RTCPeerConnection:window.RTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection,RTCSessionDescription:window.RTCSessionDescription||window.mozRTCSessionDescription||window.webkitRTCSessionDescription,RTCIceCandidate:window.RTCIceCandidate||window.mozRTCIceCandidate||window.webkitRTCIceCandidate};return e.RTCPeerConnection?e:null};},{}],9:[function(e,a,o){/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */o.read=function(t,n,a,o,l){var c,u,p=8*l-o-1,f=(1<<p)-1,g=f>>1,h=-7,_=a?l-1:0,b=a?-1:1,d=t[n+_];for(_+=b,c=d&(1<<-h)-1,d>>=-h,h+=p;0<h;c=256*c+t[n+_],_+=b,h-=8);for(u=c&(1<<-h)-1,c>>=-h,h+=o;0<h;u=256*u+t[n+_],_+=b,h-=8);if(0===c)c=1-g;else {if(c===f)return u?NaN:(d?-1:1)*(1/0);u+=r(2,o),c-=g;}return (d?-1:1)*u*r(2,c-o)},o.write=function(a,o,l,u,p,f){var _,b,y,g=Math.LN2,h=Math.log,C=8*f-p-1,w=(1<<C)-1,R=w>>1,E=23===p?r(2,-24)-r(2,-77):0,S=u?0:f-1,k=u?1:-1,d=0>o||0===o&&0>1/o?1:0;for(o=n(o),isNaN(o)||o===1/0?(b=isNaN(o)?1:0,_=w):(_=t(h(o)/g),1>o*(y=r(2,-_))&&(_--,y*=2),o+=1<=_+R?E/y:E*r(2,1-R),2<=o*y&&(_++,y/=2),_+R>=w?(b=0,_=w):1<=_+R?(b=(o*y-1)*r(2,p),_+=R):(b=o*r(2,R-1)*r(2,p),_=0));8<=p;a[l+S]=255&b,S+=k,b/=256,p-=8);for(_=_<<p|b,C+=p;0<C;a[l+S]=255&_,S+=k,_/=256,C-=8);a[l+S-k]|=128*d;};},{}],10:[function(e,t){t.exports="function"==typeof Object.create?function(e,t){t&&(e.super_=t,e.prototype=Object.create(t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}));}:function(e,t){if(t){e.super_=t;var n=function(){};n.prototype=t.prototype,e.prototype=new n,e.prototype.constructor=e;}};},{}],11:[function(e,t){var s=Math.round;function r(e){if(e+="",!(100<e.length)){var t=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(t){var r=parseFloat(t[1]),n=(t[2]||"ms").toLowerCase();return "years"===n||"year"===n||"yrs"===n||"yr"===n||"y"===n?31557600000*r:"weeks"===n||"week"===n||"w"===n?604800000*r:"days"===n||"day"===n||"d"===n?86400000*r:"hours"===n||"hour"===n||"hrs"===n||"hr"===n||"h"===n?3600000*r:"minutes"===n||"minute"===n||"mins"===n||"min"===n||"m"===n?60000*r:"seconds"===n||"second"===n||"secs"===n||"sec"===n||"s"===n?1000*r:"milliseconds"===n||"millisecond"===n||"msecs"===n||"msec"===n||"ms"===n?r:void 0}}}function a(e){var t=n(e);return 86400000<=t?s(e/86400000)+"d":3600000<=t?s(e/3600000)+"h":60000<=t?s(e/60000)+"m":1000<=t?s(e/1000)+"s":e+"ms"}function o(e){var t=n(e);return 86400000<=t?i(e,t,86400000,"day"):3600000<=t?i(e,t,3600000,"hour"):60000<=t?i(e,t,60000,"minute"):1000<=t?i(e,t,1000,"second"):e+" ms"}function i(e,t,r,n){return s(e/r)+" "+n+(t>=1.5*r?"s":"")}t.exports=function(e,t){t=t||{};var n=typeof e;if("string"==n&&0<e.length)return r(e);if("number"===n&&isFinite(e))return t.long?o(e):a(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};},{}],12:[function(e,t){function n(){throw new Error("setTimeout has not been defined")}function r(){throw new Error("clearTimeout has not been defined")}function a(t){if(c===setTimeout)return setTimeout(t,0);if((c===n||!c)&&setTimeout)return c=setTimeout,setTimeout(t,0);try{return c(t,0)}catch(n){try{return c.call(null,t,0)}catch(n){return c.call(this,t,0)}}}function o(t){if(u===clearTimeout)return clearTimeout(t);if((u===r||!u)&&clearTimeout)return u=clearTimeout,clearTimeout(t);try{return u(t)}catch(n){try{return u.call(null,t)}catch(n){return u.call(this,t)}}}function i(){h&&f&&(h=!1,f.length?g=f.concat(g):_=-1,g.length&&d());}function d(){if(!h){var e=a(i);h=!0;for(var t=g.length;t;){for(f=g,g=[];++_<t;)f&&f[_].run();_=-1,t=g.length;}f=null,h=!1,o(e);}}function s(e,t){this.fun=e,this.array=t;}function l(){}var c,u,p=t.exports={};(function(){try{c="function"==typeof setTimeout?setTimeout:n;}catch(t){c=n;}try{u="function"==typeof clearTimeout?clearTimeout:r;}catch(t){u=r;}})();var f,g=[],h=!1,_=-1;p.nextTick=function(e){var t=Array(arguments.length-1);if(1<arguments.length)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];g.push(new s(e,t)),1!==g.length||h||a(d);},s.prototype.run=function(){this.fun.apply(null,this.array);},p.title="browser",p.browser=!0,p.env={},p.argv=[],p.version="",p.versions={},p.on=l,p.addListener=l,p.once=l,p.off=l,p.removeListener=l,p.removeAllListeners=l,p.emit=l,p.prependListener=l,p.prependOnceListener=l,p.listeners=function(){return []},p.binding=function(){throw new Error("process.binding is not supported")},p.cwd=function(){return "/"},p.chdir=function(){throw new Error("process.chdir is not supported")},p.umask=function(){return 0};},{}],13:[function(e,t){/*! queue-microtask. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */let n;t.exports="function"==typeof queueMicrotask?queueMicrotask.bind(globalThis):e=>(n||(n=Promise.resolve())).then(e).catch(e=>setTimeout(()=>{throw e},0));},{}],14:[function(e,t){(function(n,r){(function(){var a=e("safe-buffer").Buffer,o=r.crypto||r.msCrypto;t.exports=o&&o.getRandomValues?function(e,t){if(e>4294967295)throw new RangeError("requested too many random bytes");var r=a.allocUnsafe(e);if(0<e)if(65536<e)for(var i=0;i<e;i+=65536)o.getRandomValues(r.slice(i,i+65536));else o.getRandomValues(r);return "function"==typeof t?n.nextTick(function(){t(null,r);}):r}:function(){throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11")};}).call(this);}).call(this,e("_process"),"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{_process:12,"safe-buffer":30}],15:[function(e,t){function n(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,e.__proto__=t;}function r(e,t,r){function a(e,n,r){return "string"==typeof t?t:t(e,n,r)}r||(r=Error);var o=function(e){function t(t,n,r){return e.call(this,a(t,n,r))||this}return n(t,e),t}(r);o.prototype.name=r.name,o.prototype.code=e,s[e]=o;}function a(e,t){if(Array.isArray(e)){var n=e.length;return e=e.map(function(e){return e+""}),2<n?"one of ".concat(t," ").concat(e.slice(0,n-1).join(", "),", or ")+e[n-1]:2===n?"one of ".concat(t," ").concat(e[0]," or ").concat(e[1]):"of ".concat(t," ").concat(e[0])}return "of ".concat(t," ").concat(e+"")}function o(e,t,n){return e.substr(!n||0>n?0:+n,t.length)===t}function i(e,t,n){return (void 0===n||n>e.length)&&(n=e.length),e.substring(n-t.length,n)===t}function d(e,t,n){return "number"!=typeof n&&(n=0),!(n+t.length>e.length)&&-1!==e.indexOf(t,n)}var s={};r("ERR_INVALID_OPT_VALUE",function(e,t){return "The value \""+t+"\" is invalid for option \""+e+"\""},TypeError),r("ERR_INVALID_ARG_TYPE",function(e,t,n){var r;"string"==typeof t&&o(t,"not ")?(r="must not be",t=t.replace(/^not /,"")):r="must be";var s;if(i(e," argument"))s="The ".concat(e," ").concat(r," ").concat(a(t,"type"));else {var l=d(e,".")?"property":"argument";s="The \"".concat(e,"\" ").concat(l," ").concat(r," ").concat(a(t,"type"));}return s+=". Received type ".concat(typeof n),s},TypeError),r("ERR_STREAM_PUSH_AFTER_EOF","stream.push() after EOF"),r("ERR_METHOD_NOT_IMPLEMENTED",function(e){return "The "+e+" method is not implemented"}),r("ERR_STREAM_PREMATURE_CLOSE","Premature close"),r("ERR_STREAM_DESTROYED",function(e){return "Cannot call "+e+" after a stream was destroyed"}),r("ERR_MULTIPLE_CALLBACK","Callback called multiple times"),r("ERR_STREAM_CANNOT_PIPE","Cannot pipe, not readable"),r("ERR_STREAM_WRITE_AFTER_END","write after end"),r("ERR_STREAM_NULL_VALUES","May not write null values to stream",TypeError),r("ERR_UNKNOWN_ENCODING",function(e){return "Unknown encoding: "+e},TypeError),r("ERR_STREAM_UNSHIFT_AFTER_END_EVENT","stream.unshift() after end event"),t.exports.codes=s;},{}],16:[function(e,t){(function(n){(function(){function r(e){return this instanceof r?void(d.call(this,e),s.call(this,e),this.allowHalfOpen=!0,e&&(!1===e.readable&&(this.readable=!1),!1===e.writable&&(this.writable=!1),!1===e.allowHalfOpen&&(this.allowHalfOpen=!1,this.once("end",a)))):new r(e)}function a(){this._writableState.ended||n.nextTick(o,this);}function o(e){e.end();}var i=Object.keys||function(e){var t=[];for(var n in e)t.push(n);return t};t.exports=r;var d=e("./_stream_readable"),s=e("./_stream_writable");e("inherits")(r,d);for(var l,c=i(s.prototype),u=0;u<c.length;u++)l=c[u],r.prototype[l]||(r.prototype[l]=s.prototype[l]);Object.defineProperty(r.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark}}),Object.defineProperty(r.prototype,"writableBuffer",{enumerable:!1,get:function(){return this._writableState&&this._writableState.getBuffer()}}),Object.defineProperty(r.prototype,"writableLength",{enumerable:!1,get:function(){return this._writableState.length}}),Object.defineProperty(r.prototype,"destroyed",{enumerable:!1,get:function(){return void 0!==this._readableState&&void 0!==this._writableState&&this._readableState.destroyed&&this._writableState.destroyed},set:function(e){void 0===this._readableState||void 0===this._writableState||(this._readableState.destroyed=e,this._writableState.destroyed=e);}});}).call(this);}).call(this,e("_process"));},{"./_stream_readable":18,"./_stream_writable":20,_process:12,inherits:10}],17:[function(e,t){function n(e){return this instanceof n?void r.call(this,e):new n(e)}t.exports=n;var r=e("./_stream_transform");e("inherits")(n,r),n.prototype._transform=function(e,t,n){n(null,e);};},{"./_stream_transform":19,inherits:10}],18:[function(e,t){(function(n,r){(function(){function a(e){return M.from(e)}function o(e){return M.isBuffer(e)||e instanceof D}function i(e,t,n){return "function"==typeof e.prependListener?e.prependListener(t,n):void(e._events&&e._events[t]?Array.isArray(e._events[t])?e._events[t].unshift(n):e._events[t]=[n,e._events[t]]:e.on(t,n))}function d(t,n,r){A=A||e("./_stream_duplex"),t=t||{},"boolean"!=typeof r&&(r=n instanceof A),this.objectMode=!!t.objectMode,r&&(this.objectMode=this.objectMode||!!t.readableObjectMode),this.highWaterMark=H(this,t,"readableHighWaterMark",r),this.buffer=new j,this.length=0,this.pipes=null,this.pipesCount=0,this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this.paused=!0,this.emitClose=!1!==t.emitClose,this.autoDestroy=!!t.autoDestroy,this.destroyed=!1,this.defaultEncoding=t.defaultEncoding||"utf8",this.awaitDrain=0,this.readingMore=!1,this.decoder=null,this.encoding=null,t.encoding&&(!O&&(O=e("string_decoder/").StringDecoder),this.decoder=new O(t.encoding),this.encoding=t.encoding);}function s(t){if(A=A||e("./_stream_duplex"),!(this instanceof s))return new s(t);var n=this instanceof A;this._readableState=new d(t,this,n),this.readable=!0,t&&("function"==typeof t.read&&(this._read=t.read),"function"==typeof t.destroy&&(this._destroy=t.destroy)),P.call(this);}function l(e,t,n,r,o){x("readableAddChunk",t);var i=e._readableState;if(null===t)i.reading=!1,g(e,i);else {var d;if(o||(d=u(i,t)),d)X(e,d);else if(!(i.objectMode||t&&0<t.length))r||(i.reading=!1,m(e,i));else if("string"==typeof t||i.objectMode||Object.getPrototypeOf(t)===M.prototype||(t=a(t)),r)i.endEmitted?X(e,new K):c(e,i,t,!0);else if(i.ended)X(e,new Y);else {if(i.destroyed)return !1;i.reading=!1,i.decoder&&!n?(t=i.decoder.write(t),i.objectMode||0!==t.length?c(e,i,t,!1):m(e,i)):c(e,i,t,!1);}}return !i.ended&&(i.length<i.highWaterMark||0===i.length)}function c(e,t,n,r){t.flowing&&0===t.length&&!t.sync?(t.awaitDrain=0,e.emit("data",n)):(t.length+=t.objectMode?1:n.length,r?t.buffer.unshift(n):t.buffer.push(n),t.needReadable&&h(e)),m(e,t);}function u(e,t){var n;return o(t)||"string"==typeof t||void 0===t||e.objectMode||(n=new G("chunk",["string","Buffer","Uint8Array"],t)),n}function p(e){return 1073741824<=e?e=1073741824:(e--,e|=e>>>1,e|=e>>>2,e|=e>>>4,e|=e>>>8,e|=e>>>16,e++),e}function f(e,t){return 0>=e||0===t.length&&t.ended?0:t.objectMode?1:e===e?(e>t.highWaterMark&&(t.highWaterMark=p(e)),e<=t.length?e:t.ended?t.length:(t.needReadable=!0,0)):t.flowing&&t.length?t.buffer.head.data.length:t.length}function g(e,t){if(x("onEofChunk"),!t.ended){if(t.decoder){var n=t.decoder.end();n&&n.length&&(t.buffer.push(n),t.length+=t.objectMode?1:n.length);}t.ended=!0,t.sync?h(e):(t.needReadable=!1,!t.emittedReadable&&(t.emittedReadable=!0,_(e)));}}function h(e){var t=e._readableState;x("emitReadable",t.needReadable,t.emittedReadable),t.needReadable=!1,t.emittedReadable||(x("emitReadable",t.flowing),t.emittedReadable=!0,n.nextTick(_,e));}function _(e){var t=e._readableState;x("emitReadable_",t.destroyed,t.length,t.ended),!t.destroyed&&(t.length||t.ended)&&(e.emit("readable"),t.emittedReadable=!1),t.needReadable=!t.flowing&&!t.ended&&t.length<=t.highWaterMark,S(e);}function m(e,t){t.readingMore||(t.readingMore=!0,n.nextTick(b,e,t));}function b(e,t){for(;!t.reading&&!t.ended&&(t.length<t.highWaterMark||t.flowing&&0===t.length);){var n=t.length;if(x("maybeReadMore read 0"),e.read(0),n===t.length)break}t.readingMore=!1;}function y(e){return function(){var t=e._readableState;x("pipeOnDrain",t.awaitDrain),t.awaitDrain&&t.awaitDrain--,0===t.awaitDrain&&I(e,"data")&&(t.flowing=!0,S(e));}}function C(e){var t=e._readableState;t.readableListening=0<e.listenerCount("readable"),t.resumeScheduled&&!t.paused?t.flowing=!0:0<e.listenerCount("data")&&e.resume();}function w(e){x("readable nexttick read 0"),e.read(0);}function R(e,t){t.resumeScheduled||(t.resumeScheduled=!0,n.nextTick(E,e,t));}function E(e,t){x("resume",t.reading),t.reading||e.read(0),t.resumeScheduled=!1,e.emit("resume"),S(e),t.flowing&&!t.reading&&e.read(0);}function S(e){var t=e._readableState;for(x("flow",t.flowing);t.flowing&&null!==e.read(););}function k(e,t){if(0===t.length)return null;var n;return t.objectMode?n=t.buffer.shift():!e||e>=t.length?(n=t.decoder?t.buffer.join(""):1===t.buffer.length?t.buffer.first():t.buffer.concat(t.length),t.buffer.clear()):n=t.buffer.consume(e,t.decoder),n}function T(e){var t=e._readableState;x("endReadable",t.endEmitted),t.endEmitted||(t.ended=!0,n.nextTick(v,t,e));}function v(e,t){if(x("endReadableNT",e.endEmitted,e.length),!e.endEmitted&&0===e.length&&(e.endEmitted=!0,t.readable=!1,t.emit("end"),e.autoDestroy)){var n=t._writableState;(!n||n.autoDestroy&&n.finished)&&t.destroy();}}function L(e,t){for(var n=0,r=e.length;n<r;n++)if(e[n]===t)return n;return -1}t.exports=s;var A;s.ReadableState=d;var x,N=e("events").EventEmitter,I=function(e,t){return e.listeners(t).length},P=e("./internal/streams/stream"),M=e("buffer").Buffer,D=r.Uint8Array||function(){},F=e("util");x=F&&F.debuglog?F.debuglog("stream"):function(){};var O,B,U,j=e("./internal/streams/buffer_list"),q=e("./internal/streams/destroy"),W=e("./internal/streams/state"),H=W.getHighWaterMark,V=e("../errors").codes,G=V.ERR_INVALID_ARG_TYPE,Y=V.ERR_STREAM_PUSH_AFTER_EOF,z=V.ERR_METHOD_NOT_IMPLEMENTED,K=V.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;e("inherits")(s,P);var X=q.errorOrDestroy,$=["error","close","destroy","pause","resume"];Object.defineProperty(s.prototype,"destroyed",{enumerable:!1,get:function(){return void 0!==this._readableState&&this._readableState.destroyed},set:function(e){this._readableState&&(this._readableState.destroyed=e);}}),s.prototype.destroy=q.destroy,s.prototype._undestroy=q.undestroy,s.prototype._destroy=function(e,t){t(e);},s.prototype.push=function(e,t){var n,r=this._readableState;return r.objectMode?n=!0:"string"==typeof e&&(t=t||r.defaultEncoding,t!==r.encoding&&(e=M.from(e,t),t=""),n=!0),l(this,e,t,!1,n)},s.prototype.unshift=function(e){return l(this,e,null,!0,!1)},s.prototype.isPaused=function(){return !1===this._readableState.flowing},s.prototype.setEncoding=function(t){O||(O=e("string_decoder/").StringDecoder);var n=new O(t);this._readableState.decoder=n,this._readableState.encoding=this._readableState.decoder.encoding;for(var r=this._readableState.buffer.head,a="";null!==r;)a+=n.write(r.data),r=r.next;return this._readableState.buffer.clear(),""!==a&&this._readableState.buffer.push(a),this._readableState.length=a.length,this};s.prototype.read=function(e){x("read",e),e=parseInt(e,10);var t=this._readableState,r=e;if(0!==e&&(t.emittedReadable=!1),0===e&&t.needReadable&&((0===t.highWaterMark?0<t.length:t.length>=t.highWaterMark)||t.ended))return x("read: emitReadable",t.length,t.ended),0===t.length&&t.ended?T(this):h(this),null;if(e=f(e,t),0===e&&t.ended)return 0===t.length&&T(this),null;var a=t.needReadable;x("need readable",a),(0===t.length||t.length-e<t.highWaterMark)&&(a=!0,x("length less than watermark",a)),t.ended||t.reading?(a=!1,x("reading or ended",a)):a&&(x("do read"),t.reading=!0,t.sync=!0,0===t.length&&(t.needReadable=!0),this._read(t.highWaterMark),t.sync=!1,!t.reading&&(e=f(r,t)));var o;return o=0<e?k(e,t):null,null===o?(t.needReadable=t.length<=t.highWaterMark,e=0):(t.length-=e,t.awaitDrain=0),0===t.length&&(!t.ended&&(t.needReadable=!0),r!==e&&t.ended&&T(this)),null!==o&&this.emit("data",o),o},s.prototype._read=function(){X(this,new z("_read()"));},s.prototype.pipe=function(e,t){function r(e,t){x("onunpipe"),e===p&&t&&!1===t.hasUnpiped&&(t.hasUnpiped=!0,o());}function a(){x("onend"),e.end();}function o(){x("cleanup"),e.removeListener("close",l),e.removeListener("finish",c),e.removeListener("drain",_),e.removeListener("error",s),e.removeListener("unpipe",r),p.removeListener("end",a),p.removeListener("end",u),p.removeListener("data",d),m=!0,f.awaitDrain&&(!e._writableState||e._writableState.needDrain)&&_();}function d(t){x("ondata");var n=e.write(t);x("dest.write",n),!1===n&&((1===f.pipesCount&&f.pipes===e||1<f.pipesCount&&-1!==L(f.pipes,e))&&!m&&(x("false write response, pause",f.awaitDrain),f.awaitDrain++),p.pause());}function s(t){x("onerror",t),u(),e.removeListener("error",s),0===I(e,"error")&&X(e,t);}function l(){e.removeListener("finish",c),u();}function c(){x("onfinish"),e.removeListener("close",l),u();}function u(){x("unpipe"),p.unpipe(e);}var p=this,f=this._readableState;switch(f.pipesCount){case 0:f.pipes=e;break;case 1:f.pipes=[f.pipes,e];break;default:f.pipes.push(e);}f.pipesCount+=1,x("pipe count=%d opts=%j",f.pipesCount,t);var g=(!t||!1!==t.end)&&e!==n.stdout&&e!==n.stderr,h=g?a:u;f.endEmitted?n.nextTick(h):p.once("end",h),e.on("unpipe",r);var _=y(p);e.on("drain",_);var m=!1;return p.on("data",d),i(e,"error",s),e.once("close",l),e.once("finish",c),e.emit("pipe",p),f.flowing||(x("pipe resume"),p.resume()),e},s.prototype.unpipe=function(e){var t=this._readableState,n={hasUnpiped:!1};if(0===t.pipesCount)return this;if(1===t.pipesCount)return e&&e!==t.pipes?this:(e||(e=t.pipes),t.pipes=null,t.pipesCount=0,t.flowing=!1,e&&e.emit("unpipe",this,n),this);if(!e){var r=t.pipes,a=t.pipesCount;t.pipes=null,t.pipesCount=0,t.flowing=!1;for(var o=0;o<a;o++)r[o].emit("unpipe",this,{hasUnpiped:!1});return this}var d=L(t.pipes,e);return -1===d?this:(t.pipes.splice(d,1),t.pipesCount-=1,1===t.pipesCount&&(t.pipes=t.pipes[0]),e.emit("unpipe",this,n),this)},s.prototype.on=function(e,t){var r=P.prototype.on.call(this,e,t),a=this._readableState;return "data"===e?(a.readableListening=0<this.listenerCount("readable"),!1!==a.flowing&&this.resume()):"readable"==e&&!a.endEmitted&&!a.readableListening&&(a.readableListening=a.needReadable=!0,a.flowing=!1,a.emittedReadable=!1,x("on readable",a.length,a.reading),a.length?h(this):!a.reading&&n.nextTick(w,this)),r},s.prototype.addListener=s.prototype.on,s.prototype.removeListener=function(e,t){var r=P.prototype.removeListener.call(this,e,t);return "readable"===e&&n.nextTick(C,this),r},s.prototype.removeAllListeners=function(e){var t=P.prototype.removeAllListeners.apply(this,arguments);return ("readable"===e||void 0===e)&&n.nextTick(C,this),t},s.prototype.resume=function(){var e=this._readableState;return e.flowing||(x("resume"),e.flowing=!e.readableListening,R(this,e)),e.paused=!1,this},s.prototype.pause=function(){return x("call pause flowing=%j",this._readableState.flowing),!1!==this._readableState.flowing&&(x("pause"),this._readableState.flowing=!1,this.emit("pause")),this._readableState.paused=!0,this},s.prototype.wrap=function(e){var t=this,r=this._readableState,a=!1;for(var o in e.on("end",function(){if(x("wrapped end"),r.decoder&&!r.ended){var e=r.decoder.end();e&&e.length&&t.push(e);}t.push(null);}),e.on("data",function(n){if((x("wrapped data"),r.decoder&&(n=r.decoder.write(n)),!(r.objectMode&&(null===n||void 0===n)))&&(r.objectMode||n&&n.length)){var o=t.push(n);o||(a=!0,e.pause());}}),e)void 0===this[o]&&"function"==typeof e[o]&&(this[o]=function(t){return function(){return e[t].apply(e,arguments)}}(o));for(var i=0;i<$.length;i++)e.on($[i],this.emit.bind(this,$[i]));return this._read=function(t){x("wrapped _read",t),a&&(a=!1,e.resume());},this},"function"==typeof Symbol&&(s.prototype[Symbol.asyncIterator]=function(){return void 0===B&&(B=e("./internal/streams/async_iterator")),B(this)}),Object.defineProperty(s.prototype,"readableHighWaterMark",{enumerable:!1,get:function(){return this._readableState.highWaterMark}}),Object.defineProperty(s.prototype,"readableBuffer",{enumerable:!1,get:function(){return this._readableState&&this._readableState.buffer}}),Object.defineProperty(s.prototype,"readableFlowing",{enumerable:!1,get:function(){return this._readableState.flowing},set:function(e){this._readableState&&(this._readableState.flowing=e);}}),s._fromList=k,Object.defineProperty(s.prototype,"readableLength",{enumerable:!1,get:function(){return this._readableState.length}}),"function"==typeof Symbol&&(s.from=function(t,n){return void 0===U&&(U=e("./internal/streams/from")),U(s,t,n)});}).call(this);}).call(this,e("_process"),"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{"../errors":15,"./_stream_duplex":16,"./internal/streams/async_iterator":21,"./internal/streams/buffer_list":22,"./internal/streams/destroy":23,"./internal/streams/from":25,"./internal/streams/state":27,"./internal/streams/stream":28,_process:12,buffer:4,events:3,inherits:10,"string_decoder/":31,util:2}],19:[function(e,t){function n(e,t){var n=this._transformState;n.transforming=!1;var r=n.writecb;if(null===r)return this.emit("error",new s);n.writechunk=null,n.writecb=null,null!=t&&this.push(t),r(e);var a=this._readableState;a.reading=!1,(a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark);}function r(e){return this instanceof r?void(u.call(this,e),this._transformState={afterTransform:n.bind(this),needTransform:!1,transforming:!1,writecb:null,writechunk:null,writeencoding:null},this._readableState.needReadable=!0,this._readableState.sync=!1,e&&("function"==typeof e.transform&&(this._transform=e.transform),"function"==typeof e.flush&&(this._flush=e.flush)),this.on("prefinish",a)):new r(e)}function a(){var e=this;"function"!=typeof this._flush||this._readableState.destroyed?o(this,null,null):this._flush(function(t,n){o(e,t,n);});}function o(e,t,n){if(t)return e.emit("error",t);if(null!=n&&e.push(n),e._writableState.length)throw new c;if(e._transformState.transforming)throw new l;return e.push(null)}t.exports=r;var i=e("../errors").codes,d=i.ERR_METHOD_NOT_IMPLEMENTED,s=i.ERR_MULTIPLE_CALLBACK,l=i.ERR_TRANSFORM_ALREADY_TRANSFORMING,c=i.ERR_TRANSFORM_WITH_LENGTH_0,u=e("./_stream_duplex");e("inherits")(r,u),r.prototype.push=function(e,t){return this._transformState.needTransform=!1,u.prototype.push.call(this,e,t)},r.prototype._transform=function(e,t,n){n(new d("_transform()"));},r.prototype._write=function(e,t,n){var r=this._transformState;if(r.writecb=n,r.writechunk=e,r.writeencoding=t,!r.transforming){var a=this._readableState;(r.needTransform||a.needReadable||a.length<a.highWaterMark)&&this._read(a.highWaterMark);}},r.prototype._read=function(){var e=this._transformState;null===e.writechunk||e.transforming?e.needTransform=!0:(e.transforming=!0,this._transform(e.writechunk,e.writeencoding,e.afterTransform));},r.prototype._destroy=function(e,t){u.prototype._destroy.call(this,e,function(e){t(e);});};},{"../errors":15,"./_stream_duplex":16,inherits:10}],20:[function(e,t){(function(n,r){(function(){function a(e){var t=this;this.next=null,this.entry=null,this.finish=function(){T(t,e);};}function o(e){return x.from(e)}function i(e){return x.isBuffer(e)||e instanceof N}function d(){}function s(t,n,r){v=v||e("./_stream_duplex"),t=t||{},"boolean"!=typeof r&&(r=n instanceof v),this.objectMode=!!t.objectMode,r&&(this.objectMode=this.objectMode||!!t.writableObjectMode),this.highWaterMark=M(this,t,"writableHighWaterMark",r),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1;var o=!1===t.decodeStrings;this.decodeStrings=!o,this.defaultEncoding=t.defaultEncoding||"utf8",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=function(e){m(n,e);},this.writecb=null,this.writelen=0,this.bufferedRequest=null,this.lastBufferedRequest=null,this.pendingcb=0,this.prefinished=!1,this.errorEmitted=!1,this.emitClose=!1!==t.emitClose,this.autoDestroy=!!t.autoDestroy,this.bufferedRequestCount=0,this.corkedRequestsFree=new a(this);}function l(t){v=v||e("./_stream_duplex");var n=this instanceof v;return n||G.call(l,this)?void(this._writableState=new s(t,this,n),this.writable=!0,t&&("function"==typeof t.write&&(this._write=t.write),"function"==typeof t.writev&&(this._writev=t.writev),"function"==typeof t.destroy&&(this._destroy=t.destroy),"function"==typeof t.final&&(this._final=t.final)),A.call(this)):new l(t)}function c(e,t){var r=new W;V(e,r),n.nextTick(t,r);}function u(e,t,r,a){var o;return null===r?o=new q:"string"!=typeof r&&!t.objectMode&&(o=new F("chunk",["string","Buffer"],r)),!o||(V(e,o),n.nextTick(a,o),!1)}function p(e,t,n){return e.objectMode||!1===e.decodeStrings||"string"!=typeof t||(t=x.from(t,n)),t}function f(e,t,n,r,a,o){if(!n){var i=p(t,r,a);r!==i&&(n=!0,a="buffer",r=i);}var d=t.objectMode?1:r.length;t.length+=d;var s=t.length<t.highWaterMark;if(s||(t.needDrain=!0),t.writing||t.corked){var l=t.lastBufferedRequest;t.lastBufferedRequest={chunk:r,encoding:a,isBuf:n,callback:o,next:null},l?l.next=t.lastBufferedRequest:t.bufferedRequest=t.lastBufferedRequest,t.bufferedRequestCount+=1;}else g(e,t,!1,d,r,a,o);return s}function g(e,t,n,r,a,o,i){t.writelen=r,t.writecb=i,t.writing=!0,t.sync=!0,t.destroyed?t.onwrite(new j("write")):n?e._writev(a,t.onwrite):e._write(a,o,t.onwrite),t.sync=!1;}function h(e,t,r,a,o){--t.pendingcb,r?(n.nextTick(o,a),n.nextTick(S,e,t),e._writableState.errorEmitted=!0,V(e,a)):(o(a),e._writableState.errorEmitted=!0,V(e,a),S(e,t));}function _(e){e.writing=!1,e.writecb=null,e.length-=e.writelen,e.writelen=0;}function m(e,t){var r=e._writableState,a=r.sync,o=r.writecb;if("function"!=typeof o)throw new B;if(_(r),t)h(e,r,a,t,o);else {var i=w(r)||e.destroyed;i||r.corked||r.bufferProcessing||!r.bufferedRequest||C(e,r),a?n.nextTick(b,e,r,i,o):b(e,r,i,o);}}function b(e,t,n,r){n||y(e,t),t.pendingcb--,r(),S(e,t);}function y(e,t){0===t.length&&t.needDrain&&(t.needDrain=!1,e.emit("drain"));}function C(e,t){t.bufferProcessing=!0;var n=t.bufferedRequest;if(e._writev&&n&&n.next){var r=t.bufferedRequestCount,o=Array(r),i=t.corkedRequestsFree;i.entry=n;for(var d=0,s=!0;n;)o[d]=n,n.isBuf||(s=!1),n=n.next,d+=1;o.allBuffers=s,g(e,t,!0,t.length,o,"",i.finish),t.pendingcb++,t.lastBufferedRequest=null,i.next?(t.corkedRequestsFree=i.next,i.next=null):t.corkedRequestsFree=new a(t),t.bufferedRequestCount=0;}else {for(;n;){var l=n.chunk,c=n.encoding,u=n.callback,p=t.objectMode?1:l.length;if(g(e,t,!1,p,l,c,u),n=n.next,t.bufferedRequestCount--,t.writing)break}null===n&&(t.lastBufferedRequest=null);}t.bufferedRequest=n,t.bufferProcessing=!1;}function w(e){return e.ending&&0===e.length&&null===e.bufferedRequest&&!e.finished&&!e.writing}function R(e,t){e._final(function(n){t.pendingcb--,n&&V(e,n),t.prefinished=!0,e.emit("prefinish"),S(e,t);});}function E(e,t){t.prefinished||t.finalCalled||("function"!=typeof e._final||t.destroyed?(t.prefinished=!0,e.emit("prefinish")):(t.pendingcb++,t.finalCalled=!0,n.nextTick(R,e,t)));}function S(e,t){var n=w(t);if(n&&(E(e,t),0===t.pendingcb&&(t.finished=!0,e.emit("finish"),t.autoDestroy))){var r=e._readableState;(!r||r.autoDestroy&&r.endEmitted)&&e.destroy();}return n}function k(e,t,r){t.ending=!0,S(e,t),r&&(t.finished?n.nextTick(r):e.once("finish",r)),t.ended=!0,e.writable=!1;}function T(e,t,n){var r=e.entry;for(e.entry=null;r;){var a=r.callback;t.pendingcb--,a(n),r=r.next;}t.corkedRequestsFree.next=e;}t.exports=l;var v;l.WritableState=s;var L={deprecate:e("util-deprecate")},A=e("./internal/streams/stream"),x=e("buffer").Buffer,N=r.Uint8Array||function(){},I=e("./internal/streams/destroy"),P=e("./internal/streams/state"),M=P.getHighWaterMark,D=e("../errors").codes,F=D.ERR_INVALID_ARG_TYPE,O=D.ERR_METHOD_NOT_IMPLEMENTED,B=D.ERR_MULTIPLE_CALLBACK,U=D.ERR_STREAM_CANNOT_PIPE,j=D.ERR_STREAM_DESTROYED,q=D.ERR_STREAM_NULL_VALUES,W=D.ERR_STREAM_WRITE_AFTER_END,H=D.ERR_UNKNOWN_ENCODING,V=I.errorOrDestroy;e("inherits")(l,A),s.prototype.getBuffer=function(){for(var e=this.bufferedRequest,t=[];e;)t.push(e),e=e.next;return t},function(){try{Object.defineProperty(s.prototype,"buffer",{get:L.deprecate(function(){return this.getBuffer()},"_writableState.buffer is deprecated. Use _writableState.getBuffer instead.","DEP0003")});}catch(e){}}();var G;"function"==typeof Symbol&&Symbol.hasInstance&&"function"==typeof Function.prototype[Symbol.hasInstance]?(G=Function.prototype[Symbol.hasInstance],Object.defineProperty(l,Symbol.hasInstance,{value:function(e){return !!G.call(this,e)||!(this!==l)&&e&&e._writableState instanceof s}})):G=function(e){return e instanceof this},l.prototype.pipe=function(){V(this,new U);},l.prototype.write=function(e,t,n){var r=this._writableState,a=!1,s=!r.objectMode&&i(e);return s&&!x.isBuffer(e)&&(e=o(e)),"function"==typeof t&&(n=t,t=null),s?t="buffer":!t&&(t=r.defaultEncoding),"function"!=typeof n&&(n=d),r.ending?c(this,n):(s||u(this,r,e,n))&&(r.pendingcb++,a=f(this,r,s,e,t,n)),a},l.prototype.cork=function(){this._writableState.corked++;},l.prototype.uncork=function(){var e=this._writableState;e.corked&&(e.corked--,!e.writing&&!e.corked&&!e.bufferProcessing&&e.bufferedRequest&&C(this,e));},l.prototype.setDefaultEncoding=function(e){if("string"==typeof e&&(e=e.toLowerCase()),!(-1<["hex","utf8","utf-8","ascii","binary","base64","ucs2","ucs-2","utf16le","utf-16le","raw"].indexOf((e+"").toLowerCase())))throw new H(e);return this._writableState.defaultEncoding=e,this},Object.defineProperty(l.prototype,"writableBuffer",{enumerable:!1,get:function(){return this._writableState&&this._writableState.getBuffer()}}),Object.defineProperty(l.prototype,"writableHighWaterMark",{enumerable:!1,get:function(){return this._writableState.highWaterMark}}),l.prototype._write=function(e,t,n){n(new O("_write()"));},l.prototype._writev=null,l.prototype.end=function(e,t,n){var r=this._writableState;return "function"==typeof e?(n=e,e=null,t=null):"function"==typeof t&&(n=t,t=null),null!==e&&void 0!==e&&this.write(e,t),r.corked&&(r.corked=1,this.uncork()),r.ending||k(this,r,n),this},Object.defineProperty(l.prototype,"writableLength",{enumerable:!1,get:function(){return this._writableState.length}}),Object.defineProperty(l.prototype,"destroyed",{enumerable:!1,get:function(){return void 0!==this._writableState&&this._writableState.destroyed},set:function(e){this._writableState&&(this._writableState.destroyed=e);}}),l.prototype.destroy=I.destroy,l.prototype._undestroy=I.undestroy,l.prototype._destroy=function(e,t){t(e);};}).call(this);}).call(this,e("_process"),"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{"../errors":15,"./_stream_duplex":16,"./internal/streams/destroy":23,"./internal/streams/state":27,"./internal/streams/stream":28,_process:12,buffer:4,inherits:10,"util-deprecate":32}],21:[function(e,t){(function(n){(function(){function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){return {value:e,done:t}}function o(e){var t=e[c];if(null!==t){var n=e[_].read();null!==n&&(e[g]=null,e[c]=null,e[u]=null,t(a(n,!1)));}}function i(e){n.nextTick(o,e);}function d(e,t){return function(n,r){e.then(function(){return t[f]?void n(a(void 0,!0)):void t[h](n,r)},r);}}var s,l=e("./end-of-stream"),c=Symbol("lastResolve"),u=Symbol("lastReject"),p=Symbol("error"),f=Symbol("ended"),g=Symbol("lastPromise"),h=Symbol("handlePromise"),_=Symbol("stream"),m=Object.getPrototypeOf(function(){}),b=Object.setPrototypeOf((s={get stream(){return this[_]},next:function(){var e=this,t=this[p];if(null!==t)return Promise.reject(t);if(this[f])return Promise.resolve(a(void 0,!0));if(this[_].destroyed)return new Promise(function(t,r){n.nextTick(function(){e[p]?r(e[p]):t(a(void 0,!0));});});var r,o=this[g];if(o)r=new Promise(d(o,this));else {var i=this[_].read();if(null!==i)return Promise.resolve(a(i,!1));r=new Promise(this[h]);}return this[g]=r,r}},r(s,Symbol.asyncIterator,function(){return this}),r(s,"return",function(){var e=this;return new Promise(function(t,n){e[_].destroy(null,function(e){return e?void n(e):void t(a(void 0,!0))});})}),s),m);t.exports=function(e){var t,n=Object.create(b,(t={},r(t,_,{value:e,writable:!0}),r(t,c,{value:null,writable:!0}),r(t,u,{value:null,writable:!0}),r(t,p,{value:null,writable:!0}),r(t,f,{value:e._readableState.endEmitted,writable:!0}),r(t,h,{value:function(e,t){var r=n[_].read();r?(n[g]=null,n[c]=null,n[u]=null,e(a(r,!1))):(n[c]=e,n[u]=t);},writable:!0}),t));return n[g]=null,l(e,function(e){if(e&&"ERR_STREAM_PREMATURE_CLOSE"!==e.code){var t=n[u];return null!==t&&(n[g]=null,n[c]=null,n[u]=null,t(e)),void(n[p]=e)}var r=n[c];null!==r&&(n[g]=null,n[c]=null,n[u]=null,r(a(void 0,!0))),n[f]=!0;}),e.on("readable",i.bind(null,n)),n};}).call(this);}).call(this,e("_process"));},{"./end-of-stream":24,_process:12}],22:[function(e,t){function n(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r);}return n}function r(e){for(var t,r=1;r<arguments.length;r++)t=null==arguments[r]?{}:arguments[r],r%2?n(Object(t),!0).forEach(function(n){a(e,n,t[n]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):n(Object(t)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n));});return e}function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){for(var n,r=0;r<t.length;r++)n=t[r],n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n);}function d(e,t,n){return t&&i(e.prototype,t),n&&i(e,n),e}function s(e,t,n){u.prototype.copy.call(e,t,n);}var l=e("buffer"),u=l.Buffer,p=e("util"),f=p.inspect,g=f&&f.custom||"inspect";t.exports=function(){function e(){o(this,e),this.head=null,this.tail=null,this.length=0;}return d(e,[{key:"push",value:function(e){var t={data:e,next:null};0<this.length?this.tail.next=t:this.head=t,this.tail=t,++this.length;}},{key:"unshift",value:function(e){var t={data:e,next:this.head};0===this.length&&(this.tail=t),this.head=t,++this.length;}},{key:"shift",value:function(){if(0!==this.length){var e=this.head.data;return this.head=1===this.length?this.tail=null:this.head.next,--this.length,e}}},{key:"clear",value:function(){this.head=this.tail=null,this.length=0;}},{key:"join",value:function(e){if(0===this.length)return "";for(var t=this.head,n=""+t.data;t=t.next;)n+=e+t.data;return n}},{key:"concat",value:function(e){if(0===this.length)return u.alloc(0);for(var t=u.allocUnsafe(e>>>0),n=this.head,r=0;n;)s(n.data,t,r),r+=n.data.length,n=n.next;return t}},{key:"consume",value:function(e,t){var n;return e<this.head.data.length?(n=this.head.data.slice(0,e),this.head.data=this.head.data.slice(e)):e===this.head.data.length?n=this.shift():n=t?this._getString(e):this._getBuffer(e),n}},{key:"first",value:function(){return this.head.data}},{key:"_getString",value:function(e){var t=this.head,r=1,a=t.data;for(e-=a.length;t=t.next;){var o=t.data,i=e>o.length?o.length:e;if(a+=i===o.length?o:o.slice(0,e),e-=i,0===e){i===o.length?(++r,this.head=t.next?t.next:this.tail=null):(this.head=t,t.data=o.slice(i));break}++r;}return this.length-=r,a}},{key:"_getBuffer",value:function(e){var t=u.allocUnsafe(e),r=this.head,a=1;for(r.data.copy(t),e-=r.data.length;r=r.next;){var o=r.data,i=e>o.length?o.length:e;if(o.copy(t,t.length-e,0,i),e-=i,0===e){i===o.length?(++a,this.head=r.next?r.next:this.tail=null):(this.head=r,r.data=o.slice(i));break}++a;}return this.length-=a,t}},{key:g,value:function(e,t){return f(this,r({},t,{depth:0,customInspect:!1}))}}]),e}();},{buffer:4,util:2}],23:[function(e,t){(function(e){(function(){function n(e,t){a(e,t),r(e);}function r(e){e._writableState&&!e._writableState.emitClose||e._readableState&&!e._readableState.emitClose||e.emit("close");}function a(e,t){e.emit("error",t);}t.exports={destroy:function(t,o){var i=this,d=this._readableState&&this._readableState.destroyed,s=this._writableState&&this._writableState.destroyed;return d||s?(o?o(t):t&&(this._writableState?!this._writableState.errorEmitted&&(this._writableState.errorEmitted=!0,e.nextTick(a,this,t)):e.nextTick(a,this,t)),this):(this._readableState&&(this._readableState.destroyed=!0),this._writableState&&(this._writableState.destroyed=!0),this._destroy(t||null,function(t){!o&&t?i._writableState?i._writableState.errorEmitted?e.nextTick(r,i):(i._writableState.errorEmitted=!0,e.nextTick(n,i,t)):e.nextTick(n,i,t):o?(e.nextTick(r,i),o(t)):e.nextTick(r,i);}),this)},undestroy:function(){this._readableState&&(this._readableState.destroyed=!1,this._readableState.reading=!1,this._readableState.ended=!1,this._readableState.endEmitted=!1),this._writableState&&(this._writableState.destroyed=!1,this._writableState.ended=!1,this._writableState.ending=!1,this._writableState.finalCalled=!1,this._writableState.prefinished=!1,this._writableState.finished=!1,this._writableState.errorEmitted=!1);},errorOrDestroy:function(e,t){var n=e._readableState,r=e._writableState;n&&n.autoDestroy||r&&r.autoDestroy?e.destroy(t):e.emit("error",t);}};}).call(this);}).call(this,e("_process"));},{_process:12}],24:[function(e,t){function n(e){var t=!1;return function(){if(!t){t=!0;for(var n=arguments.length,r=Array(n),a=0;a<n;a++)r[a]=arguments[a];e.apply(this,r);}}}function r(){}function a(e){return e.setHeader&&"function"==typeof e.abort}function o(e,t,d){if("function"==typeof t)return o(e,null,t);t||(t={}),d=n(d||r);var s=t.readable||!1!==t.readable&&e.readable,l=t.writable||!1!==t.writable&&e.writable,c=function(){e.writable||p();},u=e._writableState&&e._writableState.finished,p=function(){l=!1,u=!0,s||d.call(e);},f=e._readableState&&e._readableState.endEmitted,g=function(){s=!1,f=!0,l||d.call(e);},h=function(t){d.call(e,t);},_=function(){var t;return s&&!f?(e._readableState&&e._readableState.ended||(t=new i),d.call(e,t)):l&&!u?(e._writableState&&e._writableState.ended||(t=new i),d.call(e,t)):void 0},m=function(){e.req.on("finish",p);};return a(e)?(e.on("complete",p),e.on("abort",_),e.req?m():e.on("request",m)):l&&!e._writableState&&(e.on("end",c),e.on("close",c)),e.on("end",g),e.on("finish",p),!1!==t.error&&e.on("error",h),e.on("close",_),function(){e.removeListener("complete",p),e.removeListener("abort",_),e.removeListener("request",m),e.req&&e.req.removeListener("finish",p),e.removeListener("end",c),e.removeListener("close",c),e.removeListener("finish",p),e.removeListener("end",g),e.removeListener("error",h),e.removeListener("close",_);}}var i=e("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;t.exports=o;},{"../../../errors":15}],25:[function(e,t){t.exports=function(){throw new Error("Readable.from is not available in the browser")};},{}],26:[function(e,t){function n(e){var t=!1;return function(){t||(t=!0,e.apply(void 0,arguments));}}function r(e){if(e)throw e}function a(e){return e.setHeader&&"function"==typeof e.abort}function o(t,r,o,i){i=n(i);var d=!1;t.on("close",function(){d=!0;}),l===void 0&&(l=e("./end-of-stream")),l(t,{readable:r,writable:o},function(e){return e?i(e):void(d=!0,i())});var s=!1;return function(e){if(!d)return s?void 0:(s=!0,a(t)?t.abort():"function"==typeof t.destroy?t.destroy():void i(e||new p("pipe")))}}function i(e){e();}function d(e,t){return e.pipe(t)}function s(e){return e.length?"function"==typeof e[e.length-1]?e.pop():r:r}var l,c=e("../../../errors").codes,u=c.ERR_MISSING_ARGS,p=c.ERR_STREAM_DESTROYED;t.exports=function(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];var r=s(t);if(Array.isArray(t[0])&&(t=t[0]),2>t.length)throw new u("streams");var a,l=t.map(function(e,n){var d=n<t.length-1;return o(e,d,0<n,function(e){a||(a=e),e&&l.forEach(i),d||(l.forEach(i),r(a));})});return t.reduce(d)};},{"../../../errors":15,"./end-of-stream":24}],27:[function(e,n){function r(e,t,n){return null==e.highWaterMark?t?e[n]:null:e.highWaterMark}var a=e("../../../errors").codes.ERR_INVALID_OPT_VALUE;n.exports={getHighWaterMark:function(e,n,o,i){var d=r(n,i,o);if(null!=d){if(!(isFinite(d)&&t(d)===d)||0>d){var s=i?o:"highWaterMark";throw new a(s,d)}return t(d)}return e.objectMode?16:16384}};},{"../../../errors":15}],28:[function(e,t){t.exports=e("events").EventEmitter;},{events:3}],29:[function(e,t,n){n=t.exports=e("./lib/_stream_readable.js"),n.Stream=n,n.Readable=n,n.Writable=e("./lib/_stream_writable.js"),n.Duplex=e("./lib/_stream_duplex.js"),n.Transform=e("./lib/_stream_transform.js"),n.PassThrough=e("./lib/_stream_passthrough.js"),n.finished=e("./lib/internal/streams/end-of-stream.js"),n.pipeline=e("./lib/internal/streams/pipeline.js");},{"./lib/_stream_duplex.js":16,"./lib/_stream_passthrough.js":17,"./lib/_stream_readable.js":18,"./lib/_stream_transform.js":19,"./lib/_stream_writable.js":20,"./lib/internal/streams/end-of-stream.js":24,"./lib/internal/streams/pipeline.js":26}],30:[function(e,t,n){function r(e,t){for(var n in e)t[n]=e[n];}function a(e,t,n){return i(e,t,n)}/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */var o=e("buffer"),i=o.Buffer;i.from&&i.alloc&&i.allocUnsafe&&i.allocUnsafeSlow?t.exports=o:(r(o,n),n.Buffer=a),a.prototype=Object.create(i.prototype),r(i,a),a.from=function(e,t,n){if("number"==typeof e)throw new TypeError("Argument must not be a number");return i(e,t,n)},a.alloc=function(e,t,n){if("number"!=typeof e)throw new TypeError("Argument must be a number");var r=i(e);return void 0===t?r.fill(0):"string"==typeof n?r.fill(t,n):r.fill(t),r},a.allocUnsafe=function(e){if("number"!=typeof e)throw new TypeError("Argument must be a number");return i(e)},a.allocUnsafeSlow=function(e){if("number"!=typeof e)throw new TypeError("Argument must be a number");return o.SlowBuffer(e)};},{buffer:4}],31:[function(e,t,n){function r(e){if(!e)return "utf8";for(var t;;)switch(e){case"utf8":case"utf-8":return "utf8";case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return "utf16le";case"latin1":case"binary":return "latin1";case"base64":case"ascii":case"hex":return e;default:if(t)return;e=(""+e).toLowerCase(),t=!0;}}function a(e){var t=r(e);if("string"!=typeof t&&(m.isEncoding===b||!b(e)))throw new Error("Unknown encoding: "+e);return t||e}function o(e){this.encoding=a(e);var t;switch(this.encoding){case"utf16le":this.text=u,this.end=p,t=4;break;case"utf8":this.fillLast=c,t=4;break;case"base64":this.text=f,this.end=g,t=3;break;default:return this.write=h,void(this.end=_);}this.lastNeed=0,this.lastTotal=0,this.lastChar=m.allocUnsafe(t);}function d(e){if(127>=e)return 0;return 6==e>>5?2:14==e>>4?3:30==e>>3?4:2==e>>6?-1:-2}function s(e,t,n){var r=t.length-1;if(r<n)return 0;var a=d(t[r]);return 0<=a?(0<a&&(e.lastNeed=a-1),a):--r<n||-2===a?0:(a=d(t[r]),0<=a)?(0<a&&(e.lastNeed=a-2),a):--r<n||-2===a?0:(a=d(t[r]),0<=a?(0<a&&(2===a?a=0:e.lastNeed=a-3),a):0)}function l(e,t){if(128!=(192&t[0]))return e.lastNeed=0,"\uFFFD";if(1<e.lastNeed&&1<t.length){if(128!=(192&t[1]))return e.lastNeed=1,"\uFFFD";if(2<e.lastNeed&&2<t.length&&128!=(192&t[2]))return e.lastNeed=2,"\uFFFD"}}function c(e){var t=this.lastTotal-this.lastNeed,n=l(this,e);return void 0===n?this.lastNeed<=e.length?(e.copy(this.lastChar,t,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):void(e.copy(this.lastChar,t,0,e.length),this.lastNeed-=e.length):n}function u(e,t){if(0==(e.length-t)%2){var n=e.toString("utf16le",t);if(n){var r=n.charCodeAt(n.length-1);if(55296<=r&&56319>=r)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1],n.slice(0,-1)}return n}return this.lastNeed=1,this.lastTotal=2,this.lastChar[0]=e[e.length-1],e.toString("utf16le",t,e.length-1)}function p(e){var t=e&&e.length?this.write(e):"";if(this.lastNeed){var n=this.lastTotal-this.lastNeed;return t+this.lastChar.toString("utf16le",0,n)}return t}function f(e,t){var r=(e.length-t)%3;return 0==r?e.toString("base64",t):(this.lastNeed=3-r,this.lastTotal=3,1==r?this.lastChar[0]=e[e.length-1]:(this.lastChar[0]=e[e.length-2],this.lastChar[1]=e[e.length-1]),e.toString("base64",t,e.length-r))}function g(e){var t=e&&e.length?this.write(e):"";return this.lastNeed?t+this.lastChar.toString("base64",0,3-this.lastNeed):t}function h(e){return e.toString(this.encoding)}function _(e){return e&&e.length?this.write(e):""}var m=e("safe-buffer").Buffer,b=m.isEncoding||function(e){switch(e=""+e,e&&e.toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":case"raw":return !0;default:return !1;}};n.StringDecoder=o,o.prototype.write=function(e){if(0===e.length)return "";var t,n;if(this.lastNeed){if(t=this.fillLast(e),void 0===t)return "";n=this.lastNeed,this.lastNeed=0;}else n=0;return n<e.length?t?t+this.text(e,n):this.text(e,n):t||""},o.prototype.end=function(e){var t=e&&e.length?this.write(e):"";return this.lastNeed?t+"\uFFFD":t},o.prototype.text=function(e,t){var n=s(this,e,t);if(!this.lastNeed)return e.toString("utf8",t);this.lastTotal=n;var r=e.length-(n-this.lastNeed);return e.copy(this.lastChar,0,r),e.toString("utf8",t,r)},o.prototype.fillLast=function(e){return this.lastNeed<=e.length?(e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):void(e.copy(this.lastChar,this.lastTotal-this.lastNeed,0,e.length),this.lastNeed-=e.length)};},{"safe-buffer":30}],32:[function(e,t){(function(e){(function(){function n(t){try{if(!e.localStorage)return !1}catch(e){return !1}var n=e.localStorage[t];return null!=n&&"true"===(n+"").toLowerCase()}t.exports=function(e,t){function r(){if(!a){if(n("throwDeprecation"))throw new Error(t);else n("traceDeprecation")?console.trace(t):console.warn(t);a=!0;}return e.apply(this,arguments)}if(n("noDeprecation"))return e;var a=!1;return r};}).call(this);}).call(this,"undefined"==typeof commonjsGlobal?"undefined"==typeof self?"undefined"==typeof window?{}:window:self:commonjsGlobal);},{}],"/":[function(e,t){(function(n){(function(){function r(e){return e.replace(/a=ice-options:trickle\s\n/g,"")}function a(e){console.warn(e);}/*! simple-peer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */var o=e("debug")("simple-peer"),i=e("get-browser-rtc"),d=e("randombytes"),s=e("readable-stream"),l=e("queue-microtask"),c=e("err-code"),u=65536;class p extends s.Duplex{constructor(e){if(e=Object.assign({allowHalfOpen:!1},e),super(e),this._id=d(4).toString("hex").slice(0,7),this._debug("new peer %o",e),this.channelName=e.initiator?e.channelName||d(20).toString("hex"):null,this.initiator=e.initiator||!1,this.channelConfig=e.channelConfig||p.channelConfig,this.channelNegotiated=this.channelConfig.negotiated,this.config=Object.assign({},p.config,e.config),this.offerOptions=e.offerOptions||{},this.answerOptions=e.answerOptions||{},this.sdpTransform=e.sdpTransform||(e=>e),this.streams=e.streams||(e.stream?[e.stream]:[]),this.trickle=void 0===e.trickle||e.trickle,this.allowHalfTrickle=void 0!==e.allowHalfTrickle&&e.allowHalfTrickle,this.iceCompleteTimeout=e.iceCompleteTimeout||5000,this.destroyed=!1,this._connected=!1,this.remoteAddress=void 0,this.remoteFamily=void 0,this.remotePort=void 0,this.localAddress=void 0,this.localFamily=void 0,this.localPort=void 0,this._wrtc=e.wrtc&&"object"==typeof e.wrtc?e.wrtc:i(),!this._wrtc)if("undefined"==typeof window)throw c(new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"),"ERR_WEBRTC_SUPPORT");else throw c(new Error("No WebRTC support: Not a supported browser"),"ERR_WEBRTC_SUPPORT");this._pcReady=!1,this._channelReady=!1,this._iceComplete=!1,this._iceCompleteTimer=null,this._channel=null,this._pendingCandidates=[],this._isNegotiating=!1,this._firstNegotiation=!0,this._batchedNegotiation=!1,this._queuedNegotiation=!1,this._sendersAwaitingStable=[],this._senderMap=new Map,this._closingInterval=null,this._remoteTracks=[],this._remoteStreams=[],this._chunk=null,this._cb=null,this._interval=null;try{this._pc=new this._wrtc.RTCPeerConnection(this.config);}catch(e){return void l(()=>this.destroy(c(e,"ERR_PC_CONSTRUCTOR")))}this._isReactNativeWebrtc="number"==typeof this._pc._peerConnectionId,this._pc.oniceconnectionstatechange=()=>{this._onIceStateChange();},this._pc.onicegatheringstatechange=()=>{this._onIceStateChange();},this._pc.onconnectionstatechange=()=>{this._onConnectionStateChange();},this._pc.onsignalingstatechange=()=>{this._onSignalingStateChange();},this._pc.onicecandidate=e=>{this._onIceCandidate(e);},this.initiator||this.channelNegotiated?this._setupData({channel:this._pc.createDataChannel(this.channelName,this.channelConfig)}):this._pc.ondatachannel=e=>{this._setupData(e);},this.streams&&this.streams.forEach(e=>{this.addStream(e);}),this._pc.ontrack=e=>{this._onTrack(e);},this._debug("initial negotiation"),this._needsNegotiation(),this._onFinishBound=()=>{this._onFinish();},this.once("finish",this._onFinishBound);}get bufferSize(){return this._channel&&this._channel.bufferedAmount||0}get connected(){return this._connected&&"open"===this._channel.readyState}address(){return {port:this.localPort,family:this.localFamily,address:this.localAddress}}signal(e){if(this.destroyed)throw c(new Error("cannot signal after peer is destroyed"),"ERR_SIGNALING");if("string"==typeof e)try{e=JSON.parse(e);}catch(t){e={};}this._debug("signal()"),e.renegotiate&&this.initiator&&(this._debug("got request to renegotiate"),this._needsNegotiation()),e.transceiverRequest&&this.initiator&&(this._debug("got request for transceiver"),this.addTransceiver(e.transceiverRequest.kind,e.transceiverRequest.init)),e.candidate&&(this._pc.remoteDescription&&this._pc.remoteDescription.type?this._addIceCandidate(e.candidate):this._pendingCandidates.push(e.candidate)),e.sdp&&this._pc.setRemoteDescription(new this._wrtc.RTCSessionDescription(e)).then(()=>{this.destroyed||(this._pendingCandidates.forEach(e=>{this._addIceCandidate(e);}),this._pendingCandidates=[],"offer"===this._pc.remoteDescription.type&&this._createAnswer());}).catch(e=>{this.destroy(c(e,"ERR_SET_REMOTE_DESCRIPTION"));}),e.sdp||e.candidate||e.renegotiate||e.transceiverRequest||this.destroy(c(new Error("signal() called with invalid signal data"),"ERR_SIGNALING"));}_addIceCandidate(e){var t=new this._wrtc.RTCIceCandidate(e);this._pc.addIceCandidate(t).catch(e=>{!t.address||t.address.endsWith(".local")?a("Ignoring unsupported ICE candidate."):this.destroy(c(e,"ERR_ADD_ICE_CANDIDATE"));});}send(e){this._channel.send(e);}addTransceiver(e,t){if(this._debug("addTransceiver()"),this.initiator)try{this._pc.addTransceiver(e,t),this._needsNegotiation();}catch(e){this.destroy(c(e,"ERR_ADD_TRANSCEIVER"));}else this.emit("signal",{transceiverRequest:{kind:e,init:t}});}addStream(e){this._debug("addStream()"),e.getTracks().forEach(t=>{this.addTrack(t,e);});}addTrack(e,t){this._debug("addTrack()");var n=this._senderMap.get(e)||new Map,r=n.get(t);if(!r)r=this._pc.addTrack(e,t),n.set(t,r),this._senderMap.set(e,n),this._needsNegotiation();else if(r.removed)throw c(new Error("Track has been removed. You should enable/disable tracks that you want to re-add."),"ERR_SENDER_REMOVED");else throw c(new Error("Track has already been added to that stream."),"ERR_SENDER_ALREADY_ADDED")}replaceTrack(e,t,n){this._debug("replaceTrack()");var r=this._senderMap.get(e),a=r?r.get(n):null;if(!a)throw c(new Error("Cannot replace track that was never added."),"ERR_TRACK_NOT_ADDED");t&&this._senderMap.set(t,r),null==a.replaceTrack?this.destroy(c(new Error("replaceTrack is not supported in this browser"),"ERR_UNSUPPORTED_REPLACETRACK")):a.replaceTrack(t);}removeTrack(e,t){this._debug("removeSender()");var n=this._senderMap.get(e),r=n?n.get(t):null;if(!r)throw c(new Error("Cannot remove track that was never added."),"ERR_TRACK_NOT_ADDED");try{r.removed=!0,this._pc.removeTrack(r);}catch(e){"NS_ERROR_UNEXPECTED"===e.name?this._sendersAwaitingStable.push(r):this.destroy(c(e,"ERR_REMOVE_TRACK"));}this._needsNegotiation();}removeStream(e){this._debug("removeSenders()"),e.getTracks().forEach(t=>{this.removeTrack(t,e);});}_needsNegotiation(){this._debug("_needsNegotiation"),this._batchedNegotiation||(this._batchedNegotiation=!0,l(()=>{this._batchedNegotiation=!1,this.initiator||!this._firstNegotiation?(this._debug("starting batched negotiation"),this.negotiate()):this._debug("non-initiator initial negotiation request discarded"),this._firstNegotiation=!1;}));}negotiate(){this.initiator?this._isNegotiating?(this._queuedNegotiation=!0,this._debug("already negotiating, queueing")):(this._debug("start negotiation"),setTimeout(()=>{this._createOffer();},0)):this._isNegotiating?(this._queuedNegotiation=!0,this._debug("already negotiating, queueing")):(this._debug("requesting negotiation from initiator"),this.emit("signal",{renegotiate:!0})),this._isNegotiating=!0;}destroy(e){this._destroy(e,()=>{});}_destroy(e,t){if(!this.destroyed){if(this._debug("destroy (error: %s)",e&&(e.message||e)),this.readable=this.writable=!1,this._readableState.ended||this.push(null),this._writableState.finished||this.end(),this.destroyed=!0,this._connected=!1,this._pcReady=!1,this._channelReady=!1,this._remoteTracks=null,this._remoteStreams=null,this._senderMap=null,clearInterval(this._closingInterval),this._closingInterval=null,clearInterval(this._interval),this._interval=null,this._chunk=null,this._cb=null,this._onFinishBound&&this.removeListener("finish",this._onFinishBound),this._onFinishBound=null,this._channel){try{this._channel.close();}catch(e){}this._channel.onmessage=null,this._channel.onopen=null,this._channel.onclose=null,this._channel.onerror=null;}if(this._pc){try{this._pc.close();}catch(e){}this._pc.oniceconnectionstatechange=null,this._pc.onicegatheringstatechange=null,this._pc.onsignalingstatechange=null,this._pc.onicecandidate=null,this._pc.ontrack=null,this._pc.ondatachannel=null;}this._pc=null,this._channel=null,e&&this.emit("error",e),this.emit("close"),t();}}_setupData(e){if(!e.channel)return this.destroy(c(new Error("Data channel event is missing `channel` property"),"ERR_DATA_CHANNEL"));this._channel=e.channel,this._channel.binaryType="arraybuffer","number"==typeof this._channel.bufferedAmountLowThreshold&&(this._channel.bufferedAmountLowThreshold=u),this.channelName=this._channel.label,this._channel.onmessage=e=>{this._onChannelMessage(e);},this._channel.onbufferedamountlow=()=>{this._onChannelBufferedAmountLow();},this._channel.onopen=()=>{this._onChannelOpen();},this._channel.onclose=()=>{this._onChannelClose();},this._channel.onerror=e=>{this.destroy(c(e,"ERR_DATA_CHANNEL"));};var t=!1;this._closingInterval=setInterval(()=>{this._channel&&"closing"===this._channel.readyState?(t&&this._onChannelClose(),t=!0):t=!1;},5000);}_read(){}_write(e,t,n){if(this.destroyed)return n(c(new Error("cannot write after peer is destroyed"),"ERR_DATA_CHANNEL"));if(this._connected){try{this.send(e);}catch(e){return this.destroy(c(e,"ERR_DATA_CHANNEL"))}this._channel.bufferedAmount>u?(this._debug("start backpressure: bufferedAmount %d",this._channel.bufferedAmount),this._cb=n):n(null);}else this._debug("write before connect"),this._chunk=e,this._cb=n;}_onFinish(){if(!this.destroyed){const e=()=>{setTimeout(()=>this.destroy(),1e3);};this._connected?e():this.once("connect",e);}}_startIceCompleteTimeout(){this.destroyed||this._iceCompleteTimer||(this._debug("started iceComplete timeout"),this._iceCompleteTimer=setTimeout(()=>{this._iceComplete||(this._iceComplete=!0,this._debug("iceComplete timeout completed"),this.emit("iceTimeout"),this.emit("_iceComplete"));},this.iceCompleteTimeout));}_createOffer(){this.destroyed||this._pc.createOffer(this.offerOptions).then(e=>{if(this.destroyed)return;this.trickle||this.allowHalfTrickle||(e.sdp=r(e.sdp)),e.sdp=this.sdpTransform(e.sdp);const t=()=>{if(!this.destroyed){var t=this._pc.localDescription||e;this._debug("signal"),this.emit("signal",{type:t.type,sdp:t.sdp});}};this._pc.setLocalDescription(e).then(()=>{this._debug("createOffer success"),this.destroyed||(this.trickle||this._iceComplete?t():this.once("_iceComplete",t));}).catch(e=>{this.destroy(c(e,"ERR_SET_LOCAL_DESCRIPTION"));});}).catch(e=>{this.destroy(c(e,"ERR_CREATE_OFFER"));});}_requestMissingTransceivers(){this._pc.getTransceivers&&this._pc.getTransceivers().forEach(e=>{e.mid||!e.sender.track||e.requested||(e.requested=!0,this.addTransceiver(e.sender.track.kind));});}_createAnswer(){this.destroyed||this._pc.createAnswer(this.answerOptions).then(e=>{if(this.destroyed)return;this.trickle||this.allowHalfTrickle||(e.sdp=r(e.sdp)),e.sdp=this.sdpTransform(e.sdp);const t=()=>{if(!this.destroyed){var t=this._pc.localDescription||e;this._debug("signal"),this.emit("signal",{type:t.type,sdp:t.sdp}),this.initiator||this._requestMissingTransceivers();}};this._pc.setLocalDescription(e).then(()=>{this.destroyed||(this.trickle||this._iceComplete?t():this.once("_iceComplete",t));}).catch(e=>{this.destroy(c(e,"ERR_SET_LOCAL_DESCRIPTION"));});}).catch(e=>{this.destroy(c(e,"ERR_CREATE_ANSWER"));});}_onConnectionStateChange(){this.destroyed||"failed"===this._pc.connectionState&&this.destroy(c(new Error("Connection failed."),"ERR_CONNECTION_FAILURE"));}_onIceStateChange(){if(!this.destroyed){var e=this._pc.iceConnectionState,t=this._pc.iceGatheringState;this._debug("iceStateChange (connection: %s) (gathering: %s)",e,t),this.emit("iceStateChange",e,t),("connected"===e||"completed"===e)&&(this._pcReady=!0,this._maybeReady()),"failed"===e&&this.destroy(c(new Error("Ice connection failed."),"ERR_ICE_CONNECTION_FAILURE")),"closed"===e&&this.destroy(c(new Error("Ice connection closed."),"ERR_ICE_CONNECTION_CLOSED"));}}getStats(e){const t=e=>("[object Array]"===Object.prototype.toString.call(e.values)&&e.values.forEach(t=>{Object.assign(e,t);}),e);0===this._pc.getStats.length||this._isReactNativeWebrtc?this._pc.getStats().then(n=>{var r=[];n.forEach(e=>{r.push(t(e));}),e(null,r);},t=>e(t)):0<this._pc.getStats.length?this._pc.getStats(n=>{if(!this.destroyed){var r=[];n.result().forEach(e=>{var n={};e.names().forEach(t=>{n[t]=e.stat(t);}),n.id=e.id,n.type=e.type,n.timestamp=e.timestamp,r.push(t(n));}),e(null,r);}},t=>e(t)):e(null,[]);}_maybeReady(){if(this._debug("maybeReady pc %s channel %s",this._pcReady,this._channelReady),this._connected||this._connecting||!this._pcReady||!this._channelReady)return;this._connecting=!0;const e=()=>{this.destroyed||this.getStats((t,n)=>{if(this.destroyed)return;t&&(n=[]);var r={},a={},o={},i=!1;n.forEach(e=>{("remotecandidate"===e.type||"remote-candidate"===e.type)&&(r[e.id]=e),("localcandidate"===e.type||"local-candidate"===e.type)&&(a[e.id]=e),("candidatepair"===e.type||"candidate-pair"===e.type)&&(o[e.id]=e);});const d=e=>{i=!0;var t=a[e.localCandidateId];t&&(t.ip||t.address)?(this.localAddress=t.ip||t.address,this.localPort=+t.port):t&&t.ipAddress?(this.localAddress=t.ipAddress,this.localPort=+t.portNumber):"string"==typeof e.googLocalAddress&&(t=e.googLocalAddress.split(":"),this.localAddress=t[0],this.localPort=+t[1]),this.localAddress&&(this.localFamily=this.localAddress.includes(":")?"IPv6":"IPv4");var n=r[e.remoteCandidateId];n&&(n.ip||n.address)?(this.remoteAddress=n.ip||n.address,this.remotePort=+n.port):n&&n.ipAddress?(this.remoteAddress=n.ipAddress,this.remotePort=+n.portNumber):"string"==typeof e.googRemoteAddress&&(n=e.googRemoteAddress.split(":"),this.remoteAddress=n[0],this.remotePort=+n[1]),this.remoteAddress&&(this.remoteFamily=this.remoteAddress.includes(":")?"IPv6":"IPv4"),this._debug("connect local: %s:%s remote: %s:%s",this.localAddress,this.localPort,this.remoteAddress,this.remotePort);};if(n.forEach(e=>{"transport"===e.type&&e.selectedCandidatePairId&&d(o[e.selectedCandidatePairId]),("googCandidatePair"===e.type&&"true"===e.googActiveConnection||("candidatepair"===e.type||"candidate-pair"===e.type)&&e.selected)&&d(e);}),!i&&(!Object.keys(o).length||Object.keys(a).length))return void setTimeout(e,100);if(this._connecting=!1,this._connected=!0,this._chunk){try{this.send(this._chunk);}catch(e){return this.destroy(c(e,"ERR_DATA_CHANNEL"))}this._chunk=null,this._debug("sent chunk from \"write before connect\"");var s=this._cb;this._cb=null,s(null);}"number"!=typeof this._channel.bufferedAmountLowThreshold&&(this._interval=setInterval(()=>this._onInterval(),150),this._interval.unref&&this._interval.unref()),this._debug("connect"),this.emit("connect");});};e();}_onInterval(){this._cb&&this._channel&&!(this._channel.bufferedAmount>u)&&this._onChannelBufferedAmountLow();}_onSignalingStateChange(){this.destroyed||("stable"===this._pc.signalingState&&(this._isNegotiating=!1,this._debug("flushing sender queue",this._sendersAwaitingStable),this._sendersAwaitingStable.forEach(e=>{this._pc.removeTrack(e),this._queuedNegotiation=!0;}),this._sendersAwaitingStable=[],this._queuedNegotiation?(this._debug("flushing negotiation queue"),this._queuedNegotiation=!1,this._needsNegotiation()):(this._debug("negotiate"),this.emit("negotiate"))),this._debug("signalingStateChange %s",this._pc.signalingState),this.emit("signalingStateChange",this._pc.signalingState));}_onIceCandidate(e){this.destroyed||(e.candidate&&this.trickle?this.emit("signal",{candidate:{candidate:e.candidate.candidate,sdpMLineIndex:e.candidate.sdpMLineIndex,sdpMid:e.candidate.sdpMid}}):!e.candidate&&!this._iceComplete&&(this._iceComplete=!0,this.emit("_iceComplete")),e.candidate&&this._startIceCompleteTimeout());}_onChannelMessage(e){if(!this.destroyed){var t=e.data;t instanceof ArrayBuffer&&(t=n.from(t)),this.push(t);}}_onChannelBufferedAmountLow(){if(!this.destroyed&&this._cb){this._debug("ending backpressure: bufferedAmount %d",this._channel.bufferedAmount);var e=this._cb;this._cb=null,e(null);}}_onChannelOpen(){this._connected||this.destroyed||(this._debug("on channel open"),this._channelReady=!0,this._maybeReady());}_onChannelClose(){this.destroyed||(this._debug("on channel close"),this.destroy());}_onTrack(e){this.destroyed||e.streams.forEach(t=>{this._debug("on track"),this.emit("track",e.track,t),this._remoteTracks.push({track:e.track,stream:t}),this._remoteStreams.some(e=>e.id===t.id)||(this._remoteStreams.push(t),l(()=>{this.emit("stream",t);}));});}_debug(){var e=[].slice.call(arguments);e[0]="["+this._id+"] "+e[0],o.apply(null,e);}}p.WEBRTC_SUPPORT=!!i(),p.config={iceServers:[{urls:["stun:stun.l.google.com:19302","stun:global.stun.twilio.com:3478"]}],sdpSemantics:"unified-plan"},p.channelConfig={},t.exports=p;}).call(this);}).call(this,e("buffer").Buffer);},{buffer:4,debug:5,"err-code":7,"get-browser-rtc":8,"queue-microtask":13,randombytes:14,"readable-stream":29}]},{},[])("/")});
});

/**
 * @module sync-protocol
 */

/**
 * @typedef {Map<number, number>} StateMap
 */

/**
 * Core Yjs defines three message types:
 * • YjsSyncStep1: Includes the State Set of the sending client. When received, the client should reply with YjsSyncStep2.
 * • YjsSyncStep2: Includes all missing structs and the complete delete set. When received, the the client is assured that
 *   it received all information from the remote client.
 *
 * In a peer-to-peer network, you may want to introduce a SyncDone message type. Both parties should initiate the connection
 * with SyncStep1. When a client received SyncStep2, it should reply with SyncDone. When the local client received both
 * SyncStep2 and SyncDone, it is assured that it is synced to the remote client.
 *
 * In a client-server model, you want to handle this differently: The client should initiate the connection with SyncStep1.
 * When the server receives SyncStep1, it should reply with SyncStep2 immediately followed by SyncStep1. The client replies
 * with SyncStep2 when it receives SyncStep1. Optionally the server may send a SyncDone after it received SyncStep2, so the
 * client knows that the sync is finished.  There are two reasons for this more elaborated sync model: 1. This protocol can
 * easily be implemented on top of http and websockets. 2. The server shoul only reply to requests, and not initiate them.
 * Therefore it is necesarry that the client initiates the sync.
 *
 * Construction of a message:
 * [messageType : varUint, message definition..]
 *
 * Note: A message does not include information about the room name. This must to be handled by the upper layer protocol!
 *
 * stringify[messageType] stringifies a message definition (messageType is already read from the bufffer)
 */

const messageYjsSyncStep1 = 0;
const messageYjsSyncStep2 = 1;
const messageYjsUpdate = 2;

/**
 * Create a sync step 1 message based on the state of the current shared document.
 *
 * @param {encoding.Encoder} encoder
 * @param {Y.Doc} doc
 */
const writeSyncStep1 = (encoder, doc) => {
  writeVarUint(encoder, messageYjsSyncStep1);
  const sv = encodeStateVector(doc);
  writeVarUint8Array(encoder, sv);
};

/**
 * @param {encoding.Encoder} encoder
 * @param {Y.Doc} doc
 * @param {Uint8Array} [encodedStateVector]
 */
const writeSyncStep2 = (encoder, doc, encodedStateVector) => {
  writeVarUint(encoder, messageYjsSyncStep2);
  writeVarUint8Array(encoder, encodeStateAsUpdate(doc, encodedStateVector));
};

/**
 * Read SyncStep1 message and reply with SyncStep2.
 *
 * @param {decoding.Decoder} decoder The reply to the received message
 * @param {encoding.Encoder} encoder The received message
 * @param {Y.Doc} doc
 */
const readSyncStep1 = (decoder, encoder, doc) =>
  writeSyncStep2(encoder, doc, readVarUint8Array(decoder));

/**
 * Read and apply Structs and then DeleteStore to a y instance.
 *
 * @param {decoding.Decoder} decoder
 * @param {Y.Doc} doc
 * @param {any} transactionOrigin
 */
const readSyncStep2 = (decoder, doc, transactionOrigin) => {
  applyUpdate(doc, readVarUint8Array(decoder), transactionOrigin);
};

/**
 * @param {encoding.Encoder} encoder
 * @param {Uint8Array} update
 */
const writeUpdate = (encoder, update) => {
  writeVarUint(encoder, messageYjsUpdate);
  writeVarUint8Array(encoder, update);
};

/**
 * Read and apply Structs and then DeleteStore to a y instance.
 *
 * @param {decoding.Decoder} decoder
 * @param {Y.Doc} doc
 * @param {any} transactionOrigin
 */
const readUpdate = readSyncStep2;

/**
 * @param {decoding.Decoder} decoder A message received from another client
 * @param {encoding.Encoder} encoder The reply message. Will not be sent if empty.
 * @param {Y.Doc} doc
 * @param {any} transactionOrigin
 */
const readSyncMessage = (decoder, encoder, doc, transactionOrigin) => {
  const messageType = readVarUint(decoder);
  switch (messageType) {
    case messageYjsSyncStep1:
      readSyncStep1(decoder, encoder, doc);
      break
    case messageYjsSyncStep2:
      readSyncStep2(decoder, doc, transactionOrigin);
      break
    case messageYjsUpdate:
      readUpdate(decoder, doc, transactionOrigin);
      break
    default:
      throw new Error('Unknown message type')
  }
  return messageType
};

/* eslint-env browser */

/**
 * @param {string} secret
 * @param {string} roomName
 * @return {PromiseLike<CryptoKey>}
 */
const deriveKey = (secret, roomName) => {
  const secretBuffer = encodeUtf8(secret).buffer;
  const salt = encodeUtf8(roomName).buffer;
  return crypto.subtle.importKey(
    'raw',
    secretBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  ).then(keyMaterial =>
    crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    )
  )
};

/**
 * @param {Uint8Array} data data to be encrypted
 * @param {CryptoKey?} key
 * @return {PromiseLike<Uint8Array>} encrypted, base64 encoded message
 */
const encrypt = (data, key) => {
  if (!key) {
    return /** @type {PromiseLike<Uint8Array>} */ (resolve(data))
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  ).then(cipher => {
    const encryptedDataEncoder = createEncoder();
    writeVarString(encryptedDataEncoder, 'AES-GCM');
    writeVarUint8Array(encryptedDataEncoder, iv);
    writeVarUint8Array(encryptedDataEncoder, new Uint8Array(cipher));
    return toUint8Array(encryptedDataEncoder)
  })
};

/**
 * @param {Object} data data to be encrypted
 * @param {CryptoKey?} key
 * @return {PromiseLike<Uint8Array>} encrypted data, if key is provided
 */
const encryptJson = (data, key) => {
  const dataEncoder = createEncoder();
  writeAny(dataEncoder, data);
  return encrypt(toUint8Array(dataEncoder), key)
};

/**
 * @param {Uint8Array} data
 * @param {CryptoKey?} key
 * @return {PromiseLike<Uint8Array>} decrypted buffer
 */
const decrypt = (data, key) => {
  if (!key) {
    return /** @type {PromiseLike<Uint8Array>} */ (resolve(data))
  }
  const dataDecoder = createDecoder(data);
  const algorithm = readVarString(dataDecoder);
  if (algorithm !== 'AES-GCM') {
    reject(create('Unknown encryption algorithm'));
  }
  const iv = readVarUint8Array(dataDecoder);
  const cipher = readVarUint8Array(dataDecoder);
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    cipher
  ).then(data => new Uint8Array(data))
};

/**
 * @param {Uint8Array} data
 * @param {CryptoKey?} key
 * @return {PromiseLike<Object>} decrypted object
 */
const decryptJson = (data, key) =>
  decrypt(data, key).then(decryptedValue =>
    readAny(createDecoder(new Uint8Array(decryptedValue)))
  );

const log = createModuleLogger('y-webrtc');

const messageSync = 0;
const messageQueryAwareness = 3;
const messageAwareness = 1;
const messageBcPeerId = 4;

/**
 * @type {Map<string, SignalingConn>}
 */
const signalingConns = new Map();

/**
 * @type {Map<string,Room>}
 */
const rooms = new Map();

/**
 * @param {Room} room
 */
const checkIsSynced = room => {
  let synced = true;
  room.webrtcConns.forEach(peer => {
    if (!peer.synced) {
      synced = false;
    }
  });
  if ((!synced && room.synced) || (synced && !room.synced)) {
    room.synced = synced;
    room.provider.emit('synced', [{ synced }]);
    log('synced ', BOLD, room.name, UNBOLD, ' with all peers');
  }
};

/**
 * @param {Room} room
 * @param {Uint8Array} buf
 * @param {function} syncedCallback
 * @return {encoding.Encoder?}
 */
const readMessage = (room, buf, syncedCallback) => {
  const decoder = createDecoder(buf);
  const encoder = createEncoder();
  const messageType = readVarUint(decoder);
  if (room === undefined) {
    return null
  }
  const awareness = room.awareness;
  const doc = room.doc;
  let sendReply = false;
  switch (messageType) {
    case messageSync: {
      writeVarUint(encoder, messageSync);
      const syncMessageType = readSyncMessage(decoder, encoder, doc, room);
      if (syncMessageType === messageYjsSyncStep2 && !room.synced) {
        syncedCallback();
      }
      if (syncMessageType === messageYjsSyncStep1) {
        sendReply = true;
      }
      break
    }
    case messageQueryAwareness:
      writeVarUint(encoder, messageAwareness);
      writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())));
      sendReply = true;
      break
    case messageAwareness:
      applyAwarenessUpdate(awareness, readVarUint8Array(decoder), room);
      break
    case messageBcPeerId: {
      const add = readUint8(decoder) === 1;
      const peerName = readVarString(decoder);
      if (peerName !== room.peerId && ((room.bcConns.has(peerName) && !add) || (!room.bcConns.has(peerName) && add))) {
        const removed = [];
        const added = [];
        if (add) {
          room.bcConns.add(peerName);
          added.push(peerName);
        } else {
          room.bcConns.delete(peerName);
          removed.push(peerName);
        }
        room.provider.emit('peers', [{
          added,
          removed,
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }]);
        broadcastBcPeerId(room);
      }
      break
    }
    default:
      console.error('Unable to compute message');
      return encoder
  }
  if (!sendReply) {
    // nothing has been written, no answer created
    return null
  }
  return encoder
};

/**
 * @param {WebrtcConn} peerConn
 * @param {Uint8Array} buf
 * @return {encoding.Encoder?}
 */
const readPeerMessage = (peerConn, buf) => {
  const room = peerConn.room;
  log('received message from ', BOLD, peerConn.remotePeerId, GREY, ' (', room.name, ')', UNBOLD, UNCOLOR);
  return readMessage(room, buf, () => {
    peerConn.synced = true;
    log('synced ', BOLD, room.name, UNBOLD, ' with ', BOLD, peerConn.remotePeerId);
    checkIsSynced(room);
  })
};

/**
 * @param {WebrtcConn} webrtcConn
 * @param {encoding.Encoder} encoder
 */
const sendWebrtcConn = (webrtcConn, encoder) => {
  log('send message to ', BOLD, webrtcConn.remotePeerId, UNBOLD, GREY, ' (', webrtcConn.room.name, ')', UNCOLOR);
  try {
    webrtcConn.peer.send(toUint8Array(encoder));
  } catch (e) {}
};

/**
 * @param {Room} room
 * @param {Uint8Array} m
 */
const broadcastWebrtcConn = (room, m) => {
  log('broadcast message in ', BOLD, room.name, UNBOLD);
  room.webrtcConns.forEach(conn => {
    try {
      conn.peer.send(m);
    } catch (e) {}
  });
};

class WebrtcConn {
  /**
   * @param {SignalingConn} signalingConn
   * @param {boolean} initiator
   * @param {string} remotePeerId
   * @param {Room} room
   */
  constructor (signalingConn, initiator, remotePeerId, room) {
    log('establishing connection to ', BOLD, remotePeerId);
    this.room = room;
    this.remotePeerId = remotePeerId;
    this.closed = false;
    this.connected = false;
    this.synced = false;
    /**
     * @type {any}
     */
    this.peer = new simplepeer_min({ initiator, ...room.provider.peerOpts });
    this.peer.on('signal', signal => {
      publishSignalingMessage(signalingConn, room, { to: remotePeerId, from: room.peerId, type: 'signal', signal });
    });
    this.peer.on('connect', () => {
      log('connected to ', BOLD, remotePeerId);
      this.connected = true;
      // send sync step 1
      const provider = room.provider;
      const doc = provider.doc;
      const awareness = room.awareness;
      const encoder = createEncoder();
      writeVarUint(encoder, messageSync);
      writeSyncStep1(encoder, doc);
      sendWebrtcConn(this, encoder);
      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = createEncoder();
        writeVarUint(encoder, messageAwareness);
        writeVarUint8Array(encoder, encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())));
        sendWebrtcConn(this, encoder);
      }
    });
    this.peer.on('close', () => {
      this.connected = false;
      this.closed = true;
      if (room.webrtcConns.has(this.remotePeerId)) {
        room.webrtcConns.delete(this.remotePeerId);
        room.provider.emit('peers', [{
          removed: [this.remotePeerId],
          added: [],
          webrtcPeers: Array.from(room.webrtcConns.keys()),
          bcPeers: Array.from(room.bcConns)
        }]);
      }
      checkIsSynced(room);
      this.peer.destroy();
      log('closed connection to ', BOLD, remotePeerId);
    });
    this.peer.on('close', () => {
      log('Connection to remote peer ', BOLD, remotePeerId, UNBOLD, ' has been closed');
      announceSignalingInfo(room);
    });
    this.peer.on('error', err => {
      log('Error in connection to ', BOLD, remotePeerId, ': ', err);
      announceSignalingInfo(room);
    });
    this.peer.on('data', data => {
      const answer = readPeerMessage(this, data);
      if (answer !== null) {
        sendWebrtcConn(this, answer);
      }
    });
  }

  destroy () {
    this.peer.destroy();
  }
}

/**
 * @param {Room} room
 * @param {Uint8Array} m
 */
const broadcastBcMessage = (room, m) => encrypt(m, room.key).then(data =>
  room.mux(() =>
    publish(room.name, data)
  )
);

/**
 * @param {Room} room
 * @param {Uint8Array} m
 */
const broadcastRoomMessage = (room, m) => {
  if (room.bcconnected) {
    broadcastBcMessage(room, m);
  }
  broadcastWebrtcConn(room, m);
};

/**
 * @param {Room} room
 */
const announceSignalingInfo = room => {
  signalingConns.forEach(conn => {
    // only subcribe if connection is established, otherwise the conn automatically subscribes to all rooms
    if (conn.connected) {
      conn.send({ type: 'subscribe', topics: [room.name] });
      if (room.webrtcConns.size < room.provider.maxConns) {
        publishSignalingMessage(conn, room, { type: 'announce', from: room.peerId });
      }
    }
  });
};

/**
 * @param {Room} room
 */
const broadcastBcPeerId = room => {
  if (room.provider.filterBcConns) {
    // broadcast peerId via broadcastchannel
    const encoderPeerIdBc = createEncoder();
    writeVarUint(encoderPeerIdBc, messageBcPeerId);
    writeUint8(encoderPeerIdBc, 1);
    writeVarString(encoderPeerIdBc, room.peerId);
    broadcastBcMessage(room, toUint8Array(encoderPeerIdBc));
  }
};

class Room {
  /**
   * @param {Y.Doc} doc
   * @param {WebrtcProvider} provider
   * @param {string} name
   * @param {CryptoKey|null} key
   */
  constructor (doc, provider, name, key) {
    /**
     * Do not assume that peerId is unique. This is only meant for sending signaling messages.
     *
     * @type {string}
     */
    this.peerId = uuidv4();
    this.doc = doc;
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = provider.awareness;
    this.provider = provider;
    this.synced = false;
    this.name = name;
    // @todo make key secret by scoping
    this.key = key;
    /**
     * @type {Map<string, WebrtcConn>}
     */
    this.webrtcConns = new Map();
    /**
     * @type {Set<string>}
     */
    this.bcConns = new Set();
    this.mux = createMutex();
    this.bcconnected = false;
    /**
     * @param {ArrayBuffer} data
     */
    this._bcSubscriber = data =>
      decrypt(new Uint8Array(data), key).then(m =>
        this.mux(() => {
          const reply = readMessage(this, m, () => {});
          if (reply) {
            broadcastBcMessage(this, toUint8Array(reply));
          }
        })
      );
    /**
     * Listens to Yjs updates and sends them to remote peers
     *
     * @param {Uint8Array} update
     * @param {any} origin
     */
    this._docUpdateHandler = (update, origin) => {
      const encoder = createEncoder();
      writeVarUint(encoder, messageSync);
      writeUpdate(encoder, update);
      broadcastRoomMessage(this, toUint8Array(encoder));
    };
    /**
     * Listens to Awareness updates and sends them to remote peers
     *
     * @param {any} changed
     * @param {any} origin
     */
    this._awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoderAwareness = createEncoder();
      writeVarUint(encoderAwareness, messageAwareness);
      writeVarUint8Array(encoderAwareness, encodeAwarenessUpdate(this.awareness, changedClients));
      broadcastRoomMessage(this, toUint8Array(encoderAwareness));
    };
    this.doc.on('update', this._docUpdateHandler);
    this.awareness.on('update', this._awarenessUpdateHandler);
    window.addEventListener('beforeunload', () => {
      removeAwarenessStates(this.awareness, [doc.clientID], 'window unload');
      rooms.forEach(room => {
        room.disconnect();
      });
    });
  }

  connect () {
    // signal through all available signaling connections
    announceSignalingInfo(this);
    const roomName = this.name;
    subscribe(roomName, this._bcSubscriber);
    this.bcconnected = true;
    // broadcast peerId via broadcastchannel
    broadcastBcPeerId(this);
    // write sync step 1
    const encoderSync = createEncoder();
    writeVarUint(encoderSync, messageSync);
    writeSyncStep1(encoderSync, this.doc);
    broadcastBcMessage(this, toUint8Array(encoderSync));
    // broadcast local state
    const encoderState = createEncoder();
    writeVarUint(encoderState, messageSync);
    writeSyncStep2(encoderState, this.doc);
    broadcastBcMessage(this, toUint8Array(encoderState));
    // write queryAwareness
    const encoderAwarenessQuery = createEncoder();
    writeVarUint(encoderAwarenessQuery, messageQueryAwareness);
    broadcastBcMessage(this, toUint8Array(encoderAwarenessQuery));
    // broadcast local awareness state
    const encoderAwarenessState = createEncoder();
    writeVarUint(encoderAwarenessState, messageAwareness);
    writeVarUint8Array(encoderAwarenessState, encodeAwarenessUpdate(this.awareness, [this.doc.clientID]));
    broadcastBcMessage(this, toUint8Array(encoderAwarenessState));
  }

  disconnect () {
    // signal through all available signaling connections
    signalingConns.forEach(conn => {
      if (conn.connected) {
        conn.send({ type: 'unsubscribe', topics: [this.name] });
      }
    });
    removeAwarenessStates(this.awareness, [this.doc.clientID], 'disconnect');
    // broadcast peerId removal via broadcastchannel
    const encoderPeerIdBc = createEncoder();
    writeVarUint(encoderPeerIdBc, messageBcPeerId);
    writeUint8(encoderPeerIdBc, 0); // remove peerId from other bc peers
    writeVarString(encoderPeerIdBc, this.peerId);
    broadcastBcMessage(this, toUint8Array(encoderPeerIdBc));

    unsubscribe(this.name, this._bcSubscriber);
    this.bcconnected = false;
    this.doc.off('update', this._docUpdateHandler);
    this.awareness.off('update', this._awarenessUpdateHandler);
    this.webrtcConns.forEach(conn => conn.destroy());
  }

  destroy () {
    this.disconnect();
  }
}

/**
 * @param {Y.Doc} doc
 * @param {WebrtcProvider} provider
 * @param {string} name
 * @param {CryptoKey|null} key
 * @return {Room}
 */
const openRoom = (doc, provider, name, key) => {
  // there must only be one room
  if (rooms.has(name)) {
    throw create(`A Yjs Doc connected to room "${name}" already exists!`)
  }
  const room = new Room(doc, provider, name, key);
  rooms.set(name, /** @type {Room} */ (room));
  return room
};

/**
 * @param {SignalingConn} conn
 * @param {Room} room
 * @param {any} data
 */
const publishSignalingMessage = (conn, room, data) => {
  if (room.key) {
    encryptJson(data, room.key).then(data => {
      conn.send({ type: 'publish', topic: room.name, data: toBase64(data) });
    });
  } else {
    conn.send({ type: 'publish', topic: room.name, data });
  }
};

class SignalingConn extends WebsocketClient {
  constructor (url) {
    super(url);
    /**
     * @type {Set<WebrtcProvider>}
     */
    this.providers = new Set();
    this.on('connect', () => {
      log(`connected (${url})`);
      const topics = Array.from(rooms.keys());
      this.send({ type: 'subscribe', topics });
      rooms.forEach(room =>
        publishSignalingMessage(this, room, { type: 'announce', from: room.peerId })
      );
    });
    this.on('message', m => {
      switch (m.type) {
        case 'publish': {
          const roomName = m.topic;
          const room = rooms.get(roomName);
          if (room == null || typeof roomName !== 'string') {
            return
          }
          const execMessage = data => {
            const webrtcConns = room.webrtcConns;
            const peerId = room.peerId;
            if (data == null || data.from === peerId || (data.to !== undefined && data.to !== peerId) || room.bcConns.has(data.from)) {
              // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
              return
            }
            const emitPeerChange = webrtcConns.has(data.from) ? () => {} : () =>
              room.provider.emit('peers', [{
                removed: [],
                added: [data.from],
                webrtcPeers: Array.from(room.webrtcConns.keys()),
                bcPeers: Array.from(room.bcConns)
              }]);
            switch (data.type) {
              case 'announce':
                if (webrtcConns.size < room.provider.maxConns) {
                  setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, true, data.from, room));
                  emitPeerChange();
                }
                break
              case 'signal':
                if (data.to === peerId) {
                  setIfUndefined(webrtcConns, data.from, () => new WebrtcConn(this, false, data.from, room)).peer.signal(data.signal);
                  emitPeerChange();
                }
                break
            }
          };
          if (room.key) {
            if (typeof m.data === 'string') {
              decryptJson(fromBase64(m.data), room.key).then(execMessage);
            }
          } else {
            execMessage(m.data);
          }
        }
      }
    });
    this.on('disconnect', () => log(`disconnect (${url})`));
  }
}

/**
 * @extends Observable<string>
 */
class WebrtcProvider extends Observable {
  /**
   * @param {string} roomName
   * @param {Y.Doc} doc
   * @param {Object} [opts]
   * @param {Array<string>} [opts.signaling]
   * @param {string?} [opts.password]
   * @param {awarenessProtocol.Awareness} [opts.awareness]
   * @param {number} [opts.maxConns]
   * @param {boolean} [opts.filterBcConns]
   * @param {any} [opts.peerOpts]
   */
  constructor (
    roomName,
    doc,
    {
      signaling = ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
      password = null,
      awareness = new Awareness(doc),
      maxConns = 20 + floor(rand() * 15), // the random factor reduces the chance that n clients form a cluster
      filterBcConns = true,
      peerOpts = {} // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts
    } = {}
  ) {
    super();
    this.roomName = roomName;
    this.doc = doc;
    this.filterBcConns = filterBcConns;
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = awareness;
    this.shouldConnect = false;
    this.signalingUrls = signaling;
    this.signalingConns = [];
    this.maxConns = maxConns;
    this.peerOpts = peerOpts;
    /**
     * @type {PromiseLike<CryptoKey | null>}
     */
    this.key = password ? deriveKey(password, roomName) : /** @type {PromiseLike<null>} */ (resolve(null));
    /**
     * @type {Room|null}
     */
    this.room = null;
    this.key.then(key => {
      this.room = openRoom(doc, this, roomName, key);
      if (this.shouldConnect) {
        this.room.connect();
      } else {
        this.room.disconnect();
      }
    });
    this.connect();
  }

  /**
   * @type {boolean}
   */
  get connected () {
    return this.room !== null && this.shouldConnect
  }

  connect () {
    this.shouldConnect = true;
    this.signalingUrls.forEach(url => {
      const signalingConn = setIfUndefined(signalingConns, url, () => new SignalingConn(url));
      this.signalingConns.push(signalingConn);
      signalingConn.providers.add(this);
    });
    if (this.room) {
      this.room.connect();
    }
  }

  disconnect () {
    this.shouldConnect = false;
    this.signalingConns.forEach(conn => {
      conn.providers.delete(this);
      if (conn.providers.size === 0) {
        conn.destroy();
        signalingConns.delete(this.roomName);
      }
    });
    if (this.room) {
      this.room.disconnect();
    }
  }

  destroy () {
    // need to wait for key before deleting room
    this.key.then(() => {
      /** @type {Room} */ (this.room).destroy();
      rooms.delete(this.roomName);
    });
    super.destroy();
  }
}

export { WebrtcProvider };
