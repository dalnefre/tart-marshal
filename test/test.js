/*

test.js - test script

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

var tart = require('tart-stepping');
var marshal = require('../index.js');

var test = module.exports = {};

test['stepping event loop runs to completion'] = function (test) {
    test.expect(2);
    var stepping = tart.stepping();
    var sponsor = stepping.sponsor;

    test.equal(sponsor, stepping.sponsor);

    test.ok(stepping.eventLoop());
    test.done();
};

test['ping/pong example from README'] = function (test) {
    test.expect(5);
    var stepping = tart.stepping();
    var sponsor = stepping.sponsor;

    var network = marshal.router();
    var domain0 = network.domain('ocap:zero');
    var domain1 = network.domain('ocap:one');

    var pingBeh = function pingBeh(message) {
        if (message.value === undefined) {
            var _pong = message.pong;
            test.notStrictEqual(_pong, pong);
            _pong({ ping:this.self, pong:_pong, value:'pinging' });
        } else {
            test.equal(message.value, 'ponging');
            test.strictEqual(message.ping, ping);
        }
    };

    var pongBeh = function pongBeh(message) {
        var ping = message.ping;
        ping({ ping:ping, pong:this.self, value:'ponging' });
        test.equal(message.value, 'pinging');
    };

    var ping = sponsor(pingBeh);
    var pong = sponsor(pongBeh);

    var pingRemote = domain0.localToRemote(ping);
    var pingProxy = domain1.remoteToLocal(pingRemote);

    pingProxy({ pong: pong });  // send message between domains

    test.ok(stepping.eventLoop());
    test.done();
};

test['can send simple string across domains'] = function (test) {
    test.expect(2);
    var stepping = tart.stepping();
    var sponsor = stepping.sponsor;

    var network = marshal.router();
    var domain0 = network.domain('ocap:zero');
    var domain1 = network.domain('ocap:one');

    var receiver = sponsor(function (message) {
        test.equal(message, 'hello domains');
    });

    var remoteReceiver = domain0.localToRemote(receiver);
    var remoteProxy = domain1.remoteToLocal(remoteReceiver);

    remoteProxy('hello domains');  // send message between domains

    test.ok(stepping.eventLoop());
    test.done();
};
