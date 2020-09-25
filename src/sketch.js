/// <reference path="../node_modules/@types/p5/global.d.ts" />

let graph
let shapes = []

function setup() {
  createCanvas(1024, 1024, P2D)

  graph = constructGraph(setup1)
  graph = removeDeadEnds(graph)
  shapes.push(new Shape(constructGraph(square).nodes.map(n => n.pos)))
}

function draw() {
  background(128)

  push()
  translate(width / 2, height / 2)

  graph.edges.forEach(e => {
    e.display()
    push()
    let p = e.getPointOn(.5)
    let a = e.getAngle()
    translate(p.x, p.y)
    rotate(a - radians(0))
    shapes[0].display()
    pop()
  })

  graph.nodes.forEach(n => n.display())


  graph.edges
    .filter(e => e.start.connections >= 3 || e.end.connections >= 3)
    .forEach(e => {         
      if (graph.edges.indexOf(e) == 1) {    
        e.display('red')            
        let n = e.start.connections >= 3 ? e.start : e.end
        stroke('black')
        noFill()
        circle(n.pos.x, n.pos.y, 15)      

      }
    })

  pop()

  shapes.forEach(s => s.display())

  noLoop()
}

function keyPressed() {
  loop()
}

function keyReleased() {

}

function mouseClicked() {

}



