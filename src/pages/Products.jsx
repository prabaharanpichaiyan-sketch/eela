import React, { useState } from 'react';
import { useProducts } from '../contexts/ProductsContext';
import { useInventory } from '../contexts/InventoryContext';
import SearchableSelect from '../components/SearchableSelect';
import { Plus, Trash2, Search, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

const Products = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const { inventory } = useInventory();

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
    const [formData, setFormData] = useState({ ProductName: '', SellingPrice: 0, Description: '', ingredients: [] });
    const [currentIngredient, setCurrentIngredient] = useState({ InventoryId: '', QuantityRequired: 0 });
    const [currentUnit, setCurrentUnit] = useState(''); // Tracks the user-selected unit for entry (g vs kg)

    const resetForm = () => {
        setFormData({ ProductName: '', SellingPrice: 0, Description: '', ingredients: [] });
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
                closeOnOverlayClick={false}
                maxWidth="900px"
            >
                <form onSubmit={handleSubmit}>
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

                    <div style={{ padding: '8px', background: formProfitMargin >= 0 ? '#d4edda' : '#f8d7da', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, color: formProfitMargin >= 0 ? '#155724' : '#721c24' }}>
                        Profit Margin: ₹{formProfitMargin.toFixed(2)}
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

            <div className="product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredProducts.map(product => {
                    const estimatedCost = calculateEstimatedCost(product.ingredients);
                    const margin = product.SellingPrice - estimatedCost;

                    return (
                        <div key={product.ProductId} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{product.ProductName}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {product.Description}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon" onClick={() => handleEditClick(product)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn-icon danger" onClick={() => confirmDelete(product)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'var(--color-bg)', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Selling Price</div>
                                    <div style={{ fontWeight: 700 }}>₹{product.SellingPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Est. Cost</div>
                                    <div style={{ fontWeight: 600 }}>₹{estimatedCost.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Margin</div>
                                    <div style={{ fontWeight: 600, color: margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                        ₹{margin.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                <strong>Recipe:</strong> {(product.ingredients || []).map(i => {
                                    const inv = inventory.find(inv => inv.InventoryId === i.InventoryId);
                                    if (!inv) return 'Unknown';
                                    
                                    // Format for readability
                                    let displayQty = i.QuantityRequired;
                                    let displayUnit = inv.Unit;
                                    
                                    if (inv.Unit === 'kg' && i.QuantityRequired < 1) {
                                        displayQty = i.QuantityRequired * 1000;
                                        displayUnit = 'g';
                                    } else if (inv.Unit === 'l' && i.QuantityRequired < 1) {
                                        displayQty = i.QuantityRequired * 1000;
                                        displayUnit = 'ml';
                                    }
                                    
                                    return `${inv.IngredientName} (${Number(displayQty).toFixed(displayQty < 1 ? 2 : 0)}${displayUnit})`;
                                }).join(', ')}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Products;
