const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: 'eval-source-map',
  mode: 'development',
  entry: ["./example/index.tsx"],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: '[name].js',
  },
  module: {
    rules: [{
      test: /\.(ts|js)x?$/,
      exclude: /node_modules/,
      use: [{
        loader:'babel-loader',
        options: {
          cacheDirectory: false,
        },
      }, {
        loader: 'ts-loader',
      }]
    }],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  devServer: {
    host: '0.0.0.0',
    port: 9999,
    disableHostCheck: true,
    contentBase: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'example/index.html'),
      inject: true,
    })
  ],
}
