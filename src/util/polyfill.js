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
