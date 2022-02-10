/*
  sSSs   .S       S.    .S_sSSs      sSSs   .S_sSSs      sSSSSs   .S       S.    .S_sSSs    
 d%%SP  .SS       SS.  .SS~YS%%b    d%%SP  .SS~YS%%b    d%%%%SP  .SS       SS.  .SS~YS%%b   
d%S'    S%S       S%S  S%S   `S%b  d%S'    S%S   `S%b  d%S'      S%S       S%S  S%S   `S%b  
S%|     S%S       S%S  S%S    S%S  S%S     S%S    S%S  S%S       S%S       S%S  S%S    S%S  
S&S     S&S       S&S  S%S    d*S  S&S     S%S    d*S  S&S       S&S       S&S  S%S    S&S  
Y&Ss    S&S       S&S  S&S   .S*S  S&S_Ss  S&S   .S*S  S&S       S&S       S&S  S&S    S&S  
`S&&S   S&S       S&S  S&S_sdSSS   S&S~SP  S&S_sdSSS   S&S       S&S       S&S  S&S    S&S  
  `S*S  S&S       S&S  S&S~YSSY    S&S     S&S~YSY%b   S&S sSSs  S&S       S&S  S&S    S&S  
   l*S  S*b       d*S  S*S         S*b     S*S   `S%b  S*b `S%%  S*b       d*S  S*S    S*S  
  .S*P  S*S.     .S*S  S*S         S*S.    S*S    S%S  S*S   S%  S*S.     .S*S  S*S    S*S  
sSS*S    SSSbs_sdSSS   S*S          SSSbs  S*S    S&S   SS_sSSS   SSSbs_sdSSS   S*S    S*S  
YSS'      YSSP~YSSY    S*S           YSSP  S*S    SSS    Y~YSSY    YSSP~YSSY    S*S    SSS  
                       SP                  SP                                   SP          
                       Y                   Y                                    Y           
                                                                                            
    
    Hello, if you're reading this you're probably trying to hack the game. Hi Nathan!
    The game uses a server-authoritative architechture, which will probably make your
    job a lot harder, so I wish you luck with that.

    Useful articles:
        https://www.gabrielgambetta.com/client-server-game-architecture.html
            The guide I used to make the game
        https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_is_a_web_server
            What is a web server?
        https://socket.io/get-started/chat
            The multiplayer networking library (this may be quite useful)
*/

import * as THREE from 'https://cdn.skypack.dev/three';

let storage = {
    localSettings: {
        sensitivity: 1
    }
}

let localWorldState = {
    spawnPoints: [],
    supergunPosition: [],
    players: {

    }
}

let localPlayerState = {
    position: {x: 0, y: 12, z: 0},
    velocity: {x: 0, y: 0, z: 0},
    canJump: true,
};

let localInputState = {
    rotation: {x: 0, y: 0},
    prevInputs: [],
    inputs: []
};

let clientData = {
    inputCache: {},
    tick: 0
}

let game = {
    gameCamera: undefined,
    orbitCamera: undefined,
    scene: undefined,
    renderer: undefined,
    
    mouseLocked: false,
    inGame: false,
    map: [],
    mapLevel: [],

    playerMeshes: {},

    movementInterval: undefined,

    username: "nathan_is_short",
}

let assets = {
    font: undefined,
    textures: {
        walls: undefined
    }
};

let SERVER_IP = "https://supergun.herokuapp.com";
const socket = io(SERVER_IP);

$('#joinButton').click(function () {
    game.username = $('#usernameField').val();
    if (game.username === '') {
        game.username = 'turbo_dumbass_cumwipe';
    } else if (game.username.length > 32) {
        game.username = game.username.substring(0, 31);
    }

    socket.emit('register', {username: game.username});
});

socket.on("register_accept", (data) => {
    game.inGame = true;
    localInputState.rotation = {x: 0, y: 0};
    clientData.tick = data.tick + Math.floor((Date.now() - data.stamp) / 5);
    game.movementInterval = setInterval(handleSubtick, 5);
});

