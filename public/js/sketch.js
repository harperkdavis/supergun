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
        sensitivity: 0.04
    }
}

let localPlayerState = {
    position: [0, -10000, 500],
};

let localInputState = {
    rotation: [0, 0],
    inputs: []
};

let game = {
    camera: undefined,
    scene: undefined,
    renderer: undefined,
}

let assets = {
    font: undefined,
    textures: {
        walls: undefined
    }
};

let mesh;

init();

function init() {

	game.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
	game.camera.position.z = 1;

	game.scene = new THREE.Scene();

	let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
	let material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	game.scene.add(mesh);

	game.renderer = new THREE.WebGLRenderer({antialias: true});
	game.renderer.setSize(window.innerWidth, window.innerHeight);
	game.renderer.setAnimationLoop(draw);

	document.body.appendChild(game.renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);

}



function onWindowResize(){

    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();

    game.renderer.setSize(window.innerWidth, window.innerHeight);

}

function update() {

}

function draw(time) {
    update();

	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;

	game.renderer.render(game.scene, game.camera);

}