import React from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useOrders } from '../contexts/OrdersContext';
import { useProducts } from '../contexts/ProductsContext';
import { useCustomers } from '../contexts/CustomersContext';
import { AlertTriangle, TrendingUp, Package, ShoppingBag, BarChart2, PieChart, Users, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const { inventory } = useInventory();
    const { orders } = useOrders();
    const { products } = useProducts();

    const lowStockItems = inventory.filter(item => item.QuantityAvailable <= item.LowStockLimit);

    // --- Sales Trend (Last 7 Days) ---
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

    const maxSales = Math.max(...salesData.map(d => d.total), 1); // Avoid div by 0



    // Today's Sales
    const today = new Date().toISOString().split('T')[0];
    const todaySales = orders
        .filter(o => o.BillDate.startsWith(today))
        .reduce((sum, order) => sum + order.TotalAmount, 0);

    // This Month's Sales
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthSales = orders
        .filter(o => o.BillDate.startsWith(currentMonth))
        .reduce((sum, order) => sum + order.TotalAmount, 0);
    
    // Customer Metrics
    const { customers } = useCustomers();
    
    const totalPendingPayments = orders.reduce((sum, order) => sum + (order.BalanceAmount || 0), 0);
    
    const getTopCustomers = () => {
        const customerStats = {};
        orders.forEach(order => {
            const key = order.CustomerId || order.CustomerName || 'Walk-in';
            if (!customerStats[key]) {
                customerStats[key] = {
                    name: order.CustomerName || 'Walk-in',
                    orderCount: 0,
                    totalSpent: 0
                };
            }
            customerStats[key].orderCount++;
            customerStats[key].totalSpent += order.TotalAmount;
        });
        
        return Object.values(customerStats)
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 5);
    };

    const getCustomersWithOverdue = () => {
        const overdueCustomers = {};
        orders.forEach(order => {
            if (order.BalanceAmount > 0) {
                const key = order.CustomerId || order.CustomerName || 'Walk-in';
                if (!overdueCustomers[key]) {
                    overdueCustomers[key] = {
                        name: order.CustomerName || 'Walk-in',
                        balance: 0,
                        billCount: 0
                    };
                }
                overdueCustomers[key].balance += order.BalanceAmount;
                overdueCustomers[key].billCount++;
            }
        });
        
        return Object.values(overdueCustomers)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5);
    };

    const getTopProducts = () => {
        const productStats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.ProductId;
                if (!productStats[key]) {
                    productStats[key] = {
                        name: item.ProductName || 'Unknown Product',
                        qty: 0,
                        revenue: 0
                    };
                }
                productStats[key].qty += item.Quantity;
                productStats[key].revenue += (item.Price * item.Quantity);
            });
        });

        return Object.values(productStats)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    };

    const topCustomers = getTopCustomers();
    const overdueCustomers = getCustomersWithOverdue();
    const topProducts = getTopProducts();

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className="mb-6">
                <h1>Dashboard</h1>
                <p className="text-muted">Welcome back, Baker!</p>
            </header>

            {/* --- Key Stats --- */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary)' }}>
                        <TrendingUp size={20} />
                        <span style={{ fontWeight: 600 }}>Today's Sales</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{todaySales.toFixed(2)}</div>
                </div>

                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981' }}>
                        <BarChart2 size={20} />
                        <span style={{ fontWeight: 600 }}>This Month</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{monthSales.toFixed(2)}</div>
                </div>

                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#dc2626' }}>
                        <DollarSign size={20} />
                        <span style={{ fontWeight: 600 }}>Pending Payments</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{totalPendingPayments.toFixed(2)}</div>
                </div>
            </div>


            {/* --- Grid Layout for Top Items --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>


            
                {/* --- Top Selling Products --- */}
                <div className="card" style={{ marginBottom: 0, height: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1.1rem' }}>
                        <Package size={20} /> Top Selling Products
                    </h3>
                    {topProducts.length === 0 ? <p className="text-muted">No sales data yet.</p> : (
                        topProducts.map((p, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: idx < topProducts.length - 1 ? '1px solid #f3f4f6' : 'none'
                             }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: '#ecfdf5', // Light green
                                        color: '#059669',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.9rem'
                                    }}>
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {p.qty} sold
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                        ₹{p.revenue.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* --- Top Customers --- */}
                <div className="card" style={{ marginBottom: 0, height: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1.1rem' }}>
                        <Users size={20} /> Top Customers
                    </h3>
                    {topCustomers.length === 0 ? (
                        <p className="text-muted">No customer data yet.</p>
                    ) : (
                        topCustomers.map((customer, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '12px 0',
                                borderBottom: idx < topCustomers.length - 1 ? '1px solid #f3f4f6' : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: '#e0f2fe', 
                                        color: '#0284c7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.9rem'
                                    }}>
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                        ₹{customer.totalSpent.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>

            {/* --- Sales Trend Chart --- */}
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
                                height: `${(d.total / maxSales) * 120}px`, // Max 120px height
                                minHeight: d.total > 0 ? '4px' : '0',
                                marginBottom: '8px',
                                transition: 'height 0.3s ease'
                            }}></div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                {d.label}
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                                ₹{d.total.toFixed(0)}
                            </div>
                        </div>
                    ))}
                </div>
            </section>



            {/* --- Customers with Overdue Payments --- */}
            <section className="mb-6">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertTriangle size={20} color={overdueCustomers.length > 0 ? '#dc2626' : '#16a34a'} /> 
                    Customers with Pending Payments
                </h3>
                <div className="card">
                    {overdueCustomers.length === 0 ? (
                        <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            All payments are up to date!
                        </div>
                    ) : (
                        overdueCustomers.map((customer, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '12px',
                                borderBottom: idx < overdueCustomers.length - 1 ? '1px solid #f3f4f6' : 'none',
                                borderLeft: '3px solid #dc2626'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {customer.billCount} pending bill{customer.billCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>
                                    ₹{customer.balance.toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* --- Low Stock Alerts --- */}
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
