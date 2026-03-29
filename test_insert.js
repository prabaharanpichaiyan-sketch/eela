async function test() {
    try {
        const res = await fetch("https://eela.netlify.app/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                IngredientName: "Test Insert",
                Unit: "kg",
                QuantityAvailable: 10,
                LowStockLimit: 5
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
