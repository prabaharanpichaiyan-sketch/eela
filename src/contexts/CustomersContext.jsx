import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomersContext = createContext();
const API_URL = '/api';

export const useCustomers = () => useContext(CustomersContext);

export const CustomersProvider = ({ children }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

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
        try {
            const res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
            const newCustomer = await res.json();
            setCustomers(prev => [...prev, newCustomer]);
            return newCustomer;
        } catch (error) {
            console.error("Error adding customer:", error);
            throw error;
        }
    };

    const updateCustomer = async (id, updatedData) => {
        try {
            await fetch(`${API_URL}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
        } catch (error) {
            console.error("Error updating customer:", error);
            throw error;
        }
    };

    const deleteCustomer = async (id) => {
        try {
            await fetch(`${API_URL}/customers/${id}`, {
                method: 'DELETE'
            });
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting customer:", error);
            throw error;
        }
    };

    return (
        <CustomersContext.Provider value={{ customers, loading, addCustomer, updateCustomer, deleteCustomer, fetchCustomers }}>
            {children}
        </CustomersContext.Provider>
    );
};
