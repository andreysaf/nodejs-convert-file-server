process.env.NODE_ENV = 'test';

const { expect }  = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index.js');

chai.use(chaiHttp);


describe('/GET files', () => {
    it('it should GET files', (done) => {
      chai.request(server)
          .get('/book')
          .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
            done();
          });
    });
});