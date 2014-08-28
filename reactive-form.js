Forms.helpers = {
	// event handlers
	onChange: function (name, value, e, tmpl) {
		this.set(name, value);
		this.validate(name, value);
	}
	, onInvalid: function (errors, e, tmpl) {
		console.log('Errors in form', errors);
		alert('Errors in form');
		throw new Error('Form is invalid.');
	}
	// helpers
	, validate: function (name, value, schema) {
		var self = this;
		schema = schema || this.get('schema', name);

		var errors = _.map(schema, function (options, key) {
			var validator = self.get('validators', key);
			
			try {
				return typeof validator === "function" && validator.call(self, value, options, name);
			} catch (error) {
				return error;
			}
			
		});
		
		errors = _.values(errors);

		errors = _.filter(errors, _.identity);

		this.set('errors', name, errors.length ? errors : null);

		return errors.length === 0;
	}
	, validateAll: function (item, schema) {
		var self = this
			, id = item && item._id;
		if (arguments.length === 0) {
			schema = this.dict.get('schema') || this.schema;
			item = null;
		} else if (arguments.length == 1) {
			schema = item || this.dict.get('schema') || this.schema;
			item = null;
		}
		var errors = _.map(schema, function (options, key) {
			return self.validate(key, self.get(id, 'item', key), options);
		});
		
		errors = _.values(errors);

		errors = _.filter(errors, function (e) {
			return !e;
		});

		return errors.length === 0;
	}
	, inputValue: function (element) {
		return {
			name: element.name
			, value: element.value
		};
	}
	, fields: function () {
		return _.map(this.get('schema', null), function (a, key) {
			a.name = key;
			return a;
		});
	}
	// sub-context helpers
	, withField: function (field, fieldName) {
		// field represents a schema entry
		return _.defaults({
			fieldName: fieldName
			, field: _.defaults({
					name: fieldName
				}
				, field
				, this.field || {}
			)
			// I think there's no need to allow a field to extend options,
			// options are fundementally form level, you should specify
			// field level options at the form level by settings the field
			// property
			// eg  form.field.class= "form-control"
			// not form.options.fieldClass = "form-control"
			// if we change our minds it would be easy to enable
			// , options: _.defaults({}, field.options, this.options)
		}
		, this
		);
	}
	, withFields: function () {
		return _.map(this.schema, this.withField, this);
	}
	, withButton: function (button, buttonName) {
		// button represents a buttons entry
		return _.defaults({
			buttonName: buttonName
			, button: _.defaults({
					name: buttonName
				}
				, button
				, this.button || {}
			)
		}
		, this
		);
	}
	, withButtons: function () {
		return _.map(this.buttons, this.withButton, this);
	}
	// validators
	, validators: {
		required: function (value, options) {
			if (!value && options) {
				return "This field is required";
			}
		}
		, number: function(val, options, fieldName){
			if (!val) return;
			// Validate that val is a valid number
			if(!_.isFinite(val)){
				return (fieldName + ' must be a number.');
			}

			// Validate that val meets given criteria (e.g. {larger: 4, smaller: 8})
			if ( _.isObject(options) ) {
				for (var key in options) {
					var num =options[key];
					switch (key) {
						case 'smaller':
							if (!(val < num)) return (fieldName + ' must be smaller than ' + num);
							break;
						case 'smallerOrEqual':
							if (!(val <= num)) return (fieldName + ' must be smaller than or equal to ' + num);
							break;
						case 'equal':
							if (!(val === num)) return (fieldName + ' must be equal to ' + num);
							break;
						case 'largerOrEqual':
							if (!(val >= num)) return (fieldName + ' must be larger than or equal to ' + num);
							break;
						case 'larger':
							if (!(val > num)) return (fieldName + ' must be larger than ' + num);
							break;
					}
				}
			}
		}
		, minLength: function(val, length, fieldName){
			if (!val) return;
			if(!_.isString(val) || val.length < length){
				return (fieldName + ' must be at least ' + length + ' characters.')
			}
		}
		, maxLength: function(val, length, fieldName){
			if (!val) return;
			if(!_.isString(val) || val.length > length){
				return (fieldName + ' must be ' + length + ' characters or less.')
			}
		}
		, options: function(val, options, fieldName){
			if (!val) return;
			if(!_.contains(options, val)){
				return (fieldName + ' must be one of ' + options.join(', '));
			}

		}
		, usPhoneNumber: function(val, options, fieldName){
			if (!val) return;
			val = val.replace(/[^0-9]/g, '');
			if(val.length !== 10){
				return (fieldName + ' must be a valid phone number.');
			}
		}
		, positiveNumber: function(val, options, fieldName){
			if (!val) return;
			val = Number(val);
			if(val <= 0 || !_.isFinite(val)){
				return (fieldName + ' must be a positive number.');
			}
		}
		, negativeNumber: function(val, options, fieldName){
			if (!val) return;
			val = Number(val);
			if(val >= 0 || !_.isFinite(val)){
				return (fieldName + ' must be a negative number.');
			}
		}
		, email: function(val, options, fieldName){
			if (!val) return;
			if(!emailRegex.test(val) || val.indexOf('.', val.indexOf('@')) == -1){
				return (fieldName + ' must be a valid email address.');
			}
		}
		, url: function(val, options, fieldName){
			if (!val) return;
			if(!urlRegex.test(val)){
				return (fieldName + ' must be a valid url.');
			}
		}
		, child: function (val, options, fieldName) {
			if (!options || typeof options != 'object') return;
			var self = this;
			var results =_.chain([].concat(val)).map(function (item) {
				return !self.validateAll(item, options, fieldName);
			}).filter(_.identity).value();
			return results.length ? fieldName + (val instanceof Array ? ' items are invalid' : ' is invalid') : null;
		}
		, validate: function (val, options, fieldName) {
			if (typeof options == "function") {
				return options.call(this, val, fieldName);
			}
		}
	}
};
Forms.events = {
	'submit': function (e, tmpl) {
		if (typeof this.onSubmit == 'function') {
			e.preventDefault();

			var formIsValid = this.validateAll();
			if (formIsValid) {
				// The false flag returns all changes to the item
				var changes = this.get(false);

				this.onSubmit(
					changes
					, this.item
					, e
					, tmpl
				);
			} else if (typeof this.onInvalid == 'function') {
				this.onInvalid(this.get('errors', null), e, tmpl);
			}
		}
	}
	, 'change': function (e, tmpl) {
		if (typeof this.onChange == 'function') {
			var value = Forms.helpers.inputValue(e.currentTarget);
			this.onChange(value.name, value.value, e, tmpl);
		}
		if (typeof this.onSubmit == 'function' && this.liveSubmit) {
			Forms.events.submit.apply(this, arguments);
		}
	}
	, 'liveChange': function (e, tmpl) {
		var value;
		if (typeof this.onLiveChange == 'function') {
			value = Forms.helpers.inputValue(e.currentTarget);
			this.onLiveChange(value.name, value.value, e, tmpl);
		}
		if (typeof this.onChange == 'function' && this.liveChange) {
			value = Forms.helpers.inputValue(e.currentTarget);
			this.onChange(value.name, value.value, e, tmpl);
		}
	}
};

Forms.eventSelectors = {
	'submit': [
		['submit', 'form']
	]
	, 'change': [
		["change", "input"]
		, ["change", "select"]
		, ["change", "textarea"]
		, ["change", "checkbox"]
		, ["change", "radio"]
	]
	, 'liveChange': [
		["keydown", "input"]
		, ["keydown", "textarea"]
	]
};


Template.reactiveForm.helpers({
	helpers: Forms.helpers
});

Template.reactiveForm.events(
	_.chain(Forms.eventSelectors)
	.pairs()
	.map(function (a) {
		var selector = a[1];
		selector = _.map(selector, function (part) {
			return part.join(" ");
		}).join(", ");
		var handler = Forms.events[a[0]];
		return [selector, handler];
	})
	.object()
	.value()
);
