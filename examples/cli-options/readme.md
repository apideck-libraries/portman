# Portman CLI options

This example contains the setup of Portman where all the Portman CLI options are managed via a JSON file.

_use-case_: Run portman in CI/CD pipeline and pass the CLI options as part of a versioning system like GIT.

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

In our example, we want to define all the CLI options upfront and store it in GIT, so that it can be executed in a CI/CD
pipeline

- **local**: refers to the local OpenAPI file location to port to postman collection (examples/cli-options/crm.openapi.yml)
- **baseUrl**: overrides spec baseUrl with the defined value to use in the test suite
- **output**: refers to the location where the generated Postman collection file be stored (examples/cli-options/crm.postman.json)
- **portmanConfigFile**: refers to the portman configuration file with Portman settings, like Postman values to be replaced,
  overwritten, ... (examples/cli-options/portman-config.crm.json). This can be in JSON or YAML format.
- **postmanConfigFile**: refers to the [openapi-to-postman configuration file](https://github.com/postmanlabs/openapi-to-postman/blob/develop/OPTIONS.md) location with settings on how to transform and
  organize the Postman collection (examples/cli-options/postman-config.crm.json)
- **envFile**: refers to the .env file you want to use for environment variable injection (/examples/cli-options/.env)
- **includeTests**: a toggle to generate Postman tests based on the OpenAPI specification
- **postmanUid**: refers to the collection ID to upload the generated collection to your postman app
- **syncPostman**: a toggle to upload the newly created collection to the Postman app
- **runNewman**: a toggle to run Newman on a newly created collection

## Portman Newman CLI options

One of the Portman CLI options is to test the generated Postman collection, through Newman.
Portman has the option to support this out of the box. All [Newman configuration options](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/#options) to run Newman can be passed along.

Here are some several way run & manage the Newman execution in Portman, using the following parameters
- **runNewman**: a toggle to run Newman on a newly created collection
- **newmanRunOptions**: JSON (stringified) object to pass options for configuring the Newman test run
- **newmanOptionsFile**: Path to Newman options file to pass options for configuring Newman

### Newman options file

You can reference a Newman options file in JSON format, and pass that along with a Portman CLI parameter.

```
portman -u https://specs.apideck.com/crm.yml -c ./examples/cli-options/portman-config.json --runNewman --newmanOptionsFile ./examples/cli-options/newman-options.json
```

Example of a [`newman-options.json` config file](newman-options.json): 

```json
{
  "environment": "./tmp/crm/postman-dev.env.json",
  "iteration-count": 5,
  "ignore-redirects": true,
  "insecure": true
}
```

### Newman options as a CLI parameter

Another option to set the Newman options by passing the options as an object on the CLI.

```
portman -u https://specs.apideck.com/crm.yml -c ./tmp/crm/portman-config.json --runNewman --newmanRunOptions '{"environment":"./tmp/crm/postman-dev.env.json","iteration-count": 5}'
```

### Newman options as a CLI options settings

If you use to the `cliOptionsFile` file to centralize your Portman setting, you can simply include the Newman options as an object.

```ssh
portman --cliOptionsFile ./examples/cli-options/portman-cli-options-newman.json
```

Example of a [Portman CLI options file](portman-cli-options-newman.json):

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
  "runNewman": true,
  "newmanRunOptions": {
    "environment": "./tmp/crm/postman-dev.env.json",
    "iteration-count": 5,
    "ignore-redirects": true,
    "insecure": true
  }
}
```
