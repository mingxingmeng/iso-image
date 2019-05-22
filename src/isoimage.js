/**
 * 等值图生成
 * @author kongkongbuding
 */

import idw from './idw/idw'
import getLegend from './util/legend'
import getIsosurface from './util/isosurface'
import getIsoline from './util/isoline'
const O = Object.prototype.toString
const isArray = function(v) {
  return O.call(v) === '[object Array]'
}
const min = Math.min
const max = Math.max
const pow = Math.pow
const abs = Math.abs
const round = Math.round
const flot = 1000000
const turf = window['turf']
const defaultKeyConfig = {
  x: 'x',
  y: 'y',
  v: 'v'
}

export default function IsoImage(points, opt) {
  this.name = 'IsoImage'
  // opt 处理
  this.initialize(points, opt)
  this.getLegend = function() {
    var level = this.option.level || []
    return getLegend(level)
  }
  this.getIsosurface = function(config) {
    var opt = this.option
    var pointGrid = this.pointGrid
    if (!pointGrid) return false
    config = config || {}
    return getIsosurface(opt, pointGrid, config)
  }
  this.getIsoline = function(config) {
    var opt = this.option
    var lines = this.lines
    if (!lines) return false
    config = config || {}
    return getIsoline(opt, lines, config)
  }
}

IsoImage.prototype = {
  constructor: IsoImage,
  initialize: function(points, opt) {
    var ex = opt.extent
    var level = opt.level
    if (!ex) return console.log('缺少参数extent(画布左上右下坐标)')
    if (!level) return console.log('缺少参数level(色阶)')
    var extent = [
      min(ex[0][0], ex[1][0]),
      min(ex[0][1], ex[1][1]),
      max(ex[0][0], ex[1][0]),
      max(ex[0][1], ex[1][1])
    ]
    var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]]
    var cellWidth = opt.cellWidth || round((abs(size[0]) / 200) * flot) / flot
    this.option = {
      type: opt.type || 'idw',
      pow: opt.pow || 3,
      clip: opt.clip,
      smooth: opt.smooth,
      ex: ex,
      extent: extent,
      size: size,
      cellWidth: cellWidth,
      level: level
    }
    var key = Object.assign({}, defaultKeyConfig, opt.keyConfig)
    var p = []
    if (isArray(points)) {
      for (var i = 0, len = points.length; i < len; i++) {
        if (points[i][key.v] == void 0) continue
        p.push({
          x: points[i][key.x],
          y: points[i][key.y],
          v: points[i][key.v]
        })
      }
    }
    this.points = p
    this.pointGrid = turf.pointGrid(extent, cellWidth, { units: 'degrees' })
    this.build()
  },
  build: function() {
    this.calcGridValue()
    this.calcIsoLines()
  },
  calcGridValue: function() {
    var opt = this.option
    var pointGrid = this.pointGrid
    var points = this.points
    switch (opt.type) {
      case 'idw':
        this.pointGrid = idw(points, pointGrid, opt.pow)
        console.log(this.pointGrid)
        break
    }
  },
  calcIsoLines: function() {
    var opt = this.option
    var pointGrid = this.pointGrid
    var level = opt.level
    var breaks = []
    for (var i = 0, len = level.length; i < len; i++)
      breaks.push(level[i].value)
    var lines = turf.isolines(pointGrid, breaks, { zProperty: 'val' })
    if (opt.smooth) {
      var _lFeatures = lines.features
      for (var i = 0; i < _lFeatures.length; i++) {
        var _coords = _lFeatures[i].geometry.coordinates
        var _lCoords = []
        for (var j = 0; j < _coords.length; j++) {
          var _coord = _coords[j]
          var line = turf.lineString(_coord)
          var curved = turf.bezierSpline(line)
          _lCoords.push(curved.geometry.coordinates)
        }
        _lFeatures[i].geometry.coordinates = _lCoords
      }
    }
    this.lines = lines
  },
  getIsoImage: function() {}
}
