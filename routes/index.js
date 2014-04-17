var db  = require("../model/db");
var User = require('../model/user');
var Users = require('../model/models');
var crypto = require("crypto");


module.exports = function(app){
    app.get("/",function(req,res){
        res.render("index");
    });
    //注册功能
    app.post("/reg",function(req,res){
        var name = req.body.username,
            password = crypto.createHash('md5').update(req.body.password).digest('hex');

        User.get(name,function(err,user){
            if(user){
                err = '用户名存在';
            }
            if(err){
                console.log(err);
                return res.redirect('/');
            }
            var friends = [];

            var user = {
                username:name,
                password:password,
                friends:friends
            }
            console.log(user);
            User.reg(user,function(err,user){
                if(err){
                    console.log(err);
                }else{
                    req.session.username = name;
                    res.redirect('/chatRoom');
                }
            })
        })
    });
    //登录功能
    app.post("/login",function(req,res){
        var username = req.body.username,
            password = crypto.createHash('md5').update(req.body.password).digest('hex');
        User.get(username,function(err,user){
            if(user){

                if(user.password != password){
                    console.log("密码错误！");
                    res.redirect('/');
                }else{
                    console.log("已成功");
                    req.session.username = username;
                    res.redirect('/chatRoom');
                };

            }else{
                console.log("用户名不存在！");
                res.redirect('/');
            }
        })
    });
    app.get("/chatRoom",function(req,res){
        if(req.session.username){
            var list = [];
            var name = req.session.username;
            User.get(name,function(err,user){
                for(var i = 0;i<user.friends.length;i++){
                    list[i] = user.friends[i];
                };
                res.render('chatRoom',{lists:list,username:name});
            });
        }else{
            res.redirect("/");
        }
    });

    //好友搜索
    app.get("/search",function(req,res){
       var name = req.query.fname;

       User.get(name,function(err,user){
           if(user){
               //console.log(user.username);
               res.send(user);

           }else{
               res.send('null');
           }
       });
    });
    //添加好友
    app.get('/addFriend',function(req,res){
        var fname = req.query.fname;
        var name = req.session.username;
        User.add(name,fname,function(err,num){
            if(num != 0){
                res.send("ok");
            }
        })
    })
    //测试
    app.get("/test",function(req,res){
        res.render("test");
    })

}