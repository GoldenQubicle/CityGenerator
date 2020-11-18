
/*
  G R A H P 

  an object consisting of nodes & edges
  {
    nodes [
        node {
            pos : PVector
            status : ""
            connections : int
            neighbors : [node,..]
            isActive : bool         
            NoC : int                 
            heading : () -> angle
            rotate : (angle)
            asQuadTreeObject : () -> {x, y, node}
            asPoint : () -> [x,y]
            getCollider : (size) -> {x, y, w, h}
            setStatus : ()
            updateNoC : ()
            replaceNeighbor : (node) 
            delNeighbor : (node)
            addNeighbor : (node)
            getOtherNeighbors : (node) -> [node,..]
            posAsNewVector : () -> PVector
            display : ()
        }   
    ]
    edges [
        edge {
            start : Node
            end : Node
            length : float
            asQuadTreeObject : () -> {x, y, w, h, edge}
            asLine : () -> [[sx,sy],[ex,ey]]
            replaceNode : (nodeOld, nodeNew)
            containsNode : (node) -> bool
            containsNodes : (node, node) -> bool
            getPointOn : (t) -> PVector
            getAngle : () -> angle
            getNormals : () -> {n1:Pvectpr, n2:Pvector}
            castNormalsFrom : (t, length) -> {from:Pvector, n1:Pvector, n2:Pvector}
            display : (color)
        }
    ]
  }

  graph can be constructed from an array of step objects, akin to a turtle graphic
 
  A step may contain the angle and length with which to place the next node,
  relative to the current node. The angle is relative to current node heading, that is;
    
    0 degrees is at 12 o'clock from the given heading
  
    { angle : a, length: l}
  
  At each step the new node & angle are pushed in their respective arrays, which are treated as stacks. 

  A step may also contain 'from' which MUST be a negative number, indicating how many steps 
  to go back in order to place the next node, essentially 'popping' the stack. 
  Though in this case we're getting the node by index = lastIndex - n
  
    { angle : a, length: l, from: -n}

  In addition a step may not place a new node at all,
  and instead define a new segment between existing nodes

    { from: -n, to: i }
  
  from node is retrieved by index = lastIndex - n
  to node is retrieved by index = i.
  This is wonky indeed. 
  
*/

let setup1 = [
  { angle: -25, length: 100 },
  { angle: 110, length: 70, from: -2 },
  { angle: -20, length: 50 },
  { angle: -65, length: 100 },
  { angle: 50, length: 100 },
  { angle: 30, length: 50, from: -3 },
  { angle: 0, length: 50 },
  { angle: -45, length: 150 },
  { angle: 15, length: 100, from: -2 },
  { angle: -50, length: 100 },
  { angle: 50, length: 100, from: -2 },
  { angle: -35, length: 100 },
  { angle: 125, length: 75, from: -6 },
  { angle: 0, length: 50 },
  { angle: -25, length: 78 },
  { angle: -45, length: 50 },
  { angle: -45, length: 50 },
  { angle: 20, length: 50, from: -4 },
  { angle: 20, length: 70 },
  { angle: 100, length: 35 },
  { angle: -20, length: 35 },
  // { angle : 0, length: 100, from: -8 },
  { from: -1, to: 0 },
  { from: -3, to: 3 },
  { from: -12, to: 12 },
  // { from: -14, to: 4 },
  { from: -14, to: 5 },
  { from: -6, to: 13 },
  { from: -7, to: 18 },
  // { from: -21, to: 2 },
  { from: -21, to: 3 },
  { from: -21, to: 4 },
  { from: -5, to: 7 },
  { from: -5, to: 9 },
  // { from: -5, to: 12 },
]

let simplePoly = [
  { angle: 75, length: 75 },
  { angle: 60, length: 100 },
  { angle: 90, length: 20 },
  { angle: 60, length: 75 },
  { angle: -50, length: 60 },
  { angle: 35, length: 50 },
  { angle: 75, length: 50 },
  { from: -1, to: 0 }
]

let square = [
  { angle: 90, length: 25 },
  { angle: 90, length: 25 },
  { angle: 90, length: 25 },
  { from: -1, to: 0 }
]

