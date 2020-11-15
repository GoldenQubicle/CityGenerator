class Polygon {
    verts = []
    centerBB
    width
    height
    leftUp
    rightDown
    clipperScale = 10000
    
    // vertices PVector[]
    forShape(vertices, scale) {
        this.verts = vertices.map(v => [v.x, v.y])
        this.createBounds()
        this.verts = geometric.polygonScale(this.verts, scale)
        return this
    }

    forPlot(pos, rotation, width, depth) {
        let origin = [pos.x, pos.y]
        let zero = createVector(0.000000001, 0.000)
        let dist = p5.Vector.dist(zero, pos)
        let angle = degrees(zero.angleBetween(pos))
        let verts = [[-.5, 0], [.5, 0], [.5, 1], [-.5, 1]]
        verts = geometric.polygonTranslate(verts, angle, dist)
        verts = geometric.polygonScaleY(verts, depth, origin)
        verts = geometric.polygonScaleX(verts, width, origin)
        verts = geometric.polygonRotate(verts, degrees(rotation), origin)
        this.verts = verts
        this.createBounds()
        return this
    }    

    createBounds() {
        let bounds = geometric.polygonBounds(this.verts)
        this.leftUp = createVector(bounds[0][0], bounds[0][1])
        this.rightDown = createVector(bounds[1][0], bounds[1][1])
        this.width = this.rightDown.x - this.leftUp.x
        this.height = this.rightDown.y - this.leftUp.y
        this.centerBB = createVector(this.leftUp.x + this.width / 2, this.leftUp.y + this.height / 2)
    }

    asQuadTreeObject() {
        return {
            x: this.leftUp.x,
            y: this.leftUp.y,
            width: this.width,
            height: this.height,
        }
    }

    asClipperPath() {
        let path = []
        this.verts.forEach(v => path.push(
            {
                "X": parseInt(v[0] * this.clipperScale),
                "Y": parseInt(v[1] * this.clipperScale)
            }))
        return path
    }

    fromClipperPath(path){
        path.forEach(p =>{
            this.verts.push([p.X / this.clipperScale, p.Y / this.clipperScale])
        })
        this.createBounds()
        return this
    }

    display(color, bb) {
        this.drawShape(color)
        // this.drawCenter()
        if (bb) {
            this.drawBoundingBox()
        }
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
        this.verts.forEach(v => {
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
        noFill()
        stroke('red')
        strokeWeight(1)
        rect(this.leftUp.x, this.leftUp.y, this.width, this.height)
    }
}