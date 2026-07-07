import fs from 'fs';

const content = fs.readFileSync('src/lib/components/VerifierView.svelte', 'utf8');
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.log('FAIL: No script tag found'); process.exit(1); }
const script = scriptMatch[1];

console.log('Script section extracted, length:', script.length, 'chars');

const checks = {
  'importSPKI import': script.includes('importSPKI'),
  '_issuerPublicKeyPem check': script.includes('_issuerPublicKeyPem'),
  'verifySDJWT(data.sdjwt, publicKey)': script.includes('verifySDJWT(data.sdjwt, publicKey)'),
  'fallback to getIssuerKeyPair': script.includes('getIssuerKeyPair'),
  "jose dynamic import": script.includes("import('jose')"),
  "sdjwt dynamic import": script.includes("import('$lib/crypto/sdjwt.js')"),
};

let allPass = true;
for (const [name, passed] of Object.entries(checks)) {
  console.log(passed ? '✅' : '❌', name);
  if (!passed) allPass = false;
}

console.log('\n' + (allPass ? '✅ All checks passed!' : '❌ Some checks failed!'));
console.log('\n--- VerifierView.svelte script section ---');
console.log(script);
