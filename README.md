# TimeBridge

**Stop doing mental math every time you schedule a call across time zones**

TimeBridge is a Chrome extension that watches as you type in chat apps like Slack, WhatsApp, and Gmail. When it detects a time phrase like *"let's call tomorrow at 3pm"*, it shows a tiny clock icon next to your text box.

Click it and it'll tell you exactly what time that is for the people you're messaging, right where you're already typing. No more opening a new tab for a timezone converter.

[📦 **Download TimeBridge (ZIP)**](https://github.com/AidenHammy/TimeBridge/archive/refs/heads/main.zip) · [🐛 **Report an Issue**](https://github.com/AidenHammy/TimeBridge/issues)

## Features

- **Live Text Parsing** -> Uses `chrono-node` to understand natural language. It catches phrases like *"tomorrow at 3pm"*, *"next Tuesday at noon"* or *"in 2 hours"*. A 250ms debounce keeps it from parsing every single keystroke.
- **Passive UI** -> No giant pop-ups or unnecessary interruptions. It's just a tiny 26px clock icon that appears when a time is detected. Click it to see the conversion or ignore it and carry on.
- **Site Allowlist** -> TimeBridge doesn't run on every website you visit. By default, it only runs on WhatsApp, Slack and Gmail. Add or remove sites through the extension popup whenever you want.
- **Searchable Timezones** -> Adding a contact doesn't mean scrolling through a massive dropdown of 418 timezones. Just type something like `Europe` and it'll surface appropriate results.
- **Real-World Aware** -> Built to handle the messy realities of modern web apps. It reads text inside nested formatting spans, works inside iframes and hides the clock immediately when you press Enter to send a message.

## How to Use It

1. Click the TimeBridge extension icon in your browser toolbar.
2. **Add a contact:** Enter their name, search for their timezone and click **Add Contact**. Your contacts are saved locally using `chrome.storage.local`.
3. Open Slack, WhatsApp or Gmail and start typing a message that includes a time.
4. Pause typing for a moment, you'll see a small clock icon appear below your text box.
5. Click the icon to expand the panel and see what time that translates to for your contact.

### TimeBridge working inside Gmail
![TimeBridge working inside Gmail](./images/gmail.png?raw=true)

### TimeBridge inside Slack
![TimeBridge inside Slack](./images/slack.png?raw=true)

### TimeBridge functioning inside WhatsApp Web
![TimeBridge functioning inside WhatsApp Web](./images/whatsapp.png?raw=true)

## Permissions
TimeBridge is built to be as privacy-friendly as possible. Here is exactly what permissions it needs and why~

- storage: Used to save your contacts list and your site allowlist locally in your browser. Surprise nothing syncs to the cloud.
- activeTab: Used only when you click the "+ Add current site" button in the popup, allowing the extension to read the URL of the tab you're currently on so it can add it to your allowlist.
- Note on <all_urls>: The manifest requests access to all URLs so the extension can physically run on whatever chat apps you decide to add to your allowlist. However, the content script is designed to do absolutely nothing on sites that aren't explicitly in your allowlist.

## How to Install (Takes 1 Minute)

Since TimeBridge isn't on the Chrome Web Store yet, you'll need to install it manually from the source code.

1. Click **Code → Download ZIP** on the GitHub repository page.
2. Extract the downloaded ZIP file somewhere convenient, like your Desktop or Downloads folder.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select the `extension/` folder inside the directory you just extracted.
7. Pin the TimeBridge icon to your browser toolbar, add your contacts and you're good to go!

> **Note:** To test TimeBridge on local `file://` pages, open the extension's **Details** page in Chrome and enable **Allow access to file URLs**.

## For Developers (Building from Source)

Want to modify the code or regenerate the natural-language parser yourself? You'll need [Node.js](https://nodejs.org/) installed.

### 1. Clone the Repository

Clone the repository and navigate into the project directory.

### 2. Install Dependencies

Navigate to the `chrono-test/` directory:

```bash
cd chrono-test
```

Install the dependencies:

```bash
npm install
```

### 3. Build the Parser Bundle

Run `esbuild` to generate the parser bundle inside the extension folder:

```bash
npx esbuild bundle-entry.js --bundle --minify --outfile=../extension/vendor/chrono.bundle.js
```

### 4. Test Your Changes

Make your changes to the code, open `chrome://extensions` in Chrome and click the **Reload** button on the TimeBridge extension card to test your latest build!

## How It Works (Under the Hood)

- **Manifest V3**: Uses Chrome's modern extension architecture with content scripts injected at `document_idle`.
- **Delegated Listeners**: Instead of attaching event listeners to every text box on a page, TimeBridge uses a single delegated listener on the document in the capture phase. This helps it catch typing in dynamically loaded elements such as compose boxes created by Slack and Gmail after the page loads.
- **English-Only Bundling**: Importing the entire `chrono-node` library would be unnecessarily heavy. TimeBridge bundles only the `chrono-node/en` subpath, cutting the bundle size from approximately 400 KB to 100 KB.