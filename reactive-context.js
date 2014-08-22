Forms = {};

Forms.reactiveContext = function (item, helpers) {
	var args = _.toArray(arguments);

	// Convert last helper argument to object
	// see blaze/spacebars documentation for why this is necessary
	args[args.length - 1] = args[args.length - 1].hash;

	if (args.length == 1) {
		// Only the hash value was passed
		// we don't want to treat the first argument as
		// the item argument, because we want to allow this case:
		// {{#with reactiveContext item=item other=other}}
		item = null;
	} else {
		item = args[0];
		args = args.slice(1);
	}

	// item is required to have an id
	if (item && !item._id) {
		throw new Error('Reactive forms requires an id');
	}


	var context = {
		item: item
		// we use the id as a property name prefix in the get and set helpers
		, _id: item && item._id || Random.id()
		// marks this object as a reactive context
		, __reactiveContext: true
	};

	// we store the item twice on the context to allow it to be accessed in child contexts
	// the naming convention is taken 
	context[context._id + "_item"] = context.item;

	// an array of arguments to the _.extend function
	// which will be used to build the final data context we return.
	var extenders = args;

	// here we unshift context to the beginning of the extenders array
	// so that it will be first argument to the _.extend function
	// in other words, context will be the object extended
	extenders.unshift(context);

	// it would be interesting to see the performance cost of this line
	// technically speaking this is simply a convenience feature
	// since spacebars all ready allows access to parent contexts via
	// the ../ syntax.
	extenders.push({
		outerContext: this
	});

	// if the outer this is a reactiveContext we want to extend for
	// several reasons:
	// 1. the parent context often contains helpers which may be used in the child context
	// 2. the parent context contains objects which may be used in the child context
	// 3. the parent context often contains convenience objects 
	//   eg as a result of nested each helpers (each rows, each cells with: row=row cell=cell)
	if (this.__reactiveContext) {
		extenders.push(this);
	}

	// this attaches the get and set helpers, and any other helpers we may add
	extenders.push(reactiveContextHelpers);

	// contrary to the name we actually want to apply extenders
	// in the way we would apply defaults - don't override properties which already exist
	context = _.defaults.apply(_, extenders);

	// only initiallize the dictionary if one has not been specified
	if (!context.dict) {
		context.dict = new ReactiveDict();
	}

	return context;
};

UI.registerHelper('reactiveContext', Forms.reactiveContext);

var getChildChanges = function (original, changes, dict) {
	var stopDict = [], i = 0;
	var recursiveMake = function (item) {
		i++;
		if (i > 100000) throw new Error('Infinite Loop!');
		var match = false;
		if (!item || typeof item != 'object') return;
		if (stopDict.indexOf(item) != -1) return;
		stopDict.push(item);
		if (item && item._id) {
			var changes = dict.get(item._id + "_item");
			if (changes) {
				if (_.isArray(item) || _.isArray(changes)) {
					item = changes;
				} else {
					_.extend(item, changes);
				}
				match = true;
			}
		}
		_.each(item, function (a, i) {
			var childResult = recursiveMake(a);
			if (childResult) {
				match = true;
				item[i] = childResult;
			}
		});
		if (match) return item;
	};
	var result = _.isArray(parent) ? [] : {};
	var keys = _.uniq(_.keys(original).concat(_.keys(changes)));
	_.each(keys, function (key) {
		var val = changes[key] || original[key];
		var changed = recursiveMake(val);
		if (changed) result[key] = changed;
	});
	return result;
};

var reactiveContextHelpers = {
	get: function (id, property, name) {
		// helper to get this[id_property][name] first checking to see
		// if a modified value exists in this.dict
		// calling this function without specifying a truthy name argument
		// will return a copy of this[id_property] with any changes merged in

		// convert the arguments to an array so we can remove any Spacebars.kw object
		var args = _.toArray(arguments);
		if (args[args.length - 1] instanceof Spacebars.kw) {
			args.pop();
		}

		// make all 3 arguments optional
		if (args.length === 0) {
			name = true;
			property = null;
			id = null;
		} else if (args.length == 1) {
			name = id;
			property = null;
			id = null;
		} else if (args.length == 2) {
			name = property;
			property = id;
			id = null;
		}

		if (!property) property = "item";
		if (!id) id = this._id;

		check(id, String);
		check(property, String);
		check(name, Match.OneOf(String, Boolean));

		// by prefixing the property with the id we can store multiple items
		// in the same dict.
		var key = [id, property].join("_");
		// we normally want to get the prefixed version of an entity, to ensure we are getting
		// 'the right' entity, however some entities are not managed in this way,
		// schema is an object supported by the forms library, but which does not have an
		// associated id, instead we access it directly.
		// this also allows us to access any given property available on 'this' through 
		// the get accessor.
		// we don't want to allow accessing this[property] if the user has explicitly 
		// asked for the prefixed property by passing the id argument
		var item = this[key] || (args.length < 3 && this[property]) || {};
		var entry = this.dict.get(key) || {};

		if (name === true) {
			return _.extend(item, entry, getChildChanges(item, entry, this.dict));
		}

		if (name === false) {
			return _.extend(entry, getChildChanges(item, entry, this.dict));
		}

		if (entry.hasOwnProperty(name)) {
			return entry[name];
		}

		return item && item[name];
	}
	, set: function (id, property, name, value) {
		// helper to set this[id_property][name]
		// actual values are stored in this.dict

		// make first 2 arguments optional
		if (arguments.length === 2) {
			value = property;
			name = id;
			property = null;
			id = null;
		} else if (arguments.length == 3) {
			value = name;
			name = property;
			property = id;
			id = null;
		}

		if (!property) property = "item";
		if (!id) id = this._id;

		check(id, String);
		check(property, String);
		check(name, String);
		check(value, Match.Any);

		// by prefixing the property with the id we can store multiple items
		// in the same dict.
		var key = [id, property].join("_");
		var entry = this.dict.get(key);

		if (!entry) entry = {};

		// we allow explicitly removing a key using null or undefined
		// note that this makes it impossible to actually set the value
		// to null...
		// perhaps we could use a flag object eg. `if (value instanceof DeleteMe)`
		if (value !== null && value !== undefined) {
			entry[name] = value;
		} else {
			delete entry[name];
		}

		this.dict.set(key, entry);
	}
};