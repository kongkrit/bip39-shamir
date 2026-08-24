# bip39-shamir

Split a BIP39 mnemonic into Shamir secret sharing parts, and combine parts back into the mnemonic.

Everything is one self-contained `index.html` — no network access, no build step, no frameworks.

## Usage

Open `index.html` in a browser, or save the page to a file and open it on an air-gapped computer.

**BIP39 → Shamir** — paste a mnemonic (12, 15, 18, 21, or 24 words). The page shows its hex entropy,
then splits that entropy into N parts of which any M can reconstruct it (default 2 of 3). Distribute
one part per person.

**Combine** — paste M or more parts, one per line, to recover the hex entropy and the original mnemonic.

The checksum of the entered mnemonic is verified; an invalid mnemonic is reported and not split.

## Tests

```sh
node --test tests/
```

Tests run the `<script>` blocks extracted from `index.html` in a Node `vm`, so they exercise the code
that actually ships. Coverage: official BIP39 test vectors, entropy round-trips for all sizes,
checksum and input validation, and Shamir split/combine across share subsets and thresholds.

## Credits

Shamir implementation is [secrets.js](https://github.com/grempe/secrets.js) by Alexander Stetsyuk and
Glenn Rempe (MIT), embedded inline. Layout follows [iancoleman/shamir](https://github.com/iancoleman/shamir).

Licensed under AGPL-3.0 — see [LICENSE](LICENSE).
