class Shape {
    // vertices PVector[]
    constructor(vertices) {
        this.polygon = new Polygon().forShape(vertices, 1)
    }

    display(color) {
        this.polygon.display(color, false)
        // text(this.id, this.polygon.centerBB.x, this.polygon.centerBB.y)
    }
}