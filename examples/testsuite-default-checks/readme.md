# OpenApi Postman test suite generation

This example contains the setup of OpenApi to Postman test suite generation, which will convert the OpenApi document to a Postman collection, while adding Postman tests. The generated tests are focussed on the API contracts (the definition of the request/response with all properties), hence the reference to "API contract testing".

_use-case_: convert OpenApi to Postman with a range of Postman contract tests, automatically generated, without any complex configuration or manual writing of tests.

## CLI usage

```ssh
yarn portman --cliOptionsFile ./examples/testsuite-default-checks/portman-cli-options.json
```

Configured by using the portman-cli config.

This is an example where we take the OpenAPi defined in `crm.yml`, with only 1 entity (leads) to keep the example simple and convert to Postman with all the default contract tests generated out-of-the-box.

## Testsuite settings

The test suite settings (in JSON format) consists out of multiple parts:  

- **version** : which refers the JSON test suite version (not relevant but might handy for future backward compatibility options).  
- **generateTests** : which refers the default available generated postman tests. The default tests are grouped per type (response, request)  
  - **responseChecks** : All response automatic generated checks.  
  - **limitOperations**: refers to a list of operation IDs for which tests will be generated. (Default not set, so tests will be generated for **all** operations).  
- **extendTests**:  which refers the custom additions of manual created postman tests. (see examples folder)
- **contentChecks**:  which refers the additional Postman tests that check the content. ( see examples folder)
- **assignPmVariables**:  which refers to specific Postman environment variables for easier automation.  (see examples folder)
- **overwriteRequests**:  which refers the custom additions/modifications of the OpenAPI request body. (see examples folder)

In this example we focus on the **generateTests** section and settings.

file: examples/testsuite-default-checks/postman-testsuite.crm.json

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
  }
}
```

## Postman test suite - "responseChecks" properties

Version 1.0  

| name                                | id               | type    | default/0 | availableOptions/0 | availableOptions/1 | description                                                                                                                                                  | external | usage/0         |
| ----------------------------------- | ---------------- | ------- | --------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------- |
| Response status success (2xx) check | StatusSuccess    | boolean | false     | enabled            |                    | Adds the check if the response of the postman request return a 2xx                                                                                           | true     | TEST GENERATION |
| Response time check                 | responseTime     | boolean | false     | enabled            | maxMs 300          | Adds the check if the response of the postman request is within a number of ms.                                                                              | true     | TEST GENERATION |
| Response content-type check         | contentType      | boolean | false     | enabled            |                    | Adds the check if the postman response header is matching the expected content-type defined in the OpenApi spec.                                             | true     | TEST GENERATION |
| Response JSON body format check     | jsonBody         | boolean | false     | enabled            |                    | Adds the check if the postman response body is matching the expected content-type defined in the OpenApi spec.                                               | true     | TEST GENERATION |
| Response Schema validation check    | schemaValidation | boolean | false     | enabled            |                    | Adds the check if the postman response body is matching the JSON schema defined in the OpenApi spec. The JSON schema is inserted inline in the postman test. | true     | TEST GENERATION |
| Response Header presence check      | headersPresent   | boolean | false     | enabled            |                    | Adds the check if the postman response header has the header names present, like defined in the OpenApi spec.                                                | true     | TEST GENERATION |

## Example explained

By using the Portman parameters:

- **"includeTests"**: true  

- **"testSuiteConfigFile"**: "./examples/testsuite-default-checks/postman-testsuite.crm.json",

We instruct Portman to generate tests by setting **includeTests** to **true**, for which Portman will use the testsuite configuration defined in the **testSuiteConfigFile** json file.

file: examples/testsuite-default-checks/postman-testsuite.crm.json >>

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
  }
}
```

The result will be that initial OpenApi file, with all request and response details will be used to generate the specific tests. Per Postman request, you can find the specific tests in the "Tests" tab in the Postman application.

file: examples/testsuite-default-checks/crm.postman.json >> 

Postman request "Leads"" >> Get lead"

