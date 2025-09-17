export class ExternalServices {
  static openService(videoId, quality, type) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Use more reliable external services
    let serviceUrl = '';
    if (type === 'audio') {
      serviceUrl = `https://www.y2mate.com/en/search/${videoId}`;
    } else {
      serviceUrl = `https://www.y2mate.com/en/search/${videoId}`;
    }
    
    try {
      window.open(serviceUrl, '_blank');
    } catch (error) {
      console.error('Error opening external service:', error);
      // Fallback to direct YouTube link
      window.open(videoUrl, '_blank');
    }
  }

  static getServiceUrls(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    return {
      y2mate: `https://www.y2mate.com/en/search/${videoId}`,
      savefrom: `https://www.y2mate.com/en/search/${videoId}`,
      youtubedl: `https://www.y2mate.com/en/search/${videoId}`,
      clipconverter: `https://www.y2mate.com/en/search/${videoId}`,
      keepvid: `https://www.y2mate.com/en/search/${videoId}`,
      onlinevideoconverter: `https://www.y2mate.com/en/search/${videoId}`
    };
  }

  static getReliableServices(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    return [
      {
        name: 'Y2mate',
        url: `https://www.y2mate.com/en/search/${videoId}`,
        description: 'Popular YouTube downloader'
      },
      {
        name: 'SaveFrom',
        url: `https://www.savefrom.net/#url=${encodeURIComponent(videoUrl)}`,
        description: 'Multiple format support'
      },
      {
        name: 'YT-DLP Online',
        url: `https://www.yt-dlp.org/#url=${encodeURIComponent(videoUrl)}`,
        description: 'Command line tool online'
      }
    ];
  }
}
