// src/clearData.js
// Utility script to clear all data from Local SQLite API
async function clearAllData() {
    try {
        console.log('Starting to clear all data via local API...');
        const res = await fetch('http://localhost:3000/api/clear-all', { method: 'DELETE' });
        if (res.ok) {
            console.log('✅ All data cleared successfully!');
        } else {
            console.error('Server returned an error');
        }
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

clearAllData();