```js
// Validate status 2xx 
pm.test("[GET] /crm/leads/{id} - Status code is 2xx", function () {
   pm.response.to.be.success;
});

// Validate response time 
pm.test("[GET] /crm/leads/{id} - Response time is less than 300ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(300);
});

// Validate content-type 
pm.test("[GET] /crm/leads/{id} - Content-Type is application/json", function () {
   pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Response should have JSON Body
pm.test("[GET] /crm/leads/{id} - Response has JSON Body", function () {
    pm.response.to.have.jsonBody();
});

// Response Validation
const schema = {"type":"object","required":["status_code","status","service","resource","operation","data"],"properties":{"status_code":{"type":"integer","description":"HTTP Response Status Code","example":200},"status":{"type":"string","description":"HTTP Response Status","example":"OK"},"service":{"type":"string","description":"Apideck ID of service provider","example":"zoho-crm"},"resource":{"type":"string","description":"Unified API resource name","example":"companies"},"operation":{"type":"string","description":"Operation performed","example":"one"},"data":{"required":["name","company_name"],"x-pii":["name","email","first_name","last_name"],"type":"object","properties":{"id":{"type":"string","example":"12345","readOnly":true},"owner_id":{"type":"string","example":"54321"},"company_id":{"type":["string","null"],"example":"2"},"company_name":{"type":["string","null"],"example":"Spacex"},"contact_id":{"type":["string","null"],"example":"2"},"name":{"type":"string","example":"Elon Musk"},"first_name":{"type":["string","null"],"example":"Elon"},"last_name":{"type":["string","null"],"example":"Musk"},"description":{"type":["string","null"],"example":"A thinker"},"prefix":{"type":["string","null"],"example":"Sir"},"title":{"type":["string","null"],"example":"CEO"},"status":{"type":["string","null"],"example":"New"},"monetary_amount":{"type":["number","null"],"example":75000},"currency":{"type":["string","null"],"example":"USD"},"fax":{"type":["string","null"],"example":"+12129876543"},"websites":{"type":"array","items":{"type":"object","required":["url"],"properties":{"id":{"type":["string","null"],"example":"12345"},"url":{"type":"string","example":"http://example.com"},"type":{"type":"string","x-graphql-type-name":"WebsiteType","enum":["primary","secondary","work","personal","other"],"example":"primary"}}}},"addresses":{"type":"array","items":{"type":"object","properties":{"id":{"type":["string","null"],"example":"123"},"type":{"type":"string","x-graphql-type-name":"AddressType","enum":["primary","secondary","home","office","shipping","billing","other"],"example":"primary"},"name":{"type":["string","null"],"example":"HQ US"},"line1":{"type":["string","null"],"example":"Main street","description":"Line 1 of the address e.g. number, street, suite, apt #, etc."},"line2":{"type":["string","null"],"example":"apt #","description":"Line 2 of the address"},"city":{"type":["string","null"],"example":"San Francisco","description":"Name of city."},"state":{"type":["string","null"],"example":"CA","description":"Name of state"},"postal_code":{"type":["string","null"],"example":"94104","description":"Zip code or equivalent."},"country":{"type":["string","null"],"example":"US","description":"country code according to ISO 3166-1 alpha-2."},"latitude":{"type":["string","null"],"example":"40.759211"},"longitude":{"type":["string","null"],"example":"-73.984638"}}}},"social_links":{"type":"array","items":{"required":["url"],"type":"object","properties":{"id":{"type":["string","null"],"example":"12345"},"url":{"type":"string","example":"https://www.twitter.com/apideck-io"},"type":{"type":["string","null"],"example":"twitter"}}}},"phone_numbers":{"type":"array","items":{"required":["number"],"type":"object","properties":{"id":{"type":["string","null"],"example":"12345"},"number":{"type":"string","example":"111-111-1111"},"type":{"type":"string","x-graphql-type-name":"PhoneType","enum":["primary","secondary","home","office","mobile","assistant","fax","other"],"example":"primary"}}}},"emails":{"type":"array","items":{"required":["email"],"type":"object","properties":{"id":{"type":"string","example":"123"},"email":{"type":"string","format":"email","example":"elon@musk.com"},"type":{"type":"string","x-graphql-type-name":"EmailType","enum":["primary","secondary","work","personal","billing","other"],"example":"primary"}}}},"custom_fields":{"type":"array","items":{"type":"object","required":["id"],"additionalProperties":false,"properties":{"id":{"type":"string","example":"custom_technologies"},"value":{"anyOf":[{"type":["string","null"],"example":"Uses Salesforce and Marketo"},{"type":["number","null"],"example":10},{"type":["boolean","null"],"example":true},{"type":"array","items":{"type":"string"}}]}}}},"tags":{"type":"array","example":["New"],"items":{"type":"string"}},"updated_at":{"type":"string","example":"2020-09-30T07:43:32.000Z","readOnly":true},"created_at":{"type":"string","example":"2020-09-30T07:43:32.000Z","readOnly":true}}}}}

// Test whether the response matches the schema
pm.test("[GET] /crm/leads/{id} - Schema is valid", function() {
   pm.response.to.have.jsonSchema(schema,{unknownFormats: ["int32", "int64"]});
});

// Validate header 
pm.test("[GET] /crm/leads/{id} - Response header Operation-Location is present", function () {
   pm.response.to.have.header("Operation-Location");
});
```

