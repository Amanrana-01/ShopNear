/**
 * Starts the API and all three web clients in one terminal.
 *
 * The customer app can run alone against its mock catalogue, but the merchant
 * and admin apps talk straight to the API (apps/web-merchant/src/api/client.ts),
 * so they are only useful with the database and API up. This script exists so
 * that "show me the whole system" is one command rather than four terminals.
 *
 * Deliberately dependency-free: adding `concurrently` for four spawns is not
 * worth another entry in the lockfile.
 */
import { spawn } from 'node:child_process'
import net from 'node:net'

const DB_PORT = 5436

const SERVICES = [
  { name: 'api     ', colour: '\x1b[35m', script: 'dev:api', url: 'http://localhost:4000/health' },
  { name: 'customer', colour: '\x1b[36m', script: 'dev:web-customer', url: 'http://localhost:5173' },
  { name: 'merchant', colour: '\x1b[32m', script: 'dev:web-merchant', url: 'http://localhost:5174' },
  { name: 'admin   ', colour: '\x1b[33m', script: 'dev:web-admin', url: 'http://localhost:5175' },
]

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'

/** Resolves true if something is listening — used only to warn, never to block. */
function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' })
    const done = (result) => {
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(1500)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

if (!(await isPortOpen(DB_PORT))) {
  console.log(
    `\n\x1b[31mNothing is listening on port ${DB_PORT}.\x1b[0m ` +
      'The database container is probably not running.\n' +
      'Start it first, then re-run this command:\n\n' +
      '  docker compose up -d\n\n' +
      'Continuing anyway — the web clients will start, but the API will fail to reach the database.\n',
  )
}

const children = []
let shuttingDown = false

for (const service of SERVICES) {
  // shell:true so this works with npm.cmd on Windows as well as npm on POSIX.
  const child = spawn('npm', ['run', service.script], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push({ service, child })

  const prefix = `${service.colour}${service.name}${RESET} ${DIM}|${RESET} `
  const write = (stream) => (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim()) stream.write(prefix + line + '\n')
    }
  }
  child.stdout.on('data', write(process.stdout))
  child.stderr.on('data', write(process.stderr))

  child.on('exit', (code) => {
    if (shuttingDown) return
    process.stdout.write(`${prefix}exited with code ${code}\n`)
  })
}

console.log(
  '\nStarting ShopNear:\n' +
    SERVICES.map((s) => `  ${s.colour}${s.name.trim()}${RESET}  ${s.url}`).join('\n') +
    '\n\nDemo logins — customer 9000000001 / OTP 123456 · merchant 9000000010 / demo1234 · admin admin@shopnear.local / admin1234' +
    '\nPress Ctrl+C to stop everything.\n',
)

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  console.log('\nStopping all services...')
  for (const { child } of children) {
    if (child.exitCode === null) child.kill()
  }
  // Give the children a moment to exit on their own before we do.
  setTimeout(() => process.exit(0), 500)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
