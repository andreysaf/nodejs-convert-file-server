const express = require('express');
const fs = require('fs');
const path = require('path');
const mimeType = require('./modules/mimeType');
const port = 9000;

const app = express();

app.get('/files', (req, res) => {
  fs.readdir('./files', function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    res.setHeader('Content-type', mimeType['.json']);
    res.end(JSON.stringify(files));
  });
});

app.get('/files/:fileName', (req, res) => {
  const pathname = `./files/${req.params.fileName}`;
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

app.listen(port, () =>
  console.log(
    `nodejs-convert-file-server listening at http://localhost:${port}`,
  ),
);
