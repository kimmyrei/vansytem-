const webpush = require("web-push");

const keys =
    webpush.generateVAPIDKeys();

console.log("");
console.log("Add these values to Vercel Environment Variables:");
console.log("");
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_EMAIL=mailto:your-email@example.com");
console.log("");
console.log("Keep VAPID_PRIVATE_KEY private.");
