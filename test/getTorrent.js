rtorrent = require("../rtorrent")
rclient = new rtorrent({})
rclient.Details(function(list) {
  console.log(list)
})
