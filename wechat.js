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
    MusicUrl: 'http://a.tumblr.com/tumblr_mx24nfZOXQ1t19zt0o1.mp3'
  });
});

var localStorage = {
  voteReq: {}
};
wechat.on('event.CLICK', function(session) {
  var replyText;
  switch (session.incomingMessage['EventKey']) {
    case 'VOTE_BTN':
      var user = session.incomingMessage['FromUserName'];
      var milliseconds = Number(session.incomingMessage['CreateTime']);
      localStorage.voteReq[user] = milliseconds;

      var voteJson = require('./vote.json');
      if (voteJson) {
        var text = voteJson.title + '\n';
        for (var i = 0; i < voteJson.options.length; i++) {
          var option = voteJson.options[i];
          text += '\t' + (i + 1) + ') ' + option + '\n';
        }
        text += '请回复数字，时效1分钟。'
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
  if (!!!localStorage.voteReq[user]) {
    return false;
  }
  var time = localStorage.voteReq[user];
  var milliseconds = Number(session.incomingMessage['CreateTime']);
  if ((milliseconds - time) > (60 * 1000)) {
    localStorage.voteReq[user] = undefined;
    session.replyTextMessage('对不起，您的投票已超时。');
    return true;
  }
  var content = session.incomingMessage['Content'].trim();
  if (/^\d+$/.test(content)) {
    var vote = parseInt(content);
    var voteJson = require('./vote.json');
    if (!!!voteJson) {
      localStorage.voteReq[user] = undefined;
      session.replyTextMessage('No vote data founded.');
      return true;
    }
    var max = voteJson.options.length;
    if (vote < 1 || vote > max) {
      localStorage.voteReq[user] = milliseconds;
      session.replyTextMessage('请输入合法数字： 1 ~ ' + max);
      return true;
    } else {
      localStorage.voteReq[user] = undefined;
      session.replyTextMessage('投票成功，谢谢参与！');
      // TODO record vote status, avoid duplicated
      return true;
    }
  } else {
    localStorage.voteReq[user] = milliseconds;
    session.replyTextMessage('请输入数字完成投票。');
    return true;
  }
}

app.listen(80);