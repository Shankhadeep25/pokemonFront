import { useState, useEffect } from 'react';
import { getDeck } from '../services/api';
import toast from 'react-hot-toast';

export default function DeckDisplay({ selectable = false, selectedIds = [], onSelectionChange, refreshKey }) {
    const [deck, setDeck] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeck = async () => {
            try {
                const res = await getDeck();
                setDeck(res.data.deck || []);
            } catch {
                // handled by interceptor
            } finally {
                setLoading(false);
            }
        };
        fetchDeck();
    }, [refreshKey]);

    const toggleSelect = (id) => {
        if (!selectable || !onSelectionChange) return;
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter((s) => s !== id)
            : [...selectedIds, id];
        onSelectionChange(newSelection);
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-emoji">⏳</div>
                <p>Loading your deck...</p>
            </div>
        );
    }

    if (deck.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-emoji">🥚</div>
                <p>No Pokémon caught yet. Solve a riddle and scan its QR code!</p>
            </div>
        );
    }

    return (
        <div className="deck-grid">
            {deck.map((p) => {
                const isSelected = selectedIds.includes(p._id);
                return (
                    <div
                        key={p._id}
                        className={`deck-card animate-pop ${selectable ? 'deck-card-selectable' : ''} ${isSelected ? 'deck-card-selected' : ''}`}
                        onClick={() => toggleSelect(p._id)}
                    >
                        <div className="deck-card-img-wrap">
                            <img
                                src={p.image}
                                alt={p.name}
                                className="deck-card-img"
                                loading="lazy"
                            />
                            {selectable && (
                                <div className={`deck-card-check ${isSelected ? 'checked' : ''}`}>
                                    {isSelected ? '✓' : ''}
                                </div>
                            )}
                        </div>
                        <div className="deck-card-name">{p.name}</div>
                    </div>
                );
            })}
        </div>
    );
}
