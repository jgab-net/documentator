var Annotation = require('conga-annotations').Annotation;

module.exports = Annotation.extend({
    annotation: 'ApiGroup',
    targets: [Annotation.GROUP_ROUTE],
    value: ''
});