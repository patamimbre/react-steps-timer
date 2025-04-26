// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // Bundle JavaScript: CJS + ESM
  {
    input: 'src/index.ts',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,  // declarations handled in separate step
      })
    ],
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true
      }
    ]
  },
  // Bundle type declarations
  {
    input: 'src/index.ts',
    plugins: [dts()],
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    }
  }
];