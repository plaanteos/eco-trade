// Tipos de datos para EcoTrade

export type MaterialType = 
  | 'Plástico' 
  | 'Vidrio' 
  | 'Papel y cartón' 
  | 'Metal' 
  | 'Electrónicos (RAEE)';

export type SessionStatus = 
  | 'Borrador' 
  | 'Programada' 
  | 'En curso'
  | 'Pendiente de verificación'
  | 'Completada' 
  | 'Cancelada';

export type UserRole = 'Usuario' | 'Operador';

export type TrustLevel = 'Alta' | 'Media' | 'Baja';

export interface TrustSignal {
  id: string;
  label: string;
  passed: boolean;
  critical?: boolean;
}

export interface TrustScore {
  score: number; // 0-100
  level: TrustLevel;
  signals: TrustSignal[];
  requiresReview: boolean;
}

export interface SolanaReceipt {
  signature: string;
  cluster: 'devnet' | 'testnet' | 'mainnet-beta';
  explorerUrl: string;
  emittedAt: Date;
  programId?: string;
}
