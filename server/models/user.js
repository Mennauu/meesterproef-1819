const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  accessToken: String,
  user: String,
  following: []
})

module.exports = mongoose.model('User', userSchema)