var serve = require('koa-static');
var koa = require('koa');
var app = koa();

// $ GET /package.json
app.use(serve('./client/build'));

app.listen(3000);

console.log('listening on port 3000');
