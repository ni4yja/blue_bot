import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const currentDir = pathToFileURL(`${process.cwd()}/`)
register('ts-node/esm', currentDir)
