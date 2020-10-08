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

  // shapes = findAllClosedShapes(graph)

  shapes.forEach(s => s.display())
  let me = createMetaNetwork()
  me.forEach(e => e.display('orange'))

  // a closed shape which closed loop, i.e. start & end node are the same
  let loop = me.filter(e => e.start.pos == e.end.pos)
  // print(me)
  print(graph.nodes)
  // let shape = new Shape(loop[0].verts.map(v => v.pos));
  // shape.display()

  let sorted = me.sort((e1, e2) => e1.start == e2.end && e1.end == e2.start ? -1 : 1)

  // print(sorted)
  pop()


  noLoop()
}

function createMetaNetwork() {
  let metaEdges = []
  let nodes = graph.nodes.filter(n => n.connections >= 3)
  print("n > 3", nodes)
  nodes.forEach(node => {
    let start = new Node(node.pos)
    node.neighbors.forEach(nn => {
      let i = node.neighbors.indexOf(nn)
      // print(i)
      let step = node
      let verts = []
      let next = nn
      verts.push(next)
      while (next.connections == 2) {
        let nextStep = next.getOtherNeighbors(step)[0]
        step = next
        next = nextStep
        verts.push(next)
      }      
      let edge = new Edge(start, new Node(verts[verts.length-1]).pos)
      // print(start)

      edge.verts = verts
      metaEdges.push(edge)
    })
  })
  return metaEdges
}

function keyPressed() {
  loop()
}

function keyReleased() {

}

function mouseClicked() {
  // detectClosedShape()
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
    check = toCheck[5]
    // print(check)
    start = check.node
    // get the first neighbor
    current = check.node
    let n = 0
    stepAngle = check.neighbors[n].angle == 360 ? 0 : check.neighbors[n].angle
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
    print(`--------step ${temp}${stepAngle}----------`)
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
      stepAngle = degrees(getAngle(current, step))
      stepAngle = stepAngle == 360 ? 0 : stepAngle
      print("connection 2", stepAngle)
    } else {
      verts.push(step.pos)
      let neighbors = step.getOtherNeighbors(current)
      let sorted = sortNodesClockwise(step, neighbors)
      print(sorted, stepAngle)
      // find out all options with a larger angle than stepAngle
      // in order to go clockwise
      let options = sorted.neighbors
        .filter(n => n.angle > stepAngle)
        .sort((n1, n2) => n1.a < n2.a ? -1 : 1)
      print(options)
      // if no clockwise options are found, reverse the
      // clockwise sort in order to take the smallest angle anti-clockwise
      if (options.length == 0) {
        print("options to sort", sorted)
        options = sorted.neighbors.reverse()
      }
      // if there're more than 2 options make sure there
      // isn't the same as the current step angle
      if (options.length >= 2) {
        options = options.filter(o => o.angle != stepAngle)
      }
      current = step
      step = options[0].node
      // zero step angle fucks up the clockwise ordering, therefor keep current step angle
      stepAngle = options[0].angle == 360 ? 0 : options[0].angle
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



