import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
    const [name, setName] = useState('');
    const [teamId, setTeamId] = useState('');
    const [loading, setLoading] = useState(false);
    const { signupUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Please enter your name');
        if (!teamId.trim()) return toast.error('Please enter your Team ID');

        setLoading(true);
        try {
            await signupUser({ name: name.trim(), teamId: teamId.trim().toUpperCase() });
        } catch {
            // error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-top">
                <div className="auth-pokeball-icon">🌟</div>
                <h1 className="auth-title">Join the Hunt!</h1>
                <p className="auth-subtitle">Sign up to start catching Pokémon</p>
            </div>

            <div className="auth-bottom">
                <div className="auth-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className="input-group input-group-light">
                            <label>Your Name</label>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="What should we call you?"
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
                            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>
                                Ask your admin for the Team ID
                            </p>
                        </div>

                        <button
                            className="btn btn-primary btn-full"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: '8px', padding: '14px' }}
                        >
                            {loading ? '⏳ Signing up...' : '⚡ Join the Hunt!'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already signed up? <Link to="/login">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
