var gulp = require('gulp');

gulp.task('watch', function () {
    gulp.watch("./Content/scss/**/*.scss", ["sass"]);
    gulp.watch("./Content/**/*.ts", ["ts"]);
    gulp.watch("./Content/**/*.html", ["html"]);
});