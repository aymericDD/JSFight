"use strict";

var models = require('../models'),
    parties = [],
    users = [];

module.exports = function (io) {
    io.on('connection', function (socket) {
        var id,
            room,
            user;

        users.push(socket);
        id = users.indexOf(socket);

        socket.on('ADD_USER', function(newUser, $room){
            room = $room.room;
            if(typeof room === 'undefined') {
                return console.log("No room defined");
            }
            if(typeof parties[room] === 'undefined') {
                parties[room] = [];
            }
            if(newUser && room && parties[room].length < 2) {
                if(parties[room].length === 0) {
                    ConnectUser(newUser);
                }else {
                    var userAlreadyExist = false;
                    parties[room].forEach(function($user, index, array){
                        if($user.id === newUser.id) {
                            userAlreadyExist = true;
                        }
                    });
                    if(!userAlreadyExist) {
                        ConnectUser(newUser);
                    }
                }
            }else {
                return console.log("Party is full");
            }
        });

        function ConnectUser(newUser) {
            user = newUser;
            socket.join(room);
            parties[room].push(user);
            socket.emit("USER_ACCEPTED");
            socket.to(room).emit('CONNECT_USER', user);
            if(parties[room].length === 2) {
                console.log('START THE GAME');
                io.to(room).emit('START_GAME');

            }
        };

        socket.on('disconnect', function(){
            if(user) {
                // Remove user socket
                users.forEach(function($socket, index, array){
                    if($socket.id === socket.id){
                        users.splice(index, 1);
                    }
                });

                // Remove user party
                var indexUser = parties[room].indexOf(user);
                if(indexUser > - 1) {
                    parties[room].splice(indexUser, 1);
                }

                io.to(room).emit("DISCONNECTED_USER", user);

                // Remove user to room
                socket.leave(room);

                // Unset private variables
                id = null;
                user = null;
                room = null;
            }
        });

    });
};