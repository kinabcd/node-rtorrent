var net = require("net")
var url = require("url")
var DOMParser = new (require('xmldom').DOMParser);
var scgi = require("scgi-stream")
var xmlbuilder = require("xmlbuilder")
module.exports = function(option) {
  this.host = option['host'] || "127.0.0.1"
  this.port = option['port'] || 5000
  this.path = option['path'] || "/"
  this.MakeSCGIXML = function( method, param ) {
    var root = xmlbuilder.create('methodCall')
    var methodName = root.ele("methodName", method)
    if ( typeof param == 'string' ) param = [ param ] ;
    if ( param && param.length > 0 ) {
      var params = root.ele("params")
      for ( var i = 0 ; i < param.length ; i += 1 ) {
        var href = url.parse(param[i]).href
        params.ele("param").ele("value", href)
      }
    }
    return root.end({pretty:false})
  }
  this.SendCall = function( method, params, callback ) {
    if ( ! callback && typeof params == 'function' ) {
      callback = params;
      params = null;
    }
    content = this.MakeSCGIXML(method, params)
    // Start SCGI
    var req = scgi.request(this)
    req.on("response", function(res) {
      var buff = "";
      res.on('data',function(data ) {
        buff += data;
      });
      res.on('end',function( ) {
        if ( callback ) callback( buff );
      });
    })
    req.end(content)
  };
  this.Load = function( file, start ){
    if ( !(/^magnet:/.test(file) || /^http:/.test(file) || /^https:/.test(file)) ) return;
    var command = 'load';
    if ( start ) command = 'load_start';
    this.SendCall( command, file );
  }
  this.Start = function( hash ){
    this.SendCall( 'd.start', hash );
  }
  this.Pause = function( hash ){
    this.SendCall( 'd.stop', hash );
  }
  this.Details = function( callback ) {
    fields = require('./fields/torrent.json')
    this.SendCall('d.multicall',['default'].concat(fields), function(d){
      var downloads = [];
      var dom  = DOMParser.parseFromString(d.substring(d.indexOf('\r\n\r\n')));
      var datas = dom.getElementsByTagName('array')[0].getElementsByTagName('array');
      for ( var i = 0 ; i < datas.length ; i += 1 ) {
        var data = datas[i].getElementsByTagName('value')
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
      if ( callback ) callback( downloads );
    });
    
  }

}
function getValue( data ) {
  if ( !data ) return '';
  if ( !data.firstChild ) return '';
  if ( !data.firstChild.firstChild ) return '';
  return data.firstChild.firstChild.nodeValue;
}

var fields = {
  peers : ['p.get_address=', 'p.get_client_version=', 'p.get_completed_percent=', 'p.get_down_rate=', 'p.get_down_total=', 'p.get_id=', 'p.get_port=', 'p.get_up_rate=', 'p.get_up_total='],
  tracker : ["t.get_group=", "t.get_id=", "t.get_min_interval=", "t.get_normal_interval=", "t.get_scrape_complete=", "t.get_scrape_downloaded=", "t.get_scrape_time_last=", "t.get_type=", "t.get_url=", "t.is_enabled=", "t.is_open=", "t.get_scrape_incomplete="],
  system : ["get_bind", "get_check_hash", "get_dht_port", "get_directory", "get_download_rate", "get_hash_interval", "get_hash_max_tries", "get_hash_read_ahead", "get_http_cacert", "get_http_capath", "get_http_proxy", "get_ip", "get_max_downloads_div", "get_max_downloads_global", "get_max_file_size", "get_max_memory_usage", "get_max_open_files", "get_max_open_http", "get_max_peers", "get_max_peers_seed", "get_max_uploads", "get_max_uploads_global", "get_min_peers_seed", "get_min_peers", "get_peer_exchange", "get_port_open", "get_upload_rate", "get_port_random", "get_port_range", "get_preload_min_size", "get_preload_required_rate", "get_preload_type", "get_proxy_address", "get_receive_buffer_size", "get_safe_sync", "get_scgi_dont_route", "get_send_buffer_size", "get_session", "get_session_lock", "get_session_on_completion", "get_split_file_size", "get_split_suffix", "get_timeout_safe_sync", "get_timeout_sync", "get_tracker_numwant", "get_use_udp_trackers", "get_max_uploads_div", "get_max_open_sockets"],
  files : ["f.get_completed_chunks=", "f.get_frozen_path=", "f.is_created=", "f.is_open=", "f.get_last_touched=", "f.get_match_depth_next=", "f.get_match_depth_prev=", "f.get_offset=", "f.get_path=", "f.get_path_components=", "f.get_path_depth=", "f.get_priority=", "f.get_range_first=", "f.get_range_second=", "f.get_size_bytes=", "f.get_size_chunks="]
};
