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