const chrono = require("chrono-node");

let samples = [
  "let's call tomorrow at 3pm",
  "are you free at 5pm today?",
  "how about next Tuesday at noon",
  "can we push to 9am EOD Friday works too",
  "see you in 2 hours",
  "let's sync at 14:00",
  "I'll ping you Monday morning",
  "just checking in, no rush",
  "that meeting was scheduled for march 3rd at 10",
  "talk later tonight around 8-ish",
];

console.log("=".repeat(60));
for (let i = 0; i < samples.length; i++) {
  let text = samples[i];
  let results = chrono.parse(text, new Date());
  console.log('\nInput: "' + text + '"');
  
  if (results.length === 0) {
    console.log("  -> no time phrase detected");
  } else {
    for (let j = 0; j < results.length; j++) {
      let r = results[j];
      console.log('  -> detected: "' + r.text + '"  =>  ' + r.start.date().toString());
    }
  }
}
console.log("\n" + "=".repeat(60));