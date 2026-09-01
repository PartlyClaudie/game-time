import { useCallback, useEffect, useState } from 'react'
import { createSpiderDeck, shuffleDeck } from './deck.js'
import { canPlaceOn, checkCompletedSequence, dealInitial, isValidRun } from './solitaireLogic.js'

export function useSpider() {
  const [difficulty, setDifficulty] = useState(1)
  const [columns, setColumns] = useState([])
  const [stock, setStock] = useState([])
  const [foundations, setFoundations] = useState([])
  const [moveCount, setMoveCount] = useState(0)
  const [status, setStatus] = useState('playing')
  const [toast, setToast] = useState(null)
  const [shakingCardId, setShakingCardId] = useState(null)

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

  const pickAutoTarget = useCallback((currentColumns, sourceIdx, movingFirstCard) => {
    const candidates = currentColumns
      .map((_, idx) => idx)
      .filter((idx) => idx !== sourceIdx && canPlaceOn(currentColumns[idx], movingFirstCard))

    if (candidates.length === 0) return null

    const sameSuitMatch = candidates.find((idx) => {
      const destCol = currentColumns[idx]
      return destCol.length > 0 && destCol[destCol.length - 1].suit === movingFirstCard.suit
    })

    return sameSuitMatch !== undefined ? sameSuitMatch : candidates[0]
  }, [])

  const handleCardClick = useCallback(
    (colIndex, cardIndex) => {
      const column = columns[colIndex]
      const card = column[cardIndex]
      if (!card.faceUp) return

      if (!isValidRun(column, cardIndex)) {
        triggerShake(card.id)
        showToast("That card isn't free to move")
        return
      }

      const run = column.slice(cardIndex)
      const targetCol = pickAutoTarget(columns, colIndex, run[0])

      if (targetCol === null) {
        triggerShake(card.id)
        showToast('No valid move for that card')
        return
      }

      setColumns((prevColumns) => {
        const source = prevColumns[colIndex]
        const dest = prevColumns[targetCol]
        const runToMove = source.slice(cardIndex)
        if (!canPlaceOn(dest, runToMove[0])) return prevColumns

        let newSource = source.slice(0, cardIndex)
        if (newSource.length > 0 && !newSource[newSource.length - 1].faceUp) {
          newSource = [...newSource.slice(0, -1), { ...newSource[newSource.length - 1], faceUp: true }]
        }

        let newDest = [...dest, ...runToMove]
        const completed = checkCompletedSequence(newDest)
        if (completed) {
          newDest = newDest.slice(0, newDest.length - 13)
          if (newDest.length > 0 && !newDest[newDest.length - 1].faceUp) {
            newDest = [...newDest.slice(0, -1), { ...newDest[newDest.length - 1], faceUp: true }]
          }
          setFoundations((prev) => {
            const next = [...prev, completed]
            if (next.length === 8) setStatus('won')
            return next
          })
          showToast(`Sequence Complete! ${completed.suit}`)
        }

        const next = [...prevColumns]
        next[colIndex] = newSource
        next[targetCol] = newDest
        return next
      })
      setMoveCount((m) => m + 1)
    },
    [columns, pickAutoTarget, showToast, triggerShake],
  )

  const canDeal = stock.length > 0 && !columns.some((col) => col.length === 0)

  const dealFromStock = useCallback(() => {
    if (!canDeal) return
    setColumns((prevColumns) => {
      const next = prevColumns.map((col) => [...col])
      const dealt = stock.slice(0, 10)
      dealt.forEach((card, i) => {
        next[i].push({ ...card, faceUp: true })
      })
      next.forEach((col, i) => {
        const completed = checkCompletedSequence(col)
        if (completed) {
          next[i] = col.slice(0, col.length - 13)
          if (next[i].length > 0 && !next[i][next[i].length - 1].faceUp) {
            next[i] = [...next[i].slice(0, -1), { ...next[i][next[i].length - 1], faceUp: true }]
          }
          setFoundations((prev) => {
            const nextFoundations = [...prev, completed]
            if (nextFoundations.length === 8) setStatus('won')
            return nextFoundations
          })
          showToast(`Sequence Complete! ${completed.suit}`)
        }
      })
      return next
    })
    setStock((prev) => prev.slice(10))
  }, [canDeal, stock, showToast])

  return {
    difficulty,
    columns,
    stock,
    foundations,
    moveCount,
    status,
    toast,
    shakingCardId,
    canDeal,
    startNewGame,
    handleCardClick,
    dealFromStock,
  }
}