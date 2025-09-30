const fs = require('fs')
const path = require('path')

// List of missing preview images from the error logs
const missingImages = [
  'irelia_divine_azure_1.jpg',
  'leesin_dragon_fist_1.jpg', 
  'lux_cosmic_prismatic_1.jpg',
  'zed_death_sworn_1.jpg',
  'ahri_elderwood_1.jpg',
  'ahri_spirit_crimson_1.jpg',
  'jinx_star_guardian_1.jpg',
  'yasuo_project_1.jpg',
  'yasuo_dark_star_1.jpg',
  'photo_1758118964819_c3b2t0hueqe.png'
]

// SVG template for sample images
const createSampleSVG = (skinName, index) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>
  <defs>
    <linearGradient id='grad${index}' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#${Math.floor(Math.random()*16777215).toString(16)}'/>
      <stop offset='50%' stop-color='#${Math.floor(Math.random()*16777215).toString(16)}'/>
      <stop offset='100%' stop-color='#${Math.floor(Math.random()*16777215).toString(16)}'/>
    </linearGradient>
  </defs>
  <rect width='800' height='450' fill='url(#grad${index})'/>
  <circle cx='${200 + Math.random() * 400}' cy='${100 + Math.random() * 250}' r='${40 + Math.random() * 40}' fill='white' opacity='0.1'/>
  <text x='50%' y='45%' text-anchor='middle' dy='.3em' font-family='system-ui' font-size='28' font-weight='bold' fill='white' opacity='0.9'>
    ${skinName}
  </text>
  <text x='50%' y='60%' text-anchor='middle' dy='.3em' font-family='system-ui' font-size='14' fill='white' opacity='0.7'>
    Custom Skin Preview
  </text>
</svg>`

// Create previews directory if it doesn't exist
const previewsDir = path.join(process.cwd(), 'public', 'uploads', 'previews')
if (!fs.existsSync(previewsDir)) {
  fs.mkdirSync(previewsDir, { recursive: true })
}

// Generate sample images
missingImages.forEach((filename, index) => {
  const skinName = filename.split('_')[0] || 'Custom Skin'
  const capitalizedName = skinName.charAt(0).toUpperCase() + skinName.slice(1)
  
  const svgContent = createSampleSVG(capitalizedName, index)
  const filePath = path.join(previewsDir, filename)
  
  try {
    fs.writeFileSync(filePath, svgContent)
    console.log(`✅ Created: ${filename}`)
  } catch (error) {
    console.error(`❌ Failed to create ${filename}:`, error.message)
  }
})

console.log(`\n🎉 Generated ${missingImages.length} sample preview images!`)
console.log('📁 Location: public/uploads/previews/')
console.log('🔄 Restart the dev server to see the changes.')
