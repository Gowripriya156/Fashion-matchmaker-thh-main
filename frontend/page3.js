document.addEventListener("DOMContentLoaded", () => {
    // --- 1. DOM ELEMENTS ---
    const fileInput = document.getElementById("file-input");
    const dropZone = document.getElementById("drop-zone");
    const previewImg = document.getElementById("preview-img");
    const uploadUI = document.getElementById("upload-ui");
    const generateBtn = document.getElementById("generate-btn");
    const resultBox = document.getElementById("result-box");
    const errorMsg = document.getElementById("error-msg");
    const signOutBtn = document.getElementById("sign-out-btn") || document.querySelector(".sign-out");

    const emptyState = document.getElementById("empty-state");
    const loadingState = document.getElementById("loading-state");
    const resultState = document.getElementById("result-state");

    // --- 2. CONFIGURATION ---
    const API_URL = "/api/style"; // Secure Proxy (Update to full URL for Live Server compatibility)

    // --- 3. UI HANDLERS ---
    // Load user name from page2's localStorage
    const savedName = localStorage.getItem("userName");
    const userNameElement = document.querySelector(".user-name");
    if (savedName && userNameElement) {
        userNameElement.innerText = savedName;
    }

    if (signOutBtn) {
        signOutBtn.addEventListener("click", () => {
            window.location.href = "page1.html";
        });
    }

    dropZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove("hidden");
            uploadUI.classList.add("hidden");
            generateBtn.classList.add("ready");
            if (errorMsg) errorMsg.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    });

    document.querySelectorAll(".pill").forEach(pill => {
        pill.addEventListener("click", function () {
            this.parentElement.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // --- 4. STYLE GENERATION ---
    generateBtn.addEventListener("click", async () => {
        if (!generateBtn.classList.contains("ready")) return;
        switchState("loading");

        try {
            const base64Data = previewImg.src.split(",")[1];

            // Get selected Gender
            const activeGenderPill = document.querySelector(".gender-pills .pill.active");
            const gender = activeGenderPill ? activeGenderPill.getAttribute("data-gender") : "Women";

            const activeOccasionPill = document.querySelector(".occasion-pills .pill.active");
            const occasion = activeOccasionPill ? activeOccasionPill.innerText : "Casual";
            const context = document.getElementById("search-context").value;

            // Improved Prompt for better AI-generated visual descriptions
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `You are a high-end fashion stylist. Style this uploaded piece for a ${gender} ${occasion} event. 
                                     Complement it with specific items (shoes, jewelry/accessories, bag/backpack).
                                     Return ONLY JSON: {
                                       "shoes": {"name": "specific name", "desc": "detailed description of the item style and why it matches", "visual_prompt": "highly detailed visual prompt for AI image generation of these shoes"},
                                       "jewelry": {"name": "specific name", "desc": "detailed description of the item style and why it matches (e.g. watch, necklace, etc)", "visual_prompt": "highly detailed visual prompt for AI image generation of this jewelry"},
                                       "bag": {"name": "specific name", "desc": "detailed description of the item style and why it matches", "visual_prompt": "highly detailed visual prompt for AI image generation of this bag"},
                                       "advice": "A short, professional stylist's tip regarding the overall look."
                                     }`
                            },
                            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                        ]
                    }]
                })
            });

            // Robust response handling
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                // If response is not JSON (e.g., HTML 404 from Live Server), throw text
                throw new Error(`Server Error: Received non-JSON response. \n${responseText.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error("Server Error: " + (data.error?.message || JSON.stringify(data.error) || response.statusText));
            }

            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            displayResult(aiText);

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            switchState("empty");
        }
    });

    // --- 5. RESULT RENDERING ---
    function displayResult(text) {
        let parsed;
        try {
            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            switchState("empty");
            return;
        }

        // Professional 2x2 Grid Output
        resultBox.innerHTML = `
            <div class="shop-the-look-container" id="download-area">
                <h2 style="letter-spacing: 3px; font-weight: 300; margin-bottom: 25px;">CURATED LOOK</h2>
                <div class="outfit-grid">
                    ${createGridTile("Shoes", parsed.shoes)}
                    ${createGridTile("Jewelry", parsed.jewelry)}
                    ${createGridTile("Handbag", parsed.bag)}
                </div>
                <div class="style-notes" style="margin-top: 25px; text-align: left; background: #f9f9f9; padding: 20px; border-radius: 12px; border-left: 4px solid #7C3AED; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <strong style="color: #7C3AED; display: block; margin-bottom: 5px;">Stylist Recommendation:</strong> 
                    <span style="font-size: 0.9rem; line-height: 1.5; color: #374151;">${parsed.advice}</span>
                </div>
                <button id="download-btn" class="find-btn ready" style="margin-top: 25px; max-width: 250px;">Save Look as Image</button>
            </div>
        `;


        // Save to History
        saveHistory(text, parsed);

        document.getElementById("download-btn").onclick = downloadLook;
        switchState("result");
    }

    function saveHistory(rawText, parsedData) {
        const currentUserEmail = localStorage.getItem('currentUserEmail');
        if (!currentUserEmail) return;

        const historyKey = `history_${currentUserEmail}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            outfitImage: previewImg.src,
            recommendations: parsedData,
            rawText: rawText
        };

        // Add to beginning, keep max 10
        history.unshift(newEntry);
        if (history.length > 10) history.pop();

        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    function createGridTile(category, item) {
        const name = item?.name || "Recommended Item";
        const desc = item?.desc || "Curated specifically for your style.";

        return `
            <div class="grid-item" style="text-align: center; padding: 20px; background: #F9FAFB; border-radius: 16px; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <p class="item-label" style="font-size: 1.1rem; color: #7C3AED; margin-bottom: 12px; font-weight: 700;">${name.toUpperCase()}</p>
                <p class="item-desc" style="font-size: 0.95rem; max-width: 100%; color: #4B5563; line-height: 1.6;">${desc}</p>
            </div>`;
    }

    // --- 6. HELPERS ---
    function switchState(state) {
        [emptyState, loadingState, resultState].forEach(el => el && el.classList.add("hidden"));
        const target = document.getElementById(`${state}-state`);
        if (target) target.classList.remove("hidden");
    }

    function downloadLook() {
        const element = document.getElementById("download-area");
        if (typeof html2canvas !== "undefined") {
            html2canvas(element, { useCORS: true }).then(canvas => {
                const link = document.createElement("a");
                link.download = "my-curated-look.png";
                link.href = canvas.toDataURL();
                link.click();
            });
        }
    }
});