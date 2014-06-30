var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  port = process.argv[2] || 80;


http.createServer(function(request, response) {
  var parseRes = url.parse(request.url);
  var uri = parseRes.pathname;
  var filename = path.join(process.cwd(), uri);

  if (uri.indexOf('weixin') >= 0) {
    handleWeixin(parseRes, request, response);
  } else {
    handleStatic(filename, response);
  }

}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

function handleWeixin(parseRes, request, response) {
  var query = require("querystring").parse(parseRes.query);
  var signature = query.signature;
  var timestamp = query.timestamp;
  var nonce = query.nonce;

  if (request.method == 'GET') {
    handleGet(query, request, response);
  } else if (request.method == 'POST') {
    if (request.headers['content-type'] == "text/xml") {
      var xml2js = require('xml2js');
      var xml = "";
      request.on('data', function(chunk) {
        xml += chunk;
      });
      request.on('end', function() {
        xml2js.parseString(xml, function(err, json) {
          if (json && json.xml && json.xml.MsgType) {
            var type = json.xml.MsgType[0];
            if (type == 'text') {
              var content = json.xml.Content[0];
              response.writeHead(200);
              var replyText;
              try {
                replyText = eval(content.toString());
              } catch (err) {
                replyText = err.message;
              }
              var replyXml = makeReplyXml(xml, replyText);
              response.end(reply);
            }
          }
        });
      });
    }
  }

  function makeReplyXml(xml, text) {

  }

  function handleGet(query, request, response) {
    var echostr = query.echostr;
    if (echostr) {
      response.writeHead(200, {
        "Content-Type": "text/plain"
      });
      response.write(echostr);
    } else {
      response.writeHead(400, {
        "Content-Type": "text/plain"
      });
      response.write("400 Bad request\n");
    }
    response.end();
  }
}

function handleStatic(filename, response) {
  path.exists(filename, function(exists) {
    if (!exists) {
      response.writeHead(404, {
        "Content-Type": "text/plain"
      });
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if (err) {
        response.writeHead(500, {
          "Content-Type": "text/plain"
        });
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}