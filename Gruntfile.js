module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'client/src/js/<%= pkg.name %>.js',
                dest: 'client/build/js/<%= pkg.name %>.min.js'
            }
        },
        sass: {
            dist: {
                options: {
                    style: 'expanded'
                },
                files: {
                    'client/build/css/main.css': 'client/src/css/main.scss'
                }
            }
        },
        copy: {
            main: {
                cwd: 'client/src/html/',
                src: '**',
                dest: 'client/build/',
                filter: 'isFile',
                expand: true
            }
        },
        concat: {
            jquery: {
                files: {
                    'client/build/js/dep/jquery.min.js': ['bower_components/jquery/dist/jquery.min.js']
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // Load Sass plugin.
    grunt.loadNpmTasks('grunt-contrib-sass');
    // Load copy plugin.
    grunt.loadNpmTasks('grunt-contrib-copy');
    // Load bower-install-simple
    grunt.loadNpmTasks("grunt-bower-install-simple");
    // Load concat
    grunt.loadNpmTasks("grunt-contrib-concat");

    grunt.registerTask('bower', ['bower-install-simple', 'concat']);
    // Default task(s).
    grunt.registerTask('default', ['uglify', 'sass', 'copy', 'bower']);
};

/* vim: expandtab:tabstop=4:softtabstop=4:shiftwidth=4:set filetype=javascript: */
