/// <reference path="../node_modules/@types/p5/global.d.ts" />

let responseCurve

function setup() {
  createCanvas(1024, 1024, P2D)

  let settings = {    
    controlPoints : {
      one: { x: .95, y: .15 },
      // two: { x: .05, y: .5 }
    },
    isParabola : false,
    range : { min: 0, max: 100 },
    bounds : {
      lower: { start: 10, end: 60 },
      upper: { start: 30, end: 75 }
    }
  }

  let range = { min: 0, max: 100 }
  let bounds = {
    lower: { start: 10, end: 10 },
    upper: { start: 30, end: 75 }
  }
  let controlPoints = {
    one: { x: .5, y: .5 },
    two: { x: .5, y: .5 }
  }
  let isParabola = false

  let iterations = 50

  responseCurve = new ResponseCurve(this.width, this.height, "Test Curve", "Test property")
    .makeFromSettings(settings)
    // .makeQuadratic(controlPoints.one, isParabola)
    // .makeCubic(controlPoints.one, controlPoints.two, isParabola)
    // .setResponseRange(range)
    // .setResponseBounds(upperBound)
    // .setResponseBounds(bounds)

  responseCurve.compute(iterations)

}


function draw() {

  responseCurve.display()
  noLoop()
}

function keyPressed() {
  loop()
}

function keyReleased() {

}

function mouseClicked() {


}



