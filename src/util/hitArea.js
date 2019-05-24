const crossMul = function(v1, v2) {
  return v1[0] * v2[1] - v1[1] * v2[0]
}

const checkCross = function(p1, p2, p3, p4) {
  var v1 = [p1[0] - p3[0], p1[1] - p3[1]],
    v2 = [p2[0] - p3[0], p2[1] - p3[1]],
    v3 = [p4[0] - p3[0], p4[1] - p3[1]],
    v = crossMul(v1, v3) * crossMul(v2, v3)

  v1 = [p3[0] - p1[0], p3[1] - p1[1]]
  v2 = [p4[0] - p1[0], p4[1] - p1[1]]
  v3 = [p2[0] - p1[0], p2[1] - p1[1]]

  return v <= 0 && crossMul(v1, v3) * crossMul(v2, v3) <= 0 ? true : false
}

const hitArea = function(point, polygon) {
  var p1 = point,
    p2 = [-100, point[1]],
    p3,
    p4,
    count = 0

  for (var i = 0, len = polygon.length - 1; i < len; i++) {
    p3 = polygon[i]
    p4 = polygon[i + 1]
    if (checkCross(p1, p2, p3, p4)) count++
  }

  p3 = polygon[polygon.length - 1]
  p4 = polygon[0]
  if (checkCross(p1, p2, p3, p4)) count++

  return count % 2 == 0 ? false : true
}

export default hitArea
