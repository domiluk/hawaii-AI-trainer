type Matrix = number[][]

// ---------- MLP (N -> H -> O) ----------
class MLP {
    W1: Matrix
    b1: Matrix
    W2: Matrix
    b2: Matrix
    constructor(public nIn: number, public nHidden: number, public nOut: number) {
        // He init for ReLU: N(0, sqrt(2/fan_in))
        this.W1 = randn(nIn, nHidden, Math.sqrt(2 / nIn))
        this.b1 = randn(1, nHidden, Math.sqrt(2 / nIn)) // zeros(1, nHidden);
        this.W2 = randn(nHidden, nOut, Math.sqrt(2 / nHidden))
        this.b2 = randn(1, nOut, Math.sqrt(2 / nHidden)) // zeros(1, nOut);
    }

    // Forward for a single sample (1 x N) -> returns caches for backprop
    forward(x1xN: Matrix): { z1: Matrix; h: Matrix; z2: Matrix; o: Matrix } {
        const z1 = add(matmul(x1xN, this.W1), this.b1) // (1 x H)
        const h = relu(z1) // (1 x H)
        const z2 = add(matmul(h, this.W2), this.b2) // (1 x O)
        const o = sigmoid(z2) // (1 x O)
        return { z1, h, z2, o }
    }

    // Predict 0/1 actions (threshold 0.5) for a single sample
    predict01(x1xN: Matrix, thr = 0.5): number[] {
        const { o } = this.forward(x1xN)
        return o[0]!.map(v => (v > thr ? 1 : 0))
    }

    // Raw probabilities 0..1
    predictProb(x1xN: Matrix): number[] {
        const { o } = this.forward(x1xN)
        return o[0]!.slice()
    }
}

// ---------- Tiny tensor helpers (plain JS arrays) ----------
function zeros(r: number, c: number): Matrix {
    const a = new Array(r)
    for (let i = 0; i < r; i++) {
        a[i] = new Array(c).fill(0)
    }
    return a
}
function randn(r: number, c: number, std = 1): Matrix {
    const a = new Array(r)
    for (let i = 0; i < r; i++) {
        a[i] = new Array(c)
        for (let j = 0; j < c; j++) {
            a[i][j] = std * gaussRand()
        }
    }
    return a
}
// Box-Muller
function gaussRand(): number {
    let u = 1 - Math.random()
    let v = 1 - Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function matmul(A: Matrix, B: Matrix): Matrix {
    const r = A.length,
        k = A[0]!.length,
        c = B[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            let s = 0
            for (let t = 0; t < k; t++) s += A[i]![t]! * B[t]![j]!
            out[i]![j] = s
        }
    }
    return out
}
function add(A: Matrix, B: Matrix): Matrix {
    const r = A.length,
        c = A[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) out[i]![j] = A[i]![j]! + B[Math.min(i, B.length - 1)]![j]!
    }
    return out
}
function scal(A: Matrix, s: number): Matrix {
    const r = A.length,
        c = A[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[i]![j] = A[i]![j]! * s
    return out
}
function transpose(A: Matrix): Matrix {
    const r = A.length,
        c = A[0]!.length
    const out = zeros(c, r)
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[j]![i] = A[i]![j]!
    return out
}
function mul(A: Matrix, B: Matrix): Matrix {
    // elementwise A * B (same shape)
    const r = A.length,
        c = A[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[i]![j] = A[i]![j]! * B[i]![j]!
    return out
}
function relu(Z: Matrix): Matrix {
    const r = Z.length,
        c = Z[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[i]![j] = Math.max(0, Z[i]![j]!)
    return out
}
function reluPrime(Z: Matrix): Matrix {
    const r = Z.length,
        c = Z[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) out[i]![j] = Z[i]![j]! > 0 ? 1 : 0
    return out
}
function sigmoid(Z: Matrix): Matrix {
    const r = Z.length,
        c = Z[0]!.length
    const out = zeros(r, c)
    for (let i = 0; i < r; i++)
        for (let j = 0; j < c; j++) out[i]![j] = 1 / (1 + Math.exp(-Z[i]![j]!))
    return out
}
