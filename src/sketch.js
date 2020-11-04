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
    // e.display()
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
  // mnw.metaEdges[selectedEdge].start.display()
  // let node = 15
  // mnw.metaNodes[node].neighbors.forEach(n => {
  //   stroke('black')
  //   line(mnw.metaNodes[node].pos.x, mnw.metaNodes[node].pos.y, n.pos.x, n.pos.y)
  // })

  // mnw.metaEdges[1].start.neighbors[1].display()

  // let pathEdges = detectCyclesForMetaEdge(mnw.metaEdges[selectedEdge])
  // let pathNodes = pathEdgesToNodes(pathEdges)
  // let shapes = createShapeFromPathNodes(pathNodes)
  let shapes = detectShapesMetaNetwork(mnw)
  print(shapes.length)
  shapes.forEach(s => s.display())

  pop()
  noLoop()
}

let selectedEdge = 8

function detectShapesMetaNetwork(mnw) {
  let pathEdges = []
  let toCheck = mnw.metaEdges.map(me => me)
  let foundPaths = mnw.metaEdges.map(me => [])

  while (toCheck.length > 0) {
    let me = toCheck.pop()    
    // only do cycle detection if not all path shapes have been found for the current edge
    // pass down any path shape already found in order to exclude it from search
    if (foundPaths[me.id].length < me.shapes) {
      let pe = detectCyclesForMetaEdge(me, foundPaths[me.id])
      pe.forEach(p => {
        pathEdges.push(p)
        //go over all edges of the path, and push said path to indicate the edge already belongs to a path shape
        p.forEach(e => foundPaths[e.id].push(p))
      })
    }       
  }
  let pathNodes = pathEdgesToNodes(pathEdges)
  return createShapeFromPathNodes(pathNodes)
}

function detectCyclesForMetaEdge(edge, foundPath) {
  // print(foundPath.flat())
  let foundPaths = foundPath.length // counter
  let pathEdges = [] // the edges for the found path(s)
  let theQueue = [] // the queue, obviously
  let edgesExcluded = foundPath.length == 0 ? [] : foundPath.flat() // edges which have been visited, and those already in queue

  //the current object always consists of a node, the edge said node belongs to
  //and the path it has taken in the graph
  let current = { node: edge.start, edge: edge, path: [edge] }
  edgesExcluded.push(current.edge)

  while (foundPaths != edge.shapes) {
    if (current.node != edge.end) {
      // print("current edge:", current.edge.id, current.path)
      //update edges visited and already in queue
      theQueue.map(mn => mn.edge).forEach(e => edgesExcluded.push(e))
      // get the other edges for the current object, excluding those visited or already in queue
      let nextnn = getOtherMetaNeighbors(current, edgesExcluded)
      //insert at front of queue
      theQueue.unshift(...nextnn)
      //debug info
      // nextnn.forEach(m => print("enqueud edge", m.edge.id))
      let edgeIds = theQueue.map(c => c.edge.id)
      // print("queue:", edgeIds)
      // pop the end of the queue
      current = theQueue.pop()
      // print("current edge:", current.edge.id, current.path)
    } else {
      // print("found", current)
      foundPaths++
      pathEdges.push(current.path)
      //clear the queue
      theQueue = []
      //exclude the edges from the 1st shape from the search in order to find the 2nd shape
      edgesExcluded = current.path.map(e => e).flat()
      // finally reset the current object to start
      current = { node: edge.start, edge: edge, path: [edge] }
    }
  }
  return pathEdges
}

function pathEdgesToNodes(pathEdges) {
  return pathEdges.map(pe => {
    // get all the nodes which form the path, and filter out duplicates
    let nodes = pe.map(e => e.verts.map(v => v)).flat()
    nodes = nodes.filter(onlyUnique)
    // to construct a shape we need to make sure the vertices are in clockwise order
    // thus we need to sort the nodes, and in order to sort we need to have a point of reference
    // thus compute the avarage x & y position and create a new node as said point of reference
    let x = nodes.reduce((total, node) => total + node.pos.x, 0) / nodes.length
    let y = nodes.reduce((total, node) => total + node.pos.y, 0) / nodes.length
    let avarage = new Node(createVector(x, y))
    return sortNodesClockwise(avarage, nodes).neighbors
  })
}

function createShapeFromPathNodes(pathNodes) {
  return pathNodes.map(pn => {
    let verts = pn.map(n => n.node.pos).flat()
    return new Shape(verts)
  })
}

function getOtherMetaNeighbors(current, edges) {
  let meta = current.node.metaNeighbors.filter(mn => !edges.includes(mn.edge))
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
  print(edgePairs)
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
  let id = 0
  metaEdges.forEach(me => {
    me.id = id
    id++
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
  loop()

}



