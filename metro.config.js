const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable inline requires for faster startup
config.transformer = {
  ...config.transformer,
  inlineRequires: true,
};

// Use Watchman for faster file watching
config.resolver = {
  ...config.resolver,
  useWatchman: true,
};

module.exports = config;
