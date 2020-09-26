
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
    { from: -12, to: 12 }
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
        let currentNode = nodes[index]

        if (step.angle != undefined && step.length != undefined) {
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
        if (step.to != undefined) {
            edges.push(new Edge(currentNode, nodes[step.to]))
        }
    })
    return { nodes: nodes, edges: edges }
}

function removeDeadEnds(network) {
    let toBeRemoved = []

    // go over all nodes with 1 connection
    // foreach head follow neighbors with 2 connections
    // and keep track as all those nodes need to go
    network.nodes
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
                    neighbor.delNeighbor(current)
                    next = false
                }
            }
        })
    // filter out the nodes to be removed
    network.nodes = network.nodes.filter(n => !toBeRemoved.includes(n))
    network.edges = network.edges.filter(s => !toBeRemoved.includes(s.start) && !toBeRemoved.includes(s.end))

    return network
}