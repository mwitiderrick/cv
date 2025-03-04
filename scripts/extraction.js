function extractJobDescription() {
    let jobText = "";
    let keywordPatterns = [
        /job description/i,
        /responsibilities/i,
        /qualifications/i,
        /requirements/i,
        /skills/i,
        /duties/i
    ];

    // Identify job sections based on keywords
    document.querySelectorAll("p, div, li").forEach(element => {
        let text = element.innerText.trim();
        if (keywordPatterns.some(pattern => pattern.test(text))) {
            jobText += text + "\n\n";
        }
    });

    // Alternative approach: Detect job description sections on popular job sites
    let jobSiteSpecificSelectors = [
        "#jobDescriptionText",  // Indeed
        ".show-more-less-html__markup",  // LinkedIn
        ".jobDescriptionContent",  // Glassdoor
        ".job-detail__body",  // Generic container
    ];

    jobSiteSpecificSelectors.forEach(selector => {
        let element = document.querySelector(selector);
        if (element) jobText += element.innerText.trim() + "\n\n";
    });

    return jobText || "No job description found.";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractJobDescription") {
        let jobDesc = extractJobDescription();
        sendResponse({ jobDescription: jobDesc });
    }
});
