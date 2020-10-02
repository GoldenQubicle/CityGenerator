function sortNodesClockwise(current, nodes) {
  // calculate angle from current to nodes
  // 0 degrees is at 12 o'clock
  // sort nodes clockwise
  let sorted = []
  nodes.forEach(n => {
    let angle = getAngle(current, n)
    sorted.push({ node: n, angle: degrees(angle) })
    // edge case if node is at 12 o'clock exaclty
    // just push it twice, with 0 degrees and 360 degrees
    // so it will be picked correctly either way
    if (angle == 0) {
      sorted.push({ node: n, angle: degrees(TAU) })
    }
    if (angle == TAU) {
      sorted.push({ node: n, angle: degrees(0) })
    }
  })
  sorted.sort((n1, n2) => n1.angle < n2.angle ? -1 : 1)
  return { node: current, neighbors: sorted }
}

function getAngle(origin, node) {
  let angle = createVector(0.000001, 0).angleBetween(p5.Vector.sub(node.pos, origin.pos))
  angle += radians(90)
  return angle < 0 ? TAU + angle : angle
}
