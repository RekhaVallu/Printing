const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('TEST SERVER'));
app.listen(5001, () => console.log('listening 5001'));
