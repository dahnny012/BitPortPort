function Bitport() {
    this.userToken = "";
    this.loggedIn = false;
}

Bitport.prototype.homeUrl = "https://bitport.io/";
Bitport.prototype.addUrl = "https://fes.bitport.io/torrentInfoService/v1/torrent/add/";
Bitport.prototype.queueUrl = "https://bitport.io/to-queue";

Bitport.prototype.getTorrents = function() {

};

Bitport.prototype.getQueueStatus = function() {

};

/*
Bitport.prototype.getToken = function(cb) {

    var bitport = this;
    if (this.loggedIn && this.userToken === "") {
        return $.ajax({
            url: bitport.homeurl,
            type: "GET",
            success: function(res) {
                var key = $(res).find("body").attr("data-user-token");
                bitport.userToken = $key;
                cb();
            }
        }).promise(, key);
    }
    return $().promise();

};*/

Bitport.prototype.queue = function() {
    $.ajax({
        url: this.queueUrl,
        type: "GET",
        success: function() {
            console.log("Successfully Queued");
        }
    });
};

Bitport.prototype.addTorrent = function(url, cb) {
    var bitport = this;
    if (this.userToken !== "") {
        async.series([getToken, sendReq],
            function(err, result) {
                if (err)
                    console.log("error in req");
                cb();
            });
    }else{
        sendReq(cb);
    }

    // We need a data-user token to send post requests
    function getToken(cb) {
        $.get(bitport.homeurl,
            function(res) {
                var key = $(res).find("body").attr("data-user-token");
                bitport.userToken = key;
                cb();
            })
    }
    
    // Send the torrent link
    function sendReq(cb) {
        $.post(bitport.addUrl, {
                userToken: bitport.getKey(),
                links: url
            },
            function() {
                cb();
            })
    };
};

/* TODO allow to upload file */