var testCert = {
  appid: 'wx1d4c4ee6f1855c63',
  secret: 'ed1999df4efe615b7e01a4d27a74db54'
};
var testButton = {
  "button": [{
    "type": "view",
    "name": "Search",
    "url": "http://www.soso.com/"
  }, {
    "type": "view",
    "name": "Video",
    "url": "http://v.qq.com/"
  }]
};

weixin(testCert, testButton);

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

    // An object of options to indicate where to post to
    var options = {
      host: 'api.weixin.qq.com',
      port: '443',
      path: '/cgi-bin/menu/create?access_token=' + accessToken,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': buttonDef.length
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