/*
  Solana receipt issuer (Memo Program).

  Diseño:
  - La emisión es opcional y se habilita con env vars.
  - Si no está habilitada, este módulo puede devolver null o lanzar un error controlado.
*/

function envBool(name, fallback = false) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return Boolean(fallback);
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function getSolanaCluster() {
  const cluster = String(process.env.SOLANA_CLUSTER || 'devnet');
  return cluster === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
}

function explorerUrlForSignature(signature, cluster) {
  const c = cluster === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=${encodeURIComponent(c)}`;
}

async function issueMemoReceipt({ submissionCode, evidenceHash, trustScore }) {
  if (!envBool('SOLANA_RECEIPTS_ENABLED', false)) {
    const err = new Error('SOLANA_RECEIPTS_ENABLED=false');
    err.code = 'SOLANA_DISABLED';
    throw err;
  }

  const cluster = getSolanaCluster();

  // Lazy require para no romper test/demo si la dependencia no está instalada.
  // eslint-disable-next-line global-require
  const web3 = require('@solana/web3.js');

  const rpcUrl = String(process.env.SOLANA_RPC_URL || '').trim() || web3.clusterApiUrl(cluster);

  const payerSecret = String(process.env.SOLANA_PAYER_SECRET || '').trim();
  if (!payerSecret) {
    const err = new Error('Falta SOLANA_PAYER_SECRET');
    err.code = 'SOLANA_MISSING_SECRET';
    throw err;
  }

  let secretKey;
  try {
    // Acepta JSON array ("[1,2,...]") o base64 de bytes.
    if (payerSecret.startsWith('[')) {
      secretKey = Uint8Array.from(JSON.parse(payerSecret));
    } else {
      secretKey = Uint8Array.from(Buffer.from(payerSecret, 'base64'));
    }
  } catch (e) {
    const err = new Error('SOLANA_PAYER_SECRET inválido (usa JSON array o base64)');
    err.code = 'SOLANA_BAD_SECRET';
    throw err;
  }

  const payer = web3.Keypair.fromSecretKey(secretKey);
  const connection = new web3.Connection(rpcUrl, { commitment: 'confirmed' });

  const memoProgramId = new web3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

  const memo = JSON.stringify({
    t: 'ecotrade-recycling-receipt',
    v: 1,
    submissionCode: String(submissionCode),
    evidenceHash: String(evidenceHash),
    trustScore: Number(trustScore ?? 0) || 0,
    ts: new Date().toISOString(),
  });

  const ix = new web3.TransactionInstruction({
    programId: memoProgramId,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
    data: Buffer.from(memo, 'utf8'),
  });

  const tx = new web3.Transaction().add(ix);

  const signature = await web3.sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: 'confirmed',
  });

  return {
    cluster,
    signature,
    explorerUrl: explorerUrlForSignature(signature, cluster),
    memo,
  };
}

module.exports = {
  issueMemoReceipt,
  getSolanaCluster,
  explorerUrlForSignature,
};
