module.exports = function(grunt) {
    grunt.initConfig({
        "jsbeautifier": {
            "default": {
                src: ["app/scripts/*.js", "gruntfile.js"]
            },
        }
    });


    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.registerTask('default', ['jsbeautifier']);

}
