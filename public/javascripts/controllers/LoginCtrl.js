/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function LoginCtrl($scope, User, $location) {
        $scope.user = new User();
        $scope.message = "";
        $scope.messageType = "";

        /**
         * Check if user is logged
         */
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

        /**
         * Check if user can be registered and save it into databases
         */
        $scope.doRegister = function doRegister() {
            $scope.messageType = "";
            $scope.message = "";

            $scope.user.register(function (err, result) {
                if (err) {
                    $scope.messageType = "danger";
                    switch (err.error) {
                        case "USERNAME_ALREADY_TAKEN":
                            $scope.message = "Username already in use";
                            break;
                        case "PASSWORD_NOT_EQUALS":
                            $scope.message = "Password does not match";
                            break;
                        case "PASSWORD_CANT_BE_EMPTY":
                            $scope.message = "Empty Password Field";
                            break;
                        default:
                            $scope.message = "Error while creating your account, please check your informations";
                            break;
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