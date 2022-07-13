'use strict';

const gulp = require('gulp');
const { task, series, src, dest } = require('gulp');
const merge = require('merge-stream');
const del = require('del');
const rename = require("gulp-rename");
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const minify = require('gulp-minify');


task('clean', function () {
  return del(['dist']);
});

task('javascript', function () {
  return merge(
    src('./src/js/*.js')
      .pipe(minify({
        ext: {
          min: '.min.js'
        },
        noSource: true
      }))
      .pipe(dest('./dist/js/')),
    src('./node_modules/fullpage.js/dist/fullpage.min.js')
      .pipe(dest('./dist/js/'))
  );
});

task('html', function () {
  return src('./src/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('./dist'));
});

task('css', function () {
  return merge(
    src('./src/css/*.css')
      .pipe(cleanCSS())
      .pipe(rename({ suffix: '.min' }))
      .pipe(dest('./dist/css')), 
    src('./node_modules/fullpage.js/dist/fullpage.min.css')
      .pipe(dest('./dist/css'))
  );
});

task('images', function () {
  return src('./src/images/*')
    .pipe(dest('./dist/images'));
});

task('cname', function () {
  return src('./src/CNAME')
    .pipe(dest('./dist/'));
});

task('favicon', function () {
  return src('./src/favicon/*')
    .pipe(dest('./dist/'));
});

task(
  'default', 
  series('clean', 'javascript', 'html', 'css', 'images', 'cname', 'favicon')
);
