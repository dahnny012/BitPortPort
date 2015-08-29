//"use strict";

var app = angular.module("App", []);


app.service("chrome", function($q,$timeout) {

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
        },
		deleteTransfer:function(index){
			return sendMsg({
                msg: "deleteTransfer",
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
            refresh("active")
			refresh("added");
			refresh("finished");
        }
		
		function refresh(key){
			setLoading(key);
			switch(key){
				case "active":
				case "waiting":
				 chrome.torrentStatus().then(function(data) {
					updateTransfers(data);
					if(data.activeTransfers.length > 0){
						pollActiveTorrents();
					}
				});
				break;
				case "added":
				chrome.addedTorrents().then(function(data) {
					updateAdded(data);
				});
				break;
				case "finished":
				chrome.myFiles().then(function(data) {
					updateTab("finished",data.length)
					$scope.finished = data;
				})
				break;
			}
		}
		function setLoadingAll(){
			$scope.tab["active"].loading = true;
			$scope.tab["added"].loading = true;
			$scope.tab["waiting"].loading = true;
			$scope.tab["finished"].loading = true;
		}
		
		function setLoading(key){
			$scope.tab[key].loading = true;
		}
		
		function updateTab(key,count){
			$scope.tab[key].count = count;
			$scope.tab[key].loading = false;
		}
		
		function pollActiveTorrents() {
			setLoading("active");
			chrome.torrentStatus().then(function (data) {
				updateTransfers(data);
				if (data.activeTransfers.length) {
					pollActiveTorrents();
				}
            });
		}
		
		function updateTransfers(data){
			updateTab("waiting",data.waitingTransfers.length);
            $scope.waiting = data.waitingTransfers;
			updateTab("active",data.activeTransfers.length);
            $scope.active = data.activeTransfers;
		}
		function updateAdded(data){
			$scope.addedTorrents = data;
			updateTab("added",data.length);
		}
		
		/* 
			Scoped Controller Functions
		*/

		this.setActive = function(key){
			$scope.currentTab = key;
			refresh(key);
		}
		
		
        this.queue = function() {
			setLoadingAll();
            chrome.queue().then(function() {
                init();
            })
        };

        this.remove = function(index) {
			setLoading("added");
            chrome.removeAdded(index).then(function(data) {
				if(data.error){
                	$scope.addedTorrents[index].error = true;
					$scope.addedTorrents[index].status = data.error;
				}else{
					updateAdded(data);
				}
            })
        }
		
		this.deleteTransfer = function(index) {
			setLoading("added");
            chrome.deleteTransfer(index).then(function(data) {
				if(data.error){
					console.log("ERRRORR IN UPDATING TRANSFERS")
					updateTransfers(data);
				}else{
					updateTransfers(data);
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



app.filter('toPercent', function() {
  return function(input) {
    input = (input * 100).toFixed(2);
	return input + "%";	
  };
})

app.filter('default', function() {
  return function(input) {
    var regex = /[^_A-Z]+/g
	var matches = input.match(regex);
	return  matches.map(function(e){
		var firstLetter = e[0].toUpperCase();
		var str = firstLetter;
		if(e.length > 1){
			str+= e.substr(1,e.length-1);
		}
		return str;
	}).join(" ");
  };
})
