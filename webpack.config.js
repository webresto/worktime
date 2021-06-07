
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'distWebpack'),
    filename: 'ng-worktime.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      }
    ],
  },
  plugins: [
    new CleanWebpackPlugin()
  ],
};