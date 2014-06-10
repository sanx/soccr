var dsFactory = function (nconf) {
    var Ds;
    if ('mock' === nconf.get('data:source')) {
        Ds = require('./ds.mock.js');
        return new Ds();
    } else if ('development' === nconf.get('data:source')) {
        Ds = require('./ds.development.js');
        return new Ds(nconf.data);
    } else {
        return false;
    }
};


module.exports = dsFactory;
