import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

try {
  const currentDir = pathToFileURL(`${process.cwd()}/`)
  
  // Register ts-node with explicit configuration
  register('ts-node/esm', currentDir, {
    // Compiler options to ensure proper TypeScript handling
    compilerOptions: {
      module: "NodeNext",
      moduleResolution: "NodeNext",
      target: "ES2022",
      esModuleInterop: true,
      allowSyntheticDefaultImports: true
    },
    // Enable experimental specifier resolution to handle imports without extensions
    experimentalSpecifierResolution: "node"
  })
  
  console.log('Successfully registered ts-node/esm loader')
} catch (error) {
  console.error('Error registering ts-node/esm loader:', error)
  process.exit(1)
}
