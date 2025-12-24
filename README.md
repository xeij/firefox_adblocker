# Firefox Ad Blocker

A browser extension for Firefox that blocks advertisements and tracking scripts across websites. Built using the WebExtensions API with Manifest V2.

## Overview

This extension blocks ads through a multi-layered approach combining network request interception, DOM manipulation, and targeted video ad handling. It maintains low overhead while effectively blocking most common advertising networks and tracking services.

## How It Works

### Network-Level Blocking

The extension uses the webRequest API to intercept HTTP requests before they complete. Each request is checked against two filter lists:

**Domain Blocking**  
A curated list of over 200 advertising and tracking domains. When a request matches a domain in this list (e.g., doubleclick.net, googlesyndication.com), the request is cancelled before any data is transferred. This saves bandwidth and improves page load times.

**URL Pattern Matching**  
Requests are also checked against common URL patterns found in ad-serving infrastructure. Patterns like "/ads/", "adserver", and "pagead" are used to catch ads served from domains not in the blocklist.

### DOM-Level Element Hiding

Some ads cannot be blocked at the network level because they are served from the same domain as legitimate content. For these cases, the extension injects CSS rules that hide known ad containers and elements.

The content script uses specific selectors targeting:
- Google AdSense containers
- Third-party ad widgets (Outbrain, Taboola, etc.)
- Promoted content elements
- Ad iframes and overlays

A MutationObserver monitors the page for dynamically loaded content, applying hiding rules as new elements appear.

### YouTube Video Ads

YouTube presents unique challenges because video ads are served from youtube.com itself, making them indistinguishable from regular content at the network level. The extension handles this through a dedicated YouTube-specific script that:

**Detects Ads**  
Monitors the video player for ad indicators including specific CSS classes, DOM elements, and player state.

**Speeds Through Ads**  
When an ad is detected, the script sets the playback rate to 16x and skips to the end of the ad timeline. The ad effectively completes in under one second.

**Auto-Skips**  
Automatically clicks the skip button as soon as it becomes available.

**Handles Navigation**  
YouTube is a single-page application, so the script monitors for URL changes and reinitializes on each navigation.

## Installation

### From Source

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the extension directory

Note: Temporary add-ons are removed when Firefox restarts. For permanent installation, the extension would need to be signed through Mozilla's developer portal.

## Technical Details

### Background Script

Runs persistently in the background and handles:
- Loading filter lists on startup
- Intercepting web requests via webRequest.onBeforeRequest
- Matching requests against domain and pattern filters
- Tracking statistics (total and session blocked counts)
- Managing extension state (enabled/disabled)
- Communicating with popup via message passing

### Content Scripts

**General Content Script (content.js)**  
Injects on all pages at document_start. Loads CSS selectors from the filter list and applies them to hide ad elements. Uses efficient CSS injection rather than inline styles for better performance.

**YouTube Script (youtube-blocker.js)**  
Injects only on YouTube pages at document_end. Implements ad detection and manipulation logic specific to YouTube's video player.

### Filter Lists

All filter lists are stored as JSON files and can be edited to add or remove entries:

- `domains.json`: 200+ advertising and analytics domains
- `patterns.json`: 35+ URL patterns commonly used in ad requests
- `selectors.json`: 40+ CSS selectors targeting ad containers

### Popup Interface

Displays real-time statistics and controls:
- Current blocking status (enabled/disabled)
- Number of ads blocked in current session
- Total ads blocked since installation
- Toggle to enable/disable blocking
- Button to reset session statistics

The popup communicates with the background script via the runtime messaging API to retrieve current stats and update state.

## Privacy

This extension does not collect, transmit, or store any user data. All blocking occurs locally in the browser. Statistics are stored locally using the browser's storage API and never leave your device.

## Performance

The extension is designed for minimal performance impact:
- Domain lookups use simple string matching (O(n) worst case)
- CSS hiding uses efficient selectors injected once
- YouTube monitoring checks every 500ms only when on YouTube
- Filter lists are loaded once at startup and cached in memory

## Browser Compatibility

Requires Firefox 57.0 or higher. Uses Manifest V2 for access to the webRequestBlocking API, which provides synchronous request blocking capabilities necessary for effective ad blocking.

## Limitations

While this extension blocks most ads effectively, some limitations exist:

- First-party ads served from the same domain as content may not be caught by network filters
- New ad networks not in the domain list will not be blocked automatically
- Some websites may detect ad blocking and restrict access
- YouTube's ad delivery changes frequently and may require filter updates

## Development

To add custom filters:

1. Edit the appropriate JSON file in the `filters/` directory
2. Reload the extension in `about:debugging`
3. Test on relevant websites
