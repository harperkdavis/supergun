const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8000;

app.use(express.static('public'));
app.use(cors());

let gameState = {
  players: {

  }
};

let serverData = {
  map: undefined
};


const server = app.listen(port, () => {
  let file = fs.readFileSync("maps/standard.json");
  serverData.map = JSON.parse(file.toString());

  console.log(`SUPERGUN Server running on ${port}`);
});
const socket = require('socket.io');
const io = socket(server);

io.on('connection', (socket) => {
  console.log('User connected.');
  gameState.players[socket.id] = {
    hasJoinedGame: false,
    username: undefined,
  };

  socket.on('register', (data) => {
    gameState.players[socket.id].hasJoinedGame = true;
    gameState.players[socket.id].username = data.username;

    socket.emit('register_accept', {});
  });
});

app.get('/map', (req, res) => {
  res.send(serverData.map);
});
