(function() {
    var bitport = new Bitport();
    var loginManager = new LoginManager();
	
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch (request.msg) {
                case "loggedIn":
                    if (loginManager.login()) {
                        bitport.isLoggedIn().then(function(data) {
							if(!data)
								loginManager.reset();
							else
								loginManager.start();							
							sendResponse({loggedIn:data})
                        }).fail(function(msg){
							loginManager.reset();
							sendResponse({error:msg});
						})
                    } else {
                        sendResponse({
                            loggedIn: true
                        })
                    }
                    break;
                case "queue":
                    bitport.queueTorrents().then(function() {
                        sendResponse();
                    }).fail(function(msg){
						sendResponse({error:msg});
					})
                    break;
                case "torrentStatus":
                    bitport.getTorrentStatus().then(function() {
                        sendResponse(bitport.transfers);
                    }).fail(function(msg){
						sendResponse({error:msg});
					})
                    break;
                case "addedTorrents":
                    // User Recent added something
                    if (bitport.dirty) {
                        bitport.addPromise.then(function() {
                            bitport.getAddedTorrentStatus().then(function() {
                                sendResponse(bitport.addedTorrents);
                            }).fail(function(msg){
								sendResponse({error:msg});
							})
                        })
                    }
                    // Hard scrape
                    else if (!bitport.addedTorrents) {
                        bitport.getAddedTorrents().then(function() {
                            sendResponse(bitport.addedTorrents);
                        }).fail(function(msg){
							sendResponse({error:msg})
						})
                    } else {
                        // Not dirty
                        sendResponse(bitport.addedTorrents);
                    }
                    break;
                case "addTorrent":
                    bitport.addTorrent(request.file);
                    break;
                case "removeAdded":
                    bitport.removeAddedTorrent(request.index).then(function() {
                        sendResponse(bitport.addedTorrents);
                    }).fail(function(msg){
						sendResponse({error:msg});
					})
                    break;
                case "myFiles":
                    bitport.myFiles().then(function(data) {
                        sendResponse(data);
                    }).fail(function(data){
						sendResponse({error:data});
					})
                    break;
                default:
                    return true;
            }
            return true;
        });
})();

function LoginManager() {
    var ms = 1000;
    var hour = 3600 * ms;
    var minute = 60 * ms;
    var checkInterval = 5 * minute;
    var currentTime;
	var status = 0;
    this.login = function() {
		if(status == 0){
			status = 1;
			return true;
		}
        var checkTime = new Date();
        if (currentTime) {
            var difference = checkTime.valueOf() - currentTime;
            return difference > checkInterval;
        } else {
            currentTime = checkTime.valueOf();
            return true;
        }
	}
	
	this.reset = function(){
		status = 0;
		currentTime = undefined;
	}
	
	this.start = function(){
		currentTime = new Date();
	}
}
