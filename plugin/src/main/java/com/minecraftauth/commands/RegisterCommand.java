package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import com.minecraftauth.utils.FloodgateSupport;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

/**
 * Handles the /register command for both Java and Bedrock players
 * 
 * Java players: Receive a clickable registration URL in chat
 * Bedrock players: Receive a PIN and a form UI with a button to open the registration page
 */
public class RegisterCommand implements CommandExecutor {
    
    private final MinecraftAuthPlugin plugin;
    
    public RegisterCommand(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }
        
        String username = player.getName();
        
        // Check if player is already registered and verified
        if (plugin.getDatabaseManager().isPlayerVerified(username)) {
            player.sendMessage(plugin.getMessage("already-registered"));
            return true;
        }
        
        // Check if player is on Bedrock Edition
        if (FloodgateSupport.isAvailable() && FloodgateSupport.isBedrockPlayer(player)) {
            handleBedrockRegistration(player);
        } else {
            handleJavaRegistration(player);
        }
        
        return true;
    }
    
    /**
     * Handle registration for Java Edition players
     * Sends a clickable URL in chat
     */
    private void handleJavaRegistration(Player player) {
        String username = player.getName();
        
        // Generate registration token
        String token = plugin.getDatabaseManager().createRegistrationToken(username);
        
        if (token == null) {
            player.sendMessage(Component.text("An error occurred. Please contact an administrator.")
                    .color(NamedTextColor.RED));
            return;
        }
        
        // Build registration URL
        String websiteUrl = plugin.getConfig().getString("registration.website-url");
        String registrationUrl = websiteUrl + "/register?token=" + token;
        
        // Send clickable link to player
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("Registration Link Generated!")
                .color(NamedTextColor.GREEN));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("Click the link below to register:")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text(registrationUrl)
                .color(NamedTextColor.AQUA)
                .clickEvent(ClickEvent.openUrl(registrationUrl)));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("⚠ This link expires in 30 minutes")
                .color(NamedTextColor.GOLD));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        
        plugin.getLogger().info("Generated registration link for Java player: " + username);
    }
    
    /**
     * Handle registration for Bedrock Edition players
     * Generates a 6-digit PIN for in-game registration (no website link needed)
     */
    private void handleBedrockRegistration(Player player) {
        String username = player.getName();
        
        // Generate a 6-digit PIN for Bedrock player
        String pin = FloodgateSupport.createPINSession(username, player.getUniqueId());
        
        // Send PIN information in chat
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("🎮 Bedrock Registration")
                .color(NamedTextColor.GREEN));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("Welcome Bedrock player!")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("Your PIN: " + pin)
                .color(NamedTextColor.GOLD)
                .decorate(TextDecoration.BOLD));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("To complete registration, enter:")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("/register " + pin + " <email> <password>")
                .color(NamedTextColor.AQUA));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("Example:")
                .color(NamedTextColor.GRAY));
        player.sendMessage(Component.text("/register " + pin + " me@example.com MyPassword123")
                .color(NamedTextColor.GRAY));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("⚠ PIN expires in 10 minutes")
                .color(NamedTextColor.RED));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        
        plugin.getLogger().info("Generated PIN " + pin + " for Bedrock player: " + username);
    }
}
