/// <reference path="../node_modules/@types/p5/global.d.ts" />

let network
let river
let shapes = []
function preload() {
  networkSettings = loadJSON("data/nws_grid.json")
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

  let graph = {nodes : network.nodes, edges: network.segments}
  // graph = removeDeadEnds(graph)
  // network.nodes = graph.nodes
  // network.segments = graph.edges
  shapes = findAllClosedShapes(graph) 
}

function draw() {
  background(128)
  river.display()
  network.display()
  if (networkSettings.showCurves) {
    responseCurves.display()
  }

  // networkRules[Spawn].debugDraw()

  network.nodes.forEach(n => {
    if (n.status == ActiveEnd) {
      networkRules[n.status].debugDraw(n)
    }
  })

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
  let graph = {nodes : network.nodes, edges: network.segments}
  shapes = findAllClosedShapes(graph) 

  loop()
}



