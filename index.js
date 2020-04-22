const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFNet } = require('@pdftron/pdfnet-node');
const mimeType = require('./modules/mimeType');
const port = 9000;
const filesPath = './files';

const app = express();

app.get('/files', (req, res) => {
  const inputPath = path.resolve(__dirname, filesPath);
  fs.readdir(inputPath, function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    res.setHeader('Content-type', mimeType['.json']);
    res.end(JSON.stringify(files));
  });
});

app.get('/files/:filename', (req, res) => {
  const inputPath = path.resolve(__dirname, filesPath, req.params.filename);
  fs.readFile(inputPath, function (err, data) {
    if (err) {
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    } else {
      const ext = path.parse(inputPath).ext;
      res.setHeader('Content-type', mimeType[ext] || 'text/plain');
      res.end(data);
    }
  });
});

app.get('/optimize/:filename', (req, res) => {
  const filename = req.params.filename;
  const ext = path.parse(filename).ext;

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(
    __dirname,
    filesPath,
    `optimized_${filename}`,
  );

  if (ext !== '.pdf') {
    throw `Only PDFs can be optimized. Cannot optimize file with extension: ${ext}.`;
  }

  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
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

    await doc.saveViewerOptimized(outputPath, opts);
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/thumbnail/:filename', (req, res) => {
  const filename = req.params.filename;
  let ext = path.parse(filename).ext;

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(__dirname, filesPath, `${filename}.png`);

  if (ext !== '.pdf') {
    throw `Only PDFs can return a thumbnail. Cannot return a thumb for a file with extension: ${ext}.`;
  }

  const main = async () => {
    const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
    await doc.initSecurityHandler();
    const pdfdraw = await PDFNet.PDFDraw.create(92);
    const currPage = await doc.getPage(1);
    await pdfdraw.export(currPage, outputPath, 'PNG');
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/convert/:filename', (req, res) => {
  const filename = req.params.filename;
  let ext = path.parse(filename).ext;

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(__dirname, filesPath, `${filename}.pdf`);

  if (ext === '.pdf') {
    res.statusCode = 500;
    res.end(`File is already PDF.`);
  }

  const main = async () => {
    const pdfdoc = await PDFNet.PDFDoc.create();
    await pdfdoc.initSecurityHandler();
    await PDFNet.Convert.toPdf(pdfdoc, inputPath);
    pdfdoc.save(
      outputPath,
      PDFNet.SDFDoc.SaveOptions.e_linearized,
    );
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/generate/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(filename);
  const outputPath = path.resolve(__dirname, filesPath, `${filename}.pdf`);
  console.log(outputPath);
  const main = async () => {
    const pdfdoc = await PDFNet.PDFDoc.create();
    await pdfdoc.initSecurityHandler();
    const page1 = await pdfdoc.pageCreate();
    pdfdoc.pagePushBack(page1);
    pdfdoc.save(
      outputPath,
      PDFNet.SDFDoc.SaveOptions.e_linearized,
    );
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/textextract/:filename-:pagenumber', (req, res) => {
  const filename = req.params.filename;
  let pageNumber = Number(req.params.pagenumber);
  let ext = path.parse(filename).ext;

  if (ext !== '.pdf') {
    res.statusCode = 500;
    res.end(`File is not a PDF. Please convert it first.`);
  }

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(__dirname, filesPath, `${filename}.txt`);

  const main = async () => {
    await PDFNet.initialize();
    try {
      const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
      await pdfdoc.initSecurityHandler();
      const page = await pdfdoc.getPage(pageNumber);

      if (!page) {
        throw 'Page number is invalid.';
      }

      const txt = await PDFNet.TextExtractor.create();
      const rect = new PDFNet.Rect(0, 0, 612, 794);
      txt.begin(page, rect);
      let text;

      text = await txt.getAsText();
      fs.writeFile(outputPath, text, (err) => {
        if (err) return console.log(err);
      });
    } catch (err) {
      throw err;
    }
  };

  PDFNetEndpoint(main, outputPath, res);
});

const PDFNetEndpoint = (main, pathname, res) => {
  PDFNet.runWithCleanup(main)
    .then(() => {
      PDFNet.shutdown();
      fs.readFile(pathname, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          const ext = path.parse(pathname).ext;
          res.setHeader('Content-type', mimeType[ext] || 'text/plain');
          res.end(data);
        }
      });
    })
    .catch((error) => {
      res.statusCode = 500;
      res.end(error);
    });
};

app.listen(port, () =>
  console.log(
    `nodejs-convert-file-server listening at http://localhost:${port}`,
  ),
);
