Package.describe({
  summary: "REPLACEME - What does this package (or the original one you're wrapping) do?"
});

Package.on_use(function (api, where) {
  api.use('ui');
  api.use('reactive-dict');
  api.add_files('reactive-context.js', ['client']);
});
