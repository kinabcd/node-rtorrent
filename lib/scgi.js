var net = require('net')

function request(option, content, callback) {
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
    var conn = net.connect(option);
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
        if (callback) callback(null, body);
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

module.exports.request = request
