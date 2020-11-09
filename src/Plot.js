class Plot {
    constructor(pos, angle, width) {
        this.pos = pos
        this.angle = angle
        this.width = width
        this.depth = 20
        this.shape = new Shape([
            createVector(-.5, 0),
            createVector(.5, 0),
            createVector(.5, 1),
            createVector(-.5, 1),
        ])  
    }

    asQuadTreeObject() {
        // obviously wrong dimensions since we translate, rotate & scale
        // correct would be to calculate the bounding box
        // this requires using geometric methods to retrieve the 'world' vertex coordinates for the polygon        
        let bounds = this.displayBoundinBox()        
        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            plot: this
        }
    }

    display() {
        this.displayBoundinBox()
                
        push()
        //note ordering matters
        translate(this.pos.x, this.pos.y)
        rotate(this.angle)
        scale(this.width, this.depth)
        this.shape.display()    
        pop()
    }

    displayBoundinBox() {
        //since the shape polygon is being translated, we first need to 
        // do the same in order to get the absolute coordinates
        let origin = [this.pos.x, this.pos.y]
        let zero = createVector(0.000000001, 0.000)
        let dist = p5.Vector.dist(zero, this.pos)
        let angle = degrees(zero.angleBetween(this.pos))

        let verts = geometric.polygonTranslate(this.shape.polygon, angle, dist)
        verts = geometric.polygonScaleY(verts, this.depth, origin)
        verts = geometric.polygonScaleX(verts, this.width, origin)
        verts = geometric.polygonRotate(verts, degrees(this.angle), origin)

        let bounds = geometric.polygonBounds(verts)
        let leftUp = createVector(bounds[0][0], bounds[0][1])
        let rightDown = createVector(bounds[1][0], bounds[1][1])
        let width = rightDown.x - leftUp.x
        let height = rightDown.y - leftUp.y
        let centerBB = createVector(leftUp.x + width / 2, leftUp.y + height / 2)

        strokeWeight(1)
        stroke('red')
        noFill()
        // fill(250, 250, 210, 155)
        rectMode(CENTER)
        rect(centerBB.x, centerBB.y, width, height)

        noStroke()
        fill('red')
        beginShape()
        verts.forEach(v => vertex(v[0], v[1]))
        endShape()

        return {x : centerBB.x, y: centerBB.y, width : width, height: height}
    }
}