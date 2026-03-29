async function test() {
    const res = await fetch("https://eela.netlify.app/api/inventory");
    const json = await res.json();
    console.log("Length:", json.length);
    console.log("Data:", json);
}
test();
