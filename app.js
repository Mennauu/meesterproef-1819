// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')
const SpotifyWebApi = require('spotify-web-api-node')
const fetch = require("node-fetch")
const userModel = require('./server/models/user.js')
const session = require('express-session')
const app = express()
const port = process.env.PORT || 3000

require('./server/database.js')
require('dotenv').config()

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  redirectUri: process.env.REDIRECT_URI,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
})

// const refreshToken = () => {
//   spotifyApi.refreshAccessToken()
//     .then(data => {
//       console.log('The access token has been refreshed!')
//       // Save the access token so that it's used in future calls
//       spotifyApi.setAccessToken(data.body['access_token'])
//     }, err => {
//       console.log('Could not refresh access token', err)
//     })
// }

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
app.get('/', (req, res) => {
  res.redirect('/login')
})

// Login page
app.get('/login', async (req, res) => {
  await res.render('login', {
    layout: 'authentication',
    template: 'template__login'
  })
})

// Spotify Login
app.get('/spotify/login', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email']
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes)

  res.redirect(authorizeURL)
})

app.get('/spotify/callback', (req, res) => {
  const code = req.query.code

  // Retrieve an access token.
  // spotifyApi.clientCredentialsGrant()
  //   .then(data => {
  //     spotifyApi.setAccessToken(data.body['access_token'])
  //   }, err => {
  //     console.log('Something went wrong when retrieving an access token', err)
  //   })

  spotifyApi.authorizationCodeGrant(code)
    .then(data => {
      // console.log('The token expires in ' + data.body['expires_in'])
      // console.log('The access token is ' + data.body['access_token'])
      // console.log('The refresh token is ' + data.body['refresh_token'])

      // THIS SETS A GLOBAL ACCESS TOKEN, WE NEED ONE PER USER
      spotifyApi.setAccessToken(data.body['access_token'])
      // spotifyApi.setRefreshToken(data.body['refresh_token'])


      spotifyApi.getMe()
        .then(data => {
          const currentUser = data.body.id

          const newUser = new userModel({
            user: currentUser,
            accessToken: data.body['access_token']
          })

          userModel.findOne({ user: currentUser }, (err, user) => {
            if (user !== null && user.user === currentUser) {
              console.log('User already exists')
              res.redirect(process.env.LOCAL_URI + 'home')
            } else {
              newUser.save()
                .then(doc => {
                  console.log('User has been saved')
                  res.redirect(process.env.LOCAL_URI + 'home')
                }).catch(err => {
                  console.log('There was an error trying to save the user')
                  console.error(err)
                })
            }
          })
        }, (err) => {
          console.log('Something went wrong with getMe!', err)
        })
    },
      (err) => { console.log('Something went wrong with authorizationCodeGrant!', err) }
    )
})

app.post('/add-artist', (req, res) => {
  const artist = Object.values(req.body).toString()

  spotifyApi.getMe()
    .then(data => {
      const currentUser = data.body.id

      userModel.findOne({ user: currentUser }, (err, user) => {
        if (user.user === currentUser) {

          userModel.findOne({ following: { "$in": [artist] } }, (err, result) => {
            if (result === null) {
              userModel.updateOne({
                $push: { following: artist }
              }).then(doc => {
                console.log('RESULT IS TOEGEVOEGD')
                console.log(doc)
              }).catch(err => {
                console.error(err)
              })
            } else {
              console.log('NIET TOEGEVOEGD, STAAT AL IN DE LIJST')
            }
          })
        }
      })
    }, (err) => {
      console.log('Something went wrong with getMe!', err)
    })
})

// Homepage
app.get('/home', (req, res) => {
  spotifyApi.getMe()
    .then(data => {
      const currentUser = data.body.id

      userModel.findOne({ user: currentUser }, (err, user) => {
        console.log(user)
        if (user.user === currentUser && user.following.length > 0) {

          spotifyApi.getArtists(user.following)
            .then(function (data) {
              let artistData = []

              for (let artist of data.body.artists) {
                artistData.push({
                  id: artist.id,
                  image: artist.images[1].url,
                  name: artist.name
                })
              }

              res.render('home', {
                layout: 'default',
                template: 'template__home',
                following: artistData
              })
            }, function (err) {
              console.error("Het ophalen van meerdere artiesten is mislukt: " + err)
            })

        } else {
          res.render('home', {
            layout: 'default',
            template: 'template__home'
          })
        }
      })
    }, function (err) {
      console.error("Je moet je opnieuw aanmelden via login link: " + err)
    })
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

                tracks.push({
                  track: track.name,
                  number: number
                })
              }

              const wikidata = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${artist.body.name}`)).json()

              await res.render('artist', {
                layout: 'default',
                template: 'template__artist',
                artist: artist.body,
                songs: tracks.slice(0, 5),
                wiki: wikidata,
                related: related.body.artists,
                spotifyURL: list.body.tracks[0].external_urls.spotify
              })

            }, (err) => {
              console.log('Something went wrong with getArtistsTopTracks!', err)
            })
        }, (err) => {
          console.log('Something went wrong with getArtistRelatedArtists', err)
        })
    }, (err) => {
      console.error('Something went wrong with getArtist!', err)
    })
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))