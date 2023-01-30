// npm install webpack --save-dev
// npm install clean-webpack-plugin  --save-dev
// npm install html-webpack-plugin  --save-dev

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    app: './src/index.js',
  },
  optimization: {
      minimize: true,
      minimizer: [
          new TerserPlugin(),
      ],
  },

  plugins: [
    // new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
    new CleanWebpackPlugin(),
    // new HtmlWebpackPlugin({
    //   title: 'Production',
    // }),
  ],
  module: {
    rules: [
      {
        // allow jsx files
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        // need this to package css
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      }
    ]
  },
  output: {
    filename: 'main.min.js',
    path: path.resolve(__dirname, "..", 'build', 'static', 'js'),
  }
};