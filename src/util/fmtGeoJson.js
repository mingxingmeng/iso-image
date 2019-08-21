
const newSpace = function(d) {
  return JSON.parse(JSON.stringify(d))
}
/**
 * [lng, lat] => [lat, lng]
 * @param {经纬度数组} latlngs 
 * @param {数组层级} deep 
 */
export const fmtLatLng = function(latlngs, deep, x, y) {
  if (y === void 0) y = 1
  if (x === void 0) x = 0
  if (!deep) return [latlngs[y], latlngs[x]]
  deep--
  for (var i = 0, len = latlngs.length; i < len; i++) {
    latlngs[i] = fmtLatLng(latlngs[i], deep)
  }
  return latlngs
}

const fmtGeoJson = function(data) {
  var d = newSpace(data)
  for (var i = 0, len = d.features.length; i < len; i++) {
    var coor = d.features[i].geometry.coordinates
    d.features[i].geometry.coordinates = fmtLatLng(coor, 2)
  }
  return d
}

export default fmtGeoJson
