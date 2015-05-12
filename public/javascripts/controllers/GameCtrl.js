/*global angular */

"use strict";

(function () {
    var _JSFight = angular.module("JSFight");

    function GameCtrl($rootScope, $scope, $routeParams, $location, User) {

        $scope.socket = io.connect("http://localhost:3333", {"force new connection": true});
        $scope.room = $routeParams;
        $scope.users = [];
        $rootScope.disabledLogout = true;

        $scope.user = new User($rootScope.user.username, $rootScope.user.nbParts,  $rootScope.user.nbWins,  $rootScope.user.nbLoss, $rootScope.user.id);

        $scope.socket.on("connect", function() {
            $scope.socket.emit("ADD_USER", $scope.user, $scope.room);
        });

        $scope.socket.on("USER_ACCEPTED", function(){
            //alert('User accepted');
        });

        $scope.socket.on("CONNECT_USER", function(user){
            //alert('User connect');
        });

        $scope.socket.on("DISCONNECTED_USER", function(user){
            //alert('Player 2 disconnected');
            $scope.socket.disconnect();
        });

        $scope.socket.on("disconnect", function(){
            //alert('Allleert !!! Disconnected !!!');
            $scope.socket.disconnect();
            $location.path("/chat");
            $scope.$apply();
        });

        //$scope.$watch($rootScope.logout, function(){
        //    alert('test');
        //});

        $scope.socket.on("START_GAME", function(){
            //alert('start game');
            (function() {
                win = new Window(800, 600);
                resetGameState();

                document.addEventListener("keydown", function(event) {
                    // What a horrible hack, only allow the players to when the key is pressed
                    // down and ignore hold down jump keys.
                    if (event.which == KEY_W && !keys.isPressed(KEY_W)) {
                        player1.jump();
                    }
                    if (event.which == KEY_UP && !keys.isPressed(KEY_UP)) {
                        player2.jump();
                    }

                    keys.down(event.which);
                    if (event.which == KEY_P) {
                        DEBUG=!DEBUG;
                        debug.text = '';
                    }
                    if (event.which == KEY_O) {
                        win.should_scroll = !win.should_scroll;
                    }
                    //if (event.which == KEY_X) {  // Suicide, for testing "game over"
                    //  player1.health = -1;
                    //}
                    if (event.which == KEY_ESC) { // Stop the game (helpful when developing)
                        clearInterval(interval);
                    }
                });

                document.addEventListener("keyup", function(event) {
                    keys.up(event.which);
                });

                interval = setInterval(update, 30);
            })();
        });

        var ORIGIN_VERTICAL_OFFSET=100;
        var SPRITE_HALF_WIDTH = 96/2;
        var game_state = "";
        var coords = "";
        var canvas = document.getElementById("canvas");
        var game_over = document.getElementById("game_over");
        var fight = document.getElementById("fight");
        var debug = document.getElementById('debug');

        function Window(width, height) {
            this.width = width;
            this.height = height;

            this.scroll_speed = .1;
            this.scroll_location = 0;

            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            this.context = this.getContext();

            // Flip y-axis, move camera down so (0, 0) isn't touching bottom of this
            this.context.transform(1, 0, 0, -1, 1, 1);
            this.context.translate(0, -height + ORIGIN_VERTICAL_OFFSET);

            this.sky_ = new Image();
            this.sky_.setAttribute('src', 'images/sky.png');
        }

        Window.prototype.gameOver = function() {
            game_over.style.display = 'block';
        };


        Window.prototype.reset = function() {
            this.scroll_location = 0;
            game_over.style.display = 'none';
            fight.style.display = 'block';
        };

        Window.prototype.startGame = function() {
            fight.style.display = 'none';
        };

        Window.prototype.getContext = function() {
            return canvas.getContext('2d');
        };

        Window.prototype.top = function() {
            return this.height - ORIGIN_VERTICAL_OFFSET;
        };

        Window.prototype.right = function() {
            return this.scroll_location + this.width;
        };

        Window.prototype.update = function(dt) {

            // Don't let the players past the left edge of the screen
            var min_player_x = this.scroll_location + SPRITE_HALF_WIDTH;
            if (player1.x < min_player_x) {
                player1.x = min_player_x;
            }
            if (player2.x < min_player_x) {
                player2.x = min_player_x;
            }
        };

        Window.prototype.drawPlayer = function(player) {
            var x = player.x - this.scroll_location;
            var y = player.y;
            player.sprite.drawAt(this.context, x, player.y, !player.facing_right);

            if (DEBUG) {
                // Draw dot at foot location
                this.context.fillStyle = 'white';
                this.context.fillRect(x-3, player.y-3, 6, 6);

                // Hit box
                this.context.strokeStyle = 'white';
                this.context.fillStyle = 'rgba(255, 255, 0, .5)';
                this.context.beginPath();
                this.context.moveTo(x + player.PUNCH_RANGE/2, player.y);
                this.context.lineTo(x + player.PUNCH_RANGE/2, player.y + 96);
                this.context.lineTo(x - player.PUNCH_RANGE/2, player.y + 96);
                this.context.lineTo(x - player.PUNCH_RANGE/2, player.y);
                this.context.closePath();
                this.context.stroke();
                this.context.fill();
            };
        };

        Window.prototype.draw = function() {
            // Sky
            for (var i=0; i <= this.width; i += 200) {
                this.context.drawImage(this.sky_, 0, 0, 200, 600,
                    i - (this.scroll_location % 200), -ORIGIN_VERTICAL_OFFSET, 200, 600);
            }

            // Ground
            level.drawLevel(this.context, parseInt(this.scroll_location), this.width);

            // Sprites
            this.drawPlayer(player1);
            this.drawPlayer(player2);

            // HUD
            this.drawHealth(10, this.top() - 20, player1);
            this.drawHealth(this.width - 110, this.top() - 20, player2);
        };

        Window.prototype.drawHealth = function(x, y, player) {
            this.context.fillStyle = '#FF0';
            this.context.strokeStyle = '#FF0';
            this.context.strokeRect(x, y, 100, 10);
            this.context.fillRect(x, y, player.health, 10);
        };


        function buildLevel_() {
            var level = [];
            var previous_height = 0;
            var previous_was_hole = false;
            for (var i = 0; i < 5000; i++) {
                // Pick new height based on previous height
                var new_height = previous_height + parseInt((Math.random() - .5) * 3) * 25;

                // Limit heights
                new_height = Math.max(new_height, 0);
                new_height = Math.min(new_height, 400);

                previous_height = new_height;

                // Randomly put some holes in
                // (Don't put 2 holes in a row. No holes at start of level)
                if (i > 8 && !previous_was_hole && Math.random() > .8) {
                    new_height = -900;
                    previous_was_hole = true;
                } else {
                    previous_was_hole = false;
                }

                level.push(new_height);
            }
            return level;
        }

        function Level() {
            // Heights are in pixels
            this.level = buildLevel_();
            this.BLOCK_SIZE=100;


            this.image1_ = new Image();
            this.image1_.setAttribute('src', 'images/ground1.png');
            this.image2_ = new Image();
            this.image2_.setAttribute('src', 'images/ground2.png');

            this.drawLevel = function(context, left_x, width) {
                for (var x = left_x; x <= left_x + width; x += this.BLOCK_SIZE) {
                    var index = this.pixelToHeightIndex_(x);
                    var height = this.getHeightAtPoint(x);
                    var image;
                    if (index % 2) { image = this.image1_ } else { image = this.image2_};
                    context.drawImage(image, 0, 0, 100, 600,
                        index * this.BLOCK_SIZE - left_x, height - 600, 100, 600);
                }
            };

            this.getHeightAtPoint = function(x) {
                var index = this.pixelToHeightIndex_(x);
                return this.level[index];
            };

            this.pixelToHeightIndex_ = function(x) {
                return parseInt(x / this.BLOCK_SIZE);
            }
        }
        /**
         * A rock-hard animating sprite class.
         */

        function AnimatingSprite(resource) {
            var that = this;

            // The containing Image HTMLElement
            this.image_ = new Image();
            this.image_.addEventListener('load', function() { that.setState('idle'); }, this.image_.setAttribute('src', resource));
        }

        function load(url, element)
        {
            req = new XMLHttpRequest();
            req.open("GET", url, false);
            req.send(null);

            element.innerHTML = req.responseText;
        }

        AnimatingSprite.states = {
            'idle': [0],
            'pain': [1],
            'punch_l': [2, 0],
            'punch_r': [3, 0],
            'block': [4],
            'throw': [5],
            'thrown': [7, 8, 9, 10, 10, 0, 0, 0]
        };
        AnimatingSprite.FRAME_TIME = 150;  // milliseconds spent on each frame

        AnimatingSprite.prototype.drawAt = function(dest_context, x, y, flip_x) {
            dest_context.save();
            coords = this.getFrameSpriteCoords_();
            var flip_factor = (flip_x) ? -1 : 1;

            dest_context.translate(x - (flip_factor*48), y + 96);
            dest_context.scale(flip_factor, -1);
            dest_context.drawImage(this.image_,
                coords.x, coords.y, 96, 96,
                0, 0, 96, 96);
            dest_context.restore();
        };

        AnimatingSprite.prototype.setState = function(state) {
            if (AnimatingSprite.states[state] === undefined) {
                return;
            }
            this.currentStateString_ = state;
            this.currentState_ = AnimatingSprite.states[state];
            this.stateStartTime_ = new Date().getTime();
        };

        AnimatingSprite.prototype.getStateFrameNum_ = function() {
            var now = new Date().getTime();
            var elapsed = now - this.stateStartTime_;
            var frameNum = elapsed / AnimatingSprite.FRAME_TIME;
            frameNum = frameNum % this.currentState_.length;
            return parseInt(frameNum);
        };

        AnimatingSprite.prototype.getFrameSpriteCoords_ = function() {
            if (this.currentStateString_ == 'punch_l') {
                //debugger;
            }
            var spriteIndex = this.currentState_[this.getStateFrameNum_()];
            var x = parseInt(spriteIndex % 4) * 96;
            var y = parseInt(spriteIndex / 4) * 96;
            return {x: x, y: y};
        };
        function Player(x, sprite_sheet, facing_right) {
            this.x = x;
            this.dx = 0;
            this.y = level.getHeightAtPoint(x);
            this.dy = 0;
            this.health = 100;
            this.sprite = new AnimatingSprite(sprite_sheet);

            this.facing_right = facing_right;

            this.other_player = null;
            this.jumped = false;

            this.MAX_SPEED = .3;
            this.DX_ACCEL = .05;
            this.DX_DECAY = .02;
            this.PUNCH_TIME = 250;
            this.BLOCK_TIME = 250;
            this.PAIN_TIME = 200;
            this.THROW_TIME = 600;
            this.PUNCH_RANGE = 70;
            this.PUNCH_DAMAGE = 5;
            this.THROW_DAMAGE = 7;
            this.THROW_RANGE = 70;
            this.HIT_MOVE_DISTANCE = 5;
            this.THROWN_SPEED = -.5;
            this.THROWN_TIME = 600;

            this.moveLeft = function() {
                if (this.action != ACTION_IDLE) {
                    return;
                }
                // Prevent movement up the landscape
                var nextHeight = level.getHeightAtPoint(this.x - (SPRITE_HALF_WIDTH - 18));
                if (nextHeight > this.y) {
                    this.dx = 0;
                    return;
                }
                this.dx -= this.DX_ACCEL;
                if (this.dx < -this.MAX_SPEED) {
                    this.dx = -this.MAX_SPEED;
                }
            };
            this.moveRight = function() {
                if (this.action != ACTION_IDLE) {
                    return;
                }
                // Prevent movement up the landscape.
                var nextHeight = level.getHeightAtPoint(this.x + (SPRITE_HALF_WIDTH - 18));
                if (nextHeight > this.y) {
                    this.dx = 0;
                    return;
                }
                this.dx += this.DX_ACCEL;
                if (this.dx > this.MAX_SPEED) {
                    this.dx = this.MAX_SPEED;
                }
            };
            this.jump = function() {
                // Do not allow a new jump if one is already in progress.
                if (this.jumped) {
                    return;
                }
                this.dy = 0.4;  // set some initial upwards velocity
                this.jumped = true;
            };
            this.setAction = function(newAction) {
                this.action = newAction;
                if (newAction == ACTION_PUNCH) {
                    var spriteState = (this.facing_right) ? 'punch_l' : 'punch_r';
                } else if (newAction == ACTION_BLOCK) {
                    var spriteState = 'block';
                } else if (newAction == ACTION_PAIN) {
                    var spriteState = 'pain';
                } else if (newAction == ACTION_THROW) {
                    var spriteState = 'throw';
                } else if (newAction == ACTION_THROWN) {
                    var spriteState = 'thrown';
                } else {
                    var spriteState = 'idle';
                }
                this.sprite.setState(spriteState);
            };

            this.punch = function() {
                if (this.action != ACTION_IDLE) {
                    return;
                }
                this.setAction(ACTION_PUNCH);
                this.action_timer = this.PUNCH_TIME;
                this.dx = 0;

                if (this.distanceTo(this.other_player) < this.PUNCH_RANGE) {
                    this.other_player.hit(this.PUNCH_DAMAGE);
                }
            };

            this.throw_em = function() { // "throw" is a reserved word
                if (this.action != ACTION_IDLE) {
                    return;
                }
                this.setAction(ACTION_THROW);
                this.action_timer = this.THROW_TIME;
                this.dx = 0;

                if (this.distanceTo(this.other_player) < this.THROW_RANGE) {
                    this.other_player.thrown(this.THROW_DAMAGE);
                }
            };

            this.thrown = function(damage) {
                this.health -= damage;
                this.setAction(ACTION_THROWN);
                this.action_timer = this.THROWN_TIME;
                if (this.facing_right) {
                    this.dx = -this.THROWN_SPEED;
                } else {
                    this.dx = this.THROWN_SPEED;
                }
            };

            this.hit = function(damage) {
                this.dx = 0;
                if (this.isBlocking) {
                    this.setAction(ACTION_BLOCK);
                    this.action_timer = this.BLOCK_TIME;
                    // BUG Player isn't looking the right way now
                } else {
                    this.health -= damage;
                    this.setAction(ACTION_PAIN);
                    this.action_timer = this.PAIN_TIME;
                    if (this.facing_right) {  // BUG: not right if player is walking away
                        this.x -= this.HIT_MOVE_DISTANCE;
                    } else {
                        this.x += this.HIT_MOVE_DISTANCE;
                    }
                }
            };

            this.distanceTo = function(other) {
                return Math.abs(this.x - other.x);
            };

            this.update = function(dt) {
                // Compute the desired vertical position of the character by moving one
                // time step along the velocity vector in the vertical axis.
                var newY = this.y + this.dy * dt;
                this.dy -= 0.03;

                this.x += this.dx * dt;
                if (Math.abs(this.dx) < this.DX_DECAY) {
                    this.dx = 0;
                } else if (this.dx > 0) {
                    this.dx -= this.DX_DECAY;
                } else if (this.dx < 0) {
                    this.dx += this.DX_DECAY;
                }

                // If the desired position intersects with the landscape then stop the jump.
                var newHeight = level.getHeightAtPoint(this.x);
                if (newY < newHeight) {
                    newY = newHeight;
                    this.jumped = false;
                    this.dy = 0;
                }
                this.y = newY;

                if (this.action_timer > 0) {
                    this.action_timer -= dt;

                    if (this.action_timer <= 0) {
                        this.action_timer = 0;
                        this.setAction(ACTION_IDLE);
                    }
                }

                this.facing_right = (this.x < this.other_player.x);
            };

            this.isAlive = function() {
                return this.health >= 0;
            };

            this.block = function(should_block) {
                this.isBlocking = should_block;
            };

            this.action_timer = 0;
            this.setAction(ACTION_IDLE);
        }


        var STATE_BEFORE_START = 'before start';
        var STATE_PLAYING = 'playing';
        var STATE_GAME_OVER = 'game over';

        var INITIAL_PLAYER_SEPARATION = 200;

        // Key codes
        var KEY_SPACE=32;
        var KEY_W=87;
        var KEY_A=65;
        var KEY_S=83;
        var KEY_D=68;
        var KEY_X=88;
        var KEY_R=82;
        var KEY_ESC=27;
        var KEY_O=79;
        var KEY_T=84;
        var KEY_P=80;
        var KEY_COMMA=188;
        var KEY_PERIOD=190;
        var KEY_LEFT=37;
        var KEY_RIGHT=39;
        var KEY_UP=38;
        var KEY_DOWN=40;

        var ACTION_IDLE = 'idle';
        var ACTION_PAIN = 'pain';
        var ACTION_PUNCH = 'punch';
        var ACTION_BLOCK = 'block';
        var ACTION_THROW = 'throw';
        var ACTION_THROWN = 'thrown';
        var DEBUG = false;

        var PIT_DAMAGE = .1;

        var win; // The window (I'd call it window but that's a reserved word)
        var keys;
        var player1;
        var player2;
        var interval;
        var level;
        var lastTimeStamp = 0;

        var JUMP_TIME_MS = 800;  // jump time in milliseconds
        var JUMP_HEIGHT = 100;  // in pixels

        function resetGameState() {
            level = new Level();
            win.reset();
            var player_offset = win.width/2 - INITIAL_PLAYER_SEPARATION;
            player1 = new Player(player_offset, 'images/character.png', true);
            player2 = new Player(win.right() - player_offset, 'images/character_2.png', false);
            player1.other_player = player2;
            player2.other_player = player1;
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
            if (keys.isPressed(KEY_R)) {
                player1.punch();
            }
            if (keys.isPressed(KEY_T)) {
                player1.throw_em();
            }
            player1.block(false);
            if (keys.isPressed(KEY_A)) {
                player1.moveLeft();
                player1.block(player1.facing_right);
            }
            if (keys.isPressed(KEY_D)) {
                player1.moveRight();
                player1.block(!player1.facing_right);
            }

            if (keys.isPressed(KEY_COMMA)) {
                player2.punch();
            }
            if (keys.isPressed(KEY_PERIOD)) {
                player2.throw_em();
            }
            player2.block(false);
            if (keys.isPressed(KEY_LEFT)) {
                player2.moveLeft();
                player2.block(player2.facing_right);
            }
            if (keys.isPressed(KEY_RIGHT)) {
                player2.moveRight();
                player2.block(!player2.facing_right);
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

                if (player1.y < -100) {
                    player1.health -= dt * PIT_DAMAGE;
                }

                if (player2.y < -100) {
                    player2.health -= dt * PIT_DAMAGE;
                }

                if (!player1.isAlive() || !player2.isAlive()) {
                    //alert("Game Over. Reset...");
                    game_state = STATE_GAME_OVER;
                    win.gameOver();
                    setTimeout(resetGameState, 2000);
                }
            }

            win.update(dt);
            win.draw();

            if (DEBUG) {
                debug.innerHTML = 'Debug:<br>Key: ' + keys.lastKey;
            }
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
    GameCtrl.$inject = ["$rootScope", "$scope", "$routeParams", "$location", "User"];

    /** Angular.JS Controller Registration **/
    _JSFight.controller("GameCtrl", GameCtrl);
}());