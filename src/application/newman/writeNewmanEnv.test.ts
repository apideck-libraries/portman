import fs from 'fs-extra'
import { getPostmanCollection } from '../../../__tests__/testUtils/getPostmanCollection'
import { writeNewmanEnv } from '../../application'

describe('writeNewmanEnv', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('map variables from collection and write to file', () => {
    const fsSpy = jest.spyOn(fs, 'outputFileSync')

    const collection = getPostmanCollection()
    const postmanJson = collection.toJSON()

    writeNewmanEnv(postmanJson, 'tmp/mock.json')
    expect(fsSpy).toHaveBeenCalled()
  })

  it('should not writeToFile if no variables are defined', () => {
    const fsSpy = jest.spyOn(fs, 'outputFileSync')

    writeNewmanEnv({}, 'tmp/mock.json')
    expect(fsSpy).not.toHaveBeenCalled()
  })
})
