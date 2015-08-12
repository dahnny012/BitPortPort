(function () {
    var bitport = new Bitport();
	var loginManager = new LoginManager();

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            switch (request.msg) {
				case "loggedIn":
					if (loginManager.login()) {
						bitport.isLoggedIn().then(function (data) {
							if (data) {
								sendResponse({ loggedIn: true })
							} else {
								sendResponse({ loggedIn: false })
							}
						})
					} else {
						sendResponse({ loggedIn: true })
					}
					break;
                case "queue":
					bitport.queueTorrents().then(function () {
						sendResponse();
					})
                    break;
                case "torrentStatus":
					bitport.getTorrentStatus().then(function () {
						sendResponse(bitport.transfers);
					})
                    break;
				case "addedTorrents":
					// User Recent added something
					if (bitport.dirty) {
						bitport.addPromise.then(function () {
							bitport.getAddedTorrentStatus().then(function () {
								sendResponse(bitport.addedTorrents);
							})
						})
					}
					// Hard scrape
					else if (!bitport.addedTorrents) {
						bitport.getAddedTorrents().then(function () {
							sendResponse(bitport.addedTorrents);
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
					bitport.removeAddedTorrent(request.index).then(function () {
						sendResponse(bitport.addedTorrents);
					})
					break;
				case "myFiles":
					bitport.myFiles().then(function(data){
						sendResponse(data);
					});
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
	this.login = function () {
		var checkTime = new Date();
		if (currentTime) {
			var difference = checkTime.valueOf() - currentTime;
			return difference > checkInterval;
		} else {
			currentTime = checkTime.valueOf();
			return true;
		}
	}
}