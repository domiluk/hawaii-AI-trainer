const DT_HISTORY_LENGTH = 400
const dtHistory = []
let dtHistoryIndex = 0

function drawDeltaTimeHistoryBar() {
  dtHistory[dtHistoryIndex] = deltaTime //Math.round(deltaTime)

  for (let i = 0; i < dtHistory.length; i++) {
    stroke(0)
    let diffFromCurrent = dtHistoryIndex - i
    // Fix for wrapped around values
    if (diffFromCurrent < 0) {
      diffFromCurrent += DT_HISTORY_LENGTH
    }
    if (diffFromCurrent > DT_HISTORY_LENGTH - 255) {
      stroke(0, 255 - (diffFromCurrent - DT_HISTORY_LENGTH + 255))
    }
    const x = 884 - DT_HISTORY_LENGTH - 24 + i
    noFill()
    line(x, 2, x, 2 + dtHistory[i])
  }

  dtHistoryIndex = (dtHistoryIndex + 1) % DT_HISTORY_LENGTH
  
  noStroke()
  fill(0)
  text("" + Math.round(deltaTime * 10) / 10, 884-24, 10)
}

const FITNESSES = Array(N_BOATS).fill(0)

function drawProbs() {
  for (let i = 0; i < N_BOATS; i++) {
    stroke(0)
    noFill()
    const x = i*4
    const y = FITNESSES[i]
    line(10 + x, 790 - y, 10 + x + 4, 790 - y)
  }
}