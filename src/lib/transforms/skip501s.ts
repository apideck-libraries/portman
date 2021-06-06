/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
export const skip501s = (obj: any): any => {
  const requests = obj?.item

  if (!requests) {
    console.log('Skipped')
    return obj
  }
  requests.map(obj => injectSkip(obj))
  return obj
}

const injectSkip = (obj: any): any => {
  return obj.item.map(({ event }) => {
    const test = event?.[0]
    if (test?.listen === 'test') {
      const exec = test?.script?.exec
      if (!exec) {
        return test
      }

      test.script.exec = [
        "// Validate status Implemented \nif(pm.response.status === 'Not Implemented'){ return };\n",
        ...exec
      ]
    }
  })
}
