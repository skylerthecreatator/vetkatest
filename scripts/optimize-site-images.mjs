import sharp from 'sharp';
const jobs = [
    ['images/side-fern.png', 'images/side-fern.webp', 1200],
    ['images/branch-decor.png', 'images/branch-decor.webp', 1400],
    ['images/catalog/gifts/gift-cover-ceramic-vase-wide.png', 'images/catalog/gifts/gift-cover-ceramic-vase-wide.webp', 720],
];
for (const [input, output, width] of jobs) {
    const result = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(output);
    console.log(`${output}: ${result.size} bytes`);
}
