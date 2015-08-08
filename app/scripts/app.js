//"use strict";

var app = angular.module("App",[]);


app.service("chrome", function($q) {
	
	function sendMsg(config){
		var defer = $q.defer();
		chrome.runtime.sendMessage(config,function(data){
			defer.resolve(data);
		})
		return defer.promise;
	}
    return {
		isLoggedIn:function(){
			return sendMsg({msg:"loggedIn"});
		},
        queue: function(cb) {
            return sendMsg({msg:"queue"});
        },
        addedTorrents: function(cb) {
			return sendMsg({msg:"addedTorrents"});
        },
		torrentStatus: function(cb) {
			return sendMsg({msg:"torrentStatus"});
        },
		newTab:function(url){
			chrome.tabs.create({
                url: url
            });
		},
		 
    };
});






app.controller("LoginController", ["chrome", "$scope", "$rootScope","$q",
    function(chrome, $scope, $rootScope,$q) {
		$scope.mainMenu = true;
		function init(){
			chrome.isLoggedIn().then(function(res){
				$scope.mainMenu = !res.loggedIn;
			})
		}
		
		this.launch = function(){
			chrome.newTab("https://bitport.io/login");
		}
		init();
    }
]);







app.controller("MainMenuController", ["$scope", "$http", "bitport", "chrome",
    function($scope, $http, bitport, chrome) {
		
		function init(){
			chrome.addedTorrents().then(function(){});
			chrome.torrentStatus().then(function(){});
			// Ask the background page for anything
			// in progress
			// waiting to be queued..
		}
		
        this.queue = function() {
            chrome.queue(function(res) {
                console.log(res);
            })
        };

        this.query = function() {
            chrome.queue(function(res) {
                console.log(res);
            });
        };

        this.torrents = function() {
            chrome.torrents(function(res) {
                console.log(res);
            })
        };
		
		init();
    }
]);
