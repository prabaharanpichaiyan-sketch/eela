import React, { useState, useEffect } from 'react';
import { Shield, Plus, Lock, Trash2, X, Check, Save } from 'lucide-react';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { Search } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPasswordId, setEditingPasswordId] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'staff'
    });

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to add user');
            
            setNewUser({ username: '', email: '', password: '', role: 'staff' });
            setShowAddModal(false);
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to disable this user?')) return;
        try {
            const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete user');
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePasswordChange = async (id) => {
        if (!newPassword) return alert("Password cannot be empty");
        
        try {
            const response = await fetch(`/api/users/${id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });
            if (!response.ok) throw new Error('Failed to update password');
            
            setEditingPasswordId(null);
            setNewPassword('');
            alert('Password updated successfully');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            const response = await fetch(`/api/users/${id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (!response.ok) throw new Error('Failed to update role');
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    }

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading users...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div className="animate-fade-in">
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={28} style={{ color: 'var(--color-primary)' }} />
                        User Management
                    </h1>
                    <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>Manage roles, passwords, and access.</p>
                </div>
                <button className="primary" onClick={() => setShowAddModal(true)} style={{ width: 'auto' }}>
                    <Plus size={20} /> Add User
                </button>
            </header>

            <div className="form-group" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                    <input
                        placeholder="Search users by name or email..."
                        style={{ paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredUsers.map(user => (
                    <div key={user.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {user.username}
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                                        backgroundColor: user.role === 'admin' ? '#fee2e2' : '#e0e7ff',
                                        color: user.role === 'admin' ? '#b91c1c' : '#3730a3'
                                    }}>
                                        {user.role}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '180px' }}>
                                    <SearchableSelect 
                                        value={user.role} 
                                        onChange={(val) => handleRoleChange(user.id, val)}
                                        options={[
                                            { value: 'staff', label: 'Staff Role' },
                                            { value: 'admin', label: 'Admin Role' }
                                        ]}
                                    />
                                </div>

                                <button 
                                    className="secondary" 
                                    title="Disable User"
                                    onClick={() => handleDelete(user.id)}
                                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px' }}
                                >
                                    <Trash2 size={18} style={{ color: 'var(--color-danger)' }} />
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                                <Lock size={16} /> 
                                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Password Management</span>
                            </div>

                            {editingPasswordId === user.id ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: '200px' }}>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-primary)', outline: 'none', flex: 1, maxWidth: '250px' }}
                                        autoFocus
                                    />
                                    <button className="primary" style={{ width: 'auto', padding: '8px 16px' }} title="Save Password" onClick={() => handlePasswordChange(user.id)}>
                                        <Check size={18} /> Save
                                    </button>
                                    <button className="secondary" style={{ padding: '8px 12px' }} title="Cancel" onClick={() => { setEditingPasswordId(null); setNewPassword(''); }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button className="secondary" onClick={() => setEditingPasswordId(user.id)} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                    Reset Password
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                
                {filteredUsers.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        No users found matching "{searchTerm}".
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            <Modal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                title="Add New User"
                closeOnOverlayClick={false}
            >
                <form onSubmit={handleAddUser}>
                    <div className="form-group">
                        <label>Name</label>
                        <input 
                            type="text" 
                            required 
                            value={newUser.username}
                            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Initial Password</label>
                            <input 
                                type="password" 
                                required 
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <SearchableSelect 
                                label="Role"
                                value={newUser.role}
                                onChange={(val) => setNewUser({...newUser, role: val})}
                                options={[
                                    { value: 'staff', label: 'Staff' },
                                    { value: 'admin', label: 'Admin' }
                                ]}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                        <button type="submit" className="primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={18} /> Create User</button>
                    </div>
                </form>
            </Modal>
            
            {/* Some minimal CSS injected if not already globally available for loader */}
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Users;
