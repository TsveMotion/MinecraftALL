package uk.co.tsvweb.minecraftroles.api;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;
import uk.co.tsvweb.minecraftroles.models.PlayerRole;
import uk.co.tsvweb.minecraftroles.models.MuteStatus;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class WebAPIClient {
    private final MinecraftRoles plugin;
    private final Gson gson;
    private final Map<String, CachedData<PlayerRole>> roleCache;
    private final Map<String, CachedData<MuteStatus>> muteCache;

    public WebAPIClient(MinecraftRoles plugin) {
        this.plugin = plugin;
        this.gson = new Gson();
        this.roleCache = new HashMap<>();
        this.muteCache = new HashMap<>();
    }

    public CompletableFuture<PlayerRole> getPlayerRole(String username) {
        return CompletableFuture.supplyAsync(() -> {
            // Check cache first
            CachedData<PlayerRole> cached = roleCache.get(username);
            if (cached != null && !cached.isExpired()) {
                return cached.getData();
            }

            try {
                String apiUrl = plugin.getPluginConfig().getApiBaseUrl() + "/api/plugin/roles/" + username;
                String signature = generateSignature(username);

                URL url = new URL(apiUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("X-MC-SIGN", signature);
                conn.setRequestProperty("Content-Type", "application/json");

                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    JsonObject json = gson.fromJson(response.toString(), JsonObject.class);
                    PlayerRole playerRole = parsePlayerRole(json);

                    // Cache the result
                    roleCache.put(username, new CachedData<>(playerRole, plugin.getPluginConfig().getCacheSeconds()));

                    return playerRole;
                }
            } catch (Exception e) {
                plugin.getPlugin().getLogger().warning("Failed to fetch role for " + username + ": " + e.getMessage());
            }

            return null;
        });
    }

    public CompletableFuture<MuteStatus> getMuteStatus(String username) {
        return CompletableFuture.supplyAsync(() -> {
            // Check cache first
            CachedData<MuteStatus> cached = muteCache.get(username);
            if (cached != null && !cached.isExpired()) {
                return cached.getData();
            }

            try {
                String apiUrl = plugin.getPluginConfig().getApiBaseUrl() + "/api/plugin/mute/" + username;
                String signature = generateSignature(username);

                URL url = new URL(apiUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("X-MC-SIGN", signature);
                conn.setRequestProperty("Content-Type", "application/json");

                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    JsonObject json = gson.fromJson(response.toString(), JsonObject.class);
                    MuteStatus muteStatus = parseMuteStatus(json);

                    // Cache the result
                    muteCache.put(username, new CachedData<>(muteStatus, 10)); // Cache mutes for 10 seconds

                    return muteStatus;
                }
            } catch (Exception e) {
                plugin.getPlugin().getLogger().warning("Failed to fetch mute status for " + username + ": " + e.getMessage());
            }

            return new MuteStatus(false, null, null);
        });
    }

    public CompletableFuture<Boolean> submitReport(String reporter, String target, String reason) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String apiUrl = plugin.getPluginConfig().getApiBaseUrl() + "/api/plugin/report";

                JsonObject payload = new JsonObject();
                payload.addProperty("reporter", reporter);
                payload.addProperty("target", target);
                payload.addProperty("reason", reason);
                payload.addProperty("server", "Minecraft");

                String payloadString = gson.toJson(payload);
                String signature = generateSignature(payloadString);

                URL url = new URL(apiUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("X-MC-SIGN", signature);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = payloadString.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                return responseCode == 200;
            } catch (Exception e) {
                plugin.getPlugin().getLogger().warning("Failed to submit report: " + e.getMessage());
                return false;
            }
        });
    }

    private String generateSignature(String data) {
        try {
            String secret = plugin.getPluginConfig().getApiKey();
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            plugin.getPlugin().getLogger().severe("Failed to generate HMAC signature: " + e.getMessage());
            return "";
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    private PlayerRole parsePlayerRole(JsonObject json) {
        if (json.has("primaryRole") && !json.get("primaryRole").isJsonNull()) {
            JsonObject roleObj = json.getAsJsonObject("primaryRole");
            String symbol = roleObj.get("symbol").getAsString();
            String colorHex = roleObj.get("colorHex").getAsString();
            boolean isAdmin = roleObj.get("isAdmin").getAsBoolean();
            return new PlayerRole(symbol, colorHex, isAdmin);
        }
        return null;
    }

    private MuteStatus parseMuteStatus(JsonObject json) {
        boolean muted = json.get("muted").getAsBoolean();
        String endsAt = json.has("endsAt") && !json.get("endsAt").isJsonNull() ? json.get("endsAt").getAsString() : null;
        String reason = json.has("reason") && !json.get("reason").isJsonNull() ? json.get("reason").getAsString() : null;
        return new MuteStatus(muted, endsAt, reason);
    }

    public void clearCache(String username) {
        roleCache.remove(username);
        muteCache.remove(username);
    }

    private static class CachedData<T> {
        private final T data;
        private final long expiryTime;

        public CachedData(T data, int cacheSeconds) {
            this.data = data;
            this.expiryTime = System.currentTimeMillis() + (cacheSeconds * 1000L);
        }

        public T getData() {
            return data;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }
}
