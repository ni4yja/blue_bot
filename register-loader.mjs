import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

try {
  const currentDir = pathToFileURL(`${process.cwd()}/`)

  // Register ts-node with explicit configuration
  register('ts-node/esm', currentDir, {
    // Compiler options to ensure proper TypeScript handling
    compilerOptions: {
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      target: 'ES2022',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
    // Enable experimental specifier resolution to handle imports without extensions
    experimentalSpecifierResolution: 'node',
  })

  // Use a more generic logging approach instead of direct console.log
  process.stdout.write('Successfully registered ts-node/esm loader\n')
}
catch (error) {
  // Properly format the error message
  process.stderr.write(`Error registering ts-node/esm loader: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
}
