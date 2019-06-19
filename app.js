// const shrinkRay   = require('shrink-ray-current')
const express = require('express')
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')
const route = require('./server/routes/routeHandler.js')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const app = express()
const port = process.env.PORT || 3000
const db = mongoose.connection

require('./server/database/database.js')
require('dotenv').config()


app.disable('x-powered-by')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}))

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

app.listen(port, () => console.log(`Linernote listening on port ${port}!`))

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