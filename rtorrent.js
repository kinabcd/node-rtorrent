var net = require("net")
var url = require("url")
var DOMParser = require('xmldom').DOMParser;
var xmlbuilder = require("xmlbuilder")

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
    var content = MakeSCGIXML(method, params);
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
        if (callback) callback(null, buff);
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
    this.SendCall('d.multicall',['default'].concat(fields), function(err, d) {
        var downloads = [];
        if (!d) {
            if (callback) callback(null);
            return
        }
        var dom  = new DOMParser().parseFromString(d.substring(d.indexOf('\r\n\r\n')));
        var datas = dom.getElementsByTagName('array')[0].getElementsByTagName('array');
        for ( var i = 0 ; i < datas.length ; i += 1 ) {
            var data = datas[i].getElementsByTagName('value');
            downloads[i] = {};
            downloads[i].hash = getValue( data[0] );
            downloads[i].stat = getValue( data[1] );
            downloads[i].name = getValue( data[2] );
            downloads[i].size = getValue( data[3] );
            downloads[i].upsize = getValue( data[4] );
            downloads[i].downsize = getValue( data[13] );
            downloads[i].skipsize = getValue( data[15] );
            downloads[i].uprate = getValue( data[6] );
            downloads[i].downrate = getValue( data[7] );
            downloads[i].ratio = getValue( data[5] );
            downloads[i].peers = getValue( data[8] );
            downloads[i].base_path = getValue( data[9] );
            downloads[i].date = getValue( data[10] );
            downloads[i].active = getValue( data[11] );
            downloads[i].complete = getValue( data[12] );
            downloads[i].directory = getValue( data[14] );
        }
        if (callback) callback(downloads);
    });

}

function getValue( data ) {
    if ( !data ) return '';
    if ( !data.firstChild ) return '';
    if ( !data.firstChild.firstChild ) return '';
    return data.firstChild.firstChild.nodeValue;
}

function MakeSCGIXML( method, param ) {
    var root = xmlbuilder.create('methodCall');
    var methodName = root.ele("methodName", method);
    if ( typeof param == 'string' ) param = [ param ] ;
    if ( param && param.length > 0 ) {
        var params = root.ele("params");
        for ( var i = 0 ; i < param.length ; i += 1 ) {
            var href = url.parse(param[i]).href;
            params.ele("param").ele("value", href);
        }
    }
    return root.end({pretty:false});
}
module.exports = function(option) {
    return new rtorrent(option);
}
