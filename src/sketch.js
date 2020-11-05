/// <reference path="../node_modules/@types/p5/global.d.ts" />
let mnw
let network
let river
let shapes = []
function preload() {
  networkSettings = loadJSON("data/nws_decent.json")
}

function setup() {
  createCanvas(1024, 1024, P2D)

  river = new River(width, height)
  network = new Network(width, height)

  networkRules.initialize()
  nodeStatuses.initialize()
  responseCurves.initialize(width, height)

  // print(responseCurves)

  generate()
  let graph = { nodes: network.nodes, edges: network.edges }
  graph = removeDeadEnds(graph)
  mnw = createMetaNetworkFromGraph(graph)
  shapes = detectCyclesInMetaNetwork(mnw)

  // soo interesting issue;
  // there's a situation wherein a metaEdge is marked as belonging to 2 shapes
  // and while this is technically correct, the underlying network topology can be such
  // that one of shapes found is not the smallest possible
  // hence we filter out by checking if any of the meta nodes are within the shape
  // and if yes, it means the shape is too large and, while technically correct, not desirable for our purpose

  shapes = shapes.filter(s => {
    let inside = false
    for (mn of graph.nodes) {
      if (geometric.pointInPolygon(mn.asPoint(), s.vertices)) {
        inside = true
        break
      }
    }
    return !inside
  })

  // // finally also need to account for possible duplicate shapes
  // // which are the result of a closed loop, i.e. a single edge wherein start & end are the same node
  for (group of groupBy(shapes, s => s.centerBB.x + s.centerBB.y)) {
    if (group[1].length == 2) {
      shapes.splice(shapes.indexOf(group[1][0]), 1)
    }
  }
}


function generate() {
  var ticks = ((new Date().getTime() * 10000) + 621355968000000000);
  let seed = networkSettings.hasRandomSeed ?
    random(1, ticks) : networkSettings.seed

  randomSeed(seed)
  console.log("generating seed: " + seed)

  if (networkSettings.hasRiver) {
    river.generate()
  }
  let nwg = "nwg"
  console.time(nwg)
  network.generate()
  console.timeEnd(nwg)
}

function draw() {
  background(128)
  river.display()
  network.display({ showNodes: true })

  if (networkSettings.showCurves) {
    responseCurves.display()
  }

  // networkRules[NextToIntersection].debugDraw()

  network.nodes.forEach(n => {
    if (n.status == ActiveEnd) {
      // networkRules[n.status].debugDraw(n)
    }
  })

  // mnw.display()
  // let selectedEdge = 56
  // mnw.metaEdges[selectedEdge].display('purple')
  // let p = mnw.metaEdges[selectedEdge].start.pos
  // circle(p.x, p.y, 15)
  // print(mnw.metaEdges[selectedEdge])

  shapes.forEach(s => s.display())
  // network.stats()   

  noLoop()
}

function keyPressed() {
  if (key == ' ') {
    network.iterate()
    loop()
  }
  if (key == 's') {
    saveJSON(networkSettings, "networkSettings.json")
  }
}

function keyReleased() {
  if (key == 'r') {
    generate()
    loop()
  }
}

function mouseClicked() {
  network.iterate()
  loop()
}



