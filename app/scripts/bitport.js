// Simple
function request(config) {
    if (typeof(config) != "object") {
        return $.get(config);
    }
    if (config.data) {
        return $.post(config.url, config.data);
    } else {
        return $.get(config.url)
    }
}

// Mutates combines src and a new source based on common keys
function merge(src,newSrc,key){
	if(!src)
		src = [];
	if(!newSrc){
		return;
	}
	var arrKeys ={};
	
	src.forEach(function(e){
		arrKeys[e[key]] = 1;
	});
	
	newSrc.forEach(function(e){
		if(!arrKeys[e[key]])
			src.push(e);
	});
	
	
	return src;
}

function reject(msg){
	return $.Deferred().reject(msg).promise();
}



function assert(cond, msg, msgPassed) {
	if (!cond)
		throw (msg);
	else {
		console.log(msgPassed);
	}
}

function Bitport() {
    this.userToken = "";
	this.dirty = false;
	this.transfers = [];
	this.addInProgress = 0;
}
Bitport.prototype.getRemoveUrl = function(token) {
    return "https://bitport.io/recapitulation?token=" + token + "&do=deleteTransfer"
}

Bitport.prototype.getDeleteUrl = function(token){
	return "https://bitport.io/transfers?token=" + token +"&do=deleteTransfer";
}

Bitport.prototype.homeUrl = "https://bitport.io/";
Bitport.prototype.addUrl = "https://fes.bitport.io/torrentInfoService/v1/torrent/add/";
Bitport.prototype.queueUrl = "https://bitport.io/to-queue";
Bitport.prototype.statusUrl = "https://fes.bitport.io/torrentInfoService/v1/torrent/poll/";
Bitport.prototype.torrentStatusUrl = "https://bitport.io/transfers-status"
Bitport.prototype.cancelTransferUrl = function(token) {
    return "https://bitport.io/transfers?token=" + token + "&do=deleteTransfer"
}
Bitport.prototype.filesUrl = "https://bitport.io/my-files"


Bitport.prototype.getAddedTorrentStatus = function(cb) {
    var defer = $.Deferred();
    var bitport = this;
	
	if(!this.userToken){
		this.getToken().then(function(){
			go()
		})
	}
		go();
	
	function go(){
		var retries = bitport.addInProgress > 0 ?  bitport.addInProgress : 5;
		async.timesSeries(retries,
			function (n, next) {
				request({
					url: bitport.statusUrl + bitport.userToken
				}).then(function (data, status) {
					var data = JSON.parse(data);
					console.log(data);
					if (data.length > 0) {
						bitport.addInProgress -= data.length;
						if (bitport.addedTorrents && bitport.addedTorrents.length > 0) {
							var newTable = bitport.torrentTableJSON(data).concat(bitport.addedTorrents);
							merge(bitport.addedTorrents,newTable,"token");
						} else {
							bitport.addedTorrents = bitport.torrentTableJSON(data);
						}
						if(bitport.addInProgress <= 0){
							bitport.dirty = false;
							defer.resolve();
							next("Updated");
						}else{
							next();
						}
					} else {
						next();
					}
				})
				.fail(function(){
					next("Could not connect to bitport.io");
				});
			},
			function (err) {
				if (err) {
					if(err != "Updated"){
						defer.reject(err);
					}
				} else {
					defer.resolve();
				}
			});
	}
    return defer.promise();
}


Bitport.prototype.torrentTableJSON = function(json) {
    var bitport = this;
    var table = [];
    json.forEach(function(e) {
        var megabyte = 1024000;
		var torrent = {};
		torrent.token = e.transferToken;
		torrent.remove = bitport.getRemoveUrl(e.transferToken);
		torrent.name = e.response.name;
		torrent.size =  e.response.size ? e.response.size / megabyte : 0;
        if (!e.response.success){
			torrent.status = e.response.errorMsg;
			torrent.name = e.name
			torrent.error = true;
		}
		table.push(torrent);
    })
    return table;
}




Bitport.prototype.removeAddedTorrent = function(index) {
	var bitport = this;
    if (!bitport.addedTorrents || index > bitport.addedTorrents.length) {
        return reject("ERROR no entries to delete")
    }
    var target = bitport.addedTorrents[index];
	var defer = $.Deferred();
	if(target .error){
		bitport.addedTorrents.splice(index, 1);
		defer.resolve();
		return defer.promise();
	}
    $.ajax({
        type: "GET",
        url: target.remove,
        beforeSend: function(request) {
            request.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
            request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        }})
        .done(function(data, status, xhr) {
            if (data.success != undefined){
                bitport.addedTorrents.splice(index, 1);
				defer.resolve();
			}else{
				defer.reject("Error could not remove torrent");
			}
		})
		.fail(function(){
				defer.reject("Could not connect to bitport.io");
		})
	
	return defer.promise();
}


Bitport.prototype.deleteTransfer = function(index) {
	var bitport = this;
    if (!bitport.transfers.activeTransfers || index > bitport.transfers.activeTransfers.length) {
        return reject("ERROR no entries to delete")
    }
	var target = bitport.transfers.activeTransfers[index];
	var defer = $.Deferred();
	var removeUrl = bitport.getDeleteUrl(target.token);
    $.ajax({
        type: "GET",
        url: removeUrl})
        .done(function(data, status, xhr) {
           bitport.transfers.activeTransfers.splice(index, 1);
		   defer.resolve();
		})
		.fail(function(){
				defer.reject("Could not connect to bitport.io");
		})
	
	return defer.promise();
}
Bitport.prototype.isLoggedIn = function() {
	var bitport = this;
	var defer = $.Deferred();
    request({
            url: bitport.homeUrl
        })
        .then(function(data, status, xhr) {
            defer.resolve($(data).find("#main-menu").length <= 0);
        }).fail(function(data){
			defer.reject("Could not connect to Bitport.io");
		})
		
	return defer.promise();
}


