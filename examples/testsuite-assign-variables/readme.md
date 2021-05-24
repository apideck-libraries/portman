# OpenApi Postman test suite generation - assignPmVariables

In the "[examples/testsuite-default-checks](examples/testsuite-default-checks)" example, we explained the default generated Postman contract tests. 

This example focusses on assigning Postman variables based on the response of an API request, with the goal to be able to reuse them in other requests.

_use-cases_: 

- Generate Postman flows that require values from previous operations

- Reference a created entity to be used in Read/Update/Delete flows by setting the ID reference as query parameter

## CLI usage

```ssh
yarn portman --cliOptionsFile ./examples/testsuite-assign-variables/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPi defined in `crm.yml`, with only 1 entity (leads) to keep the example simple and convert to Postman with all the default testuite tests generated out-of-the-box + set Postman variabbles from executed Postman requests.

## Testsuite settings

The test suite settings (in JSON format) consists out of multiple parts:  

- **version** : which refers the JSON test suite version (not relevant but might handy for future backward compatibility options).  
- **generateTests** : which refers the default available generated postman tests. The default tests are grouped per type (response, request)  ( see examples folder)
  - **responseChecks** : All response automatic generated checks.  
  - **limitOperations**: refers to a list of operation IDs for which tests will be generated. (Default not set, so tests will be generated for **all** operations).  
- **extendTests**:  which refers the custom additions of manual created postman tests. (see examples folder)
- **contentChecks**:  which refers the additional Postman tests that check the content. (see examples folder)
- **assignPmVariables**:  which refers to specific Postman environment variables for easier automation.  
- **overwriteRequests**:  which refers the custom additions/modifications of the OpenAPI request body. (see examples folder)

In this example we focus on the **assignPmVariables** section and settings.

file: examples/testsuite-assign-variables/postman-testsuite.crm.json

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
  "assignPmVariables": [
    {
      "openApiOperationId": "GET::/crm/leads/{id}",
      "environmentVariables": [
        {
          "responseBodyProp": "data.company_name"
        }
      ]
    },
    {
      "openApiOperationId": "leadsAdd",
      "environmentVariables": [
        {
          "requestBodyProp": "company_name",
          "name": "leadsAdd.company_name"
        },
        {
          "responseBodyProp": "data.id",
          "name": "leadsAdd.id"
        }
      ]
    }
  ],
  "contentChecks": [
    {
      "openApiOperationId": "leadsOne",
      "checkRequestBody": [
        {
          "key": "data.company_name",
          "value": "{{leadsAdd.company_name}}"
        }
      ]
    }
  ],
  "overwriteRequests": [
    {
      "openApiOperationId": "leadsAdd",
      "overwriteRequestBody": [
        {
          "key": "name",
          "value": "{{leadsAdd.name}}"
        }
      ]
    },
    {
      "openApiOperation": "GET::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "{{leadsAdd.id}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperation": "PATCH::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "{{leadsAdd.id}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperation": "DELETE::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "{{leadsAdd.id}}",
          "overwrite": true
        }
      ]
    }
  ]
}

```

## Postman test suite - "assignPmVariables" properties

Version 1.0  

To facilitate automation, we provide the option to set "pm.environment" variables with values from the response. The assigning of the "pm.environment" variables" are mapped based on the OpenApi operationId or OpenApi Operation reference.  

*REMARK*: By default the test suite will create a pm.environment variable for the ID property in the response object for POST operation, if `ID` is present in the reponse.  

Anything added in `assignPmVariables` array, will be used to generate specific pm.environment variables based on the  postman response body.  

### Target options:

- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the Postman pm.environment variable  
  will be set. (example: `listPets`)  
- **openApiOperation (String)** : Reference to combination of the OpenApi method & path, for which the Postman  
  pm.environment variable will be set. (example: `GET::/pets`)  

These target options are both supported for defining a target. In case both are set for the same target, only  the `openApiOperationId` will be used for overwrites.  

### EnvironmentVariables options:

- **environmentVariables (Array)** : Array of key/value pairs to set the Postman variables.  
  - **responseBodyProp (string)** : The property for which the value will be taken in the response body and set the value as the  pm.environment value.  
  - **responseHeaderProp (string)** : The property for which the value will be taken in the response header and set the value as the pm.environment value.
  - **requestBodyProp (string)** : The property for which the value will be taken in the request body and set the value as the pm.environment value.  
  - **value (string)** : The defined value that will be set as the pm.environment value.  
  - **name (string OPTIONAL | Default: openApiOperationId.responseProp)** : The name that will be used to overwrite the default generated variable name

## Example explained

In this example, we are zooming in on only the overwriteRequests usage. For the basics on the testsuite configuration and usage in Portman, have a look at ["examples/testsuite-default-checks"]("examples/testsuite-default-checks")

file: examples/testsuite-assign-variables/postman-testsuite.crm.json >>

