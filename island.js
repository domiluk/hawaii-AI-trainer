class Island {
  constructor() {
    this.points = [];
    this.segments = [];
  }

  load(lines) {
    for (let line of lines) {
      const [x, y] = line.split(" ").map((number) => parseInt(number));
      this.points.push({ x, y });
    }
    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 =
        i + 1 == this.points.length ? this.points[0] : this.points[i + 1];
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
      const vel = createVector(
        boat.speed * cos(boat.rot),
        boat.speed * sin(boat.rot)
      );
      const { pos: newPos, vel: newVel } = collideCircleWithSegment(
        boat,
        pos,
        vel,
        BOAT_COLLISION_RADIUS,
        segment,
        0.5
      );
      boat.x = newPos.x;
      boat.y = newPos.y;
      boat.speed = newVel.mag();
      if (newVel.mag() > 1e-8) {
        boat.rot = atan2(newVel.y, newVel.x);
      }
    }
  }
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
  if (len2 == 0) return A;
  const t = clamp01(AP.dot(AB) / len2);
  return A.add(AB.mult(t));
}

function reflectVelocity(vel, normal, e = 1.0) {
  const vn = vel.dot(normal);
  if (vn >= 0) return vel.copy();
  return p5.Vector.sub(vel, normal.copy().mult((1 + e) * vn));
}

function collideCircleWithSegment(boat, pos, vel, radius, segment, e = 1.0) {
  const Q = closestPointOnSegment(segment, pos);
  const toCenter = p5.Vector.sub(pos, Q);
  const d = toCenter.mag();
  let normal;
  if (d < 1e-8) {
    const A = createVector(segment[0].x, segment[0].y);
    const B = createVector(segment[1].x, segment[1].y);
    const AB = B.sub(A);
    normal = createVector(-AB.y, AB.x).normalize();
  } else {
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
