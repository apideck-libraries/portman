# OpenApi Postman test suite generation - Content checks

In the "[examples/testsuite-default-checks](examples/testsuite-default-checks)" example, we explained the default generated Postman contract tests. 

This example focusses on the extension of the contract test suite with specific content checks. While the contract tests focusses on the validation of the request/response properties, the "content checks" focusses on validating the actual values of the API.

_use-case_: convert OpenApi to Postman with a range of Postman tests automatically generated, extended by content checks, where we validate the response values.

## CLI usage

```ssh
yarn portman --cliOptionsFile ./examples/testsuite-content-checks/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPi defined in `crm.yml`, with only 1 entity (leads) to keep the example simple and convert to Postman with all the default testuite tests generated out-of-the-box + a number of content checks.

## Testsuite settings

The test suite settings (in JSON format) consists out of multiple parts:  

- **version** : which refers the JSON test suite version (not relevant but might handy for future backward compatibility options).  
- **generateTests** : which refers the default available generated postman tests. The default tests are grouped per type (response, request)  ( see examples folder)
  - **responseChecks** : All response automatic generated checks.  
  - **limitOperations**: refers to a list of operation IDs for which tests will be generated. (Default not set, so tests will be generated for **all** operations).  
- **extendTests**:  which refers the custom additions of manual created postman tests. (see examples folder)
- **contentChecks**:  which refers the additional Postman tests that check the content. 
- **assignPmVariables**:  which refers to specific Postman environment variables for easier automation.  (see examples folder)
- **overwriteRequests**:  which refers the custom additions/modifications of the OpenAPI request body. (see examples folder)

In this example we focus on the **contentChecks** section and settings.

file: examples/testsuite-content-checks/postman-testsuite.crm.json

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
  "contentChecks": [
    {
      "openApiOperationId": "leadsAll",
      "checkRequestBody": [
        {
          "key": "data[0].company_name",
          "value": "Spacex"
        },
        {
          "key": "data[0].monetary_amount",
          "value": 75000
        },
        {
          "key": "resource",
          "value": "companies"
        }
      ]
    }
  ]
}
```

## Postman test suite - "contentChecks" properties

Version 1.0  

Next to the generated tests, it is possible to define "content" checks where a property and the value of the response body should exist and match a specific value or variable.

The contentChecks are mapped based on the OpenApi operationId or the OpenApi Operation reference (method + path).

Anything added in `checkRequestBody` array, will be add as content check to the Postman tests.

##### Target options:

- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the Postman request body will be tested. (example: `leadsAll`)
- **openApiOperation (String)** : Reference to the combination of the OpenApi method & path, for which the Postman request body will be test (example: `GET::/leads`)

These target options are both supported for defining a target. In case both are set for the same target, only the `openApiOperationId` will be used for overwrites.

##### Content check options:

- **checkRequestBody (Array)** : Array of key/value pairs of properties & values in the Postman Request Body.
  - **key (string)** : The key that will be targeted in the request body to check if it exists.
  - **value (string)** : The value that will be used to check if the value in the request body matches.

## Example explained

In this example, we are zooming in on only the contenChecks usage. For the basics on the testsuite configuration and usage in Portman, have a look at ["examples/testsuite-default-checks"]("examples/testsuite-default-checks")

file: examples/testsuite-content-checks/postman-testsuite.crm.json >>

```json
"contentChecks": [
    {
      "openApiOperationId": "leadsAll",
      "checkRequestBody": [
        {
          "key": "data[0].company_name",
          "value": "Spacex"
        },
        {
          "key": "data[0].monetary_amount",
          "value": 75000
        },
        {
          "key": "resource",
          "value": "companies"
        }
      ]
    }
  ]
```

After the conversion, in the "leadsAll" request (GET::/crm/leads) in the Postman app, you can find the specific tests in the "Tests" tab.

file: examples/testsuite-content-checks/crm.postman.json >> 

Postman request "Leads"" >> List leads"API Response:

