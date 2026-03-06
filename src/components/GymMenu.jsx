import { useState, useEffect } from 'react';
import { getGyms } from '../services/api';

const GYM_ICONS = {
    dragon: '🐉',
    fairy: '🧚',
    'rock/steel/ground': '🪨',
    fire: '🔥',
    water: '💧',
    grass: '🌿',
};

export default function GymMenu() {
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedGym, setExpandedGym] = useState(null);

    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const res = await getGyms();
                setGyms(res.data.gyms || res.data.data || []);
            } catch {
                // handled by interceptor
            } finally {
                setLoading(false);
            }
        };
        fetchGyms();
    }, []);

    const toggleGym = (idx) => {
        setExpandedGym(expandedGym === idx ? null : idx);
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-emoji">⏳</div>
                <p>Loading gyms...</p>
            </div>
        );
    }

    if (gyms.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-emoji">🏟️</div>
                <p>No gyms available yet</p>
            </div>
        );
    }

    return (
        <div className="gym-menu">
            {gyms.map((gym, idx) => {
                const icon = GYM_ICONS[gym.type?.toLowerCase()] || '⚡';
                const isOpen = expandedGym === idx;
                return (
                    <div key={idx} className={`gym-accordion ${isOpen ? 'gym-accordion-open' : ''}`}>
                        <button
                            className="gym-accordion-header"
                            onClick={() => toggleGym(idx)}
                        >
                            <span className="gym-accordion-icon">{icon}</span>
                            <div className="gym-accordion-info">
                                <span className="gym-accordion-name">{gym.name || gym.type}</span>
                                <span className="gym-accordion-type">{gym.type}</span>
                            </div>
                            <span className={`gym-accordion-arrow ${isOpen ? 'open' : ''}`}>▾</span>
                        </button>
                        {isOpen && (
                            <div className="gym-accordion-body animate-slide">
                                {(gym.leaders || []).map((leader, lIdx) => (
                                    <div key={lIdx} className="gym-leader">
                                        <div className="gym-leader-name">👤 {leader.name}</div>
                                        <div className="gym-leader-pokemon-grid">
                                            {(leader.pokemons || leader.pokemon || []).map((poke, pIdx) => (
                                                <div
                                                    key={pIdx}
                                                    className={`gym-pokemon-chip ${poke.caught ? 'gym-pokemon-caught' : ''}`}
                                                >
                                                    {poke.caught ? '✅' : '⚪'} {poke.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
