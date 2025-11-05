package com.minecraftauth.utils;

import org.bukkit.entity.Player;
import org.geysermc.floodgate.api.FloodgateApi;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * Utility class for Bedrock player detection and PIN generation
 */
public class BedrockUtils {
    
    private static final SecureRandom RANDOM = new SecureRandom();
    
    /**
     * Check if a player is connecting from Bedrock Edition using Floodgate
     * 
     * @param player The player to check
     * @return true if the player is a Bedrock player, false otherwise
     */
    public static boolean isBedrock(Player player) {
        try {
            return FloodgateApi.getInstance().isFloodgatePlayer(player.getUniqueId());
        } catch (Exception e) {
            // Floodgate might not be installed or enabled
            return false;
        }
    }
    
    /**
     * Check if a UUID belongs to a Bedrock player
     * 
     * @param uuid The UUID to check
     * @return true if the UUID is from a Bedrock player, false otherwise
     */
    public static boolean isBedrock(UUID uuid) {
        try {
            return FloodgateApi.getInstance().isFloodgatePlayer(uuid);
        } catch (Exception e) {
            // Floodgate might not be installed or enabled
            return false;
        }
    }
    
    /**
     * Generate a secure 6-digit numerical PIN
     * 
     * @return A 6-digit PIN as a String (e.g., "142859")
     */
    public static String generatePIN() {
        // Generate a random number between 100000 and 999999 (inclusive)
        int pin = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(pin);
    }
    
    /**
     * Validate that a PIN is exactly 6 digits
     * 
     * @param pin The PIN to validate
     * @return true if the PIN is valid (6 digits), false otherwise
     */
    public static boolean isValidPIN(String pin) {
        if (pin == null || pin.length() != 6) {
            return false;
        }
        
        // Check if all characters are digits
        for (char c : pin.toCharArray()) {
            if (!Character.isDigit(c)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get the Bedrock username (without the prefix)
     * 
     * @param player The Bedrock player
     * @return The username without the Floodgate prefix, or the normal username if not a Bedrock player
     */
    public static String getBedrockUsername(Player player) {
        if (isBedrock(player)) {
            try {
                return FloodgateApi.getInstance().getPlayer(player.getUniqueId()).getUsername();
            } catch (Exception e) {
                return player.getName();
            }
        }
        return player.getName();
    }
}
