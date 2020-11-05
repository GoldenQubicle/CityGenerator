/// <reference path="../node_modules/@types/p5/global.d.ts" />
let mnw
let network
let river
let shapes = []
function preload() {
  networkSettings = loadJSON("data/nws_default.json")
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
  let t = removeDeadEnds({nodes: network.nodes, edges: network.edges})
  mnw = createMetaNetworkFromGraph(t)
  shapes = detectCyclesInMetaNetwork(mnw)

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
  network.display({showNodes: true})
  // mnw.display()
  // let selectedEdge = 56
  // mnw.metaEdges[selectedEdge].display('purple')
  // let p = mnw.metaEdges[selectedEdge].start.pos
  // circle(p.x, p.y, 15)
  // print(mnw.metaEdges[selectedEdge])
  if (networkSettings.showCurves) {
    responseCurves.display()
  }

  // networkRules[NextToIntersection].debugDraw()

  network.nodes.forEach(n => {
    if (n.status == ActiveEnd) {
      // networkRules[n.status].debugDraw(n)
    }
  })

  // shapes.forEach(s => s.display())
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



