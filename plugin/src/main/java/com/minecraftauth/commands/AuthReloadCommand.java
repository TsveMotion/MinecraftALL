package com.minecraftauth.commands;

import com.minecraftauth.MinecraftAuthPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.jetbrains.annotations.NotNull;

public class AuthReloadCommand implements CommandExecutor {
    
    private final MinecraftAuthPlugin plugin;
    
    public AuthReloadCommand(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!sender.hasPermission("minecraftauth.admin")) {
            sender.sendMessage(Component.text("You don't have permission to use this command.")
                    .color(NamedTextColor.RED));
            return true;
        }
        
        // Reload configuration
        plugin.reloadConfig();
        sender.sendMessage(plugin.getMessage("config-reloaded"));
        plugin.getLogger().info("Configuration reloaded by " + sender.getName());
        
        return true;
    }
}
