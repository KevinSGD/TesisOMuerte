module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (pkg.name === 'sharp') {
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.install = 'node-gyp rebuild';
        pkg.scripts.postinstall = 'node-gyp rebuild';
      }
      return pkg;
    },
  },
};