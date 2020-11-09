function detectClosedShapes(graph) {
    let trimmedGraph = removeDeadEnds(graph)
    trimmedGraph.display = function () {
        this.edges.forEach(e => e.display('lightblue'))
        // this.nodes.forEach(n => n.display())
    }
    print("trimmed graph")
    print("nodes:", trimmedGraph.nodes.length, "edges:", trimmedGraph.edges.length)

    let mnw = createMetaNetworkFromGraph(trimmedGraph)
    print("meta network")
    print("nodes:", mnw.metaNodes.length, "edges:", mnw.metaEdges.length)
    let shapes = detectCyclesInMetaNetwork(mnw, graph.nodes)
    
    // soo interesting issue;
    // there's a situation wherein a metaEdge is marked as belonging to 2 shapes
    // and while this is technically correct, the underlying network topology can be such
    // that one of shapes found is not the smallest possible
    // hence we filter out by checking if any of the meta nodes are within the shape
    // and if yes, it means the shape is too large and, while technically correct, not desirable for our purpose

    // TODO move this into detection proper as otherwise shapes will be missed
    // since the algo already has found 2 shapes, however, only afterwards is it declared invalid

    // shapes = shapes.filter(s => {
    //     let inside = false
    //     for (mn of graph.nodes) {
    //         if (geometric.pointInPolygon(mn.asPoint(), s.polygon)) {
    //             inside = true
    //             break
    //         }
    //     }
    //     return !inside
    // })

    // finally also need to account for possible duplicate shapes  
    let groups = groupBy(shapes, s => s.polygon.verts.reduce((acc, v) => acc += (v[0] + v[1], 0)))
    shapes = []
    for (group of groups) {
        shapes.push(group[1][0])
    }
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
    let edgePairs = groupBy(metaEdges, e => (abs(e.midPoint.x) + 7 / abs(e.midPoint.y) - 7 + e.verts.length + e.verts.reduce((acc, v) => acc += v.id, 0)).toFixed(5))
    metaEdges = []
    edgePairs.forEach(pair => {
        pair[0].start.replaceNeighbor(pair[0].end, pair[1].start)
        pair[1].start.replaceNeighbor(pair[1].end, pair[0].start)
        pair[0].end = pair[1].start
        pair[0].start.metaNeighbors.push({ node: pair[0].end, edge: pair[0] })
        pair[0].end.metaNeighbors.push({ node: pair[0].start, edge: pair[0] })
        metaEdges.push(pair[0])
    })

    //by definition an edge can be part of 2 shapes at most,
    //or just 1 shape if at the outside of the graph
    //to find out cast a normal ray on both sides of the meta edge
    //and see if it intersects with any of the other meta edges
    let id = 0
    metaEdges.forEach(me => {
        me.id = id
        id++
        me.shapes = 0
        let { from, normal1, normal2 } = me.castNormalsFrom(.5, 1000)
        let otherEdges = metaEdges.filter(e => e != me)
        let normals = []
        let n1Line = [[from.x, from.y], [normal1.x, normal1.y]]
        let n2Line = [[from.x, from.y], [normal2.x, normal2.y]]
        normals.push(n1Line)
        normals.push(n2Line)
        for (n of normals) {
            for (e of otherEdges) {
                if (geometric.lineIntersectsLine(e.asLine(), n)) {
                    me.shapes++
                    break
                }
            }
        }
    })
    return {
        metaNodes,
        metaEdges,
        display: function () {
            this.metaEdges.forEach(e => e.display('white'))
            this.metaNodes.forEach(n => n.display())
        },
        selectEdge: function (selectedEdge) {
            if(selectedEdge < 0){
                return
            }
            this.metaEdges[selectedEdge].display('purple')
            this.metaEdges[selectedEdge].verts.forEach(v => {
                noFill()
                circle(v.pos.x, v.pos.y, 5)
            })
            let p = this.metaEdges[selectedEdge].start.pos
            stroke('green')
            circle(p.x, p.y, 10)
            print(this.metaEdges[selectedEdge])
        }
    }
}

