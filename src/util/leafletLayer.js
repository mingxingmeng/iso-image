export default function(config) {
  if (!L.IsoImageCanvasLayer) {
    L.IsoImageCanvasLayer = L.Canvas.extend({
      //
    })
  }
  return new L.IsoImageCanvasLayer(config)
}
