package com.minecraftauth.utils;

import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.geysermc.floodgate.api.FloodgateApi;

import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Floodgate integration for Bedrock Edition players.
 * Provides PIN-based registration instead of clickable links.
 */
public class FloodgateSupport {
    
    private static final Map<String, PINSession> activePINs = new ConcurrentHashMap<>();
    private static final SecureRandom random = new SecureRandom();
    private static final long PIN_EXPIRY_MS = 600000; // 10 minutes
    private static FloodgateApi floodgateApi;
    
    /**
     * Initialize Floodgate API
     */
    public static void initialize() {
        if (Bukkit.getPluginManager().getPlugin("floodgate") != null) {
            try {
                floodgateApi = FloodgateApi.getInstance();
                Bukkit.getLogger().info("[FloodgateSupport] Floodgate integration enabled");
            } catch (Exception e) {
                Bukkit.getLogger().warning("[FloodgateSupport] Floodgate plugin found but API unavailable: " + e.getMessage());
            }
        } else {
            Bukkit.getLogger().info("[FloodgateSupport] Floodgate not detected - Bedrock PIN login disabled");
        }
    }
    
    /**
     * Check if Floodgate is available
     */
    public static boolean isAvailable() {
        return floodgateApi != null;
    }
    
    /**
     * Check if a player is a Bedrock player (via Floodgate)
     */
    public static boolean isBedrockPlayer(Player player) {
        if (!isAvailable()) {
            return false;
        }
        
        try {
            return floodgateApi.isFloodgatePlayer(player.getUniqueId());
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Check if a UUID is a Bedrock player
     */
    public static boolean isBedrockPlayer(UUID uuid) {
        if (!isAvailable()) {
            return false;
        }
        
        try {
            return floodgateApi.isFloodgatePlayer(uuid);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Generate a 6-digit PIN for Bedrock registration
     */
    public static String generatePIN() {
        int pin = 100000 + random.nextInt(900000);
        return String.valueOf(pin);
    }
    
    /**
     * Create a PIN session for a Bedrock player
     */
    public static String createPINSession(String username, UUID playerId) {
        String pin = generatePIN();
        PINSession session = new PINSession(username, playerId, pin);
        activePINs.put(pin, session);
        
        // Clean expired PINs
        cleanExpiredPINs();
        
        Bukkit.getLogger().info("[FloodgateSupport] Generated PIN " + pin + " for Bedrock player: " + username);
        return pin;
    }
    
    /**
     * Verify a PIN and return the associated username
     */
    public static String verifyPIN(String pin) {
        PINSession session = activePINs.get(pin);
        
        if (session == null) {
            return null;
        }
        
        if (session.isExpired()) {
            activePINs.remove(pin);
            return null;
        }
        
        return session.getUsername();
    }
    
    /**
     * Consume a PIN (remove after successful use)
     */
    public static boolean consumePIN(String pin, String username) {
        PINSession session = activePINs.get(pin);
        
        if (session == null || session.isExpired()) {
            activePINs.remove(pin);
            return false;
        }
        
        if (!session.getUsername().equalsIgnoreCase(username)) {
            return false;
        }
        
        activePINs.remove(pin);
        Bukkit.getLogger().info("[FloodgateSupport] PIN " + pin + " consumed by " + username);
        return true;
    }
    
    /**
     * Check if a PIN exists and is valid
     */
    public static boolean isPINValid(String pin) {
        PINSession session = activePINs.get(pin);
        return session != null && !session.isExpired();
    }
    
    /**
     * Clean expired PINs from memory
     */
    private static void cleanExpiredPINs() {
        activePINs.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
    
    /**
     * Get Bedrock player's Java username (without prefix)
     */
    public static String getJavaUsername(Player player) {
        if (!isAvailable() || !isBedrockPlayer(player)) {
            return player.getName();
        }
        
        try {
            return floodgateApi.getPlayer(player.getUniqueId()).getJavaUsername();
        } catch (Exception e) {
            return player.getName();
        }
    }
    
    /**
     * Inner class representing a PIN session
     */
    private static class PINSession {
        private final String username;
        private final UUID playerId;
        private final String pin;
        private final long createdAt;
        
        public PINSession(String username, UUID playerId, String pin) {
            this.username = username;
            this.playerId = playerId;
            this.pin = pin;
            this.createdAt = System.currentTimeMillis();
        }
        
        public String getUsername() {
            return username;
        }
        
        public boolean isExpired() {
            return (System.currentTimeMillis() - createdAt) > PIN_EXPIRY_MS;
        }
    }
}
