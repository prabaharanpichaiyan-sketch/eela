import React, { useState, useContext } from 'react';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setIsLoading(true);
        const result = await login(email, password);
        setIsLoading(false);
        
        if (!result.success) {
            setError(result.error);
        }
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            padding: '20px'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px 32px', animation: 'popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ marginBottom: '16px', borderRadius: '50%', boxShadow: '0 8px 16px rgba(156, 33, 69, 0.2)', animation: 'fadeInUp 0.6s backwards', animationDelay: '0.2s' }}>
                        <img src="/eela-logo.jpeg" alt="Eela Logo" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', margin: '0 0 8px 0', textAlign: 'center', animation: 'fadeInUp 0.6s backwards', animationDelay: '0.3s' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, textAlign: 'center', animation: 'fadeInUp 0.6s backwards', animationDelay: '0.4s' }}>Sign in to Eela Sweetspot manager</p>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ animation: 'fadeInUp 0.6s backwards', animationDelay: '0.5s' }}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} disabled={isLoading}>
                        {isLoading ? <Loader2 className="spin" size={20} /> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
