/**
 * 绘制等值面
 * @param {isoimage option} opt
 * @param {网格} pointGrid
 * @param {} isosurface
 * @param {图片配置 width: 图片宽度 opacity: 透明度 gradient 是否渐变, filter 过滤筛选 } config
 */
import getColor from '../calc/getColor'
export default function(opt, pointGrid, isosurface, config) {
  config = config || {}
  var gradient = config.gradient == void 0 ? true : config.gradient
  var size = opt.size
  var cellWidth = opt.cellWidth
  var level = opt.level
  var ex = opt.ex
  var filter = config.filter

  var width = config.width || 1000
  var height = Math.abs((width / size[0]) * size[1])
  var canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  var ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  if (gradient) {
    var p = pointGrid.features
    var w = Math.abs((cellWidth / size[0]) * width)
    var h = Math.abs((cellWidth / size[1]) * height)
    for (var i = 0, len = p.length; i < len; i++) {
      var item = p[i].geometry.coordinates
      var x = ((item[0] - ex[0][0]) / size[0]) * width - w / 2
      var y = ((item[1] - ex[0][1]) / size[1]) * height - h / 2
      var color = getColor(level, p[i].properties.val, gradient)
      var val = color.value
      if (filter && filter.indexOf && filter.indexOf(val) == -1) continue
      ctx.strokeStyle = ctx.fillStyle =
        'rgb(' + color.r + ',' + color.g + ',' + color.b + ')'
      ctx.beginPath()
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
    }
  } else {
    var d = isosurface.features
    for (var i = 0, len = d.length; i < len; i++) {
      var val = d[i].properties.val
      if (filter && filter.indexOf && filter.indexOf(val) == -1) continue
      var c = d[i].geometry.coordinates
      ctx.strokeStyle = ctx.fillStyle = d[i].properties.color
      ctx.beginPath()
      for (var j = 0, jLen = c.length; j < jLen; j++) {
        for (var n = 0, cLen = c[j].length; n < cLen; n++) {
          var x = ((c[j][n][0] - ex[0][0]) / size[0]) * width
          var y = ((c[j][n][1] - ex[0][1]) / size[1]) * height
          ctx[n ? 'lineTo' : 'moveTo'](x, y)
        }
      }
      ctx.fill('evenodd')
    }
  }
  
  return canvas
}
