import React, { useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import Modal from './Modal';
import { User, Phone, Mail, MapPin, FileText, Clock, CheckCircle, AlertOctagon, Calendar, ArrowRight, Edit2 } from 'lucide-react';

const CustomerDetails = ({ customer, isOpen, onClose, onEdit }) => {
    const { orders } = useOrders();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'orders', 'pending'

    if (!customer) return null;

    // Filter orders for this customer
    const customerOrders = orders.filter(o => o.CustomerId === customer.CustomerId || o.CustomerName === customer.CustomerName);
    
    // Sort orders by date desc
    customerOrders.sort((a, b) => new Date(b.BillDate) - new Date(a.BillDate));

    // Pending Orders
    const pendingOrders = customerOrders.filter(o => o.BalanceAmount > 0);

    // Stats
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.TotalAmount, 0);
    const totalPending = pendingOrders.reduce((sum, o) => sum + o.BalanceAmount, 0);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'Paid': return '#22c55e';
            case 'Partial': return '#3b82f6';
            case 'Unpaid': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const renderProfileTab = () => (
        <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-primary)' }}>Contact Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <User size={20} color="#6b7280" />
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Full Name</div>
                                <div style={{ fontWeight: 500 }}>{customer.CustomerName}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Phone size={20} color="#6b7280" />
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Phone</div>
                                <div style={{ fontWeight: 500 }}>{customer.PhoneNumber || '-'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Mail size={20} color="#6b7280" />
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Email</div>
                                <div style={{ fontWeight: 500 }}>{customer.Email || '-'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <MapPin size={20} color="#6b7280" style={{ marginTop: '2px' }} />
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Address</div>
                                <div style={{ fontWeight: 500 }}>{customer.Address || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-primary)' }}>Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="card" style={{ padding: '16px', background: '#f8fafc', border: 'none' }}>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>Total Orders</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{totalOrders}</div>
                        </div>
                        <div className="card" style={{ padding: '16px', background: '#f8fafc', border: 'none' }}>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>Total Spent</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>₹{totalSpent.toFixed(0)}</div>
                        </div>
                        <div className="card" style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '8px' }}>Pending Balance</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#dc2626' }}>₹{totalPending.toFixed(2)}</div>
                        </div>
                    </div>

                    {customer.Notes && (
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#6b7280' }}>Notes</h4>
                            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: '#92400e' }}>
                                {customer.Notes}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="primary" onClick={() => onEdit(customer)}>
                    <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Profile
                </button>
            </div>
        </div>
    );

    const renderOrdersTab = () => (
        <div>
            {customerOrders.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>No orders found for this customer.</div>
            ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Bill ID</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Amount</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Balance</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerOrders.map(order => (
                                <tr key={order.BillId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '12px' }}>{formatDate(order.BillDate)}</td>
                                    <td style={{ padding: '12px' }}>#{order.BillId}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>₹{order.TotalAmount.toFixed(2)}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: order.BalanceAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 500 }}>
                                        {order.BalanceAmount > 0 ? `₹${order.BalanceAmount.toFixed(2)}` : '-'}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ 
                                            background: getPaymentStatusColor(order.PaymentStatus),
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {order.PaymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderPendingTab = () => (
        <div>
            {pendingOrders.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#16a34a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={48} />
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>No Pending Payments!</div>
                    <div>This customer is all caught up.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     <div className="card" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#b91c1c' }}>Total Pending Amount</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>₹{totalPending.toFixed(2)}</div>
                        </div>
                        {/* Future: Add Settle All button */}
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {pendingOrders.map(order => (
                            <div key={order.BillId} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <Calendar size={14} color="#6b7280" />
                                        <span style={{ fontSize: '0.9rem', color: '#374151' }}>{formatDate(order.BillDate)}</span>
                                        <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>•</span>
                                        <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>#{order.BillId}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                        Total: ₹{order.TotalAmount.toFixed(2)} • Paid: ₹{(order.PaidAmount || 0).toFixed(2)}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '2px' }}>Balance Due</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>₹{order.BalanceAmount.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={customer.CustomerName}
            maxWidth="700px"
            footer={<button className="secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Close</button>}
        >
            <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        style={{ 
                            padding: '0 0 12px 0', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'profile' ? 'var(--color-primary)' : '#6b7280',
                            fontWeight: activeTab === 'profile' ? 600 : 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <User size={18} /> Profile
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')}
                        style={{ 
                            padding: '0 0 12px 0', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'orders' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'orders' ? 'var(--color-primary)' : '#6b7280',
                            fontWeight: activeTab === 'orders' ? 600 : 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <FileText size={18} /> Orders ({totalOrders})
                    </button>
                    <button 
                        onClick={() => setActiveTab('pending')}
                        style={{ 
                            padding: '0 0 12px 0', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'pending' ? '2px solid var(--color-danger)' : '2px solid transparent',
                            color: activeTab === 'pending' ? 'var(--color-danger)' : '#6b7280',
                            fontWeight: activeTab === 'pending' ? 600 : 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <AlertOctagon size={18} /> Pending ({pendingOrders.length})
                    </button>
                </div>
            </div>

            <div style={{ minHeight: '300px' }}>
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'orders' && renderOrdersTab()}
                {activeTab === 'pending' && renderPendingTab()}
            </div>
        </Modal>
    );
};

export default CustomerDetails;
