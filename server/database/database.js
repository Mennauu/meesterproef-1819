const mongoose = require('mongoose')
const server = 'localhost'
const database = 'test'

class Database {
  constructor() {
    this._connect()
  }

  _connect() {
    mongoose.connect(`mongodb://${server}/${database}`, { useNewUrlParser: true })
      .then(() => {
        // mongoose.connection.db.dropDatabase();
        console.log('Database connection successful')
      })
      .catch(err => {
        console.error('Database connection error')
      })
  }
}

module.exports = new Database()