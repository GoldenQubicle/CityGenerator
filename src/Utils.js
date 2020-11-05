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

function QuadTreeSegmentFromNodes(start, end){
    let width = Math.abs(start.pos.x - end.pos.x)
    let height = Math.abs(start.pos.y - end.pos.y)
    let x = start.pos.x < end.pos.x ? start.pos.x : end.pos.x
    let y = start.pos.y < end.pos.y ? start.pos.y : end.pos.y
    return { x: x, y: y, width: width, height: height}
}

function getAngle(origin, node) {
  let angle = createVector(0.000001, 0).angleBetween(p5.Vector.sub(node.pos, origin.pos))
  angle += radians(90)
  return angle < 0 ? TAU + angle : angle
}

// shameless SO copy-pastas
// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascriptarray-remove-duplicates#14438954
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
function groupBy(list, keyGetter) {
  const map = new Map()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map;
}