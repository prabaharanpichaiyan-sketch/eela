import React, { useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import { useCustomers } from '../contexts/CustomersContext';
import { useProducts } from '../contexts/ProductsContext';
import Modal from '../components/Modal';
import { ChevronDown, ChevronUp, Calendar, Package, DollarSign, CreditCard, Clock } from 'lucide-react';

const CustomerOrderHistory = () => {
    const { orders, updateOrderPayment } = useOrders();
    const { customers } = useCustomers();
    const { products } = useProducts();

    const [expandedOrders, setExpandedOrders] = useState({});
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Group orders by customer
    const getCustomerOrderHistory = () => {
        const history = {};
        
        orders.forEach(order => {
            const key = order.CustomerId || order.CustomerName || 'Walk-in';
            if (!history[key]) {
                history[key] = {
                    customerId: order.CustomerId,
                    customerName: order.CustomerName || 'Walk-in Customer',
                    orders: []
                };
            }
            history[key].orders.push(order);
        });

        // Sort orders by date (newest first) for each customer
        Object.values(history).forEach(customer => {
            customer.orders.sort((a, b) => new Date(b.BillDate) - new Date(a.BillDate));
        });

        return Object.values(history);
    };

    const customerHistory = getCustomerOrderHistory();

    const toggleOrderExpand = (billId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [billId]: !prev[billId]
        }));
    };

    const handleOpenPaymentModal = (bill) => {
        setSelectedBill(bill);
        setPaymentAmount('');
        setIsPaymentModalOpen(true);
    };

    const handleRecordPayment = () => {
        if (!selectedBill || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

        const amount = parseFloat(paymentAmount);
        if (amount > selectedBill.BalanceAmount) {
            alert('Payment amount cannot exceed balance amount!');
            return;
        }

        updateOrderPayment(selectedBill.BillId, amount);
        setIsPaymentModalOpen(false);
        setSelectedBill(null);
        setPaymentAmount('');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.ProductId === productId);
        return product ? product.ProductName : 'Unknown Product';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return '#16a34a';
            case 'Partial': return '#f59e0b';
            case 'Unpaid': return '#dc2626';
            default: return '#6b7280';
        }
    };

    const paymentModalFooter = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button className="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
            <button 
                className="primary" 
                onClick={handleRecordPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
                Record Payment
            </button>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className="mb-6">
                <h1>Order History</h1>
                <p className="text-muted">Timeline view of customer orders</p>
            </header>

            {customerHistory.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <Clock size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
                    <p className="text-muted">No order history found</p>
                </div>
            ) : (
                customerHistory.map((customer, idx) => (
                    <div key={idx} style={{ marginBottom: '32px' }}>
                        {/* Customer Header */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            marginBottom: '16px',
                            paddingLeft: '8px'
                        }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '50%', 
                                background: '#e0f2fe', 
                                color: '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.1rem'
                            }}>
                                {customer.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{customer.customerName}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    {customer.orders.length} order{customer.orders.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div style={{ position: 'relative', paddingLeft: '32px' }}>
                            {/* Timeline Line */}
                            <div style={{
                                position: 'absolute',
                                left: '19px',
                                top: '0',
                                bottom: '0',
                                width: '2px',
                                background: '#e5e7eb'
                            }}></div>

                            {/* Orders */}
                            {customer.orders.map((order, orderIdx) => {
                                const isExpanded = expandedOrders[order.BillId];
                                const hasBalance = order.BalanceAmount > 0;

                                return (
                                    <div key={order.BillId} style={{ marginBottom: '16px', position: 'relative' }}>
                                        {/* Timeline Dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '-32px',
                                            top: '16px',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: hasBalance ? '#dc2626' : '#16a34a',
                                            border: '3px solid white',
                                            boxShadow: '0 0 0 2px #e5e7eb'
                                        }}></div>

                                        {/* Order Card */}
                                        <div 
                                            className="card" 
                                            style={{ 
                                                borderLeft: `4px solid ${hasBalance ? '#dc2626' : '#16a34a'}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => toggleOrderExpand(order.BillId)}
                                        >
                                            {/* Card Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '16px' : '0' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>Bill #{order.BillId}</span>
                                                        <span style={{ 
                                                            fontSize: '0.75rem', 
                                                            padding: '2px 8px', 
                                                            borderRadius: '12px',
                                                            background: order.PaymentStatus === 'Paid' ? '#dcfce7' : (order.PaymentStatus === 'Partial' ? '#fef3c7' : '#fee2e2'),
                                                            color: getStatusColor(order.PaymentStatus),
                                                            fontWeight: 600
                                                        }}>
                                                            {order.PaymentStatus}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                        <Calendar size={14} />
                                                        {formatDate(order.BillDate)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                            ₹{order.TotalAmount.toFixed(2)}
                                                        </div>
                                                        {hasBalance && (
                                                            <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                                                                Due: ₹{order.BalanceAmount.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                                                    {/* Products List */}
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Package size={16} /> Items Ordered
                                                        </h4>
                                                        {order.items.map((item, itemIdx) => (
                                                            <div key={itemIdx} style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between',
                                                                padding: '8px 12px',
                                                                background: '#f9fafb',
                                                                borderRadius: '6px',
                                                                marginBottom: '8px'
                                                            }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 500 }}>{item.ProductName || getProductName(item.ProductId)}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                                        Qty: {item.Quantity} × ₹{item.Price.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontWeight: 600 }}>
                                                                    ₹{(item.Quantity * item.Price).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Payment Summary */}
                                                    <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: hasBalance ? '12px' : '0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                            <span style={{ color: 'var(--color-text-muted)' }}>Total Amount:</span>
                                                            <span style={{ fontWeight: 600 }}>₹{order.TotalAmount.toFixed(2)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                            <span style={{ color: 'var(--color-text-muted)' }}>Paid Amount:</span>
                                                            <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{(order.PaidAmount || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
                                                            <span style={{ fontWeight: 600 }}>Balance:</span>
                                                            <span style={{ fontWeight: 700, color: hasBalance ? '#dc2626' : '#16a34a' }}>
                                                                ₹{(order.BalanceAmount || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Payment Button */}
                                                    {hasBalance && (
                                                        <button
                                                            className="primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenPaymentModal(order);
                                                            }}
                                                            style={{ 
                                                                width: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            <DollarSign size={18} /> Record Payment
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Record Payment"
                footer={paymentModalFooter}
                maxWidth="400px"
            >
                {selectedBill && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="card" style={{ background: '#f9fafb', padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Bill ID:</span>
                                <span style={{ fontWeight: 600 }}>#{selectedBill.BillId}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Total Amount:</span>
                                <span style={{ fontWeight: 600 }}>₹{selectedBill.TotalAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Already Paid:</span>
                                <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{(selectedBill.PaidAmount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                <span style={{ fontWeight: 600 }}>Balance Due:</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>
                                    ₹{selectedBill.BalanceAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Payment Amount</label>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedBill.BalanceAmount}
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px 10px 10px 40px', 
                                        borderRadius: '8px', 
                                        border: '1px solid #d1d5db',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Maximum: ₹{selectedBill.BalanceAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomerOrderHistory;
