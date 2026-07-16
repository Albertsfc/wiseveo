import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'src/i18n/messages');

// Extract all keys from a JSON object recursively
function extractKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(extractKeys(obj[key], `${prefix}${key}.`));
    } else {
      keys.push(`${prefix}${key}`);
    }
  }
  return keys;
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

  const allKeys = new Map<string, string[]>();

  files.forEach(file => {
    const filePath = path.join(MESSAGES_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allKeys.set(file, extractKeys(content));
  });

  const baseFile = 'pt-BR.json';
  const baseKeys = allKeys.get(baseFile)!;

  let hasErrors = false;

  files.forEach(file => {
    if (file === baseFile) return;

    const currentKeys = allKeys.get(file)!;
    
    // Check keys missing in current file that are present in base
    const missingKeys = baseKeys.filter(k => !currentKeys.includes(k));
    if (missingKeys.length > 0) {
      console.error(`\n❌ Faltando em ${file} (presentes em ${baseFile}):`);
      missingKeys.forEach(k => console.error(`  - ${k}`));
      hasErrors = true;
    }

    // Check extra keys in current file not present in base
    const extraKeys = currentKeys.filter(k => !baseKeys.includes(k));
    if (extraKeys.length > 0) {
      console.error(`\n⚠️  Chaves sobrando em ${file} (não presentes em ${baseFile}):`);
      extraKeys.forEach(k => console.error(`  - ${k}`));
      // We don't fail for extra keys, just warn, but usually good practice to fail
      // hasErrors = true; 
    }
  });

  if (hasErrors) {
    console.error('\n❌ Verificação de traduções falhou. Por favor, adicione as chaves faltantes.');
    process.exit(1);
  } else {
    console.log('✅ Todas as traduções estão sincronizadas e estruturalmente consistentes.');
  }
}

checkI18n();
