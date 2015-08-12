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
		myFiles:function(){
			return sendMsg({msg:"myFiles"});
		},
		removeAdded:function(index){
			return sendMsg({
				msg:"removeAdded",
				index:index
			});
		}
		 
    };
});






app.controller("LoginController", ["chrome", "$scope", "$rootScope","$q",
    function(chrome, $scope, $rootScope,$q) {
		$scope.loggedIn = false;
		function init(){
			$rootScope.statusMessage = "Checking to see if you are logged In";
			chrome.isLoggedIn().then(function(res){
				if(res.loggedIn){
					$rootScope.$broadcast("loggedIn");
				}else{
					$rootScope.statusMessage = "You are not logged in.";
				}
				$scope.loggedIn = res.loggedIn;
			})
		}
		
		this.launch = function(){
			chrome.newTab("https://bitport.io/login");
		}
		init();
    }
]);







app.controller("MainMenuController", ["$scope", "$http", "chrome","$rootScope",
    function($scope, $http, chrome,$rootScope) {
		
		function init(){
			chrome.addedTorrents().then(function(data){
				$scope.addedTorrents = data;
			});
			chrome.torrentStatus().then(function(data){
				$scope.waiting = data.waitingTransfers;
				
				$scope.active = data.activeTransfers;
			});
			
			chrome.myFiles().then(function(data){
				$scope.finished = data;
			})
		}
		
        this.queue = function() {
            chrome.queue().then(function(){
				init();
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
		
		this.remove = function(index){
			chrome.removeAdded(index).then(function(data){
				$scope.addedTorrents = data;
			})
		}
		
		
		this.openUrl = function(url){
			chrome.newTab(url);
		}
		
		$rootScope.$on("loggedIn",function(){
			$rootScope.statusMessage = "Welcome to BitPort Port";
			$scope.mainMenu = true;
			init();
		})
    }
]);
