/*

dos.js - denial-of-service attack regression test

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

test['default receptionist should not create proxies for unknown inbound addresses'] = function (test) {
    test.expect(1);
    var stepping = tart.stepping();
    var sponsor = stepping.sponsor;

    var network = marshal.router(sponsor);
    var domain = marshal.domain('tcp://localhost:1000/', sponsor, network.transport);

	try {
		domain.receptionist({
			address: 'tcp://localhost:1000/#doesnotexist',
			content: '"boom!"'
		});
		stepping.eventLoop();
	} catch (error) {
		test.equal(error.message, 
			"Unknown address: tcp://localhost:1000/#doesnotexist");
	}

    test.done();
};
