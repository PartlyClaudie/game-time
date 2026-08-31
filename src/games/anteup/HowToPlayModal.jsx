import { useState } from 'react'

const TABS = [
  { id: 'basics', label: 'Basics' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'blinds', label: 'Blinds & Antes' },
  { id: 'shop', label: 'Shop' },
]

export default function HowToPlayModal({ onClose }) {
  const [tab, setTab] = useState('basics')

  return (
    <div className="howto-overlay" onClick={onClose}>
      <div className="howto-inner" onClick={(e) => e.stopPropagation()}>
        <div className="howto-header">
          <h2>How to Play</h2>
          <button className="howto-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="howto-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="howto-content">
          {tab === 'basics' && (
            <>
              <h3>The Goal</h3>
              <p>
                You're dealt 8 cards. Select up to 5 of them to form the best poker hand you can, then hit{' '}
                <strong>Play Hand</strong> to score points toward the current Blind's target.
              </p>

              <h3>Hands & Discards</h3>
              <p>
                <strong>Hands</strong> are how many times you can Play this round — you need to hit the target before
                you run out. <strong>Discards</strong> let you swap selected cards for new random ones without
                scoring, if your hand isn't working out. Both are limited per round.
              </p>

              <h3>Sorting & the Deck</h3>
              <p>
                Toggle <strong>Rank</strong> or <strong>Suit</strong> above your hand to reorganize your cards. Tap{' '}
                <strong>🃏 Deck</strong> anytime to see the full 52-card deck — cards already played or discarded
                this round show dimmed out.
              </p>
            </>
          )}

          {tab === 'scoring' && (
            <>
              <h3>Chips × Mult</h3>
              <p>
                Every hand type has a base <strong>Chips</strong> value and a <strong>Mult</strong> (multiplier). The
                specific cards you play add their own chip value on top: number cards are worth their face value,
                J/Q/K are worth 10, and Aces are worth 11.
              </p>
              <p className="howto-formula">Total Score = (base chips + your cards' chips) × mult</p>

              <h3>Kickers Don't Score</h3>
              <p>
                Only cards that are actually part of the recognized hand count. Play a Pair alongside one unrelated
                card, and that extra card (a "kicker") adds nothing — it'll show up dimmed and greyed out when
                selected, while the cards actually contributing glow gold.
              </p>

              <h3>Hand Rankings</h3>
              <p className="howto-ranking">
                High Card → Pair → Two Pair → Three of a Kind → Straight → Flush → Full House → Four of a Kind →
                Straight Flush
              </p>
            </>
          )}

          {tab === 'blinds' && (
            <>
              <h3>Small, Big, Boss</h3>
              <p>
                Every Ante has 3 rounds in order: <strong>Small Blind</strong> → <strong>Big Blind</strong> →{' '}
                <strong>Boss Blind</strong>, each demanding a higher score than the last. Beat all three and you
                advance to the next Ante, where every target is even higher.
              </p>

              <h3>Boss Blind Challenges</h3>
              <p>
                Boss Blinds come with a random restriction shown at the top of the screen — a suit that can't be
                played (you can still discard those cards, just not score with them), a lower max-selection cap, or
                fewer Hands that round. Read the banner before you plan your hand.
              </p>

              <h3>Losing a Run</h3>
              <p>
                Run out of Hands before hitting a Blind's target, and your run resets all the way back to Ante 1.
                Any Chips, Power-Ups, and Card Styles you've already bought are safe forever — only your in-progress
                run is lost.
              </p>
            </>
          )}

          {tab === 'shop' && (
            <>
              <h3>Earning Chips</h3>
              <p>
                Beating any blind earns you Chips based on your score — Boss Blinds pay out the most, since they're
                the riskiest.
              </p>

              <h3>Card Styles</h3>
              <p>Purely cosmetic reskins of your deck. Buy once, equip anytime — no gameplay effect.</p>

              <h3>Power-Ups</h3>
              <p>
                Permanent gameplay boosts — extra Hands, extra Discards, score multipliers, and more. Once bought,
                they apply automatically to every future round, even after a run resets. They get significantly
                pricier the stronger they are, so the best ones take real time to afford.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}