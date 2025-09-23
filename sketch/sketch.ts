const debug = true

let bg: p5.Image, lodzelena: p5.Image, lodcervena: p5.Image
let boats: Boat[] = []
const N_BOATS = 100

const checkpointSegments: Segment[] = [
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
]

let topLeftIslandStrings: string[]
let topLeftIsland: Island
let bottomRightIslandStrings: string[]
let bottomRightIsland: Island

let gen = 1
let time = 0
const TIMEOUT = 20

function preload() {
    bg = loadImage("images/ostrov1.png")
    lodzelena = loadImage("images/lodzelena.png")
    lodcervena = loadImage("images/lodcervena.png")
    topLeftIslandStrings = loadStrings("islands/topleft.txt")
    bottomRightIslandStrings = loadStrings("islands/bottomright.txt")
}

function setup() {
    // createCanvas(2100, 1900);
    createCanvas(884, 800)
    for (let i = 0; i < N_BOATS; i++) {
        boats[i] = new Boat(null)
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
        console.log("prepare gen " + (gen + 1))

        console.log("calc fitness")
        for (const boat of boats) {
            boat.calcFitness()
        }

        console.log("sort by fitness")
        boats.sort(function (a, b) {
            return b.fitness - a.fitness
        })

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
            const boat = boats[i]!
            console.log(
                i,
                Math.round(boat.fitness * 100000) / 100000,
                Math.round(boat.probToPick * 100000) / 100000,
                boat.timeAtCheckpoints
            )
        }

        // copy fitnesses for debug purposes
        for (let i = 0; i < N_BOATS; i++) {
            FITNESSES[i] = boats[i]!.fitness
        }

        console.log("create new boats")
        const newBoats: Boat[] = []
        for (let i = 0; i < 10; i++) {
            newBoats[i] = new Boat(boats[i]!.net)
        }
        for (let i = 10; i < N_BOATS; i++) {
            const b1 = pickBoat()
            const b2 = pickBoat()
            const newNet = mutate(crossover(b1.net, b2.net), 0.05)
            const newBoat = new Boat(newNet)
            newBoats[i] = newBoat
        }
        newBoats[0]!.bmp = lodcervena
        boats = newBoats
        console.log("done")

        gen++
        time = 0
    }

    push()
    scale(800 / 1900)
    image(bg, 0, 0)

    for (let i = 0; i < N_BOATS; i++) {
        const boat = boats[i]!
        topLeftIsland.collideWith(boat)
        bottomRightIsland.collideWith(boat)

        boat.update()
        boat.draw()
    }
    // draw the best boat again on top
    boats[0]!.draw()

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

function pickBoat(): Boat {
    let r = Math.random()
    for (const boat of boats) {
        r -= boat.probToPick
        if (r <= 0) return boat // chosen one
    }
    return boats[0]! // fallback virtually impossible
}

function crossoverMatrix(mat1: Matrix, mat2: Matrix): Matrix {
    const result: Matrix = []
    for (let r = 0; r < mat1.length; r++) {
        result[r] = []
        for (let c = 0; c < mat1[0]!.length; c++) {
            result[r]![c] = Math.random() < 0.5 ? mat1[r]![c]! : mat2[r]![c]!
        }
    }
    return result
}

function crossover(net1: MLP, net2: MLP): MLP {
    const net = new MLP(INPUTS, HIDDEN, OUTPUTS)

    net.W1 = crossoverMatrix(net1.W1, net2.W1)
    net.b1 = crossoverMatrix(net1.b1, net2.b1)
    net.W2 = crossoverMatrix(net1.W2, net2.W2)
    net.b2 = crossoverMatrix(net1.b2, net2.b2)

    return net
}

function mutate(net: MLP, rate: number): MLP {
    for (let netparam of [net.W1, net.b1, net.W2, net.b2]) {
        for (let r = 0; r < netparam.length; r++) {
            for (let c = 0; c < netparam[0]!.length; c++) {
                if (Math.random() < rate) {
                    netparam[r]![c]! += gaussRand()
                }
            }
        }
    }

    return net
}
