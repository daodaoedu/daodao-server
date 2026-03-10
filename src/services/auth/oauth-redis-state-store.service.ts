/**
 * Redis-based OAuth State Store
 * 替換 passport-oauth2 預設的 SessionStateStore
 * 使 OAuth state 驗證不依賴 session cookie，解決 Android CCT 跨進程 session 不連續問題
 *
 * 設計說明：
 * - 當 passport.authenticate() 傳入字串型 state 時，passport-oauth2 會直接將 state 寫進 URL，
 *   完全略過 store()，因此 store() 是 no-op。
 * - verify() 在 callback 時被呼叫，providedState 是 Google 傳回的原始 state 字串（base64url）。
 *   此處解碼 state、取出 nonce，並驗證 nonce 存在於 Redis（由 oauthNonceService 寫入）。
 *   nonce 消耗由 googleCallback controller 的 verifyAndConsumeNonce() 負責，此處只查不刪。
 */
import { decodeOAuthState } from '../../utils/oauth-state';
import { oauthNonceService } from './oauth-nonce.service';
import { loggerService } from '../logging/logger.service';

/**
 * passport-oauth2 StateStore 介面的 Redis 實作
 */
export class RedisOAuthStateStore {
  /**
   * 儲存 OAuth state（passport-oauth2 在發起 OAuth 時呼叫）
   *
   * 注意：當 passport.authenticate() 以字串型 options.state 呼叫時，
   * passport-oauth2 直接將 state 放入 URL 並略過此方法。
   * 因此此方法在目前的架構下永遠不會被呼叫，作為防禦性 no-op 保留。
   */
  store(
    _req: unknown,
    _state: unknown,
    callback: (err: Error | null, handle?: string) => void
  ): void {
    // passport-oauth2 在 options.state 是字串時略過此方法
    // nonce 已由 oauthNonceService.storeNonce() 在 authenticateGoogle 中存入 Redis
    loggerService.debug('RedisStateStore.store - called (no-op: state stored by oauthNonceService)');
    callback(null, undefined);
  }

  /**
   * 驗證 OAuth state（passport-oauth2 在 callback 時呼叫）
   * providedState = Google 傳回的 state 字串（即 base64url 編碼的 OAuthState）
   * 解碼後取出 nonce，確認 nonce 存在於 Redis（只查不刪，刪除由 controller 負責）
   */
  verify(
    _req: unknown,
    providedState: string,
    _state: unknown,
    callback: (err: Error | null, ok: boolean, stateValue?: string) => void
  ): void {
    // 解碼 state 字串
    const oauthState = decodeOAuthState(providedState);
    if (!oauthState) {
      loggerService.warn('RedisStateStore.verify - failed to decode state', {
        statePrefix: providedState.substring(0, 20) + '...'
      });
      callback(null, false);
      return;
    }

    // 驗證 nonce 存在於 Redis（只查不刪）
    oauthNonceService.nonceExists(oauthState.nonce)
      .then((exists) => {
        if (!exists) {
          loggerService.warn('RedisStateStore.verify - nonce not found in Redis', {
            noncePrefix: oauthState.nonce.substring(0, 8) + '...',
            source: oauthState.source
          });
          callback(null, false);
          return;
        }

        loggerService.info('RedisStateStore.verify - nonce validated successfully', {
          noncePrefix: oauthState.nonce.substring(0, 8) + '...',
          source: oauthState.source
        });
        // 將原始 state 字串傳回，讓 passport 可在 req.query.state 驗證之外繼續流程
        callback(null, true, providedState);
      })
      .catch((err: Error) => {
        loggerService.error('RedisStateStore.verify - Redis error', { error: err.message });
        callback(err, false);
      });
  }
}

export const redisOAuthStateStore = new RedisOAuthStateStore();
export default redisOAuthStateStore;
