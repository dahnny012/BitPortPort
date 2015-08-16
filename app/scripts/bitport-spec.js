// Assuming not logged in tests
function run_fail(){
	function fail_login(){
		var bitport = new Bitport();
		var url = bitport.homeUrl;
		bitport.homeUrl = "dfdsfdsf";
		return bitport.isLoggedIn().then(function(){
			throw "Should not of succedded";
		}).fail(function(msg){
			console.log("login: "+msg);
			bitport.homeUrl = url;
		})
	}
	
	function fail_token(){
		
		var name = "token: ";
		var bitport = new Bitport();
		bitport.getToken(function (msg) {
			assert(msg == "ERROR in finding token",
				   "token:Did not error out finding token",
				   name+msg);
		})
	}
	
	function fail_addTorrent(cb){
		var name = "addTorrent: "
		var bitport = new Bitport();
		bitport.userToken = "av0tj6x9ahssxp56xl88ejbw2lbfdxbx";
		// invalid url
		bitport.addTorrent("random url",function(){
			bitport.getAddedTorrentStatus().then(function(){
				assert(bitport.addedTorrents[0].status != "",
					   "addTorrent: did not find a errored torrent",
					   name+" Detected a invalid url");
					   cb();
			})
		})
	}
	
	function fail_getTorrentStatus(){
		var name = "getTorrentStatus :";
		var bitport = new Bitport();
		bitport.getTorrentStatus().fail(function(msg){
			assert(msg == "ERROR not logged in",
				"getTorrentStatus:Did not error out getting torrent status",
				name+msg);
			})
	}
	
	function fail_removeAddedTorrent(cb){
		var name = "removeAddedTorrent :";
		var bitport = new Bitport();	
		bitport.userToken = "av0tj6x9ahssxp56xl88ejbw2lbfdxbx";
		bitport.removeAddedTorrent(1).fail(function(msg){
			assert(msg=="ERROR no entries to delete",
			"removeAddedTorrent:Did not error out removing an empty array",
			name+msg);
			invalid_token();
			
		});
		
		function invalid_token(){
			var name="invalid token: ";
			var bitport = new Bitport();
			bitport.addedTorrents = [{remove:bitport.getRemoveUrl("dfdsfdsfsd")}];
			bitport.removeAddedTorrent(0).fail(function(msg){
				assert(msg=="ERROR Torrent was not removed",
					"invalid_token:Did not error out removing",
					name+msg)
					cb()
			});
		}
	}
	
	function fail_getAddedTorrentStatus(){
		var name ="getAddedTorrentStatus: "
		var bitport = new Bitport();
		bitport.userToken = "FFEF";
		bitport.getAddedTorrentStatus().fail(function (msg) {
			assert(msg == "Could not connect to bitport.io",
				"getAddedTorrentStatus:connected",
				name + msg)
		});
	}
	
	
	function fail_queueTorrents(cb){
		var name = "queue: "
		var bitport = new Bitport();
		
		bitport.queueTorrents().fail(function(msg){
			assert(msg=="ERROR not logged in",
				"Queue:Did not detect u are not logged in",
				name+msg)
				cb()
		})
	}
	
	function fail_myFiles(){
		var name = "myFiles: ";
		var bitport = new Bitport();
		
		bitport.myFiles().fail(function(msg){
			assert(msg=="ERROR not logged in",
			"Did not detect u are not logged in",
			name+msg)
		})
	}
	
	
	function fail_getAddedTorrents(){
		var name ="getAddedTorrents";
		var bitport= new Bitport();
		bitport.getAddedTorrents().fail(function(msg){
			assert(msg=="ERROR not logged in",
				"getAddeTorrents:Did not detect u are not logged in",
				name+msg);
		})
	}
	
	// Dont be logged in when running these
	fail_login().fail(function(){
		// User loses login token in the middle of the session.
		// monitor calls that happen and make sure they fail gracefully
		fail_token();
		fail_getTorrentStatus();
		fail_getAddedTorrentStatus();	
		fail_getAddedTorrents();
		fail_myFiles();
		async.series([
			fail_addTorrent,
			fail_queueTorrents,
			fail_removeAddedTorrent
		])
	});
}


