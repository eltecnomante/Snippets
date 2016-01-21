var gulp = require('gulp');

require('require-dir')('./gulp-tasks');

gulp.task('default', ['nodemon', 'browser-sync', 'watch']);
