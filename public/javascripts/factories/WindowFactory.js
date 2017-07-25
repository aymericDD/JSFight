/**
 * Created by Rico on 16/05/2015.
 */

"use strict";

(function() {
    var _JSFight = angular.module("JSFight");

    function WindowFactory(Player) {
        var ORIGIN_VERTICAL_OFFSET=100;
        var SPRITE_HALF_WIDTH = 96/2;
        var INITIAL_PLAYER_SEPARATION = 200;

        var game_over = document.getElementById("game_over");
        var fight = document.getElementById("fight");

        var player1;
        var player2;
        var controlPlayer;
        var opponentPlayer;

        var win;

        function Window(width, height, users, user, canvas) {
            win = this;

            this.width = width;
            this.height = height;

            var player_offset = this.width/2 - INITIAL_PLAYER_SEPARATION;

            users.forEach(function($user, index){
                if($user.id === user.id) {
                    if(index === 0){
                        controlPlayer = player1 = new Player(player_offset, 'images/character.png', true, true, $user);
                        opponentPlayer = player2 = new Player(win.right() - player_offset, 'images/character_2.png', false, false, users[1]);
                    }else {
                        opponentPlayer = player1 = new Player(player_offset, 'images/character.png', true, false, users[0]);
                        controlPlayer = player2 = new Player(win.right() - player_offset, 'images/character_2.png', false, true, $user);
                    }
                }
            });

            this.player1 = player1;
            this.player2 = player2;
            this.controlPlayer = controlPlayer;
            this.opponentPlayer = opponentPlayer;

            this.canvas = document.getElementById("canvas");

            this.canvas.setAttribute('width', width);
            this.canvas.setAttribute('height', height);
            this.context = this.getContext();

            // Flip y-axis, move camera down so (0, 0) isn't touching bottom of this
            this.context.transform(1, 0, 0, -1, 1, 1);
            this.context.translate(0, -height + ORIGIN_VERTICAL_OFFSET);

        }

        Window.prototype.gameOver = function() {
            game_over.style.display = 'block';
        };


        Window.prototype.reset = function() {
            game_over.style.display = 'none';
            fight.style.display = 'block';
        };

        Window.prototype.startGame = function() {
            fight.style.display = 'none';
        };

        Window.prototype.getContext = function() {
            return this.canvas.getContext('2d');
        };

        Window.prototype.top = function() {
            return this.height - ORIGIN_VERTICAL_OFFSET;
        };

        Window.prototype.right = function() {
            return this.width;
        };

        Window.prototype.update = function(dt) {

            // Don't let the players past the left edge of the screen
            var min_player_x = SPRITE_HALF_WIDTH;
            if (this.player1.x < min_player_x) {
                this.player1.x = min_player_x;
            }
            if (this.player2.x < min_player_x) {
                this.player2.x = min_player_x;
            }
            // Don't le the players past the right edge of the screen
            var max_player_x = this.width - SPRITE_HALF_WIDTH;
            if (this.player1.x > max_player_x) {
                this.player1.x = max_player_x;
            }
            if (this.player2.x > max_player_x) {
                this.player2.x = max_player_x;
            }
        };

        Window.prototype.drawPlayer = function(player) {
            var x = player.x;
            var y = player.y;
            player.sprite.drawAt(this.context, x, player.y, !player.facing_right);
        };

        Window.prototype.draw = function() {
            // Sky
            this.context.fillStyle = '#aaf';
            this.context.fillRect(0, 0, this.width, this.height);

            // Ground
            this.context.fillStyle = '#353';
            this.context.fillRect(0, 25, this.width, -this.height);

            // Sprites
            this.drawPlayer(this.player1);
            this.drawPlayer(this.player2);

            // HUD
            this.drawHealth(10, this.top() - 20, this.player1);
            this.drawHealth(this.width - 110, this.top() - 20, this.player2);
        };

        Window.prototype.drawHealth = function(x, y, player) {
            this.context.fillStyle = '#FF0';
            this.context.strokeStyle = '#FF0';
            this.context.strokeRect(x, y, 100, 10);
            this.context.fillRect(x, y, player.health, 10);
        };

        return Window;
    }

    /** Angular.JS Dependency Injection **/
    WindowFactory.$inject = ["Player"];

    _JSFight.factory("Window", WindowFactory);
}());