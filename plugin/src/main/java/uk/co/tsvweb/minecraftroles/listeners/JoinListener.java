package uk.co.tsvweb.minecraftroles.listeners;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextColor;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;
import uk.co.tsvweb.minecraftroles.models.PlayerRole;

public class JoinListener implements Listener {
    
    private final MinecraftRoles plugin;
    
    public JoinListener(MinecraftRoles plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler(priority = EventPriority.HIGH)
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        
        // Fetch player role and apply to display name
        plugin.getWebAPIClient().getPlayerRole(player.getName()).thenAccept(playerRole -> {
            if (playerRole != null) {
                // Set custom display name with role tag
                TextColor roleColor = TextColor.fromHexString(playerRole.getColorHex());
                if (roleColor == null) {
                    roleColor = NamedTextColor.WHITE;
                }
                
                String displayName = player.getName();
                if (plugin.getPluginConfig().isChatObfuscate()) {
                    displayName = obfuscateUsername(player.getName());
                }
                
                Component displayNameComponent = Component.text(playerRole.getSymbol() + " ")
                        .color(roleColor)
                        .append(Component.text(displayName).color(NamedTextColor.GRAY));
                
                player.displayName(displayNameComponent);
                
                // Customize join message with role
                if (plugin.getPluginConfig().isChatObfuscate()) {
                    event.joinMessage(Component.text(displayName + " joined the game")
                            .color(NamedTextColor.YELLOW));
                } else {
                    event.joinMessage(Component.text(player.getName() + " joined the game")
                            .color(NamedTextColor.YELLOW));
                }
                
                // Log role info
                plugin.getPlugin().getLogger().info("Player " + player.getName() + " has role: " + 
                        playerRole.getSymbol() + " (admin=" + playerRole.isAdmin() + ")");
            } else {
                // No role found, use default display
                plugin.getPlugin().getLogger().info("No role found for player: " + player.getName());
                
                if (plugin.getPluginConfig().isChatObfuscate()) {
                    String displayName = obfuscateUsername(player.getName());
                    player.displayName(Component.text(displayName).color(NamedTextColor.GRAY));
                    event.joinMessage(Component.text(displayName + " joined the game")
                            .color(NamedTextColor.YELLOW));
                }
            }
        }).exceptionally(throwable -> {
            plugin.getPlugin().getLogger().warning("Failed to fetch role for " + player.getName() + ": " + throwable.getMessage());
            return null;
        });
    }
    
    private String obfuscateUsername(String username) {
        String pattern = plugin.getPluginConfig().getObfuscatePattern();
        
        if (username.length() <= 5) {
            return username.substring(0, 1) + "***";
        }
        
        switch (pattern) {
            case "first3_ellipsis_last2":
                return username.substring(0, 3) + "..." + username.substring(username.length() - 2);
            case "first2_asterisks_last2":
                return username.substring(0, 2) + "***" + username.substring(username.length() - 2);
            case "first1_asterisks_last1":
                return username.substring(0, 1) + "***" + username.substring(username.length() - 1);
            default:
                return username.substring(0, 3) + "..." + username.substring(username.length() - 2);
        }
    }
}
