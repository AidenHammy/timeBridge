// Listens to what you type, waits for you to pause and logs any times it finds

let typingTimer;
const doneTypingInterval = 250;

// We listen on the whole document in the capture phase
// This way, we catch stuff even if the site (like Gmail or Slack) builds its text box way after the page loads
document.addEventListener("input", function(e) {
    clearTimeout(typingTimer);
    
    let target = e.target;
    
    let isText = target.tagName === "TEXTAREA" || target.isContentEditable;
    if (target.tagName === "INPUT") {
        let type = (target.type || "text").toLowerCase();
        if (["text", "search", "email", ""].includes(type)) {
            isText = true;
        }
    }

    if (isText) {
        typingTimer = setTimeout(function() {
            let text = target.value || target.innerText || "";
            if (text.trim() === "") return;
            
            if (!window.chrono) {
                console.warn("[TimeBridge] chrono didn't load. Check manifest script order.");
                return;
            }

            let results = window.chrono.parse(text, new Date());
            if (results.length > 0) {
                console.log(`[TimeBridge] Found some times on ${window.location.hostname}:`);
                results.forEach(r => {
                    console.log(`  - "${r.text}" => ${r.start.date().toString()}`);
                });
            }
        }, doneTypingInterval);
    }
}, true);

console.log("[TimeBridge] content script loaded on:", window.location.hostname);