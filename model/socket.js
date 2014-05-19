var User = require('./user');
var Group = require('./group');
var fs = require('fs');

module.exports = function(io){
    //存储在线用户
    var users = [];
    io.sockets.on('connection',function(socket){
        //接收用户上线
        socket.on('online',function(data){
            socket.name = data.name;
            //数组中不存在该用户名则插入该用户名
            if(users.indexOf(data.name) == -1){
                users.unshift(data.name);
            }
            io.sockets.emit('online',{users:users,username:data.name});
        });

        //接收用户下线
        socket.on('disconnect',function(){
            //如果用户名在在线用户数组中
            if(users.indexOf(socket.name) != -1){
                users.splice(users.indexOf(socket.name),1);
                socket.broadcast.emit('offline',{name:socket.name});
            }
        });

        //私信聊天
        socket.on('selfTalk',function(data,fn){
            fn("ok");
            var clients = io.sockets.clients();
            clients.forEach(function(client){
                if (client.name == data.to) {
                    client.emit('selfTalk', data);
                }
            })
        });

        //好友验证消息发送
        socket.on('agreeFriend',function(data,fn){
            User.get(data.message.from,function(err,doc){
                if(doc.friends.indexOf(data.to) != -1){
                    fn('no');
                }else{
                    User.get(data.to, function (err, doc) {
                        fn('ok');
                        doc.messages.unshift(data.message);
                        doc.save(function () {
                            var clients = io.sockets.clients();
                            clients.forEach(function (client) {
                                //如果好友在线，发送验证消息
                                if (client.name == data.to) {
                                    client.emit('receiveMSG', {message: data.message});
                                }
                            });
                        })

                    })
                }
            })

        });
        //好友验证通过
        socket.on('friendPass',function(data,fn){
            var fname = data.fname;
            var name = data.name;
            User.add(name,fname,function(err,num){
                if(num != 0){
                    User.add(fname,name,function(err,num){
                        if(num != 0){
                            removeMessages(name,fname,"friendApply",function(length){
                                var data = {result:'ok',length:length};
                                fn(data);
                                var clients = io.sockets.clients();
                                clients.forEach(function(client){
                                    if(client.name == fname){
                                        client.emit('friendPass',name);
                                    }
                                });
                            });
                        }
                    });
                }
            });
        });

        //判断好友是否在线
        socket.on('isFriendOnline',function(fname,fn){
            if(users.indexOf(fname) != -1){
                fn("yes");
            }else{
                fn("no");
            }
        });

        //接收申请人的入群申请
        socket.on('applyToGroup',function(data,fn){
            Group.get(data.message.gname,function(err,group){
                if(group.member.indexOf(data.message.from) != -1){
                    fn('Failed');
                }else {
                    fn('ok');
                    User.get(group.leader,function(err,doc){
                        doc.messages.unshift(data.message);
                        doc.save(function () {
                            var clients = io.sockets.clients();
                            clients.forEach(function (client) {
                                //如果好友在线，发送验证消息
                                if (client.name == group.leader) {
                                    client.emit('receiveMSG', {message: data.message});
                                }
                            });
                        })
                    })
                }
            })
        });

        //同意申请人加入群
        socket.on('groupPass',function(data,fn){
            var name = data.name; //群主
            var fname = data.fname;//申请加入成员
            var gname = data.gname;//群名
            Group.addMember(fname,gname,function(err,result){
                if(result != 'Failed'){
                    User.get(fname,function(err,doc){
                        doc.groups.push(gname);
                        doc.save(function(){
                            removeMessages(name,fname,"groupApply",function(length){
                                var data = {result:'ok',length:length};
                                fn(data);
                                var clients = io.sockets.clients();
                                clients.forEach(function(client){
                                    if(client.name == fname){
                                        client.emit('groupPass',gname);
                                    }
                                });
                            });
                        })
                    })
                }
            })

        });

        //移除一条消息
        socket.on('removeMessage',function(data,fn){
            removeMessages(data.name,data.fname,data.messageType,function(length){
                fn(length);
            });
        });

    });

    //群操作
    var groupTalk = io.of('/groupTalk').on('connection',function(socket){
        var group = [];
        socket.on('online',function(data){
            socket.name = data.name;
            socket.groups = data.groups;
        });
        socket.on('groupTalk',function(data,fn){
            fn("ok");
            groupTalk.clients().forEach(function(client){
                if(client.groups.indexOf(data.group) != -1){
                    client.emit('groupTalk',data);
                }
            })
        })
    });
}

//移除一条message
function removeMessages(name,fname,messageType,callback){
    User.get(name,function(err,doc){
        for(var i=0;i<doc.messages.length;i++){
            if(doc.messages[i].from == fname && doc.messages[i].type == messageType){
                doc.messages.splice(i,1);
                doc.save();
                return callback(doc.messages.length);
            }
        }
    })
}