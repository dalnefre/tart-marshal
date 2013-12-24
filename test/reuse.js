/*

reuse.js - reuse created tokens test

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
var tart = require('tart-tracing');

var test = module.exports = {};

test['an already created remote reference should be reused for the same actor'] = function (test) {
    test.expect(2);
    var tracing = tart.tracing();
    var sponsor = tracing.sponsor;

    var domain0 = marshal.domain('ocap://zero.foo.com/', sponsor);
    var domain1 = marshal.domain('ocap://one.foo.com/', sponsor);

    var remoteBeh = function remoteBeh(firstDelivery) {
        this.behavior = function (secondDelivery) {
            // second time expect *the same* actor
            test.strictEqual(firstDelivery, secondDelivery);
        };
    };

    var actor = domain0.sponsor(function () {});
    var remote = domain1.sponsor(remoteBeh);

    var remoteMarshalled = domain1.localToRemote(remote);
    domain0.remoteSend(remoteMarshalled, actor);
    domain0.remoteSend(remoteMarshalled, actor);

    test.ok(tracing.eventLoop());
    test.done();
};