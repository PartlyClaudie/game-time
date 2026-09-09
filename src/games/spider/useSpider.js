import { useCallback, useEffect, useRef, useState } from 'react'
import { createSpiderDeck, shuffleDeck } from './deck.js'
import { canPlaceOn, checkCompletedSequence, dealInitial, isValidRun } from './solitaireLogic.js'
import { findBestHint, findProductiveMoves } from './hints.js'
import { DIFFICULTY_REWARDS, getLevelInfo } from './leveling.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'

const CLEAR_DURATION = 550
const HINT_DURATION = 2000
const MAX_HISTORY = 5
const SHAKE_DURATION = 450
const SAVE_DEBOUNCE_MS = 400

const XP_KEY = 'game-hub:spider:xp'
const SILK_KEY = 'game-hub:spider:silk'
const BACKS_KEY = 'game-hub:spider:backs'
const SELECTED_BACK_KEY = 'game-hub:spider:selectedBack'

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useSpider() {
  const { user, profile } = useAuth()

  const [difficulty, setDifficulty] = useState(1)
  const [columns, setColumns] = useState([])
  const [stock, setStock] = useState([])
  const [foundations, setFoundations] = useState([])
  const [moveCount, setMoveCount] = useState(0)
  const [status, setStatus] = useState('playing')
  const [toast, setToast] = useState(null)
  const [shakingCols, setShakingCols] = useState([])
  const [clearingIds, setClearingIds] = useState([])
  const [pendingMove, setPendingMove] = useState(null)
  const [hintCardId, setHintCardId] = useState(null)
  const [hintTargetCol, setHintTargetCol] = useState(null)
  const [hintStock, setHintStock] = useState(false)
  const [undoCount, setUndoCount] = useState(0)

  const [xp, setXp] = useState(() => {
    const v = Number(readJSON(XP_KEY, 0))
    return Number.isFinite(v) ? v : 0
  })
  const [silk, setSilk] = useState(() => {
    const v = Number(readJSON(SILK_KEY, 0))
    return Number.isFinite(v) ? v : 0
  })
  const [ownedBacks, setOwnedBacks] = useState(() => readJSON(BACKS_KEY, ['classic']))
  const [selectedBack, setSelectedBack] = useState(() => readJSON(SELECTED_BACK_KEY, 'classic'))

  const historyRef = useRef([])
  const hintTimerRef = useRef(null)
  const syncedUserIdRef = useRef(null)

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

  // Load correct economy source: account profile if logged in and matching, else guest localStorage
  useEffect(() => {
    if (user && profile && profile.id === user.id) {
      setXp(profile.spider_xp ?? 0)
      setSilk(profile.spider_silk ?? 0)
      setOwnedBacks(profile.spider_owned_backs ?? ['classic'])
      setSelectedBack(profile.spider_selected_back ?? 'classic')
      syncedUserIdRef.current = user.id
    } else if (!user) {
      setXp(Number(readJSON(XP_KEY, 0)) || 0)
      setSilk(Number(readJSON(SILK_KEY, 0)) || 0)
      setOwnedBacks(readJSON(BACKS_KEY, ['classic']))
      setSelectedBack(readJSON(SELECTED_BACK_KEY, 'classic'))
      syncedUserIdRef.current = 'guest'
    }
  }, [user, profile])

  useEffect(() => {
    syncedUserIdRef.current = null
  }, [user?.id])

  // Guest persistence
  useEffect(() => {
    if (user) return
    localStorage.setItem(XP_KEY, JSON.stringify(xp))
  }, [xp, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(SILK_KEY, JSON.stringify(silk))
  }, [silk, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(BACKS_KEY, JSON.stringify(ownedBacks))
  }, [ownedBacks, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(SELECTED_BACK_KEY, JSON.stringify(selectedBack))
  }, [selectedBack, user])

  // Account persistence — one combined debounced write
  useEffect(() => {
    if (!user || syncedUserIdRef.current !== user.id) return
    const timer = setTimeout(() => {
      supabase
        .from('profiles')
        .update({
          spider_xp: xp,
          spider_silk: silk,
          spider_owned_backs: ownedBacks,
          spider_selected_back: selectedBack,
        })
        .eq('id', user.id)
        .then(({ error }) => error && console.error('Failed to save Spider profile', error))
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [xp, silk, ownedBacks, selectedBack, user])

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

  const resolveCompletion = useCallback(
    (colIndex, completed) => {
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

        const rewards = DIFFICULTY_REWARDS[difficulty]
        setXp((x) => x + rewards.sequenceXP)
        setSilk((s) => s + rewards.sequenceSilk)

        setFoundations((prev) => {
          const next = [...prev, completed]
          if (next.length === 8) {
            setStatus('won')
            setXp((x) => x + rewards.winXP)
            setSilk((s) => s + rewards.winSilk)
          }
          return next
        })
        setClearingIds([])
        showToast(`Sequence Complete! ${completed.suit}`)
      }, CLEAR_DURATION)
    },
    [showToast, difficulty],
  )

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

  useEffect(() => {
    if (status !== 'playing' || clearingIds.length > 0) return
    if (columns.length === 0) return
    const stillHasMoves = findProductiveMoves(columns).length > 0 || canDeal
    if (!stillHasMoves && foundations.length < 8) {
      setStatus('lost')
    }
  }, [columns, canDeal, foundations, status, clearingIds])

  const buyBack = useCallback((id, price) => {
    setSilk((prevSilk) => {
      if (prevSilk < price) return prevSilk
      setOwnedBacks((prevOwned) => (prevOwned.includes(id) ? prevOwned : [...prevOwned, id]))
      return prevSilk - price
    })
  }, [])

  const equipBack = useCallback((id) => {
    setSelectedBack(id)
  }, [])

  const levelInfo = getLevelInfo(xp)

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
    xp,
    silk,
    ownedBacks,
    selectedBack,
    levelInfo,
    startNewGame,
    handleCardClick,
    dealFromStock,
    undo,
    requestHint,
    buyBack,
    equipBack,
  }
}