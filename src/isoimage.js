/**
 * 等值图生成
 * @author kongkongbuding
 */
import idw from './calc/idw'
import kriging from './calc/kriging'
import calcBlock from './calc/calcBlock'
import getLegend from './layer/legend'
import getIsosurface from './layer/isosurface'
import getIsoline from './layer/isoline'
import mix from './layer/mix'
import fmtGeoJson from './util/fmtGeoJson'
import leafletLayer from './util/leafletLayer'
import leafletLegend from './util/leafletLegend'
import leafletImage from './util/leafletImage'
import fmtLevel from './util/fmtLevel'

const name = 'IsoImage'
const picture = 'image/png'
const units = 'degrees'
const sigma2 = 0.1
const alpha = 100
const O = Object.prototype.toString
const isArray = function(v) { return O.call(v) === '[object Array]' }
const isIE = 'ActiveXObject' in window
const min = Math.min
const max = Math.max
const abs = Math.abs
const round = Math.round
const flot = 1000000

const defaultKeyConfig = {
  x: 'x',
  y: 'y',
  v: 'v',
  clipX: '0',
  clipY: '1'
}
const existLeaflet = function() {
  var l = 'L' in window
  if (!l) console.log('未加载leaflet')
  return l
}
export default function IsoImage(points, opt) {
  this.name = name

  this.initialize(points, opt)

  this.getIsosurface = function(config) {
    if (!this.alow()) return false
    return mix(
      [getIsosurface(this.option, this.pointGrid, this.isosurface, config)],
      this.option,
      config
    ).toDataURL(picture)
  }
  this.getIsoline = function(config) {
    if (!this.alow()) return false
    return mix(
      [getIsoline(this.option, this.isoline, config)],
      this.option,
      config
    ).toDataURL(picture)
  }
  this.getIsoImage = function(config) {
    if (!this.alow()) return false
    return mix(
      [
        getIsosurface(this.option, this.pointGrid, this.isosurface, config),
        getIsoline(this.option, this.isoline, config)
      ],
      this.option,
      config
    ).toDataURL(picture)
  }
  this.getLegend = function(config) {
    var level = this.option.level || []
    var legend = getLegend(level, config)
    if (!legend) return false
    return getLegend(level, config).toDataURL('image/png')
  }
  this.layer = function(config) {
    if (!existLeaflet()) return
    config = Object.assign({}, {
      padding: 0.5
    }, config)
    return leafletLayer(config)
  }
  this.drawIsosurface = function(layer, config) {
    if (!existLeaflet()) return
    var d = this.fmtLatlngsIsosurface
    var group = leafletImage(d, 'polygon', layer, config)
    return L.featureGroup(group)
  }
  this.drawIsoline = function(layer, config) {
    if (!existLeaflet()) return
    var d = this.fmtLatlngsIsoline
    var group = leafletImage(d, 'polyline', layer, config)
    return L.featureGroup(group)
  }
  this.drawIsoImage = function(layer, config) {
    if (!existLeaflet()) return
    var isosurface = this.fmtLatlngsIsosurface
    var isoline = this.fmtLatlngsIsoline
    var isosurfaceGroup = leafletImage(isosurface, 'polygon', layer, config)
    var isolineGroup = leafletImage(isoline, 'polyline', layer, config)
    var group = isosurfaceGroup.concat(isolineGroup)
    return L.featureGroup(group)
  }
  this.drawLegend = function(config) {
    if (!existLeaflet()) return
    config = Object.assign({}, {
      position: 'bottomleft',
      gradient: true
    }, config)
    var level = this.option.level || []
    var legend = getLegend(level, config)
    if (!legend) return false
    config.canvas = legend
    return leafletLegend(config)
  }
}

