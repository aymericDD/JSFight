"use strict";

var models = require('../models'),
    users = [],
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

                if(usersOnline.indexOf(newUser) === -1) {
                    user = newUser;
                    usersOnline.push(newUser);
                }else {
                    return false;
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

        /**
         * When user is disconnected, remove socket id in users list,
         * remove userName in usersName list
         * and emit event USER_DISCONNECTED for users online
         */
        socket.on('disconnect', function () {

            if(user) {
                users.splice(id, 1);
                var indexUser = usersOnline.indexOf(user);
                if(indexUser > - 1) {
                    usersOnline.splice(indexUser, 1);
                }
                io.emit("USER_DISCONNECTED", user);
            }

        });
    });
};