### StatusSuccess

```json
"StatusSuccess": {
        "enabled": true
      }
```

Generates a check to verify if the HTTP status code is within the 2xx range

```js
// Validate status 2xx 
pm.test("[GET] /crm/leads/{id} - Status code is 2xx", function () {
   pm.response.to.be.success;
});
```

### responseTime

```json
"responseTime": {
        "enabled": true,
        "maxMs": 300
      }
```

Generates a check to measure the response time, to be a maximum ms (which is set to 300ms in our example).

```js
// Validate response time 
pm.test("[GET] /crm/leads/{id} - Response time is less than 300ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(300);
});
```

### contentType

```json
"contentType": {
        "enabled": true
      }
```

Generates a check to validate the content-type headers, based on the content-type defined in the OpenApi response.

```js
// Validate content-type 
pm.test("[GET] /crm/leads/{id} - Content-Type is application/json", function () {
   pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});
```

### jsonBody

```json
"jsonBody": {
        "enabled": true
      }
```

Generates a check to validate if the response body is a JSON object, based on the content-type defined in the OpenApi response..

```js
// Response should have JSON Body
pm.test("[GET] /crm/leads/{id} - Response has JSON Body", function () {
    pm.response.to.have.jsonBody();
});
```

### headersPresent

```json
"headersPresent": {
        "enabled": true
      }
```

Generates a check to validate if the response has a certain HTTP header present, based on the header properties defined in the OpenApi response.

```js
// Validate header 
pm.test("[GET] /crm/leads/{id} - Response header Operation-Location is present", function () {
   pm.response.to.have.header("Operation-Location");
});
```

### schemaValidation

```json
"schemaValidation": {
        "enabled": true
      }
```

Generates a check to validate if the response respects all the defined response properties, allowed property types, required fields, allowed enums, .... It does a full JSON schema verification, based on the OpenApi response properties.

