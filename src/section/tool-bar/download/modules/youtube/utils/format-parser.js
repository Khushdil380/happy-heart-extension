export class FormatParser {
  static parseVideoFormats(htmlContent, videoId) {
    const formats = [];
    
    try {
      // First, try to extract from player_response
      const playerResponseMatch = htmlContent.match(/"player_response":"([^"]+)"/);
      if (playerResponseMatch) {
        try {
          const playerResponse = JSON.parse(decodeURIComponent(playerResponseMatch[1]));
          const streamingData = playerResponse.streamingData;
          
          if (streamingData && streamingData.adaptiveFormats) {
            streamingData.adaptiveFormats.forEach(format => {
              if (format.mimeType) {
                const isVideo = format.mimeType.startsWith('video/');
                const isAudio = format.mimeType.startsWith('audio/');
                
                if (isVideo || isAudio) {
                  const quality = format.qualityLabel || format.audioQuality || 'Unknown';
                  const size = format.contentLength ? this.formatFileSize(format.contentLength) : 'Unknown';
                  
                  // Only add unique qualities
                  const existingFormat = formats.find(f => f.quality === quality && f.type === (isVideo ? 'video' : 'audio'));
                  if (!existingFormat) {
                    formats.push({
                      url: format.url || format.signatureCipher,
                      quality: quality,
                      type: isVideo ? 'video' : 'audio',
                      mimeType: format.mimeType,
                      size: size,
                      fps: format.fps || null,
                      hasSignature: !!format.signatureCipher
                    });
                  }
                }
              }
            });
          }
        } catch (parseError) {
          console.warn('Error parsing player_response:', parseError);
        }
      }
      
      // Fallback: Look in script tags
      if (formats.length === 0) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const scripts = doc.querySelectorAll('script');
        
        for (const script of scripts) {
          const content = script.textContent;
          
          if (content.includes('adaptiveFormats')) {
            try {
              const jsonMatch = content.match(/"adaptiveFormats":\s*(\[.*?\])/);
              if (jsonMatch) {
                const adaptiveFormats = JSON.parse(jsonMatch[1]);
                
                adaptiveFormats.forEach(format => {
                  if (format.mimeType) {
                    const isVideo = format.mimeType.startsWith('video/');
                    const isAudio = format.mimeType.startsWith('audio/');
                    
                    if (isVideo || isAudio) {
                      const quality = format.qualityLabel || format.audioQuality || 'Unknown';
                      const size = format.contentLength ? this.formatFileSize(format.contentLength) : 'Unknown';
                      
                      const existingFormat = formats.find(f => f.quality === quality && f.type === (isVideo ? 'video' : 'audio'));
                      if (!existingFormat) {
                        formats.push({
                          url: format.url || format.signatureCipher,
                          quality: quality,
                          type: isVideo ? 'video' : 'audio',
                          mimeType: format.mimeType,
                          size: size,
                          fps: format.fps || null,
                          hasSignature: !!format.signatureCipher
                        });
                      }
                    }
                  }
                });
              }
            } catch (parseError) {
              console.warn('Error parsing adaptiveFormats:', parseError);
            }
          }
        }
      }
      
      // If still no formats found, create fallback formats
      if (formats.length === 0) {
        formats.push(
          { quality: '720p', type: 'video', mimeType: 'video/mp4', size: '~50MB', url: null, hasSignature: false },
          { quality: '480p', type: 'video', mimeType: 'video/mp4', size: '~30MB', url: null, hasSignature: false },
          { quality: '360p', type: 'video', mimeType: 'video/mp4', size: '~20MB', url: null, hasSignature: false },
          { quality: 'Audio Only', type: 'audio', mimeType: 'audio/mp4', size: '~5MB', url: null, hasSignature: false }
        );
      }
      
    } catch (error) {
      console.error('Error parsing formats:', error);
    }
    
    return formats;
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
    // In a production environment, you'd need to implement YouTube's signature decryption
    return { url: url + '&' + sp + '=' + signature };
  }

  static formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
