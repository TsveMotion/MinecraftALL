package com.minecraftauth;

import com.minecraftauth.api.HttpApiServer;
import com.minecraftauth.commands.LinksCommand;
import com.minecraftauth.commands.LoginCommand;
import com.minecraftauth.commands.RegisterCommand;
import com.minecraftauth.commands.ReportCommand;
import com.minecraftauth.commands.AuthReloadCommand;
import com.minecraftauth.database.DatabaseManager;
import com.minecraftauth.listeners.PlayerFreezeListener;
import com.minecraftauth.listeners.PlayerJoinListener;
import com.minecraftauth.managers.VerificationManager;
import org.bukkit.plugin.java.JavaPlugin;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class MinecraftAuthPlugin extends JavaPlugin {
    
    private DatabaseManager databaseManager;
    private HttpApiServer httpApiServer;
    private VerificationManager verificationManager;
    private MinecraftRoles minecraftRoles;
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
        
        // Register commands
        getCommand("register").setExecutor(new RegisterCommand(this));
        getCommand("login").setExecutor(new LoginCommand(this));
        getCommand("report").setExecutor(new ReportCommand(this));
        getCommand("authreload").setExecutor(new AuthReloadCommand(this));
        getCommand("links").setExecutor(new LinksCommand(this));
        
        // Register event listeners
        getServer().getPluginManager().registerEvents(new PlayerJoinListener(this), this);
        getServer().getPluginManager().registerEvents(new PlayerFreezeListener(this), this);
        
        // Start HTTP API server
        httpApiServer = new HttpApiServer(this);
        httpApiServer.start();
        
        // Initialize MinecraftRoles system
        minecraftRoles = new MinecraftRoles(this);
        minecraftRoles.enable();
        
        getLogger().info("MinecraftAuth has been enabled!");
    }
    
    @Override
    public void onDisable() {
        if (minecraftRoles != null) {
            minecraftRoles.disable();
        }
        if (verificationManager != null) {
            verificationManager.shutdown();
        }
        if (httpApiServer != null) {
            httpApiServer.stop();
        }
        if (databaseManager != null) {
            databaseManager.close();
        }
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
    }
    
    public void removeAuthenticatedPlayer(UUID uuid, String name) {
        authenticatedPlayers.remove(uuid);
        authenticatedPlayerNames.remove(name);
    }
    
    public String getMessage(String key) {
        return colorize(getConfig().getString("messages." + key, "&cMessage not found: " + key));
    }
    
    public String colorize(String message) {
        return message.replace("&", "§");
    }
}
