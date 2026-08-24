"use strict";
// Loads the <script> blocks from ../index.html into a Node vm context,
// so tests exercise the exact code that ships in the page.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const nodeCrypto = require("node:crypto");

function loadApp() {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    if (scripts.length === 0) {
        throw new Error("No script blocks found in index.html");
    }
    // Browser-like crypto: subtle for BIP39 hashing, getRandomValues for secrets.js.
    // getRandomValues is shimmed via randomFillSync so cross-realm typed arrays work.
    const cryptoShim = {
        subtle: nodeCrypto.webcrypto.subtle,
        getRandomValues(arr) {
            nodeCrypto.randomFillSync(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength));
            return arr;
        }
    };
    const context = vm.createContext({ crypto: cryptoShim, console });
    for (const src of scripts) {
        vm.runInContext(src, context);
    }
    if (!context.bip39 || !context.secrets) {
        throw new Error("index.html did not define bip39 and secrets");
    }
    return { bip39: context.bip39, secrets: context.secrets };
}

function randomHex(chars) {
    return nodeCrypto.randomBytes(chars / 2).toString("hex");
}

module.exports = { loadApp, randomHex };
