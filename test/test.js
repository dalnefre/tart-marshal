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

var tart = require('tart-tracing');
var marshal = require('../index.js');

var test = module.exports = {};   

test['tracing event loop runs to completion'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    
    test.equal(sponsor, tracing.sponsor);

    test.ok(tracing.eventLoop());
    test.done();
};

test['ping/pong example from README'] = function (test) {
    test.expect(5);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    
    var domain0 = marshal.domain('ocap://zero.foo.com/', sponsor);
    var domain1 = marshal.domain('ocap://one.bar.com/', sponsor);

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

    var ping = domain0.sponsor(pingBeh);
    var pong = domain1.sponsor(pongBeh);

    var pingRemote = domain0.localToRemote(ping);
    var pingProxy = domain1.remoteToLocal(pingRemote);

    pingProxy({ pong:pong });

    test.ok(tracing.eventLoop());
    test.done();
};

test['ping/pong example using capability actors'] = function (test) {
    test.expect(5);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;
    
    var domain0 = marshal.domain('ocap://zero.foo.com/', sponsor);
    var domain1 = marshal.domain('ocap://one.bar.com/', sponsor);

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

    var ping = domain0.sponsor(pingBeh);
    var pong = domain1.sponsor(pongBeh);

    var localToRemote0 = sponsor(domain0.localToRemoteBeh);
    var remoteToLocal1 = sponsor(domain1.remoteToLocalBeh);
    localToRemote0({
        local: ping,
        customer: function (remote) {
            remoteToLocal1({
                remote: remote,
                customer: function (proxy) {
                    proxy({ pong: pong });
                }
            });
        }
    });
    
    test.ok(tracing.eventLoop());
    test.done();
};

test['can send simple string across domains'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;

    var domain0 = marshal.domain('ocap://zero.foo.com/', sponsor);
    var domain1 = marshal.domain('ocap://one.foo.com/', sponsor);

    var receiver = domain0.sponsor(function (message) {
        test.equal(message, 'hello domains');
    });

    var remoteReceiver = domain0.localToRemote(receiver);
    domain1.remoteSend(remoteReceiver, 'hello domains');

    test.ok(tracing.eventLoop());
    test.done();
};