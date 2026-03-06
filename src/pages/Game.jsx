import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getTeamInfo, getRiddle, catchPokemon, changeRiddle } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import RiddleTimer from '../components/RiddleTimer';
import DeckDisplay from '../components/DeckDisplay';
import PokemonSelection from '../components/PokemonSelection';
import GymMenu from '../components/GymMenu';

export default function Game() {
    const { user, logout } = useAuth();
    const socket = useSocket();

    const [team, setTeam] = useState(null);
    const [riddle, setRiddle] = useState(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [riddleExpiresAt, setRiddleExpiresAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riddleLoading, setRiddleLoading] = useState(false);
    const [catchLoading, setCatchLoading] = useState(false);
    const [gameStarted, setGameStarted] = useState(true);
    const [gameEnded, setGameEnded] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [riddleExpired, setRiddleExpired] = useState(false);
    const [deckRefreshKey, setDeckRefreshKey] = useState(0);
    const scannerRef = useRef(null);

    // Fetch team info
    const fetchTeam = useCallback(async () => {
        try {
            const res = await getTeamInfo();
            const data = res.data.data;
            setTeam(data);
            setCurrentRound(data.currentRound || 1);
            setGameStarted(data.gameStarted !== false);
            setGameEnded(data.gameEnded === true);
            if (data.activeRiddle) {
                setRiddle(data.activeRiddle);
            }
            if (data.riddleExpiresAt) {
                setRiddleExpiresAt(data.riddleExpiresAt);
            }
            setDeckRefreshKey((k) => k + 1);
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Session expired — please login again');
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, []);

    // Socket events
    useEffect(() => {
        if (!socket) return;

        socket.on('gameStarted', (data) => {
            setGameStarted(true);
            setGameEnded(false);
            toast.success(data.message || 'Game has begun! 🎮', { icon: '🚀' });
        });

        socket.on('gameEnded', (data) => {
            setGameEnded(true);
            toast(data.message || 'Game over!', { icon: '🏁' });
        });

        socket.on('pokemonCaught', (data) => {
            if (data.teamId === user?.teamId) {
                fetchTeam();
            }
            toast(`${data.pokemonName} caught by ${data.teamId}!`, { icon: '🎯' });
        });

        socket.on('pokemonAlreadyCaught', (data) => {
            toast.error(`Too late! ${data.pokemonName} was already caught!`, { icon: '😱' });
        });

        socket.on('riddleInvalidated', (data) => {
            setRiddle(null);
            setRiddleExpiresAt(null);
            toast(data.message || 'Your riddle\'s Pokémon was caught! Request a new one.', { icon: '⚠️' });
            fetchTeam();
        });

        socket.on('pokemonReleased', (data) => {
            toast(`${data.pokemonName} released!`, { icon: '🕊️' });
            fetchTeam();
        });

        socket.on('teamDeleted', (data) => {
            if (data.teamId === user?.teamId) {
                toast.error('Your team has been deleted!');
                logout();
            }
        });

        socket.on('roundChanged', ({ currentRound: newRound, message }) => {
            setCurrentRound(newRound);
            toast.success(message || `Round ${newRound} has started!`, { icon: '🔔' });
            fetchTeam();
        });

        return () => {
            socket.off('gameStarted');
            socket.off('gameEnded');
            socket.off('pokemonCaught');
            socket.off('pokemonAlreadyCaught');
            socket.off('riddleInvalidated');
            socket.off('pokemonReleased');
            socket.off('teamDeleted');
            socket.off('roundChanged');
        };
    }, [socket, user, fetchTeam, logout]);

    // Request riddle
    const handleGetRiddle = async () => {
        setRiddleLoading(true);
        try {
            const res = await getRiddle();
            setRiddle(res.data.data);
            setRiddleExpiresAt(res.data.data?.riddleExpiresAt || res.data.riddleExpiresAt || null);
            setRiddleExpired(false);
            if (!res.data.alreadyActive) {
                toast.success('New riddle received!', { icon: '🧩' });
            }
            fetchTeam();
        } catch {
            // handled by interceptor
        } finally {
            setRiddleLoading(false);
        }
    };

    // Change riddle (when timer expires)
    const handleChangeRiddle = async () => {
        setRiddleLoading(true);
        try {
            const res = await changeRiddle();
            setRiddle(res.data.data);
            setRiddleExpiresAt(res.data.data?.riddleExpiresAt || res.data.riddleExpiresAt || null);
            setRiddleExpired(false);
            toast.success('New riddle assigned!', { icon: '🧩' });
            fetchTeam();
        } catch {
            // handled by interceptor
        } finally {
            setRiddleLoading(false);
        }
    };

    // QR Scanner
    const startScanner = async () => {
        setShowScanner(true);
        try {
            await new Promise(r => setTimeout(r, 300));
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                async (decodedText) => {
                    await scanner.stop().catch(() => { });
                    scannerRef.current = null;
                    setShowScanner(false);
                    handleCatch(decodedText);
                },
                () => { }
            );
        } catch {
            toast.error('Camera access denied or unavailable');
            setShowScanner(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.stop().catch(() => { });
            scannerRef.current = null;
        }
        setShowScanner(false);
    };

    // Catch Pokémon
    const handleCatch = async (qrCodeValue) => {
        setCatchLoading(true);
        try {
            const res = await catchPokemon(qrCodeValue);
            toast.success(res.data.message || 'Pokémon caught!', { icon: '🎉' });
            setRiddle(null);
            setRiddleExpiresAt(null);
            fetchTeam();
        } catch {
            // handled by interceptor
        } finally {
            setCatchLoading(false);
        }
    };

    if (loading) return <Loader text="Loading your team..." />;

    const deckCount = team?.caughtPokemons?.length || 0;
    const maxDeck = team?.maxDeck || 4;
    const deckFull = team?.deckFull || false;
    const deckPercent = Math.min((deckCount / maxDeck) * 100, 100);

    const showRiddle = currentRound === 1;
    const showQR = currentRound === 1 || currentRound === 2;
    const showGymMenu = currentRound === 2;
    const showPokemonSelection = currentRound === 2 || currentRound === 3;

    const roundLabels = {
        1: '🏃 Round 1 — Catch',
        2: '⚔️ Round 2 — Gyms',
        3: '🏆 Round 3 — Battle',
    };

    return (
        <div className="pokeball-layout">
            {/* Game State Overlays */}
            {gameEnded && (
                <div className="game-overlay">
                    <div className="emoji-big">🏆</div>
                    <h2>Game Over!</h2>
                    <p>The hunt has ended. Check with your admin for the final leaderboard!</p>
                </div>
            )}

            {/* ═══ RED TOP SECTION ═══ */}
            <div className="pokeball-top-section">
                <div className="team-header">
                    <div>
                        <div className="team-name">⚡ {team?.teamId || 'Team'}</div>
                    </div>
                    <button className="logout-btn" onClick={logout}>Logout</button>
                </div>

                {/* Round Badge */}
                <div className="round-badge-row">
                    <span className="round-badge">{roundLabels[currentRound] || `Round ${currentRound}`}</span>
                </div>

                {/* Members */}
                <div className="member-list">
                    {team?.members?.map((m) => (
                        <span key={m._id} className="member-chip">👤 {m.name}</span>
                    ))}
                </div>

                {/* Stats */}
                <div className="team-stats">
                    <span className="stat-badge">🎒 {deckCount}/{maxDeck}</span>
                    <span className="stat-badge">{deckFull ? '🔴 Full' : '🟢 Open'}</span>
                </div>
            </div>

            {/* ═══ BAND ═══ */}
            <div className="pokeball-band"></div>

            {/* ═══ WHITE BOTTOM SECTION ═══ */}
            <div className="pokeball-bottom-section">

                {/* Deck Progress */}
                <div className="deck-counter">
                    <span className="deck-label">Deck</span>
                    <div className="deck-bar">
                        <div
                            className={`deck-bar-fill ${deckFull ? 'full' : ''}`}
                            style={{ width: `${deckPercent}%` }}
                        />
                    </div>
                    <span className="deck-label">{deckCount}/{maxDeck}</span>
                </div>

                {/* ═══ ROUND 1: Riddle Section ═══ */}
                {showRiddle && (
                    <div style={{ marginBottom: '16px' }} className="animate-fade">
                        <div className="section-title section-title-light">🧩 Current Riddle</div>
                        {riddle ? (
                            <div className="riddle-box animate-pop">
                                <div className="riddle-question">"{riddle.question}"</div>
                                <div className="riddle-hint">Solve the riddle, find the QR code!</div>
                                {riddleExpiresAt && (
                                    <RiddleTimer
                                        riddleExpiresAt={riddleExpiresAt}
                                        onExpired={() => setRiddleExpired(true)}
                                    />
                                )}
                                {riddleExpired && (
                                    <button
                                        className="btn btn-yellow btn-sm"
                                        onClick={handleChangeRiddle}
                                        disabled={riddleLoading}
                                        style={{ marginTop: '10px', width: '100%' }}
                                    >
                                        {riddleLoading ? '⏳ Loading...' : '🔄 Change Riddle'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="card-light" style={{ textAlign: 'center', padding: '20px' }}>
                                <p style={{ color: '#64748B', marginBottom: '12px', fontSize: '0.9rem' }}>
                                    No active riddle. Request one to find your next Pokémon!
                                </p>
                                <button
                                    className="btn btn-yellow"
                                    onClick={handleGetRiddle}
                                    disabled={riddleLoading}
                                >
                                    {riddleLoading ? '⏳ Loading...' : '🧩 Get Riddle'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ QR Scanner (Rounds 1 & 2) ═══ */}
                {showQR && (
                    <div className="qr-section animate-fade" style={{ marginBottom: '16px' }}>
                        <div className="section-title section-title-light">
                            📷 QR Scanner {currentRound === 2 && '(Gym Leader Pokémon)'}
                        </div>
                        {!showScanner ? (
                            <button
                                className="btn btn-blue btn-full"
                                onClick={startScanner}
                                disabled={catchLoading || (currentRound === 1 && !riddle)}
                                style={{ padding: '14px' }}
                            >
                                {catchLoading ? '⏳ Catching...' : '📸 Open Scanner'}
                            </button>
                        ) : (
                            <div className="animate-pop">
                                <div className="qr-scanner-container">
                                    <div id="qr-reader" style={{ width: '100%' }}></div>
                                </div>
                                <button
                                    className="btn btn-danger btn-full btn-sm"
                                    onClick={stopScanner}
                                    style={{ marginTop: '8px' }}
                                >
                                    ✕ Close Scanner
                                </button>
                            </div>
                        )}
                        {currentRound === 1 && !riddle && (
                            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '6px', textAlign: 'center' }}>
                                Get a riddle first to unlock the scanner
                            </p>
                        )}
                    </div>
                )}

                {/* ═══ Gym Menu (Round 2 only) ═══ */}
                {showGymMenu && (
                    <div style={{ marginBottom: '16px' }} className="animate-fade">
                        <div className="section-title section-title-light">🏟️ Gym Battles</div>
                        <GymMenu />
                    </div>
                )}

                {/* ═══ Pokémon Selection (Rounds 2 & 3) ═══ */}
                {showPokemonSelection && (
                    <div style={{ marginBottom: '16px' }} className="animate-fade">
                        <div className="section-title section-title-light">⚔️ Select Battle Team</div>
                        <PokemonSelection refreshKey={deckRefreshKey} />
                    </div>
                )}

                {/* ═══ Pokémon Deck (always visible) ═══ */}
                <div>
                    <div className="section-title section-title-light">🎒 Your Pokémon Deck</div>
                    <DeckDisplay refreshKey={deckRefreshKey} />
                </div>

            </div>
        </div>
    );
}
