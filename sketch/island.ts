class Island {
    points: { x: number; y: number }[]
    segments: Segment[]

    constructor() {
        this.points = []
        this.segments = []
    }

    load(lines: string[]) {
        for (let line of lines) {
            const [x, y] = line.split(" ").map(number => parseInt(number))
            this.points.push({ x: x!, y: y! })
        }
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i]!
            const p2 = i + 1 == this.points.length ? this.points[0]! : this.points[i + 1]!
            this.segments.push([p1, p2])
        }
    }

    draw() {
        for (let segment of this.segments) {
            drawSegment(segment)
        }
        for (let point of this.points) {
            noStroke()
            fill(0)
            ellipse(point.x, point.y, 5, 5)
        }
    }

    collideWith(boat: Boat) {
        for (let segment of this.segments) {
            const pos = createVector(boat.x, boat.y)
            const vel = createVector(boat.speed * cos(boat.rot), boat.speed * sin(boat.rot))
            const { pos: newPos, vel: newVel } = collideCircleWithSegment(
                pos,
                vel,
                BOAT_COLLISION_RADIUS,
                segment,
                0.5
            )
            boat.x = newPos.x
            boat.y = newPos.y
            boat.speed = newVel.mag()
            if (newVel.mag() > 1e-8) {
                boat.rot = atan2(newVel.y, newVel.x)
            }
        }
    }
}
