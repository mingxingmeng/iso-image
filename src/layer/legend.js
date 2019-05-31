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
  var legend = document.createElement('canvas')
  var w = dir ? 100 : 340
  if (!gradient) w += 20
  var h = dir ? 240 : 50
  legend.width = w
  legend.height = h
  var gR = dir ? [10, 20, 30, 200] : [70, 10, 200, 30]
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
  ctx.strokeRect(gR[0], gR[1], gR[2], gR[3])
  if (gradient) {
    var grad = ctx.createLinearGradient(lG[0], lG[1], lG[2], lG[3])
    for (var i = 0, len = level.length; i < len; i++) {
      var color = level[i].color
      var unit = level[i].unit || ''
      var text = level[i].value + unit
      
      var ps = (1 / (len - 1)) * i 
      grad.addColorStop(ps, color)

      if (dir) {
        ctx.fillText(text, gR[0] + gR[2] + 5, gR[1] + gR[3] * (1 - ps))
      } else if (!i || i == len - 1) {
        var tw = ctx.measureText(text).width
        var y = h / 2
        var x = i ? gR[0] + gR[2] + 5 : gR[0] - 5 - tw
        ctx.fillText(text, x, y)
      }
    }
    ctx.fillStyle = grad
    ctx.fillRect(gR[0], gR[1], gR[2], gR[3])
  } else {
    for (var i = 0, len = level.length; i <= len; i++) {
      var v = level[i] ? level[i] : level[level.length - 1]
      var color = v.color
      var unit = v.unit || ''
      var text = i == 0 || i == len ? v.value + unit : level[i - 1].value + '-' + v.value + unit
      
      ctx.fillStyle = color
      if (dir) {
        var ps = (1 / (len + 1)) * (i + 1)
        var x = gR[0]
        var y = gR[1] + gR[3] * (1 - ps)
        var iw = gR[2]
        var ih = gR[3] / (len + 1)
        ctx.fillRect(x, y, iw, ih)
        ctx.fillStyle = config.color
        ctx.fillText(text, x + iw + 5, y + ih / 2)
      } else {
        var x = gR[0] + (1 / len) * i * gR[2]
        var y = gR[1]
        var iw = gR[2] / len
        var ih = gR[3]
        i < len && ctx.fillRect(x, y, iw, ih)
        if (!i || i == len) {
          var tw = ctx.measureText(text).width
          var y = h / 2
          var x = i ? gR[0] + gR[2] + 5 : gR[0] - 5 - tw
          ctx.fillStyle = config.color
          ctx.fillText(text, x, y)
        }
      }
    }
  }
  
  return legend
}
