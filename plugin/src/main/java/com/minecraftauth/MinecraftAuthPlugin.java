package com.minecraftauth;

import com.google.common.io.ByteArrayDataInput;
import com.google.common.io.ByteStreams;
import com.minecraftauth.api.HttpApiServer;
import com.minecraftauth.commands.LinksCommand;
import com.minecraftauth.commands.LoginCommand;
import com.minecraftauth.commands.RegisterCommand;
import com.minecraftauth.commands.ReportCommand;
import com.minecraftauth.commands.AuthReloadCommand;
import com.minecraftauth.commands.TestRoleCommand;
import com.minecraftauth.database.DatabaseManager;
import com.minecraftauth.listeners.PlayerFreezeListener;
import com.minecraftauth.listeners.PlayerJoinListener;
import com.minecraftauth.managers.VerificationManager;
import com.minecraftauth.proxy.ProxyMessenger;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.plugin.messaging.PluginMessageListener;
import org.jetbrains.annotations.NotNull;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class MinecraftAuthPlugin extends JavaPlugin {
    
    private DatabaseManager databaseManager;
    private HttpApiServer httpApiServer;
    private VerificationManager verificationManager;
    private ProxyMessenger proxyMessenger;
    private final Set<UUID> authenticatedPlayers = new HashSet<>();
    private final Set<String> authenticatedPlayerNames = new HashSet<>();
    
    @Override
    public void onEnable() {
        // Save default config
        saveDefaultConfig();
        
        // Initialize database
        databaseManager = new DatabaseManager(this);
        if (!databaseManager.initialize()) {
            getLogger().severe("Failed to initialize database! Disabling plugin...");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }
        
        // Initialize verification manager
        verificationManager = new VerificationManager(this);
        
        // Initialize proxy messenger
        this.proxyMessenger = new ProxyMessenger(this);
        
        // Register BungeeCord channel for Velocity communication
        getServer().getMessenger().registerOutgoingPluginChannel(this, "BungeeCord");
        getServer().getMessenger().registerIncomingPluginChannel(this, "BungeeCord", (channel, player, message) -> {
            // Handle incoming messages from Velocity if needed
        });
        
        // Register commands
        getCommand("register").setExecutor(new RegisterCommand(this));
        getCommand("login").setExecutor(new LoginCommand(this));
        getCommand("report").setExecutor(new ReportCommand(this));
        getCommand("authreload").setExecutor(new AuthReloadCommand(this));
        getCommand("links").setExecutor(new LinksCommand(this));
        getCommand("testrole").setExecutor(new TestRoleCommand(this));
        
        // Register event listeners
        getServer().getPluginManager().registerEvents(new PlayerJoinListener(this), this);
        getServer().getPluginManager().registerEvents(new PlayerFreezeListener(this), this);
        
        // Start HTTP API server
        httpApiServer = new HttpApiServer(this);
        httpApiServer.start();
        
        getLogger().info("MinecraftAuth has been enabled! (Proxy Mode)");
    }
    
    @Override
    public void onDisable() {
        if (verificationManager != null) {
            verificationManager.shutdown();
        }
        if (httpApiServer != null) {
            httpApiServer.stop();
        }
        if (proxyMessenger != null) {
            proxyMessenger.cleanup();
        }
        if (databaseManager != null) {
            databaseManager.close();
        }
        
        // Unregister plugin channels
        getServer().getMessenger().unregisterOutgoingPluginChannel(this);
        getServer().getMessenger().unregisterIncomingPluginChannel(this);
        
        authenticatedPlayers.clear();
        authenticatedPlayerNames.clear();
        getLogger().info("MinecraftAuth has been disabled!");
    }
    
    public DatabaseManager getDatabaseManager() {
        return databaseManager;
    }
    
    public VerificationManager getVerificationManager() {
        return verificationManager;
    }
    
    public Set<UUID> getAuthenticatedPlayers() {
        return authenticatedPlayers;
    }
    
    public Set<String> getAuthenticatedPlayerNames() {
        return authenticatedPlayerNames;
    }
    
    public boolean isAuthenticated(UUID uuid) {
        return authenticatedPlayers.contains(uuid);
    }
    
    public void addAuthenticatedPlayer(UUID uuid, String name) {
        authenticatedPlayers.add(uuid);
        authenticatedPlayerNames.add(name);
        
        // Notify the proxy about the authentication
        Player player = getServer().getPlayer(uuid);
        if (player != null && player.isOnline()) {
            proxyMessenger.setAuthenticated(player, true);
        }
    }
    
    public void removeAuthenticatedPlayer(UUID uuid, String name) {
        authenticatedPlayers.remove(uuid);
        authenticatedPlayerNames.remove(name);
        
        // Notify the proxy about the deauthentication
        Player player = getServer().getPlayer(uuid);
        if (player != null && player.isOnline()) {
            proxyMessenger.setAuthenticated(player, false);
        }
    }
    
    public String getMessage(String key) {
        return colorize(getConfig().getString("messages." + key, "&cMessage not found: " + key));
    }
    
    public String colorize(String message) {
        return message.replace("&", "§");
    }
}
