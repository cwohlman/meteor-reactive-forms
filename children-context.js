Forms.childrenContext = function (fieldname) {
	// Wraps reactiveContext to set the correct item, schema and 'fieldname' for
	// the child field
	var args = _.toArray(arguments).slice(1);

	var schema = this.get('schema', fieldname) || {};
	var item = this.get('item', fieldname);
	var extensions = {
		// schema defines this field, schema.child defines the schema for the
		// child object.
		schema: schema.child
		, field: schema
		, fieldname: fieldname
	};

	args.unshift(extensions);

	var self = this;

	return _.isArray(item) && _.map(item, function (child) {
		return Forms.reactiveContext.apply(self, [child].concat(args));
	});
};

UI.registerHelper('childrenContext', Forms.childrenContext);