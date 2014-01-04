/*

implicit.js - implicit marshal test

The MIT License (MIT)

Copyright (c) 2013 Dale Schumacher, Tristan Slominski

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

var marshal = require('../index.js');
var tart = require('tart-stepping');

var test = module.exports = {};

test['capability in a message is marshalled when crossing domains'] = function (test) {
    test.expect(6);
    var stepping = tart.stepping();
    var sponsor = stepping.sponsor;

    var network = marshal.router(sponsor);
    var domain0 = network.domain('ocap:zero');
    var domain1 = network.domain('ocap:one');

    var remote1Beh = function remote1Beh(implicits) {
        test.equal(implicits.length, 2);
        test.notStrictEqual(implicits[0], implicitA);
        test.notStrictEqual(implicits[1], implicitB);
        test.ok(typeof implicitA === 'function');
        test.ok(typeof implicitB === 'function');
    };

    var implicitA = domain0.sponsor(function () {});
    var implicitB = domain0.sponsor(function () {});
    var remote1 = domain1.sponsor(remote1Beh);

    var remote1Marshalled = domain0.localToRemote(remote1);
    var remote1Proxy = domain1.remoteToLocal(remote1Marshalled);

    remote1Proxy([implicitA, implicitB]);  // send message between domains

    test.ok(stepping.eventLoop());
    test.done();
};