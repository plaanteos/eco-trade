/**
 * Deriva el `operatorId` (public key) a partir del `SOLANA_PAYER_SECRET`.
 * Ese es el wallet que realmente firma la transacción on-chain (Memo Program).
 */
function deriveDeterministicOperatorId(userId) {
  // `userId` se ignora: se deja como compatibilidad con llamadas existentes.
  const payerSecret = String(process.env.SOLANA_PAYER_SECRET || '').trim();
  if (!payerSecret) return undefined;

  // eslint-disable-next-line global-require
  const web3 = require('@solana/web3.js');

  let secretKey;
  try {
    if (payerSecret.startsWith('[')) {
      secretKey = Uint8Array.from(JSON.parse(payerSecret));
    } else {
      secretKey = Uint8Array.from(Buffer.from(payerSecret, 'base64'));
    }
  } catch (e) {
    return undefined;
  }

  const payer = web3.Keypair.fromSecretKey(secretKey);
  return payer.publicKey.toBase58();
}

module.exports = { deriveDeterministicOperatorId };

