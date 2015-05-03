/*global angular, window */

"use strict";

(function () {

    function ApplicationConfiguration($routeProvider, $translateProvider) {

        $translateProvider.translations('en', window._ApplicationTranslations.en);
        $translateProvider.translations('fr', window._ApplicationTranslations.fr);
        $translateProvider.preferredLanguage('fr');

        var routerResolvers = {
            checkNotLoggedIn: function checkNotLoggedIn($q, User, $location, $rootScope) {
                return $q(function (resolve, reject) {
                    User.load(function (err, user) {
                        if (err || !user) {
                            return resolve();
                        }

                        $rootScope.user = user;

                        $location.path('/');
                        return reject();
                    });
                });
            },
            checkLoggedIn: function checkLoggedIn($q, User, $location, $rootScope) {
                return $q(function (resolve, reject) {
                    User.load(function (err, user) {
                        if (err || !user) {
                            $location.path('/login');
                            return reject();
                        }

                        $rootScope.user = user;

                        return resolve();
                    });
                });
            }
        };

        routerResolvers.checkNotLoggedIn.$inject = ["$q", "User", "$location", "$rootScope"];
        routerResolvers.checkLoggedIn.$inject = ["$q", "User", "$location", "$rootScope"];

        $routeProvider
            .when('/login', {
                templateUrl: '/ng/login',
                controller: 'LoginCtrl',
                resolve: { notLoggedIn: routerResolvers.checkNotLoggedIn }
            })
            .when('/', {
                templateUrl: '/ng/lobby',
                resolve: { notLoggedIn: routerResolvers.checkLoggedIn }
            })
            .otherwise({
                redirectTo: '/login'
            });
    }

    ApplicationConfiguration.$inject = ["$routeProvider", "$translateProvider"];

    function ApplicationRun($rootScope, User, $location, $translate) {
        $rootScope.logout = function logout() {
            User.logout(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                $rootScope.user = null;

                return $location.path('/login');
            });
        };

        $rootScope.setLanguage = function setLanguage(languageCode) {
            $translate.use(languageCode);
        };
    }

    ApplicationRun.$inject = ["$rootScope", "User", "$location", "$translate"];

    angular.module("JSFight", ['ngSanitize', 'ngRoute', 'pascalprecht.translate'])
        .config(ApplicationConfiguration)
        .run(ApplicationRun);
}());