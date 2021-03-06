/*

index.js - "tart-marshal": Send messages between memory domains (tart module)

The MIT License (MIT)

Copyright (c) 2013-2016 Dale Schumacher, Tristan Slominski

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

var crypto = require("crypto");
var marshal = module.exports;

marshal.randomBytes = crypto.randomBytes;

marshal.defaultRoute = function route(message) {
    throw Error('No route for ' + message.address);
};

marshal.router = function router(defaultRoute) {  // table-based routing transport
    var self = {};

    self.defaultRoute = defaultRoute || marshal.defaultRoute;

    self.routingTable = {};  // mapping from domains to transports

    self.transport = function transport(message) {
        // { address:<token>, content:<json> }
        var remote = message.address;
        var parsed = remote.split('#');
        if (parsed.length != 2) { throw Error('Bad address format: ' + remote); }
        var domain = parsed[0];
        var route = self.routingTable[domain];
        if (!route) {
            route = self.defaultRoute;
        }
        route(message);
    };

    self.domain = function domain(name) {
        var dom = marshal.domain(name, self.transport);
        self.routingTable[dom.name] = function route(message) {
            dom.receptionist(message);  // call domain endpoint
        };
        return dom;
    };

    return self;
};

marshal.domain = function domain(name, transport) {
    var self = {};
    var tokenMap = {};

    self.receptionist = function endpoint(message) {
        // { address:<token>, content:<json> }
        var local = tokenMap[message.address];
        if (!local) { throw Error('Unknown address: ' + message.address); }
        local(decode(message.content));
    };

    var bindLocal = function bindLocal(remote, local) {
        tokenMap[remote] = local;
    };

    var localToRemote = function localToRemote(local) {
        var remote;
        for (remote in tokenMap) {
            if (tokenMap[remote] === local) {
                return remote;
            }
        }
        /* not found, create a new entry */
        remote = generateToken();
        bindLocal(remote, local);
        return remote;
    };
    var generateToken = function generateToken() {
        return self.name + '#' + generateCapability();
    };
    var generateCapability = function generateCapability() {
        return marshal.randomBytes(42).toString('base64');
    };

    var remoteToLocal = function remoteToLocal(remote) {
        var local = tokenMap[remote];
        if (local === undefined) {
            local = newProxy(remote);  // create new proxy function
            bindLocal(remote, local);
        }
        return local;
    };
    var newProxy = function newProxy(remote) {
        return function proxy(message) {
            self.transport({
                address: remote,
                content: encode(message)
            });
        };
    };

    var encode = function encode(message) {
        return JSON.stringify(message, replacer);
    };
    var replacer = function replacer(key, value) {
        if (typeof value === 'function') {
            return localToRemote(value);
        }
        if (typeof value === 'string') {
            return encodeString(value);
        }
        if (value instanceof Error) {
            return {
                message: value.message,
                stack: value.stack
            };
        }
        return value;
    };
    var encodeString = function encodeString(value) {
        return ":" + value;
    };

    var decode = function decode(json) {
        if (json === undefined) {
            return undefined;
        }
        return JSON.parse(json, reviver);
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
    var isString = function isString(value) {
        return (value.charAt(0) === ":");
    };
    var decodeString = function decodeString(value) {
        return value.slice(1);
    };

    var generateName = function generateName(name) {
        if (!name) {
            name = 'ansible://' + generateCapability() + '/';
        }
        return name;
    };

    self.name = generateName(name);
    self.transport = transport || marshal.defaultRoute;
    self.encode = encode;
    self.decode = decode;
    self.localToRemote = localToRemote;
    self.remoteToLocal = remoteToLocal;
    self.bindLocal = bindLocal;
    return self;
};
