# Portman 👨🏽‍🚀

Port OpenAPI Spec to Postman Collection!

Portman sits on top of [@thim81](https://github.com/thim81)'s [open PR](https://github.com/thim81/openapi-to-postman). Tim has made awesome progress in converting an OAS to a Postman Collection with automated test injection. At [Apideck](https://apideck.com), we wanted to include this as part of an automated process that could be injecting directly into our CI/CD pipeline.

With Portman, we can:

- Set Environment variables
- Inject Collection variables
- Inject Pre-Execution Scripts on a collection or request level
- Adjust Request Bodies from spec generated to randomized
- As well as inject tests for each requests that validate:
  - status
  - contenttype
  - jsonbody
  - schema

## Install

1. yarn add -D portman
2. copy `.env.example` to `.env` and add environment variables you need available to your collection.
3. copy/rename and customize each of the \_\_\_\_.example.json config files in the root directory to suit your needs.

- Postman Configuration options can be found [here](https://github.com/thim81/openapi-to-postman/blob/develop/OPTIONS.md)
- Configuring test generation can be found [here](https://github.com/thim81/openapi-to-postman/blob/develop/TESTGENERATION.md)

## Usage

```
Usage: -u <url> -l <local> -b <baseUrl> -t <includeTests>

Options:
      --help                 Show help                                                    [boolean]
      --version              Show version number                                          [boolean]
  -u, --url                  URL of OAS to port to postman collection                     [string]
  -l, --local                Use local OAS to port to postman collection                  [string]
  -b, --baseUrl              Override spec baseUrl to use in test suite                   [string]
  -n, --runNewman            Run newman on newly created collection                       [boolean]
  -d, --newmanIterationData  Iteration data to run newman with newly created collection   [string]
  -p, --postmanUid           Collection ID to upload generated collection to postman      [string]
  -t, --includeTests         Inject test suite (default: true)                            [boolean]
  -c, --portmanConfigFile    Path to portman-config.json                                  [string]
  -s, --postmanConfigFile    Path to postman-config.json                                  [string]
  -g, --testSuiteConfigFile  Path to postman-testsuite.json                               [string]

```

### Environment:

Portman uses `dotenv` to not only access variables for functionality, but you can easily add environment variables that you'd like declared within your postman environment.
Simply prefix any variabled name with `PORTMAN_`, and it will be availble for use in your postman collection as the camelcased equivalent. For example:

```
PORTMAN_CONSUMER_ID=test_user_id
```

will be available in your collection or tests by referencing:

```
{{consumerId}}
```

### Config:

To generate the collection with tests, define a JSON file like the example (portman-config.json) below and run the CLI with the --generate option.

```
{
  "preRequestScripts": [
    "pm.collectionVariables.set('statusId', '12345')"
  ],
  "variableOverwrites": {
    "x-apideck-app-id": "{{applicationId}}"
  }
}

```

- **preRequestScripts**: Array of scripts that will be injected as Postman Pre-request Scripts that will execute before every request in this collection.
- **variableOverwrites**: A map of parameter key names that will have their values replaced with the provided Postman variables.

### Options:

Pass in the remote hosted spec:

```
yarn portman -u https://specs.apideck.com/crm.yml
```

Overwrite the baseUrl in spec and run newman.

```
yarn portman -u https://specs.apideck.com/crm.yml -b http://localhost:3050 -n true
```

Path pass to local data file for newman to use for iterations.

```
yarn portman -u https://specs.apideck.com/crm.yml -b http://localhost:3050 -n true -d ./tmp/newman/data/crm.json
```

Pass path to a local spec (useful when updating your specs)

```
yarn portman -l ./tmp/specs/crm.yml
```

Skip tests and just generate collection.

```
yarn portman -l ./tmp/specs/crm.yml -t false
```

Upload newly generated collection to Postman using the collection ID.

```
yarn portman -l ./tmp/specs/crm.yml -p 9601963a-53ff-4aaa-92a0-2e70a8a2a748
```

Pass custom paths for config files

```
yarn portman -u https://specs.apideck.com/crm.yml -c ./tmp/crm/portman-config.json -g ./tmp/crm/postman-testsuite.json  -s ./common/postman-config.json
```

### Output:

Your generated Postman Collection is written to `./tmp/converted/${specName}.json` if you are manually importing to Postman or need to inspect for debugging.

### TODO:

- add task to initalize config files
- add interactive cli prompts
- render better error on postman upload fail
- create collection if postman doesn't exist