Bitport.prototype.getTorrentStatus = function() {
    var bitport = this;
	var defer= new $.Deferred();
    request(bitport.torrentStatusUrl).then(function(data,status,xhr) {
		if(xhr.getResponseHeader("Content-Type") == "text/html; charset=utf-8"){
			defer.reject("ERROR not logged in");
			return;
		}
        bitport.transfers = data;
        defer.resolve(data);
    });
	
	return defer.promise();
};

Bitport.prototype.queueTorrents = function() {
	var defer = new $.Deferred();
	var bitport = this;
    request(this.queueUrl).then(function(data){
		
		if($(data).find("#main-menu").length <= 0){
			 bitport.addedTorrents = [];
			 defer.resolve()
		}else{
			defer.reject("ERROR not logged in");
		}
	}).fail(function(data){
		defer.reject("Could not connect to Bitport.io");
	})
	return defer.promise();
};

Bitport.prototype.addTorrent = function(url, cb) {
    var bitport = this;
    bitport.dirty = true;
    bitport.addPromise = $.Deferred();
    if (bitport.userToken === "") {
        async.series([bitport.getToken.bind(bitport), sendReq],
            function(err, result) {
                if (err)
                    bitport.addPromise.reject(err);
                if (cb) {
                    cb();
                }
            });
    } else {
        sendReq(cb);
    }

    // Send the torrent link
    function sendReq(cb) {
        request(
			{url:bitport.addUrl,
			data:{
                userToken: bitport.userToken,
                links: url
            }}).then(function(data, status, xhr) {
                    if (cb) {
                        cb();
                    }
                    if (bitport.addPromise){
						bitport.addInProgress++;
                        bitport.addPromise.resolve();
					}
            }).fail(function(data,status,xhr){
                    cb("ERROR in adding torrent");
					bitport.userToken = "";
			})
    };
};


Bitport.prototype.getToken = function(cb) {
    // We need a data-user token to send post requests
    var bitport = this;
    request({
        url: bitport.homeUrl
    }).then(function(data, status, xhr) {
        // Fk jquery is being gay
        var tokenRegex = /data-user-token="[a-zA-Z0-9]+"/;
		
        var matches = tokenRegex.exec(data)
		if(matches == null || matches.length <= 0){
			cb("ERROR in finding token");
			return;
		}
		var rawToken=matches[0].split("=")[1];
        var key = /[a-zA-Z0-9]+/.exec(rawToken)[0];
        bitport.userToken = key;
        if (cb) {
            if (xhr.status != 200 || key == ""){
                cb("ERROR in finding token");
            } else {
                cb();
            }
        }
    })
}

/* Does refresh just to make sure things are consistent.
   Develop diffing later.
   */

Bitport.prototype.torrentTable = function(html) {
    var table = [];
	var bitport = this;
    var children = $(html).find("#queue-items").find("tr").each(function(i, e) {
        var rows = $(e).find("td");
        var torrent = {};
        var prop = 0;
		torrent.token = $(e).attr("data-token");
		torrent.status = $(e).attr("status");
		torrent.remove = bitport.getRemoveUrl(torrent.token);
        rows.each(function(i, node) {
            switch (node.className) {
                case "td-name":
                    torrent.name = node.innerText.trim();
					prop++;
                    break;
                case "td-weak":
                    torrent.size = node.innerText.trim();
                    break;
                case "align-right td-folder":
                    torrent.dir = node.innerText.trim();
                    break;
            }
        });
        if (prop > 0) {
            table.push(torrent);
        }
    });
    return table;
}

Bitport.prototype.getAddedTorrents = function () {
    var _this = this;
	var defer = $.Deferred();
    request({
		url: "https://bitport.io/recapitulation"
	})
        .then(function (data, status, xhr) {
            var torrents = _this.torrentTable(data);
            _this.addedTorrents = merge(_this.addedTorrents,torrents,"token");
            _this.dirty = false;
			defer.resolve();
            return true;
		})
		.fail(function(){
			defer.reject("Could not connect to bitport.io")
		})

	return defer.promise();
};


Bitport.prototype.clearAdded = function(){
	this.addedTorrents = undefined;
}

Bitport.prototype.myFiles = function() {
    var defer = $.Deferred();
    var bitport = this;
    request(bitport.filesUrl).then(function(data) {
		var body = $(data);
		if(body.find("#main-menu").length > 0){
			defer.reject("ERROR not logged in");
			return;
		}
        var page = $(body.find("ul.list")[0]);
        var files = page.find("li");
        var downloaded = [];
        files.each(function(i, e) {
            var file = $(e);
            var size = file.find(".file-size")[0];
            if (size.textContent.indexOf("0 B") < 0) {
                var link = [bitport.filesUrl, "/"];
                var fileType = file[0].className.indexOf("folder") > 0 ? "folder" : "file";
                if (fileType === "file")
                    link.push(fileType, "/");
                link.push(file.attr("data-code"));
                link = link.join("");
                var name = file.find("h2")[0].textContent;
                var size = size.textContent;
                downloaded.push({
                    name: name,
                    link: link,
                    size: size,
                    type: fileType
                });
            }
        })
        defer.resolve(downloaded);
    }).fail(function(){
		defer.reject("Could not connect to bitport.io");
	})
    return defer.promise();
}
/* TODO allow to upload file */
