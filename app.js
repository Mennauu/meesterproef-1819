// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')
const SpotifyWebApi = require('spotify-web-api-node')
const fetch = require("node-fetch")
const userModel = require('./server/models/user.js')
const session = require('express-session')
const Twitter = require('twitter')
// const FB = require('fb')

const app = express()
const port = process.env.PORT || 3000

require('./server/database.js')
require('dotenv').config()

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  redirectUri: process.env.REDIRECT_URI,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
})

const twitterApi = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  bearer_token: process.env.TWITTER_BEARER_TOKEN
})

// FB.setAccessToken(process.env.FACEBOOK_BEARER_TOKEN)
// FB.extend({ appId: process.env.FACEBOOK_CLIENT_ID, appSecret: process.env.FACEBOOK_CLIENT_SECRET })

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
app.get('/login', (req, res) => {
  res.render('login', {
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


  spotifyApi.authorizationCodeGrant(code)
    .then(data => {
      // THIS SETS A GLOBAL ACCESS TOKEN, WE NEED ONE PER USER (session)
      spotifyApi.setAccessToken(data.body['access_token'])
      spotifyApi.setRefreshToken(data.body['refresh_token'])

      spotifyApi.getMe()
        .then(data => {
          const currentUser = data.body.id

          const newUser = new userModel({
            user: currentUser
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
  const artistID = Object.values(req.body).toString()

  spotifyApi.getMe()
    .then(data => {
      const currentUser = data.body.id

      userModel.findOne({ user: currentUser }, (err, user) => {
        if (user.user === currentUser) {

          userModel.findOne({ following: { "$in": [artistID] } }, (err, result) => {
            if (result === null) {
              userModel.updateOne({
                $push: { following: artistID }
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
        console.log(user.following)
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
app.get('/search', (req, res) => {
  res.render('search', {
    layout: 'default',
    template: 'template__search'
  })
})

/* Search for artist */
app.post('/search', async (req, res) => {
  try {
    const artists = []
    const searchInput = Object.values(req.body).toString()
    const data = await spotifyApi.searchArtists(searchInput)

    for (let artist of data.body.artists.items) {
      artists.push({
        id: artist.id,
        name: artist.name,
        image: artist.images[2]
      })
    }

    res.send(artists)
  } catch (error) {
    console.error(error)
  }

  // spotifyApi.searchArtists(search)
  //   .then((data) => {
  //     const artists = []

  //     for (let artist of data.body.artists.items) {
  //       artists.push({
  //         id: artist.id,
  //         name: artist.name,
  //         image: artist.images[2]
  //       })
  //     }

  //     res.send(artists)
  //   }, (err) => {
  //     console.error(err)
  //   })
})

// Search page
app.get('/artist/:id', (req, res) => {
  spotifyApi.getArtist(req.params.id)
    .then(artist => {
      spotifyApi.getArtistRelatedArtists(req.params.id)
        .then(related => {
          spotifyApi.getArtistTopTracks(req.params.id, 'NL')
            .then(async (list) => {
              try {
                const tracks = []
                let number = 0

                for (let track of list.body.tracks) {
                  number++

                  tracks.push({
                    track: track.name,
                    number: number
                  })
                }

                // Replace bad characters. For example: é = e
                const normalizedArtistName = artist.body.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")

                /* MusicBrainz API */
                const musicbrainzArtist = await (await fetch(`http://musicbrainz.org/ws/2/artist/?query=artist:${normalizedArtistName}&fmt=json`)).json()
                const musicbrainzArtistId = musicbrainzArtist.artists[0].id
                const musicbrainzArtistLinks = await (await fetch(`http://musicbrainz.org/ws/2/artist/${musicbrainzArtistId}?inc=url-rels&fmt=json`)).json()

                const socialLinks = []
                for (let link of musicbrainzArtistLinks.relations) {
                  const url = new URL(link.url.resource)
                  const domain = url.hostname.split(".").slice(-2).join(".")
                  const platform = domain.split('.')[0]
                  const username = url.pathname.substr(1).split('.')[0].replace(/\/$/, '').replace(/^.*\/(.*)$/, "$1")

                  socialLinks.push({
                    [platform]: link.url.resource,
                    username
                  })
                }

                /* Wikipedia API */
                const wikipedia = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${normalizedArtistName}`)).json()

                /* Instagram API */
                const instagramMeta = socialLinks.find(object => object['instagram'])
                const instagramData = await (await fetch(`${instagramMeta.instagram}?__a=1`)).json()
                const latestInstagramPostShortcode = instagramData.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode
                const instagram = {
                  instagram_url: instagramMeta.instagram,
                  username: instagramMeta.username,
                  shortcode: latestInstagramPostShortcode
                }

                /* Twitter API */
                const twitterMeta = socialLinks.find(object => object['twitter'])
                const twitterData = await twitterApi.get('/statuses/user_timeline.json', { screen_name: twitterMeta.username, count: 1 })
                const latestTwitterPostShortcode = twitterData[0].id_str
                const latestTwitterPostShortcodeDate = twitterData[0].created_at
                const twitter = {
                  twitter_url: twitterMeta.twitter,
                  username: twitterMeta.username,
                  shortcode: latestTwitterPostShortcode,
                  creation_date: latestTwitterPostShortcodeDate
                }

                /* Facebook API */
                // const facebookMeta = socialLinks.find(object => object['facebook'])
                // const facebookData = await FB.api(`/${facebookMeta.username}/feed`)

                /* facebookData results in this error message: 

                      "(#10) To use 'Page Public Content Access', your use of this endpoint 
                      must be reviewed and approved by Facebook. To submit this 'Page Public Content 
                      Access' feature for review please read our documentation on reviewable 
                      features: https://developers.facebook.com/docs/apps/review." */

                /* YouTube API */
                const youtubeMeta = socialLinks.find(object => object['youtube'])
                // Retrieve the playlist ID for the channel's uploaded videos
                const youtubeData = await (await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=${youtubeMeta.username}&key=${process.env.YOUTUBE_API_KEY}`)).json()
                const youtubePlaylistID = youtubeData.items[0].contentDetails.relatedPlaylists.uploads
                // Retrieve the list of uploaded videos
                const youtubeUserVideos = await (await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&playlistId=${youtubePlaylistID}&key=${process.env.YOUTUBE_API_KEY}`)).json()
                const youtubeLatestUploadShortcode = youtubeUserVideos.items[0].contentDetails.videoId
                const youtubeLatestUploadDate = youtubeUserVideos.items[0].contentDetails.videoPublishedAt
                const youtube = {
                  youtube_url: twitterMeta.youtube,
                  username: twitterMeta.username,
                  shortcode: youtubeLatestUploadShortcode,
                  creation_date: youtubeLatestUploadDate
                }


                res.render('artist', {
                  layout: 'default',
                  template: 'template__artist',
                  artist: artist.body,
                  songs: tracks.slice(0, 5),
                  related: related.body.artists,
                  spotifyURL: list.body.tracks[0].external_urls.spotify,
                  wikipedia,
                  instagram,
                  twitter,
                  youtube
                })
              } catch (error) {
                console.error(error);
              }

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