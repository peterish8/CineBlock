import { generateKeyPair, exportJWK, exportPKCS8 } from 'jose';

async function main() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const privateKeyPem = await exportPKCS8(privateKey);
  const jwk = await exportJWK(publicKey);
  const jwks = JSON.stringify({ keys: [{ ...jwk, kid: 'default', alg: 'RS256', use: 'sig' }] }, null, 2);

  console.log('--- BEGIN JWT_PRIVATE_KEY ---');
  console.log(privateKeyPem);
  console.log('--- END JWT_PRIVATE_KEY ---');
  console.log('\n--- BEGIN JWKS ---');
  console.log(jwks);
  console.log('--- END JWKS ---');
}

main().catch(console.error);
