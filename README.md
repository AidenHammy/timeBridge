TimeBridge

Spent a couple of hours today hacking together TimeBridge. The goal? Stop doing mental math every time I schedule a call with someone in another timezone.

Instead of building everything at once, I just wanted to prove the core concept works: can I read text as someone types it, figure out if they're mentioning a time, and keep a simple list of my contacts' timezones?

Here's what I ended up with after an afternoon.

What I built
A popup contact book
Add a person's name and their timezone.
It saves to chrome.storage.local so they stick around.
Shows their current local time right in the popup, updating every 30 seconds.
Blocks duplicate names so I don't accidentally add "Priya" twice.
Live text parsing
I used chrono-node for the heavy lifting. It's a library that takes sentences like "let's call tomorrow at 3pm" and spits out an actual Date object.
I bundled just the English version of it into the extension to keep the file size down (from 400kb to 100kb).
Wired up a content script that listens to anything you type in a text box, waits for you to pause (250ms debounce), and logs the parsed time to the console.
No UI for the parser yet, just console logs. I'll build the tooltip tomorrow.
How to run it
Load the extension:

Go to chrome://extensions
Flip on "Developer mode" in the top right.
Click "Load unpacked" and pick the extension/ folder.
Click the extension icon. Try adding a contact (e.g., "Priya" in "Asia/Kolkata"). You should see her local time pop up. Close and reopen the popup—it should still be there.
Test the parser:

Open test-page.html in your browser (just drag the file into a new tab). Note: If you use file:// URLs, you have to go to the extension's Details page and toggle "Allow access to file URLs".
Open DevTools (F12) so you can see the console.
Type "let's call tomorrow at 3pm" in the text box.
Wait a second. You'll see a console log like: [TimeBridge] Found time: "tomorrow at 3pm" -> [Date Object].
Type something with no time in it ("just checking in"). Nothing should log.
Generating the chrono bundle
If you ever need to regenerate extension/vendor/chrono.bundle.js, I left my scratchpad files in the chrono-test/ folder. Just run:

cd chrono-testnpm installnode test-parse.js   # play around with the parser in nodenpx esbuild bundle-entry.js --bundle --minify --outfile=../extension/vendor/chrono.bundle.js
Next steps
The parsing works, but it's invisible right now. Next up: build a little badge that appears next to the text when a time is detected, so I can click it and convert it to a contact's timezone.