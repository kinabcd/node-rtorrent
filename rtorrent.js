var scgi = require('./lib/scgi')
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
    scgi.request(option, content, function(err, body){
        if (!callback) return;
        var dom = xmlrpc.parse(body); 
        callback(err, dom);
    });
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
