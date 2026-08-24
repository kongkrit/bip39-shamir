"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, randomHex } = require("./helpers.js");

const { bip39 } = loadApp();

// Official BIP39 English test vectors (Trezor)
const VECTORS = [
    ["00000000000000000000000000000000",
     "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"],
    ["7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f",
     "legal winner thank year wave sausage worth useful legal winner thank yellow"],
    ["80808080808080808080808080808080",
     "letter advice cage absurd amount doctor acoustic avoid letter advice cage above"],
    ["ffffffffffffffffffffffffffffffff",
     "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"],
    ["000000000000000000000000000000000000000000000000",
     "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent"],
    ["808080808080808080808080808080808080808080808080",
     "letter advice cage absurd amount doctor acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter always"],
    ["0000000000000000000000000000000000000000000000000000000000000000",
     "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"],
    ["ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
     "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo vote"],
    ["9e885d952ad362caeb4efe34a8e91bd2",
     "ozone drill grab fiber curtain grace pudding thank cruise elder eight picnic"],
    ["68a79eaca2324873eacc50cb9c6eca8cc68ea5d936f98787c60c7ebc74e6ce7c",
     "hamster diagram private dutch cause delay private meat slide toddler razor book happy fancy gospel tennis maple dilemma loan word shrug inflict delay length"]
];

test("wordlist has 2048 words", () => {
    assert.equal(bip39.wordlist.length, 2048);
    assert.equal(new Set(bip39.wordlist).size, 2048);
});

test("entropyToMnemonic matches official vectors", async () => {
    for (const [hex, mnemonic] of VECTORS) {
        assert.equal(await bip39.entropyToMnemonic(hex), mnemonic);
    }
});

test("mnemonicToEntropy matches official vectors and validates checksum", async () => {
    for (const [hex, mnemonic] of VECTORS) {
        const result = await bip39.mnemonicToEntropy(mnemonic);
        assert.equal(result.hex, hex);
        assert.equal(result.valid, true);
    }
});

test("roundtrip for all entropy sizes with random entropy", async () => {
    for (const chars of [32, 40, 48, 56, 64]) {
        for (let i = 0; i < 10; i++) {
            const hex = randomHex(chars);
            const mnemonic = await bip39.entropyToMnemonic(hex);
            assert.equal(mnemonic.split(" ").length, (chars * 4 + chars / 8) / 11);
            const back = await bip39.mnemonicToEntropy(mnemonic);
            assert.equal(back.hex, hex);
            assert.equal(back.valid, true);
        }
    }
});

test("mnemonic input is normalized (case, whitespace)", async () => {
    const result = await bip39.mnemonicToEntropy("  ZOO zoo zoo zoo\nzoo zoo zoo zoo   zoo zoo zoo WRONG ");
    assert.equal(result.hex, "ffffffffffffffffffffffffffffffff");
    assert.equal(result.valid, true);
});

test("bad checksum is reported", async () => {
    const result = await bip39.mnemonicToEntropy(
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon");
    assert.equal(result.hex, "00000000000000000000000000000000");
    assert.equal(result.valid, false);
});

test("rejects invalid word", async () => {
    await assert.rejects(
        bip39.mnemonicToEntropy("zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo notaword"),
        /Invalid word "notaword"/);
});

test("rejects invalid word count", async () => {
    await assert.rejects(bip39.mnemonicToEntropy("zoo zoo zoo"), /Word count/);
    await assert.rejects(bip39.mnemonicToEntropy("zoo ".repeat(13).trim()), /Word count/);
});

test("rejects invalid entropy", async () => {
    await assert.rejects(bip39.entropyToMnemonic("00112233"), /32, 40, 48, 56, or 64/);
    await assert.rejects(bip39.entropyToMnemonic("zz".repeat(16)), /32, 40, 48, 56, or 64/);
});
