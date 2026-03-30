import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUI } from './UIContext';

const ProductsContext = createContext();
const API_URL = '/api';

export const useProducts = () => useContext(ProductsContext);

export const ProductsProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showLoader, hideLoader, showNotification } = useUI();

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
        showLoader('Adding product...');
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const newProduct = await res.json();
            await fetchProducts();
            showNotification('Product added successfully!');
            return newProduct;
        } catch (error) {
            console.error("Error adding product:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        showLoader('Updating product...');
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            await fetchProducts();
            showNotification('Product updated!');
        } catch (error) {
            console.error("Error updating product:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const uploadProductImage = async (id, base64DataUrl) => {
        showLoader('Uploading image...');
        try {
            const res = await fetch(`${API_URL}/products/${id}/image`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64DataUrl })
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            setProducts(prev => prev.map(p =>
                (p.ProductId === id || p.id === id) ? { ...p, image: base64DataUrl } : p
            ));
            showNotification('Image uploaded!');
        } catch (error) {
            console.error("Error uploading product image:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const deleteProduct = async (id) => {
        showLoader('Deleting product...');
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            await fetchProducts();
            showNotification('Product deleted successfully!');
        } catch (error) {
            console.error("Error deleting product:", error);
            showNotification(error.message, 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    return (
        <ProductsContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, fetchProducts, uploadProductImage }}>
            {children}
        </ProductsContext.Provider>
    );
};
