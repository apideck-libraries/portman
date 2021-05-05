import { exec } from 'child_process'
export const execShellCommand = (cmd: string): Promise<boolean> => {
  return new Promise((resolve, _reject) => {
    exec(cmd, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
      } else if (stderr) {
        console.log(stderr)
      }
      resolve(stdout ? true : false)
    })
  })
}
