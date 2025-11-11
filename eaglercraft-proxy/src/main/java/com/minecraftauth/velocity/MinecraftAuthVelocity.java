package com.minecraftauth.velocity;

import com.google.inject.Inject;
import com.velocitypowered.api.event.proxy.ProxyInitializeEvent;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.plugin.Plugin;
import com.velocitypowered.api.proxy.ProxyServer;
import org.slf4j.Logger;

@Plugin(
    id = "minecraftauth",
    name = "MinecraftAuth",
    version = "1.0.0",
    authors = {"YourName"}
)
public class MinecraftAuthVelocity {
    private final ProxyServer server;
    private final Logger logger;
    private ServerCommandBlocker serverCommandBlocker;

    @Inject
    public MinecraftAuthVelocity(ProxyServer server, Logger logger) {
        this.server = server;
        this.logger = logger;
        logger.info("MinecraftAuth Velocity plugin has been enabled!");
    }

    @Subscribe
    public void onProxyInitialization(ProxyInitializeEvent event) {
        this.serverCommandBlocker = new ServerCommandBlocker(server);
        server.getEventManager().register(this, serverCommandBlocker);
    }

    public ServerCommandBlocker getServerCommandBlocker() {
        return serverCommandBlocker;
    }
}