let grid = [
  // { angle: 90, length: 25 },
  { angle: 0, length: 50, repeat: 5 },
  { angle: 90, length: 50 },
  { angle: 0, length: 50, repeat: 5 },
  { angle: 90, length: 50 },
  { angle: 0, length: 50, repeat: 5 },
  { angle: 90, length: 50 },
  { angle: 0, length: 50, repeat: 5 },
  { from: -1, to: 0 },
  { angle: 90, length: 50, from: -2 },
  { angle: 0, length: 50, repeat: 4 },
  { angle: 90, length: 50, from: -9 },
  { angle: 0, length: 50, repeat: 4 },
  { angle: 90, length: 50, from: -16 },
  { angle: 0, length: 50, repeat: 4 },
  { angle: 90, length: 50, from: -23 },
  { angle: 0, length: 50, repeat: 4 },
  { angle: 90, length: 50, from: -30 },
  { angle: 0, length: 50, repeat: 4 },
  { angle: 90, length: 50, from: -37 },
  { angle: 0, length: 50, repeat: 4 },
  { from: -1, to: 12 },
  { from: -7, to: 11 },
  { from: -13, to: 10 },
  { from: -19, to: 9 },
  { from: -25, to: 8 },
  { from: -31, to: 7 },
  { from: -34, to: 2 },
  { from: -35, to: 1 },
  { from: -20, to: 50 },
  { from: -21, to: 49 },

]


function constructGraph(steps) {
  let nodes = []
  let edges = []
  let angles = []

  // the starting node
  nodes.push(new Node(createVector(0.00000000001, 0)))

  // as the step angle is relative to the current node we need to accumulate angle over steps  
  // and since 0 degrees is defined as 12 o'clock the first angle is set at -90
  angles.push(radians(-90))

  steps.forEach(step => {
    // find out which index to use to retrieve the current node
    let index = step.from != undefined ? nodes.length + step.from : nodes.length - 1

    if (step.angle != undefined && step.length != undefined) {
      placeNodeAndEdge(index, step)

      if (step.repeat != undefined) {
        for (let i = 0; i < step.repeat; i++) {
          index = nodes.length - 1
          placeNodeAndEdge(index, step)
        }
      }
    }
    if (step.to != undefined) {
      edges.push(new Edge(nodes[index], nodes[step.to]))
    }
  })
  return { nodes: nodes, edges: edges }

  function placeNodeAndEdge(index, step) {
    let currentNode = nodes[index]
    // accumulate the overall angle
    let angle = angles[index] + radians(step.angle)
    angles.push(angle)
    // get the new postion, create the nextNode 
    let pos = p5.Vector.add(p5.Vector.fromAngle(angle, step.length), currentNode.pos)
    let nextNode = new Node(pos)
    nodes.push(nextNode)
    // finally create the new edge    
    edges.push(new Edge(currentNode, nextNode))
  }
}


function duplicate(graph) {
  let idMapping = []
  //map nodes ids and their neighbors ids to reconstruct the graph 
  graph.nodes.forEach(n => {
    idMapping[n.id] = n.neighbors.map(nn => nn.id)
  })
  let newNodes = graph.nodes.map(n => n.clone())
  let newEdges = []
  newNodes.forEach(node => {
    idMapping[node.id].forEach(id => {
      let neighbor = newNodes.filter(n => n.id == id)[0]
      newEdges.push(new Edge(node, neighbor))
       // this is so silly but it works
       // essentially; when creating a new edge 
      neighbor.delNeighbor(node)
    })
  })
  return {nodes:newNodes, edges: newEdges}
}

function removeDeadEnds(graph) {
  let toBeRemoved = []

  // go over all nodes with 1 connection
  // foreach head follow neighbors with 2 connections
  // and keep track as all those nodes need to go
  graph.nodes
    .filter(n => n.connections == 1)
    .forEach(current => {
      let neighbor = current.neighbors[0]
      let next = true
      toBeRemoved.push(current)
      while (next) {
        if (neighbor.connections == 2) {
          toBeRemoved.push(neighbor)
          let newNeighbor = neighbor.getOtherNeighbors(current)[0]
          current = neighbor
          neighbor = newNeighbor
        } else {
          // let i = idMapping[neighbor.id].indexOf(current.id)
          // idMapping[neighbor.id].splice(i, 1)
          neighbor.delNeighbor(current)
          next = false
        }
      }
    })

  // let subset = idMapping.filter((v, i) => !toBeRemoved.includes(i) )  

  // filter out the nodes to be removed
  let nodes = graph.nodes.filter(n => !toBeRemoved.includes(n))
  let edges = graph.edges.filter(s => !toBeRemoved.includes(s.start) && !toBeRemoved.includes(s.end))

  // let node { actual: n, connections: trimmedneighbors.length, neighbors: trimmedNeighbors }

  return { nodes: nodes, edges: edges }
}