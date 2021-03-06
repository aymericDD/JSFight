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

        socket.on('KEY_RIGHT', function(user){
            io.to(room).emit("KEY_RIGHT", user);
        });

        socket.on('KEY_LEFT', function(user){
            io.to(room).emit("KEY_LEFT", user);
        });

        socket.on('KEY_DOWN', function(user){
            io.to(room).emit("KEY_DOWN", user);
        });

        socket.on('KEY_RIGHT_STOP', function(user){
            io.to(room).emit("KEY_RIGHT_STOP", user);
        });

        socket.on('KEY_LEFT_STOP', function(user){
            io.to(room).emit("KEY_LEFT_STOP", user);
        });

        socket.on('KEY_DOWN_STOP', function(user){
            io.to(room).emit("KEY_DOWN_STOP", user);
        });

        socket.on('KEY_UP', function(user){
            io.to(room).emit("KEY_UP", user);
        });

        socket.on('KEY_A', function(user){
            io.to(room).emit("PUNCH", user);
        });

        socket.on('KEY_R', function(user){
            io.to(room).emit("KICK", user);
        });

        socket.on('HIT_KICK', function(user, dommage){
            io.to(room).emit('HIT_KICK', user, dommage);
        });

        socket.on('HIT_PUNCH', function(user, dommage){
            io.to(room).emit('HIT_PUNCH', user, dommage);
        });

        socket.on('SYNC_POSITION', function($dx, $user){
            io.to(room).emit('SYNC_POSITION', $dx, $user);
        });

        socket.on('KEY_E', function($user){
            io.to(room).emit('BLOCK', $user);
        });

        socket.on('KEY_E_STOP', function($user){
            io.to(room).emit('BLOCK_STOP', $user);
        });

        socket.on('KEY_SPACE', function($user){
            io.to(room).emit('THROW_EM', $user);
        });

        socket.on('THROWN', function($user, $damage){
            io.to(room).emit('THROWN', $user, $damage);
        });

        function ConnectUser(newUser) {
            user = newUser;
            socket.join(room);
            parties[room].push(user);
            socket.emit("USER_ACCEPTED");
            //socket.to(room).emit('CONNECT_USER', user);

            if(parties[room].length === 2) {
                io.to(room).emit('START_GAME', parties[room]);
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