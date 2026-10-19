# TimeBridge

**Chrome extension for scheduling calls across time zones without doing the math yourself**

Okay so basically, TimeBridge is a Chrome extension that watches as you type in chat apps like Slack, WhatsApp and Gmail. If you write something like "let's call tomorrow at 3pm" a small clock icon shows up next to your text box. Click it to see what time that is for whoever you're talking to!

[📦 **Download TimeBridge (ZIP)**](https://github.com/AidenHammy/TimeBridge/archive/refs/heads/main.zip) · [🐛 **Report an Issue**](https://github.com/AidenHammy/TimeBridge/issues)

## Features

- It uses chrono-node to recognize dates and times when you type them naturally like “tomorrow at 3pm” or “in 2 hours”. It waits for 250 milliseconds before processing what you type so it doesn’t have to check after every single keystroke.
- There are no annoying pop-ups or anything like that. It's just a small 26px clock icon that shows up when it detects a time. You can click on it to see the converted time or simply ignore it and keep going.
- TimeBridge only works on certain websites instead of running everywhere you browse. It starts with WhatsApp, Slack and Gmail but you can easily add other sites or remove the ones you don't need from the extension's popup.
- You don't have to scroll through hundreds of time zones to add a contact. You could just type a name like `Europe` and the relevant options will show up for you to choose from.
- It’s designed to work smoothly with modern web apps even when things get a little complicated. It can pick up text inside nested formatting elements, work within iframes and make the clock disappear as soon as you hit Enter to send a message.

### TimeBridge working inside Gmail
![TimeBridge working inside Gmail](./images/gmail.png?raw=true)

### TimeBridge inside Slack
![TimeBridge inside Slack](./images/slack.png?raw=true)

### TimeBridge functioning inside WhatsApp Web
![TimeBridge functioning inside WhatsApp Web](./images/whatsapp.png?raw=true)

## Install

Since TimeBridge isn't on the Chrome Web Store yet, you'll need to install it manually.

1. Download the ZIP file and extract its contents.
2. Open chrome://extensions in Chrome and turn on Developer mode.
3. Click Load unpacked and select the extension/ folder.
4. Pin TimeBridge to your toolbar, add a contact and try typing a time in Slack to see if it works.

If you also want to use it on file:// pages, you'd have to open the extension's Details page and enable Allow access to file URLs.

## Permissions

- storage: Saves your contacts and list of allowed websites locally using chrome.storage.local. Your data stays on your device and isn't sent anywhere.
- activeTab: Used when you click “+ Add current site” in the popup. It lets the extension read the URL of the tab you're currently on.
- <all_urls>: Allows the content script to run on websites you've added to your allowlist. If a website isn't on that list, the script stays inactive.


## Building from Source

If you want to work on TimeBridge's code or rebuild its date parser, you'll need Node.js installed first.

### 1. Clone the Repository

Clone the repository and navigate into the project directory.

### 2. Install Dependencies

Open a terminal in the project folder and move into chrono-test:

```bash
cd chrono-test
npm install
```

This installs the packages needed to build the parser.

### 3. Build the Parser Bundle

TimeBridge uses esbuild to bundle the natural-language parser into a file that the extension can use. From inside chrono-test, run:

```bash
npx esbuild bundle-entry.js --bundle --minify --outfile=../extension/vendor/chrono.bundle.js
```

This creates the bundled parser in the extension's vendor folder.

### 4. Check your changes

Once you've finished editing the code, open chrome://extensions in Chrome and click Reload on the TimeBridge extension card. This lets you test the updated version.

## Implementation Notes

- The extension uses Manifest V3 with the content script running at `document_idle`.
- Instead of adding a listener to every text box, it uses one event listener on the document during the capture phase. This also helps it detect compose boxes that Slack or Gmail add after the page has loaded.
- It imports only chrono-node/en rather than the full package which reduces the bundle size by about 300 KB.