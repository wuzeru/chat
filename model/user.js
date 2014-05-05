var db = require('./db');
var models = require('./models');

var Users = models.User;
function User(){};
module.exports = User;

//用户注册
User.reg = function(user,callback){
    var newuser = new Users({
        username:user.username,
        password:user.password,
        friends:user.friends,
        sex:"女",
        age:18,
        email:"暂无",
        sign:"暂无",
        imgUrl:"1.jpg"
    });
    newuser.save(function(err,doc){
        if(err) throw err;
        return callback(err,doc);
    });
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
User.updateInfo = function(name,Info,callback){
    var s= {};
    User.get(name,function(err,doc){
        s = doc;
        s.sex = Info.sex
        s.age = Info.age;
        s.email = Info.email;
        s.sign = Info.sign;
        s.imgUrl = Info.imgUrl;

        s.save(function(err,doc,num){
            if(err) throw err;
            return callback(err,doc,num);
        });
    });
}
User.psdChange = function(name,psd,callback){
    User.get(name,function(err,doc){
        doc.password = psd ;
        doc.save(function(err,doc,num){
            if(err) throw err;
            return callback(err,doc,num);
        })
    })
}
User.saveRecord = function (name, chatRecord, callback) {
    Users.findOne({username:name}, function (err, doc) {
        if(err) console.log(err);
        if (doc.chatRecord.to == chatRecord.to) {
            doc.update({"chatRecord.to": chatRecord.to}, {$push: {"chatRecord": {"record": chatRecord.record}}}, function (err, num) {
                if (err) return callback(err);
                return callback(err, num);
            })
        }else{
            Users.update({username: name}, {$push: {"chatRecord": {"to":chatRecord.to,"record": chatRecord.record}}}, function (err, num) {
                if (err) return callback(err);
                return callback(err, num);
            })
        }
    });
}
User.loadRecord = function(name,to,callback){
    User.get(name,function(err,doc){
        var num = 0;
        for(var i = 0;i<doc.chatRecord.length ;i++){
            if(doc.chatRecord[i].to == to){
                num = 1;
                return callback(err,doc.chatRecord[i]);
            }
        }
        if(num == 0){
            return callback(err,null);
        }
    })
}
