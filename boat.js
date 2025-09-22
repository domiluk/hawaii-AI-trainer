const BOAT_COLLISION_RADIUS = 28;
const ROTATE_BY = 1.5 * 60; // px/s
const MAX_SPEED = 6.5 * 60; // px/s, originally 10
const ACCEL = 0.05 * 3600; // px/s²
const SLOWDOWN = 0.08 * 3600; // px/s²

const INPUTS = 8;  // number of inputs
const HIDDEN = 16;  // hidden size (8–16 is fine)
const OUTPUTS = 2; // outputs: left, right

class Boat {
  constructor(net) {
    this.x = 1060;
    this.y = 1200;
    this.speed = 0;
    this.rot = -54;
    this.checkpoint = 0
    this.finishedLap = false;
    this.timeAtCheckpoints = [];
    this.lapTime = 0;
    this.cpTime = 0;
    this.bmp = lodzelena;
    if (net == null) {
      this.net = new MLP(INPUTS, HIDDEN, OUTPUTS)
    } else {
      this.net = net
    }
    this.fitness = 0
    this.probToPick = 0
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
    if (this.finishedLap) return;
    
    // input
    const accel = (ACCEL * deltaTime) / 1000;
    const slowdown = (SLOWDOWN * deltaTime) / 1000;
    const rotate_by = (ROTATE_BY * deltaTime) / 1000;
    
    const pos = createVector(this.x, this.y);
    
    const QC = []
    const dC = []
    
    for (let i = 0; i < 4; i++) {
      QC[i] = closestPointOnSegment(checkpointSegments[i], pos);
      dC[i] = p5.Vector.sub(pos, QC[i]).mag();
    }
    
    const inputs = [[]]
    
    inputs[0][0] = map(this.x, 0, 2100, -1, 1)
    inputs[0][1] = map(this.y, 0, 2100, -1, 1)
    
    inputs[0][2] = sin(this.rot)
    inputs[0][3] = cos(this.rot)
    
    // inputs[0][??] = map(dC[this.checkpoint], 0, 2832, 1, 0)
    // diagonal of 2100x1900 is 2832
    
    inputs[0][4] = map(QC[this.checkpoint].x, 0, 2100, -1, 1)
    inputs[0][5] = map(QC[this.checkpoint].y, 0, 2100, -1, 1)
    
    inputs[0][6] = this.checkpoint < 2 ? 1 : 0
    inputs[0][7] = this.checkpoint >= 2 ? 1 : 0
      
    const move = this.net.predict01(inputs) // [1, 0, 1, 0]
    
    // move the boat
    this.speed += accel;
    if (move[0]) {
      this.rot -= rotate_by;
    }
    if (move[1]) {
      this.rot += rotate_by;
    }

    // limit speed
    this.speed = constrain(this.speed, 0, MAX_SPEED);

    // check collision with map edges
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

    // check collision with checkpoints and the finishline
    if (dC[this.checkpoint] < BOAT_COLLISION_RADIUS) {
      this.timeAtCheckpoints[this.checkpoint] = this.cpTime
      this.cpTime = 0
      this.checkpoint++;
    }
    if (this.checkpoint == 4) {
      this.finishedLap = true;
    }

    // move the boat
    this.x += (this.speed * cos(this.rot) * deltaTime) / 1000;
    this.y += (this.speed * sin(this.rot) * deltaTime) / 1000;

    // move timer
    this.lapTime += deltaTime / 1000;
    this.cpTime += deltaTime / 1000;
  }
  
  calcFitness() {
    this.fitness = 0.1
    
    for (let f = this.checkpoint; f > 0; f--) {
      this.fitness += f
    }
    
    if (this.finishedLap) {
      this.fitness += pow(1.5, TIMEOUT - this.lapTime)
    }
    
    if (this.timeAtCheckpoints[0] != null) {
      this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[0])) - 1
    }
    if (this.timeAtCheckpoints[1] != null) {
      this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[1])) - 1
    }
    if (this.timeAtCheckpoints[2] != null) {
      this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[2])) - 1
    }
    if (this.timeAtCheckpoints[3] != null) {
      this.fitness += pow(2, max(0, 5 - this.timeAtCheckpoints[3])) - 1
    }
  }
}
