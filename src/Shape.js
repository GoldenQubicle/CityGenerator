class Shape {
    polygon = []
    centerBB
    width
    height
    leftUp
    rightDown

    constructor(vertices) {
        this.polygon = vertices.map(v => [v.x, v.y])
        let bounds = geometric.polygonBounds(this.polygon)
        this.leftUp = createVector(bounds[0][0], bounds[0][1])
        this.rightDown = createVector(bounds[1][0], bounds[1][1])
        this.width = this.rightDown.x - this.leftUp.x
        this.height = this.rightDown.y - this.leftUp.y
        this.centerBB = createVector(this.leftUp.x + this.width / 2, this.leftUp.y + this.height / 2)

        this.polygon = geometric.polygonScale(this.polygon, .85)
    }

    display(color) {
        this.drawShape(color)
        // this.drawCenter()
        // this.drawBoundingBox()

    }

    drawShape(color) {
        noStroke()
        beginShape()
        // stroke('red')
        if (color != undefined) {
            fill(color)
        } else {
            fill(255, 228, 181, 128)            
        }
        this.polygon.forEach(v => {
            vertex(v[0], v[1])
        })
        endShape()
    }

    drawCenter() {
        fill('blue')
        circle(this.centerBB.x, this.centerBB.y, 3)
        // let centroid = geometric.polygonCentroid(this.vertices)
        // fill('red')
        // circle(centroid[0], centroid[1], 1)
    }

    drawBoundingBox() {
        strokeWeight(1)
        stroke('red')
        noFill()
        // fill(250, 250, 210, 155)
        rectMode(CENTER)
        rect(this.centerBB.x, this.centerBB.y, this.width, this.height)
    }


    hasSameCenter(other) {
        return other.centerBB.x == this.centerBB.x && other.centerBB.y == this.centerBB.y
    }

    hasOverlap(other) {
        return other.leftUp.x == this.leftUp.x ||
            other.leftUp.y == this.leftUp.y ||
            other.rightDown.x == this.rightDown.x ||
            other.rightDown.y == this.rightDown.y
    }
}