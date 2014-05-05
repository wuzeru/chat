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
        //获取聊天记录
        socket.on('getRecord',function(data,fn){
           var toClient = [{to:'k',from:'k',date:'k',talk:"k"}];
           var clients = io.sockets.clients();
            clients.forEach(function(client){
                if(client.name === data.from){
                    client.get('record',function(err,record){
                        if (record) {
                            record.forEach(function (r) {
                                if (r.to == data.to) {
                                    toClient.push(record);
                                }
                            });
                            client.emit('getRecord',toClient);
                        }
                    })
                }
            })
        });
        //好友验证
        socket.on('agreeFriend',function(data,fn){
            fn('ok');
            var clients = io.sockets.clients();
            clients.forEach(function(client){
                if(client.name == data.to){
                    client.emit('agreeFriend',data);
                }
            });
        });
    });
}