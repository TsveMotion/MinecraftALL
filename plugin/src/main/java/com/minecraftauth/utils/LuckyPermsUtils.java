package com.minecraftauth.utils;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.Node;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

public class LuckyPermsUtils {
    
    private static final String UNVERIFIED_GROUP = "unverified";
    private static final String VERIFIED_GROUP = "verified";
    
    // Group weights - higher number = higher priority
    private static final int UNVERIFIED_WEIGHT = 10;
    private static final int VERIFIED_WEIGHT = 20;
    
    /**
     * Assigns the unverified role to a player
     */
    public static void assignUnverifiedRole(Player player) {
        updatePlayerGroup(player, UNVERIFIED_GROUP, true);
    }
    
    /**
     * Assigns the verified role to a player and removes unverified role
     */
    public static void assignVerifiedRole(Player player) {
        updatePlayerGroup(player, VERIFIED_GROUP, false);
        removeGroup(player, UNVERIFIED_GROUP);
    }
    
    /**
     * Updates a player's group
     */
    private static void updatePlayerGroup(Player player, String groupName, boolean clearExisting) {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            return; // LuckPerms not installed
        }
        
        try {
            LuckPerms luckPerms = LuckPermsProvider.get();
            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            
            if (user == null) {
                return; // User not loaded yet
            }
            
            if (clearExisting) {
                // Remove all existing group memberships
                user.data().clear(node -> node instanceof net.luckperms.api.node.Node && 
                    node.getKey().startsWith("group."));
            }
            
            // Add the new group with weight
            user.data().add(InheritanceNode.builder(groupName).build());
            
            // Save changes
            luckPerms.getUserManager().saveUser(user);
            
        } catch (IllegalStateException e) {
            // LuckPerms API not loaded
            player.getServer().getLogger().warning("Could not assign role: " + e.getMessage());
        }
    }
    
    /**
     * Removes a group from a player
     */
    private static void removeGroup(Player player, String groupName) {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            return; // LuckPerms not installed
        }
        
        try {
            LuckPerms luckPerms = LuckPermsProvider.get();
            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            
            if (user == null) {
                return; // User not loaded yet
            }
            
            // Remove the group by finding the actual node
            user.data().clear(node -> node instanceof net.luckperms.api.node.Node && 
                node.getKey().equals("group." + groupName));
            
            // Save changes
            luckPerms.getUserManager().saveUser(user);
            
        } catch (IllegalStateException e) {
            // LuckPerms API not loaded
            player.getServer().getLogger().warning("Could not remove role: " + e.getMessage());
        }
    }
}
