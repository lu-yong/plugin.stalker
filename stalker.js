var http = require('showtime/http');
var fs = require('showtime/fs');
var url = ' ';
var server_url = ' ';
var	load_url = ' ';
var load_url1 = 'portal.php';
var load_url2 = 'server/load.php';
var refer = '/c/';
var user_agent  = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 1812 Mobile Safari/533.3';
var timezone = 'Europe%2FUzhgorod';
var ver_str = '&ver=ImageDescription:%200.2.18-r11-250;%20ImageDate:%20Wed%20Mar%2018%2017:54:59%20EET%202015;%20PORTAL%20version:%204.9.22;%20API%20Version:%20JS%20API%20version:%20331;%20STB%20API%20version:%20141;%20Player%20Engine%20version:%200x572';
var mac = '00:1A:79:f5:75:d2';
var mac_id = '001A79f575d2';
var global_responseData;

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
	server_url = url;
    var service = plugin.createService("stalker", PLUGIN_PREFIX+"start", "video", true, plugin.path + "stalker.png");

    plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
        page.type = "directory";

        var token = handshake();
        responseData = get_genres(token);
        responseData = responseData.js;
        if(typeof(showtime.apiVersion) != "undefined" && showtime.apiVersion == "1.0.0")
        {
            page.appendItem(PLUGIN_PREFIX + "search:", 'search', {title: 'Search'});
        }
        for(var i in responseData)
        {
            page.appendItem(PLUGIN_PREFIX + 'id:' + responseData[i].id + ':alias:' + responseData[i].alias, 'directory',{title: responseData[i].title,});
        }

        global_responseData = get_all_channels(token);
        page.loading = false;

    });

    plugin.addURI(PLUGIN_PREFIX + "search:(.*)", function(page, query) {
        var result = 0;
     	print('Search results for: ' + query);
        // 去掉转义字符
        query = query.replace(/[\'\"\\\/\b\f\n\r\t]/g, '');
        // 去掉特殊字符
        query = query.replace(/[\@\#\$\%\^\&\*\{\}\:\"\<\>\?\[\]\(\)]/g, '');
     	print('2Search results for: ' + query);
        for(var i in global_responseData)
        {
            if(global_responseData[i].name.search(eval('/' + query + "/i")) != -1)
            {
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
                result = 1;
                page.appendItem(PLUGIN_PREFIX + 'playcmd:' + global_responseData[i].cmd, 'video',{title: global_responseData[i].name, icon: icon_url});
            }
        }
        if(result == 0)
        {
            page.appendItem(PLUGIN_PREFIX + 'playcmd:null', 'video',{title: "No Content"});
        }
	});

    plugin.addURI(PLUGIN_PREFIX+"id:(.*):alias:(.*)", function(page, id, alias) {
        var offset = 0;
        var j = 0;
        var total = 0;
        page.entries = 0;

        for(var i in global_responseData)
        {
            if(global_responseData[i].tv_genre_id == id || alias.toLowerCase() == 'all')
            {
                total++;
            }
        }
        print("total = " + total);

        function loader() {
            for(var i in global_responseData)
            {
                if(global_responseData[i].tv_genre_id == id || alias.toLowerCase() == 'all')
                {
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
        }
        if(total == 0)
        {
            page.appendItem(PLUGIN_PREFIX + 'playcmd:null', 'video',{title: "No Content"});
        }
        else
        {
            loader();
        }


    });

    plugin.addURI(PLUGIN_PREFIX+"playcmd:(.*)", function(page, cmd) {
        var url;
        print(cmd);
        if(cmd.substring(0, 4) == "null")
            url = "null"
        else if(cmd.substring(0, 4) == "http")
            url = cmd;
        else if(cmd.substring(0, 6) == "ffmpeg") //&& cmd.substring(7, 11) == "http")
        {
            url = cmd.split(' ')[1];
        }
        else
        {
            var token = handshake();
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
	print('handshake1');
	var responseText = '';
    var param = '?type=stb&action=handshake&JsHttpRequest=1-xml';
	stalker_dec_server_url();

	//print("url:" + url+load_url+param);
	try{
        var responseText = showtime.httpReq(url + load_url + param, {
                headers: {
			        'User-Agent' : user_agent,
			        'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			        'Connection' : 'Keep-Alive',
			        'X-User-Agent' : 'MAG250; Link: Ethernet',
                },
            }).toString();
        if(responseText.length>10)
        {
            print("handshake1:" + responseText);
        }
    }catch(error){
        print('handshake1 failed');
    }
    return responseText;
}

function stalker_dec_server_url(){
	var len = 0;
	var temp1 = '';
	var temp2 = '';
	var load = '';
	load_url = '';
	len = server_url.length;
	//print("0:"+server_url);
	if((len>0)&&(server_url.substring(len-1, len) == '/'))
	{
		server_url = server_url.substring(0,len-1);
		  //print("1:"+server_url);
	}

	len = server_url.length;
	if((len>1)&&(server_url.substring(len-2, len-1) == '/')&&(server_url.substring(len-1, len) == 'c'))
	{
		server_url = server_url.substring(0,len-2);
		//print("2:"+server_url);
	}
	if(server_url.search("//") != -1)
	{
		temp1 = server_url.split("//")[1];
		//print("temp1:"+temp1);
		if(temp1.length > 0)
		{
			if(temp1.search("/") != -1)
			{
				temp2 = temp1.split("/",2);
				len = temp2[1].length;
				if(len > 0)
				{
					load_url = '/' + temp2[1] + '/' + load_url2;
					url = 'http://' + temp2[0];

				}
			}
		}
	}
	//print("load_url.length:"+load_url.length);
	if(load_url.length == 0 )
	{
		load_url = '/' + load_url1;
		url = server_url;
	}

	print("server_url:"+url);
	print("load_url:"+load_url);
}

function handshake(){
    var responseText = '';
    responseText = handshake1();
    var token = JSON.parse(responseText).js.token;
    get_profile(token);
    get_modules(token);
    return token;
}

function get_profile(token){
    var param = '?type=stb&action=get_profile&hd=1'+ver_str+'&num_banks=2&sn=SN_'+mac_id+'&stb_type=MAG250&image_version=218&device_id=D1_'+mac_id+'&device_id2=D2_'+mac_id+'&signature=SG_'+mac_id+'&auth_second_step=0&hw_version=1.11-BD-00&not_valid_token=0&JsHttpRequest=1-xml';
	print("get_profile");
	//print("url:" + url+load_url+param);
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
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
	print("get_modules");
	//print("url:" + url+load_url+param);
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
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
	print("get_genres");
	//print("url:" + url+load_url+param);
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Connection' : 'Keep-Alive',
			    'X-User-Agent' : 'MAG250; Link: Ethernet',
			    'Authorization' : 'Bearer ' + token,
			    'Accept-Language' : 'en,*',
            },

        }).toString();
    //print(responseText);
    return JSON.parse(responseText);
}

function get_all_channels(token){
    var param = '?action=get_all_channels&type=itv&JsHttpRequest=1-xml';
	print("get_all_channels");
	//print("url:" + url+load_url+param);
    var responseText = showtime.httpReq(url + load_url + param, {
            headers: {
			    'Authorization' : 'Bearer ' + token,
			    'X-User-Agent' : 'Model: MAG254; Link: Ethernet',
			    'User-Agent' : user_agent,
			    'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
			    'Connection' : 'Keep-Alive',
			    'Accept-Encoding': 'identity',
			    'Accept-Language' : 'en,*',
            },
        }).toString();
    print("get_all_channels http request url: " + url + load_url + param);
    return JSON.parse(responseText).js.data;
}

function creat_link(token,cmd){
    var uri = cmd.split(' ');
	len = uri.length;
	if(len>1)
	{
		enc_cmd = uri[0];
		for(var i=1; i<len; i++)
		{
			enc_cmd = enc_cmd + '%20' + uri[i];
		}
	}
	else
	{
		enc_cmd = cmd;
	}
    var param = '?type=itv&action=create_link&cmd='+enc_cmd+'&series=&forced_storage=&disable_ad=0&JsHttpRequest=1-xml';
	print("creat_link");
	//print("url:" + url+load_url+param);
    var responseText = showtime.httpReq(url + load_url + param, {
        headers: {
                'User-Agent' : user_agent,
                'Cookie' : 'mac=' + mac + '; stb_lang=en; timezone=' + timezone,
                'Connection' : 'Keep-Alive',
                'X-User-Agent' : 'MAG250; Link: Ethernet',
                'Authorization' : 'Bearer ' + token,
                'Accept-Language' : 'en,*',
            },
        }).toString();
    //print(responseText);
    return JSON.parse(responseText).js.cmd;
}

