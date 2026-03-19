/*
  Genera un Keypair de Solana para usar como payer en receipts.

  Uso:
    npm run solana:keygen

  Salida:
  - Public key (para fondear en devnet)
  - SOLANA_PAYER_SECRET en formato JSON array
  - SOLANA_PAYER_SECRET en formato base64

  IMPORTANTE:
  - No comitear el secreto en git.
  - En producción, idealmente usar un secret manager/KMS.
*/

// Lazy require para evitar problemas si el script se invoca sin deps instaladas.
// eslint-disable-next-line global-require
const { Keypair } = require('@solana/web3.js');

function toBase64Secret(secretKeyUint8) {
  return Buffer.from(secretKeyUint8).toString('base64');
}

function main() {
  const kp = Keypair.generate();
  const secretKey = kp.secretKey; // Uint8Array

  const jsonArray = JSON.stringify(Array.from(secretKey));
  const base64 = toBase64Secret(secretKey);

  // Output pensado para copiar/pegar
  // eslint-disable-next-line no-console
  console.log('=== Solana Keypair (payer) ===');
  // eslint-disable-next-line no-console
  console.log('PublicKey:', kp.publicKey.toBase58());
  // eslint-disable-next-line no-console
  console.log('\n# Formato JSON array (recomendado para .env local)');
  // eslint-disable-next-line no-console
  console.log('SOLANA_PAYER_SECRET=' + jsonArray);
  // eslint-disable-next-line no-console
  console.log('\n# Formato base64 (alternativo)');
  // eslint-disable-next-line no-console
  console.log('SOLANA_PAYER_SECRET=' + base64);
  // eslint-disable-next-line no-console
  console.log('\nSugerencia devnet: fondea esta PublicKey con un faucet antes de emitir receipts.');
}

main();
