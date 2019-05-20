const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    index: "./src/index.ts"
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'umd/[name].js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [{
      test: /\.(js|ts)x?$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        options: {
          cacheDirectory: false,
        },
      }, {
        loader: 'ts-loader',
      }]
    }],
  },
  resolve: {
    alias: {},
    mainFiles: ['index'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts'],
  },
}
