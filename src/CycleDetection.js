function detectClosedShapes(graph) {

    let trimmedGraph = removeDeadEnds(duplicate(graph))
    print("trimmed graph | ", trimmedGraph)

    let mnw = createMetaNetworkFromGraph(trimmedGraph)
    print("meta graph    | ", mnw)

    let shapes = detectCyclesInMetaNetwork(mnw, trimmedGraph)

    return { trimmedGraph: trimmedGraph, metaNetwork: mnw, shapes: shapes }
}

function createMetaNetworkFromGraph(graph) {
    let metaEdges = []
    let metaNodes = []
    let nodes = graph.nodes.filter(n => n.connections >= 3)
    // foreach node create a new 'meta node', which by definition will have > 3 connections
    // then trace each neighbor untill it reaches another node with connections > 3
    // then create 'meta edge' and store all the nodes with connections == 2 as vertices of said meta edge
    nodes.forEach(node => {
        let start = new Node(node.pos)
        start.metaNeighbors = []
        start.id = metaNodes.length
        metaNodes.push(start)
        node.neighbors.forEach(nn => {
            let verts = []
            let step = node
            let next = nn
            verts.push(step)
            verts.push(next)
            while (next.connections == 2) {
                let nextStep = next.getOtherNeighbors(step)[0]
                step = next
                next = nextStep
                verts.push(next)
            }
            let lastStep = verts[verts.length - 1]
            let edge = new Edge(start, new Node(lastStep.pos))
            edge.verts = verts
            metaEdges.push(edge)
        })
    })
    // since we indiscrimentaly created new edges above we have twice as many now.
    // that is, for every node there are only dead-end edges going out and we need to connect everything
    // to do this group the edges by a unique key, a combination of midpoint & vertices length
    // the unique key is quite elaborate to combat edge cases (mostly in a grid) wherein the x & y yield to same outcome
    // recall every start of an edge already is a new meta node
    // thus for every pair of edges, swap the dead-ends for the start of the other and take the 1st edge
    let edgePairs = groupBy(metaEdges, e => (abs(e.midPoint.x) + 7 / abs(e.midPoint.y) - 7 + e.verts.length + e.verts.reduce((acc, v) => acc += v.id / 3, 0)).toFixed(5))

    let id = 0
    metaEdges = []
    edgePairs.forEach(pair => {
        if (pair.length > 2) throw "edge pair with more than 2 entries"
        pair[0].start.replaceNeighbor(pair[0].end, pair[1].start)
        pair[1].start.replaceNeighbor(pair[1].end, pair[0].start)
        pair[0].end = pair[1].start
        pair[0].start.metaNeighbors.push({ node: pair[0].end, edge: pair[0] })
        pair[0].end.metaNeighbors.push({ node: pair[0].start, edge: pair[0] })
        pair[0].id = id
        metaEdges.push(pair[0])
        id++
    })
    return {
        nodes : metaNodes,
        edges : metaEdges,
        display: function () {
            this.nodes.forEach(n => n.display())
            this.edges.forEach(e => e.display('white'))
            this.edges.forEach(e => e.verts.forEach(v => {
                // fill('grey')
                // circle(v.pos.x, v.pos.y, 5)
            }))
        },
        selectEdge: function (selectedEdge) {
            if (selectedEdge < 0) {
                return
            }
            this.edges[selectedEdge].display('purple')
            this.edges[selectedEdge].verts.forEach(v => {
                noFill()
                circle(v.pos.x, v.pos.y, 5)
            })
            let p = this.edges[selectedEdge].start.pos
            stroke('green')
            circle(p.x, p.y, 10)
            print(this.edges[selectedEdge])
        }
    }
}