```json
{
  "status_code": 200,
  "status": "OK",
  "service": "zoho-crm",
  "resource": "companies",
  "operation": "one",
  "data": [
    {
      "id": "12345",
      "owner_id": "54321",
      "company_id": "2",
      "company_name": "Spacex",
      "contact_id": "2",
      "name": "Elon Musk",
      "first_name": "Elon",
      "last_name": "Musk",
      "description": "A thinker",
      "prefix": "Sir",
      "title": "CEO",
      "status": "New",
      "monetary_amount": 75000,
      "currency": "USD",
      "fax": "+12129876543",
      "updated_at": "2020-09-30T07:43:32.000Z",
      "created_at": "2020-09-30T07:43:32.000Z"
    }
  ],
  "meta": {
    "items_on_page": 50,
    "cursors": {
      "previous": "em9oby1jcm06OnBhZ2U6OjE=",
      "current": "em9oby1jcm06OnBhZ2U6OjI=",
      "next": "em9oby1jcm06OnBhZ2U6OjM="
    }
  },
  "links": {
    "previous": "https://unify.apideck.com/crm/companies?cursor=em9oby1jcm06OnBhZ2U6OjE%3D",
    "current": "https://unify.apideck.com/crm/companies",
    "next": "https://unify.apideck.com/crm/companies?cursor=em9oby1jcm06OnBhZ2U6OjM"
  }
}
```

Part of Postman Testsuite checks:

```javascript
// Set response object as internal variable
let jsonData = pm.response.json();

// Response body should have property "data[0].company_name"
pm.test("[GET] /crm/leads - Content check if property 'data[0].company_name' exists", function() {
   pm.expect((typeof jsonData.data[0].company_name !== "undefined")).to.be.true;
});

// Response body should have value "Spacex" for "data[0].company_name"
if (typeof jsonData.data[0].company_name !== "undefined") {
pm.test("[GET] /crm/leads - Content check if value for 'data[0].company_name' matches 'Spacex'", function() {
  pm.expect(jsonData.data[0].company_name).to.eql("Spacex");
})};

// Response body should have property "data[0].monetary_amount"
pm.test("[GET] /crm/leads - Content check if property 'data[0].monetary_amount' exists", function() {
   pm.expect((typeof jsonData.data[0].monetary_amount !== "undefined")).to.be.true;
});

// Response body should have value "75000" for "data[0].monetary_amount"
if (typeof jsonData.data[0].monetary_amount !== "undefined") {
pm.test("[GET] /crm/leads - Content check if value for 'data[0].monetary_amount' matches '75000'", function() {
  pm.expect(jsonData.data[0].monetary_amount).to.eql(75000);
})};

// Response body should have property "resource"
pm.test("[GET] /crm/leads - Content check if property 'resource' exists", function() {
   pm.expect((typeof jsonData.resource !== "undefined")).to.be.true;
});

// Response body should have value "companies" for "resource"
if (typeof jsonData.resource !== "undefined") {
pm.test("[GET] /crm/leads - Content check if value for 'resource' matches 'companies'", function() {
  pm.expect(jsonData.resource).to.eql("companies");
})};
```

Per defined contenCheck item, Portman will generated 2 checks:

```js
// Response body should have property "data[0].company_name"
pm.test("[GET] /crm/leads - Content check if property 'data[0].company_name' exists", function() {
   pm.expect((typeof jsonData.data[0].company_name !== "undefined")).to.be.true;
});
```

The first check validates if the response has the property "company_name" in the first item ("[0]") of the "data" array.

```js
// Response body should have value "Spacex" for "data[0].company_name"
if (typeof jsonData.data[0].company_name !== "undefined") {
pm.test("[GET] /crm/leads - Content check if value for 'data[0].company_name' matches 'Spacex'", function() {
  pm.expect(jsonData.data[0].company_name).to.eql("Spacex");
})};
```

The 2nd check validates if the response has value "Spacex" for the property "company_name".

These 2 checks are added for each "contentCheck" item that is defined.

## Alternative targetting option

In the above example we are using the OpenApi `operationId: leadsOne`to target the contect check for that specific operation.

As alternative you can also define the target as `openApiOperation`, which is the combination of the OpenApi method & path

In the example below, we target the `GET` method for the path `/crm/leads`.

```json
"contentChecks": [
    {
      "openApiOperation": "GET::/crm/leads",
      "checkRequestBody": [
        {
          "key": "data[0].company_name",
          "value": "Spacex"
        },
        {
          "key": "data[0].monetary_amount",
          "value": 75000
        },
        {
          "key": "resource",
          "value": "companies"
        }
      ]
    }
  ]
```
