module.exports = function(io){
    //存储在线用户
    var users = [];
    io.sockets.on('connection',function(socket){
        //接收用户上线
        socket.on('online',function(data){
            socket.name = data.user;
            //数组中不存在该用户名则插入该用户名
            if(users.indexOf(data.user) == -1){
                users.unshift(data.user);
            }
            console.log(users);
            io.sockets.emit('online',{users:users,name:data.user});
        })
        //接收用户下线
        socket.on('disconnect',function(){
            //如果用户名在在线用户数组中
            if(users.indexOf(socket.name) != -1){
                users.splice(users.indexOf(socket.name),1);
                socket.broadcast.emit('offline',{name:socket.name});
            }
        })
        //私信聊天
        socket.on('selfTalk',function(data,fn){
            fn("ok");
            var clients = io.sockets.clients();
            clients.forEach(function(client){
                if(client.name == data.to){
                    client.emit('selfTalk',data);
                }
            })

        })
    });
}