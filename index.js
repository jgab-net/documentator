var path = require('path'),
    fs = require('fs'),
    Registry = require('conga-annotations').Registry,
    Reader = require('conga-annotations').Reader;

(function(doc){

    var models = {},
        compiled = [];

    doc.uri = path.normalize(__dirname + '/ui');

    doc.linkMongoose = function(mongoose){
        mongoose.modelNames().forEach(function(modelName){
            models[modelName.toLowerCase()] = __clearSchema(mongoose.model(modelName).schema.tree);
        });
    };

    doc.search = function(app, controllersPath){

        compiled = __compile(__findRoutes(app), __findAnnotations(controllersPath));

        app.route('/api-docs')
            .get(function(req, res, next){
                res.json(compiled);
            });
    };

    var __compile = function(routes, annotations){

        return routes.map(function(route){
            route.paths.map(function(path){

                var annotation;
                for(var i=0; i<annotations[route.group].length; i++){
                    if(path.path == annotations[route.group][i].target &&
                        path.method == annotations[route.group][i].method){
                        annotation = annotations[route.group][i];
                        break;
                    }
                }

                if(annotation){
                    path.body = annotation.body.map(__mapModel);
                    path.return = annotation.return.map(__mapModel);
                    path.params = annotation.params;
                }

                return path;
            });
        })
    };

    var __mapModel= function(value){
        var match = value.match(/(\w+)Model(s?)/);
        if(match){
            var model=models[match[1].toLowerCase()];
            model.isArray = match[2]=='s';
            return model;
        }
        return value;
    };

    var __clearSchema = function(schema){
        [
            'created', 'updated', 'deleted', 'id', '_id', '__v',
            'hash', 'iterations', 'salt'
        ].forEach(function(path){
                delete schema[path];
            });
        return schema;
    };

    var __findAnnotations = function(controllersPath){
        var registry = new Registry();

        registry.registerAnnotation(path.join(__dirname,'lib/api-route-annotation'));

        var reader = new Reader(registry);

        fs.readdirSync(controllersPath).forEach(function (file) {
            if (/\.js$/.test(file)) {
                reader.parse(path.join(controllersPath+ '/' + file));
            }
        });

        return reader.getGroupedRoutesAnnotations();
    };

    var __findRoutes = function(app){
        var routes = [];

        var routers = app._router.stack.filter(function(router){
            return router.handle.name == 'router';
        });

        console.log(routers.length);
        for(var i=0;i<routers.length; i++){
            var path = routers[i].regexp.toString().replace('/?(?=/|$)/i','').replace('/^\\','').replace(/\\/g,'') || '/';

            var paths = [];

            for(var j=0; j<routers[i].handle.stack.length; j++){
                paths.push({
                    path: routers[i].handle.stack[j].route.path,
                    method: Object.keys(routers[i].handle.stack[j].route.methods)[0].toUpperCase()
                }) ;
            }

            routes.push({
                group: path,
                paths: paths,
                genericId: i
            })
        }

        return routes;
    };

})(/*typeof exports == 'undefined'? doc={} : */exports);
