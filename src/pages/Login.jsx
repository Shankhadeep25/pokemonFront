import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const [name, setName] = useState('');
    const [teamId, setTeamId] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Please enter your name');
        if (!teamId.trim()) return toast.error('Please enter your Team ID');

        setLoading(true);
        try {
            await loginUser({ name: name.trim(), teamId: teamId.trim().toUpperCase() });
        } catch {
            // error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-top">
                <div className="auth-pokeball-icon">⚡</div>
                <h1 className="auth-title">Pokémon Hunt</h1>
                <p className="auth-subtitle">Login to continue your adventure</p>
            </div>

            <div className="auth-bottom">
                <div className="auth-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group input-group-light">
                            <label>Your Name</label>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="input-group input-group-light">
                            <label>Team ID</label>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="e.g. TEAM-ALPHA"
                                value={teamId}
                                onChange={(e) => setTeamId(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn btn-primary btn-full"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: '8px', padding: '14px' }}
                        >
                            {loading ? '⏳ Logging in...' : '🎮 Enter Game'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        New participant? <Link to="/signup">Sign up here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
