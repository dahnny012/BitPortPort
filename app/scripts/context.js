// Context Module
var Context = function() {
    chrome.contextMenus.create({
        "title": "Torrent File",
        "contexts": ["link"],
        "onclick": function(info) {
            chrome.runtime.sendMessage({
                msg: "addTorrent",
                file: info.linkUrl
            });
        }
    });
};
Context();





