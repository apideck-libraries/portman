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
  "portmanConfigFile": "./examples/cli-options/portman-config.crm.json",
  "postmanConfigFile": "./examples/cli-options/postman-config.crm.json",
  "envFile": "./examples/cli-options/.lead.env",
  "includeTests": true,
  "syncPostman": false,
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
  overwritten, ... (examples/cli-options/portman-config.crm.json)
- **postmanConfigFile**: refers to the [openapi-to-postman configuration file](https://github.com/postmanlabs/openapi-to-postman/blob/develop/OPTIONS.md) location with settings on how to transform and
  organise the Postman collection (examples/cli-options/postman-config.crm.json)
- **envFile**: refers to the .env file you want to use for environment variable injection (/examples/cli-options/.env)
- **includeTests**: a toggle to generate Postman tests based on the OpenAPI specification
- **postmanUid**: refers to the collection ID to upload the generated collection to your postman app
- **syncPostman**: a toggle to upload the newly created collection to the Postman app
- **runNewman**: a toggle to run newman on newly created collection
