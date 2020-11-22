class River {
    nodes = []
    edges = []
    poly = []
    zone = []
    it = 0
    offsets = [-12, 12]
    nodeId = -1

    constructor(width, height) {
        this.width = width
        this.height = height
        this.applyRule = this.applyRule.bind(this)
        this.checkBounds = this.checkBounds.bind(this)
        this.qtMax = 2000
        this.qtNodes = new Quadtree({
            width: width,
            height: height,
            maxElements: this.qtMax
        })
        this.qtEdges = new Quadtree({
            width: width,
            height: height,
            maxElements: this.qtMax
        })
    }

    generate() {
        this.nodes = []
        this.edges = []
        this.poly = []
        this.zone = []
        this.spawnPoints = 1
        this.it = 0
        this.outOfBound = false
        this.qtNodes.clear()
        this.qtEdges.clear()

        for (let i = 0; i < this.spawnPoints; i++) {
            let margin = 50
            let x = random(margin, this.width - margin)
            let nn = new Node(createVector(x, 0))
            nn.id = this.getNodeId()
            this.nodes.push(nn)
        }
      
        while (!this.outOfBound) {
            this.iterate()
        }

        this.generatePoly()

    }

    generatePoly() {
        let span = 10
        let zone = 20
        let increment = 0.25
        this.nodes.forEach(n => {
            span += increment
            zone += increment
            let i = this.nodes.indexOf(n)
            if (i < this.nodes.length - 1) {
                let nn = this.nodes[i + 1]

                let normal = getNormalsForLine(n.pos, nn.pos).n1
                normal.setMag(span).add(n.pos)
                this.poly.push([normal.x, normal.y])

                let znormal = getNormalsForLine(n.pos, nn.pos).n1
                znormal.setMag(zone).add(n.pos)
                this.zone.push([znormal.x, znormal.y])
            }
        })
        this.nodes.slice().reverse().forEach(n => {
            span -= increment
            zone -= increment
            let i = this.nodes.indexOf(n)
            if (i < this.nodes.length - 1) {
                let nn = this.nodes[i + 1]

                let normal = getNormalsForLine(n.pos, nn.pos).n2
                normal.setMag(span).add(n.pos)
                this.poly.push([normal.x, normal.y])

                let znormal = getNormalsForLine(n.pos, nn.pos).n2
                znormal.setMag(zone).add(n.pos)
                this.zone.push([znormal.x, znormal.y])
            }
        })
    }

    iterate() {
        this.it++
        this.outOfBound = this.nodes.filter(this.checkBounds).length > 0;
        console.log("----------it " + this.it + "----------")
        this.nodes.forEach(this.applyRule)      
    }

    checkBounds(node) {
        return node.pos.y > this.height || node.pos.x < 0 || node.pos.x > this.width
    }

    getNodeId(){
        this.nodeId++
        return this.nodeId
    }

    getConfig() {
        let config = {
            generateNewPos: function (n, c) {
                let angle = c.getAngle(n, c)
                return p5.Vector.fromAngle(angle, c.length).add(n.pos)
            },
            isInWater: function (pos) {
                return false
            },
        }
        return config
    }

    applyRule(node) {
        //the conditions which trigger the rules
        let start = node.connections == 0
        let deadEnd = node.connections == 1

        if (start) {
            let config = this.getConfig()

            config.length = 25
            config.deviation = radians(5, 15)
            config.width = this.width
            config.height = this.height
            config.getAngle = function (n, c) {
                // steer towards middle of the canvas                    
                let angle = n.pos.angleBetween(createVector(c.width / 2 - n.pos.x, c.height / 2 - n.pos.y))
                return random(angle - c.deviation, angle + c.deviation)
            }

            checkNewPosAndAdd(node, config, this)
            node.connections = 99 // stop the first node from following heading as well, only need to go down
        }

        if (deadEnd) {
            let config = this.getConfig()

            config.length = 20
            config.deviation = random(10, 15)
            config.getAngle = function (n, c) {
                let heading = p5.Vector.sub(n.pos, n.neighbors[0].pos).heading()
                return heading + radians(random(-c.deviation, c.deviation))
            }

            checkNewPosAndAdd(node, config, this)
        }
    }

    getClosestLerpedPoint(vector, number) {
        let closestNodes = this.getClosestNodes(vector, number)
        let lerpedPoints = []
        closestNodes.forEach(point => {
            let i = closestNodes.indexOf(point)
            if (i < number - 1) {
                for (let l = 0; l < 1; l += 0.001) {
                    let v = p5.Vector.lerp(point.node.pos, closestNodes[i + 1].node.pos, l)
                    let d = v.dist(vector)
                    lerpedPoints.push({ v, d })
                }
            }
        })
        // sort the lerped points by distances and get the first one
        // i.e. the one closest to vector 
        let closestLerpedPoint = lerpedPoints.sort((d1, d2) => d1.d - d2.d)[0]
        return closestLerpedPoint
    }

    getClosestNodes(vector, number) {
        // map distances from the vector to all river points
        // sort by closest distance to vector and take any number of them
        return river.nodes.map(node => {
            let distance = vector.dist(node.pos)
            return { node, distance }
        })
            .sort((p1, p2) => p1.distance - p2.distance)
            .splice(0, number)
    }

    determineSide(vector) {
        let closest = this.getClosestNodes(vector, 2)

        let p1 = closest[0].node.pos
        let p2 = closest[1].node.pos
        let n1 = getNormalsForLine(p1, p2).n1
        let n2 = getNormalsForLine(p1, p2).n2
        n1.setMag(10).add(p5.Vector.lerp(p1, p2, 0))
        n2.setMag(10).add(p5.Vector.lerp(p1, p2, 0))
        let d1 = vector.dist(n1)
        let d2 = vector.dist(n2)

        let side = d1 < d2 ? n1 : n2

        strokeWeight(1)
        stroke('orange')
        let mp = p5.Vector.lerp(p1, p2, .5)
        line(vector.x, vector.y, mp.x, mp.y)

        closest.forEach(p => {
            stroke('white')
            line(vector.x, vector.y, p.node.pos.x, p.node.pos.y)
        })
    }

    display() {
        this.nodes.forEach(n => {
            noStroke()
            fill('blue')
            circle(n.pos.x, n.pos.y, 3)
            // n.display()
        })
        this.edges.forEach(s => {
            strokeWeight(1)
            stroke(0, 0, 255)
            line(s.start.x, s.start.y, s.end.x, s.end.y);
        })

        noStroke()
        // beginShape()
        // fill('orange')
        // this.zone.forEach(p => vertex(p[0], p[1]))
        // endShape()

        beginShape()
        fill('#253854')
        this.poly.forEach(p => vertex(p[0], p[1]))
        endShape()
    }
}