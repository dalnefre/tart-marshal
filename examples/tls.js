/*

tls.js - TLS example

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

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

var fs = require('fs');
var path = require('path');
var marshal = require('../index.js');
var tart = require('tart');
var transport = require('tart-transport-tls');

var sponsor = tart.minimal();

var send = sponsor(transport.sendWithOptions({
    key: fs.readFileSync(path.normalize(path.join(__dirname, 'tls/client-key.pem'))),
    cert: fs.readFileSync(path.normalize(path.join(__dirname, 'tls/client-cert.pem'))),
    rejectUnauthorized: true,
    secureProtocol: "TLSv1_method",
    ca: [fs.readFileSync(path.normalize(path.join(__dirname, 'tls/server-cert.pem')))]
}));

var domain0 = marshal.domain('tcp://localhost:10000/', send);
var domain1 = marshal.domain('tcp://localhost:10001/', send);

var pingBeh = function pingBeh(message) {
    console.dir(message);
    if (message.value === undefined) {
        var pong = message.pong;
        pong({ping: this.self, pong: pong, value: "pinging"});
    } else {
        console.log('ping', message.value);
        console.log('(ping === message.ping)', ping === message.ping);
        closeDomain0();
        closeDomain1();
    }
};

var pongBeh = function pongBeh(message) {
    var ping = message.ping;
    ping({ping: ping, pong: this.self, value: "ponging"});
    console.log('pong', message.value);
};

var ping = sponsor(pingBeh);
var pong = sponsor(pongBeh);

var bootstrapBeh = function bootstrapBeh(pingToken) {
    var pingProxy = domain1.remoteToLocal(pingToken);
    pingProxy({pong: pong});
};

var listenAcks = 0;
var bothAck = sponsor(function bothAckBeh(message) {
    console.log('tls server listening', message);
    listenAcks++;
    if (listenAcks == 2) {
        // both servers are listening, bootstrap and start ping-pong
        var pingToken = domain0.localToRemote(ping);
        sponsor(bootstrapBeh)(pingToken);
    }
});

var domain0TcpCaps = transport.server(domain0.receptionist);
var domain1TcpCaps = transport.server(domain1.receptionist);

// start domain 0 server
var listenDomain0 = sponsor(domain0TcpCaps.listenBeh);
var closeDomain0 = sponsor(domain0TcpCaps.closeBeh);

listenDomain0({
    host: 'localhost',
    port: 10000,
    ok: bothAck,

    key: fs.readFileSync(path.normalize(path.join(__dirname, 'tls/server-key.pem'))),
    cert: fs.readFileSync(path.normalize(path.join(__dirname, 'tls/server-cert.pem'))),
    rejectUnauthorized: true,
    secureProtocol: "TLSv1_method",
    // This is necessary only if using the client certificate authentication.
    requestCert: true,
    // This is necessary only if the client uses the self-signed certificate.
    ca: [fs.readFileSync(path.normalize(path.join(__dirname, 'tls/client-cert.pem')))]
});

// start domain 1 server
var listenDomain1 = sponsor(domain1TcpCaps.listenBeh);
var closeDomain1 = sponsor(domain1TcpCaps.closeBeh);

listenDomain1({
    host: 'localhost',
    port: 10001,
    ok: bothAck,

    key: fs.readFileSync(path.normalize(path.join(__dirname, 'tls/server-key.pem'))),
    cert: fs.readFileSync(path.normalize(path.join(__dirname, 'tls/server-cert.pem'))),
    rejectUnauthorized: true,
    secureProtocol: "TLSv1_method",
    // This is necessary only if using the client certificate authentication.
    requestCert: true,
    // This is necessary only if the client uses the self-signed certificate.
    ca: [fs.readFileSync(path.normalize(path.join(__dirname, 'tls/client-cert.pem')))]
});
