const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8000;

const movement = require('./public/js/movement.js');

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

const CONSOLE_USER = {
  username: '&CONSOLE&',
  admin: true,
}


const server = app.listen(port, () => {
  let file = fs.readFileSync("maps/standard.json");
  serverData.map = JSON.parse(file.toString());

  console.log(`SUPERGUN Server running on ${port}`);
  setInterval(handleTick, 10);


});

const socket = require('socket.io');
const io = socket(server, { cors: {
      origin: "*",
      methods: ["GET", "POST"]
}});

io.on('connection', (socket) => {
  console.log('Player connected: (' + socket.id + ')');
  gameState.players[socket.id] = {
    hasJoinedGame: false,
    username: "undefined",
    id: socket.id,
    inputState: {rotation: {x: 0, y: 0}, prevInputs: [], inputs: []},
    playerState: {
      position: {x: 0, y: 8, z: 0},
      velocity: {x: 0, y: 0, z: 0},
      canJump: false,
    },
    rotation: {x: 0, y: 0},
    hasSupergun: false,
    health: 100,
    admin: true,
  };

  socket.on('disconnect', (reason) => {
    io.emit('player_remove', {removed: {id: socket.id}});
    let player = gameState.players[socket.id];
    if (player !== undefined) {
      console.log('Player disconnected (' + socket.id + '): ' + player.username);

      sendChat(player.username + " has left the game", 0x33ff33);
      delete gameState.players[socket.id];
    }
  });

  socket.on('register', (data) => {
    gameState.players[socket.id].hasJoinedGame = true;
    gameState.players[socket.id].username = data.username.trim();

    console.log('Player registered (' + socket.id + '): ' + data.username);

    sendChat(data.username + " has joined the game", 0x33ff33);

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
    if (gameState.players[socket.id] !== undefined) {
      gameState.players[socket.id].inputState = data.input;
    }
  });

  socket.on('chat_request', (data) => {
    let message = data.message;
    if (message.length > 512) {
      message = message.substring(0, 512);
    }
    if (message.trim().length !== 0) {
      if (message[0] === '/') {
        executeCommand(message.substring(1, message.length), gameState.players[socket.id], socket);
      } else {
        sendChat(`(${gameState.players[socket.id].username}): ${message}`);
      }
    }
  });

});

app.get('/map', (req, res) => {
  res.send(serverData.map);
});

function sendChat(chat, color=0xffffff) {
  io.emit('chat', {message: chat, color: color});
  console.log('Chat: ' + chat);
}

function sendChatTo(socket, chat, color=0xffffff) {
  if (socket !== undefined) {
    socket.emit('chat', {message: chat, color: color});
    console.log('Chat ->: ' + chat);
  }
}

function executeCommand(command, executor) {
  let args = command.split(' ');
  if (executor === 'console' || executor.admin) {
    sendChatTo(io.sockets.sockets.get(executor.id), execute(args[0], args.slice(1, args.length), executor), 0xcccccc);
  }

}

function execute(command, args, sender) {
  if (command === 'list') {
    let list = '';
    Object.keys(gameState.players).forEach(sid => {
      let player = gameState.players[sid];
      list = list + player.username + ', ';
    });
    if (list.length > 2) {
      list = list.substring(0, list.length - 2);
    }
    return list;
  } else if (command === 'hi') {
    return 'hi!';
  }

  if (sender.admin) {
    if (command === 'kick') {
      if (args.length > 0) {
        let playerKeys = Object.keys(gameState.players);
        for (let i = 0; i < playerKeys.length; i++) {
          let sid = playerKeys[i];
          let player = gameState.players[sid];
          let username = player.username;
          if (username === args[0]) {
            if (sender.username === username) {
              return 'you cannot kick yourself!';
            }
            if (!player.hasJoinedGame) {
              return 'you cannot kick an unregistered player!';
            }

            io.emit('player_remove', {removed: {id: player.id}});
            console.log('Player kicked (' + player.id + '): ' + username);

            sendChat(username + " was kicked", 0x33ff33);

            io.sockets.sockets.get(player.id).emit('delete_webpage', {});
            io.sockets.sockets.get(player.id).disconnect();
            delete gameState.players[player.id];

            return 'kicked ' + username;
          }
        }
        return 'player not found';
      } else {
        return 'too few arguments';
      }
    }
  }
  return '???';
}


function handleTick() {
  serverData.tick += 1;
  Object.keys(gameState.players).forEach(sid => {
    let player = gameState.players[sid];
    if (player !== undefined) {
      if (player.hasJoinedGame) {
        let input = player.inputState;
        player.playerState = movement.processMovement(input.inputs, input.prevInputs, input.rotation, player.playerState, serverData.map);
      }
    }
  });

  let worldState = {tick: serverData.tick, stamp: Date.now(), players: gameState.players};
  io.emit('world_state', worldState);
}
