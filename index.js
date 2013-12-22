/*

index.js - "tart-marshal": Send messages between memory domains (tart module)

The MIT License (MIT)

Copyright (c) 2013 Dale Schumacher

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
"use strict";

var marshal = module.exports;

var localToRemote = function localToRemote(value) {
    value = /* token corresponding to function value */;
    return "=" + value;
};
var encodeString = function encodeString(value) {
    return "'" + value;
};
var replacer = function replacer(key, value) {
    if (typeof value === 'function') {
        return localToRemote(value);
    }
    if (typeof value === 'string') {
        return encodeString(value);
    }
    return value;
};
marshal.encode = function encode(message) {
    var json;
    json = JSON.stringify(message, replacer);
    return json;
};

var isRemote = function isRemote(value) {
    return (value.charAt(0) === "=");
};
var remoteToLocal = function remoteToLocal(value) {
    return /* function corresponding to token value */;
};
var decodeString = function decodeString(value) {
    return value.slice(1);
};
var reviver = function reviver(key, value) {
    if (typeof value === 'string') {
        if (isRemote(value)) {
            return remoteToLocal(value);
        } else {
            return decodeString(value);
        }
    }
    return value;
};
marshal.decode = function decode(json) {
    var message;
    message = JSON.parse(json, reviver);
    return message;
};

marshal.proxy(pong) = function proxy(actor) {
    var proxyCaps = {};
    proxyCaps.proxyBeh = function (message) {
        // ...
    };
    proxyCaps.stubBeh = function (message) {
        // ...
    };
    return proxyCaps;
};
