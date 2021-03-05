const express = require('express');
const path = require('path');
const axios = require('axios');
const api = require('./api_handler.js');

const app = express();
const port = 3000;

const staticMiddleware = express.static(path.join(__dirname, '../client/dist'));

app.use('/products/:q', staticMiddleware);

app.get('/products/:q/:b', (req, res) => {
  // console.log('SERVER URL=> ', req.url);
  const memCache = [];
  const id = req.params.b;
  // console.log('SERVER params==> ', id);
  api.fetchData(`/products/${id}`, null, (productDetails) => {
    // store the data
    memCache.push(productDetails.data);
    api.fetchData(`/products/${id}/styles`, null, (productStyles) => {
      memCache.push(productStyles.data);
      api.fetchData('/reviews/', { params: { product_id: Number(id), sort: 'relevant', count: 20 } }, (reviews) => {
        memCache.push(reviews.data);
        api.fetchData('/reviews/meta', { params: { product_id: Number(id) } }, (reviewsMeta) => {
          memCache.push(reviewsMeta.data);
          api.fetchData('/qa/questions', { params: { product_id: Number(id) } }, (questions) => {
            memCache.push(questions.data);
            res.send(memCache);
          });
        });
      });
    });
  });
});

// handle get request for sort option in Review component
app.get('/products/:q/:b/reviews/:sort', (req, res) => {
  const product_id = req.params.q;
  const { sort } = req.params;
  api.fetchData('/reviews', { params: { product_id: Number(product_id), sort: sort, count: 20} }, (reviews) => {
    res.send(reviews.data);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// handle get request for Add Review Form Submit
app.post('/products/:q/:b/reviews', (req, res) => {
  const query = req.body;
  console.log(req.body);
  console.log('POST REQUEST====> ', query);
  api.postData('/reviews', {
    product_id: query.productId,
    rating: query.rating,
    characteristics: query.characteristics,
    recommend: query.recommend,
    summary: query.summary,
    body: query.body,
    name: query.name,
    email: query.email,
    photos: query.photos,
  }, (data) => {
    console.log(data);
    res.send('Review added');
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening at http://localhost:${port}`);
});
