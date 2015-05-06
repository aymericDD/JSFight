/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function ChatCtrl($rootScope, $scope, User, $location) {

        $scope.socket = io.connect('http://localhost:1337', {"force new connection": true});

        if($scope.socket.disconnect) {
            $scope.socket.connect();
        }

        $scope.container = document.getElementById("chatMessages");
        $scope.containerUsers = document.getElementById("content-online");
        $scope.containerNotif = document.getElementById("notification");
        $scope.statusConnected = document.getElementById("statusConnected");
        $scope.statusDisconnected = document.getElementById("statusDisconnected");
        $scope.form = document.forms.chatForm;
        $scope.username;
        $scope.messages = [];

        /**
         *  On username requested
         */
        $scope.socket.on('USERNAME_REQUIRED', function () {

            // If username is not defined get username
            $scope.username = (localStorage.getItem("username"))? localStorage.getItem("username") : $scope.user.username;

            $scope.socket.emit('USERNAME_CHOSEN', $scope.username);

        });

        /**
         * On validation user
         */
        $scope.socket.on('USERNAME_ACCEPTED', function (oldMessages, usersname) {
            var i;

            $scope.messages = oldMessages;
            $scope.usersName = usersname;

            $scope.setUsernameLocalStorage($scope.username);

            $scope.printMessages();

            $scope.printUsersOnline();

            $scope.setOnline();
        });

        /**
         * On new user
         */
        $scope.socket.on('NEW_USER', function (data) {

            $scope.usersName.push(data);
            $scope.addUser("NEW_USER", data);

        });

        /**
         * On new message submit by another user
         */
        $scope.socket.on('NEW_MESSAGE', function (data) {

            $scope.addMessage("NEW_MESSAGE", data.username, data.message);
            $scope.messages.push(data);

        });

        /**
         * When user is disconnected update list user connected
         */
        $scope.socket.on('USER_DISCONNECTED', function(data) {
            if(data !== null) {
                $scope.usersName.splice($scope.usersName.indexOf(data), 1);
                $scope.printUsersOnline();
            }
        });

        /**
         * On connect
         */
        $scope.socket.on("connect", function() {
            $scope.setOnline();
        });

        /**
         * On disconnect
         */
        $scope.socket.on('disconnect', function () {
            $scope.setOffline();
        });

        /**
         * On connect error
         */
        $scope.socket.on('connect_failed', function () {
            $scope.setOffline();
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
         * Show all message in dom
         */
        $scope.printMessages = function printMessages() {
            var i;

            //Cleaning chat area
            while ($scope.container.firstChild) {
                $scope.container.removeChild($scope.container.firstChild);
            }

            //Printing all messages
            for (i = 0; i < $scope.messages.length; i += 1) {
                $scope.addMessage("NEW_MESSAGE", $scope.messages[i].username, $scope.messages[i].message);
            }

        };

        /**
         * Show all user connected in dom
         */
        $scope.printUsersOnline = function printUsersOnline() {
            var i;

            //Cleaning users online area
            while ($scope.containerUsers.firstChild) {
                $scope.containerUsers.removeChild($scope.containerUsers.firstChild);
            }

            //Printing all users online
            for (i = 0; i < $scope.usersName.length; i += 1) {
                $scope.addUser("NEW_USER", $scope.usersName[i]);
            }

        };

        /**
         * Add a message into dom
         *
         * @param string type ex(NEW_MESSAGE)
         * @param string username
         * @param string message
         */
        $scope.addMessage = function addMessage(type, username, message)
        {
            var element = document.createElement("p");
            if(type === "NEW_MESSAGE") {
                element.innerHTML = "<strong>" + username + "</strong> : " + message;
            }else {
                element = null;
                return;
            }

            $scope.container.appendChild(element);
            element = null;
            $scope.container.scrollTop = $scope.container.scrollHeight;

        };

        /**
         * Add user into dom
         *
         * @param string type ex(NEW_USER)
         * @param username
         */
        $scope.addUser = function addUser(type, username)
        {
            var element = document.createElement("p");
            if(type === "NEW_USER") {
                element.innerHTML = username;
            }else {
                element = null;
                return;
            }

            $scope.containerUsers.appendChild(element);

            element = null;
        };

        /**
         * Set online status
         */
        $scope.setOnline = function setOnline() {
            $scope.connected = true;
            $scope.createNotification("growl", "scale", "notice", "Online", "online");
        };

        /**
         * Set offline status
         */
        $scope.setOffline = function setOffline() {
            $scope.connected = false;
            $scope.createNotification("growl", "scale", "notice", "Offline", "offline");
        }

        /**
         * Set the username into localstorage
         * @param string username
         */
        $scope.setUsernameLocalStorage = function setUsernameLocalStorage(username) {
            window.localStorage.setItem("username", username);
        };


        $rootScope.DisconnectUser = function DisconnectUser() {
            $scope.socket.disconnect();
            $rootScope.logout();
        };

        $scope.createNotification = function setNotification(layout, effect, type, message, $class) {
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
    ChatCtrl.$inject = ["$rootScope", "$scope", "User", "$location"];

    /** Angular.JS Controller Registration **/
    _JSFight.controller("ChatCtrl", ChatCtrl);
}());