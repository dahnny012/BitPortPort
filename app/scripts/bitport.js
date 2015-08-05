// Simple
function request(config) {
	if (typeof (config) != "object") {
		return $.get(config);
	}
    if (config.data) {
        return $.post(config.url, config.data);
    } else {
        return $.get(config.url)
    }
}


function Bitport() {
    this.userToken = "";
}
Bitport.prototype.getRemoveUrl = function (token) {
	return "https://bitport.io/recapitulation?token=" + token + "&do=deleteTransfer"
}

Bitport.prototype.homeUrl = "https://bitport.io/";
Bitport.prototype.addUrl = "https://fes.bitport.io/torrentInfoService/v1/torrent/add/";
Bitport.prototype.queueUrl = "https://bitport.io/to-queue";
Bitport.prototype.statusUrl = "https://fes.bitport.io/torrentInfoService/v1/torrent/poll/";
Bitport.prototype.torrentStatusUrl = "https://bitport.io/transfers-status"
Bitport.prototype.cancelTransferUrl = function(token){
	return "https://bitport.io/transfers?token="+token+"&do=deleteTransfer"
}



function run_tests() {
	var testUrl = "http://torcache.net/torrent/BBA1876861A473B276522C06D00689A2886651BB.torrent?title=[kat.cr]a.song.of.ice.and.fire.book.5.a.dance.with.dragons"
    var dataBeingChanged = $.Deferred();
	var queueReady = $.Deferred();

    function assert(cond, msg, msgPassed) {
        if (!cond)
            throw (msg);
        else {
            console.log(msgPassed);
        }
    }

    function describe(name, cb) {
        cb(name);
    }

    var bitport;
    describe("Can Init", function (name) {
        bitport = new Bitport();
        assert(bitport != null, "Bitport is null", name);
    })

    describe("Can make a Request", function (name) {
        request({
            url: "https://bitport.io"
        }).then(function (data, status, xhr) {
            assert(data != undefined, "Could not make a request", name);
        })
    })

    describe("Can check if a user is logged in", function (name) {
        bitport.isLoggedIn().done(function (data) {
            assert(data, "User is not logged In", name);
        })
    })

    describe("Can add a torrent and check for it", function (name) {
        bitport.addTorrent(testUrl, function () {
			bitport.getAddedTorrentStatus(function () {
				assert(bitport.addedTorrents.length > 0, "No torrent added", name);
				dataBeingChanged.resolve();
			});
        });
    });


    describe("Can remove a torrent", function (name) {
        dataBeingChanged.then(function () {
            var length = bitport.addedTorrents.length;
            assert(length > 0, "Nothing in staging area", "Something in Staging area");
            bitport.removeAddedTorrent(0).then(function () {
				assert(length == bitport.addedTorrents.length + 1, "No torrent was removed", name)
				queueReady.resolve();
			})
        })
    })

    describe("Can queue torrents and check their status", function (name) {
        queueReady.then(function () {
			async.series([wipeAddedTorrents,
						  // Add a url to test with
						  function(next){bitport.addTorrent(testUrl,next)},
						  // Check Status to make sure we are good to go.
						  function(next){
							  bitport.getAddedTorrentStatus(function(){
								  assert(bitport.addedTorrents.length >0,"In Can Queue,Couldnt add torrent","Added torrent");
								  next();
							  })
						  },
						  // Queue em up
						  function(next){ bitport.queueTorrents().then(function(){
							  next();
						  })},
						  // Check the transfer status
						  function(next){
							async.timesSeries(10,
								function(n,keepTrying){
									bitport.getTorrentStatus().then(function(data){
										bitport.transfers = data;
										if(bitport.transfers.waitingTransfers.length > 0 ||
										   bitport.transfers.activeTransfers.length > 0){
											keepTrying(1)
										}else{
											keepTrying()
										}
									})
								},
								function(err){
									if(err && err == 1){
										assert(true,undefined,name);
										next()
									}else{
										assert(false,"Can not see torrent status");
									}
								} 
							)}],
							function(err,data){
								// Wipe transfers
								bitport.transfers.waitingTransfers.forEach(function(e){
									request(bitport.cancelTransferUrl(e.token));
								})
								
								bitport.transfers.activeTransfers.forEach(function(e){
									request(bitport.cancelTransferUrl(e.token));
								})
							});
        });
    })


	function wipeAddedTorrents(cb) {
		var times = bitport.addedTorrents.length;
		// Check master
		if (times == 0) {
			bitport.getAddedTorrents().then(function () {
				times = bitport.addedTorrents.length;
				removeAll(cb);
			})
		} else {
			removeAll(cb);
		}


		var removeAll = function (cb) {
			async.timesSeries(times,
				function (n, next) {
					bitport.removeAddedTorrent(0).then(function () {
						next();
					})
				},
				function (err, data) {
					if (err)
						console.log("ERROR in wiping torrents")
					if(cb)
						cb();
				}
				)
		}
	}

	function addABunch(cb) {
		var url = "http://torcache.net/torrent/BBA1876861A473B276522C06D00689A2886651BB.torrent?title=[kat.cr]a.song.of.ice.and.fire.book.5.a.dance.with.dragons"
		async.times(3,
			function (n,next) {
				bitport.addTorrent(url, function () {
					bitport.getAddedTorrentStatus(function () {
						next();						
					});
				});
			}, function (err) {
				if(err)
					console.log("Error in added a bunch of torrents")
				cb();
			}
		)
	}
}


