module.exports = {
  roots: ['<rootDir>/src'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/src/__tests__/testUtils/'],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
  transformIgnorePatterns: ['/node_modules/(?!@faker-js/faker/)'],
  modulePaths: ['src'],
  moduleNameMapper: {
    // Resolve the real package entry for tests that need Faker's actual API.
    '^@faker-js/faker/real$': require.resolve('@faker-js/faker'),
    '^@faker-js/faker$': '<rootDir>/src/__tests__/testUtils/mocks/faker.ts',
    '^src/(.*)': '<rootDir>/src/$1',
    '^lib/(.*)': '<rootDir>/src/lib/$1',
    '^utils/(.*)': '<rootDir>/src/utils/$1',
    '^application/(.*)': '<rootDir>/src/application/$1',
    '^oas/(.*)': '<rootDir>/src/oas/$1',
    '^postman/(.*)': '<rootDir>/src/postman/$1',
    '^portman/(.*)': '<rootDir>/src/portman/$1',
    '^testUtils/(.*)': '<rootDir>/__tests__/testUtils/$1'
  }
}
