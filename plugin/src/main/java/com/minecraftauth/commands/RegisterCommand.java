package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import com.minecraftauth.utils.BedrockUtils;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.geysermc.cumulus.form.SimpleForm;
import org.geysermc.floodgate.api.FloodgateApi;
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
        if (BedrockUtils.isBedrock(player)) {
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
     * Generates a PIN and displays a form UI with a button to open the registration page
     */
    private void handleBedrockRegistration(Player player) {
        String username = player.getName();
        
        // Generate registration token for the website
        String token = plugin.getDatabaseManager().createRegistrationToken(username);
        
        if (token == null) {
            player.sendMessage(Component.text("An error occurred. Please contact an administrator.")
                    .color(NamedTextColor.RED));
            return;
        }
        
        // Generate a 6-digit PIN for Bedrock player
        String pin = BedrockUtils.generatePIN();
        
        // Store PIN in database
        if (!plugin.getDatabaseManager().storePIN(username, pin)) {
            player.sendMessage(Component.text("An error occurred storing your PIN. Please contact an administrator.")
                    .color(NamedTextColor.RED));
            return;
        }
        
        // Build registration URL
        String websiteUrl = plugin.getConfig().getString("registration.website-url");
        String registrationUrl = websiteUrl + "/register?token=" + token;
        
        // Send PIN information in chat (Bedrock players can read but not copy links)
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("Bedrock Registration")
                .color(NamedTextColor.GREEN));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("Your PIN: " + pin)
                .color(NamedTextColor.GOLD));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("1. Click the button in the popup to open the registration page")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("2. Enter your PIN on the website to link your account")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("3. Set your password on the website")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("4. Use /login <password> or /login <pin> to authenticate")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text(""));
        player.sendMessage(Component.text("⚠ Your PIN expires in 30 minutes")
                .color(NamedTextColor.RED));
        player.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY));
        
        // Create and send Bedrock Form UI
        createBedrockForm(player, registrationUrl, pin);
        
        plugin.getLogger().info("Generated PIN " + pin + " for Bedrock player: " + username);
    }
    
    /**
     * Create and display a Bedrock Form UI popup with registration information
     */
    private void createBedrockForm(Player player, String registrationUrl, String pin) {
        try {
            // Create a simple form with registration information
            // Note: Bedrock forms cannot directly open URLs, so we provide the information
            // and the player must manually visit the registration page
            SimpleForm form = SimpleForm.builder()
                    .title("Account Registration")
                    .content(
                        "Welcome to the server!\n\n" +
                        "Your PIN: §e" + pin + "§r\n\n" +
                        "Please visit the registration website:\n" +
                        "§b" + registrationUrl + "§r\n\n" +
                        "Steps to register:\n" +
                        "1. Visit the website above\n" +
                        "2. Enter your PIN: " + pin + "\n" +
                        "3. Complete registration\n" +
                        "4. Use /login <password>\n\n" +
                        "The PIN is also shown in chat!"
                    )
                    .button("Got it!")
                    .button("Close")
                    .build();
            
            // Send the form to the Bedrock player
            FloodgateApi.getInstance().sendForm(player.getUniqueId(), form);
            
        } catch (Exception e) {
            plugin.getLogger().warning("Failed to send Bedrock form to player " + player.getName() + ": " + e.getMessage());
            player.sendMessage(Component.text("Could not display popup. Please manually visit: " + registrationUrl)
                    .color(NamedTextColor.YELLOW));
        }
    }
}
