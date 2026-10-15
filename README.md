# TimeBridge

**Stop doing mental math every time you schedule a call across time zones**

TimeBridge is a Chrome extension that watches as you type in chat apps like Slack, WhatsApp, and Gmail. When it detects a time phrase like *"let's call tomorrow at 3pm"*, it shows a tiny clock icon next to your text box.

Click it and it'll tell you exactly what time that is for the people you're messaging, right where you're already typing. No more opening a new tab for a timezone converter.

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

## Installation (For Developers)

TimeBridge isn't on the Chrome Web Store yet but you can run it locally in a few minutes.

### Step 1: Generate the Parser Bundle

TimeBridge uses `chrono-node` for natural language parsing but the library needs to be bundled for the browser.

Open a terminal and navigate to the `chrono-test` directory:

```bash
cd chrono-test
```

Install the dependencies:

```bash
npm install
```

Run `esbuild` to generate the bundle inside the extension folder:

```bash
npx esbuild bundle-entry.js --bundle --minify --outfile=../extension/vendor/chrono.bundle.js
```

### Step 2: Load the Extension

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked** and select the `extension/` folder.
4. Pin the TimeBridge icon to your browser toolbar and start adding contacts!

> **Note:** To test the extension on local `file://` pages, open the extension's Details page and enable **Allow access to file URLs**.

## How It Works (Under the Hood)

- **Manifest V3**: Uses Chrome's modern extension architecture with content scripts injected at `document_idle`.
- **Delegated Listeners**: Instead of attaching event listeners to every text box on a page, TimeBridge uses a single delegated listener on the document in the capture phase. This helps it catch typing in dynamically loaded elements such as compose boxes created by Slack and Gmail after the page loads.
- **English-Only Bundling**: Importing the entire `chrono-node` library would be unnecessarily heavy. TimeBridge bundles only the `chrono-node/en` subpath, cutting the bundle size from approximately 400 KB to 100 KB.

## License

MIT. Genuinely do whatever you want with it!