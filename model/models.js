var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//Define Schema
var _User = new Schema({
    username:String,
    password:String,
    sex:String,
    age:Number,
    email:String,
    sign:String,
    friends:[],
    imgUrl:String
});


//exports them
exports.User = mongoose.model('User',_User);