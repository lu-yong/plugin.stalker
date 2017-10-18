

var http = require('showtime/http');
var fs = require('showtime/fs');
var url = ' ';
var	load_url = '';
var	load_url1 = '/portal.php';
var	load_url2 = '/stalker_portal/server/load.php';
var refer = '/c/';
var user_agent  = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 1812 Mobile Safari/533.3';
var timezone = 'Europe%2FUzhgorod';
var ver_str = '&ver=ImageDescription:%200.2.18-r11-250;%20ImageDate:%20Wed%20Mar%2018%2017:54:59%20EET%202015;%20PORTAL%20version:%204.9.22;%20API%20Version:%20JS%20API%20version:%20331;%20STB%20API%20version:%20141;%20Player%20Engine%20version:%200x572';
var mac = '00:1A:79:f5:75:d2';
var mac_id = '001A79f575d2';
var token;
var global_responseData;
var global_get_ok;
var server_type = 0;

(function(plugin) {
    var PLUGIN_PREFIX = "stalker:";
    var responseData;
    var cfg_data = JSON.parse(fs.readFileSync("/home/gx/plugincfg/stalker.cfg"));
    for(var i in cfg_data)
    {
        if(cfg_data[i].status == "enable")
        {
            if(cfg_data[i].url.substring(0, 7) == "http://")
                url = cfg_data[i].url;
            else
                url = "http://" + cfg_data[i].url;
            mac = cfg_data[i].mac;
            mac_id = mac.replace(/\:+/g,"");
            break;
        }
    }
    print(url);
    var service = plugin.createService("stalker", PLUGIN_PREFIX+"start", "video", true, plugin.path + "stalker.png");

    plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
        page.type = "directory";

        token = handshake();
        responseData = get_genres(token);
        responseData = responseData.js;
        for(var i in responseData)
        {
            page.appendItem(PLUGIN_PREFIX + 'id:' + responseData[i].id + ':alias:' + responseData[i].alias, 'directory',{title: responseData[i].title,extra_data:"hello, i`am extra data" });
        }
        global_get_ok = 0;
        page.loading = false;

    });

    plugin.addURI(PLUGIN_PREFIX+"id:(.*):alias:(.*)", function(page, id, alias) {
        var offset = 0;
        var j = 0;
        var total = 0;
        page.entries = 0;
        if(global_get_ok == 0)
        {
            global_get_ok = 1;
            global_responseData = get_all_channels(token);
        }

        for(var i in global_responseData)
        {
            if(global_responseData[i].tv_genre_id == id || alias.toLowerCase() == 'all')
            {
                total++;
            }
        }

        function loader() {
            j = 0;
        for(var i in global_responseData)
        {
            if(global_responseData[i].tv_genre_id == id || alias.toLowerCase() == 'all')
            {
                j++;
                if(j <= offset)
                    continue;
                if(j > offset +50)
                    break;
				if(global_responseData[i].logo)
				{
					if(global_responseData[i].logo.substring(0,4) == "http")
						icon_url = global_responseData[i].logo;
					else
						icon_url = url + '/stalker_portal/misc/logos/320/' + global_responseData[i].logo;
				}
				else
				{
					icon_url = '';
				}
                page.appendItem(PLUGIN_PREFIX + 'playcmd:' + global_responseData[i].cmd, 'video',{title: global_responseData[i].name, icon: icon_url,extra_data:"total:"+total});
            }
        }
        offset +=50;
        print("offset:"+offset+"page.entries:"+page.entries);
        }
        loader();
        page.paginator = loader;

    });

    plugin.addURI(PLUGIN_PREFIX+"playcmd:(.*)", function(page, cmd) {
        var url;
        print(cmd);
        if(cmd.substring(0, 4) == "http")
            url = cmd;
        else if(cmd.substring(0, 6) == "ffmpeg") //&& cmd.substring(7, 11) == "http")
        {
            url = cmd.split(' ')[1];
        }
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

function handshake1(){
	//print('handshake1');
	var responseText = '';
    var param = '?type=stb&action=handshake&JsHttpRequest=1-xml';
	try{
        var responseText = showtime.httpReq(url + load_url1 + param, {
                headers: {
			        'User-Agent' : user_agent,
			        'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			        'Connection' : 'Keep-Alive',
			        'X-User-Agent' : 'MAG250; Link: Ethernet',
			        'Host': 'p4.iptvprivateserver.tv',
                },
            }).toString();
        if(responseText.length>10)
        {
            //print("handshake1:" + responseText);
		    load_url = load_url1;
		    server_type = 1;
        }
    }catch(error){
        print('handshake1 failed');
    }
    return responseText;
}

function handshake2(){
	//print('handshake2');
	var responseText = '';
    var param = '?type=stb&action=handshake&JsHttpRequest=1-xml';
	try{
        var responseText = showtime.httpReq(url + load_url2 + param, {
                headers: {
			        'User-Agent' : user_agent,
			        'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			        'Connection' : 'Keep-Alive',
			        'X-User-Agent' : 'MAG250; Link: Ethernet',
			        'Host': 'p4.iptvprivateserver.tv',
                },
            }).toString();
        if(responseText.length>10)
        {
            //print("handshake2:" + responseText);
		    load_url = load_url2;
		    server_type = 2;
        }
    }catch(error){
        print('handshake2 failed');
    }
    return responseText;
}

function handshake(){
    var responseText = '';
    if((server_type == 0)||(server_type == 1))
    {
        responseText = handshake1();
    }
    if((server_type == 0)||(server_type == 2))
    {
        responseText = handshake2();
    }
    var token = JSON.parse(responseText).js.token;
    get_profile(token);
    get_modules(token);
    return token;
}

function get_profile(token){
    var param = '?type=stb&action=get_profile&hd=1'+ver_str+'&num_banks=2&sn=SN_'+mac_id+'&stb_type=MAG250&image_version=218&device_id=D1_'+mac_id+'&device_id2=D2_'+mac_id+'&signature=SG_'+mac_id+'&auth_second_step=0&hw_version=1.11-BD-00&not_valid_token=0&JsHttpRequest=1-xml';
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Host': 'p4.iptvprivateserver.tv',
			    'Connection' : 'Keep-Alive',
			    'X-User-Agent' : 'MAG250; Link: Ethernet',
			    'Authorization' : 'Bearer ' + token,
			    'Accept-Language' : 'en,*',
            },
        }).toString();
    //print(responseText);
}

