/// <reference path="../node_modules/@types/p5/global.d.ts" />

let graph
let shapes = []

function setup() {
  createCanvas(1024, 1024, P2D)

  graph = constructGraph(grid)
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
    // shapes[0].pos    
    translate(p.x, p.y)
    rotate(a)
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
let stepAngle
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
    check = toCheck[18]
    // print(check)
    start = check.node
    // get the first neighbor
    current = check.node
    let n = 1
    stepAngle = check.neighbors[n].angle //== 0 ? 360 :  check.neighbors[n].angle
    step = check.neighbors[n].node
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
      let neighbors = step.getOtherNeighbors(current)
      let sorted = sortNodesClockwise(step, neighbors)
      print(sorted, stepAngle)
      let options = sorted.neighbors
        .filter(n => n.angle > stepAngle)
        .sort((n1, n2) => n1.a < n2.a ? -1 : 1)
      print(options)
      if(options.length == 0){
        print("options to sort",sorted)
        options = sorted.neighbors.reverse()
      }

      current = step
      step = options[0].node
      // zero step angle fucks up the clockwise ordering, therefor keep current step angle
      stepAngle = options[0].angle == 0 ? stepAngle : options[0].angle


      // current = step
      // step = nextSteps[0].node
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



