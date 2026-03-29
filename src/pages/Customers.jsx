import React, { useState } from 'react';
import { useCustomers } from '../contexts/CustomersContext';
import { useOrders } from '../contexts/OrdersContext';
import Modal from '../components/Modal';
import CustomerDetails from '../components/CustomerDetails';
import { Search, Plus, Edit2, Trash2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';

const Customers = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const { orders } = useOrders(); // Get Orders
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Detail View State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        CustomerName: '',
        PhoneNumber: '',
        Email: '',
        Address: '',
        Notes: ''
    });

    const handleOpenDetails = (customer) => {
        setSelectedCustomer(customer);
        setIsDetailsOpen(true);
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            // ... existing ...
            setFormData({
                CustomerName: customer.CustomerName,
                PhoneNumber: customer.PhoneNumber || '',
                Email: customer.Email || '',
                Address: customer.Address || '',
                Notes: customer.Notes || ''
            });
        } else {
            setEditingCustomer(null);
            // ... existing ...
            setFormData({
                CustomerName: '',
                PhoneNumber: '',
                Email: '',
                Address: '',
                Notes: ''
            });
        }
        setIsModalOpen(true);
    };
    
    // ... existing handleSave, handleDelete ...
    const handleSave = () => {
        if (!formData.CustomerName.trim()) return;

        if (editingCustomer) {
            updateCustomer(editingCustomer.CustomerId, formData);
        } else {
            addCustomer(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            deleteCustomer(id);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.IsActive !== false && 
        (c.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (c.PhoneNumber && c.PhoneNumber.includes(searchTerm)))
    );

    const modalFooter = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="primary" onClick={handleSave} disabled={!formData.CustomerName.trim()}>
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Customers</h1>
                <button className="primary" onClick={() => handleOpenModal()} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.9rem' }}>
                    <Plus size={16} style={{ marginRight: '6px' }} /> Add Customer
                </button>
            </header>

            {/* Filter Bar */}
            <div className="card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Search size={20} style={{ color: 'var(--color-text-muted)' }} />
                <input 
                    placeholder="Search customers by name or phone..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '1rem', flex: 1 }}
                />
            </div>

            {/* Customers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filteredCustomers.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        No customers found.
                    </div>
                ) : (
                    filteredCustomers.map(customer => {
                        // Calculate Stats
                        const customerOrders = orders.filter(o => o.CustomerId === customer.CustomerId || o.CustomerName === customer.CustomerName);
                        const totalOrders = customerOrders.length;
                        const pendingAmount = customerOrders.reduce((sum, o) => sum + (o.BalanceAmount || 0), 0);
                        const hasPending = pendingAmount > 0;

                        return (
                            <div 
                                key={customer.CustomerId} 
                                className="card" 
                                style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onClick={() => handleOpenDetails(customer)} // Open Details
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '50%', 
                                            background: '#e0f2fe', color: '#0284c7', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 600, fontSize: '1.2rem'
                                        }}>
                                            {customer.CustomerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{customer.CustomerName}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                Joined: {new Date(customer.CreatedDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className="btn-icon" 
                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(customer); }}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon danger" 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(customer.CustomerId); }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#4b5563', marginBottom: '16px' }}>
                                    {customer.PhoneNumber && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Phone size={14} /> {customer.PhoneNumber}
                                        </div>
                                    )}
                                </div>

                                <div style={{ 
                                    borderTop: '1px solid #f3f4f6', 
                                    paddingTop: '12px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center' 
                                }}>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Orders</div>
                                            <div style={{ fontWeight: 600 }}>{totalOrders}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pending</div>
                                            <div style={{ fontWeight: 600, color: hasPending ? '#dc2626' : '#16a34a' }}>
                                                ₹{pendingAmount.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>
                                    {hasPending && (
                                        <span style={{ 
                                            background: '#fef2f2', color: '#dc2626', 
                                            fontSize: '0.75rem', fontWeight: 600, 
                                            padding: '2px 8px', borderRadius: '12px',
                                            border: '1px solid #fca5a5'
                                        }}>
                                            Due
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCustomer ? "Edit Customer" : "Add New Customer"}
                footer={modalFooter}
                maxWidth="500px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name *</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                value={formData.CustomerName}
                                onChange={e => setFormData({ ...formData, CustomerName: e.target.value })}
                                placeholder="Customer Name"
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                value={formData.PhoneNumber}
                                onChange={e => setFormData({ ...formData, PhoneNumber: e.target.value })}
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
                                value={formData.Email}
                                onChange={e => setFormData({ ...formData, Email: e.target.value })}
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
                                value={formData.Address}
                                onChange={e => setFormData({ ...formData, Address: e.target.value })}
                                placeholder="Delivery Address"
                                rows="3"
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Notes</label>
                        <textarea
                            value={formData.Notes}
                            onChange={e => setFormData({ ...formData, Notes: e.target.value })}
                            placeholder="Additional Notes"
                            rows="2"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                        />
                    </div>
                </div>
            </Modal>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <CustomerDetails 
                    customer={selectedCustomer}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    onEdit={(customer) => {
                        setIsDetailsOpen(false);
                        handleOpenModal(customer);
                    }}
                />
            )}
        </div>
    );
};

export default Customers;
