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

var domainMap = {};

marshal.domain = function domain(name, sponsor) {
    var self = {};
    var sequence = 0;
    var tokenMap = {};

    self.name = name;
    self.sponsor = sponsor;
    domainMap[name] = self;

    var localToRemote = function localToRemote(local) {
        var remote;
        for (remote in tokenMap) {
            if (tokenMap[remote] === local) {
                console.log('localToRemote(found):', name, remote);
                return remote;
            }
        }
        /* not found, create a new entry */
        remote = encodeToken(generateToken());
        tokenMap[remote] = local;
        console.log('localToRemote(created):', name, remote);
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
        console.log('encodeToken:', name, value);
        return "=" + name + "#" + value;
    };

    var remoteToLocal = function remoteToLocal(remote) {
        var local = tokenMap[remote];
        if (local === undefined) {
            local = proxy(remote);
            tokenMap[remote] = local;
        }
        console.log('remoteToLocal:', name, remote);
        return local;
    };
    var proxy = function proxy(remote) {
        console.log('proxy:', name, remote);
        return sponsor(function (message) {
            remoteSend(remote, message);
        });
    };
    
    var remoteSend = function remoteSend(remote, message) {
        var addr = decodeToken(remote);
        if (!addr) { throw Error('Bad remote format: ' + remote); }
        var dom = domainMap[addr.name];
        if (!dom) { throw Error('Unknown domain: ' + addr.name); }
        var json = encode(message);
        dom.localSend(remote, json);
    };
    var tokenPattern = /^=([^?]+)#(.+)$/;
    var decodeToken = function decodeToken(token) {
        var result = tokenPattern.exec(token);
        return (result ? {
            name: result[1],
            value: result[2],
            token: result[0]
        } : undefined);
    };
    var localSend = function localSend(remote, json) {
        console.log('localSend:', remote, json);
        var local = tokenMap[remote];
        if (!local) { throw Error('Unknown remote: ' + remote); }
        var message = decode(json);
        local(message);
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

    self.localToRemote = localToRemote;
    self.remoteSend = remoteSend;
    self.localSend = localSend;
    return self;
};
