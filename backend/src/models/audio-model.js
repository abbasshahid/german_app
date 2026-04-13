import { one, run } from "./base-model.js";

export function findAudioAsset(targetType, targetId) {
  return one(
    `
      SELECT *
      FROM audio_assets
      WHERE target_type = @targetType AND target_id = @targetId
      ORDER BY created_at DESC
      LIMIT 1
    `,
    { targetType, targetId }
  );
}

export function createAudioAsset(asset) {
  run(
    `
      INSERT INTO audio_assets (
        id, target_type, target_id, provider, locale, speech_text, audio_url, duration_seconds, created_at
      ) VALUES (
        @id, @target_type, @target_id, @provider, @locale, @speech_text, @audio_url, @duration_seconds, @created_at
      )
    `,
    asset
  );
}
