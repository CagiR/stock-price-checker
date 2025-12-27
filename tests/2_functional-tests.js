const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;

const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  suite('GET /api/stock-prices', function () {

    test('Viewing one stock', function (done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.exists(res.body.stockData);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
    });

    test('Viewing one stock and liking it', function (done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: 'true' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.exists(res.body.stockData);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isNumber(res.body.stockData.likes);
          assert.isAtLeast(res.body.stockData.likes, 1);
          done();
        });
    });

    test('Viewing the same stock and liking it again (should not increase likes)', function (done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: 'true' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.exists(res.body.stockData);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
    });

    test('Viewing two stocks', function (done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'] })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);

          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
    });

    test('Viewing two stocks and liking them', function (done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);

          const relLikes1 = res.body.stockData[0].rel_likes;
          const relLikes2 = res.body.stockData[1].rel_likes;

          assert.equal(relLikes1, -relLikes2);
          done();
        });
    });

  });

});
