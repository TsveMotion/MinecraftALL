package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.group.Group;
import net.luckperms.api.node.types.PermissionNode;
import net.luckperms.api.node.types.WeightNode;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.jetbrains.annotations.NotNull;

/**
 * Admin command to setup LuckPerms groups for the authentication system
 */
public class SetupAuthCommand implements CommandExecutor {
    
    private final MinecraftAuthPlugin plugin;
    private static final int UNVERIFIED_WEIGHT = 1;
    private static final int VERIFIED_WEIGHT = 10;
    
    public SetupAuthCommand(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        // Check if sender has permission
        if (!sender.hasPermission("minecraftauth.setup")) {
            sender.sendMessage(Component.text("You don't have permission to use this command.")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        // Check if LuckPerms is installed
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            sender.sendMessage(Component.text("LuckPerms is not installed! Cannot setup groups.")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        sender.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.GOLD));
        sender.sendMessage(Component.text("Setting up LuckPerms Authentication Groups...")
                .color(NamedTextColor.YELLOW));
        sender.sendMessage(Component.text(""));
        
        try {
            LuckPerms luckPerms = LuckPermsProvider.get();
            
            // Create/Update Unverified Group
            sender.sendMessage(Component.text("Creating 'unverified' group...")
                    .color(NamedTextColor.GRAY));
            
            Group unverifiedGroup = luckPerms.getGroupManager().getGroup("unverified");
            if (unverifiedGroup == null) {
                luckPerms.getGroupManager().createAndLoadGroup("unverified").join();
                unverifiedGroup = luckPerms.getGroupManager().getGroup("unverified");
            }
            
            if (unverifiedGroup != null) {
                // Set unverified permissions
                unverifiedGroup.data().add(PermissionNode.builder("auth.verified").value(false).build());
                unverifiedGroup.data().add(PermissionNode.builder("velocity.command.server").value(false).build());
                unverifiedGroup.data().add(PermissionNode.builder("essentials.spawn").value(true).build());

                // Set weight
                unverifiedGroup.data().clear(node -> node instanceof WeightNode);
                unverifiedGroup.data().add(WeightNode.builder(UNVERIFIED_WEIGHT).build());
                
                luckPerms.getGroupManager().saveGroup(unverifiedGroup);
                sender.sendMessage(Component.text("✓ Unverified group configured")
                        .color(NamedTextColor.GREEN));
            }
            
            // Create/Update Verified Group
            sender.sendMessage(Component.text("Creating 'verified' group...")
                    .color(NamedTextColor.GRAY));
            
            Group verifiedGroup = luckPerms.getGroupManager().getGroup("verified");
            if (verifiedGroup == null) {
                luckPerms.getGroupManager().createAndLoadGroup("verified").join();
                verifiedGroup = luckPerms.getGroupManager().getGroup("verified");
            }
            
            if (verifiedGroup != null) {
                // Set verified permissions - THIS IS CRITICAL!
                verifiedGroup.data().add(PermissionNode.builder("auth.verified").value(true).build());
                verifiedGroup.data().add(PermissionNode.builder("velocity.command.server").value(true).build());
                verifiedGroup.data().add(PermissionNode.builder("essentials.spawn").value(true).build());
                verifiedGroup.data().add(PermissionNode.builder("essentials.home").value(true).build());
                verifiedGroup.data().add(PermissionNode.builder("essentials.sethome").value(true).build());
                verifiedGroup.data().add(PermissionNode.builder("essentials.tpa").value(true).build());
                verifiedGroup.data().add(PermissionNode.builder("essentials.tpaccept").value(true).build());

                // Set weight
                verifiedGroup.data().clear(node -> node instanceof WeightNode);
                verifiedGroup.data().add(WeightNode.builder(VERIFIED_WEIGHT).build());
                
                luckPerms.getGroupManager().saveGroup(verifiedGroup);
                sender.sendMessage(Component.text("✓ Verified group configured")
                        .color(NamedTextColor.GREEN));
            }
            
            sender.sendMessage(Component.text(""));
            sender.sendMessage(Component.text("✓ Setup Complete!")
                    .color(NamedTextColor.GREEN));
            sender.sendMessage(Component.text(""));
            sender.sendMessage(Component.text("Groups created:")
                    .color(NamedTextColor.YELLOW));
            sender.sendMessage(Component.text("  • unverified - No auth.verified permission")
                    .color(NamedTextColor.GRAY));
            sender.sendMessage(Component.text("  • verified - Has auth.verified permission")
                    .color(NamedTextColor.GRAY));
            sender.sendMessage(Component.text(""));
            sender.sendMessage(Component.text("Note: Make sure to configure these same groups on Velocity!")
                    .color(NamedTextColor.AQUA));
            sender.sendMessage(Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                    .color(NamedTextColor.GOLD));
            
        } catch (Exception e) {
            sender.sendMessage(Component.text("✗ Error setting up groups: " + e.getMessage())
                    .color(NamedTextColor.RED));
            plugin.getLogger().severe("Error setting up LuckPerms groups: " + e.getMessage());
            e.printStackTrace();
        }
        
        return true;
    }
}
