/*  tack on generateNewPos function to the config here
*   so we don't need to repeat it in every rule
*/
function checkNewPosAndAdd(node, config, obj) {
  let pos = config.generateNewPos(node, config)

  if (config.isInWater(pos) && config.placeBridge(config, node)) {
    placeBridge(pos, node, config, obj)
    return
  }

  pos = checkForWater(node, config)

  let qts = QuadTreeSegmentFromNodes(node, new Node(pos))
  let edges = obj.qtEdges.colliding(qts)
  let newNode = checkIntersections(node, config, edges, pos)

  if (newNode != null) {
    addEdge(node, newNode, obj)
    return true
  } else {
    node.isActive = false
    node.setStatus()
    return false
  }
}

function placeBridge(pos, node, config, obj) {
  determineBridgeAngle(node, config)
  print("place actual bridge")
  let inWater = true
  while (inWater) {
    if (config.isInWater(pos)) {
      pos = config.generateNewPos(node, config)
      config.length += 5
    } else {
      inWater = false
    }
  }

  let newNode = new Node(pos)
  node.isBridge = true
  newNode.isBridge = true
  addEdge(node, newNode, obj)

}

function checkForWater(node, config) {
  let inWater = false
  let pos = config.generateNewPos(node, config)

  // check if position is inside river zone poly, and if so determine possible course of action
  // all possibilities rely on overriding config.getAngle to generate a suitable new position
  if (geometric.pointInPolygon([pos.x, pos.y], river.zone)) {
    inWater = true
    if (config.rule == "rlr") {
      config.getAngle = function (n, c) {
        return c.angle + radians(180)
      }
    } else if (config.followShore(config)) {
      determineShoreAngle(node, pos, config)
    }
  }
  // keep generating a new position untill it is outside of river poly
  while (inWater)
    if (geometric.pointInPolygon([pos.x, pos.y], river.zone)) {
      // print('is in water still')
      pos = config.generateNewPos(node, config)
      config.length += 5
    } else {
      inWater = false
    }
  return pos
}

let riverPoints = 2

function determineBridgeAngle(node, config) {
  let closestLerpedPoint = river.getClosestLerpedPoint(node.pos, 2)
  // override config.getAngle to return an angle perpendicular to river
  config.closest = closestLerpedPoint
  config.getAngle = function (n, c) {
    return n.pos.angleBetween(p5.Vector.sub(c.closest.v, n.pos)) + n.pos.heading()
  }
}

function determineShoreAngle(node, newPos, config) {
  let closestRiverPoints = river.getClosestNodes(node.pos, 2)
  config.closest = closestRiverPoints

  let deviation = 7
  config.getAngle = function (n, c) {
    let n1 = c.closest[0].node.posAsNewVector()
    let n2 = c.closest[1].node.posAsNewVector()
    let riverAngle1 = n1.angleBetween(n2.sub(n1))

    n1 = c.closest[0].node.posAsNewVector()
    n2 = c.closest[1].node.posAsNewVector()
    let riverAngle2 = n2.angleBetween(n1.sub(n2))
    let segmentAngle = node.pos.angleBetween(p5.Vector.sub(newPos, node.pos))

    let angle = abs(segmentAngle - riverAngle2) > abs(segmentAngle - riverAngle1) ? riverAngle1 : riverAngle2

    c.angle = angle + n.pos.heading()
    // subtract an angle, and if the new position still lands in water
    // override getAngle again and double this value on line 90 to steer in the opposite direction
    return c.angle - radians(deviation)
  }

  let pos = config.generateNewPos(node, config)

  if (geometric.pointInPolygon([pos.x, pos.y], river.zone)) {
    config.getAngle = function (n, c) {
      return c.angle + radians(deviation * 2)
    }
  }
}

function checkIntersections(node, config, edges, position) {
  edges = edges.map(qts => qts.edge) // map quad tree objects to segment proper
  if (edges.length > 0) {
    let fit = false
    let attempts = 0
    while (!fit) {
      attempts++
      for (edge of edges) {
        //NOTE comment below is slightly outdated since we're no longer using actual segments here
        //line segments sharing nodes is counted as an intersection by geomtric
        //however, this is of course not an intersection proper.
        //hence else-if performs the actual check for intersection between lines which do not share a common node        
        if ((edge.start.pos.x == node.pos.x && edge.start.pos.y == node.pos.y) ||
          (edge.end.pos.x == node.pos.x && edge.end.pos.y == node.pos.y)) {
          fit = true
        } else if (geometric.lineIntersectsLine(edge.asLine(), [[node.pos.x, node.pos.y], [position.x, position.y]])) {
          position = checkForWater(node, config)
          fit = false
          break
        } else {
          fit = true
        }
      }
      // not too fond of returning null but meh
      if (attempts > 100)
        return null

    }
  }
  return new Node(position)
}

function addEdge(node, newNode, obj) {
  let edge = new Edge(node, newNode)
  edge.id = obj.edges.length

  if (node.isBridge && newNode.isBridge) {
    obj.bridges.push(edge)
  }
  newNode.id = obj.getNodeId()
  obj.edges.push(edge)
  obj.nodes.push(newNode)

  obj.qtEdges.push(edge.asQuadTreeObject())
  obj.qtNodes.push(newNode.asQuadTreeObject())
}


function getNormalsForLine(start, end) {
  let dx = end.x - start.x
  let dy = end.y - start.y
  return {
    n1: createVector(dy, -dx).normalize(),
    n2: createVector(-dy, dx).normalize()
  };
}

function ReplaceWithNearestNodeInRadius(node, r) {
  let near = network.getNodesInRadius(node, r)
    .map(n => {
      let d = node.pos.dist(n.pos)
      return { d, node, n }
    }).sort((d1, d2) => d1.d - d2.d)[0]
  // print(near)
  if (near != undefined) {
    // get quad tree edge for the node, we need it later on
    let qtEdge = network.qtEdges.find(function (qts) {
      return qts.edge.containsNode(node)
    })[0]

    //first make sure the node & nearest to it to not happen to share a neighbor
    //otherwise it creates faulty topology. Remove the node & edge if so
    var shared = node.neighbors.filter(n => near.n.neighbors.includes(n))
    if (shared.length > 0) {
      // get the other node for the edge node belongs to, and remove it as neighbor
      let n = qtEdge.edge.getOther(node)
      n.delNeighbor(node)
      // cleanup node & edge it belonged to from network & quadtree
      network.qtEdges.remove(qtEdge)
      network.edges.splice(network.edges.indexOf(qtEdge.edge), 1)
      network.nodes.splice(network.nodes.indexOf(node), 1)
      let qtn = network.qtNodes.where({ node: node })[0]
      network.qtNodes.remove(qtn)
      return true // technically not replaced but whatever
    }

    let edge = qtEdge.edge
    edge.replaceNode(node, near.n)

    // remove result from quad tree, and push the edge
    // with replaced node since its dimensions have changed
    network.qtEdges.remove(qtEdge)
    network.qtEdges.push(edge.asQuadTreeObject())

    // remove redundant node
    network.nodes.splice(network.nodes.indexOf(node), 1)
    // remove quad tree node
    let qtn = network.qtNodes.where({ node: node })[0]
    network.qtNodes.remove(qtn)

    return true
  } else {
    return false
  }
}


