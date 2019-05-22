import {terser} from "rollup-plugin-terser"

export default [{
  input: 'src/index.js',
  output: {
    file: 'dist/iso-image.js',
    format: 'umd',
    name: 'iso-image'
  },
  plugins: [terser()]
}];
