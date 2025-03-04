async function callOpenAI(taskType, jobDesc, cv) {
    const apiKey = await new Promise(resolve => {
        chrome.storage.local.get("apiKey", data => resolve(data.apiKey));
    });

    if (!apiKey) {
        alert("⚠️ OpenAI API key is missing! Please add it in the Settings.");
        return null;
    }

    let prompt = "";

    if (taskType === "coverLetter") {
        prompt = `I am applying for this job:\n\n${jobDesc}\n\nHere is my CV:\n${cv}\n\nPlease generate a highly professional and tailored cover letter that highlights my skills for this job.`;
    } else if (taskType === "updateCV") {
        prompt = `This is my current CV:\n${cv}\n\nThis is the job description:\n${jobDesc}\n\nUpdate my CV to better match the job while keeping it concise and professional.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content.trim();
}

// Handle Cover Letter Generation
document.getElementById("generate-cover").addEventListener("click", async () => {
    let jobDesc = document.getElementById("job-description").value;
    let cv = await new Promise(resolve => {
        chrome.storage.local.get("cvData", data => resolve(data.cvData));
    });

    if (!cv || !jobDesc) {
        alert("⚠️ Please upload your CV and extract a job description first!");
        return;
    }

    let coverLetter = await callOpenAI("coverLetter", jobDesc, cv);
    if (coverLetter) {
        document.getElementById("job-description").value = coverLetter;
    }
});

// Handle CV Update
document.getElementById("update-cv").addEventListener("click", async () => {
    let jobDesc = document.getElementById("job-description").value;
    let cv = await new Promise(resolve => {
        chrome.storage.local.get("cvData", data => resolve(data.cvData));
    });

    if (!cv || !jobDesc) {
        alert("⚠️ Please upload your CV and extract a job description first!");
        return;
    }

    let updatedCV = await callOpenAI("updateCV", jobDesc, cv);
    if (updatedCV) {
        chrome.storage.local.set({ cvData: updatedCV });
        alert("✅ CV updated successfully!");
    }
});
// Show loading state
function showLoading() {
    document.getElementById("loading-indicator").style.display = "block";
}

// Hide loading state
function hideLoading() {
    document.getElementById("loading-indicator").style.display = "none";
}

document.getElementById("generate-cover").addEventListener("click", async () => {
    showLoading();
    let jobDesc = document.getElementById("job-description").value;
    let cv = await new Promise(resolve => {
        chrome.storage.local.get("cvData", data => resolve(data.cvData));
    });

    if (!cv || !jobDesc) {
        alert("⚠️ Please upload your CV and extract a job description first!");
        hideLoading();
        return;
    }

    let coverLetter = await callOpenAI("coverLetter", jobDesc, cv);
    hideLoading();

    if (coverLetter) {
        document.getElementById("job-description").value = coverLetter;
    }
});
