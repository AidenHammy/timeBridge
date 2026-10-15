// Handles the contact form, custom timezone combobox and site allowlist

const FALLBACK_TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Sao_Paulo", "Europe/London",
  "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Africa/Cairo",
  "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka",
  "Asia/Bangkok", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo",
  "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland",
];

const TZ_ALIASES = {
  india: ["Asia/Kolkata", "Asia/Calcutta"],
  ist: ["Asia/Kolkata", "Asia/Calcutta"],
  kolkata: ["Asia/Kolkata", "Asia/Calcutta"],
  calcutta: ["Asia/Kolkata", "Asia/Calcutta"],
  japan: ["Asia/Tokyo"],
  uk: ["Europe/London"], britain: ["Europe/London"], england: ["Europe/London"],
  germany: ["Europe/Berlin"],
  france: ["Europe/Paris"],
  spain: ["Europe/Madrid"],
  italy: ["Europe/Rome"],
  brazil: ["America/Sao_Paulo"],
  china: ["Asia/Shanghai"],
  australia: ["Australia/Sydney"],
  mexico: ["America/Mexico_City"],
  "south africa": ["Africa/Johannesburg"],
  korea: ["Asia/Seoul"], "south korea": ["Asia/Seoul"],
  thailand: ["Asia/Bangkok"],
  indonesia: ["Asia/Jakarta"],
  pakistan: ["Asia/Karachi"],
  bangladesh: ["Asia/Dhaka"],
  vietnam: ["Asia/Ho_Chi_Minh", "Asia/Saigon"],
  saigon: ["Asia/Ho_Chi_Minh", "Asia/Saigon"],
  "ho chi minh": ["Asia/Ho_Chi_Minh", "Asia/Saigon"],
  philippines: ["Asia/Manila"],
  egypt: ["Africa/Cairo"],
  nigeria: ["Africa/Lagos"],
  kenya: ["Africa/Nairobi"],
  turkey: ["Europe/Istanbul"],
  netherlands: ["Europe/Amsterdam"], holland: ["Europe/Amsterdam"],
  sweden: ["Europe/Stockholm"],
  norway: ["Europe/Oslo"],
  poland: ["Europe/Warsaw"],
  ireland: ["Europe/Dublin"],
  portugal: ["Europe/Lisbon"],
  switzerland: ["Europe/Zurich"],
  "new zealand": ["Pacific/Auckland"], nz: ["Pacific/Auckland"],
  israel: ["Asia/Jerusalem"],
  "saudi arabia": ["Asia/Riyadh"],
  argentina: ["America/Argentina/Buenos_Aires", "America/Buenos_Aires"],
  chile: ["America/Santiago"],
  colombia: ["America/Bogota"],
  peru: ["America/Lima"],
  est: ["America/New_York"], pst: ["America/Los_Angeles"],
  cst: ["America/Chicago"], mst: ["America/Denver"],
  gmt: ["UTC"], utc: ["UTC"],
};

const DEFAULT_ENABLED_SITES = ["whatsapp.com", "slack.com", "mail.google.com"];

function getTimezoneList() {
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch (e) {
      return FALLBACK_TIMEZONES;
    }
  }
  return FALLBACK_TIMEZONES;
}

function cityLabel(id) { return id.split("/").pop().replace(/_/g, " "); }

