import { spawn } from "child_process";

// Helper to run bd command
export async function runBd(args: string[], cwd: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('bd', args, { cwd })
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`bd command failed with code ${code}: ${stderr}`))
      } else {
        try {
          // Attempt to parse JSON if expected
          if (args.includes('--json')) {
            if (!stdout.trim()) return resolve(null)
            resolve(JSON.parse(stdout))
          } else {
            resolve(stdout)
          }
        } catch (e) {
          // Fallback for non-json output or parsing error
          console.error("Parse error", e)
          resolve(stdout)
        }
      }
    })

    proc.on('error', (err) => {
      reject(err)
    })
  })
}