Bitport.prototype.getAddedTorrentStatus = function (cb) {
	var bitport = this;
    if (this.userToken) {
        async.timesSeries(5,
            function (n, next) {
                request({ url: bitport.statusUrl + bitport.userToken }).then(function (data, status) {
                    var data = JSON.parse(data);
                    if (data.length > 0) {
						bitport.addedTorrents = bitport.torrentTableJSON(data);
                        next("Updated");
                    } else {
                        next();
                    }
                });
            },
            function (err) {
                if (err && err != 1) {
					if (cb)
						cb();
                    return
                } else {
                    console.log("Failed");
                }
            });
    }
}


Bitport.prototype.torrentTableJSON = function (json) {
	var bitport = this;
	var table = [];
	json.forEach(function (e) {
		var megabyte = 1024000;
		if (e.response.success) {
			var torrent = {};
			torrent.remove = bitport.getRemoveUrl(e.transferToken);
			torrent.name = e.response.name;
			torrent.size = e.response.size / megabyte;
			table.push(torrent);
		}
	})
	return table;
}




Bitport.prototype.removeAddedTorrent = function (index) {
    if (index > this.addedTorrents.length) {
        console.log("Index not in range");
        return;
    }
    var target = this.addedTorrents[index];
	var bitport = this;
	return $.ajax({
		type: "GET",
        url: target.remove,
		beforeSend: function (request) {
			request.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
			request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		},
		success: function (data, status, xhr) {
			if (data.success)
				bitport.addedTorrents.splice(index, 1);
		}
    });
}

Bitport.prototype.isLoggedIn = function () {
    return request({
		url: "https://bitport.io"
	})
        .then(function (data, status, xhr) {
            return $(data).find("#main-menu").length <= 0;
        })
}


Bitport.prototype.getTorrentStatus = function () {
	var bitport = this;
	return request(bitport.torrentStatusUrl);
};

Bitport.prototype.queueTorrents = function () {
    return request(this.queueUrl);
};

Bitport.prototype.addTorrent = function (url, cb) {
    var bitport = this;
    if (bitport.userToken === "") {
        async.series([bitport.getToken.bind(bitport), sendReq],
            function (err, result) {
                if (err)
                    alert(err);
                if (cb)
                    cb();
            });
    } else {
        sendReq(cb);
    }

    // Send the torrent link
    function sendReq(cb) {
        $.post(bitport.addUrl, {
			userToken: bitport.userToken,
			links: url
		},
            function (data, status, xhr) {
                if (xhr.status != 200) {
                    cb("ERROR in adding torrent")
                } else {
                    if (cb)
                        cb();
                }
            })
    };
};


Bitport.prototype.getToken = function (cb) {
    // We need a data-user token to send post requests
    var bitport = this;
    request({
        url: bitport.homeUrl
    }).then(function (data, status, xhr) {
        // Fk jquery is being gay
        var tokenRegex = /data-user-token="[a-zA-Z0-9]+"/;
        var rawToken = tokenRegex.exec(data)[0].split("=")[1];
        var key = /[a-zA-Z0-9]+/.exec(rawToken)[0];
        bitport.userToken = key;
        if (cb) {
            if (xhr.status != 200) {
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

Bitport.prototype.torrentTable = function (html) {
    var table = [];
    var children = $(html).find("#queue-items").find("tr").each(function (i, e) {
        var rows = $(e).find("td");
        var torrent = {};
        var prop = 0;
        rows.each(function (i, node) {
            switch (node.className) {
                case "td-name":
                    torrent.name = node.innerText;
                    prop++;
                    break;
                case "td-weak":
                    torrent.size = node.innerText;
                    prop++;
                    break;
                case "td-status":
                    torrent.status = node.innerText;
                    prop++;
                    break;
                case "align-right td-folder":
                    torrent.dir = node.innerText;
                    prop++;
                    break;
                case "td-remove":
                    torrent.remove = "https://bitport.io/" + $(node).find("a").attr("href");
                    prop++;
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
    return request({
		url: "https://bitport.io/recapitulation"
	})
        .then(function (data, status, xhr) {
            var torrents = _this.torrentTable(data);
            _this.addedTorrents = torrents;
            return true;
        })
};

/* TODO allow to upload file */


