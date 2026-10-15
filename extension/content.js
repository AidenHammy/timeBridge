let typingTimer = null;
let cachedContacts = [];
let lastUsedContactId = null;
let siteEnabled = false;
let listenersAttached = false;

let badgeEl = null;
let activeField = null;
let currentDetection = null;
let badgeExpanded = false;

const DEFAULT_ENABLED_SITES = ["whatsapp.com", "slack.com", "mail.google.com"];

function siteIsEnabled(sites) {
  let host = window.location.hostname;
  for (let i = 0; i < sites.length; i++) {
    let site = sites[i];
    if (host === site || host.endsWith("." + site)) return true;
  }
  return false;
}

function attachListeners() {
  if (listenersAttached) return;
  document.addEventListener("input", handleInput, true);
  document.addEventListener("keydown", handleEnterKey, true);
  document.addEventListener("click", handleOutsideClick, true);
  window.addEventListener("scroll", handleScroll, true);
  listenersAttached = true;
}

function detachListeners() {
  if (!listenersAttached) return;
  document.removeEventListener("input", handleInput, true);
  document.removeEventListener("keydown", handleEnterKey, true);
  document.removeEventListener("click", handleOutsideClick, true);
  window.removeEventListener("scroll", handleScroll, true);
  listenersAttached = false;
  hideBadge();
}

chrome.storage.local.get(["contacts", "enabledSites"], function(res) {
  cachedContacts = res.contacts || [];
  if (!lastUsedContactId && cachedContacts.length > 0) {
    lastUsedContactId = cachedContacts[cachedContacts.length - 1].id;
  }
  
  let sites = res.enabledSites || DEFAULT_ENABLED_SITES;
  siteEnabled = siteIsEnabled(sites);
  
  if (siteEnabled) {
    attachListeners();
  } else {
    console.log("[TimeBridge] inactive on", window.location.hostname);
  }
});

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== "local") return;

  if (changes.contacts) {
    cachedContacts = changes.contacts.newValue || [];
    if (badgeEl && badgeExpanded) {
      renderContactChips();
      updateBadgeTime();
    }
  }

  if (changes.enabledSites) {
    let sites = changes.enabledSites.newValue || DEFAULT_ENABLED_SITES;
    let nowEnabled = siteIsEnabled(sites);
    if (nowEnabled && !siteEnabled) {
      siteEnabled = true;
      attachListeners();
    } else if (!nowEnabled && siteEnabled) {
      siteEnabled = false;
      detachListeners();
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
    <button class="tb-icon">🕐</button>
    <div class="tb-panel" hidden>
      <div class="tb-badge-row">
        <span class="tb-badge-phrase"></span>
        <button class="tb-badge-close">✕</button>
      </div>
      <div class="tb-chip-row"></div>
      <div class="tb-badge-time"></div>
    </div>
  `;
  document.body.appendChild(badgeEl);
  
  badgeEl.querySelector(".tb-icon").onclick = function(e) {
    e.stopPropagation();
    setExpanded(!badgeExpanded);
  };
  
  badgeEl.querySelector(".tb-badge-close").onclick = function(e) {
    e.stopPropagation();
    hideBadge();
  };
  
  return badgeEl;
}

function setExpanded(expand) {
  badgeExpanded = expand;
  let panel = badgeEl.querySelector(".tb-panel");
  panel.hidden = !expand;
}

function hideBadge() {
  if (badgeEl) badgeEl.style.display = "none";
  activeField = null;
  currentDetection = null;
  badgeExpanded = false;
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

function renderContactChips() {
  let row = badgeEl.querySelector(".tb-chip-row");
  row.innerHTML = "";
  
  if (cachedContacts.length === 0) {
    let msg = document.createElement("span");
    msg.className = "tb-chip-empty";
    msg.textContent = "No contacts added";
    row.appendChild(msg);
    return;
  }
  
  for (let i = 0; i < cachedContacts.length; i++) {
    let c = cachedContacts[i];
    let chip = document.createElement("button");
    chip.className = "tb-chip";
    chip.textContent = c.name;
    if (c.id === lastUsedContactId) chip.classList.add("active");
    
    chip.onclick = function(e) {
      e.stopPropagation();
      lastUsedContactId = c.id;
      renderContactChips();
      updateBadgeTime();
    };
    row.appendChild(chip);
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
  renderContactChips();
  updateBadgeTime();
}

function handleScroll() {
  if (activeField && badgeEl && badgeEl.style.display !== "none") {
    positionBadge(activeField);
  }
}

function handleOutsideClick(event) {
  if (badgeExpanded && badgeEl && !badgeEl.contains(event.target)) {
    setExpanded(false);
  }
}

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

function handleEnterKey(event) {
  if (event.key !== "Enter" || event.shiftKey || event.target !== activeField) return;
  
  let field = event.target;
  setTimeout(function() {
    if (field !== activeField) return;
    if (getText(field).trim() === "") {
      clearTimeout(typingTimer);
      hideBadge();
    }
  }, 50);
}

console.log("[TimeBridge] running on", window.location.hostname);