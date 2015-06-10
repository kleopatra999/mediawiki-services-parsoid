var Util = require( './mediawiki.Util.js' ).Util,
	coreutil = require('util'),
	ExtensionHandler = require('./ext.core.ExtensionHandler.js').ExtensionHandler,
	defines = require('./mediawiki.parser.defines.js'),
	InfoboxRequest = require( './mediawiki.ApiRequest.js' ).InfoboxRequest;

var Infobox = function() {};

// Inherit functionality from ExtensionHandler
coreutil.inherits(Infobox, ExtensionHandler);

/**
 * @method
 *
 * Handles parsing <infobox> tag.
 *
 * @param {TokenTransformManager} manager
 * @param {Object} pipelineOpts
 * @param {TagTk} token
 * @param {Function} cb
 */
Infobox.prototype.handleInfobox = function(manager, pipelineOpts, token, cb) {
	// templateArgInfo is set in TemplateHandler.onTemplate
	var arg, args = manager.frame.parentFrame.templateArgInfo[manager.frame.title].dict.params;
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
				var tokens = [];
				if ( html && html.trim() !== '' ) {
					tokens.push(new defines.TagTk('div', [{ 'k': 'typeof', 'v': 'mw:DOMFragment' }], { 'html': html }));
					tokens.push(new defines.EndTagTk('div'));
				} else {
					tokens.push(new defines.SelfclosingTagTk('meta', [new defines.KV('typeof', 'mw:Placeholder')]));
				}
				cb({'tokens': tokens, 'async': false});
			}
		}
	);
};

if (typeof module === "object") {
	module.exports.Infobox = Infobox;
}
