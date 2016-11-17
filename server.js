const join = require('path').join
const express = require('express')
const app = express()
const compileSass = require('express-compile-sass')
const serveStatic = require('serve-static')
const browserify = require('browserify-middleware')
const livereload = require('livereload')

const port = process.env.PORT || 1844
const ip = process.env.IP || '127.0.0.1'

app.set('view engine', 'pug')

app.get('/app.js', browserify(join(__dirname, 'app/index.js'), {
  debug: true
}))

app.use(compileSass({
  root: join(__dirname, 'styles'),
  sourceMap: true,
  sourceComments: true,
  watchFiles: true,
  logToConsole: true
}))

app.use(serveStatic(join(__dirname, 'static')))
app.use(refreshData)
app.get('/', function (req, res, next) {
  Promise
    .resolve(require('./data'))
    .then(res.render.bind(res, 'layout'))
    .catch(next)
})

app.use(javaScriptErrorHandler)
app.use(errorHandler)

app.listen(port, ip, function () {
  console.log('Listening on ' + port)
})

const reloader = livereload.createServer({
  exts: [
    'html', 'pug',
    'css', 'scss',
    'js', 'jsx',
    'png', 'gif', 'jpg', 'svg'
  ]
}, function () {
  console.log('Live reload server is listening.')
})

reloader.watch(__dirname)

function refreshData (req, res, next) {
  delete require.cache[require.resolve('./data')]
  next()
}

const jsError = /.js$/
function javaScriptErrorHandler (err, req, res, next) {
  if (jsError.test(req.path)) {
    return res.send(`
var error = document.createElement('pre');
error.textContent = \`${err.stack}\`;
document.body.innerHTML = '';
document.body.appendChild(error);
    `)
  }
  next()
}

function errorHandler (err, req, res, next) {
  res.render('error', {
    error: err
  })
}
