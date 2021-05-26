# OpenApi Postman test suite generation - overwriteRequests

In the "[examples/testsuite-default-checks](https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-default-checks)" example, we explained the default generated Postman contract tests. 

This example focusses on the manipulation of the Postman collection to make it possible to setup automation, by manipulating

- Request bodies

- Request headers

- Request query params

_use-cases_: 

- Generate Postman flows that require unique values

- Reference a created entity to be used in Read/Update/Delete flows by setting the ID reference as query parameter

- Overwrite an example value with an actual value that exists in the API

## CLI usage

```ssh
yarn portman --cliOptionsFile ./examples/testsuite-overwrites/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPi defined in `crm.yml`, with only 1 entity (leads) to keep the example simple and convert to Postman with all the default testuite tests generated out-of-the-box + overwrite specific values in the generated Postman collection.

## Testsuite settings

The test suite settings (in JSON format) consists out of multiple parts:  

- **version** : which refers the JSON test suite version (not relevant but might handy for future backward compatibility options).  
- **generateTests** : which refers the default available generated postman tests. The default tests are grouped per type (response, request)  ( see examples folder)
  - **responseChecks** : All response automatic generated checks.  
  - **limitOperations**: refers to a list of operation IDs for which tests will be generated. (Default not set, so tests will be generated for **all** operations).  
- **extendTests**:  which refers the custom additions of manual created postman tests. (see examples folder)
- **contentChecks**:  which refers the additional Postman tests that check the content. (see examples folder)
- **assignPmVariables**:  which refers to specific Postman environment variables for easier automation.  (see examples folder)
- **overwriteRequests**:  which refers the custom additions/modifications of the OpenAPI request body. 

In this example we focus on the **overwriteRequests** section and settings.

file: examples/testsuite-overwrites/postman-testsuite.crm.json

```json
{
  "version": 1.0,
  "generateTests": {
    "responseChecks": {
      "StatusSuccess": {
        "enabled": true
      },
      "responseTime": {
        "enabled": true,
        "maxMs": 300
      },
      "contentType": {
        "enabled": true
      },
      "jsonBody": {
        "enabled": true
      },
      "schemaValidation": {
        "enabled": true
      },
      "headersPresent": {
        "enabled": true
      }
    }
  },
  "overwriteRequests": [
    {
      "openApiOperationId": "leadsAdd",
      "overwriteRequestBody": [
        {
          "key": "name",
          "value": "--{{$randomInt}}",
          "overwrite": false
        },
        {
          "key": "company_name",
          "value": "{{$randomCompanyName}} {{$randomColor}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperation": "DELETE::/crm/leads/{id}",
      "overwriteRequestQueryParams": [
        {
          "key": "raw",
          "value": false,
          "overwrite": true
        }
      ],
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "123456789",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperationId": "leadsUpdate",
      "overwriteRequestHeaders": [
        {
          "key": "x-apideck-consumer-id",
          "value": "portman-id-{{$randomInt}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperationId": "leadsAll",
      "overwriteRequestQueryParams": [
        {
          "key": "limit",
          "disable": true
        }
      ]
    }
  ]
}
```

## Postman test suite - "overwriteRequests" properties

Version 1.0  

To facilitate automation, you might want to modify property values with "randomized" or specific values. The overwrites are mapped based on the OpenApi operationId or OpenApi Operation reference. 

### Target options:

- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the Postman request body will be  extended. (example: `leadsAll`)  
- **openApiOperation (String)** : Reference to combination of the OpenApi method & path, for which the Postman request body will be extended (example: `GET::/crm/leads`)  

These target options are both supported for defining a target. In case both are set for the same target, only  the `openApiOperationId` will be used for overwrites.  See below for more options on targetting.

### Overwrite options:

- **overwriteRequestQueryParams (Array)** : 
  
  Array of key/value pairs to overwrite in the Postman Request Query params.  
  
  - **key (string)** : The key that will be targeted in the request Query Param to overwrite/extend.  
  - **value (string)** : The value that will be used to overwrite/extend the value in the request Query Param OR use  the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/)  to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request query param value OR attach the value to the original request query param value.  
  - **disable (Boolean true/false | Default: false)** : Disables the request query param in Postman  
  - **remove (Boolean true/false | Default: false)** : Removes the request query param  

- **overwriteRequestPathVariables (Array)** : 
  Array of key/value pairs to overwrite in the Postman Request Path Variables.  
  
  - **key (string)** : The key that will be targeted in the request Path variables to overwrite/extend.  
  - **value (string)** : The value that will be used to overwrite/extend the value in the request path variable OR use the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/)  to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request path variable value OR attach the value  to the original request Path variable value.  
  - **remove (Boolean true/false | Default: false)** : Removes the request path variable  

- **overwriteRequestHeaders (Array)** : 
  
  Array of key/value pairs to overwrite in the Postman Request Headers.  
  
  - **key (string)** : The key that will be targeted in the request Headers to overwrite/extend.  
  - **value (string)** : The value that will be used to overwrite/extend the value in the request headers OR use  the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/)  to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request header value OR attach the value to the  original request header value.  
  - **remove (Boolean true/false | Default: false)** : Removes the request headers

- **overwriteRequestBody (Array)** : 
  
  Array of key/value pairs to overwrite in the Postman Request Body.  
  
  - **key (string)** : The key that will be targeted in the request body to overwrite/extend.  
  - **value (string)** : The value that will be used to overwrite/extend the key in the request body OR use the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/)  to use dynamic values like `{{$guid}}` or `{{$randomInt}}`.  
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attach the value to the original request body value.  
  - **remove (Boolean true/false | Default: false)** : Removes the request body property, including the value. 

### 

## Example explained

In this example, we are zooming in on only the overwriteRequests usage. For the basics on the testsuite configuration and usage in Portman, have a look at ["examples/testsuite-default-checks"]("https://github.com/apideck-libraries/portman/tree/main/examples/testsuite-default-checks")

file: examples/testsuite-overwrites/postman-testsuite.crm.json >>

```json
  "overwriteRequests": [
    {
      "openApiOperationId": "leadsAdd",
      "overwriteRequestBody": [
        {
          "key": "name",
          "value": "--{{$randomInt}}",
          "overwrite": false
        },
        {
          "key": "company_name",
          "value": "{{$randomCompanyName}} {{$randomColor}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperation": "DELETE::/crm/leads/{id}",
      "overwriteRequestQueryParams": [
        {
          "key": "raw",
          "value": false,
          "overwrite": true
        }
      ],
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "123456789",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperationId": "leadsUpdate",
      "overwriteRequestHeaders": [
        {
          "key": "x-apideck-consumer-id",
          "value": "portman-id-{{$randomInt}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperationId": "leadsAll",
      "overwriteRequestQueryParams": [
        {
          "key": "limit",
          "disable": true
        }
      ]
    }
  ]
```

### overwriteRequestBody

```json
{
      "openApiOperationId": "leadsAdd",
      "overwriteRequestBody": [
        {
          "key": "name",
          "value": "--{{$randomInt}}",
          "overwrite": false
        },
        {
          "key": "company_name",
          "value": "{{$randomCompanyName}} {{$randomColor}}",
          "overwrite": true
        }
      ]
    }
```

This will target the OpenApi `"openApiOperationId": "leadsAdd"` and will overwrite the request body.

1) the `name` property will be **extended** (because overwrite:false) with `--{{$randomInt}}` 

2) the `company_name`property will be **overwritten** (because overwrite:true) with `{{randomCompanyName}} {{randomColor}}`

After the conversion, in the "leadsAdd" request (POST::/crm/leads) in the Postman app, you can find the following result in the request body.

file: examples/testsuite-overwrites/crm.postman.json >> 

Postman request "Leads" >> "Create lead" Request body:

```json
{
    "name": "Elon Musk--{{$randomInt}}",
    "company_name": "{{$randomCompanyName}} {{$randomColor}}",
    "owner_id": "54321",
    "company_id": "2",
    "contact_id": "2",
    "first_name": "Elon",
    "last_name": "Musk",
    "description": "A thinker",
...
```

Each time the request is executed in Postman, the `{{$random}}` variables will be generated with random values like defined on the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/) page.

### overwriteRequestQueryParams

```json
{
      "openApiOperation": "DELETE::/crm/leads/{id}",
      "overwriteRequestQueryParams": [
        {
          "key": "raw",
          "value": false,
          "overwrite": true
        }
      ]
    }
```

This will target the OpenApi `"openApiOperation": "DELETE::/crm/leads/{id}"` and will overwrite the request query params.

1. the `raw`property will be **overwritten** (because overwrite:true) with `false`

After the conversion, in the "leadsDelete" request (DELETE::/crm/leads/{id}) in the Postman app, you can find the following result in the request query params.

file: examples/testsuite-overwrites/crm.postman.json >>

Postman request "Leads" >> "Delete lead" Request query params:

![](./images/overwriteRequestQueryParams.png)

The example below will showcase the "disable" setting. 

```json
{
      "openApiOperationId": "leadsAll",
      "overwriteRequestQueryParams": [
        {
          "key": "limit",
          "disable": true
        }
      ]
    }
```

This will target the OpenApi `"openApiOperationId": "leadsAll"` and will modify the request query params to set the `limit`property as **disabled** (because disable:true) in Postman.

file: examples/testsuite-overwrites/crm.postman.json >>

Postman request "Leads" >> "Get leads" Request query params:

![](./images/overwriteRequestQueryParamsDisable.png)


## overwriteRequestPathVariables

```json
{
      "openApiOperation": "DELETE::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "123456789",
          "overwrite": true
        }
      ]
    }
```

This will target the OpenApi `"openApiOperation": "DELETE::/crm/leads/{id}"` and will overwrite the request query params.

1. the `id`property will be **overwritten** (because overwrite:true) with `123456789`

After the conversion, in the "leadsDelete" request (DELETE::/crm/leads/{id}) in the Postman app, you can find the following result in the request Path variables.

file: examples/testsuite-overwrites/crm.postman.json >>

Postman request "Leads" >> "Delete lead" Request query params:

![](./images/overwriteRequestPathVariables.png)

### overwriteRequestQueryParams

```json
{
      "openApiOperationId": "leadsUpdate",
      "overwriteRequestHeaders": [
        {
          "key": "x-apideck-consumer-id",
          "value": "portman-id-{{$randomInt}}",
          "overwrite": true
        }
      ]
    }
```

This will target the OpenApi `"openApiOperationId": "leadsUpdate"` and will overwrite the request query params.

1. the `x-apideck-consumer-id` header property will be **overwritten** (because overwrite:true) with `portman-id-{{$randomInt}}`

After the conversion, in the "leadsUpdate" request (PATCH::/crm/leads/{id}) in the Postman app, you can find the following result in the headers tab.

file: examples/testsuite-overwrites/crm.postman.json >>

Postman request "Leads" >> "Update lead" Request headers:

![](./images/overwriteRequestHeaders.png)

## Postman test suite targeting for variables & overwrites

It is possible to assign variables and overwrite query params, headers, request body data with values specifically for the tests.

To be able to do this very specifically, there are options to define the targets:

- **openApiOperationId (String)** : References to the OpenApi operationId, example: `leadsAll`
- **openApiOperation (String)** : References to a combination of the OpenApi method & path, example: `GET::/crm/leads`

An `openApiOperationId` is an optional property. To offer support for OpenApi documents that don't have operationIds, we  have added the `openApiOperation` definition which is the unique combination of the OpenApi method & path, with a `::`  separator symbol. This will allow targeting for very specific OpenApi items.

To facilitate managing the filtering, we have included wildcard options for the `openApiOperation` option, supporting  the methods & path definitions.

*REMARK*: Be sure to put quotes around the target definition.

- Strict matching example: `"openApiOperation": "GET::/crm/leads"`  
  This will target only the "GET" method and the specific path "/crm/leads"

- Method wildcard matching example: `"openApiOperation": "*::/crm/leads"`  
  This will target all methods ('get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace') and the specific  path "/crm/leads"

- Path wildcard matching example: `"openApiOperation": "GET::/crm/leads/*"`  
  This will target only the "GET" method and any path matching any folder behind the "/crm", like "/crm/leads" and  "/crm/123/buy".

- Method & Path wildcard matching example: `"openApiOperation": "*::/crm/*"`  A combination of wildcards for the method and path parts are even possible.
