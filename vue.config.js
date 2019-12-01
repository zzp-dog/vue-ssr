/* eslint-disable no-param-reassign */
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const nodeExternals = require('webpack-node-externals');
const WebpackBar = require('webpackbar');

/** 是否生产模式 */
const isProd = process.env.NODE_ENV === 'prod';
/** 是否服务端打包 */
const target = process.env.WEBPACK_TARGET === 'server'? 'server' : 'client';

const options = {
  devServer: {
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    inline: false, 
  }, 
  publicPath: !isProd ? 'http://127.0.0.1:4200' : 'http://127.0.0.1:8000'
};

const chainWebpack = (config) => {
  // 清除入口确保只有一个入口，因为使用typscript默认会有一个入口mian.ts
  config.entry('app').clear()
  .add(`./src/entry-${target}.js`).end();
  config.plugins.delete('hmr');
  config.plugins.delete('progress');
  if (!isProd) config.plugins.delete('no-emit-on-errors');

  // webpack-html-plugin
  config.plugin('html').tap((args) => {
    /**
     * 服务端和客户端共用index.html模版
     * 服务端每次请求都会插入js文件，
     * 这里打包的时候，配置不将入口js文件插到index.html中，
     * 避免插入两次js文件并执行两遍js
     */
    args[0].inject = false;
    return args;
  });

  // 打包状态
  config.stats(isProd ? 'normal' : 'none');
  // config.devServer.stats('errors-only').quiet(true).noInfo(true);

  /**
   * 服务端性能优化，客户端不起作用，设为false
   * 渲染函数将会把返回的 vdom 树的一部分编译为字符串，以提升服务端渲染的性能
   */
  config.module.rule('vue').use('vue-loader').tap((options) => {
    options.optimizeSSR = false; // 设为true可能报错
    return options;
  });


  // 服务端打包配置
  if (target === 'server') {
    // 配置node_modules下需要打包的文件
    config.externals(nodeExternals({ whitelist: [] }));
    config.target('node');
    // 服务端只有一个出口文件，不能进行代码分割，否则报错
    config.optimization.splitChunks(false);
    config.output.libraryTarget('commonjs2');
    config.plugin('ssr-server').use(VueSSRServerPlugin);
    config.plugin('loader').use(WebpackBar, [{ name: 'Server', color: 'orange' }]);
    return;
  }
  // 客户端打包配置
  config.target('web');
  config.plugin('ssr-client').use(VueSSRClientPlugin);
  config.plugin('loader').use(WebpackBar, [{ name: 'Client', color: 'green' }]);
  config.devtool(!isProd ? '#cheap-module-source-map' : undefined);
};

module.exports = { 
  ...options, 
  chainWebpack 
};
