// Free Ad Blocker - YouTube-Specific Content Script
// Advanced YouTube ad blocking

(function () {
    'use strict';

    // YouTube ad detection and blocking
    const youtubeAdBlocker = {
        // Skip ad button selectors
        skipButtonSelectors: [
            '.ytp-ad-skip-button',
            '.ytp-ad-skip-button-modern',
            '.ytp-skip-ad-button',
            'button.ytp-ad-skip-button'
        ],

        // Ad container selectors
        adContainerSelectors: [
            '.video-ads',
            '.ytp-ad-module',
            '.ytp-ad-image-overlay',
            '.ytp-ad-overlay-container',
            '.ytp-ad-player-overlay',
            'ytd-display-ad-renderer',
            'ytd-promoted-sparkles-web-renderer',
            'ytd-promoted-video-renderer',
            'ytd-compact-promoted-video-renderer',
            'ytd-banner-promo-renderer',
            '#masthead-ad',
            '.ytd-merch-shelf-renderer',
            'ytd-statement-banner-renderer'
        ],

        // Video player reference
        videoPlayer: null,

        init() {
            console.log('YouTube Ad Blocker: Initializing...');
            this.findVideoPlayer();
            this.setupObservers();
            this.hideAds();
            this.setupVideoMonitoring();
        },

        findVideoPlayer() {
            this.videoPlayer = document.querySelector('video');
            if (this.videoPlayer) {
                console.log('YouTube Ad Blocker: Video player found');
            }
        },

        // Hide ad containers
        hideAds() {
            this.adContainerSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                    el.remove();
                });
            });
        },

        // Auto-click skip button
        clickSkipButton() {
            for (const selector of this.skipButtonSelectors) {
                const skipButton = document.querySelector(selector);
                if (skipButton && skipButton.offsetParent !== null) {
                    console.log('YouTube Ad Blocker: Clicking skip button');
                    skipButton.click();
                    return true;
                }
            }
            return false;
        },

        // Detect if an ad is playing
        isAdPlaying() {
            // Check for ad indicators
            const adIndicators = [
                '.ytp-ad-player-overlay',
                '.ytp-ad-text',
                '.video-ads',
                'div.ytp-ad-module'
            ];

            for (const selector of adIndicators) {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null) {
                    return true;
                }
            }

            // Check player class
            const player = document.querySelector('.html5-video-player');
            if (player && player.classList.contains('ad-showing')) {
                return true;
            }

            return false;
        },

        // Speed through ads
        speedThroughAd() {
            if (!this.videoPlayer) {
                this.findVideoPlayer();
            }

            if (this.videoPlayer && this.isAdPlaying()) {
                // Save original playback rate
                const originalRate = this.videoPlayer.playbackRate;

                // Speed up to maximum
                this.videoPlayer.playbackRate = 16;

                // Mute the ad
                this.videoPlayer.muted = true;

                // Try to skip to end
                if (this.videoPlayer.duration && this.videoPlayer.duration > 0) {
                    this.videoPlayer.currentTime = this.videoPlayer.duration - 0.1;
                }

                console.log('YouTube Ad Blocker: Speeding through ad');

                // Click skip button if available
                setTimeout(() => this.clickSkipButton(), 100);
            }
        },

        // Monitor video for ads
        setupVideoMonitoring() {
            // Check every 500ms for ads
            setInterval(() => {
                if (this.isAdPlaying()) {
                    this.speedThroughAd();
                    this.clickSkipButton();
                    this.hideAds();
                }
            }, 500);

            // Listen for video events
            if (this.videoPlayer) {
                this.videoPlayer.addEventListener('play', () => {
                    if (this.isAdPlaying()) {
                        this.speedThroughAd();
                    }
                });

                this.videoPlayer.addEventListener('timeupdate', () => {
                    if (this.isAdPlaying()) {
                        this.speedThroughAd();
                    }
                });
            }
        },

        // Setup mutation observer for dynamic content
        setupObservers() {
            // Watch for new ad elements
            const observer = new MutationObserver((mutations) => {
                this.hideAds();
                if (this.isAdPlaying()) {
                    this.speedThroughAd();
                    this.clickSkipButton();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Re-find video player if page changes
            const videoObserver = new MutationObserver(() => {
                if (!this.videoPlayer || !document.contains(this.videoPlayer)) {
                    this.findVideoPlayer();
                }
            });

            videoObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            youtubeAdBlocker.init();
        });
    } else {
        youtubeAdBlocker.init();
    }

    // Re-initialize on YouTube navigation (SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('YouTube Ad Blocker: Page changed, re-initializing');
            setTimeout(() => youtubeAdBlocker.init(), 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();
