xmlrpc = require("../lib/xmlrpc")
var objraw1 = ['default', "d.get_hash=", "d.get_state=", "d.get_name=", "d.get_size_bytes=", "d.get_up_total=", "d.get_ratio=", "d.get_up_rate=", "d.get_down_rate=", "d.get_peers_accounted=", "d.get_base_path=", "d.get_creation_date=", 'd.is_active=', "d.complete=", "d.ge    t_down_total=", "d.get_directory=", "d.get_skip_total="]
var objraw2 = [{a:[1,-2], 'b':new Date(), 'c':[-3.3, 4.4], 'd':{'e':'5'}}]
var xml1 = xmlrpc.build('d.multicall',objraw1)
var xml2 = xmlrpc.build('d.empty')
var xml3 = xmlrpc.build('d.name', objraw2)
console.log(xml1)
console.log(xml2)
console.log(xml3)


