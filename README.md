## nodejs-convert-file-server
Node.js - Convert from MS Office, images to PDF, get thumbnails for file previews, optimize files for quick rendering.

### Installation

Clone the repo and run

`npm start`

The server will be listening on port 9000. `http://localhost:9000`


### API Calls

#### List file directory

The endpoint returns all files present in the files directory in JSON format.

##### HTTP Request
`GET http://localhost:9000/files`


