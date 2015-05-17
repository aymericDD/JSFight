/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function MessageFactory() {
        function Message(username, message, timestamp,id) {
            this.username = username;
            this.message = message;
            this.timestamp = timestamp;
            this.id = id;
        }

        return Message;
    }

    /** Angular.JS Dependency Injection **/
    MessageFactory.$inject = ["$http"];

    /** Angular.JS Factory Registration **/
    _JSFight.factory("Message", MessageFactory);
}());