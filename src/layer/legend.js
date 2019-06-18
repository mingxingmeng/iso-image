/**
 * 绘制图例
 * @param {等级数组} level
 * @param {} config
 */
var defaultConfig = {
  direction: 'vertical', // vertical horizontal
  backgroundColor: '#fff',
  color: '#333',
  gradient: true
}
export default function(level, config) {
  if (level.legend < 2) return false
  config = Object.assign({}, defaultConfig, config)
  var gradient = config.gradient ? 1 : 0
  var dir = config.direction == 'horizontal' ? 0 : 1
  var title = config.title || ''
  var shape = config.shape || 'rect'
  var legend = document.createElement('canvas')
  var w = dir ? 120 : 340
  if (!gradient) w += 20
  var h = dir ? 240 : 50
  legend.width = w
  legend.height = h
  var gR = dir ? [15, 30, 20, 200] : [70, 5, 200, 20]
  var lG = dir ? [gR[0], gR[1] + gR[3], gR[0], gR[1]] : [gR[0], gR[1], gR[0] + gR[2], gR[1]]

  var ctx = legend.getContext('2d')
  ctx.lineWidth = 1
  ctx.strokeStyle = '#999'
  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(0, 0, w, h)
  ctx.font = '12px 微软雅黑'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'start'
  ctx.fillStyle = config.color
  var grad = ctx.createLinearGradient(lG[0], lG[1], lG[2], lG[3])
  for (var i = 0, len = level.length; i < len; i++) {
    var color = level[i].color
    var unit = level[i].unit || ''
    var text = level[i].value + unit
    
    var ps = (1 / (len - 1)) * i 
    if (!gradient && i > 0 && i < len - 1) {
      var _color = level[i - 1].color
      grad.addColorStop(ps, _color)
      grad.addColorStop(ps, color)
    } else {
      grad.addColorStop(ps, color)
    }

    if (dir) {
      ctx.fillText(text, gR[0] + gR[2] + 5, gR[1] + gR[3] * (1 - ps))
    } else if (!i || i == len - 1) {
      var tw = ctx.measureText(text).width
      var y = gR[1] + gR[3] / 2
      var x = i ? gR[0] + gR[2] + 5 : gR[0] - 5 - tw
      ctx.fillText(text, x, y)
    }
  }
  ctx.fillStyle = grad
  switch (shape) {
    case 'triangle-rect':
      if (dir) {
        var td = gR[2] / 2
        ctx.beginPath()
        ctx.moveTo(gR[0] + td, gR[1])
        ctx.lineTo(gR[0] + gR[2], gR[1] + td)
        ctx.lineTo(gR[0] + gR[2], gR[1] + gR[3] - td)
        ctx.lineTo(gR[0] + td, gR[1] + gR[3])
        ctx.lineTo(gR[0], gR[1] + gR[3] - td)
        ctx.lineTo(gR[0], gR[1] + td)
        ctx.lineTo(gR[0] + td, gR[1])
        ctx.stroke()
        ctx.fill()
      } else {
        var td = gR[3] / 2
        ctx.beginPath()
        ctx.moveTo(gR[0], gR[1] + td)
        ctx.lineTo(gR[0] + td, gR[1])
        ctx.lineTo(gR[0] + gR[2] - td, gR[1])
        ctx.lineTo(gR[0] + gR[2], gR[1] + td)
        ctx.lineTo(gR[0] + gR[2] - td, gR[1] + gR[3])
        ctx.lineTo(gR[0] + td, gR[1] + gR[3])
        ctx.lineTo(gR[0], gR[1] + td)
        ctx.stroke()
        ctx.fill()
      }
      break
    default: 
      ctx.fillRect(gR[0], gR[1], gR[2], gR[3])
      break
  }
  if (title.length) {
    ctx.font = '14px 微软雅黑'
    ctx.fillStyle = config.color
    ctx.textBaseline = 'top'
    if (dir) {
      ctx.textAlign = 'start'
      ctx.fillText(title, 5, 5)
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(title, w / 2, gR[1] + gR[3] + 5)
    }
  }
  return legend
}
