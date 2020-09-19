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
  
    { angle : a, length: l, from: -n}

  by default the last segment is drawn from the last node to the first node
  however, it is possible to draw the last segment from any another node
  by giving the last step a 'closeFrom' property which also MUST be negative. 

    { angle: a, length: l, closeFrom: -n }
*/

let instructions = [
  { angle: -45, length: 100 },
  { angle: 90, length: 100, from: -2 },
  { angle: -65, length: 100 },
  { angle: 50, length: 100 },
  { angle: 90, length: 100, from: -3 },
  { angle: -45, length: 100 },
  { angle: 15, length: 100, from: -2 },
  { angle: -50, length: 100 },
  { angle: 25, length: 100, from: -2 },
  { angle: -35, length: 100 },
  { angle: 90, length: 100, from: -6 },
  { angle: -45, length: 100 },
  { angle: -45, length: 100, closeFrom: -2 }
]

// let instructions = [
//   { angle: 75, length: 75 },
//   { angle: 60, length: 100 },
//   { angle: 90, length: 20 },
//   { angle: 60, length: 75 },
//   { angle: -50, length: 60 },
//   { angle: 35, length: 50 },
//   { angle: 75, length: 50 },
// ]

// simple square example
// let instructions = [
//   { angle: 90, length: 100 },
//   { angle: 90, length: 100 },
//   { angle: 90, length: 100 },
// ]

function setup() {
  createCanvas(1024, 1024, P2D)

  constructNetwork(instructions)

}

function constructNetwork(steps) {
  // the starting node
  nodes.push(new Node(createVector(0, 0)))
  // as the step angle is relative to the current node we need to accumulate angle over steps  
  // and since 0 degrees is defined as 12 o'clock the first angle is set at -90
  let angles = []
  angles.push(radians(-90))

  steps.forEach(step => {
    // find out which index to use to retrieve the current node
    let index = step.from != undefined ? nodes.length + step.from : nodes.length - 1
    let currentNode = nodes[index]
    // accumulate the overall angle
    let angle = angles[index] + radians(step.angle)
    angles.push(angle)
    // get the new postion, create the nextNode 
    let pos = p5.Vector.add(p5.Vector.fromAngle(angle, step.length), currentNode.pos)
    let nextNode = new Node(pos)
    nodes.push(nextNode)
    // finally create the new segment    
    segments.push(new Segment(currentNode, nextNode))
  })

  //find out how to the index of the node to create the last segment with
  let lastStep = steps[steps.length - 1]
  let index = lastStep.closeFrom != undefined ? nodes.length -1 + lastStep.closeFrom : nodes.length - 1
  segments.push(new Segment(nodes[index], nodes[0]))
  // print(angles.map(a => degrees(a+radians(90))))
  shapes.push(new Shape(nodes.map(n => n.pos)))
}

function draw() {
  background(128)

  push()
  translate(width / 2, height / 2)
  segments.forEach(s => s.display())
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



