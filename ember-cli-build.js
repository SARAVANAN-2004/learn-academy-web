'use strict';

require('dotenv').config();
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {

    minifyCSS: {
      enabled: false,
    },

    // ✅ ENABLE SCSS
    sassOptions: {
      extension: 'scss'
    },

    // ✅ KEEP THIS (Bootstrap via ember-bootstrap)
    'ember-bootstrap': {
      bootstrapVersion: 4,
      importBootstrapCSS: true,
    },

  });

  return app.toTree();
};