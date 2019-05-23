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

  var max = Math.max,
    min = Math.min,
    abs = Math.abs,
    floor = Math.floor;
  function ToObject(v) {
    if (v === null || v === undefined) throw TypeError()
    return Object(v)
  }
  function ToLength(v) {
    var len = ToInteger(v);
    if (len <= 0) return 0
    if (len === Infinity) return 0x20000000000000 - 1 // 2^53-1
    return min(len, 0x20000000000000 - 1) // 2^53-1
  }
  function ToInteger(n) {
    n = Number(n);
    if (isNaN(n)) return 0
    if (n === 0 || n === Infinity || n === -Infinity) return n
    return (n < 0 ? -1 : 1) * floor(abs(n))
  }
  Array.prototype.max = function() {
    return Math.max.apply(null, this)
  };
  Array.prototype.min = function() {
    return Math.min.apply(null, this)
  };
  Array.prototype.mean = function() {
    var i, sum;
    for (i = 0, sum = 0; i < this.length; i++) sum += this[i];
    return sum / this.length
  };
  Array.prototype.fill = function fill(value) {
    var start = arguments[1],
      end = arguments[2];

    var o = ToObject(this);
    var lenVal = o.length;
    var len = ToLength(lenVal);
    len = max(len, 0);
    var relativeStart = ToInteger(start);
    var k;
    if (relativeStart < 0) k = max(len + relativeStart, 0);
    else k = min(relativeStart, len);
    var relativeEnd;
    if (end === undefined) relativeEnd = len;
    else relativeEnd = ToInteger(end);
    var final;
    if (relativeEnd < 0) final = max(len + relativeEnd, 0);
    else final = min(relativeEnd, len);
    while (k < final) {
      var pk = String(k);
      o[pk] = value;
      k += 1;
    }
    return o
  };
  Array.prototype.rep = function(n) {
    return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, this[0])
  };
  Array.prototype.pip = function(x, y) {
    var i,
      j,
      c = false;
    for (i = 0, j = this.length - 1; i < this.length; j = i++) {
      if (
        this[i][1] > y != this[j][1] > y &&
        x <
          ((this[j][0] - this[i][0]) * (y - this[i][1])) /
            (this[j][1] - this[i][1]) +
            this[i][0]
      ) {
        c = !c;
      }
    }
    return c
  };

  var kriging = (function() {
    var kriging = {};

    var kriging_matrix_diag = function(c, n) {
      var i,
        Z = new Array(n * n).fill(0);
      for (i = 0; i < n; i++) Z[i * n + i] = c;
      return Z
    };
    var kriging_matrix_transpose = function(X, n, m) {
      var i,
        j,
        Z = Array(m * n);
      for (i = 0; i < n; i++) for (j = 0; j < m; j++) Z[j * n + i] = X[i * m + j];
      return Z
    };
    var kriging_matrix_add = function(X, Y, n, m) {
      var i,
        j,
        Z = Array(n * m);
      for (i = 0; i < n; i++)
        for (j = 0; j < m; j++) Z[i * m + j] = X[i * m + j] + Y[i * m + j];
      return Z
    };
    var kriging_matrix_multiply = function(X, Y, n, m, p) {
      var i,
        j,
        k,
        Z = Array(n * p);
      for (i = 0; i < n; i++) {
        for (j = 0; j < p; j++) {
          Z[i * p + j] = 0;
          for (k = 0; k < m; k++) Z[i * p + j] += X[i * m + k] * Y[k * p + j];
        }
      }
      return Z
    };
    var kriging_matrix_chol = function(X, n) {
      var i,
        j,
        k,
        p = Array(n);
      for (i = 0; i < n; i++) p[i] = X[i * n + i];
      for (i = 0; i < n; i++) {
        for (j = 0; j < i; j++) p[i] -= X[i * n + j] * X[i * n + j];
        if (p[i] <= 0) return false
        p[i] = Math.sqrt(p[i]);
        for (j = i + 1; j < n; j++) {
          for (k = 0; k < i; k++) X[j * n + i] -= X[j * n + k] * X[i * n + k];
          X[j * n + i] /= p[i];
        }
      }
      for (i = 0; i < n; i++) X[i * n + i] = p[i];
      return true
    };
    var kriging_matrix_chol2inv = function(X, n) {
      var i, j, k, sum;
      for (i = 0; i < n; i++) {
        X[i * n + i] = 1 / X[i * n + i];
        for (j = i + 1; j < n; j++) {
          sum = 0;
          for (k = i; k < j; k++) sum -= X[j * n + k] * X[k * n + i];
          X[j * n + i] = sum / X[j * n + j];
        }
      }
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) X[i * n + j] = 0;
      for (i = 0; i < n; i++) {
        X[i * n + i] *= X[i * n + i];
        for (k = i + 1; k < n; k++) X[i * n + i] += X[k * n + i] * X[k * n + i];
        for (j = i + 1; j < n; j++)
          for (k = j; k < n; k++) X[i * n + j] += X[k * n + i] * X[k * n + j];
      }
      for (i = 0; i < n; i++) for (j = 0; j < i; j++) X[i * n + j] = X[j * n + i];
    };
    var kriging_matrix_solve = function(X, n) {
      var m = n;
      var b = Array(n * n);
      var indxc = Array(n);
      var indxr = Array(n);
      var ipiv = Array(n);
      var i, icol, irow, j, k, l, ll;
      var big, dum, pivinv, temp;

      for (i = 0; i < n; i++)
        for (j = 0; j < n; j++) {
          if (i == j) b[i * n + j] = 1;
          else b[i * n + j] = 0;
        }
      for (j = 0; j < n; j++) ipiv[j] = 0;
      for (i = 0; i < n; i++) {
        big = 0;
        for (j = 0; j < n; j++) {
          if (ipiv[j] != 1) {
            for (k = 0; k < n; k++) {
              if (ipiv[k] == 0) {
                if (Math.abs(X[j * n + k]) >= big) {
                  big = Math.abs(X[j * n + k]);
                  irow = j;
                  icol = k;
                }
              }
            }
          }
        }
        ++ipiv[icol];

        if (irow != icol) {
          for (l = 0; l < n; l++) {
            temp = X[irow * n + l];
            X[irow * n + l] = X[icol * n + l];
            X[icol * n + l] = temp;
          }
          for (l = 0; l < m; l++) {
            temp = b[irow * n + l];
            b[irow * n + l] = b[icol * n + l];
            b[icol * n + l] = temp;
          }
        }
        indxr[i] = irow;
        indxc[i] = icol;

        if (X[icol * n + icol] == 0) return false

        pivinv = 1 / X[icol * n + icol];
        X[icol * n + icol] = 1;
        for (l = 0; l < n; l++) X[icol * n + l] *= pivinv;
        for (l = 0; l < m; l++) b[icol * n + l] *= pivinv;

        for (ll = 0; ll < n; ll++) {
          if (ll != icol) {
            dum = X[ll * n + icol];
            X[ll * n + icol] = 0;
            for (l = 0; l < n; l++) X[ll * n + l] -= X[icol * n + l] * dum;
            for (l = 0; l < m; l++) b[ll * n + l] -= b[icol * n + l] * dum;
          }
        }
      }
      for (l = n - 1; l >= 0; l--)
        if (indxr[l] != indxc[l]) {
          for (k = 0; k < n; k++) {
            temp = X[k * n + indxr[l]];
            X[k * n + indxr[l]] = X[k * n + indxc[l]];
            X[k * n + indxc[l]] = temp;
          }
        }

      return true
    };
    var kriging_variogram_gaussian = function(h, nugget, range, sill, A) {
      return (
        nugget +
        ((sill - nugget) / range) *
          (1.0 - Math.exp(-(1.0 / A) * Math.pow(h / range, 2)))
      )
    };
    var kriging_variogram_exponential = function(h, nugget, range, sill, A) {
      return (
        nugget +
        ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * (h / range)))
      )
    };
    var kriging_variogram_spherical = function(h, nugget, range, sill, A) {
      if (h > range) return nugget + (sill - nugget) / range
      return (
        nugget +
        ((sill - nugget) / range) *
          (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3))
      )
    };

    kriging.train = function(t, x, y, model, sigma2, alpha) {
      var variogram = {
        t: t,
        x: x,
        y: y,
        nugget: 0.0,
        range: 0.0,
        sill: 0.0,
        A: 1 / 3,
        n: 0
      };
      switch (model) {
        case 'gaussian':
          variogram.model = kriging_variogram_gaussian;
          break
        case 'exponential':
          variogram.model = kriging_variogram_exponential;
          break
        case 'spherical':
          variogram.model = kriging_variogram_spherical;
          break
      }

      var i,
        j,
        k,
        l,
        n = t.length;
      var distance = Array((n * n - n) / 2);
      for (i = 0, k = 0; i < n; i++)
        for (j = 0; j < i; j++, k++) {
          distance[k] = Array(2);
          distance[k][0] = Math.pow(
            Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2),
            0.5
          );
          distance[k][1] = Math.abs(t[i] - t[j]);
        }
      distance.sort(function(a, b) {
        return a[0] - b[0]
      });
      variogram.range = distance[(n * n - n) / 2 - 1][0];

      var lags = (n * n - n) / 2 > 30 ? 30 : (n * n - n) / 2;
      var tolerance = variogram.range / lags;

      var lag = new Array(lags).fill(0);
      var semi = new Array(lags).fill(0);

      if (lags < 30) {
        for (l = 0; l < lags; l++) {
          lag[l] = distance[l][0];
          semi[l] = distance[l][1];
        }
      } else {
        for (
          i = 0, j = 0, k = 0, l = 0;
          i < lags && j < (n * n - n) / 2;
          i++, k = 0
        ) {
          while (distance[j][0] <= (i + 1) * tolerance) {
            lag[l] += distance[j][0];
            semi[l] += distance[j][1];
            j++;
            k++;
            if (j >= (n * n - n) / 2) break
          }
          if (k > 0) {
            lag[l] /= k;
            semi[l] /= k;
            l++;
          }
        }
        if (l < 2) return variogram
      }

      n = l;
      variogram.range = lag[n - 1] - lag[0];

      var X = new Array(2 * n).fill(1);
      var Y = Array(n);
      var A = variogram.A;
      for (i = 0; i < n; i++) {
        switch (model) {
          case 'gaussian':
            X[i * 2 + 1] =
              1.0 - Math.exp(-(1.0 / A) * Math.pow(lag[i] / variogram.range, 2));
            break
          case 'exponential':
            X[i * 2 + 1] = 1.0 - Math.exp((-(1.0 / A) * lag[i]) / variogram.range);
            break
          case 'spherical':
            X[i * 2 + 1] =
              1.5 * (lag[i] / variogram.range) -
              0.5 * Math.pow(lag[i] / variogram.range, 3);
            break
        }
        Y[i] = semi[i];
      }

      var Xt = kriging_matrix_transpose(X, n, 2);
      var Z = kriging_matrix_multiply(Xt, X, 2, n, 2);
      Z = kriging_matrix_add(Z, kriging_matrix_diag(1 / alpha, 2), 2, 2);
      var cloneZ = Z.slice(0);
      if (kriging_matrix_chol(Z, 2)) kriging_matrix_chol2inv(Z, 2);
      else {
        kriging_matrix_solve(cloneZ, 2);
        Z = cloneZ;
      }
      var W = kriging_matrix_multiply(
        kriging_matrix_multiply(Z, Xt, 2, 2, n),
        Y,
        2,
        n,
        1
      );

      variogram.nugget = W[0];
      variogram.sill = W[1] * variogram.range + variogram.nugget;
      variogram.n = x.length;

      n = x.length;
      var K = Array(n * n);
      for (i = 0; i < n; i++) {
        for (j = 0; j < i; j++) {
          K[i * n + j] = variogram.model(
            Math.pow(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2), 0.5),
            variogram.nugget,
            variogram.range,
            variogram.sill,
            variogram.A
          );
          K[j * n + i] = K[i * n + j];
        }
        K[i * n + i] = variogram.model(
          0,
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A
        );
      }

      var C = kriging_matrix_add(K, kriging_matrix_diag(sigma2, n), n, n);
      var cloneC = C.slice(0);
      if (kriging_matrix_chol(C, n)) kriging_matrix_chol2inv(C, n);
      else {
        kriging_matrix_solve(cloneC, n);
        C = cloneC;
      }

      var K = C.slice(0);
      var M = kriging_matrix_multiply(C, t, n, n, 1);
      variogram.K = K;
      variogram.M = M;

      return variogram
    };
    kriging.predict = function(x, y, variogram) {
      var i,
        k = Array(variogram.n);
      for (i = 0; i < variogram.n; i++)
        k[i] = variogram.model(
          Math.pow(
            Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
            0.5
          ),
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A
        );
      return kriging_matrix_multiply(k, variogram.M, 1, variogram.n, 1)[0]
    };
    kriging.variance = function(x, y, variogram) {
      var i,
        k = Array(variogram.n);
      for (i = 0; i < variogram.n; i++)
        k[i] = variogram.model(
          Math.pow(
            Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2),
            0.5
          ),
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A
        );
      return (
        variogram.model(
          0,
          variogram.nugget,
          variogram.range,
          variogram.sill,
          variogram.A
        ) +
        kriging_matrix_multiply(
          kriging_matrix_multiply(k, variogram.K, 1, variogram.n, variogram.n),
          k,
          1,
          variogram.n,
          1
        )[0]
      )
    };
    kriging.grid = function(polygons, variogram, width) {
      var i,
        j,
        k,
        n = polygons.length;
      if (n == 0) return

      var xlim = [polygons[0][0][0], polygons[0][0][0]];
      var ylim = [polygons[0][0][1], polygons[0][0][1]];
      for (
        i = 0;
        i < n;
        i++
      )
        for (j = 0; j < polygons[i].length; j++) {
          if (polygons[i][j][0] < xlim[0]) xlim[0] = polygons[i][j][0];
          if (polygons[i][j][0] > xlim[1]) xlim[1] = polygons[i][j][0];
          if (polygons[i][j][1] < ylim[0]) ylim[0] = polygons[i][j][1];
          if (polygons[i][j][1] > ylim[1]) ylim[1] = polygons[i][j][1];
        }

      var xtarget, ytarget;
      var a = Array(2),
        b = Array(2);
      var lxlim = Array(2);
      var lylim = Array(2);
      var x = Math.ceil((xlim[1] - xlim[0]) / width);
      var y = Math.ceil((ylim[1] - ylim[0]) / width);

      var A = Array(x + 1);
      for (i = 0; i <= x; i++) A[i] = Array(y + 1);
      for (i = 0; i < n; i++) {
        lxlim[0] = polygons[i][0][0];
        lxlim[1] = lxlim[0];
        lylim[0] = polygons[i][0][1];
        lylim[1] = lylim[0];
        for (j = 1; j < polygons[i].length; j++) {

          if (polygons[i][j][0] < lxlim[0]) lxlim[0] = polygons[i][j][0];
          if (polygons[i][j][0] > lxlim[1]) lxlim[1] = polygons[i][j][0];
          if (polygons[i][j][1] < lylim[0]) lylim[0] = polygons[i][j][1];
          if (polygons[i][j][1] > lylim[1]) lylim[1] = polygons[i][j][1];
        }

        a[0] = Math.floor(
          (lxlim[0] - ((lxlim[0] - xlim[0]) % width) - xlim[0]) / width
        );
        a[1] = Math.ceil(
          (lxlim[1] - ((lxlim[1] - xlim[1]) % width) - xlim[0]) / width
        );
        b[0] = Math.floor(
          (lylim[0] - ((lylim[0] - ylim[0]) % width) - ylim[0]) / width
        );
        b[1] = Math.ceil(
          (lylim[1] - ((lylim[1] - ylim[1]) % width) - ylim[0]) / width
        );
        for (j = a[0]; j <= a[1]; j++)
          for (k = b[0]; k <= b[1]; k++) {
            xtarget = xlim[0] + j * width;
            ytarget = ylim[0] + k * width;
            if (polygons[i].pip(xtarget, ytarget))
              A[j][k] = kriging.predict(xtarget, ytarget, variogram);
          }
      }
      A.xlim = xlim;
      A.ylim = ylim;
      A.zlim = [variogram.t.min(), variogram.t.max()];
      A.width = width;
      return A
    };
    kriging.contour = function(value, polygons, variogram) {};
    kriging.plot = function(canvas, grid, xlim, ylim, colors) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var range = [
        xlim[1] - xlim[0],
        ylim[1] - ylim[0],
        grid.zlim[1] - grid.zlim[0]
      ];
      var i, j, x, y, z;
      var n = grid.length;
      var m = grid[0].length;
      var wx = Math.ceil((grid.width * canvas.width) / (xlim[1] - xlim[0]));
      var wy = Math.ceil((grid.width * canvas.height) / (ylim[1] - ylim[0]));
      for (i = 0; i < n; i++)
        for (j = 0; j < m; j++) {
          if (grid[i][j] == undefined) continue
          x =
            (canvas.width * (i * grid.width + grid.xlim[0] - xlim[0])) / range[0];
          y =
            canvas.height *
            (1 - (j * grid.width + grid.ylim[0] - ylim[0]) / range[1]);
          z = (grid[i][j] - grid.zlim[0]) / range[2];
          if (z < 0.0) z = 0.0;
          if (z > 1.0) z = 1.0;

          ctx.fillStyle = colors[Math.floor((colors.length - 1) * z)];
          ctx.fillRect(Math.round(x - wx / 2), Math.round(y - wy / 2), wx, wy);
        }
    };
    return kriging
  })();

  /**
   * 绘制图例
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
      // level[i].r = parseInt(color.substr(1, 2), 16)
      // level[i].g = parseInt(color.substr(3, 2), 16)
      // level[i].b = parseInt(color.substr(5, 2), 16)
    }
    lctx.fillStyle = grad;
    lctx.fillRect(0, 0, 200, 30);
    return legend.toDataURL('image/png')
  }

  /**
   * 绘制等值面
   * @param {isoimage option} opt 
   * @param {网格} pointGrid 
   * @param {图片配置 width: 图片宽度 opacity: 透明度 gradient 是否渐变 } config 
   */
  function getIsosurface(opt, pointGrid, config) {
    config = config || {};
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
    
    var p = pointGrid.features;
    var w = Math.abs((cellWidth / size[0]) * width);
    var h = Math.abs((cellWidth / size[1]) * height);
    for (var i = 0, len = p.length; i < len; i++) {
      var item = p[i].geometry.coordinates;
      var x = ((item[0] - ex[0][0]) / size[0]) * width - w / 2;
      var y = ((item[1] - ex[0][1]) / size[1]) * height - h / 2;
      var color = getColor(level, p[i].properties.val, gradient);
      ctx.strokeStyle = ctx.fillStyle =
        'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
      ctx.beginPath();
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    }
    return canvas
  }

  function getColor(arr, v, gradient) {
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

  /**
   * 绘制等值线
   * @param {isoimage option} opt 
   * @param {线数据} lines 
   * @param {图片配置 width: 图片宽度} config 
   */
  function getIsoline(opt, lines, config) {
    config = config || {};
    var size = opt.size;
    var ex = opt.ex;
    var width = config.width || 1000;
    var height = Math.abs((width / size[0]) * size[1]);
    var level = opt.level;
    var color = config.isolineColor || '#333';
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.font="12px 微软雅黑";
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    var d = lines.features;
    var position = {};
    for (var i = 0, len = d.length; i < len; i++) {
      var c = d[i].geometry.coordinates;
      var val = d[i].properties.val;
      var _color = color;
      if (color == 'level') {
        for (var q = 0; level[q]; q++) {
          if (level[q].value == val) {
            _color = level[q].color;
            break
          }
        }
      }
      ctx.strokeStyle = ctx.fillStyle = _color;
      for (var j = 0, jLen = c.length; j < jLen; j++) {
        ctx.beginPath();
        var ft = 0;
        for (var n = 0, cLen = c[j].length; n < cLen; n++) {
          var x = (c[j][n][0] - ex[0][0]) / size[0] * width;
          var y = (c[j][n][1] - ex[0][1]) / size[1] * height;
          ctx[n ? 'lineTo' : 'moveTo'](x, y);
          var dx = Math.round(x / 16);
          var dy = Math.round(y / 16);
          var k = dx + '-' + dy;
          if (!position[k] && !ft) {
            position[k] = 1;
            ft = 1;
            ctx.fillText(d[i].properties.val, x, y);
          }
        }
        ctx.stroke();
      }
    }
    return canvas
  }

  /**
   * 图片叠加 透明度处理
   * @param {canvas数组} cavs 
   * @param {opacity: 透明度} config 
   */

  const O = Object.prototype.toString;
  const isArray = function(v) {
    return O.call(v) === '[object Array]'
  };

  function mix(cavs, option, config) {
    if (!cavs[0]) return false
    config = config || {};
    var opacity = config.opacity || 1;
    var width = cavs[0].width;
    var height = cavs[0].height;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = config.clipColor || '#333';
    ctx.lineWidth = config.clipWidth || 1;
    var clip = option.clip;
    if (clip && isArray(clip)) {
      var ex = option.ex;
      var size = option.size;
      var key = option.key || {};
      var x = key.clipX || 0;
      var y = key.clipY || 1;
      ctx.beginPath();
      var drawClip = function (d) {
        if (isArray(d[0]) && isArray(d[0][0])) {
          for (var i = 0, len = d.length; i < len; i++) {
            drawClip(d[i]);
          }
          return
        }
        if (isArray(d)) {
          for (var i = 0, len = d.length; i < len; i++) {
            var dx = (d[i][x] - ex[0][0]) / size[0] * width;
            var dy = (d[i][y] - ex[0][1]) / size[1] * height;
            ctx[i ? 'lineTo' : 'moveTo'](dx, dy);
          }
        }
      };
      drawClip(clip);
      config.clip && ctx.stroke();
      ctx.clip();
    }
    for (var i = 0; cavs[i]; i++) {
      var pattern = ctx.createPattern(cavs[i], 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
    return canvas
  }

  /**
   * 等值图生成
   * @author kongkongbuding
   */

  const turf = window['turf'];
  const name = 'IsoImage';
  const picture = 'image/png';
  const units = 'degrees';
  const sigma2 = 0.1;
  const alpha = 100;
  const O$1 = Object.prototype.toString;
  const isArray$1 = function(v) {
    return O$1.call(v) === '[object Array]'
  };
  const min$1 = Math.min;
  const max$1 = Math.max;
  const abs$1 = Math.abs;
  const round = Math.round;
  const flot = 1000000;
  const defaultKeyConfig = {
    x: 'x',
    y: 'y',
    v: 'v',
    clipX: '0',
    clipY: '1'
  };
  function IsoImage(points, opt) {
    this.name = name;

    this.initialize(points, opt);

    this.getLegend = function() {
      var level = this.option.level || [];
      return getLegend(level)
    };
    this.getIsosurface = function(config) {
      if (!this.alow()) return false
      return mix(
        [getIsosurface(this.option, this.pointGrid, config)],
        this.option,
        config
      ).toDataURL(picture)
    };
    this.getIsoline = function(config) {
      if (!this.alow()) return false
      return mix(
        [getIsoline(this.option, this.lines, config)],
        this.option,
        config
      ).toDataURL(picture)
    };
    this.getIsoImage = function(config) {
      if (!this.alow()) return false
      return mix(
        [
          getIsosurface(this.option, this.pointGrid, config),
          getIsoline(this.option, this.lines, config)
        ],
        this.option,
        config
      ).toDataURL(picture)
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
        min$1(ex[0][0], ex[1][0]),
        min$1(ex[0][1], ex[1][1]),
        max$1(ex[0][0], ex[1][0]),
        max$1(ex[0][1], ex[1][1])
      ];
      var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]];
      var cellWidth = opt.cellWidth || round((abs$1(size[0]) / 200) * flot) / flot;
      var key = Object.assign({}, defaultKeyConfig, opt.keyConfig);

      for (var i = 0, len = level.length; i < len; i++) {
        var color = level[i].color;
        level[i].r = parseInt(color.substr(1, 2), 16);
        level[i].g = parseInt(color.substr(3, 2), 16);
        level[i].b = parseInt(color.substr(5, 2), 16);
      }

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
      };
      var p = [],
        v = [],
        x = [],
        y = [];
      if (isArray$1(points)) {
        for (var i = 0, len = points.length; i < len; i++) {
          if (points[i][key.v] == void 0) continue
          var _v = points[i][key.v];
          var _x = points[i][key.x];
          var _y = points[i][key.y];
          p.push({
            x: _x,
            y: _y,
            v: _v
          });
          v.push(_v);
          x.push(_x);
          y.push(_y);
        }
      }
      this.points = p;
      this._v = v;
      this._x = x;
      this._y = y;
      this.pointGrid = turf.pointGrid(extent, cellWidth, { units: units });
      this.build();
    },
    build: function() {
      this.calcGridValue();
      this.calcIsoLines();
    },
    calcGridValue: function() {
      var opt = this.option;
      var pointGrid = this.pointGrid;
      switch (opt.type) {
        case 'kriging':
          var variogram = kriging.train(
            this._v,
            this._x,
            this._y,
            opt.model,
            sigma2,
            alpha
          );
          for (var i = 0; i < pointGrid.features.length; i++) {
            pointGrid.features[i].properties.val = kriging.predict(
              pointGrid.features[i].geometry.coordinates[0],
              pointGrid.features[i].geometry.coordinates[1],
              variogram
            );
          }
          break
        default:
          var points = this.points;
          this.pointGrid = idw(points, pointGrid, opt.pow);
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
    alow: function() {
      return this.pointGrid && this.lines
    }
  };

  return IsoImage;

}));
