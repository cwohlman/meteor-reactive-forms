Package.describe({
  summary: "Minimalistic library for making form contents reactive."
});

Package.on_use(function (api, where) {
  api.use('ui');
  api.use('templating');
  api.use('reactive-dict');
  api.use('underscore');
  
  // For validation
  api.use('rules');
  api.use('schema');
  api.imply('rules');
  api.imply('schema')

  api.add_files('reactive-context.js');
  api.add_files('child-context.js');
  api.add_files('children-context.js');

  api.add_files('reactive-form.html', ['client']);
  api.add_files('reactive-form.js');

  api.export('Forms');
});
