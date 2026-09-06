// Run on the VPS only after its local snapshot is ready. Other API routes stay intact.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const health = await fetch('http://127.0.0.1:3000/healthz').then(r => r.json());
if (!health.bouquetReady) throw new Error('Refusing to switch route before first complete snapshot');
const config = '/etc/nginx/sites-available/vetka';
const original = readFileSync(config, 'utf8');
if (original.includes('location = /api/bouquet-day')) {
    console.log('Local bouquet route already configured');
    process.exit(0);
}
if (!original.includes('    location /api/ {')) throw new Error('Unknown nginx layout');
const updated = original.replace('    location /api/ {', `    location = /api/bouquet-day {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {`);
copyFileSync(config, `/etc/nginx/vetka.before-local-bouquet-${Date.now()}`);
try {
    writeFileSync(config, updated);
    execFileSync('nginx', ['-t'], { stdio: 'inherit' });
    execFileSync('systemctl', ['reload', 'nginx'], { stdio: 'inherit' });
} catch (error) {
    writeFileSync(config, original);
    execFileSync('nginx', ['-t'], { stdio: 'inherit' });
    execFileSync('systemctl', ['reload', 'nginx'], { stdio: 'inherit' });
    throw error;
}
console.log('Local bouquet snapshot route enabled');
