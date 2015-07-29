function Bitport() {
    this.userToken = "";
    this.loggedIn = false;
}

Bitport.prototype.homeUrl = "https://bitport.io/";
Bitport.prototype.addUrl = "https://fes.bitport.io/torrentInfoService/v1/torrent/add/";
Bitport.prototype.queueUrl = "https://bitport.io/to-queue";


function run_tests(){
    function assert(cond, msg,msgPassed) {
	   if (!cond)
		  throw (msg);
	   else{
	       	console.log(msgPassed);
	   }  
    }
    
    function describe(name,cb){
        cb(name);
    }
    
   var bitport;
   describe("Can Init",function(name){
       bitport = new Bitport();
       assert(bitport != null,"Bitport is null",name);
   })
   
   describe("Can make a Request",function(name){
       request({url:"https://bitport.io"}).then(function(err,status,data){
           assert(data != undefined,"Could not make a request",name);
       })
   })
   
   describe("Can login",function(name){
       //bitport.login(function(){
           
       //})
   })
   
}
function request(config){
    var defer = $.Deferred();
    var resolve = function(err,status,data){
            defer.resolve(err,status,data)
        };
    if(config.data){
        $.post(config.url,config.data,resolve);
    }else{
        $.get(config.url,function(err,status,data){
            defer.resolve(err,status,data);
        });
    }
    return defer.promise();
}
Bitport.prototype.login=function(user,name){
    var defer = $.Deferred(); 
    var config = {
        url:"https://bitport.io/login"
    };
    request(config).then(function(err,status,data){
          defer.resolve(data);
    })
    return defer.promise();
}



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
                userToken: bitport.userToken,
                links: url
            },
            function() {
                cb();
            })
    };
};

/* TODO allow to upload file */