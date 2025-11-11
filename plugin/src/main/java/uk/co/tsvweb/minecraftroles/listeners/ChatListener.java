package uk.co.tsvweb.minecraftroles.listeners;

import io.papermc.paper.event.player.AsyncChatEvent;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextColor;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;
import uk.co.tsvweb.minecraftroles.models.MuteStatus;
import uk.co.tsvweb.minecraftroles.models.PlayerRole;

public class ChatListener implements Listener {
    
    private final MinecraftRoles plugin;
    
    public ChatListener(MinecraftRoles plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler(priority = EventPriority.HIGH)
    public void onChat(AsyncChatEvent event) {
        Player player = event.getPlayer();
        String username = player.getName();
        
        // Check mute status (async but use cached value)
        plugin.getWebAPIClient().getMuteStatus(username).thenAccept(muteStatus -> {
            if (muteStatus != null && muteStatus.isMuted()) {
                event.setCancelled(true);
                player.sendMessage(Component.text("You are muted and cannot chat!")
                        .color(NamedTextColor.RED));
                if (muteStatus.getReason() != null) {
                    player.sendMessage(Component.text("Reason: " + muteStatus.getReason())
                            .color(NamedTextColor.YELLOW));
                }
                if (muteStatus.getEndsAt() != null) {
                    player.sendMessage(Component.text("Expires: " + muteStatus.getEndsAt())
                            .color(NamedTextColor.YELLOW));
                }
                return;
            }
        }).exceptionally(ex -> {
            plugin.getPlugin().getLogger().warning("Failed to check mute status for " + username + ": " + ex.getMessage());
            return null;
        });
        
        // Get role from cache (fetched at join time)
        plugin.getWebAPIClient().getPlayerRole(username).thenAccept(playerRole -> {
            // Build custom chat format
            String displayName = username;
            if (plugin.getPluginConfig().isChatObfuscate()) {
                displayName = obfuscateUsername(username);
            }
            
            Component nameComponent;
            if (playerRole != null) {
                TextColor roleColor = TextColor.fromHexString(playerRole.getColorHex());
                if (roleColor == null) {
                    roleColor = NamedTextColor.WHITE;
                }
                
                nameComponent = Component.text(playerRole.getSymbol() + " ")
                        .color(roleColor)
                        .append(Component.text(displayName).color(NamedTextColor.WHITE));
            } else {
                nameComponent = Component.text(displayName).color(NamedTextColor.GRAY);
            }
            
            Component message = event.message();
            Component newFormat = nameComponent
                    .append(Component.text(": ").color(NamedTextColor.DARK_GRAY))
                    .append(message.color(NamedTextColor.WHITE));
            
            event.renderer((source, sourceDisplayName, msg, viewer) -> newFormat);
        }).exceptionally(ex -> {
            plugin.getPlugin().getLogger().warning("Failed to get role for chat formatting: " + ex.getMessage());
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
