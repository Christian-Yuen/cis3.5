(function() {
    console.log('Loading gapi fix for iOS simulator...');

    if (window.cordova) {
        document.addEventListener('deviceready', function() {
            console.log('Device ready, platform:', device.platform);

            if (cordova.platformId === 'ios') {
                console.log('iOS detected, applying gapi fixes...');

                // Monkey patch for iframe issues
                const originalAppendChild = document.body.appendChild;
                document.body.appendChild = function(element) {
                    // Fix iframe sandboxing for Google auth
                    if (element.tagName === 'IFRAME' && element.src && element.src.includes('google.com')) {
                        console.log('Google iframe detected, fixing sandbox...');
                        element.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
                    }
                    return originalAppendChild.call(this, element);
                };

                // Fix postMessage origin
                const originalPostMessage = window.postMessage;
                window.postMessage = function(message, targetOrigin, transfer) {
                    // Fix origin for gapi
                    if (targetOrigin && (targetOrigin.includes('ionic://') || targetOrigin.includes('app://'))) {
                        targetOrigin = 'http://localhost';
                    }
                    return originalPostMessage.call(window, message, targetOrigin, transfer);
                };
            }
        });
    }

    // Wait for gapi to load
    var checkGapi = setInterval(function() {
        if (window.gapi) {
            clearInterval(checkGapi);
            console.log('gapi loaded successfully');

            // Patch gapi.load for better error handling
            if (gapi.load) {
                const originalLoad = gapi.load;
                gapi.load = function() {
                    console.log('gapi.load called with arguments:', arguments);
                    try {
                        return originalLoad.apply(this, arguments);
                    } catch (e) {
                        console.warn('gapi.load error, retrying...', e);
                        setTimeout(() => {
                            try {
                                originalLoad.apply(this, arguments);
                            } catch (e2) {
                                console.error('gapi.load failed after retry:', e2);
                            }
                        }, 1000);
                    }
                };
            }
        }
    }, 100);

    setTimeout(function() {
        clearInterval(checkGapi);
    }, 10000);
})();
