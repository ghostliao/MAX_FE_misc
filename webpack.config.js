var path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var dirVars = require('./webpack-config/base/dir.vars.config')
module.exports = {
  entry: {
    // record_compare: 'pagePubgDir/record_compare/index.js',
    // pubg_live: 'pagePubgDir/game_live/index.js',
    vendor: ['./src/vender/zepto.min.js'],
    pubg_match: 'pageMatchPubgDir/match_tml/index.js',
    // jquery: './src/vender/jquery.3.2.1.min.js'
  },
  devtool: '#inline-source-map',
  resolve: require('./webpack-config/resolve.config'),
  output: {
    filename: '[name].[hash:8].js',
    chunkFilename: '[name].[contenhash:8].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  devServer: {
    hot: true, // 告诉 dev-server 我们在使用 HMR
    host: '192.168.2.102',
    port: 4001,
    proxy: {
      '/tools/*': {
        target: 'http://heybox.test.maxjia.com:58888',
        changeOrigin: true
      },
      '/chat/*': {
        target: 'http://heybox.test.maxjia.com:58888',
        changeOrigin: true
      },
      '/game/*': {
        target: 'http://heybox.test.maxjia.com:58888',
        changeOrigin: true
      },
      '/activity/*': {
        target: 'http://heybox.test.maxjia.com:58888',
        changeOrigin: true
      }
    },
    contentBase: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              minimize: true // css压缩
            }
          },
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.art$/,
        loader: 'art-template-loader',
        options: {
          // art-template options (if necessary)
          // @see https://github.com/aui/art-template
          htmlResourceRoot: __dirname,
          root: path.resolve(__dirname)
        }
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            plugins: [require('babel-plugin-transform-object-rest-spread'), require('babel-plugin-transform-runtime')]
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist']), // 清理dist目录
    new webpack.HotModuleReplacementPlugin(), // 启用 HMR
    new ExtractTextPlugin('[name]/styles.[content:8].css'),
    new webpack.DefinePlugin({
      PRODUCTION: false
    }),
    new HtmlWebpackPlugin({
      filename: 'pubg_live.html',
      template: path.resolve(dirVars.pagePubgDir, './game_live/index.art'),
      xhtml: true,
      chunks: ['vendor', 'pubg_live'],
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    }),
    new HtmlWebpackPlugin({
      filename: 'pubg_match.html',
      template: path.resolve(dirVars.pageMatchPubgDir, './match_tml/index.art'),
      xhtml: true,
      chunks: ['vendor', 'pubg_match'],
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    })
  ]
}
