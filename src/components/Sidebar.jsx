import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingBag, 
    ClipboardList, 
    Users, 
    Clock, 
    BarChart3, 
    LogOut,
    ChevronRight,
    ChevronLeft,
    Shield
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { currentUser, logout } = React.useContext(AuthContext);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Stock', icon: Package },
        { id: 'products', label: 'Products', icon: ShoppingBag },
        { id: 'orders', label: 'Orders', icon: ClipboardList },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'history', label: 'History', icon: Clock },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];

    if (currentUser?.role === 'admin') {
        navItems.push({ id: 'users', label: 'User Mgmt', icon: Shield });
    }

    return (
        <aside className={`app-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="sidebar-header" style={isExpanded ? { justifyContent: 'space-between' } : { justifyContent: 'center' }}>
                <div className="logo-container">
                    <img src="/eela-logo.jpeg" alt="Eela Logo" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                    {isExpanded && <span className="logo-text">eela</span>}
                </div>
                {isExpanded && (
                    <button className="sidebar-toggle-btn" onClick={() => setIsExpanded(false)}>
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {!isExpanded && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '8px' }}>
                        <button className="sidebar-toggle-btn" onClick={() => setIsExpanded(true)}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                            title={!isExpanded ? item.label : ''}
                        >
                            <Icon size={20} />
                            {isExpanded && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div style={{ padding: '0 16px 16px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: isExpanded ? 'left' : 'center', borderBottom: '1px solid var(--color-border)', marginBottom: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isExpanded ? (<b>{currentUser?.username}</b>) : (<b>{currentUser?.username?.charAt(0)}</b>)}
                </div>
                <button
                    className="sidebar-nav-item logout-btn"
                    onClick={logout}
                    title={!isExpanded ? 'Logout' : ''}
                >
                    <LogOut size={20} />
                    {isExpanded && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
