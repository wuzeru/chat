var socket = io.connect();//创建socket
var groupTalk = io.connect('/groupTalk');//创建群聊socket
var talkNews = {};
var to;
var chatRecord = [];//私信聊天记录
var chatRecordGroup = [];//群聊天记录

//在好友列表中动态显示好友
function showFriend(name, callback) {
    $("#friendList").append('<p id="fl_'+name+'" class="friendList">' +
        '<span class="fl1">' + name + '</span>' +
        '<span class="fl2"><span class="glyphicon glyphicon-comment "></span></span>' +
        '<span class="fl3"></span>' +
        '</p>'
    );
    return callback();
};
//在群列表中动态显示群
function showGroup(gname) {
    $("#groupList").append('<p id="fl_group_'+gname+'" class="friendList">' +
        '<span class="fl1">' + gname + '</span>' +
        '<span class="fl2" style="display: inline ! important;"><span class="glyphicon glyphicon-comment "></span></span>' +
        '<span class="fl3"></span>' +
        '</p>'
    )
};

$(document).ready(function () {
//搜索好友
    $("#search").on("click", function () {
        if($("#searchSwitch").text() == "搜好友"){
            $.get("search", {fname: $("#friendname").val()}, function (data) {
                if (data != 'null') {
                    $("#friendshow").text(data.username);
                } else {
                    $("#friendshow").text("该用户不存在");
                }
            })
        }else {
            $.get('searchGroup',{gname:$("#friendname").val()},function(data){
                if(data != 'null'){
                    $("#friendshow").text(data.name);
                } else {
                    $("#friendshow").text("该群不存在！");
                }
            })
        }

    });
//发送添加好友请求
    $("#toAddFriend").on('click', function () {
        if($("#searchSwitch").text() == "搜好友"){
            var message = {
                type:"friendApply",
                date:new Date(),
                from:username
            }
            var from = username;
            if (username == $("#friendname").val()) {
                alert("不能添加自己为好友！");
                $("#modalClose").click();
            } else {
                socket.emit('agreeFriend', {to:$("#friendname").val(),message:message}, function (fn) {
                    if (fn == 'ok') {
                        alert("请求发送！");
                        $("#modalClose").click();
                    } else {
                        alert("该用户已经是你的好友！");
                        $("#modalClose").click();
                    }
                });
            }
        }else {
            var message = {
                type:"groupApply",
                date:new Date(),
                from:username,
                gname:$("#friendname").val()
            }
            var from = username;
            socket.emit('applyToGroup', {message:message}, function (fn) {
                if (fn == 'ok') {
                    alert("请求发送！");
                    $("#modalClose").click();
                } else {
                    alert("你已经是该群成员了！");
                    $("#modalClose").click();
                }
            });
        }


    });

//接收验证信息
    socket.on('receiveMSG', function (data) {
        var from = data.message.from;

        $("#msgShow").show();
        if(data.message.type == "friendApply"){
            $("#infoShow #friend").append('<p id="msg_'+data.message.from+'"><span>'+data.message.from +'</span><span>请求加你为好友</span>&nbsp;'+
                '<span class="agree"><i class="glyphicon glyphicon-ok"></i></span>&nbsp;'+
                '<span class="disagree"><i class="glyphicon glyphicon-remove"></i></span></p>'
            );
        }else if(data.message.type == "groupApply"){
            $("#infoShow #group").append('<p id="msg_group_'+data.message.from+'"><span>'+data.message.from +'</span><span> 请求加入</span><span>'+data.message.gname+'</span>&nbsp;'+
                '<span class="agree"><i class="glyphicon glyphicon-ok"></i></span>&nbsp;'+
                '<span class="disagree"><i class="glyphicon glyphicon-remove"></i></span></p>'
            );
        }
    });
//同意验证
    $(".agree").live('click', function () {
        if($(this).parent().parent().attr("id") == "friend"){
            var fname = $(this).prev().prev().text();
            socket.emit('friendPass', {fname:fname,name:username}, function (data) {
                if (data.result == 'ok') {
                    alert('用户添加成功');
                    $("#msg_"+fname).remove();
                    if(data.length === 0){
                        $("#modalClosei").click();
                        $("#msgShow").hide();
                    }
                    showFriend(fname, function () {
                        socket.emit('isFriendOnline',fname, function (fn) {
                            if (fn == "yes") {
                                //显示用户上线
                                $("#fl_"+fname+" .fl2").show();
                            }
                        })
                    });
                }
            })
        }else {
            var fname = $(this).prev().prev().prev().text();
            var gname = $(this).prev().text();
            socket.emit('groupPass', {fname:fname,name:username,gname:gname}, function (data) {
                if (data.result == 'ok') {
                    alert('用户入群成功');
                    $("#msg_group_"+fname).remove();
                    if(data.length === 0){
                        $("#modalClosei").click();
                        $("#msgShow").hide();
                    }
                }
            })
        }

    });
//移除一条message
    $(".disagree").live('click',function(){
        var fname;
        var messageType;
        if($(this).parent().parent().attr("id") == "friend"){
            fname = $(this).prev().prev().prev().text();
            messageType = "friendApply";
        }else{
            fname = $(this).prev().prev().prev().prev().text();
            messageType = "groupApply";
        }
        socket.emit('removeMessage', {name: username, fname: fname,messageType:messageType}, function (length) {
            alert('移除成功！');
            if(messageType == "friendApply"){
                $("#msg_" + fname).remove();
            }else {
                $("#msg_group_" + fname).remove();
            }
            if (length === 0) {
                $("#modalClosei").click();
                $("#msgShow").hide();
            }
        })
    });
//好友验证被通过
    socket.on('friendPass', function (name) {
        showFriend(name, function () {
            //显示用户在线
            $("#fl_"+name+" .fl2").show();
        });
    });
//入群验证被通过
    socket.on('groupPass',function(gname){
        showGroup(gname);
    });

//建立新群
    $('#groupConfirm').on('click', function () {
        $.post('groupEstablish', {name: $("#groupName").val(),leader:username}, function (info) {
            if (info == 'ok') {
                alert('成功建群！');
                showGroup($("#groupName").val());
                $('#modalCloseG').click();
            } else {
                alert('该群已存在！');
            }
        })
    });

//打开聊天框
    $(".fl2").live('click', function () {
        to = $(this).prev().text();

        if ($("#nameShow").text() != to) {
            $("#talkcon").text("");
        }
        $("#nameShow").text(to);
        if ($("#fl_" + to + " .fl3").text() != "") {
            $("#fl_" + to + " .fl3").text("");
        }
        if ($("#fl_group_" + to + " .fl3").text() != "") {
            $("#fl_group_" + to + " .fl3").text("");
        }
        if(isGroup === 0){
            $.post('getRecord',{name:username,fname:to},function(data){
                if(data != 'null'){
                    var records = data;
                    for(var i=0;i<records.length;i++){
                        if(records[i].name === username){ //如果是用户自己发言，用sendNews
                            sendNews(records[i].name,records[i].date,records[i].talk);
                        }else{  //如果是好友发言，用receiveNews
                            receiveNews(records[i].name,records[i].date,records[i].talk);
                        }
                    }
                }
            });
            if(chatRecord.length != 0){
                for (var i = 0; i < chatRecord.length; i++) {
                    if (chatRecord[i].from === to) {
                        chatRecord[i].talkRecord.forEach(function (talkRecord) {
                            if(talkRecord.talk.length > 0)
                                receiveNews(chatRecord[i].from, talkRecord.date,talkRecord.talk);
                        });
                        chatRecord[i].talk=[];
                        break;
                    }
                }
            }
        }else{
            $.post('getGroupRecord',{gname:$('#nameShow').text()},function(data){
                if(data != 'null'){
                    var records = data;
                    for(var i=0;i<records.length;i++){
                        if(records[i].name === username){ //如果是用户自己发言，用sendNews
                            sendNews(records[i].name,records[i].date,records[i].talk);
                        }else{  //如果是好友发言，用receiveNews
                            receiveNews(records[i].name,records[i].date,records[i].talk);
                        }
                    }
                }
            });
            if(chatRecordGroup.length != 0 ){
                for (var i=0 ; i<chatRecordGroup.length;i++){
                    if(chatRecordGroup[i].group === to){
                        //如果该群有未读消息
                        if(chatRecordGroup[i].records.length > 0){
                            chatRecordGroup[i].records.forEach(function(record){
                                receiveNews(record.from,record.date,record.talk);
                            })
                            chatRecordGroup[i].records = [];
                        }
                        break;
                    }
                }
            }
        }
        $("#talkShow").show();
    });
//接收用户上线通知
    socket.on('online', function (data) {
        //显示用户上线
        $('.fl1').each(function (index) {
            if (data.users.indexOf($(this).text()) != -1) {
                $(this).next().show();
            }
        });
    });
//接收用户下线通知
    socket.on('offline', function (data) {
        $('.fl1').each(function () {
            if ($(this).text() === data.name) {
                $(this).next().hide();
            }
        })
    });
//发送消息
    $("#talkSend").live('click',function() {
        if (isGroup == 0) {
            if (!talkNews.from) {
                talkNews.from = to;
            }
            var date = new Date();
            var dateShow = date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            socket.emit("selfTalk",
                {from: username,
                    to: talkNews.from,
                    talk: $("#talk").val(),
                    date: dateShow},
                function (info) {
                    if (info == 'ok') {
                        sendNews(username,dateShow,$("#talk").val());
                        $("#talk").val("");
                    }
                })
        } else {
            var date = new Date();
            var dateShow = date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            groupTalk.emit("groupTalk", {
                group: $('#nameShow').text(),
                from: username,
                talk: $('#talk').val(),
                date:dateShow
            }, function (info) {
                if (info == "ok") {
                    sendNews(username,dateShow,$('#talk').val());
                    $('#talk').val('');
                }
            })
        }
    });
//接受群聊消息
    groupTalk.on('groupTalk', function (data) {
        if (data.from != username) {
            //显示未读消息
            if ($("#talkShow").css("display") == 'none' || $("#nameShow").text() != data.group) {
                //如果未读群聊天记录为空，将这条记录作为第一条记录
                if (chatRecordGroup.length === 0) {
                    chatRecordGroup = [{
                        group:data.group,
                        records:[{
                            from:data.from,
                            talk:data.talk,
                            date:data.date
                        }]
                    }];
                    $("#fl_group_"+data.group+" .fl3").text(chatRecordGroup[0].records.length);
                } else {
                    //群聊天记录已有记录，找到该群所在位置
                    var p = GroupInChatRecord(chatRecordGroup, data.group);

                    //该群还有没在未读群聊天记录里保存
                    if (p === -1) {
                        var chatRGroup = {
                            group:data.group,
                            records:[{
                                from:data.from,
                                talk:data.talk,
                                date:data.date
                            }]
                        }
                        var length = chatRecordGroup.push(chatRGroup);
                        $("#fl_group_"+data.group+" .fl3").text(chatRecordGroup[length - 1].records.length);

                    } else{  //该群已经在未读群聊天记录里报错
                        chatRecordGroup[p].records.push({
                            from:data.from,
                            talk:data.talk,
                            date:data.date
                        });
                        $("#fl_group_"+data.group+" .fl3").text(chatRecordGroup[p].records.length);
                    }
                }
            } else {                     //直接显示消息
                receiveNews(data.from,data.date,data.talk);
            }
        }
    })
//接收私信消息
    socket.on('selfTalk', function (data) {
        talkNews.from = data.from;

        //显示未读消息
        if ($("#talkShow").css("display") == 'none' || $("#nameShow").text() != data.from) {
            if (chatRecord.length === 0) {
                var chatR = {
                    from:data.from,
                    talkRecord:[{date:data.date,talk:data.talk}]
                }
                chatRecord.push(chatR);
                $("#fl_" + data.from + " .fl3").text(chatRecord[0].talkRecord.length);
            } else {
                var p = FromInChatRecord(chatRecord, data.from);
                if (p < 0) {
                    var talkRecord = [{date:data.date,talk:data.talk}];
                    var length = chatRecord.push({from: data.from, talkRecord: talkRecord});
                    $("#fl_" + data.from + " .fl3").text(chatRecord[length - 1].talkRecord.length);

                } else {
                    chatRecord[p].talkRecord.push({date:data.date,talk:data.talk});
                    $("#fl_" + data.from + " .fl3").text(chatRecord[p].talkRecord.length);
                }
            }
        } else {                     //直接显示消息
            receiveNews(data.from,data.date,data.talk);
        }

    });
//判断私信聊天记录中是否存在记录,返回数组下标
    function FromInChatRecord(chatRecord, from) {
        for (var i = 0; i < chatRecord.length; i++) {
            if (chatRecord[i].from == from) {
                return i;
                break;
            }
        }
        return -1;
    }
//判断群聊天记录中是否存在记录,返回数组下标
    function GroupInChatRecord(chatRecordGroup,group){
        for(var i=0 ;i<chatRecordGroup.length;i++){
            if(chatRecordGroup[i].group == group){
                return i;
            }
        }
        return -1;
    }

//关闭聊天框
    $('#closeTalkShow').on('click', function () {
        var record = {};//单条聊天的数据格式（json）
        var records = []; //保存聊天记录的数组

        //如果聊天框里有内容，将该内容保存进数据库
        if($('#talkcon').text()){
            function addRecords(callback){
                $(".record").each(function () {
                    if($(this).children().attr('class') == "to"){
                        record.name = $(this).children().find(".sendUser").text();
                        record.date = $(this).children().find(".sendDate").text();
                        record.talk = $(this).children().find(".send").text();
                        records.push(record);
                    }else {
                        record.name = $(this).children().find(".receiveUser").text();
                        record.date = $(this).children().find(".receiveDate").text();
                        record.talk = $(this).children().find(".receive").text();
                        records.push(record);
                    }
                });
                return callback();
            }
            //如果是私信聊天
            if(isGroup === 0){
                addRecords(function(){
                    $.post('recordAppend',{name:username,fname:$("#nameShow").text(),records:records},function(){
                        $("#nameShow").text("");
                        $("#talkcon").text("");
                        $("#talkShow").hide();
                    })
                })
            }else{ //如果是群聊
                addRecords(function(){
                    $.post('appendGroupRecord',{gname:$("#nameShow").text(),records:records},function(){
                        alert(records);
                        $("#nameShow").text("");
                        $("#talkcon").text("");
                        $("#talkShow").hide();
                    })
                })
            }

        }else{
            $("#nameShow").text("");
            $("#talkcon").text("");
            $("#talkShow").hide();
        }
    });
//格式化发送消息
    function sendNews(from,date,talk) {
        var r = "<div class='record'><div class='to'><div class='talkArea'><div class='sendDate'>"+date+"</div></br><div><span class='send'><span class='arrow'></span>" + talk + "</span><span class='sendUser'>"+from+"</span></div></div></div></div>";
        $("#talkcon").append(r);
    };
//格式化消息接受
    function receiveNews(from,date,talk) {
        var r = "<div class='record'><div class='from'><div class='talkArea'><div class='receiveDate'>"+date+"</div><div><span class='receiveUser'>"+from+"</span><span class='receive'><span class='arrow'></span>" + talk + "</span></div></div></div></div>";
        $("#talkcon").append(r);
    };

})


