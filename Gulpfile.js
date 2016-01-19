var gulp = require('gulp');
var sass = require('gulp-sass');

//styles task
gulp.task('mobileStyles', function () {
  gulp.src('Content/mobile/sass/**/*.scss').pipe(sass().on('error', sass.logError)).pipe(gulp.dest('Content/mobile'));
});

gulp.task('desktopStyles', function () {
  gulp.src('Content/desktop/sass/**/*.scss').pipe(sass().on('error', sass.logError)).pipe(gulp.dest('Content/desktop'));
});

//Watch task
gulp.task('watch', function () {
  gulp.watch('Content/mobile/sass/**/*.scss', ['mobileStyles']);
  gulp.watch('Content/desktop/sass/**/*.scss', ['desktopStyles']);
});

//default task
gulp.task('default', ['mobileStyles', 'desktopStyles', 'watch']);
