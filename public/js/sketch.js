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

let localPlayerState = {
    position: {x: 0, y: 12, z: 0},
    velocity: {x: 0, y: 0, z: 0}
};

let localInputState = {
    rotation: {x: 0, y: 0},
    prevInputs: [],
    inputs: []
};

let game = {
    camera: undefined,
    scene: undefined,
    renderer: undefined,
    
    mouseLocked: false,
    mapLevel: []
}

let assets = {
    font: undefined,
    textures: {
        walls: undefined
    }
};

let map = [
    [
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
        ['* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* ', '* '],
    ],
    [
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '* ', '. ', '* ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '* ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '* ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '* ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '* ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '* ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '* ', '. ', '* ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
        ['. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. ', '. '],
    ],
];

init();

function init() {

	game.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    game.camera.up.set(0, 1, 0);
    
	game.scene = new THREE.Scene();

    loadMap();
    

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
        processMovement(localInputState.inputs, localInputState.prevInputs, localInputState.rotation); 
        localInputState.prevInputs = localInputState.inputs;
    }, 5);

}

function loadMap() {
    let geometry = new THREE.BoxGeometry(16, 12, 16);
	let lightMaterial = new THREE.MeshLambertMaterial({color: 0xeeeeeee});
    let darkMaterial = new THREE.MeshLambertMaterial({color: 0xaaaaaaa});

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < 15; x++) {
            for (let z = 0; z < 15; z++) {
                let currentTile = map[y][x][z];
                let mapBox;
                if (currentTile[0] === '*') { // Regular Wall
                    mapBox = new THREE.Mesh(geometry, (x + y + z) % 2 === 0 ? lightMaterial : darkMaterial);
                }

                if (currentTile[0] !== '.') {

                    mapBox.position.x = x * 16 + 8;
                    mapBox.position.y = y * 12 + 6;
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
    if (!game.mouseLocked) {
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

    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();

    game.renderer.setSize(window.innerWidth, window.innerHeight);

}

let deltaTime = 0;
let prevTime = 0;

function update(time) {
    deltaTime = time - prevTime;
    localInputState.prevInputs = localInputState.inputs; 

    let position = localPlayerState.position;
    let rotation = localInputState.rotation;

    game.camera.position.set(position.x, position.y + 2, position.z);
    game.camera.lookAt(position.x + Math.sin(rotation.y) * Math.cos(rotation.x), position.y + 2 + Math.sin(rotation.x), position.z + Math.cos(rotation.y) * Math.cos(rotation.x));
    game.camera.up.set(0, 1, 0);
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
    if (!prevInputs.includes('Space') && inputs.includes('Space')) {
        localPlayerState.velocity.y = 0.3;
    }
    localPlayerState.velocity.x /= 1.1;
    localPlayerState.velocity.z /= 1.1;

    localPlayerState.velocity.y -= 0.002;

    for (let x = Math.floor(localPlayerState.position.x % 16 - 1); x <= Math.floor(localPlayerState.position.x % 16 + 1); x++) {
        for (let z = Math.floor(localPlayerState.position.x % 16 - 1); z <= Math.floor(localPlayerState.position.x % 16 + 1); z++) {
            for (let y = Math.floor(localPlayerState.position.x % 12 - 1); y <= Math.floor(localPlayerState.position.x % 12 + 1); y++) {
                if (y >= 0 && y < map.length && isWithin(x, z, 0, 0, 14, 14)) {
                    let mapBox = map[y][x][z];
                    
                }
            }
        }
    }
    
    localPlayerState.position.x += localPlayerState.velocity.x;
    localPlayerState.position.y += localPlayerState.velocity.y;
    localPlayerState.position.z += localPlayerState.velocity.z;

    if (localPlayerState.position.y < 12) {
        localPlayerState.position.y = 12;
        localPlayerState.velocity.y = 0;
    }

}

function draw(time) {
    update(time);
    

	game.renderer.render(game.scene, game.camera);

    prevTime = time;
}

function isWithin(x, y, x1, y1, x2, y2) {
    return (x >= x1 && x <= x2 && y >= y1 && y <= y2);
}


// https://dirask.com/posts/JavaScript-how-to-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj
function calculateIntersection(p1, p2, p3, p4) {
	
    // down part of intersection point formula
    let d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
    let d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
    let d  = (d1) - (d2);

    if(d === 0) {
      return undefined;
    }

    // upper part of intersection point formula
    let u1 = (p1.x * p2.y - p1.y * p2.x); // (x1 * y2 - y1 * x2)
    let u4 = (p3.x * p4.y - p3.y * p4.x); // (x3 * y4 - y3 * x4)

    let u2x = p3.x - p4.x; // (x3 - x4)
    let u3x = p1.x - p2.x; // (x1 - x2)
    let u2y = p3.y - p4.y; // (y3 - y4)
    let u3y = p1.y - p2.y; // (y1 - y2)

    // intersection point formula

    let px = (u1 * u2x - u3x * u4) / d;
    let py = (u1 * u2y - u3y * u4) / d;

    let p = { x: px, y: py };

    return p;
}