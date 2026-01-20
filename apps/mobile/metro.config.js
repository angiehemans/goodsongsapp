const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Find the project root (monorepo root)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Ensure we can resolve workspace packages
    extraNodeModules: {
      '@goodsongs/tokens': path.resolve(monorepoRoot, 'packages/tokens'),
      '@goodsongs/api-client': path.resolve(monorepoRoot, 'packages/api-client'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
