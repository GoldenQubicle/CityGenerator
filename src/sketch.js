/// <reference path="../node_modules/@types/p5/global.d.ts" />

let graph
let shapes = []

function setup() {
  createCanvas(1024, 1024, P2D)

  graph = constructGraph(setup1)
  graph = removeDeadEnds(graph)
  shapes.push(new Shape(constructGraph(square).nodes.map(n => n.pos)))
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


  let toCheck = graph.nodes
    .filter(n => n.connections >= 3)
    .map(n => sortNodesClockwise(n, n.neighbors))
  // print(toCheck)


  let check = toCheck[1]
  let start = check.node
  // get the first neighbor
  let current = check.node
  let step = check.neighbors[1].n
  let next = true
  let verts = []
  verts.push(current.pos)
  let temp = 0
  let shape = true;
  while (next) {
    if (step.connections == 2) {
      verts.push(step.pos)
      let nextStep = step.getOtherNeighbors(current)[0]
      current = step
      step = nextStep
    } else {
      temp++
      if (verts.includes(step.pos)) {
        shape = false
        break;
      } else {
        verts.push(step.pos)
      }
      let nextSteps = sortNodesClockwise(step, step.getOtherNeighbors(current)).neighbors
      print(nextSteps)

      let d1 = createVector(step.pos.x - current.pos.x, step.pos.y - current.pos.y)
      let d2 = createVector(step.pos.x - nextSteps[0].n.pos.x, step.pos.y - nextSteps[0].n.pos.y)
      let d3 = createVector(step.pos.x - nextSteps[1].n.pos.x, step.pos.y - nextSteps[1].n.pos.y)
      let a1 = atan2(d1.x * d2.y - d1.y * d2.x, d1.x * d2.x + d1.y * d2.y)
      let a2 = atan2(d1.x * d3.y - d1.y * d3.x, d1.x * d3.x + d1.y * d3.y)
      // a1 = a1 < 0 ? a1 * -1 : a1
      // a2 = a2 < 0 ? a2 * -1 : a2
      print(degrees(a1), degrees(a2))
      let nextStep = a1 < a2 ? nextSteps[0] : nextSteps[1]
      // let m1 = (step.pos.y - current.pos.y) / (step.pos.x - current.pos.x)
      // let m2 = (step.pos.y - nextSteps[0].n.pos.y) / (step.pos.x - nextSteps[0].n.pos.x)      
      // let a = (m2-m1)/ (1 + (m1*m2))
      // a = a < 0 ? a*-1 + PI : a
      // print(degrees(atan(2.8)))
      circle(step.pos.x, step.pos.y, 15)
      current = step
      step = nextStep.n
    }
    if (step == start) {
      next = false
    }
  }
  if (shape) {
    let s = new Shape(verts)
    s.display()
  }
  check.neighbors.forEach(n => {
    stroke('black')
    noFill()
    circle(n.n.pos.x, n.n.pos.y, 15)
    let i = check.neighbors.indexOf(n)
    noStroke()
    fill('white')
    textSize(25)
    text(i, n.n.pos.x, n.n.pos.y)
    // text(degrees(n.a), n.n.pos.x, n.n.pos.y)
  })
  stroke('black')
  noFill()
  circle(check.node.pos.x, check.node.pos.y, 15)


  pop()

  shapes.forEach(s => s.display())

  noLoop()
}

function sortNodesClockwise(current, nodes) {
  // calculate angle from current to nodes
  // 0 degrees is at 12 o'clock
  // sort nodes clockwise
  let sorted = []
  nodes.forEach(n => {
    let angle = getAngle(current, n)
    angle += radians(90)
    angle = angle < 0 ? TAU + angle : angle
    sorted.push({ n: n, a: angle })
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

}



