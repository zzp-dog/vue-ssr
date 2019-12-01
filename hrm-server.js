

(async function start() {
    /**
     * 开发服务
     */
    const fs = require('fs');
    const http = require('http');
    const path = require('path');
    
    const indexHtmlURL = 'http://localhost:4200/';
    const reqClientURL = 'http://localhost:4200/vue-ssr-client-manifest.json';

    /** 客户端 */

    let clientManifest;
    function requestClientManifest() {
        return new Promise((resolve, reject) => {
            http.request(reqClientURL, (res) => {
                let data = '';
                res.setEncoding('utf-8');
                res.on('error', (err) => {
                    reject(err);
                })
                res.on('data', (chunk) => {
                    data += chunk;
                } )
                res.on('end', () => {
                    resolve();
                    // fs.writeFileSync('./client.json',data)
                    clientManifest = JSON.parse(data);
                    console.log('vue-ssr-client-manifest.json update...')
                })
            }).end();
        });
    }

    /** index.html 模版 */
    let template;
    function requestIndexHTML() {
        return new Promise((resolve, reject) => {
            http.request(indexHtmlURL, (res) => {
                let data = '';
                res.setEncoding('utf-8');
                res.on('error', (err) => {
                    reject(err);
                })
                res.on('data', (chunk) => {
                    data += chunk;
                } )
                res.on('end', () => {
                    resolve();
                    fs.writeFileSync('./index.temp.html',data)
                    template = data;
                    console.log('get index.temp.html...');
                })
            }).end();
        });
    }
    // 服务端编译 => 确保服务端渲染和服务器在同一进程，防止找不到self

    let serverBundle;
    const Mfs = require('memory-fs');
    const webpack = require('webpack');
    const config = require('@vue/cli-service/webpack.config');
    const mfs = new Mfs();
    const compiler = webpack(config);
    compiler.outputFileSystem = mfs;

    function requestServerBundle() {
        return new Promise((resolve, reject) => {
            compiler.watch({}, (err, stats) => {
                resolve();
                if (err) {
                    reject(err);
                } else {
                    const bundlePath = path.join(
                    config.output.path,
                    'vue-ssr-server-bundle.json'
                    );
                    serverBundle = JSON.parse(mfs.readFileSync(bundlePath,'utf-8'))
                }
            });
        });
    }
    /** 文件是否被改动 */
    let isNoChange = true;
    function debounce(f, t, c) {
        return function() {
            clearTimeout(f.timer);
            const args = arguments;
            f.timer = setTimeout(() => {
                f.apply(c || this, args);
            }, t || 500);
        }
    }

    fs.watch('./src/', debounce((path, filename) => {
        console.log('path:' + path);
        console.log('filename:' + filename);
        isNoChange = false;
    }))

    const Koa = require('koa');
    const Router = require('koa-router');
    const { createBundleRenderer } = require("vue-server-renderer");

    const app = new Koa();
    const router = new Router();

    function renderToString(context,renderer) {
        return new Promise((resolve, reject) => {
            renderer.renderToString(context, (err, html) => {
                err ? reject(err) : resolve(html);
            });
        });
    }
    
    let renderer;
    await requestServerBundle();
    await requestClientManifest();
    await requestIndexHTML();
    renderer = createBundleRenderer(serverBundle, {
        runInNewContext: false,
        template,
        clientManifest
    });

    router.get('*', async (ctx, next) => {
        console.log('请求路径:' + ctx.path);

        if (!clientManifest || !serverBundle) {
            ctx.body = '编译打包错误...';
            return;
        }
        if (!isNoChange) { // 文件有改动
            await requestServerBundle();
            await requestClientManifest();
            renderer = createBundleRenderer(serverBundle, {
                runInNewContext: false,
                template,
                clientManifest
            });
        }

        const html = await renderToString(ctx, renderer);
        ctx.body = html;
    });
    
    app.use(router.routes());
    
    app.listen(8080, () => {
        console.log('🚀This server is running at http://localhost:' + 8080)
    })    
})(this);

