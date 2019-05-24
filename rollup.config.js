import { terser } from 'rollup-plugin-terser'

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/iso-image-dev.js',
      format: 'umd',
      name: 'IsoImage'
    },
    plugins: []
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/iso-image.js',
      format: 'umd',
      name: 'IsoImage'
    },
    plugins: [terser()]
  }
]
