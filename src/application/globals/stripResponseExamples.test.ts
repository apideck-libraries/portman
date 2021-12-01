import fs from 'fs-extra'
import { Collection } from 'postman-collection'
import { stripResponseExamples } from '../../application'

describe('stripResponseExamples', () => {
  const postmanJson = '__tests__/fixtures/crm.postman.json'
  let postmanCollJson

  beforeEach(async () => {
    const postmanObj = JSON.parse(fs.readFileSync(postmanJson).toString())
    postmanCollJson = new Collection(postmanObj).toJSON()
    postmanCollJson.info.description = 'stripResponseExamples'
  })

  it('should remove response examples from the collection', async () => {
    const collection = stripResponseExamples(postmanCollJson) as any
    expect(collection?.item?.[0]?.item?.[0]).toMatchSnapshot()
  })
})
