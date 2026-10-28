export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UPGRADE_REQUIRED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  // Codes propres à l'app, jamais renvoyés par le serveur
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CONFIG_ERROR';

export const MESSAGES = {
  network: 'Pas de connexion. Votre saisie est conservée, réessayez une fois connecté.',
  timeout: 'Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.',
  unexpected: 'Réponse inattendue du serveur.',
  insecureUrl: 'Configuration invalide : l’adresse de l’API doit être en HTTPS.',
  sessionExpired: 'Votre session a expiré. Reconnectez-vous.',
} as const;

/** Erreur typée : `message` est en français et s'affiche tel quel. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static network() {
    return new ApiError(0, 'NETWORK_ERROR', MESSAGES.network);
  }

  static timeout() {
    return new ApiError(0, 'TIMEOUT', MESSAGES.timeout);
  }

  static unexpected(status = 500) {
    return new ApiError(status, 'INTERNAL_ERROR', MESSAGES.unexpected);
  }

  /** Construit l'erreur depuis l'enveloppe `{ error: { code, message, fields } }`. */
  static from(status: number, body: unknown): ApiError {
    const e = (body as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null)?.error;
    if (!e?.code || !e.message) return ApiError.unexpected(status);
    return new ApiError(status, e.code as ApiErrorCode, e.message, e.fields);
  }

  /** Erreur de transport (réseau, délai) : la requête peut être rejouée à l'identique. */
  get isTransient() {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT' || this.status >= 500;
  }
}
