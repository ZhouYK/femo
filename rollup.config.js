import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import rollupTypescript  from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: {
    index: './src/index.ts',
  },
  external: [
    'react',
  ],
  output: {
    dir: './dist/umd',
    format: 'umd',
    name: 'femo',
    globals: {
      react: 'React',
    }
  },
  plugins: [
    rollupTypescript({
      tsconfig: './tsconfig.json',
    }),
    commonjs(),
    resolve(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    } ),
    // terser(),
  ]
}
