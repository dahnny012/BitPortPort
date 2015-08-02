Bitport.prototype.torrentTable = function(html) {
    var table = [];
    var children = $(html).find("#queue-items").find("tr").each(function(i, e) {
        var rows = $(e).find("td");
        var torrent = {};
        var prop = 0;
        rows.each(function(i, node) {
            switch (node.className) {
                case "td-name":
                    torrent.name = node.innerText;
                    prop++;
                    break;
                case "td-weak":
                    torrent.size = node.innerText;
                    prop++;
                    break;
                case "td-status":
                    torrent.status = node.innerText;
                    prop++;
                    break;
                case "align-right td-folder":
                    torrent.dir = node.innerText;
                    prop++;
                    break;
                case "td-remove":
                    torrent.remove = "https://bitport.io/" + $(node).find("a").attr("href");
                    prop++;
                    break;
            }
        });
        if (prop > 0) {
            table.push(torrent);
        }
    });
    return table;
}

Bitport.prototype.getAddedTorrents = function() {
    var _this = this;
    return request({
            url: "https://bitport.io/recapitulation"
        })
        .then(function(data, status, xhr) {
            var torrents = _this.torrentTable(data);
            _this.addedTorrents = torrents;
            return true;
        })
};


/*
Bitport.prototype.login=function(user,name){ 
    var config = {
        url:"https://bitport.io/login"
    };
    return request(config).then(function(data,status,xhr){
        var token =$(data).find("#frm-signInForm-_token_").val();
        var credentials={
        url: "https://bitport.io/login?do=signInForm-submit",
            data:{
                email:"dahnny012@sharklasers",
                password:"password123",
                _token_:token
            }
        }
        request(credentials).then(function(data,status,xhr){
            console.log(data);
            console.log(xhr.getResponseHeader('Set-Cookie'))
        });
    })
}
*/



Bitport.prototype.removeAddedTorrent = function(index) {
    if (index > this.addedTorrents.length) {
        console.log("Index not in range");
        return;
    }
    var target = this.addedTorrents[index];
    return request({
        url: target.remove
    });
}