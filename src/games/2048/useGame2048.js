import { useCallback, useEffect, useState } from 'react'

const SIZE = 4
const BEST_SCORE_KEY = 'game-hub:2048:best'

function emptyBoard() {
  return Array(SIZE * SIZE).fill(0)
}

function getEmptyIndices(board) {
  return board.reduce((acc, v, i) => {
    if (v === 0) acc.push(i)
    return acc
  }, [])
}

function addRandomTile(board) {
  const empty = getEmptyIndices(board)
  if (empty.length === 0) return board
  const idx = empty[Math.floor(Math.random() * empty.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  const next = [...board]
  next[idx] = value
  return next
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function getRow(board, r) {
  return [board[r * 4], board[r * 4 + 1], board[r * 4 + 2], board[r * 4 + 3]]
}
function getCol(board, c) {
  return [board[c], board[c + 4], board[c + 8], board[c + 12]]
}
function setRow(board, r, row) {
  const next = [...board]
  for (let i = 0; i < 4; i++) next[r * 4 + i] = row[i]
  return next
}
function setCol(board, c, col) {
  const next = [...board]
  for (let i = 0; i < 4; i++) next[c + i * 4] = col[i]
  return next
}

function slideAndMerge(line) {
  const filtered = line.filter((v) => v !== 0)
  let scoreGained = 0
  const merged = []
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2
      merged.push(mergedValue)
      scoreGained += mergedValue
      i++
    } else {
      merged.push(filtered[i])
    }
  }
  while (merged.length < 4) merged.push(0)
  return { line: merged, scoreGained }
}

function moveLeft(board) {
  let scoreGained = 0, next = board, moved = false
  for (let r = 0; r < 4; r++) {
    const row = getRow(next, r)
    const { line, scoreGained: gained } = slideAndMerge(row)
    if (!arraysEqual(row, line)) moved = true
    next = setRow(next, r, line)
    scoreGained += gained
  }
  return { board: next, scoreGained, moved }
}

function moveRight(board) {
  let scoreGained = 0, next = board, moved = false
  for (let r = 0; r < 4; r++) {
    const row = getRow(next, r).reverse()
    const { line, scoreGained: gained } = slideAndMerge(row)
    const result = line.reverse()
    if (!arraysEqual(getRow(next, r), result)) moved = true
    next = setRow(next, r, result)
    scoreGained += gained
  }
  return { board: next, scoreGained, moved }
}

function moveUp(board) {
  let scoreGained = 0, next = board, moved = false
  for (let c = 0; c < 4; c++) {
    const col = getCol(next, c)
    const { line, scoreGained: gained } = slideAndMerge(col)
    if (!arraysEqual(col, line)) moved = true
    next = setCol(next, c, line)
    scoreGained += gained
  }
  return { board: next, scoreGained, moved }
}

function moveDown(board) {
  let scoreGained = 0, next = board, moved = false
  for (let c = 0; c < 4; c++) {
    const col = getCol(next, c).reverse()
    const { line, scoreGained: gained } = slideAndMerge(col)
    const result = line.reverse()
    if (!arraysEqual(getCol(next, c), result)) moved = true
    next = setCol(next, c, result)
    scoreGained += gained
  }
  return { board: next, scoreGained, moved }
}

const MOVES = { left: moveLeft, right: moveRight, up: moveUp, down: moveDown }

function isGameOver(board) {
  if (getEmptyIndices(board).length > 0) return false
  for (let r = 0; r < 4; r++) {
    const row = getRow(board, r)
    for (let i = 0; i < 3; i++) if (row[i] === row[i + 1]) return false
  }
  for (let c = 0; c < 4; c++) {
    const col = getCol(board, c)
    for (let i = 0; i < 3; i++) if (col[i] === col[i + 1]) return false
  }
  return true
}

function initBoard() {
  return addRandomTile(addRandomTile(emptyBoard()))
}

export function useGame2048() {
  const [board, setBoard] = useState(initBoard)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(BEST_SCORE_KEY)
    return stored ? Number(stored) : 0
  })
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'

  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem(BEST_SCORE_KEY, String(score))
    }
  }, [score, best])

  const move = useCallback(
    (direction) => {
      if (status === 'lost') return
      const fn = MOVES[direction]
      if (!fn) return
      const { board: movedBoard, scoreGained, moved } = fn(board)
      if (!moved) return

      const nextBoard = addRandomTile(movedBoard)
      setBoard(nextBoard)
      setScore((s) => s + scoreGained)

      if (status !== 'won' && nextBoard.includes(2048)) {
        setStatus('won')
      } else if (isGameOver(nextBoard)) {
        setStatus('lost')
      }
    },
    [board, status],
  )

  const reset = useCallback(() => {
    setBoard(initBoard())
    setScore(0)
    setStatus('playing')
  }, [])

  return { board, score, best, status, move, reset }
}