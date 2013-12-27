tart-marshal
============

Send messages between memory domains (tart module)

## Overview
The `tart-marshal` module provides a mechanism 
for sending messages between memory domains.
This involves _marshalling_ each message,
converting local actor references into unguessable _tokens_ 
for transmission across a network.
```
domain0:                          domain1:
+----------------+                 +----------------+
|                | ping            | ping           |
|    +--------- ( token [ . . . . [ proxy ) <--+    |
|    v           |                 |           |    |
| ( ping )       |                 |       ( pong ) |
|    |      pong |            pong |           ^    |
|    +--> ( proxy ] . . . . ] token ) ---------+    |
|                |                 |                |
+----------------+                 +----------------+
```
The process begins by asking a _domain_ 
to generate a _token_ representing a remote reference to a local actor.
The _token_ is then used to create a _proxy_ in another domain.
The _proxy_ is an actor, local to another domain, 
that _mashals_ and forwards messages across a network
to a remote actor in the _domain_ which generated the _token_.

On receipt of a _marshalled_ message,
the destination _domain_ replaces any _tokens_
with references to local actors,
and delivers the message to the target actor
(identified by the _token_ used to create the _proxy_).
Unrecognized _tokens_ are replaced by
new local _proxies_ for remote references.

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

var bootstrapBeh = function (pingToken) {
    domain1.proxyFactory({
        remote: pingToken,
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

## Documentation

**Public API**

  * [marshal.domain(name, sponsor)](#marshaldomainnamesponsor)
  * [domain.tokenFactory](#domaintokenFactory)
  * [domain.proxyFactory](#domainproxyFactory)

### marshal.domain(name, sponsor)

  * `name`: _String_ unique identifier for this domain (e.g: FQDN).
  * `sponsor`: _Function_ `function (behavior) {}` 
      Capability used to create new actors.
  * Return: _Object_ `domain` capabilities.
    * `name`: _String_ As specified on creation.
    * `sponsor`: _Function_ As specified on creation.
    * `tokenFactory`: _Function_ `function (message) {}` 
        Actor used to make _tokens_ from local actor references.
    * `proxyFactory`: _Function_ `function (message) {}` 
        Actor used to make _proxies_ from remote actor _tokens_.

Creates a new _domain_ and returns actors used to make _tokens_ and _proxies_.

### domain.tokenFactory(message)

  * `message`: _Object_ Asynchronous message to actor.
    * `local`: _Function_ `function (message) {}` local actor reference.
    * `customer`: _Function_ `function (message) {}` actor to receive the _token_.

Sends `customer` a _token_ representing the `local` actor.
Multiple request with the same `local` always produce the same _token_.

### domain.proxyFactory(message)

  * `message`: _Object_ Asynchronous message to actor.
    * `remote`: _String_ remote actor reference _token_.
    * `customer`: _Function_ `function (message) {}` actor to receive the _proxy_.

Sends `customer` a _proxy_ that will forward messages to
the `remote` actor represented by the _token_.
The _proxy_ is a local actor created by `domain.sponsor()`.
Multiple request with the same `remote` always produce the same _proxy_.
