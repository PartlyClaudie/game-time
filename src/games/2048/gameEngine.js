const DEFAULT_DIMS = { rows: 4, cols: 4 }
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

function withinBounds(row, col, dims) {
  return row >= 0 && row < dims.rows && col >= 0 && col < dims.cols
}

function buildTraversals(vector, dims) {
  let rowOrder = Array.from({ length: dims.rows }, (_, i) => i)
  let colOrder = Array.from({ length: dims.cols }, (_, i) => i)
  if (vector.dRow === 1) rowOrder = [...rowOrder].reverse()
  if (vector.dCol === 1) colOrder = [...colOrder].reverse()
  return { rowOrder, colOrder }
}

export function createInitialTiles(dims = DEFAULT_DIMS) {
  return spawnRandomTile(spawnRandomTile([], 0.1, dims), 0.1, dims)
}

export function spawnRandomTile(tiles, fourChance = 0.1, dims = DEFAULT_DIMS) {
  const occupied = new Set(tiles.map((t) => `${t.row}-${t.col}`))
  const empty = []
  for (let row = 0; row < dims.rows; row++) {
    for (let col = 0; col < dims.cols; col++) {
      if (!occupied.has(`${row}-${col}`)) empty.push({ row, col })
    }
  }
  if (empty.length === 0) return tiles
  const { row, col } = empty[Math.floor(Math.random() * empty.length)]
  const value = Math.random() < fourChance ? 4 : 2
  return [...tiles, { id: nextId(), row, col, value }]
}

export function performMove(tiles, direction, dims = DEFAULT_DIMS) {
  const vector = VECTORS[direction]
  const { rowOrder, colOrder } = buildTraversals(vector, dims)

  const working = tiles.map((t) => ({ ...t, mergedThisMove: false }))
  const grid = Array.from({ length: dims.rows }, () => Array(dims.cols).fill(null))
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
      while (withinBounds(scanRow, scanCol, dims) && grid[scanRow][scanCol] === null) {
        prevRow = scanRow
        prevCol = scanCol
        scanRow += vector.dRow
        scanCol += vector.dCol
      }
      const blocking = withinBounds(scanRow, scanCol, dims) ? grid[scanRow][scanCol] : null

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

  return {
    moved,
    scoreGained,
    slidTiles,
    settledTiles,
    merges: mergedPairs.map(({ row, col, value }) => ({ row, col, value })),
  }
}

export function isGameOver(tiles, dims = DEFAULT_DIMS) {
  if (tiles.length < dims.rows * dims.cols) return false
  const grid = Array.from({ length: dims.rows }, () => Array(dims.cols).fill(null))
  tiles.forEach((t) => {
    grid[t.row][t.col] = t.value
  })
  for (let row = 0; row < dims.rows; row++) {
    for (let col = 0; col < dims.cols; col++) {
      const value = grid[row][col]
      if (col < dims.cols - 1 && grid[row][col + 1] === value) return false
      if (row < dims.rows - 1 && grid[row + 1][col] === value) return false
    }
  }
  return true
}