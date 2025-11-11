package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import com.minecraftauth.utils.LuckyPermsUtils;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

import java.util.UUID;

public class TestRoleCommand implements CommandExecutor {

    private final MinecraftAuthPlugin plugin;

    public TestRoleCommand(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("This command can only be used by players.");
            return true;
        }

        if (!player.hasPermission("minecraftauth.test")) {
            player.sendMessage(Component.text("You don't have permission to use this command.")
                    .color(NamedTextColor.RED));
            return true;
        }

        if (args.length < 1) {
            sendUsage(player);
            return true;
        }

        String subCommand = args[0].toLowerCase();
        switch (subCommand) {
            case "setunverified":
                LuckyPermsUtils.assignUnverifiedRole(player);
                player.sendMessage(Component.text("Set role to 'unverified'")
                        .color(NamedTextColor.GREEN));
                break;

            case "setverified":
                LuckyPermsUtils.assignVerifiedRole(player);
                player.sendMessage(Component.text("Set role to 'verified'")
                        .color(NamedTextColor.GREEN));
                break;

            case "check":
                checkPlayerGroups(player);
                break;

            default:
                sendUsage(player);
                break;
        }

        return true;
    }

    private void sendUsage(Player player) {
        player.sendMessage(Component.text("Usage:")
                .color(NamedTextColor.YELLOW));
        player.sendMessage(Component.text("/testrole setunverified - Set unverified role"));
        player.sendMessage(Component.text("/testrole setverified - Set verified role"));
        player.sendMessage(Component.text("/testrole check - Check current roles"));
    }

    private void checkPlayerGroups(Player player) {
        try {
            LuckPerms luckPerms = Bukkit.getServicesManager().load(LuckPerms.class);
            if (luckPerms == null) {
                player.sendMessage(Component.text("Error: LuckPerms not found!")
                        .color(NamedTextColor.RED));
                return;
            }

            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            if (user == null) {
                player.sendMessage(Component.text("Error: Could not load your user data!")
                        .color(NamedTextColor.RED));
                return;
            }

            player.sendMessage(Component.text("\nYour current groups:")
                    .color(NamedTextColor.GOLD));
            
            boolean hasGroups = false;
            for (InheritanceNode node : user.getNodes(InheritanceNode.class)) {
                player.sendMessage(Component.text("- " + node.getGroupName())
                        .color(NamedTextColor.WHITE));
                hasGroups = true;
            }
            
            if (!hasGroups) {
                player.sendMessage(Component.text("No groups found!")
                        .color(NamedTextColor.GRAY));
            }
            
            player.sendMessage(Component.text(""));
            
        } catch (Exception e) {
            player.sendMessage(Component.text("An error occurred while checking your groups: " + e.getMessage())
                    .color(NamedTextColor.RED));
            plugin.getLogger().warning("Error checking player groups: " + e.getMessage());
        }
    }
}
