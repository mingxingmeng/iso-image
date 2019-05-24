(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.IsoImage = factory());
}(this, function () { 'use strict';

  if (!Object.assign) {
    Object.assign = function(target) {
      var source = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        source[_i - 1] = arguments[_i];
      }
      var from,
        to = Object(target),
        hasOwnProperty = Object.prototype.hasOwnProperty;
      for (var i = 0, l = source.length; i < l; i++) {
        from = Object(source[i]);
        for (var key in from) {
          if (hasOwnProperty.call(from, key)) {
            to[key] = from[key];
          }
        }
      }
      return to
    };
  }

  var max = Math.max;
  var min = Math.min;
  var abs = Math.abs;
  var floor = Math.floor;
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
   * 克里金插值
   */
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
    return kriging
  })();

  const crossMul = function(v1, v2) {
    return v1[0] * v2[1] - v1[1] * v2[0]
  };

  const checkCross = function(p1, p2, p3, p4) {
    var v1 = [p1[0] - p3[0], p1[1] - p3[1]],
      v2 = [p2[0] - p3[0], p2[1] - p3[1]],
      v3 = [p4[0] - p3[0], p4[1] - p3[1]],
      v = crossMul(v1, v3) * crossMul(v2, v3);

    v1 = [p3[0] - p1[0], p3[1] - p1[1]];
    v2 = [p4[0] - p1[0], p4[1] - p1[1]];
    v3 = [p2[0] - p1[0], p2[1] - p1[1]];

    return v <= 0 && crossMul(v1, v3) * crossMul(v2, v3) <= 0 ? true : false
  };

  const hitArea = function(point, polygon) {
    var p1 = point,
      p2 = [-100, point[1]],
      p3,
      p4,
      count = 0;

    for (var i = 0, len = polygon.length - 1; i < len; i++) {
      p3 = polygon[i];
      p4 = polygon[i + 1];
      if (checkCross(p1, p2, p3, p4)) count++;
    }

    p3 = polygon[polygon.length - 1];
    p4 = polygon[0];
    if (checkCross(p1, p2, p3, p4)) count++;

    return count % 2 == 0 ? false : true
  };

  const newSpace = function(d) {
    return JSON.parse(JSON.stringify(d))
  };
  const samePoint = function(a, b) {
    return a[0] == b[0] && a[1] == b[1]
  };
  var search = function(catchLine, extent, side, arr, d, limit, nArr) {
    nArr = nArr || [];
    var tp = arr[arr.length - 1];
    var fp;
    var fd;
    var to;
    var coor;
    var k = d == 't' || d == 'b' ? 0 : 1;
    var q = d == 't' || d == 'l' ? 1 : -1;
    var lim = limit ? -1 : 1;
    for (var i = 0; side[d][i]; i++) {
      var _tpi = side[d][i];
      var dd = (_tpi.p[k] - tp[k]) * q * lim;
      if (dd > 0) {
        if (!fp || fp && fd > dd) {
          fp = _tpi;
          fd = dd;
        }
      }
    }
    if (!fp) {
      if (limit) {
        switch (d)
        {
          case 't': arr.push(extent['sa']); to = 'r'; break
          case 'r': arr.push(extent['sb']); to = 'b'; break
          case 'b': arr.push(extent['sc']); to = 'l'; break
          case 'l': arr.push(extent['sd']); to = 't'; break
        }
      } else {
        switch (d)
        {
          case 't': arr.push(extent['sb']); to = 'r'; break
          case 'r': arr.push(extent['sc']); to = 'b'; break
          case 'b': arr.push(extent['sd']); to = 'l'; break
          case 'l': arr.push(extent['sa']); to = 't'; break
        }
      }
    } else {
      if (samePoint(fp.p, arr[0])) {
        arr.push(fp.p);
      } else {
        coor = newSpace(catchLine[fp.coor].coor);
        if (fp.d) coor.reverse();
        arr = arr.concat(coor);
      }
      to = fp.t;
    }
    if (arr.length > 1 && samePoint(arr[0], arr[arr.length - 1])) {
      return [arr].concat(nArr)
    } else {
      if (fp && coor) nArr = search(catchLine, extent, side, coor, to, !limit, nArr);
      arr = search(catchLine, extent, side, arr, to, limit, nArr);
      return arr
    }
  };

  const abs$1 = Math.abs;
  const max$1 = Math.max;
  const dist = function (a, b) {
    return abs$1(a - b)
  };
  const calcDir = function (p, ex) {
    var t = 0;
    var dir = max$1(dist(ex[0], ex[2]), dist(ex[1], ex[3]));
    for (var i = 0; i < 4; i++) {
      var iDir = dist(ex[i], p[i % 2]);
      if (iDir < dir) {
        dir = iDir;
        t = i;
      }
    }
    return 'lbrt'.charAt(t)
  };
  const samePoint$1 = function(a, b) {
    return a[0] == b[0] && a[1] == b[1]
  };
  /**
   * 
   * @param {等值线} lines 
   * @param {[min-lat-左, min-lng-下, max-lat-右, max-lng-上]} extent 
   */
  function calcBlock(lines, extent) {

    var close = [];
    var open = [];
    var catchLine = [];
    var side = {
      t: [],
      b: [],
      l: [],
      r: []
    };
    var features = lines.features;
    for (var i = 0, il = features.length; i < il; i++) {
      var f = features[i];
      var c = f.geometry.coordinates;
      for (var n = 0, nl = c.length; n < nl; n++) {
        var l = c[n];
        var first = l[0];
        var last = l[l.length - 1];
        // 闭环
        if (samePoint$1(first, last)) {
          close.push({
            coor: l,
            properties: f.properties
          });
        }
        // 开环
        else {
          catchLine.push({
            coor: l,
            properties: f.properties
          });
          var fd = calcDir(first, extent);
          var ld = calcDir(last, extent);
          side[fd].push({
            p: first,
            end: last,
            d: 0,
            t: ld,
            coor: catchLine.length - 1
          });
          side[ld].push({
            p: last,
            end: first,
            d: 1,
            t: fd,
            coor: catchLine.length - 1
          });
        }
      }
    }

    var searchExtent = {
      sa: [extent[0], extent[3]],
      sb: [extent[2], extent[3]],
      sc: [extent[2], extent[1]],
      sd: [extent[0], extent[1]]
    };

    open = search(catchLine, searchExtent, side, [searchExtent['sa']], 't', false);

    var openGeo = [];
    for (var i = 0, len = open.length; i < len; i++) {
      openGeo.push({
        coor: open[i],
        properties: {
          type: 'open'
        }
      });
    }

    console.log(close);
    console.log(openGeo);
    console.log(hitArea(close[0].coor[0], close[1].coor));

    // ztree 算法
    for (var i = 0, il = close.length; i < il; i++) {
      for (var j = 0, jl = openGeo.length; j < jl; j++) {
        var p = close[i].coor[0];
        var arr = openGeo[j].coor;
        if (hitArea(p, arr)) ;
      }
    }

    return {
      features: [],
      type: "FeatureCollection"
    }
  }

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
        var f = function(k) {
          return gradient
            ? parseInt(color[k] + (arr[i][k] - color[k]) * scale)
            : arr[i][k]
        };
        color.r = f('r');
        color.g = f('g');
        color.b = f('b');
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
    var color = config.isolineColor || '#333';
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.font = '12px 微软雅黑';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    var d = lines.features;
    var position = {};
    for (var i = 0, len = d.length; i < len; i++) {
      var c = d[i].geometry.coordinates;
      var _color = color == 'level' ? d[i].properties.color : color;
      ctx.strokeStyle = ctx.fillStyle = _color;
      for (var j = 0, jLen = c.length; j < jLen; j++) {
        ctx.beginPath();
        var ft = 0;
        for (var n = 0, cLen = c[j].length; n < cLen; n++) {
          var x = ((c[j][n][0] - ex[0][0]) / size[0]) * width;
          var y = ((c[j][n][1] - ex[0][1]) / size[1]) * height;
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
      var drawClip = function(d) {
        if (isArray(d[0]) && isArray(d[0][0])) {
          for (var i = 0, len = d.length; i < len; i++) {
            drawClip(d[i]);
          }
          return
        }
        if (isArray(d)) {
          for (var i = 0, len = d.length; i < len; i++) {
            var dx = ((d[i][x] - ex[0][0]) / size[0]) * width;
            var dy = ((d[i][y] - ex[0][1]) / size[1]) * height;
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
  const max$2 = Math.max;
  const abs$2 = Math.abs;
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
        [getIsoline(this.option, this.isoline, config)],
        this.option,
        config
      ).toDataURL(picture)
    };
    this.getIsoImage = function(config) {
      if (!this.alow()) return false
      return mix(
        [
          getIsosurface(this.option, this.pointGrid, config),
          getIsoline(this.option, this.isoline, config)
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
      level = this.fmtLevel(level);
      var extent = [
        min$1(ex[0][0], ex[1][0]),
        min$1(ex[0][1], ex[1][1]),
        max$2(ex[0][0], ex[1][0]),
        max$2(ex[0][1], ex[1][1])
      ];
      var size = [ex[1][0] - ex[0][0], ex[1][1] - ex[0][1]];
      var cellWidth = opt.cellWidth || round((abs$2(size[0]) / 200) * flot) / flot;
      var key = Object.assign({}, defaultKeyConfig, opt.keyConfig);
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
            var krigingVal = kriging.predict(
              pointGrid.features[i].geometry.coordinates[0],
              pointGrid.features[i].geometry.coordinates[1],
              variogram
            );
            pointGrid.features[i].properties.val = krigingVal;
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
      var d = lines.features;
      for (var i = 0, len = d.length; i < len; i++) {
        var val = d[i].properties.val;
        for (var q = 0; level[q]; q++) {
          if (level[q].value == val) {
            d[i].properties.color = level[q].color;
            break
          }
        }
      }
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
      this.isoline = lines;
      this.isosurface = calcBlock(lines, opt.extent);
    },
    fmtLevel: function(level) {
      for (var i = 0, len = level.length; i < len; i++) {
        var color = level[i].color;
        level[i].r = parseInt(color.substr(1, 2), 16);
        level[i].g = parseInt(color.substr(3, 2), 16);
        level[i].b = parseInt(color.substr(5, 2), 16);
      }
      return level
    },
    alow: function() {
      return this.pointGrid && this.isoline
    }
  };

  return IsoImage;

}));
