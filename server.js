const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  console.log('hi');
  res.send('hello');
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
