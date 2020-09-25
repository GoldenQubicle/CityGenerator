/// <reference path="../node_modules/@types/p5/global.d.ts" />

let segments = []
let nodes = []
let shapes = []
let bezier

/*
  I N S T R U C T I O N S
  an array of step objects describing the angle and length at which to place the next node
  relative to the current node, which by default is the last placed node.     
  the angle is relative to current node heading, that is;
    0 degrees is at 12 o'clock from the given heading
  
    { angle : a, length: l}
  
  at each step the new node & angle is pushed in their respective arrays, akin to a stack. 

  a step may contain 'from' which MUST be a negative number, indicating 
  from which node to place the next, essentially 'popping' the stack
  though in this case it's just getting the node by index = lastIndex - n
  
    { angle : a, length: l, from: -n}

  In addition a step may not place a new node at all,
  and instead define a new segment between existing nodes

    { from: -n, to: i }
  
  from node is retrieved by index = lastIndex - n
  to node is retrieved by index = i.
  This is wonky indeed. 

  
*/

// let instructions = [
//   { angle: -25, length: 100 },
//   { angle: 90, length: 50, from: -2 },
//   { angle: 0, length: 50 },
//   { angle: -65, length: 100 },
//   { angle: 50, length: 100 },
//   { angle: 90, length: 50, from: -3 },
//   { angle: 0, length: 50 },
//   { angle: -45, length: 150 },
//   { angle: 15, length: 100, from: -2 },
//   { angle: -50, length: 100 },
//   { angle: 25, length: 100, from: -2 },
//   { angle: -35, length: 100 },
//   { angle: 90, length: 50, from: -6 },
//   { angle: 0, length: 50 },
//   { angle: -45, length: 100 },
//   { angle: -45, length: 100 },
//   { from: -3, to: 0 },
//   { from: -3, to: 2 },
//   { from: -7, to: 12 }
// ]

let instructions = [
  { angle: 75, length: 75 },
  { angle: 60, length: 100 },
  { angle: 90, length: 20 },
  { angle: 60, length: 75 },
  { angle: -50, length: 60 },
  { angle: 35, length: 50 },
  { angle: 75, length: 50 },
  { from: -1, to: 0 }
]

// simple square example
// let instructions = [
//   { angle: 90, length: 100 },
//   { angle: 90, length: 100 },
//   { angle: 90, length: 100 },
//   { from: -1, to: 0 }
// ]

function setup() {
  createCanvas(1024, 1024, P2D)

  constructNetwork(instructions)
  shapes.push(new Shape([
    createVector(0, 0),
    createVector(0, 25),
    createVector(25, 25),
    createVector(25, 0)
  ]))
}

function constructNetwork(steps) {
  // the starting node
  nodes.push(new Node(createVector(0.00000000001, 0)))
  // as the step angle is relative to the current node we need to accumulate angle over steps  
  // and since 0 degrees is defined as 12 o'clock the first angle is set at -90
  let angles = []
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
      // finally create the new segment    
      segments.push(new Segment(currentNode, nextNode))
    }
    if (step.to != undefined) {
      segments.push(new Segment(nodes[index], nodes[step.to]))
    }
  })


}

function draw() {
  background(128)

  push()
  translate(width / 2, height / 2)
  segments.forEach(s => {
    s.display()
    push()
    let p = s.getPointOn(.5)
    let a = s.getAngle()
    translate(p.x, p.y)
    rotate(a-radians(0))
    shapes[0].display()

    pop()

  })
  nodes.forEach(n => n.display())
  // shapes.forEach(s => s.display())
  pop()

  noLoop()
}



function keyPressed() {
  loop()
}

function keyReleased() {

}

function mouseClicked() {


}



