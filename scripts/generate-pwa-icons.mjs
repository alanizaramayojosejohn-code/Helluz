import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const source = resolve(root, 'public/images/Logo.webp')
const outDir = resolve(root, 'public/icons')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

await mkdir(outDir, { recursive: true })

for (const size of sizes) {
   const out = resolve(outDir, `icon-${size}x${size}.png`)
   await sharp(source)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out)
   console.log(`generated ${out}`)
}

const maskableOut = resolve(outDir, 'icon-maskable-512x512.png')
await sharp(source)
   .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
   .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 198, g: 40, b: 40, alpha: 1 } })
   .png()
   .toFile(maskableOut)
console.log(`generated ${maskableOut}`)