function detectCyclesInMetaNetwork(mnw, nodes) {
    // some terminology; 
    // a cycle refers to closed shape in the graph, i.e. the metanetwork 
    // the actual contents of a cycle is defined as a path shape
    // which is a collection of path edges, gathered in the BFS 
    let pathShapes = []
    let foundCycles = mnw.metaEdges.map(me => [])
    let foundShapes = mnw.metaEdges.map(me => [])

    mnw.metaEdges.forEach(me => {
        //NOTE below is not correct yet and finds about 95% of shapes
        
        if (foundShapes[me.id].length < me.shapes) {
            // print("outer while for edge ", me.id)
            let cycles = detectCyclesForMetaEdge(me, foundCycles[me.id])
            cycles.forEach(cycle => {
                let shape = createShapeFromPathNodes(pathEdgesToNodes(cycle))
                let inside = mnw.metaNodes.filter(n => geometric.pointInPolygon(n.asPoint(), shape.polygon))

                if (inside.length == 0) {
                    foundShapes[me.id].push(shape)
                    cycle.forEach(e => foundShapes[e.id].push(shape))
                }
                foundCycles[me.id].push(cycle)
                cycle.forEach(e => foundCycles[e.id].push(cycle))
            })
            // print(me.id, " ", foundShapes[me.id].length)
            // if(foundShapes[me.id] == me.shapes || foundCycles[me.id].length >= 3){
            //     break
            // }
        }
    })
    return foundShapes.flat()
}

function detectCyclesForMetaEdge(edge, foundCycle) {
    // essentially doing a breadth first search for a given edge    
    // the fundamental assumption is each edge does in fact belong to at least one shape        
    // i.e. at least one cycle can be detected for any given edge

    let foundCycles = foundCycle.length
    let pathEdges = [] // the edges for the found path(s)
    let theQueue = [] // the queue, obviously
    let edgesExcluded = foundCycle.length == 0 ? [] : foundCycle.flat() // edges which have been visited, and those already in queue

    //the current object always consists of a node, the edge said node belongs to
    //and the path it has taken in the graph
    let current = { node: edge.start, edge: edge, path: [edge] }
    edgesExcluded.push(current.edge)
    let nextnn = getOtherMetaNeighbors(current, edgesExcluded)
    //insert at front of queue
    theQueue.unshift(...nextnn)
    // print("BFS for edge ", edge.id, foundCycle)
    while (foundCycles != edge.shapes && current != undefined) {
        if (current.node != edge.end) {
            // print("current edge:", current.edge.id, current.path)
            //update edges visited and already in queue
            theQueue.map(mn => mn.edge).forEach(e => edgesExcluded.push(e))
            // get the other edges for the current object, excluding those visited or already in queue
            let nextnn = getOtherMetaNeighbors(current, edgesExcluded)
            //insert at front of queue
            theQueue.unshift(...nextnn)
            //debug info
            // nextnn.forEach(m => print("enqueud edge", m.edge.id))
            // print("found ", foundPaths, "queue ", theQueue.length)
            let edgeIds = theQueue.map(c => c.edge.id)
            // print("queue:", edgeIds)
            // pop the end of the queue
            current = theQueue.pop()
            // print("current edge:", current.edge.id, current.path)
        } else {
            // print("found", current)
            foundCycles++
            pathEdges.push(current.path)
            //clear the queue
            theQueue = []
            //exclude the edges from the 1st shape from the search in order to find the 2nd shape
            edgesExcluded = current.path.map(e => e).flat()
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

function pathEdgesToNodes(pathEdges) {
    // get all the nodes which form the path, and filter out duplicates
    let nodes = pathEdges.map(e => e.verts.map(v => v)).flat()
    nodes = nodes.filter(onlyUnique)
    // to construct a shape we need to make sure the vertices are in clockwise order
    // thus we need to sort the nodes, and in order to sort we need to have a point of reference
    // thus compute the avarage x & y position and create a new node as said point of reference
    let x = nodes.reduce((total, node) => total + node.pos.x, 0) / nodes.length
    let y = nodes.reduce((total, node) => total + node.pos.y, 0) / nodes.length
    let avarage = new Node(createVector(x, y))
    return sortNodesClockwise(avarage, nodes).neighbors
}

function createShapeFromPathNodes(pathNodes) {
    let verts = pathNodes.map(n => n.node.pos).flat()
    return new Shape(verts)
}


