import { terser } from 'rollup-plugin-terser'
import resolve from 'rollup-plugin-node-resolve'

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/iso-image-dev.js',
      format: 'umd',
      name: 'IsoImage'
    },
    plugins: [
      resolve({
        jsnext: true,
        browser: true
      })
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/iso-image.js',
      format: 'umd',
      name: 'IsoImage'
    },
    plugins: [
      resolve({
        jsnext: true,
        browser: true
      }),
      terser()
    ]
  }
]
