/**
 * 绘制等值线
 * @param {isoimage option} opt
 * @param {线数据} lines
 * @param {图片配置 width: 图片宽度} config
 */
export default function(opt, lines, config) {
  config = config || {}
  var size = opt.size
  var ex = opt.ex
  var width = config.width || 1000
  var height = Math.abs((width / size[0]) * size[1])
  var color = config.isolineColor || '#333'
  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  ctx.lineWidth = 1
  ctx.font = '12px 微软雅黑'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  var d = lines.features
  var position = {}
  for (var i = 0, len = d.length; i < len; i++) {
    var c = d[i].geometry.coordinates
    var _color = color == 'level' ? d[i].properties.color : color
    ctx.strokeStyle = ctx.fillStyle = _color
    for (var j = 0, jLen = c.length; j < jLen; j++) {
      ctx.beginPath()
      var ft = 0
      for (var n = 0, cLen = c[j].length; n < cLen; n++) {
        var x = ((c[j][n][0] - ex[0][0]) / size[0]) * width
        var y = ((c[j][n][1] - ex[0][1]) / size[1]) * height
        ctx[n ? 'lineTo' : 'moveTo'](x, y)
        var dx = Math.round(x / 16)
        var dy = Math.round(y / 16)
        var k = dx + '-' + dy
        if (!position[k] && !ft) {
          position[k] = 1
          ft = 1
          ctx.fillText(d[i].properties.val, x, y)
        }
      }
      ctx.stroke()
    }
  }
  return canvas
}
