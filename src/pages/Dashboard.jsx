import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useOrders } from '../contexts/OrdersContext';
import { useProducts } from '../contexts/ProductsContext';
import { useCustomers } from '../contexts/CustomersContext';
import Loader from '../components/Loader';
import DateRangePicker from '../components/DateRangePicker';
import { AlertTriangle, TrendingUp, Package, ShoppingBag, BarChart2, Users, DollarSign, Calendar, ChevronRight, X } from 'lucide-react';

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
                                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} opacity={0.12} />
                                    <circle
                                        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                                        strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
                                        strokeDashoffset={0} transform={`rotate(-90 ${cx} ${cy})`}
                                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                    {pct > 0.04 && (() => {
                                        const angle = pct * 2 * Math.PI - Math.PI / 2;
                                        const dotX = cx + r * Math.cos(angle);
                                        const dotY = cy + r * Math.sin(angle);
                                        return <circle cx={dotX} cy={dotY} r={strokeWidth / 2 + 1} fill={color} />;
                                    })()}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.slice(0, 5).map((item, idx) => {
                        const color = colors[idx % colors.length];
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item[labelKey]}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item[subLabelKey]}</div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color, flexShrink: 0 }}>₹{item[valueKey].toFixed(0)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ── Helper: Get Date Range ─────────────────────────────────────────────────────
const getDateRange = (type, customStart, customEnd) => {
    let start = new Date();
    let end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (type === 'today') {
        // Default
    } else if (type === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
    } else if (type === 'month') {
        start.setDate(1);
    } else if (type === 'custom') {
        if (customStart) start = new Date(customStart);
        if (customEnd) end = new Date(customEnd);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return 'Select date';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { inventory, loading: invLoading } = useInventory();
    const { orders, loading: ordLoading } = useOrders();
    const { products, loading: prodLoading } = useProducts();
    const { customers, loading: custLoading } = useCustomers();

    const [filterType, setFilterType] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    
    const pickerRef = useRef(null);

    const { rangeStart, rangeEnd } = useMemo(() => {
        const { start, end } = getDateRange(filterType, customStart, customEnd);
        return { rangeStart: start, rangeEnd: end };
    }, [filterType, customStart, customEnd]);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter(o => {
            const date = new Date(o.BillDate);
            return date >= rangeStart && date <= rangeEnd;
        });
    }, [orders, rangeStart, rangeEnd]);

    const trendData = useMemo(() => {
        if (!orders || !rangeStart || !rangeEnd) return [];
        const days = [];
        const diffDays = Math.ceil(Math.abs(rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));
        const numBars = Math.min(diffDays + 1, 31); 
        for (let i = 0; i < numBars; i++) {
            const d = new Date(rangeStart);
            d.setDate(d.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days.map(date => ({
            date,
            total: orders.filter(o => o.BillDate.startsWith(date)).reduce((sum, o) => sum + o.TotalAmount, 0),
            label: new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
        }));
    }, [orders, rangeStart, rangeEnd]);

    const maxSalesTrend = useMemo(() => Math.max(...trendData.map(d => d.total), 1), [trendData]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (invLoading || ordLoading || prodLoading || custLoading) return <Loader text="Loading dashboard data..." />;

    const lowStockItems = inventory.filter(item => item.QuantityAvailable <= item.LowStockLimit);
    const periodSales = filteredOrders.reduce((sum, o) => sum + o.TotalAmount, 0);
    const periodOrdersCount = filteredOrders.length;
    const totalPendingPayments = orders.reduce((sum, o) => sum + (o.BalanceAmount || 0), 0);

    const topCustomers = (() => {
        const stats = {};
        filteredOrders.forEach(o => {
            const k = o.CustomerId || o.CustomerName || 'Walk-in';
            if (!stats[k]) stats[k] = { name: o.CustomerName || 'Walk-in', count: 0, total: 0 };
            stats[k].count++; stats[k].total += o.TotalAmount;
        });
        return Object.values(stats).sort((a, b) => b.total - a.total).slice(0, 5).map(c => ({
            ...c, label: c.name, subLabel: `${c.count} orders`, value: c.total
        }));
    })();

    const topProducts = (() => {
        const stats = {};
        filteredOrders.forEach(o => o.items.forEach(i => {
            if (!stats[i.ProductId]) stats[i.ProductId] = { name: i.ProductName || 'Unknown', qty: 0, rev: 0 };
            stats[i.ProductId].qty += i.Quantity; stats[i.ProductId].rev += i.Price * i.Quantity;
        }));
        return Object.values(stats).sort((a, b) => b.rev - a.rev).slice(0, 5).map(p => ({
            ...p, label: p.name, subLabel: `${p.qty} sold`, value: p.rev
        }));
    })();

    const overdueCustomers = Object.values(orders.reduce((acc, o) => {
        if (o.BalanceAmount > 0) {
            const k = o.CustomerId || o.CustomerName || 'Walk-in';
            if (!acc[k]) acc[k] = { name: o.CustomerName || 'Walk-in', balance: 0, bills: 0 };
            acc[k].balance += o.BalanceAmount; acc[k].bills++;
        }
        return acc;
    }, {})).sort((a, b) => b.balance - a.balance).slice(0, 5);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ marginBottom: '4px' }}>Dashboard</h1>
                    <p className="text-muted">Welcome back, Baker!</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', position: 'relative' }}>
                    <div style={{ background: 'white', padding: '4px', borderRadius: '99px', display: 'flex', gap: '4px', boxShadow: 'var(--shadow-sm)', border: '1px solid #e5e7eb' }}>
                        {['today', 'week', 'month', 'custom'].map(type => (
                            <button
                                key={type}
                                onClick={() => { setFilterType(type); if(type !== 'custom') setShowPicker(false); }}
                                style={{
                                    padding: '8px 16px', borderRadius: '99px', border: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                    background: filterType === type ? 'var(--color-primary)' : 'transparent',
                                    color: filterType === type ? 'white' : 'var(--color-text-muted)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {filterType === 'custom' && (
                        <div ref={pickerRef} style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowPicker(!showPicker)}
                                className="animate-fade-in"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', background: 'white',
                                    border: '1px solid #e5e7eb', borderRadius: '12px', padding: '8px 14px',
                                    cursor: 'pointer', boxShadow: 'var(--shadow-sm)', fontSize: '0.9rem',
                                    fontWeight: 600, color: 'var(--color-text)'
                                }}
                            >
                                <Calendar size={18} color="var(--color-primary)" />
                                <span>{formatDateShort(customStart)}</span>
                                <ChevronRight size={16} className="text-muted" />
                                <span>{formatDateShort(customEnd)}</span>
                            </button>

                            {showPicker && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100 }}>
                                    <DateRangePicker 
                                        startDate={customStart} 
                                        endDate={customEnd} 
                                        onChange={({ start, end }) => { setCustomStart(start); setCustomEnd(end); }}
                                        onClose={() => setShowPicker(false)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                    { title: 'Period Sales', val: `₹${periodSales.toFixed(2)}`, label: filterType==='today'?'Today':filterType==='week'?'This Week':filterType==='month'?'This Month':'Custom Range', color: 'var(--color-primary)', icon: TrendingUp },
                    { title: 'Orders', val: periodOrdersCount, label: 'Total bills generated', color: 'var(--color-success)', icon: ShoppingBag },
                    { title: 'Pending Payments', val: `₹${totalPendingPayments.toFixed(2)}`, label: 'Global outstanding', color: 'var(--color-danger)', icon: DollarSign }
                ].map((s, i) => (
                    <div key={i} className="card stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: s.color }}>
                            <s.icon size={20} /><span style={{ fontWeight: 600 }}>{s.title}</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.val}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <RingChart items={topProducts} title="Top Selling Products" icon={Package} colors={RING_COLORS_PRODUCTS} valueKey="value" labelKey="label" subLabelKey="subLabel" emptyMsg="No sales data for this period." />
                <RingChart items={topCustomers} title="Top Customers" icon={Users} colors={RING_COLORS_CUSTOMERS} valueKey="value" labelKey="label" subLabelKey="subLabel" emptyMsg="No customer data for this period." />
            </div>

            <section className="mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><BarChart2 size={20} /> Sales Trend ({trendData.length} days)</h3>
                <div className="card" style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '32px 16px 16px', position: 'relative', overflowX: 'auto' }}>
                    <div style={{ position: 'absolute', top: '12px', left: '16px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Amount (₹)</div>
                    {trendData.map(d => (
                        <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '40px' }}>
                            <div title={`₹${d.total.toFixed(2)}`} style={{ width: '60%', backgroundColor: 'var(--color-primary)', borderRadius: '4px 4px 0 0', height: `${(d.total/maxSalesTrend)*140}px`, minHeight: d.total > 0 ? '4px' : '0', marginBottom: '8px', transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)', opacity: d.total > 0 ? 1 : 0.2 }} />
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700 }}>₹{d.total > 1000 ? (d.total/1000).toFixed(1)+'k' : d.total.toFixed(0)}</div>
                        </div>
                    ))}
                    {trendData.length === 0 && <div style={{ width: '100%', textAlign: 'center', padding: '40px' }} className="text-muted">No data for trend.</div>}
                </div>
            </section>

            <section className="mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><AlertTriangle size={20} color={overdueCustomers.length > 0 ? '#dc2626' : '#16a34a'} /> Customers with Pending Payments</h3>
                <div className="card">
                    {overdueCustomers.length === 0 ? <div style={{ color: '#16a34a' }}>All payments are up to date!</div> : overdueCustomers.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: i < overdueCustomers.length - 1 ? '1px solid #f3f4f6' : 'none', borderLeft: '3px solid #dc2626' }}>
                            <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.bills} pending bills</div></div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>₹{c.balance.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} color={lowStockItems.length > 0 ? 'var(--color-danger)' : 'var(--color-success)'} /> Low Stock Alerts</h3>
                {lowStockItems.length > 0 ? <div className="stock-alerts">{lowStockItems.map(item => (
                    <div key={item.InventoryId} className="card" style={{ borderLeft: '4px solid var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontWeight: 600 }}>{item.IngredientName}</div><div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Remaining: {item.QuantityAvailable} {item.unit}</div></div>
                        <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.8rem' }}>LOW</div>
                    </div>
                ))}</div> : <div className="card" style={{ borderLeft: '4px solid var(--color-success)', padding: '16px' }}>All Items are well stocked!</div>}
            </section>
        </div>
    );
};

export default Dashboard;
