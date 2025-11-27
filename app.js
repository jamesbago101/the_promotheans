

(async () => {
    // e load ang pixi cdn
    while (typeof PIXI === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Get Application and Assets from PIXI namespace (CDN version)
    const { Application, Assets, Sprite, AnimatedSprite, Graphics, Container, Text, TextStyle } = PIXI;

    // Global banda
    const GLOBAL_FONT_FAMILY = 'Finger Paint';
    const GLOBAL_FONT_FAMILY_WITH_FALLBACK = `"${GLOBAL_FONT_FAMILY}", sans-serif`;

    // Blaised animation speed (experiment with different values: 0.05 = slow, 0.1 = normal, 0.2 = fast, 0.5 = very fast)
    const BLAISED_ANIMATION_SPEED = 0.5;

    // Wait for all fonts to load properly before initializing PIXI.js
    async function ensureFontLoaded() {
        try {
            if (!document.fonts || !document.fonts.check) {
                console.warn('Font API not available, proceeding without font check');
                return;
            }

            // Wait for fonts.ready with a reasonable timeout
            if (document.fonts.ready) {
                try {
                    await Promise.race([
                        document.fonts.ready,
                        new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout
                    ]);
                } catch (e) {
                    console.warn('Error waiting for fonts.ready:', e);
                }
            }

            // Helper function to check font with multiple variations
            function checkFont(fontFamily) {
                return document.fonts.check(`1em "${fontFamily}"`) || 
                       document.fonts.check(`1em ${fontFamily}`) ||
                       document.fonts.check(`12px "${fontFamily}"`) ||
                       document.fonts.check(`12px ${fontFamily}`);
            }

            // Check if font is loaded
            let fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds total (30 * 100ms)

            while (!fontLoaded && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                attempts++;
            }

            if (fontLoaded) {
                console.log(`✓ ${GLOBAL_FONT_FAMILY} font loaded successfully`);
            } else {
                console.warn(`⚠ ${GLOBAL_FONT_FAMILY} font may not be loaded yet (attempted ${maxAttempts} times)`);
                // Force a repaint to trigger font loading (only if body exists)
                if (document.body) {
                    try {
                        // Create a temporary element to force font loading
                        const testElement = document.createElement('span');
                        testElement.style.fontFamily = `"${GLOBAL_FONT_FAMILY}", sans-serif`;
                        testElement.style.position = 'absolute';
                        testElement.style.visibility = 'hidden';
                        testElement.style.opacity = '0';
                        testElement.textContent = 'test';
                        document.body.appendChild(testElement);

                        // Force layout calculation
                        testElement.offsetHeight;

                        // Wait a bit more for the font to load
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Check again
                        fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                        if (fontLoaded) {
                            console.log(`✓ ${GLOBAL_FONT_FAMILY} font loaded after force check`);
                        }

                        document.body.removeChild(testElement);
                    } catch (e) {
                        console.warn('Could not force font loading:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error in font loading:', error);
            // Don't block app initialization if font loading fails
        }
    }

    // Wait for fonts to load BEFORE initializing PIXI.js
    console.log('Loading font:', GLOBAL_FONT_FAMILY);
    await ensureFontLoaded();

    // Create a new application
    const app = new Application();

    // Initialize the application (v8 requires async init)
    // Performance optimizations for slower GPUs:
    // - Lower resolution on slower devices
    // - Disable antialiasing for faster initialization
    const devicePixelRatio = window.devicePixelRatio || 1;
    // Cap resolution at 1.5x for better performance on slower devices
    const cappedResolution = Math.min(devicePixelRatio, 1.5);
    
    await app.init({
        background: 0x000000,
        resizeTo: window,
        resolution: cappedResolution,
        autoDensity: true,
        antialias: false, // Disable antialiasing for faster initialization
        powerPreference: 'high-performance', // Prefer dedicated GPU if available
    });

    // Ensure ticker continues even when tab is hidden
    app.ticker.stopOnMinimize = false;

    // Append the application canvas to the container
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Container element not found');
        return;
    }

    container.appendChild(app.canvas);
    console.log('PixiJS Application initialized successfully');

    // Background sprite and texture dimensions - Declare early to avoid TDZ errors
    let backgroundSprite;
    let mutatorBgSprite;
    let mutatorCapsuleSprite;
    let mutatorCapsuleStrokeSprite; // Stroke overlay for hover effect
    let mutatorCapsuleDot; // Pulsing dot at center
    let mutatorCapsuleCircleText; // Circle with "click to explore" text
    let mutatorCapsuleTextSprite; // Text "MUTATOR" that appears on mutator capsule hover
    let mutatorCapsuleLabelText; // Simple label text for mobile/tablet (just "Mutator")
    let cupSprite;
    let glitchSprite;
    let eyeLogoSprite;
    let cctvSprite;
    let cctvTextSprite; // Text "X Account" that appears on CCTV hover
    let cctvDot; // Pulsing dot at center of CCTV
    let cctvCircleText; // Circle with "click to explore" text
    let discordSprite; // Discord animated sprite (discord1.png to discord8.png)
    let discordGlitchSound; // Audio for discord glitch effect
    let promoGlitchSound; // Audio for promo glitch effect
    let telegramGlitchSound; // Audio for telegram glitch effect
    let glitchSpriteGlitchSound; // Audio for glitch sprite glitch effect
    let wallArtPaperFlipSound; // Audio for wall art paper flip effect
    let lightSwitchSound; // Audio for light switch effect
    let bookMoveSound; // Audio for book move effect
    let cupMoveSound; // Audio for cup move effect
    let mutatorDotSound; // Audio for mutator dot hover effect
    let promoSprite; // Promo animated sprite (promo1.png to promo10.png)
    let telegramSprite; // Telegram animated sprite (telegram1.png to telegram9.png)
    let cctvStrokeSprite; // Animated stroke overlay for hover effect (cctv1_stroke.png to cctv3_stroke.png)
    let cctvLabelText; // Simple label text for mobile/tablet (just "X Account")
    let wallArtSprite; // Animated wall art sprite (wall_art1.png to wall_art6.png)
    let wallArtDot; // Pulsing dot at center of wall art
    let blaisedSprite; // Animated blaised sprite (blaised1.png to blaised6.png)
    let blaisedAuraSprite; // Animated blaised aura sprite (blaised1_aura.png to blaised6_aura.png) with color dodge blending
    let blaisedAuraApp; // Separate PIXI application for aura sprite with CSS mix-blend-mode
    let blaisedAction2Sprite; // Animated blaised action2 sprite (blaised_action2_1.png, blaised_action2_2.png)
    let blaisedAction2AuraSprite; // Animated blaised action2 aura sprite with color dodge blending
    let blaisedAction2AuraApp; // Separate PIXI application for action2 aura sprite
    let blaisedAction3Sprite; // Animated blaised action3 sprite (blaised_action3_1.png)
    let blaisedAction3AuraSprite; // Animated blaised action3 aura sprite with color dodge blending
    let blaisedAction3AuraApp; // Separate PIXI application for action3 aura sprite
    let wallArtTextSprite; // Text "OUR TEAM" that appears on wall art hover
    let wallArtLabelText; // Simple label text for mobile/tablet (just "OUR TEAM")
    let wallArtStrokeSprite; // Animated stroke overlay for hover effect (wall_art1_stroke.png to wall_art6_stroke.png)
    let wallArtCircleText; // Circle with "click to explore" text
    let bookSprite; // Book sprite (book.png)
    let bookDot; // Pulsing dot at center of book
    let bookTextSprite; // Text "Community" that appears on book hover
    let bookLabelText; // Simple label text for mobile/tablet (just "Community")
    let bookStrokeSprite; // Stroke overlay for hover effect (book_stroke.png)
    let bookCircleText; // Circle with "click to explore" text
    let lightsOffSprite; // Lights off sprite with swinging animation
    let lightsSwitchSprite; // Lights switch sprite with swinging animation
    let lightsOffTexture; // Lights off texture (for toggling)
    let lightsOnTexture; // Lights on texture (for toggling)
    let lightsRaySprite; // Lights ray sprite with color dodge blending
    let lightsRayApp; // Separate PIXI application for lights ray with CSS mix-blend-mode
    let imageWidth = 1920;
    let imageHeight = 1080;

    // Panning/dragging state
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let advanceWallArtFrame = null; // Function to advance wall art animation frame
    let stopWallArtAnimation = null; // Function to stop wall art animation
    let spriteStart = { x: 0, y: 0 };
    let currentScale = 1;
    let wallArtLastPanPosition = { x: 0, y: 0 }; // Track last pan position for wall art animation
    let wallArtPanThreshold = 30; // Minimum pixels to pan before triggering frame change
    let wallArtAnimationTimeout = null; // Timeout to stop animation when movement stops
    let wallArtIsAnimating = false; // Track if wall art animation is currently playing

    // Helper function to check if global audio is muted
    // Returns true only if user has interacted and explicitly muted, not for autoplay mute
    function isGlobalAudioMuted() {
        const bgMusic = document.getElementById('bg-music');
        if (!bgMusic) return false;
        
        // Check if user has interacted (music has been played or user clicked audio control)
        // If bg music is muted but hasn't been interacted with, it's muted for autoplay
        // In that case, don't mute sound effects
        const hasUserInteracted = bgMusic.currentTime > 0 || !bgMusic.paused || 
                                  (bgMusic.readyState > 0 && bgMusic.readyState < 3);
        
        // Only respect mute state if user has interacted
        // If muted for autoplay (no interaction), return false so sound effects can play
        if (!hasUserInteracted && bgMusic.muted) {
            return false; // Don't mute sound effects if bg music is muted for autoplay
        }
        
        return bgMusic.muted;
    }
    
    // Function to sync all glitch sounds with global mute state
    function syncGlitchSoundsMuteState() {
        const isMuted = isGlobalAudioMuted();
        if (discordGlitchSound) {
            discordGlitchSound.muted = isMuted;
        }
        if (promoGlitchSound) {
            promoGlitchSound.muted = isMuted;
        }
        if (telegramGlitchSound) {
            telegramGlitchSound.muted = isMuted;
        }
        if (glitchSpriteGlitchSound) {
            glitchSpriteGlitchSound.muted = isMuted;
        }
        if (wallArtPaperFlipSound) {
            wallArtPaperFlipSound.muted = isMuted;
        }
        if (lightSwitchSound) {
            lightSwitchSound.muted = isMuted;
        }
        if (bookMoveSound) {
            bookMoveSound.muted = isMuted;
        }
        if (mutatorDotSound) {
            mutatorDotSound.muted = isMuted;
        }
        if (cupMoveSound) {
            cupMoveSound.muted = isMuted;
        }
    }

    // Function to enable audio when sprite is interacted with
    // This automatically enables audio when user interacts with any animated sprite
    function enableAudioOnSpriteInteraction() {
        const bgMusic = document.getElementById('bg-music');
        if (!bgMusic) return;

        // Check if audio is already enabled
        const isAudioEnabled = bgMusic.currentTime > 0 || (!bgMusic.paused && bgMusic.readyState >= 2);
        
        if (!isAudioEnabled) {
            // Audio not enabled yet - enable it
            console.log('Sprite interaction detected - enabling audio automatically');
            
            // Unmute and play audio
            bgMusic.muted = false;
            const playPromise = bgMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Audio enabled automatically via sprite interaction');
                    // Sync sound effects with the new state
                    syncGlitchSoundsMuteState();
                }).catch((err) => {
                    console.log('Could not enable audio via sprite interaction:', err);
                });
            }
        } else if (bgMusic.muted) {
            // Audio is playing but muted - unmute it
            console.log('Sprite interaction detected - unmuting audio');
            bgMusic.muted = false;
            syncGlitchSoundsMuteState();
        }
    }

    // Initialize background music and audio control
    // Wait a bit to ensure DOM is ready
    setTimeout(() => {
        initBackgroundMusic();
    }, 100);

    function initBackgroundMusic() {
        const bgMusic = document.getElementById('bg-music');
        const audioControl = document.getElementById('audio-control');
        const audioIconUnmuted = document.getElementById('audio-icon-unmuted');
        const audioIconMuted = document.getElementById('audio-icon-muted');
        
        // Preload the audio icon images
        if (audioIconUnmuted) {
            audioIconUnmuted.onload = () => console.log('Audio on icon loaded');
            audioIconUnmuted.onerror = () => console.warn('Failed to load audio_on.png');
        }
        if (audioIconMuted) {
            audioIconMuted.onload = () => console.log('Audio off icon loaded');
            audioIconMuted.onerror = () => console.warn('Failed to load audio_off.png');
        }
        
        if (!bgMusic) {
            console.error('Background music element not found');
            return;
        }
        
        if (!audioControl) {
            console.error('Audio control element not found');
            return;
        }

        console.log('Audio elements found:', { bgMusic: !!bgMusic, audioControl: !!audioControl });

        // Set initial volume (50% by default)
        bgMusic.volume = 0.5;
        bgMusic.muted = true; // Start muted to allow autoplay
        bgMusic.loop = true; // Ensure looping is enabled

        // Track state
        let isPlaying = false;
        let userInteracted = false;
        let hasEverPlayed = false; // Track if audio has ever been played
        let isToggling = false; // Prevent multiple rapid toggles
        
        // Keep audio control hidden until loading screen finishes (CSS handles this with display: none)

        // Function to update icon display
        function updateIcon() {
            if (audioIconUnmuted && audioIconMuted) {
                if (bgMusic.muted) {
                    // Show muted icon
                    audioIconUnmuted.style.display = 'none';
                    audioIconMuted.style.display = 'block';
                    audioControl.classList.add('muted');
                } else {
                    // Show unmuted icon
                    audioIconUnmuted.style.display = 'block';
                    audioIconMuted.style.display = 'none';
                    audioControl.classList.remove('muted');
                }
            }
        }

        // Function to toggle mute/unmute
        function toggleAudio(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Prevent multiple rapid toggles (debounce)
            if (isToggling) {
                console.log('Toggle already in progress, ignoring');
                return;
            }
            
            isToggling = true;
            setTimeout(() => {
                isToggling = false;
            }, 100); // 100ms debounce
            
            console.log('Audio control clicked', { 
                isPlaying, 
                userInteracted, 
                muted: bgMusic.muted,
                paused: bgMusic.paused,
                readyState: bgMusic.readyState,
                currentTime: bgMusic.currentTime,
                hasEverPlayed
            });
            
            // If audio has never been started (truly first time), try to start it
            if (!hasEverPlayed && !userInteracted && bgMusic.currentTime === 0) {
                console.log('First click - attempting to start audio...');
                // Unmute if it was muted for autoplay
                if (bgMusic.muted) {
                    bgMusic.muted = false;
                }
                const playPromise = bgMusic.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        isPlaying = true;
                        userInteracted = true;
                        hasEverPlayed = true;
                        updateIcon();
                        console.log('Background music started successfully, muted:', bgMusic.muted);
                    }).catch((error) => {
                        console.error('Could not play audio:', error);
                        userInteracted = true;
                        isPlaying = false;
                        console.warn('Audio playback failed. User may need to interact with page first.');
                    });
                }
                return;
            }
            
            // If already playing but muted (from autoplay), unmute on user interaction
            if (isPlaying && bgMusic.muted && !userInteracted) {
                bgMusic.muted = false;
                userInteracted = true;
                updateIcon();
                console.log('Background music unmuted after user interaction');
                return;
            }

            // If audio has been started before, just toggle mute state
            // Don't restart audio, just toggle mute - this is the key fix
            if (hasEverPlayed || userInteracted) {
                // Store current state before toggle
                const currentMuteState = bgMusic.muted;
                const newMuteState = !currentMuteState;
                
                // Set the new mute state
                bgMusic.muted = newMuteState;
                
                // Sync all glitch sounds with the new mute state
                syncGlitchSoundsMuteState();
                
                // Force update icon immediately
                updateIcon();
                
                // Verify the state was set correctly
                setTimeout(() => {
                    if (bgMusic.muted !== newMuteState) {
                        console.warn('Mute state was changed! Resetting to:', newMuteState);
                        bgMusic.muted = newMuteState;
                        updateIcon();
                    }
                }, 50);
                
                console.log('Audio muted toggled to:', bgMusic.muted, 'was:', currentMuteState, 'isPlaying:', isPlaying, 'paused:', bgMusic.paused);
                return;
            }
        }

        // Click handler for audio control - use flags to prevent double-triggering
        // Both click and touchstart can fire, or click can fire multiple times
        let clickHandled = false;
        audioControl.addEventListener('click', (e) => {
            if (!clickHandled) {
                clickHandled = true;
                toggleAudio(e);
                setTimeout(() => {
                    clickHandled = false;
                }, 300);
            }
        });
        
        // For touch devices, use touchstart but prevent default to avoid double-trigger
        let touchHandled = false;
        audioControl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!touchHandled) {
                touchHandled = true;
                toggleAudio(e);
                setTimeout(() => {
                    touchHandled = false;
                }, 300);
            }
        });
        
        // Make sure pointer events work
        audioControl.style.pointerEvents = 'auto';
        audioControl.style.cursor = 'pointer';

        // Try to start playing immediately (muted autoplay is allowed by browsers)
        function attemptAutoplay() {
            if (!userInteracted && !isPlaying) {
                console.log('Attempting muted autoplay...');
                // Start muted - browsers allow muted autoplay
                bgMusic.muted = true;
                bgMusic.play().then(() => {
                    isPlaying = true;
                    hasEverPlayed = true;
                    updateIcon();
                    console.log('Background music auto-started (muted), waiting for user interaction to unmute');
                    
                    // Unmute after first user interaction
                    const unmuteHandler = () => {
                        if (bgMusic.muted && isPlaying) {
                            bgMusic.muted = false;
                            userInteracted = true;
                            updateIcon();
                            console.log('Background music unmuted after user interaction');
                        }
                        // Remove handler after first interaction
                        document.removeEventListener('click', unmuteHandler);
                        document.removeEventListener('touchstart', unmuteHandler);
                        document.removeEventListener('keydown', unmuteHandler);
                    };
                    document.addEventListener('click', unmuteHandler, { once: true });
                    document.addEventListener('touchstart', unmuteHandler, { once: true });
                    document.addEventListener('keydown', unmuteHandler, { once: true });
                }).catch((error) => {
                    console.log('Autoplay blocked - will retry after user interaction:', error);
                    // Retry after user interaction (any click on page)
                    const interactionHandler = () => {
                        bgMusic.muted = false; // Unmute when user interacts
                        bgMusic.play().then(() => {
                            isPlaying = true;
                            userInteracted = true;
                            hasEverPlayed = true;
                            updateIcon();
                            console.log('Background music started after user interaction');
                        }).catch((err) => {
                            console.log('Still blocked after interaction:', err);
                        });
                        // Remove handler after first interaction
                        document.removeEventListener('click', interactionHandler);
                        document.removeEventListener('touchstart', interactionHandler);
                        document.removeEventListener('keydown', interactionHandler);
                    };
                    document.addEventListener('click', interactionHandler, { once: true });
                    document.addEventListener('touchstart', interactionHandler, { once: true });
                    document.addEventListener('keydown', interactionHandler, { once: true });
                    updateIcon();
                });
            }
        }

        // Try autoplay immediately
        attemptAutoplay();
        
        // Also try after a short delay (some browsers need this)
        setTimeout(attemptAutoplay, 500);
        setTimeout(attemptAutoplay, 1000);
        
        // Aggressive audio unlock: detect ANY user interaction to unlock audio
        // This includes mouse movement, touch, keypress, etc.
        // More aggressive on mobile - listen on window, document, and body
        let audioUnlocked = false;
        const unlockAudioOnInteraction = (event) => {
            if (audioUnlocked) return;
            
            console.log('User interaction detected:', event?.type || 'unknown');
            
            // Unlock audio on first interaction
            if (bgMusic && bgMusic.muted && isPlaying) {
                bgMusic.muted = false;
                userInteracted = true;
                updateIcon();
                console.log('Audio unlocked via user interaction (mouse/touch/key)');
            } else if (bgMusic && !isPlaying) {
                // Try to start playing if not already playing
                bgMusic.muted = false;
                bgMusic.play().then(() => {
                    isPlaying = true;
                    userInteracted = true;
                    hasEverPlayed = true;
                    updateIcon();
                    console.log('Audio started and unlocked via user interaction');
                }).catch((err) => {
                    console.log('Could not start audio:', err);
                });
            } else if (bgMusic) {
                // Just mark as interacted even if already playing
                userInteracted = true;
                console.log('User interaction registered');
            }
            
            audioUnlocked = true;
            // Remove all listeners after first unlock
            const targets = [document, window, document.body].filter(Boolean);
            const eventTypes = ['mousemove', 'mousedown', 'mouseup', 'click', 
                              'touchstart', 'touchend', 'touchmove', 'touchcancel',
                              'keydown', 'keyup', 
                              'pointerdown', 'pointerup', 'pointermove', 'pointercancel'];
            
            targets.forEach(target => {
                eventTypes.forEach(eventType => {
                    target.removeEventListener(eventType, unlockAudioOnInteraction);
                });
            });
        };
        
        // Listen for ANY user interaction to unlock audio
        // Add listeners to document, window, and body for maximum coverage
        // Especially important for mobile touch events
        const targets = [document, window, document.body].filter(Boolean);
        const touchOptions = { passive: true, capture: false };
        const mouseOptions = { passive: true, capture: false };
        
        targets.forEach(target => {
            // Mouse events (desktop)
            target.addEventListener('mousemove', unlockAudioOnInteraction, { once: true, ...mouseOptions });
            target.addEventListener('mousedown', unlockAudioOnInteraction, { once: true });
            target.addEventListener('mouseup', unlockAudioOnInteraction, { once: true });
            target.addEventListener('click', unlockAudioOnInteraction, { once: true });
            
            // Touch events (mobile) - most important for mobile
            target.addEventListener('touchstart', unlockAudioOnInteraction, { once: true, ...touchOptions });
            target.addEventListener('touchend', unlockAudioOnInteraction, { once: true });
            target.addEventListener('touchmove', unlockAudioOnInteraction, { once: true, ...touchOptions });
            target.addEventListener('touchcancel', unlockAudioOnInteraction, { once: true });
            
            // Pointer events (unified API for both mouse and touch)
            target.addEventListener('pointerdown', unlockAudioOnInteraction, { once: true });
            target.addEventListener('pointerup', unlockAudioOnInteraction, { once: true });
            target.addEventListener('pointermove', unlockAudioOnInteraction, { once: true, passive: true });
            target.addEventListener('pointercancel', unlockAudioOnInteraction, { once: true });
            
            // Keyboard events
            target.addEventListener('keydown', unlockAudioOnInteraction, { once: true });
            target.addEventListener('keyup', unlockAudioOnInteraction, { once: true });
        });

        // Handle audio errors
        bgMusic.addEventListener('error', (e) => {
            console.error('Audio error:', e, bgMusic.error);
            audioControl.style.opacity = '0.3';
            audioControl.style.cursor = 'not-allowed';
            if (bgMusic.error) {
                console.error('Audio error details:', {
                    code: bgMusic.error.code,
                    message: bgMusic.error.message
                });
            }
        });

        // Handle when audio ends - ensure it loops continuously
        bgMusic.addEventListener('ended', () => {
            console.log('Audio ended, ensuring loop continues...');
            // The loop attribute should handle this automatically, but ensure it restarts
            if (bgMusic.loop) {
                // If loop is enabled, it should restart automatically
                // But just in case, ensure it continues playing
                if (!bgMusic.muted && isPlaying) {
                    bgMusic.currentTime = 0;
                    bgMusic.play().catch((error) => {
                        console.warn('Could not restart audio after loop:', error);
                    });
                }
            } else {
                // If loop is somehow disabled, re-enable it and restart
                bgMusic.loop = true;
                if (!bgMusic.muted && isPlaying) {
                    bgMusic.currentTime = 0;
                    bgMusic.play().catch((error) => {
                        console.warn('Could not restart audio:', error);
                    });
                }
            }
        });

        // Handle when audio can play
        bgMusic.addEventListener('canplay', () => {
            console.log('Audio can play');
        });

        // Handle when audio is loaded
        bgMusic.addEventListener('loadeddata', () => {
            console.log('Audio data loaded');
        });

        // Initial icon state
        updateIcon();

        // Fallback: Show audio control after 5 seconds if loading screen hasn't shown it yet
        // This ensures it appears even if loading screen logic doesn't trigger
        setTimeout(() => {
            const audioControlCheck = document.getElementById('audio-control');
            if (audioControlCheck && !audioControlCheck.classList.contains('visible')) {
                audioControlCheck.classList.add('visible');
                console.log('Audio control shown via fallback timeout');
            }
        }, 5000);

        // Also show when page is fully loaded (DOMContentLoaded)
        if (document.readyState === 'complete') {
            setTimeout(() => {
                const audioControlCheck = document.getElementById('audio-control');
                if (audioControlCheck && !audioControlCheck.classList.contains('visible')) {
                    audioControlCheck.classList.add('visible');
                    console.log('Audio control shown after page load');
                }
            }, 2000);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const audioControlCheck = document.getElementById('audio-control');
                    if (audioControlCheck && !audioControlCheck.classList.contains('visible')) {
                        audioControlCheck.classList.add('visible');
                        console.log('Audio control shown after window load');
                    }
                }, 2000);
            });
        }

        console.log('Background music initialized');
    }

    // Handle window resize to reposition all sprites (including Discord and Promo)
    // This ensures sprites stay fixed relative to the background when window is resized
    let resizeTimeout;
    const handleResize = () => {
        // Debounce resize events to avoid excessive calls
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Call resizeBackground to reposition all sprites including Discord and Promo
            resizeBackground();
        }, 100);
    };

    window.addEventListener('resize', handleResize);

  //sticky ket full screen
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    const handleFullscreenChange = () => {

        // RAF Calllsssssss
        let attempts = 0;
        const maxAttempts = 20;

        const checkDimensions = () => {
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;

            if (currentWidth !== lastWidth || currentHeight !== lastHeight || attempts >= maxAttempts) {

                lastWidth = currentWidth;
                lastHeight = currentHeight;


                if (backgroundSprite) {
                    backgroundSprite.x = currentWidth / 2;
                    backgroundSprite.y = currentHeight / 2;
                }

                resizeBackground();
            } else {
                // check ulit
                attempts++;
                requestAnimationFrame(checkDimensions);
            }
        };

        // Start checking after browser updates dimensions (multiple RAF for fullscreen)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(checkDimensions);
            });
        });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Also handle orientation changes on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            resizeBackground();
        }, 200); // Delay to allow orientation change to complete
    });

    // Add click handler and hover animation to main logo
    const mainLogo = document.getElementById('main-logo');
    const mainLogoClosed = document.getElementById('main-logo-closed');
    const logoWrapper = document.getElementById('logo-wrapper');

    if (mainLogo && mainLogoClosed && logoWrapper) {
        mainLogo.style.cursor = 'pointer'; // Show pointer cursor on hover

        // Preload the closed logo image to ensure smooth transition
        const closedImg = new Image();
        closedImg.src = 'assets/main_logo_closed.png';

        // Handle pointer enter - animate to closed state
        logoWrapper.addEventListener('pointerenter', () => {
            if (mainLogo && mainLogoClosed) {
                mainLogo.style.opacity = '0';
                mainLogoClosed.style.opacity = '1';
            }
        });

        // Handle pointer leave - animate back to open state
        logoWrapper.addEventListener('pointerleave', () => {
            if (mainLogo && mainLogoClosed) {
                mainLogo.style.opacity = '1';
                mainLogoClosed.style.opacity = '0';
            }
        });

        // Click handler - reload the page
        logoWrapper.addEventListener('click', () => {
            console.log('Main logo clicked - reloading page');
            window.location.reload(); // Reload the page to restart the app
        });
    }

    const isMobileOrTablet = () => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent.toLowerCase());
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        // wideee
        const isSmallScreen = window.innerWidth <= 1024;
        return isMobile || isTablet || (hasTouchScreen && isSmallScreen);
    };

    // Makha
    window.isMobileOrTablet = isMobileOrTablet;


    let globalMutatorCapsuleSprite = null;

    // Track if page has fully loaded (to distinguish initial load from tab switching)
    let pageFullyLoaded = false;
    window.addEventListener('load', () => {
        pageFullyLoaded = true;
    });

    // Handle page visibility to keep animations running when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Tab became visible - ensure ticker is running
            if (app.ticker) {
                if (!app.ticker.started) {
                    app.ticker.start();
                }
            }

            // Hide loading screen if it's visible (user returning from new tab)
            // Only hide if page was already fully loaded AND loading screen animation has completed
            // Don't hide if loading screen is still in progress (coverage < 95%)
            if (pageFullyLoaded) {
                const coveragePercentage = window.logoCoveragePercentage || 0;
                // Only hide if loading screen animation has completed (95% coverage reached)
                if (coveragePercentage >= 0.95) {
                    // Hide PixiJS loading screen if exists
                    if (loadingScreen && loadingScreen.visible && loadingScreenAlpha > 0) {
                        console.log('Tab became visible - hiding PixiJS loading screen (animation was already complete)');
                        loadingScreen.visible = false;
                        loadingScreenAlpha = 0;
                        if (loadingScreen.parent) {
                            app.stage.removeChild(loadingScreen);
                        }
                        // Show audio control
                        const audioControl = document.getElementById('audio-control');
                        if (audioControl) {
                            audioControl.classList.add('visible');
                        }
                    }
                } else {
                    // Loading screen animation is still in progress, let it continue
                    console.log('Tab became visible - loading screen animation still in progress, continuing...');
                }

                // Hide HTML redirect loading screen if exists
                const htmlLoadingScreen = document.getElementById('redirectLoadingScreen');
                if (htmlLoadingScreen && !htmlLoadingScreen.classList.contains('hidden')) {
                    console.log('Tab became visible - hiding HTML redirect loading screen');
                    htmlLoadingScreen.classList.add('hidden');
                    setTimeout(() => {
                        if (htmlLoadingScreen.parentNode) {
                            htmlLoadingScreen.parentNode.removeChild(htmlLoadingScreen);
                        }
                    }, 300);
                }
            }

            // Resume all paused animations (AnimatedSprite only)
            const animatedSprites = [
                globalMutatorCapsuleSprite,
                backgroundSprite,
                glitchSprite,
                cctvSprite,
                discordSprite,
                promoSprite,
                telegramSprite,
                wallArtSprite,
                blaisedSprite,
                blaisedAuraSprite
            ];

            animatedSprites.forEach(sprite => {
                if (sprite) {
                    // Force play even if already playing to ensure it's active
                    if (sprite.playing === false) {
                        sprite.play();
                    }
                    // Ensure sprite is visible and active
                    if (sprite.visible === false && sprite !== glitchSprite) {
                        // Don't force visibility for glitch sprite as it's conditionally visible
                        sprite.visible = true;
                    }
                }
            });

            // Force render to refresh display
            if (app.renderer) {
                app.renderer.render(app.stage);
            }

            console.log('Page became visible - resuming all animations');
        } else {
            // Tab became hidden - ensure animations continue running
            // Don't pause ticker when tab is hidden (stopOnMinimize is already false)
            if (app.ticker && !app.ticker.started) {
                app.ticker.start();
            }

            // Ensure all animated sprites continue playing (AnimatedSprite only)
            const animatedSprites = [
                globalMutatorCapsuleSprite,
                backgroundSprite,
                glitchSprite,
                cctvSprite,
                discordSprite,
                promoSprite,
                telegramSprite,
                wallArtSprite,
                blaisedSprite,
                blaisedAuraSprite
            ];

            animatedSprites.forEach(sprite => {
                if (sprite && sprite.playing === false) {
                    sprite.play();
                }
            });
        }
    });

    // Also handle window focus for better compatibility
    window.addEventListener('focus', () => {
        if (app.ticker) {
            if (!app.ticker.started) {
                app.ticker.start();
            }
        }

        // Hide loading screen if visible when window regains focus
        // Only hide if loading screen animation has completed (coverage >= 95%)
        if (pageFullyLoaded) {
            const coveragePercentage = window.logoCoveragePercentage || 0;
            // Only hide if loading screen animation has completed (95% coverage reached)
            if (coveragePercentage >= 0.95) {
                    // Hide PixiJS loading screen if exists
                    if (loadingScreen && loadingScreen.visible && loadingScreenAlpha > 0) {
                        console.log('Window gained focus - hiding PixiJS loading screen (animation was already complete)');
                        loadingScreen.visible = false;
                        loadingScreenAlpha = 0;
                        if (loadingScreen.parent) {
                            app.stage.removeChild(loadingScreen);
                        }
                        // Show audio control
                        const audioControl = document.getElementById('audio-control');
                        if (audioControl) {
                            audioControl.classList.add('visible');
                        }
                    }
            } else {
                // Loading screen animation is still in progress, let it continue
                console.log('Window gained focus - loading screen animation still in progress, continuing...');
            }

            // Hide HTML redirect loading screen if exists
            const htmlLoadingScreen = document.getElementById('redirectLoadingScreen');
            if (htmlLoadingScreen && !htmlLoadingScreen.classList.contains('hidden')) {
                console.log('Window gained focus - hiding HTML redirect loading screen');
                htmlLoadingScreen.classList.add('hidden');
                setTimeout(() => {
                    if (htmlLoadingScreen.parentNode) {
                        htmlLoadingScreen.parentNode.removeChild(htmlLoadingScreen);
                    }
                }, 300);
            }
        }

            // Resume all paused animations (AnimatedSprite only)
            const animatedSprites = [
                globalMutatorCapsuleSprite,
                backgroundSprite,
                glitchSprite,
                cctvSprite,
                discordSprite,
                promoSprite,
                telegramSprite,
                wallArtSprite,
                blaisedSprite,
                blaisedAuraSprite
            ];

            animatedSprites.forEach(sprite => {
                if (sprite && sprite.playing === false) {
                    sprite.play();
                }
            });

        // Force render to refresh display
        if (app.renderer) {
            app.renderer.render(app.stage);
        }

        console.log('Window gained focus - resuming all animations');
    });

    // Loading screen variables
    // DISABLE INTRO LOADING SCREEN FOR DEBUGGING - set to true to enable
    const ENABLE_INTRO_LOADING_SCREEN = true;

    let loadingScreen;
    let logoSprite;
    let flashlightCircle;
    let flashlightTarget = { x: 0, y: 0 };
    let flashlightCurrent = { x: 0, y: 0 };
    let loadingScreenAlpha = 1;
    let flashCount = 0; // Track how many times we've flashed the logo (accessible globally)
    let loadingScreenResizeHandler = null; // Store resize handler reference for cleanup
    
    // Progress bar variables
    let progressBarContainer;
    let progressBarBg;
    let progressBarFill;
    let assetLoadingProgress = 0; // 0 to 1
    let totalAssetsToLoad = 0;
    let loadedAssetsCount = 0;
    let progressBarWidth = 0; // Store for resize

    // Function to update progress bar
    function updateProgressBar(progress) {
        if (!progressBarFill || !progressBarContainer) return;
        
        assetLoadingProgress = Math.min(1, Math.max(0, progress));
        
        // Calculate current width based on progress
        const currentWidth = progressBarWidth * assetLoadingProgress;
        
        // Update progress bar fill
        progressBarFill.clear();
        if (currentWidth > 0) {
            progressBarFill.roundRect(-progressBarWidth / 2, -2, currentWidth, 4, 2);
            progressBarFill.fill({ color: 0xFFFFFF, alpha: 0.9 });
        }
    }

    // Wrapper for Assets.load that tracks progress
    async function loadAssetWithProgress(url) {
        try {
            const texture = await Assets.load(url);
            loadedAssetsCount++;
            const progress = totalAssetsToLoad > 0 ? loadedAssetsCount / totalAssetsToLoad : 0;
            updateProgressBar(progress);
            return texture;
        } catch (error) {
            console.error(`Failed to load asset: ${url}`, error);
            // Still increment count to avoid progress getting stuck
            loadedAssetsCount++;
            const progress = totalAssetsToLoad > 0 ? loadedAssetsCount / totalAssetsToLoad : 0;
            updateProgressBar(progress);
            throw error;
        }
    }

    // Create loading screen with flashlight effect
    async function createLoadingScreen() {
        try {
            // Hide header logo during loading screen
            const mainLogo = document.getElementById('main-logo');
            const headerLogoContainer = document.getElementById('logo-container');
            if (mainLogo) mainLogo.style.display = 'none';
            if (headerLogoContainer) headerLogoContainer.style.display = 'none';

            // Load loading screen logo and flashlight image
            const logoTexture = await Assets.load('assets/loading_screen_logo.png');
            const flashlightTexture = await Assets.load('assets/flashlight.png');

            // Create loading screen container
            loadingScreen = new Container();
            loadingScreen.zIndex = 9999; // Always on top during loading

            // Create pure black background
            const blackBg = new Graphics();
            blackBg.rect(0, 0, app.screen.width, app.screen.height);
            blackBg.fill({ color: 0x000000 }); // Pure black
            loadingScreen.addChild(blackBg);

            // Create logo sprite - ensure it's white
            logoSprite = new Sprite(logoTexture);
            logoSprite.anchor.set(0.5);
            logoSprite.tint = 0xFFFFFF; // Force white color for logo

            // Resize logo to fit nicely on screen (60% of screen width for better visibility, maintaining aspect ratio)
            const logoDisplayWidth = Math.min(app.screen.width, app.screen.height) * 0.6;
            const logoAspectRatio = logoTexture.width / logoTexture.height;
            const logoDisplayHeight = logoDisplayWidth / logoAspectRatio;

            logoSprite.scale.set(logoDisplayWidth / logoTexture.width);
            logoSprite.x = app.screen.width / 2;
            logoSprite.y = app.screen.height / 2;
            loadingScreen.addChild(logoSprite);

            // Create flashlight sprite from flashlight.png image
            // First determine the mask circle size (this will be the reveal area)
            const flashlightRadius = Math.max(logoDisplayWidth, logoDisplayHeight) * 0.4; // 40% of logo size for radius
            const flashlightDiameter = flashlightRadius * 2; // Diameter of the circular reveal area

            // Scale flashlight sprite to match the mask circle diameter
            // Maintain aspect ratio while fitting within the circle diameter
            const flashlightAspectRatio = flashlightTexture.width / flashlightTexture.height;
            let flashlightDisplayWidth, flashlightDisplayHeight;

            if (flashlightTexture.width >= flashlightTexture.height) {
                // Width is larger or equal - fit to diameter width
                flashlightDisplayWidth = flashlightDiameter;
                flashlightDisplayHeight = flashlightDiameter / flashlightAspectRatio;
            } else {
                // Height is larger - fit to diameter height
                flashlightDisplayHeight = flashlightDiameter;
                flashlightDisplayWidth = flashlightDiameter * flashlightAspectRatio;
            }

            // Create flashlight sprite
            flashlightCircle = new Sprite(flashlightTexture);
            flashlightCircle.anchor.set(0.5); // Center anchor for proper positioning
            flashlightCircle.scale.set(flashlightDisplayWidth / flashlightTexture.width);

            // Set initial flashlight position (random)
            flashlightCurrent.x = Math.random() * app.screen.width;
            flashlightCurrent.y = Math.random() * app.screen.height;
            flashlightCircle.x = flashlightCurrent.x;
            flashlightCircle.y = flashlightCurrent.y;

            // Hide the original logo sprite - we'll use a masked version instead
            logoSprite.visible = false;

            // Create mask container for logo reveal
            // The logo will only be visible where the flashlight circle overlaps
            const logoContainer = new Container();
            logoContainer.x = logoSprite.x;
            logoContainer.y = logoSprite.y;

            // Create a copy of logo that will be masked - ensure it's white
            const maskedLogo = new Sprite(logoTexture);
            maskedLogo.anchor.set(0.5);
            maskedLogo.x = 0;
            maskedLogo.y = 0;
            maskedLogo.tint = 0xFFFFFF; // Force white color for logo

            // Apply same scale as logoSprite
            maskedLogo.scale.set(logoDisplayWidth / logoTexture.width);

            // DEBUG: Test if logo sprite works
            console.log('Logo texture loaded:', {
                width: logoTexture.width,
                height: logoTexture.height,
                baseTexture: logoTexture.baseTexture ? 'exists' : 'missing'
            });

            // Create mask from flashlight circle - SHARP edge for sharp logo reveal
            // The mask will be a solid circle (no feather) so revealed logo parts are sharp
            const maskCircle = new Graphics();

            // Function to draw sharp mask circle (solid, no feather)
            const drawSharpMask = () => {
                maskCircle.clear();
                // Create sharp mask - solid circle with no feather for sharp logo reveal
                maskCircle.circle(0, 0, flashlightRadius);
                maskCircle.fill({ color: 0xFFFFFF, alpha: 1.0 }); // Solid white for sharp mask
            };
            drawSharpMask();

            // Position mask circle based on flashlight position relative to logo center
            const updateMaskPosition = () => {
                if (maskCircle && logoSprite) {
                    // Calculate position relative to logo center
                    maskCircle.x = flashlightCurrent.x - logoSprite.x;
                    maskCircle.y = flashlightCurrent.y - logoSprite.y;
                }
            };
            updateMaskPosition();

            // Apply mask to logo - this reveals only the parts where maskCircle is white
            maskedLogo.mask = maskCircle;

            // IMPORTANT: The mask must be added to display list for masking to work
            // Add maskCircle to the container first
            logoContainer.addChild(maskCircle);
            logoContainer.addChild(maskedLogo);

            // Make sure mask is visible (for debugging, we can check if mask renders)
            maskCircle.visible = true;

            // Add flashlight circle FIRST (behind), then logo container (on top)
            // This ensures flashlight is below the logo
            loadingScreen.addChild(flashlightCircle);
            loadingScreen.addChild(logoContainer);

            // Create progress bar below the logo
            progressBarWidth = logoDisplayWidth * 0.8; // 80% of logo width
            const progressBarHeight = 4; // Thin progress bar
            const progressBarY = logoSprite.y + logoDisplayHeight / 2 + 40; // Position below logo

            // Progress bar container
            progressBarContainer = new Container();
            progressBarContainer.x = app.screen.width / 2;
            progressBarContainer.y = progressBarY;

            // Progress bar background (gray)
            progressBarBg = new Graphics();
            progressBarBg.roundRect(-progressBarWidth / 2, -progressBarHeight / 2, progressBarWidth, progressBarHeight, 2);
            progressBarBg.fill({ color: 0x333333, alpha: 0.5 }); // Semi-transparent dark gray
            progressBarContainer.addChild(progressBarBg);

            // Progress bar fill (white)
            progressBarFill = new Graphics();
            progressBarFill.roundRect(-progressBarWidth / 2, -progressBarHeight / 2, 0, progressBarHeight, 2);
            progressBarFill.fill({ color: 0xFFFFFF, alpha: 0.9 }); // White with slight transparency
            progressBarContainer.addChild(progressBarFill);

            loadingScreen.addChild(progressBarContainer);

            console.log('Loading screen created:', {
                logoPos: { x: logoSprite.x, y: logoSprite.y },
                flashlightRadius: flashlightRadius,
                logoContainerPos: { x: logoContainer.x, y: logoContainer.y },
                progressBarY: progressBarY
            });

            app.stage.addChild(loadingScreen);

            // Animate flashlight moving to reveal logo systematically
            let lastTargetTime = 0;
            let moveSpeed = 0.03; // Slightly faster movement for better reveal
            flashCount = 0; // Reset flash count
            const centerX = app.screen.width / 2;
            const centerY = app.screen.height / 2;
            let targetChangeInterval = 600 + Math.random() * 300; // 0.6-0.9 seconds (faster)

            // Calculate logo bounds for systematic reveal (use same size as displayed logo)
            const logoDisplayWidthForBounds = Math.min(app.screen.width, app.screen.height) * 0.6;
            const logoAspectRatioForBounds = logoTexture.width / logoTexture.height;
            const logoDisplayHeightForBounds = logoDisplayWidthForBounds / logoAspectRatioForBounds;

            // Track logo coverage using a grid system
            // Create a grid to track which parts of the logo have been revealed
            const gridSize = 10; // 10x10 grid for coverage tracking
            const logoLeft = centerX - logoDisplayWidthForBounds / 2;
            const logoRight = centerX + logoDisplayWidthForBounds / 2;
            const logoTop = centerY - logoDisplayHeightForBounds / 2;
            const logoBottom = centerY + logoDisplayHeightForBounds / 2;
            const gridCellWidth = logoDisplayWidthForBounds / gridSize;
            const gridCellHeight = logoDisplayHeightForBounds / gridSize;

            // Initialize coverage grid (false = not covered, true = covered)
            const coverageGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
            let totalCoveredCells = 0;
            const totalCells = gridSize * gridSize;

            // Function to check and mark coverage
            const checkCoverage = (x, y) => {
                // Check if position is within logo bounds
                if (x < logoLeft || x > logoRight || y < logoTop || y > logoBottom) {
                    return;
                }

                // Calculate grid cell
                const gridX = Math.floor((x - logoLeft) / gridCellWidth);
                const gridY = Math.floor((y - logoTop) / gridCellHeight);

                // Clamp to grid bounds
                const clampedX = Math.max(0, Math.min(gridSize - 1, gridX));
                const clampedY = Math.max(0, Math.min(gridSize - 1, gridY));

                // Mark cell and surrounding cells as covered (flashlight has radius)
                const radiusInCells = Math.ceil(flashlightRadius / Math.min(gridCellWidth, gridCellHeight));
                for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
                    for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
                        const checkX = clampedX + dx;
                        const checkY = clampedY + dy;
                        if (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= radiusInCells && !coverageGrid[checkY][checkX]) {
                                coverageGrid[checkY][checkX] = true;
                                totalCoveredCells++;
                            }
                        }
                    }
                }
            };

            // Store references for ticker
            const tickerMaskCircle = maskCircle;
            const tickerLogoSprite = logoSprite;

            app.ticker.add(() => {
                if (!loadingScreen || loadingScreenAlpha <= 0) return;

                const now = Date.now();

                // Change target position to systematically reveal logo
                if (now - lastTargetTime > targetChangeInterval) {
                    targetChangeInterval = 600 + Math.random() * 300; // Next interval

                    // Focus on logo area - create grid-like pattern to reveal logo
                    // 70% chance to target logo area, 30% chance for center (flash effect)
                    if (Math.random() > 0.3) {
                        // Target random position within logo bounds
                        const logoLeft = centerX - logoDisplayWidthForBounds / 2;
                        const logoTop = centerY - logoDisplayHeightForBounds / 2;
                        const gridX = Math.random() * logoDisplayWidthForBounds + logoLeft;
                        const gridY = Math.random() * logoDisplayHeightForBounds + logoTop;
                        flashlightTarget.x = gridX;
                        flashlightTarget.y = gridY;
                        flashCount++;
                    } else {
                        // Point directly at logo center for flash effect
                        flashlightTarget.x = centerX;
                        flashlightTarget.y = centerY;
                        flashCount++;
                    }
                    lastTargetTime = now;
                }

                // Smoothly interpolate flashlight position
                flashlightCurrent.x += (flashlightTarget.x - flashlightCurrent.x) * moveSpeed;
                flashlightCurrent.y += (flashlightTarget.y - flashlightCurrent.y) * moveSpeed;

                // Update flashlight circle position
                flashlightCircle.x = flashlightCurrent.x;
                flashlightCircle.y = flashlightCurrent.y;

                // Update mask position - ensure it follows flashlight
                if (tickerMaskCircle && tickerLogoSprite) {
                    tickerMaskCircle.x = flashlightCurrent.x - tickerLogoSprite.x;
                    tickerMaskCircle.y = flashlightCurrent.y - tickerLogoSprite.y;
                }

                // Check coverage as flashlight moves
                checkCoverage(flashlightCurrent.x, flashlightCurrent.y);

                // Update global coverage percentage for loading screen check
                const coveragePercentage = totalCoveredCells / totalCells;
                window.logoCoveragePercentage = coveragePercentage;

                // Update loading screen alpha for fade out
                if (loadingScreenAlpha > 0) {
                    loadingScreen.alpha = loadingScreenAlpha;
                }
            });

            // Function to resize logo and update positions
            const resizeLoadingScreen = () => {
                // Check if loading screen still exists and hasn't been destroyed
                if (!loadingScreen || !loadingScreen.parent || loadingScreen.destroyed) {
                    return;
                }
                if (blackBg && !blackBg.destroyed && logoSprite && !logoSprite.destroyed && logoContainer && !logoContainer.destroyed && maskedLogo && !maskedLogo.destroyed) {
                    // Resize black background
                    blackBg.clear();
                    blackBg.rect(0, 0, app.screen.width, app.screen.height);
                    blackBg.fill({ color: 0x000000 });

                    // Recalculate logo size
                    const newLogoDisplayWidth = Math.min(app.screen.width, app.screen.height) * 0.6;
                    const logoAspectRatio = logoTexture.width / logoTexture.height;
                    const newLogoDisplayHeight = newLogoDisplayWidth / logoAspectRatio;

                    // Update logo sprite position and scale
                    logoSprite.x = app.screen.width / 2;
                    logoSprite.y = app.screen.height / 2;
                    logoSprite.scale.set(newLogoDisplayWidth / logoTexture.width);

                    // Update masked logo scale
                    maskedLogo.scale.set(newLogoDisplayWidth / logoTexture.width);

                    // Update logo container position (follows logo sprite)
                    logoContainer.x = logoSprite.x;
                    logoContainer.y = logoSprite.y;

                    // Update progress bar position and size
                    if (progressBarContainer && !progressBarContainer.destroyed) {
                        progressBarWidth = newLogoDisplayWidth * 0.8; // 80% of logo width
                        const progressBarY = logoSprite.y + newLogoDisplayHeight / 2 + 40;
                        progressBarContainer.x = app.screen.width / 2;
                        progressBarContainer.y = progressBarY;

                        // Resize progress bar background
                        if (progressBarBg && !progressBarBg.destroyed) {
                            progressBarBg.clear();
                            progressBarBg.roundRect(-progressBarWidth / 2, -2, progressBarWidth, 4, 2);
                            progressBarBg.fill({ color: 0x333333, alpha: 0.5 });
                        }

                        // Resize progress bar fill (maintain current progress)
                        if (progressBarFill && !progressBarFill.destroyed) {
                            const currentWidth = progressBarWidth * assetLoadingProgress;
                            progressBarFill.clear();
                            if (currentWidth > 0) {
                                progressBarFill.roundRect(-progressBarWidth / 2, -2, currentWidth, 4, 2);
                                progressBarFill.fill({ color: 0xFFFFFF, alpha: 0.9 });
                            }
                        }
                    }

                    // Update flashlight sprite size to match mask circle size
                    if (flashlightCircle && flashlightCircle instanceof Sprite) {
                        // Recalculate mask circle size based on new logo size
                        const newFlashlightRadius = Math.max(newLogoDisplayWidth, newLogoDisplayHeight) * 0.4; // 40% of logo size for radius
                        const newFlashlightDiameter = newFlashlightRadius * 2; // Diameter of the circular reveal area

                        // Scale flashlight sprite to match the mask circle diameter
                        const flashlightAspectRatio = flashlightCircle.texture.width / flashlightCircle.texture.height;
                        let newFlashlightDisplayWidth, newFlashlightDisplayHeight;

                        if (flashlightCircle.texture.width >= flashlightCircle.texture.height) {
                            // Width is larger or equal - fit to diameter width
                            newFlashlightDisplayWidth = newFlashlightDiameter;
                            newFlashlightDisplayHeight = newFlashlightDiameter / flashlightAspectRatio;
                        } else {
                            // Height is larger - fit to diameter height
                            newFlashlightDisplayHeight = newFlashlightDiameter;
                            newFlashlightDisplayWidth = newFlashlightDiameter * flashlightAspectRatio;
                        }

                        flashlightCircle.scale.set(newFlashlightDisplayWidth / flashlightCircle.texture.width);

                        // Update mask circle size to match - SHARP (no feather)
                        if (maskCircle && !maskCircle.destroyed) {
                            maskCircle.clear();
                            // Sharp mask - solid circle
                            maskCircle.circle(0, 0, newFlashlightRadius);
                            maskCircle.fill({ color: 0xFFFFFF, alpha: 1.0 }); // Solid white for sharp mask
                        }
                    }
                }
            };

            // Update on resize
            loadingScreenResizeHandler = resizeLoadingScreen;
            window.addEventListener('resize', loadingScreenResizeHandler);

        } catch (error) {
            console.error('Error creating loading screen:', error);
        }
    }

    // Function to fade out loading screen
    function fadeOutLoadingScreen() {
        if (!loadingScreen || !loadingScreen.parent) return;

        // Ensure progress bar is at 100% before fading out
        updateProgressBar(1.0);

        const fadeSpeed = 0.03;
        const fadeInterval = setInterval(() => {
            loadingScreenAlpha -= fadeSpeed;
            if (loadingScreenAlpha <= 0) {
                loadingScreenAlpha = 0;
                loadingScreen.visible = false;
                if (loadingScreen.parent) {
                    // Remove resize listener before destroying
                    if (loadingScreenResizeHandler) {
                        window.removeEventListener('resize', loadingScreenResizeHandler);
                        loadingScreenResizeHandler = null;
                    }
                    app.stage.removeChild(loadingScreen);
                    loadingScreen.destroy({ children: true });
                    loadingScreen = null;
                }
                clearInterval(fadeInterval);

                // Show header logo again after loading screen fades out
                const mainLogo = document.getElementById('main-logo');
                const headerLogoContainer = document.getElementById('logo-container');
                if (mainLogo) mainLogo.style.display = '';
                if (headerLogoContainer) headerLogoContainer.style.display = '';

                // Show audio control after loading screen finishes
                const audioControl = document.getElementById('audio-control');
                if (audioControl) {
                    audioControl.classList.add('visible');
                    console.log('Audio control shown after loading screen');
                }

                // Show instruction animation after loading screen fades out
                showInstructionAnimation();
            }
        }, 16); // ~60fps
    }

    // Instruction animation variables
    let instructionContainer = null;
    let instructionAlpha = 1.0;
    let instructionAnimationId = null;
    let instructionResizeHandler = null;
    let isInstructionFading = false;

    // Function to detect scrollable directions
    function detectScrollableDirections() {
        const viewportWidth = app.screen.width;
        const viewportHeight = app.screen.height;

        // Get actual content dimensions (background sprite displayed size)
        let contentWidth = viewportWidth;
        let contentHeight = viewportHeight;

        if (backgroundSprite) {
            const scale = currentScale || 1;
            contentWidth = imageWidth * scale;
            contentHeight = imageHeight * scale;
        }

        // Determine which directions need scrolling
        const needsHorizontalScroll = contentWidth > viewportWidth;
        const needsVerticalScroll = contentHeight > viewportHeight;

        return {
            horizontal: needsHorizontalScroll,
            vertical: needsVerticalScroll,
            contentWidth: contentWidth,
            contentHeight: contentHeight,
            viewportWidth: viewportWidth,
            viewportHeight: viewportHeight
        };
    }

    // Function to create and show instruction animation
    function showInstructionAnimation() {
        // Check if instruction has been shown before (commented out for testing - uncomment to show only once)
        // const instructionShown = localStorage.getItem('prometheans_instruction_shown');
        // if (instructionShown === 'true') {
        //     return; // Don't show again
        // }

        // Check if mobile/tablet
        const isMobile = typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet();

        // Detect scrollable directions
        const scrollInfo = detectScrollableDirections();

        // Create instruction container
        instructionContainer = new Container();
        instructionContainer.zIndex = 9998; // Just below loading screen
        instructionContainer.alpha = instructionAlpha;
        instructionContainer.eventMode = 'passive'; // Don't block interactions

        // Create semi-transparent overlay
        const overlay = new Graphics();
        overlay.rect(0, 0, app.screen.width, app.screen.height);
        overlay.fill({ color: 0x000000, alpha: 0.3 }); // Semi-transparent black
        instructionContainer.addChild(overlay);

        if (isMobile) {
            // Mobile: Show swipe animation based on scrollable directions
            createSwipeAnimation(instructionContainer, scrollInfo);
        } else {
            // Desktop: Show mouse click + drag animation based on scrollable directions
            createMouseDragAnimation(instructionContainer, scrollInfo);
        }

        // Add instruction container to stage
        app.stage.addChild(instructionContainer);

        // Handle window resize
        instructionResizeHandler = () => {
            if (!instructionContainer) return;

            // Update overlay size
            const overlay = instructionContainer.children[0];
            if (overlay && overlay instanceof Graphics) {
                overlay.clear();
                overlay.rect(0, 0, app.screen.width, app.screen.height);
                overlay.fill({ color: 0x000000, alpha: 0.3 });
            }

            // Update text positions if they exist
            instructionContainer.children.forEach((child) => {
                if (child instanceof Text) {
                    if (child.text.includes('Long press') || child.text.includes('explore')) {
                        child.x = app.screen.width / 2;
                        child.y = app.screen.height * 0.85;
                    }
                }
            });
        };

        window.addEventListener('resize', instructionResizeHandler);

        // Auto-fade after 4 seconds
        setTimeout(() => {
            fadeOutInstruction();
        }, 4000);

        // Hide on any interaction
        const hideOnInteraction = () => {
            if (instructionContainer && instructionContainer.visible) {
                fadeOutInstruction();
            }
        };

        // Listen for user interactions
        app.canvas.addEventListener('pointerdown', hideOnInteraction, { once: true });
        app.canvas.addEventListener('touchstart', hideOnInteraction, { once: true });
        app.canvas.addEventListener('mousedown', hideOnInteraction, { once: true });
    }

    // Function to create mouse click + drag animation (desktop)
    function createMouseDragAnimation(container, scrollInfo) {
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        // Responsive mouse size based on screen size
        const viewportWidth = app.screen.width;
        const viewportHeight = app.screen.height;
        const minDimension = Math.min(viewportWidth, viewportHeight);
        const mouseSize = Math.max(20, Math.min(35, 30 * (minDimension / 800)));

        // Determine animation direction based on scrollable directions
        let startX, startY, endX, endY;
        let isHorizontal = false;
        let instructionText = '';

        if (scrollInfo.horizontal && scrollInfo.vertical) {
            // Both directions scrollable - prioritize horizontal for smaller screens
            if (scrollInfo.viewportWidth < scrollInfo.viewportHeight) {
                // Portrait or narrow screen - show horizontal
                isHorizontal = true;
                startX = app.screen.width * 0.3;
                endX = app.screen.width * 0.7;
                startY = centerY;
                endY = centerY;
                instructionText = 'Long press and drag left/right to explore';
            } else {
                // Landscape or wide screen - show vertical
                isHorizontal = false;
                startX = centerX;
                endX = centerX;
                startY = app.screen.height * 0.3;
                endY = app.screen.height * 0.7;
                instructionText = 'Long press and drag up/down to explore';
            }
        } else if (scrollInfo.horizontal) {
            // Only horizontal scrolling needed
            isHorizontal = true;
            startX = app.screen.width * 0.3;
            endX = app.screen.width * 0.7;
            startY = centerY;
            endY = centerY;
            instructionText = 'Long press and drag left/right to explore';
        } else if (scrollInfo.vertical) {
            // Only vertical scrolling needed
            isHorizontal = false;
            startX = centerX;
            endX = centerX;
            startY = app.screen.height * 0.3;
            endY = app.screen.height * 0.7;
            instructionText = 'Long press and drag up/down to explore';
        } else {
            // No scrolling needed - show default vertical
            isHorizontal = false;
            startX = centerX;
            endX = centerX;
            startY = app.screen.height * 0.3;
            endY = app.screen.height * 0.7;
            instructionText = 'Long press and drag to explore';
        }

        // Create mouse cursor graphic
        const mouseCursor = new Graphics();

        // Draw mouse shape (simplified)
        const drawMouse = (x, y, isPressed = false, pressDuration = 0) => {
            if (!mouseCursor || mouseCursor.destroyed) return;
            mouseCursor.clear();
            // Mouse body (rounded rectangle)
            mouseCursor.roundRect(-mouseSize/2, -mouseSize/2, mouseSize, mouseSize * 1.5, 5);
            mouseCursor.fill({ color: 0xFFFFFF, alpha: 0.9 });
            mouseCursor.stroke({ color: 0x333333, width: 2 });

            // Left click button (highlighted when pressed, with pulsing effect for long press)
            if (isPressed) {
                const pulseAlpha = 0.8 + Math.sin(pressDuration * 0.01) * 0.2; // Pulsing effect
                mouseCursor.roundRect(-mouseSize/2, -mouseSize/2, mouseSize * 0.6, mouseSize * 0.6, 3);
                mouseCursor.fill({ color: 0x4CAF50, alpha: pulseAlpha });
            }

            // Mouse wheel line
            mouseCursor.moveTo(-mouseSize * 0.2, mouseSize * 0.1);
            mouseCursor.lineTo(mouseSize * 0.2, mouseSize * 0.1);
            mouseCursor.stroke({ color: 0x666666, width: 1 });
        };

        mouseCursor.x = centerX;
        mouseCursor.y = startY;
        drawMouse(0, 0, false, 0);
        container.addChild(mouseCursor);

        // Create drag trail (dots showing path)
        const trailGraphics = new Graphics();
        container.addChild(trailGraphics);

        // Animation state
        let animTime = 0;
        const animDuration = 3000; // 3 seconds per cycle (longer to show long press)
        let isPressing = false;
        let pressStartTime = 0;

        // Animation loop
        instructionAnimationId = app.ticker.add(() => {
            if (!instructionContainer || !instructionContainer.visible || instructionContainer.destroyed) return;
            if (!mouseCursor || mouseCursor.destroyed || !trailGraphics || trailGraphics.destroyed) return;

            animTime += app.ticker.deltaMS;
            if (animTime >= animDuration) {
                animTime = 0; // Reset animation
                isPressing = false;
                pressStartTime = 0;
            }

            const progress = (animTime % animDuration) / animDuration;

            // Long press phase (first 30% of animation - showing long press)
            if (progress < 0.3) {
                isPressing = true;
                if (pressStartTime === 0) pressStartTime = animTime;
                mouseCursor.x = startX;
                mouseCursor.y = startY;
                const pressDuration = animTime - pressStartTime;
                drawMouse(0, 0, true, pressDuration);

                // Draw press indicator (expanding circle)
                if (trailGraphics && !trailGraphics.destroyed) {
                    trailGraphics.clear();
                    const pressProgress = progress / 0.3;
                    const pressRadius = 15 + pressProgress * 20;
                    trailGraphics.circle(startX, startY, pressRadius);
                    trailGraphics.stroke({ color: 0x4CAF50, width: 2, alpha: 0.6 - pressProgress * 0.4 });
                }
            } else {
                isPressing = false;
                // Drag phase (remaining 70% - moving in detected direction)
                const dragProgress = (progress - 0.3) / 0.7;

                // Move in the appropriate direction
                let easeProgress;
                let currentX, currentY;

                if (dragProgress < 0.5) {
                    // Moving to end position
                    const moveProgress = dragProgress * 2;
                    easeProgress = moveProgress < 0.5
                        ? 2 * moveProgress * moveProgress
                        : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;

                    if (isHorizontal) {
                        currentX = startX + (endX - startX) * easeProgress;
                        currentY = startY;
                    } else {
                        currentX = startX;
                        currentY = startY + (endY - startY) * easeProgress;
                    }
                } else {
                    // Moving back to start position
                    const backProgress = (dragProgress - 0.5) * 2;
                    easeProgress = backProgress < 0.5
                        ? 2 * backProgress * backProgress
                        : 1 - Math.pow(-2 * backProgress + 2, 2) / 2;

                    if (isHorizontal) {
                        currentX = endX - (endX - startX) * easeProgress;
                        currentY = startY;
                    } else {
                        currentX = startX;
                        currentY = endY - (endY - startY) * easeProgress;
                    }
                }

                mouseCursor.x = currentX;
                mouseCursor.y = currentY;
                drawMouse(0, 0, true, 0); // Keep pressed while dragging

                // Draw trail
                if (trailGraphics && !trailGraphics.destroyed) {
                    trailGraphics.clear();
                    const trailLength = Math.min(15, Math.floor(easeProgress * 30));
                    for (let i = 0; i < trailLength; i++) {
                        const trailProgress = easeProgress - (i * 0.03);
                        if (trailProgress > 0) {
                            let trailX, trailY;
                            if (dragProgress < 0.5) {
                                if (isHorizontal) {
                                    trailX = startX + (endX - startX) * trailProgress;
                                    trailY = startY;
                                } else {
                                    trailX = startX;
                                    trailY = startY + (endY - startY) * trailProgress;
                                }
                            } else {
                                const backProgress = (dragProgress - 0.5) * 2;
                                const backEase = backProgress < 0.5
                                    ? 2 * backProgress * backProgress
                                    : 1 - Math.pow(-2 * backProgress + 2, 2) / 2;
                                if (isHorizontal) {
                                    trailX = endX - (endX - startX) * backEase;
                                    trailY = startY;
                                } else {
                                    trailX = startX;
                                    trailY = endY - (endY - startY) * backEase;
                                }
                            }
                            trailGraphics.circle(trailX, trailY, 3);
                            trailGraphics.fill({ color: 0xFFFFFF, alpha: 0.4 - (i * 0.02) });
                        }
                    }
                }
            }
        });

        // Calculate responsive font size based on screen size
        const baseFontSize = 24;
        const minFontSize = 14;
        const maxFontSize = 28;
        // Scale font size based on viewport width (smaller screens = smaller font)
        // Reuse viewportWidth and viewportHeight already declared above
        const minDimensionForFont = Math.min(viewportWidth, viewportHeight);
        // Scale: 320px (small phone) = minFontSize, 1920px (large screen) = maxFontSize
        const fontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * (minDimensionForFont / 800)));

        // Add instruction text
        const instructionTextElement = new Text({
            text: instructionText,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: fontSize,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 2,
                dropShadowBlur: 4,
                wordWrap: true,
                wordWrapWidth: viewportWidth * 0.9, // Allow text wrapping on small screens
            }
        });
        instructionTextElement.anchor.set(0.5);
        instructionTextElement.x = app.screen.width / 2;
        instructionTextElement.y = app.screen.height * 0.85;
        container.addChild(instructionTextElement);
    }

    // Function to create swipe animation (mobile)
    function createSwipeAnimation(container, scrollInfo) {
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        // Responsive finger size based on screen size
        const viewportWidth = app.screen.width;
        const viewportHeight = app.screen.height;
        const minDimension = Math.min(viewportWidth, viewportHeight);
        const fingerSize = Math.max(18, Math.min(30, 25 * (minDimension / 800)));

        // Determine animation direction based on scrollable directions
        let startX, startY, endX, endY;
        let isHorizontal = false;
        let instructionText = '';

        if (scrollInfo.horizontal && scrollInfo.vertical) {
            // Both directions scrollable - prioritize horizontal for smaller screens
            if (scrollInfo.viewportWidth < scrollInfo.viewportHeight) {
                // Portrait or narrow screen - show horizontal
                isHorizontal = true;
                startX = app.screen.width * 0.3;
                endX = app.screen.width * 0.7;
                startY = centerY;
                endY = centerY;
                instructionText = 'Long press and swipe left/right to explore';
            } else {
                // Landscape or wide screen - show vertical
                isHorizontal = false;
                startX = centerX;
                endX = centerX;
                startY = app.screen.height * 0.3;
                endY = app.screen.height * 0.7;
                instructionText = 'Long press and swipe up/down to explore';
            }
        } else if (scrollInfo.horizontal) {
            // Only horizontal scrolling needed
            isHorizontal = true;
            startX = app.screen.width * 0.3;
            endX = app.screen.width * 0.7;
            startY = centerY;
            endY = centerY;
            instructionText = 'Long press and swipe left/right to explore';
        } else if (scrollInfo.vertical) {
            // Only vertical scrolling needed
            isHorizontal = false;
            startX = centerX;
            endX = centerX;
            startY = app.screen.height * 0.3;
            endY = app.screen.height * 0.7;
            instructionText = 'Long press and swipe up/down to explore';
        } else {
            // No scrolling needed - show default vertical
            isHorizontal = false;
            startX = centerX;
            endX = centerX;
            startY = app.screen.height * 0.3;
            endY = app.screen.height * 0.7;
            instructionText = 'Long press and swipe to explore';
        }

        // Create finger/hand graphic
        const finger = new Graphics();

        const drawFinger = (x, y, isPressing = false) => {
            if (!finger || finger.destroyed) return;
            finger.clear();
            // Draw finger as a circle
            finger.circle(0, 0, fingerSize);
            finger.fill({ color: 0xFFFFFF, alpha: 0.9 });
            finger.stroke({ color: 0x333333, width: 2 });

            // Add press indicator
            if (isPressing) {
                finger.circle(0, 0, fingerSize * 0.7);
                finger.fill({ color: 0x4CAF50, alpha: 0.6 });
            }
        };

        finger.x = centerX;
        finger.y = startY;
        drawFinger(0, 0, false);
        container.addChild(finger);

        // Create swipe trail
        const trailGraphics = new Graphics();
        container.addChild(trailGraphics);

        // Animation state
        let animTime = 0;
        const animDuration = 3000; // 3 seconds per cycle

        // Animation loop
        instructionAnimationId = app.ticker.add(() => {
            if (!instructionContainer || !instructionContainer.visible || instructionContainer.destroyed) return;
            if (!finger || finger.destroyed || !trailGraphics || trailGraphics.destroyed) return;

            animTime += app.ticker.deltaMS;
            if (animTime >= animDuration) {
                animTime = 0; // Reset animation
            }

            const progress = (animTime % animDuration) / animDuration;

            // Long press phase (first 30% of animation)
            if (progress < 0.3) {
                finger.x = startX;
                finger.y = startY;
                const pressProgress = progress / 0.3;
                drawFinger(0, 0, true);

                // Draw press indicator (expanding circle)
                if (trailGraphics && !trailGraphics.destroyed) {
                    trailGraphics.clear();
                    const pressRadius = 15 + pressProgress * 20;
                    trailGraphics.circle(startX, startY, pressRadius);
                    trailGraphics.stroke({ color: 0x4CAF50, width: 2, alpha: 0.6 - pressProgress * 0.4 });
                }
            } else {
                // Swipe phase (remaining 70% - moving in detected direction)
                const swipeProgress = (progress - 0.3) / 0.7;

                // Move in the appropriate direction
                let easeProgress;
                let currentX, currentY;

                if (swipeProgress < 0.5) {
                    // Moving to end position
                    const moveProgress = swipeProgress * 2;
                    easeProgress = moveProgress < 0.5
                        ? 2 * moveProgress * moveProgress
                        : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;

                    if (isHorizontal) {
                        currentX = startX + (endX - startX) * easeProgress;
                        currentY = startY;
                    } else {
                        currentX = startX;
                        currentY = startY + (endY - startY) * easeProgress;
                    }
                } else {
                    // Moving back to start position
                    const backProgress = (swipeProgress - 0.5) * 2;
                    easeProgress = backProgress < 0.5
                        ? 2 * backProgress * backProgress
                        : 1 - Math.pow(-2 * backProgress + 2, 2) / 2;

                    if (isHorizontal) {
                        currentX = endX - (endX - startX) * easeProgress;
                        currentY = startY;
                    } else {
                        currentX = startX;
                        currentY = endY - (endY - startY) * easeProgress;
                    }
                }

                finger.x = currentX;
                finger.y = currentY;
                drawFinger(0, 0, true); // Keep pressed while swiping

                // Draw swipe trail
                if (trailGraphics && !trailGraphics.destroyed) {
                    trailGraphics.clear();
                    const trailPoints = 20;
                    for (let i = 0; i <= trailPoints; i++) {
                        const trailProgress = Math.max(0, easeProgress - (i / trailPoints) * 0.5);
                        if (trailProgress > 0) {
                            let trailX, trailY;
                            if (swipeProgress < 0.5) {
                                if (isHorizontal) {
                                    trailX = startX + (endX - startX) * trailProgress;
                                    trailY = startY;
                                } else {
                                    trailX = startX;
                                    trailY = startY + (endY - startY) * trailProgress;
                                }
                            } else {
                                const backProgress = (swipeProgress - 0.5) * 2;
                                const backEase = backProgress < 0.5
                                    ? 2 * backProgress * backProgress
                                    : 1 - Math.pow(-2 * backProgress + 2, 2) / 2;
                                if (isHorizontal) {
                                    trailX = endX - (endX - startX) * backEase;
                                    trailY = startY;
                                } else {
                                    trailX = startX;
                                    trailY = endY - (endY - startY) * backEase;
                                }
                            }
                            trailGraphics.circle(trailX, trailY, 4 - (i * 0.15));
                            trailGraphics.fill({ color: 0xFFFFFF, alpha: 0.4 - (i * 0.02) });
                        }
                    }
                }
            }
        });

        // Calculate responsive font size based on screen size
        const baseFontSize = 24;
        const minFontSize = 14;
        const maxFontSize = 28;
        // Scale font size based on viewport width (smaller screens = smaller font)
        // Reuse viewportWidth and viewportHeight already declared above
        const minDimensionForFont = Math.min(viewportWidth, viewportHeight);
        // Scale: 320px (small phone) = minFontSize, 1920px (large screen) = maxFontSize
        const fontSize = Math.max(minFontSize, Math.min(maxFontSize, baseFontSize * (minDimensionForFont / 800)));

        // Add instruction text
        const instructionTextElement = new Text({
            text: instructionText,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: fontSize,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 2,
                dropShadowBlur: 4,
                wordWrap: true,
                wordWrapWidth: viewportWidth * 0.9, // Allow text wrapping on small screens
            }
        });
        instructionTextElement.anchor.set(0.5);
        instructionTextElement.x = app.screen.width / 2;
        instructionTextElement.y = app.screen.height * 0.85;
        container.addChild(instructionTextElement);
    }

    // Function to fade out instruction animation
    function fadeOutInstruction() {
        // Prevent multiple simultaneous fade operations
        if (isInstructionFading || !instructionContainer || !instructionContainer.parent) {
            return;
        }

        isInstructionFading = true;

        // Mark as shown in localStorage
        localStorage.setItem('prometheans_instruction_shown', 'true');

        // Remove animation ticker
        if (instructionAnimationId !== null) {
            app.ticker.remove(instructionAnimationId);
            instructionAnimationId = null;
        }

        // Remove resize listener
        if (instructionResizeHandler) {
            window.removeEventListener('resize', instructionResizeHandler);
            instructionResizeHandler = null;
        }

        const fadeSpeed = 0.05;
        const fadeInterval = setInterval(() => {
            if (!instructionContainer) {
                clearInterval(fadeInterval);
                isInstructionFading = false;
                return;
            }

            instructionAlpha -= fadeSpeed;
            if (instructionAlpha <= 0) {
                instructionAlpha = 0;
                if (instructionContainer) {
                    instructionContainer.visible = false;
                    if (instructionContainer.parent) {
                        app.stage.removeChild(instructionContainer);
                        instructionContainer.destroy({ children: true });
                    }
                    instructionContainer = null;
                }
                clearInterval(fadeInterval);
                isInstructionFading = false;
            } else {
                if (instructionContainer) {
                    instructionContainer.alpha = instructionAlpha;
                }
            }
        }, 16); // ~60fps
    }

    // Wait for Digital font before showing HTML loading screen (for redirects)
    async function preloadDigitalFont() {
        try {
            if (!document.fonts || !document.fonts.ready) {
                console.warn('Font API not available, proceeding without font check');
                return;
            }

            // Wait for fonts.ready with a reasonable timeout
            await Promise.race([
                document.fonts.ready,
                new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
            ]);

            // Helper function to check font with multiple variations
            function checkFont(fontFamily) {
                return document.fonts.check(`1em "${fontFamily}"`) || 
                       document.fonts.check(`1em ${fontFamily}`) ||
                       document.fonts.check(`12px "${fontFamily}"`) ||
                       document.fonts.check(`12px ${fontFamily}`);
            }

            // Check if Digital font is loaded
            let fontLoaded = checkFont('Digital');
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds total (20 * 100ms)

            while (!fontLoaded && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                fontLoaded = checkFont('Digital');
                attempts++;
            }

            if (fontLoaded) {
                console.log('✓ Digital font loaded successfully');
            } else {
                console.warn('⚠ Digital font not loaded, using fallback');
            }
        } catch (error) {
            console.warn('Error loading Digital font:', error);
        }
    }

    // Global function to show loading screen for redirects (HTML-based, same as community.html)
    async function showLoadingScreenForRedirect() {
        let htmlLoadingScreen = document.getElementById('redirectLoadingScreen');

        // Create loading screen if it doesn't exist
        if (!htmlLoadingScreen) {
            const loadingScreenHTML = `
                <div class="redirect-loading-screen" id="redirectLoadingScreen">
                    <div class="redirect-loading-screen-content">
                        <img src="assets/loading_screen_logo.png" alt="The Prometheans" class="redirect-loading-logo" id="redirectLoadingLogo">
                        <div class="redirect-loading-percentage" id="redirectLoadingPercentage">0</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('afterbegin', loadingScreenHTML);
            htmlLoadingScreen = document.getElementById('redirectLoadingScreen');
        }

        if (!htmlLoadingScreen) return;

        // Show loading screen IMMEDIATELY (don't wait for font preload)
        htmlLoadingScreen.classList.remove('hidden');
        htmlLoadingScreen.style.opacity = '1';

        // Reset logo glitch
        const loadingLogo = document.getElementById('redirectLoadingLogo');
        if (loadingLogo) {
            loadingLogo.classList.remove('stop-glitch');
        }

        // Initialize percentage counter immediately
        initRedirectLoadingCounter();
        
        // Preload font in background (non-blocking)
        preloadDigitalFont().catch(err => {
            console.warn('Font preload failed, continuing anyway:', err);
        });
    }

    // Initialize loading counter for redirects (same logic as community.html)
    function initRedirectLoadingCounter() {
        const loadingScreen = document.getElementById('redirectLoadingScreen');
        const loadingPercentage = document.getElementById('redirectLoadingPercentage');
        const loadingLogo = document.getElementById('redirectLoadingLogo');
        if (!loadingScreen || !loadingPercentage) return;

        let isRolling = false;
        let rollInterval = null;
        let currentRollValue = 1;
        const rollSpeed = 15; // Milliseconds between number changes
        const startTime = Date.now();
        const minLoadingTime = 1500; // Minimum 1.5 seconds (faster for redirects)
        let loadingComplete = false;
        let reached100 = false; // Track if we've reached 100%

        // Continuous rolling animation from 1% to 100%
        function startRolling() {
            if (isRolling) return;

            isRolling = true;
            currentRollValue = 1;

            if (rollInterval) {
                clearInterval(rollInterval);
            }

            if (loadingPercentage) {
                loadingPercentage.textContent = currentRollValue;
            }

            rollInterval = setInterval(() => {
                currentRollValue++;

                if (currentRollValue <= 100) {
                    if (loadingPercentage) {
                        loadingPercentage.textContent = currentRollValue;
                    }
                } else {
                    // Reached 100%
                    clearInterval(rollInterval);
                    rollInterval = null;
                    isRolling = false;
                    currentRollValue = 100;
                    reached100 = true;

                    if (loadingPercentage) {
                        loadingPercentage.textContent = 100;
                    }

                    // Stop logo glitch immediately when 100% is reached
                    if (loadingLogo) {
                        loadingLogo.classList.add('stop-glitch');
                    }

                    // Don't auto-hide, let the redirect function handle it
                    // The redirect will happen after 100% is reached
                }
            }, rollSpeed);
        }

        // Hide loading screen (called by redirect function after redirect happens)
        window.hideRedirectLoadingScreen = function() {
            if (currentRollValue < 100) {
                currentRollValue = 100;
                if (loadingPercentage) {
                    loadingPercentage.textContent = 100;
                }
                if (loadingLogo) {
                    loadingLogo.classList.add('stop-glitch');
                }
            }

            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    if (loadingScreen.parentNode) {
                        loadingScreen.parentNode.removeChild(loadingScreen);
                    }
                    if (rollInterval) {
                        clearInterval(rollInterval);
                    }
                }, 300);
            }
        };

        // Start rolling immediately
        startRolling();

        // Fallback: ensure we reach 100% even if something goes wrong
        setTimeout(() => {
            if (!reached100) {
                currentRollValue = 100;
                if (loadingPercentage) {
                    loadingPercentage.textContent = 100;
                }
                if (loadingLogo) {
                    loadingLogo.classList.add('stop-glitch');
                }
                reached100 = true;
            }
        }, 2000);
    }

    // Make function globally available for redirects
    window.showLoadingScreenForRedirect = showLoadingScreenForRedirect;

    // Function to preload URL in background
    // Function to preload URL in background silently
    async function preloadURL(url) {
        return new Promise((resolve) => {
            console.log('Starting background preload of:', url);

            // Use a hidden iframe to preload the page silently
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.position = 'absolute';
            iframe.style.visibility = 'hidden';
            iframe.src = url;

            let resolved = false;

            iframe.onload = () => {
                if (!resolved) {
                    resolved = true;
                    console.log('URL preloaded successfully via iframe');
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    }, 100);
                    resolve(true);
                }
            };

            iframe.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    console.log('URL preload error, will redirect anyway');
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    }, 100);
                    resolve(true); // Resolve anyway to not block redirect
                }
            };

            document.body.appendChild(iframe);

            // Timeout after 10 seconds - don't wait forever, but give it more time for slow sites
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                    console.log('URL preload timeout, redirecting anyway');
                    resolve(true);
                }
            }, 10000);
        });
    }

    // Function to show loading screen for mutator redirect
    async function showMutatorLoadingScreen(callback, redirectURL = 'https://prometheans.talis.art/') {
        // Show loading screen
        await showLoadingScreenForRedirect();

        // Start preloading URL in background while counting
        let urlLoaded = false;
        const preloadPromise = preloadURL(redirectURL).then(() => {
            urlLoaded = true;
            console.log('URL is ready for redirect');
        });

        // Wait for loading screen to reach 100% AND URL to be loaded before redirecting
        let hasReached100 = false;
        let redirectExecuted = false;

        const checkAndRedirect = () => {
            const loadingPercentage = document.getElementById('redirectLoadingPercentage');
            if (loadingPercentage) {
                const currentValue = parseInt(loadingPercentage.textContent) || 0;
                if (currentValue >= 100 && !hasReached100) {
                    // Reached 100% for the first time
                    hasReached100 = true;

                    // Wait for both 100% AND URL to be loaded
                    const attemptRedirect = () => {
                        if (urlLoaded && !redirectExecuted) {
                            redirectExecuted = true;

                            // Brief pause at 100% to see it before redirect (same as community.html)
                            setTimeout(() => {
                                if (callback) callback();

                                // Hide HTML loading screen immediately after opening new tab to keep animations running
                                setTimeout(() => {
                                    if (window.hideRedirectLoadingScreen) {
                                        window.hideRedirectLoadingScreen();
                                    }
                                }, 100);
                            }, 500);
                        } else if (!urlLoaded) {
                            // URL not loaded yet, check again in 100ms
                            setTimeout(attemptRedirect, 100);
                        }
                    };

                    // Start checking if URL is ready
                    attemptRedirect();
                } else if (currentValue < 100) {
                    // Not at 100% yet, check again in 30ms
                    setTimeout(checkAndRedirect, 30);
                }
            } else {
                // Fallback: if element doesn't exist, wait a bit then redirect
                if (!redirectExecuted) {
                    setTimeout(() => {
                        if (!redirectExecuted) {
                            redirectExecuted = true;
                            if (callback) callback();
                        }
                    }, 2000);
                }
            }
        };

        // Start checking after a short delay to let the counter start
        setTimeout(checkAndRedirect, 100);
    }

    // Create loading screen immediately (only if enabled)
    if (ENABLE_INTRO_LOADING_SCREEN) {
        await createLoadingScreen();
    }

    // Function to update mutator capsule text position, font size, and dot position
    function updateMutatorText() {
        if (!mutatorCapsuleSprite) return;

        // Update dot position to center of mutator capsule sprite
        if (mutatorCapsuleDot) {
            mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
            mutatorCapsuleDot.y = mutatorCapsuleSprite.y;

            // Position and show label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40; // Position label below dot
                mutatorCapsuleLabelText.visible = true; // Always visible on mobile/tablet
            } else if (mutatorCapsuleLabelText) {
                mutatorCapsuleLabelText.visible = false; // Hide on desktop
            }
        }

        // Update text position and font size
        if (!mutatorCapsuleTextSprite) return;

        // Update font size responsively
        if (mutatorCapsuleTextSprite.userData && mutatorCapsuleTextSprite.userData.getResponsiveFontSize) {
            const newFontSize = mutatorCapsuleTextSprite.userData.getResponsiveFontSize();
            mutatorCapsuleTextSprite.style.fontSize = newFontSize;
        }

        // Only update position if not animating
        if (mutatorCapsuleTextSprite.userData && !mutatorCapsuleTextSprite.userData.isAnimating) {
            // Calculate positions (X: 2666.5, Y: 1630.5 start, Y: 1600 target) - same as CCTV
            const bg1StartX = 2666.5;
            const bg1StartY = 1630.5; // Start position
            const bg1TargetY = 1600.0; // Target position (higher up - lower Y value)

            // Get current background position and scale to convert coordinates (same as CCTV)
            if (backgroundSprite) {
                const scale = currentScale || 1;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                // Convert bg1 coordinates to screen coordinates
                const normalizedStartX = bg1StartX / imageWidth;
                const normalizedStartY = bg1StartY / imageHeight;
                const normalizedTargetY = bg1TargetY / imageHeight;

                const startScreenX = bg1Left + (normalizedStartX * bg1DisplayedWidth);
                const startScreenY = bg1Top + (normalizedStartY * bg1DisplayedHeight);
                const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                // Start position (Y: 1630.5)
                mutatorCapsuleTextSprite.userData.startX = startScreenX;
                mutatorCapsuleTextSprite.userData.startY = startScreenY;

                // Target position (Y: 1600 - slides up 30.5 pixels, same as CCTV)
                mutatorCapsuleTextSprite.userData.targetX = startScreenX; // Same X position
                mutatorCapsuleTextSprite.userData.targetY = targetScreenY;

                // If text is visible but not animating, update its position directly
                if (mutatorCapsuleTextSprite.visible && !mutatorCapsuleTextSprite.userData.isAnimating) {
                    mutatorCapsuleTextSprite.x = mutatorCapsuleTextSprite.userData.targetX;
                    mutatorCapsuleTextSprite.y = mutatorCapsuleTextSprite.userData.targetY;
                }
            }
        }
    }

    // Function to update CCTV text position, font size, and dot position
    function updateCctvText() {
        if (!cctvSprite) return;

        // Update dot position to center of CCTV sprite
        if (cctvDot) {
            cctvDot.x = cctvSprite.x;
            cctvDot.y = cctvSprite.y;

            // Position and show label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && cctvLabelText) {
                cctvLabelText.x = cctvDot.x;
                cctvLabelText.y = cctvDot.y + 40; // Position label below dot
                cctvLabelText.visible = true; // Always visible on mobile/tablet
            } else if (cctvLabelText) {
                cctvLabelText.visible = false; // Hide on desktop
            }
        }

        // Update text position and font size
        if (!cctvTextSprite) return;

        // Update font size responsively
        if (cctvTextSprite.userData && cctvTextSprite.userData.getResponsiveFontSize) {
            const newFontSize = cctvTextSprite.userData.getResponsiveFontSize();
            cctvTextSprite.style.fontSize = newFontSize;
        }

        // Update stroke position and scale to match CCTV position and scale
        if (cctvStrokeSprite && cctvSprite) {
            cctvStrokeSprite.x = cctvSprite.x;
            cctvStrokeSprite.y = cctvSprite.y;
            cctvStrokeSprite.scale.set(cctvSprite.scale.x, cctvSprite.scale.y);
        }

        // Wall Art stroke sprite: position and scale to match wall art sprite
        if (wallArtStrokeSprite && wallArtSprite) {
            wallArtStrokeSprite.x = wallArtSprite.x;
            wallArtStrokeSprite.y = wallArtSprite.y;
            wallArtStrokeSprite.scale.set(wallArtSprite.scale.x, wallArtSprite.scale.y);
        }

            // Only update position if not animating
        if (cctvTextSprite.userData && !cctvTextSprite.userData.isAnimating) {
            // Calculate positions (X: 2666.5, Y: 1630.5 start, Y: 1600 target)
            const bg1StartX = 2666.5;
            const bg1StartY = 1630.5; // Start position
            const bg1TargetY = 1600.0; // Target position (higher up - lower Y value)

            // Get current background position and scale to convert coordinates
            if (backgroundSprite && cctvSprite.userData && cctvSprite.userData.config) {
                const cctvConfig = cctvSprite.userData.config;
                const scale = currentScale || 1;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                // Convert bg1 coordinates to screen coordinates
                const normalizedStartX = bg1StartX / imageWidth;
                const normalizedStartY = bg1StartY / imageHeight;
                const normalizedTargetY = bg1TargetY / imageHeight;

                const startScreenX = bg1Left + (normalizedStartX * bg1DisplayedWidth);
                const startScreenY = bg1Top + (normalizedStartY * bg1DisplayedHeight);
                const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                // Start position (Y: 1630.5)
                cctvTextSprite.userData.startX = startScreenX;
                cctvTextSprite.userData.startY = startScreenY;

                // Target position (Y: 1600 - slides up 30.5 pixels)
                cctvTextSprite.userData.targetX = startScreenX; // Same X position
                cctvTextSprite.userData.targetY = targetScreenY;
            } else {
                // Fallback: use center page position directly
                cctvTextSprite.userData.targetX = app.screen.width / 2;
                cctvTextSprite.userData.targetY = app.screen.height / 2;
                cctvTextSprite.userData.startX = cctvTextSprite.userData.targetX;
                cctvTextSprite.userData.startY = cctvTextSprite.userData.targetY + 400; // Start below, slides up
            }

            // Update sprite position if text is visible (so it moves when background is panned/resized)
            if (cctvTextSprite.visible) {
                cctvTextSprite.x = cctvTextSprite.userData.targetX;
                cctvTextSprite.y = cctvTextSprite.userData.targetY;
                cctvTextSprite.userData.currentX = cctvTextSprite.userData.targetX;
                cctvTextSprite.userData.currentY = cctvTextSprite.userData.targetY;
            }
        }
    }

    // Function to update Book text position, font size, and dot position
    function updateBookText() {
        if (!bookSprite) return;

        // Update dot position to center of book sprite
        if (bookDot) {
            bookDot.x = bookSprite.x;
            bookDot.y = bookSprite.y;

            // Position and show label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && bookLabelText) {
                bookLabelText.x = bookDot.x;
                bookLabelText.y = bookDot.y + 40; // Position label below dot
                bookLabelText.visible = true; // Always visible on mobile/tablet
            } else if (bookLabelText) {
                bookLabelText.visible = false; // Hide on desktop
            }
        }

        // Update text position and font size
        if (!bookTextSprite) return;

        // Update font size responsively
        if (bookTextSprite.userData && bookTextSprite.userData.getResponsiveFontSize) {
            const newFontSize = bookTextSprite.userData.getResponsiveFontSize();
            bookTextSprite.style.fontSize = newFontSize;
        }

        // Update stroke position and scale to match book sprite exactly
        if (bookStrokeSprite && bookSprite) {
            bookStrokeSprite.x = bookSprite.x;
            bookStrokeSprite.y = bookSprite.y;
            bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
        }

        // Only update position if not animating
        if (bookTextSprite.userData && !bookTextSprite.userData.isAnimating) {
            // Calculate positions (same fixed position as Mutator, CCTV, and Wall Art)
            const bg1TargetX = 2666.5; // Target X position (same as Mutator, CCTV, and Wall Art)
            const bg1TargetY = 1630.5; // Target Y position (same level as Mutator, CCTV, and Wall Art)

            // Get current background position and scale to convert coordinates
            if (backgroundSprite && bookSprite.userData && bookSprite.userData.config) {
                const bookConfig = bookSprite.userData.config;
                const scale = currentScale || 1;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                // Convert bg1 coordinates to screen coordinates
                const normalizedTargetX = bg1TargetX / imageWidth;
                const normalizedTargetY = bg1TargetY / imageHeight;

                const targetScreenX = bg1Left + (normalizedTargetX * bg1DisplayedWidth);
                const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                // Target position
                bookTextSprite.userData.targetX = targetScreenX;
                bookTextSprite.userData.targetY = targetScreenY;

                // Start position (text starts from bottom, slides up)
                const cardEjectionDistance = 300;
                bookTextSprite.userData.startX = targetScreenX; // Same X position
                bookTextSprite.userData.startY = targetScreenY + cardEjectionDistance; // Start below, slides up
            } else {
                // Fallback: use center page position directly
                bookTextSprite.userData.targetX = app.screen.width / 2;
                bookTextSprite.userData.targetY = app.screen.height / 2;
                const cardEjectionDistance = 300;
                bookTextSprite.userData.startX = bookTextSprite.userData.targetX;
                bookTextSprite.userData.startY = bookTextSprite.userData.targetY + cardEjectionDistance; // Start from bottom
            }

            // Update sprite position if text is visible (so it moves when background is panned/resized)
            if (bookTextSprite.visible) {
                bookTextSprite.x = bookTextSprite.userData.targetX;
                bookTextSprite.y = bookTextSprite.userData.targetY;
                bookTextSprite.userData.currentX = bookTextSprite.userData.targetX;
                bookTextSprite.userData.currentY = bookTextSprite.userData.targetY;
            }
        }
    }

    // Function to resize background - Adaptive scaling based on window size
    // This function ensures all sprites (including Discord and Promo) stay fixed like glitch sprite
    function resizeBackground() {
        if (!backgroundSprite) return;

        // Ensure Discord and Promo are initialized before positioning (same as glitch)
        // This prevents issues if resizeBackground is called before sprites are fully loaded

        // Use actual window dimensions (not canvas dimensions affected by devicePixelRatio)
        // ALWAYS use fresh dimensions to ensure correct positioning on fullscreen
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // CRITICAL: Ensure we're using the most up-to-date dimensions
        // This is especially important for fullscreen changes

        // Use stored image dimensions (already set when loading background textures)
        // For AnimatedSprite, all frames should have the same dimensions, so we use the stored values
        if (backgroundSprite && backgroundSprite.textures && backgroundSprite.textures[0]) {
            const firstTexture = backgroundSprite.textures[0];
            imageWidth = firstTexture.width || imageWidth;
            imageHeight = firstTexture.height || imageHeight;
        } else if (backgroundSprite && backgroundSprite.texture && backgroundSprite.texture.width > 0) {
            // Fallback: use current texture dimensions
            imageWidth = backgroundSprite.texture.width;
            imageHeight = backgroundSprite.texture.height;
        }

        // Calculate scale to COVER entire screen (fill screen, no black bars)
        // This ensures the image always fills the viewport edge-to-edge
        const scaleX = screenWidth / imageWidth;
        const scaleY = screenHeight / imageHeight;
        let scale = Math.max(scaleX, scaleY); // Use max to cover (fill entire screen, no black spaces)

        // At exactly 1920x1080, ensure scale is 1.0 (100% - natural size)
        if (screenWidth === imageWidth && screenHeight === imageHeight) {
            scale = 1.0;
        }

        // Update sprite scale
        backgroundSprite.scale.set(scale);
        currentScale = scale;

        // Calculate displayed dimensions after scaling (for positioning)
        const displayedWidth = imageWidth * scale;
        const displayedHeight = imageHeight * scale;

        // Mutator background sprite: use custom scale and position from config
        if (mutatorBgSprite && mutatorBgSprite.texture) {
            // Check if mutator has custom config
            if (mutatorBgSprite.userData && mutatorBgSprite.userData.config) {
                const mutatorConfig = mutatorBgSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The mutator scale should be relative to bg1's scale
                if (mutatorConfig.scale !== null && mutatorConfig.scale !== undefined) {
                    // Multiply by bg1's scale so mutator scales with bg1
                    const mutatorScale = mutatorConfig.scale * scale;
                    mutatorBgSprite.scale.set(mutatorScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const mutatorWidth = mutatorBgSprite.texture.orig?.width || mutatorBgSprite.texture.width || mutatorBgSprite.texture.baseTexture.width || 1920;
                    const mutatorHeight = mutatorBgSprite.texture.orig?.height || mutatorBgSprite.texture.height || mutatorBgSprite.texture.baseTexture.height || 1080;

                    if (mutatorWidth === imageWidth && mutatorHeight === imageHeight) {
                        mutatorBgSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const mutatorScaleX = bg1DisplayedWidth / mutatorWidth;
                        const mutatorScaleY = bg1DisplayedHeight / mutatorHeight;

                        const mutatorScale = Math.max(mutatorScaleX, mutatorScaleY);

                        mutatorBgSprite.scale.set(mutatorScale);
                    }
                }
            } else {

                const mutatorWidth = mutatorBgSprite.texture.orig?.width || mutatorBgSprite.texture.width || mutatorBgSprite.texture.baseTexture.width || 1920;
                const mutatorHeight = mutatorBgSprite.texture.orig?.height || mutatorBgSprite.texture.height || mutatorBgSprite.texture.baseTexture.height || 1080;

                if (mutatorWidth === imageWidth && mutatorHeight === imageHeight) {
                    mutatorBgSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const mutatorScaleX = bg1DisplayedWidth / mutatorWidth;
                    const mutatorScaleY = bg1DisplayedHeight / mutatorHeight;

                    const mutatorScale = Math.max(mutatorScaleX, mutatorScaleY);

                    mutatorBgSprite.scale.set(mutatorScale);
                }
            }
        }

        // Mutator capsule sprite: use custom scale and position from config - same technique as cup
        if (mutatorCapsuleSprite && mutatorCapsuleSprite.texture) {
            // Check if capsule has custom config
            if (mutatorCapsuleSprite.userData && mutatorCapsuleSprite.userData.config) {
                const capsuleConfig = mutatorCapsuleSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale - same technique as cup
                // The capsule scale should be relative to bg1's scale
                // Example: if capsuleConfig.scale = 0.4 and bg1 scale = 2.0, then capsule scale = 0.4 * 2.0 = 0.8
                if (capsuleConfig.scale !== null && capsuleConfig.scale !== undefined) {
                    // Multiply by bg1's scale so capsule scales with bg1
                    const capsuleScale = capsuleConfig.scale * scale;
                    mutatorCapsuleSprite.scale.set(capsuleScale);

                    // Scale stroke overlay to match capsule
                    if (mutatorCapsuleStrokeSprite) {
                        mutatorCapsuleStrokeSprite.scale.set(capsuleScale);
                    }
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const capsuleWidth = mutatorCapsuleSprite.texture.orig?.width || mutatorCapsuleSprite.texture.width || mutatorCapsuleSprite.texture.baseTexture.width || 1920;
                    const capsuleHeight = mutatorCapsuleSprite.texture.orig?.height || mutatorCapsuleSprite.texture.height || mutatorCapsuleSprite.texture.baseTexture.height || 1080;

                    if (capsuleWidth === imageWidth && capsuleHeight === imageHeight) {
                        mutatorCapsuleSprite.scale.set(scale);
                        // Scale stroke overlay to match capsule
                        if (mutatorCapsuleStrokeSprite) {
                            mutatorCapsuleStrokeSprite.scale.set(scale);
                        }
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const capsuleScaleX = bg1DisplayedWidth / capsuleWidth;
                        const capsuleScaleY = bg1DisplayedHeight / capsuleHeight;

                        const capsuleScale = Math.max(capsuleScaleX, capsuleScaleY);

                        mutatorCapsuleSprite.scale.set(capsuleScale);
                        // Scale stroke overlay to match capsule
                        if (mutatorCapsuleStrokeSprite) {
                            mutatorCapsuleStrokeSprite.scale.set(capsuleScale);
                        }
                    }
                }
            } else {
                // Default: scale to match bg1's displayed size exactly
                const capsuleWidth = mutatorCapsuleSprite.texture.orig?.width || mutatorCapsuleSprite.texture.width || mutatorCapsuleSprite.texture.baseTexture.width || 1920;
                const capsuleHeight = mutatorCapsuleSprite.texture.orig?.height || mutatorCapsuleSprite.texture.height || mutatorCapsuleSprite.texture.baseTexture.height || 1080;

                if (capsuleWidth === imageWidth && capsuleHeight === imageHeight) {
                    mutatorCapsuleSprite.scale.set(scale);
                    // Scale stroke overlay to match capsule
                    if (mutatorCapsuleStrokeSprite) {
                        mutatorCapsuleStrokeSprite.scale.set(scale);
                    }
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const capsuleScaleX = bg1DisplayedWidth / capsuleWidth;
                    const capsuleScaleY = bg1DisplayedHeight / capsuleHeight;

                    const capsuleScale = Math.max(capsuleScaleX, capsuleScaleY);

                    mutatorCapsuleSprite.scale.set(capsuleScale);
                    // Scale stroke overlay to match capsule
                    if (mutatorCapsuleStrokeSprite) {
                        mutatorCapsuleStrokeSprite.scale.set(capsuleScale);
                    }
                }
            }
        }

        // Cup sprite: use custom scale and position from config
        if (cupSprite && cupSprite.texture) {
            // Check if cup has custom config
            if (cupSprite.userData && cupSprite.userData.config) {
                const cupConfig = cupSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The cup scale should be relative to bg1's scale
                // Example: if cupConfig.scale = 0.4 and bg1 scale = 2.0, then cup scale = 0.4 * 2.0 = 0.8
                if (cupConfig.scale !== null && cupConfig.scale !== undefined) {
                    // Multiply by bg1's scale so cup scales with bg1
                    const cupScale = cupConfig.scale * scale;
                    cupSprite.scale.set(cupScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const cupWidth = cupSprite.texture.orig?.width || cupSprite.texture.width || cupSprite.texture.baseTexture.width || 1920;
                    const cupHeight = cupSprite.texture.orig?.height || cupSprite.texture.height || cupSprite.texture.baseTexture.height || 1080;

                    if (cupWidth === imageWidth && cupHeight === imageHeight) {
                        cupSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const cupScaleX = bg1DisplayedWidth / cupWidth;
                        const cupScaleY = bg1DisplayedHeight / cupHeight;

                        const cupScale = Math.max(cupScaleX, cupScaleY);
                        cupSprite.scale.set(cupScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const cupWidth = cupSprite.texture.orig?.width || cupSprite.texture.width || cupSprite.texture.baseTexture.width || 1920;
                const cupHeight = cupSprite.texture.orig?.height || cupSprite.texture.height || cupSprite.texture.baseTexture.height || 1080;

                if (cupWidth === imageWidth && cupHeight === imageHeight) {
                    cupSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const cupScaleX = bg1DisplayedWidth / cupWidth;
                    const cupScaleY = bg1DisplayedHeight / cupHeight;

                    const cupScale = Math.max(cupScaleX, cupScaleY);
                    cupSprite.scale.set(cupScale);
                }
            }
        }

        // Glitch sprite: use custom scale and position from config - same technique as cup
        if (glitchSprite && glitchSprite.texture) {
            // Check if glitch has custom config
            if (glitchSprite.userData && glitchSprite.userData.config) {
                const glitchConfig = glitchSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The glitch scale should be relative to bg1's scale
                if (glitchConfig.scale !== null && glitchConfig.scale !== undefined) {
                    // Multiply by bg1's scale so glitch scales with bg1
                    const glitchScale = glitchConfig.scale * scale;
                    glitchSprite.scale.set(glitchScale);
                    // Store base scale for hover effects
                    if (glitchSprite.userData) {
                        glitchSprite.userData.baseScale = glitchScale;
                    }
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const glitchWidth = glitchSprite.texture.orig?.width || glitchSprite.texture.width || glitchSprite.texture.baseTexture.width || 1920;
                    const glitchHeight = glitchSprite.texture.orig?.height || glitchSprite.texture.height || glitchSprite.texture.baseTexture.height || 1080;

                    if (glitchWidth === imageWidth && glitchHeight === imageHeight) {
                        glitchSprite.scale.set(scale);
                        // Store base scale for hover effects
                        if (glitchSprite.userData) {
                            glitchSprite.userData.baseScale = scale;
                        }
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const glitchScaleX = bg1DisplayedWidth / glitchWidth;
                        const glitchScaleY = bg1DisplayedHeight / glitchHeight;

                        const glitchScale = Math.max(glitchScaleX, glitchScaleY);
                        glitchSprite.scale.set(glitchScale);
                        // Store base scale for hover effects
                        if (glitchSprite.userData) {
                            glitchSprite.userData.baseScale = glitchScale;
                        }
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const glitchWidth = glitchSprite.texture.orig?.width || glitchSprite.texture.width || glitchSprite.texture.baseTexture.width || 1920;
                const glitchHeight = glitchSprite.texture.orig?.height || glitchSprite.texture.height || glitchSprite.texture.baseTexture.height || 1080;

                if (glitchWidth === imageWidth && glitchHeight === imageHeight) {
                    glitchSprite.scale.set(scale);
                    // Store base scale for hover effects
                    if (glitchSprite.userData) {
                        glitchSprite.userData.baseScale = scale;
                    }
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const glitchScaleX = bg1DisplayedWidth / glitchWidth;
                    const glitchScaleY = bg1DisplayedHeight / glitchHeight;

                    const glitchScale = Math.max(glitchScaleX, glitchScaleY);
                    glitchSprite.scale.set(glitchScale);
                    // Store base scale for hover effects
                    if (glitchSprite.userData) {
                        glitchSprite.userData.baseScale = glitchScale;
                    }
                }
            }
        }

        // Eye logo sprite: use custom scale and position from config - same technique as cup
        if (eyeLogoSprite && eyeLogoSprite.texture) {
            // Check if eye has custom config
            if (eyeLogoSprite.userData && eyeLogoSprite.userData.config) {
                const eyeConfig = eyeLogoSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The eye scale should be relative to bg1's scale
                if (eyeConfig.scale !== null && eyeConfig.scale !== undefined) {
                    // Multiply by bg1's scale so eye scales with bg1
                    const eyeScale = eyeConfig.scale * scale;
                    eyeLogoSprite.scale.set(eyeScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const eyeWidth = eyeLogoSprite.texture.orig?.width || eyeLogoSprite.texture.width || eyeLogoSprite.texture.baseTexture.width || 1920;
                    const eyeHeight = eyeLogoSprite.texture.orig?.height || eyeLogoSprite.texture.height || eyeLogoSprite.texture.baseTexture.height || 1080;

                    if (eyeWidth === imageWidth && eyeHeight === imageHeight) {
                        eyeLogoSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const eyeScaleX = bg1DisplayedWidth / eyeWidth;
                        const eyeScaleY = bg1DisplayedHeight / eyeHeight;

                        const eyeScale = Math.max(eyeScaleX, eyeScaleY);
                        eyeLogoSprite.scale.set(eyeScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const eyeWidth = eyeLogoSprite.texture.orig?.width || eyeLogoSprite.texture.width || eyeLogoSprite.texture.baseTexture.width || 1920;
                const eyeHeight = eyeLogoSprite.texture.orig?.height || eyeLogoSprite.texture.height || eyeLogoSprite.texture.baseTexture.height || 1080;

                if (eyeWidth === imageWidth && eyeHeight === imageHeight) {
                    eyeLogoSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const eyeScaleX = bg1DisplayedWidth / eyeWidth;
                    const eyeScaleY = bg1DisplayedHeight / eyeHeight;

                    const eyeScale = Math.max(eyeScaleX, eyeScaleY);
                    eyeLogoSprite.scale.set(eyeScale);
                }
            }
        }

        // Discord sprite: use custom scale and position from config - same technique as CCTV
        if (discordSprite && discordSprite.texture) {
            // Check if Discord has custom config
            if (discordSprite.userData && discordSprite.userData.config) {
                const discordConfig = discordSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                if (discordConfig.scale !== null && discordConfig.scale !== undefined) {
                    // Multiply by bg1's scale so Discord scales with bg1
                    const discordScale = discordConfig.scale * scale;
                    discordSprite.scale.set(discordScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const discordWidth = discordSprite.texture.orig?.width || discordSprite.texture.width || discordSprite.texture.baseTexture.width || 246;
                    const discordHeight = discordSprite.texture.orig?.height || discordSprite.texture.height || discordSprite.texture.baseTexture.height || 158;

                    if (discordWidth === imageWidth && discordHeight === imageHeight) {
                        discordSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const discordScaleX = bg1DisplayedWidth / discordWidth;
                        const discordScaleY = bg1DisplayedHeight / discordHeight;

                        const discordScale = Math.max(discordScaleX, discordScaleY);
                        discordSprite.scale.set(discordScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const discordWidth = discordSprite.texture.orig?.width || discordSprite.texture.width || discordSprite.texture.baseTexture.width || 246;
                const discordHeight = discordSprite.texture.orig?.height || discordSprite.texture.height || discordSprite.texture.baseTexture.height || 158;

                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const discordScaleX = bg1DisplayedWidth / discordWidth;
                const discordScaleY = bg1DisplayedHeight / discordHeight;

                const discordScale = Math.max(discordScaleX, discordScaleY);
                discordSprite.scale.set(discordScale);
            }
        }

        // Promo sprite: use custom scale and position from config - same technique as Discord and CCTV
        if (promoSprite && promoSprite.texture) {
            // Check if Promo has custom config
            if (promoSprite.userData && promoSprite.userData.config) {
                const promoConfig = promoSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                if (promoConfig.scale !== null && promoConfig.scale !== undefined) {
                    // Multiply by bg1's scale so Promo scales with bg1
                    const promoScale = promoConfig.scale * scale;
                    promoSprite.scale.set(promoScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const promoWidth = promoSprite.texture.orig?.width || promoSprite.texture.width || promoSprite.texture.baseTexture.width || 223;
                    const promoHeight = promoSprite.texture.orig?.height || promoSprite.texture.height || promoSprite.texture.baseTexture.height || 178;

                    if (promoWidth === imageWidth && promoHeight === imageHeight) {
                        promoSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const promoScaleX = bg1DisplayedWidth / promoWidth;
                        const promoScaleY = bg1DisplayedHeight / promoHeight;

                        const promoScale = Math.max(promoScaleX, promoScaleY);
                        promoSprite.scale.set(promoScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const promoWidth = promoSprite.texture.orig?.width || promoSprite.texture.width || promoSprite.texture.baseTexture.width || 223;
                const promoHeight = promoSprite.texture.orig?.height || promoSprite.texture.height || promoSprite.texture.baseTexture.height || 178;

                if (promoWidth === imageWidth && promoHeight === imageHeight) {
                    promoSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const promoScaleX = bg1DisplayedWidth / promoWidth;
                    const promoScaleY = bg1DisplayedHeight / promoHeight;

                    const promoScale = Math.max(promoScaleX, promoScaleY);
                    promoSprite.scale.set(promoScale);
                }
            }
        }

        // Telegram sprite: use custom scale and position from config - same technique as Discord and Promo
        if (telegramSprite && telegramSprite.texture) {
            // Check if Telegram has custom config
            if (telegramSprite.userData && telegramSprite.userData.config) {
                const telegramConfig = telegramSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                if (telegramConfig.scale !== null && telegramConfig.scale !== undefined) {
                    // Multiply by bg1's scale so Telegram scales with bg1
                    const telegramScale = telegramConfig.scale * scale;
                    telegramSprite.scale.set(telegramScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const telegramWidth = telegramSprite.texture.orig?.width || telegramSprite.texture.width || telegramSprite.texture.baseTexture.width || 300;
                    const telegramHeight = telegramSprite.texture.orig?.height || telegramSprite.texture.height || telegramSprite.texture.baseTexture.height || 244;

                    if (telegramWidth === imageWidth && telegramHeight === imageHeight) {
                        telegramSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const telegramScaleX = bg1DisplayedWidth / telegramWidth;
                        const telegramScaleY = bg1DisplayedHeight / telegramHeight;

                        const telegramScale = Math.max(telegramScaleX, telegramScaleY);
                        telegramSprite.scale.set(telegramScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const telegramWidth = telegramSprite.texture.orig?.width || telegramSprite.texture.width || telegramSprite.texture.baseTexture.width || 300;
                const telegramHeight = telegramSprite.texture.orig?.height || telegramSprite.texture.height || telegramSprite.texture.baseTexture.height || 244;

                if (telegramWidth === imageWidth && telegramHeight === imageHeight) {
                    telegramSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const telegramScaleX = bg1DisplayedWidth / telegramWidth;
                    const telegramScaleY = bg1DisplayedHeight / telegramHeight;

                    const telegramScale = Math.max(telegramScaleX, telegramScaleY);
                    telegramSprite.scale.set(telegramScale);
                }
            }
        }

        // Lights off sprite: use custom scale and position from config - same technique as cup
        if (lightsOffSprite && lightsOffSprite.texture) {
            // Check if lights off has custom config
            if (lightsOffSprite.userData && lightsOffSprite.userData.config) {
                const lightsOffConfig = lightsOffSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The lights off scale should be relative to bg1's scale
                if (lightsOffConfig.scale !== null && lightsOffConfig.scale !== undefined) {
                    // Multiply by bg1's scale so lights off scales with bg1
                    const lightsOffScale = lightsOffConfig.scale * scale;
                    lightsOffSprite.scale.set(lightsOffScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const lightsOffWidth = lightsOffSprite.texture.orig?.width || lightsOffSprite.texture.width || lightsOffSprite.texture.baseTexture.width || 672;
                    const lightsOffHeight = lightsOffSprite.texture.orig?.height || lightsOffSprite.texture.height || lightsOffSprite.texture.baseTexture.height || 1087;

                    if (lightsOffWidth === imageWidth && lightsOffHeight === imageHeight) {
                        lightsOffSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const lightsOffScaleX = bg1DisplayedWidth / lightsOffWidth;
                        const lightsOffScaleY = bg1DisplayedHeight / lightsOffHeight;

                        const lightsOffScale = Math.max(lightsOffScaleX, lightsOffScaleY);
                        lightsOffSprite.scale.set(lightsOffScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const lightsOffWidth = lightsOffSprite.texture.orig?.width || lightsOffSprite.texture.width || lightsOffSprite.texture.baseTexture.width || 672;
                const lightsOffHeight = lightsOffSprite.texture.orig?.height || lightsOffSprite.texture.height || lightsOffSprite.texture.baseTexture.height || 1087;

                if (lightsOffWidth === imageWidth && lightsOffHeight === imageHeight) {
                    lightsOffSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const lightsOffScaleX = bg1DisplayedWidth / lightsOffWidth;
                    const lightsOffScaleY = bg1DisplayedHeight / lightsOffHeight;

                    const lightsOffScale = Math.max(lightsOffScaleX, lightsOffScaleY);
                    lightsOffSprite.scale.set(lightsOffScale);
                }
            }
        }

        // Lights ray sprite: use custom scale and position from config - same technique as CCTV
        if (lightsRaySprite && lightsRaySprite.texture) {
            // Check if lights ray has custom config
            if (lightsRaySprite.userData && lightsRaySprite.userData.config) {
                const lightsRayConfig = lightsRaySprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The lights ray scale should be relative to bg1's scale
                if (lightsRayConfig.scale !== null && lightsRayConfig.scale !== undefined) {
                    // Multiply by bg1's scale so lights ray scales with bg1
                    const lightsRayScale = lightsRayConfig.scale * scale;
                    lightsRaySprite.scale.set(lightsRayScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const lightsRayWidth = lightsRaySprite.texture.orig?.width || lightsRaySprite.texture.width || lightsRaySprite.texture.baseTexture.width || 1920;
                    const lightsRayHeight = lightsRaySprite.texture.orig?.height || lightsRaySprite.texture.height || lightsRaySprite.texture.baseTexture.height || 1080;

                    if (lightsRayWidth === imageWidth && lightsRayHeight === imageHeight) {
                        lightsRaySprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const lightsRayScaleX = bg1DisplayedWidth / lightsRayWidth;
                        const lightsRayScaleY = bg1DisplayedHeight / lightsRayHeight;

                        const lightsRayScale = Math.max(lightsRayScaleX, lightsRayScaleY);
                        lightsRaySprite.scale.set(lightsRayScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const lightsRayWidth = lightsRaySprite.texture.orig?.width || lightsRaySprite.texture.width || lightsRaySprite.texture.baseTexture.width || 1920;
                const lightsRayHeight = lightsRaySprite.texture.orig?.height || lightsRaySprite.texture.height || lightsRaySprite.texture.baseTexture.height || 1080;

                if (lightsRayWidth === imageWidth && lightsRayHeight === imageHeight) {
                    lightsRaySprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const lightsRayScaleX = bg1DisplayedWidth / lightsRayWidth;
                    const lightsRayScaleY = bg1DisplayedHeight / lightsRayHeight;

                    const lightsRayScale = Math.max(lightsRayScaleX, lightsRayScaleY);
                    lightsRaySprite.scale.set(lightsRayScale);
                }
            }
        }

        // Lights switch sprite: use custom scale and position from config - same technique as lights_off
        if (lightsSwitchSprite && lightsSwitchSprite.texture) {
            // Check if lights switch has custom config
            if (lightsSwitchSprite.userData && lightsSwitchSprite.userData.config) {
                const lightsSwitchConfig = lightsSwitchSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The lights switch scale should be relative to bg1's scale
                if (lightsSwitchConfig.scale !== null && lightsSwitchConfig.scale !== undefined) {
                    // Multiply by bg1's scale so lights switch scales with bg1
                    const lightsSwitchScale = lightsSwitchConfig.scale * scale;
                    lightsSwitchSprite.scale.set(lightsSwitchScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const lightsSwitchWidth = lightsSwitchSprite.texture.orig?.width || lightsSwitchSprite.texture.width || lightsSwitchSprite.texture.baseTexture.width || 109;
                    const lightsSwitchHeight = lightsSwitchSprite.texture.orig?.height || lightsSwitchSprite.texture.height || lightsSwitchSprite.texture.baseTexture.height || 843;

                    if (lightsSwitchWidth === imageWidth && lightsSwitchHeight === imageHeight) {
                        lightsSwitchSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const lightsSwitchScaleX = bg1DisplayedWidth / lightsSwitchWidth;
                        const lightsSwitchScaleY = bg1DisplayedHeight / lightsSwitchHeight;

                        const lightsSwitchScale = Math.max(lightsSwitchScaleX, lightsSwitchScaleY);
                        lightsSwitchSprite.scale.set(lightsSwitchScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const lightsSwitchWidth = lightsSwitchSprite.texture.orig?.width || lightsSwitchSprite.texture.width || lightsSwitchSprite.texture.baseTexture.width || 109;
                const lightsSwitchHeight = lightsSwitchSprite.texture.orig?.height || lightsSwitchSprite.texture.height || lightsSwitchSprite.texture.baseTexture.height || 843;

                if (lightsSwitchWidth === imageWidth && lightsSwitchHeight === imageHeight) {
                    lightsSwitchSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const lightsSwitchScaleX = bg1DisplayedWidth / lightsSwitchWidth;
                    const lightsSwitchScaleY = bg1DisplayedHeight / lightsSwitchHeight;

                    const lightsSwitchScale = Math.max(lightsSwitchScaleX, lightsSwitchScaleY);
                    lightsSwitchSprite.scale.set(lightsSwitchScale);
                }
            }
        }

        // CCTV sprite: use custom scale and position from config - same technique as cup
        if (cctvSprite && cctvSprite.texture) {
            // Check if CCTV has custom config
            if (cctvSprite.userData && cctvSprite.userData.config) {
                const cctvConfig = cctvSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The CCTV scale should be relative to bg1's scale
                if (cctvConfig.scale !== null && cctvConfig.scale !== undefined) {
                    // Multiply by bg1's scale so CCTV scales with bg1
                    const cctvScale = cctvConfig.scale * scale;
                    cctvSprite.scale.set(cctvScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const cctvWidth = cctvSprite.texture.orig?.width || cctvSprite.texture.width || cctvSprite.texture.baseTexture.width || 1920;
                    const cctvHeight = cctvSprite.texture.orig?.height || cctvSprite.texture.height || cctvSprite.texture.baseTexture.height || 1080;

                    if (cctvWidth === imageWidth && cctvHeight === imageHeight) {
                        cctvSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const cctvScaleX = bg1DisplayedWidth / cctvWidth;
                        const cctvScaleY = bg1DisplayedHeight / cctvHeight;

                        const cctvScale = Math.max(cctvScaleX, cctvScaleY);
                        cctvSprite.scale.set(cctvScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const cctvWidth = cctvSprite.texture.orig?.width || cctvSprite.texture.width || cctvSprite.texture.baseTexture.width || 1920;
                const cctvHeight = cctvSprite.texture.orig?.height || cctvSprite.texture.height || cctvSprite.texture.baseTexture.height || 1080;

                if (cctvWidth === imageWidth && cctvHeight === imageHeight) {
                    cctvSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const cctvScaleX = bg1DisplayedWidth / cctvWidth;
                    const cctvScaleY = bg1DisplayedHeight / cctvHeight;

                    const cctvScale = Math.max(cctvScaleX, cctvScaleY);
                    cctvSprite.scale.set(cctvScale);
                }
            }
        }

        // Wall Art sprite: use custom scale and position from config - same technique as CCTV
        if (wallArtSprite && wallArtSprite.texture) {
            // Check if Wall Art has custom config
            if (wallArtSprite.userData && wallArtSprite.userData.config) {
                const wallArtConfig = wallArtSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                if (wallArtConfig.scale !== null && wallArtConfig.scale !== undefined) {
                    // Multiply by bg1's scale so wall art scales with bg1
                    const wallArtScale = wallArtConfig.scale * scale;
                    wallArtSprite.scale.set(wallArtScale);
                    // Also scale stroke sprite
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.scale.set(wallArtScale);
                    }
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const wallArtWidth = wallArtSprite.texture.orig?.width || wallArtSprite.texture.width || wallArtSprite.texture.baseTexture.width || 1920;
                    const wallArtHeight = wallArtSprite.texture.orig?.height || wallArtSprite.texture.height || wallArtSprite.texture.baseTexture.height || 1080;

                    if (wallArtWidth === imageWidth && wallArtHeight === imageHeight) {
                        wallArtSprite.scale.set(scale);
                        if (wallArtStrokeSprite) {
                            wallArtStrokeSprite.scale.set(scale);
                        }
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const wallArtScaleX = bg1DisplayedWidth / wallArtWidth;
                        const wallArtScaleY = bg1DisplayedHeight / wallArtHeight;

                        const wallArtScale = Math.max(wallArtScaleX, wallArtScaleY);
                        wallArtSprite.scale.set(wallArtScale);
                        if (wallArtStrokeSprite) {
                            wallArtStrokeSprite.scale.set(wallArtScale);
                        }
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const wallArtWidth = wallArtSprite.texture.orig?.width || wallArtSprite.texture.width || wallArtSprite.texture.baseTexture.width || 1920;
                const wallArtHeight = wallArtSprite.texture.orig?.height || wallArtSprite.texture.height || wallArtSprite.texture.baseTexture.height || 1080;

                if (wallArtWidth === imageWidth && wallArtHeight === imageHeight) {
                    wallArtSprite.scale.set(scale);
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.scale.set(scale);
                    }
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const wallArtScaleX = bg1DisplayedWidth / wallArtWidth;
                    const wallArtScaleY = bg1DisplayedHeight / wallArtHeight;

                    const wallArtScale = Math.max(wallArtScaleX, wallArtScaleY);
                    wallArtSprite.scale.set(wallArtScale);
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.scale.set(wallArtScale);
                    }
                }
            }
        }

        // Blaised sprite: use custom scale and position from config - same technique as CCTV
        if (blaisedSprite && blaisedSprite.texture) {
            // Check if Blaised has custom config
            if (blaisedSprite.userData && blaisedSprite.userData.config) {
                const blaisedConfig = blaisedSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The Blaised scale should be relative to bg1's scale
                if (blaisedConfig.scale !== null && blaisedConfig.scale !== undefined) {
                    // Multiply by bg1's scale so Blaised scales with bg1
                    const blaisedScale = blaisedConfig.scale * scale;
                    blaisedSprite.scale.set(blaisedScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const blaisedWidth = blaisedSprite.texture.orig?.width || blaisedSprite.texture.width || blaisedSprite.texture.baseTexture.width || 1920;
                    const blaisedHeight = blaisedSprite.texture.orig?.height || blaisedSprite.texture.height || blaisedSprite.texture.baseTexture.height || 1080;

                    if (blaisedWidth === imageWidth && blaisedHeight === imageHeight) {
                        blaisedSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const blaisedScaleX = bg1DisplayedWidth / blaisedWidth;
                        const blaisedScaleY = bg1DisplayedHeight / blaisedHeight;

                        const blaisedScale = Math.max(blaisedScaleX, blaisedScaleY);
                        blaisedSprite.scale.set(blaisedScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const blaisedWidth = blaisedSprite.texture.orig?.width || blaisedSprite.texture.width || blaisedSprite.texture.baseTexture.width || 1920;
                const blaisedHeight = blaisedSprite.texture.orig?.height || blaisedSprite.texture.height || blaisedSprite.texture.baseTexture.height || 1080;

                if (blaisedWidth === imageWidth && blaisedHeight === imageHeight) {
                    blaisedSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const blaisedScaleX = bg1DisplayedWidth / blaisedWidth;
                    const blaisedScaleY = bg1DisplayedHeight / blaisedHeight;

                    const blaisedScale = Math.max(blaisedScaleX, blaisedScaleY);
                    blaisedSprite.scale.set(blaisedScale);
                }
            }
        }

        // Blaised Aura sprite: use custom scale and position from config - same technique as Blaised
        if (blaisedAuraSprite && blaisedAuraSprite.texture) {
            // Check if Blaised Aura has custom config
            if (blaisedAuraSprite.userData && blaisedAuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAuraSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The Blaised Aura scale should be relative to bg1's scale
                if (blaisedAuraConfig.scale !== null && blaisedAuraConfig.scale !== undefined) {
                    // Multiply by bg1's scale so Blaised Aura scales with bg1
                    const blaisedAuraScale = blaisedAuraConfig.scale * scale;
                    blaisedAuraSprite.scale.set(blaisedAuraScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const blaisedAuraWidth = blaisedAuraSprite.texture.orig?.width || blaisedAuraSprite.texture.width || blaisedAuraSprite.texture.baseTexture.width || 1920;
                    const blaisedAuraHeight = blaisedAuraSprite.texture.orig?.height || blaisedAuraSprite.texture.height || blaisedAuraSprite.texture.baseTexture.height || 1080;

                    if (blaisedAuraWidth === imageWidth && blaisedAuraHeight === imageHeight) {
                        blaisedAuraSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const blaisedAuraScaleX = bg1DisplayedWidth / blaisedAuraWidth;
                        const blaisedAuraScaleY = bg1DisplayedHeight / blaisedAuraHeight;

                        const blaisedAuraScale = Math.max(blaisedAuraScaleX, blaisedAuraScaleY);
                        blaisedAuraSprite.scale.set(blaisedAuraScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const blaisedAuraWidth = blaisedAuraSprite.texture.orig?.width || blaisedAuraSprite.texture.width || blaisedAuraSprite.texture.baseTexture.width || 1920;
                const blaisedAuraHeight = blaisedAuraSprite.texture.orig?.height || blaisedAuraSprite.texture.height || blaisedAuraSprite.texture.baseTexture.height || 1080;

                if (blaisedAuraWidth === imageWidth && blaisedAuraHeight === imageHeight) {
                    blaisedAuraSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const blaisedAuraScaleX = bg1DisplayedWidth / blaisedAuraWidth;
                    const blaisedAuraScaleY = bg1DisplayedHeight / blaisedAuraHeight;

                    const blaisedAuraScale = Math.max(blaisedAuraScaleX, blaisedAuraScaleY);
                    blaisedAuraSprite.scale.set(blaisedAuraScale);
                }
            }
        }

        // Blaised Action2 sprite: use same scale as blaised sprite
        if (blaisedAction2Sprite && blaisedAction2Sprite.texture && blaisedSprite) {
            blaisedAction2Sprite.scale.set(blaisedSprite.scale.x, blaisedSprite.scale.y);
        }

        // Blaised Action2 Aura sprite: use same scale as blaised aura sprite
        if (blaisedAction2AuraSprite && blaisedAction2AuraSprite.texture && blaisedAuraSprite) {
            blaisedAction2AuraSprite.scale.set(blaisedAuraSprite.scale.x, blaisedAuraSprite.scale.y);
        }

        // Blaised Action3 sprite: use custom scale and position from config (different position from default)
        if (blaisedAction3Sprite && blaisedAction3Sprite.texture) {
            // Check if Blaised Action3 has custom config
            if (blaisedAction3Sprite.userData && blaisedAction3Sprite.userData.config) {
                const blaisedAction3Config = blaisedAction3Sprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The Blaised Action3 scale should be relative to bg1's scale
                if (blaisedAction3Config.scale !== null && blaisedAction3Config.scale !== undefined) {
                    // Multiply by bg1's scale so Blaised Action3 scales with bg1
                    const blaisedAction3Scale = blaisedAction3Config.scale * scale;
                    blaisedAction3Sprite.scale.set(blaisedAction3Scale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const blaisedAction3Width = blaisedAction3Sprite.texture.orig?.width || blaisedAction3Sprite.texture.width || blaisedAction3Sprite.texture.baseTexture.width || 1920;
                    const blaisedAction3Height = blaisedAction3Sprite.texture.orig?.height || blaisedAction3Sprite.texture.height || blaisedAction3Sprite.texture.baseTexture.height || 1080;

                    if (blaisedAction3Width === imageWidth && blaisedAction3Height === imageHeight) {
                        blaisedAction3Sprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const blaisedAction3ScaleX = bg1DisplayedWidth / blaisedAction3Width;
                        const blaisedAction3ScaleY = bg1DisplayedHeight / blaisedAction3Height;

                        const blaisedAction3Scale = Math.max(blaisedAction3ScaleX, blaisedAction3ScaleY);
                        blaisedAction3Sprite.scale.set(blaisedAction3Scale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const blaisedAction3Width = blaisedAction3Sprite.texture.orig?.width || blaisedAction3Sprite.texture.width || blaisedAction3Sprite.texture.baseTexture.width || 1920;
                const blaisedAction3Height = blaisedAction3Sprite.texture.orig?.height || blaisedAction3Sprite.texture.height || blaisedAction3Sprite.texture.baseTexture.height || 1080;

                if (blaisedAction3Width === imageWidth && blaisedAction3Height === imageHeight) {
                    blaisedAction3Sprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const blaisedAction3ScaleX = bg1DisplayedWidth / blaisedAction3Width;
                    const blaisedAction3ScaleY = bg1DisplayedHeight / blaisedAction3Height;

                    const blaisedAction3Scale = Math.max(blaisedAction3ScaleX, blaisedAction3ScaleY);
                    blaisedAction3Sprite.scale.set(blaisedAction3Scale);
                }
            }
        }

        // Blaised Action3 Aura sprite: use custom scale and position from config (same position as action3)
        if (blaisedAction3AuraSprite && blaisedAction3AuraSprite.texture) {
            // Check if Blaised Action3 Aura has custom config
            if (blaisedAction3AuraSprite.userData && blaisedAction3AuraSprite.userData.config) {
                const blaisedAction3AuraConfig = blaisedAction3AuraSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The Blaised Action3 Aura scale should be relative to bg1's scale
                if (blaisedAction3AuraConfig.scale !== null && blaisedAction3AuraConfig.scale !== undefined) {
                    // Multiply by bg1's scale so Blaised Action3 Aura scales with bg1
                    const blaisedAction3AuraScale = blaisedAction3AuraConfig.scale * scale;
                    blaisedAction3AuraSprite.scale.set(blaisedAction3AuraScale);
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const blaisedAction3AuraWidth = blaisedAction3AuraSprite.texture.orig?.width || blaisedAction3AuraSprite.texture.width || blaisedAction3AuraSprite.texture.baseTexture.width || 1920;
                    const blaisedAction3AuraHeight = blaisedAction3AuraSprite.texture.orig?.height || blaisedAction3AuraSprite.texture.height || blaisedAction3AuraSprite.texture.baseTexture.height || 1080;

                    if (blaisedAction3AuraWidth === imageWidth && blaisedAction3AuraHeight === imageHeight) {
                        blaisedAction3AuraSprite.scale.set(scale);
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const blaisedAction3AuraScaleX = bg1DisplayedWidth / blaisedAction3AuraWidth;
                        const blaisedAction3AuraScaleY = bg1DisplayedHeight / blaisedAction3AuraHeight;

                        const blaisedAction3AuraScale = Math.max(blaisedAction3AuraScaleX, blaisedAction3AuraScaleY);
                        blaisedAction3AuraSprite.scale.set(blaisedAction3AuraScale);
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const blaisedAction3AuraWidth = blaisedAction3AuraSprite.texture.orig?.width || blaisedAction3AuraSprite.texture.width || blaisedAction3AuraSprite.texture.baseTexture.width || 1920;
                const blaisedAction3AuraHeight = blaisedAction3AuraSprite.texture.orig?.height || blaisedAction3AuraSprite.texture.height || blaisedAction3AuraSprite.texture.baseTexture.height || 1080;

                if (blaisedAction3AuraWidth === imageWidth && blaisedAction3AuraHeight === imageHeight) {
                    blaisedAction3AuraSprite.scale.set(scale);
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const blaisedAction3AuraScaleX = bg1DisplayedWidth / blaisedAction3AuraWidth;
                    const blaisedAction3AuraScaleY = bg1DisplayedHeight / blaisedAction3AuraHeight;

                    const blaisedAction3AuraScale = Math.max(blaisedAction3AuraScaleX, blaisedAction3AuraScaleY);
                    blaisedAction3AuraSprite.scale.set(blaisedAction3AuraScale);
                }
            }
        }

        // Book sprite: use custom scale and position from config - same technique as CCTV
        if (bookSprite && bookSprite.texture) {
            // Check if book has custom config
            if (bookSprite.userData && bookSprite.userData.config) {
                const bookConfig = bookSprite.userData.config;

                // Use custom scale if specified, otherwise use bg1 scale
                // The book scale should be relative to bg1's scale
                if (bookConfig.scale !== null && bookConfig.scale !== undefined) {
                    // Multiply by bg1's scale so book scales with bg1
                    const bookScale = bookConfig.scale * scale;
                    bookSprite.scale.set(bookScale);
                    // Scale stroke sprite to match book sprite exactly
                    if (bookStrokeSprite) {
                        bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
                    }
                } else {
                    // Auto-scale to match bg1 (original behavior)
                    const bookWidth = bookSprite.texture.orig?.width || bookSprite.texture.width || bookSprite.texture.baseTexture.width || 1920;
                    const bookHeight = bookSprite.texture.orig?.height || bookSprite.texture.height || bookSprite.texture.baseTexture.height || 1080;

                    if (bookWidth === imageWidth && bookHeight === imageHeight) {
                        bookSprite.scale.set(scale);
                        // Scale stroke sprite to match book sprite exactly
                        if (bookStrokeSprite) {
                            bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
                        }
                    } else {
                        const bg1DisplayedWidth = imageWidth * scale;
                        const bg1DisplayedHeight = imageHeight * scale;

                        const bookScaleX = bg1DisplayedWidth / bookWidth;
                        const bookScaleY = bg1DisplayedHeight / bookHeight;

                        const bookScale = Math.max(bookScaleX, bookScaleY);
                        bookSprite.scale.set(bookScale);
                        // Scale stroke sprite to match book sprite exactly
                        if (bookStrokeSprite) {
                            bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
                        }
                    }
                }
            } else {
                // Default behavior: scale to match bg1
                const bookWidth = bookSprite.texture.orig?.width || bookSprite.texture.width || bookSprite.texture.baseTexture.width || 1920;
                const bookHeight = bookSprite.texture.orig?.height || bookSprite.texture.height || bookSprite.texture.baseTexture.height || 1080;

                if (bookWidth === imageWidth && bookHeight === imageHeight) {
                    bookSprite.scale.set(scale);
                    // Scale stroke sprite to match book sprite exactly
                    if (bookStrokeSprite) {
                        bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
                    }
                } else {
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;

                    const bookScaleX = bg1DisplayedWidth / bookWidth;
                    const bookScaleY = bg1DisplayedHeight / bookHeight;

                    const bookScale = Math.max(bookScaleX, bookScaleY);
                    bookSprite.scale.set(bookScale);
                    // Scale stroke sprite to match book sprite exactly
                    if (bookStrokeSprite) {
                        bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
                    }
                }
            }
        }

        // Only reposition the sprite if not dragging (preserve position during drag)
        // IMPORTANT: Always recenter background on resize to ensure sprites stay fixed
        // This ensures Discord, Promo, and all sprites maintain correct positions
        if (!isDragging) {
            // For cover mode: center the image so it always fills the screen
            // This ensures no black spaces appear - the image will extend beyond viewport edges
            // but will always fill the visible area completely

            // Center horizontally - image will always fill width or extend beyond
            backgroundSprite.x = screenWidth / 2;

            // Center vertically - image will always fill height or extend beyond
            // This ensures no black spaces at top or bottom
            backgroundSprite.y = screenHeight / 2;

            // CRITICAL: Background is now recentered. All sprites (including Discord and Promo)
            // will be positioned relative to this centered background, ensuring they stay fixed
            // like glitch sprite across all screen sizes and fullscreen changes

            // Mutator background sprite: position using config (bg1.png coordinates)
            if (mutatorBgSprite && mutatorBgSprite.userData && mutatorBgSprite.userData.config) {
                const mutatorConfig = mutatorBgSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = mutatorConfig.bg1X / imageWidth;
                const normalizedY = mutatorConfig.bg1Y / imageHeight;

                mutatorBgSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + mutatorConfig.offsetX;
                mutatorBgSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + mutatorConfig.offsetY;
            } else if (mutatorBgSprite) {
                // Default: same position as bg1
                mutatorBgSprite.x = backgroundSprite.x;
                mutatorBgSprite.y = backgroundSprite.y;
            }

            // Mutator capsule sprite: position using config (bg1.png coordinates) - same technique as cup
            if (mutatorCapsuleSprite && mutatorCapsuleSprite.userData && mutatorCapsuleSprite.userData.config) {
                const capsuleConfig = mutatorCapsuleSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates - same technique as cup
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                // Convert bg1.png coordinates (0-imageWidth, 0-imageHeight) to world coordinates
                const normalizedX = capsuleConfig.bg1X / imageWidth; // 0-1
                const normalizedY = capsuleConfig.bg1Y / imageHeight; // 0-1

                mutatorCapsuleSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + capsuleConfig.offsetX;
                mutatorCapsuleSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + capsuleConfig.offsetY;

                // Position stroke overlay to match capsule
                if (mutatorCapsuleStrokeSprite) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                // Position dot and circle text at center of capsule
                if (mutatorCapsuleDot) {
                    mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40;
                }
                // Position circle text: on desktop, only when hidden
                if (mutatorCapsuleCircleText && !mutatorCapsuleCircleText.visible) {
                    // On desktop: only position when hidden (when visible, it follows cursor)
                    mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;
                }
            } else if (mutatorCapsuleSprite) {
                // Default: same position as bg1
                mutatorCapsuleSprite.x = backgroundSprite.x;
                mutatorCapsuleSprite.y = backgroundSprite.y;

                // Position stroke overlay to match capsule
                if (mutatorCapsuleStrokeSprite) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                // Position dot and circle text at center of capsule
                if (mutatorCapsuleDot) {
                    mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40;
                }
                // Position circle text: on desktop, only when hidden
                if (mutatorCapsuleCircleText && !mutatorCapsuleCircleText.visible) {
                    // On desktop: only position when hidden (when visible, it follows cursor)
                    mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;
                }
            }

            // Cup sprite: position using config (bg1.png coordinates)
            if (cupSprite && cupSprite.userData && cupSprite.userData.config) {
                const cupConfig = cupSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                // bg1.png is centered at backgroundSprite.x, backgroundSprite.y
                // bg1.png's displayed size = imageWidth * scale x imageHeight * scale
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                // Calculate position relative to bg1's top-left corner
                // bg1X: 0 = left edge, imageWidth = right edge of bg1.png
                // bg1Y: 0 = top edge, imageHeight = bottom edge of bg1.png
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                // Convert bg1.png coordinates (0-imageWidth, 0-imageHeight) to world coordinates
                const normalizedX = cupConfig.bg1X / imageWidth; // 0-1
                const normalizedY = cupConfig.bg1Y / imageHeight; // 0-1

                cupSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cupConfig.offsetX;
                cupSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cupConfig.offsetY;

                // Always update base position for animation (even if animating)
                // This ensures cup stays in correct position when background moves during animation
                if (cupSprite.userData) {
                    cupSprite.userData.originalX = cupSprite.x;
                    cupSprite.userData.originalY = cupSprite.y;
                }
            } else if (cupSprite) {
                // Default: same position as bg1
                cupSprite.x = backgroundSprite.x;
                cupSprite.y = backgroundSprite.y;

                // Always update base position for animation (even if animating)
                // This ensures cup stays in correct position when background moves during animation
                if (cupSprite.userData) {
                    cupSprite.userData.originalX = cupSprite.x;
                    cupSprite.userData.originalY = cupSprite.y;
                }
            }

            // Glitch sprite: position using config (bg1.png coordinates) - same technique as cup
            if (glitchSprite && glitchSprite.userData && glitchSprite.userData.config) {
                const glitchConfig = glitchSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = glitchConfig.bg1X / imageWidth;
                const normalizedY = glitchConfig.bg1Y / imageHeight;

                glitchSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + glitchConfig.offsetX;
                glitchSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + glitchConfig.offsetY;
            } else if (glitchSprite) {
                // Default: same position as bg1
                glitchSprite.x = backgroundSprite.x;
                glitchSprite.y = backgroundSprite.y;
            }

            // Discord sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (discordSprite && discordSprite.userData && discordSprite.userData.config) {
                const discordConfig = discordSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = discordConfig.bg1X / imageWidth;
                const normalizedY = discordConfig.bg1Y / imageHeight;

                discordSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + discordConfig.offsetX;
                discordSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + discordConfig.offsetY;
            } else if (discordSprite) {
                // Default: same position as bg1
                discordSprite.x = backgroundSprite.x;
                discordSprite.y = backgroundSprite.y;
            }

            // Promo sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (promoSprite && promoSprite.userData && promoSprite.userData.config) {
                const promoConfig = promoSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = promoConfig.bg1X / imageWidth;
                const normalizedY = promoConfig.bg1Y / imageHeight;

                promoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + promoConfig.offsetX;
                promoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + promoConfig.offsetY;
            } else if (promoSprite) {
                // Default: same position as bg1
                promoSprite.x = backgroundSprite.x;
                promoSprite.y = backgroundSprite.y;
            }

            // Telegram sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (telegramSprite && telegramSprite.userData && telegramSprite.userData.config) {
                const telegramConfig = telegramSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = telegramConfig.bg1X / imageWidth;
                const normalizedY = telegramConfig.bg1Y / imageHeight;

                telegramSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + telegramConfig.offsetX;
                telegramSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + telegramConfig.offsetY;
            } else if (telegramSprite) {
                // Default: same position as bg1
                telegramSprite.x = backgroundSprite.x;
                telegramSprite.y = backgroundSprite.y;
            }

            // Blaised sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (blaisedSprite && blaisedSprite.userData && blaisedSprite.userData.config) {
                const blaisedConfig = blaisedSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;

                blaisedSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedSprite) {
                // Default: same position as bg1
                blaisedSprite.x = backgroundSprite.x;
                blaisedSprite.y = backgroundSprite.y;
            }

            // Blaised Aura sprite: position using config (bg1.png coordinates) - same as blaised sprite
            if (blaisedAuraSprite && blaisedAuraSprite.userData && blaisedAuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAuraSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;

                blaisedAuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAuraSprite) {
                // Default: same position as bg1
                blaisedAuraSprite.x = backgroundSprite.x;
                blaisedAuraSprite.y = backgroundSprite.y;
            }

            // Blaised Action2 sprite: position using config (same as blaised sprite)
            if (blaisedAction2Sprite && blaisedAction2Sprite.userData && blaisedAction2Sprite.userData.config) {
                const blaisedConfig = blaisedAction2Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction2Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction2Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedAction2Sprite) {
                blaisedAction2Sprite.x = backgroundSprite.x;
                blaisedAction2Sprite.y = backgroundSprite.y;
            }

            // Blaised Action2 Aura sprite: position using config (same as blaised aura sprite)
            if (blaisedAction2AuraSprite && blaisedAction2AuraSprite.userData && blaisedAction2AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction2AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction2AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction2AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAction2AuraSprite) {
                blaisedAction2AuraSprite.x = backgroundSprite.x;
                blaisedAction2AuraSprite.y = backgroundSprite.y;
            }

            // Blaised Action3 sprite: position using config (different position from default blaised sprite)
            if (blaisedAction3Sprite && blaisedAction3Sprite.userData && blaisedAction3Sprite.userData.config) {
                const blaisedConfig = blaisedAction3Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction3Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction3Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedAction3Sprite) {
                blaisedAction3Sprite.x = backgroundSprite.x;
                blaisedAction3Sprite.y = backgroundSprite.y;
            }

            // Blaised Action3 Aura sprite: position using config (same position as action3 sprite)
            if (blaisedAction3AuraSprite && blaisedAction3AuraSprite.userData && blaisedAction3AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction3AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction3AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction3AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAction3AuraSprite) {
                blaisedAction3AuraSprite.x = backgroundSprite.x;
                blaisedAction3AuraSprite.y = backgroundSprite.y;
            }

            // Blaised Action2 sprite: position using config (same as blaised sprite)
            if (blaisedAction2Sprite && blaisedAction2Sprite.userData && blaisedAction2Sprite.userData.config) {
                const blaisedConfig = blaisedAction2Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction2Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction2Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedAction2Sprite) {
                blaisedAction2Sprite.x = backgroundSprite.x;
                blaisedAction2Sprite.y = backgroundSprite.y;
            }

            // Blaised Action2 Aura sprite: position using config (same as blaised aura sprite)
            if (blaisedAction2AuraSprite && blaisedAction2AuraSprite.userData && blaisedAction2AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction2AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction2AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction2AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAction2AuraSprite) {
                blaisedAction2AuraSprite.x = backgroundSprite.x;
                blaisedAction2AuraSprite.y = backgroundSprite.y;
            }

            // Blaised Action3 sprite: position using config (different position from default blaised sprite)
            if (blaisedAction3Sprite && blaisedAction3Sprite.userData && blaisedAction3Sprite.userData.config) {
                const blaisedConfig = blaisedAction3Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction3Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction3Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedAction3Sprite) {
                blaisedAction3Sprite.x = backgroundSprite.x;
                blaisedAction3Sprite.y = backgroundSprite.y;
            }

            // Blaised Action3 Aura sprite: position using config (same position as action3 sprite)
            if (blaisedAction3AuraSprite && blaisedAction3AuraSprite.userData && blaisedAction3AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction3AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction3AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction3AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAction3AuraSprite) {
                blaisedAction3AuraSprite.x = backgroundSprite.x;
                blaisedAction3AuraSprite.y = backgroundSprite.y;
            }

            // Lights off sprite: position using config (bg1.png coordinates) - same technique as glitch
            // Note: Anchor is at (0.5, 0) so sprite swings from top. Position is based on center coordinates.
            if (lightsOffSprite && lightsOffSprite.userData && lightsOffSprite.userData.config) {
                const lightsOffConfig = lightsOffSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = lightsOffConfig.bg1X / imageWidth;
                const normalizedY = lightsOffConfig.bg1Y / imageHeight;

                // Calculate center position
                const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsOffConfig.offsetX;
                const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsOffConfig.offsetY;

                // Since anchor is at (0.5, 0), we need to adjust Y to position the top at the correct location
                // The config bg1Y is the center Y, but we want the top to be at the correct position
                // Get the sprite's scaled height
                const lightsOffHeight = lightsOffSprite.texture?.orig?.height || lightsOffSprite.texture?.height || 1087;
                const scaledHeight = lightsOffHeight * lightsOffSprite.scale.y;

                // Position so that the top (anchor at 0.5, 0) aligns with the top of the designated area
                // Top Y in bg1 coordinates is 0, center Y is 543, so top should be at centerY - scaledHeight/2
                lightsOffSprite.x = centerX;
                lightsOffSprite.y = centerY - scaledHeight / 2;
            } else if (lightsOffSprite) {
                // Default: same position as bg1
                lightsOffSprite.x = backgroundSprite.x;
                lightsOffSprite.y = backgroundSprite.y;
            }

            // Lights switch sprite: position using config (bg1.png coordinates) - same technique as lights_off
            // Note: Anchor is at (0.5, 0) so sprite swings from top. Position is based on center coordinates.
            if (lightsSwitchSprite && lightsSwitchSprite.userData && lightsSwitchSprite.userData.config) {
                const lightsSwitchConfig = lightsSwitchSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = lightsSwitchConfig.bg1X / imageWidth;
                const normalizedY = lightsSwitchConfig.bg1Y / imageHeight;

                // Calculate center position
                const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsSwitchConfig.offsetX;
                const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsSwitchConfig.offsetY;

                // Since anchor is at (0.5, 0), we need to adjust Y to position the top at the correct location
                // The config bg1Y is the center Y, but we want the top to be at the correct position
                // Get the sprite's scaled height
                const lightsSwitchHeight = lightsSwitchSprite.texture?.orig?.height || lightsSwitchSprite.texture?.height || 843;
                const scaledHeight = lightsSwitchHeight * lightsSwitchSprite.scale.y;

                // Position so that the top (anchor at 0.5, 0) aligns with the top of the designated area
                lightsSwitchSprite.x = centerX;
                lightsSwitchSprite.y = centerY - scaledHeight / 2;
            } else if (lightsSwitchSprite) {
                // Default: same position as bg1
                lightsSwitchSprite.x = backgroundSprite.x;
                lightsSwitchSprite.y = backgroundSprite.y;
            }

            // Lights ray sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (lightsRaySprite && lightsRaySprite.userData && lightsRaySprite.userData.config) {
                const lightsRayConfig = lightsRaySprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = lightsRayConfig.bg1X / imageWidth;
                const normalizedY = lightsRayConfig.bg1Y / imageHeight;

                lightsRaySprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsRayConfig.offsetX;
                lightsRaySprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsRayConfig.offsetY;
            } else if (lightsRaySprite) {
                // Default: same position as bg1
                lightsRaySprite.x = backgroundSprite.x;
                lightsRaySprite.y = backgroundSprite.y;
            }

            // Eye logo sprite: position using config (bg1.png coordinates) - same technique as cup
            if (eyeLogoSprite && eyeLogoSprite.userData && eyeLogoSprite.userData.config) {
                const eyeConfig = eyeLogoSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = eyeConfig.bg1X / imageWidth;
                const normalizedY = eyeConfig.bg1Y / imageHeight;

                eyeLogoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + eyeConfig.offsetX;
                eyeLogoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + eyeConfig.offsetY;
            } else if (eyeLogoSprite) {
                // Default: same position as bg1
                eyeLogoSprite.x = backgroundSprite.x;
                eyeLogoSprite.y = backgroundSprite.y;
            }

            // CCTV sprite: position using config (bg1.png coordinates) - same technique as cup
            if (cctvSprite && cctvSprite.userData && cctvSprite.userData.config) {
                const cctvConfig = cctvSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = cctvConfig.bg1X / imageWidth;
                const normalizedY = cctvConfig.bg1Y / imageHeight;

                cctvSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cctvConfig.offsetX;
                cctvSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cctvConfig.offsetY;
            } else if (cctvSprite) {
                // Default: same position as bg1
                cctvSprite.x = backgroundSprite.x;
                cctvSprite.y = backgroundSprite.y;
            }

            // Wall Art sprite: position using config (bg1.png coordinates) - same technique as CCTV
            if (wallArtSprite && wallArtSprite.userData && wallArtSprite.userData.config) {
                const wallArtConfig = wallArtSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = wallArtConfig.bg1X / imageWidth;
                const normalizedY = wallArtConfig.bg1Y / imageHeight;

                wallArtSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + wallArtConfig.offsetX;
                wallArtSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + wallArtConfig.offsetY;

                // Position dot at center of wall art
                if (wallArtDot) {
                    wallArtDot.x = wallArtSprite.x;
                    wallArtDot.y = wallArtSprite.y;
                }
            // Position label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && wallArtLabelText && wallArtDot) {
                wallArtLabelText.x = wallArtDot.x;
                wallArtLabelText.y = wallArtDot.y + 40;
                wallArtLabelText.visible = true; // Make sure it's visible on mobile/tablet
                // Ensure text is on top by bringing it to front
                app.stage.removeChild(wallArtLabelText);
                app.stage.addChild(wallArtLabelText);
            } else if (wallArtLabelText) {
                wallArtLabelText.visible = false; // Hide on desktop
            }
            } else if (wallArtSprite) {
                // Default: same position as bg1
                wallArtSprite.x = backgroundSprite.x;
                wallArtSprite.y = backgroundSprite.y;

                // Position dot at center of wall art
                if (wallArtDot) {
                    wallArtDot.x = wallArtSprite.x;
                    wallArtDot.y = wallArtSprite.y;
                }
            // Position label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && wallArtLabelText && wallArtDot) {
                wallArtLabelText.x = wallArtDot.x;
                wallArtLabelText.y = wallArtDot.y + 40;
                wallArtLabelText.visible = true; // Make sure it's visible on mobile/tablet
                // Ensure text is on top by bringing it to front
                app.stage.removeChild(wallArtLabelText);
                app.stage.addChild(wallArtLabelText);
            } else if (wallArtLabelText) {
                wallArtLabelText.visible = false; // Hide on desktop
            }
            }

            // Book sprite: position using config (bg1.png coordinates) - same technique as CCTV
            if (bookSprite && bookSprite.userData && bookSprite.userData.config) {
                const bookConfig = bookSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = bookConfig.bg1X / imageWidth;
                const normalizedY = bookConfig.bg1Y / imageHeight;

                bookSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + bookConfig.offsetX;
                bookSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + bookConfig.offsetY;

                // Position stroke overlay to match book sprite exactly
                if (bookStrokeSprite) {
                    bookStrokeSprite.x = bookSprite.x;
                    bookStrokeSprite.y = bookSprite.y;
                }

                // Position dot at center of book
                if (bookDot) {
                    bookDot.x = bookSprite.x;
                    bookDot.y = bookSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && bookLabelText && bookDot) {
                    bookLabelText.x = bookDot.x;
                    bookLabelText.y = bookDot.y + 40;
                    bookLabelText.visible = true; // Make sure it's visible on mobile/tablet
                    // Ensure text is on top by bringing it to front
                    app.stage.removeChild(bookLabelText);
                    app.stage.addChild(bookLabelText);
                } else if (bookLabelText) {
                    bookLabelText.visible = false; // Hide on desktop
                }
            } else if (bookSprite) {
                // Default: same position as bg1 - book sprite always moves with background
                bookSprite.x = backgroundSprite.x;
                bookSprite.y = backgroundSprite.y;

                // Position stroke overlay to match book sprite exactly
                if (bookStrokeSprite) {
                    bookStrokeSprite.x = bookSprite.x;
                    bookStrokeSprite.y = bookSprite.y;
                }
            }

            // Update mutator capsule text position and font size
            updateMutatorText();

            // Update CCTV text position and font size
            updateCctvText();

            // Update Book text position and font size
            updateBookText();

        } else {
            // When dragging, mutator and cup follow background position (using config if available)
            if (mutatorBgSprite && mutatorBgSprite.userData && mutatorBgSprite.userData.config) {
                const mutatorConfig = mutatorBgSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = mutatorConfig.bg1X / imageWidth;
                const normalizedY = mutatorConfig.bg1Y / imageHeight;

                mutatorBgSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + mutatorConfig.offsetX;
                mutatorBgSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + mutatorConfig.offsetY;
            } else if (mutatorBgSprite) {
                mutatorBgSprite.x = backgroundSprite.x;
                mutatorBgSprite.y = backgroundSprite.y;
            }

            if (mutatorCapsuleSprite && mutatorCapsuleSprite.userData && mutatorCapsuleSprite.userData.config) {
                const capsuleConfig = mutatorCapsuleSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = capsuleConfig.bg1X / imageWidth;
                const normalizedY = capsuleConfig.bg1Y / imageHeight;

                mutatorCapsuleSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + capsuleConfig.offsetX;
                mutatorCapsuleSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + capsuleConfig.offsetY;

                // Position stroke overlay to match capsule
                if (mutatorCapsuleStrokeSprite) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                // Position dot and circle text at center of capsule
                if (mutatorCapsuleDot) {
                    mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40;
                }
                // Position circle text: on desktop, only when hidden
                if (mutatorCapsuleCircleText && !mutatorCapsuleCircleText.visible) {
                    // On desktop: only position when hidden (when visible, it follows cursor)
                    mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;
                }
            } else if (mutatorCapsuleSprite) {
                mutatorCapsuleSprite.x = backgroundSprite.x;
                mutatorCapsuleSprite.y = backgroundSprite.y;

                // Position stroke overlay to match capsule
                if (mutatorCapsuleStrokeSprite) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                // Position dot and circle text at center of capsule
                if (mutatorCapsuleDot) {
                    mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40;
                }
                // Position circle text: on desktop, only when hidden
                if (mutatorCapsuleCircleText && !mutatorCapsuleCircleText.visible) {
                    // On desktop: only position when hidden (when visible, it follows cursor)
                    mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;
                }
            }
            // Cup sprite: position using config during drag (same logic)
            if (cupSprite && cupSprite.userData && cupSprite.userData.config) {
                const cupConfig = cupSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = cupConfig.bg1X / imageWidth;
                const normalizedY = cupConfig.bg1Y / imageHeight;

                cupSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cupConfig.offsetX;
                cupSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cupConfig.offsetY;

                // Always update base position for animation (even if animating)
                // This ensures cup stays in correct position when background moves during animation
                if (cupSprite.userData) {
                    cupSprite.userData.originalX = cupSprite.x;
                    cupSprite.userData.originalY = cupSprite.y;
                }
            } else if (cupSprite) {
                cupSprite.x = backgroundSprite.x;
                // Adjust Y position to account for anchor being at bottom instead of center
                const yAdjust = cupSprite.userData?.yOffsetAdjustment || 0;
                cupSprite.y = backgroundSprite.y + yAdjust;

                // Always update base position for animation (even if animating)
                // This ensures cup stays in correct position when background moves during animation
                if (cupSprite.userData) {
                    cupSprite.userData.originalX = cupSprite.x;
                    cupSprite.userData.originalY = cupSprite.y;
                }
            }

            // Glitch sprite: position using config (bg1.png coordinates) - same technique as cup
            if (glitchSprite && glitchSprite.userData && glitchSprite.userData.config) {
                const glitchConfig = glitchSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = glitchConfig.bg1X / imageWidth;
                const normalizedY = glitchConfig.bg1Y / imageHeight;

                glitchSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + glitchConfig.offsetX;
                glitchSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + glitchConfig.offsetY;
            } else if (glitchSprite) {
                // Default: same position as bg1
                glitchSprite.x = backgroundSprite.x;
                glitchSprite.y = backgroundSprite.y;
            }

            // Discord sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (discordSprite && discordSprite.userData && discordSprite.userData.config) {
                const discordConfig = discordSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = discordConfig.bg1X / imageWidth;
                const normalizedY = discordConfig.bg1Y / imageHeight;

                discordSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + discordConfig.offsetX;
                discordSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + discordConfig.offsetY;
            } else if (discordSprite) {
                // Default: same position as bg1
                discordSprite.x = backgroundSprite.x;
                discordSprite.y = backgroundSprite.y;
            }

            // Promo sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (promoSprite && promoSprite.userData && promoSprite.userData.config) {
                const promoConfig = promoSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = promoConfig.bg1X / imageWidth;
                const normalizedY = promoConfig.bg1Y / imageHeight;

                promoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + promoConfig.offsetX;
                promoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + promoConfig.offsetY;
            } else if (promoSprite) {
                // Default: same position as bg1
                promoSprite.x = backgroundSprite.x;
                promoSprite.y = backgroundSprite.y;
            }

            // Telegram sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (telegramSprite && telegramSprite.userData && telegramSprite.userData.config) {
                const telegramConfig = telegramSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = telegramConfig.bg1X / imageWidth;
                const normalizedY = telegramConfig.bg1Y / imageHeight;

                telegramSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + telegramConfig.offsetX;
                telegramSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + telegramConfig.offsetY;
            } else if (telegramSprite) {
                // Default: same position as bg1
                telegramSprite.x = backgroundSprite.x;
                telegramSprite.y = backgroundSprite.y;
            }

            // Blaised sprite: position using config (bg1.png coordinates) - same technique as glitch
            if (blaisedSprite && blaisedSprite.userData && blaisedSprite.userData.config) {
                const blaisedConfig = blaisedSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;

                blaisedSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedSprite) {
                // Default: same position as bg1
                blaisedSprite.x = backgroundSprite.x;
                blaisedSprite.y = backgroundSprite.y;
            }

            // Blaised Aura sprite: position using config (bg1.png coordinates) - same as blaised sprite
            if (blaisedAuraSprite && blaisedAuraSprite.userData && blaisedAuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAuraSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;

                blaisedAuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAuraSprite) {
                // Default: same position as bg1
                blaisedAuraSprite.x = backgroundSprite.x;
                blaisedAuraSprite.y = backgroundSprite.y;
            }

            // Blaised Action2 sprite: position using config (same as blaised sprite)
            if (blaisedAction2Sprite && blaisedAction2Sprite.userData && blaisedAction2Sprite.userData.config) {
                const blaisedConfig = blaisedAction2Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction2Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction2Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedAction2Sprite) {
                blaisedAction2Sprite.x = backgroundSprite.x;
                blaisedAction2Sprite.y = backgroundSprite.y;
            }

            // Blaised Action2 Aura sprite: position using config (same as blaised aura sprite)
            if (blaisedAction2AuraSprite && blaisedAction2AuraSprite.userData && blaisedAction2AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction2AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction2AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction2AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAction2AuraSprite) {
                blaisedAction2AuraSprite.x = backgroundSprite.x;
                blaisedAction2AuraSprite.y = backgroundSprite.y;
            }

            // Blaised Action3 sprite: position using config (different position from default blaised sprite)
            if (blaisedAction3Sprite && blaisedAction3Sprite.userData && blaisedAction3Sprite.userData.config) {
                const blaisedConfig = blaisedAction3Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction3Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction3Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
            } else if (blaisedAction3Sprite) {
                blaisedAction3Sprite.x = backgroundSprite.x;
                blaisedAction3Sprite.y = backgroundSprite.y;
            }

            // Blaised Action3 Aura sprite: position using config (same position as action3 sprite)
            if (blaisedAction3AuraSprite && blaisedAction3AuraSprite.userData && blaisedAction3AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction3AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;
                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction3AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction3AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
            } else if (blaisedAction3AuraSprite) {
                blaisedAction3AuraSprite.x = backgroundSprite.x;
                blaisedAction3AuraSprite.y = backgroundSprite.y;
            }

            // Lights off sprite: position using config during drag (same logic)
            if (lightsOffSprite && lightsOffSprite.userData && lightsOffSprite.userData.config) {
                const lightsOffConfig = lightsOffSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = lightsOffConfig.bg1X / imageWidth;
                const normalizedY = lightsOffConfig.bg1Y / imageHeight;

                // Calculate center position
                const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsOffConfig.offsetX;
                const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsOffConfig.offsetY;

                // Since anchor is at (0.5, 0), adjust Y to position the top correctly
                const lightsOffHeight = lightsOffSprite.texture?.orig?.height || lightsOffSprite.texture?.height || 1087;
                const scaledHeight = lightsOffHeight * lightsOffSprite.scale.y;

                lightsOffSprite.x = centerX;
                lightsOffSprite.y = centerY - scaledHeight / 2;
            } else if (lightsOffSprite) {
                lightsOffSprite.x = backgroundSprite.x;
                lightsOffSprite.y = backgroundSprite.y;
            }

            // Lights switch sprite: position using config during drag (same logic)
            if (lightsSwitchSprite && lightsSwitchSprite.userData && lightsSwitchSprite.userData.config) {
                const lightsSwitchConfig = lightsSwitchSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = lightsSwitchConfig.bg1X / imageWidth;
                const normalizedY = lightsSwitchConfig.bg1Y / imageHeight;

                // Calculate center position
                const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsSwitchConfig.offsetX;
                const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsSwitchConfig.offsetY;

                // Since anchor is at (0.5, 0), adjust Y to position the top correctly
                const lightsSwitchHeight = lightsSwitchSprite.texture?.orig?.height || lightsSwitchSprite.texture?.height || 843;
                const scaledHeight = lightsSwitchHeight * lightsSwitchSprite.scale.y;

                lightsSwitchSprite.x = centerX;
                lightsSwitchSprite.y = centerY - scaledHeight / 2;
            } else if (lightsSwitchSprite) {
                lightsSwitchSprite.x = backgroundSprite.x;
                lightsSwitchSprite.y = backgroundSprite.y;
            }

            // Lights ray sprite: position using config during drag (same logic)
            if (lightsRaySprite && lightsRaySprite.userData && lightsRaySprite.userData.config) {
                const lightsRayConfig = lightsRaySprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = lightsRayConfig.bg1X / imageWidth;
                const normalizedY = lightsRayConfig.bg1Y / imageHeight;

                lightsRaySprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsRayConfig.offsetX;
                lightsRaySprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsRayConfig.offsetY;
            } else if (lightsRaySprite) {
                lightsRaySprite.x = backgroundSprite.x;
                lightsRaySprite.y = backgroundSprite.y;
            }

            // Eye logo sprite: position using config during drag (same logic)
            if (eyeLogoSprite && eyeLogoSprite.userData && eyeLogoSprite.userData.config) {
                const eyeConfig = eyeLogoSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = eyeConfig.bg1X / imageWidth;
                const normalizedY = eyeConfig.bg1Y / imageHeight;

                eyeLogoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + eyeConfig.offsetX;
                eyeLogoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + eyeConfig.offsetY;
            } else if (eyeLogoSprite) {
                eyeLogoSprite.x = backgroundSprite.x;
                eyeLogoSprite.y = backgroundSprite.y;
            }

            // CCTV sprite: position using config during drag (same logic)
            if (cctvSprite && cctvSprite.userData && cctvSprite.userData.config) {
                const cctvConfig = cctvSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = cctvConfig.bg1X / imageWidth;
                const normalizedY = cctvConfig.bg1Y / imageHeight;

                cctvSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cctvConfig.offsetX;
                cctvSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cctvConfig.offsetY;
            } else if (cctvSprite) {
                cctvSprite.x = backgroundSprite.x;
                cctvSprite.y = backgroundSprite.y;
            }

            // Wall Art sprite: position using config (bg1.png coordinates) - same technique as CCTV
            if (wallArtSprite && wallArtSprite.userData && wallArtSprite.userData.config) {
                const wallArtConfig = wallArtSprite.userData.config;

                // Convert bg1.png coordinates to world coordinates
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = wallArtConfig.bg1X / imageWidth;
                const normalizedY = wallArtConfig.bg1Y / imageHeight;

                wallArtSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + wallArtConfig.offsetX;
                wallArtSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + wallArtConfig.offsetY;

                // Position dot at center of wall art
                if (wallArtDot) {
                    wallArtDot.x = wallArtSprite.x;
                    wallArtDot.y = wallArtSprite.y;
                }
            // Position label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && wallArtLabelText && wallArtDot) {
                wallArtLabelText.x = wallArtDot.x;
                wallArtLabelText.y = wallArtDot.y + 40;
                wallArtLabelText.visible = true; // Make sure it's visible on mobile/tablet
                // Ensure text is on top by bringing it to front
                app.stage.removeChild(wallArtLabelText);
                app.stage.addChild(wallArtLabelText);
            } else if (wallArtLabelText) {
                wallArtLabelText.visible = false; // Hide on desktop
            }
            } else if (wallArtSprite) {
                // Default: same position as bg1
                wallArtSprite.x = backgroundSprite.x;
                wallArtSprite.y = backgroundSprite.y;

                // Position dot at center of wall art
                if (wallArtDot) {
                    wallArtDot.x = wallArtSprite.x;
                    wallArtDot.y = wallArtSprite.y;
                }
            // Position label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && wallArtLabelText && wallArtDot) {
                wallArtLabelText.x = wallArtDot.x;
                wallArtLabelText.y = wallArtDot.y + 40;
                wallArtLabelText.visible = true; // Make sure it's visible on mobile/tablet
                // Ensure text is on top by bringing it to front
                app.stage.removeChild(wallArtLabelText);
                app.stage.addChild(wallArtLabelText);
            } else if (wallArtLabelText) {
                wallArtLabelText.visible = false; // Hide on desktop
            }
            }

            // Book sprite: position using config during drag (same logic)
            if (bookSprite && bookSprite.userData && bookSprite.userData.config) {
                const bookConfig = bookSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = bookConfig.bg1X / imageWidth;
                const normalizedY = bookConfig.bg1Y / imageHeight;

                // Calculate new position - book sprite always moves with background (no cursor offset)
                bookSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + bookConfig.offsetX;
                bookSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + bookConfig.offsetY;

                // Position stroke overlay to match book sprite exactly
                if (bookStrokeSprite) {
                    bookStrokeSprite.x = bookSprite.x;
                    bookStrokeSprite.y = bookSprite.y;
                }

                // Position dot at center of book
                if (bookDot) {
                    bookDot.x = bookSprite.x;
                    bookDot.y = bookSprite.y;
                }
            } else if (bookSprite) {
                bookSprite.x = backgroundSprite.x;
                bookSprite.y = backgroundSprite.y;
                
                // Update base position for cursor-following animation
                if (bookSprite.userData) {
                    if (!bookSprite.userData.isHovered) {
                        bookSprite.userData.baseX = bookSprite.x;
                        bookSprite.userData.baseY = bookSprite.y;
                    } else {
                        // If hovered, update base position and adjust current position to maintain offset
                        const offsetX = bookSprite.x - (bookSprite.userData.baseX || bookSprite.x);
                        const offsetY = bookSprite.y - (bookSprite.userData.baseY || bookSprite.y);
                        bookSprite.userData.baseX = bookSprite.x;
                        bookSprite.userData.baseY = bookSprite.y;
                        // Maintain the cursor offset
                        bookSprite.x = bookSprite.userData.baseX + offsetX;
                        bookSprite.y = bookSprite.userData.baseY + offsetY;
                    }
                }

                // Position stroke overlay to match book sprite exactly
                if (bookStrokeSprite) {
                    bookStrokeSprite.x = bookSprite.x;
                    bookStrokeSprite.y = bookSprite.y;
                }
            }

            // Update mutator capsule text position and font size
            updateMutatorText();

            // Update CCTV text position and font size
            updateCctvText();

        }
    }

    // Get mouse/touch position relative to the canvas
    function getPointerPosition(event) {
        const rect = app.canvas.getBoundingClientRect();

        // Handle touch events
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        }

        // Handle changedTouches for touchend events
        if (event.changedTouches && event.changedTouches.length > 0) {
            return {
                x: event.changedTouches[0].clientX - rect.left,
                y: event.changedTouches[0].clientY - rect.top
            };
        }

        // Handle mouse events
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    // Handle mouse/touch down - start dragging
    function onPointerDown(event) {
        if (!backgroundSprite) return;

        // Handle multi-touch - only allow single touch for panning
        if (event.touches && event.touches.length > 1) {
            return;
        }

        const pointer = getPointerPosition(event);

        // Convert DOM coordinates to PixiJS coordinates for bounds checking
        const rect = app.canvas.getBoundingClientRect();
        const scaleX = app.canvas.width / rect.width;
        const scaleY = app.canvas.height / rect.height;
        const pixiX = pointer.x * scaleX;
        const pixiY = pointer.y * scaleY;

        // Check if pointer is over an interactive element (CCTV dot, mutator capsule dot, etc.)
        // Don't start dragging if touching an interactive element
        // Use try-catch since some variables might not be defined yet
        try {
            // Check CCTV dot bounds
            if (cctvDot && cctvDot.parent && cctvDot.visible) {
                const dotBounds = cctvDot.getBounds();
                if (pixiX >= dotBounds.x - dotBounds.width/2 && pixiX <= dotBounds.x + dotBounds.width/2 &&
                    pixiY >= dotBounds.y - dotBounds.height/2 && pixiY <= dotBounds.y + dotBounds.height/2) {
                    // Touching CCTV dot - don't start dragging
                    return;
                }
            }

            // Check mutator capsule dot bounds
            if (mutatorCapsuleDot && mutatorCapsuleDot.parent && mutatorCapsuleDot.visible) {
                const dotBounds = mutatorCapsuleDot.getBounds();
                if (pixiX >= dotBounds.x - dotBounds.width/2 && pixiX <= dotBounds.x + dotBounds.width/2 &&
                    pixiY >= dotBounds.y - dotBounds.height/2 && pixiY <= dotBounds.y + dotBounds.height/2) {
                    // Touching mutator capsule dot - don't start dragging
                    return;
                }
            }

            // Check other interactive sprites
            if (glitchSprite && glitchSprite.parent && glitchSprite.visible && glitchSprite.getBounds) {
                const bounds = glitchSprite.getBounds();
                if (pixiX >= bounds.x && pixiX <= bounds.x + bounds.width &&
                    pixiY >= bounds.y && pixiY <= bounds.y + bounds.height) {
                    return;
                }
            }

            if (cupSprite && cupSprite.parent && cupSprite.visible && cupSprite.getBounds) {
                const bounds = cupSprite.getBounds();
                if (pixiX >= bounds.x && pixiX <= bounds.x + bounds.width &&
                    pixiY >= bounds.y && pixiY <= bounds.y + bounds.height) {
                    return;
                }
            }

            if (eyeLogoSprite && eyeLogoSprite.parent && eyeLogoSprite.visible && eyeLogoSprite.getBounds) {
                const bounds = eyeLogoSprite.getBounds();
                if (pixiX >= bounds.x && pixiX <= bounds.x + bounds.width &&
                    pixiY >= bounds.y && pixiY <= bounds.y + bounds.height) {
                    return;
                }
            }

            // Check book dot bounds
            if (bookDot && bookDot.parent && bookDot.visible) {
                const dotBounds = bookDot.getBounds();
                if (pixiX >= dotBounds.x - dotBounds.width/2 && pixiX <= dotBounds.x + dotBounds.width/2 &&
                    pixiY >= dotBounds.y - dotBounds.height/2 && pixiY <= dotBounds.y + dotBounds.height/2) {
                    // Touching book dot - don't start dragging
                    return;
                }
            }
        } catch (e) {
            // Variables not defined yet or bounds check failed, continue with panning
        }

        // Not over an interactive element, allow panning
        isDragging = true;
        dragStart.x = pointer.x;
        dragStart.y = pointer.y;
        spriteStart.x = backgroundSprite.x;
        spriteStart.y = backgroundSprite.y;
        // Initialize wall art pan tracking
        wallArtLastPanPosition.x = pointer.x;
        wallArtLastPanPosition.y = pointer.y;

        // No custom cursor - use default
        event.preventDefault();
        // Don't stop propagation here - let it bubble if needed
    }

    // Handle mouse/touch move - update sprite position while dragging
    function onPointerMove(event) {
        if (!backgroundSprite || !isDragging) return;

        // Handle multi-touch - stop dragging if multiple touches
        if (event.touches && event.touches.length > 1) {
            isDragging = false;
            return;
        }

        const pointer = getPointerPosition(event);
        const deltaX = pointer.x - dragStart.x;
        const deltaY = pointer.y - dragStart.y;

        // Track panning movement for wall art animation (separate from drag state to avoid glitching)
        if (wallArtSprite && advanceWallArtFrame) {
            const panDeltaX = pointer.x - wallArtLastPanPosition.x;
            const panDeltaY = pointer.y - wallArtLastPanPosition.y;
            const panDistance = Math.sqrt(panDeltaX * panDeltaX + panDeltaY * panDeltaY);

            // Only trigger if panning distance exceeds threshold
            if (panDistance > wallArtPanThreshold) {
                // Determine primary panning direction
                if (Math.abs(panDeltaX) > Math.abs(panDeltaY)) {
                    // Horizontal panning (left/right)
                    if (panDeltaX > 0) {
                        // Panned right - advance frame forward
                        advanceWallArtFrame(1);
                    } else {
                        // Panned left - advance frame backward
                        advanceWallArtFrame(-1);
                    }
                } else {
                    // Vertical panning (top/bottom)
                    if (panDeltaY > 0) {
                        // Panned down - advance frame forward
                        advanceWallArtFrame(1);
                    } else {
                        // Panned up - advance frame backward
                        advanceWallArtFrame(-1);
                    }
                }
                // Update last pan position (don't interfere with drag state)
                wallArtLastPanPosition.x = pointer.x;
                wallArtLastPanPosition.y = pointer.y;
            }
        }

        let newX = spriteStart.x + deltaX;
        let newY = spriteStart.y + deltaY;

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const scaledWidth = imageWidth * currentScale;
        const scaledHeight = imageHeight * currentScale;

        const overflowX = Math.max(0, scaledWidth - screenWidth);
        const overflowY = Math.max(0, scaledHeight - screenHeight);

        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;

        const minX = centerX - overflowX / 2;
        const maxX = centerX + overflowX / 2;
        const minY = centerY - overflowY / 2;
        const maxY = centerY + overflowY / 2;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        backgroundSprite.x = newX;
        backgroundSprite.y = newY;

        // Mutator background sprite: update position during drag (maintain relative position to bg1)
        if (mutatorBgSprite) {
            if (mutatorBgSprite.userData && mutatorBgSprite.userData.config) {
                const mutatorConfig = mutatorBgSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = mutatorConfig.bg1X / imageWidth;
                const normalizedY = mutatorConfig.bg1Y / imageHeight;

                mutatorBgSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + mutatorConfig.offsetX;
                mutatorBgSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + mutatorConfig.offsetY;
            } else {
                mutatorBgSprite.x = newX;
                mutatorBgSprite.y = newY;
            }
        }

        // Mutator capsule sprite: update position during drag (maintain relative position to bg1)
        if (mutatorCapsuleSprite) {
            if (mutatorCapsuleSprite.userData && mutatorCapsuleSprite.userData.config) {
                const capsuleConfig = mutatorCapsuleSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = capsuleConfig.bg1X / imageWidth;
                const normalizedY = capsuleConfig.bg1Y / imageHeight;

                mutatorCapsuleSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + capsuleConfig.offsetX;
                mutatorCapsuleSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + capsuleConfig.offsetY;

                // Position stroke overlay to match capsule
                if (mutatorCapsuleStrokeSprite) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                // Position dot and circle text at center of capsule
                if (mutatorCapsuleDot) {
                    mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40;
                }
                // Position circle text: on desktop, only when hidden
                if (mutatorCapsuleCircleText && !mutatorCapsuleCircleText.visible) {
                    // On desktop: only position when hidden (when visible, it follows cursor)
                    mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;
                }
            } else {
                mutatorCapsuleSprite.x = newX;
                mutatorCapsuleSprite.y = newY;

                // Position stroke overlay to match capsule
                if (mutatorCapsuleStrokeSprite) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                // Position dot and circle text at center of capsule
                if (mutatorCapsuleDot) {
                    mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
                }
                // Position label text on mobile/tablet (below dot)
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40;
                }
                // Position circle text: on desktop, only when hidden
                if (mutatorCapsuleCircleText && !mutatorCapsuleCircleText.visible) {
                    // On desktop: only position when hidden (when visible, it follows cursor)
                    mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;
                }
            }
        }

        // Cup sprite: update position during drag (maintain relative position to bg1)
        if (cupSprite) {
            if (cupSprite.userData && cupSprite.userData.config) {
                // Use config-based positioning during drag
                const cupConfig = cupSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = cupConfig.bg1X / imageWidth;
                const normalizedY = cupConfig.bg1Y / imageHeight;

                cupSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cupConfig.offsetX;
                cupSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cupConfig.offsetY;
            } else {
                cupSprite.x = newX;
                cupSprite.y = newY;
            }

            // Always update base position for animation (even if animating)
            // This ensures cup stays in correct position when background moves during animation
            if (cupSprite.userData) {
                cupSprite.userData.originalX = cupSprite.x;
                cupSprite.userData.originalY = cupSprite.y;
            }
        }

        // Glitch sprite: update position during drag (maintain relative position to bg1)
        if (glitchSprite) {
            if (glitchSprite.userData && glitchSprite.userData.config) {
                // Use config-based positioning during drag
                const glitchConfig = glitchSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = glitchConfig.bg1X / imageWidth;
                const normalizedY = glitchConfig.bg1Y / imageHeight;

                glitchSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + glitchConfig.offsetX;
                glitchSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + glitchConfig.offsetY;
            } else {
                glitchSprite.x = newX;
                glitchSprite.y = newY;
            }
        }

        // Eye logo sprite: update position during drag (maintain relative position to bg1)
        if (eyeLogoSprite) {
            if (eyeLogoSprite.userData && eyeLogoSprite.userData.config) {
                // Use config-based positioning during drag
                const eyeConfig = eyeLogoSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = eyeConfig.bg1X / imageWidth;
                const normalizedY = eyeConfig.bg1Y / imageHeight;

                eyeLogoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + eyeConfig.offsetX;
                eyeLogoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + eyeConfig.offsetY;
            } else {
                eyeLogoSprite.x = newX;
                eyeLogoSprite.y = newY;
            }
        }

        // CCTV sprite: update position during drag (maintain relative position to bg1)
        if (cctvSprite) {
            if (cctvSprite.userData && cctvSprite.userData.config) {
                // Use config-based positioning during drag
                const cctvConfig = cctvSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = cctvConfig.bg1X / imageWidth;
                const normalizedY = cctvConfig.bg1Y / imageHeight;

                cctvSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cctvConfig.offsetX;
                cctvSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cctvConfig.offsetY;
            } else {
                cctvSprite.x = newX;
                cctvSprite.y = newY;
            }

        // Discord sprite: update position during drag (maintain relative position to bg1)
        if (discordSprite) {
            if (discordSprite.userData && discordSprite.userData.config) {
                // Use config-based positioning during drag
                const discordConfig = discordSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = discordConfig.bg1X / imageWidth;
                const normalizedY = discordConfig.bg1Y / imageHeight;

                discordSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + discordConfig.offsetX;
                discordSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + discordConfig.offsetY;

                // Update scale during drag
                if (discordConfig.scale !== null && discordConfig.scale !== undefined) {
                    const discordScale = discordConfig.scale * currentScale;
                    discordSprite.scale.set(discordScale);
                } else {
                    discordSprite.scale.set(currentScale);
                }
            } else {
                discordSprite.x = newX;
                discordSprite.y = newY;
            }
        }

        // Promo sprite: update position during drag (maintain relative position to bg1)
        if (promoSprite) {
            if (promoSprite.userData && promoSprite.userData.config) {
                // Use config-based positioning during drag
                const promoConfig = promoSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = promoConfig.bg1X / imageWidth;
                const normalizedY = promoConfig.bg1Y / imageHeight;

                promoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + promoConfig.offsetX;
                promoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + promoConfig.offsetY;

                // Update scale during drag
                if (promoConfig.scale !== null && promoConfig.scale !== undefined) {
                    const promoScale = promoConfig.scale * currentScale;
                    promoSprite.scale.set(promoScale);
                } else {
                    promoSprite.scale.set(currentScale);
                }
            } else {
                promoSprite.x = newX;
                promoSprite.y = newY;
            }
        }

        // Telegram sprite: update position during drag (maintain relative position to bg1)
        if (telegramSprite) {
            if (telegramSprite.userData && telegramSprite.userData.config) {
                // Use config-based positioning during drag
                const telegramConfig = telegramSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = telegramConfig.bg1X / imageWidth;
                const normalizedY = telegramConfig.bg1Y / imageHeight;

                telegramSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + telegramConfig.offsetX;
                telegramSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + telegramConfig.offsetY;

                // Update scale during drag
                if (telegramConfig.scale !== null && telegramConfig.scale !== undefined) {
                    const telegramScale = telegramConfig.scale * currentScale;
                    telegramSprite.scale.set(telegramScale);
                } else {
                    telegramSprite.scale.set(currentScale);
                }
            } else {
                telegramSprite.x = newX;
                telegramSprite.y = newY;
            }
        }

        // Blaised sprite: update position during drag (maintain relative position to bg1)
        if (blaisedSprite) {
            if (blaisedSprite.userData && blaisedSprite.userData.config) {
                // Use config-based positioning during drag
                const blaisedConfig = blaisedSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;

                blaisedSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;

                // Update scale during drag
                if (blaisedConfig.scale !== null && blaisedConfig.scale !== undefined) {
                    const blaisedScale = blaisedConfig.scale * currentScale;
                    blaisedSprite.scale.set(blaisedScale);
                } else {
                    blaisedSprite.scale.set(currentScale);
                }
            } else {
                blaisedSprite.x = newX;
                blaisedSprite.y = newY;
            }
        }

        // Blaised Aura sprite: update position during drag (maintain relative position to bg1)
        if (blaisedAuraSprite) {
            if (blaisedAuraSprite.userData && blaisedAuraSprite.userData.config) {
                // Use config-based positioning during drag
                const blaisedAuraConfig = blaisedAuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;

                blaisedAuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;

                // Update scale during drag
                if (blaisedAuraConfig.scale !== null && blaisedAuraConfig.scale !== undefined) {
                    const blaisedAuraScale = blaisedAuraConfig.scale * currentScale;
                    blaisedAuraSprite.scale.set(blaisedAuraScale);
                } else {
                    blaisedAuraSprite.scale.set(currentScale);
                }
            } else {
                blaisedAuraSprite.x = newX;
                blaisedAuraSprite.y = newY;
            }
        }

        // Blaised Action2 sprite: update position during drag (same as blaised sprite)
        if (blaisedAction2Sprite) {
            if (blaisedAction2Sprite.userData && blaisedAction2Sprite.userData.config) {
                const blaisedConfig = blaisedAction2Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;
                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction2Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction2Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
                if (blaisedConfig.scale !== null && blaisedConfig.scale !== undefined) {
                    const blaisedScale = blaisedConfig.scale * currentScale;
                    blaisedAction2Sprite.scale.set(blaisedScale);
                } else {
                    blaisedAction2Sprite.scale.set(currentScale);
                }
            } else {
                blaisedAction2Sprite.x = newX;
                blaisedAction2Sprite.y = newY;
            }
        }

        // Blaised Action2 Aura sprite: update position during drag (same as blaised aura sprite)
        if (blaisedAction2AuraSprite) {
            if (blaisedAction2AuraSprite.userData && blaisedAction2AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction2AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;
                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction2AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction2AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
                if (blaisedAuraConfig.scale !== null && blaisedAuraConfig.scale !== undefined) {
                    const blaisedAuraScale = blaisedAuraConfig.scale * currentScale;
                    blaisedAction2AuraSprite.scale.set(blaisedAuraScale);
                } else {
                    blaisedAction2AuraSprite.scale.set(currentScale);
                }
            } else {
                blaisedAction2AuraSprite.x = newX;
                blaisedAction2AuraSprite.y = newY;
            }
        }

        // Blaised Action3 sprite: update position during drag (different position from default blaised sprite)
        if (blaisedAction3Sprite) {
            if (blaisedAction3Sprite.userData && blaisedAction3Sprite.userData.config) {
                const blaisedConfig = blaisedAction3Sprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;
                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;
                const normalizedX = blaisedConfig.bg1X / imageWidth;
                const normalizedY = blaisedConfig.bg1Y / imageHeight;
                blaisedAction3Sprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedConfig.offsetX;
                blaisedAction3Sprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedConfig.offsetY;
                if (blaisedConfig.scale !== null && blaisedConfig.scale !== undefined) {
                    const blaisedScale = blaisedConfig.scale * currentScale;
                    blaisedAction3Sprite.scale.set(blaisedScale);
                } else {
                    blaisedAction3Sprite.scale.set(currentScale);
                }
            } else {
                blaisedAction3Sprite.x = newX;
                blaisedAction3Sprite.y = newY;
            }
        }

        // Blaised Action3 Aura sprite: update position during drag (same position as action3 sprite)
        if (blaisedAction3AuraSprite) {
            if (blaisedAction3AuraSprite.userData && blaisedAction3AuraSprite.userData.config) {
                const blaisedAuraConfig = blaisedAction3AuraSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;
                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;
                const normalizedX = blaisedAuraConfig.bg1X / imageWidth;
                const normalizedY = blaisedAuraConfig.bg1Y / imageHeight;
                blaisedAction3AuraSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + blaisedAuraConfig.offsetX;
                blaisedAction3AuraSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + blaisedAuraConfig.offsetY;
                if (blaisedAuraConfig.scale !== null && blaisedAuraConfig.scale !== undefined) {
                    const blaisedAuraScale = blaisedAuraConfig.scale * currentScale;
                    blaisedAction3AuraSprite.scale.set(blaisedAuraScale);
                } else {
                    blaisedAction3AuraSprite.scale.set(currentScale);
                }
            } else {
                blaisedAction3AuraSprite.x = newX;
                blaisedAction3AuraSprite.y = newY;
            }
        }

        // Lights off sprite: update position during drag (maintain relative position to bg1)
        if (lightsOffSprite) {
            if (lightsOffSprite.userData && lightsOffSprite.userData.config) {
                // Use config-based positioning during drag
                const lightsOffConfig = lightsOffSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = lightsOffConfig.bg1X / imageWidth;
                const normalizedY = lightsOffConfig.bg1Y / imageHeight;

                // Calculate center position
                const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsOffConfig.offsetX;
                const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsOffConfig.offsetY;

                // Since anchor is at (0.5, 0), adjust Y to position the top correctly
                const lightsOffHeight = lightsOffSprite.texture?.orig?.height || lightsOffSprite.texture?.height || 1087;
                const scaledHeight = lightsOffHeight * lightsOffSprite.scale.y;

                lightsOffSprite.x = centerX;
                lightsOffSprite.y = centerY - scaledHeight / 2;

                // Update scale during drag
                if (lightsOffConfig.scale !== null && lightsOffConfig.scale !== undefined) {
                    const lightsOffScale = lightsOffConfig.scale * currentScale;
                    lightsOffSprite.scale.set(lightsOffScale);
                } else {
                    lightsOffSprite.scale.set(currentScale);
                }
            } else {
                lightsOffSprite.x = newX;
                lightsOffSprite.y = newY;
            }
        }

        // Lights ray sprite: update position during drag (maintain relative position to bg1)
        if (lightsRaySprite) {
            if (lightsRaySprite.userData && lightsRaySprite.userData.config) {
                // Use config-based positioning during drag
                const lightsRayConfig = lightsRaySprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = lightsRayConfig.bg1X / imageWidth;
                const normalizedY = lightsRayConfig.bg1Y / imageHeight;

                lightsRaySprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsRayConfig.offsetX;
                lightsRaySprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsRayConfig.offsetY;

                // Update scale during drag
                if (lightsRayConfig.scale !== null && lightsRayConfig.scale !== undefined) {
                    const lightsRayScale = lightsRayConfig.scale * currentScale;
                    lightsRaySprite.scale.set(lightsRayScale);
                } else {
                    lightsRaySprite.scale.set(currentScale);
                }
            } else {
                lightsRaySprite.x = newX;
                lightsRaySprite.y = newY;
            }
        }

        // Lights switch sprite: update position during drag (maintain relative position to bg1)
        if (lightsSwitchSprite) {
            if (lightsSwitchSprite.userData && lightsSwitchSprite.userData.config) {
                // Use config-based positioning during drag
                const lightsSwitchConfig = lightsSwitchSprite.userData.config;
                const bg1DisplayedWidth = imageWidth * currentScale;
                const bg1DisplayedHeight = imageHeight * currentScale;

                const bg1Left = newX - bg1DisplayedWidth / 2;
                const bg1Top = newY - bg1DisplayedHeight / 2;

                const normalizedX = lightsSwitchConfig.bg1X / imageWidth;
                const normalizedY = lightsSwitchConfig.bg1Y / imageHeight;

                // Calculate center position
                const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsSwitchConfig.offsetX;
                const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsSwitchConfig.offsetY;

                // Since anchor is at (0.5, 0), adjust Y to position the top correctly
                const lightsSwitchHeight = lightsSwitchSprite.texture?.orig?.height || lightsSwitchSprite.texture?.height || 843;
                const scaledHeight = lightsSwitchHeight * lightsSwitchSprite.scale.y;

                lightsSwitchSprite.x = centerX;
                lightsSwitchSprite.y = centerY - scaledHeight / 2;

                // Update scale during drag
                if (lightsSwitchConfig.scale !== null && lightsSwitchConfig.scale !== undefined) {
                    const lightsSwitchScale = lightsSwitchConfig.scale * currentScale;
                    lightsSwitchSprite.scale.set(lightsSwitchScale);
                } else {
                    lightsSwitchSprite.scale.set(currentScale);
                }
            } else {
                lightsSwitchSprite.x = newX;
                lightsSwitchSprite.y = newY;
            }
        }

            // Wall Art sprite: update position during drag (maintain relative position to bg1)
            if (wallArtSprite) {
                if (wallArtSprite.userData && wallArtSprite.userData.config) {
                    // Use config-based positioning during drag
                    const wallArtConfig = wallArtSprite.userData.config;
                    const bg1DisplayedWidth = imageWidth * currentScale;
                    const bg1DisplayedHeight = imageHeight * currentScale;

                    const bg1Left = newX - bg1DisplayedWidth / 2;
                    const bg1Top = newY - bg1DisplayedHeight / 2;

                    const normalizedX = wallArtConfig.bg1X / imageWidth;
                    const normalizedY = wallArtConfig.bg1Y / imageHeight;

                    wallArtSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + wallArtConfig.offsetX;
                    wallArtSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + wallArtConfig.offsetY;

                    // Position dot at center of wall art
                    if (wallArtDot) {
                        wallArtDot.x = wallArtSprite.x;
                        wallArtDot.y = wallArtSprite.y;
                    }
            // Position label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && wallArtLabelText && wallArtDot) {
                wallArtLabelText.x = wallArtDot.x;
                wallArtLabelText.y = wallArtDot.y + 40;
                wallArtLabelText.visible = true; // Make sure it's visible on mobile/tablet
                // Ensure text is on top by bringing it to front
                app.stage.removeChild(wallArtLabelText);
                app.stage.addChild(wallArtLabelText);
            } else if (wallArtLabelText) {
                wallArtLabelText.visible = false; // Hide on desktop
            }
                } else {
                    wallArtSprite.x = newX;
                    wallArtSprite.y = newY;

                    // Position dot at center of wall art
                    if (wallArtDot) {
                        wallArtDot.x = wallArtSprite.x;
                        wallArtDot.y = wallArtSprite.y;
                    }
            // Position label text on mobile/tablet (below dot)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet() && wallArtLabelText && wallArtDot) {
                wallArtLabelText.x = wallArtDot.x;
                wallArtLabelText.y = wallArtDot.y + 40;
                wallArtLabelText.visible = true; // Make sure it's visible on mobile/tablet
                // Ensure text is on top by bringing it to front
                app.stage.removeChild(wallArtLabelText);
                app.stage.addChild(wallArtLabelText);
            } else if (wallArtLabelText) {
                wallArtLabelText.visible = false; // Hide on desktop
            }
                }
            }

            // Book sprite: update position during drag (maintain relative position to bg1)
            if (bookSprite) {
                if (bookSprite.userData && bookSprite.userData.config) {
                    // Use config-based positioning during drag
                    const bookConfig = bookSprite.userData.config;
                    const bg1DisplayedWidth = imageWidth * currentScale;
                    const bg1DisplayedHeight = imageHeight * currentScale;

                    const bg1Left = newX - bg1DisplayedWidth / 2;
                    const bg1Top = newY - bg1DisplayedHeight / 2;

                    const normalizedX = bookConfig.bg1X / imageWidth;
                    const normalizedY = bookConfig.bg1Y / imageHeight;

                    bookSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + bookConfig.offsetX;
                    bookSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + bookConfig.offsetY;

                    // Position stroke overlay to match book sprite exactly
                    if (bookStrokeSprite) {
                        bookStrokeSprite.x = bookSprite.x;
                        bookStrokeSprite.y = bookSprite.y;
                    }

                    // Position dot at center of book
                    if (bookDot) {
                        bookDot.x = bookSprite.x;
                        bookDot.y = bookSprite.y;
                    }
                } else {
                    bookSprite.x = newX;
                    bookSprite.y = newY;

                    // Position stroke overlay to match book sprite exactly
                    if (bookStrokeSprite) {
                        bookStrokeSprite.x = bookSprite.x;
                        bookStrokeSprite.y = bookSprite.y;
                    }

                    // Position dot at center of book
                    if (bookDot) {
                        bookDot.x = bookSprite.x;
                        bookDot.y = bookSprite.y;
                    }
                }
            }

            // Update mutator capsule text position and font size
            updateMutatorText();

            // Update CCTV text position and font size
            updateCctvText();

            // Update Book text position and font size
            updateBookText();
        }

        event.preventDefault();
    }

    // Handle mouse/touch up - stop dragging
    function onPointerUp(event) {
        if (!isDragging) return;

        isDragging = false;

        // Stop wall art animation when dragging stops
        if (stopWallArtAnimation && wallArtIsAnimating) {
            // Clear any pending timeout
            if (wallArtAnimationTimeout) {
                clearTimeout(wallArtAnimationTimeout);
                wallArtAnimationTimeout = null;
            }
            // Stop animation immediately
            stopWallArtAnimation();
        }

        // Don't set cursor here - let the ticker and hover handlers update it appropriately
        // They will set it to 'pointer' if circle is active, or 'default'/'grab' otherwise
        event.preventDefault();
    }

    // Setup panning event listeners
    function setupPanning() {
        if (!app.canvas) return;

        // Mouse events (desktop)
        app.canvas.addEventListener('mousedown', onPointerDown);
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);

        // Touch events (mobile) - use passive: false to allow preventDefault
        app.canvas.addEventListener('touchstart', onPointerDown, { passive: false });
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp, { passive: false });
        document.addEventListener('touchcancel', onPointerUp, { passive: false });

        app.canvas.style.cursor = 'grab';
    }

    // Count total assets to load for progress tracking
    // Background: 3 frames
    // Mutator: 1 bg + 10 capsules + 1 stroke = 12
    // Cup: 1
    // Glitch: 6 frames
    // Eye logo: 2 (open + closed)
    // CCTV: 3 frames + 3 strokes = 6
    // Discord: 8 frames
    // Promo: 10 frames
    // Telegram: 9 frames
    // Blaised: 6 frames + 6 auras = 12
    // Wall art: 6 frames + 6 strokes = 12
    // Book: 1 + 1 stroke = 2
    // Lights: 3 (off, switch, ray)
    // Total: 3 + 12 + 1 + 6 + 2 + 6 + 8 + 10 + 9 + 12 + 12 + 2 + 3 = 98
    totalAssetsToLoad = 98;
    loadedAssetsCount = 0;
    console.log(`Starting to load ${totalAssetsToLoad} assets...`);

    // Load the background textures using Assets API (bg1.png, bg2.png, bg3.png)
    try {
        console.log('Loading background frames...');
        const backgroundTextures = [];

        // Load all 3 background frames (bg1.png, bg2.png, bg3.png)
        for (let i = 1; i <= 3; i++) {
            const texture = await loadAssetWithProgress(`assets/bg${i}.png`);
            backgroundTextures.push(texture);
            console.log(`  Loaded bg${i}.png:`, texture.width, 'x', texture.height);
        }

        // Get dimensions from first frame
        const firstTexture = backgroundTextures[0];
        imageWidth = firstTexture.width || 1920;
        imageHeight = firstTexture.height || 1080;

        console.log(`Background texture loaded - Width: ${imageWidth}, Height: ${imageHeight}`);
        console.log(`  Loaded all ${backgroundTextures.length} background frames`);

        // Create AnimatedSprite from the background textures
        backgroundSprite = new AnimatedSprite(backgroundTextures);
        backgroundSprite.anchor.set(0.5);

        // Configure background animation settings
        backgroundSprite.animationSpeed = 0.1; // Speed of animation (0.1 = 10% of ticker speed, slower animation)
        backgroundSprite.loop = true; // Loop the animation

        // Hide sprite initially until resizeBackground positions it correctly
        backgroundSprite.visible = false;
        backgroundSprite.alpha = 1.0;

        backgroundSprite.play(); // Start the animation

        app.stage.addChild(backgroundSprite);

        console.log('Background AnimatedSprite created:', {
            textures: backgroundTextures.length,
            playing: backgroundSprite.playing,
            loop: backgroundSprite.loop,
            animationSpeed: backgroundSprite.animationSpeed
        });


        try {
            // Load mutator background (static image with hue animation)
            const mutatorBgTexture = await loadAssetWithProgress('assets/mutator_bg.png');
            mutatorBgSprite = new Sprite(mutatorBgTexture);
            mutatorBgSprite.anchor.set(0.5);

            // Load mutator capsule frames for animation
            console.log('Loading mutator capsule frames...');
            const mutatorCapsuleTexturePaths = Array.from({ length: 10 }, (_, index) => `assets/mutator_capsule${index + 1}.png`);
            const mutatorCapsuleTextures = [];

            for (const texturePath of mutatorCapsuleTexturePaths) {
                const texture = await loadAssetWithProgress(texturePath);
                mutatorCapsuleTextures.push(texture);
                console.log(`  Loaded ${texturePath}:`, texture.width, 'x', texture.height);
            }

            // Load mutator capsule stroke overlay for hover effect
            const mutatorCapsuleStrokeTexture = await loadAssetWithProgress('assets/mutator_capsule_stroke.png');
            console.log('  Loaded mutator_capsule_stroke.png:', mutatorCapsuleStrokeTexture.width, 'x', mutatorCapsuleStrokeTexture.height);

            // Create AnimatedSprite from the capsule textures
            // Animation will loop through all loaded capsule textures
            mutatorCapsuleSprite = new AnimatedSprite(mutatorCapsuleTextures);
            mutatorCapsuleSprite.anchor.set(0.5);

            // Store global reference for visibility handler
            globalMutatorCapsuleSprite = mutatorCapsuleSprite;

            // Configure capsule animation settings
            mutatorCapsuleSprite.animationSpeed = 0.3; // Speed of animation (0.3 = 30% of ticker speed, faster than before)
            mutatorCapsuleSprite.loop = true; // Loop the animation

            // Store animation speed for hover effects
            mutatorCapsuleSprite.userData = mutatorCapsuleSprite.userData || {};
            mutatorCapsuleSprite.userData.baseAnimationSpeed = 0.3; // Faster base speed
            mutatorCapsuleSprite.userData.isOverCapsule = false;
            mutatorCapsuleSprite.userData.cursorDistance = 1;
            mutatorCapsuleSprite.userData.lastFrame = -1; // Track previous frame for loop detection

            // Hide sprite initially until resizeBackground positions it correctly
            mutatorCapsuleSprite.visible = false;
            mutatorCapsuleSprite.alpha = 1.0;

            mutatorCapsuleSprite.play(); // Start the animation

            // Ticker to speed up animation at the end (last frame) for faster loop
            app.ticker.add(() => {
                if (!mutatorCapsuleSprite || !mutatorCapsuleSprite.userData) return;

                const data = mutatorCapsuleSprite.userData;
                const currentFrame = Math.floor(mutatorCapsuleSprite.currentFrame);
                const totalFrames = mutatorCapsuleTextures.length;
                const lastFrameIndex = totalFrames - 1; // Frame 9 (mutator_capsule10.png)

                // Check if hover is active (stroke visible indicates hover)
                const isHoverActive = mutatorCapsuleStrokeSprite && mutatorCapsuleStrokeSprite.visible;
                const hoverSpeedMultiplier = 5.0; // Increased for more dramatic glitch effect (was 3.0)
                const targetNormalSpeed = isHoverActive ?
                    (data.baseAnimationSpeed * hoverSpeedMultiplier) :
                    data.baseAnimationSpeed;

                // Speed up when reaching the last frame (frame 9)
                if (currentFrame === lastFrameIndex) {
                    // Set faster speed for quick transition back to frame 0
                    mutatorCapsuleSprite.animationSpeed = targetNormalSpeed * 5.0; // 5x faster
                } else if (currentFrame === 0 && data.lastFrame === lastFrameIndex) {
                    // Just looped back to frame 0, reset to normal speed based on hover state
                    mutatorCapsuleSprite.animationSpeed = targetNormalSpeed;
                }

                data.lastFrame = currentFrame;
            });

            console.log('Capsule AnimatedSprite created:', {
                textures: mutatorCapsuleTextures.length,
                playing: mutatorCapsuleSprite.playing,
                loop: mutatorCapsuleSprite.loop,
                animationSpeed: mutatorCapsuleSprite.animationSpeed,
                currentFrame: mutatorCapsuleSprite.currentFrame
            });

            // Get capsule dimensions (use first frame as reference) - same technique as cup
            const firstCapsuleTexture = mutatorCapsuleTextures[0];
            const capsuleImageWidth = firstCapsuleTexture?.orig?.width || firstCapsuleTexture?.width || firstCapsuleTexture?.baseTexture?.width || 1920;
            const capsuleImageHeight = firstCapsuleTexture?.orig?.height || firstCapsuleTexture?.height || firstCapsuleTexture?.baseTexture?.height || 1080;

            console.log(`Capsule texture loaded: ${capsuleImageWidth}x${capsuleImageHeight}`);
            console.log(`BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Mutator capsule positioning and sizing config - same technique as cup
            // Position on bg1.png (in pixels):
            // Left X: 1176, Right X: 2412, Top Y: 584, Bottom Y: 2472
            // Center X: (1176 + 2412) / 2 = 1794
            // Center Y: (584 + 2472) / 2 = 1528
            // Dimensions: width: 1236 pixels, height: 1888 pixels (on bg1.png)
            const mutatorCapsuleConfig = {
                // Capsule dimensions (on bg1.png coordinate space)
                capsuleWidth: 1236,
                capsuleHeight: 1888,

                // Position on bg1.png (center of capsule)
                bg1X: 1794, // Center X position on bg1.png
                bg1Y: 1528, // Center Y position on bg1.png

                // Scale: calculated to make capsule fit its designated space on bg1.png
                // Same technique as cup - relative to bg1's scale
                // The scale will be: (designated size on bg1) / (actual image size) * (bg1 scale)
                // But we store the relative scale factor here, which gets multiplied by bg1 scale in resizeBackground
                scale: 1.0, // Will be calculated below, then multiplied by scaleMultiplier

                // Scale multiplier: adjust this to make capsule larger or smaller
                // 1.0 = calculated size, 0.5 = 50% size, 2.0 = 200% size, etc.
                // Example: 0.5 = smaller, 1.5 = larger, 2.0 = twice as big
                scaleMultiplier: 1.0, // <-- Change this value to rescale: 0.5 = smaller, 1.5 = larger

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make capsule image fit into designated space on bg1.png
            // We want capsule to take up capsuleWidth pixels on bg1
            // So: actualCapsuleWidth * scale = capsuleWidth
            // Therefore: scale = capsuleWidth / actualCapsuleWidth (relative to bg1's coordinate space)
            if (capsuleImageWidth && capsuleImageHeight && mutatorCapsuleConfig.capsuleWidth && mutatorCapsuleConfig.capsuleHeight) {
                const relativeScaleX = mutatorCapsuleConfig.capsuleWidth / capsuleImageWidth;
                const relativeScaleY = mutatorCapsuleConfig.capsuleHeight / capsuleImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                const calculatedScale = Math.min(relativeScaleX, relativeScaleY);

                // Apply scale multiplier to allow easy resizing
                mutatorCapsuleConfig.scale = calculatedScale * mutatorCapsuleConfig.scaleMultiplier;
            } else {
                // Fallback: use natural size with multiplier
                mutatorCapsuleConfig.scale = 1.0 * mutatorCapsuleConfig.scaleMultiplier;
            }

            console.log(`Mutator Capsule config:`);
            console.log(`  Capsule dimensions on bg1.png: ${mutatorCapsuleConfig.capsuleWidth}x${mutatorCapsuleConfig.capsuleHeight}`);
            console.log(`  BG1 position (center): (${mutatorCapsuleConfig.bg1X}, ${mutatorCapsuleConfig.bg1Y})`);
            console.log(`  Actual capsule image size: ${capsuleImageWidth}x${capsuleImageHeight}`);
            console.log(`  Calculated scale: ${mutatorCapsuleConfig.scale}`);
            console.log(`  BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Calculate normalized position to check if it's valid
            const normalizedX = mutatorCapsuleConfig.bg1X / imageWidth;
            const normalizedY = mutatorCapsuleConfig.bg1Y / imageHeight;
            console.log(`  Normalized position: (${normalizedX}, ${normalizedY})`);

            // Warn if coordinates seem wrong
            if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) {
                console.warn(`⚠️ WARNING: Capsule position is outside bg1.png bounds!`);
            }
            if (mutatorCapsuleConfig.scale < 0.001) {
                console.warn(`⚠️ WARNING: Capsule scale is very small (${mutatorCapsuleConfig.scale}), it might be invisible!`);
            }

            // Get mutator background dimensions (same technique as capsule and cup)
            const mutatorBgImageWidth = mutatorBgTexture.orig?.width || mutatorBgTexture.width || mutatorBgTexture.baseTexture.width;
            const mutatorBgImageHeight = mutatorBgTexture.orig?.height || mutatorBgTexture.height || mutatorBgTexture.baseTexture.height;

            console.log(`Mutator background texture loaded: ${mutatorBgImageWidth}x${mutatorBgImageHeight}`);
            console.log(`BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Mutator background positioning and sizing config - same technique as capsule and cup
            // Position on bg1.png (in pixels):
            // Left X: 1177, Right X: 3279, Top Y: 584, Bottom Y: 2473
            // Center X: (1177 + 3279) / 2 = 2228
            // Center Y: (584 + 2473) / 2 = 1528.5
            // Dimensions: width: 2102 pixels, height: 1889 pixels (on bg1.png)
            const mutatorBgConfig = {
                // Mutator background dimensions (on bg1.png coordinate space)
                mutatorBgWidth: 2102,
                mutatorBgHeight: 1889,

                // Position on bg1.png (center of mutator background)
                bg1X: 2228, // Center X position on bg1.png
                bg1Y: 1528.5, // Center Y position on bg1.png

                // Scale: calculated to make mutator background fit its designated space on bg1.png
                // Same technique as capsule and cup - relative to bg1's scale
                scale: 1.0, // Will be calculated below, then multiplied by scaleMultiplier

                // Scale multiplier: adjust this to make mutator background larger or smaller
                // 1.0 = calculated size, 0.5 = 50% size, 2.0 = 200% size, etc.
                scaleMultiplier: 1.0, // <-- Change this value to rescale: 0.5 = smaller, 1.5 = larger

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make mutator background image fit into designated space on bg1.png
            // We want mutator background to take up mutatorBgWidth pixels on bg1
            // So: actualMutatorBgWidth * scale = mutatorBgWidth
            // Therefore: scale = mutatorBgWidth / actualMutatorBgWidth (relative to bg1's coordinate space)
            if (mutatorBgImageWidth && mutatorBgImageHeight && mutatorBgConfig.mutatorBgWidth && mutatorBgConfig.mutatorBgHeight) {
                const relativeScaleX = mutatorBgConfig.mutatorBgWidth / mutatorBgImageWidth;
                const relativeScaleY = mutatorBgConfig.mutatorBgHeight / mutatorBgImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                const calculatedScale = Math.min(relativeScaleX, relativeScaleY);

                // Apply scale multiplier to allow easy resizing
                mutatorBgConfig.scale = calculatedScale * mutatorBgConfig.scaleMultiplier;
            } else {
                // Fallback: use natural size with multiplier
                mutatorBgConfig.scale = 1.0 * mutatorBgConfig.scaleMultiplier;
            }

            console.log(`Mutator Background config:`);
            console.log(`  Mutator background dimensions on bg1.png: ${mutatorBgConfig.mutatorBgWidth}x${mutatorBgConfig.mutatorBgHeight}`);
            console.log(`  BG1 position (center): (${mutatorBgConfig.bg1X}, ${mutatorBgConfig.bg1Y})`);
            console.log(`  Actual mutator background image size: ${mutatorBgImageWidth}x${mutatorBgImageHeight}`);
            console.log(`  Calculated scale: ${mutatorBgConfig.scale}`);
            console.log(`  BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Calculate normalized position to check if it's valid
            const normalizedBgX = mutatorBgConfig.bg1X / imageWidth;
            const normalizedBgY = mutatorBgConfig.bg1Y / imageHeight;
            console.log(`  Normalized position: (${normalizedBgX}, ${normalizedBgY})`);

            // Warn if coordinates seem wrong
            if (normalizedBgX < 0 || normalizedBgX > 1 || normalizedBgY < 0 || normalizedBgY > 1) {
                console.warn(`⚠️ WARNING: Mutator background position is outside bg1.png bounds!`);
            }
            if (mutatorBgConfig.scale < 0.001) {
                console.warn(`⚠️ WARNING: Mutator background scale is very small (${mutatorBgConfig.scale}), it might be invisible!`);
            }

            // Store config in userData for mutator background sprite (same technique as capsule and cup)
            mutatorBgSprite.userData = mutatorBgSprite.userData || {};
            mutatorBgSprite.userData.config = mutatorBgConfig;

            // Store config in userData for capsule sprite (same technique as cup)
            mutatorCapsuleSprite.userData = mutatorCapsuleSprite.userData || {};
            mutatorCapsuleSprite.userData.config = mutatorCapsuleConfig;

            // Add hue-shifting animation to both mutator background and capsule
            const { ColorMatrixFilter } = PIXI;
            const bgHueFilter = new ColorMatrixFilter();
            const capsuleHueFilter = new ColorMatrixFilter();

            // Ensure filters are enabled
            mutatorBgSprite.filters = [bgHueFilter];
            mutatorCapsuleSprite.filters = [capsuleHueFilter];

            // Make sure sprites are visible
            // Sprites are hidden initially, will be shown after resizeBackground
            // mutatorBgSprite.visible = true;
            // mutatorCapsuleSprite.visible = true;

            // Shared hue rotation for both (same speed)
            let hueRotation = 0;
            const hueSpeed = 0.5;

            // Create hue animation function
            const animateHue = () => {
                if (mutatorBgSprite && mutatorBgSprite.filters && mutatorBgSprite.filters[0] &&
                    mutatorCapsuleSprite && mutatorCapsuleSprite.filters && mutatorCapsuleSprite.filters[0]) {
                    hueRotation += hueSpeed;
                    if (hueRotation >= 360) {
                        hueRotation -= 360;
                    }
                    // Apply same hue rotation to both filters
                    // Reset filter first, then apply hue
                    bgHueFilter.reset();
                    bgHueFilter.hue(hueRotation, false);

                    capsuleHueFilter.reset();
                    capsuleHueFilter.hue(hueRotation, false);

                    // Apply same hue rotation to eye logo if it exists
                    if (eyeLogoSprite && eyeLogoSprite.filters && eyeLogoSprite.filters[0]) {
                        eyeLogoSprite.filters[0].reset();
                        eyeLogoSprite.filters[0].hue(hueRotation, false);
                    }
                }
            };

            // Add hue animation to ticker
            app.ticker.add(animateHue);

            console.log('Hue animation setup:', {
                bgFilter: bgHueFilter ? 'OK' : 'MISSING',
                capsuleFilter: capsuleHueFilter ? 'OK' : 'MISSING',
                bgSpriteVisible: mutatorBgSprite ? mutatorBgSprite.visible : false,
                capsuleSpriteVisible: mutatorCapsuleSprite ? mutatorCapsuleSprite.visible : false,
                bgFilters: mutatorBgSprite ? mutatorBgSprite.filters : null,
                capsuleFilters: mutatorCapsuleSprite ? mutatorCapsuleSprite.filters : null
            });

            // Create stroke overlay sprite (same config as capsule, positioned on top)
            mutatorCapsuleStrokeSprite = new Sprite(mutatorCapsuleStrokeTexture);
            mutatorCapsuleStrokeSprite.anchor.set(0.5);
            mutatorCapsuleStrokeSprite.visible = false; // Hidden by default, shown on hover
            mutatorCapsuleStrokeSprite.alpha = 1.0;

            // Store config in userData for stroke sprite (same config as capsule)
            mutatorCapsuleStrokeSprite.userData = mutatorCapsuleStrokeSprite.userData || {};
            mutatorCapsuleStrokeSprite.userData.config = mutatorCapsuleConfig;

            // Hide sprites initially until resizeBackground positions them correctly
            mutatorBgSprite.visible = false;
            mutatorCapsuleSprite.visible = false;
            mutatorCapsuleStrokeSprite.visible = false;

            // Add background first (behind), then capsule, then stroke overlay (on top)
            // IMPORTANT: Add mutator sprites AFTER background so they render on top
            app.stage.addChild(mutatorBgSprite);
            app.stage.addChild(mutatorCapsuleSprite);
            app.stage.addChild(mutatorCapsuleStrokeSprite); // Stroke on top of capsule

            // Set initial position (will be updated by resizeBackground, same technique as cup)
            mutatorCapsuleSprite.x = app.screen.width / 2;
            mutatorCapsuleSprite.y = app.screen.height / 2;
            mutatorCapsuleStrokeSprite.x = app.screen.width / 2;
            mutatorCapsuleStrokeSprite.y = app.screen.height / 2;

            // Make capsule interactive for glitch effect on hover
            mutatorCapsuleSprite.eventMode = 'static'; // Static mode - can handle pointer events
            mutatorCapsuleSprite.cursor = 'pointer'; // Show pointer cursor on hover

            // Function to apply instant speed
            const updateCapsuleSpeed = () => {
                if (!mutatorCapsuleSprite || !mutatorCapsuleSprite.userData) return;

                const data = mutatorCapsuleSprite.userData;

                // INSTANT maximum speed when hovering (glitch effect)
                const speedMultiplier = 5.0; // Increased for more dramatic glitch effect (was 3.0)
                const targetSpeed = data.baseAnimationSpeed * speedMultiplier;

                // INSTANT speed change (no interpolation)
                data.currentAnimationSpeed = targetSpeed;
                mutatorCapsuleSprite.animationSpeed = targetSpeed;
            };

            // Glitch effect on hover - speed up animation when pointer enters capsule
            mutatorCapsuleSprite.on('pointerenter', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Pointer entered mutator capsule - glitch effect activated');
                if (mutatorCapsuleSprite && mutatorCapsuleSprite.userData) {
                    const data = mutatorCapsuleSprite.userData;
                    const glitchSpeedMultiplier = 5.0; // Fast glitch speed
                    const glitchSpeed = data.baseAnimationSpeed * glitchSpeedMultiplier;
                    mutatorCapsuleSprite.animationSpeed = glitchSpeed;
                    console.log('Mutator capsule animation speed increased to:', glitchSpeed);
                }
            });

            // Return to normal speed when pointer leaves capsule
            mutatorCapsuleSprite.on('pointerleave', () => {
                console.log('Pointer left mutator capsule - returning to normal speed');
                if (mutatorCapsuleSprite && mutatorCapsuleSprite.userData) {
                    const data = mutatorCapsuleSprite.userData;
                    mutatorCapsuleSprite.animationSpeed = data.baseAnimationSpeed;
                    console.log('Mutator capsule animation speed returned to:', data.baseAnimationSpeed);
                }
            });

            // Only the dot triggers the redirect - not the entire capsule sprite
            // Click handler will be added to mutatorCapsuleDot after it's created

            // Function to calculate responsive dot radius based on screen size
            const getResponsiveDotRadius = () => {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const minDimension = Math.min(screenWidth, screenHeight);

                // Base size for large screens (desktop) - smaller default
                let baseRadius = 4;

                // Responsive scaling based on screen size
                if (minDimension <= 768) {
                    // Mobile phones - smallest
                    baseRadius = 2.5;
                } else if (minDimension <= 1024) {
                    // Tablets - small
                    baseRadius = 3;
                } else if (minDimension <= 1440) {
                    // Small laptops - medium
                    baseRadius = 3.5;
                }
                // Desktop (larger) uses baseRadius = 4

                return baseRadius;
            };

            // Create pulsing dot at center of mutator capsule (wave-like animation)
            mutatorCapsuleDot = new Graphics();
            const dotColor = 0xFFFFFF; // White dot

            // Pulsing animation variables
            mutatorCapsuleDot.userData = mutatorCapsuleDot.userData || {};
            mutatorCapsuleDot.userData.pulseTime = 0;
            mutatorCapsuleDot.userData.baseRadius = getResponsiveDotRadius();

            // Function to update dot size (call on resize)
            const updateDotSize = () => {
                mutatorCapsuleDot.userData.baseRadius = getResponsiveDotRadius();
                // Update hit area when dot size changes
                const maxHitRadius = mutatorCapsuleDot.userData.baseRadius + 30; // Account for pulse waves
                mutatorCapsuleDot.hitArea = new PIXI.Circle(0, 0, maxHitRadius);
            };

            // Draw initial dot
            mutatorCapsuleDot.circle(0, 0, mutatorCapsuleDot.userData.baseRadius);
            mutatorCapsuleDot.fill({ color: dotColor, alpha: 0.9 });
            // Hide dot initially until resizeBackground positions it correctly
            mutatorCapsuleDot.visible = false;
            mutatorCapsuleDot.eventMode = 'static';
            mutatorCapsuleDot.cursor = 'pointer';

            // Set hit area for proper cursor interaction (even when graphics are cleared/redrawn)
            // Use a larger hit area to account for pulsing waves
            const maxHitRadius = mutatorCapsuleDot.userData.baseRadius + 30; // Account for pulse waves
            mutatorCapsuleDot.hitArea = new PIXI.Circle(0, 0, maxHitRadius);

            // Create audio for mutator dot hover effect
            mutatorDotSound = new Audio('assets/sounds/mutator.mp3');
            mutatorDotSound.loop = true; // Loop the sound while hovering
            // Start unmuted - will sync after user interaction
            mutatorDotSound.muted = false;
            let isMutatorSoundPlaying = false; // Track if sound is currently playing

            // Enhanced smooth pulsing animation (nicer wave effect)
            app.ticker.add(() => {
                if (mutatorCapsuleDot && mutatorCapsuleDot.visible && mutatorCapsuleDot.parent) {
                    mutatorCapsuleDot.userData.pulseTime += 0.025; // Smooth, gentle pulse speed

                    // Additional null check before clearing to prevent errors
                    if (mutatorCapsuleDot && typeof mutatorCapsuleDot.clear === 'function') {
                        mutatorCapsuleDot.clear();
                    }

                    const baseRadius = mutatorCapsuleDot.userData.baseRadius;

                    // Create multiple smooth ripple waves for enhanced effect
                    const numWaves = 4; // More waves for smoother effect
                    for (let i = 0; i < numWaves; i++) {
                        // Smoother wave calculation using easing
                        const wavePhase = mutatorCapsuleDot.userData.pulseTime + (i * (Math.PI * 2 / numWaves));

                        // Use smoother sine wave with adjusted amplitude
                        const waveSize = Math.sin(wavePhase);

                        // Smoother wave expansion - more gradual
                        const waveExpansion = 8 + (i * 1.5); // Smaller expansion for smaller dot
                        const waveRadius = baseRadius + (waveSize * waveExpansion * (1 - i * 0.25));

                        // Smoother alpha fade - more gradual
                        const baseAlpha = 0.95 - (i * 0.15); // Higher base alpha for visibility
                        const alphaVariation = Math.abs(waveSize) * 0.3; // Less variation for smoother look
                        const waveAlpha = Math.max(0, Math.min(0.95, baseAlpha - alphaVariation));

                        // Only draw if radius and alpha are valid
                        if (waveRadius > 0 && waveAlpha > 0.05) {
                            mutatorCapsuleDot.circle(0, 0, waveRadius);
                            mutatorCapsuleDot.fill({ color: dotColor, alpha: waveAlpha });
                        }
                    }
                }
            });

            // Update dot size on window resize
            window.addEventListener('resize', () => {
                updateDotSize();
            });

            // Create circle with "click to explore" text (hidden by default)
            mutatorCapsuleCircleText = new Container();

            // Create circle background - smaller circle, no border
            const circleBg = new Graphics();
            const circleRadius = 70; // Smaller circle (reduced from 120)
            circleBg.circle(0, 0, circleRadius);
            circleBg.fill({ color: 0xFFFFFF, alpha: 0.1 }); // Semi-transparent white
            // No border/stroke - removed for simplicity

            // Create text style - simple, pure white, sans-serif, smaller, bold
            const textStyle = new TextStyle({
                fontFamily: 'sans-serif', // System sans-serif font
                fontSize: 16, // Smaller text (reduced from 24)
                fill: 0xFFFFFF, // Pure white
                align: 'center',
                fontWeight: 'bold', // Bold text for better visibility
                // No stroke, no drop shadow - simple pure white text
            });

            // Create two-line text: "Click To" on top, "Explore" below (desktop only)
            const clickTextTop = new Text({
                text: 'Click To',
                style: textStyle,
            });
            clickTextTop.anchor.set(0.5);
            clickTextTop.x = 0;
            clickTextTop.y = -8; // Position above center

            const clickTextBottom = new Text({
                text: 'Explore',
                style: textStyle,
            });
            clickTextBottom.anchor.set(0.5);
            clickTextBottom.x = 0;
            clickTextBottom.y = 8; // Position below center

            mutatorCapsuleCircleText.addChild(circleBg);
            mutatorCapsuleCircleText.addChild(clickTextTop);
            mutatorCapsuleCircleText.addChild(clickTextBottom);
            mutatorCapsuleCircleText.visible = false; // Hidden by default, only shows when dot is hovered
            mutatorCapsuleCircleText.eventMode = 'static';
            mutatorCapsuleCircleText.cursor = 'pointer';

            // Create simple label text for mobile/tablet (just "Mutator" - no "Click To")
            const mobileLabelStyle = new TextStyle({
                fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK,
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold',
            });
            mutatorCapsuleLabelText = new Text({
                text: 'Mutator',
                style: mobileLabelStyle,
            });
            mutatorCapsuleLabelText.anchor.set(0.5);
            mutatorCapsuleLabelText.visible = false; // Hidden by default, only shown on mobile/tablet
            app.stage.addChild(mutatorCapsuleLabelText);

            // Use the same responsive font size function as CCTV (will be defined before this scope)
            // We'll use getResponsiveCctvFontSize when creating the text

            // Function to create "MUTATOR" text with custom font (same as CCTV)
            const createMutatorText = async () => {
                // Wait for font to be loaded before creating text
                if (document.fonts && document.fonts.check) {
                    function checkFont(fontFamily) {
                        return document.fonts.check(`1em "${fontFamily}"`) || 
                               document.fonts.check(`1em ${fontFamily}`) ||
                               document.fonts.check(`12px "${fontFamily}"`) ||
                               document.fonts.check(`12px ${fontFamily}`);
                    }
                    
                    // Wait for fonts.ready first (ensures Google Fonts are loaded)
                    try {
                        await Promise.race([
                            document.fonts.ready,
                            new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
                        ]);
                    } catch (e) {
                        console.warn('Error waiting for fonts.ready:', e);
                    }
                    
                    let fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                    if (!fontLoaded) {
                        // Wait a bit more for font to load with more attempts
                        let attempts = 0;
                        const maxAttempts = 20; // 2 seconds
                        while (!fontLoaded && attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                            fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                            attempts++;
                        }
                    }
                    
                    if (!fontLoaded) {
                        console.warn(`${GLOBAL_FONT_FAMILY} font not detected for mutator text, but proceeding with fallback`);
                    } else {
                        console.log(`✓ ${GLOBAL_FONT_FAMILY} font confirmed loaded for mutator text`);
                    }
                }

                // Calculate responsive font size (same as CCTV - will reference the function defined later)
                // We need to define this inline since getResponsiveCctvFontSize is defined later in CCTV section
                const getResponsiveMutatorFontSize = () => {
                    const screenWidth = window.innerWidth;
                    const screenHeight = window.innerHeight;
                    const minDimension = Math.min(screenWidth, screenHeight);

                    // Large screens (desktop) - big text (same as CCTV)
                    let fontSize = 180;

                    // Responsive scaling based on screen size
                    if (minDimension <= 768) {
                        // Mobile phones - smaller
                        fontSize = 72;
                    } else if (minDimension <= 1024) {
                        // Tablets - medium
                        fontSize = 96;
                    } else if (minDimension <= 1440) {
                        // Laptops - slightly smaller
                        fontSize = 120;
                    }

                    return fontSize;
                };

                // Create "MUTATOR" text with Google Font (Zilla Slab Highlight) - same font size as CCTV
                const mutatorTextStyle = new TextStyle({
                    fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK, // Google Font with fallback
                    fontSize: getResponsiveMutatorFontSize(),
                    fill: 0xFFFFFF, // White text
                    align: 'center',
                    fontWeight: 'bold',
                });

                mutatorCapsuleTextSprite = new Text({
                    text: 'MUTATOR',
                    style: mutatorTextStyle,
                });

                mutatorCapsuleTextSprite.anchor.set(0.5); // Center the text
                mutatorCapsuleTextSprite.visible = false; // Hidden by default, shows on hover
                mutatorCapsuleTextSprite.eventMode = 'none'; // Don't block pointer events

                // Store responsive font size function and animation state in userData (same as CCTV)
                mutatorCapsuleTextSprite.userData = {
                    getResponsiveFontSize: getResponsiveMutatorFontSize,
                    startX: null, // Will be set to X: 2666.5 (same as CCTV - converted to screen coordinates)
                    startY: null, // Will be set to Y: 1630.5 (same as CCTV - converted to screen coordinates)
                    targetX: null, // Will be set to same position as CCTV
                    targetY: null, // Will be set to Y: 1600 (same as CCTV)
                    currentX: null,
                    currentY: null,
                    isAnimating: false,
                    animationSpeed: 0.09, // Speed of ATM withdrawal animation (same as CCTV)
                };

                // Add text to stage
                app.stage.addChild(mutatorCapsuleTextSprite);
            };

            // Call async function to create text with font loading
            await createMutatorText();

            // Store animation ticker reference to prevent multiple tickers
            let mutatorAnimationTicker = null;

            // Function to show text with ATM withdrawal animation (slides up from below)
            const showMutatorText = () => {
                if (!mutatorCapsuleTextSprite || !mutatorCapsuleSprite) return;

                // Remove any existing animation ticker
                if (mutatorAnimationTicker) {
                    app.ticker.remove(mutatorAnimationTicker);
                    mutatorAnimationTicker = null;
                }

                // Calculate positions for ATM card ejection effect (slides up from bottom)
                const bg1TargetX = 2666.5; // Target X position
                const bg1TargetY = 1630.5; // Final Y position (where text should end up)

                // Get current background position and scale to convert coordinates
                if (backgroundSprite) {
                    const scale = currentScale || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                    // Convert bg1 coordinates to screen coordinates
                    const normalizedTargetX = bg1TargetX / imageWidth;
                    const normalizedTargetY = bg1TargetY / imageHeight;

                    const targetScreenX = bg1Left + (normalizedTargetX * bg1DisplayedWidth);
                    const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                    // Target position (final position where text should be)
                    mutatorCapsuleTextSprite.userData.targetX = targetScreenX;
                    mutatorCapsuleTextSprite.userData.targetY = targetScreenY;

                    // Start position (text starts from bottom, slides up like ATM card ejection)
                    const cardEjectionDistance = 300; // Distance to slide up (like card coming out of ATM)
                    mutatorCapsuleTextSprite.userData.startX = targetScreenX; // Same X position
                    mutatorCapsuleTextSprite.userData.startY = targetScreenY + cardEjectionDistance; // Start below, slides up
                } else {
                    // Fallback: use center page position directly
                    mutatorCapsuleTextSprite.userData.targetX = app.screen.width / 2;
                    mutatorCapsuleTextSprite.userData.targetY = app.screen.height / 2;
                    const cardEjectionDistance = 300;
                    mutatorCapsuleTextSprite.userData.startX = mutatorCapsuleTextSprite.userData.targetX; // Same X
                    mutatorCapsuleTextSprite.userData.startY = mutatorCapsuleTextSprite.userData.targetY + cardEjectionDistance; // Start from bottom
                }

                // Reset animation state
                mutatorCapsuleTextSprite.userData.isAnimating = true;

                // Start position (text starts from bottom, slides up like ATM card ejection)
                mutatorCapsuleTextSprite.x = mutatorCapsuleTextSprite.userData.startX;
                mutatorCapsuleTextSprite.y = mutatorCapsuleTextSprite.userData.startY;
                mutatorCapsuleTextSprite.userData.currentX = mutatorCapsuleTextSprite.userData.startX;
                mutatorCapsuleTextSprite.userData.currentY = mutatorCapsuleTextSprite.userData.startY;

                // Make visible - appears when cursor is pointed (same behavior as circle)
                mutatorCapsuleTextSprite.visible = true;
                mutatorCapsuleTextSprite.alpha = 1.0;

                // Animate text sliding up from bottom (ATM card ejection effect)
                mutatorCapsuleTextSprite.userData.isAnimating = true;
                mutatorAnimationTicker = app.ticker.add(() => {
                    if (!mutatorCapsuleTextSprite || !mutatorCapsuleTextSprite.userData.isAnimating) return;

                    const data = mutatorCapsuleTextSprite.userData;
                    const distanceX = data.targetX - data.currentX;
                    const distanceY = data.targetY - data.currentY;

                    if (Math.abs(distanceX) > 0.5 || Math.abs(distanceY) > 0.5) {
                        // Continue sliding up towards target (like card coming out of ATM from bottom)
                        data.currentX += (distanceX * data.animationSpeed);
                        data.currentY += (distanceY * data.animationSpeed);
                        mutatorCapsuleTextSprite.x = data.currentX;
                        mutatorCapsuleTextSprite.y = data.currentY;
                    } else {
                        // Reached target position (card fully ejected)
                        mutatorCapsuleTextSprite.x = data.targetX;
                        mutatorCapsuleTextSprite.y = data.targetY;
                        data.currentX = data.targetX;
                        data.currentY = data.targetY;
                        data.isAnimating = false;
                        app.ticker.remove(mutatorAnimationTicker);
                        mutatorAnimationTicker = null;
                    }
                });
            };

            // Function to hide text - hide immediately when cursor leaves (like circle behavior)
            const hideMutatorText = () => {
                if (!mutatorCapsuleTextSprite) return;

                // Remove any existing animation ticker
                if (mutatorAnimationTicker) {
                    app.ticker.remove(mutatorAnimationTicker);
                    mutatorAnimationTicker = null;
                }

                // Stop any ongoing animation
                if (mutatorCapsuleTextSprite.userData) {
                    mutatorCapsuleTextSprite.userData.isAnimating = false;
                }

                // Hide text immediately when cursor is not pointed (same as circle behavior)
                mutatorCapsuleTextSprite.visible = false;
                mutatorCapsuleTextSprite.alpha = 0;
            };

            // Track global mouse position for circle following
            let lastMousePos = { x: 0, y: 0 };
            let isCircleActive = false; // Track if circle should be visible

            // Function to check if cursor is within dot's bounds
            const isCursorInDotBounds = (cursorX, cursorY) => {
                if (!mutatorCapsuleDot || !mutatorCapsuleDot.parent || !mutatorCapsuleDot.userData) {
                    return false;
                }

                // Get dot's center in global/PixiJS coordinates
                // Dot is drawn centered at 0,0 in local space, so center is at dot's position
                const dotX = mutatorCapsuleDot.x;
                const dotY = mutatorCapsuleDot.y;

                // Get current responsive base radius
                const baseRadius = mutatorCapsuleDot.userData.baseRadius || getResponsiveDotRadius();

                // Maximum effective radius from pulsing waves (baseRadius + max wave expansion)
                // With 4 waves, max expansion is approximately 8 + (3 * 1.5) = 12.5 for first wave
                // Reduced from previous 15 to match new smoother animation
                const maxWaveExpansion = 12.5;
                // Add a small tolerance for smoother interaction (scaled with dot size)
                const tolerance = baseRadius * 0.8; // Proportional tolerance
                const maxDotRadius = baseRadius + maxWaveExpansion + tolerance;

                // Calculate distance from cursor to dot center
                const dx = cursorX - dotX;
                const dy = cursorY - dotY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const inBounds = distance <= maxDotRadius;

                return inBounds;
            };

            // Offset to position text at cursor tip (above and to the right of cursor)
            const CURSOR_TIP_OFFSET_X = 12; // Offset to the right
            const CURSOR_TIP_OFFSET_Y = -25; // Offset upward (above cursor tip)

            // Function to show circle and activate effects
            const showCircle = (cursorX, cursorY) => {
                mutatorCapsuleDot.visible = false;
                mutatorCapsuleCircleText.visible = true;
                isCircleActive = true;

                // Show "MUTATOR" text animation (slides up from below) - appears when cursor is pointed
                showMutatorText();

                // Show stroke overlay instantly
                mutatorCapsuleStrokeSprite.visible = true;
                mutatorCapsuleStrokeSprite.alpha = 1.0;

                // Instant speed change
                updateCapsuleSpeed();

                // Position circle at cursor tip (offset so text appears above cursor, not covered by it)
                mutatorCapsuleCircleText.x = cursorX + CURSOR_TIP_OFFSET_X;
                mutatorCapsuleCircleText.y = cursorY + CURSOR_TIP_OFFSET_Y;

                // Position stroke overlay at capsule center (not following cursor)
                mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
            };

            // Function to hide circle and restore dot
            const hideCircle = () => {
                mutatorCapsuleCircleText.visible = false;
                mutatorCapsuleDot.visible = true;
                isCircleActive = false;

                // Hide "MUTATOR" text animation - vanishes when cursor is not pointed
                hideMutatorText();

                // Hide stroke overlay
                mutatorCapsuleStrokeSprite.visible = false;

                // Return to base speed
                if (mutatorCapsuleSprite && mutatorCapsuleSprite.userData) {
                    mutatorCapsuleSprite.userData.currentAnimationSpeed = mutatorCapsuleSprite.userData.baseAnimationSpeed;
                    mutatorCapsuleSprite.animationSpeed = mutatorCapsuleSprite.userData.baseAnimationSpeed;
                }
            };

            // Make circle clickable but remove pointerenter/pointerleave - we control visibility via bounds check only
            // Circle text should not interfere with bounds checking for visibility
            mutatorCapsuleCircleText.eventMode = 'static'; // Static for clicks only
            // No custom cursor - use default // Pointer cursor when over circle (matches canvas cursor)
            // Don't use pointerenter/pointerleave - visibility controlled by bounds check only

            // Only the dot triggers the initial show (desktop only - mobile/tablet shows label text instead)
            mutatorCapsuleDot.on('pointerenter', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return;
                }

                const globalPos = event.global;
                lastMousePos.x = globalPos.x;
                lastMousePos.y = globalPos.y;

                // Only show if within bounds (double check)
                if (isCursorInDotBounds(globalPos.x, globalPos.y)) {
                    showCircle(globalPos.x, globalPos.y);
                    console.log('Dot vanished, showing click to explore');
                }
            });

            // Track global mouse position and check if within dot bounds
            // Use document mousemove to ensure we track cursor everywhere, not just over PixiJS objects
            const updateCircleBasedOnBounds = (mouseX, mouseY) => {
                lastMousePos.x = mouseX;
                lastMousePos.y = mouseY;

                // Always check if cursor is within dot's bounds
                const inBounds = isCursorInDotBounds(mouseX, mouseY);

                // Let PixiJS handle all cursor management automatically via sprite.cursor properties
                // No manual cursor management needed - PixiJS will automatically change cursor
                // to 'pointer' when hovering over sprites with cursor = 'pointer' set

                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return; // Skip circle text logic on mobile/tablet
                }

                if (inBounds) {
                    // Cursor is within dot bounds - show/hold circle and follow cursor
                    // Sync mute state with global audio (update even if already playing)
                    if (mutatorDotSound) {
                        mutatorDotSound.muted = isGlobalAudioMuted();
                    }
                    
                    // Play mutator sound if not already playing and global audio is not muted
                    if (mutatorDotSound && !isMutatorSoundPlaying && !isGlobalAudioMuted()) {
                        mutatorDotSound.play().catch((error) => {
                            console.error('Error playing mutator dot sound:', error);
                        });
                        isMutatorSoundPlaying = true;
                    }
                    
                    if (!isCircleActive) {
                        showCircle(mouseX, mouseY);
                        console.log('Circle activated - cursor in dot bounds');
                    } else {
                        // Update circle position to follow cursor tip (offset above cursor)
                        mutatorCapsuleCircleText.x = mouseX + CURSOR_TIP_OFFSET_X;
                        mutatorCapsuleCircleText.y = mouseY + CURSOR_TIP_OFFSET_Y;

                        // Keep stroke overlay at capsule center (not following cursor)
                if (mutatorCapsuleStrokeSprite && mutatorCapsuleStrokeSprite.visible) {
                    mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                    mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                }

                        // Keep speed up while circle is active
                        updateCapsuleSpeed();
                    }
                } else {
                    // Cursor left dot bounds - hide circle and show dot
                    // Stop mutator sound if playing
                    if (mutatorDotSound && isMutatorSoundPlaying) {
                        mutatorDotSound.pause();
                        mutatorDotSound.currentTime = 0; // Reset to beginning for instant stop
                        isMutatorSoundPlaying = false;
                    }
                    
                    if (isCircleActive) {
                        hideCircle();
                        console.log('Click to explore hidden, showing dot - cursor outside bounds');
                    }
                }
            };

            // Track mouse on canvas and document level
            app.stage.eventMode = 'passive'; // Passive mode won't interfere with panning
            app.stage.on('globalpointermove', (event) => {
                updateCircleBasedOnBounds(event.global.x, event.global.y);
            });

            // Also use document mousemove to track even when outside PixiJS objects
            const canvasMouseMoveHandler = (event) => {
                if (!app.canvas) return;
                const rect = app.canvas.getBoundingClientRect();

                // Convert DOM coordinates to PixiJS coordinates
                // Account for device pixel ratio and canvas scaling
                const scaleX = app.canvas.width / app.canvas.clientWidth;
                const scaleY = app.canvas.height / app.canvas.clientHeight;

                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                updateCircleBasedOnBounds(mouseX, mouseY);
            };

            document.addEventListener('mousemove', canvasMouseMoveHandler);

            // Update circle position in ticker - continuously check bounds every frame
            const circleTickerHandler = app.ticker.add(() => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return; // Skip circle text logic on mobile/tablet
                }

                // Always check bounds every frame, regardless of circle visibility state
                const inBounds = isCursorInDotBounds(lastMousePos.x, lastMousePos.y);

                // Let PixiJS handle all cursor management automatically via sprite.cursor properties
                // No manual cursor management needed - PixiJS will automatically change cursor
                // to 'pointer' when hovering over sprites with cursor = 'pointer' set

                if (inBounds) {
                    // Sync mute state with global audio (update even if already playing)
                    if (mutatorDotSound) {
                        mutatorDotSound.muted = isGlobalAudioMuted();
                    }
                    
                    // Play mutator sound if not already playing and global audio is not muted
                    if (mutatorDotSound && !isMutatorSoundPlaying && !isGlobalAudioMuted()) {
                        mutatorDotSound.play().catch((error) => {
                            console.error('Error playing mutator dot sound:', error);
                        });
                        isMutatorSoundPlaying = true;
                    }
                    
                    // IMPORTANT: When circle is active, always keep cursor as pointer
                    if (isCircleActive && mutatorCapsuleCircleText && mutatorCapsuleCircleText.visible) {
                        // Update circle position to follow cursor tip (offset above cursor)
                        mutatorCapsuleCircleText.x = lastMousePos.x + CURSOR_TIP_OFFSET_X;
                        mutatorCapsuleCircleText.y = lastMousePos.y + CURSOR_TIP_OFFSET_Y;

                        // Keep stroke overlay at capsule center (not following cursor)
                        if (mutatorCapsuleStrokeSprite && mutatorCapsuleStrokeSprite.visible) {
                            mutatorCapsuleStrokeSprite.x = mutatorCapsuleSprite.x;
                            mutatorCapsuleStrokeSprite.y = mutatorCapsuleSprite.y;
                        }

                        // Keep speed up while circle is active
                        updateCapsuleSpeed();
                    } else if (!isCircleActive) {
                        // Cursor is in bounds but circle not active - show it
                        showCircle(lastMousePos.x, lastMousePos.y);
                        console.log('Circle activated from ticker - cursor in dot bounds');
                    }
                } else {
                    // Cursor is outside bounds - stop mutator sound if playing
                    if (mutatorDotSound && isMutatorSoundPlaying) {
                        mutatorDotSound.pause();
                        mutatorDotSound.currentTime = 0; // Reset to beginning for instant stop
                        isMutatorSoundPlaying = false;
                    }
                    
                    // Also sync mute state when cursor leaves (in case global audio was toggled while playing)
                    if (mutatorDotSound) {
                        mutatorDotSound.muted = isGlobalAudioMuted();
                    }
                    
                    // Cursor is outside bounds - hide circle if active
                    if (isCircleActive) {
                        hideCircle();
                        console.log('Circle hidden from ticker - cursor outside bounds');
                    }
                }
            });

            // Make circle text clickable too (same as capsule)
            mutatorCapsuleCircleText.on('pointertap', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Circle text clicked - redirecting instantly to https://prometheans.talis.art/');
                const redirectURL = 'https://prometheans.talis.art/';
                
                // Open window immediately (synchronously) when user clicks - this prevents popup blocker
                const newWindow = window.open(redirectURL, '_blank');
                
                if (!newWindow) {
                    // Popup was blocked - show error message
                    alert('Please allow popups for this site to open the link.');
                }
            });

            // Add dot and circle text to stage (on top of capsule)
            app.stage.addChild(mutatorCapsuleDot);
            app.stage.addChild(mutatorCapsuleCircleText);

            // Position at center of capsule (will be updated in resizeBackground)
            mutatorCapsuleDot.x = mutatorCapsuleSprite.x;
            mutatorCapsuleDot.y = mutatorCapsuleSprite.y;
            mutatorCapsuleCircleText.x = mutatorCapsuleSprite.x;
            mutatorCapsuleCircleText.y = mutatorCapsuleSprite.y;

            // Click handler on dot only - redirects to link instantly (works on both desktop and mobile/tablet)
            mutatorCapsuleDot.on('pointertap', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Mutator capsule dot clicked - redirecting instantly to https://prometheans.talis.art/');
                const redirectURL = 'https://prometheans.talis.art/';
                
                // Open window immediately (synchronously) when user clicks - this prevents popup blocker
                // Must be called directly in the click handler, not in a callback
                const newWindow = window.open(redirectURL, '_blank');
                
                if (!newWindow) {
                    // Popup was blocked - show error message
                    alert('Please allow popups for this site to open the link.');
                }
            });

            // Update when capsule size/position changes

            // DEBUG: Log capsule sprite state after resize
            resizeBackground();

            // DEBUG: Check capsule sprite state after positioning
            console.log('Capsule sprite after resizeBackground:', {
                x: mutatorCapsuleSprite.x,
                y: mutatorCapsuleSprite.y,
                scale: mutatorCapsuleSprite.scale,
                visible: mutatorCapsuleSprite.visible,
                alpha: mutatorCapsuleSprite.alpha,
                width: mutatorCapsuleSprite.width,
                height: mutatorCapsuleSprite.height,
                playing: mutatorCapsuleSprite.playing,
                currentFrame: mutatorCapsuleSprite.currentFrame
            });

        } catch (error) {
            console.error('Error loading mutator texture:', error);
        }

        // Load cup.png and make it interactive (simple button approach - matching working example)
        try {
            const cupTexture = await loadAssetWithProgress('assets/cup.png');

            // Get cup's actual dimensions
            const cupImageWidth = cupTexture.orig?.width || cupTexture.width || cupTexture.baseTexture.width;
            const cupImageHeight = cupTexture.orig?.height || cupTexture.height || cupTexture.baseTexture.height;

            console.log(`Cup texture loaded: ${cupImageWidth}x${cupImageHeight}`);
            console.log(`BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // CUP POSITIONING CONFIGURATION
            // Position on bg1.png (in pixels):
            // Left X: 3537, Right X: 3880, Top Y: 2328, Bottom Y: 2909
            // Center X: (3537 + 3880) / 2 = 3708.5
            // Center Y: (2328 + 2909) / 2 = 2618.5
            // Dimensions: width: 334 pixels, height: 582 pixels (on bg1.png)
            const cupConfig = {
                // Cup dimensions (on bg1.png coordinate space)
                cupWidth: 334,
                cupHeight: 582,

                // Position on bg1.png (center of cup)
                bg1X: 3708.5, // Center X position on bg1.png
                bg1Y: 2618.5, // Center Y position on bg1.png

                // Scale: calculated to make cup fit its designated space on bg1.png
                // Same technique as capsule and mutator background - relative to bg1's scale
                // The scale will be: (designated size on bg1) / (actual image size) * (bg1 scale)
                // But we store the relative scale factor here, which gets multiplied by bg1 scale in resizeBackground
                scale: 1.0, // Will be calculated below, then multiplied by scaleMultiplier

                // Scale multiplier: adjust this to make cup larger or smaller
                // 1.0 = calculated size, 0.5 = 50% size, 2.0 = 200% size, etc.
                // Example: 0.5 = smaller, 1.5 = larger, 2.0 = twice as big
                scaleMultiplier: 1.0, // <-- Change this value to rescale: 0.5 = smaller, 1.5 = larger

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make cup image fit into designated space on bg1.png
            // We want cup to take up cupWidth pixels on bg1
            // So: actualCupWidth * scale = cupWidth
            // Therefore: scale = cupWidth / actualCupWidth (relative to bg1's coordinate space)
            if (cupImageWidth && cupImageHeight && cupConfig.cupWidth && cupConfig.cupHeight) {
                const relativeScaleX = cupConfig.cupWidth / cupImageWidth;
                const relativeScaleY = cupConfig.cupHeight / cupImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                const calculatedScale = Math.min(relativeScaleX, relativeScaleY);

                // Apply scale multiplier to allow easy resizing
                cupConfig.scale = calculatedScale * cupConfig.scaleMultiplier;
            } else {
                // Fallback: use natural size with multiplier
                cupConfig.scale = 1.0 * cupConfig.scaleMultiplier;
            }

            console.log(`Cup config:`);
            console.log(`  Cup dimensions on bg1.png: ${cupConfig.cupWidth}x${cupConfig.cupHeight}`);
            console.log(`  BG1 position (center): (${cupConfig.bg1X}, ${cupConfig.bg1Y})`);
            console.log(`  Actual cup image size: ${cupImageWidth}x${cupImageHeight}`);
            console.log(`  Calculated scale: ${cupConfig.scale}`);
            console.log(`  BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Calculate normalized position to check if it's valid
            const normalizedCupX = cupConfig.bg1X / imageWidth;
            const normalizedCupY = cupConfig.bg1Y / imageHeight;
            console.log(`  Normalized position: (${normalizedCupX}, ${normalizedCupY})`);

            // Warn if coordinates seem wrong
            if (normalizedCupX < 0 || normalizedCupX > 1 || normalizedCupY < 0 || normalizedCupY > 1) {
                console.warn(`⚠️ WARNING: Cup position is outside bg1.png bounds!`);
            }
            if (cupConfig.scale < 0.001) {
                console.warn(`⚠️ WARNING: Cup scale is very small (${cupConfig.scale}), it might be invisible!`);
            }

            // Create sprite exactly like the working example
            cupSprite = new Sprite(cupTexture);
            cupSprite.anchor.set(0.5); // Keep anchor at center for correct positioning

            // Load cup move sound effect
            cupMoveSound = new Audio('assets/sounds/book_move.mp3');
            cupMoveSound.volume = 0.6; // Set volume (60%)
            cupMoveSound.preload = 'auto';
            // Start unmuted - will sync after user interaction
            cupMoveSound.muted = false;
            
            // Handle audio errors
            cupMoveSound.addEventListener('error', (e) => {
                console.warn('Could not load cup move sound:', e);
            });

            // Store config in userData for use in resizeBackground
            cupSprite.userData = cupSprite.userData || {};
            cupSprite.userData.config = cupConfig;
            cupSprite.userData.mouseX = 0;
            cupSprite.userData.mouseY = 0;
            cupSprite.userData.currentTilt = 0;
            cupSprite.userData.isOverCup = false;

            // Click animation state
            cupSprite.userData.originalX = 0;
            cupSprite.userData.originalY = 0;
            cupSprite.userData.isAnimating = false;
            cupSprite.userData.animationTime = 0;
            cupSprite.userData.animationDuration = 0;

            // Hide sprite initially until resizeBackground positions it correctly
            cupSprite.visible = false;
            cupSprite.alpha = 1.0;

            // Set initial position (will be updated by resizeBackground)
            cupSprite.x = app.screen.width / 2;
            cupSprite.y = app.screen.height / 2;

            // Add to stage FIRST (like the working example)
            app.stage.addChild(cupSprite);

            // THEN set interactivity (like the working example)
            cupSprite.eventMode = 'static';
            cupSprite.cursor = 'pointer';

            // Simple pointer events - hop animation on hover
            cupSprite.on('pointerenter', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                cupSprite.userData.isOverCup = true;
                console.log('Pointer entered cup - starting hop animation');

                // Play cup move sound effect
                // Play regardless of bg music mute state (sounds start unmuted)
                if (cupMoveSound) {
                    // Reset to start and play
                    cupMoveSound.currentTime = 0;
                    cupMoveSound.play().catch((error) => {
                        console.warn('Could not play cup move sound:', error);
                    });
                }

                // Trigger hop animation when cursor enters
                if (!cupSprite.userData.isAnimating) {
                    // Store original position
                    cupSprite.userData.originalX = cupSprite.x;
                    cupSprite.userData.originalY = cupSprite.y;
                    cupSprite.userData.isAnimating = true;
                    cupSprite.userData.animationTime = 0;
                    cupSprite.userData.animationDuration = 0.6; // Shorter duration for hover hop
                    lastCupAnimationTime = Date.now();
                }
            });

            cupSprite.on('pointerleave', (event) => {
                cupSprite.userData.isOverCup = false;
                console.log('Pointer left cup');
            });

            // Easing function for smooth animation (ease-out quad)
            const easeOutQuad = (t) => {
                return 1 - (1 - t) * (1 - t);
            };

            // Easing function for bounce effect (ease-out bounce)
            const easeOutBounce = (t) => {
                if (t < 1 / 2.75) {
                    return 7.5625 * t * t;
                } else if (t < 2 / 2.75) {
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                } else if (t < 2.5 / 2.75) {
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                }
            };

            // Animate cup hop sequence (triggered on hover)
            let lastCupAnimationTime = Date.now();

            // Keep click handler for any click actions (but no animation on click)
            cupSprite.on('pointertap', (event) => {
                console.log('Cup clicked!');
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // Cup is still clickable, but hop animation only happens on hover
            });
            
            // Enable audio on hover as well
            cupSprite.on('pointerenter', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
            });

            app.ticker.add(() => {
                if (cupSprite && cupSprite.userData) {
                    const data = cupSprite.userData;

                    // Handle click animation sequence
                    if (data.isAnimating) {
                        const now = Date.now();
                        const deltaSeconds = (now - lastCupAnimationTime) / 1000; // Convert to seconds
                        lastCupAnimationTime = now;
                        data.animationTime += deltaSeconds;

                        const progress = Math.min(1, data.animationTime / data.animationDuration);

                        // Wiggle animation (like a cup being poked) - no hopping, just rotation wobble
                        const maxTilt = 8; // Maximum tilt angle in degrees (left/right wobble)

                        // Calculate wobble rotation (oscillates left and right)
                        // Use sine wave for smooth left-right wobble that fades out
                        const wobbleFrequency = 8; // How many wobbles during the animation
                        // Fade out the wobble as animation progresses (ease out)
                        const fadeOut = 1 - Math.pow(progress, 2); // Ease out curve
                        const wobbleAmount = Math.sin(progress * Math.PI * wobbleFrequency) * maxTilt * fadeOut;
                        const targetRotation = (wobbleAmount * Math.PI) / 180; // Convert to radians

                        // Keep position fixed - no hopping
                        // Recalculate position from config to ensure cup stays in correct position
                        // even if background moved during animation
                        if (cupSprite.userData && cupSprite.userData.config && backgroundSprite) {
                            const cupConfig = cupSprite.userData.config;
                            const imageWidth = backgroundSprite.texture?.width || 1920;
                            const imageHeight = backgroundSprite.texture?.height || 1080;
                            const scale = backgroundSprite.scale?.x || 1.0;

                            const bg1DisplayedWidth = imageWidth * scale;
                            const bg1DisplayedHeight = imageHeight * scale;

                            const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                            const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                            const normalizedX = cupConfig.bg1X / imageWidth;
                            const normalizedY = cupConfig.bg1Y / imageHeight;

                            cupSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cupConfig.offsetX;
                            cupSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cupConfig.offsetY;

                            // Update originalX/Y to match current position
                            data.originalX = cupSprite.x;
                            data.originalY = cupSprite.y;
                        } else {
                            // Fallback to stored position if config not available
                            cupSprite.x = data.originalX;
                            cupSprite.y = data.originalY;
                        }

                        // Apply wobble rotation (anchor point stays fixed, cup tilts)
                        const rotationSpeed = 0.4;
                        const rotationDiff = targetRotation - cupSprite.rotation;
                        cupSprite.rotation += rotationDiff * rotationSpeed;

                        // Animation complete
                        if (progress >= 1) {
                            data.isAnimating = false;
                            // Recalculate final position from config
                            if (cupSprite.userData && cupSprite.userData.config && backgroundSprite) {
                                const cupConfig = cupSprite.userData.config;
                                const imageWidth = backgroundSprite.texture?.width || 1920;
                                const imageHeight = backgroundSprite.texture?.height || 1080;
                                const scale = backgroundSprite.scale?.x || 1.0;

                                const bg1DisplayedWidth = imageWidth * scale;
                                const bg1DisplayedHeight = imageHeight * scale;

                                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                                const normalizedX = cupConfig.bg1X / imageWidth;
                                const normalizedY = cupConfig.bg1Y / imageHeight;

                                cupSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + cupConfig.offsetX;
                                cupSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + cupConfig.offsetY;
                                data.originalX = cupSprite.x;
                                data.originalY = cupSprite.y;
                            } else {
                                cupSprite.x = data.originalX;
                                cupSprite.y = data.originalY;
                            }
                            cupSprite.rotation = 0; // Reset rotation
                        }
                    }

                    // Reset rotation when not animating
                    if (!data.isAnimating) {
                        // Smoothly return rotation to 0 if animation just ended
                        const rotationDiff = 0 - cupSprite.rotation;
                        cupSprite.rotation += rotationDiff * 0.2; // Smooth return to center
                        if (Math.abs(cupSprite.rotation) < 0.001) {
                            cupSprite.rotation = 0;
                        }
                    }
                }
            });

            // Call resizeBackground to position cup correctly (after it's already added to stage)
            resizeBackground();

            console.log('Cup sprite with hover animation added successfully');

        } catch (error) {
            console.error('Error loading cup texture:', error);
        }

        // Load glitch animated frames (glitch0000.png to glitch0005.png - 6 frames total)
        try {
            console.log('Loading glitch frames...');
            const glitchTextures = [];

            // Load all 6 frames (0000 to 0005)
            for (let i = 0; i < 6; i++) {
                const frameNum = i.toString().padStart(4, '0'); // Pad to 4 digits: 0000, 0001, etc.
                const texture = await loadAssetWithProgress(`assets/glitch${frameNum}.png`);
                glitchTextures.push(texture);
            }

            console.log(`  Loaded all ${glitchTextures.length} glitch frames`);

            // Create AnimatedSprite from the glitch textures
            glitchSprite = new AnimatedSprite(glitchTextures);
            glitchSprite.anchor.set(0.5);

            // Configure glitch animation settings
            glitchSprite.animationSpeed = 0.3; // Speed of animation (0.3 = 30% of ticker speed, adjust as needed)
            glitchSprite.loop = true; // Loop the animation continuously

            // Hide sprite initially until resizeBackground positions it correctly
            glitchSprite.visible = false;
            glitchSprite.alpha = 1.0;

            // Start animation playing continuously (normal state)
            glitchSprite.play(); // Animation plays continuously by default

            console.log('Glitch AnimatedSprite created:', {
                textures: glitchTextures.length,
                playing: glitchSprite.playing,
                loop: glitchSprite.loop,
                animationSpeed: glitchSprite.animationSpeed,
                currentFrame: glitchSprite.currentFrame
            });

            // Get glitch dimensions (use first frame as reference) - same technique as capsule
            const glitchImageWidth = glitchTextures[0].orig?.width || glitchTextures[0].width || glitchTextures[0].baseTexture.width;
            const glitchImageHeight = glitchTextures[0].orig?.height || glitchTextures[0].height || glitchTextures[0].baseTexture.height;

            console.log(`Glitch texture loaded: ${glitchImageWidth}x${glitchImageHeight}`);
            console.log(`BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Glitch positioning and sizing config - same technique as capsule and cup
            // Position on bg1.png (in pixels):
            // Left X: 3512, Right X: 3833, Top Y: 1352, Bottom Y: 1610
            // Center X: (3512 + 3833) / 2 = 3672.5
            // Center Y: (1352 + 1610) / 2 = 1481
            // Dimensions: width: 322 pixels, height: 358 pixels (on bg1.png)
            const glitchConfig = {
                // Glitch dimensions (on bg1.png coordinate space)
                glitchWidth: 322,
                glitchHeight: 358,

                // Position on bg1.png (center of glitch)
                bg1X: 3672.5, // Center X position on bg1.png
                bg1Y: 1481, // Center Y position on bg1.png

                // Scale: calculated to make glitch fit its designated space on bg1.png
                // Same technique as capsule and cup - relative to bg1's scale
                // The scale will be: (designated size on bg1) / (actual image size) * (bg1 scale)
                // But we store the relative scale factor here, which gets multiplied by bg1 scale in resizeBackground
                scale: 1.0, // Will be calculated below, then multiplied by scaleMultiplier

                // Scale multiplier: adjust this to make glitch larger or smaller
                // 1.0 = calculated size, 0.5 = 50% size, 2.0 = 200% size, etc.
                // Example: 0.5 = smaller, 1.5 = larger, 2.0 = twice as big
                scaleMultiplier: 1.0, // <-- Change this value to rescale: 0.5 = smaller, 1.5 = larger

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make glitch image fit into designated space on bg1.png
            // We want glitch to take up glitchWidth pixels on bg1
            // So: actualGlitchWidth * scale = glitchWidth
            // Therefore: scale = glitchWidth / actualGlitchWidth (relative to bg1's coordinate space)
            if (glitchImageWidth && glitchImageHeight && glitchConfig.glitchWidth && glitchConfig.glitchHeight) {
                const relativeScaleX = glitchConfig.glitchWidth / glitchImageWidth;
                const relativeScaleY = glitchConfig.glitchHeight / glitchImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                const calculatedScale = Math.min(relativeScaleX, relativeScaleY);

                // Apply scale multiplier to allow easy resizing
                glitchConfig.scale = calculatedScale * glitchConfig.scaleMultiplier;
            } else {
                // Fallback: use natural size with multiplier
                glitchConfig.scale = 1.0 * glitchConfig.scaleMultiplier;
            }

            console.log(`Glitch config:`);
            console.log(`  Glitch dimensions on bg1.png: ${glitchConfig.glitchWidth}x${glitchConfig.glitchHeight}`);
            console.log(`  BG1 position (center): (${glitchConfig.bg1X}, ${glitchConfig.bg1Y})`);
            console.log(`  Actual glitch image size: ${glitchImageWidth}x${glitchImageHeight}`);
            console.log(`  Calculated scale: ${glitchConfig.scale}`);
            console.log(`  BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Calculate normalized position to check if it's valid
            const normalizedGlitchX = glitchConfig.bg1X / imageWidth;
            const normalizedGlitchY = glitchConfig.bg1Y / imageHeight;
            console.log(`  Normalized position: (${normalizedGlitchX}, ${normalizedGlitchY})`);

            // Warn if coordinates seem wrong
            if (normalizedGlitchX < 0 || normalizedGlitchX > 1 || normalizedGlitchY < 0 || normalizedGlitchY > 1) {
                console.warn(`⚠️ WARNING: Glitch position is outside bg1.png bounds!`);
            }
            if (glitchConfig.scale < 0.001) {
                console.warn(`⚠️ WARNING: Glitch scale is very small (${glitchConfig.scale}), it might be invisible!`);
            }

            // Store config in userData for glitch sprite (same technique as capsule and cup)
            glitchSprite.userData = glitchSprite.userData || {};
            glitchSprite.userData.config = glitchConfig;
            glitchSprite.userData.isOverGlitch = false;
            glitchSprite.userData.baseAnimationSpeed = 0.3; // Store base speed for hover effects
            glitchSprite.userData.currentAnimationSpeed = 0.3;
            glitchSprite.userData.baseScale = 1.0; // Will be set after first resizeBackground call
            glitchSprite.userData.glitchTicker = null; // Ticker for glitch effect (black screen flicker)
            glitchSprite.userData.glitchTime = 0; // Time counter for glitch effect

            // Add to stage
            app.stage.addChild(glitchSprite);

            // Set initial position (will be updated by resizeBackground)
            glitchSprite.x = app.screen.width / 2;
            glitchSprite.y = app.screen.height / 2;

            // Make glitch sprite interactive (NO COLOR EFFECTS - removed ColorMatrixFilter)
            glitchSprite.eventMode = 'static';
            glitchSprite.cursor = 'pointer';

            // Function to calculate and apply instant speed based on position
            const updateGlitchSpeed = (globalPos) => {
                if (!glitchSprite || !glitchSprite.userData) return;

                const data = glitchSprite.userData;

                // Calculate local cursor position relative to glitch sprite center
                const localPoint = glitchSprite.toLocal(globalPos);

                // Get sprite dimensions
                const texture = glitchTextures[0];
                const textureWidth = texture.orig?.width || texture.width;
                const textureHeight = texture.orig?.height || texture.height;

                const scaledWidth = textureWidth * glitchSprite.scale.x;
                const scaledHeight = textureHeight * glitchSprite.scale.y;

                // Calculate distance from center (normalized 0-1)
                const distanceX = Math.abs(localPoint.x) / (scaledWidth / 2);
                const distanceY = Math.abs(localPoint.y) / (scaledHeight / 2);
                const distanceFromCenter = Math.min(1, Math.sqrt(distanceX * distanceX + distanceY * distanceY));

                // Speed multiplier: instant max speed when hovering anywhere on the sprite
                // Use maximum speed (3.0x) instantly when pointing anywhere on the image
                const speedMultiplier = 3.0; // Maximum speed instantly
                const targetSpeed = data.baseAnimationSpeed * speedMultiplier;

                // INSTANT speed change (no interpolation)
                data.currentAnimationSpeed = targetSpeed;
                glitchSprite.animationSpeed = targetSpeed;
            };

            // Load glitch sound effect for glitch sprite
            glitchSpriteGlitchSound = new Audio('assets/sounds/glitch1.mp3');
            glitchSpriteGlitchSound.volume = 0.6; // Set volume (60%)
            glitchSpriteGlitchSound.preload = 'auto';
            glitchSpriteGlitchSound.loop = true; // Loop continuously while hovering
            // Start unmuted - will sync after user interaction
            glitchSpriteGlitchSound.muted = false;
            
            // Handle audio errors
            glitchSpriteGlitchSound.addEventListener('error', (e) => {
                console.warn('Could not load glitch sprite glitch sound:', e);
            });

            // Pointer events for responsive animation effect (works for mouse and touch)
            glitchSprite.on('pointerenter', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                glitchSprite.userData.isOverGlitch = true;
                const globalPos = event.global;
                updateGlitchSpeed(globalPos);

                // Start glitch effect (TV turning off/on repeatedly)
                glitchSprite.userData.glitchTime = 0;
                
                // Play glitch sound effect
                // Sound will loop continuously while hovering
                // Play regardless of bg music mute state (sounds start unmuted)
                if (glitchSpriteGlitchSound) {
                    // Only reset if not already playing to avoid interrupting the loop
                    if (glitchSpriteGlitchSound.paused) {
                        glitchSpriteGlitchSound.currentTime = 0;
                    }
                    glitchSpriteGlitchSound.play().catch((error) => {
                        console.warn('Could not play glitch sprite glitch sound:', error);
                    });
                }

                // Remove existing ticker if any
                if (glitchSprite.userData.glitchTicker) {
                    app.ticker.remove(glitchSprite.userData.glitchTicker);
                }

                // Create ticker for glitch effect (white -> black -> glitch -> repeat)
                glitchSprite.userData.glitchTicker = app.ticker.add(() => {
                    if (!glitchSprite.userData.isOverGlitch) {
                        // Stop glitch effect and return to normal
                        glitchSprite.tint = 0xFFFFFF; // Reset to normal color
                        glitchSprite.alpha = 1.0; // Reset alpha
                        app.ticker.remove(glitchSprite.userData.glitchTicker);
                        glitchSprite.userData.glitchTicker = null;
                        return;
                    }

                    glitchSprite.userData.glitchTime += 0.08; // Speed of glitch cycle

                    // Cycle through: white -> black -> glitch -> normal -> repeat
                    // Full cycle: 0-0.25 = white, 0.25-0.5 = black, 0.5-0.75 = glitch, 0.75-1.0 = normal
                    const cycle = glitchSprite.userData.glitchTime % 1.0;

                    if (cycle >= 0.0 && cycle < 0.25) {
                        // White overlay
                        glitchSprite.tint = 0xFFFFFF; // White
                        glitchSprite.alpha = 1.0;
                    } else if (cycle >= 0.25 && cycle < 0.5) {
                        // Black overlay
                        glitchSprite.tint = 0x000000; // Black
                        glitchSprite.alpha = 1.0;
                    } else if (cycle >= 0.5 && cycle < 0.75) {
                        // Glitch effect (flicker between normal and black rapidly)
                        const glitchCycle = (cycle - 0.5) * 4; // Scale to 0-1 for glitch phase
                        const flicker = Math.floor(glitchCycle * 8) % 2; // Rapid flicker
                        if (flicker === 0) {
                            glitchSprite.tint = 0xFFFFFF; // Normal
                        } else {
                            glitchSprite.tint = 0x000000; // Black
                        }
                        glitchSprite.alpha = 1.0;
                    } else {
                        // Normal (brief return to normal before cycle repeats)
                        glitchSprite.tint = 0xFFFFFF; // Normal white (no tint)
                        glitchSprite.alpha = 1.0;
                    }
                });

                console.log('Pointer entered glitch - starting glitch effect (TV on/off)');
            });

            glitchSprite.on('pointermove', (event) => {
                const globalPos = event.global;
                glitchSprite.userData.isOverGlitch = true;

                // Update speed instantly as cursor/touch moves
                updateGlitchSpeed(globalPos);
                // Ensure animation is playing while cursor moves over it
                if (!glitchSprite.playing) {
                    glitchSprite.loop = true;
                    glitchSprite.play();
                }
                // Glitch effect ticker will continue running if already started
            });

            glitchSprite.on('pointerleave', (event) => {
                glitchSprite.userData.isOverGlitch = false;

                // Stop glitch effect and return to normal color
                glitchSprite.tint = 0xFFFFFF; // Reset to normal color (no tint)
                glitchSprite.alpha = 1.0; // Reset alpha

                // Stop glitch sound immediately
                if (glitchSpriteGlitchSound) {
                    glitchSpriteGlitchSound.pause();
                    glitchSpriteGlitchSound.currentTime = 0; // Reset to start for next play
                }

                // Remove glitch ticker
                if (glitchSprite.userData.glitchTicker) {
                    app.ticker.remove(glitchSprite.userData.glitchTicker);
                    glitchSprite.userData.glitchTicker = null;
                }

                // INSTANT return to base speed (no interpolation)
                if (glitchSprite.userData) {
                    glitchSprite.userData.currentAnimationSpeed = glitchSprite.userData.baseAnimationSpeed;
                    glitchSprite.animationSpeed = glitchSprite.userData.baseAnimationSpeed;
                }
                console.log('Pointer left glitch - returning to normal');
            });

            // Also handle touch events explicitly for mobile devices
            glitchSprite.on('pointerdown', (event) => {
                // On mobile, treat touch as hover
                glitchSprite.userData.isOverGlitch = true;
                const globalPos = event.global;
                updateGlitchSpeed(globalPos);

                // Start glitch effect (same as pointerenter)
                glitchSprite.userData.glitchTime = 0;

                if (glitchSprite.userData.glitchTicker) {
                    app.ticker.remove(glitchSprite.userData.glitchTicker);
                }

                glitchSprite.userData.glitchTicker = app.ticker.add(() => {
                    if (!glitchSprite.userData.isOverGlitch) {
                        glitchSprite.tint = 0xFFFFFF;
                        glitchSprite.alpha = 1.0;
                        app.ticker.remove(glitchSprite.userData.glitchTicker);
                        glitchSprite.userData.glitchTicker = null;
                        return;
                    }

                    glitchSprite.userData.glitchTime += 0.08;
                    const cycle = glitchSprite.userData.glitchTime % 1.0;

                    if (cycle >= 0.0 && cycle < 0.25) {
                        // White overlay
                        glitchSprite.tint = 0xFFFFFF;
                        glitchSprite.alpha = 1.0;
                    } else if (cycle >= 0.25 && cycle < 0.5) {
                        // Black overlay
                        glitchSprite.tint = 0x000000;
                        glitchSprite.alpha = 1.0;
                    } else if (cycle >= 0.5 && cycle < 0.75) {
                        // Glitch effect (flicker)
                        const glitchCycle = (cycle - 0.5) * 4;
                        const flicker = Math.floor(glitchCycle * 8) % 2;
                        if (flicker === 0) {
                            glitchSprite.tint = 0xFFFFFF;
                        } else {
                            glitchSprite.tint = 0x000000;
                        }
                        glitchSprite.alpha = 1.0;
                    } else {
                        // Normal
                        glitchSprite.tint = 0xFFFFFF;
                        glitchSprite.alpha = 1.0;
                    }
                });

                console.log('Touch/click on glitch - starting glitch effect');
            });

            glitchSprite.on('pointerup', (event) => {
                // On mobile, check if pointer is still over glitch
                const globalPos = event.global;
                const bounds = glitchSprite.getBounds();

                if (globalPos.x >= bounds.x && globalPos.x <= bounds.x + bounds.width &&
                    globalPos.y >= bounds.y && globalPos.y <= bounds.y + bounds.height) {
                    // Still over glitch, keep it active
                    updateGlitchSpeed(globalPos);
                    // Ensure animation is playing
                    if (!glitchSprite.playing) {
                        glitchSprite.loop = true;
                        glitchSprite.play();
                    }
                } else {
                    // Left glitch area
                    glitchSprite.userData.isOverGlitch = false;
                    // Stop animation and return to normal
                    glitchSprite.stop();
                    glitchSprite.gotoAndStop(0);

                    if (glitchSprite.userData) {
                        glitchSprite.userData.currentAnimationSpeed = glitchSprite.userData.baseAnimationSpeed;
                        glitchSprite.animationSpeed = glitchSprite.userData.baseAnimationSpeed;
                    }
                }
            });

            // Click handler - redirect to URL in new tab
            glitchSprite.on('pointertap', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Glitch sprite clicked - redirecting to https://xion.talis.art/collection/680f65c18d37e5bcd70be0dd in new tab');
                // Open in new tab without showing loading screen (loading screen is only for same-page redirects)
                window.open('https://xion.talis.art/collection/680f65c18d37e5bcd70be0dd', '_blank');
            });

            console.log('Glitch sprite with animation added successfully (without color effects)');

        } catch (error) {
            console.error('Error loading glitch textures:', error);
        }

        // Load eye logo images and make it interactive (eye opens/closes on hover)
        try {
            console.log('Loading eye logo images...');

            // Load both eye textures
            const eyeOpenTexture = await loadAssetWithProgress('assets/eye_logo_open.png');
            const eyeClosedTexture = await loadAssetWithProgress('assets/eye_logo_closed.png');

            console.log('  Loaded eye_logo_open.png:', eyeOpenTexture.width, 'x', eyeOpenTexture.height);
            console.log('  Loaded eye_logo_closed.png:', eyeClosedTexture.width, 'x', eyeClosedTexture.height);

            // Create sprite with open eye texture initially
            eyeLogoSprite = new Sprite(eyeOpenTexture);
            eyeLogoSprite.anchor.set(0.5);

            // Get eye dimensions (use open texture as reference)
            const eyeImageWidth = eyeOpenTexture.orig?.width || eyeOpenTexture.width || eyeOpenTexture.baseTexture.width;
            const eyeImageHeight = eyeOpenTexture.orig?.height || eyeOpenTexture.height || eyeOpenTexture.baseTexture.height;

            console.log(`Eye logo texture loaded: ${eyeImageWidth}x${eyeImageHeight}`);

            // Eye logo positioning and sizing config - same technique as cup and glitch
            // Position on bg1.png (in pixels):
            // Left X: 1734, Right X: 1860, Top Y: 744, Bottom Y: 893
            // Center X: (1734 + 1860) / 2 = 1797
            // Center Y: (744 + 893) / 2 = 818.5
            // Dimensions: width: 126 pixels, height: 149 pixels (on bg1.png)
            const eyeConfig = {
                // Eye dimensions (on bg1.png coordinate space)
                eyeWidth: 126,
                eyeHeight: 149,

                // Position on bg1.png (center of eye)
                bg1X: 1797, // Center X position on bg1.png
                bg1Y: 818.5, // Center Y position on bg1.png

                // Scale: calculated to make eye fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make eye image fit into designated space on bg1.png
            if (eyeImageWidth && eyeImageHeight && eyeConfig.eyeWidth && eyeConfig.eyeHeight) {
                const relativeScaleX = eyeConfig.eyeWidth / eyeImageWidth;
                const relativeScaleY = eyeConfig.eyeHeight / eyeImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                eyeConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                eyeConfig.scale = 1.0;
            }

            console.log(`Eye logo config:`);
            console.log(`  Eye dimensions on bg1.png: ${eyeConfig.eyeWidth}x${eyeConfig.eyeHeight}`);
            console.log(`  BG1 position (center): (${eyeConfig.bg1X}, ${eyeConfig.bg1Y})`);
            console.log(`  Actual eye image size: ${eyeImageWidth}x${eyeImageHeight}`);
            console.log(`  Calculated scale: ${eyeConfig.scale}`);

            // Store textures and config in userData
            eyeLogoSprite.userData = eyeLogoSprite.userData || {};
            eyeLogoSprite.userData.config = eyeConfig;
            eyeLogoSprite.userData.openTexture = eyeOpenTexture;
            eyeLogoSprite.userData.closedTexture = eyeClosedTexture;

            // Add hue-shifting animation to eye logo (same as mutator capsule)
            const { ColorMatrixFilter } = PIXI;
            const eyeHueFilter = new ColorMatrixFilter();
            eyeLogoSprite.filters = [eyeHueFilter];

            // Hide sprite initially until resizeBackground positions it correctly
            eyeLogoSprite.visible = false;
            eyeLogoSprite.alpha = 1.0;

            // Add to stage
            app.stage.addChild(eyeLogoSprite);

            // Set initial position (will be updated by resizeBackground)
            eyeLogoSprite.x = app.screen.width / 2;
            eyeLogoSprite.y = app.screen.height / 2;

            // Make eye sprite interactive
            eyeLogoSprite.eventMode = 'static';
            eyeLogoSprite.cursor = 'pointer';

            // Pointer events to change eye texture on hover
            eyeLogoSprite.on('pointerenter', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // Change to closed eye when cursor enters
                eyeLogoSprite.texture = eyeLogoSprite.userData.closedTexture;
                console.log('Eye closed (cursor entered)');
            });

            eyeLogoSprite.on('pointerleave', () => {
                // Change back to open eye when cursor leaves
                eyeLogoSprite.texture = eyeLogoSprite.userData.openTexture;
                console.log('Eye opened (cursor left)');
            });

            // Handle touch events for mobile
            eyeLogoSprite.on('pointerdown', () => {
                // On touch, close the eye
                eyeLogoSprite.texture = eyeLogoSprite.userData.closedTexture;
            });

            eyeLogoSprite.on('pointerup', (event) => {
                // On touch release, check if still over eye
                const globalPos = event.global;
                const bounds = eyeLogoSprite.getBounds();

                if (globalPos.x >= bounds.x && globalPos.x <= bounds.x + bounds.width &&
                    globalPos.y >= bounds.y && globalPos.y <= bounds.y + bounds.height) {
                    // Still over eye, keep closed
                    eyeLogoSprite.texture = eyeLogoSprite.userData.closedTexture;
                } else {
                    // Left eye area, open it
                    eyeLogoSprite.texture = eyeLogoSprite.userData.openTexture;
                }
            });

            console.log('Eye logo sprite added successfully');

        } catch (error) {
            console.error('Error loading eye logo textures:', error);
        }

        // Load CCTV animated frames (cctv1.png to cctv3.png - 3 frames total)
        try {
            console.log('Loading CCTV frames...');
            const cctvTextures = [];

            // Load all 3 frames (cctv1.png, cctv2.png, cctv3.png)
            for (let i = 1; i <= 3; i++) {
                const texture = await loadAssetWithProgress(`assets/cctv${i}.png`);
                cctvTextures.push(texture);
                console.log(`  Loaded cctv${i}.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${cctvTextures.length} CCTV frames`);

            // Load CCTV stroke animated frames (cctv1_stroke.png to cctv3_stroke.png - 3 frames total)
            console.log('Loading CCTV stroke frames...');
            const cctvStrokeTextures = [];

            // Load all 3 stroke frames (cctv1_stroke.png, cctv2_stroke.png, cctv3_stroke.png)
            for (let i = 1; i <= 3; i++) {
                const strokeTexture = await loadAssetWithProgress(`assets/cctv${i}_stroke.png`);
                cctvStrokeTextures.push(strokeTexture);
                console.log(`  Loaded cctv${i}_stroke.png:`, strokeTexture.width, 'x', strokeTexture.height);
            }

            console.log(`  Loaded all ${cctvStrokeTextures.length} CCTV stroke frames`);

            // Create AnimatedSprite from the CCTV textures
            cctvSprite = new AnimatedSprite(cctvTextures);
            cctvSprite.anchor.set(0.5);

            // Configure CCTV animation settings
            cctvSprite.animationSpeed = 0.01; // Speed of animation (0.05 = 5% of ticker speed, very slow animation)
            cctvSprite.loop = true; // Loop the animation

            // Hide sprite initially until resizeBackground positions it correctly
            cctvSprite.visible = false;
            cctvSprite.alpha = 1.0;

            cctvSprite.play(); // Start the animation

            console.log('CCTV AnimatedSprite created:', {
                textures: cctvTextures.length,
                playing: cctvSprite.playing,
                loop: cctvSprite.loop,
                animationSpeed: cctvSprite.animationSpeed
            });

            // Create AnimatedSprite from the CCTV stroke textures
            cctvStrokeSprite = new AnimatedSprite(cctvStrokeTextures);
            cctvStrokeSprite.anchor.set(0.5);

            // Configure stroke animation settings to match CCTV
            cctvStrokeSprite.animationSpeed = 0.01; // Same speed as CCTV animation
            cctvStrokeSprite.loop = true; // Loop the animation

            // Hide stroke sprite initially until resizeBackground positions it correctly
            cctvStrokeSprite.visible = false;
            cctvStrokeSprite.alpha = 1.0;

            cctvStrokeSprite.play(); // Start the animation

            console.log('CCTV Stroke AnimatedSprite created:', {
                textures: cctvStrokeTextures.length,
                playing: cctvStrokeSprite.playing,
                loop: cctvStrokeSprite.loop,
                animationSpeed: cctvStrokeSprite.animationSpeed
            });

            // Get CCTV dimensions (use first frame as reference)
            const cctvImageWidth = cctvTextures[0].orig?.width || cctvTextures[0].width || cctvTextures[0].baseTexture.width;
            const cctvImageHeight = cctvTextures[0].orig?.height || cctvTextures[0].height || cctvTextures[0].baseTexture.height;

            console.log(`CCTV texture loaded: ${cctvImageWidth}x${cctvImageHeight}`);

            // CCTV positioning and sizing config - same technique as cup and glitch
            // Position on bg1.png (in pixels):
            // Left X: 4057, Right X: 4622, Top Y: 527, Bottom Y: 960
            // Center X: (4057 + 4622) / 2 = 4339.5
            // Center Y: (527 + 960) / 2 = 743.5
            // Dimensions: width: 566 pixels, height: 434 pixels (on bg1.png)
            const cctvConfig = {
                // CCTV dimensions (on bg1.png coordinate space)
                cctvWidth: 566,
                cctvHeight: 434,

                // Position on bg1.png (center of CCTV)
                bg1X: 4339.5, // Center X position on bg1.png
                bg1Y: 743.5, // Center Y position on bg1.png

                // Scale: calculated to make CCTV fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make CCTV image fit into designated space on bg1.png
            if (cctvImageWidth && cctvImageHeight && cctvConfig.cctvWidth && cctvConfig.cctvHeight) {
                const relativeScaleX = cctvConfig.cctvWidth / cctvImageWidth;
                const relativeScaleY = cctvConfig.cctvHeight / cctvImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                cctvConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                cctvConfig.scale = 1.0;
            }

            console.log(`CCTV config:`);
            console.log(`  CCTV dimensions on bg1.png: ${cctvConfig.cctvWidth}x${cctvConfig.cctvHeight}`);
            console.log(`  BG1 position (center): (${cctvConfig.bg1X}, ${cctvConfig.bg1Y})`);
            console.log(`  Actual CCTV image size: ${cctvImageWidth}x${cctvImageHeight}`);
            console.log(`  Calculated scale: ${cctvConfig.scale}`);

            // Store config in userData for CCTV sprite (same technique as capsule and cup)
            cctvSprite.userData = cctvSprite.userData || {};
            cctvSprite.userData.config = cctvConfig;

            // Hide sprite initially until resizeBackground positions it correctly
            cctvSprite.visible = false;
            cctvSprite.alpha = 1.0;

            // Add to stage
            app.stage.addChild(cctvSprite);

            // Set initial position (will be updated by resizeBackground)
            cctvSprite.x = app.screen.width / 2;
            cctvSprite.y = app.screen.height / 2;

            // Function to calculate responsive font size based on screen size (bigger font)
            const getResponsiveCctvFontSize = () => {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const minDimension = Math.min(screenWidth, screenHeight);

                // Large screens (desktop) - big text (increased sizes)
                let fontSize = 180;

                // Responsive scaling based on screen size
                if (minDimension <= 768) {
                    // Mobile phones - smaller
                    fontSize = 72;
                } else if (minDimension <= 1024) {
                    // Tablets - medium
                    fontSize = 96;
                } else if (minDimension <= 1440) {
                    // Small laptops - medium-large
                    fontSize = 120;
                } else if (minDimension <= 1920) {
                    // Standard desktop - large
                    fontSize = 150;
                }
                // Larger screens use fontSize = 180

                return fontSize;
            };

            // Function to calculate responsive dot radius based on screen size
            const getResponsiveCctvDotRadius = () => {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const minDimension = Math.min(screenWidth, screenHeight);

                // Base size for large screens (desktop)
                let baseRadius = 4;

                // Responsive scaling based on screen size
                if (minDimension <= 768) {
                    // Mobile phones - smallest
                    baseRadius = 2.5;
                } else if (minDimension <= 1024) {
                    // Tablets - small
                    baseRadius = 3;
                } else if (minDimension <= 1440) {
                    // Small laptops - medium
                    baseRadius = 3.5;
                }
                // Desktop (larger) uses baseRadius = 4

                return baseRadius;
            };

            // Create pulsing dot at center of CCTV (wave-like animation)
            cctvDot = new Graphics();
            const dotColor = 0xFFFFFF; // White dot

            // Pulsing animation variables
            cctvDot.userData = cctvDot.userData || {};
            cctvDot.userData.pulseTime = 0;
            cctvDot.userData.baseRadius = getResponsiveCctvDotRadius();

            // Function to update dot size (call on resize)
            const updateCctvDotSize = () => {
                cctvDot.userData.baseRadius = getResponsiveCctvDotRadius();
            };

            // Draw initial dot
            cctvDot.circle(0, 0, cctvDot.userData.baseRadius);
            cctvDot.fill({ color: dotColor, alpha: 0.9 });
            // Hide dot initially until resizeBackground positions it correctly
            cctvDot.visible = false;
            cctvDot.eventMode = 'static';
            cctvDot.cursor = 'pointer';

            // Position dot at center of CCTV sprite
            cctvDot.x = cctvSprite.x;
            cctvDot.y = cctvSprite.y;

            // Add dot to stage
            app.stage.addChild(cctvDot);

            // Store config in userData for stroke sprite (same config as CCTV)
            cctvStrokeSprite.userData = cctvStrokeSprite.userData || {};
            cctvStrokeSprite.userData.config = cctvConfig;

            // Add stroke overlay to stage (on top of CCTV sprite)
            app.stage.addChild(cctvStrokeSprite);

            // Set initial position and scale (will be updated in resizeBackground)
            cctvStrokeSprite.x = cctvSprite.x;
            cctvStrokeSprite.y = cctvSprite.y;
            cctvStrokeSprite.scale.set(cctvSprite.scale.x, cctvSprite.scale.y);

            // Sync stroke animation frames with CCTV animation frames
            // This ensures the stroke animation perfectly matches the CCTV animation frame-by-frame
            app.ticker.add(() => {
                if (cctvStrokeSprite && cctvSprite && cctvSprite.currentFrame !== undefined) {
                    // Keep stroke animation frame in sync with CCTV animation frame
                    if (cctvStrokeSprite.currentFrame !== cctvSprite.currentFrame) {
                        // Use gotoAndStop to sync frame without advancing animation
                        cctvStrokeSprite.gotoAndStop(cctvSprite.currentFrame);
                    }
                    // Also sync position and scale every frame to ensure perfect alignment
                    if (cctvStrokeSprite.visible) {
                        cctvStrokeSprite.x = cctvSprite.x;
                        cctvStrokeSprite.y = cctvSprite.y;
                        cctvStrokeSprite.scale.set(cctvSprite.scale.x, cctvSprite.scale.y);
                    }
                }
            });

            // Enhanced smooth pulsing animation (nicer wave effect)
            app.ticker.add(() => {
                if (cctvDot && cctvDot.visible && cctvDot.parent) {
                    cctvDot.userData.pulseTime += 0.025; // Smooth, gentle pulse speed

                    // Additional null check before clearing to prevent errors
                    if (cctvDot && typeof cctvDot.clear === 'function') {
                        cctvDot.clear();
                    }

                    const baseRadius = cctvDot.userData.baseRadius;

                    // Create multiple smooth ripple waves for enhanced effect
                    const numWaves = 4; // More waves for smoother effect
                    for (let i = 0; i < numWaves; i++) {
                        // Smoother wave calculation using easing
                        const wavePhase = cctvDot.userData.pulseTime + (i * (Math.PI * 2 / numWaves));

                        // Use smoother sine wave with adjusted amplitude
                        const waveSize = Math.sin(wavePhase);

                        // Smoother wave expansion - more gradual
                        const waveExpansion = 8 + (i * 1.5);
                        const waveRadius = baseRadius + (waveSize * waveExpansion * (1 - i * 0.25));

                        // Smoother alpha fade - more gradual
                        const baseAlpha = 0.95 - (i * 0.15);
                        const alphaVariation = Math.abs(waveSize) * 0.3;
                        const waveAlpha = Math.max(0, Math.min(0.95, baseAlpha - alphaVariation));

                        // Only draw if radius and alpha are valid
                        if (waveRadius > 0 && waveAlpha > 0.05) {
                            cctvDot.circle(0, 0, waveRadius);
                            cctvDot.fill({ color: dotColor, alpha: waveAlpha });
                        }
                    }
                }
            });

            // Wait for font to load before creating text (fixes font loading issue)
            const createCctvText = async () => {
                // Wait for font to be loaded before creating text
                if (document.fonts && document.fonts.check) {
                    function checkFont(fontFamily) {
                        return document.fonts.check(`1em "${fontFamily}"`) || 
                               document.fonts.check(`1em ${fontFamily}`) ||
                               document.fonts.check(`12px "${fontFamily}"`) ||
                               document.fonts.check(`12px ${fontFamily}`);
                    }
                    
                    let fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                    if (!fontLoaded) {
                        // Wait a bit more for font to load
                        let attempts = 0;
                        const maxAttempts = 10; // 1 second
                        while (!fontLoaded && attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                            fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                            attempts++;
                        }
                    if (!fontLoaded) {
                        console.warn(`${GLOBAL_FONT_FAMILY} font not detected for CCTV text, but proceeding`);
                        } else {
                            console.log(`✓ ${GLOBAL_FONT_FAMILY} font confirmed loaded for CCTV text`);
                        }
                    }
                }

                // Create "X Account" text with Google Font (Zilla Slab Highlight)
                const cctvTextStyle = new TextStyle({
                    fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK, // Google Font with fallback
                    fontSize: getResponsiveCctvFontSize(),
                    fill: 0xFFFFFF, // White text
                    align: 'center',
                    fontWeight: 'bold',
                });

                cctvTextSprite = new Text({
                    text: 'X ACCOUNT',
                    style: cctvTextStyle,
                });

                cctvTextSprite.anchor.set(0.5); // Center the text
                cctvTextSprite.visible = false; // Hidden by default, shows on hover
                cctvTextSprite.eventMode = 'none'; // Don't block pointer events

                // Store responsive font size function and animation state in userData
                cctvTextSprite.userData = {
                    getResponsiveFontSize: getResponsiveCctvFontSize,
                    startX: null, // Will be set to X: 2666.5 (converted to screen coordinates)
                    startY: null, // Will be set to Y: 1630.5 (converted to screen coordinates)
                    targetX: null, // Will be set to CCTV center X
                    targetY: null, // Will be set to CCTV center Y
                    currentX: null,
                    currentY: null,
                    isAnimating: false,
                    animationSpeed: 0.05, // Speed of ATM withdrawal animation
                };

                // Add text to stage
                app.stage.addChild(cctvTextSprite);
            };

            // Call async function to create text with font loading
            await createCctvText();
            cctvTextSprite.anchor.set(0.5); // Center the text
            cctvTextSprite.visible = false; // Hidden by default, shows on hover
            cctvTextSprite.eventMode = 'none'; // Don't block pointer events

            // Store responsive font size function and animation state in userData
            cctvTextSprite.userData = {
                getResponsiveFontSize: getResponsiveCctvFontSize,
                startX: null, // Will be set to X: 2666.5 (converted to screen coordinates)
                startY: null, // Will be set to Y: 1731.5 (converted to screen coordinates)
                targetX: null, // Will be set to CCTV center X
                targetY: null, // Will be set to CCTV center Y
                currentX: null,
                currentY: null,
                isAnimating: false,
                animationSpeed: 0.09, // Speed of ATM withdrawal animation
            };

            // Add text to stage
            app.stage.addChild(cctvTextSprite);

            // Store animation ticker reference to prevent multiple tickers
            let cctvAnimationTicker = null;

            // Function to show text with ATM withdrawal animation (slides up from below)
            const showCctvText = () => {
                if (!cctvTextSprite || !cctvSprite) return;

                // Remove any existing animation ticker
                if (cctvAnimationTicker) {
                    app.ticker.remove(cctvAnimationTicker);
                    cctvAnimationTicker = null;
                }

                // Calculate positions for ATM card ejection effect (slides up from bottom)
                const bg1TargetX = 2666.5; // Target X position
                const bg1TargetY = 1630.5; // Final Y position (same as Mutator - same level)

                // Get current background position and scale to convert coordinates
                if (backgroundSprite && cctvSprite.userData && cctvSprite.userData.config) {
                    const cctvConfig = cctvSprite.userData.config;
                    const scale = currentScale || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                    // Convert bg1 coordinates to screen coordinates
                    const normalizedTargetX = bg1TargetX / imageWidth;
                    const normalizedTargetY = bg1TargetY / imageHeight;

                    const targetScreenX = bg1Left + (normalizedTargetX * bg1DisplayedWidth);
                    const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                    // Target position (final position where text should be)
                    cctvTextSprite.userData.targetX = targetScreenX;
                    cctvTextSprite.userData.targetY = targetScreenY;

                    // Start position (text starts from bottom, slides up like ATM card ejection)
                    const cardEjectionDistance = 300; // Distance to slide up (like card coming out of ATM)
                    cctvTextSprite.userData.startX = targetScreenX; // Same X position
                    cctvTextSprite.userData.startY = targetScreenY + cardEjectionDistance; // Start below, slides up
                } else {
                    // Fallback: use center page position directly
                    cctvTextSprite.userData.targetX = app.screen.width / 2;
                    cctvTextSprite.userData.targetY = app.screen.height / 2;
                    const cardEjectionDistance = 300;
                    cctvTextSprite.userData.startX = cctvTextSprite.userData.targetX; // Same X
                    cctvTextSprite.userData.startY = cctvTextSprite.userData.targetY + cardEjectionDistance; // Start from bottom
                }

                // Reset animation state
                cctvTextSprite.userData.isAnimating = true;

                // Start position (text starts from bottom, slides up like ATM card ejection)
                cctvTextSprite.x = cctvTextSprite.userData.startX;
                cctvTextSprite.y = cctvTextSprite.userData.startY;
                cctvTextSprite.userData.currentX = cctvTextSprite.userData.startX;
                cctvTextSprite.userData.currentY = cctvTextSprite.userData.startY;

                // Make visible - appears when cursor is pointed (same behavior as circle)
                cctvTextSprite.visible = true;
                cctvTextSprite.alpha = 1.0;

                // Animate text sliding up from bottom (ATM card ejection effect)
                cctvTextSprite.userData.isAnimating = true;
                cctvAnimationTicker = app.ticker.add(() => {
                    if (!cctvTextSprite || !cctvTextSprite.userData.isAnimating) return;

                    const data = cctvTextSprite.userData;
                    const distanceX = data.targetX - data.currentX;
                    const distanceY = data.targetY - data.currentY;

                    if (Math.abs(distanceX) > 0.5 || Math.abs(distanceY) > 0.5) {
                        // Continue sliding up towards target (like card coming out of ATM from bottom)
                        data.currentX += (distanceX * data.animationSpeed);
                        data.currentY += (distanceY * data.animationSpeed);
                        cctvTextSprite.x = data.currentX;
                        cctvTextSprite.y = data.currentY;
                    } else {
                        // Reached target position (card fully ejected)
                        cctvTextSprite.x = data.targetX;
                        cctvTextSprite.y = data.targetY;
                        data.currentX = data.targetX;
                        data.currentY = data.targetY;
                        data.isAnimating = false;
                        app.ticker.remove(cctvAnimationTicker);
                        cctvAnimationTicker = null;
                    }
                });
            };

            // Function to hide text - hide immediately when cursor leaves (like circle behavior)
            const hideCctvText = () => {
                if (!cctvTextSprite) return;

                // Remove any existing animation ticker
                if (cctvAnimationTicker) {
                    app.ticker.remove(cctvAnimationTicker);
                    cctvAnimationTicker = null;
                }

                // Stop any ongoing animation
                if (cctvTextSprite.userData) {
                    cctvTextSprite.userData.isAnimating = false;
                }

                // Hide text immediately when cursor is not pointed (same as circle behavior)
                cctvTextSprite.visible = false;
                cctvTextSprite.alpha = 0;
            };

            // Create circle with "click to explore" text (hidden by default, similar to mutator capsule)
            cctvCircleText = new Container();

            // Create circle background - smaller circle, no border
            const cctvCircleBg = new Graphics();
            const cctvCircleRadius = 70; // Same as mutator capsule
            cctvCircleBg.circle(0, 0, cctvCircleRadius);
            cctvCircleBg.fill({ color: 0xFFFFFF, alpha: 0.1 }); // Semi-transparent white

            // Create text style - same as mutator capsule: simple, pure white, sans-serif, smaller, bold
            const cctvCircleTextStyle = new TextStyle({
                fontFamily: 'sans-serif', // System sans-serif font
                fontSize: 16, // Same as mutator capsule
                fill: 0xFFFFFF, // Pure white
                align: 'center',
                fontWeight: 'bold', // Bold text for better visibility
                // No stroke, no drop shadow - simple pure white text
            });

            // Create two-line text: "Click To" on top, "Explore" below (desktop only)
            const cctvClickTextTop = new Text({
                text: 'Click To',
                style: cctvCircleTextStyle,
            });
            cctvClickTextTop.anchor.set(0.5);
            cctvClickTextTop.x = 0;
            cctvClickTextTop.y = -8; // Position above center

            const cctvClickTextBottom = new Text({
                text: 'Explore',
                style: cctvCircleTextStyle,
            });
            cctvClickTextBottom.anchor.set(0.5);
            cctvClickTextBottom.x = 0;
            cctvClickTextBottom.y = 8; // Position below center

            cctvCircleText.addChild(cctvCircleBg);
            cctvCircleText.addChild(cctvClickTextTop);
            cctvCircleText.addChild(cctvClickTextBottom);
            cctvCircleText.visible = false; // Hidden by default, only shows when dot is hovered
            cctvCircleText.eventMode = 'none'; // Allow pointer events to pass through for global tracking
            cctvCircleText.cursor = 'default';

            // Add circle text to stage
            app.stage.addChild(cctvCircleText);

            // Create simple label text for mobile/tablet (just "X Account" - no "Click To")
            const cctvMobileLabelStyle = new TextStyle({
                fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK,
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold',
            });
            cctvLabelText = new Text({
                text: 'X Account',
                style: cctvMobileLabelStyle,
            });
            cctvLabelText.anchor.set(0.5);
            cctvLabelText.visible = false; // Hidden by default, only shown on mobile/tablet
            app.stage.addChild(cctvLabelText);

            // Track global mouse position for circle following
            let cctvLastMousePos = { x: 0, y: 0 };
            let cctvIsCircleActive = false;

            // Offset to position text at cursor tip (above and to the right of cursor)
            const CCTVCURSOR_TIP_OFFSET_X = 12; // Offset to the right
            const CCTVCURSOR_TIP_OFFSET_Y = -25; // Offset upward (above cursor tip)

            // Function to check if cursor is within dot's bounds
            const isCursorInCctvDotBounds = (cursorX, cursorY) => {
                if (!cctvDot || !cctvDot.parent || !cctvDot.userData) {
                    return false;
                }

                const dotX = cctvDot.x;
                const dotY = cctvDot.y;
                const baseRadius = cctvDot.userData.baseRadius || getResponsiveCctvDotRadius();
                const maxWaveExpansion = 12.5;
                const tolerance = baseRadius * 0.8;
                const maxDotRadius = baseRadius + maxWaveExpansion + tolerance;

                const dx = cursorX - dotX;
                const dy = cursorY - dotY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                return distance <= maxDotRadius;
            };

            // Function to show circle and activate effects (desktop only)
            const showCctvCircle = (cursorX, cursorY) => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return;
                }

                // Only show if not already active (prevent multiple triggers)
                if (cctvIsCircleActive) return;

                cctvDot.visible = false;
                cctvCircleText.visible = true;
                cctvIsCircleActive = true;

                // Show "X Account" text animation (slides up from below) - appears when cursor is pointed
                showCctvText();

                // Show stroke overlay (animated stroke frames around CCTV)
                if (cctvStrokeSprite) {
                    cctvStrokeSprite.visible = true;
                    cctvStrokeSprite.alpha = 1.0;
                    // Position and scale stroke to match CCTV
                    cctvStrokeSprite.x = cctvSprite.x;
                    cctvStrokeSprite.y = cctvSprite.y;
                    cctvStrokeSprite.scale.set(cctvSprite.scale.x, cctvSprite.scale.y);
                }

                // Position circle at cursor tip (offset so text appears above cursor, not covered by it)
                cctvCircleText.x = cursorX + CCTVCURSOR_TIP_OFFSET_X;
                cctvCircleText.y = cursorY + CCTVCURSOR_TIP_OFFSET_Y;
            };

            // Function to hide circle and show dot
            const hideCctvCircle = () => {
                // Only hide if currently active (prevent multiple triggers)
                if (!cctvIsCircleActive) return;

                cctvDot.visible = true;
                cctvCircleText.visible = false;
                cctvIsCircleActive = false;

                // Hide "X Account" text animation - vanishes when cursor is not pointed
                hideCctvText();

                // Hide stroke overlay
                if (cctvStrokeSprite) {
                    cctvStrokeSprite.visible = false;
                }
            };

            // Function to update circle and text based on cursor bounds
            const updateCctvCircleBasedOnBounds = (cursorX, cursorY) => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return; // Skip circle text logic on mobile/tablet
                }

                const inBounds = isCursorInCctvDotBounds(cursorX, cursorY);

                if (inBounds && !cctvIsCircleActive) {
                    // Cursor entered dot bounds - show circle and text
                    showCctvCircle(cursorX, cursorY);
                } else if (!inBounds && cctvIsCircleActive) {
                    // Cursor left dot bounds - hide circle and text immediately
                    hideCctvCircle();
                } else if (!inBounds && cctvTextSprite && cctvTextSprite.visible) {
                    // Extra safety check: if text is visible but cursor is out of bounds, hide it
                    hideCctvText();
                }

                // Let PixiJS handle cursor automatically via sprite.cursor properties
                // No manual cursor management needed
            };

            // Global mouse/touch tracking for circle following (like mutator capsule)
            // Handle mouse move (desktop)
            document.addEventListener('mousemove', (e) => {
                const rect = app.canvas.getBoundingClientRect();
                const scaleX = app.canvas.width / rect.width;
                const scaleY = app.canvas.height / rect.height;

                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                cctvLastMousePos.x = mouseX;
                cctvLastMousePos.y = mouseY;

                updateCctvCircleBasedOnBounds(mouseX, mouseY);

                // Update circle position if active
                if (cctvIsCircleActive) {
                    cctvCircleText.x = mouseX + CCTVCURSOR_TIP_OFFSET_X;
                    cctvCircleText.y = mouseY + CCTVCURSOR_TIP_OFFSET_Y;
                }
            });

            // Handle touch move (mobile) - important for responsive bounds checking
            document.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches.length > 0) {
                    const rect = app.canvas.getBoundingClientRect();
                    const scaleX = app.canvas.width / rect.width;
                    const scaleY = app.canvas.height / rect.height;

                    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
                    const touchY = (e.touches[0].clientY - rect.top) * scaleY;

                    cctvLastMousePos.x = touchX;
                    cctvLastMousePos.y = touchY;

                    // Only update if not dragging (to avoid interference with panning)
                    if (!isDragging) {
                        updateCctvCircleBasedOnBounds(touchX, touchY);

                        // Update circle position if active
                        if (cctvIsCircleActive) {
                            cctvCircleText.x = touchX + CCTVCURSOR_TIP_OFFSET_X;
                            cctvCircleText.y = touchY + CCTVCURSOR_TIP_OFFSET_Y;
                        }
                    }
                }
            }, { passive: true });

            // Stage pointer move for better tracking within canvas
            app.stage.on('globalpointermove', (e) => {
                const globalPos = e.global;
                cctvLastMousePos.x = globalPos.x;
                cctvLastMousePos.y = globalPos.y;
                updateCctvCircleBasedOnBounds(globalPos.x, globalPos.y);
            });

            // Ticker to continuously check bounds and update circle/text
            app.ticker.add(() => {
                if (cctvDot && cctvDot.parent) {
                    // Update based on cursor bounds - this controls both circle and text visibility
                    updateCctvCircleBasedOnBounds(cctvLastMousePos.x, cctvLastMousePos.y);

                    // Update circle position if active
                    if (cctvIsCircleActive) {
                        cctvCircleText.x = cctvLastMousePos.x + CCTVCURSOR_TIP_OFFSET_X;
                        cctvCircleText.y = cctvLastMousePos.y + CCTVCURSOR_TIP_OFFSET_Y;
                    }

                    // Safety check: ensure text is hidden if circle is not active
                    if (!cctvIsCircleActive && cctvTextSprite && cctvTextSprite.visible) {
                        hideCctvText();
                    }
                }
            });

            // Touch/click handlers for mobile and desktop - similar to glitch sprite
            // Handle pointerdown for better mobile touch support
            cctvDot.on('pointerdown', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // On mobile/tablet, don't show circle - just prepare for click
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    event.stopPropagation(); // Prevent panning from starting
                    return;
                }
                // On desktop, treat as hover
                const globalPos = event.global;
                showCctvCircle(globalPos.x, globalPos.y);
                event.stopPropagation(); // Prevent panning from starting
                console.log('Touch/click on CCTV dot');
            });

            // Handle pointerup to detect tap/click (works better on mobile)
            cctvDot.on('pointerup', (event) => {
                const globalPos = event.global;
                // On mobile/tablet, always redirect on tap
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    console.log('CCTV tapped (mobile/tablet) - redirecting to https://x.com/ThePrometheans_ in new tab');
                    window.open('https://x.com/ThePrometheans_', '_blank');
                    event.stopPropagation();
                    return;
                }
                // On desktop, only redirect if in bounds
                if (isCursorInCctvDotBounds(globalPos.x, globalPos.y)) {
                    console.log('CCTV tapped - redirecting to https://x.com/ThePrometheans_ in new tab');
                    window.open('https://x.com/ThePrometheans_', '_blank');
                }
                event.stopPropagation(); // Prevent panning
            });

            // Also handle pointertap as fallback
            cctvDot.on('pointertap', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // On mobile/tablet, always redirect
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    console.log('CCTV tapped (mobile/tablet) - redirecting to https://x.com/ThePrometheans_ in new tab');
                    window.open('https://x.com/ThePrometheans_', '_blank');
                    event.stopPropagation();
                    return;
                }
                // On desktop, redirect
                console.log('CCTV tapped - redirecting to https://x.com/ThePrometheans_ in new tab');
                window.open('https://x.com/ThePrometheans_', '_blank');
                event.stopPropagation(); // Prevent panning
            });

            // Also allow clicking on circle text to redirect
            cctvCircleText.eventMode = 'static';
            cctvCircleText.cursor = 'pointer';

            cctvCircleText.on('pointerdown', (event) => {
                event.stopPropagation(); // Prevent panning
            });

            cctvCircleText.on('pointerup', (event) => {
                event.stopPropagation(); // Prevent panning
            });

            cctvCircleText.on('pointertap', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('CCTV circle clicked - redirecting to https://x.com/ThePrometheans_ in new tab');
                window.open('https://x.com/ThePrometheans_', '_blank');
                event.stopPropagation(); // Prevent panning
            });

            // Hover handlers for CCTV dot
            // Note: Hover behavior is handled by updateCctvCircleBasedOnBounds() which continuously
            // monitors cursor position. Both "Click To Explore" circle and "X Account" text appear/disappear
            // together when cursor enters/leaves the dot bounds.

            // Update dot size on window resize
            window.addEventListener('resize', () => {
                updateCctvDotSize();
            });

            console.log('CCTV sprite with animation added successfully');

        } catch (error) {
            console.error('Error loading CCTV textures:', error);
        }

        // Load Discord animated frames (discord1.png to discord8.png - 8 frames total)
        try {
            console.log('Loading Discord frames...');
            const discordTextures = [];

            // Load all 8 frames (discord1.png to discord8.png)
            for (let i = 1; i <= 8; i++) {
                const texture = await loadAssetWithProgress(`assets/discord${i}.png`);
                discordTextures.push(texture);
                console.log(`  Loaded discord${i}.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${discordTextures.length} Discord frames`);

            // Create AnimatedSprite from the Discord textures
            discordSprite = new AnimatedSprite(discordTextures);
            discordSprite.anchor.set(0.5);

            // Configure Discord animation settings
            discordSprite.animationSpeed = 0.1; // Speed of animation (0.1 = 10% of ticker speed)
            discordSprite.loop = true; // Loop the animation

            // Hide sprite initially until resizeBackground positions it correctly
            discordSprite.visible = false;
            discordSprite.alpha = 1.0;

            discordSprite.play(); // Start the animation

            // Note: Will be made visible in resizeBackground() and initialization section

            console.log('Discord AnimatedSprite created:', {
                textures: discordTextures.length,
                playing: discordSprite.playing,
                loop: discordSprite.loop,
                animationSpeed: discordSprite.animationSpeed
            });

            // Get Discord dimensions (use first frame as reference)
            const discordImageWidth = discordTextures[0].orig?.width || discordTextures[0].width || discordTextures[0].baseTexture.width;
            const discordImageHeight = discordTextures[0].orig?.height || discordTextures[0].height || discordTextures[0].baseTexture.height;

            console.log(`Discord texture loaded: ${discordImageWidth}x${discordImageHeight}`);

            // Discord positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 3959, Right X: 4204, Top Y: 1709, Bottom Y: 1866
            // Center X: (3959 + 4204) / 2 = 4081.5
            // Center Y: (1709 + 1866) / 2 = 1787.5
            // Dimensions: width: 246 pixels, height: 158 pixels (on bg1.png)
            const discordConfig = {
                // Discord dimensions (on bg1.png coordinate space)
                discordWidth: 246,
                discordHeight: 158,

                // Position on bg1.png (center of Discord)
                bg1X: 4081.5, // Center X position on bg1.png (calculated from left: 3959 + width/2 = 3959 + 123 = 4082, but using exact center: (3959+4204)/2 = 4081.5)
                bg1Y: 1787.5, // Center Y position on bg1.png (calculated from top: 1709 + height/2 = 1709 + 79 = 1788, but using exact center: (1709+1866)/2 = 1787.5)

                // Scale: calculated to make Discord fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make Discord image fit into designated space on bg1.png
            if (discordImageWidth && discordImageHeight && discordConfig.discordWidth && discordConfig.discordHeight) {
                const relativeScaleX = discordConfig.discordWidth / discordImageWidth;
                const relativeScaleY = discordConfig.discordHeight / discordImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                discordConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                discordConfig.scale = 1.0;
            }

            console.log(`Discord config:`);
            console.log(`  Discord dimensions on bg1.png: ${discordConfig.discordWidth}x${discordConfig.discordHeight}`);
            console.log(`  BG1 position (center): (${discordConfig.bg1X}, ${discordConfig.bg1Y})`);
            console.log(`  Actual Discord image size: ${discordImageWidth}x${discordImageHeight}`);
            console.log(`  Calculated scale: ${discordConfig.scale}`);

            // Store config in userData for Discord sprite
            discordSprite.userData = discordSprite.userData || {};
            discordSprite.userData.config = discordConfig;

            // Make Discord sprite interactive (clickable)
            discordSprite.eventMode = 'static';
            discordSprite.cursor = 'pointer';

            // Store original animation speed for hover effect
            const originalAnimationSpeed = discordSprite.animationSpeed;
            const glitchAnimationSpeed = 0.5; // Fast glitch speed on hover (5x faster)

            // Load glitch sound effect
            discordGlitchSound = new Audio('assets/sounds/glitch1.mp3');
            discordGlitchSound.volume = 0.6; // Set volume (60%)
            discordGlitchSound.preload = 'auto';
            discordGlitchSound.loop = true; // Loop continuously while hovering
            // Start unmuted - will sync after user interaction
            discordGlitchSound.muted = false;
            
            // Handle audio errors
            discordGlitchSound.addEventListener('error', (e) => {
                console.warn('Could not load glitch sound:', e);
            });

            // Hover effect - speed up animation (glitch effect) and play sound
            discordSprite.on('pointerenter', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Discord sprite hover - speeding up animation');
                discordSprite.animationSpeed = glitchAnimationSpeed;
                
                // Play glitch sound effect (only if global audio is not muted)
                // Sound will loop continuously while hovering
                // Play regardless of bg music mute state (sounds start unmuted)
                if (discordGlitchSound) {
                    // Only reset if not already playing to avoid interrupting the loop
                    if (discordGlitchSound.paused) {
                        discordGlitchSound.currentTime = 0;
                    }
                    discordGlitchSound.play().catch((error) => {
                        console.warn('Could not play glitch sound:', error);
                    });
                }
            });

            // Leave hover - return to normal speed and stop glitch sound
            discordSprite.on('pointerleave', () => {
                console.log('Discord sprite leave - returning to normal speed');
                discordSprite.animationSpeed = originalAnimationSpeed;
                
                // Stop glitch sound immediately
                if (discordGlitchSound) {
                    discordGlitchSound.pause();
                    discordGlitchSound.currentTime = 0; // Reset to start for next play
                }
            });

            // Click handler - redirect to Discord invite in new tab
            discordSprite.on('pointertap', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Discord sprite clicked - redirecting to https://discord.com/invite/theprometheans in new tab');
                // Open in new tab without showing loading screen (loading screen is only for same-page redirects)
                window.open('https://discord.com/invite/theprometheans', '_blank');
            });

            app.stage.addChild(discordSprite);

            // Position immediately using resizeBackground to ensure correct positioning
            // This ensures Discord is positioned correctly BEFORE the loading screen ends
            if (backgroundSprite && imageWidth && imageHeight) {
                // Call resizeBackground to position all sprites correctly
                // This will position Discord at the correct coordinates
                resizeBackground();

                // Make visible immediately after positioning
                discordSprite.visible = true;
                console.log('Discord sprite positioned immediately at:', discordSprite.x, discordSprite.y, 'scale:', discordSprite.scale.x);
            } else {
                // If background not ready yet, make invisible until resizeBackground is called
                discordSprite.visible = false;
                console.log('Discord sprite created but background not ready - will be positioned when resizeBackground is called');
            }

        } catch (error) {
            console.error('Error loading Discord:', error);
        }

        // Load Promo animated frames (promo1.png to promo10.png - 10 frames total)
        try {
            console.log('Loading Promo frames...');
            const promoTextures = [];

            // Load all 10 frames (promo1.png to promo10.png)
            for (let i = 1; i <= 10; i++) {
                const texture = await loadAssetWithProgress(`assets/promo${i}.png`);
                promoTextures.push(texture);
                console.log(`  Loaded promo${i}.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${promoTextures.length} Promo frames`);

            // Create AnimatedSprite from the Promo textures
            promoSprite = new AnimatedSprite(promoTextures);
            promoSprite.anchor.set(0.5);

            // Configure Promo animation settings
            promoSprite.animationSpeed = 0.1; // Speed of animation (0.1 = 10% of ticker speed)
            promoSprite.loop = true; // Loop the animation

            // Hide sprite initially until resizeBackground positions it correctly
            // Will be made visible by resizeBackground() when positioned
            promoSprite.visible = false;
            promoSprite.alpha = 1.0;

            promoSprite.play(); // Start the animation

            // Note: Will be positioned and made visible in resizeBackground() and final initialization section

            console.log('Promo AnimatedSprite created:', {
                textures: promoTextures.length,
                playing: promoSprite.playing,
                loop: promoSprite.loop,
                animationSpeed: promoSprite.animationSpeed
            });

            // Get Promo dimensions (use first frame as reference)
            const promoImageWidth = promoTextures[0].orig?.width || promoTextures[0].width || promoTextures[0].baseTexture.width;
            const promoImageHeight = promoTextures[0].orig?.height || promoTextures[0].height || promoTextures[0].baseTexture.height;

            console.log(`Promo texture loaded: ${promoImageWidth}x${promoImageHeight}`);

            // Promo positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 3940, Right X: 4165, Top Y: 1466, Bottom Y: 1643
            // Center X: (3940 + 4165) / 2 = 4052.5
            // Center Y: (1466 + 1643) / 2 = 1554.5
            // Dimensions: width: 223 pixels, height: 178 pixels (on bg1.png)
            const promoConfig = {
                // Promo dimensions (on bg1.png coordinate space)
                promoWidth: 223,
                promoHeight: 178,

                // Position on bg1.png (center of Promo)
                bg1X: 4052.5, // Center X position on bg1.png
                bg1Y: 1554.5, // Center Y position on bg1.png

                // Scale: calculated to make Promo fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make Promo image fit into designated space on bg1.png
            if (promoImageWidth && promoImageHeight && promoConfig.promoWidth && promoConfig.promoHeight) {
                const relativeScaleX = promoConfig.promoWidth / promoImageWidth;
                const relativeScaleY = promoConfig.promoHeight / promoImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                promoConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                promoConfig.scale = 1.0;
            }

            console.log(`Promo config:`);
            console.log(`  Promo dimensions on bg1.png: ${promoConfig.promoWidth}x${promoConfig.promoHeight}`);
            console.log(`  BG1 position (center): (${promoConfig.bg1X}, ${promoConfig.bg1Y})`);
            console.log(`  Actual Promo image size: ${promoImageWidth}x${promoImageHeight}`);
            console.log(`  Calculated scale: ${promoConfig.scale}`);

            // Store config in userData for Promo sprite
            promoSprite.userData = promoSprite.userData || {};
            promoSprite.userData.config = promoConfig;

            // Make Promo sprite interactive (clickable)
            promoSprite.eventMode = 'static';
            promoSprite.cursor = 'pointer';

            // Store original animation speed for hover effect
            const originalAnimationSpeed = promoSprite.animationSpeed;
            const glitchAnimationSpeed = 0.5; // Fast glitch speed on hover (5x faster)

            // Load glitch sound effect
            promoGlitchSound = new Audio('assets/sounds/glitch1.mp3');
            promoGlitchSound.volume = 0.6; // Set volume (60%)
            promoGlitchSound.preload = 'auto';
            promoGlitchSound.loop = true; // Loop continuously while hovering
            // Start unmuted - will sync after user interaction
            promoGlitchSound.muted = false;
            
            // Handle audio errors
            promoGlitchSound.addEventListener('error', (e) => {
                console.warn('Could not load promo glitch sound:', e);
            });

            // Hover effect - speed up animation (glitch effect) and play sound
            promoSprite.on('pointerenter', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Promo sprite hover - speeding up animation');
                promoSprite.animationSpeed = glitchAnimationSpeed;
                
                // Play glitch sound effect (only if global audio is not muted)
                // Sound will loop continuously while hovering
                // Play regardless of bg music mute state (sounds start unmuted)
                if (promoGlitchSound) {
                    // Only reset if not already playing to avoid interrupting the loop
                    if (promoGlitchSound.paused) {
                        promoGlitchSound.currentTime = 0;
                    }
                    promoGlitchSound.play().catch((error) => {
                        console.warn('Could not play promo glitch sound:', error);
                    });
                }
            });

            // Leave hover - return to normal speed and stop glitch sound
            promoSprite.on('pointerleave', () => {
                console.log('Promo sprite leave - returning to normal speed');
                promoSprite.animationSpeed = originalAnimationSpeed;
                
                // Stop glitch sound immediately
                if (promoGlitchSound) {
                    promoGlitchSound.pause();
                    promoGlitchSound.currentTime = 0; // Reset to start for next play
                }
            });

            app.stage.addChild(promoSprite);

            // Position immediately using resizeBackground to ensure correct positioning
            // This ensures Promo is positioned correctly BEFORE the loading screen ends
            // Same behavior as Discord - resizeBackground will position and make visible
            if (backgroundSprite && imageWidth && imageHeight) {
                // Call resizeBackground to position all sprites correctly
                // This will position Promo at the correct coordinates and make it visible
                resizeBackground();
                console.log('Promo sprite positioned immediately at:', promoSprite.x, promoSprite.y, 'scale:', promoSprite.scale.x, 'visible:', promoSprite.visible);
            } else {
                // If background not ready yet, make invisible until resizeBackground is called
                promoSprite.visible = false;
                console.log('Promo sprite created but background not ready - will be positioned when resizeBackground is called');
            }

        } catch (error) {
            console.error('Error loading Promo:', error);
        }

        // Load Telegram animated frames (telegram1.png to telegram9.png - 9 frames total)
        try {
            console.log('Loading Telegram frames...');
            const telegramTextures = [];

            // Load all 9 frames (telegram1.png to telegram9.png)
            for (let i = 1; i <= 9; i++) {
                const texture = await loadAssetWithProgress(`assets/telegram${i}.png`);
                telegramTextures.push(texture);
                console.log(`  Loaded telegram${i}.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${telegramTextures.length} Telegram frames`);

            // Create AnimatedSprite from the Telegram textures
            telegramSprite = new AnimatedSprite(telegramTextures);
            telegramSprite.anchor.set(0.5);

            // Configure Telegram animation settings
            telegramSprite.animationSpeed = 0.1; // Speed of animation (0.1 = 10% of ticker speed)
            telegramSprite.loop = true; // Loop the animation

            // Hide sprite initially until resizeBackground positions it correctly
            // Will be made visible by resizeBackground() when positioned
            telegramSprite.visible = false;
            telegramSprite.alpha = 1.0;

            telegramSprite.play(); // Start the animation

            // Note: Will be positioned and made visible in resizeBackground() and final initialization section

            console.log('Telegram AnimatedSprite created:', {
                textures: telegramTextures.length,
                playing: telegramSprite.playing,
                loop: telegramSprite.loop,
                animationSpeed: telegramSprite.animationSpeed
            });

            // Get Telegram dimensions (use first frame as reference)
            const telegramImageWidth = telegramTextures[0].orig?.width || telegramTextures[0].width || telegramTextures[0].baseTexture.width;
            const telegramImageHeight = telegramTextures[0].orig?.height || telegramTextures[0].height || telegramTextures[0].baseTexture.height;

            console.log(`Telegram texture loaded: ${telegramImageWidth}x${telegramImageHeight}`);

            // Telegram positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 3498, Right X: 3797, Top Y: 1712, Bottom Y: 1955
            // Center X: (3498 + 3797) / 2 = 3647.5
            // Center Y: (1712 + 1955) / 2 = 1833.5
            // Dimensions: width: 300 pixels, height: 244 pixels (on bg1.png)
            const telegramConfig = {
                // Telegram dimensions (on bg1.png coordinate space)
                telegramWidth: 300,
                telegramHeight: 244,

                // Position on bg1.png (center of Telegram)
                bg1X: 3647.5, // Center X position on bg1.png
                bg1Y: 1833.5, // Center Y position on bg1.png

                // Scale: calculated to make Telegram fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make Telegram image fit into designated space on bg1.png
            if (telegramImageWidth && telegramImageHeight && telegramConfig.telegramWidth && telegramConfig.telegramHeight) {
                const relativeScaleX = telegramConfig.telegramWidth / telegramImageWidth;
                const relativeScaleY = telegramConfig.telegramHeight / telegramImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                telegramConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                telegramConfig.scale = 1.0;
            }

            console.log(`Telegram config:`);
            console.log(`  Telegram dimensions on bg1.png: ${telegramConfig.telegramWidth}x${telegramConfig.telegramHeight}`);
            console.log(`  BG1 position (center): (${telegramConfig.bg1X}, ${telegramConfig.bg1Y})`);
            console.log(`  Actual Telegram image size: ${telegramImageWidth}x${telegramImageHeight}`);
            console.log(`  Calculated scale: ${telegramConfig.scale}`);

            // Store config in userData for Telegram sprite
            telegramSprite.userData = telegramSprite.userData || {};
            telegramSprite.userData.config = telegramConfig;

            // Make Telegram sprite interactive (clickable)
            telegramSprite.eventMode = 'static';
            telegramSprite.cursor = 'pointer';

            // Store original animation speed for hover effect
            const originalAnimationSpeed = telegramSprite.animationSpeed;
            const glitchAnimationSpeed = 0.5; // Fast glitch speed on hover (5x faster)

            // Load glitch sound effect
            telegramGlitchSound = new Audio('assets/sounds/glitch1.mp3');
            telegramGlitchSound.volume = 0.6; // Set volume (60%)
            telegramGlitchSound.preload = 'auto';
            telegramGlitchSound.loop = true; // Loop continuously while hovering
            // Start unmuted - will sync after user interaction
            telegramGlitchSound.muted = false;
            
            // Handle audio errors
            telegramGlitchSound.addEventListener('error', (e) => {
                console.warn('Could not load telegram glitch sound:', e);
            });

            // Hover effect - speed up animation (glitch effect) and play sound
            telegramSprite.on('pointerenter', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Telegram sprite hover - speeding up animation');
                telegramSprite.animationSpeed = glitchAnimationSpeed;
                
                // Play glitch sound effect (only if global audio is not muted)
                // Sound will loop continuously while hovering
                // Play regardless of bg music mute state (sounds start unmuted)
                if (telegramGlitchSound) {
                    // Only reset if not already playing to avoid interrupting the loop
                    if (telegramGlitchSound.paused) {
                        telegramGlitchSound.currentTime = 0;
                    }
                    telegramGlitchSound.play().catch((error) => {
                        console.warn('Could not play telegram glitch sound:', error);
                    });
                }
            });

            // Leave hover - return to normal speed and stop glitch sound
            telegramSprite.on('pointerleave', () => {
                console.log('Telegram sprite leave - returning to normal speed');
                telegramSprite.animationSpeed = originalAnimationSpeed;
                
                // Stop glitch sound immediately
                if (telegramGlitchSound) {
                    telegramGlitchSound.pause();
                    telegramGlitchSound.currentTime = 0; // Reset to start for next play
                }
            });

            // Click handler - redirect to Telegram in new tab
            telegramSprite.on('pointertap', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Telegram sprite clicked - redirecting to Telegram in new tab');
                // Open in new tab without showing loading screen (loading screen is only for same-page redirects)
                window.open('https://t.me/+F0B_cOIRwgkzZGJk', '_blank');
            });

            app.stage.addChild(telegramSprite);

            // Position immediately using resizeBackground to ensure correct positioning
            // This ensures Telegram is positioned correctly BEFORE the loading screen ends
            // Same behavior as Discord and Promo - resizeBackground will position and make visible
            if (backgroundSprite && imageWidth && imageHeight) {
                // Call resizeBackground to position all sprites correctly
                // This will position Telegram at the correct coordinates
                resizeBackground();

                // Make visible immediately after positioning
                telegramSprite.visible = true;
                console.log('Telegram sprite positioned immediately at:', telegramSprite.x, telegramSprite.y, 'scale:', telegramSprite.scale.x);
            } else {
                // If background not ready yet, make invisible until resizeBackground is called
                telegramSprite.visible = false;
                console.log('Telegram sprite created but background not ready - will be positioned when resizeBackground is called');
            }

        } catch (error) {
            console.error('Error loading Telegram:', error);
        }

        // Load Blaised animated frames (blaised1.png to blaised6.png - 6 frames total)
        try {
            console.log('Loading Blaised frames...');
            const blaisedTextures = [];

            // Load all 6 frames (blaised1.png, blaised2.png, ..., blaised6.png)
            for (let i = 1; i <= 6; i++) {
                const texture = await loadAssetWithProgress(`assets/blaised${i}.png`);
                blaisedTextures.push(texture);
                console.log(`  Loaded blaised${i}.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${blaisedTextures.length} Blaised frames`);

            // Create AnimatedSprite from the Blaised textures
            blaisedSprite = new AnimatedSprite(blaisedTextures);
            blaisedSprite.anchor.set(0.5);

            // Configure Blaised animation settings
            blaisedSprite.animationSpeed = BLAISED_ANIMATION_SPEED; // Speed of animation (0.1 = 10% of ticker speed)
            blaisedSprite.loop = true; // Loop the animation

            // Hide sprite initially until resizeBackground positions it correctly
            blaisedSprite.visible = false;
            blaisedSprite.alpha = 1.0;

            blaisedSprite.play(); // Start the animation

            console.log('Blaised AnimatedSprite created:', {
                textures: blaisedTextures.length,
                playing: blaisedSprite.playing,
                loop: blaisedSprite.loop,
                animationSpeed: blaisedSprite.animationSpeed
            });

            // Get Blaised dimensions (use first frame as reference)
            const blaisedImageWidth = blaisedTextures[0].orig?.width || blaisedTextures[0].width || blaisedTextures[0].baseTexture.width;
            const blaisedImageHeight = blaisedTextures[0].orig?.height || blaisedTextures[0].height || blaisedTextures[0].baseTexture.height;

            console.log(`Blaised texture loaded: ${blaisedImageWidth}x${blaisedImageHeight}`);

            // Blaised positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 4001, Right X: 4504, Top Y: 2223, Bottom Y: 2946
            // Center X: (4001 + 4504) / 2 = 4252.5
            // Center Y: (2223 + 2946) / 2 = 2584.5
            // Dimensions: width: 504 pixels, height: 724 pixels (on bg1.png)
            const blaisedConfig = {
                // Blaised dimensions (on bg1.png coordinate space)
                blaisedWidth: 504,
                blaisedHeight: 724,

                // Position on bg1.png (center of Blaised)
                bg1X: 4252.5, // Center X position on bg1.png
                bg1Y: 2584.5, // Center Y position on bg1.png

                // Scale: calculated to make Blaised fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make Blaised image fit into designated space on bg1.png
            if (blaisedImageWidth && blaisedImageHeight && blaisedConfig.blaisedWidth && blaisedConfig.blaisedHeight) {
                const relativeScaleX = blaisedConfig.blaisedWidth / blaisedImageWidth;
                const relativeScaleY = blaisedConfig.blaisedHeight / blaisedImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                blaisedConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                blaisedConfig.scale = 1.0;
            }

            console.log(`Blaised config:`);
            console.log(`  Blaised dimensions on bg1.png: ${blaisedConfig.blaisedWidth}x${blaisedConfig.blaisedHeight}`);
            console.log(`  BG1 position (center): (${blaisedConfig.bg1X}, ${blaisedConfig.bg1Y})`);
            console.log(`  Actual Blaised image size: ${blaisedImageWidth}x${blaisedImageHeight}`);
            console.log(`  Calculated scale: ${blaisedConfig.scale}`);

            // Store config in userData for Blaised sprite
            blaisedSprite.userData = blaisedSprite.userData || {};
            blaisedSprite.userData.config = blaisedConfig;

            // Add to stage
            app.stage.addChild(blaisedSprite);

            // Position immediately using resizeBackground to ensure correct positioning
            // This ensures Blaised is positioned correctly BEFORE the loading screen ends
            if (backgroundSprite && imageWidth && imageHeight) {
                // Call resizeBackground to position all sprites correctly
                // This will position Blaised at the correct coordinates
                resizeBackground();

                // Make visible immediately after positioning
                blaisedSprite.visible = true;
                console.log('Blaised sprite positioned immediately at:', blaisedSprite.x, blaisedSprite.y, 'scale:', blaisedSprite.scale.x);
            } else {
                // If background not ready yet, make invisible until resizeBackground is called
                blaisedSprite.visible = false;
                console.log('Blaised sprite created but background not ready - will be positioned when resizeBackground is called');
            }

        } catch (error) {
            console.error('Error loading Blaised:', error);
        }

        // Load Blaised Aura animated frames (blaised1_aura.png to blaised6_aura.png - 6 frames total)
        // Using separate canvas with CSS mix-blend-mode for color dodge effect
        try {
            console.log('Loading Blaised Aura frames...');
            const blaisedAuraTextures = [];

            // Load all 6 frames (blaised1_aura.png, blaised2_aura.png, ..., blaised6_aura.png)
            for (let i = 1; i <= 6; i++) {
                const texture = await loadAssetWithProgress(`assets/blaised${i}_aura.png`);
                blaisedAuraTextures.push(texture);
                console.log(`  Loaded blaised${i}_aura.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${blaisedAuraTextures.length} Blaised Aura frames`);

            // Create a separate PIXI application for the aura sprite layer to use CSS blend modes
            blaisedAuraApp = new Application();
            await blaisedAuraApp.init({
                background: 'transparent',
                resizeTo: window,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                antialias: true
            });

            // Ensure ticker continues even when tab is hidden
            blaisedAuraApp.ticker.stopOnMinimize = false;

            // Create AnimatedSprite from the Blaised Aura textures
            blaisedAuraSprite = new AnimatedSprite(blaisedAuraTextures);
            blaisedAuraSprite.anchor.set(0.5);

            // Configure Blaised Aura animation settings (same as blaised sprite)
            blaisedAuraSprite.animationSpeed = BLAISED_ANIMATION_SPEED; // Speed of animation (same as blaised sprite)
            blaisedAuraSprite.loop = true; // Loop the animation

            // Hide sprite initially until resizeBackground positions it correctly
            blaisedAuraSprite.visible = false;
            blaisedAuraSprite.alpha = 1.0;

            blaisedAuraSprite.play(); // Start the animation

            // Add sprite to the separate app
            blaisedAuraApp.stage.addChild(blaisedAuraSprite);

            // Get the sprite canvas and apply CSS blend mode
            const auraCanvas = blaisedAuraApp.canvas;
            auraCanvas.style.position = 'absolute';
            auraCanvas.style.top = '0';
            auraCanvas.style.left = '0';
            auraCanvas.style.mixBlendMode = 'color-dodge';
            auraCanvas.style.pointerEvents = 'none';
            auraCanvas.style.zIndex = '1'; // Ensure it's above the main canvas

            // Add aura canvas to the container (same container as main app)
            const container = document.getElementById('canvas-container');
            if (container) {
                container.appendChild(auraCanvas);
                console.log('Blaised Aura canvas added to container with CSS color-dodge blend mode');
            }

            console.log('Blaised Aura AnimatedSprite created:', {
                textures: blaisedAuraTextures.length,
                playing: blaisedAuraSprite.playing,
                loop: blaisedAuraSprite.loop,
                animationSpeed: blaisedAuraSprite.animationSpeed,
                blendMode: 'CSS color-dodge (mix-blend-mode)'
            });

            // Get Blaised Aura dimensions (use first frame as reference)
            const blaisedAuraImageWidth = blaisedAuraTextures[0].orig?.width || blaisedAuraTextures[0].width || blaisedAuraTextures[0].baseTexture.width;
            const blaisedAuraImageHeight = blaisedAuraTextures[0].orig?.height || blaisedAuraTextures[0].height || blaisedAuraTextures[0].baseTexture.height;

            console.log(`Blaised Aura texture loaded: ${blaisedAuraImageWidth}x${blaisedAuraImageHeight}`);

            // Blaised Aura positioning and sizing config (same as blaised sprite)
            // Position on bg1.png (in pixels):
            // Left X: 4001, Right X: 4504, Top Y: 2223, Bottom Y: 2946
            // Center X: (4001 + 4504) / 2 = 4252.5
            // Center Y: (2223 + 2946) / 2 = 2584.5
            // Dimensions: width: 504 pixels, height: 724 pixels (on bg1.png)
            const blaisedAuraConfig = {
                // Blaised Aura dimensions (on bg1.png coordinate space)
                blaisedAuraWidth: 504,
                blaisedAuraHeight: 724,

                // Position on bg1.png (center of Blaised Aura) - same as blaised sprite
                bg1X: 4252.5, // Center X position on bg1.png
                bg1Y: 2584.5, // Center Y position on bg1.png

                // Scale: calculated to make Blaised Aura fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make Blaised Aura image fit into designated space on bg1.png
            if (blaisedAuraImageWidth && blaisedAuraImageHeight && blaisedAuraConfig.blaisedAuraWidth && blaisedAuraConfig.blaisedAuraHeight) {
                const relativeScaleX = blaisedAuraConfig.blaisedAuraWidth / blaisedAuraImageWidth;
                const relativeScaleY = blaisedAuraConfig.blaisedAuraHeight / blaisedAuraImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                blaisedAuraConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                blaisedAuraConfig.scale = 1.0;
            }

            console.log(`Blaised Aura config:`);
            console.log(`  Blaised Aura dimensions on bg1.png: ${blaisedAuraConfig.blaisedAuraWidth}x${blaisedAuraConfig.blaisedAuraHeight}`);
            console.log(`  BG1 position (center): (${blaisedAuraConfig.bg1X}, ${blaisedAuraConfig.bg1Y})`);
            console.log(`  Actual Blaised Aura image size: ${blaisedAuraImageWidth}x${blaisedAuraImageHeight}`);
            console.log(`  Calculated scale: ${blaisedAuraConfig.scale}`);

            // Store config in userData for Blaised Aura sprite
            blaisedAuraSprite.userData = blaisedAuraSprite.userData || {};
            blaisedAuraSprite.userData.config = blaisedAuraConfig;

            // Position immediately using resizeBackground to ensure correct positioning
            // This ensures Blaised Aura is positioned correctly BEFORE the loading screen ends
            if (backgroundSprite && imageWidth && imageHeight) {
                // Call resizeBackground to position all sprites correctly
                // This will position Blaised Aura at the correct coordinates
                resizeBackground();

                // Make visible immediately after positioning
                blaisedAuraSprite.visible = true;
                console.log('Blaised Aura sprite positioned immediately at:', blaisedAuraSprite.x, blaisedAuraSprite.y, 'scale:', blaisedAuraSprite.scale.x);
            } else {
                // If background not ready yet, make invisible until resizeBackground is called
                blaisedAuraSprite.visible = false;
                console.log('Blaised Aura sprite created but background not ready - will be positioned when resizeBackground is called');
            }

        } catch (error) {
            console.error('Error loading Blaised Aura:', error);
        }

        // Blaised Action2 and Action3 sprites removed - files no longer exist

        // Load Wall Art animated frames (wall_art1.png to wall_art6.png - 6 frames total)
        try {
            console.log('Loading Wall Art frames...');
            const wallArtTextures = [];

            // Load all 6 frames (wall_art1.png, wall_art2.png, ..., wall_art6.png)
            for (let i = 1; i <= 6; i++) {
                const texture = await loadAssetWithProgress(`assets/wall_art${i}.png`);
                wallArtTextures.push(texture);
                console.log(`  Loaded wall_art${i}.png:`, texture.width, 'x', texture.height);
            }

            console.log(`  Loaded all ${wallArtTextures.length} Wall Art frames`);

            // Load Wall Art stroke animated frames (wall_art1_stroke.png to wall_art6_stroke.png - 6 frames total)
            console.log('Loading Wall Art stroke frames...');
            const wallArtStrokeTextures = [];

            // Load all 6 stroke frames (wall_art1_stroke.png, wall_art2_stroke.png, ..., wall_art6_stroke.png)
            for (let i = 1; i <= 6; i++) {
                const strokeTexture = await loadAssetWithProgress(`assets/wall_art${i}_stroke.png`);
                wallArtStrokeTextures.push(strokeTexture);
                console.log(`  Loaded wall_art${i}_stroke.png:`, strokeTexture.width, 'x', strokeTexture.height);
            }

            console.log(`  Loaded all ${wallArtStrokeTextures.length} Wall Art stroke frames`);

            // Create AnimatedSprite from the wall art textures
            wallArtSprite = new AnimatedSprite(wallArtTextures);
            wallArtSprite.anchor.set(0.5);

            // Configure wall art animation settings
            wallArtSprite.animationSpeed = 0.15; // Speed of animation (faster)
            wallArtSprite.loop = false; // Don't loop automatically - animation triggered by movement

            // Stop automatic animation - will be controlled by cursor/swipe movement
            wallArtSprite.stop();

            // Store animation speed for hover effects
            wallArtSprite.userData = wallArtSprite.userData || {};
            wallArtSprite.userData.baseAnimationSpeed = 0.1;
            wallArtSprite.userData.currentAnimationSpeed = 0.1;

            // Get wall art image dimensions
            const wallArtImageWidth = wallArtTextures[0].orig?.width || wallArtTextures[0].width || wallArtTextures[0].baseTexture.width || 1920;
            const wallArtImageHeight = wallArtTextures[0].orig?.height || wallArtTextures[0].height || wallArtTextures[0].baseTexture.height || 1080;

            console.log(`Wall Art texture loaded: ${wallArtImageWidth}x${wallArtImageHeight}`);

            // Wall Art config
            // Position on bg1.png:
            // Top-left: X: 4470, Y: 722
            // Bottom-right: X: 4958, Y: 1980.1
            // Center X: (4470 + 4958) / 2 = 4714
            // Center Y: (722 + 1980.1) / 2 = 1351.05
            // Dimensions: Width: 489, Height: 1259
            const wallArtConfig = {
                bg1X: 4714, // Center X position on bg1.png
                bg1Y: 1351.05, // Center Y position on bg1.png
                wallArtWidth: 489, // Width of wall art on bg1.png
                wallArtHeight: 1259, // Height of wall art on bg1.png
                scale: null, // Will be calculated based on bg1 scale
                offsetX: 0,
                offsetY: 0
            };

            // Calculate scale to make wall art image fit into designated space on bg1.png
            if (wallArtImageWidth && wallArtImageHeight && wallArtConfig.wallArtWidth && wallArtConfig.wallArtHeight) {
                const relativeScaleX = wallArtConfig.wallArtWidth / wallArtImageWidth;
                const relativeScaleY = wallArtConfig.wallArtHeight / wallArtImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                wallArtConfig.scale = Math.min(relativeScaleX, relativeScaleY);

                console.log(`Wall Art config:`);
                console.log(`  Wall Art dimensions on bg1.png: ${wallArtConfig.wallArtWidth}x${wallArtConfig.wallArtHeight}`);
                console.log(`  BG1 position (center): (${wallArtConfig.bg1X}, ${wallArtConfig.bg1Y})`);
                console.log(`  Actual wall art image size: ${wallArtImageWidth}x${wallArtImageHeight}`);
                console.log(`  Calculated scale: ${wallArtConfig.scale}`);
            } else {
                // Fallback: use natural size
                wallArtConfig.scale = 1.0;
                console.warn('Wall Art: Could not calculate scale, using default 1.0');
            }

            // Store config in userData for wall art sprite
            wallArtSprite.userData = wallArtSprite.userData || {};
            wallArtSprite.userData.config = wallArtConfig;
            wallArtSprite.userData.baseScale = 1.0; // Will be set after first resizeBackground call

            // Create stroke AnimatedSprite from the stroke textures
            wallArtStrokeSprite = new AnimatedSprite(wallArtStrokeTextures);
            wallArtStrokeSprite.anchor.set(0.5);

            // Configure stroke animation settings (same speed as wall art)
            wallArtStrokeSprite.animationSpeed = 0.15; // Same speed as wall art animation (faster)
            wallArtStrokeSprite.loop = true; // Loop the animation

            // Stroke sprite is hidden by default, shown on hover
            wallArtStrokeSprite.visible = false;
            wallArtStrokeSprite.alpha = 1.0;

            // Start the stroke animation
            wallArtStrokeSprite.play();

            console.log('Wall Art Stroke AnimatedSprite created:', {
                textures: wallArtStrokeTextures.length,
                playing: wallArtStrokeSprite.playing,
                loop: wallArtStrokeSprite.loop,
                animationSpeed: wallArtStrokeSprite.animationSpeed
            });

            // Store config in stroke sprite userData (same as wall art)
            wallArtStrokeSprite.userData = wallArtStrokeSprite.userData || {};
            wallArtStrokeSprite.userData.config = wallArtConfig;

            // Add to stage (after wall art sprite so it appears on top)
            app.stage.addChild(wallArtSprite);
            app.stage.addChild(wallArtStrokeSprite);

            // Set initial position (will be updated by resizeBackground)
            wallArtSprite.x = app.screen.width / 2;
            wallArtSprite.y = app.screen.height / 2;

            // Make sprite invisible until resizeBackground positions it correctly (prevents flash of incorrect positioning)
            wallArtSprite.visible = false;

            // Make wall art sprite interactive
            wallArtSprite.eventMode = 'static';
            wallArtSprite.cursor = 'pointer';

            // Sync stroke animation frame with wall art animation frame
            app.ticker.add(() => {
                if (wallArtStrokeSprite && wallArtSprite && wallArtSprite.currentFrame !== undefined) {
                    // Sync stroke frame with wall art frame
                    if (wallArtStrokeSprite.currentFrame !== wallArtSprite.currentFrame) {
                        wallArtStrokeSprite.gotoAndStop(wallArtSprite.currentFrame);
                    }
                    // Update stroke position and scale to match wall art
                    if (wallArtStrokeSprite.visible) {
                        wallArtStrokeSprite.x = wallArtSprite.x;
                        wallArtStrokeSprite.y = wallArtSprite.y;
                        wallArtStrokeSprite.scale.set(wallArtSprite.scale.x, wallArtSprite.scale.y);
                    }
                }
            });

            // Stroke and text are triggered by dot hover, not sprite hover (same as CCTV)

            // Animation is stopped - will be triggered by scroll, swipe, or cursor hover
            // Don't call play() - animation is controlled manually

            // Function to start wall art animation (plays continuously)
            const startWallArtAnimation = (direction) => {
                if (!wallArtSprite) return;

                // Always restart animation when movement is detected
                // Stop current animation first if it's playing
                if (wallArtIsAnimating) {
                    wallArtSprite.stop();
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.stop();
                    }
                }

                wallArtIsAnimating = true;

                // Set animation speed
                wallArtSprite.animationSpeed = 0.15;
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.animationSpeed = 0.15;
                }

                // Play animation forward or backward based on direction
                if (direction > 0) {
                    // Play forward
                    wallArtSprite.play();
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.play();
                    }
                } else {
                    // Play backward (reverse)
                    // Note: PixiJS doesn't have built-in reverse, so we'll use a workaround
                    // For now, just play forward (can be enhanced later)
                    wallArtSprite.play();
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.play();
                    }
                }
            };

            // Function to stop wall art animation (make it globally accessible)
            stopWallArtAnimation = () => {
                if (!wallArtSprite) return;

                if (!wallArtIsAnimating) return;

                wallArtIsAnimating = false;

                // Stop animation
                wallArtSprite.stop();
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.stop();
                }
            };

            // Function to advance wall art animation frame (make it globally accessible)
            advanceWallArtFrame = (direction) => {
                if (!wallArtSprite) return;

                // Always restart animation when movement is detected
                startWallArtAnimation(direction);

                // Clear existing timeout
                if (wallArtAnimationTimeout) {
                    clearTimeout(wallArtAnimationTimeout);
                }

                // Set timeout to stop animation when movement stops (300ms after last movement)
                // Clear any existing timeout first
                if (wallArtAnimationTimeout) {
                    clearTimeout(wallArtAnimationTimeout);
                }
                wallArtAnimationTimeout = setTimeout(() => {
                    stopWallArtAnimation();
                }, 300);
            };

            // Track if cursor is over wall art sprite (for hover animation)
            let isCursorOverWallArt = false;
            let wallArtHoverAnimationPlaying = false;
            let wallArtHoverTicker = null;

            // Function to play wall art animation once (like cup hop animation)
            const playWallArtHoverAnimation = () => {
                if (!wallArtSprite || wallArtHoverAnimationPlaying) return;

                wallArtHoverAnimationPlaying = true;

                // Reset to first frame and play through all frames once
                wallArtSprite.gotoAndStop(0);
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.gotoAndStop(0);
                }

                // Set animation to play once (not loop)
                wallArtSprite.loop = false;
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.loop = false;
                }

                // Set animation speed
                wallArtSprite.animationSpeed = 0.15;
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.animationSpeed = 0.15;
                }

                // Play animation
                wallArtSprite.play();
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.play();
                }

                // Check when animation completes (reached last frame)
                const totalFrames = wallArtTextures.length;
                if (wallArtHoverTicker) {
                    app.ticker.remove(wallArtHoverTicker);
                }
                wallArtHoverTicker = app.ticker.add(() => {
                    // Check if animation reached the last frame
                    if (wallArtSprite.currentFrame >= totalFrames - 1) {
                        // Animation complete - stop and reset
                        wallArtSprite.stop();
                        if (wallArtStrokeSprite) {
                            wallArtStrokeSprite.stop();
                        }
                        wallArtHoverAnimationPlaying = false;
                        app.ticker.remove(wallArtHoverTicker);
                        wallArtHoverTicker = null;
                    }
                });
            };

            // Load paper flip sound effect for wall art
            wallArtPaperFlipSound = new Audio('assets/sounds/paper_flip.mp3');
            wallArtPaperFlipSound.volume = 0.6; // Set volume (60%)
            wallArtPaperFlipSound.preload = 'auto';
            // Start unmuted - will sync after user interaction
            wallArtPaperFlipSound.muted = false;
            
            // Handle audio errors
            wallArtPaperFlipSound.addEventListener('error', (e) => {
                console.warn('Could not load wall art paper flip sound:', e);
            });

            // Trigger animation when cursor enters the wall art sprite (like cup)
            wallArtSprite.on('pointerenter', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                isCursorOverWallArt = true;
                // Play animation once when cursor enters (like cup hop)
                // If already playing, restart it
                if (wallArtHoverAnimationPlaying) {
                    // Stop current animation and restart
                    wallArtSprite.stop();
                    if (wallArtStrokeSprite) {
                        wallArtStrokeSprite.stop();
                    }
                    if (wallArtHoverTicker) {
                        app.ticker.remove(wallArtHoverTicker);
                        wallArtHoverTicker = null;
                    }
                    wallArtHoverAnimationPlaying = false;
                }
                playWallArtHoverAnimation();
                
                // Play paper flip sound effect
                // Play regardless of bg music mute state (sounds start unmuted)
                if (wallArtPaperFlipSound) {
                    // Reset to start and play (allows replaying if hovered multiple times)
                    wallArtPaperFlipSound.currentTime = 0;
                    wallArtPaperFlipSound.play().catch((error) => {
                        console.warn('Could not play wall art paper flip sound:', error);
                    });
                }
            });

            // Stop tracking when cursor leaves
            wallArtSprite.on('pointerleave', () => {
                isCursorOverWallArt = false;
                
                // Stop paper flip sound immediately
                if (wallArtPaperFlipSound) {
                    wallArtPaperFlipSound.pause();
                    wallArtPaperFlipSound.currentTime = 0; // Reset to start for next play
                }
            });

            // Track wheel scroll events (mouse wheel, trackpad scroll)
            document.addEventListener('wheel', (e) => {
                const deltaX = e.deltaX; // Horizontal scroll
                const deltaY = e.deltaY; // Vertical scroll

                // Only trigger if there's significant scroll movement
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    // Determine primary scroll direction
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        // Horizontal scroll (left/right)
                        if (deltaX > 0) {
                            // Scrolled right - advance frame forward
                            advanceWallArtFrame(1);
                        } else {
                            // Scrolled left - advance frame backward
                            advanceWallArtFrame(-1);
                        }
                    } else {
                        // Vertical scroll (top/bottom)
                        if (deltaY > 0) {
                            // Scrolled down - advance frame forward
                            advanceWallArtFrame(1);
                        } else {
                            // Scrolled up - advance frame backward
                            advanceWallArtFrame(-1);
                        }
                    }
                }
            }, { passive: true });

            // Also track window scroll (for actual page scrolling if scrollbars exist)
            let wallArtLastScrollX = window.scrollX || window.pageXOffset || 0;
            let wallArtLastScrollY = window.scrollY || window.pageYOffset || 0;

            window.addEventListener('scroll', () => {
                const currentScrollX = window.scrollX || window.pageXOffset || 0;
                const currentScrollY = window.scrollY || window.pageYOffset || 0;

                const deltaX = currentScrollX - wallArtLastScrollX;
                const deltaY = currentScrollY - wallArtLastScrollY;

                // Only trigger if there's significant scroll movement
                if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        // Horizontal scroll (left/right)
                        if (deltaX > 0) {
                            // Scrolled right - advance frame forward
                            advanceWallArtFrame(1);
                        } else {
                            // Scrolled left - advance frame backward
                            advanceWallArtFrame(-1);
                        }
                    } else {
                        // Vertical scroll (top/bottom)
                        if (deltaY > 0) {
                            // Scrolled down - advance frame forward
                            advanceWallArtFrame(1);
                        } else {
                            // Scrolled up - advance frame backward
                            advanceWallArtFrame(-1);
                        }
                    }

                    wallArtLastScrollX = currentScrollX;
                    wallArtLastScrollY = currentScrollY;
                }
            }, { passive: true });

            // Track swipe gestures (left/right)
            let wallArtSwipeStart = { x: 0, y: 0, time: 0 };
            const wallArtSwipeThreshold = 50; // Minimum distance for swipe
            const wallArtSwipeMaxTime = 300; // Maximum time for swipe (ms)

            document.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches.length === 1) {
                    wallArtSwipeStart.x = e.touches[0].clientX;
                    wallArtSwipeStart.y = e.touches[0].clientY;
                    wallArtSwipeStart.time = Date.now();
                }
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                if (!wallArtSwipeStart.time) return;

                const touch = e.changedTouches[0];
                if (!touch) return;

                const deltaX = touch.clientX - wallArtSwipeStart.x;
                const deltaY = touch.clientY - wallArtSwipeStart.y;
                const deltaTime = Date.now() - wallArtSwipeStart.time;

                // Check if it's a valid swipe (horizontal, fast enough, far enough)
                if (deltaTime < wallArtSwipeMaxTime && Math.abs(deltaX) > wallArtSwipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe detected
                    if (deltaX > 0) {
                        // Swipe right - advance frame forward
                        advanceWallArtFrame(1);
                    } else {
                        // Swipe left - advance frame backward
                        advanceWallArtFrame(-1);
                    }
                }

                // Reset swipe start
                wallArtSwipeStart = { x: 0, y: 0, time: 0 };
            }, { passive: true });

            // Create pulsing dot at center of wall art (same design as mutator and CCTV dots)
            const createWallArtDot = () => {
                // Function to get responsive dot radius (same as mutator and CCTV)
                const getResponsiveWallArtDotRadius = () => {
                    const minDimension = Math.min(window.innerWidth, window.innerHeight);
                    let baseRadius = 6; // Default for large screens

                    if (minDimension <= 480) {
                        // Small phones
                        baseRadius = 4;
                    } else if (minDimension <= 768) {
                        // Tablets and larger phones
                        baseRadius = 5;
                    } else if (minDimension <= 1024) {
                        // Small laptops
                        baseRadius = 5.5;
                    } else if (minDimension <= 1440) {
                        // Laptops
                        baseRadius = 5.5;
                    }

                    return baseRadius;
                };

                // Create pulsing dot at center of wall art (same as mutator and CCTV)
                wallArtDot = new Graphics();
                const dotColor = 0xFFFFFF; // White dot

                // Pulsing animation variables
                wallArtDot.userData = wallArtDot.userData || {};
                wallArtDot.userData.pulseTime = 0;
                wallArtDot.userData.baseRadius = getResponsiveWallArtDotRadius();

                // Function to update dot size (call on resize)
                const updateWallArtDotSize = () => {
                    wallArtDot.userData.baseRadius = getResponsiveWallArtDotRadius();
                    // Update hit area when dot size changes
                    const maxHitRadius = wallArtDot.userData.baseRadius + 30; // Account for pulse waves
                    wallArtDot.hitArea = new PIXI.Circle(0, 0, maxHitRadius);
                };

                // Draw initial dot
                wallArtDot.circle(0, 0, wallArtDot.userData.baseRadius);
                wallArtDot.fill({ color: dotColor, alpha: 0.9 });
                // Hide dot initially until resizeBackground positions it correctly
                wallArtDot.visible = false;
                wallArtDot.eventMode = 'static';
                wallArtDot.cursor = 'pointer';

                // Set hit area for proper cursor interaction (even when graphics are cleared/redrawn)
                // Use a larger hit area to account for pulsing waves
                const maxHitRadius = wallArtDot.userData.baseRadius + 30; // Account for pulse waves
                wallArtDot.hitArea = new PIXI.Circle(0, 0, maxHitRadius);

                // Enhanced smooth pulsing animation (nicer wave effect) - same as mutator and CCTV
                app.ticker.add(() => {
                    if (wallArtDot && wallArtDot.visible && wallArtDot.parent) {
                        wallArtDot.userData.pulseTime += 0.025; // Smooth, gentle pulse speed

                        // Additional null check before clearing to prevent errors
                        if (wallArtDot && typeof wallArtDot.clear === 'function') {
                            wallArtDot.clear();
                        }

                        const baseRadius = wallArtDot.userData.baseRadius;

                        // Create multiple smooth ripple waves for enhanced effect
                        const numWaves = 4; // More waves for smoother effect
                        for (let i = 0; i < numWaves; i++) {
                            // Smoother wave calculation using easing
                            const wavePhase = wallArtDot.userData.pulseTime + (i * (Math.PI * 2 / numWaves));

                            // Use smoother sine wave with adjusted amplitude
                            const waveSize = Math.sin(wavePhase);

                            // Smoother wave expansion - more gradual (same as mutator and CCTV)
                            const waveExpansion = 8 + (i * 1.5);
                            const waveRadius = baseRadius + (waveSize * waveExpansion * (1 - i * 0.25));

                            // Smoother alpha fade - more gradual (same as mutator and CCTV)
                            const baseAlpha = 0.95 - (i * 0.15);
                            const alphaVariation = Math.abs(waveSize) * 0.3;
                            const waveAlpha = Math.max(0, Math.min(0.95, baseAlpha - alphaVariation));

                            // Only draw if radius and alpha are valid
                            if (waveRadius > 0 && waveAlpha > 0.05) {
                                wallArtDot.circle(0, 0, waveRadius);
                                wallArtDot.fill({ color: dotColor, alpha: waveAlpha });
                            }
                        }
                    }
                });

                // Update dot size on window resize
                window.addEventListener('resize', () => {
                    updateWallArtDotSize();
                });

                // Add dot to stage
                app.stage.addChild(wallArtDot);

                // Position at center of wall art (will be updated in resizeBackground)
                wallArtDot.x = wallArtSprite.x;
                wallArtDot.y = wallArtSprite.y;
            };

            createWallArtDot();

            // Create "OUR TEAM" text with same animation as X Account
            const createWallArtText = async () => {
                // Wait for font to be loaded before creating text
                if (document.fonts && document.fonts.check) {
                    function checkFont(fontFamily) {
                        return document.fonts.check(`1em "${fontFamily}"`) || 
                               document.fonts.check(`1em ${fontFamily}`) ||
                               document.fonts.check(`12px "${fontFamily}"`) ||
                               document.fonts.check(`12px ${fontFamily}`);
                    }
                    
                    let fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                    if (!fontLoaded) {
                        // Wait a bit more for font to load
                        let attempts = 0;
                        const maxAttempts = 10; // 1 second
                        while (!fontLoaded && attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                            fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                            attempts++;
                        }
                    if (!fontLoaded) {
                        console.warn(`${GLOBAL_FONT_FAMILY} font not detected for wall art text, but proceeding`);
                        } else {
                            console.log(`✓ ${GLOBAL_FONT_FAMILY} font confirmed loaded for wall art text`);
                        }
                    }
                }

                // Function to get responsive font size (same as CCTV)
                const getResponsiveWallArtFontSize = () => {
                    const minDimension = Math.min(window.innerWidth, window.innerHeight);
                    let fontSize = 140; // Default for large screens

                    if (minDimension <= 480) {
                        // Small phones
                        fontSize = 60;
                    } else if (minDimension <= 768) {
                        // Tablets and larger phones
                        fontSize = 80;
                    } else if (minDimension <= 1024) {
                        // Small laptops
                        fontSize = 100;
                    } else if (minDimension <= 1440) {
                        // Laptops
                        fontSize = 120;
                    }

                    return fontSize;
                };

                // Create "OUR TEAM" text with Google Font (Zilla Slab Highlight)
                const wallArtTextStyle = new TextStyle({
                    fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK,
                    fontSize: getResponsiveWallArtFontSize(),
                    fill: 0xFFFFFF,
                    align: 'center',
                    fontWeight: 'bold',
                });

                wallArtTextSprite = new Text({
                    text: 'OUR TEAM',
                    style: wallArtTextStyle,
                });

                wallArtTextSprite.anchor.set(0.5);
                wallArtTextSprite.visible = false;
                wallArtTextSprite.eventMode = 'none';

                // Store responsive font size function and animation state in userData
                wallArtTextSprite.userData = {
                    getResponsiveFontSize: getResponsiveWallArtFontSize,
                    startX: null,
                    startY: null,
                    targetX: null,
                    targetY: null,
                    currentX: null,
                    currentY: null,
                    isAnimating: false,
                    animationSpeed: 0.09, // Same as Mutator and CCTV
                };

                // Add text to stage
                app.stage.addChild(wallArtTextSprite);
            };

            await createWallArtText();

            // Function to refresh text sprites to ensure custom fonts are used
            const refreshTextSprites = async () => {
                if (!document.fonts || !document.fonts.check) return;
                
                function checkFont(fontFamily) {
                    return document.fonts.check(`1em "${fontFamily}"`) || 
                           document.fonts.check(`1em ${fontFamily}`) ||
                           document.fonts.check(`12px "${fontFamily}"`) ||
                           document.fonts.check(`12px ${fontFamily}`);
                }
                
                let fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                if (!fontLoaded) {
                    // Wait a bit more
                    let attempts = 0;
                    while (!fontLoaded && attempts < 10) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                        attempts++;
                    }
                }
                
                if (!fontLoaded) {
                    console.warn('Font not loaded, skipping text refresh');
                    return;
                }
                
                // Force refresh of all text sprites by updating their style
                const textSprites = [
                    { sprite: mutatorCapsuleTextSprite, name: 'Mutator' },
                    { sprite: cctvTextSprite, name: 'CCTV' },
                    { sprite: bookTextSprite, name: 'Book' },
                    { sprite: wallArtTextSprite, name: 'Wall Art' }
                ];
                
                textSprites.forEach(({ sprite, name }) => {
                    if (sprite && sprite.style) {
                        try {
                            // Store original text and style
                            const originalText = sprite.text;
                            const originalStyle = sprite.style;
                            
                            // Create new style with updated fontFamily to force re-render
                            const newStyle = new TextStyle({
                                ...originalStyle,
                                fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK
                            });
                            
                            // Update the text sprite with new style
                            sprite.style = newStyle;
                            sprite.text = originalText; // Force update by setting text again
                            
                            console.log(`✓ Refreshed ${name} text sprite font`);
                        } catch (error) {
                            console.warn(`Error refreshing ${name} text sprite:`, error);
                        }
                    }
                });
            };
            
            // Refresh text sprites after fonts are confirmed loaded
            // Use multiple timeouts to catch fonts that load later
            setTimeout(() => {
                refreshTextSprites();
            }, 1000);
            
            setTimeout(() => {
                refreshTextSprites();
            }, 2000);

            // Store animation ticker reference
            let wallArtAnimationTicker = null;

            // Function to show text with ATM card ejection animation (slides up from bottom)
            const showWallArtText = () => {
                if (!wallArtTextSprite || !wallArtSprite) return;

                // Remove any existing animation ticker
                if (wallArtAnimationTicker) {
                    app.ticker.remove(wallArtAnimationTicker);
                    wallArtAnimationTicker = null;
                }

                // Calculate positions for ATM card ejection effect (slides up from bottom)
                const bg1TargetX = 2666.5; // Target X position (same as Mutator and CCTV)
                const bg1TargetY = 1630.5; // Final Y position (same level as Mutator and CCTV)

                // Get current background position and scale to convert coordinates
                if (backgroundSprite) {
                    const scale = currentScale || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                    // Convert bg1 coordinates to screen coordinates
                    const normalizedTargetX = bg1TargetX / imageWidth;
                    const normalizedTargetY = bg1TargetY / imageHeight;

                    const targetScreenX = bg1Left + (normalizedTargetX * bg1DisplayedWidth);
                    const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                    // Target position (final position where text should be)
                    wallArtTextSprite.userData.targetX = targetScreenX;
                    wallArtTextSprite.userData.targetY = targetScreenY;

                    // Start position (text starts from bottom, slides up like ATM card ejection)
                    const cardEjectionDistance = 300; // Distance to slide up
                    wallArtTextSprite.userData.startX = targetScreenX; // Same X position
                    wallArtTextSprite.userData.startY = targetScreenY + cardEjectionDistance; // Start below, slides up
                } else {
                    // Fallback: use center page position directly
                    wallArtTextSprite.userData.targetX = app.screen.width / 2;
                    wallArtTextSprite.userData.targetY = app.screen.height / 2;
                    const cardEjectionDistance = 300;
                    wallArtTextSprite.userData.startX = wallArtTextSprite.userData.targetX; // Same X
                    wallArtTextSprite.userData.startY = wallArtTextSprite.userData.targetY + cardEjectionDistance; // Start from bottom
                }

                // Reset animation state
                wallArtTextSprite.userData.isAnimating = true;

                // Start position (text starts from bottom, slides up like ATM card ejection)
                wallArtTextSprite.x = wallArtTextSprite.userData.startX;
                wallArtTextSprite.y = wallArtTextSprite.userData.startY;
                wallArtTextSprite.userData.currentX = wallArtTextSprite.userData.startX;
                wallArtTextSprite.userData.currentY = wallArtTextSprite.userData.startY;

                // Make visible
                wallArtTextSprite.visible = true;
                wallArtTextSprite.alpha = 1.0;

                // Animate text sliding up from bottom (ATM card ejection effect)
                wallArtTextSprite.userData.isAnimating = true;
                wallArtAnimationTicker = app.ticker.add(() => {
                    if (!wallArtTextSprite || !wallArtTextSprite.userData.isAnimating) return;

                    const data = wallArtTextSprite.userData;
                    const distanceX = data.targetX - data.currentX;
                    const distanceY = data.targetY - data.currentY;

                    if (Math.abs(distanceX) > 0.5 || Math.abs(distanceY) > 0.5) {
                        // Continue sliding up towards target
                        data.currentX += (distanceX * data.animationSpeed);
                        data.currentY += (distanceY * data.animationSpeed);
                        wallArtTextSprite.x = data.currentX;
                        wallArtTextSprite.y = data.currentY;
                    } else {
                        // Reached target position
                        wallArtTextSprite.x = data.targetX;
                        wallArtTextSprite.y = data.targetY;
                        data.currentX = data.targetX;
                        data.currentY = data.targetY;
                        data.isAnimating = false;
                        app.ticker.remove(wallArtAnimationTicker);
                        wallArtAnimationTicker = null;
                    }
                });
            };

            // Function to hide text
            const hideWallArtText = () => {
                if (!wallArtTextSprite) return;

                // Remove any existing animation ticker
                if (wallArtAnimationTicker) {
                    app.ticker.remove(wallArtAnimationTicker);
                    wallArtAnimationTicker = null;
                }

                // Stop any ongoing animation
                if (wallArtTextSprite.userData) {
                    wallArtTextSprite.userData.isAnimating = false;
                }

                // Hide text immediately
                wallArtTextSprite.visible = false;
                wallArtTextSprite.alpha = 0;
            };

            // Create simple label text for mobile/tablet (just "OUR TEAM")
            const wallArtMobileLabelStyle = new TextStyle({
                fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK,
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold',
            });
            wallArtLabelText = new Text({
                text: 'Our Team',
                style: wallArtMobileLabelStyle,
            });
            wallArtLabelText.anchor.set(0.5);
            wallArtLabelText.visible = false; // Hidden by default, only shown on mobile/tablet
            app.stage.addChild(wallArtLabelText);

            // Create circle with "click to explore" text (hidden by default, similar to CCTV)
            wallArtCircleText = new Container();

            // Create circle background - smaller circle, no border
            const wallArtCircleBg = new Graphics();
            const wallArtCircleRadius = 70; // Same as CCTV
            wallArtCircleBg.circle(0, 0, wallArtCircleRadius);
            wallArtCircleBg.fill({ color: 0xFFFFFF, alpha: 0.1 }); // Semi-transparent white

            // Create text style - same as CCTV: simple, pure white, sans-serif, smaller, bold
            const wallArtCircleTextStyle = new TextStyle({
                fontFamily: 'sans-serif', // System sans-serif font
                fontSize: 16, // Same as CCTV
                fill: 0xFFFFFF, // Pure white
                align: 'center',
                fontWeight: 'bold', // Bold text for better visibility
            });

            // Create two-line text: "Click To" on top, "Explore" below (desktop only)
            const wallArtClickTextTop = new Text({
                text: 'Click To',
                style: wallArtCircleTextStyle,
            });
            wallArtClickTextTop.anchor.set(0.5);
            wallArtClickTextTop.x = 0;
            wallArtClickTextTop.y = -8; // Position above center

            const wallArtClickTextBottom = new Text({
                text: 'Explore',
                style: wallArtCircleTextStyle,
            });
            wallArtClickTextBottom.anchor.set(0.5);
            wallArtClickTextBottom.x = 0;
            wallArtClickTextBottom.y = 8; // Position below center

            wallArtCircleText.addChild(wallArtCircleBg);
            wallArtCircleText.addChild(wallArtClickTextTop);
            wallArtCircleText.addChild(wallArtClickTextBottom);
            wallArtCircleText.visible = false; // Hidden by default, only shows when dot is hovered
            wallArtCircleText.eventMode = 'none'; // Allow pointer events to pass through for global tracking
            wallArtCircleText.cursor = 'default';

            // Add circle text to stage
            app.stage.addChild(wallArtCircleText);

            // Track global mouse position for circle following
            let wallArtLastMousePos = { x: 0, y: 0 };
            let wallArtIsCircleActive = false;

            // Offset to position text at cursor tip (above and to the right of cursor)
            const WALLARTCURSOR_TIP_OFFSET_X = 12; // Offset to the right
            const WALLARTCURSOR_TIP_OFFSET_Y = -25; // Offset upward (above cursor tip)

            // Function to check if cursor is within dot's bounds
            const isCursorInWallArtDotBounds = (cursorX, cursorY) => {
                if (!wallArtDot || !wallArtDot.parent || !wallArtDot.userData) {
                    return false;
                }

                const dotX = wallArtDot.x;
                const dotY = wallArtDot.y;
                const baseRadius = wallArtDot.userData.baseRadius || 8;
                const maxWaveExpansion = 15;
                const tolerance = baseRadius * 0.8;
                const maxDotRadius = baseRadius + maxWaveExpansion + tolerance;

                const dx = cursorX - dotX;
                const dy = cursorY - dotY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                return distance <= maxDotRadius;
            };

            // Function to show circle and activate effects (desktop only)
            const showWallArtCircle = (cursorX, cursorY) => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return;
                }

                // Only show if not already active (prevent multiple triggers)
                if (wallArtIsCircleActive) return;

                wallArtDot.visible = false;
                wallArtCircleText.visible = true;
                wallArtIsCircleActive = true;

                // Show "OUR TEAM" text animation (slides up from below) - appears when cursor is pointed (desktop only)
                // On mobile/tablet, don't show animated text - only fixed label text below dot
                if (!(typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet())) {
                    showWallArtText();
                }

                // Show stroke overlay (animated stroke frames around wall art)
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.visible = true;
                    wallArtStrokeSprite.alpha = 1.0;
                    // Position and scale stroke to match wall art
                    wallArtStrokeSprite.x = wallArtSprite.x;
                    wallArtStrokeSprite.y = wallArtSprite.y;
                    wallArtStrokeSprite.scale.set(wallArtSprite.scale.x, wallArtSprite.scale.y);
                }

                // Position circle at cursor tip (offset so text appears above cursor, not covered by it)
                wallArtCircleText.x = cursorX + WALLARTCURSOR_TIP_OFFSET_X;
                wallArtCircleText.y = cursorY + WALLARTCURSOR_TIP_OFFSET_Y;
            };

            // Function to hide circle and show dot
            const hideWallArtCircle = () => {
                // Only hide if currently active (prevent multiple triggers)
                if (!wallArtIsCircleActive) return;

                wallArtDot.visible = true;
                wallArtCircleText.visible = false;
                wallArtIsCircleActive = false;

                // Hide "OUR TEAM" text animation - vanishes when cursor is not pointed
                hideWallArtText();

                // Hide stroke overlay
                if (wallArtStrokeSprite) {
                    wallArtStrokeSprite.visible = false;
                }
            };

            // Function to update circle and text based on cursor bounds
            const updateWallArtCircleBasedOnBounds = (cursorX, cursorY) => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return; // Skip circle text logic on mobile/tablet
                }

                const inBounds = isCursorInWallArtDotBounds(cursorX, cursorY);

                if (inBounds && !wallArtIsCircleActive) {
                    // Cursor entered dot bounds - show circle and text
                    showWallArtCircle(cursorX, cursorY);
                } else if (!inBounds && wallArtIsCircleActive) {
                    // Cursor left dot bounds - hide circle and text immediately
                    hideWallArtCircle();
                } else if (!inBounds && wallArtTextSprite && wallArtTextSprite.visible) {
                    // Extra safety check: if text is visible but cursor is out of bounds, hide it
                    hideWallArtText();
                }
            };

            // Track mouse on canvas and document level (same as CCTV)
            document.addEventListener('mousemove', (e) => {
                const rect = app.canvas.getBoundingClientRect();
                const scaleX = app.canvas.width / rect.width;
                const scaleY = app.canvas.height / rect.height;

                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                wallArtLastMousePos.x = mouseX;
                wallArtLastMousePos.y = mouseY;

                updateWallArtCircleBasedOnBounds(mouseX, mouseY);

                // Update circle position if active
                if (wallArtIsCircleActive) {
                    wallArtCircleText.x = mouseX + WALLARTCURSOR_TIP_OFFSET_X;
                    wallArtCircleText.y = mouseY + WALLARTCURSOR_TIP_OFFSET_Y;
                }
            });

            // Handle touch move (mobile) - important for responsive bounds checking
            document.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches.length > 0) {
                    const rect = app.canvas.getBoundingClientRect();
                    const scaleX = app.canvas.width / rect.width;
                    const scaleY = app.canvas.height / rect.height;

                    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
                    const touchY = (e.touches[0].clientY - rect.top) * scaleY;

                    wallArtLastMousePos.x = touchX;
                    wallArtLastMousePos.y = touchY;

                    // Only update if not dragging (to avoid interference with panning)
                    if (!isDragging) {
                        updateWallArtCircleBasedOnBounds(touchX, touchY);

                        // Update circle position if active
                        if (wallArtIsCircleActive) {
                            wallArtCircleText.x = touchX + WALLARTCURSOR_TIP_OFFSET_X;
                            wallArtCircleText.y = touchY + WALLARTCURSOR_TIP_OFFSET_Y;
                        }
                    }
                }
            }, { passive: true });

            // Stage pointer move for better tracking within canvas
            app.stage.on('globalpointermove', (e) => {
                const globalPos = e.global;
                wallArtLastMousePos.x = globalPos.x;
                wallArtLastMousePos.y = globalPos.y;
                updateWallArtCircleBasedOnBounds(globalPos.x, globalPos.y);
            });

            // Ticker to continuously check bounds and update circle/text
            app.ticker.add(() => {
                if (wallArtDot && wallArtDot.parent) {
                    // Update based on cursor bounds - this controls both circle and text visibility
                    updateWallArtCircleBasedOnBounds(wallArtLastMousePos.x, wallArtLastMousePos.y);

                    // Update circle position if active
                    if (wallArtIsCircleActive) {
                        wallArtCircleText.x = wallArtLastMousePos.x + WALLARTCURSOR_TIP_OFFSET_X;
                        wallArtCircleText.y = wallArtLastMousePos.y + WALLARTCURSOR_TIP_OFFSET_Y;
                    }

                    // Safety check: ensure text is hidden if circle is not active
                    if (!wallArtIsCircleActive && wallArtTextSprite && wallArtTextSprite.visible) {
                        hideWallArtText();
                    }
                }
            });

            // Touch/click handlers for mobile and desktop - similar to CCTV
            // Handle pointerdown for better mobile touch support
            wallArtDot.on('pointerdown', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // On mobile/tablet, don't show circle - just prepare for click
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    event.stopPropagation(); // Prevent panning from starting
                    return;
                }
                // On desktop, treat as hover
                const globalPos = event.global;
                showWallArtCircle(globalPos.x, globalPos.y);
                event.stopPropagation(); // Prevent panning from starting
            });

            wallArtDot.on('pointerup', (event) => {
                const globalPos = event.global;
                // On mobile/tablet, always redirect on tap
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    console.log('Wall Art tapped (mobile/tablet) - redirecting to our_team');
                    window.location.href = 'our_team.html';
                    event.stopPropagation();
                    return;
                }
                // On desktop, only redirect if in bounds
                if (isCursorInWallArtDotBounds(globalPos.x, globalPos.y)) {
                    console.log('Wall Art tapped - redirecting to our_team');
                    window.location.href = 'our_team.html';
                }
                event.stopPropagation(); // Prevent panning
            });

            // Also handle pointertap as fallback
            wallArtDot.on('pointertap', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // On mobile/tablet, always redirect
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    console.log('Wall Art tapped (mobile/tablet) - redirecting to our_team');
                    window.location.href = 'our_team.html';
                    event.stopPropagation();
                    return;
                }
                // On desktop, redirect
                console.log('Wall Art tapped - redirecting to our_team');
                window.location.href = 'our_team.html';
                event.stopPropagation(); // Prevent panning
            });

            // Also allow clicking on circle text to redirect
            wallArtCircleText.eventMode = 'static';
            wallArtCircleText.cursor = 'pointer';

            wallArtCircleText.on('pointerdown', (event) => {
                event.stopPropagation();
            });

            wallArtCircleText.on('pointertap', () => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Wall Art circle clicked - redirecting to our_team');
                window.location.href = 'our_team.html';
            });

            // Click handler for dot

            // Dot position is updated in resizeBackground, no need for separate ticker

            console.log('Wall Art sprite with animation added successfully');

        } catch (error) {
            console.error('Error loading Wall Art textures:', error);
        }

        // Load Book sprite (book.png)
        try {
            console.log('Loading Book sprite...');
            const bookTexture = await Assets.load('assets/book.png');
            console.log(`  Loaded book.png:`, bookTexture.width, 'x', bookTexture.height);

            // Load Book stroke (book_stroke.png)
            console.log('Loading Book stroke...');
            const bookStrokeTexture = await Assets.load('assets/book_stroke.png');
            console.log(`  Loaded book_stroke.png:`, bookStrokeTexture.width, 'x', bookStrokeTexture.height);

            // Create Sprite from the book texture
            bookSprite = new Sprite(bookTexture);
            bookSprite.anchor.set(0.5);

            // Load book move sound effect
            bookMoveSound = new Audio('assets/sounds/book_move.mp3');
            bookMoveSound.volume = 0.6; // Set volume (60%)
            bookMoveSound.preload = 'auto';
            // Start unmuted - will sync after user interaction
            bookMoveSound.muted = false;
            
            // Handle audio errors
            bookMoveSound.addEventListener('error', (e) => {
                console.warn('Could not load book move sound:', e);
            });

            // Hide sprite initially until resizeBackground positions it correctly
            bookSprite.visible = false;
            bookSprite.alpha = 1.0;

            console.log('Book Sprite created');

            // Get book image dimensions
            const bookImageWidth = bookTexture.orig?.width || bookTexture.width || bookTexture.baseTexture.width || 1920;
            const bookImageHeight = bookTexture.orig?.height || bookTexture.height || bookTexture.baseTexture.height || 1080;

            console.log(`Book texture loaded: ${bookImageWidth}x${bookImageHeight}`);

            // Book config
            // Position on bg1.png:
            // Top-left: Y: 2524px, X: 771px
            // Bottom-right: Y: 3025px, X: 1709px
            // Center X: (771 + 1709) / 2 = 1240
            // Center Y: (2524 + 3025) / 2 = 2774.5
            // Dimensions: Width: 939px, Height: 502px
            const bookConfig = {
                bg1X: 1240, // Center X position on bg1.png
                bg1Y: 2774.5, // Center Y position on bg1.png
                bookWidth: 939, // Width of book on bg1.png
                bookHeight: 502, // Height of book on bg1.png
                scale: null, // Will be calculated based on bg1 scale
                offsetX: 0,
                offsetY: 0
            };

            // Calculate scale to make book image fit into designated space on bg1.png
            if (bookImageWidth && bookImageHeight && bookConfig.bookWidth && bookConfig.bookHeight) {
                const relativeScaleX = bookConfig.bookWidth / bookImageWidth;
                const relativeScaleY = bookConfig.bookHeight / bookImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                bookConfig.scale = Math.min(relativeScaleX, relativeScaleY);

                console.log(`Book config:`);
                console.log(`  Book dimensions on bg1.png: ${bookConfig.bookWidth}x${bookConfig.bookHeight}`);
                console.log(`  BG1 position (center): (${bookConfig.bg1X}, ${bookConfig.bg1Y})`);
                console.log(`  Actual book image size: ${bookImageWidth}x${bookImageHeight}`);
                console.log(`  Calculated scale: ${bookConfig.scale}`);
            } else {
                // Fallback: use natural size
                bookConfig.scale = 1.0;
                console.warn('Book: Could not calculate scale, using default 1.0');
            }

            // Store config in userData for book sprite
            bookSprite.userData = bookSprite.userData || {};
            bookSprite.userData.config = bookConfig;
            bookSprite.userData.baseScale = 1.0; // Will be set after first resizeBackground call

            // Create stroke Sprite from the stroke texture
            bookStrokeSprite = new Sprite(bookStrokeTexture);
            bookStrokeSprite.anchor.set(0.5);

            // Stroke sprite is hidden by default, shown on hover
            bookStrokeSprite.visible = false;
            bookStrokeSprite.alpha = 1.0;

            console.log('Book Stroke Sprite created');

            // Get book stroke image dimensions
            const bookStrokeImageWidth = bookStrokeTexture.orig?.width || bookStrokeTexture.width || bookStrokeTexture.baseTexture.width || 1920;
            const bookStrokeImageHeight = bookStrokeTexture.orig?.height || bookStrokeTexture.height || bookStrokeTexture.baseTexture.height || 1080;

            console.log(`Book stroke texture loaded: ${bookStrokeImageWidth}x${bookStrokeImageHeight}`);

            // Book stroke config - now uses same config as book for perfect alignment
            // The stroke sprite will always match the book sprite's position and scale
            // Store reference to book config in stroke sprite userData
            bookStrokeSprite.userData = bookStrokeSprite.userData || {};
            bookStrokeSprite.userData.useBookConfig = true; // Flag to use book's config

            // Make book sprite interactive for hover effects
            bookSprite.eventMode = 'static';
            bookSprite.cursor = 'pointer';
            
            // Store original rotation for hover animation
            bookSprite.userData.originalRotation = 0;
            bookSprite.userData.isHovered = false;
            bookSprite.userData.isAnimating = false;
            bookSprite.userData.hoverAnimationTime = 0;
            bookSprite.userData.hoverTicker = null;

            // Add to stage
            app.stage.addChild(bookSprite);

            // Set initial position (will be updated by resizeBackground)
            bookSprite.x = app.screen.width / 2;
            bookSprite.y = app.screen.height / 2;

            // Add stroke overlay to stage (on top of book sprite)
            app.stage.addChild(bookStrokeSprite);

            // Set initial position and scale (will be updated in resizeBackground)
            // Stroke sprite will always match book sprite's position and scale
            bookStrokeSprite.x = bookSprite.x;
            bookStrokeSprite.y = bookSprite.y;
            bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);

            // Function to calculate responsive font size based on screen size
            const getResponsiveBookFontSize = () => {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const minDimension = Math.min(screenWidth, screenHeight);

                // Large screens (desktop) - big text
                let fontSize = 180;

                // Responsive scaling based on screen size
                if (minDimension <= 768) {
                    // Mobile phones - smaller
                    fontSize = 72;
                } else if (minDimension <= 1024) {
                    // Tablets - medium
                    fontSize = 96;
                } else if (minDimension <= 1440) {
                    // Small laptops - medium-large
                    fontSize = 120;
                } else if (minDimension <= 1920) {
                    // Standard desktop - large
                    fontSize = 150;
                }
                // Larger screens use fontSize = 180

                return fontSize;
            };

            // Function to calculate responsive dot radius based on screen size
            const getResponsiveBookDotRadius = () => {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const minDimension = Math.min(screenWidth, screenHeight);

                // Base size for large screens (desktop)
                let baseRadius = 4;

                // Responsive scaling based on screen size
                if (minDimension <= 768) {
                    // Mobile phones - smallest
                    baseRadius = 2.5;
                } else if (minDimension <= 1024) {
                    // Tablets - small
                    baseRadius = 3;
                } else if (minDimension <= 1440) {
                    // Small laptops - medium
                    baseRadius = 3.5;
                }
                // Desktop (larger) uses baseRadius = 4

                return baseRadius;
            };

            // Create pulsing dot at center of book (wave-like animation)
            bookDot = new Graphics();
            const dotColor = 0xFFFFFF; // White dot

            // Pulsing animation variables
            bookDot.userData = bookDot.userData || {};
            bookDot.userData.pulseTime = 0;
            bookDot.userData.baseRadius = getResponsiveBookDotRadius();

            // Function to update dot size (call on resize)
            const updateBookDotSize = () => {
                bookDot.userData.baseRadius = getResponsiveBookDotRadius();
            };

            // Draw initial dot
            bookDot.circle(0, 0, bookDot.userData.baseRadius);
            bookDot.fill({ color: dotColor, alpha: 0.9 });
            // Hide dot initially until resizeBackground positions it correctly
            bookDot.visible = false;
            bookDot.eventMode = 'static';
            bookDot.cursor = 'pointer';

            // Position dot at center of book sprite
            bookDot.x = bookSprite.x;
            bookDot.y = bookSprite.y;

            // Add dot to stage
            app.stage.addChild(bookDot);

            // Enhanced smooth pulsing animation (nicer wave effect)
            app.ticker.add(() => {
                if (bookDot && bookDot.visible && bookDot.parent) {
                    bookDot.userData.pulseTime += 0.025; // Smooth, gentle pulse speed

                    // Additional null check before clearing to prevent errors
                    if (bookDot && typeof bookDot.clear === 'function') {
                        bookDot.clear();
                    }

                    const baseRadius = bookDot.userData.baseRadius;

                    // Create multiple smooth ripple waves for enhanced effect
                    const numWaves = 4; // More waves for smoother effect
                    for (let i = 0; i < numWaves; i++) {
                        // Smoother wave calculation using easing
                        const wavePhase = bookDot.userData.pulseTime + (i * (Math.PI * 2 / numWaves));

                        // Use smoother sine wave with adjusted amplitude
                        const waveSize = Math.sin(wavePhase);

                        // Smoother wave expansion - more gradual
                        const waveExpansion = 8 + (i * 1.5);
                        const waveRadius = baseRadius + (waveSize * waveExpansion * (1 - i * 0.25));

                        // Smoother alpha fade - more gradual
                        const baseAlpha = 0.95 - (i * 0.15);
                        const alphaVariation = Math.abs(waveSize) * 0.3;
                        const waveAlpha = Math.max(0, Math.min(0.95, baseAlpha - alphaVariation));

                        // Only draw if radius and alpha are valid
                        if (waveRadius > 0 && waveAlpha > 0.05) {
                            bookDot.circle(0, 0, waveRadius);
                            bookDot.fill({ color: dotColor, alpha: waveAlpha });
                        }
                    }
                }
            });

            // Wait for font to load before creating text
            const createBookText = async () => {
                // Wait for font to be loaded before creating text
                if (document.fonts && document.fonts.check) {
                    function checkFont(fontFamily) {
                        return document.fonts.check(`1em "${fontFamily}"`) || 
                               document.fonts.check(`1em ${fontFamily}`) ||
                               document.fonts.check(`12px "${fontFamily}"`) ||
                               document.fonts.check(`12px ${fontFamily}`);
                    }
                    
                    let fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                    if (!fontLoaded) {
                        // Wait a bit more for font to load
                        let attempts = 0;
                        const maxAttempts = 10; // 1 second
                        while (!fontLoaded && attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                            fontLoaded = checkFont(GLOBAL_FONT_FAMILY);
                            attempts++;
                        }
                    if (!fontLoaded) {
                        console.warn(`${GLOBAL_FONT_FAMILY} font not detected for Book text, but proceeding`);
                        } else {
                            console.log(`✓ ${GLOBAL_FONT_FAMILY} font confirmed loaded for Book text`);
                        }
                    }
                }

                // Create "Community" text with Google Font
                const bookTextStyle = new TextStyle({
                    fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK, // Google Font with fallback
                    fontSize: getResponsiveBookFontSize(),
                    fill: 0xFFFFFF, // White text
                    align: 'center',
                    fontWeight: 'bold',
                });

                bookTextSprite = new Text({
                    text: 'COMMUNITY',
                    style: bookTextStyle,
                });

                bookTextSprite.anchor.set(0.5); // Center the text
                bookTextSprite.visible = false; // Hidden by default, shows on hover
                bookTextSprite.eventMode = 'none'; // Don't block pointer events

                // Store responsive font size function and animation state in userData
                bookTextSprite.userData = {
                    getResponsiveFontSize: getResponsiveBookFontSize,
                    startX: null,
                    startY: null,
                    targetX: null,
                    targetY: null,
                    currentX: null,
                    currentY: null,
                    isAnimating: false,
                    animationSpeed: 0.09, // Speed of ATM withdrawal animation
                };

                // Add text to stage
                app.stage.addChild(bookTextSprite);
            };

            // Call async function to create text with font loading
            await createBookText();

            // Store animation ticker reference to prevent multiple tickers
            let bookAnimationTicker = null;

            // Function to show text with ATM withdrawal animation (slides up from below)
            const showBookText = () => {
                if (!bookTextSprite || !bookSprite) return;

                // Remove any existing animation ticker
                if (bookAnimationTicker) {
                    app.ticker.remove(bookAnimationTicker);
                    bookAnimationTicker = null;
                }

                // Calculate positions for ATM card ejection effect (slides up from bottom)
                const bg1TargetX = 2666.5; // Target X position (same as Mutator, CCTV, and Wall Art)
                const bg1TargetY = 1630.5; // Final Y position (same level as Mutator, CCTV, and Wall Art)

                // Get current background position and scale to convert coordinates
                if (backgroundSprite && bookSprite.userData && bookSprite.userData.config) {
                    const bookConfig = bookSprite.userData.config;
                    const scale = currentScale || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                    // Convert bg1 coordinates to screen coordinates
                    const normalizedTargetX = bg1TargetX / imageWidth;
                    const normalizedTargetY = bg1TargetY / imageHeight;

                    const targetScreenX = bg1Left + (normalizedTargetX * bg1DisplayedWidth);
                    const targetScreenY = bg1Top + (normalizedTargetY * bg1DisplayedHeight);

                    // Target position (final position where text should be)
                    bookTextSprite.userData.targetX = targetScreenX;
                    bookTextSprite.userData.targetY = targetScreenY;

                    // Start position (text starts from bottom, slides up like ATM card ejection)
                    const cardEjectionDistance = 300; // Distance to slide up
                    bookTextSprite.userData.startX = targetScreenX; // Same X position
                    bookTextSprite.userData.startY = targetScreenY + cardEjectionDistance; // Start below, slides up
                } else {
                    // Fallback: use center page position directly
                    bookTextSprite.userData.targetX = app.screen.width / 2;
                    bookTextSprite.userData.targetY = app.screen.height / 2;
                    const cardEjectionDistance = 300;
                    bookTextSprite.userData.startX = bookTextSprite.userData.targetX; // Same X
                    bookTextSprite.userData.startY = bookTextSprite.userData.targetY + cardEjectionDistance; // Start from bottom
                }

                // Reset animation state
                bookTextSprite.userData.isAnimating = true;

                // Start position (text starts from bottom, slides up like ATM card ejection)
                bookTextSprite.x = bookTextSprite.userData.startX;
                bookTextSprite.y = bookTextSprite.userData.startY;
                bookTextSprite.userData.currentX = bookTextSprite.userData.startX;
                bookTextSprite.userData.currentY = bookTextSprite.userData.startY;

                // Make visible - appears when cursor is pointed
                bookTextSprite.visible = true;
                bookTextSprite.alpha = 1.0;

                // Animate text sliding up from bottom (ATM card ejection effect)
                bookTextSprite.userData.isAnimating = true;
                bookAnimationTicker = app.ticker.add(() => {
                    if (!bookTextSprite || !bookTextSprite.userData.isAnimating) return;

                    const data = bookTextSprite.userData;
                    const distanceX = data.targetX - data.currentX;
                    const distanceY = data.targetY - data.currentY;

                    if (Math.abs(distanceX) > 0.5 || Math.abs(distanceY) > 0.5) {
                        // Continue sliding up towards target
                        data.currentX += (distanceX * data.animationSpeed);
                        data.currentY += (distanceY * data.animationSpeed);
                        bookTextSprite.x = data.currentX;
                        bookTextSprite.y = data.currentY;
                    } else {
                        // Reached target position
                        bookTextSprite.x = data.targetX;
                        bookTextSprite.y = data.targetY;
                        data.currentX = data.targetX;
                        data.currentY = data.targetY;
                        data.isAnimating = false;
                        app.ticker.remove(bookAnimationTicker);
                        bookAnimationTicker = null;
                    }
                });
            };

            // Function to hide text
            const hideBookText = () => {
                if (!bookTextSprite) return;

                // Remove any existing animation ticker
                if (bookAnimationTicker) {
                    app.ticker.remove(bookAnimationTicker);
                    bookAnimationTicker = null;
                }

                // Stop any ongoing animation
                if (bookTextSprite.userData) {
                    bookTextSprite.userData.isAnimating = false;
                }

                // Hide text immediately when cursor is not pointed
                bookTextSprite.visible = false;
                bookTextSprite.alpha = 0;
            };

            // Create simple label text for mobile/tablet (just "Community")
            const bookMobileLabelStyle = new TextStyle({
                fontFamily: GLOBAL_FONT_FAMILY_WITH_FALLBACK,
                fontSize: 18,
                fill: 0xFFFFFF,
                align: 'center',
                fontWeight: 'bold',
            });
            bookLabelText = new Text({
                text: 'Community',
                style: bookMobileLabelStyle,
            });
            bookLabelText.anchor.set(0.5);
            bookLabelText.visible = false; // Hidden by default, only shown on mobile/tablet
            app.stage.addChild(bookLabelText);

            // Create circle with "click to explore" text (hidden by default, similar to CCTV)
            bookCircleText = new Container();

            // Create circle background - smaller circle, no border
            const bookCircleBg = new Graphics();
            const bookCircleRadius = 70; // Same as CCTV
            bookCircleBg.circle(0, 0, bookCircleRadius);
            bookCircleBg.fill({ color: 0xFFFFFF, alpha: 0.1 }); // Semi-transparent white

            // Create text style - same as CCTV: simple, pure white, sans-serif, smaller, bold
            const bookCircleTextStyle = new TextStyle({
                fontFamily: 'sans-serif', // System sans-serif font
                fontSize: 16, // Same as CCTV
                fill: 0xFFFFFF, // Pure white
                align: 'center',
                fontWeight: 'bold', // Bold text for better visibility
            });

            // Create two-line text: "Click To" on top, "Explore" below (desktop only)
            const bookClickTextTop = new Text({
                text: 'Click To',
                style: bookCircleTextStyle,
            });
            bookClickTextTop.anchor.set(0.5);
            bookClickTextTop.x = 0;
            bookClickTextTop.y = -8; // Position above center

            const bookClickTextBottom = new Text({
                text: 'Explore',
                style: bookCircleTextStyle,
            });
            bookClickTextBottom.anchor.set(0.5);
            bookClickTextBottom.x = 0;
            bookClickTextBottom.y = 8; // Position below center

            bookCircleText.addChild(bookCircleBg);
            bookCircleText.addChild(bookClickTextTop);
            bookCircleText.addChild(bookClickTextBottom);
            bookCircleText.visible = false; // Hidden by default, only shows when dot is hovered
            bookCircleText.eventMode = 'none'; // Allow pointer events to pass through for global tracking
            bookCircleText.cursor = 'default';

            // Add circle text to stage
            app.stage.addChild(bookCircleText);

            // Track global mouse position for circle following
            let bookLastMousePos = { x: 0, y: 0 };
            let bookIsCircleActive = false;

            // Offset to position text at cursor tip (above and to the right of cursor)
            const BOOKCURSOR_TIP_OFFSET_X = 12; // Offset to the right
            const BOOKCURSOR_TIP_OFFSET_Y = -25; // Offset upward (above cursor tip)

            // Function to check if cursor is within dot's bounds
            const isCursorInBookDotBounds = (cursorX, cursorY) => {
                if (!bookDot || !bookDot.parent || !bookDot.userData) {
                    return false;
                }

                const dotX = bookDot.x;
                const dotY = bookDot.y;
                const baseRadius = bookDot.userData.baseRadius || getResponsiveBookDotRadius();
                const maxWaveExpansion = 12.5;
                const tolerance = baseRadius * 0.8;
                const maxDotRadius = baseRadius + maxWaveExpansion + tolerance;

                const dx = cursorX - dotX;
                const dy = cursorY - dotY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                return distance <= maxDotRadius;
            };

            // Function to show circle and activate effects (desktop only)
            const showBookCircle = (cursorX, cursorY) => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return;
                }

                // Only show if not already active (prevent multiple triggers)
                if (bookIsCircleActive) return;

                bookDot.visible = false;
                bookCircleText.visible = true;
                bookIsCircleActive = true;

                // Show "Community" text animation (slides up from below) - appears when cursor is pointed
                showBookText();

                // Show stroke overlay
                if (bookStrokeSprite && backgroundSprite) {
                    bookStrokeSprite.visible = true;
                    bookStrokeSprite.alpha = 1.0;
                    // Position stroke overlay to match book sprite exactly
                    if (bookSprite) {
                        bookStrokeSprite.x = bookSprite.x;
                        bookStrokeSprite.y = bookSprite.y;
                        bookStrokeSprite.scale.set(bookSprite.scale.x, bookSprite.scale.y);
                    }
                }

                // Position circle at cursor tip (offset so text appears above cursor, not covered by it)
                bookCircleText.x = cursorX + BOOKCURSOR_TIP_OFFSET_X;
                bookCircleText.y = cursorY + BOOKCURSOR_TIP_OFFSET_Y;
            };

            // Function to hide circle and show dot
            const hideBookCircle = () => {
                // Only hide if currently active (prevent multiple triggers)
                if (!bookIsCircleActive) return;

                bookDot.visible = true;
                bookCircleText.visible = false;
                bookIsCircleActive = false;

                // Hide "Community" text animation - vanishes when cursor is not pointed
                hideBookText();

                // Hide stroke overlay
                if (bookStrokeSprite) {
                    bookStrokeSprite.visible = false;
                }
            };

            // Function to update circle and text based on cursor bounds
            const updateBookCircleBasedOnBounds = (cursorX, cursorY) => {
                // Don't show circle text on mobile/tablet - label text is always visible
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    return; // Skip circle text logic on mobile/tablet
                }

                const inBounds = isCursorInBookDotBounds(cursorX, cursorY);

                if (inBounds && !bookIsCircleActive) {
                    // Cursor entered dot bounds - show circle and text
                    showBookCircle(cursorX, cursorY);
                } else if (!inBounds && bookIsCircleActive) {
                    // Cursor left dot bounds - hide circle and text immediately
                    hideBookCircle();
                } else if (!inBounds && bookTextSprite && bookTextSprite.visible) {
                    // Extra safety check: if text is visible but cursor is out of bounds, hide it
                    hideBookText();
                }
            };

            // Global mouse/touch tracking for circle following
            // Handle mouse move (desktop)
            document.addEventListener('mousemove', (e) => {
                const rect = app.canvas.getBoundingClientRect();
                const scaleX = app.canvas.width / rect.width;
                const scaleY = app.canvas.height / rect.height;

                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                bookLastMousePos.x = mouseX;
                bookLastMousePos.y = mouseY;

                updateBookCircleBasedOnBounds(mouseX, mouseY);

                // Update circle position if active
                if (bookIsCircleActive) {
                    bookCircleText.x = mouseX + BOOKCURSOR_TIP_OFFSET_X;
                    bookCircleText.y = mouseY + BOOKCURSOR_TIP_OFFSET_Y;
                }
            });

            // Handle touch move (mobile) - important for responsive bounds checking
            document.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches.length > 0) {
                    const rect = app.canvas.getBoundingClientRect();
                    const scaleX = app.canvas.width / rect.width;
                    const scaleY = app.canvas.height / rect.height;

                    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
                    const touchY = (e.touches[0].clientY - rect.top) * scaleY;

                    bookLastMousePos.x = touchX;
                    bookLastMousePos.y = touchY;

                    // Only update if not dragging (to avoid interference with panning)
                    if (!isDragging) {
                        updateBookCircleBasedOnBounds(touchX, touchY);

                        // Update circle position if active
                        if (bookIsCircleActive) {
                            bookCircleText.x = touchX + BOOKCURSOR_TIP_OFFSET_X;
                            bookCircleText.y = touchY + BOOKCURSOR_TIP_OFFSET_Y;
                        }
                    }
                }
            }, { passive: true });

            // Stage pointer move for better tracking within canvas
            app.stage.on('globalpointermove', (e) => {
                const globalPos = e.global;
                bookLastMousePos.x = globalPos.x;
                bookLastMousePos.y = globalPos.y;
                updateBookCircleBasedOnBounds(globalPos.x, globalPos.y);
            });

            // Ticker to continuously check bounds and update circle/text
            app.ticker.add(() => {
                if (bookDot && bookDot.parent) {
                    // Update based on cursor bounds - this controls both circle and text visibility
                    updateBookCircleBasedOnBounds(bookLastMousePos.x, bookLastMousePos.y);

                    // Update circle position if active
                    if (bookIsCircleActive) {
                        bookCircleText.x = bookLastMousePos.x + BOOKCURSOR_TIP_OFFSET_X;
                        bookCircleText.y = bookLastMousePos.y + BOOKCURSOR_TIP_OFFSET_Y;
                    }

                    // Safety check: ensure text is hidden if circle is not active
                    if (!bookIsCircleActive && bookTextSprite && bookTextSprite.visible) {
                        hideBookText();
                    }
                }
            });

            // Touch/click handlers for mobile and desktop
            // Handle pointerdown for better mobile touch support
            bookDot.on('pointerdown', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // On mobile/tablet, don't show circle - just prepare for click
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    event.stopPropagation(); // Prevent panning from starting
                    return;
                }
                // On desktop, treat as hover
                const globalPos = event.global;
                showBookCircle(globalPos.x, globalPos.y);
                event.stopPropagation(); // Prevent panning from starting
            });

            // Handle pointerup to detect tap/click (works better on mobile)
            bookDot.on('pointerup', (event) => {
                const globalPos = event.global;
                // On mobile/tablet, always redirect on tap
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    console.log('Book tapped (mobile/tablet) - redirecting to community page');
                    window.location.href = 'community.html';
                    event.stopPropagation();
                    return;
                }
                // On desktop, only redirect if in bounds
                if (isCursorInBookDotBounds(globalPos.x, globalPos.y)) {
                    console.log('Book tapped - redirecting to community page');
                    window.location.href = 'community.html';
                }
                event.stopPropagation(); // Prevent panning
            });

            // Also handle pointertap as fallback
            bookDot.on('pointertap', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                // On mobile/tablet, always redirect
                if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                    console.log('Book tapped (mobile/tablet) - redirecting to community page');
                    window.location.href = 'community.html';
                    event.stopPropagation();
                    return;
                }
                // On desktop, redirect
                console.log('Book tapped - redirecting to community page');
                window.location.href = 'community.html';
                event.stopPropagation(); // Prevent panning
            });

            // Also allow clicking on circle text to redirect
            bookCircleText.eventMode = 'static';
            bookCircleText.cursor = 'pointer';

            bookCircleText.on('pointerdown', (event) => {
                event.stopPropagation(); // Prevent panning
            });

            bookCircleText.on('pointerup', (event) => {
                event.stopPropagation(); // Prevent panning
            });

            bookCircleText.on('pointertap', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                console.log('Book circle clicked - redirecting to community page');
                window.location.href = 'community.html';
                event.stopPropagation(); // Prevent panning
            });

            // Animation state for one-time wobble effect (like cup sprite)
            bookSprite.userData.isOverBook = false;
            bookSprite.userData.isAnimating = false;
            bookSprite.userData.animationTime = 0;
            bookSprite.userData.animationDuration = 0.6; // Same duration as cup
            bookSprite.userData.animationTicker = null;
            
            // Hover animation for book sprite - one-time wobble/tilt when cursor passes (like cup sprite)
            bookSprite.on('pointerenter', (event) => {
                if (!bookSprite.userData) return;
                
                bookSprite.userData.isOverBook = true;
                
                // Play book move sound effect
                // Play regardless of bg music mute state (sounds start unmuted)
                if (bookMoveSound) {
                    // Reset to start and play
                    bookMoveSound.currentTime = 0;
                    bookMoveSound.play().catch((error) => {
                        console.warn('Could not play book move sound:', error);
                    });
                }
                
                // Always reset and restart animation when cursor enters (like cup sprite)
                // Reset animation state completely - this ensures animation always restarts
                bookSprite.userData.isAnimating = true;
                bookSprite.userData.animationTime = 0;
                lastBookAnimationTime = Date.now(); // Reset timing for new animation
                
                // Reset rotation to 0 before starting new animation
                bookSprite.rotation = 0;
                if (bookStrokeSprite) {
                    bookStrokeSprite.rotation = 0;
                }
            });

            bookSprite.on('pointerleave', (event) => {
                if (!bookSprite.userData) return;
                
                bookSprite.userData.isOverBook = false;
            });
            
            // Animate book wobble sequence (triggered on hover) - same as cup sprite
            let lastBookAnimationTime = Date.now();
            
            // Use a single ticker that checks animation state (like cup sprite)
            app.ticker.add(() => {
                if (bookSprite && bookSprite.userData) {
                    const data = bookSprite.userData;
                    
                    // Handle wobble animation sequence (one-time animation)
                    if (data.isAnimating) {
                        const now = Date.now();
                        const deltaSeconds = (now - lastBookAnimationTime) / 1000; // Convert to seconds
                        lastBookAnimationTime = now;
                        data.animationTime += deltaSeconds;
                        
                        const progress = Math.min(1, data.animationTime / data.animationDuration);
                        
                        // Wobble animation - subtle movement
                        const maxTilt = 3; // Reduced to 8 degrees for more subtle movement
                        const wobbleFrequency = 3; // How many wobbles during the animation
                        // Fade out the wobble as animation progresses (ease out)
                        const fadeOut = 1 - Math.pow(progress, 2); // Ease out curve
                        const wobbleAmount = Math.sin(progress * Math.PI * wobbleFrequency) * maxTilt * fadeOut;
                        const targetRotation = (wobbleAmount * Math.PI) / 180; // Convert to radians
                        
                        // Apply wobble rotation (position stays fixed)
                        const rotationSpeed = 0.4;
                        const rotationDiff = targetRotation - bookSprite.rotation;
                        bookSprite.rotation += rotationDiff * rotationSpeed;
                        
                        // Update stroke sprite rotation to match
                        if (bookStrokeSprite) {
                            bookStrokeSprite.rotation = bookSprite.rotation;
                        }
                        
                        // Animation complete
                        if (progress >= 1) {
                            data.isAnimating = false;
                            // Reset rotation to 0 immediately (like cup sprite)
                            bookSprite.rotation = 0;
                            if (bookStrokeSprite) {
                                bookStrokeSprite.rotation = 0;
                            }
                        }
                    } else {
                        // Reset rotation when not animating (like cup sprite)
                        if (Math.abs(bookSprite.rotation) > 0.001) {
                            bookSprite.rotation = 0;
                            if (bookStrokeSprite) {
                                bookStrokeSprite.rotation = 0;
                            }
                        }
                    }
                }
            });

            // Update dot size on window resize
            window.addEventListener('resize', () => {
                updateBookDotSize();
            });

            console.log('Book sprite added successfully');

        } catch (error) {
            console.error('Error loading Book textures:', error);
        }

        // Load lights_off.png with swinging animation
        try {
            console.log('Loading lights_off.png...');
            lightsOffTexture = await loadAssetWithProgress('assets/lights_off.png'); // Store globally for toggling

            // Get lights_off actual dimensions
            const lightsOffImageWidth = lightsOffTexture.orig?.width || lightsOffTexture.width || lightsOffTexture.baseTexture.width;
            const lightsOffImageHeight = lightsOffTexture.orig?.height || lightsOffTexture.height || lightsOffTexture.baseTexture.height;

            console.log(`  Loaded lights_off.png: ${lightsOffImageWidth}x${lightsOffImageHeight}`);

            // Lights off positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 2329, Right X: 3000, Top Y: 0, Bottom Y: 1086
            // Center X: (2329 + 3000) / 2 = 2664.5
            // Center Y: (0 + 1086) / 2 = 543
            // Dimensions: width: 672 pixels, height: 1087 pixels (on bg1.png)
            const lightsOffConfig = {
                // Lights off dimensions (on bg1.png coordinate space)
                lightsOffWidth: 672,
                lightsOffHeight: 1087,

                // Position on bg1.png (center of lights off)
                bg1X: 2664.5, // Center X position on bg1.png
                bg1Y: 543, // Center Y position on bg1.png

                // Scale: calculated to make lights off fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make lights off image fit into designated space on bg1.png
            if (lightsOffImageWidth && lightsOffImageHeight && lightsOffConfig.lightsOffWidth && lightsOffConfig.lightsOffHeight) {
                const relativeScaleX = lightsOffConfig.lightsOffWidth / lightsOffImageWidth;
                const relativeScaleY = lightsOffConfig.lightsOffHeight / lightsOffImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                const calculatedScale = Math.min(relativeScaleX, relativeScaleY);
                lightsOffConfig.scale = calculatedScale;
            } else {
                lightsOffConfig.scale = 1.0; // Fallback
            }

            console.log(`  Actual lights_off image size: ${lightsOffImageWidth}x${lightsOffImageHeight}`);
            console.log(`  Calculated scale: ${lightsOffConfig.scale}`);
            console.log(`  BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Create sprite
            lightsOffSprite = new Sprite(lightsOffTexture);
            // Anchor at top center (0.5, 0) so it swings from the top like a pendulum
            lightsOffSprite.anchor.set(0.5, 0);

            // Store config in userData for use in resizeBackground
            lightsOffSprite.userData = lightsOffSprite.userData || {};
            lightsOffSprite.userData.config = lightsOffConfig;
            lightsOffSprite.userData.swingTime = 0; // Time counter for swinging animation
            lightsOffSprite.userData.isLightsOn = false; // Track current state (false = off, true = on)

            // Hide sprite initially until resizeBackground positions it correctly
            lightsOffSprite.visible = false;
            lightsOffSprite.alpha = 1.0;

            // Set initial position (will be updated by resizeBackground)
            lightsOffSprite.x = app.screen.width / 2;
            lightsOffSprite.y = app.screen.height / 2;

            // Add to stage
            app.stage.addChild(lightsOffSprite);

            // Tap-to-bounce animation variables (no natural swing)
            let previousPointerX = null;
            let previousPointerTime = null;
            let currentRotation = 0; // Current rotation angle in degrees
            let rotationVelocity = 0; // Angular velocity (degrees per frame)
            let isPointerOverLights = false;
            
            // Make lights sprite interactive to track cursor movement
            lightsOffSprite.eventMode = 'static';
            lightsOffSprite.cursor = 'default';
            
            // Track pointer movement for tap-to-bounce
            lightsOffSprite.on('pointerenter', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                isPointerOverLights = true;
                const globalPos = event.global;
                previousPointerX = globalPos.x;
                previousPointerTime = Date.now();
            });
            
            lightsOffSprite.on('pointermove', (event) => {
                if (!isPointerOverLights) return;
                
                const globalPos = event.global;
                const currentPointerX = globalPos.x;
                const currentTime = Date.now();
                
                if (previousPointerX !== null && previousPointerTime !== null) {
                    // Calculate swipe direction and speed
                    const deltaX = currentPointerX - previousPointerX;
                    const deltaTime = currentTime - previousPointerTime;
                    
                    // Prevent division by zero
                    const clampedDeltaTime = Math.max(1, Math.min(100, deltaTime));
                    const swipeSpeed = deltaX / clampedDeltaTime; // pixels per millisecond
                    
                    // IMPORTANT: Cursor direction directly pushes swing direction
                    // Right to left cursor movement (negative deltaX) -> push lights LEFT (negative rotation/angle)
                    // Left to right cursor movement (positive deltaX) -> push lights RIGHT (positive rotation/angle)
                    
                    // Convert swipe speed to rotation velocity (stronger spring effect)
                    const velocityMultiplier = 1.2; // Increased from 0.6 - stronger push response
                    const maxVelocity = 15; // Increased from 8 - allows bigger bounces
                    
                    // Calculate velocity change: cursor direction directly pushes rotation direction
                    // Right to left (negative deltaX) -> negative velocity -> rotate left (negative angle)
                    // Left to right (positive deltaX) -> positive velocity -> rotate right (positive angle)
                    const velocityChange = Math.max(-maxVelocity, Math.min(maxVelocity, swipeSpeed * velocityMultiplier * 0.01));
                    
                    // Add velocity in the direction of cursor push (stronger spring push)
                    rotationVelocity += velocityChange;
                }
                
                previousPointerX = currentPointerX;
                previousPointerTime = currentTime;
            });
            
            lightsOffSprite.on('pointerleave', () => {
                isPointerOverLights = false;
                previousPointerX = null;
                previousPointerTime = null;
            });

            // Bounce-back animation with strong spring effect (no natural swing, only responds to taps)
            app.ticker.add(() => {
                if (lightsOffSprite && lightsOffSprite.visible && lightsOffSprite.parent) {
                    // Strong spring physics for pronounced bounce-back effect
                    const springStrength = 0.25; // Increased from 0.15 - stronger spring pull back to center
                    const damping = 0.88; // Reduced from 0.92 - less damping for more bouncy effect
                    const maxRotationAngle = 60; // Maximum rotation angle in degrees
                    
                    // Apply strong spring force (pulls back to center position with more force)
                    const springForce = -currentRotation * springStrength;
                    rotationVelocity += springForce;
                    
                    // Apply damping (less damping = more bouncy, oscillates more)
                    rotationVelocity *= damping;
                    
                    // Update rotation based on velocity
                    currentRotation += rotationVelocity;
                    
                    // Limit rotation angle
                    currentRotation = Math.max(-maxRotationAngle, Math.min(maxRotationAngle, currentRotation));
                    
                    // Convert to radians and apply rotation
                    lightsOffSprite.rotation = (currentRotation * Math.PI) / 180;
                    
                    // Stop very small movements to prevent jitter
                    if (Math.abs(rotationVelocity) < 0.01 && Math.abs(currentRotation) < 0.1) {
                        rotationVelocity = 0;
                        currentRotation = 0;
                    }
                }
            });

            // Call resizeBackground to position lights off correctly (after it's already added to stage)
            resizeBackground();

            // Make visible immediately after positioning
            lightsOffSprite.visible = true;

            console.log('Lights off sprite with swinging animation added successfully');

        } catch (error) {
            console.error('Error loading lights_off texture:', error);
        }

        // Load lights_switch.png with swinging animation and lights_on.png for switching
        try {
            console.log('Loading lights_switch.png and lights_on.png...');
            const lightsSwitchTexture = await loadAssetWithProgress('assets/lights_switch.png');
            lightsOnTexture = await loadAssetWithProgress('assets/lights_on.png'); // Preload lights_on for switching

            // Get lights_switch actual dimensions
            const lightsSwitchImageWidth = lightsSwitchTexture.orig?.width || lightsSwitchTexture.width || lightsSwitchTexture.baseTexture.width;
            const lightsSwitchImageHeight = lightsSwitchTexture.orig?.height || lightsSwitchTexture.height || lightsSwitchTexture.baseTexture.height;

            console.log(`  Loaded lights_switch.png: ${lightsSwitchImageWidth}x${lightsSwitchImageHeight}`);
            console.log(`  Loaded lights_on.png: ${lightsOnTexture.orig?.width || lightsOnTexture.width}x${lightsOnTexture.orig?.height || lightsOnTexture.height}`);

            // Lights switch positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 3140, Right X: 3248, Top Y: 0, Bottom Y: 842
            // Center X: (3140 + 3248) / 2 = 3194
            // Center Y: (0 + 842) / 2 = 421
            // Dimensions: width: 109 pixels, height: 843 pixels (on bg1.png)
            const lightsSwitchConfig = {
                // Lights switch dimensions (on bg1.png coordinate space)
                lightsSwitchWidth: 109,
                lightsSwitchHeight: 843,

                // Position on bg1.png (center of lights switch)
                bg1X: 3194, // Center X position on bg1.png
                bg1Y: 421, // Center Y position on bg1.png

                // Scale: calculated to make lights switch fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make lights switch image fit into designated space on bg1.png
            if (lightsSwitchImageWidth && lightsSwitchImageHeight && lightsSwitchConfig.lightsSwitchWidth && lightsSwitchConfig.lightsSwitchHeight) {
                const relativeScaleX = lightsSwitchConfig.lightsSwitchWidth / lightsSwitchImageWidth;
                const relativeScaleY = lightsSwitchConfig.lightsSwitchHeight / lightsSwitchImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                const calculatedScale = Math.min(relativeScaleX, relativeScaleY);
                lightsSwitchConfig.scale = calculatedScale;
            } else {
                lightsSwitchConfig.scale = 1.0; // Fallback
            }

            console.log(`  Actual lights_switch image size: ${lightsSwitchImageWidth}x${lightsSwitchImageHeight}`);
            console.log(`  Calculated scale: ${lightsSwitchConfig.scale}`);
            console.log(`  BG1 dimensions: ${imageWidth}x${imageHeight}`);

            // Create sprite
            lightsSwitchSprite = new Sprite(lightsSwitchTexture);
            // Anchor at top center (0.5, 0) so it swings from the top like a pendulum
            lightsSwitchSprite.anchor.set(0.5, 0);

            // Load light switch sound effect
            lightSwitchSound = new Audio('assets/sounds/light_switch.mp3');
            lightSwitchSound.volume = 0.7; // Set volume (70%)
            lightSwitchSound.preload = 'auto';
            // Don't mute initially - let it play even if bg music is muted for autoplay
            // It will sync after user interaction
            lightSwitchSound.muted = false;
            
            // Handle audio errors
            lightSwitchSound.addEventListener('error', (e) => {
                console.warn('Could not load light switch sound:', e);
            });

            // Store config in userData for use in resizeBackground
            lightsSwitchSprite.userData = lightsSwitchSprite.userData || {};
            lightsSwitchSprite.userData.config = lightsSwitchConfig;
            lightsSwitchSprite.userData.swingTime = 0; // Time counter for swinging animation

            // Hide sprite initially until resizeBackground positions it correctly
            lightsSwitchSprite.visible = false;
            lightsSwitchSprite.alpha = 1.0;

            // Set initial position (will be updated by resizeBackground)
            lightsSwitchSprite.x = app.screen.width / 2;
            lightsSwitchSprite.y = app.screen.height / 2;

            // Make it interactive
            lightsSwitchSprite.eventMode = 'static';
            lightsSwitchSprite.cursor = 'pointer';

            // Add pointer enter handler to toggle between lights_off and lights_on
            // Use a flag to prevent double-toggling from rapid pointer movements
            let isToggling = false;
            let hasTriggered = false; // Track if we've already triggered on this hover
            
            // Rope-like animation variables (smooth rope swing physics)
            let previousPointerX = null;
            let previousPointerTime = null; // Track time for swipe speed calculation
            let currentRopeRotation = 0; // Current rotation (angle in degrees)
            let ropeVelocity = 0; // Angular velocity for smooth rope swing (degrees per frame)
            let isPointerOver = false;
            let ropeMomentum = 0; // Momentum accumulated from swipes
            
            const toggleLights = () => {
                // Prevent double-toggling
                if (isToggling) {
                    console.log('Toggle already in progress, skipping...');
                    return;
                }
                
                isToggling = true;
                
                console.log('Lights switch hovered - toggling lights');
                console.log('lightsOffSprite:', lightsOffSprite);
                console.log('lightsOffTexture:', lightsOffTexture);
                console.log('lightsOnTexture:', lightsOnTexture);
                console.log('Current state isLightsOn:', lightsOffSprite?.userData?.isLightsOn);
                
                // Play light switch sound effect
                // Check if user has interacted - if not, play anyway (bg music might be muted for autoplay)
                const bgMusic = document.getElementById('bg-music');
                const userHasInteracted = bgMusic && (bgMusic.currentTime > 0 || !bgMusic.paused);
                
                if (lightSwitchSound) {
                    // If user hasn't interacted yet, play sound regardless of mute state
                    // After interaction, respect the global mute state
                    if (!userHasInteracted || !isGlobalAudioMuted()) {
                        // Reset to start and play
                        lightSwitchSound.currentTime = 0;
                        lightSwitchSound.play().catch((error) => {
                            console.warn('Could not play light switch sound:', error);
                        });
                    }
                }
                
                if (lightsOffSprite && lightsOffTexture && lightsOnTexture) {
                    // Toggle the texture based on current state
                    const currentState = lightsOffSprite.userData.isLightsOn || false;
                    
                    if (currentState) {
                        // Currently on, switch to off
                        lightsOffSprite.texture = lightsOffTexture;
                        lightsOffSprite.userData.isLightsOn = false;
                        // Hide lights ray when lights are off
                        if (lightsRaySprite) {
                            lightsRaySprite.visible = false;
                        }
                        console.log('Lights switched: lights_on.png -> lights_off.png');
                    } else {
                        // Currently off, switch to on
                        lightsOffSprite.texture = lightsOnTexture;
                        lightsOffSprite.userData.isLightsOn = true;
                        // Show lights ray when lights are on
                        if (lightsRaySprite) {
                            lightsRaySprite.visible = true;
                        }
                        console.log('Lights switched: lights_off.png -> lights_on.png');
                    }
                } else {
                    console.warn('Cannot toggle lights:', {
                        lightsOffSprite: !!lightsOffSprite,
                        lightsOffTexture: !!lightsOffTexture,
                        lightsOnTexture: !!lightsOnTexture
                    });
                }
                
                // Reset flag after a short delay
                setTimeout(() => {
                    isToggling = false;
                }, 100);
            };

            // Trigger on pointer enter (hover)
            lightsSwitchSprite.on('pointerenter', (event) => {
                enableAudioOnSpriteInteraction(); // Enable audio on sprite interaction
                event.stopPropagation(); // Prevent panning
                isPointerOver = true;
                
                // Get initial pointer position and time
                const globalPos = event.global;
                previousPointerX = globalPos.x;
                previousPointerTime = Date.now();
                
                // Smooth transition - don't apply sudden velocity changes on enter
                // Reset velocity slightly to prevent glitches from previous state
                ropeVelocity *= 0.7;
                
                if (!hasTriggered) {
                    hasTriggered = true;
                    toggleLights();
                }
            });

            // Track pointer movement for smooth rope swing animation
            lightsSwitchSprite.on('pointermove', (event) => {
                if (!isPointerOver) return;
                
                event.stopPropagation();
                const globalPos = event.global;
                const currentPointerX = globalPos.x;
                const currentTime = Date.now();
                
                if (previousPointerX !== null && previousPointerTime !== null) {
                    // Calculate direction and distance: positive = moving right, negative = moving left
                    const deltaX = currentPointerX - previousPointerX;
                    const deltaTime = currentTime - previousPointerTime;
                    
                    // Prevent division by zero and handle very small time deltas
                    const clampedDeltaTime = Math.max(1, Math.min(100, deltaTime));
                    
                    // Calculate swipe speed and add momentum to rope swing
                    if (Math.abs(deltaX) > 0.1) {
                        const swipeSpeed = deltaX / clampedDeltaTime; // pixels per millisecond
                        
                        // Convert swipe speed to angular momentum for smooth rope swing
                        // Swipe left (negative) -> swing left, Swipe right (positive) -> swing right
                        const momentumMultiplier = 0.8; // How much swipe momentum transfers to rope
                        const maxMomentum = 15; // Maximum swing momentum
                        
                        // Add momentum in the direction of swipe (creates smooth swing)
                        const swipeMomentum = Math.max(-maxMomentum, Math.min(maxMomentum, swipeSpeed * momentumMultiplier));
                        
                        // Accumulate momentum for smooth, continuous swing
                        // The faster you swipe, the more momentum the rope gets
                        ropeMomentum = ropeMomentum * 0.7 + swipeMomentum * 0.3; // Smooth momentum accumulation
                        
                        // Apply momentum to velocity for immediate swing response
                        ropeVelocity += swipeMomentum * 0.5;
                    }
                }
                
                previousPointerX = currentPointerX;
                previousPointerTime = currentTime;
            });

            // Reset trigger flag and rope animation when pointer leaves
            lightsSwitchSprite.on('pointerleave', (event) => {
                event.stopPropagation(); // Prevent panning
                isPointerOver = false;
                hasTriggered = false;
                previousPointerX = null;
                previousPointerTime = null;
                ropeMomentum = 0; // Reset momentum
                // Keep velocity for smooth swing continuation (gravity will bring it back to center)
            });

            // Add to stage
            app.stage.addChild(lightsSwitchSprite);

            // Smooth rope swing animation - pendulum physics with momentum from swipes
            app.ticker.add(() => {
                if (lightsSwitchSprite && lightsSwitchSprite.visible && lightsSwitchSprite.parent) {
                    // Smooth rope pendulum physics
                    const gravity = 0.12; // Gravity effect (pulls rope back to center, like a pendulum)
                    const damping = 0.96; // Air resistance/damping (higher = smoother, less bouncy)
                    const maxRotation = 3; // Maximum swing angle (limited to 3 degrees)
                    
                    // Apply gravity (pendulum effect - pulls rope back to center)
                    // Gravity is proportional to current angle (like a real pendulum)
                    const gravityForce = -currentRopeRotation * gravity;
                    ropeVelocity += gravityForce;
                    
                    // Apply momentum from swipes (when cursor is over)
                    if (isPointerOver && Math.abs(ropeMomentum) > 0.1) {
                        // Add momentum to velocity for smooth swing
                        ropeVelocity += ropeMomentum * 0.15;
                        // Decay momentum over time
                        ropeMomentum *= 0.85;
                    }
                    
                    // Apply damping (air resistance - smooth deceleration)
                    ropeVelocity *= damping;
                    
                    // Apply velocity to rotation (smooth swing motion)
                    currentRopeRotation += ropeVelocity;
                    
                    // Clamp rotation to prevent extreme values
                    if (Math.abs(currentRopeRotation) > maxRotation) {
                        currentRopeRotation = Math.sign(currentRopeRotation) * maxRotation;
                        ropeVelocity *= 0.6; // Bounce back when hitting limit (like rope hitting end)
                    }
                    
                    // Apply rotation (smooth rope swing)
                    // Swipe left -> swings left, Swipe right -> swings right
                    lightsSwitchSprite.rotation = (currentRopeRotation * Math.PI) / 180;
                }
            });

            // Call resizeBackground to position lights switch correctly (after it's already added to stage)
            resizeBackground();

            // Make visible immediately after positioning
            lightsSwitchSprite.visible = true;

            console.log('Lights switch sprite with swinging animation added successfully');

        } catch (error) {
            console.error('Error loading lights_switch texture:', error);
        }

        // Load lights_ray.png with color dodge blending (appears when lights are on)
        // Using separate canvas with CSS mix-blend-mode for color dodge effect
        try {
            console.log('Loading lights_ray.png...');
            const lightsRayTexture = await loadAssetWithProgress('assets/lights_ray.png');

            // Get lights_ray actual dimensions
            const lightsRayImageWidth = lightsRayTexture.orig?.width || lightsRayTexture.width || lightsRayTexture.baseTexture.width;
            const lightsRayImageHeight = lightsRayTexture.orig?.height || lightsRayTexture.height || lightsRayTexture.baseTexture.height;

            console.log(`  Loaded lights_ray.png: ${lightsRayImageWidth}x${lightsRayImageHeight}`);

            // Create a separate PIXI application for the lights ray sprite layer to use CSS blend modes
            lightsRayApp = new Application();
            await lightsRayApp.init({
                background: 'transparent',
                resizeTo: window,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                antialias: true
            });

            // Ensure ticker continues even when tab is hidden
            lightsRayApp.ticker.stopOnMinimize = false;

            // Create sprite from lights_ray texture
            lightsRaySprite = new Sprite(lightsRayTexture);
            lightsRaySprite.anchor.set(0.5);

            // Hide sprite initially (only shows when lights are on)
            lightsRaySprite.visible = false;
            lightsRaySprite.alpha = 1.0;

            // Add sprite to the separate app
            lightsRayApp.stage.addChild(lightsRaySprite);

            // Get the sprite canvas and apply CSS blend mode
            const lightsRayCanvas = lightsRayApp.canvas;
            lightsRayCanvas.style.position = 'absolute';
            lightsRayCanvas.style.top = '0';
            lightsRayCanvas.style.left = '0';
            lightsRayCanvas.style.mixBlendMode = 'color-dodge';
            lightsRayCanvas.style.pointerEvents = 'none';
            lightsRayCanvas.style.zIndex = '1'; // Ensure it's above the main canvas

            // Add lights ray canvas to the container (same container as main app)
            const container = document.getElementById('canvas-container');
            if (container) {
                container.appendChild(lightsRayCanvas);
                console.log('Lights ray canvas added to container with CSS color-dodge blend mode');
            }

            console.log('Lights ray sprite created:', {
                textureSize: `${lightsRayImageWidth}x${lightsRayImageHeight}`,
                blendMode: 'CSS color-dodge (mix-blend-mode)'
            });

            // Lights ray positioning and sizing config
            // Position on bg1.png (in pixels):
            // Left X: 722, Right X: 5164, Top Y: 583, Bottom Y: 3125
            // Center X: (722 + 5164) / 2 = 2943
            // Center Y: (583 + 3125) / 2 = 1854
            // Dimensions: width: 4442 pixels, height: 2543 pixels (on bg1.png)
            const lightsRayConfig = {
                // Lights ray dimensions (on bg1.png coordinate space)
                lightsRayWidth: 4442,
                lightsRayHeight: 2543,

                // Position on bg1.png (center of lights ray)
                bg1X: 2943, // Center X position on bg1.png
                bg1Y: 1854, // Center Y position on bg1.png

                // Scale: calculated to make lights ray fit its designated space on bg1.png
                scale: 1.0, // Will be calculated below

                // Fine-tuning offsets
                offsetX: 0, // Additional offset in pixels (positive = right, negative = left)
                offsetY: 0, // Additional offset in pixels (positive = down, negative = up)
            };

            // Calculate scale to make lights ray image fit into designated space on bg1.png
            if (lightsRayImageWidth && lightsRayImageHeight && lightsRayConfig.lightsRayWidth && lightsRayConfig.lightsRayHeight) {
                const relativeScaleX = lightsRayConfig.lightsRayWidth / lightsRayImageWidth;
                const relativeScaleY = lightsRayConfig.lightsRayHeight / lightsRayImageHeight;

                // Use the smaller scale to ensure it fits (maintains aspect ratio)
                lightsRayConfig.scale = Math.min(relativeScaleX, relativeScaleY);
            } else {
                // Fallback: use natural size
                lightsRayConfig.scale = 1.0;
            }

            console.log(`Lights ray config:`);
            console.log(`  Lights ray dimensions on bg1.png: ${lightsRayConfig.lightsRayWidth}x${lightsRayConfig.lightsRayHeight}`);
            console.log(`  BG1 position (center): (${lightsRayConfig.bg1X}, ${lightsRayConfig.bg1Y})`);
            console.log(`  Actual lights ray image size: ${lightsRayImageWidth}x${lightsRayImageHeight}`);
            console.log(`  Calculated scale: ${lightsRayConfig.scale}`);

            // Store config in userData for lights ray sprite
            lightsRaySprite.userData = lightsRaySprite.userData || {};
            lightsRaySprite.userData.config = lightsRayConfig;

            // Position immediately using resizeBackground to ensure correct positioning
            if (backgroundSprite && imageWidth && imageHeight) {
                // Call resizeBackground to position all sprites correctly
                resizeBackground();

                // Set initial visibility based on lights state (default is off, so hidden)
                lightsRaySprite.visible = false;
                console.log('Lights ray sprite positioned, hidden by default (lights are off)');
            } else {
                // If background not ready yet, make invisible until resizeBackground is called
                lightsRaySprite.visible = false;
                console.log('Lights ray sprite created but background not ready - will be positioned when resizeBackground is called');
            }

        } catch (error) {
            console.error('Error loading lights_ray texture:', error);
        }

        // Position all sprites BEFORE showing them (ensures correct positioning during loading screen)
        // This is critical: all sprites must be positioned correctly BEFORE the loading screen ends
        resizeBackground();

        // Show all sprites after resizeBackground positions them correctly (prevents flash of incorrect positioning)
        // IMPORTANT: All sprites are positioned BEFORE the loading screen fades out
        if (backgroundSprite) {
            backgroundSprite.visible = true;
        }
        if (mutatorBgSprite) {
            mutatorBgSprite.visible = true;
        }
        if (mutatorCapsuleSprite) {
            mutatorCapsuleSprite.visible = true;
        }
        if (cupSprite) {
            cupSprite.visible = true;
        }
        if (glitchSprite) {
            glitchSprite.visible = true;
        }
        if (eyeLogoSprite) {
            eyeLogoSprite.visible = true;
        }
        if (cctvSprite) {
            cctvSprite.visible = true;
        }
        if (discordSprite) {
            // Ensure Discord is positioned correctly before making it visible
            // resizeBackground() was already called above, so Discord should be at correct position
            if (discordSprite.userData && discordSprite.userData.config) {
                // Double-check position is set correctly
                const discordConfig = discordSprite.userData.config;
                if (backgroundSprite && imageWidth && imageHeight) {
                    const scale = currentScale || backgroundSprite.scale.x || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                    const normalizedX = discordConfig.bg1X / imageWidth;
                    const normalizedY = discordConfig.bg1Y / imageHeight;
                    discordSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + discordConfig.offsetX;
                    discordSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + discordConfig.offsetY;
                    console.log('Discord sprite final position check:', discordSprite.x, discordSprite.y);
                }
            }
            discordSprite.visible = true;
        }
        if (promoSprite) {
            // Ensure Promo is positioned correctly before making it visible
            // resizeBackground() was already called above, but we double-check position here
            // This ensures Promo is at the correct position BEFORE the loading screen ends
            if (promoSprite.userData && promoSprite.userData.config) {
                const promoConfig = promoSprite.userData.config;
                if (backgroundSprite && imageWidth && imageHeight) {
                    const scale = currentScale || backgroundSprite.scale.x || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                    const normalizedX = promoConfig.bg1X / imageWidth;
                    const normalizedY = promoConfig.bg1Y / imageHeight;
                    promoSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + promoConfig.offsetX;
                    promoSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + promoConfig.offsetY;

                    // Ensure scale is set correctly
                    if (promoConfig.scale !== null && promoConfig.scale !== undefined) {
                        const promoScale = promoConfig.scale * scale;
                        promoSprite.scale.set(promoScale);
                    } else {
                        promoSprite.scale.set(scale);
                    }

                    console.log('Promo sprite final position check:', promoSprite.x, promoSprite.y, 'scale:', promoSprite.scale.x);
                }
            } else if (promoSprite && backgroundSprite) {
                // Fallback: position at background center if config is missing
                promoSprite.x = backgroundSprite.x;
                promoSprite.y = backgroundSprite.y;
            }
            // Make visible - this ensures Promo appears at correct position on first load
            promoSprite.visible = true;
        }
        if (telegramSprite) {
            // Ensure Telegram is positioned correctly before making it visible
            // resizeBackground() was already called above, but we double-check position here
            // This ensures Telegram is at the correct position BEFORE the loading screen ends
            if (telegramSprite.userData && telegramSprite.userData.config && backgroundSprite) {
                const telegramConfig = telegramSprite.userData.config;
                const imageWidth = backgroundSprite.texture?.width || 1920;
                const imageHeight = backgroundSprite.texture?.height || 1080;
                const scale = backgroundSprite.scale?.x || 1.0;

                const bg1DisplayedWidth = imageWidth * scale;
                const bg1DisplayedHeight = imageHeight * scale;

                const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;

                const normalizedX = telegramConfig.bg1X / imageWidth;
                const normalizedY = telegramConfig.bg1Y / imageHeight;

                telegramSprite.x = bg1Left + (normalizedX * bg1DisplayedWidth) + telegramConfig.offsetX;
                telegramSprite.y = bg1Top + (normalizedY * bg1DisplayedHeight) + telegramConfig.offsetY;
                console.log('Telegram sprite final position check:', telegramSprite.x, telegramSprite.y);
            } else if (telegramSprite && backgroundSprite) {
                // Fallback: position at background center if config is missing
                telegramSprite.x = backgroundSprite.x;
                telegramSprite.y = backgroundSprite.y;
            }
            // Make visible - this ensures Telegram appears at correct position on first load
            telegramSprite.visible = true;
        }
        if (wallArtSprite) {
            wallArtSprite.visible = true;
        }
        if (bookSprite) {
            bookSprite.visible = true;
        }
        if (lightsOffSprite) {
            // Ensure Lights off is positioned correctly before making it visible
            if (lightsOffSprite.userData && lightsOffSprite.userData.config) {
                const lightsOffConfig = lightsOffSprite.userData.config;
                if (backgroundSprite && imageWidth && imageHeight) {
                    const scale = currentScale || backgroundSprite.scale.x || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                    const normalizedX = lightsOffConfig.bg1X / imageWidth;
                    const normalizedY = lightsOffConfig.bg1Y / imageHeight;
                    
                    // Calculate center position
                    const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsOffConfig.offsetX;
                    const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsOffConfig.offsetY;
                    
                    // Since anchor is at (0.5, 0), adjust Y to position the top correctly
                    const lightsOffHeight = lightsOffSprite.texture?.orig?.height || lightsOffSprite.texture?.height || 1087;
                    const scaledHeight = lightsOffHeight * lightsOffSprite.scale.y;
                    
                    lightsOffSprite.x = centerX;
                    lightsOffSprite.y = centerY - scaledHeight / 2;
                    console.log('Lights off sprite final position check:', lightsOffSprite.x, lightsOffSprite.y);
                }
            } else if (lightsOffSprite && backgroundSprite) {
                // Fallback: position at background center if config is missing
                lightsOffSprite.x = backgroundSprite.x;
                lightsOffSprite.y = backgroundSprite.y;
            }
            // Make visible - this ensures Lights off appears at correct position on first load
            lightsOffSprite.visible = true;
        }
        if (lightsSwitchSprite) {
            // Ensure Lights switch is positioned correctly before making it visible
            if (lightsSwitchSprite.userData && lightsSwitchSprite.userData.config) {
                const lightsSwitchConfig = lightsSwitchSprite.userData.config;
                if (backgroundSprite && imageWidth && imageHeight) {
                    const scale = currentScale || backgroundSprite.scale.x || 1;
                    const bg1DisplayedWidth = imageWidth * scale;
                    const bg1DisplayedHeight = imageHeight * scale;
                    const bg1Left = backgroundSprite.x - bg1DisplayedWidth / 2;
                    const bg1Top = backgroundSprite.y - bg1DisplayedHeight / 2;
                    const normalizedX = lightsSwitchConfig.bg1X / imageWidth;
                    const normalizedY = lightsSwitchConfig.bg1Y / imageHeight;
                    
                    // Calculate center position
                    const centerX = bg1Left + (normalizedX * bg1DisplayedWidth) + lightsSwitchConfig.offsetX;
                    const centerY = bg1Top + (normalizedY * bg1DisplayedHeight) + lightsSwitchConfig.offsetY;
                    
                    // Since anchor is at (0.5, 0), adjust Y to position the top correctly
                    const lightsSwitchHeight = lightsSwitchSprite.texture?.orig?.height || lightsSwitchSprite.texture?.height || 843;
                    const scaledHeight = lightsSwitchHeight * lightsSwitchSprite.scale.y;
                    
                    lightsSwitchSprite.x = centerX;
                    lightsSwitchSprite.y = centerY - scaledHeight / 2;
                    console.log('Lights switch sprite final position check:', lightsSwitchSprite.x, lightsSwitchSprite.y);
                }
            } else if (lightsSwitchSprite && backgroundSprite) {
                // Fallback: position at background center if config is missing
                lightsSwitchSprite.x = backgroundSprite.x;
                lightsSwitchSprite.y = backgroundSprite.y;
            }
            // Make visible - this ensures Lights switch appears at correct position on first load
            lightsSwitchSprite.visible = true;
        }
        // Show dots after everything is positioned correctly
        if (mutatorCapsuleDot) {
            // Check if mobile/tablet - if so, show label text below dot (keep dot visible)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                // On mobile/tablet: show dot and simple label text below it (no stroke, no animation speed change, no circle text)
                mutatorCapsuleDot.visible = true; // Keep dot visible
                if (mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.x = mutatorCapsuleDot.x;
                    mutatorCapsuleLabelText.y = mutatorCapsuleDot.y + 40; // Position label below dot
                    mutatorCapsuleLabelText.visible = true;
                }
                // Don't show stroke overlay, speed up animation, or circle text on mobile/tablet
            } else {
                // On desktop: show dot normally (hover to see "Click To Explore" circle text with stroke)
                mutatorCapsuleDot.visible = true;
                if (mutatorCapsuleLabelText) {
                    mutatorCapsuleLabelText.visible = false; // Hide label on desktop
                }
            }
        }
        if (cctvDot) {
            // Check if mobile/tablet - if so, show label text below dot (keep dot visible)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                // On mobile/tablet: show dot and simple label text below it (no stroke, no circle text)
                cctvDot.visible = true; // Keep dot visible
                if (cctvLabelText) {
                    cctvLabelText.x = cctvDot.x;
                    cctvLabelText.y = cctvDot.y + 40; // Position label below dot
                    cctvLabelText.visible = true;
                }
                // Don't show stroke overlay or circle text on mobile/tablet
            } else {
                // On desktop: show dot normally (hover to see "Click To Explore" circle text with stroke)
                cctvDot.visible = true;
                if (cctvLabelText) {
                    cctvLabelText.visible = false; // Hide label on desktop
                }
            }
        }
        if (wallArtDot) {
            // Check if mobile/tablet - if so, show label text below dot (keep dot visible)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                // On mobile/tablet: show dot and simple label text below it
                wallArtDot.visible = true;
                if (wallArtLabelText) {
                    wallArtLabelText.x = wallArtDot.x;
                    wallArtLabelText.y = wallArtDot.y + 40;
                    wallArtLabelText.visible = true;
                    // Ensure text is on top by bringing it to front
                    app.stage.removeChild(wallArtLabelText);
                    app.stage.addChild(wallArtLabelText);
                }
            } else {
                // On desktop: show dot normally (hover to see stroke and "OUR TEAM" text)
                wallArtDot.visible = true; // Visible so users can hover over it
                if (wallArtLabelText) {
                    wallArtLabelText.visible = false; // Hide on desktop
                }
            }
        }
        if (bookDot) {
            // Check if mobile/tablet - if so, show label text below dot (keep dot visible)
            if (typeof window.isMobileOrTablet === 'function' && window.isMobileOrTablet()) {
                // On mobile/tablet: show dot and simple label text below it
                bookDot.visible = true;
                if (bookLabelText) {
                    bookLabelText.x = bookDot.x;
                    bookLabelText.y = bookDot.y + 40;
                    bookLabelText.visible = true;
                    // Ensure text is on top by bringing it to front
                    app.stage.removeChild(bookLabelText);
                    app.stage.addChild(bookLabelText);
                }
            } else {
                // On desktop: show dot normally (hover to see stroke and "Community" text)
                bookDot.visible = true; // Visible so users can hover over it
                if (bookLabelText) {
                    bookLabelText.visible = false; // Hide on desktop
                }
            }
        }
        // Stroke sprite is hidden initially and shown on hover, so no need to show it here

        window.addEventListener('resize', () => {
            requestAnimationFrame(resizeBackground);
        });

        app.renderer.on('resize', resizeBackground);

        setupPanning();

        console.log('Background loaded successfully');

        // Fade out loading screen after entire logo has been revealed
        // Check coverage grid to ensure entire logo has been seen
        const minCoveragePercentage = 0.95; // 95% coverage required (allows for edge cases)
        const checkCoverageInterval = setInterval(() => {
            // Access coverage tracking from the loading screen scope
            const coveragePercentage = window.logoCoveragePercentage || 0;
            if (coveragePercentage >= minCoveragePercentage) {
                clearInterval(checkCoverageInterval);
                // Wait a moment after full coverage, then fade out
                setTimeout(() => {
                    fadeOutLoadingScreen();
                }, 500);
            }
        }, 100);

        // Safety timeout - fade out after max 15 seconds regardless (longer to allow full coverage)
        setTimeout(() => {
            clearInterval(checkCoverageInterval);
            if (loadingScreen && loadingScreenAlpha > 0) {
                fadeOutLoadingScreen();
            } else if (!ENABLE_INTRO_LOADING_SCREEN) {
                // If loading screen is disabled, show instruction after a short delay
                setTimeout(() => {
                    showInstructionAnimation();
                }, 500);
                
                // Also show audio control immediately if loading screen is disabled
                const audioControl = document.getElementById('audio-control');
                if (audioControl) {
                    audioControl.classList.add('visible');
                    console.log('Audio control shown (loading screen disabled)');
                }
            }
        }, 15000);
    } catch (error) {
        console.error('Error loading background texture:', error);
    }
})();