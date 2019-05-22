export default function(opt, lines, config) {
  var opacity = config.opacity || 1
  var size = opt.size
  var level = opt.level
  var ex = opt.ex
  var width = config.width || 1000
  var height = Math.abs((width / size[0]) * size[1])

  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = '#333'
  ctx.fillStyle = '#333'
  ctx.lineWidth = 1
  ctx.font="12px 微软雅黑";
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  
  var d = lines.features
  for (var i = 0, len = d.length; i < len; i++) {
    var c = d[i].geometry.coordinates
    for (var j = 0, jLen = c.length; j < jLen; j++) {
      ctx.beginPath()
      for (var n = 0, cLen = c[j].length; n < cLen; n++) {
        var x = (c[j][n][0] - ex[0][0]) / size[0] * width
        var y = (c[j][n][1] - ex[0][1]) / size[1] * height
        ctx[n ? 'lineTo' : 'moveTo'](x, y)
        n == Math.floor(cLen / 8 * (i % 8)) && ctx.fillText(d[i].properties.val, x, y)
      }
      ctx.stroke()
    }
  }
  if (opacity < 1) {
    var pattern = ctx.createPattern(canvas, 'repeat')
    ctx.clearRect(0, 0, width, height)
    ctx.globalAlpha = opacity
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, width, height)
  }
  return canvas.toDataURL('image/png')
}
