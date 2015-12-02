var DOMParser = require('xmldom').DOMParser;
var xmlbuilder = require("xmlbuilder")
function build( method, param ) {
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

function parse(xml) {
    var dom = new DOMParser().parseFromString(xml).lastChild;
    return parseMethod[dom.nodeName](dom);
}

function cleanTextChild(dom) {
    if (!dom.hasChildNodes()) return dom;
    var childs = dom.childNodes;
    var textChild = [];
    for (var i = 0 ; i < childs.length ; i += 1) {
        var child = childs[i];
        if ( child.nodeName == '#text' )
            textChild.push(child)
    }
    for ( var i = 0 ; i < textChild.length ; i += 1)
        dom.removeChild(textChild[i])
    return dom;
}
var parseMethod = {
    'auto':function(dom) {
        if (!(dom.nodeName in parseMethod)) {
            throw Error('parseMethod["' +dom.nodeName + '"] parse fail');
        } else {
            return parseMethod[dom.nodeName](dom);
        }
    },
    'methodResponse':function(dom) {
        var child = cleanTextChild(dom).firstChild;
        return parseMethod['auto'](child);
    },
    'fault':function(dom) {
        var child = cleanTextChild(dom).firstChild;
        return {"fault":parseMethod['auto'](child)}
    },
    'value':function(dom) {
        var child = cleanTextChild(dom).firstChild;
        return parseMethod['auto'](child);
    },
    'struct':function(dom) {
        var childs = cleanTextChild(dom).childNodes;
        var res = {}
        for ( var i = 0 ; i < childs.length ; i += 1) {
            var member = parseMethod['auto'](child);
            for ( var key in member ) {
                res[key] = member[key];
            }
        }
        return res;
    },
    'member':function(dom) {
        var name = '';
        var value = '';
        var childs = cleanTextChild(dom).childNodes;
        for ( var i = 0 ; i < childs.length ; i += 1) {
            var child = childs[i];
            if (child.nodeName === 'name') name = child.nodeValue
            if (child.nodeName === 'value') value = parseMethod['auto'](child)
        }
        var res = {};
        res[name] = value;
        return res;
    },
    'params':function(dom) {
        var childs = cleanTextChild(dom).childNodes;
        var res = []
        for ( var i = 0 ; i < childs.length ; i += 1) {
            var child = childs[i];
            res.push(parseMethod['auto'](child));
        }
        return res;
    },
    'param':function(dom) {
        var child = cleanTextChild(dom).firstChild;
        return parseMethod['auto'](child);
    },
    'array':function(dom) {
        var child = cleanTextChild(dom).firstChild;
        return parseMethod['data'](child);
    },
    'data':function(dom) {
        var childs = cleanTextChild(dom).childNodes;
        var res = []
        for ( var i = 0 ; i < childs.length ; i += 1) {
            var child = childs[i];
            res.push(parseMethod['auto'](child));
        }
        return res;
    },
    'string':function(dom) {
        return dom.firstChild.nodeValue;
    },
    'int':function(dom) {
        return parseInt(dom.firstChild.nodeValue);
    },
    'i4': function(dom) {
        return parseMethod['int'](dom);
    },
    'i8': function(dom) {
        return parseMethod['int'](dom);
    },
    'boolean':function(dom) {
        return parseInt(dom.firstChild.nodeValue) != 0;
    },
    'double':function(dom) {
        return parseFloat(dom.firstChild.nodeValue);
    },
    'base64':function(dom) {
        return new Buffer(dom.firstChild.nodeValue, 'base64').toString()
    },
    'dateTime.iso8601':function(dom) {
        var str = dom.firstChild.nodeValue;
        var year = parseInt(str.substring(0,4));
        var month = parseInt(str.substring(4,6));
        var day = parseInt(str.substring(6,8));
        var time = str.substring(9).split(":");
        var hour = parseInt(time[0]);
        var min = parseInt(time[1]);
        var sec = parseInt(time[2]);

        return new Date(year,month,day,hour,min,sec,0);
    }
}
module.exports.build = build
module.exports.parse = parse
module.exports.parseMethod = parseMethod

