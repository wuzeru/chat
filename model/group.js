var db = require('./db');
var models = require('./models');

var Groups = models.Group;
function Group (){};
module.exports = Group;

//获取群信息
Group.get = function(groupName,callback){
    Groups.findOne({name:groupName},function(err,doc){
        if(err){
            return callback(err);
        }
        if(doc){
            return callback(err,doc);   //查询成功，返回目标群
        }else{
            return callback(err,null);  //查询失败，目标群不存在，返回空值
        }
    })
}
//建立新群
Group.establish = function(group,callback){
    Group.get(group.name,function(err,doc){
        if(err){
            throw err;
        }
        if(!doc){  //目标群不存在，建立新群并返回新文档
            var newGroup = new Groups(group);
            newGroup.save(function(err,doc){
                if(err) throw err;
                return callback(err,doc);
            })
        }else{  //目标群存在，返回空值
            return callback(err,null);
        }
    })
};
//添加成员
Group.addMember = function(memberName,groupName,callback){
    Group.get(groupName,function(err,doc){
        if(err){
            return callback(err);
        }
        if(doc){
            if(doc.member.indexOf(memberName) == -1){   //如果该成员不在目标群中，添加该成员并返回文档
                doc.member.push(memberName);
                doc.save(function(err,result){
                    if(err){
                        return callback(err);
                    }
                    return callback(err,result);
                })
            }else{                                      //如果该成员已经是目标群成员，返回‘Failed’
                return callback(err,'Failed');
            }
        }else{                                          //如果目标群不存在，返回空值
            return callback(err,null);
        }
    })
};
//踢出成员
Group.removeMember = function(memberName,groupName,callback){
    Group.get(groupName,function(err,doc){
        if(err){
            return callback(err);
        }
        if(doc){
            if(doc.member.indexOf(memberName) != -1){   //如果该成员在目标群中，踢出该成员并返回文档
                doc.member.splice(doc.member.indexOf(memberName),1);
                doc.save(function(err,result){
                    if(err){
                        return callback(err);
                    }
                    return callback(err,result);
                })
            }else{                                      //如果该成员不是目标群成员，返回‘Failed’
                return callback(err,'Failed');
            }
        }else{                                          //如果目标群不存在，返回空值
            return callback(err,null);
        }
    })
};
Group.saveRecord = function(groupName,talkRecord,callback){
    Group.get(groupName,function(err,group){
        if(err) throw err;
        if(group){

        }
    })
}