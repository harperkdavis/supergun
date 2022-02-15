function processMovement(inputs, prevInputs, rotation, lps, map) {

    const PLAYER_SPEED = 0.06, JUMP_HEIGHT = 0.35, GRAVITY = 0.006, SLOWDOWN = 1.3, RECOIL = 0.5;

    lps.slowdown = lerp(lps.slowdown, SLOWDOWN, 0.1);

    if (inputs.includes('KeyW')) {
        lps.velocity.x += Math.sin(rotation.y) * PLAYER_SPEED;
        lps.velocity.z += Math.cos(rotation.y) * PLAYER_SPEED;
    }
    if (inputs.includes('KeyA')) {
        lps.velocity.x += Math.sin(rotation.y + Math.PI / 2) * PLAYER_SPEED;
        lps.velocity.z += Math.cos(rotation.y + Math.PI / 2) * PLAYER_SPEED;
    }
    if (inputs.includes('KeyD')) {
        lps.velocity.x += Math.sin(rotation.y - Math.PI / 2) * PLAYER_SPEED;
        lps.velocity.z += Math.cos(rotation.y - Math.PI / 2) * PLAYER_SPEED;
    }
    if (inputs.includes('KeyS')) {
        lps.velocity.x += Math.sin(rotation.y + Math.PI) * PLAYER_SPEED;
        lps.velocity.z += Math.cos(rotation.y + Math.PI) * PLAYER_SPEED;
    }
    if (inputs.includes('Space') && lps.canJump) {
        lps.velocity.y = JUMP_HEIGHT;
        lps.canJump = false;
    }
    lps.velocity.x /= lps.slowdown;
    lps.velocity.z /= lps.slowdown;

    if (inputs.includes('Mouse0') && lps.shotCooldown <= 0) {
        lps.velocity.y += -Math.sin(rotation.x) * RECOIL * 0.5 * (lps.hasSupergun ? 0.4 : 1.0);
        lps.velocity.x += -Math.sin(rotation.y) * RECOIL * Math.cos(rotation.x) * (lps.hasSupergun ? 0.2 : 1.0);
        lps.velocity.z += -Math.cos(rotation.y) * RECOIL * Math.cos(rotation.x) * (lps.hasSupergun ? 0.2 : 1.0);
        lps.slowdown = 1;
        lps.canJump = false;

        if (lps.hasSupergun) {
            lps.shotCooldown = 8;
        } else {
            lps.shotCooldown = 64;
        }
    }

    if (lps.shotCooldown > 0) {
        lps.shotCooldown -= 1;
    }

    lps.velocity.y -= GRAVITY;

    let oldPos = {x: lps.position.x, y: lps.position.y, z: lps.position.z};
    let newPos = {x: lps.position.x + lps.velocity.x,
        y: lps.position.y + lps.velocity.y,
        z: lps.position.z + lps.velocity.z};
    for (let x = Math.floor(newPos.x / 16) - 1; x <= Math.floor(newPos.x / 16) + 1; x++) {
        for (let z = Math.floor(newPos.z / 16) - 1; z <= Math.floor(newPos.z / 16) + 1; z++) {
            for (let y = Math.floor(newPos.y / 12) - 1; y <= Math.floor(newPos.y / 12) + 1; y++) {
                if (y >= 0 && y < map.length && isWithin(x, z, 0, 0, 14, 14)) {
                    let mapBox = map[y][x][z];

                    if (mapBox[0] === '*') {

                        if (newPos.y + 4 >= y * 12 && newPos.y + 0.01 < y * 12 + 12 && isWithin(newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, (x + 1) * 16 + 0.5, (z + 1) * 16 + 0.5)) {
                            let northIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 + 16 + 0.5, z * 16 - 0.5);
                            if (northIntersect !== false) {
                                newPos.z = northIntersect.y;
                                lps.canJump = true;
                            } else {
                                let southIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 + 16.5, x * 16 + 16 + 0.5, z * 16 + 16.5);
                                if (southIntersect !== false) {
                                    newPos.z = southIntersect.y;
                                    lps.canJump = true;
                                } else {
                                    let westIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 - 0.5, z * 16 + 16.5);
                                    if (westIntersect !== false) {
                                        newPos.x = westIntersect.x;
                                        lps.canJump = true;
                                    } else {
                                        let eastIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 + 16.5, z * 16 - 0.5, x * 16 + 16.5, z * 16 + 16.5);
                                        if (eastIntersect !== false) {
                                            newPos.x = eastIntersect.x;
                                            lps.canJump = true;
                                        } else { // Top / Bottom
                                            if (isWithin(newPos.x, newPos.z, x * 16, z * 16, (x + 1) * 16, (z + 1) * 16)) {
                                                if (newPos.y < oldPos.y && newPos.y < y * 12 + 12) {
                                                    newPos.y = y * 12 + 12;
                                                    lps.velocity.y = 0;
                                                    lps.canJump = true;
                                                } else if (newPos.y + 4 > y * 12 && newPos.y < y * 12 + 6) {
                                                    newPos.y = y * 12 - 4;
                                                    lps.velocity.y = 0;
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
                                lps.canJump = true;
                            } else {
                                let southIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 + 16.5, x * 16 + 16 + 0.5, z * 16 + 16.5);
                                if (southIntersect !== false) {
                                    newPos.z = southIntersect.y;
                                    lps.canJump = true;
                                } else {
                                    let westIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 - 0.5, z * 16 - 0.5, x * 16 - 0.5, z * 16 + 16.5);
                                    if (westIntersect !== false) {
                                        newPos.x = westIntersect.x;
                                        lps.canJump = true;
                                    } else {
                                        let eastIntersect = calculateIntersection(oldPos.x, oldPos.z, newPos.x, newPos.z, x * 16 + 16.5, z * 16 - 0.5, x * 16 + 16.5, z * 16 + 16.5);
                                        if (eastIntersect !== false) {
                                            newPos.x = eastIntersect.x;
                                            lps.canJump = true;
                                        } else { // Top / Bottom
                                            if (isWithin(newPos.x, newPos.z, x * 16, z * 16, (x + 1) * 16, (z + 1) * 16)) {
                                                if (newPos.y < oldPos.y && newPos.y < y * 12 + 12) {
                                                    newPos.y = y * 12 + 12;
                                                    lps.velocity.y = 0;
                                                    lps.canJump = true;
                                                } else if (newPos.y + 4 > y * 12 + 10 && newPos.y < y * 12 + 11) {
                                                    newPos.y = y * 12 + 6;
                                                    lps.velocity.y = 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                    } else if (mapBox[0] === 'I') {
                        if (Math.pow(newPos.x - (x * 16 + 8), 2) + Math.pow(newPos.y - (y * 12), 2) + Math.pow(newPos.z - (z * 16 + 8), 2) <= 20) {
                            lps.velocity.y = JUMP_HEIGHT * 2.4;
                            lps.canJump = true;
                        }
                    }

                }
            }
        }
    }

    lps.position.x = newPos.x;
    lps.position.y = newPos.y;
    lps.position.z = newPos.z;

    return lps;

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

function interceptCircleLineSeg(circle, line){
    let a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if(isNaN(d)){ // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;
    retP1 = {};   // return points
    retP2 = {}
    ret = []; // return array
    if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }
    return ret;
}


if (exports !== undefined) {
    exports.processMovement = processMovement;
    exports.interceptCircleLineSeg = interceptCircleLineSeg;
}

function lerp(a, b, c){
    return (1 - c) * a + c * b;
}