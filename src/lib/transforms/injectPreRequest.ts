/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
export const injectPreRequest = (obj: any, preRequestScripts: string[]): any => {
  obj.event = [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: preRequestScripts
      }
    }
  ]
  return obj
}
