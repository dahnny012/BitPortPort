var req = require("request").defaults({ jar: true });
var cheerio = require("cheerio");
var async = require("async");


function extractCookie(headers) {
	var raw = headers["set-cookie"][0];
	var regex = /[A-Z]+=[a-zA-Z0-9]+;/;
	var cookie = raw.match(regex)[0];
	return cookie;
}

function getHomePage(cb){
	getPage("https://bitport.io",cb);
}

function getPage(url,cb){
	var config = {url:url,
			success:function(err,httpRes,res){
				var $ = cheerio.load(res);
				cb($);
			}
		};
	req.get(config.url,config.success);
}

function assert(cond, msg) {
	if (!cond)
		throw (msg);
	else{
		console.log("Test Passed")
	}
}


function main() {
	function AbleToSignIn(cb) {
		getPage("https://bitport.io/login",function($){
			var token = $("#frm-signInForm-_token_").val()
			var config = {
			url: "https://bitport.io/login?do=signInForm-submit",
			data: {
				email: "dahnny012@sharklasers.com",
				password: "password123",
				_token_:token
			},
			success: function (err, httpRes, res) {
				var cookie = extractCookie(httpRes.headers);
				assert(cookie != null, "Null cookie in AbleToSignIn");
				req.cookie(cookie);
				cb();
			}
		}
		req.post(config.url, { form: config.data }, config.success);	
		})
	}
	
	function AbleToCheckTorrents(cb){
		getHomePage(function($){
				assert($("#main-menu").length <= 0,"Unable to check torrents");
				cb();
			});
	}
	
	function AbleToAddTorrent(cb){
		var key;
		function getToken(cb2){
			getHomePage(function($){
				key = $("body").first().attr("data-user-token");
				assert(key,"Could find a token");
				cb2();
			})
		}
		function sendReq(cb2){
			var config = {
				url:"https://fes.bitport.io/torrentInfoService/v1/torrent/add/",
				data:{
					userToken:key,
					links:"http://torcache.net/torrent/BBA1876861A473B276522C06D00689A2886651BB.torrent?title=[kat.cr]a.song.of.ice.and.fire.book.5.a.dance.with.dragons"
				},
				success:function(err,headers,success){
					// Wait a second for torrent to appear
					var retries = 5;
					var length = 0;
					function checkTorrent(){
						retries--;
						return length > 0;
					}
					function getTorrentPage(cb){
						if(retries <= 0)
							cb("ERROR");
						setTimeout(function(){
							getPage("https://bitport.io/recapitulation",function($){
							length = $("#queue-items").find("tr").length;
							cb();
						})},200);
					}
					function fail(err){
						if(err)
							assert(false,"No torrent added");
						assert(true);
					}
					async.until(checkTorrent,getTorrentPage,fail)
				}
			}
			
			req.post(config.url,{form:config.data},config.success);
			
		}
		async.series([
			getToken,
			sendReq
		])
	}
	
	async.series(
	[
	AbleToSignIn,
	AbleToCheckTorrents,
	AbleToAddTorrent
	])
}

main();



