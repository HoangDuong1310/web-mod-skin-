# 🎭 Live2D Widget - Standalone Project

A ready-to-use Live2D widget that can be easily integrated into any website.

## ✨ Features

- **🚀 Easy Integration**: Just one script tag to add Live2D to your website
- **📱 Responsive**: Works on all devices and screen sizes
- **🎨 Customizable**: Easy to configure position, size, and behavior
- **⚡ High Performance**: Optimized WebGL rendering
- **🔧 No Dependencies**: Standalone project with all files included
- **🌐 Cross-Browser**: Compatible with all modern browsers

## 📁 Project Structure

```
live2d-project/
├── css/
│   └── waifu.css           # Widget styles
├── js/
│   ├── waifu-tips.js       # Widget logic
│   ├── live2d.min.js       # Live2D core
│   └── chunk/              # Additional modules
├── assets/
│   └── waifu-tips.json     # Widget configuration
├── demo/
│   └── index.html          # Demo page
├── live2d-widget.js        # Main script (use this!)
└── README.md
```

## 🚀 Quick Start

### Method 1: Simple Integration

Add this single line to your HTML:

```html
<script src="path/to/live2d-widget.js"></script>
```

### Method 2: Custom Configuration

```html
<script>
const live2d_path = './live2d-project/';
</script>
<script src="path/to/live2d-widget.js"></script>
```

### Method 3: Advanced Configuration

```javascript
// Custom configuration before loading
window.live2dConfig = {
    waifuPath: './assets/waifu-tips.json',
    cubism2Path: './js/live2d.min.js',
    tools: ['hitokoto', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
    logLevel: 'warn',
    drag: true
};
```

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `waifuPath` | string | `'./assets/waifu-tips.json'` | Path to waifu tips JSON |
| `cubism2Path` | string | `'./js/live2d.min.js'` | Path to Live2D core |
| `tools` | array | `['hitokoto', 'asteroids', ...]` | Available tools |
| `logLevel` | string | `'warn'` | Console log level |
| `drag` | boolean | `true` | Enable drag interaction |

## 📱 Usage Examples

### Basic Website Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to my website!</h1>
    <p>Content here...</p>
    
    <!-- Add Live2D Widget -->
    <script src="./live2d-project/live2d-widget.js"></script>
</body>
</html>
```

### WordPress Integration

Add to your theme's `footer.php`:

```php
<script src="<?php echo get_template_directory_uri(); ?>/live2d-project/live2d-widget.js"></script>
```

### React/Vue Integration

```javascript
// In your component
useEffect(() => {
    const script = document.createElement('script');
    script.src = './live2d-project/live2d-widget.js';
    document.body.appendChild(script);
    
    return () => {
        document.body.removeChild(script);
    };
}, []);
```

## 🎮 Interactive Features

- **Click**: Interact with the character
- **Drag**: Move the character around (if enabled)
- **Hover**: Character responds to mouse movement
- **Tools**: Built-in tools for switching models, taking photos, etc.

## 🌐 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 📦 File Sizes

| File | Size | Description |
|------|------|-------------|
| `live2d-widget.js` | ~2KB | Main loader script |
| `css/waifu.css` | ~5KB | Widget styles |
| `js/waifu-tips.js` | ~18KB | Widget logic |
| `js/live2d.min.js` | ~126KB | Live2D core |
| `assets/waifu-tips.json` | ~15KB | Configuration |

**Total**: ~166KB (gzipped: ~45KB)

## 🔧 Customization

### Change Position

```css
#waifu {
    left: auto !important;
    right: 0 !important;
}
```

### Change Size

```css
#live2d {
    width: 250px !important;
    height: 250px !important;
}
```

### Hide on Mobile

```css
@media (max-width: 768px) {
    #waifu {
        display: none !important;
    }
}
```

## 🚨 Troubleshooting

### Widget doesn't appear
- Check browser console for errors
- Ensure all files are accessible
- Verify paths are correct

### CORS errors
- Use HTTP server instead of opening files directly
- Check server configuration for proper MIME types

### Performance issues
- Reduce widget size
- Disable unnecessary tools
- Check for conflicts with other scripts

## 📄 License

This project is based on [live2d-widget](https://github.com/stevenjoezhang/live2d-widget) and follows the same license terms.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📞 Support

- 📧 Create an issue for bugs
- 💡 Submit feature requests
- 📖 Check the demo for examples

---

Made with ❤️ for the community
