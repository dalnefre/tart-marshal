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

marshal.domain = function domain(sponsor) {
    var sequence = 0;
    var tokenMap = {};

    var localToRemote = function localToRemote(local) {
        var remote;
        for (remote in tokenMap) {
            if (tokenMap[remote] === local) {
                return remote;
            }
        }
        /* not found, create a new entry */
        remote = encodeToken(generateToken());
        tokenMap[remote] = local;
        return remote;
    };
    var generateToken = function generateToken() {
        var crypto = require('crypto');
        var fodder = '' 
            + (++sequence) 
            + (new Date()).getTime() 
            + process.hrtime();
        var token = crypto.createHash('sha1').update(fodder).digest('base64');
        return token;
    };
    var encodeToken = function encodeToken(value) {
        return "=" + value;
    };

    var remoteToLocal = function remoteToLocal(remote) {
        var local = tokenMap[remote];
        if (local === undefined) {
            local = proxy(remote);
        }
        return local;
    };
    var proxy = function proxy(remote) {
        return sponsor(function (message) {
            remoteSend(remote, message);
        });
    };
    
    var remoteSend = function remoteSend(remote, message) {
        var json = encode(message);
        //...
    };

    var encode = function encode(message) {
        var json;
        json = JSON.stringify(message, replacer);
        return json;
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
    var encodeString = function encodeString(value) {
        return "'" + value;
    };

    var decode = function decode(json) {
        var message;
        message = JSON.parse(json, reviver);
        return message;
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
    var isRemote = function isRemote(value) {
        return (value.charAt(0) === "=");
    };
    var decodeString = function decodeString(value) {
        return value.slice(1);
    };

    return {
        encode: encode,
        decode: decode
    };
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