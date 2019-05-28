const newSpace = function(d) {
  return JSON.parse(JSON.stringify(d))
}
const samePoint = function(a, b) {
  return a[0] == b[0] && a[1] == b[1]
}
var search = function(catchLine, extent, side, arr, d, limit, nArr) {
  nArr = nArr || []
  var tp = arr[arr.length - 1]
  var fp
  var fd
  var to
  var coor
  var k = d == 't' || d == 'b' ? 0 : 1
  var q = d == 't' || d == 'l' ? 1 : -1
  var lim = limit ? -1 : 1
  for (var i = 0; side[d][i]; i++) {
    var _tpi = side[d][i]
    var dd = (_tpi.p[k] - tp[k]) * q * lim
    if (dd > 0) {
      if (!fp || fp && fd > dd) {
        fp = _tpi
        fd = dd
      }
    }
  }
  if (!fp) {
    if (limit) {
      switch (d)
      {
        case 't': arr.push(extent['sa']); to = 'l'; break
        case 'r': arr.push(extent['sb']); to = 't'; break
        case 'b': arr.push(extent['sc']); to = 'r'; break
        case 'l': arr.push(extent['sd']); to = 'b'; break
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
      arr.push(fp.p)
    } else {
      coor = newSpace(catchLine[fp.coor].coor)
      if (fp.d) coor.reverse()
      arr = arr.concat(coor)
    }
    to = fp.t
  }
  if (arr.length > 1 && samePoint(arr[0], arr[arr.length - 1])) {
    return [arr].concat(nArr)
  } else {
    if (fp && coor) nArr = search(catchLine, extent, side, coor, to, !limit, nArr)
    arr = search(catchLine, extent, side, arr, to, limit, nArr)
    return arr
  }
}

export default search
