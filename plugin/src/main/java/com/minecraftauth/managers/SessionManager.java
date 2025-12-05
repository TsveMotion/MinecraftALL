package com.minecraftauth.managers;

import com.google.common.io.ByteArrayDataInput;
import com.google.common.io.ByteArrayDataOutput;
import com.google.common.io.ByteStreams;
import com.minecraftauth.MinecraftAuthPlugin;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.messaging.PluginMessageListener;
import org.jetbrains.annotations.NotNull;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages authenticated sessions across servers using Velocity messaging.
 * This ensures players don't need to re-login when switching between Lobby and Survival.
 */
public class SessionManager implements PluginMessageListener {
    
    private final MinecraftAuthPlugin plugin;
    private final Map<UUID, AuthSession> sessionCache;
    private static final String CHANNEL = "minecraftauth:session";
    
    public SessionManager(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
        this.sessionCache = new ConcurrentHashMap<>();
        
        // Register plugin messaging channel
        plugin.getServer().getMessenger().registerOutgoingPluginChannel(plugin, CHANNEL);
        plugin.getServer().getMessenger().registerIncomingPluginChannel(plugin, CHANNEL, this);
    }
    
    /**
     * Check if a player has an active authenticated session
     */
    public boolean hasActiveSession(UUID playerId) {
        AuthSession session = sessionCache.get(playerId);
        if (session == null) {
            return false;
        }
        
        // Check if session is still valid (hasn't expired)
        if (session.isExpired()) {
            sessionCache.remove(playerId);
            return false;
        }
        
        return session.isVerified();
    }
    
    /**
     * Create a new authenticated session for a player
     */
    public void createSession(Player player, String username) {
        UUID playerId = player.getUniqueId();
        AuthSession session = new AuthSession(playerId, username, true);
        sessionCache.put(playerId, session);
        
        // Broadcast session to all backend servers via Velocity
        broadcastSession(player, true);
        
        plugin.getLogger().info("[SessionManager] Created authenticated session for " + username + " (UUID: " + playerId + ")");
    }
    
    /**
     * Invalidate a player's session (on logout/disconnect)
     */
    public void invalidateSession(UUID playerId, String username) {
        sessionCache.remove(playerId);
        plugin.getLogger().info("[SessionManager] Invalidated session for " + username);
    }
    
    /**
     * Broadcast session state to all servers via Velocity messaging
     */
    private void broadcastSession(Player player, boolean verified) {
        if (!player.isOnline()) {
            return;
        }
        
        try {
            ByteArrayDataOutput out = ByteStreams.newDataOutput();
            out.writeUTF("SessionUpdate");
            out.writeUTF(player.getUniqueId().toString());
            out.writeUTF(player.getName());
            out.writeBoolean(verified);
            out.writeLong(System.currentTimeMillis());
            
            player.sendPluginMessage(plugin, CHANNEL, out.toByteArray());
        } catch (Exception e) {
            plugin.getLogger().warning("[SessionManager] Failed to broadcast session for " + player.getName() + ": " + e.getMessage());
        }
    }
    
    /**
     * Handle incoming plugin messages from Velocity/other servers
     */
    @Override
    public void onPluginMessageReceived(@NotNull String channel, @NotNull Player player, byte[] message) {
        if (!channel.equals(CHANNEL)) {
            return;
        }
        
        try {
            ByteArrayDataInput in = ByteStreams.newDataInput(message);
            String type = in.readUTF();
            
            if (type.equals("SessionUpdate")) {
                UUID playerId = UUID.fromString(in.readUTF());
                String username = in.readUTF();
                boolean verified = in.readBoolean();
                long timestamp = in.readLong();
                
                // Update session cache
                if (verified) {
                    AuthSession session = new AuthSession(playerId, username, true);
                    session.setTimestamp(timestamp);
                    sessionCache.put(playerId, session);
                    plugin.getLogger().info("[SessionManager] Received session update for " + username + " - verified: " + verified);
                } else {
                    sessionCache.remove(playerId);
                }
            }
        } catch (Exception e) {
            plugin.getLogger().warning("[SessionManager] Error processing plugin message: " + e.getMessage());
        }
    }
    
    /**
     * Get session info for debugging
     */
    public String getSessionInfo(UUID playerId) {
        AuthSession session = sessionCache.get(playerId);
        if (session == null) {
            return "No active session";
        }
        return session.toString();
    }
    
    /**
     * Clear all sessions (for reload)
     */
    public void clearAllSessions() {
        sessionCache.clear();
        plugin.getLogger().info("[SessionManager] Cleared all sessions");
    }
    
    /**
     * Inner class representing an authenticated session
     */
    private static class AuthSession {
        private final UUID playerId;
        private final String username;
        private final boolean verified;
        private long timestamp;
        private static final long SESSION_TIMEOUT = 3600000; // 1 hour
        
        public AuthSession(UUID playerId, String username, boolean verified) {
            this.playerId = playerId;
            this.username = username;
            this.verified = verified;
            this.timestamp = System.currentTimeMillis();
        }
        
        public boolean isVerified() {
            return verified;
        }
        
        public boolean isExpired() {
            return (System.currentTimeMillis() - timestamp) > SESSION_TIMEOUT;
        }
        
        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
        
        @Override
        public String toString() {
            long age = (System.currentTimeMillis() - timestamp) / 1000;
            return "Session[" + username + ", verified=" + verified + ", age=" + age + "s]";
        }
    }
}
