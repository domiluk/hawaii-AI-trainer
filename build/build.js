"use strict";
const BOAT_COLLISION_RADIUS = 28;
const ROTATE_BY = 1.5 * 60;
const MAX_SPEED = 6.5 * 60;
const ACCEL = 0.05 * 3600;
const SLOWDOWN = 0.08 * 3600;
const INPUTS = 8;
const HIDDEN = 16;
const OUTPUTS = 2;
class Boat {
    constructor(net) {
        this.x = 1060;
        this.y = 1200;
        this.speed = 0;
        this.rot = -54;
        this.checkpoint = 0;
        this.finishedLap = false;
        this.timeAtCheckpoints = [];
        this.lapTime = 0;
        this.cpTime = 0;
        this.bmp = lodzelena;
        if (net == null) {
            this.net = new MLP(INPUTS, HIDDEN, OUTPUTS);
        }
        else {
            this.net = net;
        }
        this.fitness = 0;
        this.probToPick = 0;
    }
    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.rot + 90);
        image(this.bmp, -this.bmp.width / 2, -this.bmp.height / 2);
        if (debug) {
            stroke(0);
            noFill();
            circle(0, 0, BOAT_COLLISION_RADIUS * 2);
        }
        pop();
    }
    update() {
        if (this.finishedLap)
            return;
        const accel = (ACCEL * deltaTime) / 1000;
        const slowdown = (SLOWDOWN * deltaTime) / 1000;
        const rotate_by = (ROTATE_BY * deltaTime) / 1000;
        const pos = createVector(this.x, this.y);
        const QC = [];
        const dC = [];
        for (let i = 0; i < 4; i++) {
            QC[i] = closestPointOnSegment(checkpointSegments[i], pos);
            dC[i] = p5.Vector.sub(pos, QC[i]).mag();
        }
        const inputs = [[]];
        inputs[0][0] = map(this.x, 0, 2100, -1, 1);
        inputs[0][1] = map(this.y, 0, 2100, -1, 1);
        inputs[0][2] = sin(this.rot);
        inputs[0][3] = cos(this.rot);
        inputs[0][4] = map(QC[this.checkpoint].x, 0, 2100, -1, 1);
        inputs[0][5] = map(QC[this.checkpoint].y, 0, 2100, -1, 1);
        inputs[0][6] = this.checkpoint < 2 ? 1 : 0;
        inputs[0][7] = this.checkpoint >= 2 ? 1 : 0;
        const move = this.net.predict01(inputs);
        this.speed += accel;
        if (move[0]) {
            this.rot -= rotate_by;
        }
        if (move[1]) {
            this.rot += rotate_by;
        }
        this.speed = constrain(this.speed, 0, MAX_SPEED);
        const r = BOAT_COLLISION_RADIUS;
        const vx = this.speed * cos(this.rot);
        const vy = this.speed * sin(this.rot);
        if ((this.x - r < 0 && vx < 0) || (this.x + r >= 2100 && vx > 0)) {
            this.speed *= 0.5;
            this.rot = atan2(vy, -vx);
            this.x = constrain(this.x, r, 2100 - r - 1);
        }
        if ((this.y - r < 0 && vy < 0) || (this.y + r >= 1900 && vy > 0)) {
            this.speed *= 0.5;
            this.rot = atan2(-vy, vx);
            this.y = constrain(this.y, r, 1900 - r - 1);
        }
        if (dC[this.checkpoint] < BOAT_COLLISION_RADIUS) {
            this.timeAtCheckpoints[this.checkpoint] = this.cpTime;
            this.cpTime = 0;
            this.checkpoint++;
        }
        if (this.checkpoint == 4) {
            this.finishedLap = true;
        }
        this.x += (this.speed * cos(this.rot) * deltaTime) / 1000;
        this.y += (this.speed * sin(this.rot) * deltaTime) / 1000;
        this.lapTime += deltaTime / 1000;
        this.cpTime += deltaTime / 1000;
    }
    calcFitness() {
        this.fitness = 0.1;
        for (let f = this.checkpoint; f > 0; f--) {
            this.fitness += f;
        }
        if (this.finishedLap) {
            this.fitness += pow(1.5, TIMEOUT - this.lapTime);
        }
        if (this.timeAtCheckpoints[0] != null) {
            this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[0])) - 1;
        }
        if (this.timeAtCheckpoints[1] != null) {
            this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[1])) - 1;
        }
        if (this.timeAtCheckpoints[2] != null) {
            this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[2])) - 1;
        }
        if (this.timeAtCheckpoints[3] != null) {
            this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[3])) - 1;
        }
    }
}
const DT_HISTORY_LENGTH = 400;
const dtHistory = Array(DT_HISTORY_LENGTH).fill(0);
let dtHistoryIndex = 0;
function drawDeltaTimeHistoryBar() {
    dtHistory[dtHistoryIndex] = deltaTime;
    for (let i = 0; i < dtHistory.length; i++) {
        stroke(0);
        let diffFromCurrent = dtHistoryIndex - i;
        if (diffFromCurrent < 0) {
            diffFromCurrent += DT_HISTORY_LENGTH;
        }
        if (diffFromCurrent > DT_HISTORY_LENGTH - 255) {
            stroke(0, 255 - (diffFromCurrent - DT_HISTORY_LENGTH + 255));
        }
        const x = 884 - DT_HISTORY_LENGTH - 24 + i;
        noFill();
        line(x, 2, x, 2 + dtHistory[i]);
    }
    dtHistoryIndex = (dtHistoryIndex + 1) % DT_HISTORY_LENGTH;
    noStroke();
    fill(0);
    text("" + Math.round(deltaTime * 10) / 10, 884 - 24, 10);
}
const FITNESSES = Array(100).fill(0);
function drawProbs() {
    for (let i = 0; i < 100; i++) {
        stroke(0);
        noFill();
        const x = i * 4;
        const y = FITNESSES[i];
        line(10 + x, 790 - y, 10 + x + 4, 790 - y);
    }
}
class Island {
    constructor() {
        this.points = [];
        this.segments = [];
    }
    load(lines) {
        for (let line of lines) {
            const [x, y] = line.split(" ").map(number => parseInt(number));
            this.points.push({ x: x, y: y });
        }
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = i + 1 == this.points.length ? this.points[0] : this.points[i + 1];
            this.segments.push([p1, p2]);
        }
    }
    draw() {
        for (let segment of this.segments) {
            drawSegment(segment);
        }
        for (let point of this.points) {
            noStroke();
            fill(0);
            ellipse(point.x, point.y, 5, 5);
        }
    }
    collideWith(boat) {
        for (let segment of this.segments) {
            const pos = createVector(boat.x, boat.y);
            const vel = createVector(boat.speed * cos(boat.rot), boat.speed * sin(boat.rot));
            const { pos: newPos, vel: newVel } = collideCircleWithSegment(pos, vel, BOAT_COLLISION_RADIUS, segment, 0.5);
            boat.x = newPos.x;
            boat.y = newPos.y;
            boat.speed = newVel.mag();
            if (newVel.mag() > 1e-8) {
                boat.rot = atan2(newVel.y, newVel.x);
            }
        }
    }
}
class MLP {
    constructor(nIn, nHidden, nOut) {
        this.nIn = nIn;
        this.nHidden = nHidden;
        this.nOut = nOut;
        this.W1 = randn(nIn, nHidden, Math.sqrt(2 / nIn));
        this.b1 = randn(1, nHidden, Math.sqrt(2 / nIn));
        this.W2 = randn(nHidden, nOut, Math.sqrt(2 / nHidden));
        this.b2 = randn(1, nOut, Math.sqrt(2 / nHidden));
    }
    forward(x1xN) {
        const z1 = add(matmul(x1xN, this.W1), this.b1);
        const h = relu(z1);
        const z2 = add(matmul(h, this.W2), this.b2);
        const o = sigmoid(z2);
        return { z1, h, z2, o };
    }
    predict01(x1xN, thr = 0.5) {
        const { o } = this.forward(x1xN);
        return o[0].map(v => (v > thr ? 1 : 0));
    }
    predictProb(x1xN) {
        const { o } = this.forward(x1xN);
        return o[0].slice();
    }
}
function zeros(r, c) {
    const a = new Array(r);
    for (let i = 0; i < r; i++) {
        a[i] = new Array(c).fill(0);
    }
    return a;
}
function randn(r, c, std = 1) {
    const a = new Array(r);
    for (let i = 0; i < r; i++) {
        a[i] = new Array(c);
        for (let j = 0; j < c; j++) {
            a[i][j] = std * gaussRand();
        }
    }
    return a;
}
function gaussRand() {
    let u = 1 - Math.random();
    let v = 1 - Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function matmul(A, B) {
    const r = A.length, k = A[0].length, c = B[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            let s = 0;
            for (let t = 0; t < k; t++)
                s += A[i][t] * B[t][j];
            out[i][j] = s;
        }
    }
    return out;
}
function add(A, B) {
    const r = A.length, c = A[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++)
            out[i][j] = A[i][j] + B[Math.min(i, B.length - 1)][j];
    }
    return out;
}
function scal(A, s) {
    const r = A.length, c = A[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            out[i][j] = A[i][j] * s;
    return out;
}
function transpose(A) {
    const r = A.length, c = A[0].length;
    const out = zeros(c, r);
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            out[j][i] = A[i][j];
    return out;
}
function mul(A, B) {
    const r = A.length, c = A[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            out[i][j] = A[i][j] * B[i][j];
    return out;
}
function relu(Z) {
    const r = Z.length, c = Z[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            out[i][j] = Math.max(0, Z[i][j]);
    return out;
}
function reluPrime(Z) {
    const r = Z.length, c = Z[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            out[i][j] = Z[i][j] > 0 ? 1 : 0;
    return out;
}
function sigmoid(Z) {
    const r = Z.length, c = Z[0].length;
    const out = zeros(r, c);
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++)
            out[i][j] = 1 / (1 + Math.exp(-Z[i][j]));
    return out;
}
function drawPoint(point) {
    noStroke();
    fill(0);
    ellipse(point.x, point.y, 5, 5);
}
function drawSegment(segment) {
    const [p1, p2] = segment;
    stroke(0);
    line(p1.x, p1.y, p2.x, p2.y);
}
function clamp01(value) {
    return max(0, min(1, value));
}
function closestPointOnSegment(segment, point) {
    const A = createVector(segment[0].x, segment[0].y);
    const B = createVector(segment[1].x, segment[1].y);
    const AB = p5.Vector.sub(B, A);
    const AP = p5.Vector.sub(point, A);
    const len2 = AB.dot(AB);
    if (len2 == 0)
        return A;
    const t = clamp01(AP.dot(AB) / len2);
    return A.add(AB.mult(t));
}
function reflectVelocity(vel, normal, e = 1.0) {
    const vn = vel.dot(normal);
    if (vn >= 0)
        return vel.copy();
    return p5.Vector.sub(vel, normal.copy().mult((1 + e) * vn));
}
function collideCircleWithSegment(pos, vel, radius, segment, e = 1.0) {
    const Q = closestPointOnSegment(segment, pos);
    const toCenter = p5.Vector.sub(pos, Q);
    const d = toCenter.mag();
    let normal;
    if (d < 1e-8) {
        const A = createVector(segment[0].x, segment[0].y);
        const B = createVector(segment[1].x, segment[1].y);
        const AB = B.sub(A);
        normal = createVector(-AB.y, AB.x).normalize();
    }
    else {
        normal = toCenter.normalize();
    }
    let newPos = pos.copy();
    let newVel = vel.copy();
    if (d < radius) {
        const overlap = radius - d;
        newPos.add(normal.copy().mult(overlap));
        newVel = reflectVelocity(newVel, normal, e);
    }
    return { pos: newPos, vel: newVel };
}
const debug = true;
let bg, lodzelena, lodcervena;
let boats = [];
const N_BOATS = 100;
const checkpointSegments = [
    [
        { x: 0, y: 168 },
        { x: 490, y: 520 },
    ],
    [
        { x: 935, y: 1049 },
        { x: 1190, y: 1231 },
    ],
    [
        { x: 1593, y: 1587 },
        { x: 1914, y: 1900 },
    ],
    [
        { x: 935, y: 1049 },
        { x: 1190, y: 1231 },
    ],
];
let topLeftIslandStrings;
let topLeftIsland;
let bottomRightIslandStrings;
let bottomRightIsland;
let gen = 1;
let time = 0;
const TIMEOUT = 20;
function preload() {
    bg = loadImage("images/ostrov1.png");
    lodzelena = loadImage("images/lodzelena.png");
    lodcervena = loadImage("images/lodcervena.png");
    topLeftIslandStrings = loadStrings("islands/topleft.txt");
    bottomRightIslandStrings = loadStrings("islands/bottomright.txt");
}
function setup() {
    createCanvas(884, 800);
    for (let i = 0; i < N_BOATS; i++) {
        boats[i] = new Boat(null);
    }
    angleMode(DEGREES);
    topLeftIsland = new Island();
    topLeftIsland.load(topLeftIslandStrings);
    bottomRightIsland = new Island();
    bottomRightIsland.load(bottomRightIslandStrings);
}
function draw() {
    deltaTime = 16.666666;
    time += deltaTime / 1000;
    if (time > TIMEOUT) {
        console.log("prepare gen " + (gen + 1));
        console.log("calc fitness");
        for (const boat of boats) {
            boat.calcFitness();
        }
        console.log("sort by fitness");
        boats.sort(function (a, b) {
            return b.fitness - a.fitness;
        });
        console.log("calc probability to pick based on fitness");
        let totalFitness = 0;
        for (const boat of boats) {
            totalFitness += boat.fitness;
        }
        for (const boat of boats) {
            boat.probToPick = boat.fitness / totalFitness;
        }
        console.log("boats with fitness in percentiles:");
        for (let i of [0, 50, 99]) {
            const boat = boats[i];
            console.log(i, Math.round(boat.fitness * 100000) / 100000, Math.round(boat.probToPick * 100000) / 100000, boat.timeAtCheckpoints);
        }
        for (let i = 0; i < N_BOATS; i++) {
            FITNESSES[i] = boats[i].fitness;
        }
        console.log("create new boats");
        const newBoats = [];
        for (let i = 0; i < 10; i++) {
            newBoats[i] = new Boat(boats[i].net);
        }
        for (let i = 10; i < N_BOATS; i++) {
            const b1 = pickBoat();
            const b2 = pickBoat();
            const newNet = mutate(crossover(b1.net, b2.net), 0.05);
            const newBoat = new Boat(newNet);
            newBoats[i] = newBoat;
        }
        newBoats[0].bmp = lodcervena;
        boats = newBoats;
        console.log("done");
        gen++;
        time = 0;
    }
    push();
    scale(800 / 1900);
    image(bg, 0, 0);
    for (let i = 0; i < N_BOATS; i++) {
        const boat = boats[i];
        topLeftIsland.collideWith(boat);
        bottomRightIsland.collideWith(boat);
        boat.update();
        boat.draw();
    }
    topLeftIsland.draw();
    bottomRightIsland.draw();
    for (const segment of checkpointSegments) {
        drawSegment(segment);
    }
    pop();
    drawProbs();
    noStroke();
    fill(0);
    text("gen: " + gen + " time: " + Math.floor(time), 10, 10);
}
function pickBoat() {
    let r = Math.random();
    for (const boat of boats) {
        r -= boat.probToPick;
        if (r <= 0)
            return boat;
    }
    return boats[0];
}
function crossoverMatrix(mat1, mat2) {
    const result = [];
    for (let r = 0; r < mat1.length; r++) {
        result[r] = [];
        for (let c = 0; c < mat1[0].length; c++) {
            result[r][c] = Math.random() < 0.5 ? mat1[r][c] : mat2[r][c];
        }
    }
    return result;
}
function crossover(net1, net2) {
    const net = new MLP(INPUTS, HIDDEN, OUTPUTS);
    net.W1 = crossoverMatrix(net1.W1, net2.W1);
    net.b1 = crossoverMatrix(net1.b1, net2.b1);
    net.W2 = crossoverMatrix(net1.W2, net2.W2);
    net.b2 = crossoverMatrix(net1.b2, net2.b2);
    return net;
}
function mutate(net, rate) {
    for (let netparam of [net.W1, net.b1, net.W2, net.b2]) {
        for (let r = 0; r < netparam.length; r++) {
            for (let c = 0; c < netparam[0].length; c++) {
                if (Math.random() < rate) {
                    netparam[r][c] += gaussRand();
                }
            }
        }
    }
    return net;
}
//# sourceMappingURL=build.js.map