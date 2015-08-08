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
                    break;
                case "torrentStatus":
					if (!bitport.addedTorrents) {
						bitport.getAddedTorrents().then(function () {
							sendResponse(bitport.addedTorrents);
						})
					} else {
						sendResponse(bitport.addedTorrents);
					}
                    break;
				case "addedTorrents":
					// TODO
					// Check if dirty
					if (!bitport.addedTorrents) {
						bitport.getAddedTorrents().then(function () {
							sendResponse(bitport.addedTorrents);
						})
					} else {
						sendResponse(bitport.addedTorrents);
					}
					break;
                default:
                    return;
            }
			return true;
        });
})();
