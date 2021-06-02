import { OpenApiParser, PostmanParser } from 'application'
import { Item, Event } from 'postman-collection'

export const generateRequestChecks = (
  pmObj: PostmanParser,
  oaObj: OpenApiParser
): PostmanParser => {
  // const requests = obj?.item

  // if (!requests) {
  //   return obj
  // }
  // requests.map(obj => injectSkip(obj))
  // console.log('generateRequestChecks', obj.requests)

  // DEBUG
  pmObj.requests.length = 1
  pmObj.mappedOperations.length = 1

  console.log(pmObj.mappedOperations)
  // console.log('oaObj', oaObj)

  // Iterate over all requests
  pmObj.mappedOperations.map(pmOperation => {
    console.log('pmOperation', pmOperation)
    console.log('events', pmOperation.item.events)

    // Get OpenApi responses
    const oaOperation = oaObj.getOperationByPath(pmOperation.pathRef)

    // Generate response checks
    generateResponseTests(pmOperation, oaOperation)
  })

  return pmObj
}

/**
 * Generate all portman tests based on the Postman request & the OpenApi specification
 * @param pmOperation
 * @param oaOperation
 */
const generateResponseTests = (pmOperation: any, oaOperation: any): any => {
  // console.log('pmRequest', pmRequest)
  // console.log('oaOperation', oaOperation)

  for (const [code] of Object.entries(oaOperation.schema.responses)) {
    // // Only support 2xx response checks - Happy path
    if (!inRange(parseInt(code), 200, 299)) {
      return // skip this response
    }

    // Check - Success 2xx response checks
    generateResponseSuccessCheck(pmOperation, oaOperation)
  }
}

/**
 * Generate response success check
 * @param pmOperation
 * @param oaOperation
 */
const generateResponseSuccessCheck = (pmOperation: any, oaOperation: any): any => {
  console.log('pmOperation', pmOperation)
  console.log('oaOperation', oaOperation)
  // console.log('oaResponseCode', oaResponseCode)
  // console.log('oaResponse', oaResponse)

  // Add status success check
  const pmTest: string[] = []
  pmTest.push('// Validate status 2xx \n')
  pmTest.push('pm.test("[' + pmOperation.method.toUpperCase() + '] /' + pmOperation.path)
  pmTest.push(' - Status code is 2xx", function () {\n')
  pmTest.push('   pm.response.to.be.success;\n')
  pmTest.push('});\n')

  pmOperation = appendTestScript(pmOperation, pmTest)
  console.log('pmOperation after', pmOperation.item.events.all())
}

/***** UTILS *****/
const inRange = (num, rangeStart, rangeEnd = 0) =>
  (rangeStart <= num && num <= rangeEnd) || (rangeEnd <= num && num <= rangeStart)

const appendTestScript = (pmOperation: any, pmTest: any) => {
  const pmTests = pmOperation.item.events.find(e => e.listen === 'test')
  if (pmTests === undefined) {
    // Create new tests in events
    return pmOperation.item.events.add(
      new Event({
        listen: 'test',
        script: {
          exec: pmTest,
          type: 'text/javascript'
        }
      })
    )
  }

  // Merge new tests in existing events
  pmTests.script.exec = [...pmTests.script.exec, ...pmTest]

  return pmOperation
}