socket.on("player_add", (data) => {
    if (game.inGame) {
        data.added.forEach(player => {
            let textGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            let headGeometry = new THREE.BoxGeometry(1, 1, 1);
            let bodyGeometry = new THREE.BoxGeometry(1.5, 3.5, 1.5);

            let material = new THREE.MeshLambertMaterial({color: 0x0022ee});

            let textMesh = new THREE.Mesh(textGeometry, material);
            let headMesh = new THREE.Mesh(headGeometry, material);
            let bodyMesh = new THREE.Mesh(bodyGeometry, material);

            game.scene.add(textMesh);
            game.scene.add(headMesh);
            game.scene.add(bodyMesh);

            bodyMesh.position.y = 1.75;
            headMesh.position.y = 3.75;
            textMesh.position.y = 5;

            game.playerMeshes[player.id] = {
                username: player.username,
                body: bodyMesh,
                head: headMesh,
                text: textMesh,
            };
        });
    }
});

socket.on('world_state', (data) => {
    if (game.inGame) {
        // correct clock
        let prevTick = clientData.tick;
        clientData.tick = data.tick + Math.floor( (Date.now() - data.stamp) / 5);
    }
});


init();

async function init() {

	game.gameCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    game.orbitCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    
	game.scene = new THREE.Scene();

    await loadMap();
    

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x55555f);
    game.scene.add(ambientLight);

    let directionalLight = new THREE.DirectionalLight(0xfffff0, 0.8);
    directionalLight.position.set(0.7, 1, 0.2);
    game.scene.add(directionalLight);

	game.renderer = new THREE.WebGLRenderer({antialias: true});
    game.renderer.setClearColor(0xcccccc);
	game.renderer.setSize(window.innerWidth, window.innerHeight);
	game.renderer.setAnimationLoop(draw);

	document.body.appendChild(game.renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener('keydown', keyPressed, false);
    document.addEventListener('keyup', keyReleased, false);
    document.addEventListener('mousemove', mouseMoved, false);
    document.addEventListener('mousedown', mousePressed, false);
    document.addEventListener('mouseup', mouseReleased, false);

    document.addEventListener('pointerlockchange', mouseLocked, false);

}

function handleSubtick() {
    if (game.inGame) {
        localPlayerState = processMovement(localInputState.inputs, localInputState.prevInputs, localInputState.rotation, localPlayerState, game.map);

        clientData.inputCache[clientData.tick] = {...localInputState};

        clientData.tick += 1;
        if (clientData.tick % 4 === 0) {
            handleTick();
        }
    }
    localInputState.prevInputs = localInputState.inputs;
}

function handleTick() {
    let loggedInputs = [];
    Object.keys(clientData.inputCache).forEach(key => {
        if (key >= clientData.tick - 4) {
            loggedInputs.push(clientData.inputCache[key]);
        }
    });
    if (clientData.tick % 80 === 0) {
        console.log(loggedInputs);
    }
    socket.emit('input_state', {
        logged: loggedInputs,
    });
}

async function loadMap() {
    await fetch(SERVER_IP + "/map")
        .then(res => res.json())
        .then(json => game.map = json);

    let geometry = new THREE.BoxGeometry(16, 12, 16);
    let bridgeGeometry = new THREE.BoxGeometry(16, 2, 16);
    let bouncerGeometry = new THREE.CylinderGeometry(4, 4, 2);

	let lightMaterial = new THREE.MeshLambertMaterial({color: 0xeeeeeee});
    let darkMaterial = new THREE.MeshLambertMaterial({color: 0xaaaaaaa});

    let bouncerMaterial = new THREE.MeshLambertMaterial({color: 0xe0119f});

    for (let y = 0; y < game.map.length; y++) {
        for (let x = 0; x < 15; x++) {
            for (let z = 0; z < 15; z++) {
                let currentTile = game.map[y][x][z];
                let mapBox;

                if (currentTile[0] === '*') { // Regular Wall
                    mapBox = new THREE.Mesh(geometry, (x + y + z) % 2 === 0 ? lightMaterial : darkMaterial);
                } else if (currentTile[0] === '_') { // Bridge
                    mapBox = new THREE.Mesh(bridgeGeometry, (x + y + z) % 2 === 0 ? lightMaterial : darkMaterial);
                } else if (currentTile[0] === 'I') {
                    mapBox = new THREE.Mesh(bouncerGeometry, bouncerMaterial);
                }

                if (currentTile[0] !== '.') {

                    mapBox.position.x = x * 16 + 8;
                    if (currentTile[0] === '_') {
                        mapBox.position.y = y * 12 + 12;
                    } else if (currentTile[0] === 'I') {
                        mapBox.position.y = y * 12 + 1;
                    } else if (currentTile[0] === '*') {
                        mapBox.position.y = y * 12 + 7;
                    }
                    mapBox.position.z = z * 16 + 8;
                
                    game.scene.add(mapBox);
                    game.mapLevel.push(mapBox);
                }
            }
        }
    }
}

