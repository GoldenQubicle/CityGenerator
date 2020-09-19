class Segment {
  constructor(start, end) {
    start.addNeighbor(end)
    end.addNeighbor(start)
    this.start = start;
    this.end = end;
    this.length = start.pos.dist(end.pos);
  }

  asQuadTreeObject() {
    let width = Math.abs(this.start.pos.x - this.end.pos.x)
    let height = Math.abs(this.start.pos.y - this.end.pos.y)
    let x = this.start.pos.x < this.end.pos.x ? this.start.pos.x : this.end.pos.x
    let y = this.start.pos.y < this.end.pos.y ? this.start.pos.y : this.end.pos.y
    return { x: x, y: y, width: width, height: height, segment : this }
  }

  asLine() {
    return [[this.start.pos.x, this.start.pos.y], [this.end.pos.x, this.end.pos.y]]
  }

  replaceNode(old, repl) {
    if (this.start == old) {
      this.end.replaceNeighbor(this.start, repl)
      this.start = repl
      this.start.addNeighbor(this.end)
      this.start.updateNoC()

    } else {
      this.start.replaceNeighbor(this.end, repl)
      this.end = repl
      this.end.addNeighbor(this.start)
      this.end.updateNoC()
    }
    this.length = this.start.pos.dist(this.end.pos);
  }

  containsNode(node) {
    return (this.start == node || this.end == node)
  }

  containsNodes(n1, n2) {
    return (this.start == n1 && this.end == n2) ||
      (this.start == n2 && this.end == n1)
  }


  display(color) {
    if (color != undefined)
      stroke(color)
    else
      stroke(0)

    strokeWeight(1)
    line(this.start.pos.x, this.start.pos.y, this.end.pos.x, this.end.pos.y);

    //normals from mid point
    // let m = p5.Vector.lerp(this.start.pos, this.end.pos, .5)
    // let normals = getNormalsForLine(this.start.pos, this.end.pos)
    // let n1 = normals.n1.setMag(10).add(m)
    // let n2 = normals.n2.setMag(10).add(m)
    // stroke('white')
    // line(m.x, m.y, n1.x, n1.y)
    // line(m.x, m.y, n2.x, n2.y)
    
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
