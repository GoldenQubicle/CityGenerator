/// <reference path="../node_modules/@types/p5/global.d.ts" />

let mnw
let network
let trimmedGraph
let river
let shapes = []
let plots = []
let qtPlots
let clipper
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

  generateNetwork()
  let graph = { nodes: network.nodes, edges: network.edges }

  generateShapes()
  generatePlots(graph)

  clipper = new ClipperLib.Clipper();

}

function draw() {
  background('#2d5425')
  // scale(.5)
  // translate(512, 512)

  river.display()
  network.display({ showNodes: true })
  // shapes.forEach(s => s.display())
  qtPlots.each(qt => qt.plot.display())

  let pos = createVector(256, 512)
  let dim = createVector(20, 80)
  
  var colliding = qtPlots.colliding({
    x: pos.x,
    y: pos.y,
    width: dim.x,
    height: dim.y
  })

  colliding.forEach(c => c.plot.display(color(255, 0), bb = true))
  noFill()
  stroke('yellow')
  rect(pos.x, pos.y, dim.x, dim.y)
  // colliding[0].plot.display(color(64,255,128,255), true)


  // network.traceThroughRoutes()  
  // trimmedGraph.display()
  // mnw.display()
  // mnw.selectEdge(33)  

  if (networkSettings.showCurves) {
    responseCurves.display()
  }



  // networkRules[NextToIntersection].debugDraw()
  // network.stats()   
  noLoop()
}

function generatePlots(graph) {
  qtPlots = new Quadtree({
    width: this.width,
    height: this.height,
    maxElements: 100
  })

  graph.edges.forEach(edge => {
    // let edge = graph.edges[176]
    let pos = edge.getPointOn(.5)
    let angle = edge.getAngle()
    let p1 = new Plot(pos, angle, edge.length)
    let p2 = new Plot(pos, angle + radians(180), edge.length)
    qtPlots.push(p1.asQuadTreeObject())
    qtPlots.push(p2.asQuadTreeObject())
  })
}

function generateShapes() {
  trimmedGraph = []
  shapes = []
  let graph = { nodes: network.nodes, edges: network.edges }
  let result = detectClosedShapes(graph)
  trimmedGraph = result.trimmedGraph
  mnw = result.metaNetwork
  shapes = result.shapes

  if (networkSettings.hasRiver) {
    shapes = shapes.filter(s => !geometric.polygonIntersectsPolygon(s.polygon, river.poly))
  }
}

function generateNetwork() {
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
    generateNetwork()
    // generateShapes()
    loop()
  }
}

function mouseClicked() {
  network.iterate()
  loop()
}



