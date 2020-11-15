class Shape {
    // vertices PVector[]
    constructor(vertices) {
        this.polygon = new Polygon().forShape(vertices, .9)
    }

    display(color) {
        this.polygon.display(color, false)
    }
}