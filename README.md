<p align="center">
<img alt="Linernote logo" src="PROJECT-assets/readme/linernote-logo.png" width="300">
</p>

<h1 align="center">Meesterproef 2019 @cmda-minor-web · 2018-2019</h1>

<p align="center"><b>Linernote brings Spotify, Youtube, articles and Social Media content from artists together in one app, supplemented by concert tickets.</b>
</p>

<br>

<p align="center">
  <a href="https://browser-technologies-1819.herokuapp.com/">
    <img src="https://img.shields.io/badge/demo-LIVE-brightgreen.svg?style=flat-square" alt="demo">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://creativecommons.org/licenses/by-nc-nd/3.0/">
    <img src="https://img.shields.io/badge/license-BYNCND3-green.svg?style=flat-square" alt="License">
  </a>
</p> 

<br>

![preview](PROJECT-assets/readme/preview.png)

<br>

## Introduction
Linernote is made as part of a course from [@cmda-minor-web 18-19](https://github.com/cmda-minor-web/meesterproef-1819). In this course I had to choose one of 16 assignments; Linernote was chosen.

Linernote is a thought-out idea by [Joost de Boo](http://www.joostdeboo.nl). His idea of Linernote is to have one central place where you (the user) can find everything about the artists you love, in one place. You can read about his vision of Linernote on his own website: [Joost de Boo: Linernote](http://www.joostdeboo.nl/linernote), though his actual concept has changed since then.

### About this readme
Some resources possess an emoticon to help you understand which type of content you may find:

- 📖: Documentation or article
- 🛠: Tool or library
- 📹: Video

<!-- Maybe a table of contents here? 📚 -->
## Table of Contents

- [Installation](#installation)
- [Design rationale](#design-rationale)
  - [Debriefing](#debriefing)
  - [Problem definition](#problem-definition)
  - [Solution](#solution)
    - [Database](#database)
    - [Authentication and Spotify](#authentication-and-spotify)
    - [Artist description](#artist-description)
    - [Social Links](#social-links)
    - [Social Media](#social-media)
    - [Articles](#articles)
    - [Tickets](#tickets)
  - [Code](#code)
- [Product biography](#product-biography)
  - [Kick-off](#kick-off)
- [Happy customer](#happy-customer)
- [Wishlist](#wishlist)
- [Sources](#sources)
- [License](#license)

<!-- How about a section that describes how to install this project? 🤓 -->
## Installation
In order to use this application you will have to register your own named application on Spotify, Twitter, YouTube, The New York Times, Ticketmaster and Google News and set the necessary credentials in a .env file. 

Please read the [Attribution-NonCommercial-NoDerivs 3.0 Unported License (“BY-NC-ND 3.0”)](https://creativecommons.org/licenses/by-nc-nd/3.0/) before you download and use this application and/or material.

<details>
  <summary>Show me the installation steps!</summary>

1. Create an application on the [Spotify's Developer Site](https://developer.spotify.com/my-applications/).

2. Add redirect_uri in the Spotify Developer panel
```bash
http://localhost:3000/spotify/callback
```

3. Create a .env file. You can find the id and secret in the Spotify Developers panel.
```bash
REDIRECT_URI=http://localhost:3000/spotify/callback
SPOTIFY_CLIENT_ID={{client_id}}
SPOTIFY_CLIENT_SECRET={{client_secret}}
```

4. Create an application on the [Twitter Developer Site](https://developer.twitter.com/) and add the key, secret and bearer token to the .env file.
```bash
TWITTER_CONSUMER_KEY={{consumer_key}}
TWITTER_CONSUMER_SECRET={{consumer_secret}}
TWITTER_BEARER_TOKEN={{bearer_token}}
```

5. Retrieve API Keys for YouTube, The New York Times, Ticketmaster and Google News, and place them in the .env file.
```bash
YOUTUBE_API_KEY={{api_key}}
NEWYORKTIMES_API_KEY={{api_key}}
TICKETMASTER_API_KEY={{api_key}}
GOOGLENEWS_API_KEY={{api_key}}
```

6. Set a session secret in the .env file.
```bash
SESSION_SECRET={{PlaceLiterallyAnythingHere}}
```

7. Open your terminal

8. Change the directory to a folder in which you want to place the files
```bash
cd /~path
```
9. Clone the repository (you're going to need [Git](https://www.linode.com/docs/development/version-control/how-to-install-git-on-linux-mac-and-windows/))
```bash
git clone https://github.com/Mennauu/meesterproef-1819
```
10. Change directory to repository
```bash
cd meesterproef-1819
```
11. Install dependencies from [package.json](https://github.com/Mennauu/browser-technologies-1819/blob/master/package.json)
```bash
npm install
```

12. Place the .env file in the root folder

13. Run application with [Node](https://nodejs.org/en/)
```bash
node app.js
```

</details>

## Design rationale

### Debriefing
As mentioned in the introduction, Linernote is a thought-out idea by [Joost de Boo](http://www.joostdeboo.nl). His idea of Linernote is to have one central place where you (the user) can find everything about the artists you love, in one place. 

Linernote wants to show Spotify and Social Media content together with articles and tickets for events and concerts, based on the artists you love.

You can read about Joost his vision of Linernote on his own website: [Joost de Boo: Linernote](http://www.joostdeboo.nl/linernote), though his actual concept has changed since then.

### Problem definition
When you like an artist, you spend time on multiple platforms to search and gather information about the artist. Why waste time on checking different apps and websites if you could check all the content at once?

In order to show all the content from other platforms we need to have access to that content.

### Solution

8 API's are being used to retrieve content
- Spotify Web API
- Twitter API
- MusicBrainz API
- YouTube Google API
- Ticketmaster API
- MediaWiki API
- The New York Times API
- Google News API

Instagram data isn't retrieved using their official API, because you can't recieve public content from their API.

#### Database
In order to save account details and be able to follow artists, we need a **database**. The project is made using JavaScript, NodeJS and Express; [mongoDB](https://www.mongodb.com/) is a perfect database when using these tools, because MongoDB is a document database, which means it stores data in JSON-like documents. [Mongoose](https://mongoosejs.com/) is used as a boilerplate. 

#### Authentication and Spotify
In order to authenticate the user (with [OAuth 2.0](https://oauth.net/2/)) and save its account ID in the database, we use the [Spotify Web API](https://developer.spotify.com/documentation/web-api/), following the [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/). We use spotify for the authentication process, because you need to be authenticated as a user in order to retrieve certain data from Spotify or make certain actions:

- To be able to search for artists and retrieve results
- To retrieve top tracks of concerning artist
- To retrieve related artists
- To retrieve artist images
- To retrieve information of the authenticated user
- To rertrieve information on the current song playing (in spotify from authenticated user)
- To be able to pause and play songs

The [Spotify Web API JS](https://www.npmjs.com/package/spotify-web-api-js) library is used as a wrapper for the Spotify Web API.

#### Artist description
The [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) is used to retrieve a description of the given artist

#### Social Links
In order to get all the necessary social links of an artists we use the [Musicbrainz API](https://wiki.musicbrainz.org/Development/JSON_Web_Service). For example, when searching for Beyonce the API returns the URL: https://www.instagram.com/beyonce/ as the instagram social link.

#### Social Media
Since we have the social links, we now need to retrieve the most recent posts or upload from each platform; Instagram, Twitter and YouTube.

_**Instagram**_<br>
Instagram doesn't have an API where you can retrieve public data from a given user. However, if you add <i>?__a=1</i> after the Instagram Social Link, it returns all the data of that given user. We fetch the data from that link and search for the URL shortcode from the latest post, which is used to embedd the post within Linernote.

_**Twitter**_<br>
To retrieve the latest Twitter post of a given user you have to create a [developer account at Twitter](https://developer.twitter.com/) and get verified for your project. As soon as you are verified (and retrieved a key, secret and token) you can use the Twitter API to retrieve the URL shortcode from the latest feed post of a given user, which is used to embedd the post within Linernote.

The [Twitter for Node.js](https://www.npmjs.com/package/twitter) library is used as a wrapper for the Twitter API.

_**YouTube**_<br>
To retrieve the latest YouTube upload of a given user you have to sign up at Google and retrieve an API key. You can then use the [YouTube Google API v3](https://developers.google.com/youtube/) to search for a playlist with all uploaded videos - you have to filter out the latest one.

#### Articles
We get articles from two sources: The New York Times and Google News.

_**The New York Times**_<br>
In order to use the [API from The New York Times](https://developer.nytimes.com/apis) you need to create a project on their [developer website](https://developer.nytimes.com/). After creation you will retrieve an API key with which you can search for articles from The New York Times based on the name of the artist.

_**Google News**_<br>
Google News gets their articles from 30.000 sources all over the internet. In order to use the [Google News API](https://newsapi.org/s/google-news-api) you have to create a new account and request an API key. With the API key you can search in their database for the most recent articles based on the name of the artist.

#### Tickets
To show events and concerts from artists, we use the [Ticketmaster API](https://developer.ticketmaster.com/). You have to create an account to get an API key in order to use their API. The results are based on the name of an artist. For monetization you need a business verified API key.

### Code
Linernote is created using HTML, SCSS, JavaScript, Handlebars, NodeJS, Express, MongoDB and SocketIO.

The code consists of 600+ lines of HTML(and handlebars), 800+ lines of JavaScript and 1000+ lines of SCSS.

<details>
  <summary>Show me some code explanations!</summary>

<br>

**SCSS**<br>
SCSS is used to write beautiful component based CSS. Let's take the Spotify Player as an example. 

```SCSS
.spotify {
  position: fixed;
  bottom: 50px;
  height: 50px;
  background-color: $black-light;
  z-index: 10;
  width: 100%;
  border-bottom: 1px solid $gray-dark;
  color: $white;
  display: flex;
  align-items: center;
  padding: 0 1em;

  &__progress {
    width: 1px;
    height: 3px;
    background: $white;
    transition: width .1s linear;
    visibility: hidden;
  }

  &__image {
    width: 30px;
    height: 30px;
    margin-right: 1em;
  }

  &__song {
    text-align: center;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    overflow: hidden;
  }

  &__artist {
    display: inline-block;
    text-transform: lowercase;

    &::first-letter {
      text-transform: uppercase;
    }
  }

  &__track {
    color: $gray;
    text-transform: lowercase;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;

    &::first-letter {
      text-transform: uppercase;
    }
  }

  &__remote {
    height: 30px;
    min-width: 30px;
    border: 1px solid $white;
    border-radius: $rounded;
    margin-left: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
    cursor: pointer;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
  }

  &__id {
    display: none;
  }

  &__refresh {
    display: flex;
    width: calc(100% - 3em);
    align-items: center;
  }
}
```
**Handlebars**<br>
Handlebars are used to build semantic templates. I can use a layout for multiple views; two layouts are created while there are 4 views. Lets take the Authentication Layout as an example with the Login view.

_**Authentication Layout**_
```handlebars
<!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport">
    <title>Linernote</title>
    <meta name="description"
      content="Linernote brings Spotify, Youtube, articles and Social Media content from artists together in one app, supplemented by concert tickets.">
    <link rel="icon" type="image/png" href="/images/favicon.png">
    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Nunito+Sans:300,400,700,900">
  </head>

  <body class="{{template}}">
    {{{body}}}
  </body>

</html>
```

_**Login view**_
```handlebars
<div class="authentication">
  <img class="authentication__logo" src="/images/linernote-logo.png" alt="Linernote logo">
  <p class="authentication__description">Linernote brings Spotify, 
    Youtube, articles and Social Media content from artists together 
    in one app, supplemented by concert tickets.</p>
  <a href="/spotify/login" class="button button--spotify">Login with spotify</a>
  <small class="authentication__note">Note: you need a <a
      href="https://www.spotify.com/nl/premium/?checkout=false">premium
      account</a></small>
</div>
```

**MongoDB**<br>
MongoDB is used to setup the database (based on Mongoose). The only things necessary are connecting to the database, and being able to add a user to it with a record (array in this case) in which the id's of the (followed) artists can be placed.


```JavaScript
class Database {
  constructor() {
    this._connect()
  }

  _connect() {
    mongoose.connect(uristring, { useNewUrlParser: true })
      .then(() => {
        console.log('Database connection successful: ' + uristring)
      })
      .catch(err => {
        console.error('Database connection error: ' + uristring)
      })
  }
}
```

```JavaScript
const userSchema = new mongoose.Schema({
  user: String,
  following: []
})
```

**SocketIO**<br>
SocketIO is used to be able to load the page without having to wait for all the API calls to return with data. The page can be openend nearly instant, with a loading state for the data. Sockets are also used to poll the Spotify API every couple of seconds to retrieve the current playing song from the authenticated user. The front-end will update as soon as a **new** song gets polled.

```JavaScript
io.on("connect", socket => {
  getPlayBackState(socket)

  socket.on('artist-name', async (name) => {
    socket.emit('artist-data', await getArtistData(name))
  })
  socket.on('following-list', async (data) => {
    socket.emit('artist-data', await getMultipleArtistData(data.followList, data.token))
  })
})
```

</details>

## Product biography

### Kick-off
During the kick-off Joost gave a [short presentation about Linernote](https://onedrive.live.com/?authkey=%21ADrc8kzEevMWYAI&cid=F3D45B310A388925&id=F3D45B310A388925%2121950&parId=F3D45B310A388925%2121704&o=OneUp), and in that presentation he said that the 4 most important platforms that have to be included in the application are: Instagram, YouTube, Spotify and Ticketmaster. I also learned that Joost is a graphic designer, cool.

After the meeting I did some research on the 4 platforms about retrieving data (from each of them). You can find the research here (sorry, it's in dutch!): [Modulemogelijkheden Linernote](PROJECT-assets/readme/modulemogelijkheden.pdf). Weeks later I figured out that some of the conclusions in the research weren't exactly correct. But we will get to that later!

## Learning goals and reflection
| _Course_               | _Learning goal_ | _Reflection_ |
|:---------------------:|---------------|------------|
| **CSS to the rescue**  | _You understand the broader scope of CSS_ | During the CSS to the rescue assignment I had to use the [SMACSS methodologie](http://smacss.com/). I took it on me to use [BEM](http://getbem.com/introduction/) for this project. Even though not part of CSS to the rescue, I also used [SCSS](https://sass-lang.com/), and learned a lot from it. SCSS allows you to write beautiful component based CSS code.
| **Web App From Scratch** | _You can retrieve data, manipulate it and dynamically convert it to html elements using templating_ | All the data retrieved from the API's are "manipulated" and converted to HTML elements (using Handlebars for templating).
|                      | _You understand how you can work with an external API using asynchronous code_ | 8 API's are currently being used in Linernote to retrieve data, using asynchronous code. Though 12 API's have been used in total, 4 of them didn't meet the data requirement. I have never experimented with so many API's at once.
|                      | _You can add structure to your code by applying patterns_ | I feel like I did really good with the functional code pattern and folders/files structure. Everything feels in place and every file can communicate with eachother. 
| **Performance Matters**  | _You know the difference between client side and server side rendering and you can apply server side rendering_ | At first (nearly) the entire application was server side rendered, but with the use of Sockets I also implemented client side rendering.
|                      | _You understand how the critical render path works and how you can optimize it for a better runtime and / or perceived performance_ | Especially on the perceived performance part, I used sockets to render data from all API's; I was able to load the page without having to wait for all the API calls to return with data. The page can be openend nearly instant, with a loading state for the data.
| **Real Time Web**        | _Deal with real-time complexity_ + _Handle real-time data management_ | Sockets are used to poll the Spotify API every couple of seconds to retrieve the current playing song from the authenticated user. The front-end will automatically update as soon as a **new** song gets polled.
|                      | _Handle real-time client-server interaction_ | A great interaction I implemented is the ability to play and pause the Spotify Player from the authenticated user. 
|                      | _Handle multi-user support_ | Not sure if this counts, but the application could be used by over a thousand people at the same time. Every user has its own session.


The last 5 weeks have been an enormous learning curve. I've experienced the pain of API's, but also the beauty. Spotify is the greatest example. At the beginning I had a difficult time dealing with their API, but now, it just naturally makes sense; and you can do **A LOT**! Things that I thought I would never do. I don't think I've ever had more lightbulbs above my head when working on a coding project. It will probably be a while before I get into another project with the use of so many API's 😉.

## Happy customer

✅ Happy customer confirmed ✅

## Wishlist
- [ ] Add filtering
- [ ] Add two line support for artist name on artist page
- [ ] Add offline data support (localStorage or serviceWorker)
- [ ] Infinite scrolling (for more content)
- [ ] Ability to swipe any feed item to the left to show some keywords and sharing options for that particular feed item.
- [ ] If possible, when clicking on a song from the top tracks, play it on Spotify.

## Sources
Underneath you will find any source that has been helpful with creating Linernote

> * 🛠 [Contrast Ratio](https://contrast-ratio.com/#%23cf4436-on-white)
> * 🛠 [Can I use](https://caniuse.com/)

> * 📖 [Feature Detection](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Feature_detection)
> * 📖 [WikiHow: Disable JavaScript](https://www.wikihow.com/Disable-JavaScript)
> * 📖 [Blockmetry: JavaScript Disabled](https://blockmetry.com/blog/javascript-disabled)
> * 📖 [DZONE: JavaScript remove() method](https://blockmetry.com/blog/javascript-disabled)
> * 📖 [[Detect supported audio formats with JavaScript](https://davidwalsh.name/detect-supported-audio-formats-javascript)

<!-- How about a license here? 📜 (or is it a licence?) 🤷 -->
## License 
<a href="https://creativecommons.org/licenses/by-nc-nd/3.0/" rel="nofollow">
  <img alt="Creative Commons-Licentie" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/88x31.png" />
</a>