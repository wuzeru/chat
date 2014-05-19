var db  = require("../model/db");
var User = require('../model/user');
var Group = require('../model/group');
var crypto = require("crypto");
var fs = require("fs");

var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick : true });

var images = require("node-images");
module.exports = function(app){

    //首页
    app.get("/",function(req,res){
        res.render("index");
    });
/**
+------------------------------------------------------------------------------
* 用户操作
+------------------------------------------------------------------------------
*/
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

            var user = {
                username:name,
                password:password
            };
            User.reg(user,function(err,user){
                if(err){
                    console.log(err);
                } else {
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
                    res.send("passwordWrong");
                }else{
                    req.session.user = user;
                    res.redirect('/chatRoom');
                }

            }else{
                res.redirect('/');
            }
        })
    });
    //展示用户头像
    app.get('/userImgShow',function(req,res){
        User.get(req.query.username,function(err,doc){
            if(err) res.send("/1.jpg");
            if(doc == null) {
                res.send("/1.jpg");
            }
            else {
                if(doc.imgUrl != '1.jpg'){
                    res.send(doc.imgUrl);
                }else{
                    res.send("/1.jpg");
                }
            }
        });
    });
    //进入界面
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
               res.send(user);

           }else{
               res.send('null');
           }
       });
    });

    //群搜素
    app.get("/searchGroup",function(req,res){
        var gname = req.query.gname;
        Group.get(gname,function(err,group){
            if(group){
                res.send(group);
            }else {
                res.send('null');
            }
        })
    });

    //保存聊天记录
    app.post('/recordAppend', function (req, res) {
        var name = req.body.name;//用户名字
        var fname = req.body.fname;//好友名字
        var records = req.body.records;//聊天记录
        //console.log(records);

        User.get(name, function (err, user) {

            //找到该好友在用户聊天记录中的位置，不存在返回－1
            var index = function(){
                for(var i=0 ;i<user.records.length;i++){
                    if(user.records[i].to == fname){
                        return i;
                    }
                }
                return -1;
            }

            //该用户还没有保存过与该好友的聊天记录
            if (index() === -1) {
                //新建一个records对象
                var p = {
                    to: fname,
                    record: records
                }
                //保存进records
                user.records.push(p);

            } else { //该用户已经保存过与该好友的聊天记录
                //判断是否是之前保存过的记录，将没保存过的保存进该用户对该好友聊天记录的record中
                records.forEach(function (records) {
                   //找到该条记录的时间在用户聊天记录中的位置，没有返回－1
                    var isDateStored = function(){
                        for(var i = 0;i<user.records[index()].record.length;i++){
                            if(user.records[index()].record[i].date === records.date){
                                return i;
                            }
                        }
                        return -1;
                    }
                    //如果还没有保存过，保存进聊天记录
                    if (isDateStored() < 0) {
                        user.records[index()].record.push(records);
                    }
                })
            }
            user.save(function (err) {
                if (err) throw err;
                res.send('ok');
            })
        })
    });
    //读取聊天记录
    app.post('/getRecord',function(req,res){
        var name = req.body.name;
        var fname = req.body.fname;

        User.get(name,function(err,user){
            //如果用户的聊天记录为空，没有和任何好友聊天，返回null
            if(user.records.length === 0 ){
                res.send('null');
            }else{
                function isFnameinRecords(fname,records){
                    for(var i=0;i<records.length;i++){
                        //如果与该好友聊天过，返回聊天记录
                        if(records[i].to === fname){
                            return i;
                        }
                    }
                    return -1;
                }
                var p = isFnameinRecords(fname,user.records);
                if(p == -1){
                    //如果没有与该好友聊天过，返回null
                    res.send('null');
                }else{
                    res.send(user.records[p].record);
                }
            }
        })
    });


/**
+------------------------------------------------------------------------------
* 个人页面
+------------------------------------------------------------------------------
*/
    // 进入个人信息页面
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


/**
+------------------------------------------------------------------------------
* 群操作
+------------------------------------------------------------------------------
*/
    //新建群
    app.post('/groupEstablish',function(req,res){
        var group = {
            name:req.body.name,
            leader:req.body.leader,
            member:[req.body.leader]
        };
        Group.establish(group,function(err,result){
            if(err) throw err;
            if(result){   //返回值不为空，建群成功
               User.get(group.leader,function(err,doc){
                   if(err) throw err;
                   doc.groups.unshift(group.name);
                   doc.save(function(err){
                      if(err) throw err;
                   });
                   res.send("ok");
                })
            }else{        //返回值为空，建群失败
                res.send('failed');
            }
        });
    });

    //保存群聊天记录
    app.post('/appendGroupRecord', function (req, res) {
        var gname = req.body.gname;//群名字
        var records = req.body.records;//聊天记录

        Group.get(gname, function (err, group) {
            records.forEach(function(records){
                //判断是否存在该聊天记录
                var isDateStored = function(){
                    for(var i = 0;i<group.records.length;i++){
                        if(group.records[i].date === records.date){
                            return i;
                        }
                    }
                    return -1;
                };
                //如果不存在
                if(isDateStored() == -1){
                    group.records.push(records);
                }
            });

            group.save(function (err) {
                if (err) throw err;
                res.send('ok');
            })
        })
    });
    //获取群聊天记录
    app.post('/getGroupRecord',function(req,res){
        var gname = req.body.gname;

        Group.get(gname,function(err,user){
            //如果该群的聊天记录为空，返回null
            if(user.records.length === 0 ){
                res.send('null');
            }else{
                res.send(user.records);
            }
        })
    });


}