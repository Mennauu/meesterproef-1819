const mongoose = require('mongoose')
const server = 'localhost'
const database = 'test'
const uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || `mongodb://${server}/${database}`

class Database {
  constructor() {
    this._connect()
  }

  _connect() {
    mongoose.connect(uristring, { useNewUrlParser: true })
      .then(() => {
        // mongoose.connection.db.dropDatabase();
        console.log('Database connection successful' + uristring)
      })
      .catch(err => {
        console.error('Database connection error:' + uristring)
      })
  }
}

module.exports = new Database()