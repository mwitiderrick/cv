
function downloadFile(content, filename) {
    let blob = new Blob([content], { type: "text/plain" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copyToClipboard(content) {
    navigator.clipboard.writeText(content).then(() => {
        alert("Copied to clipboard!");
    });
}

// Add buttons dynamically
let downloadButton = document.createElement("button");
downloadButton.innerText = "📥 Download";
downloadButton.id = "download-btn";
document.getElementById("extract").appendChild(downloadButton);

let copyButton = document.createElement("button");
copyButton.innerText = "📋 Copy";
copyButton.id = "copy-btn";
document.getElementById("extract").appendChild(copyButton);

// Event Listeners
downloadButton.addEventListener("click", () => {
    let text = document.getElementById("job-description").value;
    downloadFile(text, "Generated_Document.txt");
});

copyButton.addEventListener("click", () => {
    let text = document.getElementById("job-description").value;
    copyToClipboard(text);
});
