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

  let mnw = createMetaNetwork()
  print(mnw)
  mnw.metaEdges.forEach(e => e.display('orange'))
  mnw.metaEdges[selectedEdge].display('purple')
  mnw.metaEdges[selectedEdge].start.display()
  // let node = 15
  // mnw.metaNodes[node].neighbors.forEach(n => {
  //   stroke('black')
  //   line(mnw.metaNodes[node].pos.x, mnw.metaNodes[node].pos.y, n.pos.x, n.pos.y)
  // })

  // mnw.metaEdges[1].start.neighbors[1].display()
  let pathNodes = detectCyclesMetaNetwork(mnw)
  let verts = pathNodes.map(n => n.node.pos).flat()
  // // print(visitedEdges) 
  // print(verts)
  let shape = new Shape(verts)
  shape.display()

  // print(mnw)
  // a closed shape, essentially a single edge
  // i.e. start & end node are the same
  let loop = mnw.metaEdges.filter(e => e.start.pos.x == e.end.pos.x)
  // let shape = new Shape(loop[0].verts.map(v => v.pos));
  // shape.display()
  pop()


  noLoop()
}
let selectedEdge = 15

function detectCyclesMetaNetwork(mnw) {
  let toCheck = []
  let toCheckEdges = []
  let edge = mnw.metaEdges[selectedEdge]
  let current = { node: edge.start, edge: edge, path: [edge] }
  toCheckEdges.push(current.edge)   

  print("start", toCheck.length)

  while (current.node != edge.end) {
    toCheck.map(mn => mn.edge).forEach(e => toCheckEdges.push(e))
    // print(visitedEdges)
    let nextnn = getOtherMetaNeighbors(current)
      .filter(mn => !toCheckEdges.includes(mn.edge))
    toCheck.unshift(...nextnn)
    print("enqueue", toCheck.length)
    current = toCheck.pop()
    print("dequeue", toCheck.length)
  }
  print("found", current)
  let nodes = current.path.map(e => e.verts.map(v => v)).flat()
  nodes.push(edge.start) // not sure if always needed tbh
  nodes = nodes.filter(onlyUnique)

  let x = nodes.reduce((total, node) => total + node.pos.x, 0) / nodes.length
  let y = nodes.reduce((total, node) => total + node.pos.y, 0) / nodes.length
  let avarage = new Node(createVector(x, y))
  avarage.display()

  let sorted = sortNodesClockwise(avarage, nodes).neighbors

  return sorted
}

function getOtherMetaNeighbors(current) {
  let node = current.node
  let exclude = current.edge.getOther(current.node)
  let neighbors = node.getOtherNeighbors(exclude)
  let meta = node.metaNeighbors.filter(mn => neighbors.includes(mn.edge.getOther(node)))
  meta.forEach(mn => {
    mn.path = current.path.map(e => e) // map to create new array
    mn.path.push(mn.edge) // add own edge to path
  })
  return meta
}

function createMetaNetwork() {
  let metaEdges = []
  let metaNodes = []
  let nodes = graph.nodes.filter(n => n.connections >= 3)
  // foreach node create a new 'meta node', which by definition will have > 3 connections
  // then trace each neighbor untill it reaches another node with connections > 3
  // then create 'meta edge' and store all the nodes with connections == 2 as vertices of said meta edge
  nodes.forEach(node => {    
    let start = new Node(node.pos)    
    start.metaNeighbors = []
    metaNodes.push(start)
    node.neighbors.forEach(nn => {
      let verts = []
      let step = node
      let next = nn
      verts.push(step)
      verts.push(next)
      while (next.connections == 2) {
        let nextStep = next.getOtherNeighbors(step)[0]
        step = next
        next = nextStep
        verts.push(next)
      }
      let lastStep = verts[verts.length - 1]
      let edge = new Edge(start, new Node(lastStep.pos))
      edge.verts = verts
      metaEdges.push(edge)
    })
  })
  // since we indiscrimentaly created new edges above we have twice as many now.
  // that is, for every node there are only dead-end edges going out and we need to connect everything
  // to do this group the edges by a unique key, a combination of midpoint & vertices length
  // recall every start of an edge already is a new meta node
  // thus for every pair of edges, swap the dead-ends for the start of the other and take the 1st edge
  let edgePairs = groupBy(metaEdges, e => (e.midPoint.x + e.midPoint.y + e.verts.length).toFixed(5))
  metaEdges = []
  edgePairs.forEach(pair => {
    pair[0].start.replaceNeighbor(pair[0].end, pair[1].start)
    pair[1].start.replaceNeighbor(pair[1].end, pair[0].start)
    pair[0].end = pair[1].start
    pair[0].start.metaNeighbors.push({ node: pair[0].end, edge: pair[0] })
    pair[0].end.metaNeighbors.push({ node: pair[0].start, edge: pair[0] })
    metaEdges.push(pair[0])
  })

  //by definition an edge can be part of 2 shapes at most,
  //or just 1 shape if at the outside of the graph
  //to find out cast a normal ray on both sides of the meta edge
  //and see if it intersects with any of the other meta edges
  metaEdges.forEach(me => {
    me.shapes = 0
    let { from, normal1, normal2 } = me.castNormalsFrom(.5, 1000)
    let otherEdges = metaEdges.filter(e => e != me)
    let normals = []
    let n1Line = [[from.x, from.y], [normal1.x, normal1.y]]
    let n2Line = [[from.x, from.y], [normal2.x, normal2.y]]
    normals.push(n1Line)
    normals.push(n2Line)
    for (n of normals) {
      for (e of otherEdges) {
        if (geometric.lineIntersectsLine(e.asLine(), n)) {
          me.shapes++
          break
        }
      }
    }
  })

  return { metaNodes, metaEdges }
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



