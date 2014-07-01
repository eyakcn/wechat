var express = require('express');
var fs = require('fs');
var app = express();
var middlewares = require('express-middlewares-js');
app.use('/weixin', middlewares.xmlBodyParser({
  type: 'text/xml'
}));

/*
  Alternative way

var xmlBodyParser = require('express-xml-parser');
app.use('/weixin', xmlBodyParser({
  type: 'text/xml',
  limit: '1mb'
}));

*/

var Wechat = require('nodejs-wechat');
var opt = {
  token: 'yuan',
  url: '/weixin'
};
var wechat = new Wechat(opt);

app.get('/weixin', wechat.verifyRequest.bind(wechat));
app.post('/weixin', wechat.handleRequest.bind(wechat));

// you can also work with other restful routes
app.use('/api', middlewares.bodyParser());

wechat.on('text', function(session) {
  if (handleVote(session)) {
    return;
  }
  var content = session.incomingMessage['Content'];
  var replyText;
  try {
    replyText = eval(content.toString());
  } catch (err) {
    replyText = err.message;
  }
  session.replyTextMessage(replyText.toString());
});
wechat.on('image', function(session) {
  session.replyTextMessage('Oops! You send me an image, why?');
});
wechat.on('voice', function(session) {
  session.replyMessage({
    Title: 'Let it go',
    MsgType: 'music',
    Description: 'Listen to this music and guess ths singer',
    MusicUrl: 'http://a.tumblr.com/tumblr_mx24nfZOXQ1t19zt0o1.mp3',
    HQMusicUrl: 'http://a.tumblr.com/tumblr_mx24nfZOXQ1t19zt0o1.mp3'
  });
});

var localStorage = {
  voteRequest: {} // use to calculate timeout request
};
localStorage.voteRecord = fs.existsSync('./voteRecord.json') ? require('./voteRecord.json') : {}; // use to record each user's choice
localStorage.voteResult = fs.existsSync('./voteResult.json') ? require('./voteResult.json') : {}; // use to record each option vote count

wechat.on('event.CLICK', function(session) {
  var replyText;
  switch (session.incomingMessage['EventKey']) {
    case 'VOTE_BTN':
      var user = session.incomingMessage['FromUserName'];
      var seconds = Number(session.incomingMessage['CreateTime']);
      localStorage.voteRequest[user] = seconds;

      var voteJson = require('./vote.json');
      if (voteJson) {
        var deadline = new Date(voteJson.deadline);
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        if (deadline.getTime() <= yesterday.getTime()) {
          var lines = '本次投票已于' + voteJson.deadline + '结束。\n';
          if (!!localStorage.voteRecord[user]) {
            lines += '您的投票： ' + localStorage.voteRecord[user] + '\n';
          }
          session.replyTextMessage(lines);
          return true;
        }
        var text = voteJson.title + '\n';
        text += '(截止日期： ' + voteJson.deadline + ')\n\n';
        for (var i = 0; i < voteJson.options.length; i++) {
          var option = voteJson.options[i];
          text += '\t' + (i + 1) + ') ' + option + '\n';
        }
        text += '请回复数字，时效1分钟。\n\n';
        if (!!localStorage.voteRecord[user]) {
          text += '您上次投票为： ' + localStorage.voteRecord[user] + '\n';
        }
        session.replyTextMessage(text);
      } else {
        session.replyTextMessage('No vote data founded.');
      }
      break;
    default:
      session.replyTextMessage('Oops! This button does not work.');
  }
});

function handleVote(session) {
  var user = session.incomingMessage['FromUserName'];
  if (!!!localStorage.voteRequest[user]) {
    return false;
  }
  var time = localStorage.voteRequest[user];
  var seconds = Number(session.incomingMessage['CreateTime']);
  if ((seconds - time) > 60) {
    localStorage.voteRequest[user] = undefined;
    session.replyTextMessage('对不起，您的投票已超时。');
    return true;
  }
  var content = session.incomingMessage['Content'].trim();
  if (/^\d+$/.test(content)) {
    var vote = parseInt(content);
    var voteJson = require('./vote.json');
    if (!!!voteJson) {
      localStorage.voteRequest[user] = undefined;
      session.replyTextMessage('No vote data founded.');
      return true;
    }
    var max = voteJson.options.length;
    if (vote < 1 || vote > max) {
      localStorage.voteRequest[user] = seconds;
      session.replyTextMessage('请输入合法数字： 1 ~ ' + max);
      return true;
    } else {
      localStorage.voteRequest[user] = undefined;
      var previousVote = localStorage.voteRecord[user];
      localStorage.voteRecord[user] = vote;
      fs.writeFile('./voteRecord.json', JSON.stringify(localStorage.voteRecord, null, 2), function(err) {
        if (err) {
          console.log(err);
        }
      });
      if (previousVote != undefined) {
        localStorage.voteResult[previousVote] -= 1;
      }
      var count = localStorage.voteResult[vote];
      if (count == undefined) {
        localStorage.voteResult[vote] = 1;
      } else {
        count++;
        localStorage.voteResult[vote] = count;
      }
      fs.writeFile('./voteResult.json', JSON.stringify(localStorage.voteResult, null, 2), function(err) {
        if (err) {
          console.log(err);
        }
      });
      session.replyTextMessage('投票成功，谢谢参与！');
      return true;
    }
  } else {
    localStorage.voteRequest[user] = seconds;
    session.replyTextMessage('请输入数字完成投票。');
    return true;
  }
}

app.listen(80);