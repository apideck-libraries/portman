# Portman - Globals

This example focuses on the `globals` settings of Portman. It is contains some very powerful options, to manipulate or replace keys/values/strings, in the full Postman collection.

_use-case_: 

- Mass replace certain keys
- Mass replace certain values/strings/objects

## CLI usage

```ssh
portman --cliOptionsFile ./examples/portman-globals/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPI defined in `crm.yml`, with only 1 entity (leads) to keep the example simple.

## Portman settings

The portman settings (in JSON format) consists out of multiple parts:

- **version** : which refers the Portman configuration version
- **globals**: which refers to the customization that apply for the whole Postman collection.

In this example we focus on the **globals** section and settings.

file: examples/portman-globals/portman-config.crm.json

```json
{
  "version": 1.0,
  "globals": {
    "keyValueReplacements": {
      "x-apideck-app-id": "{{applicationId}}"
    },
    "valueReplacements": {
      "<Bearer Token>": "{{bearerToken}}"
    },
    "rawReplacements": [
      {
        "searchFor": "Unify",
        "replaceWith": "Unify ApiDeck"
      }
    ]
  }
}
```

## Portman - "globals" properties

Version 1.0

##### Globals options:

- **collectionPreRequestScripts**: Array of scripts that will be injected as Postman Collection Pre-request Scripts that will execute before every request in this collection.
- **keyValueReplacements**: A map of parameter key names that will have their values replaced with the provided Postman variables.
- **valueReplacements**: A map of values that will have their values replaced with the provided values.
- **rawReplacements**: Consider this a "search & replace" utility, that will search a string/object/... and replace it with another string/object/...
  This is very useful to replace data from the OpenAPI specification to be used in the Postman test automation. 

## Example explained

In this example, we are zooming in on "globals" usage. For the basics on the testsuite configuration and usage in Portman, have a look at ["examples/testsuite-contract-tests"]("https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-contract-tests")

file: examples/portman-globals/postman.crm.json >>

```json
"globals": {
    "collectionPreRequestScripts": [
      "pm.collectionVariables.set('status', pm.iterationData.get('status') || 'open')"
    ],
    "keyValueReplacements": {
      "x-apideck-app-id": "{{applicationId}}"
    },
    "valueReplacements": {
      "<Bearer Token>": "{{bearerToken}}"
    },
    "rawReplacements": [
      {
        "searchFor": "Unify",
        "replaceWith": "Unify ApiDeck"
      }
    ]
  }
```

### collectionPreRequestScripts

By setting the `collectionPreRequestScripts`, all the script items in the array will be injected to the Postman "Pre-request script" on Postman collection level.

AFTER

![](./images/globals-prerequest-after.png)

### keyValueReplacements

The result will be that any key that matches `x-apideck-app-id` will be replaced by `{{applicationId}}` in the full collection.

BEFORE

![](./images/globals-key-before.png)

AFTER

![](./images/globals-key-after.png)

#### valueReplacements

The result will be that any value that matches `<Bearer Token>` will be replaced by the value `{{bearerToken}}` in the full collection.

BEFORE

![](./images/globals-value-before.png)

AFTER

![](./images/globals-value-after.png)

### rawReplacements

The result will be that any string/object that matches `Unify` will be replaced by the value `Unify ApiDeck` in the full collection. This also covers non-request/response data, like the description in the example

BEFORE

![](./images/globals-key-before.png)

AFTER

![](./images/globals-raw-after.png)
