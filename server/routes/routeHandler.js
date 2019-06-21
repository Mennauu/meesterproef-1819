import * as api from '../apis/all.js'

const SpotifyWebApi = require('spotify-web-api-node')
const userModel = require('../database/models/user.js')
const spotifyAuth = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  redirectUri: process.env.REDIRECT_URI,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
})

exports.root = (req, res) => {
  res.redirect('/login')
}

exports.login = (req, res) => {
  res.render('login', {
    layout: 'authentication',
    template: 'template__login'
  })
}

exports.spotifyLogin = (req, res) => {
  const scopes = ['user-read-private', 'user-read-email', 'user-read-currently-playing', 'user-read-playback-state']
  const authorizeURL = spotifyAuth.createAuthorizeURL(scopes)

  res.redirect(authorizeURL)
}

exports.spotifyCallback = async (req, res) => {
  try {
    const code = req.query.code
    const auth = await spotifyAuth.authorizationCodeGrant(code)
    const spotifyApi = new SpotifyWebApi({ accessToken: auth.body.access_token })

    // THIS SETS A GLOBAL ACCESS TOKEN, WE NEED ONE PER USER (session)
    // spotifyApi.setAccessToken(auth.body.access_token)
    // spotifyApi.setRefreshToken(auth.body.refresh_token)

    const user = await spotifyApi.getMe()
    const userID = user.body.id
    const newUser = new userModel({ user: userID })

    userModel.findOne({ user: userID }, async (err, user) => {
      if (user !== null && user.user === userID) {
        req.session.userId = userID
        req.session.accessToken = auth.body.access_token

        console.log(`User: ${userID} already in database`)
        res.redirect(`${process.env.LOCAL_URI}home`)
      } else {
        const add = await newUser.save()

        if (add) {
          req.session.userId = userID
          req.session.accessToken = auth.body.access_token

          console.log(`User: ${userID} has been saved`)
          res.redirect(`${process.env.LOCAL_URI}home`)
        } else {
          console.log('There was an error trying to save the user')
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
}


exports.home = async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({ accessToken: req.session.accessToken })
    const userID = req.session.userId
    const user = await userModel.findOne({ user: userID })
    const spotifyPlayState = await spotifyApi.getMyCurrentPlaybackState({})

    if (user.user === userID && user.following.length > 0) {
      const artists = await spotifyApi.getArtists(user.following)

      if (artists) {
        let artistData = []
        let thenewyorktimes = []
        let googlenews = []
        let instagram = []
        let ticketmaster = []
        let twitter = []
        let youtube = []

        for (let artist of artists.body.artists) {
          let socials = []
          const name = artist.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")

          artistData.push({
            id: artist.id,
            image: artist.images[1].url,
            name: artist.name
          })

          const musicbrainz = await api.muzicbrainz(name)
          for (let link of musicbrainz.relations) {
            const url = new URL(link.url.resource)
            const domain = url.hostname.split(".").slice(-2).join(".")
            const platform = domain.split('.')[0]
            const username = url.pathname.substr(1).split('.')[0].replace(/\/$/, '').replace(/^.*\/(.*)$/, "$1")

            socials.push({
              [platform]: link.url.resource,
              username
            })
          }

          setTimeout(async () => {
            const ig = await api.instagram(socials)
            instagram.push(ig)

            const twit = await api.twitter(socials)
            twitter.push(twit)

            const yt = await api.youtube(socials)
            youtube.push(yt)

            socials = []
          }, 1000)

          const tm = await api.ticketmaster(name, artist.images[1].url)
          ticketmaster.push(tm)

          const tnyt = await api.thenewyorktimes(name)
          thenewyorktimes.push(tnyt)

          const gn = await api.googlenews(name)
          if (gn[0] !== undefined) {
            googlenews.push(gn[0])
          }
        }

        res.render('home', {
          layout: 'default',
          template: 'template__home',
          playback: spotifyPlayState.body,
          following: artistData,
          instagram,
          twitter,
          thenewyorktimes,
          googlenews,
          ticketmaster,
          youtube
        })
      }
    } else {
      res.render('home', {
        layout: 'default',
        template: 'template__home',
        playback: spotifyPlayState.body
      })
    }
  } catch (error) {
    console.error(error)
  }
}

exports.search = async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({ accessToken: req.session.accessToken })
    const spotifyPlayState = await spotifyApi.getMyCurrentPlaybackState({})

    res.render('search', {
      layout: 'default',
      template: 'template__search',
      playback: spotifyPlayState.body
    })
  } catch (error) {
    console.error(error)
  }
}

exports.artist = async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({ accessToken: req.session.accessToken })
    const spotifyPlayState = await spotifyApi.getMyCurrentPlaybackState({})
    const userID = req.session.userId
    const artist = await spotifyApi.getArtist(req.params.id)
    const name = artist.body.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    const related = await spotifyApi.getArtistRelatedArtists(req.params.id)
    const user = await userModel.findOne({ user: userID })
    const topTracks = await spotifyApi.getArtistTopTracks(req.params.id, 'NL')
    let followingList = []
    let notFollowingList = []
    let topTracksList = []
    let trackNumber = 0
    let socials = []

    if (user.user === userID) {
      const result = await userModel.find({})
      const following = result[0].following
      const relatedArtists = related.body.artists
      const relatedFollowing = relatedArtists.filter(element => following.includes(element.id))
      const relatedNotFollowing = relatedArtists.filter(element => !following.includes(element.id))

      for (let artist of relatedFollowing) {
        artist.following = true
        followingList.push({
          id: artist.id,
          name: artist.name,
          image: artist.images[2].url
        })
      }

      for (let artist of relatedNotFollowing) {
        notFollowingList.push({
          id: artist.id,
          name: artist.name,
          image: artist.images[2].url
        })
      }
    }

    for (let track of topTracks.body.tracks) {
      trackNumber++

      topTracksList.push({
        track: track.name,
        number: trackNumber
      })
    }

    const musicbrainz = await api.muzicbrainz(name)

    for (let link of musicbrainz.relations) {
      const url = new URL(link.url.resource)
      const domain = url.hostname.split(".").slice(-2).join(".")
      const platform = domain.split('.')[0]
      const username = url.pathname.substr(1).split('.')[0].replace(/\/$/, '').replace(/^.*\/(.*)$/, "$1")

      socials.push({
        [platform]: link.url.resource,
        username
      })
    }

    const wikipedia = await api.wikipedia(name)
    const instagram = await api.instagram(socials)
    const twitter = await api.twitter(socials)
    const youtube = await api.youtube(socials)
    const thenewyorktimes = await api.thenewyorktimes(name)
    const ticketmaster = await api.ticketmaster(name, artist.body.images[0].url)
    const googlenews = await api.googlenews(name)

    res.render('artist', {
      layout: 'default',
      template: 'template__artist',
      playback: spotifyPlayState.body,
      artist: artist.body,
      songs: topTracksList.slice(0, 5),
      related: notFollowingList,
      relatedFollowing: followingList,
      spotifyURL: topTracks.body.tracks[0].external_urls.spotify,
      wikipedia,
      instagram,
      twitter,
      youtube,
      thenewyorktimes,
      ticketmaster,
      googlenews
    })
  } catch (error) {
    console.error(error)
  }
}

exports.logout = (req, res) => {
  req.logout()
  res.redirect('/')
}

exports.addArtist = async (req, res) => {
  try {
    const artistID = Object.values(req.body).toString()
    const userID = req.session.userId
    const user = await userModel.findOne({ user: userID })

    if (user.user === userID) {
      const result = await userModel.findOne({ following: { "$in": [artistID] } })

      if (result === null) {
        const update = await userModel.updateOne({ $push: { following: artistID } })

        if (update) {
          console.log('RESULT IS TOEGEVOEGD')
        } else {
          console.log('NIET TOEGEVOEGD, STAAT AL IN DE LIJST')
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

exports.searchArtists = async (req, res) => {
  try {
    const artists = []
    const spotifyApi = new SpotifyWebApi({ accessToken: req.session.accessToken })
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
}