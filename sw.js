const CACHE = "money-tracker-v23"
const FILES = ["./", "./index.html", "./script.js", "./style.css", "manifest.json", "icon-192.png"];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(n => n !== CACHE).map(n => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request, { cache: "no-cache" })
        .then(function (res) {
            const salinan = res.clone();
            caches.open(CACHE).then(c => c.put(event.request, salinan));
            return res;
        })
        .catch(function () {
            return caches.match(event.request).then(function (hasil) {
                return hasil || caches.match("./index.html");
            });
        })
    );
});