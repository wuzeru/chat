var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//Define Schema

var _User = new Schema({
    username:String,
    password:String,
    friends:[]
});

//exports them
exports.User = mongoose.model('User',_User);