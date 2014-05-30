var _ = require('lodash');
var shared = require('../../../shared/build/js/app.js');

var Router = Backbone.Router.extend({
    _.map(shared.clientRoutes, function (route) {
    })
    routes: {
        '/': function () {
        },
        '': function () {
        }
    }
});

var router = new Router();

//app.use(serve('./client/build'));

_.forEach(shared.clientRoutes, function (clientRoute) {
    appReact.get(serverRoute.route, function *(next) {
        yield next;
        var markup = serverRoute.server(this.params);
        this.body = markup;
    });
});

/*appReact.get('/', function *(next) {
    console.log('hier');
    yield next;
    this.body = shared.serverRoutes render();
});*/

