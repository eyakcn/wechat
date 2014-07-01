module.exports.getHandler = function() {
  return new sophone.BasicHandler();
};

sophone = {};
var fs = require('fs');

sophone.BasicHandler = function() {};

sophone.BasicHandler.prototype.handleText = function(session) {
  var content = session.incomingMessage['Content'];
  var replyText;
  try {
    replyText = eval(content.toString());
  } catch (err) {
    replyText = err.message;
  }
  session.replyTextMessage(replyText.toString());
};

sophone.BasicHandler.prototype.handleVoice = function(session) {
  session.replyMessage({
    Title: 'Let it go',
    MsgType: 'music',
    Description: 'Listen to this music and guess ths singer',
    MusicUrl: 'http://a.tumblr.com/tumblr_mx24nfZOXQ1t19zt0o1.mp3',
    HQMusicUrl: 'http://a.tumblr.com/tumblr_mx24nfZOXQ1t19zt0o1.mp3'
  });
};

sophone.BasicHandler.prototype.handleImage = function(session) {
  session.replyTextMessage('Oops! You send me an image, why?');
};

sophone.BasicHandler.prototype.handleClick = function(session) {
  session.replyTextMessage('Oops! This button does not work.');
};