async function test() {
    const res = await fetch("https://eela.netlify.app/api/ping");
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
}
test();
