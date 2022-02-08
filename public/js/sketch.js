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

let game = {
    gameCamera: undefined,
    orbitCamera: undefined,
    scene: undefined,
    renderer: undefined,
    
    mouseLocked: false,
    inGame: false,
    map: [],
    mapLevel: [],

    username: "nathan_is_short",
}

let assets = {
    font: undefined,
    textures: {
        walls: undefined
    }
};

let SERVER_IP = "https://supergun.herokuapp.com";
const socket = io();

$('#joinButton').click(function () {
    game.username = $('#usernameField').val();
    if (game.username === '') {
        game.username = 'stinkyguy';
    } else if (game.username.length > 32) {
        game.username = game.username.substring(0, 31);
    }

    socket.emit('register', {username: game.username});
});

socket.on("register_accept", (data) => {
    game.inGame = true;
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

    setInterval(function () {
        if (game.inGame) {
            processMovement(localInputState.inputs, localInputState.prevInputs, localInputState.rotation);
        }
        localInputState.prevInputs = localInputState.inputs;
    }, 5);

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

function processMovement(inputs, prevInputs, rotation) {

    if (inputs.includes('KeyW')) {
        localPlayerState.velocity.x += Math.sin(rotation.y) * 0.01;
        localPlayerState.velocity.z += Math.cos(rotation.y) * 0.01;
    }
    if (inputs.includes('KeyA')) {
        localPlayerState.velocity.x += Math.sin(rotation.y + Math.PI / 2) * 0.01;
        localPlayerState.velocity.z += Math.cos(rotation.y + Math.PI / 2) * 0.01;
    }
    if (inputs.includes('KeyD')) {
        localPlayerState.velocity.x += Math.sin(rotation.y - Math.PI / 2) * 0.01;
        localPlayerState.velocity.z += Math.cos(rotation.y - Math.PI / 2) * 0.01;
    }
    if (inputs.includes('KeyS')) {
        localPlayerState.velocity.x += Math.sin(rotation.y + Math.PI) * 0.01;
        localPlayerState.velocity.z += Math.cos(rotation.y + Math.PI) * 0.01;
    }
    if (inputs.includes('Space') && localPlayerState.canJump) {
        localPlayerState.velocity.y = 0.15;
        localPlayerState.canJump = false;
    }
    localPlayerState.velocity.x /= 1.1;
    localPlayerState.velocity.z /= 1.1;

    localPlayerState.velocity.y -= 0.0015;

    let oldPos = {x: localPlayerState.position.x, y: localPlayerState.position.y, z: localPlayerState.position.z};
    let newPos = {x: localPlayerState.position.x + localPlayerState.velocity.x,
        y: localPlayerState.position.y + localPlayerState.velocity.y,
        z: localPlayerState.position.z + localPlayerState.velocity.z};
    for (let x = Math.floor(newPos.x / 16) - 1; x <= Math.floor(newPos.x / 16) + 1; x++) {
        for (let z = Math.floor(newPos.z / 16) - 1; z <= Math.floor(newPos.z / 16) + 1; z++) {
            for (let y = Math.floor(newPos.y / 12) - 1; y <= Math.floor(newPos.y / 12) + 1; y++) {
                if (y >= 0 && y < game.map.length && isWithin(x, z, 0, 0, 14, 14)) {
                    let mapBox = game.map[y][x][z];

                    if (mapBox[0] === '*') {

                        if (newPos.y + 4 >= y * 12 && newPos.y + 0.01 < y * 12 + 12 && isWithin(newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, (x + 1) * 16 + 0.5, (z + 1) * 16 + 0.5)) {
                            let northIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 + 16 + 0.5, z * 16 - 0.5);
                            if (northIntersect !== false) {
                                newPos.z = northIntersect.y;
                                localPlayerState.canJump = true;
                            } else {
                                let southIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 + 16.5, x * 16 + 16 + 0.5, z * 16 + 16.5);
                                if (southIntersect !== false) {
                                    newPos.z = southIntersect.y;
                                    localPlayerState.canJump = true;
                                } else {
                                    let westIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 - 0.5, z * 16 + 16.5);
                                    if (westIntersect !== false) {
                                        newPos.x = westIntersect.x;
                                        localPlayerState.canJump = true;
                                    } else {
                                        let eastIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 + 16.5, z * 16 - 0.5, x * 16 + 16.5, z * 16 + 16.5);
                                        if (eastIntersect !== false) {
                                            newPos.x = eastIntersect.x;
                                            localPlayerState.canJump = true;
                                        } else { // Top / Bottom
                                            if (isWithin(newPos.x, newPos.z, x * 16, z * 16, (x + 1) * 16, (z + 1) * 16)) {
                                                if (newPos.y < oldPos.y && newPos.y < y * 12 + 12) {
                                                    newPos.y = y * 12 + 12;
                                                    localPlayerState.velocity.y = 0;
                                                    localPlayerState.canJump = true;
                                                } else if (newPos.y + 4 > y * 12 && newPos.y < y * 12 + 6) {
                                                    newPos.y = y * 12 - 2;
                                                    localPlayerState.velocity.y = 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    } else if (mapBox[0] === '_') {

                        if (newPos.y + 4 >= y * 12 + 10 && newPos.y + 0.01 < y * 12 + 12 && isWithin(newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, (x + 1) * 16 + 0.5, (z + 1) * 16 + 0.5)) {
                            let northIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 + 16 + 0.5, z * 16 - 0.5);
                            if (northIntersect !== false) {
                                newPos.z = northIntersect.y;
                                localPlayerState.canJump = true;
                            } else {
                                let southIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 + 16.5, x * 16 + 16 + 0.5, z * 16 + 16.5);
                                if (southIntersect !== false) {
                                    newPos.z = southIntersect.y;
                                    localPlayerState.canJump = true;
                                } else {
                                    let westIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 - 0.5, z * 16 + 16.5);
                                    if (westIntersect !== false) {
                                        newPos.x = westIntersect.x;
                                        localPlayerState.canJump = true;
                                    } else {
                                        let eastIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 + 16.5, z * 16 - 0.5, x * 16 + 16.5, z * 16 + 16.5);
                                        if (eastIntersect !== false) {
                                            newPos.x = eastIntersect.x;
                                            localPlayerState.canJump = true;
                                        } else { // Top / Bottom
                                            if (isWithin(newPos.x, newPos.z, x * 16, z * 16, (x + 1) * 16, (z + 1) * 16)) {
                                                if (newPos.y < oldPos.y && newPos.y < y * 12 + 12) {
                                                    newPos.y = y * 12 + 12;
                                                    localPlayerState.velocity.y = 0;
                                                    localPlayerState.canJump = true;
                                                } else if (newPos.y + 4 > y * 12 + 10 && newPos.y < y * 12 + 11) {
                                                    newPos.y = y * 12 + 6;
                                                    localPlayerState.velocity.y = 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    } else if (mapBox[0] === 'I') {
                        if (Math.pow(newPos.x - (x * 16 + 8), 2) + Math.pow(newPos.y - (y * 12), 2) + Math.pow(newPos.z - (z * 16 + 8), 2) <= 20) {
                            localPlayerState.velocity.y = 0.3;
                        }
                    }

                }
            }
        }
    }
    
    localPlayerState.position.x = newPos.x;
    localPlayerState.position.y = newPos.y;
    localPlayerState.position.z = newPos.z;

}

function draw(time) {
    update(time);
    

	game.renderer.render(game.scene, game.inGame ? game.gameCamera : game.orbitCamera);

    prevTime = time;
}

function isWithin(x, y, x1, y1, x2, y2) {
    return (x >= x1 && x <= x2 && y >= y1 && y <= y2);
}


// https://gist.github.com/gordonwoodhull/50eb65d2f048789f9558
const eps = 0.0000001;
function between(a, b, c) {
    return a - eps <= b && b <= c + eps;
}
function calculateIntersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    let x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
        ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    let y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
        ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x) || isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!between(x2, x, x1)) {return false;}
        } else {
            if (!between(x1, x, x2)) {return false;}
        }
        if (y1>=y2) {
            if (!between(y2, y, y1)) {return false;}
        } else {
            if (!between(y1, y, y2)) {return false;}
        }
        if (x3>=x4) {
            if (!between(x4, x, x3)) {return false;}
        } else {
            if (!between(x3, x, x4)) {return false;}
        }
        if (y3>=y4) {
            if (!between(y4, y, y3)) {return false;}
        } else {
            if (!between(y3, y, y4)) {return false;}
        }
    }
    return {x: x, y: y};
}