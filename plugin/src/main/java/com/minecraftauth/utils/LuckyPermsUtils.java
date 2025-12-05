package com.minecraftauth.utils;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.Node;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.types.InheritanceNode;
import net.luckperms.api.node.types.PermissionNode;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

public class LuckyPermsUtils {
    
    private static final String UNVERIFIED_GROUP = "default";
    private static final String VERIFIED_GROUP = "verified";
    private static final String AUTH_VERIFIED_PERMISSION = "auth.verified";
    
    // Group weights - higher number = higher priority
    private static final int UNVERIFIED_WEIGHT = 10;
    private static final int VERIFIED_WEIGHT = 20;
    
    /**
     * Assigns the unverified role to a player
     * Removes verified permission and adds unverified group
     */
    public static void assignUnverifiedRole(Player player) {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            player.getServer().getLogger().warning("LuckPerms not found! Cannot assign unverified role.");
            return;
        }
        
        try {
            LuckPerms luckPerms = LuckPermsProvider.get();
            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            
            if (user == null) {
                player.getServer().getLogger().warning("Could not load LuckPerms user data for " + player.getName());
                return;
            }
            
            // Remove verified permission explicitly
            PermissionNode verifiedPerm = PermissionNode.builder(AUTH_VERIFIED_PERMISSION).value(false).build();
            user.data().add(verifiedPerm);
            
            // Add unverified group
            user.data().add(InheritanceNode.builder(UNVERIFIED_GROUP).build());
            
            // Remove verified group if present
            user.data().clear(node -> node.getKey().equals("group." + VERIFIED_GROUP));
            
            // Save changes
            luckPerms.getUserManager().saveUser(user);
            
            player.getServer().getLogger().info("[LuckPerms] Assigned unverified role to " + player.getName());
            
        } catch (Exception e) {
            player.getServer().getLogger().severe("Error assigning unverified role: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Assigns the verified role to a player
     * Grants auth.verified permission, adds verified group, sets as primary, and applies meta
     * This is idempotent - safe to call multiple times
     */
    public static void assignVerifiedRole(Player player) {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            player.getServer().getLogger().warning("LuckPerms not found! Cannot assign verified role.");
            return;
        }
        
        try {
            LuckPerms luckPerms = LuckPermsProvider.get();
            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            
            if (user == null) {
                player.getServer().getLogger().warning("Could not load LuckPerms user data for " + player.getName());
                return;
            }
            
            boolean changed = false;
            
            // Set primary group to verified if not already
            if (!user.getPrimaryGroup().equalsIgnoreCase(VERIFIED_GROUP)) {
                user.setPrimaryGroup(VERIFIED_GROUP);
                changed = true;
            }
            
            // Add verified group inheritance if not present
            boolean hasVerifiedGroup = user.getNodes(NodeType.INHERITANCE).stream()
                    .anyMatch(node -> node.getGroupName().equalsIgnoreCase(VERIFIED_GROUP));
            if (!hasVerifiedGroup) {
                user.data().add(InheritanceNode.builder(VERIFIED_GROUP).build());
                changed = true;
            }

            // Grant auth.verified permission explicitly (THIS IS CRITICAL!)
            boolean hasVerifiedPermission = user.getNodes(NodeType.PERMISSION).stream()
                    .anyMatch(node -> node.getPermission().equalsIgnoreCase(AUTH_VERIFIED_PERMISSION) && node.getValue());
            if (!hasVerifiedPermission) {
                user.data().add(PermissionNode.builder(AUTH_VERIFIED_PERMISSION).value(true).build());
                changed = true;
            }
            
            // Remove unverified group if present
            user.data().clear(node -> node.getKey().equals("group." + UNVERIFIED_GROUP));
            
            // Remove negative permission if present
            user.data().clear(node -> node.getKey().equals("auth.verified") && node instanceof PermissionNode && !((PermissionNode) node).getValue());
            
            // Save changes if anything changed
            if (changed) {
                luckPerms.getUserManager().saveUser(user);
                player.getServer().getLogger().info("[LuckPerms] Assigned verified role to " + player.getName() + " - granted auth.verified permission");
            }
            
        } catch (Exception e) {
            player.getServer().getLogger().severe("Error assigning verified role: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Check if player has verified permission
     */
    public static boolean isVerified(Player player) {
        if (Bukkit.getPluginManager().getPlugin("LuckPerms") == null) {
            return false;
        }
        
        try {
            LuckPerms luckPerms = LuckPermsProvider.get();
            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            
            if (user == null) {
                return false;
            }
            
            return user.getCachedData().getPermissionData().checkPermission(AUTH_VERIFIED_PERMISSION).asBoolean();
            
        } catch (Exception e) {
            return false;
        }
    }
}
