class Network {
    nodes = []
    edges = []
    rules = {}
    shapes = []
    bridges = []
    size = []
    iterations = networkSettings.iterations
    spawnPoints
    it

    constructor(width, height) {
        this.width = width
        this.height = height
        this.getConfig = this.getConfig.bind(this)
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
        this.it = 0
        this.nodes = []
        this.edges = []
        this.shapes = []
        this.bridges = []
        this.qtNodes.clear()
        this.qtEdges.clear()
        this.size = []
        let seeds = random(networkSettings.numberOfSeeds[0], networkSettings.numberOfSeeds[1])
        this.size.push({ nodes: this.nodes.length, segments: this.edges.length })

        networkRules[Spawn].execute(seeds)

        this.size.push({ nodes: this.nodes.length, segments: this.edges.length })

        for (let i = 0; i < this.iterations; i++) {
            this.iterate()
        }
    }

    iterate() {
        this.it++
        console.log("----------iteration " + this.it + "----------")
        print("nodes:", this.nodes.length, "edges:", this.edges.length)

        networkSettings.Rules.forEach(rule => {
            this.nodes.forEach(n => {
                if (n.status == rule.nodeStatus) {
                    networkRules[n.status].execute(n, this.it)
                }
            })
        })
        // set rules for next iteration once all nodes have executed their rule
        this.nodes.forEach(n => n.setStatus())
        // track stats  
        this.size.push({ nodes: this.nodes.length, segments: this.edges.length })
    }

    getConfig() {
        const config = {
            bridges: this.bridges,
            generateNewPos: function (n, c) {
                let angle = c.getAngle(n, c)
                return p5.Vector.fromAngle(angle, c.length).add(n.pos)
            },
            getAngle: function (n, c) {

            },
            isInWater: function (pos) {
                return geometric.pointInPolygon([pos.x, pos.y], river.zone)
            },
            placeBridge: function (c, n) {
                //place bridge if there aren't any
                if (c.bridges.length == 0) {
                    return true
                }
                // for the current node, get shortest distance to bridge
                // this could be either start or end node
                // then filter on the minimal distance between bridges
                // if there're no distances found it's good to be placed
                let minDistanceBetween = 65
                let maxBridges = 7
                let distances = c.bridges.map(s => {
                    let d1 = s.start.pos.dist(n.pos)
                    let d2 = s.end.pos.dist(n.pos)
                    return d1 < d2 ? d1 : d2
                }).filter(d => d < minDistanceBetween)
                return distances.length == 0 && c.bridges.length < maxBridges
            },
            followShore: function (c) {
                return true
            }

        }
        return config
    }

    getNodesInRadius(node, radi) {
        // interstingly using quad tree here DOES NOT speed it up
        return this.nodes
            .filter(n => n != node &&
                !n.neighbors.includes(node) &&
                n.pos.dist(node.pos) < radi)
    }

    traceThroughRoutes() {
        if (this.nodes.length > 0) {
            let pickedRoutes = []
            for (let i = 0; i < 750; i++) {
                let pick = floor(random(this.nodes.length - 1))

                let arr = [this.nodes[pick]]
                pickedRoutes.push({ start: this.nodes[pick], route: this.traceFirstNeighbor(this.nodes[pick], arr) })
            }
            pickedRoutes.forEach(pr => {
                noStroke()
                fill('orangered')
                // circle(pr.start.pos.x, pr.start.pos.y, 5)
                pr.route.forEach(n => {
                    fill(64, 255, 64, 15)
                    if (n != undefined) {
                        circle(n.pos.x, n.pos.y, 4)
                    }
                })
            })
        }
    }

    traceFirstNeighbor(node, found) {
        if (node == undefined) return found
        if (node.neighbors.length > 1) {
            let firstNeighbor = node.neighbors
                .filter(n => !found.includes(n))[0]
            found.push(firstNeighbor)
            this.traceFirstNeighbor(firstNeighbor, found)
        } else {
            found.push(node)
        }
        return found
    }

    display({showNodes = false} = {}) {
        // console.log("----------display " + this.it + "----------")

        this.nodes.forEach(n => {
            noStroke()
            let i = this.nodes.indexOf(n)
            // stroke('white')
            // text(i, n.pos.x, n.pos.y)                       
        })

        this.edges.forEach(l => l.display('darkgray'))
        this.nodes.forEach(n => {
            // textSize(5)
            // text(this.nodes.indexOf(n), n.pos.x, n.pos.y)
            if (showNodes) {
                n.display()
            }
            // NetworkRules[n.status].debugDraw(n)
        })
        this.bridges.forEach(b =>{
            stroke('black')
            strokeWeight(3)
            line(b.start.pos.x, b.start.pos.y, b.end.pos.x, b.end.pos.y)
        })
    }

    stats() {
        let size = 256
        let margin = 20
        push()
        translate(20, 20)
        stroke('red')
        line(0, 0, 0, 256)
        line(0, 256, 256, 256)
        let totalNodes = network.size[network.size.length - 1].nodes
        let totalSegments = network.size[network.size.length - 1].segments
        noStroke()
        fill('black')
        textSize(20)
        text(network.it + " iterations", size + margin, size)
        fill('green')
        text(totalNodes + " nodes", size + margin, margin)
        fill('orange')
        text(totalSegments + " segments", size + 20, 0)
        let max = totalNodes > totalSegments ? totalSegments : totalSegments
        network.size.forEach(it => {
            let i = network.size.indexOf(it)
            let x = map(i, 0, network.it + 1, 0, size)
            let yn = map(it.nodes, 0, max, size, 0)
            let ys = map(it.segments, 0, max, size, 0)

            noStroke()
            fill('green')
            circle(x, yn, 5)
            fill('orange')
            circle(x, ys, 5)
        })
        pop()
    }
}



