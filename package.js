Package.describe({
  summary: "Minimalistic library for making form contents reactive."
});

Package.on_use(function (api, where) {
  api.use('ui');
  api.use('templating');
  api.use('reactive-dict');
  api.use('underscore');
  
  api.add_files('reactive-context.js', ['client']);
  api.add_files('child-context.js', ['client']);
  api.add_files('children-context.js', ['client']);

  api.add_files('reactive-form.html', ['client']);
  api.add_files('reactive-form.js', ['client']);

  api.export('Forms', ['client']);
});