```js
// Response Validation
const schema = {"type":"object","required":["status_code","status","service","resource","operation","data"],"properties":{"status_code":{"type":"integer","description":"HTTP Response Status Code","example":200},"status":{"type":"string","description":"HTTP Response Status","example":"OK"},"service":{"type":"string","description":"Apideck ID of service provider","example":"zoho-crm"},"resource":{"type":"string","description":"Unified API resource name","example":"companies"},"operation":{"type":"string","description":"Operation performed","example":"one"},"data":{"required":["name","company_name"],"x-pii":["name","email","first_name","last_name"],"type":"object","properties":{"id":{"type":"string","example":"12345","readOnly":true},"owner_id":{"type":"string","example":"54321"},"company_id":{"type":["string","null"],"example":"2"},"company_name":{"type":["string","null"],"example":"Spacex"},"contact_id":{"type":["string","null"],"example":"2"},"name":{"type":"string","example":"Elon Musk"},"first_name":{"type":["string","null"],"example":"Elon"},"last_name":{"type":["string","null"],"example":"Musk"},"description":{"type":["string","null"],"example":"A thinker"},"prefix":{"type":["string","null"],"example":"Sir"},"title":{"type":["string","null"],"example":"CEO"},"status":{"type":["string","null"],"example":"New"},"monetary_amount":{"type":["number","null"],"example":75000},"currency":{"type":["string","null"],"example":"USD"},"fax":{"type":["string","null"],"example":"+12129876543"},"websites":{"type":"array","items":{"type":"object","required":["url"],"properties":{"id":{"type":["string","null"],"example":"12345"},"url":{"type":"string","example":"http://example.com"},"type":{"type":"string","x-graphql-type-name":"WebsiteType","enum":["primary","secondary","work","personal","other"],"example":"primary"}}}},"addresses":{"type":"array","items":{"type":"object","properties":{"id":{"type":["string","null"],"example":"123"},"type":{"type":"string","x-graphql-type-name":"AddressType","enum":["primary","secondary","home","office","shipping","billing","other"],"example":"primary"},"name":{"type":["string","null"],"example":"HQ US"},"line1":{"type":["string","null"],"example":"Main street","description":"Line 1 of the address e.g. number, street, suite, apt #, etc."},"line2":{"type":["string","null"],"example":"apt #","description":"Line 2 of the address"},"city":{"type":["string","null"],"example":"San Francisco","description":"Name of city."},"state":{"type":["string","null"],"example":"CA","description":"Name of state"},"postal_code":{"type":["string","null"],"example":"94104","description":"Zip code or equivalent."},"country":{"type":["string","null"],"example":"US","description":"country code according to ISO 3166-1 alpha-2."},"latitude":{"type":["string","null"],"example":"40.759211"},"longitude":{"type":["string","null"],"example":"-73.984638"}}}},"social_links":{"type":"array","items":{"required":["url"],"type":"object","properties":{"id":{"type":["string","null"],"example":"12345"},"url":{"type":"string","example":"https://www.twitter.com/apideck-io"},"type":{"type":["string","null"],"example":"twitter"}}}},"phone_numbers":{"type":"array","items":{"required":["number"],"type":"object","properties":{"id":{"type":["string","null"],"example":"12345"},"number":{"type":"string","example":"111-111-1111"},"type":{"type":"string","x-graphql-type-name":"PhoneType","enum":["primary","secondary","home","office","mobile","assistant","fax","other"],"example":"primary"}}}},"emails":{"type":"array","items":{"required":["email"],"type":"object","properties":{"id":{"type":"string","example":"123"},"email":{"type":"string","format":"email","example":"elon@musk.com"},"type":{"type":"string","x-graphql-type-name":"EmailType","enum":["primary","secondary","work","personal","billing","other"],"example":"primary"}}}},"custom_fields":{"type":"array","items":{"type":"object","required":["id"],"additionalProperties":false,"properties":{"id":{"type":"string","example":"custom_technologies"},"value":{"anyOf":[{"type":["string","null"],"example":"Uses Salesforce and Marketo"},{"type":["number","null"],"example":10},{"type":["boolean","null"],"example":true},{"type":"array","items":{"type":"string"}}]}}}},"tags":{"type":"array","example":["New"],"items":{"type":"string"}},"updated_at":{"type":"string","example":"2020-09-30T07:43:32.000Z","readOnly":true},"created_at":{"type":"string","example":"2020-09-30T07:43:32.000Z","readOnly":true}}}}}

// Test whether the response matches the schema
pm.test("[GET] /crm/leads/{id} - Schema is valid", function() {
   pm.response.to.have.jsonSchema(schema,{unknownFormats: ["int32", "int64"]});
});
```

## Postman test suite - "limitOperations" property

The "limitOperations" property allows you to specify a range of OpenApi operations, for which he desired "responseChecks" will be generated. If "limitOperations" is empty or not defined (which is the default), "responseChecks" will be generated for all OpenApi operations. In case a range of OpenApi operations is set in "limitOperations", only for these "responseChecks" will be generated, the other OpenApi items will be skipped.

```json
{
  "version": 1.0,
  "generateTests": {
    "limitOperations": ["leadsOne"],
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
  }
}
```

In the above example, only the OpenApi operation with `operationId: leadsOne` (GET::/crm/leads/{id}) will have Postman tests injected.
