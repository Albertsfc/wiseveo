import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'src/i18n/messages');

// Extract all leaf entries (dot-notation key -> string value) from a JSON object recursively
function extractEntries(obj: any, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      extractEntries(obj[key], `${prefix}${key}.`).forEach((v, k) => out.set(k, v));
    } else {
      out.set(`${prefix}${key}`, String(obj[key]));
    }
  }
  return out;
}

// Extract the sorted, comma-joined set of ICU placeholder names in a string value
function placeholders(value: string): string {
  return [...value.matchAll(/\{(\w+)/g)]
    .map(m => m[1])
    .sort()
    .join(',');
}

function checkI18n() {
  console.log('Verificando integridade das traduções (i18n)...');

  if (!fs.existsSync(MESSAGES_DIR)) {
    console.error(`❌ Diretório não encontrado: ${MESSAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MESSAGES_DIR).filter(file => file.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ Nenhum arquivo .json encontrado em src/i18n/messages');
    process.exit(1);
  }

  const expectedLocales = ['pt-BR.json', 'en-US.json', 'es-419.json'];
  const missingFiles = expectedLocales.filter(f => !files.includes(f));
  if (missingFiles.length > 0) {
    console.error(`❌ Arquivos de idioma faltando: ${missingFiles.join(', ')}`);
    process.exit(1);
  }

  const allEntries = new Map<string, Map<string, string>>();

  files.forEach(file => {
    const filePath = path.join(MESSAGES_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allEntries.set(file, extractEntries(content));
  });

  const baseFile = 'pt-BR.json';
  const baseEntries = allEntries.get(baseFile)!;
  const baseKeys = [...baseEntries.keys()];

  let hasErrors = false;

  // Check empty values in ALL files (including the base)
  files.forEach(file => {
    const entries = allEntries.get(file)!;
    entries.forEach((value, key) => {
      if (value.trim() === '') {
        console.error(`❌ Valor vazio em ${file}: ${key}`);
        hasErrors = true;
      }
    });
  });

  files.forEach(file => {
    if (file === baseFile) return;

    const currentEntries = allEntries.get(file)!;
    const currentKeys = [...currentEntries.keys()];

    // Check keys missing in current file that are present in base
    const missingKeys = baseKeys.filter(k => !currentEntries.has(k));
    if (missingKeys.length > 0) {
      console.error(`\n❌ Faltando em ${file} (presentes em ${baseFile}):`);
      missingKeys.forEach(k => console.error(`  - ${k}`));
      hasErrors = true;
    }

    // Check extra keys in current file not present in base
    const extraKeys = currentKeys.filter(k => !baseEntries.has(k));
    if (extraKeys.length > 0) {
      console.error(`\n❌ Chaves sobrando em ${file} (não presentes em ${baseFile}):`);
      extraKeys.forEach(k => console.error(`  - ${k}`));
      hasErrors = true;
    }

    // Check ICU placeholder parity for keys present in both files
    baseEntries.forEach((baseValue, key) => {
      if (!currentEntries.has(key)) return;
      const currentValue = currentEntries.get(key)!;
      const basePlaceholders = placeholders(baseValue);
      const currentPlaceholders = placeholders(currentValue);
      if (basePlaceholders !== currentPlaceholders) {
        console.error(
          `❌ Placeholders divergentes em ${file}: ${key} (base: {${basePlaceholders}} vs {${currentPlaceholders}})`
        );
        hasErrors = true;
      }
    });
  });

  if (hasErrors) {
    console.error('\n❌ Verificação de traduções falhou. Por favor, corrija os problemas acima.');
    process.exit(1);
  } else {
    console.log('✅ Todas as traduções estão sincronizadas e estruturalmente consistentes.');
  }
}

checkI18n();
