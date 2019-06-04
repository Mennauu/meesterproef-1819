const shrinkRay = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const querystring = require('querystring')
const request = require('request')
const app = express()
const port = process.env.PORT || 3000

require('dotenv').config()

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const redirect_uri = process.env.REDIRECT_URI

// Disable x-powered-by header
app.disable('x-powered-by')

// Brotli file compression
app.use(shrinkRay())

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
  try {
    await res.render('home', {
      layout: 'default',
      template: 'template__home',
    })

  } catch (err) {
    throw err
  }
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

// ***** SPOTIFY AUTHENTICATION  ***** //

app.get('/spotify/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: 'user-read-private user-read-email',
      redirect_uri
    }))
})

app.get('/spotify/callback', (req, res) => {
  const code = req.query.code || null

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(
        client_id + ':' + client_secret
      ).toString('base64'))
    },
    json: true
  }

  request.post(authOptions, (error, response, body) => {
    const access_token = body.access_token
    const uri = redirect_uri

    req.session.acces_token = access_token
    res.redirect(uri)
  })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))