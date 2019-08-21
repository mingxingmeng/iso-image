export const IsoLayer = function(config) {
  if (!L.IsoImageCanvasLayer) {
    L.IsoImageCanvasLayer = L.Canvas.extend({
      _initContainer: function () {
        var container = this._container = document.createElement('canvas');
        this._container.style.opacity = 0
        L.DomEvent.on(container, 'mousemove', L.Util.throttle(this._onMouseMove, 32, this), this);
        L.DomEvent.on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this);
        L.DomEvent.on(container, 'mouseout', this._handleMouseOut, this);

        this._ctx = container.getContext('2d');
      },
      _draw: function () {
        var layer, bounds = this._redrawBounds;
        var _ctx = this._ctx
        _ctx.save();
        if (bounds) {
          var size = bounds.getSize();
          _ctx.beginPath();
          _ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
          _ctx.clip();
        }
    
        this._drawing = true;
    
        for (var order = this._drawFirst; order; order = order.next) {
          layer = order.layer;
          if (!bounds || (layer._pxBounds && layer._pxBounds.intersects(bounds))) {
            layer._updatePath();
          }
        }
    
        this._drawing = false;
    
        _ctx.restore();
        
        this.options.clipLayer && this.options.clipLayer._clip(_ctx)
      }
    })
  }
  return new L.IsoImageCanvasLayer(config)
}

export const ClipLayer = function(config) {
  if (!L.ClipCanvasLayer) {
    L.ClipCanvasLayer = L.Canvas.extend({
      _initContainer: function () {
        var container = this._container = document.createElement('canvas');
    
        L.DomEvent.on(container, 'mousemove', L.Util.throttle(this._onMouseMove, 32, this), this);
        L.DomEvent.on(container, 'click dblclick mousedown mouseup contextmenu', this._onClick, this);
        L.DomEvent.on(container, 'mouseout', this._handleMouseOut, this);
    
        this._ctx = container.getContext('2d');
      },
      _clip: function (ctx) {
        var _ctx = this._ctx
        _ctx.fillStyle = _ctx.createPattern(ctx.canvas, 'no-repeat')

        // var size = this._bounds.getSize()

        // console.log(this._bounds.min.x, this._bounds.min.y, size.x, size.y)
        // _ctx.fillRect(this._bounds.min.x, this._bounds.min.y, size.x, size.y)

        _ctx.beginPath()
        for (var order = this._drawFirst; order; order = order.next) {
          var layer = order.layer;
          var parts = layer._parts
          for (var i = 0, len = parts.length; i < len; i++) {
            for (var j = 0, jLen = parts[i].length; j < jLen; j++) {
              _ctx[j ? 'lineTo' : 'moveTo'](parts[i][j].x, parts[i][j].y)
            }
          }
        }
        
        _ctx.save()
        _ctx.translate(this._bounds.min.x, this._bounds.min.y)
        _ctx.fill()
        _ctx.restore()
      }
    })
  }
  return new L.ClipCanvasLayer(config)
}