```json
"assignPmVariables": [
    {
      "openApiOperationId": "leadsAdd",
      "environmentVariables": [
        {
          "requestBodyProp": "company_name",
          "name": "leadsAdd.company_name"
        },
        {
          "responseBodyProp": "data.id",
          "name": "leadsAdd.id"
        }
      ]
    },
    {
      "openApiOperationId": "GET::/crm/leads/{id}",
      "environmentVariables": [
        {
          "responseBodyProp": "data.company_name"
        }
      ]
    }
  ]
```

### assignPmVariables + overwriteRequestQueryParams

```json
  "assignPmVariables": [
    {
      "openApiOperationId": "leadsAdd",
      "environmentVariables": [
        {
          "responseBodyProp": "data.id",
          "name": "leadsAdd.id"
        }
      ]
    }
  ],
```

This will target the OpenApi `"openApiOperationId": "leadsAdd"` and will assign the `data.id` from the request body to a Postman environment variable with the name `leadsAdd.id`

The API response for the create operation will contain:

```json
{
  "status_code": 200,
  "status": "OK",
  "service": "zoho-crm",
  "resource": "companies",
  "operation": "one",
  "data": {
    "id": "12345"
  }
}
```

After the conversion, in the "leadsAdd" request (POST::/crm/leads) in the Postman app, you can find the following result in the test tab.

file: examples/testsuite-assign-variables/crm.postman.json >> 

Postman request "Leads" >> "Create lead" Test tab:

```js
// Set respone object as internal variable
let jsonData = pm.response.json();

// pm.environment - Set leadsAdd.id as environment variable 
if (jsonData.data.id) {
   pm.environment.set("leadsAdd.id",jsonData.data.id);
   console.log("pm.environment - use {{leadsAdd.id}} as variable for value", jsonData.data.id);
};
```

Each time the request is executed in Postman, the `{{$leadsAdd.id}}` variables will be updated with the `data.id` from the API response. 

This allows you to capture the ID of the newly created entity. 

In combination with the `overwriteRequests` option, you can then chain the Creation operation with the Read/Update/Delete operations. You can use the `{{$leadsAdd.id}}` to set the request path variables.

```json
"overwriteRequests": [
    {
      "openApiOperation": "GET::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "{{leadsAdd.id}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperation": "PATCH::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "{{leadsAdd.id}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperation": "DELETE::/crm/leads/{id}",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "{{leadsAdd.id}}",
          "overwrite": true
        }
      ]
    }
  ]
```

Which will result in the Path variables for GET/PATCH/DELETE for the path `/crm/leads/{id}` will be set with the `{{leadsAdd.id}}` Postman environment variable.

![](./images/assignPmVariables_id.png)

### assignPmVariables + contentChecks

Another option is to combine "assignPmVariables" with "contentChecks".

Create Lead request body

```json
{
    "name": "{{leadsAdd.name}}",
    "company_name": "Spacex",
    "owner_id": "54321"
    ...
}
```

Assign the variable from the request body through our "assignPmVariables" definition.

```json
assignPmVariables": [
    {
      "openApiOperationId": "leadsAdd",
      "environmentVariables": [
        {
          "requestBodyProp": "company_name",
          "name": "lead.company_name"
        }
      ]
    }
  ]
```

This will target the OpenApi `"openApiOperation": "leadsAdd"` and will get the  `company_name` from the request body (which is defined in OpenApi)(before the Postman request is send).

Postman request "Leads" >> "Create lead" test:

```js
// pm.environment - Set leadsAdd.company_name as environment variable from request body 
pm.environment.set("leadsAdd.company_name","Spacex");
console.log("pm.environment - use {{leadsAdd.company_name}} as variable for value", "Spacex");
```

Next we want to validate in the `company_name` which we used to create the entity, is matching with the `company_name` when requesting the lead details of our newly created entity. 

Get Lead response

```json
{
    "status_code": 200,
    "status": "OK",
    "service": "zoho-crm",
    "resource": "companies",
    "operation": "one",
    "data": {
        "id": "12345",
        "owner_id": "54321",
        "company_id": "2",
        "company_name": "Spacex"
        ...
}
```

For this we use a "contenCheck":

```json
"contentChecks": [
    {
      "openApiOperationId": "GET::/crm/leads/{id}",
      "checkRequestBody": [
        {
          "key": "data.company_name",
          "value": "{{leadsAdd.company_name}}"
        }
      ]
    }
  ]
```

which will generate a Postman test for the `"openApiOperation":"GET::/crm/leads/{id}"` operation that check if the value from the "company_name" which is created through the create lead API, matches with the get lead API data. 

Postman request "Leads" >> "Get lead" test:

```js
// Set response object as internal variable
let jsonData = pm.response.json();

// Response body should have property "data.company_name"
pm.test("[GET] /crm/leads/{id} - Content check if property 'data.company_name' exists", function() {
   pm.expect((typeof jsonData.data.company_name !== "undefined")).to.be.true;
});

// Response body should have value "{{leadsAdd.company_name}}" for "data.company_name"
if (typeof jsonData.data.company_name !== "undefined") {
pm.test("[GET] /crm/leads/{id} - Content check if value for 'data.company_name' matches '{{leadsAdd.company_name}}'", function() {
  pm.expect(jsonData.data.company_name).to.eql(pm.environment.get("leadsAdd.company_name"));
})};
```
