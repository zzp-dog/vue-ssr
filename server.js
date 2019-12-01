const fs = require('fs');
const path = require('path');
const express = require('express');
// const compression = require('compression')
const { createBundleRenderer } = require('vue-server-renderer');


const app = express();
const resolve = file => path.resolve(__dirname, file);
const serve = (filePath) => express.static(resolve(filePath));

const isProd = NODE_ENV === 'production';

let templatePath;
let clientManifest;
let serverBundle;
let renderer;
const createRenderer = (bundle, options) => {

  return createBundleRenderer(bundle, Object.assign(options, {
    runInNewContext: false, // https://ssr.vuejs.org/ja/api/#runinnewcontext
  }))
}

  templatePath = resolve('./dist/index.html');

  serverBundle = require('./dist/vue-ssr-server-bundle.json');
  clientManifest = require('./dist/vue-ssr-client-manifest.json');
  const template = fs.readFileSync(templatePath, 'utf-8');

  renderer = createRenderer(serverBundle, { template, clientManifest });

  app.use('/favicon.ico', serve('./dist/favicon.ico'));
  app.use('/img', serve('./dist/img'));
  app.use('/js', serve('./dist/js'));
  app.use('/css', serve('./dist/css'));
  app.get('/vue-ssr-*-manifest.json', (req, res) => {
    res.send(`./dist/${req.url}`);
  });

const render = (req, res) => {

  if(!isProd) {

  }
 
  const s = Date.now();

  res.setHeader("Content-Type", "text/html");

  const handleError = err => {
    if (err.url) {
      res.redirect(err.url)
    } else if (err.code === 404) {
      res.status(404).send('404 | Page Not Found')
    } else {
      // Render Error Page or Redirect
      res.status(500).send('500 | Internal Server Error')
      console.error(`error during render : ${req.url}`)
      console.error(err.stack)
    }
  }

  const context = { url: req.url }

  renderer.renderToString(context, (err, html) => {
    if (err) {
      return handleError(err);
    }
    // fs.writeFileSync(`./${context.url}.html`, html,() => {});
    res.end(html);

    console.log(`whole request: ${Date.now() - s}ms`);
  })
}

app.get('*', render).listen(8000, ()=> {
  console.log('🚀http:localhost:8000');
});

module.exports = app;