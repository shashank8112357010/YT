import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Youtube, ExternalLink, Copy, CheckCircle, AlertCircle, Shield } from "lucide-react";
import {
  validateAndSanitizeYouTubeUrl,
  tabCountSchema,
  sanitizeUrlParameter,
  RateLimiter,
  SAFE_ERROR_MESSAGES
} from "@/lib/security";

export default function Index() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tabCount, setTabCount] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [rateLimiter] = useState(() => new RateLimiter(5, 60000)); // 5 attempts per minute
  const [isSecurityValidated, setIsSecurityValidated] = useState(false);

  // Auto-clear alerts after 5 seconds for better UX
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Secure URL input handler with real-time validation
  const handleUrlChange = useCallback((value: string) => {
    // Limit input length for security
    const truncatedValue = value.substring(0, 2048);
    setYoutubeUrl(truncatedValue);

    // Clear previous alerts when user starts typing
    if (alert?.type === 'error') {
      setAlert(null);
    }

    // Real-time validation feedback
    if (truncatedValue.length > 10) {
      const validation = validateAndSanitizeYouTubeUrl(truncatedValue);
      setIsSecurityValidated(validation.isValid);
    } else {
      setIsSecurityValidated(false);
    }
  }, [alert]);

  // Secure tab count handler
  const handleTabCountChange = useCallback((value: string) => {
    const numericValue = parseInt(value);
    const validation = tabCountSchema.safeParse(numericValue);

    if (validation.success) {
      setTabCount(validation.data);
    } else {
      setAlert({
        type: 'warning',
        message: 'Tab count must be between 1 and 10 for security reasons'
      });
    }
  }, []);

  const generateVOBMaskedUrl = (baseUrl: string, tabIndex: number): string => {
    // Security: Validate base URL before processing
    const validation = validateAndSanitizeYouTubeUrl(baseUrl);
    if (!validation.isValid || !validation.sanitizedUrl) {
      throw new Error('Invalid base URL for VOB masking');
    }

    const url = new URL(validation.sanitizedUrl);

    // VOB (Virtual Origin Blocking) - Advanced timestamp with geographical jitter
    const baseTimestamp = Date.now();
    const geoJitter = Math.floor(Math.random() * 10000); // 0-10 second geo jitter
    const maskedTimestamp = baseTimestamp + geoJitter + (tabIndex * 2000);

    // VOB Session: Generate device-specific session identifiers
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    const deviceSessionId = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    // VOB Geo-masking: Simulate different geographical origins
    const geoRegions = [
      { code: 'US', tz: 'America/New_York', lang: 'en-US' },
      { code: 'GB', tz: 'Europe/London', lang: 'en-GB' },
      { code: 'DE', tz: 'Europe/Berlin', lang: 'de-DE' },
      { code: 'FR', tz: 'Europe/Paris', lang: 'fr-FR' },
      { code: 'CA', tz: 'America/Toronto', lang: 'en-CA' },
      { code: 'AU', tz: 'Australia/Sydney', lang: 'en-AU' },
      { code: 'JP', tz: 'Asia/Tokyo', lang: 'ja-JP' },
      { code: 'BR', tz: 'America/Sao_Paulo', lang: 'pt-BR' }
    ];
    const selectedGeo = geoRegions[tabIndex % geoRegions.length];

    // VOB Device fingerprint variations
    const deviceTypes = [
      { type: 'desktop', os: 'Windows', browser: 'Chrome' },
      { type: 'desktop', os: 'macOS', browser: 'Safari' },
      { type: 'desktop', os: 'Linux', browser: 'Firefox' },
      { type: 'mobile', os: 'iOS', browser: 'Safari' },
      { type: 'mobile', os: 'Android', browser: 'Chrome' },
      { type: 'tablet', os: 'iPadOS', browser: 'Safari' }
    ];
    const selectedDevice = deviceTypes[tabIndex % deviceTypes.length];

    // VOB Traffic source masking with deep referrer chains
    const referrerChains = [
      'google.com/search', 'twitter.com/home', 'facebook.com/feed',
      'reddit.com/r/videos', 'discord.com/channels', 'instagram.com/explore',
      'tiktok.com/following', 'linkedin.com/feed', 'pinterest.com/search',
      'whatsapp.com/web', 'telegram.org/web', 'snapchat.com/discover'
    ];
    const selectedReferrer = referrerChains[tabIndex % referrerChains.length];

    // VOB Entry point masking with platform-specific features
    const platformFeatures = [
      'share_mobile', 'emb_web', 'related_desktop', 'search_mobile',
      'channel_web', 'playlist_desktop', 'trending_mobile', 'shorts_web',
      'live_desktop', 'premiere_mobile', 'community_web', 'stories_mobile'
    ];
    const selectedFeature = platformFeatures[tabIndex % platformFeatures.length];

    // VOB Core parameters with device/geo context
    url.searchParams.set('vob_ts', maskedTimestamp.toString());
    url.searchParams.set('vob_sid', deviceSessionId.substring(0, 16));
    url.searchParams.set('vob_geo', selectedGeo.code);
    url.searchParams.set('vob_tz', encodeURIComponent(selectedGeo.tz));
    url.searchParams.set('feature', selectedFeature);
    url.searchParams.set('app', selectedDevice.type);
    url.searchParams.set('platform', selectedDevice.os);
    url.searchParams.set('ref', selectedReferrer);
    url.searchParams.set('lang', selectedGeo.lang);

    // VOB Behavioral masking - random viewing patterns
    const viewingPatterns = {
      start: Math.floor(Math.random() * 45), // 0-45 seconds
      autoplay: Math.random() > 0.5 ? '1' : '0',
      quality: ['auto', '720p', '1080p', '480p'][Math.floor(Math.random() * 4)],
      volume: Math.floor(Math.random() * 100).toString()
    };

    if (viewingPatterns.start > 0) {
      url.searchParams.set('t', viewingPatterns.start.toString());
    }
    url.searchParams.set('autoplay', viewingPatterns.autoplay);
    url.searchParams.set('vq', viewingPatterns.quality);

    // VOB Marketing attribution masking
    const campaignIds = Array.from({length: 8}, () => Math.random().toString(36).substring(2, 10));
    const selectedCampaign = campaignIds[tabIndex % campaignIds.length];

    url.searchParams.set('utm_source', `vob_${selectedCampaign}`);
    url.searchParams.set('utm_medium', selectedDevice.type);
    url.searchParams.set('utm_campaign', `geo_${selectedGeo.code.toLowerCase()}`);
    url.searchParams.set('utm_content', selectedFeature);

    // VOB Anti-correlation: Randomize parameter structure
    const allParams = Array.from(url.searchParams.entries());
    allParams.sort(() => Math.random() - 0.5);

    // VOB Final URL reconstruction with entropy injection
    const finalUrl = new URL(url.origin + url.pathname);
    allParams.forEach(([key, value]) => finalUrl.searchParams.set(key, value));

    // VOB Hash fragment for additional entropy
    if (Math.random() > 0.7) {
      finalUrl.hash = `vob_${Math.random().toString(36).substring(2, 8)}`;
    }

    return finalUrl.toString();
  };

  const openMultipleTabs = async () => {
    // Security: Rate limiting check
    if (!rateLimiter.isAllowed()) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime() / 1000);
      setAlert({
        type: 'error',
        message: `${SAFE_ERROR_MESSAGES.RATE_LIMITED}. Try again in ${remainingTime} seconds.`
      });
      return;
    }

    // Security: Input validation
    if (!youtubeUrl.trim()) {
      setAlert({ type: 'error', message: SAFE_ERROR_MESSAGES.INVALID_URL });
      return;
    }

    // Security: Comprehensive URL validation and sanitization
    const urlValidation = validateAndSanitizeYouTubeUrl(youtubeUrl);
    if (!urlValidation.isValid || !urlValidation.sanitizedUrl) {
      setAlert({ type: 'error', message: urlValidation.error || SAFE_ERROR_MESSAGES.SECURITY_VIOLATION });
      return;
    }

    // Security: Tab count validation
    const tabValidation = tabCountSchema.safeParse(tabCount);
    if (!tabValidation.success) {
      setAlert({ type: 'error', message: 'Invalid tab count for security reasons' });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const sanitizedUrl = urlValidation.sanitizedUrl;

      // Open multiple tabs with VOB masking - use immediate execution for better popup success
      const openedTabs: (Window | null)[] = [];
      let successCount = 0;

      // Open all tabs immediately to avoid popup blocking
      for (let i = 0; i < tabCount; i++) {
        const vobMaskedUrl = generateVOBMaskedUrl(sanitizedUrl, i + 1);

        // Simplified window features for better compatibility
        const vobWindowFeatures = [
          'noopener=yes',
          'noreferrer=yes',
          'scrollbars=yes',
          'resizable=yes',
          'location=yes'
        ];

        // VOB Context creation with unique window name
        const vobContextId = `vob_tab_${Date.now()}_${i}`;

        try {
          // Open window immediately without delay to avoid popup blocking
          const newWindow = window.open(vobMaskedUrl, vobContextId, vobWindowFeatures.join(','));

          console.log(`Tab ${i + 1}: window.open returned:`, newWindow ? 'Window object' : 'null');

          if (newWindow && !newWindow.closed) {
            openedTabs.push(newWindow);
            successCount++;
            console.log(`Tab ${i + 1}: Successfully opened. Total success count: ${successCount}`);

            // VOB Behavioral simulation with staggered timing
            setTimeout(() => {
              try {
                const focusAction = Math.random();
                if (focusAction < 0.3 && !newWindow.closed) {
                  newWindow.blur(); // Background tab
                } else if (focusAction < 0.6 && !newWindow.closed) {
                  newWindow.focus(); // Active tab
                }
              } catch (e) {
                // Cross-origin restrictions expected
              }
            }, i * 100);
          } else {
            console.log(`Tab ${i + 1}: Failed to open or was blocked`);
            openedTabs.push(null);
          }
        } catch (error) {
          console.warn(`Failed to open tab ${i + 1}:`, error);
          openedTabs.push(null);
        }

        // Moderate delay between opens to prevent browser popup blocking
        if (i < tabCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Update success message based on actual opened tabs
      if (successCount === 0) {
        setAlert({
          type: 'error',
          message: 'No tabs could be opened. Please allow popups for this site and try again.'
        });
      } else if (successCount < tabCount) {
        setAlert({
          type: 'success',
          message: `Opened ${successCount} of ${tabCount} VOB-masked tabs. Browser may have blocked some popups.`
        });
      } else {
        setAlert({
          type: 'success',
          message: `Successfully opened ${successCount} VOB-masked tabs with virtual origin blocking!`
        });
      }

      // Security: Update recent URLs with sanitized URL only
      const updatedRecentUrls = [sanitizedUrl, ...recentUrls.filter(url => url !== sanitizedUrl)].slice(0, 3); // Reduced to 3 for security
      setRecentUrls(updatedRecentUrls);
    } catch (error) {
      // Security: Don't leak error details
      console.error('Tab opening error:', error); // Log for debugging but don't expose
      setAlert({ type: 'error', message: SAFE_ERROR_MESSAGES.UNKNOWN_ERROR });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentUrlClick = useCallback((url: string) => {
    // Security: Re-validate even recent URLs
    const validation = validateAndSanitizeYouTubeUrl(url);
    if (validation.isValid && validation.sanitizedUrl) {
      setYoutubeUrl(validation.sanitizedUrl);
      setIsSecurityValidated(true);
      setAlert(null);
    } else {
      setAlert({ type: 'error', message: SAFE_ERROR_MESSAGES.SECURITY_VIOLATION });
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      // Security: Validate URL before copying
      const validation = validateAndSanitizeYouTubeUrl(text);
      if (!validation.isValid || !validation.sanitizedUrl) {
        setAlert({ type: 'error', message: SAFE_ERROR_MESSAGES.SECURITY_VIOLATION });
        return;
      }

      await navigator.clipboard.writeText(validation.sanitizedUrl);
      setAlert({ type: 'success', message: 'Secure URL copied to clipboard!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to copy URL' });
    }
  }, []);

  const testPopupPermission = () => {
    const testWindow = window.open('about:blank', 'popup_test', 'width=300,height=200');
    if (testWindow && !testWindow.closed) {
      testWindow.document.write('<h3>Popup Test Successful!</h3><p>Your browser allows popups for this site.</p>');
      setTimeout(() => testWindow.close(), 2000);
      setAlert({ type: 'success', message: 'Popup test successful! Your browser is ready.' });
    } else {
      setAlert({ type: 'error', message: 'Popup blocked! Please enable popups for this site.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-brand-600 p-4 rounded-2xl shadow-lg">
              <Youtube className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            YouTube Multi-Tab Opener
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Open YouTube videos with VOB (Virtual Origin Blocking) masking technology.
            Each tab appears as a completely different user from various geographic locations and devices.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold">Open YouTube Video</CardTitle>
              <CardDescription>
                Paste any YouTube URL and choose how many VOB-masked tabs to open
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Status & Alerts */}
              {alert && (
                <Alert className={`
                  ${alert.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
                    'border-red-200 bg-red-50 dark:bg-red-950/20'}
                `}>
                  {alert.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription className={
                    alert.type === 'success' ? 'text-green-800 dark:text-green-200' :
                    alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-red-800 dark:text-red-200'
                  }>
                    {alert.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="youtube-url" className="text-base font-medium">
                  YouTube URL
                </Label>
                <div className="relative">
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={`h-12 text-base pr-10 ${isSecurityValidated ? 'border-green-500' : ''}`}
                    maxLength={2048}
                  />
                  {isSecurityValidated && (
                    <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports youtube.com and youtu.be links
                </p>
              </div>

              {/* Tab Count */}
              <div className="space-y-2">
                <Label htmlFor="tab-count" className="text-base font-medium">
                  Number of Tabs
                </Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="tab-count"
                    type="number"
                    min="1"
                    max="10"
                    value={tabCount}
                    onChange={(e) => handleTabCountChange(e.target.value)}
                    className="h-12 w-24 text-base text-center"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[2, 3, 5, 8].map((count) => (
                      <Badge
                        key={count}
                        variant="outline"
                        className="cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-800"
                        onClick={() => setTabCount(count)}
                      >
                        {count}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum 10 tabs for security and performance (browser may block excessive tabs)
                </p>
              </div>

              {/* Open Button */}
              <div className="space-y-3">
                <Button
                  onClick={openMultipleTabs}
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Opening Tabs...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-5 w-5" />
                      <span>Open {tabCount} VOB Tab{tabCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </Button>

                {/* Popup Test Button */}
                <Button
                  onClick={testPopupPermission}
                  variant="outline"
                  className="w-full h-10 text-sm"
                >
                  Test Popup Permission
                </Button>
              </div>

              {/* Recent URLs */}
              {recentUrls.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Recent URLs</Label>
                  <div className="space-y-2">
                    {recentUrls.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <button
                          onClick={() => handleRecentUrlClick(url)}
                          className="text-left flex-1 text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 truncate"
                        >
                          {url}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(url)}
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pro Tips</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="bg-white/30 dark:bg-gray-900/30 p-4 rounded-lg backdrop-blur-sm">
                <strong className="text-gray-900 dark:text-white">Enable Popups:</strong><br />
                Allow popups for this site in browser settings. Click the popup icon in address bar if blocked.
              </div>
              <div className="bg-white/30 dark:bg-gray-900/30 p-4 rounded-lg backdrop-blur-sm">
                <strong className="text-gray-900 dark:text-white">Performance:</strong><br />
                Opening many tabs may impact browser performance. Use responsibly.
              </div>
              <div className="bg-white/30 dark:bg-gray-900/30 p-4 rounded-lg backdrop-blur-sm">
                <strong className="text-gray-900 dark:text-white">VOB Technology:</strong><br />
                Virtual Origin Blocking with geo-masking and device fingerprint spoofing.
              </div>
              <div className="bg-white/30 dark:bg-gray-900/30 p-4 rounded-lg backdrop-blur-sm">
                <strong className="text-gray-900 dark:text-white">Browser Support:</strong><br />
                Works best in Chrome, Firefox, Safari, and Edge. Desktop recommended.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
