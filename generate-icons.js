const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const inputSvg = path.join(__dirname, 'public', 'logo.svg');
  const outputDir = path.join(__dirname, 'public');

  try {
    // Convertir SVG a PNG manteniendo proporciones
    const svgBuffer = await sharp(inputSvg).png().toBuffer();
    const metadata = await sharp(svgBuffer).metadata();

    // Generar icon-192.png
    await sharp(svgBuffer)
      .resize(192, 192, {
        fit: 'fill', // Llenar completamente sin mantener proporciones
        withoutEnlargement: false
      })
      .png()
      .toFile(path.join(outputDir, 'icon-192.png'));

    // Generar icon-512.png
    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'fill',
        withoutEnlargement: false
      })
      .png()
      .toFile(path.join(outputDir, 'icon-512.png'));

    // Generar apple-touch-icon.png
    await sharp(svgBuffer)
      .resize(180, 180, {
        fit: 'fill',
        withoutEnlargement: false
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    console.log('Iconos generados exitosamente');
  } catch (error) {
    console.error('Error generando iconos:', error);
  }
}

generateIcons();