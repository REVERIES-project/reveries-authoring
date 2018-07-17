/*jshint node: true, bitwise:true, curly:true, forin:true, noarg:true,
 noempty:true, nonew:true, undef:true, strict:true, browser:true, node:true,
  asi:true, evil: true, nomen: true */
const {generateCountingSharedBundleUrlMapper,
  generateSharedDepsMergeStrategy} = require('polymer-bundler')
  const gulp = require('gulp')
  const mergeStream = require('merge-stream')
  const PolymerProject = require('polymer-build').PolymerProject

const project = new PolymerProject(require('./polymer.json'))

  
mergeStream(project.sources(), project.dependencies())
  .pipe(project.bundler({
    excludes: ['bower_components/polymer-code-mirror'],
    sourcemaps: true,
    stripComments: true,
    strategy: generateSharedDepsMergeStrategy(3),
    urlMapper: generateCountingSharedBundleUrlMapper('shared/bundle_')
  }))
  .pipe(gulp.dest('build/'))
