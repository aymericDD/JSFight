"use strict";

var models = require('../models'),
    users = [],
    usersPossibleFight = [],
    usersOnline = [];

module.exports = function (io) {
    io.on('connection', function (socket) {
        var id,
            user;

        users.push(socket);
        id = users.indexOf(socket);

        /**
         * Emit event USERNAME_REQUIRED for login user into chat
         */
        socket.emit("USER_REQUIRED");


        /**
         * Listen event on USERNAME_CHOSEN for save username and return messages, users online and emmet in broadcast the new user connected
         */
        socket.on('USER_CHOSEN', function (newUser) {

            if (newUser && newUser !== "") {

                var valideUser = true;

                usersOnline.some(function($user){
                    if($user.id === newUser.id) {
                        valideUser = false;
                    }
                });

                if(valideUser) {
                    user = newUser;
                    usersOnline.push(newUser);
                    usersPossibleFight[newUser.id] = socket;
                }

                models.Message.find({}, function (err, messages) {
                    if (err) {
                        throw err;
                    }

                    socket.emit("USER_ACCEPTED", messages, usersOnline);
                    socket.broadcast.emit("NEW_USER", user);
                });
            }
        });

        /**
         * Send a message and register it into databases
         */
        socket.on('SEND_MESSAGE', function (message) {
            if (user.username && user.username !== "") {
                var messageObject = new models.Message({
                    username: user.username,
                    message: message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
                    timestamp: new Date().getTime()
                });

                messageObject.save(function (err, newMessage) {
                    if (err) {
                        throw err;
                    }

                    io.emit("NEW_MESSAGE", newMessage);
                });
            }
        });

        socket.on('FIGHT_ACCEPTED', function(user1, user2, user1SocketId) {
            if(user1 && user2 && user1SocketId) {
                // Get socket user1 and remove it to userPossibleFight
                var socketUser1 = usersPossibleFight[user1.id];

                if(typeof socketUser1 !== 'undefined') {
                    usersPossibleFight.splice(user1.id, 1);
                    // Get socket user2 and remove it to userPossibleFight
                    var socketUser2 = usersPossibleFight[user2.id];

                    if(typeof socketUser2 !== 'undefined'){
                        usersPossibleFight.splice(user2.id, 1);
                        // Construct future room
                        var room = user1.id + user2.id;
                        // Emit to users socket
                        socketUser1.emit("FIGHT", room);
                        socketUser2.emit("FIGHT", room);
                        return true;
                    }
                }
                return false;

            }
        });

        socket.on("QUICK_FIGHT", function(sender){
            getReceiverOnline(sender);
        });

        socket.on("SINGLE_FIGHT", function(receiverId){
            if (receiverId) {
                var socketReceiver = usersPossibleFight[receiverId];
                socketReceiver.emit("INVITATION_FIGHT", {user: user, socketId: socket.id});
            }
        });

        /**
         * When user is disconnected, remove socket id in users list,
         * remove userName in usersName list
         * and emit event USER_DISCONNECTED for users online
         */
        socket.on('disconnect', function () {

            if(user) {
                // Remove socket user into users array sockets
                users.forEach(function($socket, index, array){
                    if($socket.id === socket.id){
                        users.splice(index, 1);
                    }
                });
                // Remove user in array
                removeUserToArray(user, usersOnline);
                // Remove socket in usersPossibleFight
                removeUserToArray(socket, usersPossibleFight);
                io.emit("USER_DISCONNECTED", user);
            }

        });

        /**
         * Get random user online and apply function callback
         *
         * @param sender
         * @param callback
         * @returns {*}
         */
        function getReceiverOnline(sender) {
            if(usersOnline.length > 1) {
                return getSimilarUser(sender, sender.nbWins, sender.nbWins);
            }
            return false;
        };

        /**
         * Get similar user by nbWins
         *
         * @param sender
         * @param nbWinsNegative
         * @param nbWinsPositive
         * @param next
         * @returns {*}
         */
        function getSimilarUser(sender, nbWinsNegative, nbWinsPositive) {
            var SimilarUser = false;
            usersOnline.some(function ($user, index) {
                if ($user.id !== sender.id && ($user.nbWins === nbWinsNegative || $user.nbWins === nbWinsPositive)) {
                    return SimilarUser = $user;
                }
            });

            if (SimilarUser) {
                var receiver = usersPossibleFight[SimilarUser.id];
                if(receiver) {
                    return receiver.emit("INVITATION_FIGHT", {user: user, socketId: socket.id});
                }
                return false;
            }

            return getSimilarUser(sender, --nbWinsNegative, ++nbWinsPositive);
        }

        function removeUserToArray($user, $array) {
            var indexUser = $array.indexOf($user);
            if(indexUser > - 1) {
                $array.splice(indexUser, 1);
                return true;
            }
            return false;
        };

    });
};