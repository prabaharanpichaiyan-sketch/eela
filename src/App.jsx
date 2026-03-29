import React, { useState } from 'react';
import { InventoryProvider } from './contexts/InventoryContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { CustomersProvider } from './contexts/CustomersContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import CustomerOrderHistory from './pages/CustomerOrderHistory';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Users from './pages/Users';
import CreateOrderPage from './pages/CreateOrderPage';
import { AuthContext } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';


function App() {
    const { currentUser } = React.useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'inventory': return <Inventory />;
            case 'products': return <Products />;
            case 'billing': return <Billing />;
            case 'orders': return <Orders setActiveTab={setActiveTab} />;
            case 'customers': return <Customers />;
            case 'history': return <CustomerOrderHistory />;
            case 'reports': return <Reports />;
            case 'users': return currentUser?.role === 'admin' ? <Users /> : <Dashboard />;
            default: return <Dashboard />;
        }
    };

    if (!currentUser) {
        return <Login />;
    }

    // Full-screen pages (no sidebar)
    if (activeTab === 'create-order') {
        return (
            <InventoryProvider>
                <ProductsProvider>
                    <CustomersProvider>
                        <OrdersProvider>
                            <CreateOrderPage onBack={() => setActiveTab('orders')} />
                        </OrdersProvider>
                    </CustomersProvider>
                </ProductsProvider>
            </InventoryProvider>
        );
    }

    return (
        <InventoryProvider>
            <ProductsProvider>
                <CustomersProvider>
                    <OrdersProvider>
                        <div className="app-container">
                        <Sidebar 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab} 
                        />
                        <main className="content-area">
                            {renderContent()}
                        </main>
                    </div>
                    </OrdersProvider>
                </CustomersProvider>
            </ProductsProvider>
        </InventoryProvider>
    );
}

export default App;
