/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function ChatCtrl($rootScope, $scope, $location, User, Message, $mdToast, $animate, $mdDialog, $mdUtil,  $timeout, $log, $mdSidenav) {

        $scope.socket = io.connect('//'+ window.location.hostname + ':1337', {"force new connection": true});

        $scope.container = document.getElementById("chatMessages");
        $scope.containerNotif = document.getElementById("notification");
        $scope.form = document.forms.chatForm;
        $scope.user = new User($rootScope.user.username, $rootScope.user.nbParts,  $rootScope.user.nbWins,  $rootScope.user.nbLoss, $rootScope.user.id);
        $scope.AllUsers = [];
        $scope.usersOnline = [];
        $scope.ChatMessages = [];

        $rootScope.disabledLogout = false;

        $scope.loading = true;

        $scope.toastPosition = {
            bottom: true,
            top: false,
            left: true,
            right: false
        };

        $scope.toggleRight = buildToggler('right');

        $scope.close = function () {
            $mdSidenav('right').close()
                .then(function () {
                    $log.debug("close RIGHT is done");
                });
        };

        /**
         *  On user request
         */
        $scope.socket.on('USER_REQUIRED', function () {

            // If user is not defined get user
            $scope.socket.emit('USER_CHOSEN', $scope.user);

        });

        /**
         * On validation user
         */
        $scope.socket.on('USER_ACCEPTED', function (oldMessages, users) {
            $scope.ChatMessages = [];
            $scope.usersOnline = [];

            var i;
            oldMessages.forEach(function(message){
                $scope.ChatMessages.push(new Message(message.username, message.message, message.timestamp, message._id));
            });

            users.forEach(function(user){
                $scope.usersOnline.push(new User(user.username, user.nbParts, user.nbWins, user.nbLoss, user.id));
            });

            $scope.loading = false;

            $scope.$digest();

            $scope.container.scrollTop = $scope.container.scrollHeight;

            setOnline();

        });


        /**
         * On new user
         */
        $scope.socket.on('NEW_USER', function (user) {

            if(user) {
                var newUser = new User(user.username, user.nbParts, user.nbWins, user.nbLoss, user.id);
                var userAlreadyExist = false;
                $scope.usersOnline.forEach(function($user, index, array){
                    if($user.id === newUser.id) {
                        userAlreadyExist = true;
                    }

                    if (index === (array.length - 1)) {
                        if(!userAlreadyExist){
                            $scope.usersOnline.push(newUser);
                        }
                    }

                });
                $scope.$digest();
            }

        });

        /**
         * On new message submit by another user
         */
        $scope.socket.on('NEW_MESSAGE', function (message) {

            if(message) {
                $scope.ChatMessages.push(new Message(message.username, message.message, message.timestamp, message._id));
                $scope.$digest();
                $scope.container.scrollTop = $scope.container.scrollHeight;
            }

        });

        /**
         * When user is disconnected update list user connected
         */
        $scope.socket.on('USER_DISCONNECTED', function(user) {
            if(user) {
                for(var i =  $scope.usersOnline.length - 1; i >= 0; i--) {
                    if( $scope.usersOnline[i].id === user.id) {
                        $scope.usersOnline.splice(i, 1);
                        $scope.$digest();
                    }
                }

            }
        });

        $scope.socket.on("INVITATION_FIGHT", function(data){
            if(data) {
                $scope.showConfirm(data.user, data.socketId);
            }
        });

        $scope.socket.on("FIGHT", function(room){
            if(room) {
                $scope.socket.disconnect();
                $location.path('/game/' + room);
                $scope.$apply();
            }
        });

        /**
         * On connect
         */
        $scope.socket.on("connect", function() {
            setOnline();
        });

        /**
         * On disconnect
         */
        $scope.socket.on('disconnect', function () {
            setOffline();
        });

        /**
         * On connect error
         */
        $scope.socket.on('connect_failed', function () {
            setOffline();
        });

        /**
         * Event ex("on-click", "on-submit") for send a message
         */
        $scope.sendMessage = function sendMessage()
        {
            if($scope.form.message.value !== ""){
                $scope.socket.emit("SEND_MESSAGE", $scope.form.message.value);
                $scope.form.message.value = "";
            }
        };

        $scope.quickFight = function quickFight() {
            $scope.socket.emit("QUICK_FIGHT", $scope.user);
        };

        $scope.singleFight = function singleFight(userId) {
            if (userId && userId !== $scope.user.id) {
                $scope.socket.emit("SINGLE_FIGHT", userId);
            }
        };

        $rootScope.DisconnectUser = function DisconnectUser() {
            $scope.socket.disconnect();
            $rootScope.logout();
        };

        $scope.showSimpleToast = function(message) {
            if(message){
                var toast = $mdToast.simple()
                    .content(message)
                    .action('Close')
                    .highlightAction(false)
                    .position($scope.getToastPosition());
                $mdToast.show(toast).then(function() {
                    $mdToast.hide();
                });
            }
        };
        $scope.getToastPosition = function() {
            return Object.keys($scope.toastPosition)
                .filter(function(pos) { return $scope.toastPosition[pos]; })
                .join(' ');
        };

        $scope.showConfirm = function(user, socketId) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .parent(angular.element(document.body))
                .title(user.username + ' invited you to fight with him')
                .ok('Fight !')
                .cancel('Refused !')
            $mdDialog.show(confirm).then(function() {
                return $scope.socket.emit("FIGHT_ACCEPTED", user, $scope.user, socketId);
            }, function() {
                return false;
            });
        };

        /**
         * Set online status
         */
        function setOnline() {
            if(!$scope.connected) {
                $scope.connected = true;
                $scope.showSimpleToast('Online chat');
            }
        };

        /**
         * Set offline status
         */
        function setOffline() {
            if($scope.connected) {
                $scope.connected = false;
                $scope.showSimpleToast("Offline chat");
            }
        }

        /**
         * Build handler to open/close a SideNav; when animation finishes
         * report completion in console
         */
        function buildToggler(navID) {
            var debounceFn =  $mdUtil.debounce(function(){
                $mdSidenav(navID)
                    .toggle()
                    .then(function () {
                        $log.debug("toggle " + navID + " is done");
                    });
            },300);
            return debounceFn;
        }

        User.all(function (err, $users) {
            if(err) {
                console.log(err);
            }

            $users.forEach(function($user) {
                $scope.AllUsers.push(new User($user.username, $user.nbParts, $user.nbWins, $user.nbLoss, $user._id));
            });

        });

    }


    /** Angular.JS Dependency Injection **/
    ChatCtrl.$inject = ["$rootScope", "$scope", "$location", "User", "Message", "$mdToast", "$animate", "$mdDialog", "$mdUtil", "$timeout", "$log", "$mdSidenav"];

    /** Angular.JS Controller Registration **/
    _JSFight.controller("ChatCtrl", ChatCtrl);
}());