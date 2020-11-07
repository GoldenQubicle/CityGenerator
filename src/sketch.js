/// <reference path="../node_modules/@types/p5/global.d.ts" />
let mnw
let network
let trimmedGraph
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
  let result = detectClosedShapes(graph)
  trimmedGraph = result.trimmedGraph
  mnw = result.metaNetwork
  shapes = result.shapes

  if(networkSettings.hasRiver){
    shapes = shapes.filter(s => !geometric.polygonIntersectsPolygon(s.polygon, river.poly))
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
  background('#2d5425')
  // scale(.5)
  // translate(512, 512)

  river.display()
  network.display({ showNodes: false })
  shapes.forEach(s => s.display())
  network.traceThroughRoutes()  
  trimmedGraph.display()
  // mnw.display()
  // mnw.selectEdge(-75)  

  if (networkSettings.showCurves) {
    responseCurves.display()
  }

  // networkRules[NextToIntersection].debugDraw()
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



