const debug = true

let bg, lodzelena, lodcervena
let boats = []
const N_BOATS = 100

const checkpointSegments = [
  [{ x: 0, y: 168 }, { x: 490, y: 520 }],
  [{ x: 935, y: 1049 }, { x: 1190, y: 1231 }],
  [{ x: 1593, y: 1587 }, { x: 1914, y: 1900 }],
  [{ x: 935, y: 1049 }, { x: 1190, y: 1231 }],
]

let topLeftIslandStrings
let topLeftIsland
let bottomRightIslandStrings
let bottomRightIsland

let gen = 1
let time = 0
const TIMEOUT = 20

function preload() {
  bg = loadImage("ostrov1.png")
  lodzelena = loadImage("lodzelena.png")
  lodcervena = loadImage("lodcervena.png")
  topLeftIslandStrings = loadStrings("topleft.txt")
  bottomRightIslandStrings = loadStrings("bottomright.txt")
}

function setup() {
  // createCanvas(2100, 1900);
  createCanvas(884, 800);
  for (let i = 0; i < N_BOATS; i++) {
    boats[i] = new Boat()
  }
  angleMode(DEGREES)
  
  topLeftIsland = new Island()
  topLeftIsland.load(topLeftIslandStrings)

  bottomRightIsland = new Island()
  bottomRightIsland.load(bottomRightIslandStrings)
}

function draw() {
  deltaTime = 16.666666
  time += deltaTime / 1000
  if (time > TIMEOUT) {
    console.log("prepare gen " + (gen+1))
    
    console.log("calc fitness")
    for (const boat of boats) {
      boat.calcFitness()
    }
    
    console.log("sort by fitness")
    boats.sort(function(a, b){return b.fitness - a.fitness});
    
    console.log("calc probability to pick based on fitness")
    let totalFitness = 0
    for (const boat of boats) {
      totalFitness += boat.fitness
    }
    for (const boat of boats) {
      boat.probToPick = boat.fitness / totalFitness
    }
    
    console.log("boats with fitness in percentiles:")
    for (let i of [0, 50, 99]) {
      const boat = boats[i]
      console.log(
        i,
        Math.round(boat.fitness * 100000) / 100000,
        Math.round(boat.probToPick * 100000) / 100000,
        boat.timeAtCheckpoints
      )
    }
    
    // copy fitnesses for debug purposes
    for (let i = 0; i < N_BOATS; i++) {
      FITNESSES[i] = boats[i].fitness
    }
    
    console.log("create new boats")
    const newBoats = []
    for (let i = 0; i < 10; i++) {
      newBoats[i] = new Boat(boats[i].net)
    }
    for (let i = 10; i < N_BOATS; i++) {
      const b1 = pickBoat()
      const b2 = pickBoat()
      const newNet = mutate(crossover(b1.net, b2.net), 0.05)
      const newBoat = new Boat(newNet)
      newBoats[i] = newBoat
    }
    newBoats[0].bmp = lodcervena
    boats = newBoats
    console.log("done")
    
    gen++
    time = 0
  }
  
  push()
  scale(800/1900)
  image(bg, 0, 0)

  for (let i = 0; i < N_BOATS; i++) {
    const boat = boats[i]
    topLeftIsland.collideWith(boat)
    bottomRightIsland.collideWith(boat)
    
    boat.update()
    boat.draw(0, 0)
  }
  
  topLeftIsland.draw()
  bottomRightIsland.draw()
  for (const segment of checkpointSegments) {
    drawSegment(segment)
  }
  
  pop()
  //drawDeltaTimeHistoryBar()
  drawProbs()
  
  noStroke()
  fill(0)
  text("gen: " + gen + " time: " + Math.floor(time), 10, 10)
}


function pickBoat() {
  let r = Math.random();
  for (const boat of boats) {
    r -= boat.probToPick;
    if (r <= 0) return boat; // chosen one
  }
  return boats[0]; // fallback virtually impossible
}

function crossover(net1, net2) {
  const net = new MLP(INPUTS, HIDDEN, OUTPUTS)
  
  for (let which of ['W1', 'b1', 'W2', 'b2']) {
    for (let r = 0; r < net[which].length; r++) {
      for (let c = 0; c < net[which][0].length; c++) {
        if (Math.random() < 0.5) {
          net[which][r][c] = net1[which][r][c]
        } else {
          net[which][r][c] = net2[which][r][c]
        }
      }
    }
  }
  return net
}

function mutate(net, rate) {
  for (let which of ['W1', 'b1', 'W2', 'b2']) {
    for (let r = 0; r < net[which].length; r++) {
      for (let c = 0; c < net[which][0].length; c++) {
        if (Math.random() < rate) {
          net[which][r][c] += gaussRand()
        }
      }
    }
  }
  
  return net
}