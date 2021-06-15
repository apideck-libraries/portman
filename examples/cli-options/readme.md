# Portman CLI options

This example contains the setup of Portman where all the Portman CLI options are managed via a JSON file.

_use-case_: Run portman in CI/CD pipeline and pass the CLI options as part of versioning system like GIT.

## CLI usage

```ssh
portman --cliOptionsFile ./examples/cli-options/portman-cli-options.json
```

## Portman CLI options settings

./examples/cli-options/portman-cli-options.json >>

```json
{
  "local": "./examples/cli-options/crm.openapi.yml",
  "baseUrl": "http://localhost:3050",
  "output": "./examples/cli-options/crm.postman.json",
  "postmanConfigFile": "./examples/cli-options/postman-config.crm.json",
  "includeTests": true,
  "portmanConfigFile": "./examples/cli-options/portman.crm.json",
  "envFile": "./examples/cli-options/.env",
  "postmanUid": "b43ee029-7e3f-4e20-9b81-f4a47dfb9c48",
  "runNewman": false
}
```

## Example explained

In our example we want to define all the CLI options upfront and store it in GIT, so that it can be executed in a CI/CD
pipeline

- **local**: refers to the local OpenAPI file location to port to postman collection (examples/cli-options/crm.openapi.yml)
- **baseUrl**: overrides spec baseUrl with the defined value to use in test suite
- **output**: refers to the location where the generated Postman collection file be stored (examples/cli-options/crm.postman.json)
- **portmanConfigFile**: refers to the portman configuration file with Portman settings, like Postman values to be replaced,
  overwriten, ... (examples/cli-options/portman-config.crm.json)
- **postmanConfigFile**: refers to the openapi-to-postman configuration file location with settings on how to transform and
  organise the Postman collection (examples/cli-options/postman-config.crm.json)
- **includeTests**: a toggle to generate Postman tests based on the OpenAPI specification
- **envFile**: refers to the .env file you want to use for environment variable injection (/examples/cli-options/.env)
- **postmanUid**: refers to the collection ID to upload the generated collection to your postman app
- **runNewman**: a toggle to run newman on newly created collection
