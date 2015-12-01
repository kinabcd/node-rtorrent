node-rtorrent

Installation
==============

Available via [npm](http://npmjs.org/):

> $ npm install node-rtorrent-scgi

Or via git:

> $ git clone git://github.com/kinabcd/node-rtorrent.git node_modules/node-rtorrent-scgi

API
==============
**Connection**

Connect rTorrent with TCP/IP:

```javascript
conn = rtorrent({host:'localhost', port:5000});
```

Connect rTorrent with Socket:

```javascript
conn = rtorrent({path:'/tmp/torrent.sock'});
```

**SendCall**
Makes a request. Return the raw response from rTorrent.

```javascript
conn.SendCall(methodName, params, function(err, xmlString) {
    // Do something...
});
```

**Details**
get the list of torrents.

```javascript
conn.Details(function(list) {
    console.log(list);
});
```

Example
==============
```javascript
rtorrent = require('node-rtorrent-scgi');
conn = rtorrent({host:'localhost', port:5000});
conn.Details(function(list) {
    console.log(list);
});
```

License
==============
[GNU Lesser General Public License v3](https://www.gnu.org/licenses/lgpl.html)


