package com.minecraftauth.listeners;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import net.luckperms.api.cacheddata.CachedMetaData;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.RegisteredServiceProvider;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Listener for managing TAB list display with LuckPerms integration and full names
 */
public class TabListListener implements Listener {
    
    private final MinecraftAuthPlugin plugin;
    private LuckPerms luckPerms;
    private final Gson gson;
    private final Map<String, PlayerData> playerDataCache;
    
    private static class PlayerData {
        String fullName;
        Integer yearGroup;
        long cacheTime;
        
        PlayerData(String fullName, Integer yearGroup) {
            this.fullName = fullName;
            this.yearGroup = yearGroup;
            this.cacheTime = System.currentTimeMillis();
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() - cacheTime > 30000; // 30 seconds
        }
    }
    
    public TabListListener(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
        this.luckPerms = getLuckPermsAPI();
        this.gson = new Gson();
        this.playerDataCache = new HashMap<>();
    }
    
    private LuckPerms getLuckPermsAPI() {
        RegisteredServiceProvider<LuckPerms> provider = Bukkit.getServicesManager().getRegistration(LuckPerms.class);
        if (provider != null) {
            return provider.getProvider();
        }
        plugin.getLogger().warning("LuckPerms API not found! TAB list formatting will not work.");
        return null;
    }
    
    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        
        // Update tab list for joining player
        updatePlayerTabList(player);
        
