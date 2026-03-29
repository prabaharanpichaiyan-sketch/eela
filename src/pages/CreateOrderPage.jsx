import React, { useState } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import SearchableSelect from '../components/SearchableSelect';
import { useInventory } from '../contexts/InventoryContext';
import { useOrders } from '../contexts/OrdersContext';
import { useCustomers } from '../contexts/CustomersContext';
import Modal from '../components/Modal';
import { Plus, Minus, AlertOctagon, Trash2, Calendar, Search, Receipt, ArrowLeft, UserPlus, User, Phone, Mail, MapPin } from 'lucide-react';

const CreateOrderPage = ({ onBack }) => {
    const { products } = useProducts();
    const { inventory, checkStock } = useInventory();
    const { addOrder } = useOrders();
    const { customers, addCustomer } = useCustomers();

    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Payment State
    const [paymentType, setPaymentType] = useState('Cash');
    const [paidAmount, setPaidAmount] = useState('');

    // Custom Item State
    const [showCustomItem, setShowCustomItem] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');

    // Product dropdown state
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedProductQty, setSelectedProductQty] = useState(1);

    // Item picker modal state
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);

    // Add Customer Modal State
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ CustomerName: '', PhoneNumber: '', Email: '', Address: '', Notes: '' });

    const handleSaveNewCustomer = () => {
        if (!newCustomerData.CustomerName.trim()) return;
        addCustomer(newCustomerData);
        // Auto-select the new customer in the order
        setCustomerName(newCustomerData.CustomerName);
        // Reset form and close
        setNewCustomerData({ CustomerName: '', PhoneNumber: '', Email: '', Address: '', Notes: '' });
        setIsAddCustomerOpen(false);
    };

    // ── Cart helpers ────────────────────────────────────────────────
    const getCommittedInventory = () => {
        const committed = {};
        cart.forEach(item => {
            if (item.product.ingredients) {
                item.product.ingredients.forEach(ing => {
                    committed[ing.InventoryId] = (committed[ing.InventoryId] || 0) + (ing.QuantityRequired * item.qty);
                });
            }
        });
        return committed;
    };

    const getMaxAddable = (product) => {
        const committed = getCommittedInventory();
        let maxCanMake = Infinity;
        if (!product.ingredients || product.ingredients.length === 0) return 999;
        product.ingredients.forEach(ing => {
            const invItem = inventory.find(i => i.InventoryId === ing.InventoryId);
            if (!invItem) { maxCanMake = 0; return; }
            const used = committed[ing.InventoryId] || 0;
            const remaining = Math.max(0, invItem.QuantityAvailable - used);
            const canMake = Math.floor(remaining / ing.QuantityRequired);
            if (canMake < maxCanMake) maxCanMake = canMake;
        });
        return maxCanMake;
    };

    const addToCart = (product) => {
        if (getMaxAddable(product) <= 0) return;
        setCart(prev => {
            const existing = prev.find(i => i.product.ProductId === product.ProductId);
            if (existing) return prev.map(i => i.product.ProductId === product.ProductId ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { product, qty: 1 }];
        });
    };

    const updateQty = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.product.ProductId !== productId) return item;
            if (delta > 0 && getMaxAddable(item.product) < 1) return item;
            const newQty = item.qty + delta;
            if (newQty < 1) return item;
            return { ...item, qty: newQty };
        }));
    };

    const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product.ProductId !== productId));

    const calculateTotal = () => cart.reduce((sum, item) => sum + (item.product.SellingPrice * item.qty), 0);

    // ── Handlers ────────────────────────────────────────────────────
    const handleAddCustomItem = () => {
        if (!customItemName || !customItemPrice || parseFloat(customItemPrice) <= 0) return;
        addToCart({
            ProductId: `custom-${Date.now()}`,
            ProductName: customItemName,
            SellingPrice: parseFloat(customItemPrice),
            IsActive: true,
            isCustom: true,
            ingredients: []
        });
        setCustomItemName('');
        setCustomItemPrice('');
    };

    const handleCreateOrder = () => {
        if (cart.length === 0) return;
        setErrorMessage('');

        const requiredIngredients = [];
        cart.forEach(cartItem => {
            if (cartItem.product.isCustom) return;
            if (cartItem.product.ingredients) {
                cartItem.product.ingredients.forEach(ing => {
                    const existing = requiredIngredients.find(r => r.InventoryId === ing.InventoryId);
                    if (existing) existing.QuantityRequired += ing.QuantityRequired * cartItem.qty;
                    else requiredIngredients.push({ InventoryId: ing.InventoryId, QuantityRequired: ing.QuantityRequired * cartItem.qty });
                });
            }
        });

        const stockCheck = checkStock(requiredIngredients);
        if (!stockCheck.sufficient) {
            setErrorMessage(`Insufficient stock: ${stockCheck.missing.map(m => m.name).join(', ')}`);
            return;
        }

        let billDateIso = new Date().toISOString();
        if (orderDate) {
            const [y, m, d] = orderDate.split('-').map(Number);
            const billDateObj = new Date(y, m - 1, d);
            const now = new Date();
            if (now.getFullYear() === y && now.getMonth() === m - 1 && now.getDate() === d) {
                billDateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                billDateObj.setHours(12, 0, 0);
            }
            billDateIso = billDateObj.toISOString();
        }

        addOrder({
            CustomerName: customerName.trim() || 'Walk-in Customer',
            CustomerId: selectedCustomerId,
            BillDate: billDateIso,
            TotalAmount: calculateTotal(),
            PaymentType: paymentType,
            PaidAmount: parseFloat(paidAmount) || 0,
            items: cart.map(c => ({
                ProductId: c.product.ProductId,
                Quantity: c.qty,
                Price: c.product.SellingPrice,
                ProductName: c.product.ProductName
            }))
        }, requiredIngredients);

        setSuccessMessage('Order created successfully!');
        setTimeout(() => { onBack(); }, 1200);
    };

    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;
    const balance = total - paid;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

            {/* ── Top bar ── */}
            <header style={{
                background: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.95rem', padding: '6px 0' }}
                    >
                        <ArrowLeft size={18} /> Back to Orders
                    </button>
                    <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />
                    <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Create New Order</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total: ₹{total.toFixed(2)}</span>
                    <button className="secondary" onClick={onBack}>Cancel</button>
                    <button
                        className="primary"
                        onClick={handleCreateOrder}
                        disabled={cart.length === 0}
                    >
                        Create Order
                    </button>
                </div>
            </header>

            {/* ── Page body ── */}
            <div style={{ flex: 1, padding: '24px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

                {errorMessage && (
                    <div style={{ background: '#f8d7da', color: '#721c24', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <AlertOctagon size={20} /> {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div style={{ background: '#d4edda', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                        ✓ {successMessage}
                    </div>
                )}

                {/* Order Date + Customer — aligned grid */}
                <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 380px auto', gap: '16px', alignItems: 'start' }}>

                        {/* Order Date */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>Order Date</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={e => setOrderDate(e.target.value)}
                                    style={{ width: '100%', padding: '9px 10px 9px 34px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* Customer Name */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>Customer Name</label>
                            <SearchableSelect
                                placeholder="Search or Enter Name"
                                value={customerName}
                                onChange={val => {
                                    setCustomerName(val);
                                    const found = customers.find(c => c.CustomerName === val);
                                    setSelectedCustomerId(found ? found.CustomerId : null);
                                }}
                                onSearchChange={val => { setCustomerName(val); setSelectedCustomerId(null); }}
                                options={customers.filter(c => c.IsActive !== false).map(c => ({ value: c.CustomerName, label: c.CustomerName, subLabel: c.PhoneNumber }))}
                                renderOption={opt => (
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opt.subLabel}</div>
                                    </div>
                                )}
                                icon={Search}
                            />
                        </div>

                        {/* New Customer button */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', visibility: 'hidden', fontSize: '0.875rem' }}>_</label>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => { setNewCustomerData({ CustomerName: '', PhoneNumber: '', Email: '', Address: '', Notes: '' }); setIsAddCustomerOpen(true); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', height: '40px', padding: '0 14px' }}
                                title="Add New Customer"
                            >
                                <UserPlus size={15} /> New Customer
                            </button>
                        </div>

                    </div>
                </div>

                {/* ── Action Buttons ── */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <button
                        className="primary"
                        style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                        onClick={() => { setSelectedProductId(''); setSelectedProductQty(1); setIsAddProductOpen(true); }}
                    >
                        <Plus size={16} /> Select Product
                    </button>
                    <button
                        className="secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                        onClick={() => { setCustomItemName(''); setCustomItemPrice(''); setIsAddCustomOpen(true); }}
                    >
                        <Plus size={16} /> Add Custom Item
                    </button>
                </div>

                {/* ── Main layout: Order Items (wide) + Payment ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

                    {/* Order Items — wide */}
                    <div className="card" style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Order Items ({cart.length})</h3>
                        {cart.length === 0 ? (
                            <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px', fontStyle: 'italic' }}>
                                No items added yet. Click <strong>Select Product</strong> or <strong>Add Custom Item</strong> to get started.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Item</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Unit Price</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)' }}>Qty</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Subtotal</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.product.ProductId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {item.product.image ? (
                                                        <img src={item.product.image} alt={item.product.ProductName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>
                                                            {item.product.ProductName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span style={{ fontWeight: 500 }}>{item.product.ProductName}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>₹{item.product.SellingPrice.toFixed(2)}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f9fafb', padding: '2px 6px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                    <button onClick={() => { if (item.qty > 1) updateQty(item.product.ProductId, -1); else removeFromCart(item.product.ProductId); }} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#374151' }}><Minus size={13} /></button>
                                                    <span style={{ minWidth: '22px', textAlign: 'center', fontWeight: 600 }}>{item.qty}</span>
                                                    <button onClick={() => updateQty(item.product.ProductId, 1)} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#374151' }}><Plus size={13} /></button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>₹{(item.product.SellingPrice * item.qty).toFixed(2)}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button onClick={() => removeFromCart(item.product.ProductId)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex' }}><Trash2 size={15} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot style={{ borderTop: '2px solid #e5e7eb' }}>
                                    <tr>
                                        <td colSpan="3" style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Total</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹{total.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>

                    {/* Payment Details */}
                    <div className="card" style={{ padding: '20px', background: '#f8f9fa', position: 'sticky', top: '80px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={16} /> Payment Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Amount</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{total.toFixed(2)}</span>
                            </div>
                            <div>
                                <SearchableSelect
                                    label="Payment Type"
                                    value={paymentType}
                                    onChange={setPaymentType}
                                    options={['Cash', 'UPI', 'Bank Transfer']}
                                    icon={Receipt}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Paid Amount (₹)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }}>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0.00"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value)}
                                        style={{ width: '100%', padding: '10px 10px 10px 28px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Balance</span>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: balance <= 0 ? '#16a34a' : '#ef4444' }}>
                                    ₹{Math.max(0, balance).toFixed(2)}
                                    {balance < 0 && <span style={{ fontSize: '0.75rem', marginLeft: '6px' }}>(Change: ₹{Math.abs(balance).toFixed(2)})</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Add Product Modal ── */}
                <Modal
                    isOpen={isAddProductOpen}
                    onClose={() => setIsAddProductOpen(false)}
                    title="Select Product"
                    maxWidth="680px"
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Qty:</span>
                                <input
                                    type="number" min="1"
                                    value={selectedProductQty}
                                    onChange={e => setSelectedProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                                    style={{ width: '70px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="secondary" onClick={() => setIsAddProductOpen(false)}>Cancel</button>
                                <button
                                    className="primary"
                                    disabled={!selectedProductId}
                                    onClick={() => {
                                        const product = products.find(p => p.ProductId == selectedProductId);
                                        if (!product) return;
                                        const max = getMaxAddable(product);
                                        if (max <= 0) return;
                                        for (let i = 0; i < selectedProductQty; i++) addToCart(product);
                                        setSelectedProductId('');
                                        setSelectedProductQty(1);
                                        setIsAddProductOpen(false);
                                    }}
                                >
                                    Add to Order
                                </button>
                            </div>
                        </div>
                    }
                >
                    {/* Search bar */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            placeholder="Search products..."
                            value={selectedProductId ? '' : undefined}
                            onChange={e => {
                                // filter handled inline below
                                setSelectedProductId('');
                            }}
                            id="product-search-input"
                            style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    {/* Product grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', maxHeight: '380px', overflowY: 'auto', padding: '4px' }}>
                        {products
                            .filter(p => p.IsActive !== false)
                            .map(p => {
                                const max = getMaxAddable(p);
                                const isSelected = selectedProductId == p.ProductId;
                                const outOfStock = max <= 0;
                                return (
                                    <div
                                        key={p.ProductId}
                                        onClick={() => { if (!outOfStock) setSelectedProductId(p.ProductId); }}
                                        style={{
                                            borderRadius: '12px',
                                            border: isSelected ? '2px solid var(--color-primary)' : '2px solid #e5e7eb',
                                            background: isSelected ? 'var(--color-primary)10' : 'white',
                                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                                            opacity: outOfStock ? 0.5 : 1,
                                            overflow: 'hidden',
                                            transition: 'all 0.15s',
                                            boxShadow: isSelected ? '0 0 0 3px rgba(var(--color-primary-rgb, 139,0,45),0.15)' : 'none'
                                        }}
                                    >
                                        {/* Image or gradient */}
                                        {p.image ? (
                                            <img src={p.image} alt={p.ProductName}
                                                style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />
                                        ) : (
                                            <div style={{
                                                height: '90px',
                                                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '2rem', fontWeight: 700, color: '#059669'
                                            }}>
                                                {p.ProductName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ padding: '8px 10px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ProductName}</div>
                                            <div style={{ fontSize: '0.78rem', color: isSelected ? 'var(--color-primary)' : '#6b7280', fontWeight: isSelected ? 700 : 400 }}>
                                                ₹{p.SellingPrice?.toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: outOfStock ? '#ef4444' : '#16a34a', marginTop: '2px' }}>
                                                {outOfStock ? 'Out of stock' : max > 100 ? 'In stock' : `${max} left`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </Modal>

                {/* ── Add Custom Item Modal ── */}
                <Modal
                    isOpen={isAddCustomOpen}
                    onClose={() => setIsAddCustomOpen(false)}
                    title="Add Custom Item"
                    maxWidth="440px"
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
                            <button className="secondary" onClick={() => setIsAddCustomOpen(false)}>Cancel</button>
                            <button
                                className="primary"
                                disabled={!customItemName || !customItemPrice || parseFloat(customItemPrice) <= 0}
                                onClick={() => { handleAddCustomItem(); setIsAddCustomOpen(false); }}
                            >
                                Add to Order
                            </button>
                        </div>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Item Name *</label>
                            <input
                                autoFocus
                                placeholder="e.g. Special Cake"
                                value={customItemName}
                                onChange={e => setCustomItemName(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Price (₹) *</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }}>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={customItemPrice}
                                    onChange={e => setCustomItemPrice(e.target.value)}
                                    style={{ width: '100%', padding: '10px 10px 10px 26px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                    </div>
                </Modal>

            </div>

            {/* ── Add New Customer Modal ── */}
            <Modal
                isOpen={isAddCustomerOpen}
                onClose={() => setIsAddCustomerOpen(false)}
                title="Add New Customer"
                maxWidth="500px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
                        <button className="secondary" onClick={() => setIsAddCustomerOpen(false)}>Cancel</button>
                        <button className="primary" onClick={handleSaveNewCustomer} disabled={!newCustomerData.CustomerName.trim()}>Add Customer</button>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name *</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                value={newCustomerData.CustomerName}
                                onChange={e => setNewCustomerData({ ...newCustomerData, CustomerName: e.target.value })}
                                placeholder="Customer Name"
                                autoFocus
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                value={newCustomerData.PhoneNumber}
                                onChange={e => setNewCustomerData({ ...newCustomerData, PhoneNumber: e.target.value })}
                                placeholder="Phone Number"
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                value={newCustomerData.Email}
                                onChange={e => setNewCustomerData({ ...newCustomerData, Email: e.target.value })}
                                placeholder="Email Address"
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Address</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <textarea
                                value={newCustomerData.Address}
                                onChange={e => setNewCustomerData({ ...newCustomerData, Address: e.target.value })}
                                placeholder="Delivery Address"
                                rows="2"
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Notes</label>
                        <textarea
                            value={newCustomerData.Notes}
                            onChange={e => setNewCustomerData({ ...newCustomerData, Notes: e.target.value })}
                            placeholder="Additional Notes"
                            rows="2"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CreateOrderPage;
