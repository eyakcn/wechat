var express = require('express');
var middlewares = require('express-middlewares-js');

var app = express();
app.use('/weixin', middlewares.xmlBodyParser({
  type: 'text/xml'
}));

var basicHandler = require('./handlers/basic.js').getHandler();
var voteHandler = require('./handlers/vote.js').getHandler();

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
  var handled = false;
  handled = handled || voteHandler.handleText(session);
  handled = handled || basicHandler.handleText(session);
});
wechat.on('image', function(session) {
  basicHandler.handleImage();
});
wechat.on('voice', function(session) {
  basicHandler.handleVoice();
});

wechat.on('event.CLICK', function(session) {
  switch (session.incomingMessage['EventKey']) {
    case 'VOTE_BTN':
      voteHandler.handleClick(session);
      break;
    default:
      basicHandler.handleClick(session);
  }
});

app.listen(80);