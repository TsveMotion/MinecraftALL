package com.minecraftauth.listeners;

import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerCommandPreprocessEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerMoveEvent;

public class PlayerFreezeListener implements Listener {
    
    private final MinecraftAuthPlugin plugin;
    
    public PlayerFreezeListener(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onPlayerMove(PlayerMoveEvent event) {
        Player player = event.getPlayer();
        
        // Allow movement if player is authenticated
        if (plugin.isAuthenticated(player.getUniqueId())) {
            return;
        }
        
        // Check if player moved (not just head turn)
        if (event.getFrom().getX() != event.getTo().getX() ||
            event.getFrom().getY() != event.getTo().getY() ||
            event.getFrom().getZ() != event.getTo().getZ()) {
            
            event.setCancelled(true);
            
            // Send reminder message (throttled to avoid spam)
            if (player.getTicksLived() % 100 == 0) {
                if (plugin.getDatabaseManager().isPlayerVerified(player.getName())) {
                    player.sendMessage(Component.text("Please login first! Use /login <password>")
                            .color(NamedTextColor.YELLOW));
                } else {
                    player.sendMessage(Component.text("Please register first! Use /register")
                            .color(NamedTextColor.YELLOW));
                }
            }
        }
    }
    
    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onPlayerChat(AsyncPlayerChatEvent event) {
        Player player = event.getPlayer();
        
        // Allow chat if player is authenticated
        if (plugin.isAuthenticated(player.getUniqueId())) {
            return;
        }
        
        // Block chat
        event.setCancelled(true);
        
        if (plugin.getDatabaseManager().isPlayerVerified(player.getName())) {
            player.sendMessage(Component.text("You must login before chatting! Use /login <password>")
                    .color(NamedTextColor.RED));
        } else {
            player.sendMessage(Component.text("You must register before chatting! Use /register")
                    .color(NamedTextColor.RED));
        }
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onPlayerInteract(PlayerInteractEvent event) {
        Player player = event.getPlayer();
        
        // Allow interactions if player is authenticated
        if (plugin.isAuthenticated(player.getUniqueId())) {
            return;
        }
        
        // Block interactions
        event.setCancelled(true);
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onPlayerCommand(PlayerCommandPreprocessEvent event) {
        Player player = event.getPlayer();
        String command = event.getMessage().toLowerCase();
        
        // Allow authentication commands even if not authenticated
        if (command.startsWith("/register") || 
            command.startsWith("/login") || 
            command.startsWith("/authreload")) {
            return;
        }
        
        // Allow commands if player is authenticated
        if (plugin.isAuthenticated(player.getUniqueId())) {
            return;
        }
        
        // Block all other commands
        event.setCancelled(true);
        
        if (plugin.getDatabaseManager().isPlayerVerified(player.getName())) {
            player.sendMessage(Component.text("You must login first! Use /login <password>")
                    .color(NamedTextColor.RED));
        } else {
            player.sendMessage(Component.text("You must register first! Use /register")
                    .color(NamedTextColor.RED));
        }
    }
    
    @EventHandler(priority = EventPriority.HIGHEST)
    public void onEntityDamage(EntityDamageEvent event) {
        // Prevent unauthenticated players from taking damage (especially void damage)
        if (!(event.getEntity() instanceof Player player)) {
            return;
        }
        
        // Allow damage if player is authenticated
        if (plugin.isAuthenticated(player.getUniqueId())) {
            return;
        }
        
        // Cancel damage for unauthenticated players
        event.setCancelled(true);
    }
}
