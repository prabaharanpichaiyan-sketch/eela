import React, { useRef } from 'react';

const LogoSVG = () => (
    <img src="/eela-logo.jpeg" alt="Eela Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
);

const Invoice = ({ order, formatCurrency = (val) => `₹${val.toFixed(2)}` }) => {
    const invoiceRef = useRef(null);
    if (!order) return null;

    // Use actual order data if available or fallback
    const invoiceNo = String(order.BillId).padStart(6, '0');
    
    const dueDateStr = new Date(order.BillDate).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });

    const subtotal = order.TotalAmount; // In existing logic, TotalAmount is base total.
    const tax = 0; // The existing CreateOrderModal doesn't calculate tax
    const totalDue = subtotal + tax;

    const handleDownloadPDF = () => {
        const content = invoiceRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${invoiceNo}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; background: #f5f5f5; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 600);
    };

    return (
        <div ref={invoiceRef} style={{
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
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', color: '#4b5563', fontSize: '1rem' }}>
                    <div style={{ marginBottom: '4px' }}>Date</div>
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
                        <button
                            onClick={handleDownloadPDF}
                            style={{
                                backgroundColor: '#263238',
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
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = 0.85}
                            onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                            className="no-print"
                        >
                            ⬇ Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
