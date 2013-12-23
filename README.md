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

var domain0 = marshal.domain('zero', sponsor0);
var domain1 = marshal.domain('one', sponsor1);

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

var pingRemote = domain0.localToRemote(ping);
console.log('pingRemote:', pingRemote);
var pongRemote = domain1.localToRemote(pong);
console.log('pongRemote:', pongRemote);

domain1.remoteSend(pingRemote, { pong:pong });

```

## Tests

    npm test