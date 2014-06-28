var http = require("http"),
  url = require("url"),
  querystring = require("querystring"),
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
  var query = querystring.parse(parseRes.query);
  var signature = query.signature;
  var echostr = query.echostr;
  var timestamp = query.timestamp;
  var nonce = query.nonce;

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