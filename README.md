Example:
==============
    rtorrent = new ( require('rtorrent') )({host:'localhost',post:5000});
    rtorrent.Details(function(list) {
      console.log(list);
    });
