import { useState } from 'react';
import DeckDisplay from './DeckDisplay';
import { selectPokemon } from '../services/api';
import toast from 'react-hot-toast';

export default function PokemonSelection({ refreshKey }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(null); // array of names after success

    const handleSubmit = async () => {
        if (selectedIds.length !== 3) {
            toast.error('You must select exactly 3 Pokémon!');
            return;
        }
        setSubmitting(true);
        try {
            const res = await selectPokemon(selectedIds);
            const names = res.data.selectedPokemon || [];
            setConfirmed(names);
            toast.success('Battle team locked in! 🎯', { icon: '⚔️' });
        } catch {
            // handled by interceptor
        } finally {
            setSubmitting(false);
        }
    };

    if (confirmed) {
        return (
            <div className="selection-confirmed animate-pop">
                <div className="selection-confirmed-icon">⚔️</div>
                <h3 className="selection-confirmed-title">Battle Team Selected!</h3>
                <div className="selection-confirmed-list">
                    {confirmed.map((name, i) => (
                        <span key={i} className="selection-confirmed-chip">{name}</span>
                    ))}
                </div>
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { setConfirmed(null); setSelectedIds([]); }}
                    style={{ marginTop: '12px' }}
                >
                    🔄 Change Selection
                </button>
            </div>
        );
    }

    return (
        <div className="pokemon-selection">
            <div className="selection-header">
                <span className="selection-count">
                    {selectedIds.length}/3 selected
                </span>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmit}
                    disabled={selectedIds.length !== 3 || submitting}
                >
                    {submitting ? '⏳ Submitting...' : '⚔️ Lock In Team'}
                </button>
            </div>
            <DeckDisplay
                selectable
                selectedIds={selectedIds}
                onSelectionChange={(ids) => {
                    if (ids.length <= 3) setSelectedIds(ids);
                    else toast('Max 3 Pokémon!', { icon: '⚠️' });
                }}
                refreshKey={refreshKey}
            />
        </div>
    );
}
