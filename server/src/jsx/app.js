/** @jsx React.DOM */

var React = require('react');
var serve = require('koa-static');
var koa = require('koa');
var mount = require('koa-mount');
var router = require('koa-router');
var _ = require('lodash');
var app = koa();
var appReact = koa();
var shared = require('../../../shared/build/js/app.js');

var InterfaceComponent = shared.InterfaceComponent;

//app.use(serve('./client/build'));

appReact.use(router(appReact));

_.forEach(shared.pages, function (routeFunc, routeName) {
    console.log('adding route with name ' + routeName + '?');
    appReact.get(routeName, function *(next) {
        yield next;
        //var markup = serverRoute.server(this.params);
        var markup = React.renderComponentToString(
            <InterfaceComponent router="" clientOrServer="server"/>
        );
        this.body = markup;
    });
});

/*appReact.get('/', function *(next) {
    console.log('hier');
    yield next;
    this.body = shared.serverRoutes render();
});*/

app.use(mount('/static', serve('./client/build')));
app.use(mount('/', appReact));

app.listen(3000);

console.log('listening on port 3000');
