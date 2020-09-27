/// <reference path="../node_modules/@types/p5/global.d.ts" />

let graph
let shapes = []

function setup() {
  createCanvas(1024, 1024, P2D)

  graph = constructGraph(setup1)
  // graph = removeDeadEnds(graph)
  // shapes.push(new Shape(constructGraph(square).nodes.map(n => n.pos)))
}

function draw() {
  background(128)

  push()
  translate(width / 2, height / 2)

  graph.edges.forEach(e => {
    e.display()
    push()
    let p = e.getPointOn(.5)
    let a = e.getAngle()
    translate(p.x, p.y)
    rotate(a - radians(0))
    // shapes[0].display()
    pop()
  })

  graph.nodes.forEach(n => n.display())

  if (isDetecting) {
    fill('green')
    circle(start.pos.x, start.pos.y, 15)
    fill('orange')
    circle(step.pos.x, step.pos.y, 15)
    fill('purple')
    circle(current.pos.x, current.pos.y, 15)
  }

  shapes = findAllClosedShapes(graph)

  shapes.forEach(s => s.display())

  pop()


  noLoop()
}

function keyPressed() {
  loop()
}

function keyReleased() {

}

function mouseClicked() {
  detectClosedShape()
  loop()

}

let isDetecting = false
let toCheck = []
let start
let current
let step
let check
let verts = []
let temp
let visited = []
let next
let shape

function detectClosedShape() {
  if (!isDetecting) {
    toCheck = graph.nodes
      .filter(n => n.connections >= 3)
      .map(n => sortNodesClockwise(n, n.neighbors))
    check = toCheck[1]
    start = check.node
    // get the first neighbor
    current = check.node
    step = check.neighbors[3].node
    next = true
    verts = []
    verts.push(current.pos)
    temp = 0
    shape = true;
    isDetecting = true
    visited = []
  }
  // while (isDetecting) {
  else if (isDetecting) {
    if (visited.includes(step)) {
      print("already been here!")
      isDetecting = false
      return
    } else {
      visited.push(step)
    }
    if (step.connections == 2) {
      verts.push(step.pos)
      let nextStep = step.getOtherNeighbors(current)[0]
      current = step
      step = nextStep
    } else {
      verts.push(step.pos)
      // construct line & get angle from step-current, both are used to consider where to go next
      let line = [[step.pos.x, step.pos.y], [current.pos.x, current.pos.y]]
      let lineAngle = geometric.lineAngle(line)
      // since going clockwise we only want neighbors to the right of line
      let neighbors = step.getOtherNeighbors(current)
      neighbors = lineAngle < 0 ?
        neighbors.filter(n => geometric.pointLeftofLine(n.asPoint(), line)) :
        neighbors.filter(n => geometric.pointRightofLine(n.asPoint(), line))
      //now make line angle absoluut, i.e. 0-360
      lineAngle = lineAngle < 0 ? 360 + lineAngle : lineAngle
      // determine angle between the line, and possible next steps      
      // by constructing line & get angles for all options      
      let nextSteps = neighbors.map(n => {
        let l = [[step.pos.x, step.pos.y], [n.pos.x, n.pos.y]]
        let a = geometric.lineAngle(l)
        a = a < 0 ? 360 + a : a
        a = lineAngle - a
        return { node: n, angle: a }
      }).sort((n1, n2) => n1.angle < n2.angle ? -1 : 1)

      if (nextSteps.length == 0) {
        isDetecting = false
        return
      }

      current = step
      step = nextSteps[0].node
    }
    if (step == start) {
      print("found shape!")
      shapes.push(new Shape(verts))
      isDetecting = false
      return
    }
  }
}



