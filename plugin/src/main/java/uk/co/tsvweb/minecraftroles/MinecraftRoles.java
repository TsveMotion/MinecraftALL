package uk.co.tsvweb.minecraftroles;

import org.bukkit.plugin.java.JavaPlugin;
import uk.co.tsvweb.minecraftroles.api.WebAPIClient;
import uk.co.tsvweb.minecraftroles.commands.MuteCommand;
import uk.co.tsvweb.minecraftroles.commands.ReportCommand;
import uk.co.tsvweb.minecraftroles.config.PluginConfig;
import uk.co.tsvweb.minecraftroles.listeners.ChatListener;
import uk.co.tsvweb.minecraftroles.listeners.JoinListener;

/**
 * MinecraftRoles Manager - Handles role-based chat features and mute status
 * This is initialized by MinecraftAuthPlugin
 */
public final class MinecraftRoles {

    private final JavaPlugin plugin;
    private PluginConfig pluginConfig;
    private WebAPIClient webAPIClient;

    public MinecraftRoles(JavaPlugin plugin) {
        this.plugin = plugin;
    }

    public void enable() {
        // Load configuration
        pluginConfig = new PluginConfig(this);
        pluginConfig.load();

        // Initialize API client
        webAPIClient = new WebAPIClient(this);

        // Register listeners
        plugin.getServer().getPluginManager().registerEvents(new ChatListener(this), plugin);
        plugin.getServer().getPluginManager().registerEvents(new JoinListener(this), plugin);

        // Register commands
        if (pluginConfig.isReportEnabled()) {
            plugin.getCommand("report").setExecutor(new ReportCommand(this));
        }

        if (pluginConfig.isMuteEnabled()) {
            plugin.getCommand("mute").setExecutor(new MuteCommand(this));
        }

        plugin.getLogger().info("MinecraftRoles system enabled!");
        plugin.getLogger().info("API Base URL: " + pluginConfig.getApiBaseUrl());
        plugin.getLogger().info("Chat obfuscation: " + (pluginConfig.isChatObfuscate() ? "enabled" : "disabled"));
    }

    public void disable() {
        plugin.getLogger().info("MinecraftRoles system disabled!");
    }

    public PluginConfig getPluginConfig() {
        return pluginConfig;
    }

    public WebAPIClient getWebAPIClient() {
        return webAPIClient;
    }
    
    public JavaPlugin getPlugin() {
        return plugin;
    }
}
