package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import com.minecraftauth.utils.BedrockUtils;
import com.minecraftauth.utils.LuckyPermsUtils;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

/**
 * Handles the /login command for both Java and Bedrock players
 * 
 * Supports two authentication methods:
 * 1. Password authentication: /login <password>
 * 2. PIN authentication: /login <6-digit-pin> (primarily for Bedrock players)
 */
public class LoginCommand implements CommandExecutor {
    
    private final MinecraftAuthPlugin plugin;
    
    public LoginCommand(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }
        
        // Check if player is already authenticated in this session
        if (plugin.isAuthenticated(player.getUniqueId())) {
            player.sendMessage(Component.text("You are already logged in!")
                    .color(NamedTextColor.YELLOW));
            return true;
        }
        
        // Validate command usage
        if (args.length != 1) {
            player.sendMessage(plugin.getMessage("usage-login"));
            return true;
        }
        
        String credential = args[0];
        String username = player.getName();
        
        // Check if the credential is a 6-digit PIN
        if (BedrockUtils.isValidPIN(credential)) {
            // Attempt PIN authentication
            handlePINLogin(player, credential);
        } else {
            // Attempt password authentication
            handlePasswordLogin(player, credential);
        }
        
        return true;
    }
    
    /**
     * Handle password-based authentication
     */
    private void handlePasswordLogin(Player player, String password) {
        String username = player.getName();
        
        // Check if player is registered
        if (!plugin.getDatabaseManager().playerExists(username)) {
            player.sendMessage(plugin.getMessage("not-registered"));
            return;
        }
        
        // Verify password credentials
        if (plugin.getDatabaseManager().verifyLogin(username, password)) {
            // Cancel verification timer
            plugin.getVerificationManager().cancelVerificationTimer(player);
            
            // Add to authenticated players set
            plugin.addAuthenticatedPlayer(player.getUniqueId(), username);
            
            // Assign verified role
            LuckyPermsUtils.assignVerifiedRole(player);
            
            // Create session for cross-server auth (no re-login needed)
            if (plugin.getSessionManager() != null) {
                plugin.getSessionManager().createSession(player, username);
            }
            
            // Update TAB list to show new rank
            if (plugin.getTabListListener() != null) {
                plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                    plugin.getTabListListener().updatePlayerTabList(player);
                }, 5L);
            }
            
            // Send success message from config
            String loginMsg = plugin.getConfig().getString("auth.loginMessage", 
                "&aLogged in ✅ — you can now use &e/server &ato switch realms.");
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            player.sendMessage(net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer.legacyAmpersand().deserialize(loginMsg));
            player.sendMessage(Component.text("Welcome back, " + player.getName() + "!")
                    .color(NamedTextColor.YELLOW));
            player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.DARK_GRAY));
            
            plugin.getLogger().info(player.getName() + " logged in successfully with password.");
        } else {
            player.sendMessage(plugin.getMessage("login-failed"));
            plugin.getLogger().warning(player.getName() + " attempted to login with incorrect password.");
        }
    }
    
    /**
     * Handle PIN-based authentication (for Bedrock players)
     */
    private void handlePINLogin(Player player, String pin) {
        String username = player.getName();
        
        // Verify the PIN
        String pinUsername = plugin.getDatabaseManager().verifyPIN(pin);
        
        if (pinUsername == null) {
            player.sendMessage(Component.text("Invalid or expired PIN. Please use /register to get a new one.")
                    .color(NamedTextColor.RED));
            plugin.getLogger().warning(player.getName() + " attempted to login with invalid/expired PIN.");
            return;
        }
        
        // Check if the PIN matches this player's username
        if (!pinUsername.equalsIgnoreCase(username)) {
            player.sendMessage(Component.text("This PIN does not belong to your account.")
                    .color(NamedTextColor.RED));
            plugin.getLogger().warning(player.getName() + " attempted to use PIN for different account: " + pinUsername);
            return;
        }
        
        // Check if player is registered
        if (!plugin.getDatabaseManager().playerExists(username)) {
            player.sendMessage(Component.text("Your account is not registered yet. Please complete registration on the website.")
                    .color(NamedTextColor.RED));
            return;
        }
        
        // Check if player is verified
        if (!plugin.getDatabaseManager().isPlayerVerified(username)) {
            player.sendMessage(Component.text("Your account is not verified yet. Please complete registration on the website.")
                    .color(NamedTextColor.RED));
            return;
        }
        
        // PIN is valid and belongs to this player
        // Cancel verification timer
        plugin.getVerificationManager().cancelVerificationTimer(player);
        
        // Add to authenticated players set
        plugin.addAuthenticatedPlayer(player.getUniqueId(), username);
        
        // Delete the PIN (one-time use after verification)
        plugin.getDatabaseManager().deletePIN(pin);
        
        // Assign verified role
        LuckyPermsUtils.assignVerifiedRole(player);
        
        // Create session for cross-server auth (no re-login needed)
        if (plugin.getSessionManager() != null) {
            plugin.getSessionManager().createSession(player, username);
        }
        
        // Update TAB list to show new rank
        if (plugin.getTabListListener() != null) {
            plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
                plugin.getTabListListener().updatePlayerTabList(player);
            }, 5L);
        }
        
        // Send success message from config
        String loginMsg = plugin.getConfig().getString("auth.loginMessage", 
            "&aLogged in ✅ — you can now use &e/server &ato switch realms.");
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer.legacyAmpersand().deserialize(loginMsg));
        player.sendMessage(Component.text("Welcome back, " + player.getName() + "!")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("TIP: Next time you can use /login <password> instead.")
                .color(NamedTextColor.AQUA));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        
        plugin.getLogger().info(player.getName() + " logged in successfully with PIN.");
    }
}
