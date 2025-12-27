'use strict';

const crypto = require('crypto');

const stocks = {};

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.ip
  );
}

async function getStockData(symbol) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`
  );
  const data = await response.json();

  if (!data || !data.symbol || data.latestPrice === undefined) {
    throw new Error('Invalid stock');
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

    const stockList = Array.isArray(stockQuery)
      ? stockQuery
      : [stockQuery];

    try {
      const results = [];
      const clientIP = getClientIP(req);
      const ipHash = hashIP(clientIP);

      for (const stock of stockList) {
        const data = await getStockData(stock);
        const symbol = data.symbol;

        if (!stocks[symbol]) {
          stocks[symbol] = {
            likes: 0,
            ips: new Set()
          };
        }

        if (like && !stocks[symbol].ips.has(ipHash)) {
          stocks[symbol].ips.add(ipHash);
          stocks[symbol].likes += 1;
        }

        results.push({
          stock: symbol,
          price: data.latestPrice,
          likes: stocks[symbol].likes
        });
      }

      // 2 STOCKS → rel_likes
      if (results.length === 2) {
        return res.json({
          stockData: [
            {
              stock: results[0].stock,
              price: results[0].price,
              rel_likes: results[0].likes - results[1].likes
            },
            {
              stock: results[1].stock,
              price: results[1].price,
              rel_likes: results[1].likes - results[0].likes
            }
          ]
        });
      }

      // 1 STOCK
      return res.json({
        stockData: {
          stock: results[0].stock,
          price: results[0].price,
          likes: results[0].likes
        }
      });

    } catch (err) {
      return res.json({ error: 'Invalid stock symbol' });
    }
  });
};
