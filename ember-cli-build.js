'use strict';
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    // Your Ember config
    fingerprint: {
      enabled: false  // Disable for Cordova
    },
    outputPaths: {
      app: {
        html: 'index.html'
      }
    }
  });

  // Get the Ember tree
  let tree = app.toTree();

  // Copy to cordova/www during build
  if (process.env.CORDOVA) {
    tree = funnel(tree, {
      destDir: 'cordova/www'
    });
  }

  return tree;
};
