
import hitArea from '../util/hitArea'
import search from '../util/search'

const abs = Math.abs
const max = Math.max
const dist = function (a, b) {
  return abs(a - b)
}
const calcDir = function (p, ex) {
  var t = 0
  var dir = max(dist(ex[0], ex[2]), dist(ex[1], ex[3]))
  for (var i = 0; i < 4; i++) {
    var iDir = dist(ex[i], p[i % 2])
    if (iDir < dir) {
      dir = iDir
      t = i
    }
  }
  return 'lbrt'.charAt(t)
}
const samePoint = function(a, b) {
  return a[0] == b[0] && a[1] == b[1]
}
/**
 * 
 * @param {等值线} lines 
 * @param {[min-lat-左, min-lng-下, max-lat-右, max-lng-上]} extent 
 */
export default function(lines, extent) {

  var close = []
  var open = []
  var catchLine = []
  var side = {
    t: [],
    b: [],
    l: [],
    r: []
  }
  var features = lines.features
  for (var i = 0, il = features.length; i < il; i++) {
    var f = features[i]
    var c = f.geometry.coordinates
    for (var n = 0, nl = c.length; n < nl; n++) {
      var l = c[n]
      var first = l[0]
      var last = l[l.length - 1]
      // 闭环
      if (samePoint(first, last)) {
        close.push({
          coor: l,
          properties: f.properties
        })
      }
      // 开环
      else {
        catchLine.push({
          coor: l,
          properties: f.properties
        })
        var fd = calcDir(first, extent)
        var ld = calcDir(last, extent)
        side[fd].push({
          p: first,
          end: last,
          d: 0,
          t: ld,
          coor: catchLine.length - 1
        })
        side[ld].push({
          p: last,
          end: first,
          d: 1,
          t: fd,
          coor: catchLine.length - 1
        })
      }
    }
  }

  var searchExtent = {
    sa: [extent[0], extent[3]],
    sb: [extent[2], extent[3]],
    sc: [extent[2], extent[1]],
    sd: [extent[0], extent[1]]
  }

  open = search(catchLine, searchExtent, side, [searchExtent['sa']], 't', false)

  var openGeo = []
  for (var i = 0, len = open.length; i < len; i++) {
    openGeo.push({
      coor: open[i],
      properties: {
        type: 'open'
      }
    })
  }

  console.log(close)
  console.log(openGeo)
  console.log(hitArea(close[0].coor[0], close[1].coor))

  // ztree 算法
  for (var i = 0, il = close.length; i < il; i++) {
    for (var j = 0, jl = openGeo.length; j < jl; j++) {
      var p = close[i].coor[0]
      var arr = openGeo[j].coor
      if (hitArea(p, arr)) {

      }
    }
  }

  return {
    features: [],
    type: "FeatureCollection"
  }
}
