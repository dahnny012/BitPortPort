//"use strict";

var app = angular.module("App");



app.service("bitport", ["$http", "$q"], function($http, $q) {
    var base = "https://bitport.io/";
    return {
        query: function() {

        },
        loggedIn: function() {
            var defer = $q.defer();
            $http.get(base).success(function(response) {
                var menu = $(response).find("#main-menu");
                defer.resolve(menu.length <= 0);
            });
            return defer.promise
        }
    };
});

app.service("chrome", function() {
    return {
        queue: function(cb) {
            chrome.runtime.sendMessage({
                msg: "queue"
            }, cb);
        },
        query: function(cb) {
            chrome.runtime.sendMessage({
                msg: "query"
            }, cb);
        },
        torrents: function(cb) {
            chrome.runtime.sendMessage({
                msg: "torrents"
            }, cb);
        }
    };
})






app.controller("LoginController", ["$http", "bitport", "$scope", "$rootScope",
    function($http, bitport, $scope, $rootScope) {

        function setState() {
            bitport.loggedIn.then(function(status) {
                if (status) {
                    $rootScope.mainMenu = true;
                } else {
                    $rootScope.mainMenu = false;
                }
            })
        }

        this.launch = function() {
            chrome.tabs.create({
                url: "https://bitport.io/login"
            });
        };

        /* Run app */
        $rootScope.mainMenu = false;
        setState();
    }
]);







app.controller("MainMenuController", ["$rootScope", "$http", "bitport", "chrome",
    function($rootScope, $http, bitport, chrome) {
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
    }
]);
