chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Received message in background.js:", request);

    if (request.action === "extractPDF") {
        console.log("🔍 Processing PDF...");

        extractPDFText(request.fileData)
            .then(text => {
                console.log("✅ Extracted PDF Text:", text);

                // Store extracted CV text in Chrome storage
                chrome.storage.local.set({ cvData: text }, () => {
                    console.log("📂 CV text saved in storage.");
                    sendResponse({ success: true, text });
                });
            })
            .catch(error => {
                console.error("❌ Error extracting text from PDF:", error);
                sendResponse({ success: false, error: "⚠️ Failed to extract text from PDF." });
            });

        return true; // ✅ Keeps message port open for async response
    }

    if (request.action === "getCV") {
        chrome.storage.local.get("cvData", (data) => {
            sendResponse({ cvText: data.cvData || "⚠️ No CV stored yet." });
        });

        return true; // ✅ Keeps message port open
    }
});

function base64ToUint8Array(base64) {
    let binaryString = atob(base64); // Decode Base64 to binary
    let length = binaryString.length;
    let bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function getPDFFromStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["pdfFile"], (result) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Error retrieving PDF file:", chrome.runtime.lastError.message);
                reject("⚠️ Error retrieving PDF file.");
                return;
            }

            if (!result.pdfFile) {
                reject("⚠️ No PDF file found in storage.");
                return;
            }

            resolve(result.pdfFile);
        });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Received message in background.js:", request);

    if (request.action === "processPDF") {
        console.log("🔍 Retrieving PDF from Chrome storage...");

        getPDFFromStorage()
            .then(async (base64Data) => {
                let fileData = base64ToUint8Array(base64Data);
                console.log("📂 Converted file back to binary. Size:", fileData.length, "bytes");

                try {
                    console.log("📤 Sending PDF to backend for text extraction...");

                    // ✅ Convert Uint8Array to Blob
                    let blob = new Blob([fileData], { type: "application/pdf" });

                    // ✅ Create FormData object
                    let formData = new FormData();
                    formData.append("pdf_file", blob, "document.pdf");

                    let response = await fetch("https://automators.cc/cv/extract-pdf-text.php", {
                        method: "POST",
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error("⚠️ Backend server returned an error.");
                    }

                    let result = await response.json();
                    if (result.success) {
                        // ✅ Store the extracted CV text in Chrome storage
                        chrome.storage.local.set({ cvText: result.text }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("❌ Error storing CV text:", chrome.runtime.lastError.message);
                            } else {
                                console.log("✅ CV text stored successfully in Chrome storage.");
                            }
                        }); sendResponse({ success: true, text: result.text.trim() });
                    } else {
                        throw new Error(result.error || "⚠️ Failed to extract text from PDF.");
                    }
                } catch (error) {
                    console.error("❌ Error extracting text from PDF:", error);
                    sendResponse({ success: false, error: "⚠️ Failed to extract text from PDF." });
                }
            })
            .catch((error) => {
                console.error("❌ Error processing PDF:", error);
                sendResponse({ success: false, error });
            });

        return true; // ✅ Keep message channel open for async operations
    }
});

async function processOpenAIRequest(action, cvText, jobDescription, sendResponse) {
    chrome.storage.local.get(["apiKey"], async (data) => {
        if (!data.apiKey) {
            console.error("❌ Missing OpenAI API Key");
            sendResponse({ error: "⚠️ OpenAI API Key is missing! Please add it in Settings." });
            return;
        }

        if (!cvText) {
            console.error("❌ No CV found in request");
            sendResponse({ error: "⚠️ No CV text found. Please upload your CV first." });
            return;
        }

        if (!jobDescription) {
            console.error("❌ No Job Description found in request");
            sendResponse({ error: "⚠️ No Job Description provided. Please enter a job description." });
            return;
        }

        console.log(`📨 Processing OpenAI Request for ${action}...`);
        console.log("📄 CV Text Length:", cvText.length);
        console.log("📝 Job Description:", jobDescription);

        let prompt = "";

        if (action === "generateCoverLetter") {
            prompt = `I am applying for this job:\n\n${jobDescription}\n\nHere is my CV:\n${cvText}\n\nGenerate a professional and well-structured cover letter tailored to this job.`;
            console.log(prompt);
        } else if (action === "updateCV") {
            prompt = `Modify my CV to better align with the following job description:\n\n${jobDescription}\n\nCurrent CV:\n${cvText}\n\nEnsure clarity, professionalism, and relevance.`;
            console.log(prompt);
        }

        try {
            let response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${data.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7
                })
            });

            let responseData = await response.json();

            if (responseData.error) {
                console.error("❌ OpenAI API Error:", responseData.error.message);
                sendResponse({ error: `⚠️ OpenAI API Error: ${responseData.error.message}` });
                return;
            }

            console.log(`✅ OpenAI Response Received for ${action}:`, responseData);

            sendResponse({ result: responseData.choices[0]?.message?.content.trim() || "⚠️ OpenAI response error." });

        } catch (error) {
            console.error("❌ OpenAI API Request Failed:", error);
            sendResponse({ error: "⚠️ Error contacting OpenAI. Check your API key and try again." });
        }
    });
}

// ✅ Listen for messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "generateCoverLetter" || request.action === "updateCV") {
        console.log(`📩 Received request to ${request.action}.`);

        processOpenAIRequest(request.action, request.cvText, request.jobDescription, sendResponse);

        return true; // ✅ Keeps the message channel open for async operations
    }
});


