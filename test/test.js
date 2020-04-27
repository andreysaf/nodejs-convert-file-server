process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index.js');
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

