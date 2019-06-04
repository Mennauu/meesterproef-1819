// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const querystring = require('querystring')
const request = require('request')
const spotifyAuthMiddleware = require('./middleware/passport')
const passport = require('passport')
const app = express()
const port = process.env.PORT || 3000

require('dotenv').config()

const redirect_uri = process.env.REDIRECT_URI

// Disable x-powered-by header
app.disable('x-powered-by')

// Brotli file compression
// app.use(shrinkRay())

// serve static files
app.use(express.static(__dirname + '/public', {
  maxAge: "365d",
  lastModified: "",
  etag: ""
}))

// Handlebars
app.set('view engine', 'hbs')
app.engine('hbs', hbs({
  extname: 'hbs',
  defaultView: 'default',
  layoutsDir: __dirname + '/views/layouts/'
}))

// Homepage
app.get('/', async (req, res) => {
  await res.render('home', {
    layout: 'default',
    template: 'template__home',
    user: req.user
  })
})

app.get('/spotify/login', passport.authenticate('spotify', {
  scope: ['user-read-email', 'user-read-private']
}), (req, res) => {
  // res.redirect('https://accounts.spotify.com/authorize?' +
  //   querystring.stringify({
  //     response_type: 'code',
  //     client_id: client_id,
  //     scope: 'user-read-private user-read-email',
  //     redirect_uri: redirect_uri + 'spotify/callback'
  //   }))
})

app.get('/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/login' }), (req, res) => {
  // const code = req.query.code || null

  // const authOptions = {
  //   url: 'https://accounts.spotify.com/api/token',
  //   form: {
  //     code: code,
  //     redirect_uri: redirect_uri + 'spotify/callback',
  //     grant_type: 'authorization_code'
  //   },
  //   headers: {
  //     'Authorization': 'Basic ' + (new Buffer.from(
  //       client_id + ':' + client_secret
  //     ).toString('base64'))
  //   },
  //   json: true
  // }

  res.redirect('/')

  // request.post(authOptions, (error, response, body) => {
  //   if (!error && response.statusCode === 200) {
  //     let access_token = body.access_token

  //     // req.session.acces_token = access_token
  //     res.redirect(redirect_uri)
  //   }
  // })
})

app.get('*', (req, res) => {
  res.redirect(redirect_uri)
})

// Search
app.get('/search', async (req, res) => {
  try {
    await res.render('search', {
      layout: 'default',
      template: 'template__search',
    })
  } catch (err) {
    throw err
  }
})

//  Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login')
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))