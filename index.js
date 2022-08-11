const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/',(req, res) => {
    res.sendFile(__dirname + '/index.html');
});

var board = ['-','-','-','-','-','-','-','-','-'];
var players = [];
var turn = 0;

function testWin(player) {
    if (board[0] == player && board[1] == player) {
        console.log(`Boggle! ${player} is the winner!`);
    }
}

io.on('connection', (socket) => {
    console.log(`loaded: ${socket.id}`);
    players.push(socket.id);
    socket.emit('board state', board);
    socket.on('get player id', (id) => {
        console.log(`new player id: ${id}`);
        players.push(id);
        
    });
    if (players.length == 1) {
        console.log(`${socket.id} is player 1`)
        socket.emit('turn state', 1);
    } else {
        socket.emit('turn state', 0);
    }
    

    socket.on('play', (position) => {
        if (socket.id == players[turn] && board[position-1] == '-') {
            let symbol = 'X';
            if (turn) {
                symbol = 'O';
                turn = 0;
            } else {
                turn = 1;
            }
            io.to(players[0]).emit('turn state', !(turn));
            io.to(players[1]).emit('turn state', turn);

            board[position-1] = symbol;
            testWin('X');
            testWin('O');
            io.emit('board state', board);
            
        }
    });
    
    socket.on('reset', () => {
        board = ['-','-','-','-','-','-','-','-','-'];
        io.emit('board state', board);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        for(let i=0; i<players.length; i++) {
            if(socket.id == players[i]) {
                players.splice(i,1);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});