// rules & props are used to read relevant sections from network settings,
// and build the responseCurves object accordingly is which is used by the node rules
const rules = [
    SpreadHeading,
    FollowHeading,
    SplitHeading,
    RandomLeftRight,
    HeadingSplitChance,    
    DefaultSegmentLength]

const props = [Length, Deviation, Angle, Chance]

const responseCurves = {
    initialize: function (width, height) {
        rules.forEach(rule => {
            // when the rule exists in network settings create it
            if (networkSettings[rule] != undefined) {
                this[rule] = {}
                // meta rules have curve settings defined at the rule level
                if (networkSettings[rule].curveSettings != undefined) {
                    this[rule].curve = makeCurveFromSettings(networkSettings[rule].curveSettings,
                        rule, "", width, height)
                    this[rule].getValue = function (iteration) {
                        return getCurveValueForProperty(iteration, this.curve)
                    }
                    this.graphs.push(this[rule].curve)
                }
                // network rules can have properties for which a response curve is defined
                props.forEach(prop => {
                    if (networkSettings[rule][prop] != undefined &&
                        networkSettings[rule][prop].curveSettings != undefined) {
                        this[rule][prop] = {}
                        this[rule][prop].curve = makeCurveFromSettings(networkSettings[rule][prop].curveSettings,
                            rule, prop, width, height)
                        this[rule][prop].getValue = function (iteration) {
                            return getCurveValueForProperty(iteration, this.curve)
                        }
                        this.graphs.push(this[rule][prop].curve)
                    }
                })
            }
        })
    },
    graphs: [],
    display: function () {
        let cols = 3, rows = 4, rowCount = 0, colCount = 0, offsetX = 0, offsetY = 0

        this.graphs.forEach(graph => {
            let i = responseCurves.graphs.indexOf(graph)

            if (colCount == (cols - 1)) {
                rowCount++
            }
            colCount = i % cols

            offsetX = (width / cols) * colCount
            offsetY = (height / rows) * rowCount

            push()
            translate(offsetX, offsetY)
            scale(.65)
            graph.display()
            pop()
        })
    }
}

function getCurveValueForProperty(responsePoint, curve) {
    // make sure we're not going out of bounds for the responsePoint array 
    let point = responsePoint >= curve.maxResponsePoints ? curve.maxResponsePoints - 1 : responsePoint
    let values = curve.responseValues[point]
    return random(values.min, values.max)
}

function makeCurveFromSettings(curveSetting, rule, property, width, height) {
    // Find out how many response points the curve should compute by 
    // type checking maxResponsePoints. If it's a string it's assumed 
    // to refer to a toplevel field in networkSetting which holds the value to use.
    let responsePoints = typeof curveSetting.maxResponsePoints == 'string'
        ? networkSettings[curveSetting.maxResponsePoints]
        : curveSetting.maxResponsePoints

    let curve = new ResponseCurve(width / 2, height / 2, rule, property)
        .makeFromSettings(curveSetting)
        .compute(responsePoints)

    return curve
}

