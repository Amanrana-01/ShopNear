import 'dotenv/config'
import http from 'node:http'
import { createApp } from './app'
import { initRealtime } from './realtime/io'
import { registerScheduledJobs } from './jobs'

const port = Number(process.env.PORT ?? 4000)
const server = http.createServer(createApp())

initRealtime(server)
registerScheduledJobs()

server.listen(port, () => {
  console.log(`ShopNear API listening on http://localhost:${port}`)
})
