function sortNodesClockwise(current, nodes) {
    // calculate angle from current to nodes
    // 0 degrees is at 12 o'clock
    // sort nodes clockwise
    let sorted = []
    nodes.forEach(n => {
      let angle = getAngle(current, n)
      // angle += radians(90)
      angle = angle < 0 ? TAU + angle : angle
      sorted.push({ node: n, a: degrees(angle) })
    })
    sorted.sort((n1, n2) => n1.a < n2.a ? -1 : 1)
    return { node: current, neighbors: sorted }
  }
  
  function getAngle(origin, node) {
    let angle = createVector(0.000001, 0).angleBetween(p5.Vector.sub(node.pos, origin.pos))
    angle += radians(90)
    return angle < 0 ? TAU + angle : angle
  }
  