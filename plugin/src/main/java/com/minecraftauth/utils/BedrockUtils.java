package com.minecraftauth.utils;

import org.bukkit.entity.Player;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * Utility class for Bedrock player detection and PIN generation
 * Note: Floodgate detection disabled - install Floodgate plugin separately if needed
 */
public class BedrockUtils {
    
    private static final SecureRandom RANDOM = new SecureRandom();
    
    /**
     * Check if a player is connecting from Bedrock Edition using Floodgate
     * Currently disabled - returns false. Install Floodgate for Bedrock support.
     * 
     * @param player The player to check
     * @return false (Floodgate integration disabled)
     */
    public static boolean isBedrock(Player player) {
        // Floodgate integration disabled to avoid dependency issues
        // Install Floodgate plugin separately on your server for Bedrock support
        return false;
    }
    
    /**
     * Check if a UUID belongs to a Bedrock player
     * Currently disabled - returns false. Install Floodgate for Bedrock support.
     * 
     * @param uuid The UUID to check
     * @return false (Floodgate integration disabled)
     */
    public static boolean isBedrock(UUID uuid) {
        // Floodgate integration disabled to avoid dependency issues
        // Install Floodgate plugin separately on your server for Bedrock support
        return false;
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
        // Floodgate integration disabled - return normal username
        // Install Floodgate plugin separately for Bedrock username support
        return player.getName();
    }
}
