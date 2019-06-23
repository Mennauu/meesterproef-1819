const SpotifyWebApi = require('spotify-web-api-node')

export const getPlayBackState = (socket) => {
  setInterval(async () => {
    try {
      const cookie = socket.handshake.headers.cookie
      const token = cookie.replace(/(?:(?:^|.*;\s*)spotify_access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")
      const spotifyApi = new SpotifyWebApi({ accessToken: token })
      const result = await spotifyApi.getMyCurrentPlaybackState({})

      socket.emit("getPlayBackState", result.body)
    } catch (error) {
      console.error(error)
    }
  }, 2000)
}