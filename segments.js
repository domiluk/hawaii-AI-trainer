function drawPoint(point) {
  noStroke()
  fill(0)
  ellipse(point.x, point.y, 5, 5)
}

function drawSegment(segment) {
    const [p1, p2] = segment
    stroke(0)
    line(p1.x, p1.y, p2.x, p2.y)
}

function clamp01(value) {
    return max(0, min(1, value))
}

function closestPointOnSegment(segment, point) {
    const A = createVector(segment[0].x, segment[0].y)
    const B = createVector(segment[1].x, segment[1].y)
    const AB = p5.Vector.sub(B, A)
    const AP = p5.Vector.sub(point, A)
    const len2 = AB.dot(AB)
    if (len2 == 0) return A
    const t = clamp01(AP.dot(AB) / len2)
    return A.add(AB.mult(t))
}

function reflectVelocity(vel, normal, e = 1.0){
    const vn = vel.dot(normal)
    if (vn >= 0) return vel.copy()
    return p5.Vector.sub(vel, normal.copy().mult((1 + e) * vn))
}

function collideCircleWithSegment(pos, vel, radius, segment, e = 1.0) {
    const Q = closestPointOnSegment(segment, pos)
    const toCenter = p5.Vector.sub(pos, Q)
    const d = toCenter.mag()
    let normal
    if (d < 1e-8) {
        const A = createVector(segment[0].x, segment[0].y)
        const B = createVector(segment[1].x, segment[1].y)
        const AB = B.sub(A)
        normal = createVector(-AB.y, AB.x).normalize()
    } else {
        normal = toCenter.normalize()
    }
    let newPos = pos.copy()
    let newVel = vel.copy()
    if (d < radius) {
        const overlap = radius - d
        newPos.add(normal.copy().mult(overlap))
        newVel = reflectVelocity(newVel, normal, e)
    }
    return { pos: newPos, vel: newVel }
}