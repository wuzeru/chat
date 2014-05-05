var db  = require("../model/db");
var User = require('../model/user');
//var Users = require('../model/models');
var crypto = require("crypto");
var fs = require("fs");

var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick : true });

var images = require("node-images");
module.exports = function(app){
    var record ;//聊天记录缓存
    //首页
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
                req.flash('error','用户名存在');
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
            };
            User.reg(user,function(err,user){
                if(err){
                    console.log(err);
                }else{
                    req.session.user = user;
                    res.redirect('/chatRoom');
                }
            })
        })
    });
    //登出功能
    app.get("/logout",function(req,res){
        req.session.username = null;
        res.redirect('/');
    });
    //登录功能
    app.post("/login",function(req,res){
        var username = req.body.username,
            password = crypto.createHash('md5').update(req.body.password).digest('hex');
        User.get(username,function(err,user){
            if(user){

                if(user.password != password){
                    req.flash('error','密码不正确');
                    res.redirect('/');
                }else{
                    console.log("已成功");
                    req.session.user = user;
                    res.redirect('/chatRoom');
                };

            }else{
                req.flash('error','用户名存在');
                res.redirect('/');
            }
        })
    });
    app.get("/chatRoom",function(req,res){
        if (req.session.user) {

            res.render('chatRoom', {user: req.session.user});
        } else {
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
    app.get('/agreeFriend',function(req,res){
        var fname = req.query.fname;
        var name = req.session.user.username;
        User.add(name,fname,function(err,num){
            if(num != 0){
                User.add(fname,name,function(err,num){
                    if(num != 0){
                        res.send('ok');
                    }
                });
            }
        });
    });
    // 个人信息页面
    app.get('/personInfo',function(req,res){
        var name = req.session.user.username;
        res.render('personInfo',{user:req.session.user});
    });
    //个人信息修改提交
    app.post('/InfoUpdate',function(req,res){
        var tmp_path,target_path;
        if(req.files.thumbnail.size >0){ //表示有图片文件上传
            tmp_path = req.files.thumbnail.path;
            // 指定文件上传后的目录 - 示例为"images"目录。
            // 重命名图片名字
            var picType=req.files.thumbnail.name.split(".");
            picType=picType[1];
            target_path = './public/images/user/pic_' + req.session.user.username+"."+picType;
            // 移动文件
            fs.rename(tmp_path, target_path, function(err) {
                if (err) throw err;
                imageMagick(target_path)
                    .resize(140,140,"!")
                    .autoOrient()
                    .write(target_path, function(err){
                        if (err) {
                            console.log(err);
                        }
                    });
            });
        }
        var imgUrl = target_path.replace("./public/images","");

        var data = {};
        data.age = req.body.age;
        data.email = req.body.email;
        data.sign = req.body.sign;
        data.imgUrl = imgUrl;
        User.updateInfo(req.session.user.username, data, function (err, doc, num) {
            req.session.user = doc;
            res.redirect('/chatRoom');
        });
    });
    //密码修改
    app.post('/psdChange',function(req,res){
        var name = req.session.user.username,
            oldpsd = crypto.createHash('md5').update(req.body.oldPsd).digest('hex'),
            conpsd = crypto.createHash('md5').update(req.body.psdConfirm).digest('hex');

        User.get(name,function(err,doc){
            if(oldpsd === doc.password){
                User.psdChange(name,conpsd,function(err,doc,num){
                    if(num){
                        res.redirect('chatRoom');
                    }
                });
            }
        });
    });
    //展示用户头像
    app.get('/userImgShow',function(req,res){
        User.get(req.query.username,function(err,doc){
            if(doc.imgUrl != '1.jpg'){
            res.send(doc.imgUrl);
            }else{
                res.send("/1.jpg");
            }
        });
    });
    //保存用户聊天记录
    app.post('/saveChatRecord',function(req,res){
        var chatRecord = {};
        chatRecord.to = req.body.to;
        chatRecord.record = req.body.record;
        console.log(chatRecord.to);
        console.log(chatRecord.record);
        User.saveRecord(req.session.user.username,chatRecord,function(err,doc,num){
            if(num){
                res.send('ok');
            }else{
                res.send('null');
            }
        });
    });
    //读取用户聊天记录
    app.post('/stroeRecord',function(req,res){
        record = req.body.record;
        res.send("ok");
    });
    //获取用户聊天记录
    app.post('/getRecord',function(req,res){
        res.send(record);
    });
    //测试
    app.get("/test",function(req,res){
        res.render("test",{user:req.session.user});
    });

}