const { series, src, dest } = require('gulp');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const csso = require('gulp-csso');

function clean() {
  return del(['dist']);
}

function copyCNAME() {
  return src('src/CNAME')
    .pipe(dest('dist'));
}

function minifyHtml() {
  return src('src/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist'));
}

function minifyCss() {
  return src('src/css/*.css')
    .pipe(csso())
    .pipe(dest('dist/css'));
}

function copyImages() {
  return src('src/images/*')
    .pipe(dest('dist/images'));
}

exports.default = series(clean, copyCNAME, minifyHtml, minifyCss, copyImages);
