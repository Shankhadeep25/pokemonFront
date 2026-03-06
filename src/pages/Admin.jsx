import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
    createTeam, getTeams, deleteTeam,
    startGame, endGame,
    getLeaderboard, nextRound, resetRound, getGameState,
} from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

export default function Admin() {
    const { logout } = useAuth();
    const socket = useSocket();

    const [teams, setTeams] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [newTeamId, setNewTeamId] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [liveFeed, setLiveFeed] = useState([]);
    const [gameState, setGameState] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [teamsRes, lbRes, gsRes] = await Promise.all([
                getTeams(),
                getLeaderboard(),
                getGameState().catch(() => null),
            ]);
            setTeams(teamsRes.data.data || []);
            setLeaderboard(lbRes.data.data || []);
            if (gsRes?.data) {
                setGameState(gsRes.data.data || gsRes.data);
            }
        } catch {
            // handled by interceptor
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Socket events
    useEffect(() => {
        if (!socket) return;

        socket.on('gameStarted', (data) => {
            toast.success(data.message || 'Game started!', { icon: '🚀' });
            addFeedItem('🚀 Game has started!');
            fetchData();
        });

        socket.on('gameEnded', (data) => {
            toast(data.message || 'Game ended!', { icon: '🏁' });
            addFeedItem('🏁 Game has ended!');
            fetchData();
        });

        socket.on('pokemonCaught', (data) => {
            addFeedItem(`🎯 ${data.teamId} caught ${data.pokemonName}!`);
            fetchData();
        });

        socket.on('teamDeleted', (data) => {
            addFeedItem(`🗑️ Team ${data.teamId} deleted`);
            fetchData();
        });

        socket.on('roundChanged', ({ currentRound, message }) => {
            setGameState((prev) => prev ? { ...prev, currentRound } : { currentRound });
            addFeedItem(`🔔 ${message || `Advanced to Round ${currentRound}`}`);
            toast.success(message || `Advanced to Round ${currentRound}!`, { icon: '🔔' });
            fetchData();
        });

        return () => {
            socket.off('gameStarted');
            socket.off('gameEnded');
            socket.off('pokemonCaught');
            socket.off('teamDeleted');
            socket.off('roundChanged');
        };
    }, [socket, fetchData]);

    const addFeedItem = (text) => {
        const time = new Date().toLocaleTimeString();
        setLiveFeed((prev) => [{ text, time, id: Date.now() }, ...prev].slice(0, 50));
    };

    // Actions
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamId.trim()) return toast.error('Enter a Team ID');
        setActionLoading('create');
        try {
            await createTeam(newTeamId.trim().toUpperCase());
            toast.success('Team created!', { icon: '✅' });
            setNewTeamId('');
            fetchData();
        } catch { } finally { setActionLoading(''); }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!confirm(`Delete team ${teamId}? This cannot be undone!`)) return;
        setActionLoading(`del-${teamId}`);
        try {
            await deleteTeam(teamId);
            toast.success(`Team ${teamId} deleted`);
            fetchData();
        } catch { } finally { setActionLoading(''); }
    };

    const handleStartGame = async () => {
        setActionLoading('start');
        try {
            await startGame();
            toast.success('Game started!', { icon: '🎮' });
            fetchData();
        } catch { } finally { setActionLoading(''); }
    };

    const handleEndGame = async () => {
        if (!confirm('End the game? All participants will be notified.')) return;
        setActionLoading('end');
        try {
            await endGame();
            toast.success('Game ended!', { icon: '🏁' });
            fetchData();
        } catch { } finally { setActionLoading(''); }
    };

    const handleNextRound = async () => {
        const cur = gameState?.currentRound || 1;
        if (cur >= 3) return;
        if (!confirm(`Advance from Round ${cur} to Round ${cur + 1}? This will update the game for all participants.`)) return;
        setActionLoading('next-round');
        try {
            await nextRound();
            toast.success(`Advanced to Round ${cur + 1}!`, { icon: '⏭️' });
            fetchData();
        } catch { } finally { setActionLoading(''); }
    };

    const handleResetRound = async () => {
        if (!confirm('Reset to Round 1? This will reset all team selections and progress.')) return;
        setActionLoading('reset-round');
        try {
            await resetRound();
            toast.success('Reset to Round 1!', { icon: '🔄' });
            fetchData();
        } catch { } finally { setActionLoading(''); }
    };

    if (loading) return <Loader text="Loading admin panel..." />;

    const curRound = gameState?.currentRound || 1;

    return (
        <div className="admin-layout">
            {/* Header */}
            <div className="admin-header">
                <h1>🛡️ Admin Dashboard</h1>
                <button className="logout-btn" onClick={logout}>Logout</button>
            </div>

            <div className="admin-content">
                <div className="admin-grid">
                    {/* ═══ GAME CONTROLS ═══ */}
                    <div className="card-dark">
                        <div className="section-title section-title-dark">🎮 Game Controls</div>
                        <div className="game-controls">
                            <button
                                className="btn btn-green btn-sm"
                                onClick={handleStartGame}
                                disabled={actionLoading === 'start'}
                            >
                                {actionLoading === 'start' ? '⏳' : '▶️'} Start Game
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={handleEndGame}
                                disabled={actionLoading === 'end'}
                            >
                                {actionLoading === 'end' ? '⏳' : '⏹️'} End Game
                            </button>
                        </div>

                        {/* Round Controls */}
                        <div className="round-controls">
                            <div className="round-display">
                                <span className="round-display-label">Current Round</span>
                                <span className="round-display-value">{curRound} <span className="round-display-of">of 3</span></span>
                            </div>
                            <div className="round-buttons">
                                <button
                                    className="btn btn-blue btn-sm"
                                    onClick={handleNextRound}
                                    disabled={curRound >= 3 || actionLoading === 'next-round'}
                                >
                                    {actionLoading === 'next-round' ? '⏳' : '⏭️'} Next Round
                                </button>
                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={handleResetRound}
                                    disabled={actionLoading === 'reset-round'}
                                >
                                    {actionLoading === 'reset-round' ? '⏳' : '🔄'} Reset to Round 1
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ═══ GAME STATE PANEL ═══ */}
                    <div className="card-dark">
                        <div className="section-title section-title-dark">📊 Game State</div>
                        <div className="game-state-grid">
                            <div className="game-state-item">
                                <span className="game-state-value">{curRound}</span>
                                <span className="game-state-label">Round</span>
                            </div>
                            <div className="game-state-item">
                                <span className="game-state-value">{teams.length}</span>
                                <span className="game-state-label">Teams</span>
                            </div>
                            <div className="game-state-item">
                                <span className="game-state-value">{gameState?.stats?.totalCaught || 0}</span>
                                <span className="game-state-label">Caught</span>
                            </div>
                            <div className="game-state-item">
                                <span className="game-state-value game-state-status">
                                    {gameState?.gameStarted ? (gameState?.gameEnded ? '🏁 Ended' : '🟢 Live') : '⏸️ Waiting'}
                                </span>
                                <span className="game-state-label">Status</span>
                            </div>
                        </div>
                    </div>

                    {/* ═══ CREATE TEAM ═══ */}
                    <div className="card-dark">
                        <div className="section-title section-title-dark">➕ Create Team</div>
                        <form onSubmit={handleCreateTeam}>
                            <div className="input-group">
                                <input
                                    className="input-field input-field-dark"
                                    type="text"
                                    placeholder="e.g. TEAM-ALPHA"
                                    value={newTeamId}
                                    onChange={(e) => setNewTeamId(e.target.value)}
                                />
                            </div>
                            <button
                                className="btn btn-primary btn-full btn-sm"
                                type="submit"
                                disabled={actionLoading === 'create'}
                            >
                                {actionLoading === 'create' ? '⏳ Creating...' : '⚡ Create Team'}
                            </button>
                        </form>
                    </div>

                    {/* ═══ LIVE FEED ═══ */}
                    <div className="card-dark">
                        <div className="section-title section-title-dark">📡 Live Feed</div>
                        {liveFeed.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-emoji">📡</div>
                                <p>Events will appear here in real-time</p>
                            </div>
                        ) : (
                            <div className="live-feed">
                                {liveFeed.map((item) => (
                                    <div key={item.id} className="feed-item animate-slide">
                                        <span style={{ marginRight: '8px', fontSize: '0.75rem', opacity: 0.5 }}>{item.time}</span>
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ LEADERBOARD ═══ */}
                <div className="card-dark" style={{ marginTop: '20px' }}>
                    <div className="section-title section-title-dark">🏆 Leaderboard</div>
                    {leaderboard.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-emoji">🏆</div>
                            <p>No teams on the leaderboard yet</p>
                        </div>
                    ) : (
                        <ul className="leaderboard-list">
                            {leaderboard.map((entry) => (
                                <li key={entry.teamId} className="leaderboard-item">
                                    <span className={`leaderboard-rank ${entry.rank <= 3 ? `rank-${entry.rank}` : 'rank-other'}`}>
                                        {entry.rank}
                                    </span>
                                    <div className="leaderboard-info">
                                        <div className="leaderboard-team">{entry.teamId}</div>
                                        <div className="leaderboard-pokemons">
                                            {entry.pokemons?.join(', ') || 'No Pokémon caught'}
                                        </div>
                                    </div>
                                    <span className="leaderboard-count">{entry.caughtCount}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ═══ TEAMS LIST ═══ */}
                <div className="card-dark" style={{ marginTop: '20px' }}>
                    <div className="section-title section-title-dark">
                        👥 Teams ({teams.length})
                    </div>
                    {teams.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-emoji">👥</div>
                            <p>No teams created yet</p>
                        </div>
                    ) : (
                        teams.map((t) => (
                            <div key={t.teamId} className="team-list-item">
                                <div>
                                    <div className="team-list-id">{t.teamId}</div>
                                    <div className="team-list-meta">
                                        {t.members?.length || 0} members · {t.caughtPokemons?.length || 0} Pokémon
                                    </div>
                                    {t.members?.length > 0 && (
                                        <div className="team-list-meta">
                                            {t.members.map((m) => m.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="btn btn-danger btn-sm btn-icon"
                                    onClick={() => handleDeleteTeam(t.teamId)}
                                    disabled={actionLoading === `del-${t.teamId}`}
                                    title="Delete team"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
