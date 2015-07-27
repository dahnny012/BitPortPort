// Context Module

var Context = function() {
    chrome.contextMenus.create({
        "title": "Torrent File",
        "contexts": ["link"],
        "onclick": function(info) {
            chrome.runtime.sendMessage({
                msg: "torrent",
                file: info.linkUrl
            });
        }
    });
};
