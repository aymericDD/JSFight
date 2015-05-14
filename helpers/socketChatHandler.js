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
        usersPossibleFight.push(socket);
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

                usersOnline.some(function($user, index, array){
                    if($user.id === newUser.id) {
                        valideUser = false;
                    }
                });

                if(valideUser) {
                    user = newUser;
                    usersOnline.push(newUser);
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
                var socketUser1 = getSocket(user1SocketId, usersPossibleFight);

                if(typeof socketUser1 !== 'undefined') {
                    var indexUser1 = usersPossibleFight.indexOf(socketUser1);
                    usersPossibleFight.splice(indexUser1, 1);
                    // Get socket user2 and remove it to userPossibleFight
                    var socketUser2 = getSocket(socket.id, usersPossibleFight);

                    if(typeof socketUser2 !== 'undefined'){
                        var indexUser2 = usersPossibleFight.indexOf(socketUser2);
                        usersPossibleFight.splice(indexUser2, 1);
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
            getRandomUserOnline(sender, function(receiver) {
                receiver.emit("INVITATION_FIGHT", {user: user, socketId: socket.id});
            });
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
        function getRandomUserOnline(sender, callback) {
            if(usersPossibleFight.length > 1) {
                var receiver = usersPossibleFight[Math.floor(Math.random()*usersPossibleFight.length)];
                if(usersPossibleFight[id].id === receiver.id) {
                    return getRandomUserOnline(sender, callback);
                }else {
                    return callback(receiver);
                }
            }
            return false;
        };

        function removeUserToArray($user, $array) {
            var indexUser = $array.indexOf($user);
            if(indexUser > - 1) {
                $array.splice(indexUser, 1);
                return true;
            }
            return false;
        };

        function getSocket($value, $array) {
            var result = false;
            $array.forEach(function($item, index, array){
                if($item.id === $value){
                    result = $item;
                }
            });
            return result;
        };

    });
};