(async () => {
  try {
    console.log("Fetching placeholder image...");
    const imgResp = await fetch(
      "https://via.placeholder.com/640x480.png?text=Test"
    );
    const ab = await imgResp.arrayBuffer();

    const form = new FormData();
    form.append("type", "stranger");
    // Node's global Blob is available in recent Node versions
    const blob = new Blob([ab], { type: "image/png" });
    form.append("image", blob, "test.png");

    console.log("Posting to backend...");
    const res = await fetch("http://localhost:3001/api/events", {
      method: "POST",
      body: form,
    });
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (e) {
    console.error("Error during test POST:", e);
    process.exit(1);
  }
})();
