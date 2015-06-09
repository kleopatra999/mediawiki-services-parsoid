var Util = require( './mediawiki.Util.js' ).Util,
	coreutil = require('util'),
	ExtensionHandler = require('./ext.core.ExtensionHandler.js').ExtensionHandler,
	defines = require('./mediawiki.parser.defines.js'),
	InfoboxRequest = require( './mediawiki.ApiRequest.js' ).InfoboxRequest;

var Infobox = function() {};

// Inherit functionality from ExtensionHandler
coreutil.inherits(Infobox, ExtensionHandler);

Infobox.prototype.handleInfobox = function(manager, pipelineOpts, token, cb) {
	var args = manager.frame.parentFrame.templateArgInfo.dict.params;
	for ( var arg in args ) {
		args[arg] = args[arg].wt;
	}

	// This async signalling has to happen before any further pipeline processing
	cb({'async': true});

	(new InfoboxRequest(manager.env, token.getAttribute('source'), args, manager.env.page.name)).once('src', function(error, html) {
		var tokens = [
			new defines.TagTk('div', [{ 'k': 'typeof', 'v': 'mw:DOMFragment' }], { 'html': html }),
			new defines.EndTagTk('div')
		];
		cb({'tokens': tokens, 'async': false});
	});
};

if (typeof module === "object") {
	module.exports.Infobox = Infobox;
}
