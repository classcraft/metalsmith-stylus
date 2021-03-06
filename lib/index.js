var stylus = require('stylus');
var minimatch = require('minimatch');
var resolve = require('path').resolve;

function plugin (opts) {
  opts = opts || {};
  opts.paths = (opts.paths || []).map(function(item) {return resolve(item)});

  return function (files, metalsmith, done) {
    var destination = metalsmith.destination();
    var source = metalsmith.source();
    var styles = Object.keys(files).filter(minimatch.filter(opts.file || "*.+(styl|stylus)", {matchBase: true}));

    var paths = styles.map(function (path) {
      var ret = path.split('/');
      ret.pop();
      return source + '/' + ret.join('/');
    });

    opts.paths = paths.concat(opts.paths);

    styles.forEach(function (file, index, arr) {
      var out = file.split('.');
      out.pop();
      out = out.join('.') + '.css';
      var s = stylus(files[file].contents.toString())
        .set('filename', file);

        for (var o in opts) {
          if (o === 'use' || o === 'define' || o === 'file') { continue; }
          s.set(o, opts[o]);
        }
        if (opts.use) {
          opts.use.forEach(function(fn) { s.use(fn); })
        }
        if (opts.define) {
          for (var d in opts.define) {
            s.define(d, opts.define[d]);
          }
        }

        s.render(function (err, css) {
          if (err) throw err;
          delete files[file];
          files[out] = { contents: new Buffer(css) };
          if (opts.sourcemap) {
            files[out + '.map'] = { contents: new Buffer(JSON.stringify(s.sourcemap)) };
          }
        });
    });
    done();
  };
}

module.exports = plugin;
