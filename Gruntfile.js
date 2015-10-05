// 'use strict()';

// var config= {
// 	port: 3000
// };

// module.exports = function(grunt) {

// 	// Load grunt tasks automatically
// 	require('load-grunt-tasks')(grunt);

// 	// Time how long tasks take. Can help when optimizing build times
// 	require('time-grunt')(grunt);

// 	var options = {
// 		config: {
// 			src: './grunt/*.js'
// 		},
// 		pkg: grunt.file.readJSON('package.json'),
// 		nodemon: {
// 			serve: {
// 				script: 'keystone.js',
// 				options: {
// 					ignore: ['node_modules/**']
// 				}
// 			}
// 		}
// 	};

// 	var configs = require('load-grunt-configs')(grunt, options);
	
// 	// Project configuration.
// 	grunt.initConfig(configs);

// 	// load jshint
// 	grunt.registerTask('lint', [
// 		'jshint'
// 	]);

// 	grunt.registerTask('dev', [
// 		'sass',
// 		'watch'
// 	]);

// 	// default option to connect server
// 	grunt.registerTask('serve', [
// 		'jshint',
// 		'concurrent:dev'
// 	]);

// 	grunt.registerTask('server', function () {
// 		grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
// 		grunt.task.run(['serve:' + target]);
// 	});


// };


module.exports = function(grunt) {
    'use strict';

    require('matchdep').filterDev('grunt-!(cli)').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        less: {
            dev: {
                options: {
                    sourceMap: true,
                    sourceMapFilename: 'public/assets/styles/site/layout.map'
                },
                files: {
                    'public/assets/styles/site/layout.css': 'public/assets/styles/site/layout.less'
                }
            }
        },
        watch: {
            all: {
                files: ['public/assets/styles/site/**/*.less'],
                tasks: ['less'],
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
  	grunt.loadNpmTasks('grunt-contrib-less');
  	grunt.registerTask('default', ['less', 'watch']);
};