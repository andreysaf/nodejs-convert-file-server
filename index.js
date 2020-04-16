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
  const ext = path.parse(pathname + filename).ext;

  if (ext !== '.pdf') {
    res.statusCode = 500;
    res.end(`Only PDFs can be optimized. Cannot optimize file with extension: ${ext}.`);
  }

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

    // viewer optimizer + linearization
    const opts = new PDFNet.PDFDoc.ViewerOptimizedOptions();
    opts.setThumbnailRenderingThreshold(0);
  
    await doc.saveViewerOptimized(`${pathname}optimized_${filename}`, opts);
  };

  const newpath = `${pathname}optimized_${filename}`;
  PDFNetEndpoint(main, newpath, res);
});

app.get('/thumbnail/:filename', (req, res) => {
  const pathname = './files/';
  const filename = req.params.filename;
  let ext = path.parse(pathname + filename).ext;

  if (ext !== '.pdf') {
    res.statusCode = 500;
    res.end(`Only PDFs can return a thumbnail. Cannot return a thumb for a file with extension: ${ext}.`);
  }

  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromFilePath(pathname+filename);
    await doc.initSecurityHandler();
    const pdfdraw = await PDFNet.PDFDraw.create(92);
    const itr = await doc.getPageIterator(1);
    const currPage = await itr.current();
    await pdfdraw.export(currPage, `${pathname}${filename}.png`, 'PNG');
  };

  const newpath = `${pathname}${filename}.png`;
  PDFNetEndpoint(main, newpath, res);
});

app.get('/convert/:filename', (req, res) => {
  const pathname = './files/';
  const filename = req.params.filename;
  let ext = path.parse(pathname + filename).ext;

  if (ext === '.pdf') {
    res.statusCode = 500;
    res.end(`File is already PDF.`);
  }

  const main = async () => {
    const pdfdoc = await PDFNet.PDFDoc.create();
    await pdfdoc.initSecurityHandler();
    const inputFile = pathname+filename;
    await PDFNet.Convert.toPdf(pdfdoc, inputFile);
    pdfdoc.save(`${pathname}${filename}.pdf`, PDFNet.SDFDoc.SaveOptions.e_linearized);
    ext = '.pdf';
  };

  const newpath = `${pathname}${filename}.pdf`;
  PDFNetEndpoint(main, newpath, res);
});

app.get('/files/:filename', (req, res) => {
  const pathname = `./files/${req.params.filename}`;
  fs.readFile(pathname, function (err, data) {
    if (err) {
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    } else {
      const ext = path.parse(pathname).ext;
      res.setHeader('Content-type', mimeType[ext] || 'text/plain');
      res.end(data);
    }
  });
});

const PDFNetEndpoint = (main, pathname, res) => {
    PDFNet.runWithCleanup(main)
    .catch(function (error) {
      res.statusCode = 500;
      res.end(`Error : ${JSON.stringify(error)}.`);
    })
    .then(function () {
      PDFNet.shutdown();
      fs.readFile(pathname, function (err, data) {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          const ext = path.parse(pathname).ext;
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    });
};

app.listen(port, () =>
  console.log(
    `nodejs-convert-file-server listening at http://localhost:${port}`,
  ),
);