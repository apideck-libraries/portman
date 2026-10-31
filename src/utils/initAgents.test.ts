import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { AGENTS_END_MARKER, AGENTS_START_MARKER, initAgents } from './initAgents'

describe('initAgents', () => {
  let cwd: string

  const read = (file: string): string => fs.readFileSync(path.join(cwd, file), 'utf8')
  const count = (content: string, search: string): number => content.split(search).length - 1

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'portman-init-agents-'))
  })

  afterEach(() => {
    fs.removeSync(cwd)
  })

  it('should create AGENTS.md with the Portman instructions', () => {
    const files = initAgents(cwd)

    expect(files).toEqual([path.join(cwd, 'AGENTS.md')])
    const content = read('AGENTS.md')
    expect(content.startsWith(AGENTS_START_MARKER)).toBe(true)
    expect(content.endsWith(`${AGENTS_END_MARKER}\n`)).toBe(true)
    expect(content).toContain('npx @apideck/portman -l <openapi-file> -c portman-config.json')
    expect(content).toContain(`--newmanRunOptions '{"abortOnFailure":false}'`)
    expect(content).toContain('https://getportman.com/mcp')
    expect(content).toContain('https://getportman.com/docs')
    expect(fs.existsSync(path.join(cwd, 'CLAUDE.md'))).toBe(false)
  })

  it('should use the portman-cli.json of the project when present', () => {
    fs.outputFileSync(path.join(cwd, 'portman/portman-cli.json'), '{}')
    initAgents(cwd)

    expect(read('AGENTS.md')).toContain(
      'npx @apideck/portman --cliOptionsFile portman/portman-cli.json'
    )
  })

  it('should append to an existing AGENTS.md and preserve its content', () => {
    const existing = '# Agents\n\nRun `npm test` before committing.\n'
    fs.writeFileSync(path.join(cwd, 'AGENTS.md'), existing)
    initAgents(cwd)

    const content = read('AGENTS.md')
    expect(content.startsWith(`${existing}\n${AGENTS_START_MARKER}`)).toBe(true)
    expect(count(content, AGENTS_START_MARKER)).toBe(1)
  })

  it('should replace the Portman block on re-run, without duplicating it', () => {
    const before = '# Agents\n\nIntro.\n'
    const after = '\n## Other section\n\nKeep me.\n'
    fs.writeFileSync(
      path.join(cwd, 'AGENTS.md'),
      `${before}\n${AGENTS_START_MARKER}\nold instructions\n${AGENTS_END_MARKER}\n${after}`
    )

    initAgents(cwd)
    const first = read('AGENTS.md')
    initAgents(cwd)
    const second = read('AGENTS.md')

    expect(second).toEqual(first)
    expect(count(second, AGENTS_START_MARKER)).toBe(1)
    expect(count(second, AGENTS_END_MARKER)).toBe(1)
    expect(second).not.toContain('old instructions')
    expect(second.startsWith(before)).toBe(true)
    expect(second.endsWith(after)).toBe(true)
  })

  it('should update CLAUDE.md only when it exists', () => {
    initAgents(cwd)
    expect(fs.existsSync(path.join(cwd, 'CLAUDE.md'))).toBe(false)

    fs.writeFileSync(path.join(cwd, 'CLAUDE.md'), '# Claude\n')
    const files = initAgents(cwd)

    expect(files).toEqual([path.join(cwd, 'AGENTS.md'), path.join(cwd, 'CLAUDE.md')])
    const content = read('CLAUDE.md')
    expect(content.startsWith(`# Claude\n\n${AGENTS_START_MARKER}`)).toBe(true)
    expect(count(read('AGENTS.md'), AGENTS_START_MARKER)).toBe(1)
  })
})