function fail_addInvalidUrl(){
		
		function fail_addTorrent(){
			var bitport = new Bitport();
			//Invalid torrent
			bitport.addTorrent();
		}
}



/* Tests are outdated */

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
    describe("Can Init", function(name) {
        bitport = new Bitport();
        assert(bitport != null, "Bitport is null", name);
    })

    describe("Can make a Request", function(name) {
        request({
            url: "https://bitport.io"
        }).then(function(data, status, xhr) {
            assert(data != undefined, "Could not make a request", name);
        })
    })

    describe("Can check if a user is logged in", function(name) {
        bitport.isLoggedIn().done(function(data) {
            assert(data, "User is not logged In", name);
        })
    })

    describe("Can add a torrent and check for it", function(name) {
        bitport.addTorrent(testUrl, function() {
            bitport.getAddedTorrentStatus(function() {
                assert(bitport.addedTorrents.length > 0, "No torrent added", name);
                dataBeingChanged.resolve();
            });
        });
    });


    describe("Can remove a torrent", function(name) {
        dataBeingChanged.then(function() {
            var length = bitport.addedTorrents.length;
            assert(length > 0, "Nothing in staging area", "Something in Staging area");
            bitport.removeAddedTorrent(0).then(function() {
                assert(length == bitport.addedTorrents.length + 1, "No torrent was removed", name)
                queueReady.resolve();
            })
        })
    })

    describe("Can queue torrents and check their status", function(name) {
        queueReady.then(function() {
            async.series([wipeAddedTorrents,
                    // Add a url to test with
                    function(next) {
                        bitport.addTorrent(testUrl, next)
                    },
                    // Check Status to make sure we are good to go.
                    function(next) {
                        bitport.getAddedTorrentStatus(function() {
                            assert(bitport.addedTorrents.length > 0, "In Can Queue,Couldnt add torrent", "Added torrent");
                            next();
                        })
                    },
                    // Queue em up
                    function(next) {
                        bitport.queueTorrents().then(function() {
                            next();
                        })
                    },
                    // Check the transfer status
                    function(next) {
                        async.timesSeries(10,
                            function(n, keepTrying) {
                                bitport.getTorrentStatus().then(function(data) {
                                    bitport.transfers = data;
                                    if (bitport.transfers.waitingTransfers.length > 0 ||
                                        bitport.transfers.activeTransfers.length > 0) {
                                        keepTrying(1)
                                    } else {
                                        keepTrying()
                                    }
                                })
                            },
                            function(err) {
                                if (err && err == 1) {
                                    assert(true, undefined, name);
                                    next()
                                } else {
                                    assert(false, "Can not see torrent status");
                                }
                            }
                        )
                    }
                ],
                function(err, data) {
                    // Wipe transfers
                    bitport.transfers.waitingTransfers.forEach(function(e) {
                        request(bitport.cancelTransferUrl(e.token));
                    })

                    bitport.transfers.activeTransfers.forEach(function(e) {
                        request(bitport.cancelTransferUrl(e.token));
                    })
                });
        });
    })


    function wipeAddedTorrents(cb) {
        var times = bitport.addedTorrents.length;
        // Check master
        if (times == 0) {
            bitport.getAddedTorrents().then(function() {
                times = bitport.addedTorrents.length;
                removeAll(cb);
            })
        } else {
            removeAll(cb);
        }


        var removeAll = function(cb) {
            async.timesSeries(times,
                function(n, next) {
                    bitport.removeAddedTorrent(0).then(function() {
                        next();
                    })
                },
                function(err, data) {
                    if (err)
                        console.log("ERROR in wiping torrents")
                    if (cb)
                        cb();
                }
            )
        }
    }

    function addABunch(cb) {
        var url = "http://torcache.net/torrent/BBA1876861A473B276522C06D00689A2886651BB.torrent?title=[kat.cr]a.song.of.ice.and.fire.book.5.a.dance.with.dragons"
        async.times(3,
            function(n, next) {
                bitport.addTorrent(url, function() {
                    bitport.getAddedTorrentStatus(function() {
                        next();
                    });
                });
            },
            function(err) {
                if (err)
                    console.log("ERROR in added a bunch of torrents")
                cb();
            }
        )
    }
}
