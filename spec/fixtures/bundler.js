var sourceify = require("../../")
var browserify = require("browserify");
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var through = require("through2");
var exorcist = require("exorcist");

module.exports.bundle = function bundle(opts) {
    var bundleOpts = { debug: true };
    var pipeline = browserify("spec/fixtures/code-external/main.js", bundleOpts)
        .plugin(sourceify, { })
        .bundle()
        //.pipe(exorcist("bundle.js.map"))
        .pipe(source("bundle.js"))
        .pipe(buffer());

    if (!!opts.callback) {
        pipeline.pipe(through.obj(
            function(data, enc, next) {
                console.log(data);
                opts.callback(data.contents.toString());
                next();
            }));
    }
}
