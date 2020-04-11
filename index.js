const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFNet } = require('@pdftron/pdfnet-node');
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

app.get('/optimize/:filename', (req, res) => {
  const pathname = './files/';
  const filename = req.params.filename;

  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromFilePath(pathname+filename);
    await doc.initSecurityHandler();
  
    // compress
    const image_settings = new PDFNet.Optimizer.ImageSettings();
  
    image_settings.setCompressionMode(
      PDFNet.Optimizer.ImageSettings.CompressionMode.e_jpeg,
    );
  
    const opt_settings = new PDFNet.Optimizer.OptimizerSettings();
    opt_settings.setColorImageSettings(image_settings);
    opt_settings.setGrayscaleImageSettings(image_settings);
  
    await PDFNet.Optimizer.optimize(doc, opt_settings);
  
    // flattener
    const fl = await PDFNet.Flattener.create();
    await fl.process(doc, PDFNet.Flattener.Mode.e_fast);
  
    // viewer optimizer
    const opts = new PDFNet.PDFDoc.ViewerOptimizedOptions();
    opts.setThumbnailRenderingThreshold(0);
  
    await doc.saveViewerOptimized(`${pathname}optimized_${filename}`, opts);
  };
  
  // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
  PDFNet.runWithCleanup(main)
    .catch(function (error) {
      console.log('Error: ' + JSON.stringify(error));
      res.statusCode = 500;
      res.end(`Error : ${JSON.stringify(error)}.`);
    })
    .then(function () {
      PDFNet.shutdown();
      const newpath = `${pathname}optimized_${filename}`;
      fs.readFile(newpath, function (err, data) {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          const ext = path.parse(newpath).ext;
          // if the file is found, set Content-type and send data
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    });
});

app.get('/files/:filename', (req, res) => {
  const pathname = `./files/${req.params.filename}`;
  fs.readFile(pathname, function (err, data) {
    if (err) {
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    } else {
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
