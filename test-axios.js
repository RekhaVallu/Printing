const axios = require('axios');
const api = axios.create({ baseURL: 'http://192.168.137.1:5000/api' });
console.log(api.getUri({ url: '/orders' }));