// m --> module




(function() {
    var bitport = new Bitport();

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log("Recieved msg");
            switch (request.msg) {
                case "queue":
                    break;
                case "torrent":

                    break;
                default:
                    return;
            }
        });
})();
