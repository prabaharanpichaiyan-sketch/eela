import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import { useInventory } from '../contexts/InventoryContext';
import { useOrders } from '../contexts/OrdersContext';
import { useCustomers } from '../contexts/CustomersContext';
import SearchableSelect from '../components/SearchableSelect';
import Loader from '../components/Loader';
import { Plus, Minus, CheckCircle, AlertOctagon, ShoppingCart, Search, User, MapPin, Phone, Receipt } from 'lucide-react';

const Billing = () => {
    const { products, loading: prodLoading } = useProducts();
    const { inventory, checkStock, loading: invLoading } = useInventory();
    const { addOrder, orders, loading: ordLoading } = useOrders(); // Need orders to calc outstanding
    const { customers, loading: custLoading } = useCustomers();

    if (prodLoading || invLoading || ordLoading || custLoading) return <Loader text="Loading billing data..." fullScreen />;

    const [cart, setCart] = useState([]);
    
    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    // const [showCustomerDropdown, setShowCustomerDropdown] = useState(false); // Removed
    // const customerInputRef = useRef(null); // Removed

    // Payment State
    const [paymentType, setPaymentType] = useState('Cash');
    const [paidAmount, setPaidAmount] = useState('');

    const [checkoutStatus, setCheckoutStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Update Paid Amount default when cart changes
    useEffect(() => {
        const total = cart.reduce((sum, item) => sum + (item.product.SellingPrice * item.qty), 0);
        if (total > 0 && !paidAmount) {
             setPaidAmount(total.toFixed(2));
        } else if (total === 0) {
            setPaidAmount('');
        }
    }, [cart]);

    // Calculate Outstanding Balance for Selected Customer
    const getOutstandingBalance = () => {
        if (!selectedCustomerId && !customerName) return 0;
        
        // Filter orders for this customer
        const customerOrders = orders.filter(o => 
            (selectedCustomerId && o.CustomerId === selectedCustomerId) || 
            (!selectedCustomerId && o.CustomerName.toLowerCase() === customerName.toLowerCase())
        );
        
        return customerOrders.reduce((sum, o) => sum + (o.BalanceAmount || 0), 0);
    };

    const selectedCustomerDetails = customers.find(c => c.CustomerId === selectedCustomerId);

    // 1. Calculate committed inventory from cart
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

    // 2. Helper to get max addable quantity for a product
    const getMaxAddable = (product) => {
        const committed = getCommittedInventory();
        let maxCanMake = Infinity;

        if (!product.ingredients || product.ingredients.length === 0) return 999;

        product.ingredients.forEach(ing => {
            const invItem = inventory.find(i => i.InventoryId === ing.InventoryId);
            if (!invItem) {
                maxCanMake = 0;
                return;
            }
            // Stock available AFTER considering what's already in cart
            const used = committed[ing.InventoryId] || 0;
            const remaining = Math.max(0, invItem.QuantityAvailable - used);
            const canMakeFromIng = Math.floor(remaining / ing.QuantityRequired);

            if (canMakeFromIng < maxCanMake) {
                maxCanMake = canMakeFromIng;
            }
        });

        return maxCanMake;
    };

    const addToCart = (product) => {
        const max = getMaxAddable(product);
        if (max <= 0) return;

        setCart(prev => {
            const existing = prev.find(item => item.product.ProductId === product.ProductId);
            if (existing) {
                return prev.map(item => item.product.ProductId === product.ProductId ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const updateQty = (productId, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product.ProductId === productId) {
                    if (delta > 0) {
                        const maxAddable = getMaxAddable(item.product);
                        if (maxAddable < 1) return item; 
                    }

                    const newQty = item.qty + delta;
                    if (newQty < 1) return item; 
                    return { ...item, qty: newQty };
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product.ProductId !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.product.SellingPrice * item.qty), 0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;

        // Final Validation just in case
        const requiredIngredients = [];
        cart.forEach(cartItem => {
            if (cartItem.product.ingredients) {
                cartItem.product.ingredients.forEach(ing => {
                    const existing = requiredIngredients.find(r => r.InventoryId === ing.InventoryId);
                    if (existing) {
                        existing.QuantityRequired += ing.QuantityRequired * cartItem.qty;
                    } else {
                        requiredIngredients.push({ InventoryId: ing.InventoryId, QuantityRequired: ing.QuantityRequired * cartItem.qty });
                    }
                });
            }
        });

        const stockCheck = checkStock(requiredIngredients);
        if (!stockCheck.valid) {
            setErrorMessage(`Stock changed! Insufficient: ${stockCheck.missing.map(m => m.name).join(', ')}`);
            setCheckoutStatus('error');
            return;
        }

        addOrder({
            CustomerName: customerName.trim() || 'Walk-in Customer',
            CustomerId: selectedCustomerId,
            TotalAmount: calculateTotal(),
            PaymentType: paymentType,
            PaidAmount: parseFloat(paidAmount) || 0,
            items: cart.map(c => ({
                ProductId: c.product.ProductId,
                Quantity: c.qty,
                Price: c.product.SellingPrice
            }))
        }, requiredIngredients);

        setCart([]);
        setCustomerName('');
        setSelectedCustomerId(null);
        setPaymentType('Cash');
        setPaidAmount('');
        setCheckoutStatus('success');
        setTimeout(() => setCheckoutStatus(null), 3000);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '120px' }}>
            <header className="mb-6">
                <h1>New Order</h1>
            </header>

            {checkoutStatus === 'success' && (
                <div className="card animate-fade-in" style={{ background: '#d4edda', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <CheckCircle size={20} /> Order Placed Successfully!
                </div>
            )}

            {checkoutStatus === 'error' && (
                <div className="card animate-fade-in" style={{ background: '#f8d7da', color: '#721c24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertOctagon size={20} /> {errorMessage}
                </div>
            )}

            {/* Customer Selection */}
            <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ position: 'relative', marginBottom: selectedCustomerDetails ? '16px' : '0' }}>
                    <SearchableSelect
                        label="Customer Name"
                        placeholder="Search or Enter Name (e.g. Walk-in)"
                        value={customerName}
                        onChange={(val) => {
                            setCustomerName(val);
                            // Try to find existing customer ID
                            const found = customers.find(c => c.CustomerName === val);
                            if (found) setSelectedCustomerId(found.CustomerId);
                            else setSelectedCustomerId(null);
                        }}
                        onSearchChange={(val) => {
                            setCustomerName(val);
                            setSelectedCustomerId(null);
                        }}
                        options={customers
                            .filter(c => c.IsActive !== false)
                            .map(c => ({ 
                                value: c.CustomerName, 
                                label: c.CustomerName, 
                                subLabel: c.PhoneNumber 
                            }))}
                        renderOption={(opt) => (
                             <div>
                                <div style={{ fontWeight: 500 }}>{opt.label}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opt.subLabel}</div>
                            </div>
                        )}
                        icon={Search}
                    />
                </div>

                {/* Customer Details Display */}
                {selectedCustomerDetails && (
                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: '#4b5563', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                        {selectedCustomerDetails.PhoneNumber && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={14} /> {selectedCustomerDetails.PhoneNumber}
                            </div>
                        )}
                        {selectedCustomerDetails.Address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} /> {selectedCustomerDetails.Address}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', color: '#dc2626', fontWeight: 600 }}>
                            Outstanding: ₹{getOutstandingBalance().toFixed(2)}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {products.filter(p => p.IsActive !== false).map(product => {
                    const maxAddable = getMaxAddable(product);
                    const isOutOfStock = maxAddable <= 0;
                    const inCart = cart.find(c => c.product.ProductId === product.ProductId);

                    return (
                        <button
                            key={product.ProductId}
                            className="card"
                            disabled={isOutOfStock}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px',
                                textAlign: 'center',
                                border: isOutOfStock ? '1px solid #eee' : '1px solid var(--color-primary)',
                                opacity: isOutOfStock ? 0.6 : 1,
                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                background: inCart ? '#f0f9ff' : 'white'
                            }}
                            onClick={() => addToCart(product)}
                        >
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '1.1rem' }}>{product.ProductName}</div>
                            <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.2rem' }}>₹{product.SellingPrice ? product.SellingPrice.toFixed(2) : '0.00'}</div>

                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: isOutOfStock ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                {isOutOfStock ? 'Out of Stock' : `Max: ${maxAddable}`}
                            </div>
                        </button>
                    );
                })}
            </div>

            {cart.length > 0 && (
                <div className="card" style={{
                    position: 'fixed',
                    bottom: '0', // Full width bottom sheet style
                    left: '0',
                    right: '0',
                    margin: '0',
                    borderRadius: '24px 24px 0 0',
                    boxShadow: '0 -8px 20px rgba(0,0,0,0.15)',
                    zIndex: 90,
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: '20px'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShoppingCart size={20} /> Checkout
                        </h3>
                         <button className="secondary" onClick={() => setCart([])} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                            Clear
                        </button>
                    </div>

                    <div style={{ overflowY: 'auto', padding: '16px', flex: 1 }}>
                        <div style={{ marginBottom: '16px' }}>
                        {cart.map(item => (
                            <div key={item.product.ProductId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{item.product.ProductName}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>₹{item.product.SellingPrice.toFixed(2)} x {item.qty}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f9fa', padding: '4px', borderRadius: '8px' }}>
                                    <button className="btn-icon" onClick={() => {
                                        if (item.qty > 1) updateQty(item.product.ProductId, -1);
                                        else removeFromCart(item.product.ProductId);
                                    }}><Minus size={16} /></button>

                                    <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>

                                    <button className="btn-icon" onClick={() => updateQty(item.product.ProductId, 1)}><Plus size={16} /></button>
                                </div>
                            </div>
                        ))}
                        </div>

                        {/* Payment Details in Bottom Sheet */}
                        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
                             <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Receipt size={16} /> Payment
                             </h4>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>Total</label>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{calculateTotal().toFixed(2)}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>Balance</label>
                                    {(() => {
                                        const total = calculateTotal();
                                        const paid = parseFloat(paidAmount) || 0;
                                        const balance = total - paid;
                                        return (
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: balance <= 0 ? '#16a34a' : '#ef4444' }}>
                                                ₹{Math.max(0, balance).toFixed(2)}
                                            </div>
                                        );
                                    })()}
                                </div>
                             </div>

                             <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '4px' }}>
                                        <SearchableSelect
                                            label="Type"
                                            value={paymentType}
                                            onChange={setPaymentType}
                                            options={['Cash', 'UPI', 'Card']}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Paid</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        placeholder="Amount"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
                        <button className="primary" style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }} onClick={handleCheckout}>
                            Checkout & Pay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
