# Portman CLI options

This example contains the setup of Portman where all the Portman CLI options are managed via a JSON file.

_use-case_: Run portman in CI/CD pipeline and pass the CLI options as part of versioning system like GIT.

## CLI usage

```ssh
yarn portman --cliOptionsFile ./examples/cli-options/portman-cli-options.json
```

## Portman CLI options settings

./examples/cli-options/portman-cli-options.json >>

```json
{
  "local": "./examples/cli-options/crm.yml",
  "baseUrl": "http://localhost:3050",
  "portmanConfigFile": "./examples/cli-options/portman-config.crm.json",
  "postmanConfigFile": "./examples/cli-options/postman-config.crm.json",
  "includeTests": true,
  "testSuiteConfigFile": "./examples/cli-options/postman-testsuite.crm.json",
  "postmanUid": "b43ee029-7e3f-4e20-9b81-f4a47dfb9c48",
  "runNewman": false
}
```

## Example explained

In our example we want to define all the CLI options upfront and store it in GIT, so that it can be executed in a CI/CD
pipeline

- local: refers to the local OpenApi file location to port to postman collection
- baseUrl : Overrides spec baseUrl with the defined value to use in test suite
- portmanConfigFile: refers to the portman configuration file with Portman settings, like Postman values to be replaced,
  overwriten, ...
- postmanConfigFile: refers to the openapi-to-postman configuration file location with settings on how to transform and
  organise the Postman collection
- includeTests: a toggle to generate Postman tests based on the OpenApi specification
- testSuiteConfigFile: refers to the openapi-to-postman testsuite configuration file location, which defines the test
  suite generation
- postmanUid : refers to the collection ID to upload the generated collection to your postman app
- runNewman: a toggle to run newman on newly created collection                       
