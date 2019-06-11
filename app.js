// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const querystring = require('querystring')
const request = require('request')
const bodyParser = require('body-parser')
const SpotifyWebApi = require('spotify-web-api-node')
const fetch = require("node-fetch")
const app = express()
const port = process.env.PORT || 3000

require('dotenv').config()

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
})

// Retrieve access token
spotifyApi.clientCredentialsGrant().then(
  (data) => { spotifyApi.setAccessToken(data.body['access_token']) },
  (err) => { console.log('Something went wrong when retrieving an access token', err) }
)

// Disable x-powered-by header
app.disable('x-powered-by')

// support parsing of application/json type post data
app.use(bodyParser.json())
// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }))

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
  layoutsDir: __dirname + '/views/layouts/',
  helpers: {
    section: function (name, options) {
      if (!this._sections) this._sections = {}
      this._sections[name] = options.fn(this)
      return null
    }
  }
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
      redirect_uri: process.env.REDIRECT_URI + 'spotify/callback'
    }))
})

app.get('/spotify/callback', (req, res) => {
  const code = req.query.code || null

  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: process.env.REDIRECT_URI + 'spotify/callback',
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
      access_token = body.access_token
      // req.session.acces_token = access_token
      res.redirect(process.env.REDIRECT_URI + 'home')
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
      template: 'template__search'
    })
  } catch (err) {
    throw err
  }
})

/* Search for artist */
app.post('/search', (req, res) => {
  const search = Object.values(req.body).toString()

  spotifyApi.searchArtists(search)
    .then((data) => {
      const artists = []

      for (let artist of data.body.artists.items) {
        artists.push({
          id: artist.id,
          name: artist.name,
          image: artist.images[2]
        })
      }

      res.send(artists)
    }, (err) => {
      console.error(err)
    })
})

// Search page
app.get('/artist/:id', (req, res) => {
  spotifyApi.getArtist(req.params.id)
    .then(artist => {
      spotifyApi.getArtistRelatedArtists(req.params.id)
        .then(related => {
          spotifyApi.getArtistTopTracks(req.params.id, 'NL')
            .then(async (list) => {
              const tracks = []
              let number = 0

              for (let track of list.body.tracks) {
                number++
                tracks.push(`${number}. ${track.name}`)
              }

              const wikidata = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${artist.body.name}`)).json()

              await res.render('artist', {
                layout: 'default',
                template: 'template__artist',
                artist: artist.body,
                songs: tracks.slice(0, 5),
                wiki: wikidata,
                related: related.body.artists
              })

            }, (err) => {
              console.log('Something went wrong with getArtistsTopTracks!', err);
            })
        }, (err) => {
          console.log('Something went wrong with getArtistRelatedArtists', err);
        })
    }, (err) => {
      console.error('Something went wrong with getArtist!', err)
    })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))