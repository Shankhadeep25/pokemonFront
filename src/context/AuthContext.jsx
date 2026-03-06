import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, signup as apiSignup } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const savedToken = localStorage.getItem('pokeToken');
        const savedUser = localStorage.getItem('pokeUser');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const handleAuth = (data) => {
        localStorage.setItem('pokeToken', data.token);
        localStorage.setItem('pokeUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        if (data.user.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/game');
        }
    };

    const loginUser = async (credentials) => {
        const res = await apiLogin(credentials);
        handleAuth(res.data);
        toast.success(`Welcome back, ${res.data.user.name}!`);
    };

    const signupUser = async (credentials) => {
        const res = await apiSignup(credentials);
        handleAuth(res.data);
        toast.success(`Welcome, ${res.data.user.name}! Let's catch 'em all!`);
    };

    const logout = () => {
        localStorage.removeItem('pokeToken');
        localStorage.removeItem('pokeUser');
        setToken(null);
        setUser(null);
        navigate('/login');
        toast.success('Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, loginUser, signupUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
