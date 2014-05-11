var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//Define Schema
//用户模型
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
//群模型
var _Group = new Schema({
    name:String,
    leader:String,
    member:[]
})


//exports them
exports.User = mongoose.model('User',_User);
exports.Group = mongoose.model('Group',_Group);