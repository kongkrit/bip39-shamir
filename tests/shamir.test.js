"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, randomHex } = require("./helpers.js");

const { bip39, secrets } = loadApp();

function combinations(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [head, ...rest] = arr;
    return [
        ...combinations(rest, k - 1).map(c => [head, ...c]),
        ...combinations(rest, k)
    ];
}

test("split and combine roundtrips entropy hex (2 of 3)", () => {
    for (const chars of [32, 40, 48, 56, 64]) {
        const hex = randomHex(chars);
        const shares = secrets.share(hex, 3, 2);
        assert.equal(shares.length, 3);
        for (const subset of combinations(shares, 2)) {
            assert.equal(secrets.combine(subset), hex);
        }
        assert.equal(secrets.combine(shares), hex);
    }
});

test("split and combine roundtrips (3 of 5), any 3 parts suffice", () => {
    const hex = randomHex(64);
    const shares = secrets.share(hex, 5, 3);
    assert.equal(shares.length, 5);
    for (const subset of combinations(shares, 3)) {
        assert.equal(secrets.combine(subset), hex);
    }
});

test("combine is order-independent", () => {
    const hex = randomHex(32);
    const shares = secrets.share(hex, 3, 2);
    assert.equal(secrets.combine([shares[2], shares[0]]), hex);
    assert.equal(secrets.combine([shares[1], shares[0], shares[2]]), hex);
});

test("fewer than threshold parts does not recover the secret", () => {
    const hex = randomHex(32);
    const shares = secrets.share(hex, 3, 2);
    for (const share of shares) {
        assert.notEqual(secrets.combine([share]), hex);
    }
});

test("leading zeros in entropy are preserved", () => {
    const hex = "000102030405060708090a0b0c0d0e0f";
    const shares = secrets.share(hex, 3, 2);
    assert.equal(secrets.combine(shares.slice(0, 2)), hex);
});

test("end to end: mnemonic -> shamir parts -> mnemonic", async () => {
    const original = "legal winner thank year wave sausage worth useful legal winner thank yellow";
    const entropy = await bip39.mnemonicToEntropy(original);
    assert.equal(entropy.valid, true);

    const shares = secrets.share(entropy.hex, 5, 3);
    const recoveredHex = secrets.combine([shares[4], shares[1], shares[3]]);
    assert.equal(recoveredHex, entropy.hex);

    const recovered = await bip39.entropyToMnemonic(recoveredHex);
    assert.equal(recovered, original);
});

test("end to end with 24 word mnemonic", async () => {
    const hex = randomHex(64);
    const original = await bip39.entropyToMnemonic(hex);
    assert.equal(original.split(" ").length, 24);

    const shares = secrets.share(hex, 3, 2);
    const recoveredHex = secrets.combine(shares.slice(1));
    assert.equal(await bip39.entropyToMnemonic(recoveredHex), original);
});

test("combine rejects garbage input", () => {
    assert.throws(() => secrets.combine(["not-a-share"]));
});
