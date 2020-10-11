// ctor Node, Node
class Edge {
  constructor(start, end) {
    start.addNeighbor(end)
    end.addNeighbor(start)
    this.start = start
    this.end = end
    this.length = start.pos.dist(end.pos)
    this.midPoint = this.getPointOn(.5)
  }

  asQuadTreeObject() {
    let width = Math.abs(this.start.pos.x - this.end.pos.x)
    let height = Math.abs(this.start.pos.y - this.end.pos.y)
    let x = this.start.pos.x < this.end.pos.x ? this.start.pos.x : this.end.pos.x
    let y = this.start.pos.y < this.end.pos.y ? this.start.pos.y : this.end.pos.y
    return { x: x, y: y, width: width, height: height, edge : this }
  }

  asLine() {
    return [[this.start.pos.x, this.start.pos.y], [this.end.pos.x, this.end.pos.y]]
  }

  replaceNode(nodeOld, nodeNew) {
    if (this.start == nodeOld) {
      this.end.replaceNeighbor(this.start, nodeNew)
      this.start = nodeNew
      this.start.addNeighbor(this.end)
      this.start.updateNoC()
    } else {
      this.start.replaceNeighbor(this.end, nodeNew)
      this.end = nodeNew
      this.end.addNeighbor(this.start)
      this.end.updateNoC()
    }
    this.length = this.start.pos.dist(this.end.pos);
  }

  getOther(node){
    return this.start == node ? this.end : this.start
  }

  containsNode(node) {
    return (this.start == node || this.end == node)
  }

  containsNodes(n1, n2) {
    return (this.start == n1 && this.end == n2) ||
      (this.start == n2 && this.end == n1)
  }

  getPointOn(t){
    return p5.Vector.lerp(this.start.pos, this.end.pos, t)
  }

  getAngle(){
    return createVector(0.000001,0).angleBetween(p5.Vector.sub(this.end.pos, this.start.pos))
  }

  getNormals() {
    let dx = this.end.x - this.start.x
    let dy = this.end.y - this.start.y
    return {
      n1: createVector(dy, -dx).normalize(),
      n2: createVector(-dy, dx).normalize()
    };
  }

  display(color) {
    if (color != undefined)
      stroke(color)
    else
      stroke(0)

    strokeWeight(1)
    line(this.start.pos.x, this.start.pos.y, this.end.pos.x, this.end.pos.y);

    


    //normals from mid point
    let m = this.getPointOn(.5)
    let normals = this.getNormals()
    let n1 = normals.n1.setMag(100).add(m)
    let n2 = normals.n2.setMag(100).add(m)
    stroke('white')
    line(m.x, m.y, n1.x, n1.y)
    line(m.x, m.y, n2.x, n2.y)
    
    // fill('yellow')
    // noStroke()
    // circle(m.x, m.y, 4)

    // show start -> end direction
    // let {n1, n2} = getNormalsForLine(this.start.pos, this.end.pos)
    // n1.setMag(2).add(p5.Vector.lerp(this.start.pos, this.end.pos, 0.5))
    // n2.setMag(2).add(p5.Vector.lerp(this.start.pos, this.end.pos, 0.5))

    // noFill()    
    // stroke('red')
    // triangle(this.end.pos.x, this.end.pos.y,
    //    n1.x, n1.y,
    //    n2.x, n2.y)
  }
}

