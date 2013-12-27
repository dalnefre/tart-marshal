tart-marshal
============

Send messages between memory domains (tart module)

## Overview
The `tart-marshal` module provides a mechanism 
for sending messages between memory domains.
This involves _marshalling_ each message,
converting local actor references into unforgeable _tokens_ 
for transmission across a network.
```
domain0:                          domain1:
+----------------+                +----------------+
|                | ping           | ping           |
|    +--------- ( token [ ...... [ proxy ) <--+    |
|    v           |                |           |    |
| ( ping )       |                |       ( pong ) |
|    |      pong |           pong |           ^    |
|    +--> ( proxy ] ...... ] token ) ---------+    |
|                |                |                |
+----------------+                +----------------+
```
The process begins by asking a _domain_ 
to generate a _token_ representing a local actor.
The _token_ is then used to create a _proxy_ in another domain.
The _proxy_ is an actor, local to another domain, 
the forwards messages across the network
to the domain which generated the _token_.
On receipt of the _marshalled_ message,
the destination domain replaces any _tokens_
with references to local actors,
and delivers the message to the target actor
(identified by the _token_ used to create the _proxy_).

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