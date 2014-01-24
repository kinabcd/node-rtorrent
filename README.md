Install:
==============
    npm install node-rtorrent-scgi

Example:
==============
    rtorrent = new ( require('node-rtorrent-scgi') )({host:'localhost',post:5000});
    rtorrent.Details(function(list) {
      console.log(list);
    });
