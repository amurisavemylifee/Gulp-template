const { src, dest, watch, parallel, series } = require('gulp');

const scss = require('gulp-sass'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync').create(),
    uglify = require('gulp-uglify-es').default,
    autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    del = require('del'),
    rename = require('gulp-rename'),
    csso = require('gulp-csso'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    rigger = require('gulp-rigger'),
    purgecss = require('gulp-purgecss');

function browsersync() {
    browserSync.init({ server: { baseDir: 'dev' } })
}

function cleanDist() {
    return del('build')
}

function build() {
    return src(['dev/*.css', 'dev/fonts/**/*', 'dev/*.js', 'dev/*.html'], { base: 'dev' })
        .pipe(dest('build'))
}

function template() {
    return src('dev/components/layout.html')
        .pipe(rigger())
        .pipe(rename(function (path) {
            path.basename = "index";
        }))
        .pipe(dest('dev'))
        .pipe(browserSync.stream())
}

function images() {
    return src('dev/img/**/*')
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(dest('build/img'))
}

function scripts() {
    return src(['dev/scripts/**/*.js', '!dev/scripts/_*/**/*'])
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.basename += ".min";
        }))
        .pipe(sourcemaps.write())
        .pipe(dest('dev'))
        .pipe(browserSync.stream())
}

function styles() {
    return src('dev/styles/style.scss')
        .pipe(sourcemaps.init())
        .pipe(scss({ outputStyle: "compressed", basedir: "src" }))
        .pipe(concat('style.min.css'))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version'], grid: true }
        ))
        .pipe(
            purgecss({
                content: ['dev/components/**/*.html']
            })
        )
        .pipe(csso())
        .pipe(sourcemaps.write())
        .pipe(dest('dev'))
        .pipe(browserSync.stream())
}

function watching() {
    watch(['dev/styles/**/*.scss', '!dev/styles/_*/**/*'], series(styles))
    watch(['dev/scripts/**/*.js', '!dev/scripts/_*/**/*'], scripts)
    watch(['dev/components/**/*.html']).on('change', parallel(template))
}

exports.browsersync = browsersync;
exports.styles = styles;
exports.template = template;
exports.scripts = scripts;
exports.images = images;
exports.build = build;
exports.watching = watching;

exports.build = series(cleanDist, images, build);
exports.default = parallel(scripts, styles, template, browsersync, watching);