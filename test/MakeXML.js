rtorrent = require("../rtorrent")
rclient = new rtorrent({})
var xml = rclient.MakeSCGIXML('d.multicall',['default'].concat(["d.get_hash=", "d.get_state=", "d.get_name=", "d.get_size_bytes=", "d.get_up_total=", "d.get_ratio=", "d.get_up_rate=", "d.get_down_rate=", "d.get_peers_accounted=", "d.get_base_path=", "d.get_creation_date=", 'd.is_active=', "d.complete=", "d.ge    t_down_total=", "d.get_directory=", "d.get_skip_total="]))
console.log(xml)
var xml2 = rclient.MakeSCGIXML('d.empty')
console.log(xml2)

