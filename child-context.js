Forms.childContext = function (fieldname) {
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

	// By prepending item and extensions to the args array
	// we pass through the remaining arguments.
	args.unshift(item, extensions);

	return Forms.reactiveContext.apply(this, args);
};

UI.registerHelper('childContext', Forms.childContext);
