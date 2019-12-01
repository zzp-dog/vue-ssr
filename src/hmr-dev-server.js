/**
 * 热更新
 * 所有的静态资源请求都是访问内存
 */
const fs = require('fs');
const path = require('path');
const MemoryFS = require('memory-fs');
const webpack = require('webpack');
const webpackConfig = require('@vue/cli-service/webpack.config');
const compiler = webpack(webpackConfig);
// 编译到内存中 指向 MemoryFS的实例
const mfs = new MemoryFS();
compiler.outputFileSystem = mfs;

let bundle;
// 修改文件的回调
compiler.watch({}, (err, stats) => {
    if (err) {
        throw err;
    }
    stats = stats.toJson();
    stats.errors.forEach(error => console.error(error));
    stats.warnings.forEach(warn => console.warn(warn));
    const bundlePath = path.resolve(webpackConfig.output.path,
        'vue-ssr-server-bundle.json');
    // 从内存中读取服务端渲染配置文件
    bundle = JSON.parse(mfs.readFileSync(bundlePath, 'utf-8'));
    console.log('hot replace'.bold);
});




