import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
    const [name, setName] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Please enter your name');
        if (!secretKey.trim()) return toast.error('Please enter the secret key');

        setLoading(true);
        try {
            await loginUser({ name: name.trim(), adminSecret: secretKey.trim() });
        } catch {
            // error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-icon">🛡️</div>
                <h1 className="admin-login-title">Admin Access</h1>
                <p className="admin-login-subtitle">Authorized personnel only</p>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="input-group">
                        <label>Admin Name</label>
                        <input
                            className="input-field input-field-dark"
                            type="text"
                            placeholder="Enter admin name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Secret Key</label>
                        <input
                            className="input-field input-field-dark"
                            type="password"
                            placeholder="Enter secret key"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-full"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: '8px', padding: '14px' }}
                    >
                        {loading ? '⏳ Authenticating...' : '🔑 Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
