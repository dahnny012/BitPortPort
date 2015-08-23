//"use strict";

var app = angular.module("App", []);


app.service("chrome", function($q) {

    function sendMsg(config) {
        var defer = $q.defer();
        chrome.runtime.sendMessage(config, function(data) {
            defer.resolve(data);
        })
        return defer.promise;
    }
    return {
        isLoggedIn: function() {
            return sendMsg({
                msg: "loggedIn"
            });
        },
        queue: function(cb) {
            return sendMsg({
                msg: "queue"
            });
        },
        addedTorrents: function(cb) {
            return sendMsg({
                msg: "addedTorrents"
            });
        },
        torrentStatus: function(cb) {
            return sendMsg({
                msg: "torrentStatus"
            });
        },
        newTab: function(url) {
            chrome.tabs.create({
                url: url
            });
        },
        myFiles: function() {
            return sendMsg({
                msg: "myFiles"
            });
        },
        removeAdded: function(index) {
            return sendMsg({
                msg: "removeAdded",
                index: index
            });
        }

    };
});






app.controller("LoginController", ["chrome", "$scope", "$rootScope", "$q",
    function(chrome, $scope, $rootScope, $q) {
        $scope.loggedIn = false;

        function init() {
            $rootScope.statusMessage = "Checking to see if you are logged In";
            chrome.isLoggedIn().then(function(res) {
                if (res.loggedIn) {
                    $rootScope.$broadcast("loggedIn");
                } else {
					$rootScope.statusMessage = 
						res.error ? res.error : "You are not logged in.";
                }
                $scope.loggedIn = res.loggedIn;
            })
        }

        this.launch = function() {
            chrome.newTab("https://bitport.io/login");
        }
        init();
    }
]);







app.controller("MainMenuController", ["$scope", "$http", "chrome", "$rootScope",
    function($scope, $http, chrome, $rootScope) {
		$scope.tab ={ 
			"active":{
				count:0,
				loading:true
			},
			"added":{
				count:0,
				loading:true
			},
			"waiting":{
				count:0,
				loading:true
			},
			"finished":{
				count:0,
				loading:true
			}};
        function init() {
            chrome.addedTorrents().then(function(data) {
                $scope.addedTorrents = data;
				updateTab("added",data.length);
            });
            chrome.torrentStatus().then(function(data) {
				updateTab("waiting",data.waitingTransfers.length);
                $scope.waiting = data.waitingTransfers;
				updateTab("active",data.activeTransfers.length);
                $scope.active = data.activeTransfers;
            });

            chrome.myFiles().then(function(data) {
				updateTab("finished",data.length)
                $scope.finished = data;
            })
        }
		function setLoading(){
			$scope.tab["active"].loading = true;
			$scope.tab["added"].loading = true;
			$scope.tab["waiting"].loading = true;
			$scope.tab["finished"].loading = true;
		}
		
		function updateTab(key,count){
			$scope.tab[key].count = count;
			$scope.tab[key].loading=false;
		}

        this.queue = function() {
            chrome.queue().then(function() {
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

        this.remove = function(index) {
            chrome.removeAdded(index).then(function(data) {
				if(data.error){
                $scope.addedTorrents[index].error = true;
				$scope.addedTorrents[index].status = data.error;
				}else{
					$scope.addedTorrents = data;
				}
            })
        }


        this.openUrl = function(url) {
            chrome.newTab(url);
        }

        $rootScope.$on("loggedIn", function() {
            $rootScope.statusMessage = "Welcome to BitPort Port";
            $scope.mainMenu = true;
            init();
        })
    }
]);
