/*

multi-sponsor.js - multiple-sponsor domain-routing test

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

var tart = require('tart');
var marshal = require('../index.js');

var test = module.exports = {};   

test['ping/pong example with multiple sponsors'] = function (test) {
    test.expect(4);
    var netSponsor = tart.minimal();
    var dom0Sponsor = tart.minimal();
    var dom1Sponsor = tart.minimal();

    var network = marshal.router(netSponsor);
    var domain0 = network.domain('ocap:zero', dom0Sponsor);
    var domain1 = network.domain('ocap:one', dom1Sponsor);

    var pingBeh = function pingBeh(message) {
        if (message.value === undefined) {
            var _pong = message.pong;
            test.notStrictEqual(_pong, pong);
            _pong({ ping:this.self, pong:_pong, value:'pinging' });
        } else {
            test.equal(message.value, 'ponging');
            test.strictEqual(message.ping, ping);
            test.done();
        }
    };

    var pongBeh = function pongBeh(message) {
        var ping = message.ping;
        ping({ ping:ping, pong:this.self, value:'ponging' });
        test.equal(message.value, 'pinging');
    };

    var ping = domain0.sponsor(pingBeh);
    var pong = domain1.sponsor(pongBeh);

    var pingToken = domain0.localToRemote(ping);
    var pingProxy = domain1.remoteToLocal(pingToken);

    pingProxy({ pong: pong });  // send message between domains
};
