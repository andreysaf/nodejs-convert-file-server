const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const mimeType = require('./modules/mimeType');
const port = 9000;

http
  .createServer(function (req, res) {
    console.log(`${req.method} ${req.url}`);

    // parse URL
    const parsedUrl = url.parse(req.url);
    const sanitizePath = path
      .normalize(parsedUrl.pathname)
      .replace(/^(\.\.[\/\\])+/, '');
    let pathname = path.join(__dirname, sanitizePath);

    fs.exists(pathname, function (exist) {
      if (!exist) {
        // if the file is not found, return 404
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }

      // if is a directory return the list of files
      if (fs.statSync(pathname).isDirectory()) {
        fs.readdir(pathname, function (err, files) {
          //handling error
          if (err) {
            return console.log('Unable to scan directory: ' + err);
          }

          var index = pathname.lastIndexOf('/');
          var reqPath = pathname.substring(index + 1);

          if (reqPath === 'files') {
            res.setHeader('Content-type', mimeType['.json'])
            res.end(JSON.stringify(files));
          } else {
            res.writeHead(404, {
              'Content-type': 'text/html'
            });
            res.end(`<h1>Incorrect Request</h1>`);
          }
          
        });
      }

      // read file from file system
      fs.readFile(pathname, function (err, data) {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          // based on the URL path, extract the file extention. e.g. .js, .doc, ...
          const ext = path.parse(pathname).ext;
          // if the file is found, set Content-type and send data
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    });
  })
  .listen(parseInt(port));

console.log(`Server listening on port ${port}`);