function get_modules(token){
    var param = '?type=stb&action=get_modules&JsHttpRequest=1-xml';
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Host': 'p4.iptvprivateserver.tv',
			    'Connection' : 'Keep-Alive',
			    'X-User-Agent' : 'MAG250; Link: Ethernet',
			    'Authorization' : 'Bearer ' + token,
			    'Accept-Language' : 'en,*',
            },
        }).toString();
    //print(responseText);
}

function get_genres(token){
    var param = '?type=itv&action=get_genres&JsHttpRequest=1-xml';
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Host': 'p4.iptvprivateserver.tv',
			    'Connection' : 'Keep-Alive',
			    'X-User-Agent' : 'MAG250; Link: Ethernet',
			    'Authorization' : 'Bearer ' + token,
			    'Accept-Language' : 'en,*',
			    'Referer' : "http://p4.iptvprivateserver.tv/c/index.html",
            },

        }).toString();
    //print(responseText);
    return JSON.parse(responseText);
}

function get_all_channels(token){
    var param = '?action=get_all_channels&type=itv&JsHttpRequest=1-xml';
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'Authorization' : 'Bearer ' + token,
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Connection' : 'Keep-Alive',
			    'Accept-Encoding': 'identity',
			    'Accept-Language' : 'en,*',
			    'Host': 'p4.iptvprivateserver.tv',
            },
        }).toString();
    //print(responseText);
    return JSON.parse(responseText).js.data;
}

function creat_link(token,cmd){
    var uri = cmd.split(' ');
    var param = '?type=itv&action=create_link&cmd='+cmd+'&series=&forced_storage=&disable_ad=0&JsHttpRequest=1-xml';
    var responseText = showtime.httpReq(url + load_url + param, {
        headers: {
                'User-Agent' : user_agent,
                'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
                'Host': 'p4.iptvprivateserver.tv',
                'Connection' : 'Keep-Alive',
                'X-User-Agent' : 'MAG250; Link: Ethernet',
                'Authorization' : 'Bearer ' + token,
                'Accept-Language' : 'en,*',
                'Referer' : "http://p4.iptvprivateserver.tv/c/index.html",
            },
        }).toString();
    //print(responseText);
    return JSON.parse(responseText).js.cmd;
}

