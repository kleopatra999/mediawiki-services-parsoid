var Util = require( './mediawiki.Util.js' ).Util,
	coreutil = require('util'),
	ExtensionHandler = require('./ext.core.ExtensionHandler.js').ExtensionHandler,
	defines = require('./mediawiki.parser.defines.js'),
	InfoboxRequest = require( './mediawiki.ApiRequest.js' ).InfoboxRequest;

var Infobox = function() {};

// Inherit functionality from ExtensionHandler
coreutil.inherits(Infobox, ExtensionHandler);

Infobox.prototype.handleInfobox = function(manager, pipelineOpts, token, cb) {
	// templateArgInfo is set in TemplateHandler.onTemplate
	var arg, args = manager.frame.parentFrame.templateArgInfo.dict.params;
	for ( arg in args ) {
		args[arg] = args[arg].wt;
	}

	// This async signalling has to happen before any further pipeline processing
	cb({'async': true});

	(new InfoboxRequest(
		manager.env,
		token.getAttribute('source'),
		args,
		manager.env.page.name
	)).once(
		'src',
		function(error, html) {
			if(error) {
				// Fail gracefully in case of error (which is already logged within mediawiki.ApiRequest.js)
				cb({'async': false});
			} else {
				var tokens = [
					new defines.TagTk('div', [{ 'k': 'typeof', 'v': 'mw:DOMFragment' }], { 'html': html }),
					new defines.EndTagTk('div')
				];
				cb({'tokens': tokens, 'async': false});
			}
		}
	);
};

if (typeof module === "object") {
	module.exports.Infobox = Infobox;
}
