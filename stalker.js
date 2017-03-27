

var http = require('showtime/http');
var fs = require('showtime/fs');
var url = 'http://192.168.110.133:88';
//var url = 'http://mag.iformula.ru';
//var url = 'http://mag.iptv.so';
//var url = 'http://dgold.noip.me';
var server_url = '/stalker_portal';
var	load = '/server/load.php';
var refer = '/c/';
var user_agent  = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 1812 Mobile Safari/533.3';
var timezone = 'America%2FChicago';
//var mac = 'c4:34:6b:49:7f:a8';
//var mac = '00:1A:79:59:70:a8';
var mac = '00:1A:79:f5:75:d2';
//var mac = 'c4:34:6b:49:7f:a7';
var token;
var global_responseData;

(function(plugin) {
    var PLUGIN_PREFIX = "stalker:";
    var responseData;
    var cfg_data = JSON.parse(fs.readFileSync("/home/gx/plugincfg/stalker.cfg"));
    for(var i in cfg_data)
    {
        if(cfg_data[i].status == "enable")
        {
            url = "http://" + cfg_data[i].url;
            mac = cfg_data[i].mac;
            break;
        }
    }
    print(url);
    var service = plugin.createService("stalker", PLUGIN_PREFIX+"start", "video", true, plugin.path + "stalker.png");

    plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
        page.type = "directory";

       // fs.writeFileSync("/media/sda1/test.txt", "hello\n", null);
 //       print(fs.readFileSync("/media/sda1/test.txt"));
        token = handshake();
        responseData = get_genres(token);
        global_responseData = get_all_channels(token);
        responseData = responseData.js;
        for(var i in responseData)
        {
            page.appendItem(PLUGIN_PREFIX + 'id:' + responseData[i].id + ':alias:' + responseData[i].alias, 'directory',{title: responseData[i].title,ext_id:"hello, i`am extra data" });
        }
        page.loading = false;

    });

    plugin.addURI(PLUGIN_PREFIX+"id:(.*):alias:(.*)", function(page, id, alias) {
        for(var i in global_responseData)
        {
            if(global_responseData[i].tv_genre_id == id || alias.toLowerCase() == 'all')
                page.appendItem(PLUGIN_PREFIX + 'playcmd:' + global_responseData[i].cmd, 'video',{title: global_responseData[i].name, icon: url + '/stalker_portal/misc/logos/320/' + global_responseData[i].logo});
        }
    });

    plugin.addURI(PLUGIN_PREFIX+"playcmd:(.*)", function(page, cmd) {
        var url;
        if(cmd.substring(0, 7) == "http://")
            url = cmd;
        else
        {
            token = handshake();
            var s = creat_link(token,cmd).split(' ');
            url = s[0];
            if(s.length > 1)
                    url = s[1];
        }

        var videoParams = {
        sources: [{
                url: url,
          }],
        no_subtitle_scan: true,
        subtitles: []
        }
        page.source = 'videoparams:' + JSON.stringify(videoParams);
    });

})(this);

function handshake(){
    var postdata = 'action=handshake&type=stb&JsHttpRequest=1-xml';
    var responseText = http.request(url + server_url + load, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Referer' : url + server_url + refer,
			    'Accept' : '*/*',
			    'Connection' : 'close',
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
                'Accept-Encoding': 'identity',
                'Content-Length': postdata.length,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            postdata: postdata
        }).toString();
    var token = JSON.parse(responseText).js.token;
    get_profile(token);
    return token;
}

function get_profile(token){
    var postdata = 'stb_type=MAG254&num_banks=1&JsHttpRequest=1-xml&hw_version=2.6-IB-00&hd=1&not_valid_token=0&image_version=218&ver=ImageDescription%3A%25200.2.18-r11-pub-254%3B%2520ImageDate%3A%2520Wed%2520Mar%252018%252018%3A09%3A40%2520EET%25202015%3B%2520PORTAL%2520version%3A%25204.9.14%3B%2520API%2520Version%3A%2520JS%2520API%2520version%3A%2520331%3B%2520STB%2520API%2520version%3A%2520141%3B%2520Player%2520Engine%2520version%3A%25200x572&auth_second_step=0&action=get_profile&type=stb';
    var responseText = http.request(url + server_url + load, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Referer' : url + server_url + refer,
			    'Accept' : '*/*',
			    'Connection' : 'close',
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
                'Accept-Encoding': 'identity',
                'Content-Length': postdata.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : 'Bearer ' + token,
            },
            postdata: postdata

        }).toString();
    //print(responseText);
    return JSON.parse(responseText);
}

function get_genres(token){
    var postdata = 'action=get_genres&type=itv&JsHttpRequest=1-xml';
    var responseText = http.request(url + server_url + load, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Referer' : url + server_url + refer,
			    'Accept' : '*/*',
			    'Connection' : 'close',
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
                'Accept-Encoding': 'identity',
                'Content-Length': postdata.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : 'Bearer ' + token,
            },
            postdata: postdata

        }).toString();
    //print(responseText);
    return JSON.parse(responseText);
}

function get_all_channels(token){
    var postdata = 'action=get_all_channels&type=itv&JsHttpRequest=1-xml';
    var responseText = http.request(url + server_url + load, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Referer' : url + server_url + refer,
			    'Accept' : '*/*',
			    'Connection' : 'close',
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
                'Accept-Encoding': 'identity',
                'Content-Length': postdata.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : 'Bearer ' + token,
            },
            postdata: postdata

        }).toString();
    //print(responseText);
    return JSON.parse(responseText).js.data;
}

function get_group_list(token){
    var postdata = 'p=2&fav=0&genre=10&JsHttpRequest=1-xml&action=get_ordered_list&type=itv';
    var responseText = http.request(url + server_url + load, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Referer' : url + server_url + refer,
			    'Accept' : '*/*',
			    'Connection' : 'close',
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
                'Accept-Encoding': 'identity',
                'Content-Length': postdata.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : 'Bearer ' + token,
            },
            postdata: postdata

        }).toString();
    return JSON.parse(responseText);
}

function creat_link(token,cmd){
    var postdata = 'type=itv&action=create_link&cmd=' + cmd +'&series=&forced_storage=&disable_ad=0&JsHttpRequest=1-xml';
    print(postdata);
    var responseText = http.request(url + server_url + load, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Referer' : url + server_url + refer,
			    'Accept' : '*/*',
			    'Connection' : 'close',
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
                'Accept-Encoding': 'identity',
                'Content-Length': postdata.length,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization' : 'Bearer ' + token,
            },
            postdata: postdata

        }).toString();
    print(responseText);
    return JSON.parse(responseText).js.cmd;
}
