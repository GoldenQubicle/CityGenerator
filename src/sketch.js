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

  // graph.nodes.forEach(n => n.display())

  // if (isDetecting) {
  //   fill('green')
  //   circle(start.pos.x, start.pos.y, 15)
  //   fill('orange')
  //   circle(step.pos.x, step.pos.y, 15)
  //   fill('purple')
  //   circle(current.pos.x, current.pos.y, 15)
  // }

  // shapes = findAllClosedShapes(graph)
  // shapes.forEach(s => s.display())

  let mnw = createMetaNetworkFromGraph(graph)
  print(mnw)
 
  mnw.display()

  // mnw.metaEdges[selectedEdge].display('purple')
  // mnw.metaEdges[selectedEdge].start.display()
  // let node = 15
  // mnw.metaNodes[node].neighbors.forEach(n => {
  //   stroke('black')
  //   line(mnw.metaNodes[node].pos.x, mnw.metaNodes[node].pos.y, n.pos.x, n.pos.y)
  // })

  // mnw.metaEdges[1].start.neighbors[1].display()

  let shapes = detectCyclesInMetaNetwork(mnw)

  print(shapes.length)
  shapes.forEach(s => s.display())

  pop()
  noLoop()
}

let selectedEdge = 8


function keyPressed() {
  loop()
}

function keyReleased() {
}

function mouseClicked() {
  loop()

}



