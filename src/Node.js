class Node {
    connections = 0
    // NoC, sum of connections for all neighbors
    NoC = 0
    neighbors = []
    isActive = true
    status

    constructor(pos) {
        this.pos = pos
        this.setStatus()
    }

    heading(){
        return this.pos.heading()
    }

    rotate(angle){
        this.pos.rotate(angle)
    }

    asQuadTreeObject() {
        return { x: this.pos.x, y: this.pos.y, node: this }
    }

    asPoint(){
        return [this.pos.x, this.pos.y]
    }

    getCollider(size) {
        let x = this.pos.x - size / 2
        let y = this.pos.y - size / 2
        let width = size
        let height = size
        return { x: x, y: y, width: width, height: height }
    }

    setStatus() {
        for (let status in applicableStatus) {
            this.status = NodeStatusMapping[applicableStatus[status]](this)
            if (this.status != undefined)
                break
        }

        if (this.status == undefined) {
            this.status = NoAction
        }
    }

    updateNoC() {
        this.NoC = 0
        this.neighbors.forEach(n => {
            this.NoC += n.connections
        })
        this.setStatus()
    }

    replaceNeighbor(old, repl) {
        this.delNeighbor(old)
        this.addNeighbor(repl)
    }

    delNeighbor(node) {
        let i = this.neighbors.indexOf(node)
        this.neighbors.splice(i, 1)
        this.connections = this.neighbors.length
        this.neighbors.forEach(n => n.updateNoC())
    }

    addNeighbor(node) {
        this.neighbors.push(node)
        this.connections = this.neighbors.length
        this.neighbors.forEach(n => n.updateNoC())
        this.updateNoC()
    }

    getOtherNeighbors(node){
        return this.neighbors.filter(n => n != node)
    }

    posAsNewVector() {
        return createVector(this.pos.x, this.pos.y)
    }

    display() {
        // text(this.NoC, this.pos.x, this.pos.y)
        // text(this.pos.heading().toFixed(1), this.pos.x, this.pos.y)
        // noStroke()
        // strokeWeight(1)
        // stroke('black')
        // circle(this.pos.x, this.pos.y, 2)
        noStroke()
        fill('white')
        textSize(7)
        // text(this.id, this.pos.x, this.pos.y)
        if (this.connections == 1) {
            if (this.isActive)
                fill('yellow')
            else
                fill('PaleGoldenRod')
        }

        if (this.connections == 2) {
            if (this.isActive)
                fill('orange')
            else
                fill('OrangeRed')
        }

        if (this.connections == 3) {
            if (this.isActive)
                fill('red')
            else
                fill('DarkGreen')

        }
        if (this.connections == 4) {
            fill('purple')
        }

        if (this.connections == 5) {
            fill('darkblue')
        }

        if (this.connections == 6) {
            fill('darkred')
        }

        if (this.connections >= 7) {
            noFill()
            stroke('white')
        }

        circle(this.pos.x, this.pos.y, 3)
        // text(this.connections, this.pos.x, this.pos.y)

    }
}
