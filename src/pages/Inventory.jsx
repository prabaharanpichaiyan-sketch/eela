import React, { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import SearchableSelect from '../components/SearchableSelect';
import { Plus, Search, AlertTriangle, CheckCircle, X, Trash2, Edit2 } from 'lucide-react';
import Modal from '../components/Modal';

const Inventory = () => {
    const { inventory, addIngredient, updateIngredient, updateStock, deleteIngredient } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    
    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Error Modal State
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Form/Action States
    const [newItem, setNewItem] = useState({ IngredientName: '', QuantityAvailable: 0, Unit: 'g', LowStockLimit: 0, CostPerUnit: 0 });
    const [editItem, setEditItem] = useState({ IngredientName: '', Unit: 'g', LowStockLimit: 0, CostPerUnit: 0 });
    const [editingId, setEditingId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [updateAmount, setUpdateAmount] = useState('');
    const [updateType, setUpdateType] = useState('add'); // 'add', 'subtract', 'set'

    const handleAddSubmit = (e) => {
        e.preventDefault();
        
        // Check for duplicates
        const existingItem = inventory.find(item => 
            item.IngredientName.toLowerCase() === newItem.IngredientName.trim().toLowerCase()
        );

        if (existingItem) {
            if (existingItem.IsActive !== false) {
                setErrorMessage(`Ingredient "${newItem.IngredientName}" already exists!`);
                setShowErrorModal(true);
                return;
            } else {
                // Reactivate soft-deleted item
                updateIngredient(existingItem.InventoryId, {
                    ...newItem,
                    IngredientName: newItem.IngredientName.trim(), // Ensure case correction
                    QuantityAvailable: parseFloat(newItem.QuantityAvailable),
                    LowStockLimit: parseFloat(newItem.LowStockLimit),
                    CostPerUnit: parseFloat(newItem.CostPerUnit),
                    IsActive: true
                });
                setNewItem({ IngredientName: '', QuantityAvailable: 0, Unit: 'g', LowStockLimit: 0, CostPerUnit: 0 });
                setShowAddModal(false);
                return;
            }
        }

        addIngredient({
            ...newItem,
            IngredientName: newItem.IngredientName.trim(),
            QuantityAvailable: parseFloat(newItem.QuantityAvailable),
            LowStockLimit: parseFloat(newItem.LowStockLimit),
            CostPerUnit: parseFloat(newItem.CostPerUnit),
            IsActive: true
        });
        setNewItem({ IngredientName: '', QuantityAvailable: 0, Unit: 'g', LowStockLimit: 0, CostPerUnit: 0 });
        setShowAddModal(false);
    };

    const openUpdateModal = (item) => {
        setSelectedItem(item);
        setUpdateAmount('');
        setUpdateType('add');
        setShowUpdateModal(true);
    };

    const handleUpdateStock = () => {
        if (!selectedItem || !updateAmount) return;
        
        const val = parseFloat(updateAmount);
        if (isNaN(val)) return;

        updateStock(selectedItem.InventoryId, { method: updateType, value: val });
        setShowUpdateModal(false);
        setSelectedItem(null);
    };

    const openEditModal = (item) => {
        setEditItem({
            IngredientName: item.IngredientName,
            Unit: item.Unit,
            LowStockLimit: item.LowStockLimit,
            CostPerUnit: item.CostPerUnit
        });
        setEditingId(item.InventoryId);
        setShowEditModal(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        
        const exists = inventory.some(item => 
            item.InventoryId !== editingId &&
            item.IngredientName.toLowerCase() === editItem.IngredientName.trim().toLowerCase()
        );

        if (exists) {
            setErrorMessage(`Ingredient "${editItem.IngredientName}" already exists!`);
            setShowErrorModal(true);
            return;
        }

        updateIngredient(editingId, {
            IngredientName: editItem.IngredientName.trim(),
            Unit: editItem.Unit,
            LowStockLimit: parseFloat(editItem.LowStockLimit),
            CostPerUnit: parseFloat(editItem.CostPerUnit)
        });
        
        setShowEditModal(false);
        setEditingId(null);
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (itemToDelete) {
            deleteIngredient(itemToDelete.InventoryId);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.IsActive !== false &&
        item.IngredientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="animate-fade-in">
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Stock</h1>
                <button className="primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={20} /> Add Item
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

            {/* Add Item Modal */}
            <Modal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                title="Add New Ingredient"
                closeOnOverlayClick={false}
            >
                <form id="add-form" onSubmit={handleAddSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input required value={newItem.IngredientName} onChange={e => setNewItem({ ...newItem, IngredientName: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input type="number" min="0" required value={newItem.QuantityAvailable} onChange={e => setNewItem({ ...newItem, QuantityAvailable: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <SearchableSelect
                                label="Unit"
                                value={newItem.Unit}
                                onChange={val => setNewItem({ ...newItem, Unit: val })}
                                options={[
                                    { value: 'g', label: 'Grams (g)' },
                                    { value: 'kg', label: 'Kilograms (kg)' },
                                    { value: 'ml', label: 'Milliliters (ml)' },
                                    { value: 'l', label: 'Liters (l)' },
                                    { value: 'pcs', label: 'Pieces (pcs)' }
                                ]}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label>Min Stock Alert</label>
                            <input type="number" min="0" required value={newItem.LowStockLimit} onChange={e => setNewItem({ ...newItem, LowStockLimit: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Cost Per Unit (₹)</label>
                            <input type="number" step="0.001" min="0" required value={newItem.CostPerUnit} onChange={e => setNewItem({ ...newItem, CostPerUnit: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                        <button type="submit" className="primary">Save Item</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Ingredient Modal */}
            <Modal 
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)} 
                title="Edit Ingredient"
            >
                <form id="edit-form" onSubmit={handleEditSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input required value={editItem.IngredientName} onChange={e => setEditItem({ ...editItem, IngredientName: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <SearchableSelect
                                label="Unit"
                                value={editItem.Unit}
                                onChange={val => setEditItem({ ...editItem, Unit: val })}
                                options={[
                                    { value: 'g', label: 'Grams (g)' },
                                    { value: 'kg', label: 'Kilograms (kg)' },
                                    { value: 'ml', label: 'Milliliters (ml)' },
                                    { value: 'l', label: 'Liters (l)' },
                                    { value: 'pcs', label: 'Pieces (pcs)' }
                                ]}
                            />
                        </div>
                        <div className="form-group">
                            <label>Min Stock Alert</label>
                            <input type="number" min="0" required value={editItem.LowStockLimit} onChange={e => setEditItem({ ...editItem, LowStockLimit: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Cost Per Unit (₹)</label>
                        <input type="number" step="0.001" min="0" required value={editItem.CostPerUnit} onChange={e => setEditItem({ ...editItem, CostPerUnit: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                        <button type="submit" className="primary">Save Changes</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                title={`Update Stock: ${selectedItem?.IngredientName}`}
                closeOnOverlayClick={false}
                footer={
                    <>
                        <button className="secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                        <button className="primary" onClick={handleUpdateStock}>Update</button>
                    </>
                }
            >
                {/* Dynamic Cost Calculator */}
                {(() => {
                    if (!selectedItem || !updateAmount || isNaN(updateAmount)) return null;
                    const val = parseFloat(updateAmount);
                    const cost = selectedItem.CostPerUnit || 0;
                    let expense = 0;
                    
                    if (updateType === 'add') expense = val * cost;
                    if (updateType === 'set' && val > selectedItem.QuantityAvailable) {
                        expense = (val - selectedItem.QuantityAvailable) * cost;
                    }

                    if (expense > 0) {
                        return (
                            <div style={{ 
                                marginBottom: '16px', 
                                padding: '16px', 
                                backgroundColor: '#fef2f2', 
                                border: '1px solid #fca5a5', 
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ color: '#991b1b', fontSize: '0.95rem', fontWeight: 600 }}>Total Spent on Restock:</span>
                                <span style={{ color: '#dc2626', fontSize: '1.2rem', fontWeight: 800 }}>₹{expense.toFixed(2)}</span>
                            </div>
                        );
                    }
                    return null;
                })()}

                <div className="form-group">
                     <label>Current Stock: {selectedItem?.QuantityAvailable} {selectedItem?.Unit}</label>
                </div>
                <div className="form-group">
                    <label>Action</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button 
                            className={updateType === 'add' ? 'primary' : 'secondary'} 
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => setUpdateType('add')}
                        >
                            Add (+)
                        </button>
                        <button 
                            className={updateType === 'subtract' ? 'primary' : 'secondary'} 
                            style={{ flex: 1, justifyContent: 'center', backgroundColor: updateType === 'subtract' ? 'var(--color-danger)' : undefined, color: updateType === 'subtract' ? 'white' : undefined }}
                            onClick={() => setUpdateType('subtract')}
                        >
                            Remove (-)
                        </button>
                        <button 
                            className={updateType === 'set' ? 'primary' : 'secondary'} 
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => setUpdateType('set')}
                        >
                            Set Total
                        </button>
                    </div>
                </div>
                <div className="form-group">
                    <label>{updateType === 'set' ? 'New Total Quantity' : 'Quantity to ' + (updateType === 'add' ? 'Add' : 'Remove')}</label>
                    <input 
                        type="number" 
                        min="0"
                        autoFocus
                        value={updateAmount} 
                        onChange={e => setUpdateAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateStock()}
                        placeholder="0"
                    />
                </div>
            </Modal>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
                closeOnOverlayClick={false}
                footer={
                    <>
                        <button className="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        <button className="danger" onClick={handleDelete}>Delete</button>
                    </>
                }
            >
                <div>
                    Are you sure you want to delete <strong>{itemToDelete?.IngredientName}</strong>?
                    <br/><br/>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                        Warning: If this ingredient is used in any product recipes, duplicate calculations may become inaccurate.
                    </span>
                </div>
            </Modal>

            <div className="form-group">
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                    <input
                        placeholder="Search ingredients..."
                        style={{ paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="inventory-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredInventory.map(item => {
                    const isLowStock = item.QuantityAvailable <= item.LowStockLimit;
                    const headerColor = getHeaderColor(item.IngredientName);

                    return (
                        <div key={item.InventoryId} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%' }}>

                            {/* Header: Name and Status */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '16px 20px',
                                background: headerColor.bg,
                                color: headerColor.text,
                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{item.IngredientName}</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        backgroundColor: isLowStock ? '#fee2e2' : 'rgba(255,255,255,0.5)',
                                        color: isLowStock ? '#b91c1c' : headerColor.text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        border: isLowStock ? '1px solid #fca5a5' : '1px solid rgba(255,255,255,0.6)'
                                    }}>
                                        {isLowStock ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                                        {isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                                    </div>
                                </div>
                            </div>

                            {/* Body: Quantity and Actions */}
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                    Cost per Unit: <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>₹{item.CostPerUnit ? item.CostPerUnit.toFixed(3) : '0.00'} / {item.Unit}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Available</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)' }}>{item.QuantityAvailable} <small style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{item.Unit}</small></span>
                                    </div>

                                    <button className="secondary" onClick={() => openUpdateModal(item)} style={{ height: '38px', padding: '0 16px', fontWeight: 600 }}>
                                        Update Qty
                                    </button>
                                </div>

                                {/* Footer Actions */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
                                    <button className="btn-icon" title="Edit Ingredient" onClick={() => openEditModal(item)}><Edit2 size={16} /></button>
                                    <button className="btn-icon danger" title="Delete Ingredient" onClick={() => confirmDelete(item)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Inventory;
