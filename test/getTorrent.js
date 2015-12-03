rtorrent = require("../rtorrent")
rclient = rtorrent({port:5000})
rclient.Details(function(list) {
    console.log(list)
})
