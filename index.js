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

var routingTable = {};  // simulated network routing

var encodeToken = function encodeToken(domain, capability) {
    return domain + "#" + capability;
};
var tokenPattern = /^([^?]+)#(.+)$/;
var decodeToken = function decodeToken(token) {
    var result = tokenPattern.exec(token);
    return (result ? {
        domain: result[1],
        capability: result[2],
        token: result[0]
    } : undefined);
};

marshal.decodeToken = decodeToken;

marshal.domain = function domain(name, sponsor, transport) {
    var self = {};
    var tokenMap = {};

    self.name = name;
    self.sponsor = sponsor;
    
    transport = transport || function transport(message) {
        // { address:<token>, content:<json> }
        var parsed = decodeToken(message.address);
        if (!parsed) { throw Error('Bad address format: ' + message.address); }
        var route = routingTable[parsed.domain];
        if (!route) { throw Error('Unknown domain: ' + parsed.domain); }
        route(message);
    };

    var routerBeh = function routerBeh(message) {
        // { address:<token>, content:<json> }
        var local = tokenMap[message.address];
        if (!local) { throw Error('Unknown address: ' + message.address); }
        local(decode(message.content));
    };
    self.receptionist = sponsor(routerBeh);
    routingTable[name] = self.receptionist;

    var localToRemote = function localToRemote(local) {
        var remote;
        for (remote in tokenMap) {
            if (tokenMap[remote] === local) {
                return remote;
            }
        }
        /* not found, create a new entry */
        remote = encodeToken(name, generateToken());
        tokenMap[remote] = local;
        return remote;
    };
    var generateToken = function generateToken() {
        try {
            return require('crypto').randomBytes(42).toString('base64');
        } catch (exception) {
            // FIXME: if the system runs out of entropy, an exception will be
            //        thrown; we need to define system behavior when we are out
            //        of entropy, remembering that the entire OS crypto activity
            //        (including any encrypted network traffic) will grind to
            //        a halt while waiting for entropy to be available
            throw exception;
        }
    };

    var remoteToLocal = function remoteToLocal(remote) {
        var local = tokenMap[remote];
        if (local === undefined) {
            local = sponsor(proxy(remote));  // create new proxy
            tokenMap[remote] = local;
        }
        return local;
    };
    var proxy = function proxy(remote) {
        return function proxyBeh(message) {
            transport({
                address: remote, 
                content: encode(message)
            });
        };
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
            if (isString(value)) {
                return decodeString(value);
            } else {
                return remoteToLocal(value);
            }
        }
        return value;
    };
    var isString = function isRemote(value) {
        return (value.charAt(0) === "'");
    };
    var decodeString = function decodeString(value) {
        return value.slice(1);
    };

    self.tokenFactory = sponsor(function tokenFactoryBeh(message) {
        message.customer(localToRemote(message.local));
    });
    self.proxyFactory = sponsor(function proxyFactoryBeh(message) {
        message.customer(remoteToLocal(message.remote));
    });
    return self;
};
