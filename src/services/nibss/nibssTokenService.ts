import axios from "axios";
import { env } from "../../config/env";

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface TokenState {
  token: string;
  expiresAt: number;
}

class NibssTokenService {
  private state: TokenState | null = null;
  private refreshPromise: Promise<string> | null = null;

  async getToken(): Promise<string> {
    if (this.state && Date.now() < this.state.expiresAt - REFRESH_BUFFER_MS) {
      return this.state.token;
    }
    // Deduplicate concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.fetchToken().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async fetchToken(): Promise<string> {
    const res = await axios.post<{ token: string }>(
      `${env.NIBSS_BASE_URL}/api/auth/token`,
      {
        apiKey: env.NIBSS_API_KEY,
        apiSecret: env.NIBSS_API_SECRET,
      },
      { timeout: 60000 },
    );
    const token = res.data.token;
    // NIBSS tokens are valid for 1 hour (3600 s)
    this.state = { token, expiresAt: Date.now() + 3600 * 1000 };
    return token;
  }

  /**
   * Attempt to pre-warm the token at startup.
   * Non-fatal: if NIBSS is cold-starting the server will still come up
   * and the token will be fetched lazily on the first real request.
   */
  async init(): Promise<void> {
    try {
      await this.getToken();
      console.log("NIBSS token acquired");
    } catch (err) {
      console.warn("NIBSS token pre-warm failed (server may be cold-starting). " + "Token will be fetched on first request.", (err as Error).message);
    }
  }
}

export const nibssTokenService = new NibssTokenService();
