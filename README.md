## nodejs-convert-file-server
Node.js - Convert from MS Office, images to PDF, get thumbnails for file previews, optimize files for quick rendering.

Uses Node.js, Express.js and PDFTron Node.js SDK.

### Installation

Clone the repo and run

`npm start`

The server will be listening on port 9000. `http://localhost:9000`


### API Calls

#### List file directory

The endpoint returns all files present in the files directory in JSON format.

##### HTTP Request
`GET http://localhost:9000/files`

#### Get file

The endpoint returns the requested file.

##### HTTP Request
`GET http://localhost:9000/files/:filename`

#### Get thumbnail

The endpoint returns the thumbnail for the specified file. Uses [PDFTron Node.js API](https://www.pdftron.com/documentation/samples/node/js/PDFDrawTest?platforms=nodejs).

##### HTTP Request
`GET http://localhost:9000/thumbnail/:filename`

#### Convert to PDF

The endpoint converts the file to a PDF. Conversion is possible for the following file formats: DOC, DOCX, PPTX, PPT, XLSX, PNG, JPEG, JPG, TIFF, TXT. Uses [PDFTron Node.js API](https://www.pdftron.com/documentation/samples/node/js/ConvertTest?platforms=nodejs).

##### HTTP Request
`GET http://localhost:9000/convert/:filename`

#### Optimize to PDF

The endpoint converts the PDF to an optimized PDF to be used with [PDFTron WebViewer](https://www.pdftron.com/webviewer/demo/). Uses [PDFTron Node.js API](https://www.pdftron.com/api/pdfnet-node/PDFNet.PDFDoc.html#saveViewerOptimized__anchor).

##### HTTP Request
`GET http://localhost:9000/optimize/:filename`





