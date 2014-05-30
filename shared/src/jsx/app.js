/** @jsx React.DOM */

var React = require('react');
var bs = require('./bootstrap.js');
var _ = require('lodash');

var Layout = bs.Layout;
var Widget = bs.Widget;

var pages = [
    {
        route: '/',
        server: function (params) {
            console.log('route /');
            var component = (
                <Layout>
                    <h4>Home</h4>
                    <p><div id="client"></div></p>
                </Layout>
            );
            var markup = React.renderComponentToString(component);
            return markup;
        },
        client: function (params) {
            console.log('nothing to do on client for route /');
        }
    },
    {
        route: '/posts/:id',
        server: function (params) {
            var component = (
                <Layout>
                    <p>From server: <Widget clientOrServer="server" postId={params.id}/></p>
                    <p><div id="client"></div></p>
                </Layout>
            );
            var markup = React.renderComponentToString(component);
            return markup;
        },
        client: function (params) {
            React.renderComponent(
                <Widget clientOrServer="client" postId={params.id} />,
                document.getElementById('client')
            );
        }
    }
];

/*var Widget = React.createClass({
    render: function () {
        return <p>hello there!</p>;
    }
});*/
/*React.renderComponent(
    <h1>Hello, world!</h1>,
    document.getElementById('example')
);*/
var serverRoutes = _.map(pages, function (page) {
    return _.omit(page, ['client']);
});
var clientRoutes = _.map(pages, function (page) {
    return _.omit(page, ['server']);
});

module.exports.bs = bs;
module.exports.serverRoutes = serverRoutes;
module.exports.clientRoutes = clientRoutes;
