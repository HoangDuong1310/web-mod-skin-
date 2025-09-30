/*!
 * Live2D Widget - Standalone Project
 * Ready to integrate into any website
 */

// Configuration
const live2d_path = './live2d-project/';
const WIDGET_VERSION = '2.0.0-local'; // Force reload
console.log(`[Live2D Widget] Version ${WIDGET_VERSION}`);

// Method to encapsulate asynchronous resource loading
function loadExternalResource(url, type) {
  return new Promise((resolve, reject) => {
    let tag;

    if (type === 'css') {
      tag = document.createElement('link');
      tag.rel = 'stylesheet';
      tag.href = url;
    }
    else if (type === 'js') {
      tag = document.createElement('script');
      tag.type = 'module';
      tag.src = url;
    }
    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

(async () => {
  // Check for mobile devices (optional)
  // if (screen.width < 768) return;

  // Avoid cross-origin issues with image resources
  const OriginalImage = window.Image;
  window.Image = function(...args) {
    const img = new OriginalImage(...args);
    img.crossOrigin = "anonymous";
    return img;
  };
  window.Image.prototype = OriginalImage.prototype;
  
  try {
    // Load CSS and JS files
    await Promise.all([
      loadExternalResource(live2d_path + 'css/waifu.css', 'css'),
      loadExternalResource(live2d_path + 'js/waifu-tips-fixed-v2.js', 'js')
    ]);
    
    // Clear ALL localStorage to force fresh start
    localStorage.clear();
    console.log('[DEBUG] Cleared localStorage');
    
    // Initialize widget with LOCAL model
    initWidget({
      waifuPath: live2d_path + 'assets/waifu-tips-vi.json',
      
      // Use LOCAL models (ALL 27 models downloaded!)
      models: [
        // Potion-Maker Series
        {
          name: "Pio",
          paths: [live2d_path + "models/Potion-Maker-Pio/index.json"],
          message: "Pio từ Potion Maker~ 🧪"
        },
        {
          name: "Tia",
          paths: [live2d_path + "models/Potion-Maker-Tia/index.json"],
          message: "Tia từ Potion Maker~ 🧪"
        },
        // Bilibili Live
        {
          name: "Bilibili 22",
          paths: [live2d_path + "models/bilibili-live-22/index.json"],
          message: "Bilibili Live 22 đây!"
        },
        {
          name: "Bilibili 33",
          paths: [live2d_path + "models/bilibili-live-33/index.json"],
          message: "Bilibili Live 33!"
        },
        // Shizuku Talk
        {
          name: "Shizuku",
          paths: [live2d_path + "models/ShizukuTalk-shizuku-48/index.json"],
          message: "Shizuku Talk!"
        },
        {
          name: "Shizuku Pajama",
          paths: [live2d_path + "models/ShizukuTalk-shizuku-pajama/index.json"],
          message: "Shizuku mặc đồ ngủ~ 😴"
        },
        // Hyperdimension Neptunia - Neptune
        {
          name: "Neptune Classic",
          paths: [live2d_path + "models/HyperdimensionNeptunia-neptune_classic/index.json"],
          message: "Neptune classic!"
        },
        {
          name: "NepNep",
          paths: [live2d_path + "models/HyperdimensionNeptunia-nepnep/index.json"],
          message: "Nep! Nep!"
        },
        {
          name: "Neptune Santa",
          paths: [live2d_path + "models/HyperdimensionNeptunia-neptune_santa/index.json"],
          message: "Neptune Giáng sinh! 🎄"
        },
        {
          name: "Neptune Maid",
          paths: [live2d_path + "models/HyperdimensionNeptunia-nepmaid/index.json"],
          message: "Neptune hầu gái! 👗"
        },
        {
          name: "Neptune Swim",
          paths: [live2d_path + "models/HyperdimensionNeptunia-nepswim/index.json"],
          message: "Neptune đồ bơi! 🏊"
        },
        // Hyperdimension Neptunia - Noir
        {
          name: "Noir Classic",
          paths: [live2d_path + "models/HyperdimensionNeptunia-noir_classic/index.json"],
          message: "Noir classic!"
        },
        {
          name: "Noir",
          paths: [live2d_path + "models/HyperdimensionNeptunia-noir/index.json"],
          message: "Noir!"
        },
        {
          name: "Noir Santa",
          paths: [live2d_path + "models/HyperdimensionNeptunia-noir_santa/index.json"],
          message: "Noir Giáng sinh! 🎄"
        },
        {
          name: "Noir Swim",
          paths: [live2d_path + "models/HyperdimensionNeptunia-noireswim/index.json"],
          message: "Noir đồ bơi! 🏊"
        },
        // Hyperdimension Neptunia - Blanc
        {
          name: "Blanc Classic",
          paths: [live2d_path + "models/HyperdimensionNeptunia-blanc_classic/index.json"],
          message: "Blanc classic!"
        },
        {
          name: "Blanc",
          paths: [live2d_path + "models/HyperdimensionNeptunia-blanc_normal/index.json"],
          message: "Blanc!"
        },
        {
          name: "Blanc Swim",
          paths: [live2d_path + "models/HyperdimensionNeptunia-blanc_swimwear/index.json"],
          message: "Blanc đồ bơi! 🏊"
        },
        // Hyperdimension Neptunia - Vert
        {
          name: "Vert Classic",
          paths: [live2d_path + "models/HyperdimensionNeptunia-vert_classic/index.json"],
          message: "Vert classic!"
        },
        {
          name: "Vert",
          paths: [live2d_path + "models/HyperdimensionNeptunia-vert_normal/index.json"],
          message: "Vert!"
        },
        {
          name: "Vert Swim",
          paths: [live2d_path + "models/HyperdimensionNeptunia-vert_swimwear/index.json"],
          message: "Vert đồ bơi! 🏊"
        },
        // Hyperdimension Neptunia - Others
        {
          name: "Nepgear",
          paths: [live2d_path + "models/HyperdimensionNeptunia-nepgear/index.json"],
          message: "Nepgear!"
        },
        {
          name: "Nepgear Extra",
          paths: [live2d_path + "models/HyperdimensionNeptunia-nepgear_extra/index.json"],
          message: "Nepgear Extra!"
        },
        {
          name: "Nepgear Swim",
          paths: [live2d_path + "models/HyperdimensionNeptunia-nepgearswim/index.json"],
          message: "Nepgear đồ bơi! 🏊"
        },
        {
          name: "Histoire",
          paths: [live2d_path + "models/HyperdimensionNeptunia-histoire/index.json"],
          message: "Histoire!"
        },
        {
          name: "Histoire No Hover",
          paths: [live2d_path + "models/HyperdimensionNeptunia-histoirenohover/index.json"],
          message: "Histoire (no hover)!"
        },
        // Kantai Collection
        {
          name: "Murakumo",
          paths: [live2d_path + "models/KantaiCollection-murakumo/index.json"],
          message: "Murakumo từ Kantai Collection! ⚓"
        }
      ],
      
      modelId: 0, // First model (Pio)
      modelTexturesId: 0,
      cubism2Path: live2d_path + 'js/live2d.min.js',
      // cubism5Path: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
      tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'], // Updated: VN quotes, love msg, model info
      logLevel: 'info', // Changed to info for better debugging
      drag: true, // Enable drag interaction
    });
    
    console.log('%cLive2D%cWidget%c Standalone Project', 
      'padding: 8px; background: #cd3e45; font-weight: bold; font-size: large; color: white;', 
      'padding: 8px; background: #ff5450; font-size: large; color: #eee;', 
      'padding: 8px; background: #28a745; font-size: large; color: white;');
    
  } catch (error) {
    console.error('❌ Failed to load Live2D Widget:', error);
  }
})();
