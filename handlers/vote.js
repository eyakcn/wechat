module.exports.getHandler = function() {
  return new sophone.VoteHandler();
};

sophone = {};
var fs = require('fs');

sophone.VoteHandler = function() {
  this.store = {
    voteRequest: {} // use to calculate timeout request
  };
  this.voteJson = require('./vote/vote.json');
  this.recordFile = './voteRecord.json';
  this.resultFile = './voteResult.json';

  this.store.voteRecord = fs.existsSync(this.recordFile) ? require(this.recordFile) : {}; // use to record each user's choice
  this.store.voteResult = fs.existsSync(this.resultFile) ? require(this.resultFile) : {}; // use to record each option vote count
  console.log(this.store);
};

sophone.VoteHandler.prototype.handleClick = function(session) {
  var user = session.incomingMessage['FromUserName'];
  var seconds = Number(session.incomingMessage['CreateTime']);
  this.store.voteRequest[user] = seconds;

  if (this.voteJson) {
    var deadline = new Date(this.voteJson.deadline);
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    if (deadline.getTime() <= yesterday.getTime()) {
      var lines = '本次投票已于' + this.voteJson.deadline + '结束。\n';
      if (!!this.store.voteRecord[user]) {
        lines += '您的投票： ' + this.store.voteRecord[user] + '\n';
      }
      session.replyTextMessage(lines);
      return true;
    }
    var text = this.voteJson.title + '\n';
    text += '(截止日期： ' + this.voteJson.deadline + ')\n\n';
    for (var i = 0; i < this.voteJson.options.length; i++) {
      var option = this.voteJson.options[i];
      text += '\t' + (i + 1) + ') ' + option + '\n';
    }
    text += '请回复数字，时效1分钟。\n\n';
    if (!!this.store.voteRecord[user]) {
      text += '您上次投票为： ' + this.store.voteRecord[user] + '\n';
    }
    session.replyTextMessage(text);
  } else {
    session.replyTextMessage('No vote data founded.');
  }
};

sophone.VoteHandler.prototype.handleText = function(session) {
  var user = session.incomingMessage['FromUserName'];
  if (!!!this.store.voteRequest[user]) {
    return false;
  }
  var time = this.store.voteRequest[user];
  var seconds = Number(session.incomingMessage['CreateTime']);
  if ((seconds - time) > 60) {
    this.store.voteRequest[user] = undefined;
    session.replyTextMessage('对不起，您的投票已超时。');
    return true;
  }
  var content = session.incomingMessage['Content'].trim();
  if (/^\d+$/.test(content)) {
    var vote = parseInt(content);
    if (!!!this.voteJson) {
      this.store.voteRequest[user] = undefined;
      session.replyTextMessage('No vote data founded.');
      return true;
    }
    var max = this.voteJson.options.length;
    if (vote < 1 || vote > max) {
      this.store.voteRequest[user] = seconds;
      session.replyTextMessage('请输入合法数字： 1 ~ ' + max);
      return true;
    } else {
      this.store.voteRequest[user] = undefined;
      var previousVote = this.store.voteRecord[user];
      this.store.voteRecord[user] = vote;
      fs.writeFile(this.recordFile, JSON.stringify(this.store.voteRecord, null, 2), function(err) {
        if (err) {
          console.log(err);
        }
      });
      if (previousVote != undefined) {
        this.store.voteResult[previousVote] -= 1;
      }
      var count = this.store.voteResult[vote];
      if (count == undefined) {
        this.store.voteResult[vote] = 1;
      } else {
        count++;
        this.store.voteResult[vote] = count;
      }
      fs.writeFile(this.resultFile, JSON.stringify(this.store.voteResult, null, 2), function(err) {
        if (err) {
          console.log(err);
        }
      });
      session.replyTextMessage('投票成功，谢谢参与！');
      return true;
    }
  } else {
    this.store.voteRequest[user] = seconds;
    session.replyTextMessage('请输入数字完成投票。');
    return true;
  }
};