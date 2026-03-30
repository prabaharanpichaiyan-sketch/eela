import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUI } from './UIContext';

const CustomersContext = createContext();
const API_URL = '/api';

export const useCustomers = () => useContext(CustomersContext);

export const CustomersProvider = ({ children }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showLoader, hideLoader, showNotification } = useUI();

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`${API_URL}/customers`);
            const data = await res.json();
            setCustomers(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const addCustomer = async (customerData) => {
        showLoader('Creating customer profile...');
        try {
            const res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
            const newCustomer = await res.json();
            setCustomers(prev => [...prev, newCustomer]);
            showNotification('Customer profile created!');
            return newCustomer;
        } catch (error) {
            console.error("Error adding customer:", error);
            showNotification(error.message || 'Failed to create customer', 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const updateCustomer = async (id, updatedData) => {
        showLoader('Updating customer info...');
        try {
            await fetch(`${API_URL}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
            showNotification('Customer info updated!');
        } catch (error) {
            console.error("Error updating customer:", error);
            showNotification(error.message || 'Failed to update customer', 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const deleteCustomer = async (id) => {
        showLoader('Deleting customer record...');
        try {
            await fetch(`${API_URL}/customers/${id}`, {
                method: 'DELETE'
            });
            setCustomers(prev => prev.filter(c => c.id !== id));
            showNotification('Customer record deleted.');
        } catch (error) {
            console.error("Error deleting customer:", error);
            showNotification(error.message || 'Failed to delete customer', 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    return (
        <CustomersContext.Provider value={{ customers, loading, addCustomer, updateCustomer, deleteCustomer, fetchCustomers }}>
            {children}
        </CustomersContext.Provider>
    );
};
