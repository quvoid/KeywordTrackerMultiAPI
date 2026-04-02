const axios = require('axios');
axios.post('https://google.serper.dev/search', { q: 'open a non individual account', num: 10, page: 5, gl: 'in', hl: 'en' }, { headers: { 'X-API-KEY': '1a8f4ef636dbdfb24e3010104dff7f8d005e7d6d', 'Content-Type': 'application/json' } })
.then(res => console.log(res.data.organic.map(o => o.position + ': ' + o.link).join('\n')))
.catch(console.error);
