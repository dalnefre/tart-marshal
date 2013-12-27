/*

readme.js - example from the README

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

var tart = require('tart-tracing');
var marshal = require('../index.js');

var tracing = tart.tracing();
var sponsor = tracing.sponsor;

var domain0 = marshal.domain('zero', sponsor);
var domain1 = marshal.domain('one', sponsor);

var pingBeh = function pingBeh(message) {
    if (message.value === undefined) {
        var pong = message.pong;
        pong({ ping:this.self, pong:pong, value:"pinging" });
    } else {
        console.log('ping', message.value);
        console.log('(ping === message.ping)', (ping === message.ping));
    }
};
var pongBeh = function pongBeh(message) {
    var ping = message.ping;
    ping({ ping:ping, pong:this.self, value:"ponging" });
    console.log('pong', message.value);
};

var ping = domain0.sponsor(pingBeh);
var pong = domain1.sponsor(pongBeh);

var bootstrapBeh = function (pingToken) {
    domain1.proxyFactory({
        remote: pingToken,
        customer: this.self
    });
    this.behavior = function (pingProxy) {
        pingProxy({ pong: pong });
    };
};

domain0.tokenFactory({
    local: ping,
    customer: sponsor(bootstrapBeh)
});

tracing.eventLoop({
    log: function(effect) {
        console.dir(effect);
    }
});
