class ResponseCurve {
    bezier

    bezierPoints = []
    responseValues = [] // { min: value, max: value }

    constructor(width, height, name, property) {
        this.width = width
        this.height = height
        this.name = name
        this.property = property
    }
    // settings = { controlPoints : { one, two }, range, bounds, isParabola }
    // see the related methods for object details
    makeFromSettings(settings) {       
        // print(settings) 
        if (settings.controlPoints.two == undefined) {
            this.makeQuadratic(settings.controlPoints.one, settings.isParabola)
        } else {
            this.makeCubic(settings.controlPoints.one, settings.controlPoints.two, settings.isParabola)
        }
        this.setResponseRange(settings.range)
        this.setResponseBounds(settings.bounds)
        return this
    }

    // controlPoint = { x: value, y: value }
    makeQuadratic(controlPoint, isParabola = false) {
        // stupid hack because of bug in bezier.js
        // it can't find all intersections when x = .5
        if (controlPoint.x == .5) {
            controlPoint.x += 0.000000001
        }
        let bezierStart = { x: 0, y: 0 }
        if (isParabola) {
            let bezierEnd = { x: 1, y: 0 }
            this.bezier = new Bezier(bezierStart, controlPoint, bezierEnd)
        } else {
            let bezierEnd = { x: 1, y: 1 }
            this.bezier = new Bezier(bezierStart, controlPoint, bezierEnd)
        }
        return this
    }

    // controlPoint = { x: value, y: value }
    makeCubic(controlPoint1, controlPoint2, isParabola = false) {
        let bezierStart = { x: 0, y: 0 }
        if (isParabola) {
            let bezierEnd = { x: 1, y: 0 }
            this.bezier = new Bezier(bezierStart, controlPoint1, controlPoint2, bezierEnd)
        } else {
            let bezierEnd = { x: 1, y: 1 }
            this.bezier = new Bezier(bezierStart, controlPoint1, controlPoint2, bezierEnd)
        }
        return this
    }

    // range = { min: value, max: value }
    setResponseRange(range) {
        this.range = range
        return this
    }


    // - if both lower & upper bound is present the response values are within a range    
    //      i.e. the min & max are mapped from curve to the min & max range
    // - if the lower bound is omitted the response values are effectivly the area under curve,
    //      i.e. the min reponse value always equals the range.min
    // - if the upper bound is omitted the response values are equal
    //      i.e. the min and max response are the same, and effectivly the point on curve mapped by the range.min
    // the first 2 options are usefull for random generation, e.g. random(response.min[iteration], response.max[iteration])
    // the last option is usefull when the response needs to be a single value

    // also note there's no validation whether the bound values are within range    
    // however this is by design because when a curve is a parabola
    // it may be desirable to have bound values going over/under the min/max range
    // in order to achieve the desired response values
    // bounds = { lower : { start: value, end: value }, upper : { start: value, end: value }  }
    setResponseBounds(bounds) {
        this.lowerBound = bounds.lower
        this.upperBound = bounds.upper
        return this
    }

    compute(responses) {
        this.bezierPoints = this.bezier.getLUT(500)
        this.responseValues = []
        this.maxResponsePoints = responses
        // kinda wonky workaround coming up which basically asks;
        // for this given x, what is the corresponing y value on the curve?
        // since there's no direct way in the api to get an answer 
        // we make use of line intersection with the curve for each iteration
        for (let i = 0; i < this.maxResponsePoints; i++) {
            // the x value we want the corresponding y value for
            let x = map(i, 0, this.maxResponsePoints, 0, 1)
            // construct the line, note the y value could potentially not be large enough to find an intersection
            let start = { x: x, y: -5 }
            let end = { x: x, y: 5 }
            let line = { p1: start, p2: end }
            // the intersects returns t, i.e. the length along the curve,
            // which we can use to get the actual point on the curve
            let t = this.bezier.intersects(line)
            let p = this.bezier.get(t)
            // finally map the found y value to the lower & upper bound
            let valueLowBound
            let valueUpBound
            if (this.lowerBound != undefined) {
                valueLowBound = map(p.y, 0, 1, this.lowerBound.start, this.lowerBound.end)
            } else {
                valueLowBound = this.range.min
            }
            if (this.upperBound != undefined) {
                valueUpBound = map(p.y, 0, 1, this.upperBound.start, this.upperBound.end)
            } else {
                valueUpBound = valueLowBound
            }

            this.responseValues[i] = { min: valueLowBound, max: valueUpBound }
        }
        return this
    }

    // note the layout is pretty much depend width/height ratio ~ 1.3-1.5
    display() {
        // fill('DimGrey')
        // rect(0, 0, this.width, this.height)
        noStroke()
        fill('black')
        textAlign(CENTER)
        textSize(34)
        text(this.name + " " + this.property, this.width / 2, this.height / 6)
        this.drawBezier()
        this.drawResponse()
    }

    drawResponse() {
        let bX = this.width / 2 + this.width / 16
        let bY = this.height / 4
        let size = this.height / 2.5

        push()
        //graphic box
        noFill()
        stroke('LightGray')
        strokeWeight(2)        
        rectMode(CORNER)
        square(bX, bY, size)
     
        //labels
        noStroke()
        fill('white')
        textSize(20)
        textAlign(RIGHT)
        text(this.range.min, bX - 15, bY + size)
        text(this.range.max, bX - 15, bY + 20)
        text(0, bX + 15, bY + size + 30)
        text(this.maxResponsePoints, bX + size, bY + size + 30)
        textAlign(CENTER)
        text('iterations', bX + size / 2, bY + size + 30)
        
        // draw the actual response graph
        this.responseValues.forEach(p => {
            let y1 = map(p.min, this.range.min, this.range.max, bY + size, bY)
            let y2 = map(p.max, this.range.min, this.range.max, bY + size, bY)
            let i = this.responseValues.indexOf(p)
            let x = map(i, 0, this.maxResponsePoints, bX, bX + size)

            noStroke()
            stroke('Aquamarine')
            line(x, y1, x, y2)
        })
        pop()
    }

    drawBezier() {
        let bX = this.width / 16
        let bY = this.height / 4
        let size = this.height / 2.5

        // graphic box
        noFill()
        stroke('LightGray')
        strokeWeight(2)
        rectMode(CORNER)
        square(bX, bY, size)

        // labels
        noStroke()
        fill('white')
        textSize(20)
        text(0, bX - 20, bY + size + 30)
        text(1, bX - 20, bY + 20)
        text(1, bX + size + 10, bY + size + 30)
        
        // draw the actual curve        
        this.bezierPoints.forEach(p => {
            let v = createVector(map(p.x, 0, 1, bX, bX + size), map(p.y, 0, 1, bY + size, bY))
            fill('Aqua')
            circle(v.x, v.y, 2)
        })
    }
}
