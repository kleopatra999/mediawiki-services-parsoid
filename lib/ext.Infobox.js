var Util = require( './mediawiki.Util.js' ).Util,
	coreutil = require('util'),
	ExtensionHandler = require('./ext.core.ExtensionHandler.js').ExtensionHandler,
	defines = require('./mediawiki.parser.defines.js'),
	InfoboxRequest = require( './mediawiki.ApiRequest.js' ).InfoboxRequest,
	DU = require( './mediawiki.DOMUtils.js').DOMUtils;

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
    try {
		  args[arg] = args[arg].wt;
    } catch ( err ) {
      console.log("Exception processing args for template: ", manager.frame.title);
    }
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
			cb({
				async: false,
				tokens: DU.buildDOMFragmentTokens(
					manager.env,
					token,
					html || '',
					null,
					// We want DSR added to it.
					{ setDSR: true, isForeignContent: true }
				)
			});
		}
	);
};

if (typeof module === "object") {
	module.exports.Infobox = Infobox;
}
