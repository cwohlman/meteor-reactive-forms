This package provides a wrapper for forms which makes the form content reactive.

#Install the Package
Not yet on on meteorite, just clone into packages/reactive-forms and add reactive-forms to .meteor/packages, you may also want to add reactive-forms to packages/.gitignore

#Use the package

##reactiveContext
The underlying component of the reactive forms library. When called like this:

	{{#with reactiveContext myItem}}

Wraps your code with a `reactiveContext`, which contains 4 important properties:
 - `dict` a new ReactiveDict which stores unsaved changes, changes the user has made to your form, but which do not exist in the underlying data source (or parent data context)
 - `item` just the item you passed in, generally the item you want to modify, or null if you are creating a new item.
 - `get(name)` a helper function which accesses item and dict and returns a reactive (to user changes) version of item[name]
 - `set(name, value)` the compliment of get, mimics setting item[name], but actually stores the new value in this.dict

`reactiveContext`'s get and set logic is actually a little more complex than represented above, the reactive context is designed to be very flexible and will work in a variety of complex, but intuitive ways, for example when working with child items, or error messages. To support these use cases reactiveContext uses 3 part references when changing properties:
 - id, the _id of the item being edited (or requested)
 - property, not to be confused with name, this part refers to the kind of object being referenced, this defaults to 'item' and returns the dictionary entry which represents changes on the item being edited
 - name, this is the name of the property being edited, for example 'age', true and false are used instead of the name argument to request whole object, true if the return object should also include any original values which have not been overriden, false to include only changes.

A few examples to clarify:

 - I want to access the age property of the item we are editing:
        this.get(this.id, 'item', 'age');
   Note that this.get defaults id and property to this.id and 'item' respectively, so all that is really necessary is:
        this.get('age');
 - I want to store an error message about the age property:
        this.set('errors', 'age', 'age must be between 18 and 100');
 - I want to get the error message about the age property:
        this.get('errors', 'age');
 - I am in a child context and want to get info about the parent context
        this.get(parentId, 'item', 'maxChildCount');
   Note the parentContext is added as a property to any reactiveContext, for convenince

The full get and set signatures:

`get(id, property, name)` - All three arguments are optional, but optional parameters are processed in reverse order, if one argument is supplied it is assumed to be name, two arguments are assumed to be name and property, etc. Each argument defaults to the following:
 - id - this.id
 - property - 'item'
 - name - true (if null will return the entire object as specified by id, property and extended by any values found in the dict)

`set(id, property, name, value)` - id and property are optional, name and value are required. As in get the optional parameters are dropped from the right of the arguments list, and id and property are defaulted to the same values.

`set` does not support a null name value, there are several reasons for this:
 1. The use case for replacing the entire object is not clear, and it seems like this feature would be used by accident more likely than on purpose.
 2. Replacing the whole item is more likely to cause id changes, which are not supported. (if, for example duplicating an item, you might be tempted to simply replace the empty new item with the already populated original, resulting in and _id collision)
 3. Replacing the whole item ignores the fact that dictionary values override underlying item values only if they exist, so calling `this.set('item', null, {'name': 'new'})` would set the name property of the object being edited, but would not have the expected effect of removing other values which might be present.

##reactiveForm
The reactiveForm helper is intended to the be the most commonly used helper in the forms library, the reactiveForm helper provides two things in addition to the base functionality provided by the reactiveContext helper
 1. The reactiveForm helper provides several additional helper functions which relate specifically to forms, and in particular many of them relate to validation.
    - `validate(name, value, schema)` validates the property name with value value against the specified schema, or this.schema, returns true if the value is valid. Error messages are stored in this.errors
    validateAll(item, schema) validates all fields in schema, like validate returns true if valid and stores errors in this.errors;
    - `inputValue(element)` examins an element (presumably an input element or other reactiveForm control) and returns an object with two keys, name and value, used by the change event handler to deturmine which property to update, and what the new value should be.
    - `fields` returns the keys for the schema object, useful for autolayout of forms
    - `withField(field, fieldName)` extends the current context with field specific properties, namely it sets `this.field` to `this.schema[fieldName]`
    - `withFields` returns an array of withField contexts, useful for laying out every field in a form
    - `withButton(button, buttonName)` extends the current context with button specific properties, namely it sets `this.button` to `this.buttons[buttonName]`
    - `withButtons` returns an array of withButton contexts, useful for laying out every button in a form, or sub-form;

 2. The reactiveForm helper also provides event handling
    When the forms library handles an event, it looks for a named handler in the local data context (the `this` of the event handler).

    To use event handlers just add your handler as an additional hash argument to the reactiveForm tag (eg `{{reactiveForm item=item onSubmit=onSubmit}}``)

    Event handlers are called with some custom arguments followed by the standard event arguments provided by meteor.

    The reactiveForm helper handles 4 events:
        - onSubmit, this function will be called when your form is submitted with the following 2 arguments:
           - values, any changes made to the object
           - original, the object as it was passed in - we currently do not garuntee that child objects of the original item have not been modified
        - onChange, this function is called when a form input is modified. If you implement this function remember that you are overriding the default onChange function, and should apply all changes using `this.set`. The method is passed two parameters, which we currently use a very simple process to obtain (if they are incorrect or insufficient you can access the e and tmpl parameters which are passed through):
           - name, name of the field being modified
           - value, the new value
        - onLiveChange, this handler has identical arguments and behavior to onChange, but watches a more agressive set of events, and as a result updates more quickly. You can redirect onLiveChange events to the onChange handler by passing `liveChange=true` when creating the form
        - onInvalid, this handler is fired instead of the onSubmit event if form validation fails, your function will be called with one argument:
            - errors, a dictionary, who's keys corrospond the the propertyNames in the provided schema. Any key with a truthy value represents an error, the default validator function will set errors[name] to an array containing all the errors related to the name property (eg, required, min length, etc.)

