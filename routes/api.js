'use strict';

const crypto = require('crypto');

const stocks = {};

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

async function getStockData(symbol) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
  );
  const data = await response.json();

  // 🔥 VALIDASI DATA
  if (!data || !data.symbol || data.latestPrice === undefined) {
    throw new Error('Invalid stock data');
  }

  return data;
}

module.exports = function (app) {

  app.get('/api/stock-prices', async (req, res) => {
    const stockQuery = req.query.stock;
    const like = 'like' in req.query;

    if (!stockQuery) {
      return res.json({ error: 'Stock required' });
    }

    const stocksArr = Array.isArray(stockQuery)
      ? stockQuery
      : [stockQuery];

    try {
      const results = [];

      for (const stock of stocksArr) {
        const data = await getStockData(stock);
        const symbol = data.symbol;

        if (!stocks[symbol]) {
          stocks[symbol] = {
            likes: 0,
            ips: new Set()
          };
        }

        if (like) {
          const ipHash = hashIP(req.ip);
          if (!stocks[symbol].ips.has(ipHash)) {
            stocks[symbol].ips.add(ipHash);
            stocks[symbol].likes += 1;
          }
        }

        results.push({
          stock: symbol,
          price: data.latestPrice,
          likes: stocks[symbol].likes
        });
      }

      // 🔥 2 STOCK → REL_LIKES
      if (results.length === 2) {
        const [a, b] = results;
        return res.json({
          stockData: [
            {
              stock: a.stock,
              price: a.price,
              rel_likes: a.likes - b.likes
            },
            {
              stock: b.stock,
              price: b.price,
              rel_likes: b.likes - a.likes
            }
          ]
        });
      }

      // 🔥 1 STOCK
      return res.json({
        stockData: {
          stock: results[0].stock,
          price: results[0].price,
          likes: results[0].likes
        }
      });

    } catch (err) {
      // 🔥 ERROR JELAS, BUKAN DATA RUSAK
      return res.json({ error: 'Invalid stock symbol' });
    }
  });

};
