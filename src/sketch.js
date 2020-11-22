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
  generatePlots()

  clipper = new ClipperLib.Clipper();

}

function draw() {
  background('#2d5425')

  river.display()
  network.display({ showNodes: false })

  // mnw.display()
  // trimmedGraph.display()  
  shapes.forEach(s => s.display())
  // connectOuterDeadEnds()

  let points = network.nodes.map(n => n.asPoint())
  let hull = geometric.polygonHull(points)
  let p = new Polygon(hull)
  // p.display()

  // qtPlots.each(qt => qt.plot.display())

  if (networkSettings.showCurves) {
    responseCurves.display()
  }

  // networkRules[NextToIntersection].debugDraw()
  // network.stats()   
  noLoop()
}

function connectOuterDeadEnds() {
  let ends = network.nodes.filter(n => {
    return n.status == ActiveEnd &&
      shapes.filter(s => geometric.pointInPolygon(n.asPoint(), s.polygon.verts)).length == 0
  })

  let x = ends.reduce((total, node) => total + node.pos.x, 0) / ends.length
  let y = ends.reduce((total, node) => total + node.pos.y, 0) / ends.length
  let avarage = new Node(createVector(x, y))
  // circle(avarage.pos.x, avarage.pos.y, 15, 15)
  let sorted = sortNodesClockwise(avarage, ends).neighbors.map(n => n.node)
  sorted.forEach((n, i) => {
    if (i > 0) {
      let prev = sorted[i - 1]
      stroke('purple')
      textSize(10)
      // text(i, n.pos.x, n.pos.y )
      line(n.pos.x, n.pos.y, prev.pos.x, prev.pos.y)
      // line(n.pos.x, n.pos.y, avarage.pos.x, avarage.pos.y)
    }
    if (i == 0) {
      let prev = sorted[sorted.length - 1]
      stroke('purple')
      textSize(10)
      // text(i, n.pos.x, n.pos.y )
      line(n.pos.x, n.pos.y, prev.pos.x, prev.pos.y)
    }
  })
}

function generatePlots() {
  let graph = { nodes: network.nodes, edges: network.edges }
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
    p1.id = edge.id
    p2.id = edge.id
    qtPlots.push(p1.asQuadTreeObject())
    qtPlots.push(p2.asQuadTreeObject())
  })
}

function generateShapes() {
  trimmedGraph = []
  shapes = []
  let graph = { nodes: network.nodes, edges: network.edges }
  print("network graph | " , graph)
  let detect = "shape detection"
  console.time(detect)
  let result = detectClosedShapes(graph)
  console.timeEnd(detect)
  trimmedGraph = result.trimmedGraph
  mnw = result.metaNetwork
  shapes = result.shapes

  if (networkSettings.hasRiver) {
    shapes = shapes.filter(s => !geometric.polygonIntersectsPolygon(s.polygon.verts, river.poly))
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
  let gen = "network generation"
  console.time(gen)
  network.generate()
  console.timeEnd(gen)
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
    generateShapes()
    loop()
  }
}

function mouseClicked() {
  network.iterate()
  generateShapes()
  generatePlots()
  loop()
}



