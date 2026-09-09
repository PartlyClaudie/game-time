import { useCallback, useEffect, useRef, useState } from 'react'
import { createSpiderDeck, shuffleDeck } from './deck.js'
import { canPlaceOn, checkCompletedSequence, dealInitial, isValidRun } from './solitaireLogic.js'
import { findBestHint, findProductiveMoves } from './hints.js'

const CLEAR_DURATION = 550
const HINT_DURATION = 2000
const MAX_HISTORY = 5
const SHAKE_DURATION = 450

export function useSpider() {
  const [difficulty, setDifficulty] = useState(1)
  const [columns, setColumns] = useState([])
  const [stock, setStock] = useState([])
  const [foundations, setFoundations] = useState([])
  const [moveCount, setMoveCount] = useState(0)
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [toast, setToast] = useState(null)
  const [shakingCols, setShakingCols] = useState([])
  const [clearingIds, setClearingIds] = useState([])
  const [pendingMove, setPendingMove] = useState(null)
  const [hintCardId, setHintCardId] = useState(null)
  const [hintTargetCol, setHintTargetCol] = useState(null)
  const [hintStock, setHintStock] = useState(false)
  const [undoCount, setUndoCount] = useState(0)

  const historyRef = useRef([])
  const hintTimerRef = useRef(null)

  const startNewGame = useCallback((suitCount) => {
    const deck = shuffleDeck(createSpiderDeck(suitCount))
    const { columns: dealtColumns, stock: dealtStock } = dealInitial(deck)
    setDifficulty(suitCount)
    setColumns(dealtColumns)
    setStock(dealtStock)
    setFoundations([])
    setMoveCount(0)
    setStatus('playing')
    setToast(null)
    setShakingCols([])
    setClearingIds([])
    setPendingMove(null)
    setHintCardId(null)
    setHintTargetCol(null)
    setHintStock(false)
    historyRef.current = []
    setUndoCount(0)
  }, [])

  useEffect(() => {
    startNewGame(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 1600)
  }, [])

  const clearHint = useCallback(() => {
    setHintCardId(null)
    setHintTargetCol(null)
    setHintStock(false)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
  }, [])

  const triggerShake = useCallback((colIndices) => {
    setShakingCols(colIndices)
    setTimeout(() => setShakingCols([]), SHAKE_DURATION)
  }, [])

  const resolveCompletion = useCallback((colIndex, completed) => {
    setClearingIds(completed.cards.map((c) => c.id))
    setTimeout(() => {
      setColumns((prevColumns) => {
        const col = prevColumns[colIndex]
        let trimmed = col.slice(0, col.length - 13)
        if (trimmed.length > 0 && !trimmed[trimmed.length - 1].faceUp) {
          trimmed = [...trimmed.slice(0, -1), { ...trimmed[trimmed.length - 1], faceUp: true }]
        }
        const next = [...prevColumns]
        next[colIndex] = trimmed
        return next
      })
      setFoundations((prev) => {
        const next = [...prev, completed]
        if (next.length === 8) setStatus('won')
        return next
      })
      setClearingIds([])
      showToast(`Sequence Complete! ${completed.suit}`)
    }, CLEAR_DURATION)
  }, [showToast])

  const findAllValidTargets = useCallback((currentColumns, sourceIdx, movingFirstCard) => {
    return currentColumns
      .map((_, idx) => idx)
      .filter((idx) => idx !== sourceIdx && canPlaceOn(currentColumns[idx], movingFirstCard))
  }, [])

  const pushHistory = useCallback(() => {
    const next = [
      ...historyRef.current,
      {
        columns: columns.map((col) => [...col]),
        stock: [...stock],
        foundations: [...foundations],
        moveCount,
      },
    ].slice(-MAX_HISTORY)
    historyRef.current = next
    setUndoCount(next.length)
  }, [columns, stock, foundations, moveCount])

  const commitMove = useCallback(
    (fromCol, cardIndex, toCol) => {
      const source = columns[fromCol]
      const dest = columns[toCol]
      const runToMove = source.slice(cardIndex)
      if (!canPlaceOn(dest, runToMove[0])) return

      pushHistory()
      const destAfterMove = [...dest, ...runToMove]

      setColumns((prevColumns) => {
        let newSource = prevColumns[fromCol].slice(0, cardIndex)
        if (newSource.length > 0 && !newSource[newSource.length - 1].faceUp) {
          newSource = [...newSource.slice(0, -1), { ...newSource[newSource.length - 1], faceUp: true }]
        }
        const next = [...prevColumns]
        next[fromCol] = newSource
        next[toCol] = destAfterMove
        return next
      })
      setMoveCount((m) => m + 1)

      const completed = checkCompletedSequence(destAfterMove)
      if (completed) resolveCompletion(toCol, completed)
    },
    [columns, resolveCompletion, pushHistory],
  )

  const handleCardClick = useCallback(
    (colIndex, cardIndex) => {
      if (status !== 'playing' || clearingIds.length > 0) return
      clearHint()

      if (pendingMove) {
        const { fromCol, cardIndex: fromCardIndex, candidates } = pendingMove
        if (candidates.includes(colIndex) && colIndex !== fromCol) {
          commitMove(fromCol, fromCardIndex, colIndex)
          setPendingMove(null)
          return
        }
        setPendingMove(null)
        if (colIndex === fromCol && cardIndex === fromCardIndex) return
      }

      const column = columns[colIndex]
      const card = column[cardIndex]
      if (!card.faceUp) return

      if (!isValidRun(column, cardIndex)) {
        triggerShake([colIndex])
        showToast("That card isn't free to move")
        return
      }

      const run = column.slice(cardIndex)
      const candidates = findAllValidTargets(columns, colIndex, run[0])

      if (candidates.length === 0) {
        triggerShake([colIndex])
        showToast('No valid move for that card')
        return
      }

      if (candidates.length === 1) {
        commitMove(colIndex, cardIndex, candidates[0])
        return
      }

      setPendingMove({ fromCol: colIndex, cardIndex, candidates })
      showToast(`${candidates.length} valid spots — click one`)
    },
    [columns, pendingMove, commitMove, findAllValidTargets, showToast, triggerShake, status, clearingIds, clearHint],
  )

  const canDeal = stock.length > 0 && !columns.some((col) => col.length === 0)

  const dealFromStock = useCallback(() => {
    if (!canDeal || status !== 'playing' || clearingIds.length > 0) return
    clearHint()
    setPendingMove(null)
    pushHistory()

    const dealt = stock.slice(0, 10)
    const columnsAfterDeal = columns.map((col, i) => [...col, { ...dealt[i], faceUp: true }])

    setColumns(columnsAfterDeal)
    setStock((prev) => prev.slice(10))

    columnsAfterDeal.forEach((col, i) => {
      const completed = checkCompletedSequence(col)
      if (completed) resolveCompletion(i, completed)
    })
  }, [canDeal, stock, columns, resolveCompletion, status, clearingIds, clearHint, pushHistory])

  const undo = useCallback(() => {
    if (clearingIds.length > 0 || pendingMove) return
    const next = [...historyRef.current]
    const prevState = next.pop()
    if (!prevState) {
      showToast('Nothing to undo')
      return
    }
    historyRef.current = next
    setUndoCount(next.length)
    setColumns(prevState.columns)
    setStock(prevState.stock)
    setFoundations(prevState.foundations)
    setMoveCount(prevState.moveCount)
    setStatus('playing')
    setPendingMove(null)
    setShakingCols([])
    setClearingIds([])
    clearHint()
  }, [clearingIds, pendingMove, showToast, clearHint])

  const requestHint = useCallback(() => {
    if (clearingIds.length > 0 || pendingMove || status !== 'playing') return
    const move = findBestHint(columns)

    if (move) {
      const card = columns[move.fromCol][move.cardIndex]
      setHintCardId(card.id)
      setHintTargetCol(move.toCol)
      setHintStock(false)
    } else if (canDeal) {
      setHintCardId(null)
      setHintTargetCol(null)
      setHintStock(true)
      showToast('Try dealing from the stock')
    } else {
      triggerShake(columns.map((_, i) => i))
      showToast('No moves left')
    }

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    hintTimerRef.current = setTimeout(clearHint, HINT_DURATION)
  }, [columns, clearingIds, pendingMove, status, canDeal, showToast, clearHint, triggerShake])

  // Game-over detection: only when idle, not mid-clear-animation, and only once the board has actually been dealt
  useEffect(() => {
    if (status !== 'playing' || clearingIds.length > 0) return
    if (columns.length === 0) return
    const stillHasMoves = findProductiveMoves(columns).length > 0 || canDeal
    if (!stillHasMoves && foundations.length < 8) {
      setStatus('lost')
    }
  }, [columns, canDeal, foundations, status, clearingIds])

  return {
    difficulty,
    columns,
    stock,
    foundations,
    moveCount,
    status,
    toast,
    shakingCols,
    clearingIds,
    pendingTargets: pendingMove?.candidates ?? [],
    hintCardId,
    hintTargetCol,
    hintStock,
    canDeal,
    canUndo: undoCount > 0,
    undoCount,
    startNewGame,
    handleCardClick,
    dealFromStock,
    undo,
    requestHint,
  }
}