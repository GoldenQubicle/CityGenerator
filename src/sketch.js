/// <reference path="../node_modules/@types/p5/global.d.ts" />

let graph
let shapes = []

function setup() {
  createCanvas(1024, 1024, P2D)

  graph = constructGraph(setup1)
  graph = removeDeadEnds(graph)
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

  // if (isDetecting) {
  //   fill('green')
  //   circle(start.pos.x, start.pos.y, 15)
  //   fill('orange')
  //   circle(step.pos.x, step.pos.y, 15)
  //   fill('purple')
  //   circle(current.pos.x, current.pos.y, 15)
  // }

  shapes = findAllClosedShapes(graph)

  shapes.forEach(s => s.display())

  pop()


  noLoop()
}

function sortNodesClockwise(current, nodes) {
  // calculate angle from current to nodes
  // 0 degrees is at 12 o'clock
  // sort nodes clockwise
  let sorted = []
  nodes.forEach(n => {
    let angle = getAngle(current, n)
    // angle += radians(90)
    angle = angle < 0 ? TAU + angle : angle
    sorted.push({ node: n, a: angle })
  })
  sorted.sort((n1, n2) => n1.a < n2.a ? -1 : 1)
  return { node: current, neighbors: sorted }
}

function getAngle(origin, node) {
  let angle = createVector(0.000001, 0).angleBetween(p5.Vector.sub(node.pos, origin.pos))
  angle += radians(90)
  return angle < 0 ? TAU + angle : angle
}

function keyPressed() {
  loop()
}

function keyReleased() {

}

function mouseClicked() {
  loop()
}

function findAllClosedShapes(g) {
  let shapes = []
  let toCheck = g.nodes
    .filter(n => n.connections >= 3)
    .map(n => sortNodesClockwise(n, n.neighbors))

  // let index = 0
  // let start = toCheck[index]
  // let step = toCheck[index].neighbors.reverse()[1]
  // detectShape(start.node, step.node, shapes)

  while (toCheck.length > 0) {
    let start = toCheck.pop()
    start.neighbors.reverse() // reverse to pop, still in clockwise order

    while (start.neighbors.length > 0) {
      let step = start.neighbors.pop()
      detectShape(start.node, step.node, shapes)
    }
  }
  return shapes
}

function detectShape(start, step, shapes) {
  let verts = []
  let visited = []
  let current = start
  let next = true
  verts.push(start.pos)

  while (next) {
    if (visited.includes(step)) {
      return
    } else {
      visited.push(step)
      verts.push(step.pos)
    }
    if (step.connections == 2) {
      let nextStep = step.getOtherNeighbors(current)[0]
      current = step
      step = nextStep
    } else {
      // construct line & get angle from step-current, both are used to consider where to go next
      let line = [[step.pos.x, step.pos.y], [current.pos.x, current.pos.y]]
      let lineAngle = geometric.lineAngle(line)
      // since going clockwise we only want neighbors to the right of line
      let neighbors = step.getOtherNeighbors(current)
      neighbors = lineAngle < 0 ?
        neighbors.filter(n => geometric.pointLeftofLine(n.asPoint(), line)) :
        neighbors.filter(n => geometric.pointRightofLine(n.asPoint(), line))
      //now make line angle absolute, i.e. from 0-360
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
        return
      }
      current = step
      step = nextSteps[0].node
    }
    if (step == start) {
      // find out if the shape found already exists, if not push it
      let shape = new Shape(verts)
      let duplicates = shapes.filter(s => s.hasSameCenter(shape))      
      if (duplicates.length == 0) {
        shapes.push(shape)
      }
      return
    }
  }
}

function detectClosedShape() {
  if (!isDetecting) {
    toCheck = graph.nodes
      .filter(n => n.connections >= 3)
      .map(n => sortNodesClockwise(n, n.neighbors))
    check = toCheck[0]
    start = check.node
    // get the first neighbor
    current = check.node
    step = check.neighbors[0].n
    next = true
    verts = []
    verts.push(current.pos)
    temp = 0
    shape = true;
    isDetecting = true
    visited = []
  }
  while (isDetecting) {
    //  else if (isDetecting) {
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



