export class VideoFetcher {
  static async fetchVideoInfo(videoId, timeout = 3000) {
    try {
      // Try only reliable CORS proxies
      const proxies = [
        'https://api.allorigins.win/get?url=',
        'https://api.codetabs.com/v1/proxy?quest='
      ];
      
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      // Create parallel fetch promises
      const fetchPromises = proxies.map(proxy => 
        this.fetchWithTimeout(proxy + encodeURIComponent(youtubeUrl), timeout)
          .then(response => ({ proxy, response, success: true }))
          .catch(error => ({ proxy, error, success: false }))
      );
      
      // Wait for the first successful response
      const results = await Promise.allSettled(fetchPromises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          const { response } = result.value;
          if (response.ok) {
            try {
              const data = await response.json();
              if (data.contents) {
                return data.contents;
              }
            } catch (parseError) {
              console.warn('Error parsing response:', parseError);
              continue;
            }
          }
        }
      }
      
      throw new Error('All proxies failed');
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    }
  }

  static async fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async getVideoStreamUrl(videoId, quality, type) {
    try {
      const htmlContent = await this.fetchVideoInfo(videoId);
      const streamUrls = this.extractStreamUrls(htmlContent, quality, type);
      return streamUrls.length > 0 ? streamUrls[0] : null;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      return null;
    }
  }

  static extractStreamUrls(htmlContent, targetQuality, targetType) {
    const streamUrls = [];
    
    try {
      // Look for player_response in the HTML content
      const playerResponseMatch = htmlContent.match(/"player_response":"([^"]+)"/);
      if (playerResponseMatch) {
        try {
          const playerResponse = JSON.parse(decodeURIComponent(playerResponseMatch[1]));
          const streamingData = playerResponse.streamingData;
          
          if (streamingData && streamingData.adaptiveFormats) {
            streamingData.adaptiveFormats.forEach(format => {
              if (format.url || format.signatureCipher) {
                const isVideo = format.mimeType && format.mimeType.startsWith('video/');
                const isAudio = format.mimeType && format.mimeType.startsWith('audio/');
                
                if ((targetType === 'video' && isVideo) || (targetType === 'audio' && isAudio)) {
                  const formatQuality = format.qualityLabel || format.audioQuality || 'Unknown';
                  
                  // Match quality or get the best available
                  if (formatQuality === targetQuality || 
                      (targetQuality === '720p' && formatQuality.includes('720')) ||
                      (targetQuality === '480p' && formatQuality.includes('480')) ||
                      (targetQuality === '360p' && formatQuality.includes('360')) ||
                      (targetQuality === 'Audio Only' && isAudio)) {
                    
                    let streamUrl = format.url;
                    
                    // Handle signatureCipher if present
                    if (format.signatureCipher) {
                      try {
                        const cipherData = this.parseSignatureCipher(format.signatureCipher);
                        streamUrl = cipherData.url;
                      } catch (cipherError) {
                        console.warn('Error parsing signatureCipher:', cipherError);
                        return; // Skip this format if we can't decode it
                      }
                    }
                    
                    if (streamUrl) {
                      streamUrls.push({
                        url: streamUrl,
                        quality: formatQuality,
                        type: isVideo ? 'video' : 'audio',
                        mimeType: format.mimeType,
                        contentLength: format.contentLength
                      });
                    }
                  }
                }
              }
            });
          }
        } catch (parseError) {
          console.warn('Error parsing player_response:', parseError);
        }
      }
      
    } catch (error) {
      console.error('Error extracting stream URLs:', error);
    }
    
    return streamUrls;
  }

  static parseSignatureCipher(signatureCipher) {
    const params = new URLSearchParams(signatureCipher);
    const url = params.get('url');
    const signature = params.get('s');
    const sp = params.get('sp') || 'signature';
    
    if (!url || !signature) {
      throw new Error('Invalid signatureCipher format');
    }
    
    // For now, return the URL as-is since signature decryption is complex
    return { url: url + '&' + sp + '=' + signature };
  }
}
