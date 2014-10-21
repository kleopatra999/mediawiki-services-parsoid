var Util = require( './mediawiki.Util.js' ).Util,
	coreutil = require('util'),
	ExtensionHandler = require('./ext.core.ExtensionHandler.js').ExtensionHandler,
	defines = require('./mediawiki.parser.defines.js'),
	async = require('async'),
	Title = require( './mediawiki.Title.js' ).Title;

var Gallery = function() {};

// Inherit functionality from ExtensionHandler
coreutil.inherits(Gallery, ExtensionHandler);

Gallery.prototype.handleGallery = function(manager, pipelineOpts, token, cb /* parsoid */) {
	var tagWidths = token.dataAttribs.tagWidths,
		outerSource = token.getAttribute('source'),
		innerSource = outerSource.substring(tagWidths[0], outerSource.length - tagWidths[1]),
		lines = innerSource.split('\n'),
		offset = tagWidths[0] + token.dataAttribs.tsr[0],
		items = [],
		i;

	// This async signalling has to happen before any further pipeline processing
	cb({'async': true});

	for(i = 0; i<lines.length; i++) {
		items.push({ 'wt': lines[i], 'offset': offset });
		offset += lines[i].length + 1;
	}

	async.map(
		items,
		this._processLine.bind(this, manager),
		this._processLinesHandler.bind(this, token, cb)
	);
};

Gallery.prototype._processLine = function(manager, item, callback /* async */) {
	// Same regex as here: https://github.com/Wikia/app/blob/dev/includes/parser/Parser.php#L5256
	var matches = item.wt.match(/^([^|]+)(\\|(.*))?$/),
		hasFileNamespace,
		wikitext,
		offset;

	if(!matches) {
		callback(null, this._buildPlaceholderToken(item.wt));
		return;
	}

	hasFileNamespace = Title.fromPrefixedText(manager.env, matches[1]).ns.isFile();
	wikitext = '[[' + ( hasFileNamespace ? '' : 'File:' ) + item.wt + '|thumb|none]]';

	this._parse(
		manager,
		wikitext,
		// Calculate source offset for Parsoid pipeline:
		// subtract 2 for [[ prepended above and optionally 5 for File:
		item.offset - 2 - ( hasFileNamespace ? 0 : 5 ),
		this._parseHandler.bind(this, callback, item.wt, hasFileNamespace)
	);
};

Gallery.prototype._processLinesHandler = function(token, finalcb /* parsoid */, error, results) {
	var tokens = [],
		da = Util.clone(token.dataAttribs),
		i,
		j;
	da.stx = undefined;

	tokens.push(new defines.TagTk('div', [new defines.KV('typeof', 'mw:Extension/nativeGallery'), new defines.KV('data-mw', JSON.stringify({'name':'gallery'}))], da));
	for(i = 0; i < results.length; i++) {
		for(j = 0; j < results[i].length; j++) {
			tokens.push(results[i][j]);
		}
		if(i !== results.length - 1) {
			// Emit new line token between each token (either placeholder or image) to make up for
			// split('\n') and so does dsr not puke
			tokens.push('\n');
		}
	}
	tokens.push(new defines.EndTagTk('div'));
	finalcb({'tokens': tokens, 'async': false});
};

Gallery.prototype._parse = function(manager, wt, offset, callback) {
	var pipeline = manager.pipeFactory.getPipeline('text/x-mediawiki/full', {});
	pipeline.setSourceOffsets(offset, offset + wt.length);
	pipeline.addListener('document', callback);
	pipeline.process(wt);
};

Gallery.prototype._parseHandler = function(callback /* async */, wt, hasFileNamespace, doc) {
	if(doc.body.childNodes.length !== 1 || doc.body.firstChild.getAttribute('typeof') !== 'mw:Image/Thumb') {
		callback(null, this._buildPlaceholderToken(wt));
		return;			
	}
	// Add information about file namespace presence to data-parsoid
	// so on the way back we can correctly recreate wikitext if needed.
	var dp = JSON.parse(doc.body.firstChild.getAttribute('data-parsoid'));
	dp.hasFileNamespace = hasFileNamespace;
	doc.body.firstChild.setAttribute('data-parsoid', JSON.stringify(dp));
	callback(null, this._buildDOMFragment(doc.body.innerHTML));
};

Gallery.prototype._buildPlaceholderToken = function(src) {
	return [
		new defines.SelfclosingTagTk('meta', [new defines.KV('typeof', 'mw:Placeholder')], { 'src': src })
	];
};

Gallery.prototype._buildDOMFragment = function(src) {
	return [
		new defines.TagTk('div', [{ 'k': 'typeof', 'v': 'mw:DOMFragment' }], { 'html': src }),
		new defines.EndTagTk('div')
	];
};

if (typeof module === "object") {
	module.exports.Gallery = Gallery;
}