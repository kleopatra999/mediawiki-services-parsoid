/*
 * This is a sample configuration file.
 *
 * Copy this file to localsettings.js and edit that file to fit your needs.
 *
 * Also see the file ParserService.js for more information.
 */

exports.setup = function( parsoidConfig ) {
	parsoidConfig.useSelser = true;
	parsoidConfig.maxRequestsPerChild = 100;
};
