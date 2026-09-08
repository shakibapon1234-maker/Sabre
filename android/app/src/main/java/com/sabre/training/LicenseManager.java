package com.sabre.training;

import android.content.Context;
import android.content.SharedPreferences;
import android.provider.Settings;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Offline, device-locked license manager for Sabre Training Simulator.
 *
 * Mirrors the pattern used by the companion Amaduce (Amadeus) trainer's
 * LicenseManager, with product-specific values swapped so the two apps'
 * keys and stored preferences never collide or interoperate:
 *   - key prefix:      SBR- (was AMT-)
 *   - MASTER_SECRET:   unique to this product
 *   - prefs file name: sbt_lic (was amt_lic)
 *
 * License key format: SBR-AAAA-BBBB-CCCC
 *   AAAA, BBBB — random group chars from ALPHABET (assigned by the admin
 *                 generator, opaque here)
 *   CCCC        — checksum = first 4 hex chars of
 *                 SHA-256(MASTER_SECRET + "AAAA" + "BBBB"), uppercased.
 *                 Must be produced by the matching Admin License Generator
 *                 (same MASTER_SECRET) or validation fails as INVALID_KEY.
 *
 * Device lock: on activation we hash this device's ANDROID_ID together with
 * MASTER_SECRET and store only the hash — never the raw device ID — so a
 * key activated on one device reads WRONG_DEVICE on any other.
 *
 * Tamper detection: every stored field is folded into one more SHA-256
 * hash (sbt_lic_tamper) at activation time. If anything in SharedPreferences
 * is edited outside this class (e.g. a rooted-device prefs edit trying to
 * push the expiry date back), the recomputed hash won't match and the
 * license reads TAMPERED rather than silently accepting the edit.
 */
public class LicenseManager {

    // NOTE: intentionally distinct from the Amaduce trainer's secret —
    // sharing one MASTER_SECRET across products would let a key generator
    // leaked/cracked for one app forge keys for the other.
    private static final String MASTER_SECRET = "SBR-TRAIN-9f2b7c14-e6a0-4d3b-Wings-Fly-Aviation-2026";

    private static final String PREFS_NAME = "sbt_lic";
    private static final String KEY_LICENSE = "sbt_lic_key";
    private static final String KEY_DEVICE_HASH = "sbt_lic_device";
    private static final String KEY_ACTIVATED_AT = "sbt_lic_activated";
    private static final String KEY_EXPIRES_AT = "sbt_lic_expires";
    private static final String KEY_TAMPER_HASH = "sbt_lic_tamper";

    private static final long VALIDITY_MS = 730L * 24 * 60 * 60 * 1000; // 730 days

    private static final Pattern KEY_PATTERN =
            Pattern.compile("^SBR-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$");

    public enum State {
        NOT_ACTIVATED,
        ACTIVE,
        EXPIRED,
        WRONG_DEVICE,
        TAMPERED,
        INVALID_KEY
    }

    public static class Result {
        public final State state;
        public final long expiresAt; // 0 if unknown/not activated

        Result(State state, long expiresAt) {
            this.state = state;
            this.expiresAt = expiresAt;
        }
    }

    private final Context context;

    public LicenseManager(Context context) {
        this.context = context.getApplicationContext();
    }

    private SharedPreferences prefs() {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /** Current device fingerprint, hashed — never expose the raw ANDROID_ID. */
    private String currentDeviceHash() {
        String androidId = Settings.Secure.getString(
                context.getContentResolver(), Settings.Secure.ANDROID_ID);
        if (androidId == null) androidId = "unknown-device";
        return sha256(androidId + MASTER_SECRET);
    }

    /** Validates key format + checksum only. Does not touch storage. */
    public boolean isKeyFormatValid(String rawKey) {
        if (rawKey == null) return false;
        String key = rawKey.trim().toUpperCase(Locale.US);
        java.util.regex.Matcher m = KEY_PATTERN.matcher(key);
        if (!m.matches()) return false;

        String groupA = m.group(1);
        String groupB = m.group(2);
        String checksum = m.group(3);
        String expected = sha256(MASTER_SECRET + groupA + groupB)
                .substring(0, 4).toUpperCase(Locale.US);
        return checksum.equals(expected);
    }

    /**
     * Activates a license key on this device. Call only after
     * isKeyFormatValid() returns true. Overwrites any existing activation.
     */
    public Result activate(String rawKey) {
        String key = rawKey.trim().toUpperCase(Locale.US);
        if (!isKeyFormatValid(key)) {
            return new Result(State.INVALID_KEY, 0);
        }

        long now = System.currentTimeMillis();
        long expires = now + VALIDITY_MS;
        String deviceHash = currentDeviceHash();
        String tamperHash = computeTamperHash(key, deviceHash, now, expires);

        SharedPreferences.Editor editor = prefs().edit();
        editor.putString(KEY_LICENSE, key);
        editor.putString(KEY_DEVICE_HASH, deviceHash);
        editor.putLong(KEY_ACTIVATED_AT, now);
        editor.putLong(KEY_EXPIRES_AT, expires);
        editor.putString(KEY_TAMPER_HASH, tamperHash);
        editor.apply();

        return new Result(State.ACTIVE, expires);
    }

    /** Checks the currently stored license (if any) and returns its state. */
    public Result checkLicense() {
        SharedPreferences p = prefs();
        String storedKey = p.getString(KEY_LICENSE, null);
        if (storedKey == null) {
            return new Result(State.NOT_ACTIVATED, 0);
        }

        String storedDeviceHash = p.getString(KEY_DEVICE_HASH, "");
        long activatedAt = p.getLong(KEY_ACTIVATED_AT, 0);
        long expiresAt = p.getLong(KEY_EXPIRES_AT, 0);
        String storedTamperHash = p.getString(KEY_TAMPER_HASH, "");

        // 1. Tamper check first — if the stored fields were edited directly,
        //    nothing else below can be trusted.
        String recomputedTamperHash =
                computeTamperHash(storedKey, storedDeviceHash, activatedAt, expiresAt);
        if (!recomputedTamperHash.equals(storedTamperHash)) {
            return new Result(State.TAMPERED, expiresAt);
        }

        // 2. Key itself must still check out against MASTER_SECRET.
        if (!isKeyFormatValid(storedKey)) {
            return new Result(State.INVALID_KEY, expiresAt);
        }

        // 3. Device lock.
        if (!storedDeviceHash.equals(currentDeviceHash())) {
            return new Result(State.WRONG_DEVICE, expiresAt);
        }

        // 4. Expiry.
        if (System.currentTimeMillis() > expiresAt) {
            return new Result(State.EXPIRED, expiresAt);
        }

        return new Result(State.ACTIVE, expiresAt);
    }

    /** Clears any stored activation (used for "deactivate" / support resets). */
    public void clear() {
        prefs().edit().clear().apply();
    }

    private String computeTamperHash(String key, String deviceHash, long activatedAt, long expiresAt) {
        return sha256(key + "|" + deviceHash + "|" + activatedAt + "|" + expiresAt + "|" + MASTER_SECRET);
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed present on Android; this is unreachable.
            throw new RuntimeException(e);
        }
    }
}
