// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const SpotifyWebApi = require('spotify-web-api-node')
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')
const route = require('./server/routes/routeHandler.js')
const cookieParser = require('cookie-parser')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

require('./server/database/database.js')
require('dotenv').config()

app.disable('x-powered-by')

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(shrinkRay())
app.use(express.static(__dirname + '/public', {
  maxAge: "365d",
  lastModified: "",
  etag: ""
}))

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

app.get('/', route.root)
app.get('/login', route.login)
app.get('/spotify/login', route.spotifyLogin)
app.get('/spotify/callback', route.spotifyCallback)
app.get('/home', route.home)
app.get('/search', route.search)
app.get('/artist/:id', route.artist)
app.get('/logout', route.logout)

app.post('/add-artist', route.addArtist)
app.post('/search', route.searchArtists)

io.on("connect", socket => {
  console.log(socket)
  console.log("New client connected")

  setInterval(async () => {
    try {
      let token = ''
      const cookies = socket.handshake.headers.cookie
      const split = cookies.split(/[:;]/)

      for (let cook of split) {
        const cookie = cook.substring(cook.indexOf('=') + 1)
        if (cookie.length > 50) token = cookie
      }

      const spotifyApi = new SpotifyWebApi({ accessToken: token })
      const result = await spotifyApi.getMyCurrentPlaybackState({})
      if (result.body.is_playing === true) {
        socket.emit("getPlayBackState", result.body)
      }
    } catch (error) {
      console.error(error)
    }
  }, 1500)

  socket.on("disconnect", () => console.log("Client disconnected"))
})

http.listen(port, () => console.log(`Linernote listening on port ${port}!`))