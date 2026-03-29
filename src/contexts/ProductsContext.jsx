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
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const newProduct = await res.json();
            // Re-fetch to ensure UI is in sync with DB
            await fetchProducts();
            return newProduct;
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            // Re-fetch to ensure UI reflects latest DB state
            await fetchProducts();
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    };

    const uploadProductImage = async (id, base64DataUrl) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}/image`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64DataUrl })
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            // Optimistic local update (image is large, avoid full refetch)
            setProducts(prev => prev.map(p =>
                (p.ProductId === id || p.id === id) ? { ...p, image: base64DataUrl } : p
            ));
        } catch (error) {
            console.error("Error uploading product image:", error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            // Re-fetch to ensure UI reflects latest DB state
            await fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    };

    return (
        <ProductsContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, fetchProducts, uploadProductImage }}>
            {children}
        </ProductsContext.Provider>
    );
};
