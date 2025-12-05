package com.minecraftauth.listeners;

import com.minecraftauth.MinecraftAuthPlugin;
import com.minecraftauth.database.DatabaseManager;
import com.minecraftauth.utils.LuckyPermsUtils;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import java.text.SimpleDateFormat;
import java.util.Date;

public class PlayerJoinListener implements Listener {
    
    private final MinecraftAuthPlugin plugin;
    
    public PlayerJoinListener(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        String username = player.getName();
        
        // Send TSVWEB branding header
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("🌐 Streetly SMP")
                .color(NamedTextColor.GOLD));
        player.sendMessage(Component.text("Created by tsvweb.co.uk!")
                .color(NamedTextColor.AQUA));
        player.sendMessage(Component.text("Java + Bedrock Crossplay Enabled")
                .color(NamedTextColor.GRAY));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text(""));
        
        // Check if player is banned
        DatabaseManager.BanInfo ban = plugin.getDatabaseManager().getActiveBan(username);
        if (ban != null) {
            String kickMessage = "§c§lYou are banned from this server!\n\n";
            kickMessage += "§7Reason: §f" + ban.getReason() + "\n";
            if (ban.isPermanent()) {
                kickMessage += "§7Duration: §cPermanent";
            } else {
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                kickMessage += "§7Expires: §f" + dateFormat.format(new Date(ban.getExpiresAt().getTime()));
            }
            player.kick(Component.text(kickMessage));
            return;
        }
        
        // Check if player has an active session from another server
        if (plugin.getSessionManager() != null && plugin.getSessionManager().hasActiveSession(player.getUniqueId())) {
            // Player has active session - auto-authenticate
            plugin.addAuthenticatedPlayer(player.getUniqueId(), username);
            LuckyPermsUtils.assignVerifiedRole(player);
            
            if (plugin.getTabListListener() != null) {
                plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                    plugin.getTabListListener().updatePlayerTabList(player);
                }, 5L);
            }
            
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(Component.text("✓ Auto-Authenticated")
                    .color(NamedTextColor.GREEN));
            player.sendMessage(Component.text("You're still logged in from your previous session!")
                    .color(NamedTextColor.GRAY));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(Component.text(""));
            
            plugin.getLogger().info(username + " auto-authenticated via session (cross-server)");
            return;
        }
        
        // Check if player is verified in database
        if (plugin.getDatabaseManager().isPlayerVerified(username)) {
            // Get player display data
            DatabaseManager.PlayerDisplayData displayData = plugin.getDatabaseManager().getPlayerDisplayData(username);
            
            // Apply display name and tab list name if data exists
            if (displayData != null && displayData.getRealName() != null) {
                String displayName;
                
                if (displayData.isAdmin()) {
                    // Admin users: GOLD color with CROWN
                    displayName = "§6§l✍ " + displayData.getRealName() + " §7(" + username + ")";
                } else {
                    // Regular users: Year group prefix with rank color
                    String minecraftColor = convertHexToMinecraftColor(displayData.getRankColor());
                    String yearPrefix = "";
                    if (displayData.getYearGroup() > 0) {
                        yearPrefix = minecraftColor + "[Year " + displayData.getYearGroup() + "] ";
                    }
                    displayName = yearPrefix + minecraftColor + displayData.getRealName() + " §7(" + username + ")";
                }
                
                player.setDisplayName(displayName);
                player.setPlayerListName(displayName);
            }
            
            // Player is registered but not yet authenticated this session - assign unverified role
            LuckyPermsUtils.assignUnverifiedRole(player);
            
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(Component.text("⚠ Authentication Required")
                    .color(NamedTextColor.GOLD));
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("Please login to continue playing.")
                    .color(NamedTextColor.YELLOW));
            player.sendMessage(Component.text("Use: /login <password>")
                    .color(NamedTextColor.GREEN));
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("⏱ You have 5 minutes to login or you will be kicked!")
                    .color(NamedTextColor.RED));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(Component.text(""));
            
            // Start verification timer
            plugin.getVerificationManager().startVerificationTimer(player);
        } else {
            // Player is not registered at all - assign unverified role
            LuckyPermsUtils.assignUnverifiedRole(player);
            
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(Component.text("⚠ Registration Required")
                    .color(NamedTextColor.RED));
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("You must register an account to play on this server.")
                    .color(NamedTextColor.YELLOW));
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("📝 Quick Setup:")
                    .color(NamedTextColor.AQUA));
            player.sendMessage(Component.text("  1. Type /register")
                    .color(NamedTextColor.WHITE));
            player.sendMessage(Component.text("  2. Click the link to create your account")
                    .color(NamedTextColor.WHITE));
            player.sendMessage(Component.text("  3. Come back and use /login <password>")
                    .color(NamedTextColor.WHITE));
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("💡 Tip: Use /links to view helpful links!")
                    .color(NamedTextColor.YELLOW));
            player.sendMessage(Component.text(""));
            player.sendMessage(Component.text("⏱ You have 5 minutes to register or you will be kicked!")
                    .color(NamedTextColor.RED));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(Component.text(""));
            
            // Start verification timer
            plugin.getVerificationManager().startVerificationTimer(player);
        }
    }
    
    /**
     * Convert hex color to Minecraft legacy color code
     * Simplified mapping - you can enhance this
     */
    private String convertHexToMinecraftColor(String hexColor) {
        if (hexColor == null) return "§f";
        
        // Map common hex colors to Minecraft color codes
        switch (hexColor.toLowerCase()) {
            case "#ffff55": return "§e";  // Yellow
            case "#55ff55": return "§a";  // Green
            case "#ff5555": return "§c";  // Red
            case "#5555ff": return "§9";  // Blue
            case "#aa00aa": return "§5";  // Purple
            case "#ff9d3d": return "§6";  // Orange/Gold
            default: return "§f";          // White (fallback)
        }
    }
    
    @EventHandler(priority = EventPriority.MONITOR)
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        // Cancel verification timer
        plugin.getVerificationManager().cancelVerificationTimer(player);
        // Remove player from authenticated set when they disconnect
        plugin.removeAuthenticatedPlayer(player.getUniqueId(), player.getName());
    }
}
