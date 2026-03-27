import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingBag, 
    ClipboardList, 
    Users, 
    BookOpen, 
    Clock, 
    BarChart3, 
    LogOut,
    ChevronRight,
    ChevronLeft,
    ChefHat,
    Plane
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Stock', icon: Package },
        { id: 'products', label: 'Products', icon: ShoppingBag },
        { id: 'orders', label: 'Orders', icon: ClipboardList },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'ledger', label: 'Ledger', icon: BookOpen },
        { id: 'history', label: 'History', icon: Clock },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];

    return (
        <aside className={`app-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="sidebar-header" style={isExpanded ? { justifyContent: 'space-between' } : { justifyContent: 'center' }}>
                <div className="logo-container">
                    <div className="logo-icon">
                        <Plane size={20} />
                    </div>
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
                <button
                    className="sidebar-nav-item logout-btn"
                    onClick={onLogout}
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
