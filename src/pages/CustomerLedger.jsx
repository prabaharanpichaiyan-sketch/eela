import React, { useState } from 'react';
import { useOrders } from '../contexts/OrdersContext';
import { useCustomers } from '../contexts/CustomersContext';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { DollarSign, Calendar, CreditCard, User, AlertCircle } from 'lucide-react';

const CustomerLedger = () => {
    const { orders, loading: ordLoading, updateOrderPayment } = useOrders();
    const { customers, loading: custLoading } = useCustomers();

    const getHeaderColor = (name) => {
        const colors = [
            { bg: '#bae6fd', text: '#0369a1' }, // Sky
            { bg: '#fbcfe8', text: '#be185d' }, // Pink
            { bg: '#bbf7d0', text: '#15803d' }, // Emerald
            { bg: '#fde68a', text: '#b45309' }, // Amber
            { bg: '#e9d5ff', text: '#7e22ce' }, // Purple
            { bg: '#fed7aa', text: '#c2410c' }  // Orange
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % (colors.length || 1)];
    };

    const [selectedBill, setSelectedBill] = useState(null);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    if (ordLoading || custLoading) return <Loader text="Loading ledger..." />;

    // Group orders by customer
    const getCustomerLedger = () => {
        const ledger = {};
        
        orders.forEach(order => {
            const key = order.CustomerId || order.CustomerName || 'Walk-in';
            if (!ledger[key]) {
                ledger[key] = {
                    customerId: order.CustomerId,
                    customerName: order.CustomerName || 'Walk-in Customer',
                    bills: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalBalance: 0
                };
            }
            
            ledger[key].bills.push(order);
            ledger[key].totalAmount += order.TotalAmount || 0;
            ledger[key].totalPaid += order.PaidAmount || 0;
            ledger[key].totalBalance += order.BalanceAmount || 0;
        });

        return Object.values(ledger).sort((a, b) => b.totalBalance - a.totalBalance);
    };

    const customerLedger = getCustomerLedger();

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
            day: 'numeric' 
        });
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
                <h1>Customer Ledger</h1>
                <p className="text-muted">Track customer bills and payments</p>
            </header>

            {customerLedger.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <AlertCircle size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }} />
                    <p className="text-muted">No bills found</p>
                </div>
            ) : (
                customerLedger.map((customer, idx) => (
                    <div key={idx} className="card" style={{ marginBottom: '24px' }}>
                        {/* Customer Header */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '16px 20px',
                            background: getHeaderColor(customer.customerName).bg,
                            color: getHeaderColor(customer.customerName).text,
                            borderBottom: '1px solid rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.4)', 
                                    color: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '1.2rem',
                                    border: '1px solid rgba(0,0,0,0.1)'
                                }}>
                                    {customer.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{customer.customerName}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                                        {customer.bills.length} bill{customer.bills.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>
                                    Balance Due
                                </div>
                                <div style={{ 
                                    fontSize: '1.4rem', 
                                    fontWeight: 800,
                                    color: customer.totalBalance > 0 ? '#ef4444' : '#16a34a',
                                    textShadow: customer.totalBalance > 0 ? '0 0 10px rgba(239,68,68,0.2)' : 'none'
                                }}>
                                    ₹{customer.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                </div>
                            </div>
                        </div>

                        {/* Bills Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Bill ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Total</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Paid</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Balance</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customer.bills.map(bill => (
                                        <tr key={bill.BillId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px', fontWeight: 500 }}>#{bill.BillId}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                                                    {formatDate(bill.BillDate)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                                ₹{bill.TotalAmount.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a' }}>
                                                ₹{(bill.PaidAmount || 0).toFixed(2)}
                                            </td>
                                            <td style={{ 
                                                padding: '12px', 
                                                textAlign: 'right', 
                                                fontWeight: 600,
                                                color: bill.BalanceAmount > 0 ? '#dc2626' : '#16a34a'
                                            }}>
                                                ₹{(bill.BalanceAmount || 0).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {bill.BalanceAmount > 0 ? (
                                                    <button
                                                        className="secondary"
                                                        onClick={() => handleOpenPaymentModal(bill)}
                                                        style={{ 
                                                            fontSize: '0.85rem', 
                                                            padding: '6px 12px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <DollarSign size={14} /> Pay
                                                    </button>
                                                ) : (
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        color: '#16a34a',
                                                        fontWeight: 600,
                                                        background: '#dcfce7',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px'
                                                    }}>
                                                        Paid
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                    min="0"
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

export default CustomerLedger;
