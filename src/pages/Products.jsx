import React, { useState } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import { useInventory } from '../contexts/InventoryContext';
import SearchableSelect from '../components/SearchableSelect';
import { Plus, Trash2, Search, Edit2, Check, X, AlertTriangle, Camera, Upload } from 'lucide-react';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

const Products = () => {
    const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
    const { inventory, loading: inventoryLoading } = useInventory();

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

    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    // Error Modal State
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ 
        ProductName: '', 
        SellingPrice: 0, 
        Description: '', 
        ingredients: [],
        image: null 
    });
    const [currentIngredient, setCurrentIngredient] = useState({ InventoryId: '', QuantityRequired: 0 });
    const [currentUnit, setCurrentUnit] = useState(''); // Tracks the user-selected unit for entry (g vs kg)
    
    if (productsLoading || inventoryLoading) return <Loader text="Loading products..." />;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setFormData({ ProductName: '', SellingPrice: 0, Description: '', ingredients: [], image: null });
        setCurrentIngredient({ InventoryId: '', QuantityRequired: 0 });
        setCurrentUnit('');
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEditClick = (product) => {
        setFormData({
            ProductName: product.ProductName,
            SellingPrice: product.SellingPrice,
            Description: product.Description || '',
            image: product.image || null,
            ingredients: product.ingredients.map(ing => ({
                ...ing,
                // Ensure we have the name for display if it's missing in saved data
                IngredientName: inventory.find(i => i.InventoryId === ing.InventoryId)?.IngredientName || 'Unknown'
            }))
        });
        setIsEditing(true);
        setEditingId(product.ProductId);
        setShowForm(true);
    };

    const confirmDelete = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (productToDelete) {
            deleteProduct(productToDelete.ProductId);
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    const handleAddIngredient = () => {
        if (!currentIngredient.InventoryId || !currentIngredient.QuantityRequired) return;
        const invItem = inventory.find(i => i.InventoryId == currentIngredient.InventoryId || i.id == currentIngredient.InventoryId);
        if (!invItem) return;

        let finalQty = parseFloat(currentIngredient.QuantityRequired);
        
        // Handle Unit Conversion
        if (currentUnit === 'g' && invItem.Unit === 'kg') finalQty /= 1000;
        if (currentUnit === 'ml' && invItem.Unit === 'l') finalQty /= 1000;

        setFormData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, {
                InventoryId: currentIngredient.InventoryId,
                QuantityRequired: finalQty,
                IngredientName: invItem.IngredientName
            }]
        }));
        setCurrentIngredient({ InventoryId: '', QuantityRequired: 0 });
        setCurrentUnit('');
    };

    const handleRemoveIngredient = (index) => {
        setFormData(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const productData = {
            ...formData,
            ProductName: formData.ProductName.trim(),
            SellingPrice: parseFloat(formData.SellingPrice),
            ingredients: formData.ingredients
        };

        if (isEditing) {
            const existingProduct = products.find(p => 
                p.ProductId !== editingId &&
                p.ProductName.toLowerCase() === productData.ProductName.toLowerCase()
            );
            
            if (existingProduct) {
                 setErrorMessage(`Product "${productData.ProductName}" already exists!`);
                 setShowErrorModal(true);
                 return;
            }
            updateProduct(editingId, productData);
        } else {
            const existingProduct = products.find(p => 
                p.ProductName.toLowerCase() === productData.ProductName.toLowerCase()
            );

            if (existingProduct) {
                if (existingProduct.IsActive !== false) {
                    setErrorMessage(`Product "${productData.ProductName}" already exists!`);
                    setShowErrorModal(true);
                    return;
                } else {
                    updateProduct(existingProduct.ProductId, {
                        ...productData,
                        IsActive: true
                    });
                    resetForm();
                    return;
                }
            }
            addProduct(productData);
        }
        resetForm();
    };

    const calculateEstimatedCost = (ingredients = []) => {
        return (ingredients || []).reduce((total, ing) => {
            const invItem = inventory.find(i => i.InventoryId === ing.InventoryId);
            const costPerUnit = invItem?.CostPerUnit || 0;
            return total + (costPerUnit * ing.QuantityRequired);
        }, 0);
    };

    const filteredProducts = products.filter(p => 
        p.IsActive !== false && 
        p.ProductName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate current form's estimated cost
    const formEstimatedCost = calculateEstimatedCost(formData.ingredients);
    const formProfitMargin = formData.SellingPrice - formEstimatedCost;

    return (
        <div className="animate-fade-in">
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Products</h1>
                <button className="primary" onClick={() => setShowForm(true)}>
                    <Plus size={20} /> Add Product
                </button>
            </header>


            {/* Error/Info Modal */}
            <Modal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Notice"
                zIndex={2000}
                footer={
                    <button className="primary" onClick={() => setShowErrorModal(false)}>OK</button>
                }
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={24} style={{ color: 'var(--color-warning)' }} />
                    <span>{errorMessage}</span>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
                footer={
                    <>
                        <button className="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        <button className="primary danger" onClick={handleDelete}>Delete</button>
                    </>
                }
            >
                <div>
                    Are you sure you want to delete <strong>{productToDelete?.ProductName}</strong>?
                    <br/><br/>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>This action cannot be undone.</span>
                </div>
            </Modal>

            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title={isEditing ? 'Edit Product' : 'Create New Product'}
                maxWidth="900px"
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', marginBottom: '20px' }}>
                        {/* Image Upload Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div 
                                style={{ 
                                    width: '200px', 
                                    height: '200px', 
                                    borderRadius: '12px', 
                                    background: '#f3f4f6', 
                                    border: '2px dashed #d1d5db',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    cursor: 'pointer'
                                }}
                                onClick={() => document.getElementById('product-image-upload').click()}
                            >
                                {formData.image ? (
                                    <img src={formData.image} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <Camera size={40} style={{ color: '#9ca3af', marginBottom: '8px' }} />
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', padding: '0 10px' }}>Click to upload product image</span>
                                    </>
                                )}
                                <input 
                                    id="product-image-upload"
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            {formData.image && (
                                <button 
                                    type="button" 
                                    className="secondary" 
                                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                                >
                                    Remove Image
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input required value={formData.ProductName} onChange={e => setFormData({ ...formData, ProductName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input value={formData.Description} onChange={e => setFormData({ ...formData, Description: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Selling Price (₹)</label>
                                    <input type="number" step="0.01" required value={formData.SellingPrice} onChange={e => setFormData({ ...formData, SellingPrice: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Est. Cost (₹)</label>
                                    <input disabled value={formEstimatedCost.toFixed(2)} style={{ background: '#eee' }} />
                                </div>
                            </div>

                            <div style={{ padding: '8px', background: formProfitMargin >= 0 ? '#d4edda' : '#f8d7da', borderRadius: '8px', fontWeight: 600, color: formProfitMargin >= 0 ? '#155724' : '#721c24' }}>
                                Profit Margin: ₹{formProfitMargin.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px' }}>
                        <label>Recipe Ingredients</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ flex: 2 }}>
                                <SearchableSelect
                                    placeholder="Select Ingredient"
                                    value={currentIngredient.InventoryId}
                                    onChange={val => setCurrentIngredient({ ...currentIngredient, InventoryId: val })}
                                    options={inventory.filter(i => i.IsActive !== false).map(inv => ({
                                        value: inv.InventoryId, 
                                        label: `${inv.IngredientName} (${inv.Unit})`,
                                        subLabel: `₹${inv.CostPerUnit ? inv.CostPerUnit.toFixed(3) : 0}/${inv.Unit}`
                                    }))}
                                    renderOption={(opt) => (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                            <span>{opt.label}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{opt.subLabel}</span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    style={{ flex: 1, width: '100%' }}
                                    placeholder="Qty"
                                    value={currentIngredient.QuantityRequired}
                                    onChange={e => setCurrentIngredient({ ...currentIngredient, QuantityRequired: e.target.value })}
                                />
                                {/* Unit Selection Logic */}
                                {(() => {
                                    const invItem = inventory.find(i => i.InventoryId == currentIngredient.InventoryId);
                                    if (!invItem) return null;

                                    const units = [];
                                    if (invItem.Unit === 'kg') {
                                        if (!currentUnit) setCurrentUnit('g');
                                        units.push('g', 'kg');
                                    } else if (invItem.Unit === 'l') {
                                        if (!currentUnit) setCurrentUnit('ml');
                                        units.push('ml', 'l');
                                    } else {
                                        return <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', minWidth: '30px' }}>{invItem.Unit}</span>;
                                    }

                                    return (
                                        <select 
                                            value={currentUnit || invItem.Unit}
                                            onChange={e => setCurrentUnit(e.target.value)}
                                            style={{ width: 'auto', padding: '4px', fontSize: '0.8rem', height: '100%' }}
                                        >
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    );
                                })()}
                            </div>
                            <button type="button" className="secondary" onClick={handleAddIngredient} style={{ padding: '0 16px', height: '38px', borderRadius: '8px' }}>Add</button>
                        </div>

                        {formData.ingredients.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>Ingredient</th>
                                        <th style={{ padding: '8px' }}>Cost/Unit</th>
                                        <th style={{ padding: '8px', width: '80px' }}>Qty</th>
                                        <th style={{ padding: '8px' }}>Total</th>
                                        <th style={{ padding: '8px', width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.ingredients.map((ing, idx) => {
                                        const invItem = inventory.find(i => i.InventoryId === ing.InventoryId);
                                        const costPerUnit = invItem?.CostPerUnit || 0;
                                        const totalCost = costPerUnit * ing.QuantityRequired;

                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px' }}>{ing.IngredientName}</td>
                                                <td style={{ padding: '8px' }}>₹{costPerUnit.toFixed(2)}</td>
                                                <td style={{ padding: '8px' }}>
                                                    <input
                                                        type="number"
                                                        value={ing.QuantityRequired}
                                                        onChange={(e) => {
                                                            const newIngredients = [...formData.ingredients];
                                                            newIngredients[idx].QuantityRequired = parseFloat(e.target.value) || 0;
                                                            setFormData({ ...formData, ingredients: newIngredients });
                                                        }}
                                                        style={{ width: '100%', padding: '4px' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px' }}>₹{totalCost.toFixed(2)}</td>
                                                <td style={{ padding: '8px' }}>
                                                    <button type="button" className="btn-icon danger" onClick={() => handleRemoveIngredient(idx)} title="Remove">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {formData.ingredients.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', padding: '16px' }}>No ingredients added yet.</div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
                        <button type="button" className="secondary" onClick={resetForm}>Cancel</button>
                        <button type="submit" className="primary">{isEditing ? 'Update Product' : 'Save Product'}</button>
                    </div>
                </form>
            </Modal>

            <div className="product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(product => {
                    const estimatedCost = calculateEstimatedCost(product.ingredients);
                    const margin = product.SellingPrice - estimatedCost;
                    const headerColor = getHeaderColor(product.ProductName);

                    return (
                        <div key={product.ProductId} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>
                            {/* Header */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '16px 20px',
                                background: headerColor.bg,
                                color: headerColor.text,
                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {product.image ? (
                                        <img src={product.image} alt={product.ProductName} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.1)' }} />
                                    ) : (
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(0,0,0,0.1)' }}>
                                            {product.ProductName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{product.ProductName}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon" onClick={() => handleEditClick(product)} title="Edit" style={{ background: 'rgba(255,255,255,0.5)' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn-icon danger" onClick={() => confirmDelete(product)} title="Delete" style={{ background: 'rgba(255,255,255,0.5)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {product.Description && (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                        {product.Description}
                                    </div>
                                )}

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr 1fr', 
                                    gap: '12px', 
                                    background: '#f9fafb', 
                                    padding: '12px', 
                                    borderRadius: '12px',
                                    border: '1px solid #f3f4f6'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Selling</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>₹{product.SellingPrice.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Cost</div>
                                        <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-text)' }}>₹{estimatedCost.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Margin</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: margin >= 0 ? '#16a34a' : '#ef4444' }}>
                                            ₹{margin.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                                    <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Recipe Ingredients:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {(product.ingredients || []).length > 0 ? (product.ingredients || []).map((i, idx) => {
                                            const inv = inventory.find(inv => inv.InventoryId === i.InventoryId);
                                            if (!inv) return null;
                                            
                                            let displayQty = i.QuantityRequired;
                                            let displayUnit = inv.Unit;
                                            
                                            if (inv.Unit === 'kg' && i.QuantityRequired < 1) {
                                                displayQty = i.QuantityRequired * 1000;
                                                displayUnit = 'g';
                                            } else if (inv.Unit === 'l' && i.QuantityRequired < 1) {
                                                displayQty = i.QuantityRequired * 1000;
                                                displayUnit = 'ml';
                                            }
                                            
                                            return (
                                                <span key={idx} style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                    {inv.IngredientName} ({Number(displayQty).toFixed(0)}{displayUnit})
                                                </span>
                                            );
                                        }) : <span style={{ fontStyle: 'italic' }}>No ingredients defined</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Products;
