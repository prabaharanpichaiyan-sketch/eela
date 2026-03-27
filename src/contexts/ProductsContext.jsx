import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductsContext = createContext();
const API_URL = 'http://localhost:3000/api';

export const useProducts = () => useContext(ProductsContext);

export const ProductsProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/products`);
            const data = await res.json();
            setProducts(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const addProduct = async (product) => {
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            const newProduct = await res.json();
            setProducts(prev => [...prev, newProduct]);
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    };

    return (
        <ProductsContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, fetchProducts }}>
            {children}
        </ProductsContext.Provider>
    );
};
