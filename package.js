Package.describe({
  summary: "REPLACEME - What does this package (or the original one you're wrapping) do?"
});

Package.on_use(function (api, where) {
  api.use('ui');
  api.use('templating');
  api.use('reactive-dict');
  api.use('underscore');
  
  api.add_files('reactive-context.js', ['client']);

  api.add_files('form.html', ['client']);
  api.add_files('form.js', ['client']);
});
