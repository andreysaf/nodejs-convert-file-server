const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFNet } = require('@pdftron/pdfnet-node');
const mimeType = require('./modules/mimeType');
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
    pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/convertHTML/:filename-:htmlPath', (req, res) => {
  const filename = req.params.filename;
  const htmlPath = req.params.htmlPath;

  const inputPath = path.resolve(__dirname, filesPath, htmlPath);
  const outputPath = path.resolve(__dirname, filesPath, `${filename}.pdf`);

  const main = async () => {
    try {
      await PDFNet.HTML2PDF.setModulePath(
        path.resolve(__dirname, './pdfnet-node/lib/'),
      );
      const settings = await PDFNet.HTML2PDF.WebPageSettings.create();
      settings.setAllowJavaScript(true);
      settings.setProduceForms(true);
      settings.SetPrintBackground(false);
      const html2pdf = await PDFNet.HTML2PDF.create();
      const pdfdoc = await PDFNet.PDFDoc.create();
      await html2pdf.insertFromUrl2(inputPath, settings);
      await html2pdf.convert(pdfdoc);
      await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    } catch (err) {
      console.log(err);
    }
    
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/generate/:filename', (req, res) => {
  const filename = req.params.filename;
  const outputPath = path.resolve(__dirname, filesPath, `${filename}.pdf`);

  const main = async () => {
    const pdfdoc = await PDFNet.PDFDoc.create();
    await pdfdoc.initSecurityHandler();
    const page1 = await pdfdoc.pageCreate();
    pdfdoc.pagePushBack(page1);
    pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/textExtract/:filename-:pagenumber', (req, res) => {
  const filename = req.params.filename;
  let pageNumber = Number(req.params.pagenumber);
  let ext = path.parse(filename).ext;

  if (ext !== '.pdf') {
    res.statusCode = 500;
    res.end(`File is not a PDF. Please convert it first.`);
  }

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(
    __dirname,
    filesPath,
    `${filename}-${pageNumber}.txt`,
  );

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
      fs.writeFile(outputPath, text, err => {
        if (err) return console.log(err);
      });
    } catch (err) {
      throw err;
    }
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/replaceContent/:name', (req, res) => {
  const name = req.params.name.replace('_', ' ');
  const filename = 'template_letter.pdf';

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(
    __dirname,
    filesPath,
    `${filename}_replaced.pdf`,
  );

  const main = async () => {
    const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
    await pdfdoc.initSecurityHandler();
    const replacer = await PDFNet.ContentReplacer.create();
    const page = await pdfdoc.getPage(1);

    await replacer.addString('NAME', name);
    await replacer.addString('Address', '123 Main St, Vancouver, BC CANADA');
    await replacer.addString('DATE', new Date(Date.now()).toLocaleString());
    await replacer.process(page);

    pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  };

  PDFNetEndpoint(main, outputPath, res);
});

app.get('/watermark/:filename-:watermark', (req, res) => {
  const filename = req.params.filename;
  const watermark = req.params.watermark;
  let ext = path.parse(filename).ext;

  if (ext !== '.pdf') {
    res.statusCode = 500;
    res.end(`File is not a PDF. Please convert it first.`);
  }

  const inputPath = path.resolve(__dirname, filesPath, filename);
  const outputPath = path.resolve(
    __dirname,
    filesPath,
    `${filename}_watermarked.pdf`,
  );

  const main = async () => {
    const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
    await pdfdoc.initSecurityHandler();

    const stamper = await PDFNet.Stamper.create(
      PDFNet.Stamper.SizeType.e_relative_scale,
      0.5,
      0.5,
    ); // Stamp size is relative to the size of the crop box of the destination page
    stamper.setAlignment(
      PDFNet.Stamper.HorizontalAlignment.e_horizontal_center,
      PDFNet.Stamper.VerticalAlignment.e_vertical_center,
    );
    const redColorPt = await PDFNet.ColorPt.init(1, 0, 0);
    stamper.setFontColor(redColorPt);
    const pgSet = await PDFNet.PageSet.createRange(
      1,
      await pdfdoc.getPageCount(),
    );
    stamper.stampText(pdfdoc, watermark, pgSet);

    pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  };

  PDFNetEndpoint(main, outputPath, res);
});

const PDFNetEndpoint = (main, pathname, res) => {
  PDFNet.runWithCleanup(main) // you can add the key to PDFNet.runWithCleanup(main, process.env.PDFTRONKEY)
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
    .catch(error => {
      res.statusCode = 500;
      res.end(error);
    });
};

module.exports = app;
