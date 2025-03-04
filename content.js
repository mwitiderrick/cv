(function () {
    // Create floating button
    let floatingButton = document.createElement("button");
    floatingButton.innerText = "📝";
    floatingButton.id = "job-helper-button";
    document.body.appendChild(floatingButton);

    // Create modal container
    let modal = document.createElement("div");
    modal.id = "job-helper-modal";
    modal.innerHTML = `
        <div id="job-helper-overlay"></div>
        <div id="job-helper-content">
            <span id="job-helper-close">&times;</span>
            <div id="tabs">
                <button class="tab-btn" data-tab="upload">Upload CV</button>
                <button class="tab-btn" data-tab="extract">Extract Job</button>
                <button class="tab-btn" data-tab="settings">Settings</button>
            </div>
            <div id="tab-content">
                <div id="upload" class="tab-pane">
                    <input type="file" id="cv-upload" accept=".pdf,.doc,.docx">
                    <button id="save-cv">Save CV</button>
                </div>
                <div id="extract" class="tab-pane">
                    <button id="extract-job">Extract Job Description</button>
                    <textarea id="job-description" placeholder="Job description appears here..."></textarea>
                    <button id="generate-cover">Generate Cover Letter</button>
                    <button id="update-cv">Update CV</button>
                    <button id="copy-text" class="btn-secondary">Copy</button>

                </div>
            <div id="upload" class="tab-pane">
                <input type="file" id="cv-upload" accept=".pdf,.txt,.docx">
                <button id="save-cv">Extract & Save CV</button>
                <textarea id="cv-text" placeholder="Your CV text will appear here..." rows="10"></textarea>
                <button id="update-cv">Update CV</button>
            </div>

                <div id="settings" class="tab-pane">
                    <label>OpenAI API Key:</label>
                    <input type="text" id="api-key">
                    <button id="save-api">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Show modal on button click
    floatingButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    // Hide modal when clicking outside or close button
    document.getElementById("job-helper-close").addEventListener("click", () => {
        modal.style.display = "none";
    });
    document.getElementById("job-helper-overlay").addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Tab switching logic
    document.querySelectorAll(".tab-btn").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-pane").forEach(tab => tab.style.display = "none");
            document.getElementById(button.dataset.tab).style.display = "block";
        });
    });

    function arrayBufferToBase64(buffer) {
        let binary = '';
        let bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary); // Convert binary to Base64
    }
    
    document.getElementById("save-cv").addEventListener("click", async () => {
        let fileInput = document.getElementById("cv-upload");
    
        if (!fileInput.files.length) {
            alert("⚠️ Please select a CV file to upload.");
            return;
        }
    
        let file = fileInput.files[0];
        console.log("📂 Selected CV File:", file.name, "Size:", file.size, "bytes");
    
        let reader = new FileReader();
    
        reader.onload = async function (event) {
            let arrayBuffer = event.target.result;
            let base64String = arrayBufferToBase64(arrayBuffer); // Convert to Base64
    
            console.log("📄 Storing Base64 file data in Chrome storage. Size:", base64String.length, "characters");
    
            // ✅ Store the file as a Base64 string
            chrome.storage.local.set({ pdfFile: base64String }, () => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Error storing PDF file:", chrome.runtime.lastError.message);
                    alert("⚠️ Error storing PDF file.");
                    return;
                }
    
                console.log("✅ PDF file stored successfully.");
    
                // ✅ Send a message to background.js to process the PDF
                chrome.runtime.sendMessage({ action: "processPDF" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("❌ Error communicating with background script:", chrome.runtime.lastError.message);
                        alert("⚠️ Error contacting background script.");
                        return;
                    }
    
    
                    if (response.success) {
                        document.getElementById("cv-text").value = response.text;
                    } else {
                        alert(response.error || "⚠️ Failed to extract CV text.");
                    }
                });
            });
        };
    
        reader.onerror = function () {
            alert("⚠️ Error reading the CV file.");
        };
    
        reader.readAsArrayBuffer(file);
    });
    

async function extractPDFText(pdfFile) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = function () {
            let fileData = new Uint8Array(reader.result);

            chrome.runtime.sendMessage({ action: "extractPDF", fileData }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Error communicating with background script:", chrome.runtime.lastError.message);
                    reject("⚠️ Error contacting background script.");
                    return;
                }

                if (response.success) {
                    resolve(response.text);
                } else {
                    reject(response.error);
                }
            });
        };

        reader.onerror = function () {
            reject("⚠️ Error reading PDF file.");
        };

        reader.readAsArrayBuffer(pdfFile);
    });
}

    

    document.getElementById("extract-job").addEventListener("click", async () => {
        document.getElementById("job-description").value = "⏳ Extracting job description...";

        try {
            let jobDesc = extractJobDescription();

            if (!jobDesc || jobDesc.trim().length < 50) {
                alert("⚠️ No job description found. Try selecting the job text manually.");
                document.getElementById("job-description").value = "";
                return;
            }

            document.getElementById("job-description").value = jobDesc;
        } catch (error) {
            console.error("Error extracting job description:", error);
            alert("⚠️ Unable to extract job description. Please try again.");
            document.getElementById("job-description").value = "";
        }
    });

    // Function to extract job description from the page
    function extractJobDescription() {
        try {
            let jobDesc = "";

            // Try Readability.js (if available)
            if (typeof Readability !== "undefined") {
                let article = new Readability(document.cloneNode(true)).parse();
                jobDesc = article?.textContent.trim();
            }

            // Fallback: Extract from body text
            if (!jobDesc || jobDesc.length < 100) {
                jobDesc = document.body.innerText.trim();
            }

            return jobDesc || "⚠️ No job description found.";
        } catch (error) {
            console.error("Job extraction failed:", error);
            return "⚠️ No job description found.";
        }
    }




    // Save API Key
    document.getElementById("save-api").addEventListener("click", () => {
        let apiKey = document.getElementById("api-key").value;
        chrome.storage.local.set({ apiKey }, () => {
            alert("API Key saved!");
        });
    });

})();

async function sendOpenAIRequest(action) {
    let jobDescription = document.getElementById("job-description").value.trim(); // ✅ Store before modifying UI

    if (!jobDescription) {
        alert("⚠️ No job description found. Please enter a job description.");
        return;
    }

    document.getElementById("job-description").value = `⏳ Generating ${action === "generateCoverLetter" ? "cover letter" : "updated CV"}...`;

    chrome.storage.local.get(["cvText"], async (result) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Error retrieving storage data:", chrome.runtime.lastError.message);
            alert("⚠️ Error retrieving storage data.");
            return;
        }

        let cvText = result.cvText;

        if (!cvText) {
            alert("⚠️ No CV text found. Please upload your CV first.");
            return;
        }

        console.log(`📨 Sending request to background.js for ${action}...`);
        

        // ✅ Send message to background.js
        chrome.runtime.sendMessage({ action, cvText, jobDescription }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Error communicating with background script:", chrome.runtime.lastError.message);
                alert("⚠️ Error contacting background script.");
                return;
            }


            if (response.result) {
                console.log(`✅ Generated ${action === "generateCoverLetter" ? "Cover Letter" : "Updated CV"}:`, response.result);
                document.getElementById("job-description").value = response.result;
            } else {
                alert(response.error || `⚠️ Failed to ${action === "generateCoverLetter" ? "generate cover letter" : "update CV"}.`);
            }
        });
    });
}

// ✅ Event listeners for both actions
document.getElementById("generate-cover").addEventListener("click", () => sendOpenAIRequest("generateCoverLetter"));
document.getElementById("update-cv").addEventListener("click", () => sendOpenAIRequest("updateCV"));






document.getElementById("copy-text").addEventListener("click", () => {
    let textArea = document.getElementById("job-description");

    if (!textArea.value.trim()) {
        alert("⚠️ No text to copy.");
        return;
    }

    // ✅ Copy text to clipboard
    navigator.clipboard.writeText(textArea.value)
        .then(() => {
            console.log("✅ Text copied to clipboard.");
            alert("✅ Text copied!");
        })
        .catch((err) => {
            console.error("❌ Failed to copy text:", err);
            alert("⚠️ Error copying text.");
        });
});
