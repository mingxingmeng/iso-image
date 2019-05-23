/**
 * 图片叠加 透明度处理
 * @param {canvas数组} cavs
 * @param {opacity: 透明度} config
 */

const O = Object.prototype.toString
const isArray = function(v) {
  return O.call(v) === '[object Array]'
}

export default function(cavs, option, config) {
  if (!cavs[0]) return false
  config = config || {}
  var opacity = config.opacity || 1
  var width = cavs[0].width
  var height = cavs[0].height
  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  ctx.globalAlpha = opacity
  ctx.strokeStyle = config.clipColor || '#333'
  ctx.lineWidth = config.clipWidth || 1
  var clip = option.clip
  if (clip && isArray(clip)) {
    var ex = option.ex
    var size = option.size
    var key = option.key || {}
    var x = key.clipX || 0
    var y = key.clipY || 1
    ctx.beginPath()
    var drawClip = function(d) {
      if (isArray(d[0]) && isArray(d[0][0])) {
        for (var i = 0, len = d.length; i < len; i++) {
          drawClip(d[i])
        }
        return
      }
      if (isArray(d)) {
        for (var i = 0, len = d.length; i < len; i++) {
          var dx = ((d[i][x] - ex[0][0]) / size[0]) * width
          var dy = ((d[i][y] - ex[0][1]) / size[1]) * height
          ctx[i ? 'lineTo' : 'moveTo'](dx, dy)
        }
      }
    }
    drawClip(clip)
    config.clip && ctx.stroke()
    ctx.clip()
  }
  for (var i = 0; cavs[i]; i++) {
    var pattern = ctx.createPattern(cavs[i], 'repeat')
    ctx.fillStyle = pattern
    ctx.fillRect(0, 0, width, height)
  }
  return canvas
}
