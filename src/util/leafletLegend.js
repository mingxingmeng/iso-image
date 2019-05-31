export default function(config) {
  if (!L.Control.IsoLegendCortrol) {
    L.Control.IsoLegendCortrol = L.Control.extend({
      options: {
        position: 'bottomleft',
        canvas: ''
      },
      initialize: function(options) {
        L.Util.extend(this.options, options)
      },
      onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-iso-legend')
        this._container.appendChild(this.options.canvas)
        return this._container
      }
    })
  }
  return new L.Control.IsoLegendCortrol(config)
}
