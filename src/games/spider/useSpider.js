import { useCallback, useEffect, useState } from 'react'
import { createSpiderDeck, shuffleDeck } from './deck.js'
import { canPlaceOn, checkCompletedSequence, dealInitial, isValidRun } from './solitaireLogic.js'

const CLEAR_DURATION = 550

export function useSpider() {
  const [difficulty, setDifficulty] = useState(1)
  const [columns, setColumns] = useState([])
  const [stock, setStock] = useState([])
  const [foundations, setFoundations] = useState([])
  const [moveCount, setMoveCount] = useState(0)
  const [status, setStatus] = useState('playing')
  const [toast, setToast] = useState(null)
  const [shakingCardId, setShakingCardId] = useState(null)
  const [clearingIds, setClearingIds] = useState([])
  const [pendingMove, setPendingMove] = useState(null) // { fromCol, cardIndex, candidates: number[] } | null

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
    setShakingCardId(null)
    setClearingIds([])
    setPendingMove(null)
  }, [])

  useEffect(() => {
    startNewGame(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 1600)
  }, [])

  const triggerShake = useCallback((cardId) => {
    setShakingCardId(cardId)
    setTimeout(() => {
      setShakingCardId((prev) => (prev === cardId ? null : prev))
    }, 400)
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

  const commitMove = useCallback(
    (fromCol, cardIndex, toCol) => {
      const source = columns[fromCol]
      const dest = columns[toCol]
      const runToMove = source.slice(cardIndex)
      if (!canPlaceOn(dest, runToMove[0])) return

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
    [columns, resolveCompletion],
  )

  const handleCardClick = useCallback(
    (colIndex, cardIndex) => {
      // A destination choice is pending from a previous ambiguous click
      if (pendingMove) {
        const { fromCol, cardIndex: fromCardIndex, candidates } = pendingMove
        if (candidates.includes(colIndex) && colIndex !== fromCol) {
          commitMove(fromCol, fromCardIndex, colIndex)
          setPendingMove(null)
          return
        }
        setPendingMove(null)
        if (colIndex === fromCol && cardIndex === fromCardIndex) return // clicking the same card cancels
        // otherwise fall through and treat this as a fresh click below
      }

      const column = columns[colIndex]
      const card = column[cardIndex]
      if (!card.faceUp) return

      if (!isValidRun(column, cardIndex)) {
        triggerShake(card.id)
        showToast("That card isn't free to move")
        return
      }

      const run = column.slice(cardIndex)
      const candidates = findAllValidTargets(columns, colIndex, run[0])

      if (candidates.length === 0) {
        triggerShake(card.id)
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
    [columns, pendingMove, commitMove, findAllValidTargets, showToast, triggerShake],
  )

  const canDeal = stock.length > 0 && !columns.some((col) => col.length === 0)

  const dealFromStock = useCallback(() => {
    if (!canDeal) return
    setPendingMove(null)
    const dealt = stock.slice(0, 10)
    const columnsAfterDeal = columns.map((col, i) => [...col, { ...dealt[i], faceUp: true }])

    setColumns(columnsAfterDeal)
    setStock((prev) => prev.slice(10))

    columnsAfterDeal.forEach((col, i) => {
      const completed = checkCompletedSequence(col)
      if (completed) resolveCompletion(i, completed)
    })
  }, [canDeal, stock, columns, resolveCompletion])

  return {
    difficulty,
    columns,
    stock,
    foundations,
    moveCount,
    status,
    toast,
    shakingCardId,
    clearingIds,
    pendingTargets: pendingMove?.candidates ?? [],
    canDeal,
    startNewGame,
    handleCardClick,
    dealFromStock,
  }
}