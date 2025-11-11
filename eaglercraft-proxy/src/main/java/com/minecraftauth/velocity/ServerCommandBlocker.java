package com.minecraftauth.velocity;

import com.google.inject.Inject;
import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.connection.PluginMessageEvent;
import com.velocitypowered.api.event.player.ServerConnectedEvent;
import com.velocitypowered.api.proxy.Player;
import com.velocitypowered.api.proxy.ProxyServer;
import com.velocitypowered.api.proxy.server.RegisteredServer;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class ServerCommandBlocker {
    private final ProxyServer server;
    private final Map<UUID, Boolean> authenticatedPlayers = new HashMap<>();

    @Inject
    public ServerCommandBlocker(ProxyServer server) {
        this.server = server;
    }

    @Subscribe
    public void onPluginMessage(PluginMessageEvent event) {
        if (!(event.getSource() instanceof Player)) return;
        
        Player player = (Player) event.getSource();
        String channel = event.getIdentifier().getId();

        if (channel.equals("BungeeCord") || channel.equals("bungeecord:main")) {
            try (DataInputStream in = new DataInputStream(new ByteArrayInputStream(event.getData()))) {
                String subChannel = in.readUTF();
                if (subChannel.equals("Connect") || subChannel.equals("ConnectOther")) {
                    if (!isAuthenticated(player.getUniqueId())) {
                        event.setResult(PluginMessageEvent.ForwardResult.handled());
                        player.sendMessage(Component.text("You must be logged in to change servers!")
                                .color(NamedTextColor.RED));
                    }
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @Subscribe
    public void onServerConnected(ServerConnectedEvent event) {
        // If player connects to the auth server, mark them as unauthenticated
        if (event.getServer().getServerInfo().getName().equalsIgnoreCase("auth")) {
            authenticatedPlayers.remove(event.getPlayer().getUniqueId());
        }
    }

    public void setAuthenticated(UUID playerId, boolean authenticated) {
        if (authenticated) {
            authenticatedPlayers.put(playerId, true);
        } else {
            authenticatedPlayers.remove(playerId);
        }
    }

    public boolean isAuthenticated(UUID playerId) {
        return authenticatedPlayers.getOrDefault(playerId, false);
    }
}
