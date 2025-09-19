// Utility to help identify and update image tags to use OptimizedImage

export const imageUpdateSuggestions = {
  // Common patterns to look for
  patterns: [
    {
      name: 'Profile Pictures',
      pattern: /<img\s+src={[^}]*profilePicture[^}]*}/g,
      suggestion: 'Replace with <OptimizedImage with priority={true} and placeholder="blur"'
    },
    {
      name: 'Post Media Images',
      pattern: /<img\s+src={[^}]*media\.url[^}]*}/g,
      suggestion: 'Replace with <OptimizedImage with sizes attribute and lazy loading'
    },
    {
      name: 'Comment Avatars',
      pattern: /<img\s+src={[^}]*comment\.user[^}]*}/g,
      suggestion: 'Replace with <OptimizedImage with small dimensions and blur placeholder'
    },
    {
      name: 'General Images',
      pattern: /<img\s+src={[^}]*}/g,
      suggestion: 'Replace with <OptimizedImage with appropriate optimization settings'
    }
  ],
  
  // Get optimization settings based on context
  getOptimizationSettings: (context: 'profile' | 'post' | 'comment' | 'general') => {
    const baseSettings = {
      placeholder: 'blur' as const,
      quality: 85
    };
    
    switch (context) {
      case 'profile':
        return {
          ...baseSettings,
          priority: true,
          width: 48,
          height: 48
        };
      case 'post':
        return {
          ...baseSettings,
          sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
          quality: 85
        };
      case 'comment':
        return {
          ...baseSettings,
          width: 32,
          height: 32
        };
      default:
        return baseSettings;
    }
  }
};

// Common replacements for different image contexts
export const commonReplacements = {
  // Profile picture in post header
  profileInPost: {
    from: /<img\s+src={([^}]+)}\s+alt={([^}]+)}\s+className="([^"]*)"\s*\/>/g,
    to: '<OptimizedImage\n              src={$1}\n              alt={$2}\n              className="$3"\n              width={48}\n              height={48}\n              priority={true}\n              placeholder="blur"\n            />'
  },
  
  // Comment avatar
  commentAvatar: {
    from: /<img\s+src={([^}]+)}\s+alt={([^}]+)}\s+className="([^"]*)"\s*\/>/g,
    to: '<OptimizedImage\n                    src={$1}\n                    alt={$2}\n                    className="$3"\n                    width={32}\n                    height={32}\n                    placeholder="blur"\n                  />'
  },
  
  // Post media
  postMedia: {
    from: /<img\s+src={([^}]+)}\s+alt={([^}]+)}\s+className="([^"]*)"\s*\/>/g,
    to: '<OptimizedImage\n                    src={$1}\n                    alt={$2}\n                    className="$3"\n                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"\n                    quality={85}\n                    placeholder="blur"\n                  />'
  }
};

