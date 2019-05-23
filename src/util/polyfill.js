if (!Object.assign) {
  Object.assign = function(target) {
    var source = []
    for (var _i = 1; _i < arguments.length; _i++) {
      source[_i - 1] = arguments[_i]
    }
    var from,
      to = Object(target),
      hasOwnProperty = Object.prototype.hasOwnProperty
    for (var i = 0, l = source.length; i < l; i++) {
      from = Object(source[i])
      for (var key in from) {
        if (hasOwnProperty.call(from, key)) {
          to[key] = from[key]
        }
      }
    }
    return to
  }
}

var max = Math.max
var min = Math.min
var abs = Math.abs
var floor = Math.floor
function ToObject(v) {
  if (v === null || v === undefined) throw TypeError()
  return Object(v)
}
function ToLength(v) {
  var len = ToInteger(v)
  if (len <= 0) return 0
  if (len === Infinity) return 0x20000000000000 - 1 // 2^53-1
  return min(len, 0x20000000000000 - 1) // 2^53-1
}
function ToInteger(n) {
  n = Number(n)
  if (isNaN(n)) return 0
  if (n === 0 || n === Infinity || n === -Infinity) return n
  return (n < 0 ? -1 : 1) * floor(abs(n))
}

Array.prototype.max = function() {
  return Math.max.apply(null, this)
}
Array.prototype.min = function() {
  return Math.min.apply(null, this)
}
Array.prototype.mean = function() {
  var i, sum
  for (i = 0, sum = 0; i < this.length; i++) sum += this[i]
  return sum / this.length
}
Array.prototype.fill = function fill(value) {
  var start = arguments[1],
    end = arguments[2]

  var o = ToObject(this)
  var lenVal = o.length
  var len = ToLength(lenVal)
  len = max(len, 0)
  var relativeStart = ToInteger(start)
  var k
  if (relativeStart < 0) k = max(len + relativeStart, 0)
  else k = min(relativeStart, len)
  var relativeEnd
  if (end === undefined) relativeEnd = len
  else relativeEnd = ToInteger(end)
  var final
  if (relativeEnd < 0) final = max(len + relativeEnd, 0)
  else final = min(relativeEnd, len)
  while (k < final) {
    var pk = String(k)
    o[pk] = value
    k += 1
  }
  return o
}
Array.prototype.rep = function(n) {
  return Array.apply(null, new Array(n)).map(Number.prototype.valueOf, this[0])
}
Array.prototype.pip = function(x, y) {
  var i,
    j,
    c = false
  for (i = 0, j = this.length - 1; i < this.length; j = i++) {
    if (
      this[i][1] > y != this[j][1] > y &&
      x <
        ((this[j][0] - this[i][0]) * (y - this[i][1])) /
          (this[j][1] - this[i][1]) +
          this[i][0]
    ) {
      c = !c
    }
  }
  return c
}
