import React from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useOrders } from '../contexts/OrdersContext';
import { useProducts } from '../contexts/ProductsContext';
import { useCustomers } from '../contexts/CustomersContext';
import { AlertTriangle, TrendingUp, Package, ShoppingBag, BarChart2, Users, DollarSign } from 'lucide-react';

// ── Ring Chart ────────────────────────────────────────────────────────────────
const RING_COLORS_PRODUCTS = ['#f97316', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];
const RING_COLORS_CUSTOMERS = ['#3b82f6', '#a855f7', '#14b8a6', '#f43f5e', '#eab308'];

const RingChart = ({ items, valueKey, labelKey, subLabelKey, colors, title, icon: Icon, emptyMsg }) => {
    if (!items || items.length === 0) {
        return (
            <div className="card" style={{ marginBottom: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '12px' }}>
                    <Icon size={20} /> {title}
                </h3>
                <p className="text-muted">{emptyMsg}</p>
            </div>
        );
    }

    const maxVal = Math.max(...items.map(i => i[valueKey]), 1);
    const cx = 90, cy = 90;
    const baseRadius = 64;
    const ringGap = 14;
    const strokeWidth = 9;

    return (
        <div className="card" style={{ marginBottom: 0, height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '20px' }}>
                <Icon size={20} /> {title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* SVG Rings */}
                <div style={{ flexShrink: 0 }}>
                    <svg width={180} height={180} viewBox="0 0 180 180">
                        {items.slice(0, 5).map((item, idx) => {
                            const r = baseRadius - idx * ringGap;
                            const circumference = 2 * Math.PI * r;
                            const pct = item[valueKey] / maxVal;
                            const dash = pct * circumference;
                            const color = colors[idx % colors.length];

                            return (
                                <g key={idx}>
                                    {/* Track */}
                                    <circle
                                        cx={cx} cy={cy} r={r}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={strokeWidth}
                                        opacity={0.12}
                                    />
                                    {/* Progress arc */}
                                    <circle
                                        cx={cx} cy={cy} r={r}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        strokeDasharray={`${dash} ${circumference}`}
                                        strokeDashoffset={0}
                                        transform={`rotate(-90 ${cx} ${cy})`}
                                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                    {/* Dot at end of arc */}
                                    {pct > 0.04 && (() => {
                                        const angle = pct * 2 * Math.PI - Math.PI / 2;
                                        const dotX = cx + r * Math.cos(angle);
                                        const dotY = cy + r * Math.sin(angle);
                                        return (
                                            <circle cx={dotX} cy={dotY} r={strokeWidth / 2 + 1} fill={color} />
                                        );
                                    })()}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.slice(0, 5).map((item, idx) => {
                        const color = colors[idx % colors.length];
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: color, flexShrink: 0
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item[labelKey]}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {item[subLabelKey]}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color, flexShrink: 0 }}>
                                    ₹{item[valueKey].toFixed(0)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { inventory } = useInventory();
    const { orders } = useOrders();
    const { products } = useProducts();
    const { customers } = useCustomers();

    const lowStockItems = inventory.filter(item => item.QuantityAvailable <= item.LowStockLimit);

    // Last 7 Days
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const last7Days = getLast7Days();
    const salesData = last7Days.map(date => {
        const dailyTotal = orders
            .filter(o => o.BillDate.startsWith(date))
            .reduce((sum, o) => sum + o.TotalAmount, 0);
        return { date, total: dailyTotal, label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }) };
    });
    const maxSales = Math.max(...salesData.map(d => d.total), 1);

    const today = new Date().toISOString().split('T')[0];
    const todaySales = orders.filter(o => o.BillDate.startsWith(today)).reduce((sum, o) => sum + o.TotalAmount, 0);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthSales = orders.filter(o => o.BillDate.startsWith(currentMonth)).reduce((sum, o) => sum + o.TotalAmount, 0);

    const totalPendingPayments = orders.reduce((sum, o) => sum + (o.BalanceAmount || 0), 0);

    // Top Customers
    const getTopCustomers = () => {
        const stats = {};
        orders.forEach(order => {
            const key = order.CustomerId || order.CustomerName || 'Walk-in';
            if (!stats[key]) stats[key] = { name: order.CustomerName || 'Walk-in', orderCount: 0, totalSpent: 0 };
            stats[key].orderCount++;
            stats[key].totalSpent += order.TotalAmount;
        });
        return Object.values(stats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5).map(c => ({
            ...c,
            label: c.name,
            subLabel: `${c.orderCount} order${c.orderCount !== 1 ? 's' : ''}`,
            value: c.totalSpent
        }));
    };

    // Top Products
    const getTopProducts = () => {
        const stats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.ProductId;
                if (!stats[key]) stats[key] = { name: item.ProductName || 'Unknown', qty: 0, revenue: 0 };
                stats[key].qty += item.Quantity;
                stats[key].revenue += item.Price * item.Quantity;
            });
        });
        return Object.values(stats).sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => ({
            ...p,
            label: p.name,
            subLabel: `${p.qty} sold`,
            value: p.revenue
        }));
    };

    // Overdue customers
    const getCustomersWithOverdue = () => {
        const oc = {};
        orders.forEach(order => {
            if (order.BalanceAmount > 0) {
                const key = order.CustomerId || order.CustomerName || 'Walk-in';
                if (!oc[key]) oc[key] = { name: order.CustomerName || 'Walk-in', balance: 0, billCount: 0 };
                oc[key].balance += order.BalanceAmount;
                oc[key].billCount++;
            }
        });
        return Object.values(oc).sort((a, b) => b.balance - a.balance).slice(0, 5);
    };

    const topCustomers = getTopCustomers();
    const topProducts = getTopProducts();
    const overdueCustomers = getCustomersWithOverdue();

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className="mb-6">
                <h1>Dashboard</h1>
                <p className="text-muted">Welcome back, Baker!</p>
            </header>

            {/* Key Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary)' }}>
                        <TrendingUp size={20} /><span style={{ fontWeight: 600 }}>Today's Sales</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{todaySales.toFixed(2)}</div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981' }}>
                        <BarChart2 size={20} /><span style={{ fontWeight: 600 }}>This Month</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{monthSales.toFixed(2)}</div>
                </div>
                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#dc2626' }}>
                        <DollarSign size={20} /><span style={{ fontWeight: 600 }}>Pending Payments</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{totalPendingPayments.toFixed(2)}</div>
                </div>
            </div>

            {/* Ring Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <RingChart
                    items={topProducts}
                    valueKey="value"
                    labelKey="label"
                    subLabelKey="subLabel"
                    colors={RING_COLORS_PRODUCTS}
                    title="Top Selling Products"
                    icon={Package}
                    emptyMsg="No sales data yet."
                />
                <RingChart
                    items={topCustomers}
                    valueKey="value"
                    labelKey="label"
                    subLabelKey="subLabel"
                    colors={RING_COLORS_CUSTOMERS}
                    title="Top Customers"
                    icon={Users}
                    emptyMsg="No customer data yet."
                />
            </div>

            {/* Sales Trend */}
            <section className="mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <BarChart2 size={20} /> Sales Trend (Last 7 Days)
                </h3>
                <div className="card" style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 8px' }}>
                    {salesData.map(d => (
                        <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{
                                width: '60%',
                                backgroundColor: 'var(--color-primary)',
                                borderRadius: '4px',
                                height: `${(d.total / maxSales) * 120}px`,
                                minHeight: d.total > 0 ? '4px' : '0',
                                marginBottom: '8px',
                                transition: 'height 0.3s ease'
                            }} />
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{d.label}</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>₹{d.total.toFixed(0)}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Overdue payments */}
            <section className="mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertTriangle size={20} color={overdueCustomers.length > 0 ? '#dc2626' : '#16a34a'} />
                    Customers with Pending Payments
                </h3>
                <div className="card">
                    {overdueCustomers.length === 0 ? (
                        <div style={{ color: '#16a34a' }}>All payments are up to date!</div>
                    ) : (
                        overdueCustomers.map((customer, idx) => (
                            <div key={idx} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px', borderBottom: idx < overdueCustomers.length - 1 ? '1px solid #f3f4f6' : 'none',
                                borderLeft: '3px solid #dc2626'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {customer.billCount} pending bill{customer.billCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>₹{customer.balance.toFixed(2)}</div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Low Stock */}
            <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} color={lowStockItems.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'} />
                    Low Stock Alerts
                </h3>
                {lowStockItems.length > 0 ? (
                    <div className="stock-alerts">
                        {lowStockItems.map(item => (
                            <div key={item.InventoryId} className="card" style={{ borderLeft: '4px solid var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.IngredientName}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        Remaining: {item.QuantityAvailable} {item.unit}
                                    </div>
                                </div>
                                <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.8rem' }}>LOW</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ borderLeft: '4px solid var(--color-success)', padding: '16px' }}>
                        All Items are well stocked!
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
