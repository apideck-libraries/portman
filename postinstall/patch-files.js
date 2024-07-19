const fs = require('fs')
const path = require('path')

// Source and destination paths
const sourcePath = path.join(__dirname, 'postinstall', 'schemaUtils.patch')
const destPath = path.join(
  __dirname,
  'node_modules',
  'openapi-to-postmanv2',
  'libV2',
  'schemaUtils.js'
)

// Copy the file
fs.copyFile(sourcePath, destPath, err => {
  if (err) {
    console.error('Error copying file:', err)
  } else {
    console.log('File copied successfully!')
  }
})
