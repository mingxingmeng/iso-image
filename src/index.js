
import voronoi from './voronoi'

export default function(options) {
  var V = voronoi()

  var ex = options.extent
  var area = options.area
  var rule = typeof options.rule == 'function' ? options.rule : false

  V.extent([
    [Math.min(ex[0][0], ex[1][0]), Math.min(ex[0][1], ex[1][1])],
    [Math.max(ex[0][0], ex[1][0]), Math.max(ex[0][1], ex[1][1])]
  ])

  options.x !== void 0 && V.x(function x(d){
    return d[options.x]
  })
  
  options.y !== void 0 && V.y(function y(d){
    return d[options.y]
  })
  
  var data = V(options.data).polygons()
  var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]]
  var width = 1000
  var height = Math.abs(1000 / size[0] * size[1])

  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  var ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  
  var isArray = function (v) {
    return Object.prototype.toString.call(v) === '[object Array]'
  }
  ctx.fillStyle = '#000000'
  var drawClip = function (d) {
    if (isArray(d[0]) && isArray(d[0][0])) {
      for (var i = 0, len = d.length; i < len; i++) {
        drawClip(d[i])
      }
      return
    }
    if (isArray(d)) {
      ctx.beginPath()
      for (var i = 0, len = d.length; i < len; i++) {
        var x = (d[i][0] - ex[0][0]) / size[0] * width
        var y = (d[i][1] - ex[0][1]) / size[1] * height
        ctx[i ? 'lineTo' : 'moveTo'](x, y)
      }
    }
  }
  drawClip(area)
  ctx.stroke()
  ctx.clip()

  for (var i = 0, len = data.length; i < len; i++) {
    if (!data[i] || !rule) continue
    var color = rule(data[i]['data'])
    ctx.strokeStyle = ctx.fillStyle = color || 'rgba(255, 255, 255, 0)'
    ctx.beginPath()
    for (var j = 0, jLen = data[i].length; j < jLen; j++) {
      var x = (data[i][j][0] - ex[0][0]) / size[0] * width
      var y = (data[i][j][1] - ex[0][1]) / size[1] * height
      ctx[j ? 'lineTo' : 'moveTo'](x, y)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.fill()
  }
  
  return canvas.toDataURL('image/png')
}
