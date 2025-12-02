import { readdirSync, existsSync, writeFileSync, Dirent } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface StickerData {
    id: string;
    icon: string;
    name: string;
    color: string;
    company: string;
}

// Paleta de colores por empresa (identidad visual)
const COMPANY_COLORS: Record<string, string> = {
    'AuroraGlobal': '#FF6B35',
    'AuroraLogistic': '#00A9E0',
    'AuroraTabaco': '#8B5A8F',
    'Brickpoint': '#E63946',
    'Fidelium': '#06FFA5',
    'GrupoCoporativo': '#FFD700',
    'Kora': '#FF1493',
    'PCM': '#00CED1',
    'ParqueIndustrialELJ': '#9370DB',
    'Patronale': '#FFB347',
    'Rum': '#FFA500',
    'SunriseInternational': '#FF69B4',
    'aurora usa stiker': '#87CEEB',
};

const DEFAULT_COLOR = '#FF6B35';

function cleanCompanyName(dirName: string): string {
    // Convertir nombre de carpeta a nombre legible
    return dirName
        .replace(/([A-Z])/g, ' $1') // Agregar espacio antes de mayúsculas
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Separar camelCase
        .trim()
        .replace(/\s+/g, ' '); // Normalizar espacios
}

function generateStickerId(company: string, index: number): string {
    return `${company.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`;
}

function scanStickersDirectory(baseDir: string): StickerData[] {
    const stickers: StickerData[] = [];

    if (!existsSync(baseDir)) {
        console.error(`❌ Directory not found: ${baseDir}`);
        return stickers;
    }

    const companies = readdirSync(baseDir, { withFileTypes: true })
        .filter((dirent: Dirent) => dirent.isDirectory())
        .map((dirent: Dirent) => dirent.name);

    console.log(`📁 Found ${companies.length} companies:\n`);

    companies.forEach((company: string) => {
        const companyPath = join(baseDir, company);
        const files = readdirSync(companyPath)
            .filter((file: string) => file.endsWith('.png'))
            .sort(); // Ordenar alfabéticamente

        const companyColor = COMPANY_COLORS[company] || DEFAULT_COLOR;
        const displayName = cleanCompanyName(company);

        console.log(`   ✓ ${displayName}: ${files.length} stickers`);

        files.forEach((file: string, index: number) => {
            const stickerId = generateStickerId(company, index);
            const iconPath = `/stickers/${company}/${file}`;

            stickers.push({
                id: stickerId,
                icon: iconPath,
                name: `${displayName} ${index + 1}`,
                color: companyColor,
                company: displayName,
            });
        });
    });

    console.log(`\n✅ Total indexed: ${stickers.length} stickers\n`);
    return stickers;
}

function generateTypescriptFile(stickers: StickerData[], outputPath: string): void {
    const companiesList = Array.from(new Set(stickers.map(s => s.company))).sort();

    const fileContent = `import type { Sticker } from '../types';

/**
 * Auto-generated sticker index
 * Run 'npm run index-stickers' to regenerate this file
 * 
 * Total: ${stickers.length} stickers across ${companiesList.length} companies
 */

export const AVAILABLE_STICKERS: Sticker[] = [
${stickers.map(s => `  { id: '${s.id}', icon: '${s.icon}', name: '${s.name}', color: '${s.color}', company: '${s.company}' },`).join('\n')}
];

/**
 * List of all companies
 */
export const COMPANIES: string[] = [
${companiesList.map(c => `  '${c}',`).join('\n')}
];

/**
 * Get stickers by company
 */
export function getStickersByCompany(company: string): Sticker[] {
  return AVAILABLE_STICKERS.filter(s => s.company === company);
}

/**
 * Get company color
 */
export function getCompanyColor(company: string): string {
  const sticker = AVAILABLE_STICKERS.find(s => s.company === company);
  return sticker?.color || '#FF6B35';
}
`;

    writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`💾 Generated: ${outputPath}`);
}

// Main execution
const publicDir = join(__dirname, '..', 'public', 'stickers');
const outputFile = join(__dirname, '..', 'src', 'utils', 'stickers.ts');

console.log('🔍 Scanning stickers directory...\n');
const stickers = scanStickersDirectory(publicDir);

if (stickers.length > 0) {
    generateTypescriptFile(stickers, outputFile);
    console.log('✨ Indexing complete!\n');
} else {
    console.error('❌ No stickers found!');
    process.exit(1);
}
