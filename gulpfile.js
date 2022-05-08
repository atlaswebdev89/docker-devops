var gulp = require('gulp'),
    del    = require('del'),//Подключаем библиотеку для удаления файлов и папок
    cache = require('gulp-cache'), //Кеширование изображений
    imagemin = require('gulp-imagemin');// Сжатие изображение
    cssnano = require("gulp-cssnano"), // Минимизация CSS
    autoprefixer = require('gulp-autoprefixer'), // Проставлет вендорные префиксы в CSS для поддержки старых браузеров
    concat = require("gulp-concat"), // Объединение файлов - конкатенация
    uglify = require("gulp-uglify"), // Минимизация javascript
    rename = require("gulp-rename"); // Переименование файлов
var order = require("gulp-order"); // Порядок обработки файлов при конкатенации
var ftpV = require('vinyl-ftp'); // Для загрузки по ftp

//Доступ к ftp
var ftp_server="panel.by";
var ftp_user="lofts.by";
var ftp_password ="";

// Каталог для push в github pages
var gitPages = "/home/atlas/web/sites/buh/";

// Путь до vagrant каталога проекта  frontend-extensions
var vagrant = "/home/atlas/web/vagrant/devops/app/assets/";

//Деплой на предпродакшен  сервер по ftp 
gulp.task('deploy-ftp', function() {
                                        var conn = ftpV.create({
                                        host: ftp_server,
                                        user: ftp_user,
                                        password: ftp_password,
                                        parallel:  10,
                                        log: gutil.log
                                    });
            console.log("ftp task is running!");
            
            return gulp.src("dist/**/*", { dot: true, buffer: false })
                    .pipe(conn.dest('/'));
});

// Деплой в папку для github pages Папку очистить предварительно желательно
// 
// Копирование файлов html
gulp.task ("copy-files-gitPages", function () {
   return gulp.src("dist/**/*")
           .pipe(gulp.dest(gitPages))
});

gulp.task( 'deploy_gitPages',  gulp.series( 'copy-files-gitPages') );

/****************************************************************/


// Деплой в vagrant
/***************************************************************/


//Копируем шрифты в vagrant
gulp.task('fonts-vagrant', function() {
  return gulp.src(
            [
                "dist/fonts/**/*.+(ttf|svg|eot|woff|woff2)",
            ]
        )
    .pipe(gulp.dest(vagrant+'/frontend/fonts'))
});

//Копируем стили в vagrant
gulp.task('css-vagrant', function() {
  return gulp.src(
            [
                "dist/css/**/*",
            ]
        )
    .pipe(gulp.dest(vagrant+'frontend-extensions/css'))
});

//Копируем js в vagrant
gulp.task('js-vagrant', function() {
  return gulp.src(
            [
                "dist/js/**/*",
            ]
        )
    .pipe(gulp.dest(vagrant+'frontend-extensions/js'))
});

//Копируем images в vagrant
gulp.task('images-vagrant', function() {
  return gulp.src(
            [
                "dist/img/**/*",
            ]
        )
    .pipe(gulp.dest(vagrant+'frontend/images'))
});

gulp.task( 'deploy-vagrant',  gulp.parallel(
                                                 'fonts-vagrant',
                                                 'css-vagrant',
                                                 'js-vagrant',
                                                 'images-vagrant'
                                            ) );

/***************************************************************/

//Копирование файлов  html  из папки app
gulp.task("copy-html", function () {
    return gulp.src ("app/html/**/*")
            .pipe (gulp.dest("dist/"))
});

//Копирование файлов php  из папки app
gulp.task("copy-php", function () {
    return gulp.src ("app/php/**/*")
            .pipe (gulp.dest("dist/"))
});

//Копирование htaccess с использованием дополнительнной опции dot:true
gulp.task("htaccess", function () {
    return gulp.src ("app/.htaccess", { dot: true })
            .pipe (gulp.dest("dist/"))
});

//Копирование video 
gulp.task("video", function () {
    return gulp.src ("app/video/**/*")
            .pipe (gulp.dest("dist/video"))
});

//Копируем шрифты
gulp.task('fonts', function() {
  return gulp.src(
            [
                "app/fonts/**/*.+(ttf|svg|eot|woff|woff2)",
            ]
        )
    .pipe(gulp.dest('dist/fonts'))
});

//Оптимизация css
gulp.task("css", function () {
   return gulp.src("app/css/**/*.css")
        .pipe(concat('main.css'))
        .pipe(autoprefixer())
        .pipe(cssnano({zindex: false}))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest("dist/css")); 
});

