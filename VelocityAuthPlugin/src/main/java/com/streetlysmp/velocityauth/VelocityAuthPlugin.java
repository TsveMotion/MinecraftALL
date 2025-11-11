package com.streetlysmp.velocityauth;

import com.google.inject.Inject;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.proxy.ProxyInitializeEvent;
import com.velocitypowered.api.plugin.Dependency;
import com.velocitypowered.api.plugin.Plugin;
import com.velocitypowered.api.plugin.annotation.DataDirectory;
import com.velocitypowered.api.proxy.ProxyServer;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import org.slf4j.Logger;

import java.nio.file.Path;

@Plugin(
    id = "velocityauthplugin",
    name = "VelocityAuthPlugin",
    version = "1.0.0",
    description = "Authentication plugin that restricts unverified players to lobby",
    authors = {"StreetlySMP"},
    dependencies = {@Dependency(id = "luckperms")}
)
public class VelocityAuthPlugin {

    private final ProxyServer server;
    private final Logger logger;
    private final Path dataDirectory;
    private LuckPerms luckPerms;
    private PluginConfig config;

    @Inject
    public VelocityAuthPlugin(ProxyServer server, Logger logger, @DataDirectory Path dataDirectory) {
        this.server = server;
        this.logger = logger;
        this.dataDirectory = dataDirectory;
    }

    @Subscribe
    public void onProxyInitialization(ProxyInitializeEvent event) {
        logger.info("VelocityAuthPlugin is initializing...");

        // Load LuckPerms API
        try {
            luckPerms = LuckPermsProvider.get();
            logger.info("LuckPerms API loaded successfully!");
        } catch (IllegalStateException e) {
            logger.error("LuckPerms is not loaded! This plugin requires LuckPerms to function.");
            return;
        }

        // Load configuration
        config = new PluginConfig(dataDirectory);
        config.loadConfig();

        // Register event listeners
        server.getEventManager().register(this, new ServerSwitchListener(server, luckPerms, config, logger));

        logger.info("VelocityAuthPlugin has been enabled successfully!");
        logger.info("Unverified players will be restricted to: " + config.getLobbyServerName());
        logger.info("Website URL: " + config.getWebsiteUrl());
    }

    public ProxyServer getServer() {
        return server;
    }

    public Logger getLogger() {
        return logger;
    }

    public LuckPerms getLuckPerms() {
        return luckPerms;
    }

    public PluginConfig getConfig() {
        return config;
    }
}
