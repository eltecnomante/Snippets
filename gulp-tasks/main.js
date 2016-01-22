var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var nodemon = require('gulp-nodemon');

// Error handler
var taskError = function(error) {
  console.log(error.toString());
  this.emit('end');
};
// Log when changed files are detected
var changed_files = function(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
};

//CONF
var local_address = '127.0.0.1';
var local_port = 9090;

var src = [
  '*.html',
  '**/*.css',
  'images/*',
  'js/**/*'
];

/**
 * TASKS
 */

// Load browser and sync browser
gulp.task('browser-sync', function() {
  browserSync.init({
    proxy: [local_address, ':', local_port].join('')
  });
});

//Use nodemon to monitor and restart server on changes
gulp.task('nodemon', function(cb) {
  return nodemon({
    ext: 'js html css',
    script: __dirname + '/server/express-server.js',
    watch: src
  }).on('start', function() {
    console.log('Nodemon restarted');
    browserSync.reload();
  });
});


// Waits for HTML, CSS and IMG changes to reload
gulp.task('watch', function() {
  return gulp.watch(src, [])
    .on('change', changed_files)
    .on('error', taskError);
});