function offsetLabel(id) {
  try {
    let parts = new Intl.DateTimeFormat("en", {
      timeZone: id,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    let part = parts.find(function(p) { return p.type === "timeZoneName"; });
    return part ? part.value : "";
  } catch (e) {
    return "";
  }
}

let TZ_INDEX = [];

function buildTimezoneIndex() {
  let zones = getTimezoneList();
  if (!zones.includes("UTC")) zones.unshift("UTC");
  
  TZ_INDEX = zones.map(function(id) {
    return {
      id: id,
      city: cityLabel(id),
      searchableId: id.toLowerCase().replace(/_/g, " "),
      offset: offsetLabel(id),
    };
  });
}

function searchTimezones(query) {
  let q = query.trim().toLowerCase();
  if (!q) return [];
  
  let results = [];
  let seen = new Set();
  
  function add(id) {
    if (seen.has(id)) return;
    let entry = TZ_INDEX.find(function(e) { return e.id === id; });
    if (entry) {
      seen.add(id);
      results.push(entry);
    }
  }
  
  for (let alias in TZ_ALIASES) {
    if (alias.includes(q) || q.includes(alias)) {
      let candidates = TZ_ALIASES[alias];
      for (let i = 0; i < candidates.length; i++) {
        if (TZ_INDEX.some(function(e) { return e.id === candidates[i]; })) {
          add(candidates[i]);
          break;
        }
      }
    }
  }
  
  for (let i = 0; i < TZ_INDEX.length; i++) {
    if (TZ_INDEX[i].city.toLowerCase().startsWith(q)) add(TZ_INDEX[i].id);
  }
  for (let i = 0; i < TZ_INDEX.length; i++) {
    if (TZ_INDEX[i].searchableId.includes(q)) add(TZ_INDEX[i].id);
  }
  
  return results.slice(0, 8);
}

let highlightedIndex = -1;
let currentResults = [];

function renderResults(results) {
  currentResults = results;
  highlightedIndex = -1;
  let list = document.getElementById("tz-results");
  list.innerHTML = "";
  
  if (results.length === 0) {
    let li = document.createElement("li");
    li.className = "tz-no-results";
    li.textContent = "No matches—try a city or country";
    list.appendChild(li);
    list.hidden = false;
    return;
  }
  
  results.forEach(function(entry, i) {
    let li = document.createElement("li");
    li.className = "tz-result";
    li.dataset.index = i;
    
    let city = document.createElement("span");
    city.className = "tz-result-city";
    city.textContent = entry.city;
    
    let meta = document.createElement("span");
    meta.className = "tz-result-meta";
    meta.textContent = entry.offset + " · " + entry.id;
    
    li.appendChild(city);
    li.appendChild(meta);
    li.onclick = function() { selectTimezone(entry); };
    list.appendChild(li);
  });
  
  list.hidden = false;
}

function selectTimezone(entry) {
  document.getElementById("tz-search").value = entry.city + " (" + entry.id + ")";
  document.getElementById("tz-value").value = entry.id;
  document.getElementById("tz-results").hidden = true;
}

function updateHighlight() {
  let items = document.querySelectorAll(".tz-result");
  items.forEach(function(el, i) {
    if (i === highlightedIndex) {
      el.classList.add("highlighted");
    } else {
      el.classList.remove("highlighted");
    }
  });
}

function setupTimezoneCombobox() {
  let searchInput = document.getElementById("tz-search");
  let hiddenValue = document.getElementById("tz-value");
  let resultsList = document.getElementById("tz-results");
  
  searchInput.addEventListener("input", function() {
    hiddenValue.value = "";
    renderResults(searchTimezones(searchInput.value));
  });
  
  searchInput.addEventListener("keydown", function(e) {
    if (resultsList.hidden || currentResults.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedIndex = Math.min(highlightedIndex + 1, currentResults.length - 1);
      updateHighlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedIndex = Math.max(highlightedIndex - 1, 0);
      updateHighlight();
    } else if (e.key === "Enter") {
      e.preventDefault();
      let pick = currentResults[highlightedIndex >= 0 ? highlightedIndex : 0];
      if (pick) selectTimezone(pick);
    } else if (e.key === "Escape") {
      resultsList.hidden = true;
    }
  });
  
  document.addEventListener("click", function(e) {
    if (!e.target.closest(".tz-combobox")) {
      resultsList.hidden = true;
    }
  });
}

function getEnabledSites() {
  return new Promise(function(resolve) {
    chrome.storage.local.get(["enabledSites"], function(result) {
      if (result.enabledSites) {
        resolve(result.enabledSites);
      } else {
        chrome.storage.local.set({ enabledSites: DEFAULT_ENABLED_SITES }, function() {
          resolve(DEFAULT_ENABLED_SITES);
        });
      }
    });
  });
}

function saveEnabledSites(sites) {
  return new Promise(function(resolve) {
    chrome.storage.local.set({ enabledSites: sites }, resolve);
  });
}

function extractHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

function looksLikeValidDomain(hostname) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname);
}

function addSite(rawInput) {
  let trimmed = rawInput.trim();
  if (!trimmed) return { ok: false, error: "Enter a domain." };
  
  let hostname = (extractHostname(trimmed) || extractHostname("https://" + trimmed) || trimmed).toLowerCase();
  
  if (!looksLikeValidDomain(hostname)) {
    return { ok: false, error: '"' + trimmed + '" doesn\'t look like a valid domain.' };
  }
  
  return getEnabledSites().then(function(sites) {
    if (sites.includes(hostname)) {
      return { ok: false, error: '"' + hostname + '" is already in the list.' };
    }
    sites.push(hostname);
    return saveEnabledSites(sites).then(function() {
      return { ok: true };
    });
  });
}

function showSiteError(msg) {
  let el = document.getElementById("site-error");
  el.textContent = msg;
  el.hidden = false;
}

