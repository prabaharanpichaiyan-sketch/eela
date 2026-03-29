import React, { createContext, useContext, useState, useEffect } from 'react';

const InventoryContext = createContext();
const API_URL = '/api';

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

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
        try {
            const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ingredient)
            });
            const newIngredient = await res.json();
            setInventory(prev => [...prev, newIngredient]);
        } catch (error) {
            console.error("Error adding ingredient:", error);
            throw error;
        }
    };

    const updateIngredient = async (id, updatedData) => {
        try {
            await fetch(`${API_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updatedData } : i));
        } catch (error) {
            console.error("Error updating ingredient:", error);
            throw error;
        }
    };

    const updateStock = async (id, quantityData) => {
        try {
            const item = inventory.find(i => i.id === id || i.InventoryId === id);
            if (!item) return;

            let newQty = item.QuantityAvailable;
            if (quantityData.method === 'add') newQty += quantityData.value;
            if (quantityData.method === 'subtract') newQty -= quantityData.value;
            if (quantityData.method === 'set') newQty = quantityData.value;
            
            newQty = Math.max(0, newQty);

            await fetch(`${API_URL}/inventory/${id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ QuantityAvailable: newQty })
            });
            
            setInventory(prev => prev.map(i => (i.id === id || i.InventoryId === id) ? { ...i, QuantityAvailable: newQty } : i));
        } catch (error) {
            console.error("Error updating stock:", error);
            throw error;
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

    const deductStock = async (requirements) => {
        try {
            for (const req of requirements) {
                await updateStock(req.InventoryId, {
                    method: 'subtract',
                    value: req.QuantityRequired
                });
            }
        } catch (error) {
            console.error("Error deducting stock:", error);
            throw error;
        }
    };

    const deleteIngredient = async (id) => {
        try {
            await fetch(`${API_URL}/inventory/${id}`, {
                method: 'DELETE'
            });
            setInventory(prev => prev.filter(i => i.id !== id && i.InventoryId !== id));
        } catch (error) {
            console.error("Error deleting ingredient:", error);
            throw error;
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
