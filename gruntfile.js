module.exports = function(grunt) {
    grunt.initConfig({
        "jsbeautifier": {
            "default": {
                src: ["app/scripts/*.js", "gruntfile.js"]
            },
        },
        'html-prettyprinter': {
            single: {
                // HTML file to beauty 
                src: 'app/popup.html',

                // Destination of HTML file 
                dest: 'app/popup.html'
            },
        }
    });


    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks('grunt-html-prettyprinter');
    grunt.registerTask('default', ['jsbeautifier', "html-prettyprinter"]);

}
