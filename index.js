const e = require('express');
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
var players = [0,0];
var turn = 0;
var GG = 0;

function findThree(a,b,c,char) {
    if ((board[a-1] == char && board[b-1] == char) && board[c-1] == char) {
        return true;
    } else {
        return false;
    }
}

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
    if (players[0] == 0) {
        players[0] = socket.id;
    } else if (players[1] == 0) {
        players[1] = socket.id;
    } else {
        io.to(socket.id).emit('turn state', 'Spectating...');
        players.push(socket.id);
    }

    if (!GG) {
        if (socket.id == players[0]) {
            io.to(players[0]).emit('turn state', !turn);
        } else if (socket.id == players[1]) {
            io.to(players[1]).emit('turn state', turn);
        }
    } else {
        let symbol = 'O wins! Play again?';
        if (turn) {
            symbol = 'X wins! Play again?';
        }
        io.to(socket.id).emit('turn state', symbol);
    }
    socket.emit('board state', board);
    console.log(players);   

    socket.on('play', (position) => {
        if (position == 0 && GG && (socket.id == players[0] || socket.id == players[1])) {
            GG = 0;
            board = ['-','-','-','-','-','-','-','-','-'];
            io.emit('board state', board);
            io.to(players[0]).emit('turn state', !turn);
            io.to(players[1]).emit('turn state', turn);

        } else if ((position == 0 && socket.id == players[turn])){
            board = ['-','-','-','-','-','-','-','-','-'];
            io.emit('board state', board);
            io.to(players[0]).emit('turn state', !turn);
            io.to(players[1]).emit('turn state', turn);

        } else if (socket.id == players[turn] && board[position-1] == '-' && !GG) {
            let symbol = 'X';
            if (turn) {
                symbol = 'O';
                turn = 0;
            } else {
                turn = 1;
            }
        
            io.to(players[0]).emit('turn state', !turn);
            io.to(players[1]).emit('turn state', turn);
            board[position-1] = symbol;
            testWin('X');
            testWin('O');
            io.emit('board state', board);
        }
        if (GG) {
            let symbol = 'O wins! Play again?';
            if (turn) {
                symbol = 'X wins! Play again?';
            }
            io.emit('turn state', symbol);
        }
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        for(let i=0; i<players.length+1; i++) {
            if (i<2 && socket.id == players[i]) {
                players[i]=0;
            } else if (socket.id == players[i]) {
                players.splice(i,1);
            }
        }
    });

    function testWin(player) {
        let win = 0;
        if (findThree(1,2,3,player) || (findThree(4,5,6,player))) {
            win = 1;
        } else if (findThree(7,8,9,player) || findThree(1,4,7,player)) {
            win = 1;
        } else if (findThree(2,5,8,player) || findThree(3,6,9,player)) {
            win = 1;
        } else if (findThree(1,5,9,player) || findThree(7,5,3,player)) {
            win = 1;
        }
        if (win) {
            GG = 1;
            socket.emit('turn state', `${player} wins! Play again?`);
            console.log(`Boggle! ${player} is the winner!`);
        }
    }
});

server.listen(80, () => {
    console.log('listening on *:80');
});