function setupSiteManagement() {
  document.getElementById("add-current-site").addEventListener("click", function() {
    document.getElementById("site-error").hidden = true;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      let tab = tabs[0];
      if (!tab || !tab.url) {
        showSiteError("Couldn't read the current tab's URL.");
        return;
      }
      addSite(tab.url).then(function(result) {
        if (!result.ok) showSiteError(result.error);
      });
    });
  });
  
  document.getElementById("add-site-form").addEventListener("submit", function(e) {
    e.preventDefault();
    document.getElementById("site-error").hidden = true;
    let input = document.getElementById("manual-site-input");
    addSite(input.value).then(function(result) {
      if (result.ok) {
        input.value = "";
      } else {
        showSiteError(result.error);
      }
    });
  });
}

async function renderSites() {
  let sites = await getEnabledSites();
  let list = document.getElementById("sites-list");
  list.innerHTML = "";
  
  for (let i = 0; i < sites.length; i++) {
    let site = sites[i];
    let li = document.createElement("li");
    li.className = "site-row";
    
    let label = document.createElement("span");
    label.className = "site-domain";
    label.textContent = site;
    
    let removeBtn = document.createElement("button");
    removeBtn.className = "delete-btn";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("data-site", site);
    
    li.appendChild(label);
    li.appendChild(removeBtn);
    list.appendChild(li);
  }
}

document.getElementById("sites-list").addEventListener("click", async function(e) {
  if (e.target && e.target.classList.contains("delete-btn")) {
    let site = e.target.getAttribute("data-site");
    let sites = await getEnabledSites();
    sites = sites.filter(function(s) { return s !== site; });
    await saveEnabledSites(sites);
    renderSites();
  }
});

function getContacts() {
  return new Promise(function(resolve) {
    chrome.storage.local.get(["contacts"], function(result) {
      resolve(result.contacts || []);
    });
  });
}

function saveContacts(contacts) {
  return new Promise(function(resolve) {
    chrome.storage.local.set({ contacts: contacts }, resolve);
  });
}

function formatLocalTime(timezone) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      weekday: "short",
    }).format(new Date());
  } catch (e) {
    return "unknown";
  }
}

async function renderContacts() {
  let contacts = await getContacts();
  let list = document.getElementById("contact-list");
  let emptyState = document.getElementById("empty-state");
  list.innerHTML = "";
  
  if (contacts.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  
  for (let i = 0; i < contacts.length; i++) {
    let c = contacts[i];
    let li = document.createElement("li");
    li.className = "contact-row";
    
    let info = document.createElement("div");
    info.className = "contact-info";
    
    let name = document.createElement("span");
    name.className = "contact-name";
    name.textContent = c.name;
    
    let time = document.createElement("span");
    time.className = "contact-time";
    time.textContent = formatLocalTime(c.timezone) + " · " + c.timezone.replace(/_/g, " ");
    
    info.appendChild(name);
    info.appendChild(time);
    
    let deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("data-id", c.id);
    
    li.appendChild(info);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

document.getElementById("contact-list").addEventListener("click", async function(e) {
  if (e.target && e.target.classList.contains("delete-btn")) {
    let id = e.target.getAttribute("data-id");
    let contacts = await getContacts();
    contacts = contacts.filter(function(c) { return c.id !== id; });
    await saveContacts(contacts);
    renderContacts();
  }
});

function showError(msg) {
  let errorEl = document.getElementById("form-error");
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function generateId() {
  return String(Date.now()) + Math.random().toString(36).substr(2, 5);
}

document.addEventListener("DOMContentLoaded", function() {
  buildTimezoneIndex();
  setupTimezoneCombobox();
  renderContacts();
  renderSites();
  setupSiteManagement();
  
  document.getElementById("add-contact-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    document.getElementById("form-error").hidden = true;
    
    let nameInput = document.getElementById("contact-name");
    let timezone = document.getElementById("tz-value").value;
    let name = nameInput.value.trim();
    
    if (!name) { showError("Enter a name."); return; }
    if (!timezone) { showError("Pick a timezone from the dropdown."); return; }
    
    let contacts = await getContacts();
    
    let dupe = contacts.some(function(c) { return c.name.toLowerCase() === name.toLowerCase(); });
    if (dupe) {
      showError('"' + name + '" is already in your list.');
      return;
    }
    
    contacts.push({ id: generateId(), name: name, timezone: timezone });
    await saveContacts(contacts);
    
    nameInput.value = "";
    document.getElementById("tz-search").value = "";
    document.getElementById("tz-value").value = "";
    renderContacts();
  });
  
  setInterval(renderContacts, 30000);
});