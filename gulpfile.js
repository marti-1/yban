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
    .pipe(gulp.dest('public/css'));
}

exports.buildStyles = buildStyles;