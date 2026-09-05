import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const SIZE = 256
const INNER_FROM = 48
const INNER_TO = SIZE - INNER_FROM
const OUTER_RGB = [30, 27, 75]
const INNER_RGB = [129, 140, 248]

function crc32(buffer) {
  let crc = 0xff_ff_ff_ff
  for (const byte of buffer) {
    let c = (crc ^ byte) & 0xff
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xff_ff_ff_ff) >>> 0
}

/**
 * @param {string} type
 * @param {Buffer} data
 */
function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const stride = SIZE * 4 + 1
const raw = Buffer.alloc(stride * SIZE)
for (let y = 0; y < SIZE; y += 1) {
  raw[y * stride] = 0 // filtre PNG « none » pour la ligne
  for (let x = 0; x < SIZE; x += 1) {
    const isInner = x >= INNER_FROM && x < INNER_TO && y >= INNER_FROM && y < INNER_TO
    const [r, g, b] = isInner ? INNER_RGB : OUTER_RGB
    const offset = y * stride + 1 + x * 4
    raw[offset] = r
    raw[offset + 1] = g
    raw[offset + 2] = b
    raw[offset + 3] = 255
  }
}

const header = Buffer.alloc(13)
header.writeUInt32BE(SIZE, 0)
header.writeUInt32BE(SIZE, 4)
header[8] = 8 // bits par canal
header[9] = 6 // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync('resources', { recursive: true })
writeFileSync('resources/icon.png', png)
console.log('resources/icon.png écrit (256x256)')
