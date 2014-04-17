var db = require('./db');
var models = require('./models');

var Users = models.User;
function User(){};
module.exports = User;

//用户注册
User.reg = function(user,callback){
/*    var user = {
        username:this.username,
        password:this.password,
        friends:'null'
    };*/
    console.log(user);
    var newuser = new Users({
        username:user.username,
        password:user.password,
        friends:user.friends
    });
    newuser.save(function(err,doc){
        if(err) throw err;
        return callback(err,doc);
    });
/*    Users.create(user,function(err,doc){
        if(err){
            return callback(err);
        }//如果出错将err传给回调函数
        console.log(doc);
        return callback(err,doc);
    });*/
}
//读取用户文档
User.get = function(name,callback){
    Users.findOne({username:name},function(err,result){
        if(err){
            return callback(err);
        };
        if(result){
            var user = result;
            return callback(err,user);//查询成功，返回user
        }else{
            return callback(err,null);//查询失败，返回null
        }
    });
}
//读取用户好友
User.getFriend = function(name,callback){

};
//添加用户好友
User.add = function(name,friendname,callback){
    Users.update({username:name},{$push:{"friends":friendname}},{safe:true},function(err,num){

        if(err){
            console.log(err);
            throw err;
        };

            return callback(err,num);//更新成功
    });
}