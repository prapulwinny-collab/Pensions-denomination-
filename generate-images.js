import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function generatePngIcons() {
  console.log('Generating PNG icons from SVG...');
  
  const iconSvgPath = path.join(PUBLIC_DIR, 'icon.svg');
  const maskableSvgPath = path.join(PUBLIC_DIR, 'icon-maskable.svg');

  if (!fs.existsSync(iconSvgPath)) {
    throw new Error('icon.svg not found in public/');
  }

  // 1. Generate regular icons
  await sharp(iconSvgPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  console.log('Created icon-192.png');

  await sharp(iconSvgPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 2. Generate maskable icons
  if (fs.existsSync(maskableSvgPath)) {
    await sharp(maskableSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-maskable-192.png'));
    console.log('Created icon-maskable-192.png');

    await sharp(maskableSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-maskable-512.png'));
    console.log('Created icon-maskable-512.png');
  } else {
    // Fallback to regular icon for maskable
    await sharp(iconSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-maskable-192.png'));
    await sharp(iconSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-maskable-512.png'));
    console.log('Created fallback maskable PNG icons');
  }
}

async function generateScreenshots() {
  console.log('Generating vector screenshots...');

  // SVG representation of a high-fidelity desktop app screenshot
  const desktopSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <!-- Soft grey background with warm vignette -->
  <rect width="1280" height="720" fill="#f8fafc" />
  
  <!-- Subtle background glowing mesh gradients -->
  <circle cx="200" cy="100" r="300" fill="#e0e7ff" opacity="0.4" filter="blur(60px)" />
  <circle cx="1000" cy="600" r="400" fill="#ecfdf5" opacity="0.4" filter="blur(80px)" />

  <!-- Mock App Top Bar / Header -->
  <rect x="0" y="0" width="1280" height="72" fill="#ffffff" rx="0" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))" />
  
  <!-- Logo & Title -->
  <g transform="translate(40, 20)">
    <!-- Tiny icon mimic -->
    <rect x="0" y="0" width="32" height="32" rx="8" fill="#4f46e5" />
    <path d="M 8,16 L 16,8 L 24,16 L 16,24 Z" fill="#ffffff" />
    <text x="44" y="22" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#0f172a">Cash Payout &amp; Denomination Calculator</text>
    <rect x="360" y="4" width="70" height="24" rx="12" fill="#e0e7ff" />
    <text x="395" y="20" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#4338ca" text-anchor="middle">ACTIVE PWA</text>
  </g>

  <!-- Navigation items placeholder -->
  <g transform="translate(1000, 24)" font-family="system-ui, sans-serif" font-size="13" font-weight="600">
    <text x="0" y="16" fill="#4f46e5">Calculator</text>
    <text x="100" y="16" fill="#64748b">History Templates</text>
    <text x="240" y="16" fill="#64748b">Settings</text>
  </g>

  <!-- Metric Summary Row (Cards) -->
  <g transform="translate(40, 100)">
    <!-- Card 1: Target Payout Total -->
    <g transform="translate(0, 0)">
      <rect width="280" height="100" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">TARGET PAYOUT TOTAL</text>
      <text x="24" y="70" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#0f172a">$4,850.00</text>
    </g>

    <!-- Card 2: Allocated Cash -->
    <g transform="translate(304, 0)">
      <rect width="280" height="100" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">ALLOCATED CASH</text>
      <text x="24" y="70" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#10b981">$4,850.00</text>
    </g>

    <!-- Card 3: Leftover in Drawer -->
    <g transform="translate(608, 0)">
      <rect width="280" height="100" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">LEFTOVER IN DRAWER</text>
      <text x="24" y="70" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#6366f1">$150.00</text>
    </g>

    <!-- Card 4: Perfect Change Mode -->
    <g transform="translate(912, 0)">
      <rect width="288" height="100" rx="16" fill="#e0e7ff" stroke="#c7d2fe" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#4338ca" letter-spacing="1">BALANCED DIVISION MODE</text>
      <text x="24" y="65" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#312e81">Equivalent Division Active</text>
      <text x="24" y="82" font-family="system-ui, sans-serif" font-size="10" font-weight="500" fill="#4338ca">Distributes denominations evenly among staff.</text>
    </g>
  </g>

  <!-- Main Content Workspace (Split layout: List & Drawer Stock) -->
  <g transform="translate(40, 230)">
    
    <!-- Left Panel: Drawer Stock & Settings -->
    <g transform="translate(0, 0)">
      <rect width="360" height="440" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#0f172a">Cash Drawer Stock</text>
      <text x="24" y="56" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Adjust available currency notes in register.</text>

      <!-- Denominations list mockup -->
      <g transform="translate(24, 80)">
        <!-- Row $100 -->
        <g transform="translate(0, 0)">
          <rect width="312" height="44" rx="10" fill="#f8fafc" />
          <text x="16" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#334155">$100 Note</text>
          <text x="240" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#4f46e5">x 25 pcs</text>
        </g>
        <!-- Row $50 -->
        <g transform="translate(0, 56)">
          <rect width="312" height="44" rx="10" fill="#f8fafc" />
          <text x="16" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#334155">$50 Note</text>
          <text x="240" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#4f46e5">x 40 pcs</text>
        </g>
        <!-- Row $20 -->
        <g transform="translate(0, 112)">
          <rect width="312" height="44" rx="10" fill="#f8fafc" />
          <text x="16" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#334155">$20 Note</text>
          <text x="240" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#4f46e5">x 50 pcs</text>
        </g>
        <!-- Row $10 -->
        <g transform="translate(0, 168)">
          <rect width="312" height="44" rx="10" fill="#f8fafc" />
          <text x="16" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#334155">$10 Note</text>
          <text x="240" y="26" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#4f46e5">x 100 pcs</text>
        </g>
      </g>

      <!-- Currency Details Badge -->
      <g transform="translate(24, 320)">
        <rect width="312" height="90" rx="12" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1" />
        <text x="16" y="28" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#065f46">Currency: United States Dollar (USD)</text>
        <text x="16" y="48" font-family="system-ui, sans-serif" font-size="10" fill="#047857">Dynamic configurations for USD, EUR, INR, GBP,</text>
        <text x="16" y="64" font-family="system-ui, sans-serif" font-size="10" fill="#047857">PHP, and custom coin/note setups.</text>
      </g>
    </g>

    <!-- Right Panel: Staff Breakdown List -->
    <g transform="translate(390, 0)">
      <rect width="810" height="440" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      
      <!-- Panel Header with controls -->
      <text x="24" y="36" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#0f172a">Staff Payout Breakdown (Equivalent Division)</text>
      <text x="24" y="56" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Review notes distributed to each person to balance denominations.</text>
      
      <!-- Import CSV and Add button mimicking -->
      <g transform="translate(540, 20)">
        <rect x="0" y="0" width="110" height="32" rx="8" fill="#f1f5f9" />
        <text x="55" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">📥 Import CSV</text>
        
        <rect x="120" y="0" width="110" height="32" rx="8" fill="#4f46e5" />
        <text x="175" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">+ Add Staff</text>
      </g>

      <!-- Staff rows -->
      <g transform="translate(24, 80)">
        
        <!-- Staff 1: Prapul Winny -->
        <g transform="translate(0, 0)">
          <rect width="762" height="70" rx="12" fill="#e0e7ff" stroke="#c7d2fe" stroke-width="1" />
          <circle cx="36" cy="35" r="18" fill="#4f46e5" />
          <text x="36" y="39" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">PW</text>
          
          <text x="68" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#1e1b4b">Prapul Winny</text>
          <text x="68" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#4f46e5">Target: $1,250.00 • Status: Fully Paid</text>
          
          <!-- Notes Tokens -->
          <g transform="translate(320, 20)">
            <rect x="0" y="0" width="80" height="30" rx="6" fill="#10b981" />
            <text x="40" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">$100 x 10</text>
            
            <rect x="90" y="0" width="80" height="30" rx="6" fill="#10b981" />
            <text x="130" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">$50 x 3</text>
            
            <rect x="180" y="0" width="80" height="30" rx="6" fill="#10b981" />
            <text x="220" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">$20 x 4</text>
            
            <rect x="270" y="0" width="80" height="30" rx="6" fill="#10b981" />
            <text x="310" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">$10 x 2</text>
          </g>
          
          <text x="738" y="40" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#4f46e5">Adjust</text>
        </g>

        <!-- Staff 2: Jane Doe -->
        <g transform="translate(0, 84)">
          <rect width="762" height="70" rx="12" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1" />
          <circle cx="36" cy="35" r="18" fill="#0d9488" />
          <text x="36" y="39" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">JD</text>
          
          <text x="68" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">Jane Doe</text>
          <text x="68" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Target: $880.00 • Status: Fully Paid</text>
          
          <!-- Notes Tokens -->
          <g transform="translate(320, 20)">
            <rect x="0" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="40" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$100 x 7</text>
            
            <rect x="90" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="130" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$50 x 2</text>
            
            <rect x="180" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="220" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$20 x 4</text>
          </g>
          
          <text x="738" y="40" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#64748b">Adjust</text>
        </g>

        <!-- Staff 3: John Smith -->
        <g transform="translate(0, 168)">
          <rect width="762" height="70" rx="12" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1" />
          <circle cx="36" cy="35" r="18" fill="#e11d48" />
          <text x="36" y="39" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">JS</text>
          
          <text x="68" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">John Smith</text>
          <text x="68" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Target: $450.00 • Status: Fully Paid</text>
          
          <!-- Notes Tokens -->
          <g transform="translate(320, 20)">
            <rect x="0" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="40" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$100 x 3</text>
            
            <rect x="90" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="130" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$50 x 2</text>
            
            <rect x="180" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="220" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$20 x 2</text>
            
            <rect x="270" y="0" width="80" height="30" rx="6" fill="#34d399" opacity="0.8" />
            <text x="310" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#065f46" text-anchor="middle">$10 x 1</text>
          </g>
          
          <text x="738" y="40" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#64748b">Adjust</text>
        </g>
      </g>

      <!-- Bottom Summary Stats -->
      <g transform="translate(24, 390)">
        <text x="0" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#475569">💡 PWA Tip: Pin application to desktop or mobile screen for offline access and local backups.</text>
      </g>
    </g>
  </g>
</svg>
  `;

  // SVG representation of a high-fidelity mobile app screenshot
  const mobileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1334" width="750" height="1334">
  <!-- Soft grey background with warm vignette -->
  <rect width="750" height="1334" fill="#f8fafc" />
  
  <!-- Subtle background glowing mesh gradients -->
  <circle cx="375" cy="200" r="300" fill="#e0e7ff" opacity="0.5" filter="blur(60px)" />
  <circle cx="375" cy="1100" r="300" fill="#ecfdf5" opacity="0.5" filter="blur(60px)" />

  <!-- Mock Mobile Top Status Bar -->
  <rect x="0" y="0" width="750" height="50" fill="#ffffff" />
  <!-- Time -->
  <text x="60" y="32" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#0f172a">9:41</text>
  <!-- Icons -->
  <g transform="translate(640, 18)" fill="#0f172a">
    <rect x="0" y="4" width="18" height="10" rx="2" fill="none" stroke="#0f172a" stroke-width="2" />
    <rect x="3" y="7" width="10" height="4" fill="#0f172a" />
    <path d="M -8,12 L -8,0 M -4,12 L -4,4 M 0,12 L 0,8" stroke="#0f172a" stroke-width="2" />
  </g>

  <!-- Navigation / Title Header -->
  <rect x="0" y="50" width="750" height="80" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))" />
  <g transform="translate(32, 75)">
    <rect x="0" y="0" width="30" height="30" rx="8" fill="#4f46e5" />
    <path d="M 8,15 L 15,8 L 22,15 L 15,22 Z" fill="#ffffff" />
    <text x="44" y="21" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="#0f172a">Cash Payout Calc</text>
  </g>

  <!-- Metric Overview Cards -->
  <g transform="translate(32, 160)">
    
    <!-- Target Payout Total -->
    <g transform="translate(0, 0)">
      <rect width="326" height="110" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="20" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">TARGET TOTAL</text>
      <text x="20" y="76" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#0f172a">$4,850.00</text>
    </g>

    <!-- Allocated Cash -->
    <g transform="translate(360, 0)">
      <rect width="326" height="110" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="20" y="36" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">ALLOCATED</text>
      <text x="20" y="76" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#10b981">$4,850.00</text>
    </g>
    
  </g>

  <!-- PWA Equivalent Banner -->
  <g transform="translate(32, 296)">
    <rect width="686" height="80" rx="16" fill="#e0e7ff" stroke="#c7d2fe" stroke-width="1.5" />
    <text x="24" y="32" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#312e81">Equivalent Division Activated</text>
    <text x="24" y="54" font-family="system-ui, sans-serif" font-size="11" fill="#4338ca">Ensures every staff gets similar paper bill distributions.</text>
  </g>

  <!-- Cash Drawer list mockup -->
  <g transform="translate(32, 400)">
    <rect width="686" height="240" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <text x="24" y="36" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#0f172a">Cash Drawer Stock</text>
    <text x="24" y="56" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Adjust note limits in vault</text>

    <g transform="translate(24, 80)">
      <!-- Row $100 -->
      <g transform="translate(0, 0)">
        <rect width="638" height="42" rx="10" fill="#f8fafc" />
        <text x="16" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">$100 bills</text>
        <text x="540" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#4f46e5">x 25</text>
      </g>
      <!-- Row $50 -->
      <g transform="translate(0, 52)">
        <rect width="638" height="42" rx="10" fill="#f8fafc" />
        <text x="16" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">$50 bills</text>
        <text x="540" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#4f46e5">x 40</text>
      </g>
      <!-- Row $20 -->
      <g transform="translate(0, 104)">
        <rect width="638" height="42" rx="10" fill="#f8fafc" />
        <text x="16" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">$20 bills</text>
        <text x="540" y="25" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#4f46e5">x 50</text>
      </g>
    </g>
  </g>

  <!-- Staff Breakdown list on Mobile -->
  <g transform="translate(32, 665)">
    <rect width="686" height="520" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <text x="24" y="36" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#0f172a">Staff Payouts</text>
    
    <!-- Row 1: Prapul Winny -->
    <g transform="translate(24, 60)">
      <rect width="638" height="110" rx="14" fill="#e0e7ff" stroke="#c7d2fe" stroke-width="1" />
      <circle cx="36" cy="36" r="16" fill="#4f46e5" />
      <text x="36" y="40" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">PW</text>
      <text x="68" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#1e1b4b">Prapul Winny</text>
      <text x="68" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#4f46e5">Target: $1,250.00 • Paid: $1,250</text>
      
      <!-- Tokens -->
      <g transform="translate(24, 66)">
        <rect x="0" y="0" width="70" height="26" rx="6" fill="#10b981" />
        <text x="35" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">$100x10</text>
        <rect x="76" y="0" width="70" height="26" rx="6" fill="#10b981" />
        <text x="111" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">$50x3</text>
        <rect x="152" y="0" width="70" height="26" rx="6" fill="#10b981" />
        <text x="187" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">$20x4</text>
        <rect x="228" y="0" width="70" height="26" rx="6" fill="#10b981" />
        <text x="263" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">$10x2</text>
      </g>
    </g>

    <!-- Row 2: Jane Doe -->
    <g transform="translate(24, 185)">
      <rect width="638" height="110" rx="14" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1" />
      <circle cx="36" cy="36" r="16" fill="#0d9488" />
      <text x="36" y="40" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">JD</text>
      <text x="68" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">Jane Doe</text>
      <text x="68" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Target: $880.00 • Paid: $880</text>
      
      <!-- Tokens -->
      <g transform="translate(24, 66)">
        <rect x="0" y="0" width="70" height="26" rx="6" fill="#34d399" opacity="0.8" />
        <text x="35" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">$100x7</text>
        <rect x="76" y="0" width="70" height="26" rx="6" fill="#34d399" opacity="0.8" />
        <text x="111" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">$50x2</text>
        <rect x="152" y="0" width="70" height="26" rx="6" fill="#34d399" opacity="0.8" />
        <text x="187" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">$20x4</text>
      </g>
    </g>

    <!-- Row 3: John Smith -->
    <g transform="translate(24, 310)">
      <rect width="638" height="110" rx="14" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1" />
      <circle cx="36" cy="36" r="16" fill="#e11d48" />
      <text x="36" y="40" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">JS</text>
      <text x="68" y="32" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#334155">John Smith</text>
      <text x="68" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Target: $450.00 • Paid: $450</text>
      
      <!-- Tokens -->
      <g transform="translate(24, 66)">
        <rect x="0" y="0" width="70" height="26" rx="6" fill="#34d399" opacity="0.8" />
        <text x="35" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">$100x3</text>
        <rect x="76" y="0" width="70" height="26" rx="6" fill="#34d399" opacity="0.8" />
        <text x="111" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">$50x2</text>
        <rect x="152" y="0" width="70" height="26" rx="6" fill="#34d399" opacity="0.8" />
        <text x="187" y="17" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#065f46" text-anchor="middle">$20x2</text>
      </g>
    </g>

    <!-- PWA CTA -->
    <text x="343" y="475" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#4f46e5" text-anchor="middle">Click "Add to Home Screen" to enable Offline Mode</text>
  </g>
</svg>
  `;

  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'screenshot-desktop.png'));
  console.log('Created screenshot-desktop.png');

  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'screenshot-mobile.png'));
  console.log('Created screenshot-mobile.png');
}

async function main() {
  try {
    await generatePngIcons();
    await generateScreenshots();
    console.log('✅ All PWA icons and high-fidelity screenshots generated successfully!');
  } catch (err) {
    console.error('❌ Error during generation:', err);
    process.exit(1);
  }
}

main();
