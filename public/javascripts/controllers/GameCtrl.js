/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function GameCtrl($rootScope, $scope, $routeParams, $location, User, $mdDialog, Window) {

        var game_state = "";

        var STATE_BEFORE_START = 'before start';
        var STATE_PLAYING = 'playing';
        var STATE_GAME_OVER = 'game over';

        // Key codes
        var KEY_A=65;
        var KEY_Z=90;
        var KEY_E=69;
        var KEY_R=82;
        var KEY_SPACE=32;

        var KEY_LEFT=37;
        var KEY_RIGHT=39;
        var KEY_UP=38;
        var KEY_DOWN=40;

        var win; // The window (I'd call it window but that's a reserved word)
        var keys;
        var player1;
        var player2;
        var controlPlayer;
        var opponentPlayer;
        var interval;
        var intervalPositions;
        var lastTimeStamp = 0;

        $scope.socket = io.connect("//"+ window.location.hostname + ":3333", {"force new connection": true});
        $scope.room = $routeParams;
        $scope.rival = null;
        $rootScope.disabledLogout = true;

        $scope.user = new User($rootScope.user.username, $rootScope.user.nbParts,  $rootScope.user.nbWins,  $rootScope.user.nbLoss, $rootScope.user.id);

        $scope.socket.on("connect", function() {
            $scope.socket.emit("ADD_USER", $scope.user, $scope.room);
        });

        $scope.socket.on("USER_ACCEPTED", function(){

        });

        $scope.socket.on("DISCONNECTED_USER", function(user){
            $scope.socket.disconnect();
        });

        $scope.socket.on("disconnect", function(){
            $scope.socket.disconnect();
            $location.path("/chat");
            $scope.$apply();
        });

        $scope.socket.on("SYNC_POSITION", function($x, $user){
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.x = $x;
            }
        });


        $scope.socket.on("START_GAME", function(users){
            $scope.user.nbParts = $scope.user.nbParts + 1;
            $scope.user.update();

            (function() {
                win = new Window(800, 600, users, $scope.user);

                resetGameState();

                document.addEventListener("keydown", function(event) {
                    // What a horrible hack, only allow the players to when the key is pressed
                    // down and ignore hold down jump keys.
                    if (event.which == KEY_UP && !keys.isPressed(KEY_UP)) {
                        $scope.socket.emit("KEY_UP", $scope.user);
                    }

                    if (event.which == KEY_LEFT) {
                        $scope.socket.emit("KEY_LEFT", $scope.user);
                    }

                    if (event.which ==  KEY_RIGHT) {
                        $scope.socket.emit("KEY_RIGHT", $scope.user);
                    }

                    if (event.which ==  KEY_DOWN) {
                        $scope.socket.emit("KEY_DOWN", $scope.user);
                    }

                    if (event.which ==  KEY_E) {
                        $scope.socket.emit("KEY_E", $scope.user);
                    }

                    if (event.which ==  KEY_SPACE) {
                        if(!controlPlayer.THROW_COOLDOWN) {
                            $scope.socket.emit("KEY_SPACE", $scope.user);
                        }
                    }

                    keys.down(event.which);

                });

                document.addEventListener("keyup", function(event) {

                    if (event.which ==  KEY_LEFT) {
                        $scope.socket.emit("KEY_LEFT_STOP", $scope.user);
                    }

                    if (event.which == KEY_RIGHT) {
                        $scope.socket.emit("KEY_RIGHT_STOP", $scope.user);
                    }

                    if (event.which == KEY_DOWN) {
                        $scope.socket.emit("KEY_DOWN_STOP", $scope.user);
                    }

                    if (event.which == KEY_E) {
                        $scope.socket.emit("KEY_E_STOP", $scope.user);
                    }

                    keys.up(event.which);
                });

                interval = setInterval(update, 20);

                intervalPositions = setInterval(syncPositions, 20);

            })();
        });

        $scope.socket.on("KEY_RIGHT", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.right = true;
            }
        });

        $scope.socket.on("KEY_LEFT", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.left = true;
            }
        });

        $scope.socket.on("KEY_DOWN", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.crouch(true);
            }
        });

        $scope.socket.on("KEY_RIGHT_STOP", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.right = false;
            }
        });

        $scope.socket.on("KEY_LEFT_STOP", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.left = false;
            }
        });

        $scope.socket.on("KEY_DOWN_STOP", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.crouch(false);
            }
        });

        $scope.socket.on("KEY_UP", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.jump();
            }
        });

        $scope.socket.on("PUNCH", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                if (player.punch()) {
                    $scope.socket.emit('HIT_PUNCH', player.other_player.user, player.PUNCH_DAMAGE);
                }
            }
        });

        $scope.socket.on("HIT_PUNCH", function($user, $damage) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.hit_punch($damage);
            }
        });

        $scope.socket.on("HIT_KICK", function($user, $damage) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.hit_kick($damage);
            }
        });

        $scope.socket.on("BLOCK", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.block(true);
            }
        });

        $scope.socket.on("BLOCK_STOP", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.block(false);
            }
        });

        $scope.socket.on("THROW_EM", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                if(player.throw_em()) {
                    $scope.socket.emit('THROWN', player.other_player.user, player.THROW_DAMAGE);
                }
            }
        });

        $scope.socket.on("THROWN", function($user, $damage) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                player.thrown($damage);
            }
        });

        $scope.socket.on("KICK", function($user) {
            var player = getPlayerByUser($user);
            if(player !== undefined) {
                if(player.kick()) {
                    $scope.socket.emit('HIT_KICK', player.other_player.user, player.KICK_DAMAGE);
                }
            }
        });

        $scope.showAlert = function($title) {
            var confirm = $mdDialog.confirm()
                .parent(angular.element(document.body))
                .title($title)
                .ok('Close');
            $mdDialog.show(confirm).then(function() {
                $scope.socket.disconnect();
            }, function() {
                $scope.socket.disconnect();
            });
        };

        function resetGameState() {
            win.reset();

            player1 = win.player1;
            player2 = win.player2;
            player1.other_player = player2;
            player2.other_player = player1;

            controlPlayer = win.controlPlayer;
            opponentPlayer = win.opponentPlayer;

            keys = new KeyWatcher();
            lastTimeStamp = 0;
            game_state = STATE_BEFORE_START;
            setTimeout(startRound, 1000);
        }

        function startRound() {
            game_state = STATE_PLAYING;
            win.startGame();
        }

        function handleInput() {
            if (keys.isPressed(KEY_A)) {
                $scope.socket.emit("KEY_A", $scope.user);
            }
            if (keys.isPressed(KEY_R)) {
                $scope.socket.emit("KEY_R", $scope.user);
            }
        }

        function syncPositions() {
            $scope.socket.emit("SYNC_POSITION", controlPlayer.x, $scope.user);
        }

        window.onhashchange = function() {
            if (!window.innerDocClick) {
                $scope.socket.disconnect();
            }
        };

        function getPlayerByUser($user) {
            if($user !== undefined) {
                if(player1.user.id === $user.id) {
                    return player1;
                }

                if(player2.user.id === $user.id) {
                    return player2;
                }
            }
        }

        function update() {
            var now = new Date().getTime();
            if (lastTimeStamp == 0) {
                var dt = 0;
            } else {
                dt = now - lastTimeStamp;
            }
            lastTimeStamp = now;

            if (game_state == STATE_PLAYING) {
                handleInput();
                player1.update(dt);
                player2.update(dt);

                if (!player1.isAlive() && player2.isAlive()) {
                    if (player1.user.id === $scope.user.id) {
                        $scope.user.nbLoss = $scope.user.nbLoss + 1;
                        $scope.showAlert("You lose !");
                    } else {
                        $scope.user.nbWins = $scope.user.nbWins + 1;
                        $scope.showAlert("You win !");
                    }
                    $scope.user.update();
                    game_state = STATE_GAME_OVER;
                }

                if (player1.isAlive() && !player2.isAlive()) {
                    if (player1.user.id === $scope.user.id) {
                        $scope.user.nbWins = $scope.user.nbWins + 1;
                        $scope.showAlert("You win !");
                    } else {
                        $scope.user.nbLoss = $scope.user.nbLoss + 1;
                        $scope.showAlert("You lose !");
                    }
                    $scope.user.update();
                    game_state = STATE_GAME_OVER;
                }
            }

            win.update(dt);
            win.draw();

        }

        function KeyWatcher() {
            this.keys = {};
            this.lastKey = undefined;

            this.down = function(key) {
                this.keys[key] = true;
                this.lastKey = key;
            };

            this.up = function(key) {
                this.keys[key] = false;
            };

            this.isPressed = function(key) {
                return this.keys[key];
            }
        }

    }

    /** Angular.JS Dependency Injection **/
    GameCtrl.$inject = ["$rootScope", "$scope", "$routeParams", "$location", "User", "$mdDialog", "Window"];

    /** Angular.JS Controller Registration **/
    _JSFight.controller("GameCtrl", GameCtrl);
}());