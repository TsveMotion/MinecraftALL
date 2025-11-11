package com.minecraftauth.proxy;

import com.google.common.io.ByteArrayDataOutput;
import com.google.common.io.ByteStreams;
import com.minecraftauth.MinecraftAuthPlugin;
import org.bukkit.entity.Player;

public class ProxyMessenger {
    private final MinecraftAuthPlugin plugin;
    private static final String CHANNEL = "minecraftauth:main";

    public ProxyMessenger(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
        // Register the plugin channel
        plugin.getServer().getMessenger().registerOutgoingPluginChannel(plugin, CHANNEL);
    }

    public void setAuthenticated(Player player, boolean authenticated) {
        ByteArrayDataOutput out = ByteStreams.newDataOutput();
        out.writeUTF("SetAuthenticated");
        out.writeUTF(player.getUniqueId().toString());
        out.writeBoolean(authenticated);
        
        player.sendPluginMessage(plugin, CHANNEL, out.toByteArray());
    }

    public void cleanup() {
        plugin.getServer().getMessenger().unregisterOutgoingPluginChannel(plugin, CHANNEL);
    }
}
