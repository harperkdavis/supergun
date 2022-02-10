function processMovement(inputs, prevInputs, rotation, lps, map) {

    if (inputs.includes('KeyW')) {
        lps.velocity.x += Math.sin(rotation.y) * 0.01;
        lps.velocity.z += Math.cos(rotation.y) * 0.01;
    }
    if (inputs.includes('KeyA')) {
        lps.velocity.x += Math.sin(rotation.y + Math.PI / 2) * 0.01;
        lps.velocity.z += Math.cos(rotation.y + Math.PI / 2) * 0.01;
    }
    if (inputs.includes('KeyD')) {
        lps.velocity.x += Math.sin(rotation.y - Math.PI / 2) * 0.01;
        lps.velocity.z += Math.cos(rotation.y - Math.PI / 2) * 0.01;
    }
    if (inputs.includes('KeyS')) {
        lps.velocity.x += Math.sin(rotation.y + Math.PI) * 0.01;
        lps.velocity.z += Math.cos(rotation.y + Math.PI) * 0.01;
    }
    if (inputs.includes('Space') && lps.canJump) {
        lps.velocity.y = 0.15;
        lps.canJump = false;
    }
    lps.velocity.x /= 1.1;
    lps.velocity.z /= 1.1;

    lps.velocity.y -= 0.0015;

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
                                                    newPos.y = y * 12 - 2;
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
                            lps.velocity.y = 0.4;
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