import React from 'react';

const LogoSVG = () => (
    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" stroke="#1f2937" strokeWidth="2" fill="none"/>
        <circle cx="50" cy="30" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="50" cy="70" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="30" cy="50" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="70" cy="50" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="35" cy="35" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="65" cy="65" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="65" cy="35" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
        <circle cx="35" cy="65" r="28" stroke="#1f2937" strokeWidth="1.5" fill="none"/>
    </svg>
);

const Invoice = ({ order, formatCurrency = (val) => `₹${val.toFixed(2)}` }) => {
    if (!order) return null;

    // Use actual order data if available or fallback
    const invoiceNo = String(order.BillId).padStart(6, '0');
    
    let badgeColor = '#1f2937'; // Dark default (e.g., Pending)
    let badgeText = order.PaymentStatus || 'Pending';
    if (order.PaymentStatus === 'Paid') {
        badgeColor = '#10B981'; // Green for paid
    } else if (order.PaymentStatus === 'Unpaid') {
        badgeColor = '#1f2937'; // Or red
    }

    const dueDateStr = new Date(order.BillDate).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    const subtotal = order.TotalAmount; // In existing logic, TotalAmount is base total.
    const tax = 0; // The existing CreateOrderModal doesn't calculate tax
    const totalDue = subtotal + tax;

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            backgroundColor: '#f5f5f5',
            color: '#1f2937',
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            minHeight: '800px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <LogoSVG />
                    <div>
                        <h1 style={{ fontSize: '3rem', margin: '0 0 8px 0', fontWeight: '400', letterSpacing: '-0.03em' }}>Invoice</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', color: '#6b7280' }}>
                            <span>NO. #{invoiceNo}</span>
                            <span style={{
                                backgroundColor: badgeColor,
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>
                                {badgeText}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', color: '#4b5563', fontSize: '1rem' }}>
                    <div style={{ marginBottom: '4px' }}>Due Date</div>
                    <div style={{ color: '#1f2937' }}>{dueDateStr}</div>
                </div>
            </div>

            {/* Billed To section */}
            <div style={{ marginBottom: '60px' }}>
                <div style={{ color: '#1f2937', fontSize: '1.1rem', marginBottom: '8px' }}>Billed to</div>
                <div style={{ color: '#4b5563', fontSize: '1rem', lineHeight: '1.6' }}>
                    {order.CustomerName !== 'Walk-in Customer' ? (
                        <>
                            <div>{order.CustomerName}</div>
                            {/* Assumed available fields; using placeholders if missing */}
                            <div style={{ color: '#6b7280' }}>{order.CustomerEmail || 'customer@example.com'}</div>
                        </>
                    ) : (
                        <div>Walk-in Customer</div>
                    )}
                </div>
            </div>

            {/* Table section */}
            <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', color: '#6b7280', fontWeight: '400', paddingBottom: '16px', borderBottom: '1px dashed #d1d5db', width: '50%' }}>Description</th>
                            <th style={{ textAlign: 'right', color: '#6b7280', fontWeight: '400', paddingBottom: '16px', borderBottom: '1px dashed #d1d5db' }}>Qty</th>
                            <th style={{ textAlign: 'right', color: '#6b7280', fontWeight: '400', paddingBottom: '16px', borderBottom: '1px dashed #d1d5db' }}>Rate</th>
                            <th style={{ textAlign: 'right', color: '#6b7280', fontWeight: '400', paddingBottom: '16px', borderBottom: '1px dashed #d1d5db' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items && order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ padding: '24px 0', borderBottom: '1px dashed #d1d5db', color: '#374151' }}>{item.ProductName || 'Item'}</td>
                                <td style={{ padding: '24px 0', borderBottom: '1px dashed #d1d5db', textAlign: 'right', color: '#374151' }}>{item.Quantity}</td>
                                <td style={{ padding: '24px 0', borderBottom: '1px dashed #d1d5db', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.Price)}</td>
                                <td style={{ padding: '24px 0', borderBottom: '1px dashed #d1d5db', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.Quantity * item.Price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '8px' }}>TOTAL DUE</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '500', color: '#1f2937', letterSpacing: '-0.02em', lineHeight: 1 }}>
                        {formatCurrency(totalDue)}
                    </div>
                </div>

                <div style={{ minWidth: '250px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.1rem' }}>
                        <span style={{ color: '#1f2937' }}>Subtotal</span>
                        <span style={{ color: '#4b5563' }}>{formatCurrency(subtotal)}</span>
                    </div>
                    {tax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '1.1rem' }}>
                            <span style={{ color: '#1f2937' }}>Tax</span>
                            <span style={{ color: '#4b5563' }}>+{formatCurrency(tax)}</span>
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: tax > 0 ? 0 : '32px' }}>
                        <button style={{
                            backgroundColor: '#263238', // Dark slate color from image
                            color: 'white',
                            border: 'none',
                            padding: '16px',
                            fontWeight: '500',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = 0.9}
                        onMouseOut={(e) => e.target.style.opacity = 1}
                        >
                            Download PDF
                        </button>
                        <button style={{
                            backgroundColor: 'transparent',
                            color: '#1f2937',
                            border: '1px solid #d1d5db',
                            padding: '16px',
                            fontWeight: '500',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            Send Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
