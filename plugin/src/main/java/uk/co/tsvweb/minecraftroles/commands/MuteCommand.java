package uk.co.tsvweb.minecraftroles.commands;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;
import uk.co.tsvweb.minecraftroles.models.MuteStatus;

public class MuteCommand implements CommandExecutor {
    
    private final MinecraftRoles plugin;
    
    public MuteCommand(MinecraftRoles plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(Component.text("This command can only be used by players!")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        Player player = (Player) sender;
        
        if (args.length == 0) {
            // Check own mute status
            plugin.getWebAPIClient().getMuteStatus(player.getName()).thenAccept(muteStatus -> {
                if (muteStatus != null && muteStatus.isMuted()) {
                    player.sendMessage(Component.text("You are currently muted!")
                            .color(NamedTextColor.RED));
                    if (muteStatus.getReason() != null) {
                        player.sendMessage(Component.text("Reason: " + muteStatus.getReason())
                                .color(NamedTextColor.YELLOW));
                    }
                    if (muteStatus.getEndsAt() != null) {
                        player.sendMessage(Component.text("Expires: " + muteStatus.getEndsAt())
                                .color(NamedTextColor.YELLOW));
                    }
                } else {
                    player.sendMessage(Component.text("You are not muted.")
                            .color(NamedTextColor.GREEN));
                }
            });
            return true;
        }
        
        // Check other player's mute status (requires admin)
        if (!player.hasPermission("minecraftroles.mute.check")) {
            player.sendMessage(Component.text("You don't have permission to check other players' mute status!")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        String targetPlayer = args[0];
        plugin.getWebAPIClient().getMuteStatus(targetPlayer).thenAccept(muteStatus -> {
            if (muteStatus != null && muteStatus.isMuted()) {
                player.sendMessage(Component.text(targetPlayer + " is currently muted!")
                        .color(NamedTextColor.RED));
                if (muteStatus.getReason() != null) {
                    player.sendMessage(Component.text("Reason: " + muteStatus.getReason())
                            .color(NamedTextColor.YELLOW));
                }
                if (muteStatus.getEndsAt() != null) {
                    player.sendMessage(Component.text("Expires: " + muteStatus.getEndsAt())
                            .color(NamedTextColor.YELLOW));
                }
            } else {
                player.sendMessage(Component.text(targetPlayer + " is not muted.")
                        .color(NamedTextColor.GREEN));
            }
        });
        
        return true;
    }
}
