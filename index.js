const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8000;

const movement = require('./public/js/movement');

app.use(express.static('public'));
app.use(cors({origin: true}));

let gameState = {
  players: {}
};

let serverData = {
  map: undefined,
  spawnPoints: [],
  inputCache: {},
  tick: 0,
};


const server = app.listen(port, () => {
  let file = fs.readFileSync("maps/standard.json");
  serverData.map = JSON.parse(file.toString());

  console.log(`SUPERGUN Server running on ${port}`);
  setInterval(handleSubtick, 5);
});

const socket = require('socket.io');
const io = socket(server);

io.set('origins', '*:*');

io.on('connection', (socket) => {
  console.log('User connected. [' + socket.id + ']');
  gameState.players[socket.id] = {
    hasJoinedGame: false,
    username: "undefined",
    inputs: {},
    playerState: {
      position: {x: 0, y: 0, z: 0},
      velocity: {x: 0, y: 0, z: 0},
      canJump: false,
    },
    rotation: {x: 0, y: 0},
    hasSupergun: false,
    health: 100,
    forceMove: 0,
  };

  socket.on('disconnect', (reason) => {
    delete gameState.players[socket.id];
  });

  socket.on('register', (data) => {
    gameState.players[socket.id].hasJoinedGame = true;
    gameState.players[socket.id].username = data.username;

    socket.emit('register_accept', {tick: serverData.tick, stamp: Date.now()});

    let ids = [];
    Object.keys(gameState.players).forEach(key => {
      let player = gameState.players[key];
      if (player.hasJoinedGame && key !== socket.id) {
        ids.push({id: key, username: gameState.players[key].username});
      }
    });
    socket.emit('player_add', {added: ids});
    socket.broadcast.emit('player_add', {added: [{id: socket.id, username: data.username}]});
  });

  socket.on('input_state', (data) => {
    for (let i = 0; i < data.logged.length; i++) {
      gameState.players[socket.id].inputs[serverData.tick + i] = data.logged[i];
    }
  });

});

app.get('/map', (req, res) => {
  res.send(serverData.map);
});

function handleSubtick() {
  serverData.tick += 1;
  if (serverData.tick % 4 === 0) {
    handleTick();
  }
}

function handleTick() {
  let worldState = {tick: serverData.tick, stamp: Date.now()};
  io.emit('world_state', worldState);
}
