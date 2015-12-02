var net = require("net")
var url = require("url")
var xmlrpc = require('./lib/xmlrpc')

var rtorrent = function(option) {
    option.debug = (option.debug || false)
    this.option = option;
}
rtorrent.prototype.SendCall = function(method, params, callback) {
    var option = this.option
    if ( ! callback && typeof params == 'function' ) {
        callback = params;
        params = null;
    }
    var content = xmlrpc.build(method, params);
    var headers = {
        "CONTENT_LENGTH":content.length,
        'SCGI':1,
        'REQUEST_METHOD':'POST',
        'REQUEST_URI':'/'
    };
    var header = "";
    for (var key in headers)
        header += key + String.fromCharCode(0) + headers[key] + String.fromCharCode(0)
    if (option.debug) {
        console.log('-- Request(header:' + header.length + ', content:' + content.length + ') --');
        console.log(header);
        console.log(content);
        console.log('-- Request End --');
    }
    // Start SCGI
    var conn = net.connect(this.option);
    var buff = "";
    conn.on('data',function(data) {
        buff += data;
    });
    conn.on('end',function() {
        if (option.debug) {
            console.log('-- Response --');
            console.log(buff)
            console.log('-- Response End --');
        }
        var body = buff.substring(buff.indexOf('\r\n\r\n'));
        var dom = xmlrpc.parse(body);
        if (callback) callback(null, dom);
    });
    conn.on('error', function(err) {
        if (option.debug) console.log(err)
        if (callback) callback(err, null);
    })
    conn.write(header.length.toString(10))
    conn.write(':');
    conn.write(header);
    conn.write(',');
    conn.write(content);
    conn.end()
}
rtorrent.prototype.Load = function(file, start){
    if (!(/^magnet:/.test(file) || /^http:/.test(file) || /^https:/.test(file))) return;
    var command = 'load';
    if (start) command = 'load_start';
    this.SendCall(command, file);
}
rtorrent.prototype.Start = function(hash){
    this.SendCall('d.start', hash);
}
rtorrent.prototype.Pause = function(hash){
    this.SendCall('d.stop', hash);
}
rtorrent.prototype.Details = function(callback) {
    fields = require('./fields/torrent.json');
    rtfields = []

    for (var j = 0 ; j < fields.length ; j += 1)
        rtfields.push(fields[j].rt);
    this.SendCall('d.multicall',['default'].concat(rtfields), function(err, dom) {
        var torrents = [];
        if (!dom) {
            if (callback) callback(null);
            return
        }
        var datas = dom[0]
        for ( var i = 0 ; i < datas.length ; i += 1 ) {
            var data = datas[i];
            var torrent = {}
            for (var j = 0 ; j < fields.length ; j += 1)
                torrent[fields[j].key] = data[j];
            torrents.push(torrent);
        }
        if (callback) callback(torrents);
    });

}

module.exports = function(option) {
    return new rtorrent(option);
}
