class Plot {
    constructor(pos, angle, width) {
        this.pos = pos
        this.angle = angle
        this.width = width
        this.depth = 20      
        this.polygon = new Polygon().forPlot(this.pos, this.angle, this.width, this.depth)
    }

    asQuadTreeObject() {
        let qto = this.polygon.asQuadTreeObject()
        qto.plot = this        
        return qto
    }

    display(color, bb = false) {       
        this.polygon.display(color, bb)
    }    
}