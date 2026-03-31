import React, { useState } from 'react';
import { useCustomers } from '../contexts/CustomersContext';
import { useOrders } from '../contexts/OrdersContext';
import Modal from '../components/Modal';
import CustomerDetails from '../components/CustomerDetails';
import Loader from '../components/Loader';
import { Search, Plus, Edit2, Trash2, User, Phone, Mail, MapPin, FileText } from 'lucide-react';

const Customers = () => {
    const { customers, loading: custLoading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const { orders, loading: ordLoading } = useOrders(); // Get Orders
    const [searchTerm, setSearchTerm] = useState('');

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

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

    if (custLoading || ordLoading) return <Loader text="Loading customers..." />;

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

        const finalData = {
            ...formData,
            CustomerName: formData.CustomerName.trim()
        };

        if (editingCustomer) {
            updateCustomer(editingCustomer.id || editingCustomer.CustomerId, finalData);
        } else {
            addCustomer(finalData);
        }
        setIsModalOpen(false);
    };

    const confirmDelete = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete.CustomerId);
            setShowDeleteModal(false);
            setCustomerToDelete(null);
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
                        const customerOrders = orders.filter(o => 
                            (o.CustomerId && (o.CustomerId === customer.id || o.CustomerId === customer.CustomerId || o.CustomerId.toString() === customer.id?.toString() || o.CustomerId.toString() === customer.CustomerId?.toString())) || 
                            (o.CustomerName && customer.CustomerName && o.CustomerName.trim().toLowerCase() === customer.CustomerName.trim().toLowerCase())
                        );
                        const totalOrders = customerOrders.length;
                        const pendingAmount = customerOrders.reduce((sum, o) => sum + (o.BalanceAmount || 0), 0);
                        const hasPending = pendingAmount > 0;

                        return (
                            <div 
                                key={customer.id || customer.CustomerId} 
                                className="card" 
                                style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                                onClick={() => handleOpenDetails(customer)} // Open Details
                            >
                                {/* Dynamic Header */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    background: getHeaderColor(customer.CustomerName).bg,
                                    color: getHeaderColor(customer.CustomerName).text,
                                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%', 
                                            background: 'rgba(255,255,255,0.4)', color: 'inherit', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.9rem',
                                            border: '1px solid rgba(0,0,0,0.1)'
                                        }}>
                                            {customer.CustomerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{customer.CustomerName}</div>
                                    </div>
                                    {hasPending && (
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ef4444',
                                            boxShadow: '0 0 10px #ef4444',
                                        }} title="Pending Balance" />
                                    )}
                                </div>

                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={14} /> Joined: {new Date(customer.CreatedDate).toLocaleDateString()}
                                            </div>
                                            {customer.PhoneNumber && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                                    <Phone size={14} /> {customer.PhoneNumber}
                                                </div>
                                            )}
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
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(customer); }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ 
                                        borderTop: '1px solid #f3f4f6', 
                                        paddingTop: '16px', 
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        background: '#f9fafb',
                                        padding: '12px',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{totalOrders}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: hasPending ? '#ef4444' : '#22c55e' }}>
                                                ₹{pendingAmount.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>
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
                    Are you sure you want to delete <strong>{customerToDelete?.CustomerName}</strong>?
                    <br/><br/>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>This action cannot be undone.</span>
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
