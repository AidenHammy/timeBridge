// listens for typing, parses dates with chrono and shows a floating badge

let typingTimer = null;
let cachedContacts = [];
let lastUsedContactId = null;
let badgeEl = null;
let activeField = null;
let currentDetection = null;

chrome.storage.local.get(["contacts"], function(res) {
  cachedContacts = res.contacts || [];
  if (!lastUsedContactId && cachedContacts.length > 0) {
    lastUsedContactId = cachedContacts[cachedContacts.length - 1].id;
  }
});

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area === "local" && changes.contacts) {
    cachedContacts = changes.contacts.newValue || [];
    if (badgeEl && badgeEl.style.display !== "none") {
      populateContactSelect();
      updateBadgeTime();
    }
  }
});

function isTextField(target) {
  if (!target) return false;
  if (target.tagName === "TEXTAREA") return true;
  if (target.tagName === "INPUT") {
    let type = (target.type || "text").toLowerCase();
    return ["text", "search", "email", ""].includes(type);
  }
  return target.isContentEditable;
}

// Get text from standard inputs or contenteditable divs
function getText(target) {
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
    return target.value || "";
  }
  if (target.isContentEditable) {
    let host = target.closest('[contenteditable="true"]') || target;
    return host.textContent || "";
  }
  return "";
}

function ensureBadge() {
  if (badgeEl) return badgeEl;
  
  badgeEl = document.createElement("div");
  badgeEl.className = "tb-badge";
  badgeEl.innerHTML = `
    <div class="tb-badge-row">
      <span class="tb-badge-phrase"></span>
      <button class="tb-badge-close">✕</button>
    </div>
    <div class="tb-badge-row">
      <span class="tb-badge-for">for</span>
      <select class="tb-badge-select"></select>
    </div>
    <div class="tb-badge-time"></div>
  `;
  document.body.appendChild(badgeEl);
  
  badgeEl.querySelector(".tb-badge-close").onclick = hideBadge;
  badgeEl.querySelector(".tb-badge-select").onchange = function(e) {
    lastUsedContactId = e.target.value;
    updateBadgeTime();
  };
  
  return badgeEl;
}

function hideBadge() {
  if (badgeEl) badgeEl.style.display = "none";
  activeField = null;
  currentDetection = null;
}

function positionBadge(field) {
  if (!field.isConnected) {
    hideBadge();
    return;
  }
  let rect = field.getBoundingClientRect();
  let badge = ensureBadge();
  badge.style.display = "block";
  badge.style.top = (rect.bottom + window.scrollY + 6) + "px";
  badge.style.left = (rect.left + window.scrollX) + "px";
}

function populateContactSelect() {
  let select = badgeEl.querySelector(".tb-badge-select");
  select.innerHTML = "";
  
  if (cachedContacts.length === 0) {
    let opt = document.createElement("option");
    opt.textContent = "No contacts added";
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }
  
  for (let i = 0; i < cachedContacts.length; i++) {
    let c = cachedContacts[i];
    let opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === lastUsedContactId) opt.selected = true;
    select.appendChild(opt);
  }
}

function updateBadgeTime() {
  let timeEl = badgeEl.querySelector(".tb-badge-time");
  if (!currentDetection) return;
  
  let contact = null;
  for (let i = 0; i < cachedContacts.length; i++) {
    if (cachedContacts[i].id === lastUsedContactId) {
      contact = cachedContacts[i];
      break;
    }
  }
  
  if (!contact) {
    timeEl.textContent = "";
    return;
  }
  
  try {
    let formatted = new Intl.DateTimeFormat(undefined, {
      timeZone: contact.timezone,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit"
    }).format(currentDetection.date);
    timeEl.textContent = contact.name + ": " + formatted + " (" + contact.timezone.replace(/_/g, " ") + ")";
  } catch (e) {
    timeEl.textContent = "Bad timezone";
  }
}

function showBadge(field, detection) {
  currentDetection = detection;
  activeField = field;
  ensureBadge();
  positionBadge(field);
  badgeEl.querySelector(".tb-badge-phrase").textContent = '"' + detection.text + '"';
  populateContactSelect();
  updateBadgeTime();
}

// move badge if page scrolls
window.addEventListener("scroll", function() {
  if (activeField && badgeEl && badgeEl.style.display !== "none") {
    positionBadge(activeField);
  }
}, true);

function handleInput(event) {
  let target = event.target;
  if (!isTextField(target)) return;
  
  clearTimeout(typingTimer);
  typingTimer = setTimeout(function() {
    let text = getText(target);
    if (!window.chrono) return;
    
    if (text.trim() === "") {
      if (target === activeField) hideBadge();
      return;
    }
    
    let results = window.chrono.parse(text, new Date());
    if (results.length === 0) {
      if (target === activeField) hideBadge();
      return;
    }
    
    let first = results[0];
    showBadge(target, { text: first.text, date: first.start.date() });
  }, 250);
}

document.addEventListener("input", handleInput, true);

// hide the badge instantly so it doesn't linger while the debounce finishes
document.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey && event.target === activeField) {
    clearTimeout(typingTimer);
    hideBadge();
  }
}, true);

console.log("[TimeBridge] running on", window.location.hostname);