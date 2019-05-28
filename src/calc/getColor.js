/**
 * 获取色值
 * @param {颜色等级} arr 
 * @param {值} v 
 * @param {是否渐变} gradient 
 */
const getColor = function(arr, v, gradient) {
  var color = false
  for (var i = 0, len = arr.length; i < len; i++) {
    if (v < arr[i].value) {
      if (!color) {
        color = JSON.parse(JSON.stringify(arr[i]))
        break
      }
      var scale = (v - color.value) / (arr[i].value - color.value)
      var f = function(k) {
        return gradient
          ? parseInt(color[k] + (arr[i][k] - color[k]) * scale)
          : arr[i][k]
      }
      color.r = f('r')
      color.g = f('g')
      color.b = f('b')
      break
    } else {
      color = JSON.parse(JSON.stringify(arr[i]))
    }
  }
  return color
}

export default getColor
