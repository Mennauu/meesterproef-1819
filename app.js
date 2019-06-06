// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const querystring = require('querystring')
const request = require('request')
const SpotifyWebApi = require('spotify-web-api-node')
const app = express()
const port = process.env.PORT || 3000

require('dotenv').config()

const redirect_uri = process.env.REDIRECT_URI

// Disable x-powered-by header
app.disable('x-powered-by')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

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

// Login redirect
app.get('/', async (req, res) => {
  res.redirect('/login')
})

// Homepage
app.get('/home', async (req, res) => {
  await res.render('home', {
    layout: 'default',
    template: 'template__home'
  })
})

app.get('/login', async (req, res) => {
  await res.render('login', {
    layout: 'authentication',
    template: 'template__login'
  })
})

app.get('/spotify/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email',
      redirect_uri: redirect_uri + 'spotify/callback'
    }))
})

app.get('/spotify/callback', (req, res) => {
  const code = req.query.code || null

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri + 'spotify/callback',
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      let access_token = body.access_token
      // req.session.acces_token = access_token
      res.redirect(redirect_uri + 'home')
    }
  })
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// Search page
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

/* Search for artist */
app.post('/search-artist', (req, res) => {
  console.log(req.body.artist);
  res.end()
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))