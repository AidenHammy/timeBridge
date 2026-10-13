// Handles adding contacts, saving them and keeping their local times updated

const form = document.getElementById("add-contact-form");
const nameInput = document.getElementById("contact-name");
const tzSelect = document.getElementById("contact-timezone");
const contactList = document.getElementById("contact-list");
const emptyState = document.getElementById("empty-state");
const errorText = document.getElementById("form-error");

// Grabs real IANA timezones from the browser and falls back to a short list if the browser is old
let timezones = [];
try {
  timezones = Intl.supportedValuesOf("timeZone");
} catch (e) {
  timezones = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];
}

timezones.forEach(tz => {
  let opt = document.createElement("option");
  opt.value = tz;
  opt.textContent = tz.replace(/_/g, " ");
  tzSelect.appendChild(opt);
});

function getContacts() {
  return new Promise(resolve => {
    chrome.storage.local.get({ contacts: [] }, (data) => resolve(data.contacts));
  });
}

function saveContacts(contacts) {
  return new Promise(resolve => {
    chrome.storage.local.set({ contacts: contacts }, resolve);
  });
}

// Draw the list of contacts
async function renderContacts() {
  let contacts = await getContacts();
  contactList.innerHTML = "";
  
  if (contacts.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  contacts.forEach(c => {
    let li = document.createElement("li");
    li.className = "contact-row";
    
    let timeStr;
    try {
      timeStr = new Intl.DateTimeFormat(undefined, {
        timeZone: c.timezone,
        hour: "numeric",
        minute: "2-digit",
        weekday: "short"
      }).format(new Date());
    } catch (e) {
      timeStr = "Unknown time";
    }

    li.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${c.name}</span>
        <span class="contact-time">${timeStr} - ${c.timezone.replace(/_/g, " ")}</span>
      </div>
      <button class="delete-btn" data-id="${c.id}">✕</button>
    `;
    contactList.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorText.hidden = true;

  let name = nameInput.value.trim();
  let tz = tzSelect.value;

  if (!name || !tz) {
    errorText.textContent = "Please enter a name and pick a timezone.";
    errorText.hidden = false;
    return;
  }

  let contacts = await getContacts();
  
  let dupe = contacts.some(c => c.name.toLowerCase() === name.toLowerCase());
  if (dupe) {
    errorText.textContent = `"${name}" is already in your list.`;
    errorText.hidden = false;
    return;
  }

  // Add new contact using Date.now() for a quick unique ID
  contacts.push({
    id: Date.now().toString(),
    name: name,
    timezone: tz
  });

  await saveContacts(contacts);
  
  nameInput.value = "";
  tzSelect.value = "";
  renderContacts();
});

contactList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    let id = e.target.getAttribute("data-id");
    let contacts = await getContacts();
    contacts = contacts.filter(c => c.id !== id);
    await saveContacts(contacts);
    renderContacts();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderContacts();
  setInterval(renderContacts, 30000);
});