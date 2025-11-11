package com.streetlysmp.velocityauth;

import com.velocitypowered.api.event.Subscribe;
import com.velocitypowered.api.event.command.CommandExecuteEvent;
import com.velocitypowered.api.event.player.ServerPreConnectEvent;
import com.velocitypowered.api.proxy.Player;
import com.velocitypowered.api.proxy.ProxyServer;
import com.velocitypowered.api.proxy.server.RegisteredServer;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import org.slf4j.Logger;

import java.util.Optional;

public class ServerSwitchListener {

    private final ProxyServer server;
    private final LuckPerms luckPerms;
    private final PluginConfig config;
    private final Logger logger;

    public ServerSwitchListener(ProxyServer server, LuckPerms luckPerms, PluginConfig config, Logger logger) {
        this.server = server;
        this.luckPerms = luckPerms;
        this.config = config;
        this.logger = logger;
    }

    @Subscribe
    public void onServerPreConnect(ServerPreConnectEvent event) {
        Player player = event.getPlayer();
        RegisteredServer targetServer = event.getResult().getServer().orElse(null);

        if (targetServer == null) {
            return;
        }

        // Allow connection to lobby server always
        if (targetServer.getServerInfo().getName().equalsIgnoreCase(config.getLobbyServerName())) {
            return;
        }

        // Check if player has verified permission
        if (!hasVerifiedPermission(player)) {
            // Block the connection
            event.setResult(ServerPreConnectEvent.ServerResult.denied());
            
            // Send friendly message
            sendVerificationMessage(player);
            
            logger.info("Blocked unverified player " + player.getUsername() + " from joining " + targetServer.getServerInfo().getName());
        }
    }

    @Subscribe
    public void onCommandExecute(CommandExecuteEvent event) {
        if (!(event.getCommandSource() instanceof Player)) {
            return;
        }

        Player player = (Player) event.getCommandSource();
        String command = event.getCommand().toLowerCase();

        // Block /server command for unverified players (except to lobby)
        if (command.startsWith("server ") || command.equals("server")) {
            if (!hasVerifiedPermission(player)) {
                String[] parts = command.split(" ", 2);
                
                // Allow /server lobby or /server <lobby-name>
                if (parts.length > 1 && parts[1].equalsIgnoreCase(config.getLobbyServerName())) {
                    return;
                }
                
                // Block the command
                event.setResult(CommandExecuteEvent.CommandResult.denied());
                sendVerificationMessage(player);
                
                logger.info("Blocked unverified player " + player.getUsername() + " from using /server command");
            }
        }
    }

    private boolean hasVerifiedPermission(Player player) {
        User user = luckPerms.getUserManager().getUser(player.getUniqueId());
        
        if (user == null) {
            logger.warn("Could not load LuckPerms user data for " + player.getUsername());
            return false;
        }

        // Check for auth.verified permission
        return user.getCachedData().getPermissionData().checkPermission("auth.verified").asBoolean();
    }

    private void sendVerificationMessage(Player player) {
        player.sendMessage(Component.empty());
        player.sendMessage(
            Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY)
        );
        player.sendMessage(Component.empty());
        player.sendMessage(
            Component.text("⚠ Account Not Verified", NamedTextColor.RED, TextDecoration.BOLD)
        );
        player.sendMessage(Component.empty());
        player.sendMessage(
            Component.text("You must verify your account before accessing other servers.", NamedTextColor.GRAY)
        );
        player.sendMessage(Component.empty());
        player.sendMessage(
            Component.text("Please register/login at:", NamedTextColor.YELLOW)
        );
        player.sendMessage(
            Component.text("➜ " + config.getWebsiteUrl(), NamedTextColor.AQUA, TextDecoration.UNDERLINED)
        );
        player.sendMessage(Component.empty());
        player.sendMessage(
            Component.text("After verifying, you'll have full access to:", NamedTextColor.GRAY)
        );
        player.sendMessage(
            Component.text("  • Survival Server", NamedTextColor.GREEN)
        );
        player.sendMessage(
            Component.text("  • All Server Commands", NamedTextColor.GREEN)
        );
        player.sendMessage(
            Component.text("  • Full Gameplay Features", NamedTextColor.GREEN)
        );
        player.sendMessage(Component.empty());
        player.sendMessage(
            Component.text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
                .color(NamedTextColor.DARK_GRAY)
        );
        player.sendMessage(Component.empty());
    }
}
