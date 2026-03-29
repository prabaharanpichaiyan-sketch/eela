import React, { useState, useEffect, useRef } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import SearchableSelect from './SearchableSelect';
import { useInventory } from '../contexts/InventoryContext';
import { useOrders } from '../contexts/OrdersContext';
import { useCustomers } from '../contexts/CustomersContext';
import Modal from './Modal';
import { Plus, Minus, CheckCircle, AlertOctagon, ShoppingCart, Trash2, Calendar, Search, Receipt } from 'lucide-react';

const CreateOrderModal = ({ isOpen, onClose }) => {
    const { products } = useProducts();
    const { inventory, checkStock } = useInventory();
    const { addOrder } = useOrders();
    const { customers } = useCustomers();

    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [errorMessage, setErrorMessage] = useState('');
    
    // Payment State
    const [paymentType, setPaymentType] = useState('Cash');
    const [paidAmount, setPaidAmount] = useState('');

    // Customer Selection State
    // const [showCustomerDropdown, setShowCustomerDropdown] = useState(false); // Removed
    // const customerInputRef = useRef(null); // Removed

    // Custom Item State
    const [showCustomItem, setShowCustomItem] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    
    // Product Search State
    const [productSearch, setProductSearch] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCart([]);
            setCustomerName('');
            setSelectedCustomerId(null);
            setOrderDate(new Date().toLocaleDateString('en-CA'));
            setErrorMessage('');
            setPaymentType('Cash');
            setPaidAmount('');
            setShowCustomItem(false);
            setCustomItemName('');
            setCustomItemPrice('');
            setProductSearch('');
            setCustomItemName('');
            setCustomItemPrice('');
            setProductSearch('');
            // setShowCustomerDropdown(false);
        }
    }, [isOpen]);



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

    const handleCreateOrder = () => {
        if (cart.length === 0) return;

        // Final Validation
        const requiredIngredients = [];
        cart.forEach(cartItem => {
             // Skip custom items (no ingredients)
             if (cartItem.product.isCustom) return;

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
        if (!stockCheck.sufficient) {
            setErrorMessage(`Insufficient stock: ${stockCheck.missing.map(m => m.name).join(', ')}`);
            return;
        }

        let billDateIso = new Date().toISOString();
        if (orderDate) {
            const [y, m, d] = orderDate.split('-').map(Number);
            const billDateObj = new Date(y, m - 1, d);
            const now = new Date();
            // If selected date is today, use current time. Else use noon to avoid weird timezone shifts on display.
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
                ProductName: c.product.ProductName // Store name for custom items
            }))
        }, requiredIngredients);

        onClose();
    };

    const handleAddCustomItem = () => {
        if (!customItemName || !customItemPrice || parseFloat(customItemPrice) <= 0) return;

        const customProduct = {
            ProductId: `custom-${Date.now()}`,
            ProductName: customItemName,
            SellingPrice: parseFloat(customItemPrice),
            IsActive: true,
            isCustom: true,
            ingredients: [] // No ingredients for custom items
        };

        addToCart(customProduct);
        setCustomItemName('');
        setCustomItemPrice('');
        // Optional: keep form open or close it? Let's keep it open for multiple additions
    };

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                Total: ₹{calculateTotal().toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="secondary" onClick={onClose}>Cancel</button>
                <button className="primary" onClick={handleCreateOrder} disabled={cart.length === 0}>
                    Create Order
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Order"
            footer={footer}
            zIndex={1100} // Higher than other modals if needed
            maxWidth="900px"
            closeOnOverlayClick={false}
        >
            <div className="create-order-modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {errorMessage && (
                    <div className="card" style={{ background: '#f8d7da', color: '#721c24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '12px' }}>
                        <AlertOctagon size={20} /> {errorMessage}
                    </div>
                )}

                <div className="create-order-header" style={{ marginBottom: '24px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Order Date</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }} />
                            <input
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ flex: 2 }}>
                        <SearchableSelect
                            label="Customer Name"
                            placeholder="Search or Enter Name"
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
                </div>

                <div className="create-order-layout">
                    {/* Product List */}
                    <div className="create-order-products">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '1rem', margin: 0 }}>Select Items</h3>
                            <button
                                className="secondary"
                                onClick={() => setShowCustomItem(!showCustomItem)}
                                style={{ fontSize: '0.85rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Plus size={16} /> {showCustomItem ? 'Hide Custom Item' : 'Add Custom Item'}
                            </button>
                        </div>

                        {/* Product Search Box */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {showCustomItem && (
                            <div className="card" style={{ padding: '16px', marginBottom: '16px', background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 4 }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Item Name</label>
                                        <input
                                            placeholder="e.g. Special Cake"
                                            value={customItemName}
                                            onChange={e => setCustomItemName(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Price (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0.00"
                                            value={customItemPrice}
                                            onChange={e => setCustomItemPrice(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <button
                                        className="primary"
                                        onClick={handleAddCustomItem}
                                        disabled={!customItemName || !customItemPrice || parseFloat(customItemPrice) <= 0}
                                        style={{ height: '38px', padding: '0 20px', whiteSpace: 'nowrap', width: 'auto', flex: '0 0 auto' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Item Name</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Price</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)' }}>Stock</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text-muted)' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                <div style={{ marginBottom: '12px' }}>No products found in database.</div>
                                                <button 
                                                    className="secondary" 
                                                    onClick={() => setShowCustomItem(true)}
                                                    style={{ fontSize: '0.9rem' }}
                                                >
                                                    <Plus size={16} style={{ marginRight: '6px' }} /> Add Custom Item manually
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        products
                                            .filter(product => 
                                                product.IsActive !== false &&
                                                product.ProductName.toLowerCase().includes(productSearch.toLowerCase())
                                            )
                                            .map(product => {
                                            const isActive = product.IsActive !== false; // Default to true if undefined
                                            if (!isActive) {
                                                // Optional: decide if we want to show inactive items or not. 
                                                // For debugging, let's show them but marked inactive.
                                            }

                                            const maxAddable = getMaxAddable(product);
                                            // Out of stock if maxAddable <= 0 (and strict stock check enabled? dependent on ingredients)
                                            // Logic: If no ingredients, maxAddable is 999. If ingredients, calculated.
                                            const isOutOfStock = maxAddable <= 0; 
                                            const inCart = cart.find(c => c.product.ProductId === product.ProductId);
                                            
                                            // If strict active check is desired, we can return null here, but user says "cannot select".
                                            // Let's show everything so they can see what's wrong.
                                            
                                            return (
                                                <tr key={product.ProductId} style={{ borderBottom: '1px solid #f3f4f6', background: inCart ? '#f0f9ff' : (isActive ? 'transparent' : '#f9fafb'), opacity: isActive ? 1 : 0.6 }}>
                                                    <td style={{ padding: '12px', fontWeight: 500 }}>
                                                        {product.ProductName}
                                                        {!isActive && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>Inactive</span>}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>₹{product.SellingPrice ? product.SellingPrice.toFixed(2) : '0.00'}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <span style={{ 
                                                            fontSize: '0.75rem', 
                                                            padding: '2px 8px', 
                                                            borderRadius: '12px',
                                                            background: !isActive ? '#e5e7eb' : (isOutOfStock ? '#fee2e2' : '#dcfce7'),
                                                            color: !isActive ? '#6b7280' : (isOutOfStock ? '#ef4444' : '#16a34a'),
                                                            fontWeight: 600
                                                        }}>
                                                            {!isActive ? 'Inactive' : (isOutOfStock ? 'Out of Stock' : (maxAddable > 100 ? 'In Stock' : `${maxAddable} left`))}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <button
                                                            disabled={!isActive || isOutOfStock}
                                                            onClick={() => addToCart(product)}
                                                            style={{ 
                                                                padding: '6px 12px', 
                                                                fontSize: '0.85rem', 
                                                                fontWeight: 600,
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                background: (!isActive || isOutOfStock) ? '#e5e7eb' : 'var(--color-primary)',
                                                                color: (!isActive || isOutOfStock) ? '#9ca3af' : 'white',
                                                                cursor: (!isActive || isOutOfStock) ? 'not-allowed' : 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                minWidth: '70px',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {(!isActive || isOutOfStock) ? 'Unavailable' : <><Plus size={14} /> Add</>}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cart Summary (Right Side) */}
                    <div className="create-order-cart">
                        <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Order Items ({cart.length})</h3>
                        {cart.length === 0 ? (
                            <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                No items selected
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {cart.map(item => (
                                    <div key={item.product.ProductId} style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>{item.product.ProductName}</span>
                                            <span>₹{(item.product.SellingPrice * item.qty).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '2px', borderRadius: '4px', border: '1px solid #eee' }}>
                                                <button 
                                                    onClick={() => {
                                                        if (item.qty > 1) updateQty(item.product.ProductId, -1);
                                                        else removeFromCart(item.product.ProductId);
                                                    }}
                                                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{ fontSize: '0.9rem', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                                                <button 
                                                    onClick={() => updateQty(item.product.ProductId, 1)}
                                                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => removeFromCart(item.product.ProductId)} 
                                                style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </div>

                {/* Payment Details Section */}
                <div className="card" style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa' }}>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Receipt size={18} /> Payment Details
                    </h3>
                    <div className="payment-grid">
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: '#6b7280' }}>Total Amount</label>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{calculateTotal().toFixed(2)}</div>
                        </div>
                        <div>
                            <SearchableSelect
                                value={paymentType}
                                onChange={setPaymentType}
                                options={['Cash', 'UPI', 'Bank Transfer']}
                                icon={Receipt}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Paid Amount</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }}>₹</span>
                                <input 
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    style={{ width: '100%', padding: '10px 10px 10px 30px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: '#6b7280' }}>Balance</label>
                            {(() => {
                                const total = calculateTotal();
                                const paid = parseFloat(paidAmount) || 0;
                                const balance = total - paid;
                                const isPaidInfo = balance <= 0;
                                return (
                                    <div style={{ 
                                        fontSize: '1.2rem', 
                                        fontWeight: 700, 
                                        color: isPaidInfo ? '#16a34a' : '#ef4444' 
                                    }}>
                                        ₹{Math.max(0, balance).toFixed(2)}
                                        {balance < 0 && <span style={{ fontSize: '0.8rem', color: '#16a34a', marginLeft: '6px' }}>(Change: ₹{Math.abs(balance).toFixed(2)})</span>}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateOrderModal;
