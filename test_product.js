async function test() {
    try {
        const res = await fetch("https://eela.netlify.app/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ProductName: "Test Product",
                SellingPrice: 15.00,
                Description: "Test product inserted remotely",
                ingredients: [],
                image: null
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
