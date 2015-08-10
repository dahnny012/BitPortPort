// m --> module




(function () {
    var bitport = new Bitport();
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            switch (request.msg) {
				case "loggedIn":
					bitport.isLoggedIn().then(function (data) {
						if (data) {
							sendResponse({ loggedIn: true })
						} else {
							sendResponse({ loggedIn: false })
						}
					})
					break;
                case "queue":
					bitport.queueTorrents().then(function () {
						sendResponse();
					})
                    break;
                case "torrentStatus":
					if (!bitport.addedTorrents) {
						bitport.getAddedTorrents().then(function () {
							sendResponse(bitport.transfers);
						})
					} else {
						sendResponse(bitport.transfers);
					}
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
                default:
                    return;
            }
			return true;
        });
})();
