tart-marshal
============

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/tart-marshal.png)](http://npmjs.org/package/tart-marshal)

Send messages between memory domains (tart module)

## Contributors

[@dalnefre](https://github.com/dalnefre), [@tristanls](https://github.com/tristanls)

## Overview

The `tart-marshal` module provides a mechanism for sending messages between memory domains. This involves _marshalling_ each message, converting local actor references into unguessable _tokens_ for transmission across a network.

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
The process begins by asking a _domain_ to generate a _token_ representing a remote reference to a local actor. The _token_ is then used to create a _proxy_ in another domain. The proxy _marshals_ and forwards messages across a network to a remote actor in the _domain_ which generated the _token_.

On receipt of a _marshalled_ message, the destination _domain_ replaces any _tokens_ with references to local actors, and delivers the message to the target actor (identified by the _token_ used to create the _proxy_). Unrecognized _tokens_ are replaced by new local _proxies_ for remote references.

  * [Usage](#usage)
  * [Tests](#tests)
  * [Examples](#examples)
  * [Documentation](#documentation)

## Usage

To run the below example run:

    npm run readme

```javascript
"use strict";

var tart = require('tart-stepping');
var marshal = require('../index.js');

var stepping = tart.stepping();
var sponsor = stepping.sponsor;

var network = marshal.router();
var domain0 = network.domain('ocap:zero');
var domain1 = network.domain('ocap:one');

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

var ping = sponsor(pingBeh);
var pong = sponsor(pongBeh);

var pingToken = domain0.localToRemote(ping);
var pingProxy = domain1.remoteToLocal(pingToken);

pingProxy({ pong: pong });  // send message between domains

stepping.eventLoop({
    log: function(effect) {
        console.dir(effect);
    }
});

```

## Tests

    npm test

## Examples

    npm run all-examples

## Documentation

**Public API**

  * [marshal.router(\[defaultRoute)\]](#marshalrouterdefaultroute)
  * [router.domain(name)](#routerdomainname)
  * [marshal.domain(name, transport)](#marshaldomainnametransport)
  * [domain.decode(json)](#domaindecodejson)
  * [domain.encode(message)](#domainencodemessage)
  * [domain.localToRemote(actor)](#domainlocaltoremoteactor)
  * [domain.remoteToLocal(token)](#domainremotetolocaltoken)
  * [domain.bindLocal(token, actor)](#bindlocaltokenactor)
  * [domain.receptionist(message)](#domainreceptionistmessage)

### marshal.router([defaultRoute])

  * `defaultRoute`: _Function_ `function (message) {}` (default _throws_)
      Actor used to make route messages to unrecognized domains.
  * Return: _Object_ `router` capabilities.
    * `defaultRoute`: _Function_ As specified on creation.
    * `transport`: _Function_ `function (message) {}`
        Actor used to route messages to remote _domains_.
    * `domain`: _Function_ `function (name) {}`
        Capability to create a domain registered to use this router as _transport_.
    * `routingTable`: _Object_ (default `{}`)
        Mapping from _domains_ to _transports_.

Creates a new _router_ and returns a control object. The protocol for all _transports_ consists of messages with the format `{ address:<token>, message:<json> }`. The `router.transport` function uses `router.routingTable` to look up routes (transports) based on the _domain_ portion of the `address`.

### router.domain(name)

  * `name`: _String_ URI (without fragment) for this domain.
  * Return: _Object_ `domain` capabilities.
    _Same as `marshal.domain()`_

Creates a new _domain_ and returns capabilities to make _tokens_ and _proxies_. This is a convenience function that uses `marshal.domain()`, providing `router.transport` as the _transport_. It also registers the `domain.receptionist` under `router.routingTable[name]`.

### marshal.domain(name, transport)

  * `name`: _String_ URI (without fragment) for this domain.
  * `transport`: _Function_ `function (message) {}`
      Actor used to route messages (in _transport_ format) to remote domains.
  * Return: _Object_ `domain` capabilities.
    * `name`: _String_ As specified on creation.
    * `transport`: _Function_ As specified on creation.
    * `localToRemote`: _Function_ `function (actor) {}`
        Capability to make _tokens_ from local actor references.
    * `remoteToLocal`: _Function_ `function (token) {}`
        Capability to make _proxies_ from remote actor _tokens_.
    * `bindLocal`: _Function_ `function (token, actor) {}`
        Capability to associate a _token_ with a local _actor_ reference.
    * `decode`: _Function_ `function (json) {}`
        Capability to decode messages for use within the `domain`.
    * `encode`: _Function_ `function (message) {}`
        Capability to encode messages from within the `domain`.
    * `receptionist`: _Function_ `function (message) {}`
        Capability to decode messages (in _transport_ format)
        and deliver them to actors local to the domain.

Creates a new _domain_ and returns capabilities to make _tokens_ and _proxies_. Also provides a _receptionist_, used by _transports_ to deliver remote messages.

### domain.decode(json)

  * `json`: _JSON_ JSON encoded message.
  * Return: _Any_ Message decoded for use within the `domain`.

Decodes `json`, replacing any capability references using [domain.remoteToLocal(token)](#domainremotetolocaltoken).

### domain.encode(message)

  * `message`: _Any_ Message from within the `domain` to be encoded for transport.
  * Return: _JSON_ Encoded `message` as JSON.

Encodes the `message`, replacing any functions (actor references) using [domain.localToRemote(actor)](#domainlocaltoremoteactor).

### domain.localToRemote(actor)

  * `actor`: _Function_ `function (message) {}` local actor reference.
  * Return: _String_ remote actor reference _token_.

Return a _token_ representing the local `actor`. Multiple request with the same `actor` always produce the same _token_.

### domain.remoteToLocal(token)

  * `token`: _String_ remote actor reference _token_.
  * Return: _Function_ `function (message) {}` _proxy_ capability.

Return a _proxy_ that will forward messages to the remote actor represented by the `token`. Multiple request with the same `token` always return the same _proxy_.

### domain.bindLocal(token, actor)

  * `token`: _String_ remote actor reference _token_.
  * `actor`: _Function_ `function (message) {}` local actor reference.

Associate a `token` with a local `actor`. Future calls to `domain.localToRemote` with this `actor` always return this `token`.

### domain.receptionist(message)

  * `message`: _Object_ Asynchronous message to domain _receptionist_ actor.
    * `address`: _String_ destination actor reference _token_.
    * `json`: _String_ marshal-encoded message content.

Decodes `json` using [domain.decode(json)](#domaindecodejson) and sends the result as a message to the actor designated by decoding `address` using [domain.remoteToLocal(token)](#domainremotetolocaltoken).  The original `message` encoding is called _transport_ format.
