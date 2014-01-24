var net = require("net")
var DOMParser = new (require('xmldom').DOMParser);
module.exports = function(option) {
  this.host = option['host'] || "127.0.0.1";
  this.port = option['port'] || 5000;
  this.SendCall = function( method, param, callback ) {
    if ( ! callback && typeof param == 'function' ) {
      callback = param;
      param = null;
    }
    var content = "<methodCall>"
    content += "<methodName>" + method + "</methodName>"
    if ( param ) {
      if ( typeof param == 'string' ) param = [ param ] ;
      if ( param.length > 0 ) {
        content += "<params>";
        for ( var i = 0 ; i < param.length ; i += 1 )
          content += "<param><value>" + htmlspecialchars(param[i]) + "</value></param>";
        content += "</params>"
      }
    }
    content += "</methodCall>"
    var head = new Array();
    head[0] = "CONTENT_LENGTH"+String.fromCharCode(0)+ content.length + String.fromCharCode(0);
    head[1] = "SCGI"+String.fromCharCode(0)+"1" + String.fromCharCode(0);
    var length = 0;
    for( var i = 0 ; i < head.length ; i += 1 )
      length += head[i].length;
    var stream = new net.Stream();
    stream.setEncoding("UTF8");
    stream.connect( this.port, this.host );
    stream.write( length + ":" );
    for ( var i = 0 ; i < head.length ; i += 1 )
      stream.write( head[i] );
    stream.write( "," );
    stream.write( content ) ;
    var buff = "";
    stream.on('data',function(data ) {
      buff += data;
    });
    stream.on('end',function( ) {
      if ( callback ) callback( buff );
    });
  };
  this.Load = function( file, start ){
    if ( /^magnet:/.test(file) || /^http:/.test(file) || /^https:/.test(file) ) return;
    var command = 'load';
    if ( start ) command = 'load_start';
    console.info( command, file );
    this.SendCall( command, file );
  }
  this.Start = function( hash ){
    this.SendCall( 'd.start', hash );
  }
  this.Pause = function( hash ){
    this.SendCall( 'd.stop', hash );
  }
  this.Details = function( callback ) {
    this.SendCall('d.multicall',['default'].concat(fields.torrents), function(d){
      var downloads = [];
      var dom  = DOMParser.parseFromString(d.substring(d.indexOf('\r\n\r\n')));
      var datas = dom.getElementsByTagName('array')[0].childNodes;
      for ( var i = 0 ; i < datas.length ; i += 1 ) {
        var data = datas[i].getElementsByTagName('array')[0].firstChild.getElementsByTagName('value')
        downloads[i] = {};
        downloads[i].hash = data[0].firstChild.firstChild.nodeValue;
        downloads[i].stat = data[1].firstChild.firstChild.nodeValue;
        downloads[i].name = data[2].firstChild.firstChild.nodeValue;
        downloads[i].size = data[3].firstChild.firstChild.nodeValue;
        downloads[i].upsize = data[4].firstChild.firstChild.nodeValue;
        downloads[i].downsize = data[13].firstChild.firstChild.nodeValue;
        downloads[i].skipsize = data[15].firstChild.firstChild.nodeValue;
        downloads[i].uprate = data[6].firstChild.firstChild.nodeValue;
        downloads[i].downrate = data[7].firstChild.firstChild.nodeValue;
        downloads[i].ratio = data[5].firstChild.firstChild.nodeValue;
        downloads[i].peers = data[8].firstChild.firstChild.nodeValue;
        downloads[i].base_path = data[9].firstChild.firstChild.nodeValue;
        downloads[i].date = data[10].firstChild.firstChild.nodeValue;
        downloads[i].active = data[11].firstChild.firstChild.nodeValue;
        downloads[i].complete = data[12].firstChild.firstChild.nodeValue;
        downloads[i].directory = data[14].firstChild.firstChild.nodeValue;
      }
      if ( callback ) callback( downloads );
    });
    
  }

}
function htmlspecialchars( str ) {
  return str.replace(/\&/ig,"&amp;").replace(/\"/ig,"&quot;").replace(/\'/ig,"&#039;").replace(/\</ig,"&lt;").replace(/\>/ig,"&gt;");
}
var fields = {
  peers : ['p.get_address=', 'p.get_client_version=', 'p.get_completed_percent=', 'p.get_down_rate=', 'p.get_down_total=', 'p.get_id=', 'p.get_port=', 'p.get_up_rate=', 'p.get_up_total='],
  tracker : ["t.get_group=", "t.get_id=", "t.get_min_interval=", "t.get_normal_interval=", "t.get_scrape_complete=", "t.get_scrape_downloaded=", "t.get_scrape_time_last=", "t.get_type=", "t.get_url=", "t.is_enabled=", "t.is_open=", "t.get_scrape_incomplete="],
  system : ["get_bind", "get_check_hash", "get_dht_port", "get_directory", "get_download_rate", "get_hash_interval", "get_hash_max_tries", "get_hash_read_ahead", "get_http_cacert", "get_http_capath", "get_http_proxy", "get_ip", "get_max_downloads_div", "get_max_downloads_global", "get_max_file_size", "get_max_memory_usage", "get_max_open_files", "get_max_open_http", "get_max_peers", "get_max_peers_seed", "get_max_uploads", "get_max_uploads_global", "get_min_peers_seed", "get_min_peers", "get_peer_exchange", "get_port_open", "get_upload_rate", "get_port_random", "get_port_range", "get_preload_min_size", "get_preload_required_rate", "get_preload_type", "get_proxy_address", "get_receive_buffer_size", "get_safe_sync", "get_scgi_dont_route", "get_send_buffer_size", "get_session", "get_session_lock", "get_session_on_completion", "get_split_file_size", "get_split_suffix", "get_timeout_safe_sync", "get_timeout_sync", "get_tracker_numwant", "get_use_udp_trackers", "get_max_uploads_div", "get_max_open_sockets"],
  torrents : ["d.get_hash=", "d.get_state=", "d.get_name=", "d.get_size_bytes=", "d.get_up_total=", "d.get_ratio=", "d.get_up_rate=", "d.get_down_rate=", "d.get_peers_accounted=", "d.get_base_path=", "d.get_creation_date=", 'd.is_active=', "d.complete=", "d.get_down_total=", "d.get_directory=", "d.get_skip_total="],
  files : ["f.get_completed_chunks=", "f.get_frozen_path=", "f.is_created=", "f.is_open=", "f.get_last_touched=", "f.get_match_depth_next=", "f.get_match_depth_prev=", "f.get_offset=", "f.get_path=", "f.get_path_components=", "f.get_path_depth=", "f.get_priority=", "f.get_range_first=", "f.get_range_second=", "f.get_size_bytes=", "f.get_size_chunks="]
};
