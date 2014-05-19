var mongoose = require('mongoose');

var Schema = mongoose.Schema;

//Define Schema
//用户
var _User = new Schema({
    username:String,
    password:String,
    sex:String,
    age:Number,
    email:String,
    sign:String,
    friends:[],
    imgUrl:String,
    groups:[],
    messages:[],
    records:[{
        to:String,
        record:[{
            name:String,
            date:String,
            talk:String
        }]
    }]
});
//群
var _Group = new Schema({
    name:String,
    leader:String,
    member:[],
    records:[{
        name:String,
        date:String,
        talk:String
    }]
})


//exports them
exports.User = mongoose.model('User',_User);
exports.Group = mongoose.model('Group',_Group);