function detectCyclesInMetaNetwork(mnw, trimmed) {
    // some terminology; 
    // a cycle refers to closed shape in the graph, i.e. the metanetwork 
    // the actual contents of a cycle is defined as a path shape
    // which is a collection of path edges, gathered in the BFS 
    let foundShapes = mnw.edges.map(me => [])
    //TODO optimize, no need to check an edge who's already part of 2 shapes after all    
    mnw.edges.forEach(me => {
        let cycles = detectCyclesForMetaEdge(me)
        cycles.forEach(cycle => {
            if (cycle != null) {
                // get all the nodes which form the path, and filter out duplicates
                let nodes = cycle.map(e => e.verts.flat()).flat()
                nodes = nodes.filter(onlyUnique)
                let shape = createShapeFromPathNodes(nodes)
                // let nodes = cycle.map(e => e.verts.flat()).flat()
                // STILL not quite.. need to use trimmed graph edges..?
                let otherNodes = trimmed.nodes.filter(n => !nodes.includes(n))
                let inside = otherNodes.filter(n => geometric.pointInPolygon(n.asPoint(), shape.polygon.verts))
                if (inside == 0) {
                    foundShapes[me.id].push(shape)
                    cycle.forEach(e => foundShapes[e.id].push(shape))
                }
            }
        })
    })
    let shapes = foundShapes.flat()
    // account for duplicate shapes
    // use sum of their vertices x & y + pluscenter bounding box as grouping key
    let groups = groupBy(shapes, s => (s.polygon.verts.reduce((acc, v) => acc += (v[0] + v[1]), 0)
        + (s.polygon.centerBB.x * s.polygon.centerBB.y)).toFixed())

    shapes = []
    for (group of groups) {
        shapes.push(group[1][0])
    }
    // eh this works, however what counts as intersection is determined by the shape size
    // meaning too small and it'll start filtering out legit shapes, too large and it'll skip overlapping
    // shapes = shapes.filter(s =>{
    //     let intersect = trimmed.edges.filter(e => geometric.lineIntersectsPolygon(e.asLine(), geometric.polygonScale(s.polygon.verts, .8)))
    //     return intersect == 0
    // } )
    return shapes
}

function detectCyclesForMetaEdge(edge) {
    // essentially doing a breadth first search for a given edge    
    // assumption is made each edge does to 2 shapes (obv not true)        
    // and it will try a max attempts to find 2 before it gives up
    let foundCycles = 0
    let pathEdges = [] // the edges for the found path(s)
    let theQueue = [] // the queue, obviously
    let edgesExcluded = [] // edges which have been visited, and those already in queue

    //the current object always consists of a node, the edge said node belongs to
    //and the path it has taken in the graph
    let current = { node: edge.start, edge: edge, path: [edge] }
    edgesExcluded.push(current.edge)
    let nextnn = getOtherMetaNeighbors(current, edgesExcluded)
    //insert at front of queue
    theQueue.unshift(...nextnn)
    let attempts = 0
    while (foundCycles < 2 && current != undefined && attempts < 350) {
        if (current.node != edge.end) {
            //update edges visited and already in queue
            theQueue.map(mn => mn.edge).forEach(e => edgesExcluded.push(e))
            // get the other edges for the current object, excluding those visited or already in queue
            let nextnn = getOtherMetaNeighbors(current, edgesExcluded)
            //insert at front of queue
            theQueue.unshift(...nextnn)
            current = theQueue.pop()
            attempts++
        } else {
            foundCycles++
            pathEdges.push(current.path)
            //clear the queue
            theQueue = []
            //exclude the edges from the 1st shape from the search in order to find the 2nd shape
            edgesExcluded = current.path.map(e => e).flat()
            edgesExcluded.push(current.edge)

            // finally reset the current object to start
            current = { node: edge.start, edge: edge, path: [edge] }
        }
    }
    return pathEdges
}

function getOtherMetaNeighbors(current, edges) {
    let meta = current.node.metaNeighbors.filter(mn => !edges.includes(mn.edge))
    meta.forEach(mn => {
        mn.path = current.path.map(e => e) // map to create new array
        mn.path.push(mn.edge) // add own edge to path
    })
    return meta
}

function createShapeFromPathNodes(nodes) {
    // need to sort nodes in order to draw polygon correctly
    // to do so we simply trace neighbors
    let sorted = []
    let current = nodes[0]
    let neighbor = current.neighbors.filter(nn => nodes.includes(nn))[0]

    while (sorted.length != nodes.length) {
        sorted.push(current)
        let next = neighbor
            .getOtherNeighbors(current)
            .filter(nn => nodes.includes(nn))
        current = neighbor
        neighbor = next[0]
    }
    return new Shape(sorted.map(n => n.pos).flat())
}


