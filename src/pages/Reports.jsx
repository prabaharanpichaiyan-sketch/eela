import React, { useState, useMemo } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import { useCustomers } from '../contexts/CustomersContext';
import { useProducts } from '../contexts/ProductsContext';
import SearchableSelect from '../components/SearchableSelect';
import DateRangePicker from '../components/DateRangePicker';
import Loader from '../components/Loader';
import { Calendar, Download, Filter, BarChart3, Search } from 'lucide-react';

const Reports = () => {
    const { orders, loading: ordLoading } = useOrders();
    const { customers, loading: custLoading } = useCustomers();
    const { products, loading: prodLoading } = useProducts();

    if (ordLoading || custLoading || prodLoading) return <Loader text="Loading reports..." />;

    // Filter states
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');

    // Flatten orders into line items for the report
    const reportData = useMemo(() => {
        let items = [];
        
        orders.forEach(order => {
            // Filter by date range
            if (dateRange.start) {
                const orderDate = new Date(order.BillDate);
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                if (orderDate < startDate) return;
            }
            if (dateRange.end) {
                const orderDate = new Date(order.BillDate);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                if (orderDate > endDate) return;
            }

            // Filter by customer
            if (selectedCustomer && order.CustomerName !== selectedCustomer) return;

            order.items.forEach(item => {
                // Filter by product
                if (selectedProduct && item.ProductName !== selectedProduct) return;

                items.push({
                    BillId: order.BillId,
                    Date: order.BillDate,
                    CustomerName: order.CustomerName,
                    PaymentStatus: order.PaymentStatus,
                    ProductName: item.ProductName,
                    Quantity: item.Quantity,
                    Price: item.Price,
                    Total: item.Quantity * item.Price
                });
            });
        });

        // Sort by date descending
        return items.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    }, [orders, dateRange, selectedCustomer, selectedProduct]);

    // Calculate aggregations
    const totalRevenue = reportData.reduce((sum, item) => sum + item.Total, 0);
    const totalQuantity = reportData.reduce((sum, item) => sum + item.Quantity, 0);
    const uniqueOrdersCount = new Set(reportData.map(item => item.BillId)).size;

    const handleExport = () => {
        const headers = ['Order ID', 'Date', 'Customer', 'Product', 'Quantity', 'Price', 'Total', 'Payment Status'];
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => [
                row.BillId,
                new Date(row.Date).toLocaleDateString(),
                `"${row.CustomerName}"`,
                `"${row.ProductName}"`,
                row.Quantity,
                row.Price,
                row.Total,
                row.PaymentStatus
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const customerOptions = [{ value: '', label: 'All Customers' }, ...[...new Set(orders.map(o => o.CustomerName))]
        .sort()
        .map(c => ({ value: c, label: c }))];

    const productOptions = [{ value: '', label: 'All Products' }, ...products
        .filter(p => p.IsActive)
        .map(p => ({ value: p.ProductName, label: p.ProductName }))];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', color: 'var(--color-primary)' }}>
                        <BarChart3 size={24} />
                    </div>
                    <h1>Reports</h1>
                </div>
                <button className="secondary" style={{ background: 'white' }} onClick={handleExport}>
                    <Download size={18} style={{ marginRight: '8px' }} /> Export CSV
                </button>
            </header>

            {/* Filters Section */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Date Range Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Date Range</label>
                        <div style={{ position: 'relative' }}>
                            <button 
                                className="secondary" 
                                style={{ 
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    background: (dateRange.start || dateRange.end) ? '#eff6ff' : 'white', 
                                    borderColor: (dateRange.start || dateRange.end) ? 'var(--color-primary)' : '#e5e7eb',
                                    border: '1px solid #d1d5db',
                                    padding: '10px 12px',
                                    fontWeight: 'normal'
                                }}
                                onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
                            >
                                <Calendar size={18} style={{ marginRight: '8px', color: '#6b7280' }} /> 
                                {(dateRange.start || dateRange.end) 
                                    ? `${dateRange.start || 'Start'} - ${dateRange.end || 'End'}` 
                                    : 'Select Date Range'}
                            </button>
                            {isDateRangeOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 10
                                }}>
                                    <DateRangePicker 
                                        startDate={dateRange.start} 
                                        endDate={dateRange.end}
                                        onChange={(range) => setDateRange(range)}
                                        onClose={() => setIsDateRangeOpen(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Customer</label>
                        <SearchableSelect
                            placeholder="All Customers"
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                            options={customerOptions}
                            icon={Search}
                        />
                    </div>

                    {/* Product Filter */}
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Product</label>
                        <SearchableSelect
                            placeholder="All Products"
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            options={productOptions}
                            icon={Search}
                        />
                    </div>

                    {/* Clear Filters Button */}
                    <div>
                        <button 
                            className="secondary" 
                            style={{ height: '42px', display: 'flex', alignItems: 'center' }}
                            onClick={() => {
                                setDateRange({ start: '', end: '' });
                                setSelectedCustomer('');
                                setSelectedProduct('');
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '24px', marginBottom: 0, borderLeft: '4px solid var(--color-primary)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>Total Revenue</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>₹{totalRevenue.toFixed(2)}</div>
                </div>
                <div className="card" style={{ padding: '24px', marginBottom: 0, borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>Items Sold</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{totalQuantity}</div>
                </div>
                <div className="card" style={{ padding: '24px', marginBottom: 0, borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>Unique Orders</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{uniqueOrdersCount}</div>
                </div>
            </div>

            {/* Data Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Date</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Order ID</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Customer</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Product</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Qty</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Price</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No data found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>
                                            {new Date(row.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>#{row.BillId}</td>
                                        <td style={{ padding: '16px' }}>{row.CustomerName}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {(() => {
                                                    const product = products.find(p => p.ProductName === row.ProductName);
                                                    return product?.image ? (
                                                        <img src={product.image} alt={row.ProductName} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700 }}>
                                                            {row.ProductName.charAt(0).toUpperCase()}
                                                        </div>
                                                    );
                                                })()}
                                                <span>{row.ProductName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>{row.Quantity}</td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>₹{row.Price.toFixed(2)}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>₹{row.Total.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
