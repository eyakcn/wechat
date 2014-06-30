var testCert = {
  appid: 'wx1d4c4ee6f1855c63',
  secret: 'ed1999df4efe615b7e01a4d27a74db54'
};
var testButton = {
  "button": [{
    "type": "view",
    "name": "Vote",
    "url": "http://126.73.253.17/vote.html"
  }]
};
// var huaButton = '{\n' +
//   '  "button": [{\n' +
//   '    "name": "' + encodeURIComponent("查询") + '",\n' +
//   '    "sub_button": [{\n' +
//   '      "type": "view",\n' +
//   '      "name": "' + encodeURIComponent("教学管理") + '",\n' +
//   '      "url": "http://222.72.92.106/eams/index.do?isShowLogin=true"\n' +
//   '    }, {\n' +
//   '      "type": "view",\n' +
//   '      "name": "' + encodeURIComponent("图书馆") + '",\n' +
//   '      "url": "http://www.tsg.ecupl.edu.cn/"\n' +
//   '    }]\n' +
//   '  }]\n' +
//   '}';

var huaButton = {
  "button": [{
    "name": "查询",
    "sub_button": [{
      "type": "view",
      "name": "教学管理",
      "url": "http://222.72.92.106/eams/index.do?isShowLogin=true"
    }, {
      "type": "view",
      "name": "图书馆",
      "url": "http://www.tsg.ecupl.edu.cn/"
    }]
  }, {
    "type": "click",
    "name": "投票",
    "key": "VOTE_BTN"
  }]
};

weixin(testCert, huaButton);

function weixin(cert, button) {
  var https = require("https"),
    querystring = require("querystring");

  setupWeixin();

  function setupWeixin() {
    var query = querystring.stringify({
      grant_type: 'client_credential',
      appid: cert.appid,
      secret: cert.secret
    });

    // Set up the request
    https.get('https://api.weixin.qq.com/cgi-bin/token?' + query, function(res) {
      res.on('data', function(data) {
        var accessToken = JSON.parse(data)['access_token'];
        createMenu(accessToken);
      });
    }).on('error', function(e) {
      console.error(e);
    });
  }

  function createMenu(accessToken) {
    // Build the post string from an object
    var buttonDef = JSON.stringify(button);

    var escapedStr = encodeURI(buttonDef);
    if (escapedStr.indexOf("%") != -1) {
      var count = escapedStr.split("%").length - 1;
      if (count == 0) count++;
      var tmp = escapedStr.length - (count * 3);
      count = count + tmp;
    } else {
      count = escapedStr.length;
    }

    // An object of options to indicate where to post to
    var options = {
      host: 'api.weixin.qq.com',
      port: '443',
      path: '/cgi-bin/menu/create?access_token=' + accessToken,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': count
      }
    };

    // Set up the request
    var post_req = https.request(options, function(res) {
      res.on('data', function(data) {
        var err = JSON.parse(data)
        if (err.errcode != 0) {
          console.log('Create Menu Failure: ' + err.errmsg);
        }
      });
    }).on('error', function(e) {
      console.error(e);
    });

    // post the data
    post_req.write(buttonDef);
    post_req.end();
  }
}