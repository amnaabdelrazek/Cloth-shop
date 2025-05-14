const mongoose = require('mongoose');

// Connection URL
const url = 'mongodb://localhost:27017/my_store';

const connectDb = () => {
    mongoose.connect(url).then(() => {
        console.log('Connected successfully to server');
    });
}

module.exports = connectDb;