IsoImage.prototype = {
  constructor: IsoImage,
  initialize: function(points, opt) {
    this.turfIsolines = opt.turfIsolines || window['turfIsolines']
    this.turfPointGrid = opt.turfPointGrid || window['turfPointGrid']
    var ex = opt.extent
    var level = opt.level
    if (!ex) return console.log('缺少参数extent(画布左上右下坐标)')
    if (!level) return console.log('缺少参数level(色阶)')
    level = fmtLevel(level)
    var extent = [
      min(ex[0][0], ex[1][0]),
      min(ex[0][1], ex[1][1]),
      max(ex[0][0], ex[1][0]),
      max(ex[0][1], ex[1][1])
    ]
    var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]]
    var cellWidth = opt.cellWidth || round((abs(size[0]) / 200) * flot) / flot
    if (isIE) cellWidth *= 3
    var key = Object.assign({}, defaultKeyConfig, opt.keyConfig)
    this.option = {
      type: opt.type || 'idw',
      pow: opt.pow || 3,
      model: opt.model || 'spherical', // gaussian|exponential|spherical
      clip: opt.clip,
      smooth: opt.smooth,
      ex: ex,
      extent: extent,
      size: size,
      cellWidth: cellWidth,
      level: level,
      key: key
    }
    var p = [],
      v = [],
      x = [],
      y = []
    if (isArray(points)) {
      for (var i = 0, len = points.length; i < len; i++) {
        if (points[i][key.v] == void 0) continue
        var _v = points[i][key.v]
        var _x = points[i][key.x]
        var _y = points[i][key.y]
        p.push({
          x: _x,
          y: _y,
          v: _v
        })
        v.push(_v)
        x.push(_x)
        y.push(_y)
      }
    }
    this.points = p
    this._v = v
    this._x = x
    this._y = y
    this.pointGrid = this.turfPointGrid(extent, cellWidth, { units: units })
    this.calcGridValue()
    this.calcIso()
  },
  calcGridValue: function() {
    var opt = this.option
    var pointGrid = this.pointGrid
    switch (opt.type) {
      case 'kriging':
        var variogram = kriging.train(
          this._v,
          this._x,
          this._y,
          opt.model,
          sigma2,
          alpha
        )
        for (var i = 0; i < pointGrid.features.length; i++) {
          var krigingVal = kriging.predict(
            pointGrid.features[i].geometry.coordinates[0],
            pointGrid.features[i].geometry.coordinates[1],
            variogram
          )
          pointGrid.features[i].properties.val = krigingVal
        }
        break
      default:
        var points = this.points
        this.pointGrid = idw(points, pointGrid, opt.pow)
        break
    }
  },
  calcIso: function() {
    var opt = this.option
    var pointGrid = this.pointGrid
    var level = opt.level
    var breaks = []
    for (var i = 0, len = level.length; i < len; i++)
      breaks.push(level[i].value)
    var lines = this.turfIsolines(pointGrid, breaks, { zProperty: 'val' })
    
    var d = lines.features
    for (var i = 0, len = d.length; i < len; i++) {
      var val = d[i].properties.val
      for (var q = 0; level[q]; q++) {
        if (level[q].value == val) {
          d[i].properties.color = level[q].color
          break
        }
      }
    }
    // 等值线平滑处理
    // if (opt.smooth) {
    //   var _lFeatures = lines.features
    //   for (var i = 0; i < _lFeatures.length; i++) {
    //     var _coords = _lFeatures[i].geometry.coordinates
    //     var _lCoords = []
    //     for (var j = 0; j < _coords.length; j++) {
    //       var _coord = _coords[j]
    //       var line = turf.lineString(_coord)
    //       var curved = turf.bezierSpline(line)
    //       _lCoords.push(curved.geometry.coordinates)
    //     }
    //     _lFeatures[i].geometry.coordinates = _lCoords
    //   }
    // }
    this.isoline = lines
    this.isosurface = calcBlock(lines, opt.extent, pointGrid, level)
    
    this.fmtLatlngsIsoline = fmtGeoJson(this.isoline)
    this.fmtLatlngsIsosurface = fmtGeoJson(this.isosurface)
  },
  alow: function() {
    return this.pointGrid && this.isoline
  }
}
