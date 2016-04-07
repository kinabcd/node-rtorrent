var scgi = require('./lib/scgi')
var xmlrpc = require('./lib/xmlrpc')
var config = require('./config.json')

var rtorrent = function(option) {
    option.host = (option.host || config.host || null);
    option.port = (option.port || config.port || null);
    option.path = (option.path || config.path || null);
    option.debug = (option.debug || config.debug || false);
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
function cliCommand(args, next) {
    var option = {};
    var files = [];
    var method = 'load';

    for (var i = 0 ; i < args.length ; i += 1) {
        var arg = args[i];
        if (arg == '-c') {
            var ip_port = /(\d+\.\d+\.\d+\.\d+):(\d+)/.exec(args[i+1]);
            if (ip_port) {
                option.host = ip_port[1];
                option.port = ip_port[2];
            } else {
                option.path = args[i+1];
            }
            i += 1;
        } else if (arg == 'list') {
            method = 'list';
        } else if (/^(https:|http:|magnet:)/.exec(arg)){
            files.push(args[i]);
        }

    }
    var rt = new rtorrent(option);
    if (method == 'load') {
        for (var i in files )
            rt.Load(files[i], true);
        next();
    } else if (method == 'list') {
        rt.Details(function(data) {
            console.log(data);
            next();
        });
    } else {
        next();
    }

}
if (require.main === module) {
    console.log('node-rtorrent cli');
    var args = process.argv.slice(2);
    if (args.length > 0) {
        cliCommand(args);
    } else {
        var readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.setPrompt('> ');
        rl.prompt();
        rl.on('line', (arg) => {
            var args = arg.split(' ');
            cliCommand(args, () => {
                rl.prompt();
            });
        });
        rl.on('close', () => {
            process.exit(0);
        })


    }
}