        // Update tab list for all online players (they need to see the new player's formatted name)
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            for (Player onlinePlayer : Bukkit.getOnlinePlayers()) {
                updatePlayerTabList(onlinePlayer);
            }
        }, 10L); // Delay to ensure LuckPerms has loaded user data
    }
    
    /**
     * Updates the TAB list display name for a player based on their LuckPerms group and web API data
     */
    public void updatePlayerTabList(Player player) {
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                // Fetch player data from web API
                PlayerData data = fetchPlayerData(player.getName());
                
                // Build display name on main thread
                Bukkit.getScheduler().runTask(plugin, () -> {
                    try {
                        String displayText = data != null && data.fullName != null ? data.fullName : player.getName();
                        TextColor nameColor = getYearGroupColor(data != null ? data.yearGroup : null);
                        
                        // Get LuckPerms prefix/suffix
                        String prefix = null;
                        String suffix = null;
                        
                        if (luckPerms != null) {
                            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
                            if (user != null) {
                                CachedMetaData metaData = user.getCachedData().getMetaData();
                                prefix = metaData.getPrefix();
                                suffix = metaData.getSuffix();
                            }
                        }
                        
                        // Build the full display name
                        Component displayName = buildDisplayName(displayText, nameColor, prefix, suffix);
                        
                        // Set the player list name (TAB list)
                        player.playerListName(displayName);
                        
                        // Also update the display name (for chat, etc.)
                        player.displayName(displayName);
                        
                        plugin.getLogger().fine("Updated TAB list for " + player.getName() + 
                            " with full name: " + displayText + " and year group: " + 
                            (data != null ? data.yearGroup : "none"));
                        
                    } catch (Exception e) {
                        plugin.getLogger().warning("Error updating TAB list for " + player.getName() + ": " + e.getMessage());
                    }
                });
            } catch (Exception e) {
                plugin.getLogger().warning("Error fetching player data for " + player.getName() + ": " + e.getMessage());
            }
        });
    }
    
    /**
     * Fetches player data from the web API
     */
    private PlayerData fetchPlayerData(String username) {
        // Check cache first
        PlayerData cached = playerDataCache.get(username);
        if (cached != null && !cached.isExpired()) {
            return cached;
        }
        
        try {
            String apiUrl = plugin.getConfig().getString("web-api.url", "http://localhost:3000") + 
                "/api/plugin/roles/" + username;
            String apiKey = plugin.getConfig().getString("web-api.key", "");
            String signature = generateSignature(username, apiKey);
            
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-MC-SIGN", signature);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            
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
                String fullName = json.has("fullName") && !json.get("fullName").isJsonNull() 
                    ? json.get("fullName").getAsString() 
                    : null;
                Integer yearGroup = json.has("yearGroup") && !json.get("yearGroup").isJsonNull() 
                    ? json.get("yearGroup").getAsInt() 
                    : null;
                
                PlayerData data = new PlayerData(fullName, yearGroup);
                playerDataCache.put(username, data);
                return data;
            }
        } catch (Exception e) {
            plugin.getLogger().fine("Could not fetch player data for " + username + ": " + e.getMessage());
        }
        
        return null;
    }
    
    /**
     * Generates HMAC signature for API authentication
     */
    private String generateSignature(String data, String secret) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to generate HMAC signature: " + e.getMessage());
            return "";
        }
    }
    
    /**
     * Converts bytes to hex string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
    
    /**
     * Gets color based on year group
     */
    private TextColor getYearGroupColor(Integer yearGroup) {
        if (yearGroup == null) {
            return NamedTextColor.WHITE;
        }
        
        // Color scheme for year groups
        switch (yearGroup) {
            case 7: return NamedTextColor.RED;
            case 8: return NamedTextColor.GOLD;
            case 9: return NamedTextColor.YELLOW;
            case 10: return NamedTextColor.GREEN;
            case 11: return NamedTextColor.AQUA;
            case 12: return NamedTextColor.BLUE;
            case 13: return NamedTextColor.LIGHT_PURPLE;
            default: return NamedTextColor.WHITE;
        }
    }
    
    /**
     * Builds a formatted display name with prefix, player name (with color), and suffix
     */
    private Component buildDisplayName(String playerName, TextColor nameColor, String prefix, String suffix) {
        Component nameComponent = Component.text(playerName).color(nameColor);
        
        // Parse prefix (if exists)
        if (prefix != null && !prefix.isEmpty()) {
            Component prefixComponent = parseLegacyText(prefix);
            nameComponent = prefixComponent.append(Component.space()).append(nameComponent);
        }
        
        // Parse suffix (if exists)
        if (suffix != null && !suffix.isEmpty()) {
            Component suffixComponent = parseLegacyText(suffix);
            nameComponent = nameComponent.append(Component.space()).append(suffixComponent);
        }
        
        return nameComponent;
    }
    
    /**
     * Parses legacy color codes (&) and MiniMessage format
     */
    private Component parseLegacyText(String text) {
        if (text == null || text.isEmpty()) {
            return Component.empty();
        }
        
        // Replace & color codes with § for legacy parsing
        text = text.replace('&', '§');
        
        // Build component with color parsing
        Component result = Component.empty();
        StringBuilder currentText = new StringBuilder();
        NamedTextColor currentColor = null;
        boolean bold = false;
        boolean italic = false;
        boolean underlined = false;
        boolean strikethrough = false;
        
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            
            if (c == '§' && i + 1 < text.length()) {
                // Flush current text
                if (currentText.length() > 0) {
                    Component part = Component.text(currentText.toString());
                    if (currentColor != null) part = part.color(currentColor);
                    if (bold) part = part.decorate(TextDecoration.BOLD);
                    if (italic) part = part.decorate(TextDecoration.ITALIC);
                    if (underlined) part = part.decorate(TextDecoration.UNDERLINED);
                    if (strikethrough) part = part.decorate(TextDecoration.STRIKETHROUGH);
                    result = result.append(part);
                    currentText = new StringBuilder();
                }
                
                char code = text.charAt(i + 1);
                switch (code) {
                    case '0': currentColor = NamedTextColor.BLACK; break;
                    case '1': currentColor = NamedTextColor.DARK_BLUE; break;
                    case '2': currentColor = NamedTextColor.DARK_GREEN; break;
                    case '3': currentColor = NamedTextColor.DARK_AQUA; break;
                    case '4': currentColor = NamedTextColor.DARK_RED; break;
                    case '5': currentColor = NamedTextColor.DARK_PURPLE; break;
                    case '6': currentColor = NamedTextColor.GOLD; break;
                    case '7': currentColor = NamedTextColor.GRAY; break;
                    case '8': currentColor = NamedTextColor.DARK_GRAY; break;
                    case '9': currentColor = NamedTextColor.BLUE; break;
                    case 'a': currentColor = NamedTextColor.GREEN; break;
                    case 'b': currentColor = NamedTextColor.AQUA; break;
                    case 'c': currentColor = NamedTextColor.RED; break;
                    case 'd': currentColor = NamedTextColor.LIGHT_PURPLE; break;
                    case 'e': currentColor = NamedTextColor.YELLOW; break;
                    case 'f': currentColor = NamedTextColor.WHITE; break;
                    case 'l': bold = true; break;
                    case 'o': italic = true; break;
                    case 'n': underlined = true; break;
                    case 'm': strikethrough = true; break;
                    case 'r': 
                        currentColor = null;
                        bold = false;
                        italic = false;
                        underlined = false;
                        strikethrough = false;
                        break;
                }
                i++; // Skip the code character
            } else {
                currentText.append(c);
            }
        }
        
        // Flush remaining text
        if (currentText.length() > 0) {
            Component part = Component.text(currentText.toString());
            if (currentColor != null) part = part.color(currentColor);
            if (bold) part = part.decorate(TextDecoration.BOLD);
            if (italic) part = part.decorate(TextDecoration.ITALIC);
            if (underlined) part = part.decorate(TextDecoration.UNDERLINED);
            if (strikethrough) part = part.decorate(TextDecoration.STRIKETHROUGH);
            result = result.append(part);
        }
        
        return result;
    }
    
    /**
     * Updates all online players' TAB list
     */
    public void updateAllPlayers() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            updatePlayerTabList(player);
        }
    }
}
