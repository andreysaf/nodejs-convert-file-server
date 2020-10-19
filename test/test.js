process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const mimeType = require('../modules/mimeType');

chai.use(chaiHttp);

describe('/GET files', () => {
    it('it should GET files', (done) => {
      chai.request(server)
          .get('/files')
          .end((err, res) => {
            chai.expect(res.status).to.equal(200);
            chai.expect(res.body).to.be.an('array');
            chai.expect(res.type).to.equal(mimeType['.json']);
            done();
          });
    });

    it('it should GET webviewer.pdf', (done) => {
      chai.request(server)
          .get('/files/webviewer.pdf')
          .end((err, res) => {
            chai.expect(res.status).to.equal(200);
            chai.expect(res.type).to.equal(mimeType['.pdf']);
            done();
          });
    });
});

describe('/GET optimize/filename', () => {
  it('it should GET optimized PDF file', (done) => {
    chai.request(server)
        .get('/optimize/webviewer.pdf')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.pdf']);
          done();
        });
  });
});

describe('/GET thumbnail/filename', () => {
  it('it should GET a thumbnail of a PDF file', (done) => {
    chai.request(server)
        .get('/thumbnail/webviewer.pdf')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.png']);
          done();
        });
  });
});

describe('/GET convert/filename', () => {
  it('it should GET a converted PDF document', (done) => {
    chai.request(server)
        .get('/convert/document.docx')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.pdf']);
          done();
        });
  });
});

describe('/GET convertHTML/filename', () => {
  it('it should GET a converted PDF document from HTML', (done) => {
    chai.request(server)
        .get('/convertHTML/myhtml-index.html')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.pdf']);
          done();
        });
  });
});

describe('/GET generate/filename', () => {
  it('it should GET a newly generated PDF document', (done) => {
    chai.request(server)
        .get('/generate/new')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.pdf']);
          done();
        });
  });
});

describe('/GET textExtract/filename', () => {
  it('it should GET text from PDF page 1', (done) => {
    chai.request(server)
        .get('/textextract/webviewer.pdf-1')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.txt']);
          chai.expect(res.text).to.equal('6 Important Factors when\nChoosing a PDF Library\nADAM PEZ\n');
          done();
        });
  });
});

describe('/GET replaceContent/filename', () => {
  it('it should GET a newly generated PDF document with strings replaced', (done) => {
    chai.request(server)
        .get('/replaceContent/John_Smith')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.pdf']);
          done();
        });
  });
});

describe('/GET watermark/filename', () => {
  it('it should GET a watermarked PDF document', (done) => {
    chai.request(server)
        .get('/watermark/webviewer.pdf-amazing')
        .end((err, res) => {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.type).to.equal(mimeType['.pdf']);
          done();
        });
  });
});
