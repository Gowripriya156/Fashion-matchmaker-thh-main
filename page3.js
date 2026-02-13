// --- DOM ELEMENT SELECTIONS ---
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewImg = document.getElementById('preview-img');
const uploadUI = document.getElementById('upload-ui');
const generateBtn = document.getElementById('generate-btn');
const errorMsg = document.getElementById('error-msg');
const signOutBtn = document.querySelector('.sign-out');

// --- 1. IMAGE UPLOAD & PREVIEW LOGIC ---
// Trigger file input when clicking the dashed upload zone
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        // Remove error message if visible
        errorMsg.classList.add('hidden');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            uploadUI.classList.add('hidden'); // Hide the icon and "Click to upload" text
            
            // Enable the 'Find Matches' button style
            generateBtn.classList.add('ready');
        };
        reader.readAsDataURL(file);
    }
});

// --- 2. PILL SELECTION LOGIC (OCCASION/GENDER) ---
document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', function() {
        // Find all siblings in the same grid and remove active class
        const parentGrid = this.parentElement;
        parentGrid.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        
        // Add active class to the clicked pill
        this.classList.add('active');
    });
});

// --- 3. AI GENERATION & API INTEGRATION SPACE ---
generateBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];

    // STOP if no image is uploaded (prevents empty buffering)
    if (!file) {
        errorMsg.classList.remove('hidden');
        return;
    }

    // Switch UI to Loading State
    switchState('loading');

    try {
        // --- GEMINI API INTEGRATION BLOCK ---
        // 1. Collect user preferences
        const occasion = document.querySelector('.pill.active').innerText;
        const searchDescription = document.getElementById('search-context').value;
        
        /* DEVELOPER NOTE: 
        To connect to Gemini, you would typically use a fetch call to your backend 
        or use the Google Generative AI SDK here.
        
        Example structure:
        const response = await fetch('/api/recommend-style', {
            method: 'POST',
            body: JSON.stringify({ occasion, searchDescription, image: previewImg.src })
        });
        const data = await response.json();
        */

        // 2. SIMULATED API RESPONSE (3 second delay)
        setTimeout(() => {
            const aiDescription = `For your ${occasion} event, Gemini suggests pairing your outfit with the items you requested: ${searchDescription || 'minimalist accessories'}. We recommend soft neutral tones to maintain a professional yet modern look.`;
            
            // For now, we use the uploaded image as the result placeholder
            const aiResultImage = previewImg.src; 
            
            showFinalResult(aiDescription, aiResultImage);
        }, 3000);

    } catch (err) {
        console.error("Gemini AI Error:", err);
        switchState('empty');
        alert("The AI is currently resting. Please try again in a moment.");
    }
});

// --- 4. SIGN OUT REDIRECTION ---
signOutBtn.addEventListener('click', () => {
    // Clear local storage (username, preferences, etc.)
    localStorage.clear();
    
    // Redirect to the first page (index.html or entry page)
    window.location.href = 'page1.html';
});

// --- 5. HELPER FUNCTIONS ---
function switchState(state) {
    // Hide all main canvas views
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('result-state').classList.add('hidden');

    // Show the requested state
    document.getElementById(`${state}-state`).classList.remove('hidden');
}

function showFinalResult(description, imageUrl) {
    document.getElementById('output-desc').innerText = description;
    document.getElementById('output-image').src = imageUrl;
    switchState('result');
}

// Download/Save functionality
window.downloadImage = () => {
    const link = document.createElement('a');
    link.download = 'My-Fashion-Match.jpg';
    link.href = document.getElementById('output-image').src;
    link.click();
};