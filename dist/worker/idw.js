/**
 * 反距离平方权重法
 */
var idw = function(points, pointGrid, pow) {
  if (pow == void 0) pow = 3
  var features = pointGrid.features
  if (points.length < 3) return pointGrid
  var m0 = points.length
  var m1 = features.length

  var r = []

  for (var i = 0; i < m1; i++) {
    for (var j = 0; j < m0; j++) {
      var tmpDis = Math.sqrt(
        Math.pow(features[i].geometry.coordinates[0] - points[j].x, 2) +
          Math.pow(features[i].geometry.coordinates[1] - points[j].y, 2)
      )
      r.push(tmpDis)
    }
  }

  for (var i = 0; i < m1; i++) {
    var ifFind = false
    for (var j = m0 * i; j < m0 * i + m0; j++) {
      if (Math.abs(r[j]) < 0.0001) {
        features[i].properties.val = points[j - m0 * i].v
        ifFind = true
        break
      }
    }

    if (ifFind) continue

    var numerator = 0
    var denominator = 0

    for (var j = m0 * i; j < m0 * i + m0; j++) {
      numerator += points[j - m0 * i].v / Math.pow(r[j], pow)
      denominator += 1 / Math.pow(r[j], pow)
    }

    features[i].properties.val = numerator / denominator
  }
  return pointGrid
}

onmessage = function(e) {
  var data = e.data
  var pointGrid = idw(data[0], data[1], data[2])
  postMessage(pointGrid)
}
