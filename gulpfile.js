'use strict';
require('dotenv').config()
var
  gulp = require('gulp'),
  gulpif = require('gulp-if'),
  watch = require('gulp-watch'),
  plumber = require('gulp-plumber'),
  prefixer = require('gulp-autoprefixer'),
  indexify = require('gulp-indexify'),
  uglify = require('gulp-uglify'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  csso = require('gulp-csso'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  rimraf = require('rimraf'),
  browserSync = require("browser-sync"),
  gutil = require('gulp-util'),
  parker = require('gulp-parker'),
  fileinclude = require('gulp-file-include'),
  ftp = require('vinyl-ftp'),
  wiredep = require('wiredep'),
  reload = browserSync.reload;

var path = {
  build: {
    html: 'build/',
    js: 'build/js/',
    css: 'build/css/',
    img: 'build/img/',
    fonts: 'build/fonts/'
  },
  src: {
    html: 'src/*.html',
    js: 'src/js/scripts.js',
    style: 'src/sass/style.scss',
    img: 'src/img/**/*.*',
    fonts: 'src/fonts/**/*.*'
  },
  watch: {
    html: 'src/**/*.html',
    js: 'src/js/**/*.js',
    style: 'src/sass/**/*.scss',
    img: 'src/img/**/*.*',
    fonts: 'src/fonts/**/*.*'
  },
  clean: './build'
};

var deploy = false; // used with gulp-if

var config = {
  server: {
    baseDir: "./build"
  },
  host: 'localhost',
  notify: true,
  open: false,
  port: 5000,
  tunnel: false,
  logPrefix: "Inception"
};

gulp.task('server', function() {
  browserSync(config);
});

gulp.task('clean', function(cb) {
  rimraf(path.clean, cb);
});

gulp.task('html:build', function() {
  gulp.src(path.src.html)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    // .pipe(indexify())
    .pipe(gulp.dest(path.build.html))
    .pipe(reload({ stream: true }));
});

gulp.task('js:build', function() {
  gulp.src(path.src.js)
    .pipe(plumber())
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(path.build.js))
    .pipe(reload({ stream: true }));
});

gulp.task('style:build', function() {
  gulp.src(path.src.style)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: ['src/sass/'],
      outputStyle: 'expanded',
      sourceMap: true,
      errLogToConsole: true
    }))
    .pipe(prefixer())
    // .pipe(csso())
    .pipe(gulpif(deploy, csso()))
    .pipe(sourcemaps.write('/'))
    .pipe(gulp.dest(path.build.css))
    .pipe(reload({ stream: true }));
});

gulp.task('image:build', function() {
  gulp.src(path.src.img)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      use: [pngquant()],
      interlaced: true
    }))
    .pipe(gulp.dest(path.build.img))
    .pipe(reload({ stream: true }));
});

gulp.task('fonts:build', function() {
  gulp.src(path.src.fonts)
    .pipe(gulp.dest(path.build.fonts))
});


gulp.task('build', ['html:build', 'js:build', 'style:build', 'fonts:build', 'image:build']);


gulp.task('watch', function() {
  watch([path.watch.html], function(event, cb) {
    gulp.start('html:build');
  });
  watch([path.watch.style], function(event, cb) {
    gulp.start('style:build');
  });
  watch([path.watch.js], function(event, cb) {
    gulp.start('js:build');
  });
  watch([path.watch.img], function(event, cb) {
    gulp.start('image:build');
  });
  watch([path.watch.fonts], function(event, cb) {
    gulp.start('fonts:build');
  });
});

gulp.task('ftp', function() {
  var conn = ftp.create({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    port: process.env.PORT,
    secure: true,
    parallel: 10,
    debug: true,
    log: gutil.log
  });

  var globs = [
    'build/**'
  ];
  return gulp.src(globs, { buffer: false })
    // .pipe(conn.newer(process.env.PATH)) // only upload newer files
    .pipe(conn.dest(process.env.PATH));

});

gulp.task('default', ['build', 'server', 'watch']);


gulp.task('parker', function() {
  return gulp.src(path.build.css + '/**/*.css')
    .pipe(parker({
      file: 'CSSreport.md',
      title: 'Gulp CSS report',
      metrics: [
        "TotalRules",
        "TotalStylesheets",
        "TotalDeclarations",
        "UniqueColours",
        "TotalUniqueColours",
        "TotalSelectors",
        "TotalImportantKeywords",
        "MediaQueries",
        "TotalMediaQueries"
      ]
    }));
});
