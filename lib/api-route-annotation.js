var Annotation = require('conga-annotations').Annotation;

module.exports = Annotation.extend({
    annotation: 'ApiRoute',
    targets: [Annotation.ROUTE],
    value: '',
    body: [],
    return: [],
    params: {}
});