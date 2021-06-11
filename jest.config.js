module.exports = {
  roots: ['<rootDir>/src'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  modulePaths: ['src'],
  moduleNameMapper: {
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
