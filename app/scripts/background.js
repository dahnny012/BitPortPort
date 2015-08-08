// m --> module




(function() {
    var bitport = new Bitport();
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch (request.msg) {
				case "loggedIn":
					bitport.isLoggedIn().then(function(data){
						if(data){
							sendResponse({loggedIn:true})
						}else{
							sendResponse({loggedIn:false})
						}
					})
					break;
                case "queue":
                    break;
                case "torrent":
                    break;
                default:
                    return;
            }
			return true;
        });
})();
