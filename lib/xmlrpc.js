var DOMParser = require('xmldom').DOMParser;
var url = require('url');
function build( method, params ) {
    params = params || []
    if ( !Array.isArray(params) ) params = [params] ;
    var template = '<?xml version="1.0"?><methodCall><methodName/><params/></methodCall>'
    var doc = new DOMParser().parseFromString(template);
    var dom_methodName = doc.getElementsByTagName('methodName')[0]
    var dom_params = doc.getElementsByTagName('params')[0]
    dom_methodName.appendChild(doc.createTextNode(method))
    for ( var i = 0 ; i < params.length ; i += 1 ) {
        var dom_param = doc.createElement('param');
        buildMethod['value'](dom_param, params[i])
        dom_params.appendChild(dom_param)
    }
    return doc.toString();
}
var buildMethod = {
    'value':function(parentDom, value) {
        var doc = parentDom.ownerDocument;
        var dom = doc.createElement('value');
        if (typeof value == 'string') buildMethod['string'](dom, value);
        else if (typeof value == 'number') buildMethod['number'](dom, value);
        else if (Array.isArray(value)) buildMethod['array'](dom, value);
        else if (value instanceof Date) buildMethod['date'](dom, value);
        else if (typeof value == 'object') buildMethod['object'](dom, value);
        // TODO base64
        parentDom.appendChild(dom)
    },
    'string':function(parentDom, value) {
        var href = url.parse(value).href;
        var doc = parentDom.ownerDocument;
        var dom = doc.createElement('string');
        dom.appendChild(doc.createTextNode(href));
        parentDom.appendChild(dom)
    },
    'number':function(parentDom, value) {
        var number = value.toString();
        var doc = parentDom.ownerDocument;
        var dom = doc.createElement(/[-+]?\d+\.\d+/.test(number)?'double':'int');
        dom.appendChild(doc.createTextNode(value));
        parentDom.appendChild(dom)
    },
    'array':function(parentDom, value) {
        var doc = parentDom.ownerDocument;
        var dom = doc.createElement('array');
        var data = doc.createElement('data');
        for ( var i = 0 ; i < value.length ; i += 1 )
            buildMethod['value'](data, value[i]);
        dom.appendChild(data);
        parentDom.appendChild(dom);
    },
    'object':function(parentDom, value) {
        var doc = parentDom.ownerDocument;
        var dom = doc.createElement('struct');
        for (var key in value) {
            var dom_member = doc.createElement('member');
            var dom_name = doc.createElement('name');
            dom_name.appendChild(doc.createTextNode(key));
            dom_member.appendChild(dom_name);
            buildMethod['value'](dom_member, value[key]);
            dom.appendChild(dom_member);
        }
        parentDom.appendChild(dom);
    },
    'date':function(parentDom, value) {
        var doc = parentDom.ownerDocument;
        var dom = doc.createElement('date.iso8601');
        dom.appendChild(doc.createTextNode(value.toJSON().replace(/(-|\.\d+Z)/g,'')))
        parentDom.appendChild(dom);
    }


}

function parse(xml) {
    var root = new DOMParser().parseFromString(xml);
    if (!root) return null;
    var dom = root.lastChild;
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
            var child = childs[i];
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
            if (child.nodeName === 'name') name = child.firstChild.nodeValue
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

