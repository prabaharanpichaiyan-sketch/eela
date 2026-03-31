import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUI } from './UIContext';

const InventoryContext = createContext();
const API_URL = '/api';

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showLoader, hideLoader, showNotification } = useUI();

    const fetchInventory = async () => {
        try {
            const res = await fetch(`${API_URL}/inventory`);
            const data = await res.json();
            setInventory(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const addIngredient = async (ingredient) => {
        showLoader('Adding stock item...');
        try {
            const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingredient)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add ingredient');
            }
            const newIngredient = await res.json();
            setInventory(prev => [...prev, newIngredient]);
            showNotification('Stock item added successfully!');
        } catch (error) {
            console.error("Error adding ingredient:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const updateIngredient = async (id, updatedData) => {
        showLoader('Updating item details...');
        try {
            const res = await fetch(`${API_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update ingredient');
            }
            setInventory(prev => prev.map(i => (i.InventoryId === id || i.id === id) ? { ...i, ...updatedData } : i));
            showNotification('Item details updated!');
        } catch (error) {
            console.error("Error updating ingredient:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const updateStock = async (id, quantityData, options = {}) => {
        const { silent = false, noNotify = false } = options;
        if (!silent) showLoader('Updating stock level...');
        try {
            const item = inventory.find(i => i.id === id || i.InventoryId === id);
            if (!item) return;

            let newQty = item.QuantityAvailable;
            if (quantityData.method === 'add') newQty += quantityData.value;
            if (quantityData.method === 'subtract') newQty -= quantityData.value;
            if (quantityData.method === 'set') newQty = quantityData.value;
            
            newQty = Math.max(0, newQty);

            const res = await fetch(`${API_URL}/inventory/${id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ QuantityAvailable: newQty })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update stock');
            }
            
            setInventory(prev => prev.map(i => (i.id === id || i.InventoryId === id) ? { ...i, QuantityAvailable: newQty } : i));
            if (!noNotify) showNotification('Stock level updated!');
        } catch (error) {
            console.error("Error updating stock:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            if (!silent) hideLoader();
        }
    };

    const checkStock = (requirements) => {
        const missing = [];
        requirements.forEach(req => {
            const item = inventory.find(i => i.InventoryId == req.InventoryId || i.id == req.InventoryId);
            if (!item || item.QuantityAvailable < req.QuantityRequired) {
                missing.push({
                    id: req.InventoryId,
                    name: item?.IngredientName || 'Unknown',
                    required: req.QuantityRequired,
                    available: item?.QuantityAvailable || 0
                });
            }
        });
        return { sufficient: missing.length === 0, missing };
    };

    const deductStock = async (requirements, options = {}) => {
        try {
            for (const req of requirements) {
                await updateStock(req.InventoryId, {
                    method: 'subtract',
                    value: req.QuantityRequired
                }, options);
            }
        } catch (error) {
            console.error("Error deducting stock:", error);
            throw error;
        }
    };

    const deleteIngredient = async (id) => {
        showLoader('Removing stock item...');
        try {
            const res = await fetch(`${API_URL}/inventory/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete ingredient');
            }
            setInventory(prev => prev.filter(i => i.id !== id && i.InventoryId !== id));
            showNotification('Stock item removed.');
        } catch (error) {
            console.error("Error deleting ingredient:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    return (
        <InventoryContext.Provider value={{ 
            inventory, 
            loading,
            addIngredient, 
            updateIngredient, 
            updateStock, 
            checkStock, 
            deductStock, 
            deleteIngredient,
            fetchInventory
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
