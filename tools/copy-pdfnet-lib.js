const fs = require('fs-extra');

const copyFiles = async () => {
  try {
    await fs.copy('./node_modules/@pdftron/pdfnet-node/lib', './pdfnet-node/lib');
    console.log('PDFNet files copied over successfully');
  } catch (err) {
    console.error(err);
  }
};

copyFiles();