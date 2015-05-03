/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function LoginCtrl($scope, User, $location) {

        $scope.user = new User();
        $scope.message = "";
        $scope.messageType = "";

        $scope.doLogin = function doLogin() {
            $scope.messageType = "";
            $scope.message = "";

            $scope.user.login(function (err, result) {
                if (err) {
                    $scope.messageType = "danger";
                    if (err.error === "INVALID_PASSWORD") {
                        $scope.message = "Invalid Password";
                    } else if (err.error === "INVALID_USERNAME") {
                        $scope.message = "Invalid Username";
                    } else {
                        $scope.message = "Error while logging you in, please check your informations";
                    }
                    return;
                }

                $scope.messageType = "Logging successful, launching the application...";
                $scope.message = "success";

                $location.path("/");
            });
        };

        $scope.doRegister = function doRegister() {
            $scope.messageType = "";
            $scope.message = "";

            $scope.user.register(function (err, result) {
                if (err) {
                    $scope.messageType = "danger";
                    if (err.error === "USERNAME_ALREADY_TAKEN") {
                        $scope.message = "Username already in use";
                    } else {
                        $scope.message = "Error while creating your account, please check your informations";
                    }
                    return;
                }

                $scope.messageType = "Registration successful, launching the application...";
                $scope.message = "success";

                $location.path("/");
            });
        };
    }

    /** Angular.JS Dependency Injection **/
    LoginCtrl.$inject = ["$scope", "User", "$location"];

    /** Angular.JS Controller Registration **/
    _JSFight.controller("LoginCtrl", LoginCtrl);
}());