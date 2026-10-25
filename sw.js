const CACHE = "money-tracker-v1";
const FILES = ["./", "./index.html", "./script.js", "./style.css"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});