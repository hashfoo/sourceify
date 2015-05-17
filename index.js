var path = require("path"),
    fs = require("fs"),
    through = require("through2"),
    buffer = require('vinyl-buffer'),
    convertSourceMap = require("convert-source-map"),
    SourceMap = require("source-map"),
    SourceMapConsumer = SourceMap.SourceMapConsumer,
    SourceMapGenerator = SourceMap.SourceMapGenerator;

/**
 * prints all mappings from a SourceMapConsumer
 */
function printMappings(consumer) {
    consumer.eachMapping(function(m) {
        console.log(
            m.source + ": " + m.generatedLine + ":" + m.generatedColumn + "  -->  " +
            m.originalLine + ":" + m.originalColumn + "  (" + m.name + ")");
    });
}

/**
 * extract all mappings from a source map.
 *
 * returns []
 */
function getAllMappings(consumer) {
    var mappings = [];
    consumer.eachMapping(function(m) {
        mappings.push(m);
    });
    return mappings;
}

function plugin(bundle, opts) {
    opts = opts || { };
    var fileMaps = {};

    initBundle(bundle);

    function initBundle(bundle) {
        bundle.transform(transformer, {
            global: true
        });

        bundle.on('reset', function() {
            addBundleHooks(bundle);
        });

        addBundleHooks(bundle);
    }

    function addBundleHooks(bundle) {
        bundle.pipeline.get('pack').push(convertBundleMap());
    }

    function convertBundleMap() {
        var buffer = "";

        function _write(chunk, enc, next) {
            buffer += chunk.toString();
            next();
        }

        function _done(next) {
            var bundleMap = convertSourceMap.fromSource(buffer);
            var bundleMapConsumer = new SourceMapConsumer(bundleMap.sourcemap);
            var bundleMappings = getAllMappings(bundleMapConsumer);
            var generator = new SourceMapGenerator();

            bundleMappings.forEach(function(bundleMap) {
                var bundleFile = bundleMap.source;

                var mapData = fileMaps[bundleFile];
                if (!mapData) {
                    return;
                }

                var sourceFileMappings = mapData.mappings;
                var bundleLine = bundleMap.generatedLine;
                var binJsLine = bundleMap.originalLine;
                var sourceMappings = sourceFileMappings.filter(function(m) {
                    return m.generatedLine == binJsLine;
                });

                sourceMappings.forEach(function(sourceMapping) {
                    var sourceLine = sourceMapping.originalLine,
                        sourceColumn = sourceMapping.originalColumn,
                        source = sourceMapping.source,
                        name = sourceMapping.name;

                    sourceRelPath = mapData.sources[source];
                    generator.addMapping({
                        generated: {
                            line: bundleLine,
                            column: sourceColumn
                        },
                        original: {
                            line: sourceLine,
                            column: sourceColumn
                        },
                        name: name,
                        source: source
                    });
                });
            });

            var updatedMap = convertSourceMap.fromJSON(generator.toString());
            var bundle = convertSourceMap.removeComments(buffer);
            bundle += "\n" + updatedMap.toComment();
            this.push(bundle);
            this.push(null);
            next();
        }

        return through.obj(_write, _done);
    }

    function transformer(file) {
        var basedir = opts.basedir || process.cwd();

        function _transform(data, enc, next) {
            var stream = this;

            file = path.relative(basedir, file);
            file = file.replace(/\\/g, '/');
            var fileDir = path.dirname(file);
            var fileName = path.basename(file);
            var mapPath = path.join(fileDir, fileName + ".map");

            var mapContent = fs.readFileSync(mapPath, "utf8");
            var sourcemap = convertSourceMap.fromJSON(mapContent).sourcemap;

            if (!!sourcemap) {
                var sourcePaths = {};
                sourcemap.sources.forEach(function(s) {
                    var sourceDir = path.dirname(s),
                        sourceFileName = path.basename(s),
                        compiledDir = path.dirname(file),
                        absDir = path.join(compiledDir, sourceDir),
                        relDir = path.relative("dist", absDir),
                        relPath = path.join(relDir, sourceFileName);

                    sourcePaths[s] = relPath.replace(/\\/g, '/');
                });

                console.log(sourcePaths);
                var consumer = new SourceMapConsumer(sourcemap);
                fileMaps[file] = {
                    consumer: consumer,
                    mappings: getAllMappings(consumer),
                    sources: sourcePaths
                };

            }

            var code = convertSourceMap.removeMapFileComments(data.toString());
            this.push(code);
            this.push(null);
            next();
        }

        return through.obj(_transform);
    }
}

module.exports = plugin;
