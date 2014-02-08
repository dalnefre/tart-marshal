/*

errors.js - marshaling errors test

The MIT License (MIT)

Copyright (c) 2014 Dale Schumacher, Tristan Slominski

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

test['errors are marshalled as objects with stack and message properties'] = function (test) {
    test.expect(3);
    var stepping = tart.stepping();
    var sponsor = stepping.sponsor;

    var network = marshal.router(sponsor);
    var domain0 = network.domain('ocap:zero');
    var domain1 = network.domain('ocap:one');

    var errorGeneratorBeh = function errorGeneratorBeh(customer) {
        var error = new Error("boom!");
        customer(error);
    };

    var errorTestBeh = function errorTestBeh(error) {
        test.equal(error.message, "boom!");
        test.ok(error.stack);
    };

    var errorGenerator0 = domain0.sponsor(errorGeneratorBeh);
    var errorTester1 = domain1.sponsor(errorTestBeh);

    var errorGeneratorURI = domain0.localToRemote(errorGenerator0);
    var errorGeneratorProxy = domain1.remoteToLocal(errorGeneratorURI);

    errorGeneratorProxy(errorTester1);

    test.ok(stepping.eventLoop());
    test.done();
};