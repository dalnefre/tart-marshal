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

marshal.router = function router(sponsor, defaultRoute) {  // table-based routing transport
    var self = {};

    self.sponsor = sponsor;
    self.defaultRoute = defaultRoute || sponsor(function(message) {
        throw Error('No route for ' + message.address);
    });

    self.routingTable = {};  // mapping from domains to transports

    self.transport = sponsor(function routerBeh(message) {
        // { address:<token>, content:<json> }
        var remote = message.address;
        var parsed = remote.split('#');
        if (parsed.length != 2) { throw Error('Bad address format: ' + remote); }
        var domain = parsed[0];
        var route = self.routingTable[domain];
        if (!route) {
            route = defaultRoute;
        }
        route(message);
    });

    self.domain = function domain(name, sponsor) {
        sponsor = sponsor || self.sponsor;
        var dom = marshal.domain(name, sponsor, self.transport);
        self.routingTable[name] = dom.receptionist;
        return dom;
    };

    return self;
};

marshal.domain = function domain(name, sponsor, transport) {
    var self = {};
    var tokenMap = {};

    self.name = name;
    self.sponsor = sponsor;
    self.transport = transport;
    
    self.receptionist = sponsor(function receptionistBeh(message) {
        // { address:<token>, content:<json> }
        var local = tokenMap[message.address];
        if (!local) { throw Error('Unknown address: ' + message.address); }
        local(decode(message.content));
    });

    var localToRemote = function localToRemote(local) {
        var remote;
        for (remote in tokenMap) {
            if (tokenMap[remote] === local) {
                return remote;
            }
        }
        /* not found, create a new entry */
        remote = name + '#' + generateCapability();
        tokenMap[remote] = local;
        return remote;
    };
    var generateCapability = function generateCapability() {
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
        return ":" + value;
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
    var isString = function isString(value) {
        return (value.charAt(0) === ":");
    };
    var decodeString = function decodeString(value) {
        return value.slice(1);
    };

    self.localToRemote = localToRemote;
    self.remoteToLocal = remoteToLocal;
    return self;
};

marshal.applyBeh = function (obj, fn) {
    return function applyBeh(message) {
        message.customer(fn.apply(obj, message.arguments));
    };
};
