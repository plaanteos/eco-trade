// ============================================================
//  EcoTrade — Alchemy Account Abstraction Config
// ============================================================
// Integra Alchemy Account Kit con Supabase Auth.
// La autenticación social (Google OAuth) se delega a Supabase;
// la wallet Solana se deriva determinísticamente del UID del usuario.

export interface AlchemyConfig {
  /** API Key de Alchemy (VITE_ALCHEMY_API_KEY) */
  apiKey: string;
  /** Cluster de Solana: devnet por defecto */
  network: 'solana-devnet' | 'solana-mainnet';
  /** URI de redirección OAuth */
  redirectUri: string;
}

export interface AlchemyClientLike {
  config: AlchemyConfig;
  /** Nombre del proveedor de login social activo */
  oauthProvider: 'google';
}

const apiKey: string =
  (import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined) ?? '';

export const alchemyConfig: AlchemyConfig = {
  apiKey,
  network: 'solana-devnet',
  redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
};

let _client: AlchemyClientLike | null = null;

export function getAlchemyClient(): AlchemyClientLike {
  if (!_client) {
    _client = {
      config: alchemyConfig,
      oauthProvider: 'google',
    };
  }
  return _client;
}

export async function deriveWalletAddress(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`ecotrade:solana:${userId}`);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  return base58Encode(hashArray.slice(0, 32)); // 32 bytes → dirección Solana
}

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';

  while (num > 0n) {
    const remainder = num % 58n;
    num = num / 58n;
    result = BASE58_ALPHABET[Number(remainder)] + result;
  }

  // Añadir '1' por cada byte cero al principio (convención Bitcoin/Solana)
  for (const byte of bytes) {
    if (byte !== 0) break;
    result = '1' + result;
  }

  return result;
}
