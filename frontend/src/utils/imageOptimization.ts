// Image optimization utilities

export const generateWebPUrl = (originalUrl: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif';
} = {}): string => {
  if (!originalUrl) return '';
  
  const { width, height, quality = 75, format = 'auto' } = options;
  
  // If it's a Cloudinary URL, add optimization parameters
  if (originalUrl.includes('cloudinary.com')) {
    const separator = originalUrl.includes('?') ? '&' : '?';
    let params = `f_${format},q_auto:best`; // Changed to best quality for faster loading
    
    if (width) params += `,w_${width}`;
    if (height) params += `,h_${height}`;
    if (quality && format !== 'auto') params += `,q_${quality}`;
    
    // Add delivery optimization
    params += `,dpr_auto,fl_progressive`;
    
    return `${originalUrl}${separator}${params}`;
  }
  
  // For other URLs, return as is
  return originalUrl;
};

export const generateBlurDataURL = (width: number = 40, height: number = 40): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add a subtle pattern
    ctx.fillStyle = '#d1d5db';
    for (let i = 0; i < width; i += 8) {
      for (let j = 0; j < height; j += 8) {
        if ((i + j) % 16 === 0) {
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }
  }
  
  return canvas.toDataURL();
};

export const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
};

// Default avatar for users
export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzM3M0EiLz4KPHBhdGggZD0iTTIwIDEwQzIyLjIwOTEgMTAgMjQgMTEuNzkwOSAyNCAxNEMyNCAxNi4yMDkxIDIyLjIwOTEgMTggMjAgMThDMTcuNzkwOSAxOCAxNiAxNi4yMDkxIDE2IDE0QzE2IDExLjc5MDkgMTcuNzkwOSAxMCAyMCAxMFoiIGZpbGw9IiM2QjZCNkIiLz4KPHBhdGggZD0iTTI4IDMwQzI4IDI2LjY4NjMgMjQuNDE4MyAyNCAyMCAyNEMxNS41ODE3IDI0IDEyIDI2LjY4NjMgMTIgMzBIMjhaIiBmaWlsPSIjNkI2QjZCIi8+Cjwvc3ZnPgo=';

// Large avatar for profile pages
export const DEFAULT_LARGE_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjMzczNzNBIi8+CjxwYXRoIGQ9Ik02MCAzMEM2Ni4yNzQxIDMwIDcxLjQgMzUuMTI1OSA3MS40IDQxLjRDNzEuNCA0Ny42NzQxIDY2LjI3NDEgNTIuOCA2MCA1Mi44QzUzLjcyNTkgNTIuOCA0OC42IDQ3LjY3NDEgNDguNiA0MS40QzQ4LjYgMzUuMTI1OSA1My43MjU5IDMwIDYwIDMwWiIgZmlsbD0iIzZCNkI2QiIvPgo8cGF0aCBkPSJNODQgOTBDODQgNzguOTU0MyA3My4wNDU3IDY4IDYwIDY4QzQ2Ljk1NDMgNjggMzYgNzguOTU0MyAzNiA5MEg4NFoiIGZpbGw9IiM2QjZCNkIiLz4KPC9zdmc+Cg==';

