tart-marshal
============

Send messages between memory domains (tart module)

## Usage

To run the below example run:

    npm run readme

```javascript
"use strict";

var tart = require('tart');
var marshal = require('../index.js');

var sponsor0 = tart.minimal();
var sponsor1 = tart.minimal();

var pingBeh = function pingBeh(message) {
    if (message.value === undefined) {
        var pong = message.pong;
        pong({ ping:this.self, pong:pong, value:0 });
    } else {
        console.log('ping', message.value);
    }
};

var pongBeh = function pongBeh(message) {
    var ping = message.ping;
    ping({ ping:ping, pong:this.self, value:1 });
    console.log('pong', message.value);
};

var ping = sponsor0(pingBeh);
var pong = sponsor1(pongBeh);

var proxyCaps = marshal.proxy(pong);
var pongProxy = sponsor0(proxyCaps.proxyBeh);
var pongStub = sponsor1(proxyCaps.stubBeh);

ping({ pong:pongProxy });

```

## Tests

    npm test