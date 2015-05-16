/**
 * Created by Rico on 16/05/2015.
 */

"use strict";

(function() {
    var _JSFight = angular.module("JSFight");

    function PlayerFactory(AnimatingSprite) {

        var ACTION_IDLE = 'idle';
        var ACTION_PAIN = 'pain';
        var ACTION_PUNCH = 'punch';
        var ACTION_KICK = 'kick';
        var ACTION_CROUCH = 'crouch';
        var ACTION_BLOCK_CROUCH = 'block_crouch';
        var ACTION_BLOCK = 'block';
        var ACTION_THROW = 'throw';
        var ACTION_THROWN = 'thrown';

        function Player(x, sprite_sheet, facing_right, controle, user) {
            this.x = x;
            this.dx = 0;
            this.y = 0;
            this.dy = 0;
            this.health = 100;
            this.sprite = new AnimatingSprite(sprite_sheet);

            this.controle = controle;
            this.user = user;

            this.left = false;
            this.right = false;
            this.down = false;

            this.facing_right = facing_right;

            this.other_player = null;
            this.jumped = false;

            this.MAX_SPEED = .3;
            this.DX_ACCEL = .05;
            this.DX_DECAY = .02;
            this.PUNCH_TIME = 250;
            this.KICK_TIME = 400;
            this.BLOCK_TIME = 250;
            this.PAIN_TIME = 200;
            this.THROW_TIME = 600;
            this.PUNCH_RANGE = 55;
            this.PUNCH_DAMAGE = 5;
            this.KICK_RANGE = 70;
            this.KICK_DAMAGE = 6;
            this.THROW_DAMAGE = 7;
            this.THROW_COOLDOWN_TIME_STATIC = 8000;
            this.THROW_COOLDOWN_TIME = this.THROW_COOLDOWN_TIME_STATIC;
            this.THROW_COOLDOWN = false;
            this.THROW_RANGE = 55;
            this.HIT_MOVE_DISTANCE = 5;
            this.THROWN_SPEED = -.5;
            this.THROWN_TIME = 600;

            this.moveLeft = function() {
                if (this.action != ACTION_IDLE || this.isBlocking) {
                    return;
                }
                // Prevent movement up the landscape
                var nextHeight = 0;
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
                if (this.action != ACTION_IDLE || this.isBlocking)  {
                    return;
                }
                // Prevent movement up the landscape.
                var nextHeight = 0;
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
                if (this.jumped || this.action === ACTION_CROUCH) {
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
                }else if (newAction == ACTION_BLOCK_CROUCH) {
                    var spriteState = 'block_crouch';
                } else if (newAction == ACTION_PAIN) {
                    var spriteState = 'pain';
                }else if (newAction == ACTION_KICK) {
                    var spriteState = (this.facing_right) ? 'kick_l' : 'kick_r';
                }else if (newAction == ACTION_CROUCH) {
                    var spriteState = 'crouch';
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
                    return false;
                }
                this.setAction(ACTION_PUNCH);
                this.action_timer = this.PUNCH_TIME;
                this.dx = 0;
                this.block(false);

                if (this.distanceTo(this.other_player) < this.PUNCH_RANGE && !this.other_player.down) {
                    return true;
                }
            };

            this.kick = function() {
                if(this.action != ACTION_IDLE) {
                    return false;
                }
                this.setAction(ACTION_KICK);
                this.action_timer = this.KICK_TIME;
                this.dx = 0;
                this.block(false);

                if (this.distanceTo(this.other_player) < this.KICK_RANGE) {
                    return true;
                }
            };

            this.throw_em = function() { // "throw" is a reserved word
                if (this.action != ACTION_IDLE) {
                    return false;
                }
                this.setAction(ACTION_THROW);
                this.action_timer = this.THROW_TIME;
                this.dx = 0;
                this.THROW_COOLDOWN = true;

                if (this.distanceTo(this.other_player) < this.THROW_RANGE) {
                    return true;
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

            this.hit_punch = function(damage) {
                this.dx = 0;
                if (this.isBlocking) {
                    this.block_hit();
                    // BUG Player isn't looking the right way now
                } else {
                    this.hit(damage);
                }
            };

            this.block_hit = function() {
                if(this.action === ACTION_CROUCH || this.action === ACTION_BLOCK_CROUCH) {
                    this.setAction(ACTION_BLOCK_CROUCH);
                }else {
                    this.setAction(ACTION_BLOCK);
                }

                this.action_timer = this.BLOCK_TIME;
            };

            this.hit = function(damage) {
                this.health -= damage;
                this.setAction(ACTION_PAIN);
                this.action_timer = this.PAIN_TIME;
                if (this.facing_right) {  // BUG: not right if player is walking away
                    this.x -= this.HIT_MOVE_DISTANCE;
                } else {
                    this.x += this.HIT_MOVE_DISTANCE;
                }
            }

            this.hit_kick = function(damage) {
                this.dx = 0;
                if (this.isBlocking && this.down) {
                    this.block_hit();
                    // BUG Player isn't looking the right way now
                } else {
                    this.hit(damage);
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
                var newHeight = 0;
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
                        if(this.action === ACTION_BLOCK_CROUCH) {
                            this.setAction(ACTION_CROUCH);
                        }else {
                            this.setAction(ACTION_IDLE);
                        }
                    }
                }

                this.facing_right = (this.x < this.other_player.x);

                if (this.left) {
                    this.moveLeft();
                }

                if (this.right) {
                    this.moveRight();
                }

                if (this.THROW_COOLDOWN) {
                    this.THROW_COOLDOWN_TIME = this.THROW_COOLDOWN_TIME - 20;
                    if(this.THROW_COOLDOWN_TIME === 0) {
                        this.THROW_COOLDOWN = false;
                        this.THROW_COOLDOWN_TIME = this.THROW_COOLDOWN_TIME_STATIC;
                    }
                }

            };

            this.isAlive = function() {
                return this.health >= 0;
            };

            this.block = function(should_block) {
                this.isBlocking = should_block;
            };

            this.crouch = function(should_crouch) {
                if(should_crouch) {
                    if (this.action != ACTION_IDLE) {
                        return;
                    }
                    this.down = true;
                    this.setAction(ACTION_CROUCH);
                }else {
                    this.down = false;
                    this.setAction(ACTION_IDLE);
                }

            };

            this.action_timer = 0;
            this.setAction(ACTION_IDLE);
        }

        return Player;
    }

    /** Angular.JS Dependency Injection **/
    PlayerFactory.$inject = ["AnimatingSprite"];

    _JSFight.factory("Player", PlayerFactory);
}());