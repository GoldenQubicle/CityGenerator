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
    check = toCheck[5]
    start = check.node
    // get the first neighbor
    current = check.node
    step = check.neighbors[2].node
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
    temp++
    print(`--------step ${temp}----------`)
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

      // this works in grid setup, however incredibly weird
      // essentially, facing backwards from the step, ask for points to left
      // instead of facing forwards and ask for points to the right
      let line = [[step.pos.x, step.pos.y], [current.pos.x, current.pos.y]]
      let lineAngle = round(geometric.lineAngle(line))
      print("line angle:", lineAngle)
      let neighbors = step.getOtherNeighbors(current)
      if (lineAngle > 0 && lineAngle < 180) {
        neighbors = neighbors.filter(n => geometric.pointRightofLine(n.asPoint(), line))
      } else {
        neighbors = neighbors.filter(n => geometric.pointLeftofLine(n.asPoint(), line))
      }
      print("neighbors found:", neighbors)

      // lineAngle = lineAngle == 0 ? 360 : lineAngle < 0 ? 360 + lineAngle : lineAngle      
      print("adjusted line angle", lineAngle)  

      let nextSteps = neighbors.map(n => {
        let l = [[step.pos.x, step.pos.y], [n.pos.x, n.pos.y]]
        let a = round(geometric.lineAngle(l))
        a = a == -0 || a == -180 ? a * -1 : a // needed for grid angles
        print("option angle ", round(a))
        a = lineAngle < 0 && a < 0 ? 360 + a : a
        print("adjusted option angle ", round(a))

        // print("abs angle ", a, "line angle", lineAngle)        
        a = (lineAngle - a)
        return { node: n, angle: a }
      }).sort((n1, n2) => n1.angle < n2.angle ? -1 : 1)
      if (nextSteps.length == 0) {
        isDetecting = false
        return
      }
      print("angle sorted options:", nextSteps)
      current = step
      step = nextSteps[0].node
    }
    if (step == start) {
      print("found shape!")
      print(verts)
      shapes.push(new Shape(verts))
      isDetecting = false
      return
    }
  }
}



