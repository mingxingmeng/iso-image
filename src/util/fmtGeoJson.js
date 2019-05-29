
const newSpace = function(d) {
  return JSON.parse(JSON.stringify(d))
}
/**
 * [lng, lat] => [lat, lng]
 * @param {经纬度数组} latlngs 
 * @param {数组层级} deep 
 */
const fmtLatLng = function(latlngs, deep) {
  if (!deep) return [latlngs[1], latlngs[0]]
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
