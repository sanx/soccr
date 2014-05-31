/** @jsx React.DOM */

var React = require('react');
var bs = require('./bootstrap.js');
var _ = require('lodash');

var Layout = bs.Layout;
var Widget = bs.Widget;

var FooComponent = React.createClass({
    'render': function () {
        var router = this.props.router,
            clientOrServer = this.props.clientOrServer;

        return (
            <p>client or server, you ask? "{clientOrServer}"</p>
        );
    }
});

var BarComponent = React.createClass({
    'render': function () {
        var router = this.props.router,
            clientOrServer = this.props.clientOrServer;

        return (
            <p>client or server, you ask? "{clientOrServer}"</p>
        );
    }
});

var InterfaceComponent = React.createClass({
    'render': function () {
        var router = this.props.router,
            clientOrServer = this.props.clientOrServer;

        return (
            <Layout router={router}>
                <table>
                <tr>
                <td>
                    <FooComponent router={router} clientOrServer={clientOrServer} />
                </td>
                <td>
                    <BarComponent router={router} clientOrServer={clientOrServer} />
                </td>
                </tr>
                </table>
            </Layout>
        );
    }
});

var pages = {
    '/': {
        /*'func': function (params) {
            console.log('route /');
            var component = (
                <InterfaceComponent router=
            );
            return component;
            //var markup = React.renderComponentToString(component);
            //return markup;
        },*/
        'paramNames': []
    },
    '/posts/:id': {
        /*'func': function (params) {
            console.log('route /posts/:id');
            var component = (
                <Layout>
                    <p>From server: <Widget clientOrServer="server" postId={params.id}/></p>
                    <p><div id="client"></div></p>
                </Layout>
            );
            return component;
            //var markup = React.renderComponentToString(component);
            //return markup;
        },*/
        'paramNames': ['id']
    }
};

/*var Widget = React.createClass({
    render: function () {
        return <p>hello there!</p>;
    }
});*/
/*React.renderComponent(
    <h1>Hello, world!</h1>,
    document.getElementById('example')
);*/

module.exports.bs = bs;
module.exports.pages = pages;
module.exports.InterfaceComponent = InterfaceComponent;
