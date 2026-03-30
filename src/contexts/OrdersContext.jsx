import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInventory } from './InventoryContext';
import { useUI } from './UIContext';

const OrdersContext = createContext();
const API_URL = '/api';

export const useOrders = () => useContext(OrdersContext);

export const OrdersProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { deductStock } = useInventory();
    const { showLoader, hideLoader, showNotification } = useUI();

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/orders`);
            const data = await res.json();
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const addOrder = async (orderData, consolidatedIngredients) => {
        showLoader('Processing order...');
        try {
            await deductStock(consolidatedIngredients);

            const totalAmount = orderData.TotalAmount;
            const paidAmount = orderData.PaidAmount || 0;
            const balanceAmount = totalAmount - paidAmount;

            const newOrder = {
                CustomerName: orderData.CustomerName || 'Guest',
                CustomerId: orderData.CustomerId || null,
                OrderDate: orderData.OrderDate || new Date().toLocaleDateString('en-CA'),
                BillDate: orderData.OrderDate || new Date().toLocaleDateString('en-CA'),
                TotalAmount: totalAmount,
                PaidAmount: paidAmount,
                BalanceAmount: balanceAmount,
                PaymentType: orderData.PaymentType || 'Cash',
                PaymentStatus: balanceAmount > 0 ? 'Pending' : 'Paid',
                OrderStatus: 'Pending',
                items: orderData.items || []
            };

            await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });
            
            await fetchOrders();
            showNotification('Order created successfully!');
            return true;
        } catch (error) {
            console.error("Error adding order:", error);
            showNotification(error.message || 'Failed to create order', 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ OrderStatus: newStatus })
            });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, OrderStatus: newStatus } : o));
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    };

    const updatePaymentStatus = async (orderId, newStatus) => {
        try {
            await fetch(`${API_URL}/orders/${orderId}/payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ PaymentStatus: newStatus })
            });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, PaymentStatus: newStatus } : o));
        } catch (error) {
            console.error("Error updating payment status:", error);
            throw error;
        }
    };

    const updateOrderPayment = async (orderId, paidAmount, paymentType) => {
        try {
            const order = orders.find(o => o.id === orderId || o.OrderId === orderId);
            if (!order) return;

            const currentPaid = order.PaidAmount || 0;
            const paymentToAdd = parseFloat(paidAmount);
            const newPaidAmount = currentPaid + paymentToAdd;
            const newBalanceAmount = order.TotalAmount - newPaidAmount;
            
            const newPaymentStatus = newBalanceAmount <= 0.1 ? 'Paid' : 'Partial';

            const updateData = {
                PaidAmount: newPaidAmount,
                BalanceAmount: newBalanceAmount,
                PaymentStatus: newPaymentStatus
            };
            
            if (paymentType) {
                updateData.PaymentType = paymentType;
            }

            await fetch(`${API_URL}/orders/${orderId}/payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
        } catch (error) {
            console.error("Error updating order payment:", error);
            throw error;
        }
    };

    const deleteOrder = async (orderId) => {
        showLoader('Deleting order...');
        try {
            await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'DELETE'
            });
            setOrders(prev => prev.filter(o => o.id !== orderId));
            showNotification('Order deleted.');
        } catch (error) {
            console.error("Error deleting order:", error);
            showNotification(error.message || 'Failed to delete order', 'error');
            throw error;
        } finally {
            hideLoader();
        }
    };

    return (
        <OrdersContext.Provider value={{ 
            orders, 
            loading,
            addOrder, 
            updateOrderStatus, 
            updatePaymentStatus, 
            updateOrderPayment,
            deleteOrder,
            fetchOrders
        }}>
            {children}
        </OrdersContext.Provider>
    );
};
