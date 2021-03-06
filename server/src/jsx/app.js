/** @jsx React.DOM */

var React = require('react');
var serve = require('koa-static');
var koa = require('koa');
var mount = require('koa-mount');
var router = require('koa-router');
var _ = require('lodash');
var app = koa();
var appReact = koa();
var appWs = koa();
var shared = require('../../../shared/build/js/app.js');
//var Mock = require('./data.mock.js');
var dsFactory = require('./dsFactory.js');
var nconf = require('nconf');

var NODE_ENV = process.env.NODE_ENV;

//console.log('nconf.NODE_ENV: ' + nconf.get('NODE_ENV'));

nconf.argv().env().file({file: './config/'+NODE_ENV+'.config.json'});

console.log('nconf.get("NODE_ENV"): ' + nconf.get('NODE_ENV'));

//console.log(nconf.get('data'));
//console.log(nconf.get('data:source'));
//console.log(nconf.get('secret'));
//process.exit();

var mockData = dsFactory(nconf);

console.log('mockData: ' + mockData);

var InterfaceComponent = shared.InterfaceComponent;

//app.use(serve('./client/build'));

appReact.use(router(appReact));
appWs.use(router(appWs));


appWs.get('/users/:username', function *(next) {
    yield next;
    this.body = mockData.getUser(this.params.username);
});

appWs.get('/users', function *(next) {
    yield next;
    this.body = mockData.getUsers();
});

appWs.get('/teams/:teamname', function *(next) {
    yield next;
    this.body = mockData.getTeam(this.params.teamname);
});

appWs.get('/teams', function *(next) {
    yield next;
    this.body = mockData.getTeams();
});

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
app.use(mount('/v1', appWs));
app.use(mount('/', appReact));

app.listen(3000);

console.log('listening on port 3000');
