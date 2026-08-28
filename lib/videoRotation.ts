interface TkhdInfo {
  rotation: number
  width: number
  height: number
}

// Lê a matriz de transformação do box `tkhd` do MP4 para detectar rotação (90/180/270)
// embutida pelo dispositivo de gravação. O <video> HTML5 não aplica essa rotação no Chrome/Edge.
//
// O box `moov` (que contém `tkhd`) pode estar no início OU no final do arquivo,
// dependendo de como o MP4 foi gravado/exportado (sem fast-start, moov fica no final).
// Por isso varremos o início e, se não achar, o final do arquivo também.
export async function getVideoRotation(file: File): Promise<number> {
  const info = await getTkhdInfo(file)
  return info?.rotation ?? 0
}

// Retorna se o vídeo fica paisagem (width > height) após aplicar a rotação gravada no tkhd.
// Vídeos paisagem nativos (sem rotação gravada) precisam de um giro extra de 90° para caber
// no crop/scale vertical 9:16 — caso contrário o crop morde uma faixa fina do meio da cena.
export async function isLandscapeAfterRotation(file: File): Promise<boolean> {
  const info = await getTkhdInfo(file)
  if (!info) return false
  const rotatedDims =
    info.rotation === 90 || info.rotation === 270
      ? { width: info.height, height: info.width }
      : { width: info.width, height: info.height }
  return rotatedDims.width > rotatedDims.height
}

async function getTkhdInfo(file: File): Promise<TkhdInfo | null> {
  const headBuf = await file.slice(0, 8 * 1024 * 1024).arrayBuffer()
  const headView = new DataView(headBuf)
  const headInfo = findTkhdInfo(headView, 0, headView.byteLength)
  if (headInfo !== null) return headInfo

  if (file.size > 8 * 1024 * 1024) {
    const tailStart = Math.max(0, file.size - 8 * 1024 * 1024)
    const tailBuf = await file.slice(tailStart, file.size).arrayBuffer()
    const tailView = new DataView(tailBuf)
    const tailInfo = findTkhdInfo(tailView, 0, tailView.byteLength)
    if (tailInfo !== null) return tailInfo
  }

  return null
}

function findTkhdInfo(view: DataView, start: number, end: number): TkhdInfo | null {
  let offset = start
  while (offset + 8 <= end) {
    let size = view.getUint32(offset)
    let headerSize = 8

    if (size === 1) {
      // largesize: o tamanho real de 64 bits vem logo após o header de 8 bytes
      if (offset + 16 > end) break
      const high = view.getUint32(offset + 8)
      const low = view.getUint32(offset + 12)
      size = high * 2 ** 32 + low
      headerSize = 16
    } else if (size === 0) {
      // box vai até o fim do range disponível
      size = end - offset
    }

    if (size < headerSize) break

    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    )

    if (type === 'moov' || type === 'trak') {
      const inner = findTkhdInfo(view, offset + headerSize, Math.min(offset + size, end))
      if (inner !== null) return inner
    }

    if (type === 'tkhd') {
      const version = view.getUint8(offset + headerSize)
      // version(1) + flags(3) + creation+modification+track_ID+reserved+duration
      // (v0: 4+4+4+4+4 bytes / v1: 8+8+4+4+8 bytes) + reserved(8) + layer(2) + alt_group(2) + volume(2) + reserved(2)
      const matrixOffset =
        offset + headerSize + 1 + 3 + (version === 1 ? 8 + 8 + 4 + 4 + 8 : 4 + 4 + 4 + 4 + 4) + 8 + 2 + 2 + 2 + 2
      // width/height (32-bit fixed-point 16.16) vêm logo após a matriz de 36 bytes (9 valores int32)
      const dimsOffset = matrixOffset + 36
      if (dimsOffset + 8 > end) {
        offset += size
        continue
      }
      const width = view.getUint32(dimsOffset) / 65536
      const height = view.getUint32(dimsOffset + 4) / 65536
      // tracks de áudio têm width/height zerados — pula para achar o tkhd do track de vídeo
      if (width === 0 || height === 0) {
        offset += size
        continue
      }

      const round = (n: number) => Math.round(n)
      const a = round(view.getInt32(matrixOffset) / 65536)
      const b = round(view.getInt32(matrixOffset + 4) / 65536)
      const c = round(view.getInt32(matrixOffset + 8) / 65536)
      const d = round(view.getInt32(matrixOffset + 12) / 65536)

      let rotation = 0
      if (a === 0 && b === 1 && c === -1 && d === 0) rotation = 90
      else if (a === 0 && b === -1 && c === 1 && d === 0) rotation = 270
      else if (a === -1 && b === 0 && c === 0 && d === -1) rotation = 180

      return { rotation, width, height }
    }

    offset += size
  }
  return null
}
