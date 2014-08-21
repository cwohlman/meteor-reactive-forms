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
 - name, this is the name of the property being edited, for example 'age'

A few examples to clarify:

 - I want to access the age property of the item we are editing:
        this.get(this._id, 'item', 'age');
   Note that this.get defaults id and property to this._id and 'item' respectively, so all that is really necessary is:
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
 - id - this._id
 - property - 'item'
 - name - null (if null will return the entire object as specified by id, property and extended by any values found in the dict)

`set(id, property, name, value)` - id and property are optional, name and value are required. As in get the optional parameters are dropped from the right of the arguments list, and id and property are defaulted to the same values.

`set` does not support a null name value, there are several reasons for this:
 1. The use case for replacing the entire object is not clear, and it seems like this feature would be used by accident more likely than on purpose.
 2. Replacing the whole item is more likely to cause id changes, which are not supported. (if, for example duplicating an item, you might be tempted to simply replace the empty new item with the already populated original, resulting in and _id collision)
 3. Replacing the whole item ignores the fact that dictionary values override underlying item values only if they exist, so calling `this.set('item', null, {'name': 'new'})` would set the name property of the object being edited, but would not have the expected effect of removing other values which might be present.
 