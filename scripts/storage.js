function compressText(text) {
    return btoa(unescape(encodeURIComponent(text))); // Encode to base64
}

function decompressText(text) {
    return decodeURIComponent(escape(atob(text))); // Decode from base64
}

// Store CV
document.getElementById("save-cv").addEventListener("click", () => {
    let fileInput = document.getElementById("cv-upload");
    if (fileInput.files.length > 0) {
        let reader = new FileReader();
        reader.onload = function(event) {
            let compressedCV = compressText(event.target.result);
            chrome.storage.local.set({ cvData: compressedCV }, () => {
                alert("✅ CV stored successfully!");
            });
        };
        reader.readAsText(fileInput.files[0]);
    }
});

// Retrieve CV
async function getCV() {
    return new Promise(resolve => {
        chrome.storage.local.get("cvData", data => {
            resolve(data.cvData ? decompressText(data.cvData) : null);
        });
    });
}
