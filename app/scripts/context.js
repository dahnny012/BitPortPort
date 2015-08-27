// Context Module
var Context = function() {
    chrome.contextMenus.create({
        "title": "Torrent File",
        "contexts": ["link"],
        "onclick": function(info) {
            chrome.runtime.sendMessage({
                msg: "addTorrent",
                file: info.linkUrl
            },function(data){
				var note = chrome.notifications.create("id", opt);
				setTimeout(function(){
					chrome.notifications.clear("id");
				},2000);
			});
        }
    });
};

var opt = {
  type: "basic",
  title: "Bitport Port Action",
  message: "Torrent Added",
  iconUrl: "images/icon-48.png"
}



Context();

