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

        Message.prototype.getAllMessages = function(){
            $http.get("/api/v1/auth/logout")
                .success(function (data) {
                    return next(null, data);
                })
                .error(function (data) {
                    return next(data, null);
                });
        };

        return Message;
    }

    /** Angular.JS Dependency Injection **/
    MessageFactory.$inject = ["$http"];

    /** Angular.JS Factory Registration **/
    _JSFight.factory("Message", MessageFactory);
}());