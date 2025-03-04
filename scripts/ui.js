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
                    <button id="download-btn">📥 Download</button>
                    <button id="copy-btn">📋 Copy</button>
                    <p id="loading-indicator" style="display: none;">⏳ Processing...</p>
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

})();
