import path, { dirname } from 'path'
import { readdirSync, statSync } from 'fs'
import { fileURLToPath } from 'url';
import express from 'express'

const app = express()
const port = process.env.PORT || 3000

const __dirname = dirname(fileURLToPath(import.meta.url))
const basePath = path.join(__dirname, '../public')

app.use(express.static(basePath))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})