//Оптимизация css
gulp.task("cssVendor", function () {
   return gulp.src("app/vendor/**/*.+(css)")
        .pipe(concat('core.css'))
        .pipe(autoprefixer())
        .pipe(cssnano({zindex: false}))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest("dist/css")); 
});

//Оптимизация js
gulp.task("scripts", function() {
    return gulp.src("app/js/*.js") // директория откуда брать исходники
        .pipe(concat('main.js')) // объеденим все js-файлы в один 
        .pipe(uglify()) // вызов плагина uglify - сжатие кода
        .pipe(rename({ suffix: '.min' })) // вызов плагина rename - переименование файла с приставкой .min
        .pipe(gulp.dest("dist/js")); // директория продакшена, т.е. куда сложить готовый файл
});

// Конкатинация и оптимизация всех js
gulp.task ("scriptsJS", function () {
    return gulp.src(
            [
                "app/vendor/**/*.+(js)", 
            ]) // директория откуда брать исходники
        .pipe(order([
                 'jquery/js/jquery-2.1.4.min.js',
        ])) // Порядок добавления файлов в общий файл
        .pipe(concat('core.js')) // объеденим все js-файлы в один 
        .pipe(uglify()) // вызов плагина uglify - сжатие кода
        .pipe(rename({ suffix: '.min' })) // вызов плагина rename - переименование файла с приставкой .min
        .pipe(gulp.dest("dist/js")); // директория продакшена, т.е. куда сложить готовый файл
});


//Оптимизация и копирование изображений шаблона
gulp.task("images-themes", function() {
    return gulp.src("app/img/**/*.+(png|jpeg|jpg|svg|gif|ico)")
            .pipe(cache(imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true
            })))
            .pipe(gulp.dest("dist/img"))
});

//Оптимизация и копирование изображений (основные Добавляются в WP через админку)
gulp.task("images-main", function() {
    return gulp.src("app/images/**/*.+(png|jpeg|jpg|svg|gif|ico)")
            .pipe(cache(imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true
            })))
            .pipe(gulp.dest("dist/images"))
});


//Оптимизация и копирование изображений проектов 
gulp.task("images_projects", function() {
    return gulp.src("app/foto/**/*.+(png|jpeg|jpg|svg|gif|ico)")
            .pipe(cache(imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true
            })))
            .pipe(gulp.dest("dist/foto"))
});



//Следить за изменениями в файлах
gulp.task ("watcher", function () {
    gulp.watch('app/html/**/*',   gulp.parallel('copy-html'));
    gulp.watch('app/php/**/*',   gulp.parallel('copy-php'));
    gulp.watch("app/fonts/**/*",  gulp.parallel('fonts'));
    gulp.watch("app/images/**/*.+(png|jpeg|jpg|svg|gif|ico)",  gulp.parallel('images-main'));
    gulp.watch("app/img/**/*.+(png|jpeg|jpg|svg|gif|ico)",  gulp.parallel('images-themes'));
    gulp.watch("app/loft_projects/**/*.+(png|jpeg|jpg|svg|gif|ico)",  gulp.parallel('images_projects'));
    gulp.watch("app/css/**/*.css", gulp.parallel("css"));
    gulp.watch("app/js/**/*.js", gulp.parallel("scripts"));
    gulp.watch("app/video/**/*", gulp.parallel("video"));

    gulp.watch("app/vendor/**/*.+(css)", gulp.parallel("cssVendor"));
    gulp.watch("app/vendor/**/*.+(js)", gulp.parallel("scriptsJS"));
});

//Для удаления папки dist перед сборкой
gulp.task("del", function () {
   return del('dist'); // Удаляем папку dist перед сборкой 
});

//Очистка кеша
gulp.task('clear', function (callback) {
	return cache.clearAll();
})

gulp.task("default", gulp.parallel(
                                    "copy-html", 
                                    "copy-php",
                                    "htaccess", 
                                    "images-themes",
                                    "images-main",
                                    "images_projects", 
                                    "fonts",
                                    "css",
                                    "video",
                                    "cssVendor",
                                    "scripts",
                                    "scriptsJS",
                                    "watcher"
        ));

gulp.task("build", gulp.series(
                                    "del", 
                                    "clear", 
                                    "copy-html", 
                                    "copy-php", 
                                    "htaccess", 
                                    "images-themes",
                                    "images-main",
                                    "images_projects", 
                                    "fonts",
                                    "css",
                                    "video",
                                    "cssVendor",
                                    "scripts",
                                    "scriptsJS",
        ));


