import React, { useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import CreateOrderModal from '../components/CreateOrderModal';
import { useCustomers } from '../contexts/CustomersContext';
import { useProducts } from '../contexts/ProductsContext';
import SearchableSelect from '../components/SearchableSelect';
import Modal from '../components/Modal';
import DateRangePicker from '../components/DateRangePicker';
import Invoice from '../components/Invoice';
import Loader from '../components/Loader';
import { Calendar, Download, MoreHorizontal, Plus, Filter, LayoutGrid, RotateCcw, Search, ChevronDown, CheckSquare, Square, Receipt, Trash2, Printer, ShoppingCart, Package, Wallet } from 'lucide-react';

const Orders = ({ setActiveTab }) => {
    const { orders, loading, updateOrderStatus, updatePaymentStatus, deleteOrder } = useOrders();
    const { products } = useProducts();
    const [selectedTab, setSelectedTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrders, setSelectedOrders] = useState([]);

    // Modal state removed - now uses full page
    
    // Delete Modal State
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Invoice Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
    
    const [dateFilter, setDateFilter] = useState(null); // 'today', 'custom', or null
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'BillDate', direction: 'desc' }); // 'BillDate', 'TotalAmount'
    
    // Advanced Filters
    const [filters, setFilters] = useState({
        customer: '',
        paymentStatus: [],
        orderStatus: []
    });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // ... existing status update state ...
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);

    if (loading) return <Loader text="Loading orders..." />;

    // Helpers
    const getPaymentStatusColor = (status) => { /* ... existing ... */ 
        switch (status) {
            case 'Paid': return '#22c55e'; // Green
            case 'Partial': return '#3b82f6'; // Blue
            case 'Unpaid': return '#f59e0b'; // Orange
            default: return '#6b7280';
        }
    };
    const getOrderStatusColor = (status) => { /* ... existing ... */ 
        switch (status) {
            case 'Pending': return '#fff7ed'; // Light Orange
            case 'Order processing': return '#e0f2fe'; // Light Blue
            case 'Shipped': return '#dcfce7'; // Light Green
            case 'Delivered': return '#f3e8ff'; // Light Purple
            case 'Cancelled': return '#fee2e2'; // Light Red
            default: return '#f3f4f6';
        }
    };
    const getOrderStatusTextColor = (status) => { /* ... existing ... */ 
         switch (status) {
            case 'Pending': return '#c2410c';
            case 'Order processing': return '#0284c7';
            case 'Shipped': return '#16a34a';
            case 'Delivered': return '#9333ea';
            case 'Cancelled': return '#dc2626';
            default: return '#374151';
        }
    };

    // Actions
    const handleExport = () => {
        const headers = ['BillId', 'Date', 'Customer', 'Total', 'PaymentStatus', 'OrderStatus'];
        const csvContent = [
            headers.join(','),
            ...filteredOrders.map(o => [
                o.BillId,
                new Date(o.BillDate).toLocaleDateString(),
                `"${o.CustomerName}"`,
                o.TotalAmount,
                o.PaymentStatus,
                o.OrderStatus || 'Pending'
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleToday = () => {
        setDateFilter('today');
        setSelectedTab('All'); // Optional: reset tab or keep it? Let's keep it.
    };

    const handleRefresh = () => {
        setDateFilter(null);
        setDateRange({ start: '', end: '' });
        setSearchTerm('');
        setSelectedTab('All');
        setSortConfig({ key: 'BillDate', direction: 'desc' });
        setFilters({ customer: '', paymentStatus: [], orderStatus: [] });
    };

    // Existing handlers...

    const handleDeleteOrder = (order) => {
        setOrderToDelete(order);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!orderToDelete) return;
        
        try {
            await deleteOrder(orderToDelete.id);
            setOrderToDelete(null);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Failed to delete order", error);
            alert("Failed to delete order. Please try again.");
        }
    };

    const handleSort = () => {
        // Cycle: Date Desc -> Date Asc -> Amount Desc -> Amount Asc
        if (sortConfig.key === 'BillDate' && sortConfig.direction === 'desc') {
            setSortConfig({ key: 'BillDate', direction: 'asc' });
        } else if (sortConfig.key === 'BillDate' && sortConfig.direction === 'asc') {
            setSortConfig({ key: 'TotalAmount', direction: 'desc' });
        } else if (sortConfig.key === 'TotalAmount' && sortConfig.direction === 'desc') {
            setSortConfig({ key: 'TotalAmount', direction: 'asc' });
        } else {
            setSortConfig({ key: 'BillDate', direction: 'desc' });
        }
    };

    // Filtering & Sorting Logic
    const filteredOrders = orders.filter(order => {
        // 1. Tab Filter
        if (selectedTab !== 'All' && order.PaymentStatus !== selectedTab) return false;
        
        // 2. Search Filter
        if (searchTerm && !order.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) && !order.BillId.toString().includes(searchTerm)) return false;

        // 3. Date Range Filter
        if (dateRange.start) {
            const orderDate = new Date(order.BillDate);
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            if (orderDate < startDate) return false;
        }
        if (dateRange.end) {
            const orderDate = new Date(order.BillDate);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (orderDate > endDate) return false;
        }

        // 4. Advanced Filters
        if (filters.customer && !order.CustomerName.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(order.PaymentStatus)) return false;
        if (filters.orderStatus.length > 0 && !filters.orderStatus.includes(order.OrderStatus || 'Pending')) return false;

        return true;
    }).sort((a, b) => {
        // Sorting
        if (sortConfig.key === 'BillDate') {
            return sortConfig.direction === 'asc' 
                ? new Date(a.BillDate) - new Date(b.BillDate) 
                : new Date(b.BillDate) - new Date(a.BillDate);
        } else if (sortConfig.key === 'TotalAmount') {
            return sortConfig.direction === 'asc' 
                ? a.TotalAmount - b.TotalAmount 
                : b.TotalAmount - a.TotalAmount;
        }
        return 0;
    });

    const toggleSelectAll = () => { /* ... existing ... */ 
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.BillId));
        }
    };

    // ... existing toggleSelectOrder, openStatusModal, handleUpdateStatus, handleUpdatePaymentStatus ...
    const toggleSelectOrder = (id) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(oId => oId !== id));
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };
    
    const openStatusModal = (order) => {
        setSelectedOrderForStatus(order);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = (newStatus) => {
        if (selectedOrderForStatus) {
            updateOrderStatus(selectedOrderForStatus.BillId, newStatus);
            setIsStatusModalOpen(false);
            setSelectedOrderForStatus(null);
        }
    };

    const handleUpdatePaymentStatus = (newStatus) => {
        if (selectedOrderForStatus) {
            updatePaymentStatus(selectedOrderForStatus.BillId, newStatus);
            setIsStatusModalOpen(false);
            setSelectedOrderForStatus(null);
        }
    };

    const openInvoiceModal = (order) => {
        setSelectedOrderForInvoice(order);
        setIsInvoiceModalOpen(true);
    };

    // Stats
    const totalOrders = orders.length;
    const totalItems = orders.reduce((acc, order) => acc + order.items.reduce((s, i) => s + i.Quantity, 0), 0);
    const fulfilled = orders.filter(o => o.OrderStatus === 'Delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.TotalAmount || 0), 0);
    const totalCollected = orders.reduce((sum, o) => sum + (o.PaidAmount || 0), 0);
    const collectedPct = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Order</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="secondary" 
                            style={{ 
                                background: (dateRange.start || dateRange.end) ? '#eff6ff' : 'white', 
                                borderColor: (dateRange.start || dateRange.end) ? 'var(--color-primary)' : '#e5e7eb',
                                minWidth: '140px'
                            }}
                            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
                        >
                            <Calendar size={18} style={{ marginRight: '8px' }} /> 
                            {(dateRange.start || dateRange.end) 
                                ? `${dateRange.start || '...'} - ${dateRange.end || '...'}` 
                                : 'Date Range'}
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
                    <button className="secondary" style={{ background: 'white' }} onClick={handleExport}>
                        <Download size={18} style={{ marginRight: '8px' }} /> Export
                    </button>
                    <button className="primary" onClick={() => setActiveTab('create-order')}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Create order
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>

                {/* Total Orders */}
                <div className="card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>Total Orders</span>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingCart size={28} color="#3b82f6" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginBottom: '8px', color: '#1e293b' }}>{totalOrders}</div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>All time orders</div>
                </div>

                {/* Ordered Items */}
                <div className="card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>Ordered Items</span>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={28} color="#16a34a" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginBottom: '8px', color: '#1e293b' }}>{totalItems}</div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>Total units sold</div>
                </div>

                {/* Payments Collected */}
                <div className="card" style={{ padding: '20px 24px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>Payments Collected</span>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={28} color="#16a34a" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: '#16a34a' }}>₹{totalCollected.toFixed(0)}</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>of ₹{totalRevenue.toFixed(0)}</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                        <div style={{ width: `${collectedPct}%`, background: collectedPct === 100 ? '#16a34a' : '#f59e0b', height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{collectedPct}% collected</div>
                </div>

            </div>


            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                     <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
                     <input
                        placeholder="Find order"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%', padding: '8px 36px 8px 36px' }}
                     />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className="secondary" 
                        style={{ background: isFilterModalOpen ? '#eff6ff' : 'white', borderColor: isFilterModalOpen ? 'var(--color-primary)' : '#e5e7eb' }} 
                        onClick={() => setIsFilterModalOpen(true)}
                    >
                        <Filter size={16} style={{ marginRight: '6px' }}/> Filter
                    </button>
                    <button className="secondary" style={{ background: 'white', minWidth: '100px' }} onClick={handleSort}>
                        Sort by <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                            {sortConfig.key === 'BillDate' ? 'Date' : 'Amount'} {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', width: '40px' }}>
                                <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex' }}>
                                    {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={20} color="var(--color-primary)" /> : <Square size={20} color="#d1d5db" />}
                                </div>
                            </th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>ID Order</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Order Date</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Customer</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Balance</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Payment Status</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Items</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Order Status</th>
                            <th style={{ padding: '16px', textAlign: 'right', width: '40px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => {
                            const date = new Date(order.BillDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const itemCount = order.items.reduce((a, c) => a + c.Quantity, 0);
                            const orderStatus = order.OrderStatus || 'Pending';

                            return (
                                <tr key={order.BillId} style={{ borderTop: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div onClick={() => toggleSelectOrder(order.BillId)} style={{ cursor: 'pointer', display: 'flex' }}>
                                             {selectedOrders.includes(order.BillId) ? <CheckSquare size={20} color="var(--color-primary)" /> : <Square size={20} color="#d1d5db" />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 500 }}>#{order.BillId}</td>
                                    <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{date}</td>
                                    <td style={{ padding: '16px' }}>{order.CustomerName}</td>
                                    <td style={{ padding: '16px' }}>₹{order.TotalAmount.toFixed(2)}</td>
                                    <td style={{ padding: '16px', fontWeight: 500, color: (order.BalanceAmount > 0) ? '#ef4444' : '#22c55e' }}>
                                        {order.BalanceAmount > 0 ? `₹${order.BalanceAmount.toFixed(2)}` : '-'}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ 
                                            background: getPaymentStatusColor(order.PaymentStatus), 
                                            color: 'white', 
                                            padding: '4px 12px', 
                                            borderRadius: '16px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600 
                                        }}>
                                            {order.PaymentStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ display: 'flex', marginLeft: '4px' }}>
                                                {order.items.slice(0, 3).map((item, idx) => {
                                                    const product = products.find(p => p.ProductId === item.ProductId);
                                                    return (
                                                        <div 
                                                            key={idx} 
                                                            style={{ 
                                                                width: '24px', 
                                                                height: '24px', 
                                                                borderRadius: '4px', 
                                                                border: '2px solid white', 
                                                                background: '#f3f4f6', 
                                                                overflow: 'hidden',
                                                                marginLeft: idx === 0 ? 0 : '-8px',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                zIndex: 10 - idx
                                                            }}
                                                            title={item.ProductName || product?.ProductName}
                                                        >
                                                            {product?.image ? (
                                                                <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#9ca3af' }}>
                                                                    {item.ProductName?.charAt(0).toUpperCase() || product?.ProductName?.charAt(0).toUpperCase() || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {order.items.length > 3 && (
                                                    <div style={{ 
                                                        width: '24px', 
                                                        height: '24px', 
                                                        borderRadius: '4px', 
                                                        border: '2px solid white', 
                                                        background: '#e5e7eb', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        fontSize: '0.6rem',
                                                        fontWeight: 700,
                                                        color: '#4b5563',
                                                        marginLeft: '-8px',
                                                        zIndex: 5
                                                    }}>
                                                        +{order.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{itemCount} items</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ 
                                            background: getOrderStatusColor(orderStatus), 
                                            color: getOrderStatusTextColor(orderStatus), 
                                            padding: '4px 12px', 
                                            borderRadius: '16px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600 
                                        }}>
                                            {orderStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn-icon" onClick={() => openInvoiceModal(order)} title="View Invoice"
                                            >
                                                <Printer size={20} />
                                            </button>
                                            <button 
                                                className="btn-icon" onClick={() => openStatusModal(order)} title="Update Status"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                            <button 
                                                className="btn-icon danger" onClick={() => handleDeleteOrder(order)} title="Delete Order"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                     <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No orders found</div>
                )}
            </div>

            {/* Create Order is now a full page - no modal here */}

            {/* Filter Modal */}
            {isFilterModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setIsFilterModalOpen(false)}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '380px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>Filter Orders</h3>
                            <button onClick={() => setIsFilterModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Customer Name</label>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Customer Name</label>
                            <SearchableSelect
                                placeholder="All Customers"
                                value={filters.customer}
                                onChange={val => setFilters({...filters, customer: val})}
                                options={[...new Set(orders.map(o => o.CustomerName))].sort()}
                                icon={Search}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Payment Status</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['Paid', 'Partial', 'Unpaid'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            const newStats = filters.paymentStatus.includes(status) 
                                                ? filters.paymentStatus.filter(s => s !== status)
                                                : [...filters.paymentStatus, status];
                                            setFilters({...filters, paymentStatus: newStats});
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid',
                                            borderColor: filters.paymentStatus.includes(status) ? 'var(--color-primary)' : '#e5e7eb',
                                            background: filters.paymentStatus.includes(status) ? '#eff6ff' : 'white',
                                            color: filters.paymentStatus.includes(status) ? 'var(--color-primary)' : '#374151',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Order Status</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['Pending', 'Order processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            const newStats = filters.orderStatus.includes(status) 
                                                ? filters.orderStatus.filter(s => s !== status)
                                                : [...filters.orderStatus, status];
                                            setFilters({...filters, orderStatus: newStats});
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid',
                                            borderColor: filters.orderStatus.includes(status) ? 'var(--color-primary)' : '#e5e7eb',
                                            background: filters.orderStatus.includes(status) ? '#eff6ff' : 'white',
                                            color: filters.orderStatus.includes(status) ? 'var(--color-primary)' : '#374151',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                             <button 
                                style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                onClick={() => {
                                    setFilters({ customer: '', paymentStatus: [], orderStatus: [] });
                                    setIsFilterModalOpen(false);
                                }}
                            >
                                Clear
                            </button>
                            <button 
                                className="primary"
                                style={{ flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer' }}
                                onClick={() => setIsFilterModalOpen(false)}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {isStatusModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setIsStatusModalOpen(false)}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '320px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Update Order</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Payment Status</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['Paid', 'Unpaid'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdatePaymentStatus(status)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            border: '1px solid',
                                            borderColor: selectedOrderForStatus?.PaymentStatus === status ? getPaymentStatusColor(status) : '#e5e7eb',
                                            borderRadius: '6px',
                                            background: selectedOrderForStatus?.PaymentStatus === status ? getPaymentStatusColor(status) : 'white',
                                            color: selectedOrderForStatus?.PaymentStatus === status ? 'white' : '#374151',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Order Status</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['Pending', 'Order processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdateStatus(status)}
                                        style={{
                                            padding: '10px',
                                            border: selectedOrderForStatus?.OrderStatus === status ? `1px solid ${getOrderStatusTextColor(status)}` : '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            background: getOrderStatusColor(status),
                                            color: getOrderStatusTextColor(status),
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: selectedOrderForStatus?.OrderStatus === status ? 1 : 0.7 // Slight fade for unselected to make selected pop? Or maybe just keep them all vivid? Let's keep them vivid but maybe standard border for unselected.
                                        }}
                                    >
                                        <span>{status}</span>
                                        {selectedOrderForStatus?.OrderStatus === status && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getOrderStatusTextColor(status) }}></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            style={{ 
                                width: '100%', padding: '10px', 
                                background: 'transparent', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' 
                            }}
                            onClick={() => setIsStatusModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Order"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
                        <button className="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                        <button className="primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={confirmDelete}>Delete</button>
                    </div>
                }
            >
                {orderToDelete && (
                    <p>Are you sure you want to delete order <strong>#{orderToDelete.BillId}</strong>? This action cannot be undone.</p>
                )}
            </Modal>

            {/* Invoice Modal */}
            <Modal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                title={`Invoice #${selectedOrderForInvoice?.BillId || ''}`}
                maxWidth="900px"
            >
                <div style={{ margin: '-24px', backgroundColor: '#f5f5f5' }}>
                    <Invoice order={selectedOrderForInvoice} />
                </div>
            </Modal>
        </div>
    );
};

export default Orders;
