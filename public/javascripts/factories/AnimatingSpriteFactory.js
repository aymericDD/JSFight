/**
 * Created by Rico on 16/05/2015.
 */

"use strict";

(function() {
    var _JSFight = angular.module("JSFight");

    function AnimatingSpriteFactory () {
        var coords = "";
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
            'punch_r': [2, 0],
            'kick_r': [14, 14, 0],
            'kick_l': [14, 14, 0],
            'crouch': [13],
            'block_crouch': [12],
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

        return AnimatingSprite;
    }

    _JSFight.factory("AnimatingSprite", AnimatingSpriteFactory);
}());