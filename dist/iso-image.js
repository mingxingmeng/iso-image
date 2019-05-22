(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.IsoImage = factory());
}(this, function () { 'use strict';

  if (!Object.assign) {
    Object.assign = function (target) {
        var source = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            source[_i - 1] = arguments[_i];
        }
        var from, to = Object(target), hasOwnProperty = Object.prototype.hasOwnProperty;
        for (var i = 0, l = source.length; i < l; i++) {
            from = Object(source[i]);
            for (var key in from) {
                if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }
        }
        return to;
    };
  }

  /**
   * 反距离平方权重法
   * @param {数据点} points 
   * @param {网格点} pointGrid 
   * @param {权重系数} pow
   */
  function idw(points, pointGrid, pow) {
    if (pow == void 0) pow = 3;
    var features = pointGrid.features;
    if (points.length < 3) return pointGrid
    var m0 = points.length;
    var m1 = features.length;

    var r = [];

    for (var i = 0; i < m1; i++) {
      for (var j = 0; j < m0; j++) {
        var tmpDis = Math.sqrt(
          Math.pow(features[i].geometry.coordinates[0] - points[j].x, 2) +
            Math.pow(features[i].geometry.coordinates[1] - points[j].y, 2)
        );
        r.push(tmpDis);
      }
    }

    for (var i = 0; i < m1; i++) {
      var ifFind = false;
      for (var j = m0 * i; j < m0 * i + m0; j++) {
        if (Math.abs(r[j]) < 0.0001) {
          features[i].properties.val = points[j - m0 * i].v;
          ifFind = true;
          break
        }
      }

      if (ifFind) continue

      var numerator = 0;
      var denominator = 0;

      for (var j = m0 * i; j < m0 * i + m0; j++) {
        numerator += points[j - m0 * i].v / Math.pow(r[j], pow);
        denominator += 1 / Math.pow(r[j], pow);
      }

      features[i].properties.val = numerator / denominator;
    }
    return pointGrid
  }

  /**
   * 图例
   * @param {等级数组} level 
   */
  function getLegend(level) {
    if (level.legend < 2) return false
    var legend = document.createElement('canvas');
    legend.width = 200;
    legend.height = 30;
    var lctx = legend.getContext('2d');
    var grad = lctx.createLinearGradient(0, 0, 200, 0);
    for (var i = 0, len = level.length; i < len; i++) {
      var color = level[i].color;
      grad.addColorStop((1 / len) * i, color);
      level[i].r = parseInt(color.substr(1, 2), 16);
      level[i].g = parseInt(color.substr(3, 2), 16);
      level[i].b = parseInt(color.substr(5, 2), 16);
    }
    lctx.fillStyle = grad;
    lctx.fillRect(0, 0, 200, 30);
    return legend.toDataURL('image/png')
  }

  /**
   * 
   * @param {isoimage option} opt 
   * @param {网格} pointGrid 
   * @param {图片配置 width: 图片宽度 opacity: 透明度 gradient 是否渐变 } config 
   */
  function getIsosurface(opt, pointGrid, config) {
    var opacity = config.opacity || 1;
    var gradient = config.gradient == void 0 ? true : config.gradient;
    var size = opt.size;
    var cellWidth = opt.cellWidth;
    var level = opt.level;
    var ex = opt.ex;
    
    var width = config.width || 1000;
    var height = Math.abs((width / size[0]) * size[1]);
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    function getColor(arr, v) {
      var color = false;
      for (var i = 0, len = arr.length; i < len; i++) {
        if (v < arr[i].value) {
          if (!color) {
            color = JSON.parse(JSON.stringify(arr[i]));
            break
          }
          var scale = (v - color.value) / (arr[i].value - color.value);
          color.r = gradient ? parseInt(color.r + (arr[i].r - color.r) * scale) : arr[i].r;
          color.g = gradient ? parseInt(color.g + (arr[i].g - color.g) * scale) : arr[i].g;
          color.b = gradient ? parseInt(color.b + (arr[i].b - color.b) * scale) : arr[i].b;
          break
        } else {
          color = JSON.parse(JSON.stringify(arr[i]));
        }
      }
      return color
    }
    // 面
    var p = pointGrid.features;
    var w = Math.abs((cellWidth / size[0]) * width);
    var h = Math.abs((cellWidth / size[1]) * height);
    for (var i = 0, len = p.length; i < len; i++) {
      var item = p[i].geometry.coordinates;
      var x = ((item[0] - ex[0][0]) / size[0]) * width - w / 2;
      var y = ((item[1] - ex[0][1]) / size[1]) * height - h / 2;
      var color = getColor(level, p[i].properties.val);
      ctx.strokeStyle = ctx.fillStyle =
        'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
      ctx.beginPath();

      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    }
    if (opacity < 1) {
      var pattern = ctx.createPattern(canvas, 'repeat');
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL('image/png')
  }

  function getIsoline(opt, lines, config) {
    var opacity = config.opacity || 1;
    var size = opt.size;
    var level = opt.level;
    var ex = opt.ex;
    var width = config.width || 1000;
    var height = Math.abs((width / size[0]) * size[1]);

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 1;
    ctx.font="12px 微软雅黑";
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    var d = lines.features;
    for (var i = 0, len = d.length; i < len; i++) {
      var c = d[i].geometry.coordinates;
      for (var j = 0, jLen = c.length; j < jLen; j++) {
        ctx.beginPath();
        for (var n = 0, cLen = c[j].length; n < cLen; n++) {
          var x = (c[j][n][0] - ex[0][0]) / size[0] * width;
          var y = (c[j][n][1] - ex[0][1]) / size[1] * height;
          ctx[n ? 'lineTo' : 'moveTo'](x, y);
          n == Math.floor(cLen / 8 * (i % 8)) && ctx.fillText(d[i].properties.val, x, y);
        }
        ctx.stroke();
      }
    }
    if (opacity < 1) {
      var pattern = ctx.createPattern(canvas, 'repeat');
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
    return canvas.toDataURL('image/png')
  }

  /**
   * 等值图生成
   * @author kongkongbuding
   */
  const O = Object.prototype.toString;
  const isArray = function(v) {
    return O.call(v) === '[object Array]'
  };
  const min = Math.min;
  const max = Math.max;
  const abs = Math.abs;
  const round = Math.round;
  const flot = 1000000;
  const turf = window['turf'];
  const defaultKeyConfig = {
    x: 'x',
    y: 'y',
    v: 'v'
  };

  function IsoImage(points, opt) {
    this.name = 'IsoImage';
    // opt 处理
    this.initialize(points, opt);
    this.getLegend = function() {
      var level = this.option.level || [];
      return getLegend(level)
    };
    this.getIsosurface = function(config) {
      var opt = this.option;
      var pointGrid = this.pointGrid;
      if (!pointGrid) return false
      config = config || {};
      return getIsosurface(opt, pointGrid, config)
    };
    this.getIsoline = function(config) {
      var opt = this.option;
      var lines = this.lines;
      if (!lines) return false
      config = config || {};
      return getIsoline(opt, lines, config)
    };
  }

  IsoImage.prototype = {
    constructor: IsoImage,
    initialize: function(points, opt) {
      var ex = opt.extent;
      var level = opt.level;
      if (!ex) return console.log('缺少参数extent(画布左上右下坐标)')
      if (!level) return console.log('缺少参数level(色阶)')
      var extent = [
        min(ex[0][0], ex[1][0]),
        min(ex[0][1], ex[1][1]),
        max(ex[0][0], ex[1][0]),
        max(ex[0][1], ex[1][1])
      ];
      var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]];
      var cellWidth = opt.cellWidth || round((abs(size[0]) / 200) * flot) / flot;
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
      };
      var key = Object.assign({}, defaultKeyConfig, opt.keyConfig);
      var p = [];
      if (isArray(points)) {
        for (var i = 0, len = points.length; i < len; i++) {
          if (points[i][key.v] == void 0) continue
          p.push({
            x: points[i][key.x],
            y: points[i][key.y],
            v: points[i][key.v]
          });
        }
      }
      this.points = p;
      this.pointGrid = turf.pointGrid(extent, cellWidth, { units: 'degrees' });
      this.build();
    },
    build: function() {
      this.calcGridValue();
      this.calcIsoLines();
    },
    calcGridValue: function() {
      var opt = this.option;
      var pointGrid = this.pointGrid;
      var points = this.points;
      switch (opt.type) {
        case 'idw':
          this.pointGrid = idw(points, pointGrid, opt.pow);
          console.log(this.pointGrid);
          break
      }
    },
    calcIsoLines: function() {
      var opt = this.option;
      var pointGrid = this.pointGrid;
      var level = opt.level;
      var breaks = [];
      for (var i = 0, len = level.length; i < len; i++)
        breaks.push(level[i].value);
      var lines = turf.isolines(pointGrid, breaks, { zProperty: 'val' });
      if (opt.smooth) {
        var _lFeatures = lines.features;
        for (var i = 0; i < _lFeatures.length; i++) {
          var _coords = _lFeatures[i].geometry.coordinates;
          var _lCoords = [];
          for (var j = 0; j < _coords.length; j++) {
            var _coord = _coords[j];
            var line = turf.lineString(_coord);
            var curved = turf.bezierSpline(line);
            _lCoords.push(curved.geometry.coordinates);
          }
          _lFeatures[i].geometry.coordinates = _lCoords;
        }
      }
      this.lines = lines;
    },
    getIsoImage: function() {}
  };

  return IsoImage;

}));
