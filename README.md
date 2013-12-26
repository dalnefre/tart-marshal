tart-marshal
============

Send messages between memory domains (tart module)

## Usage

To run the below example run:

    npm run readme

```javascript
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

var bootstrapBeh = function (pingRemote) {
    domain1.proxyFactory({
        remote: pingRemote,
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

```

## Tests

    npm test