/**
 * 图例
 * @param {等级数组} level 
 */
export default function(level) {
  if (level.legend < 2) return false
  var legend = document.createElement('canvas')
  legend.width = 200
  legend.height = 30
  var lctx = legend.getContext('2d')
  var grad = lctx.createLinearGradient(0, 0, 200, 0)
  for (var i = 0, len = level.length; i < len; i++) {
    var color = level[i].color
    grad.addColorStop((1 / len) * i, color)
    level[i].r = parseInt(color.substr(1, 2), 16)
    level[i].g = parseInt(color.substr(3, 2), 16)
    level[i].b = parseInt(color.substr(5, 2), 16)
  }
  lctx.fillStyle = grad
  lctx.fillRect(0, 0, 200, 30)
  return legend.toDataURL('image/png')
}
