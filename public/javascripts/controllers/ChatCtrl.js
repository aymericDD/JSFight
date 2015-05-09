/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function ChatCtrl($rootScope, $scope, User, Message) {

        $scope.socket = io.connect('http://localhost:1337', {"force new connection": true});

        $scope.container = document.getElementById("chatMessages");
        $scope.containerNotif = document.getElementById("notification");
        $scope.form = document.forms.chatForm;
        $scope.user = new User($rootScope.user.username, null, null, $rootScope.user.id);
        $scope.usersOnline = [];
        $scope.ChatMessages = [];

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
            var i;
            oldMessages.forEach(function(message){
                $scope.ChatMessages.push(new Message(message.username, message.message, message.timestamp, message._id));
            });

            users.forEach(function(user){
                $scope.usersOnline.push(new User(user.username, null, null, user.id));
            });

            $scope.$digest();

            $scope.container.scrollTop = $scope.container.scrollHeight;

            setOnline();

        });


        /**
         * On new user
         */
        $scope.socket.on('NEW_USER', function (user) {

            if(user) {
                var newUser = new User(user.username, null, null, user.id);
                $scope.usersOnline.push(newUser);
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
                    }
                }
                $scope.$digest();

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

        /**
         * Set online status
         */
        function setOnline() {
            $scope.connected = true;
            popNotification("growl", "scale", "notice", "Online", "online");
        };

        /**
         * Set offline status
         */
        function setOffline() {
            $scope.connected = false;
            popNotification("growl", "scale", "notice", "Offline", "offline");
        }

        $rootScope.DisconnectUser = function DisconnectUser() {
            $scope.socket.disconnect();
            $rootScope.logout();
        };

        function popNotification(layout, effect, type, message, $class) {
            var Notifs = $scope.containerNotif.getElementsByTagName("div");
            var Notif = null;

            if(typeof Notifs !== 'undefined') {
                Notif = Notifs[0];

                if(typeof Notif !== 'undefined') {
                    if(Notif.classList.contains($class)){
                        return false;
                    }
                }
            }

            var ntf = document.createElement('div');
            ntf.className = 'ns-box ns-' + layout + ' ns-effect-' + effect + ' ns-type-' + type + ' ns-show ' + $class;
            var strinner = '<div class="ns-box-inner">';
            strinner += message;
            strinner += '</div>';
            strinner += '<span class="ns-close"></span></div>';
            ntf.innerHTML = strinner;

            ntf.querySelector('.ns-close').addEventListener('click', function(){this.parentNode.remove()});

            $scope.containerNotif.innerHTML = "";
            $scope.containerNotif.appendChild(ntf);

        };

    }


    /** Angular.JS Dependency Injection **/
    ChatCtrl.$inject = ["$rootScope", "$scope", "User", "Message"];

    /** Angular.JS Controller Registration **/
    _JSFight.controller("ChatCtrl", ChatCtrl);
}());