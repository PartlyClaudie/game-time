const SIZE = 4
export const ANIMATION_MS = 120

const VECTORS = {
  left: { dRow: 0, dCol: -1 },
  right: { dRow: 0, dCol: 1 },
  up: { dRow: -1, dCol: 0 },
  down: { dRow: 1, dCol: 0 },
}

let idCounter = 1
function nextId() {
  idCounter += 1
  return `tile-${idCounter}`
}

function withinBounds(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE
}

function buildTraversals(vector) {
  let rowOrder = [0, 1, 2, 3]
  let colOrder = [0, 1, 2, 3]
  if (vector.dRow === 1) rowOrder = [...rowOrder].reverse()
  if (vector.dCol === 1) colOrder = [...colOrder].reverse()
  return { rowOrder, colOrder }
}

export function createInitialTiles() {
  return spawnRandomTile(spawnRandomTile([]))
}

export function spawnRandomTile(tiles, fourChance = 0.1) {
  const occupied = new Set(tiles.map((t) => `${t.row}-${t.col}`))
  const empty = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!occupied.has(`${row}-${col}`)) empty.push({ row, col })
    }
  }
  if (empty.length === 0) return tiles
  const { row, col } = empty[Math.floor(Math.random() * empty.length)]
  const value = Math.random() < fourChance ? 4 : 2
  return [...tiles, { id: nextId(), row, col, value }]
}

// tiles: [{id, row, col, value}]
export function performMove(tiles, direction) {
  const vector = VECTORS[direction]
  const { rowOrder, colOrder } = buildTraversals(vector)

  const working = tiles.map((t) => ({ ...t, mergedThisMove: false }))
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  working.forEach((t) => {
    grid[t.row][t.col] = t
  })

  let scoreGained = 0
  let moved = false
  const mergedPairs = []

  rowOrder.forEach((row) => {
    colOrder.forEach((col) => {
      const tile = grid[row][col]
      if (!tile) return

      let prevRow = row
      let prevCol = col
      let scanRow = row + vector.dRow
      let scanCol = col + vector.dCol
      while (withinBounds(scanRow, scanCol) && grid[scanRow][scanCol] === null) {
        prevRow = scanRow
        prevCol = scanCol
        scanRow += vector.dRow
        scanCol += vector.dCol
      }
      const blocking = withinBounds(scanRow, scanCol) ? grid[scanRow][scanCol] : null

      if (blocking && blocking.value === tile.value && !blocking.mergedThisMove && !tile.mergedThisMove) {
        grid[row][col] = null
        tile.row = scanRow
        tile.col = scanCol
        blocking.mergedThisMove = true
        scoreGained += tile.value * 2
        mergedPairs.push({ survivorId: blocking.id, absorbedId: tile.id, row: scanRow, col: scanCol, value: tile.value * 2 })
        moved = true
      } else {
        grid[row][col] = null
        tile.row = prevRow
        tile.col = prevCol
        grid[prevRow][prevCol] = tile
        if (prevRow !== row || prevCol !== col) moved = true
      }
    })
  })

  const slidTiles = working.map(({ mergedThisMove, ...rest }) => rest)

  const absorbedIds = new Set(mergedPairs.map((m) => m.absorbedId))
  const survivorOverrides = new Map(mergedPairs.map((m) => [m.survivorId, m]))

  const settledTiles = working
    .filter((t) => !absorbedIds.has(t.id))
    .map((t) => {
      const override = survivorOverrides.get(t.id)
      if (override) {
        return { id: nextId(), row: override.row, col: override.col, value: override.value }
      }
      return { id: t.id, row: t.row, col: t.col, value: t.value }
    })

  return { moved, scoreGained, slidTiles, settledTiles }
}

export function isGameOver(tiles) {
  if (tiles.length < SIZE * SIZE) return false
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  tiles.forEach((t) => {
    grid[t.row][t.col] = t.value
  })
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = grid[row][col]
      if (col < SIZE - 1 && grid[row][col + 1] === value) return false
      if (row < SIZE - 1 && grid[row + 1][col] === value) return false
    }
  }
  return true
}