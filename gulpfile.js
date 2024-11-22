const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');

function buildStyles() {
  return gulp.src([
    'node_modules/bootstrap/dist/css/bootstrap.min.css',
    'assets/stylesheets/application.scss'
  ])
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('application.css'))
    .pipe(gulp.dest('public'));
}

function buildScripts() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
    'assets/javascripts/application.js'
  ])
    .pipe(concat('application.js'))
    .pipe(gulp.dest('public'));
}


function buildImages() {
  return gulp.src('assets/images/**.{gif,jpg,png,svg,ico}', { encoding: false })
    .pipe(gulp.dest('public/images'))
}

const buildAll = gulp.series(buildStyles, buildScripts, buildImages);

exports.buildStyles = buildStyles;
exports.buildScripts = buildScripts;
exports.buildImages = buildImages;
exports.buildAll = buildAll;