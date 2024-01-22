module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: 6000,
  },
};