function setPrevInputs() {
    localInputState.prevInputs = [...localInputState.inputs];
}

function mousePressed(event) {
    setPrevInputs();
    if (!game.mouseLocked && game.inGame) {
        game.renderer.domElement.requestPointerLock();
    }
    if (!localInputState.inputs.includes('Mouse' + event.button)) localInputState.inputs.push('Mouse' + event.button);
}

function mouseLocked() {
    game.mouseLocked = document.pointerLockElement === game.renderer.domElement;

}

function mouseReleased(event) {
    setPrevInputs();
    localInputState.inputs = localInputState.inputs.filter(code => {
        return code !== 'Mouse' + event.button;
    });
}

function mouseMoved(event) {
    localInputState.rotation.x -= event.movementY * storage.localSettings.sensitivity * deltaTime * 0.0001;
    localInputState.rotation.y -= event.movementX * storage.localSettings.sensitivity * deltaTime * 0.0001;

    if (localInputState.rotation.x > Math.PI / 2 - 0.01) {
        localInputState.rotation.x = Math.PI / 2 - 0.01;
    }
    if (localInputState.rotation.x < -Math.PI / 2 + 0.01) {
        localInputState.rotation.x = -Math.PI / 2 + 0.01;
    }
}

function keyPressed(event) {
    setPrevInputs();
    if (!localInputState.inputs.includes(event.code)) localInputState.inputs.push(event.code);
}

function keyReleased(event) {
    setPrevInputs();
    localInputState.inputs = localInputState.inputs.filter(code => {
        return code !== event.code;
    });
}

function onWindowResize() {

    game.gameCamera.aspect = window.innerWidth / window.innerHeight;
    game.gameCamera.updateProjectionMatrix();
    game.orbitCamera.aspect = window.innerWidth / window.innerHeight;
    game.orbitCamera.updateProjectionMatrix();

    game.renderer.setSize(window.innerWidth, window.innerHeight);

}

let deltaTime = 0;
let prevTime = 0;

function update(time) {
    deltaTime = time - prevTime;
    localInputState.prevInputs = localInputState.inputs; 

    let position = localPlayerState.position;
    let rotation = localInputState.rotation;

    if (game.inGame) {
        game.gameCamera.position.set(position.x, position.y + 4, position.z);
        game.gameCamera.lookAt(position.x + Math.sin(rotation.y) * Math.cos(rotation.x), position.y + 4 + Math.sin(rotation.x), position.z + Math.cos(rotation.y) * Math.cos(rotation.x));

        $('#inGame').css('display', 'inline-block');
        $('#mainMenu').css('display', 'none');
    } else {
        game.orbitCamera.position.set(Math.sin(time * 0.0001) * 140 + 120, 50, Math.cos(time * 0.0001) * 140 + 120);
        game.orbitCamera.lookAt(120, 40, 120);

        $('#inGame').css('display', 'none');
        $('#mainMenu').css('display', 'inline-block');

        storage.localSettings.sensitivity = Math.pow($('#sensSlider').val(), 3);
        let sens = storage.localSettings.sensitivity.toLocaleString(
            undefined,
            {minimumFractionDigits: 2, maximumFractionDigits: 2}
        );
        $('#sensValue').text('Sensitivity (' + sens  + ')')
    }

}

function draw(time) {
    update(time);

	game.renderer.render(game.scene, game.inGame ? game.gameCamera : game.orbitCamera);

    prevTime = time;
}