const express = require('express');
const cors = require('cors');
const fs = require('fs');
const inquirer = require('inquirer');

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
  console: true,
  admin: true,
}


const server = app.listen(port, () => {
  let file = fs.readFileSync("maps/castle.json");
  serverData.map = JSON.parse(file.toString());

  for (let y = 0; y < serverData.map.length; y++) {
    for (let x = 0; x < 15; x++) {
      for (let z = 0; z < 15; z++) {
        let tile = serverData.map[y][x][z];
        if (tile[1] === 's') {
          serverData.spawnPoints.push({x: x * 16 + 8, y: y * 12 + 8, z: z * 16 + 8});
        }
      }
    }
  }


  console.log(`SUPERGUN Server running on ${port}`);
  setInterval(handleTick, 10);

  readConsole();
});

const socket = require('socket.io');
const io = socket(server, { cors: {
      origin: "*",
      methods: ["GET", "POST"]
}});

function randomSpawnPoint() {
  return serverData.spawnPoints[Math.floor(Math.random() * serverData.spawnPoints.length)];
}

io.on('connection', (socket) => {
  console.log('Player connected: (' + socket.id + ')');
  gameState.players[socket.id] = {
    hasJoinedGame: false,
    username: "???",
    id: socket.id,
    inputState: {rotation: {x: 0, y: 0}, prevInputs: [], inputs: []},
    playerState: {
      position: randomSpawnPoint(),
      velocity: {x: 0, y: 0, z: 0},
      slowdown: 1.3,
      canJump: false,
      shotCooldown: 0,
      hasSupergun: false,
    },
    kills: 0,
    rotation: {x: 0, y: 0},
    health: 100,
    lastDamager: undefined,
    deathTimer: 0,
    admin: false,
  };

  socket.on('disconnect', (reason) => {
    io.emit('player_remove', {removed: {id: socket.id}});
    let player = gameState.players[socket.id];
    if (player !== undefined && player.hasJoinedGame) {
      console.log('Player disconnected (' + socket.id + '): ' + player.username);

      sendChat(player.username + " has left the game", 0x33ff33);
      delete gameState.players[socket.id];
    }
  });

  socket.on('register', (data) => {
    gameState.players[socket.id].hasJoinedGame = true;
    gameState.players[socket.id].username = data.username.trim();

    console.log('Player registered (' + socket.id + '): ' + gameState.players[socket.id].username);

    sendChat(gameState.players[socket.id].username + " has joined the game", 0x33ff33);

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
    message = message.replaceAll('script', 'h6');
    message = message.replaceAll('among_us_balls_in_my_jaws', 'script');
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

function sendChatToPlayer(player, chat, color=0xffffff) {
  let socket = io.sockets.sockets.get(player.id);
  if (socket !== undefined) {
    socket.emit('chat', {message: chat, color: color});
    console.log('Chat ->: ' + chat);
  }
}

function sendChatTo(socket, chat, color=0xffffff) {
  if (socket !== undefined) {
    socket.emit('chat', {message: chat, color: color});
    console.log('Chat ->: ' + chat);
  }
}

function readConsole() {
  inquirer.prompt({
    type: 'input',
    name: 'command',
    message: '> '
  }).then(answer => {
    executeCommand(answer['command'], CONSOLE_USER);
    readConsole();
  });
}

function executeCommand(command, executor) {
  let args = command.split(' ');
  if (!executor.console) {
    sendChatTo(io.sockets.sockets.get(executor.id), execute(args[0], args.slice(1, args.length), executor), 0xcccccc);
  } else {
    console.log(execute(args[0], args.slice(1, args.length), executor));
  }
}

function execute(command, args, sender) {
  if (command === 'list') {
    let list = '';
    Object.keys(gameState.players).forEach(sid => {
      let player = gameState.players[sid];
      if (player.hasJoinedGame) {
        list = list + player.username + ', ';
      }
    });
    if (list.length > 2) {
      list = list.substring(0, list.length - 2);
    }
    return list;
  } else if (command === 'hi') {
    return 'hello';
  } else if (command === '') {
    return 'no command';
  } else if (command === 'adminme') {
    sender.admin = true;
    return 'shhh';
  } else if (command === 'supergun') {
    let supergunUsername = 'nobody';
    Object.keys(gameState.players).forEach(sid => {
      let player = gameState.players[sid];
      if (player.playerState.hasSupergun) {
        supergunUsername = player.username;
      }
    });
    return supergunUsername + ' has the supergun';
  } else if (command === 'op' || command === 'a' || command === 'admin') {
    return 'that you are not';
  } else if (command === 'poke') {
    if (args.length > 0) {
      let playerKeys = Object.keys(gameState.players);
      if (args[0] === 'console' || args[0] === '&CONSOLE&' || args[0] === 'admin') {
        if (!sender.console && sender.hasJoinedGame) {
          sender.playerState.velocity = {x: 100, y: 100, z: 100};
        }
        return 'fuck off';
      }
      for (let i = 0; i < playerKeys.length; i++) {
        let sid = playerKeys[i];
        let player = gameState.players[sid];
        let username = player.username;
        if (username === args[0]) {
          if (!player.hasJoinedGame) {
            return 'you cannot poke an unregistered player!';
          }

          if (player.admin && !sender.console) {
            if (sender.hasJoinedGame) {
              sender.playerState.velocity = {x: 100, y: 100, z: 100};
            }
            return 'fuck off';
          }

          player.playerState.velocity.x += Math.random() * 0.1;
          player.playerState.velocity.y += Math.random() * 0.1;
          player.playerState.velocity.z += Math.random() * 0.1;

          sendChatToPlayer(player, 'you were poked by ' + sender.username, 0xcccccc);

          return 'poked ' + player.username;
        }
      }
      return 'player not found';
    } else {
      return 'too few arguments';
    }
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
    } else if (command === 'tp' || command === 't' || command === 'teleport') {
      if (args.length > 3) {
        let playerKeys = Object.keys(gameState.players);
        for (let i = 0; i < playerKeys.length; i++) {
          let sid = playerKeys[i];
          let player = gameState.players[sid];
          let username = player.username;
          if (username === args[0]) {
            if (!player.hasJoinedGame) {
              return 'you cannot teleport an unregistered player!';
            }

            player.playerState.position = {x: args[1], y: args[2], z: args[3]};
            player.playerState.velocity = {x: 0, y: 0, z: 0};

            return 'teleported ' + username;
          }
        }
        return 'player not found';
      } else {
        return 'too few arguments';
      }
    } else if (command === 'vel' || command === 'v' || command === 'velocity') {
      if (args.length > 3) {
        let playerKeys = Object.keys(gameState.players);
        for (let i = 0; i < playerKeys.length; i++) {
          let sid = playerKeys[i];
          let player = gameState.players[sid];
          let username = player.username;
          if (username === args[0]) {
            if (!player.hasJoinedGame) {
              return 'you cannot velocity an unregistered player!';
            }

            player.playerState.velocity = {x: args[1], y: args[2], z: args[3]};

            return 'velocified ' + username;
          }
        }
        return 'player not found';
      } else {
        return 'too few arguments';
      }
    } else if (command === 'op' || command === 'a' || command === 'admin') {
      if (args.length > 0) {
        let playerKeys = Object.keys(gameState.players);
        for (let i = 0; i < playerKeys.length; i++) {
          let sid = playerKeys[i];
          let player = gameState.players[sid];
          let username = player.username;
          if (username === args[0]) {
            if (!player.hasJoinedGame) {
              return 'you cannot admin an unregistered player!';
            }

            player.admin = true;

            return 'adminified ' + username;
          }
        }
        return 'player not found';
      } else {
        return 'that you are';
      }
    }
  }

  return '???';
}

function handleTick() {
  serverData.tick += 1;

  let players = Object.keys(gameState.players);

  players.forEach(sid => {
    let player = gameState.players[sid];
    if (player !== undefined && player.hasJoinedGame && player.deathTimer <= 0) {
      if (player.inputState.inputs.includes('Mouse0') && player.playerState.shotCooldown <= 0) {

        let position = player.playerState.position;
        let rotation = player.inputState.rotation;
        let forward = {x: Math.sin(rotation.y) * Math.cos(rotation.x), y: Math.sin(rotation.x), z: Math.cos(rotation.y) * Math.cos(rotation.x)};
        let bulletStart = {x: position.x + forward.x, y: position.y + 4 + forward.y, z: position.z + forward.z};
        let bulletEnd = {x: position.x + forward.x * 1000, y: position.y + 4 + forward.y * 1000, z: position.z + forward.z * 200};

        Object.keys(gameState.players).forEach(osid => {
          if (sid !== osid) {
            let otherPlayer = gameState.players[osid];
            if (otherPlayer.hasJoinedGame && otherPlayer.deathTimer <= 0) {
              let pos = otherPlayer.playerState.position;

              let intersect = movement.interceptCircleLineSeg({
                radius: 3,
                center: {x: pos.x, y: pos.z}
              }, {p1: {x: bulletStart.x, y: bulletStart.z}, p2: {x: bulletEnd.x, y: bulletEnd.z}});

              if (intersect.length > 0) {
                let point = intersect[0];
                let along = (point.x - bulletStart.x) / (bulletEnd.x - bulletStart.x);
                let height = lerp(bulletStart.y, bulletEnd.y, along);

                let oneMinusAlong = (1 - along);
                if (height >= pos.y - 2 && height <= pos.y + 3) {
                  otherPlayer.health -= Math.floor(Math.max(60 * Math.pow(oneMinusAlong, 1.2), 0));
                  otherPlayer.lastDamager = player.id;
                } else if (height >= pos.y + 3.5 && height <= pos.y + 6) {
                  otherPlayer.health -= Math.floor(Math.max(120 * Math.pow(oneMinusAlong, 1.2), 0));
                  otherPlayer.lastDamager = player.id;
                }

              }
            }

          }
        });
      }
    }
  });

  players.forEach(sid => {
    let player = gameState.players[sid];
    if (player !== undefined) {
      if (player.hasJoinedGame) {
        if (player.deathTimer <= 0) {
          let input = player.inputState;
          player.playerState = JSON.parse(JSON.stringify(movement.processMovement(input.inputs, input.prevInputs, input.rotation, player.playerState, serverData.map)));

          if (serverData.tick % 10 === 0 && player.playerState.position.y < -100) {
            player.health -= 10;
          }

          if (player.playerState.hasSupergun) {
            if (serverData.tick % 500 === 0) {
              player.health += 1;
            }
          }

          if (player.health <= 0) {
            player.deathTimer = 300;
            player.health = 0;
            let killerPlayer = gameState.players[player.lastDamager];

            if (killerPlayer != null) {
              killerPlayer.kills += 1;
              killerPlayer.health += 50;
              if (player.playerState.hasSupergun) {
                players.forEach(sid => {
                  let splayer = gameState.players[sid];
                  if (splayer.hasJoinedGame) {
                    splayer.playerState.hasSupergun = false;
                  }
                });
                killerPlayer.playerState.hasSupergun = true;
                sendChat(killerPlayer.username + ' has the supergun', 0xeeff00);
              }
              sendChat(player.username + ' was killed by ' + killerPlayer.username, 0x1199ff);
              if (killerPlayer.kills % 5 === 0) {
                sendChat(killerPlayer.username + ' is on a ' + killerPlayer.kills + ' kill streak', 0x44bbff);
              }
            } else {
              player.hasSupergun = false;
              player.deathTimer = 100;
              sendChat(player.username + ' died a tragic death', 0x1199ff);
            }
          }
        } else {
          player.deathTimer -= 1;
          if (player.deathTimer === 0) {
            player.health = 100;
            player.kills = 0;
            player.playerState.position = randomSpawnPoint();
            sendChatToPlayer(player, 'respawned', 0x1199ff);
          }
        }

        if (player.health > 100) {
          player.health = 100;
        }
      }


    }
  });

  if (players.length > 0) {
    let anyoneHasSupergun = false;
    players.forEach(sid => {
      let player = gameState.players[sid];
      if (player.hasJoinedGame && player.deathTimer <= 0) {
        if (player.playerState.hasSupergun) {
          anyoneHasSupergun = true;
        }
      }
    });
    if (!anyoneHasSupergun) {
      for (let i = 0; i < players.length; i++) {
        let player = gameState.players[players[i]];
        if (player.hasJoinedGame && player.deathTimer <= 0) {
          player.playerState.hasSupergun = true;
          sendChat(player.username + ' received a fresh supergun', 0xeeff00);
          break;
        }
      }
    }
  }


  let worldState = {tick: serverData.tick, stamp: Date.now(), players: gameState.players};
  io.emit('world_state', worldState);
}

function lerp(a, b, c){
  return (1 - c) * a + c * b;
}
