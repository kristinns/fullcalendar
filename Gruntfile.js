
module.exports = function(grunt) {

	// Load required NPM tasks.
	// You must first run `npm install` in the project's root directory to get these dependencies.
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch'); // Very useful for development. See README.


	// this will eventually get passed to grunt.initConfig
	var config = {
		pkg: grunt.file.readJSON('package.json'), // do this primarily for templating (<%= %>)

		// initialize multitasks
		concat: {},
		uglify: {},
		copy: {},
		compress: {},
		clean: {},
		watch: {} // we will add watch tasks whenever we do concats, so files get re-concatenated upon save
	};


	// files that the demos might need in the distributable
	var dependencyFiles = require('./build/dependencies.js');


	/* Important Top-Level Tasks
	----------------------------------------------------------------------------------------------------*/

	grunt.registerTask('default', 'dist'); // what will be run with a plain old "grunt" command

	grunt.registerTask('dist', 'Create a distributable ZIP file', [
		'clean:build',
		'submodules',
		'uglify',
		'copy:dependencies',
		'copy:demos',
		'copy:misc',
		'compress'
	]);

	grunt.registerTask('dev', 'Build necessary files for developing and debugging', 'submodules');

	grunt.registerTask('submodules', 'Build all FullCalendar submodules', [
		'main',
		'gcal'
	]);


	/* Main FullCalendar Submodule
	----------------------------------------------------------------------------------------------------*/

	grunt.registerTask('main', 'Build the main FullCalendar submodule', [
		'concat:mainJs',
		'concat:mainCss',
		'concat:mainPrintCss'
	]);

	// JavaScript

	config.concat.mainJs = {
		options: {
			process: true // replace template variables
		},
		src: [
			'src/intro.js',
			'src/defaults.js',
			'src/main.js',
			'src/Calendar.js',
			'src/Header.js',
			'src/EventManager.js',
			'src/date_util.js',
			'src/util.js',
			'src/basic/MonthView.js',
			'src/basic/BasicWeekView.js',
			'src/basic/BasicDayView.js',
			'src/basic/BasicView.js',
			'src/basic/BasicEventRenderer.js',
			'src/agenda/AgendaWeekView.js',
			'src/agenda/AgendaDayView.js',
			'src/agenda/AgendaView.js',
			'src/agenda/AgendaEventRenderer.js',
			'src/common/View.js',
			'src/common/DayEventRenderer.js',
			'src/common/SelectionManager.js',
			'src/common/OverlayManager.js',
			'src/common/CoordinateGrid.js',
			'src/common/HoverListener.js',
			'src/common/HorizontalPositionCache.js',
			'src/outro.js'
		],
		dest: 'build/out/fullcalendar/fullcalendar.js'
	};

	config.watch.mainJs = {
		files: config.concat.mainJs.src,
		tasks: 'concat:mainJs'
	};

	// CSS

	config.concat.mainCss = {
		options: {
			process: true // replace template variables
		},
		src: [
			'src/main.css',
			'src/common/common.css',
			'src/basic/basic.css',
			'src/agenda/agenda.css'
		],
		dest: 'build/out/fullcalendar/fullcalendar.css'
	};

	config.watch.mainCss = {
		files: config.concat.mainCss.src,
		tasks: 'concat:mainCss'
	};

	// CSS (for printing)

	config.concat.mainPrintCss = {
		options: {
			process: true // replace template variables
		},
		src: [
			'src/common/print.css'
		],
		dest: 'build/out/fullcalendar/fullcalendar.print.css'
	};

	config.watch.mainPrintCss = {
		files: config.concat.mainPrintCss.src,
		tasks: 'concat:mainPrintCss'
	};


	/* Google Calendar Submodule
	----------------------------------------------------------------------------------------------------*/

	grunt.registerTask('gcal', 'Build the Google Calendar submodule', 'concat:gcalJs');

	config.concat.gcalJs = {
		options: {
			process: true // replace template variables
		},
		src: [
			'src/gcal/gcal.js'
		],
		dest: 'build/out/fullcalendar/gcal.js'
	};

	config.watch.gcalJs = {
		files: config.concat.gcalJs.src,
		tasks: 'concat:gcalJs'
	};


	/* Minify the JavaScript
	----------------------------------------------------------------------------------------------------*/

	config.uglify.all = {
		options: {
			preserveComments: 'some' // keep comments starting with /*!
		},
		expand: true,
		src: [ 'build/out/fullcalendar/fullcalendar.js' ],
		ext: '.min.js'
	}


	/* Copy Dependencies
	----------------------------------------------------------------------------------------------------*/

	config.copy.dependencies = {
		expand: true,
		flatten: true,
		src: dependencyFiles,
		dest: 'build/out/jquery/' // all depenencies will go in the jquery/ directory for now
		                          // (because we only have jquery and jquery-ui)
	};


	/* Demos
	----------------------------------------------------------------------------------------------------*/

	config.copy.demos = {
		options: {
			// while copying demo files over, rewrite <script> and <link> tags for new dependency locations
			processContentExclude: 'demos/*/**', // don't process anything more than 1 level deep (like assets)
			processContent: function(content) {
				content = rewriteDemoScriptTags(content);
				content = rewriteDemoStylesheetTags(content);
				return content;
			}
		},
		src: 'demos/**',
		dest: 'build/out/'
	};

	function rewriteDemoScriptTags(content) {
		return content.replace(
			/(<script[^>]*src=['"])(.*?)(['"][\s\S]*?<\/script>)/g,
			function(full, before, src, after) {
				if (src == '../build/dependencies.js') {
					var scriptTags = [];
					for (var i=0; i<dependencyFiles.length; i++) {
						var fileName = dependencyFiles[i].replace(/.*\//, '');
						scriptTags.push("<script src='../jquery/" + fileName + "'></script>"); // all dependencies are in jquery/ for now
					}
					return scriptTags.join("\n");
				}
				else {
					src = src.replace('../build/out/', '../');
					src = src.replace('/fullcalendar.', '/fullcalendar.min.'); // use minified version of main JS file
					return before + src + after;
				}
			}
		);
	}

	function rewriteDemoStylesheetTags(content) {
		return content.replace(
			/(<link[^>]*href=['"])(.*?\.css)(['"][^>]*>)/g,
			function(full, before, href, after) {
				href = href.replace('../build/out/', '../');
				return before + href + after;
			}
		);
	}


	/* Copy Misc Files
	----------------------------------------------------------------------------------------------------*/

	config.copy.misc = {
		src: [
			'*LICENSE.txt',
			'changelog.txt'
		],
		dest: 'build/out/'
	};


	/* Create ZIP file
	----------------------------------------------------------------------------------------------------*/

	config.compress.all = {
		options: {
			archive: 'dist/<%= pkg.name %>-<%= pkg.version %>.zip'
		},
		expand: true,
		cwd: 'build/out/',
		src: '**',
		dest: '<%= pkg.name %>-<%= pkg.version %>/' // have a top-level directory in the ZIP file
	};


	/* Bower Component (http://twitter.github.com/bower/)
	----------------------------------------------------------------------------------------------------*/

	grunt.registerTask('component', [
		'clean:build',
		'submodules',
		'uglify', // we want the minified JS in there
		'copy:component',
		'componentConfig'
	]);

	config.copy.component = {
		expand: true,
		cwd: 'build/out/fullcalendar/',
		src: '**',
		dest: 'build/component/', // this is where all files will end up
	};

	grunt.registerTask('componentConfig', function() {
		// start with a pre-populated component.json file and fill in the "name" and "version"
		var componentConfig = grunt.file.readJSON('build/component.json');
		componentConfig.name = config.pkg.name;
		componentConfig.version = config.pkg.version;
		grunt.file.write(
			'build/component/component.json',
			JSON.stringify(componentConfig, null, 2)
		);
	});


	/* Clean Up Files
	----------------------------------------------------------------------------------------------------*/

	config.clean.build = [
		'build/out/',
		'build/component/'
	];

	config.clean.dist = 'dist/';



	// finally, give grunt the config object...
	grunt.initConfig(config);
};
