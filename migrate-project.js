#!/usr/bin/env node

/**
 * Script de migración automática de ZEN Platform
 * Migra desde el proyecto original a una estructura limpia
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = '/Users/israelwong/Documents/Desarrollo/zen-platform';
const TARGET_DIR = '/Users/israelwong/Documents/Desarrollo/zen-platform-v2';

console.log('🚀 Iniciando migración de ZEN Platform...');

// 1. Copiar package.json y actualizar dependencias
console.log('📦 Copiando package.json...');
const sourcePackage = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'package.json'), 'utf8'));
const targetPackage = JSON.parse(fs.readFileSync(path.join(TARGET_DIR, 'package.json'), 'utf8'));

// Mergear dependencias
targetPackage.dependencies = { ...targetPackage.dependencies, ...sourcePackage.dependencies };
targetPackage.devDependencies = { ...targetPackage.devDependencies, ...sourcePackage.devDependencies };
targetPackage.scripts = { ...targetPackage.scripts, ...sourcePackage.scripts };

fs.writeFileSync(path.join(TARGET_DIR, 'package.json'), JSON.stringify(targetPackage, null, 2));

// 2. Copiar archivos de configuración
console.log('⚙️ Copiando archivos de configuración...');
const configFiles = [
  'prisma',
  '.env.example',
  'next.config.mjs',
  'vercel.json',
  'tailwind.config.ts',
  'tsconfig.json'
];

configFiles.forEach(file => {
  const sourcePath = path.join(SOURCE_DIR, file);
  const targetPath = path.join(TARGET_DIR, file);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.statSync(sourcePath).isDirectory()) {
      execSync(`cp -r "${sourcePath}" "${targetPath}"`);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
    console.log(`✅ Copiado: ${file}`);
  }
});

// 3. Copiar directorios esenciales
console.log('📁 Copiando directorios esenciales...');
const essentialDirs = [
  'src/lib',
  'src/types',
  'src/components/ui/zen',
  'src/hooks',
  'public'
];

essentialDirs.forEach(dir => {
  const sourcePath = path.join(SOURCE_DIR, dir);
  const targetPath = path.join(TARGET_DIR, dir);
  
  if (fs.existsSync(sourcePath)) {
    execSync(`mkdir -p "${path.dirname(targetPath)}"`);
    execSync(`cp -r "${sourcePath}" "${targetPath}"`);
    console.log(`✅ Copiado: ${dir}`);
  }
});

// 4. Crear estructura de rutas limpia
console.log('🛣️ Creando estructura de rutas limpia...');

const cleanRoutes = {
  'src/app/(auth)': [
    'login/page.tsx',
    'signup/page.tsx',
    'forgot-password/page.tsx',
    'update-password/page.tsx',
    'redirect/page.tsx',
    'error/page.tsx',
    'sign-up-success/page.tsx'
  ],
  'src/app/(marketing)': [
    'page.tsx',
    'about/page.tsx',
    'contact/page.tsx',
    'pricing/page.tsx',
    'layout.tsx'
  ],
  'src/app/admin': [
    'page.tsx',
    'layout.tsx',
    'dashboard/page.tsx',
    'agents/page.tsx',
    'agents/[id]/page.tsx',
    'agents/[id]/edit/page.tsx',
    'agents/new/page.tsx',
    'analytics/page.tsx',
    'analytics/facturacion/page.tsx',
    'analytics/finanzas/page.tsx',
    'analytics/marketing/page.tsx',
    'analytics/ventas/page.tsx',
    'campanas/activas/page.tsx',
    'campanas/historial/page.tsx',
    'campanas/plataformas/page.tsx',
    'canales/page.tsx',
    'configuracion/page.tsx',
    'descuentos/page.tsx',
    'descuentos/agentes/page.tsx',
    'descuentos/configuracion/page.tsx',
    'descuentos/general/page.tsx',
    'descuentos/general/[id]/page.tsx',
    'descuentos/general/nuevo/page.tsx',
    'descuentos/reportes/page.tsx',
    'pipeline/page.tsx',
    'plans/page.tsx',
    'plans/[id]/edit/page.tsx',
    'plans/new/page.tsx',
    'plataformas-redes/page.tsx',
    'redes-sociales/page.tsx',
    'revenue/page.tsx',
    'services/page.tsx',
    'services/categorias/page.tsx'
  ],
  'src/app/agente': [
    'page.tsx',
    'layout.tsx',
    'dashboard/page.tsx',
    'leads/page.tsx',
    'leads/[id]/page.tsx',
    'studios/page.tsx',
    'crm/kanban/page.tsx'
  ],
  'src/app/studio/[slug]': [
    'page.tsx',
    'layout.tsx',
    'app/page.tsx',
    'app/dashboard/page.tsx',
    'app/dashboard/agenda/page.tsx',
    'app/dashboard/contactos/page.tsx',
    'app/dashboard/finanzas/page.tsx',
    'app/dashboard/kanban/page.tsx',
    'manager/agenda/page.tsx',
    'manager/contactos/page.tsx',
    'manager/finanzas/page.tsx',
    'manager/kanban/page.tsx'
  ]
};

// Crear estructura de directorios
Object.keys(cleanRoutes).forEach(baseDir => {
  const fullPath = path.join(TARGET_DIR, baseDir);
  execSync(`mkdir -p "${fullPath}"`);
  
  cleanRoutes[baseDir].forEach(route => {
    const routePath = path.join(fullPath, route);
    const routeDir = path.dirname(routePath);
    execSync(`mkdir -p "${routeDir}"`);
    
    // Crear archivo placeholder
    const componentName = path.basename(route, '.tsx').replace(/\[|\]/g, '');
    const content = `export default function ${componentName.charAt(0).toUpperCase() + componentName.slice(1)}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">${componentName.charAt(0).toUpperCase() + componentName.slice(1)}</h1>
      <p>Página en construcción...</p>
    </div>
  );
}`;
    
    fs.writeFileSync(routePath, content);
  });
});

console.log('✅ Estructura de rutas creada');

// 5. Copiar API routes
console.log('🔌 Copiando API routes...');
const apiSource = path.join(SOURCE_DIR, 'src/app/api');
const apiTarget = path.join(TARGET_DIR, 'src/app/api');

if (fs.existsSync(apiSource)) {
  execSync(`cp -r "${apiSource}" "${apiTarget}"`);
  console.log('✅ API routes copiadas');
}

// 6. Instalar dependencias
console.log('📦 Instalando dependencias...');
execSync('npm install', { cwd: TARGET_DIR, stdio: 'inherit' });

console.log('🎉 ¡Migración completada!');
console.log('📝 Próximos pasos:');
console.log('1. cd zen-platform-v2');
console.log('2. npm run dev');
console.log('3. Migrar componentes uno por uno');
console.log('4. Probar deploy en Vercel');
