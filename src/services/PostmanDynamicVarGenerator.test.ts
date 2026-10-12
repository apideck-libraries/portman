import { PostmanDynamicVarGenerator } from './PostmanDynamicVarGenerator'

// Use the real-package alias to bypass the global mock. ts-jest transforms Faker's ESM.
jest.mock('@faker-js/faker', () => jest.requireActual('@faker-js/faker/real'))

describe('PostmanDynamicVariables', () => {
  let pmVars: PostmanDynamicVarGenerator

  beforeEach(async () => {
    pmVars = new PostmanDynamicVarGenerator()
  })

  describe('constructor', () => {
    it('should load from json input file and set PostmanCollection', () => {
      expect(pmVars.dynamicGenerators).toBeDefined()
    })
  })

  describe('dynamicGenerators', () => {
    it('should generate a value for every dynamic variable', () => {
      Object.values(pmVars.dynamicGenerators).forEach((dynamicVar: any) => {
        expect(dynamicVar.generator()).toBeDefined()
      })
    })
  })

  describe('replaceDynamicVar', () => {
    it('should be able to replace {{$randomIntTest}} in a text', async () => {
      const res = pmVars.replaceDynamicVar('foo bar {{$randomIntTest}} lorem')
      expect(res).toStrictEqual('foo bar 123 lorem')
    })

    it('should be able to replace multiple {{$randomIntTest}} in a text', async () => {
      const res = pmVars.replaceDynamicVar('foo {{$randomIntTest}} bar {{$randomIntTest}} lorem')
      expect(res).toStrictEqual('foo 123 bar 123 lorem')
    })
  })

  describe('renderDynamicVar', () => {
    it('should be able to render: randomIntTest', async () => {
      const res = pmVars.renderDynamicVar('randomIntTest')
      expect(res).toStrictEqual(123)
    })

    it('should be throw an error for non-existing dynamic variable: fooBar', async () => {
      expect(() => {
        pmVars.renderDynamicVar('fooBar')
      }).toThrow('Unsupported')
    })
  })
})
