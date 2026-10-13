# 🌽 Corn Blocker

A free, open-source browser extension that keeps your browsing wholesome. It blocks adult websites and adult searches, and shows a friendly corn-themed page instead.

- **Chrome, Edge, Brave, Opera, Vivaldi** → [`chrome/`](chrome)
- **Firefox (140+)** → [`firefox/`](firefox)

## What it blocks

| Where | How |
|---|---|
| **Websites** | ~400k-domain list from [Bon-Appetit/porn-domains](https://github.com/Bon-Appetit/porn-domains) (auto-refreshed every 3 days), plus `.xxx` / `.porn` / `.sex` / `.adult` TLDs and a built-in starter list. Subdomains are matched too. |
| **Searches** | Any search engine: reads `q`, `text`, `query`, `p`, `wd`, `search_query` and more from the URL, including `#q=` hashes and in-page (pushState) searches. |
| **Address bar** | Typed domains, typed keyword searches, and URLs whose host/path contain a blocked keyword. Redirect chains are checked too. |
| **Search boxes** | A content script stops Enter / form submit on search fields containing a blocked term. It ignores ordinary text fields (chat, comments, etc.). |

Keyword matching is whole-word and multilingual (English, Russian, Bengali, and others), so "Essex", "analytics" or "breast cancer" are not blocked. Add your own words, domains and an allowlist in the settings page. **Strict mode** adds broader words such as "sex" or "lingerie", with more false positives.

## Install

### Chrome / Edge / Brave (from GitHub)
1. Download `corn-blocker-chrome.zip` from [Releases](../../releases) and unzip it (or clone this repo).
2. Open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**.
3. Click **Load unpacked** and choose the unzipped `chrome` folder.
4. For Incognito: **Details → Allow in Incognito**.

> Chrome shows a "disable developer mode extensions" notice on some systems after a restart. This is a Chrome limitation for extensions not installed from the Web Store. You can publish it to the Chrome Web Store (one-time $5 fee) to avoid it.

### Firefox
Firefox only installs **signed** add-ons. Signing is free:

1. Create a free account at <https://addons.mozilla.org/developers/>.
2. Get API keys at <https://addons.mozilla.org/developers/addon/api/key/>.
3. From the `firefox` folder run:
   ```bash
   npx web-ext sign --channel=unlisted --api-key=<JWT issuer> --api-secret=<JWT secret>
   ```
4. Attach the resulting `.xpi` to a GitHub Release. Anyone can install it by opening the file in Firefox.

To just try it: `about:debugging` → *This Firefox* → *Load Temporary Add-on* → pick `firefox/manifest.json` (removed on restart).

Before signing, change the add-on ID in `firefox/manifest.json` (`corn-blocker@corn-blocker.addon`) to one you own, e.g. `corn-blocker@yourname.com`. It cannot be changed after you publish.

For private windows: `about:addons` → Corn Blocker → **Run in Private Windows**.

## Honest limitations

This is a **speed bump, not a lock**. Anyone with access to the browser can disable or remove it. It only checks URLs and search boxes, not page content, so explicit images on mainstream sites are not blocked. For stronger protection, combine it with DNS filtering (CleanBrowsing, Cloudflare 1.1.1.3), SafeSearch lock, and an accountability partner or app.

## Develop

No build step: plain JavaScript, Manifest V3. `chrome/` and `firefox/` share `lib.js`, `content.js`, `options.*` and `blocked.*`. Differences: Firefox uses `background.scripts`, `browser.*`, and a blocking `webRequest` listener.

```bash
cd firefox && npx web-ext lint
```

Pushing a tag like `v1.0.0` runs the GitHub Action that builds the two zips and attaches them to a release.

## Privacy

Everything is checked locally. No data is collected or sent anywhere. The only network request is downloading the public domain list from GitHub. See [PRIVACY.md](PRIVACY.md).

## License

MIT. The domain list belongs to its own project and license ([Bon-Appetit/porn-domains](https://github.com/Bon-Appetit/porn-domains)); it is downloaded at runtime and not bundled.
