package com.minecraftauth.database;

import com.minecraftauth.MinecraftAuthPlugin;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.UUID;

public class DatabaseManager {
    
    private final MinecraftAuthPlugin plugin;
    private HikariDataSource dataSource;
    
    public DatabaseManager(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
    }
    
    public boolean initialize() {
        try {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(String.format("jdbc:mysql://%s:%d/%s?useSSL=false&allowPublicKeyRetrieval=true",
                    plugin.getConfig().getString("database.host"),
                    plugin.getConfig().getInt("database.port"),
                    plugin.getConfig().getString("database.database")));
            config.setUsername(plugin.getConfig().getString("database.username"));
            config.setPassword(plugin.getConfig().getString("database.password"));
            config.setMaximumPoolSize(plugin.getConfig().getInt("database.pool-size", 10));
            config.setConnectionTimeout(30000);
            config.setLeakDetectionThreshold(60000);
            config.addDataSourceProperty("cachePrepStmts", "true");
            config.addDataSourceProperty("prepStmtCacheSize", "250");
            config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
            
            dataSource = new HikariDataSource(config);
            
            plugin.getLogger().info("Database connection established successfully!");
            return true;
        } catch (Exception e) {
            plugin.getLogger().severe("Failed to initialize database: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    public void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            plugin.getLogger().info("Database connection closed.");
        }
    }
    
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
    
    /**
     * Check if a player is registered and verified
     */
    public boolean isPlayerVerified(String minecraftUsername) {
        String query = "SELECT verified FROM users WHERE minecraft_username = ? AND verified = TRUE";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            ResultSet rs = stmt.executeQuery();
            
            return rs.next();
        } catch (SQLException e) {
            plugin.getLogger().severe("Error checking player verification: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if a player exists in the database (registered or not)
     */
    public boolean playerExists(String minecraftUsername) {
        String query = "SELECT id FROM users WHERE minecraft_username = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            ResultSet rs = stmt.executeQuery();
            
            return rs.next();
        } catch (SQLException e) {
            plugin.getLogger().severe("Error checking player existence: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Create a registration token for a player
     */
    public String createRegistrationToken(String minecraftUsername) {
        // Delete any existing tokens for this player
        deleteExistingTokens(minecraftUsername);
        
        // Generate new token
        String token = UUID.randomUUID().toString().replace("-", "");
        
        // Calculate expiry time
        int expiryMinutes = plugin.getConfig().getInt("registration.token-expiry-minutes", 30);
        Timestamp expiresAt = new Timestamp(System.currentTimeMillis() + (expiryMinutes * 60 * 1000));
        
        String query = "INSERT INTO registration_tokens (token, minecraft_username, expires_at) VALUES (?, ?, ?)";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, token);
            stmt.setString(2, minecraftUsername);
            stmt.setTimestamp(3, expiresAt);
            stmt.executeUpdate();
            
            return token;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error creating registration token: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Delete existing tokens for a player
     */
    private void deleteExistingTokens(String minecraftUsername) {
        String query = "DELETE FROM registration_tokens WHERE minecraft_username = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            stmt.executeUpdate();
        } catch (SQLException e) {
            plugin.getLogger().severe("Error deleting existing tokens: " + e.getMessage());
        }
    }
    
    /**
     * Verify login credentials (supports both password and PIN)
     */
    public boolean verifyLogin(String minecraftUsername, String password) {
        String query = "SELECT password_hash FROM users WHERE minecraft_username = ? AND verified = TRUE";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                String storedHash = rs.getString("password_hash");
                return BCrypt.checkpw(password, storedHash);
            }
            
            return false;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error verifying login: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Store or update a PIN for a player (used by Bedrock players)
     * 
     * @param minecraftUsername The player's Minecraft username
     * @param pin The 6-digit PIN to store
     * @return true if successful, false otherwise
     */
    public boolean storePIN(String minecraftUsername, String pin) {
        // Delete any existing PINs for this player
        deleteExistingPINs(minecraftUsername);
        
        // Calculate expiry time (30 minutes by default)
        int expiryMinutes = plugin.getConfig().getInt("registration.pin-expiry-minutes", 30);
        Timestamp expiresAt = new Timestamp(System.currentTimeMillis() + (expiryMinutes * 60 * 1000));
        
        String query = "INSERT INTO bedrock_pins (minecraft_username, pin, expires_at) VALUES (?, ?, ?)";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            stmt.setString(2, pin);
            stmt.setTimestamp(3, expiresAt);
            stmt.executeUpdate();
            
            return true;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error storing PIN: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Delete existing PINs for a player
     */
    private void deleteExistingPINs(String minecraftUsername) {
        String query = "DELETE FROM bedrock_pins WHERE minecraft_username = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            stmt.executeUpdate();
        } catch (SQLException e) {
            plugin.getLogger().severe("Error deleting existing PINs: " + e.getMessage());
        }
    }
    
    /**
     * Verify a PIN for Bedrock player authentication
     * This checks if the PIN is valid and not expired
     * 
     * @param pin The 6-digit PIN to verify
     * @return The minecraft username if PIN is valid, null otherwise
     */
    public String verifyPIN(String pin) {
        String query = "SELECT minecraft_username FROM bedrock_pins WHERE pin = ? AND expires_at > NOW()";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, pin);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getString("minecraft_username");
            }
            
            return null;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error verifying PIN: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Get a valid PIN for a player (if one exists and hasn't expired)
     * 
     * @param minecraftUsername The player's username
     * @return The PIN if valid, null otherwise
     */
    public String getValidPIN(String minecraftUsername) {
        String query = "SELECT pin FROM bedrock_pins WHERE minecraft_username = ? AND expires_at > NOW()";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return rs.getString("pin");
            }
            
            return null;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error getting PIN: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Delete a PIN after successful use
     * 
     * @param pin The PIN to delete
     */
    public void deletePIN(String pin) {
        String query = "DELETE FROM bedrock_pins WHERE pin = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, pin);
            stmt.executeUpdate();
        } catch (SQLException e) {
            plugin.getLogger().severe("Error deleting PIN: " + e.getMessage());
        }
    }
    
    /**
     * Clean up expired tokens (can be called periodically)
     */
    public void cleanupExpiredTokens() {
        String query = "DELETE FROM registration_tokens WHERE expires_at < NOW()";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            int deleted = stmt.executeUpdate();
            if (deleted > 0) {
                plugin.getLogger().info("Cleaned up " + deleted + " expired tokens.");
            }
        } catch (SQLException e) {
            plugin.getLogger().severe("Error cleaning up expired tokens: " + e.getMessage());
        }
    }
    
    /**
     * Clean up expired PINs (can be called periodically)
     */
    public void cleanupExpiredPINs() {
        String query = "DELETE FROM bedrock_pins WHERE expires_at < NOW()";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            int deleted = stmt.executeUpdate();
            if (deleted > 0) {
                plugin.getLogger().info("Cleaned up " + deleted + " expired PINs.");
            }
        } catch (SQLException e) {
            plugin.getLogger().severe("Error cleaning up expired PINs: " + e.getMessage());
        }
    }
    
    /**
     * Get player display information (real name, rank color, year group, and admin status)
     */
    public PlayerDisplayData getPlayerDisplayData(String minecraftUsername) {
        String query = "SELECT real_name, rank_color, year_group, is_admin FROM users WHERE minecraft_username = ? AND verified = TRUE";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                String realName = rs.getString("real_name");
                String rankColor = rs.getString("rank_color");
                int yearGroup = rs.getInt("year_group");
                boolean isAdmin = rs.getBoolean("is_admin");
                return new PlayerDisplayData(realName, rankColor, yearGroup, isAdmin);
            }
            
            return null;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error fetching player display data: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Check if player is banned
     */
    public BanInfo getActiveBan(String minecraftUsername) {
        String query = "SELECT reason, is_permanent, expires_at FROM bans WHERE minecraft_username = ? " +
                      "AND (is_permanent = TRUE OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 1";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, minecraftUsername);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                String reason = rs.getString("reason");
                boolean isPermanent = rs.getBoolean("is_permanent");
                Timestamp expiresAt = rs.getTimestamp("expires_at");
                return new BanInfo(reason, isPermanent, expiresAt);
            }
            
            return null;
        } catch (SQLException e) {
            plugin.getLogger().severe("Error checking ban status: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Create a report
     */
    public boolean createReport(String reporterUsername, String reportedUsername, String description) {
        // First get user IDs
        String getUserIdQuery = "SELECT id FROM users WHERE minecraft_username = ? AND verified = TRUE";
        String insertQuery = "INSERT INTO reports (reporter_id, reported_id, description) VALUES (?, ?, ?)";
        
        try (Connection conn = getConnection()) {
            // Get reporter ID
            int reporterId;
            try (PreparedStatement stmt = conn.prepareStatement(getUserIdQuery)) {
                stmt.setString(1, reporterUsername);
                ResultSet rs = stmt.executeQuery();
                if (!rs.next()) {
                    return false;
                }
                reporterId = rs.getInt("id");
            }
            
            // Get reported ID
            int reportedId;
            try (PreparedStatement stmt = conn.prepareStatement(getUserIdQuery)) {
                stmt.setString(1, reportedUsername);
                ResultSet rs = stmt.executeQuery();
                if (!rs.next()) {
                    return false;
                }
                reportedId = rs.getInt("id");
            }
            
            // Insert report
            try (PreparedStatement stmt = conn.prepareStatement(insertQuery)) {
                stmt.setInt(1, reporterId);
                stmt.setInt(2, reportedId);
                stmt.setString(3, description);
                stmt.executeUpdate();
                return true;
            }
        } catch (SQLException e) {
            plugin.getLogger().severe("Error creating report: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Helper class for player display data
     */
    public static class PlayerDisplayData {
        private final String realName;
        private final String rankColor;
        private final int yearGroup;
        private final boolean isAdmin;
        
        public PlayerDisplayData(String realName, String rankColor, int yearGroup, boolean isAdmin) {
            this.realName = realName;
            this.rankColor = rankColor;
            this.yearGroup = yearGroup;
            this.isAdmin = isAdmin;
        }
        
        public String getRealName() {
            return realName;
        }
        
        public String getRankColor() {
            return rankColor;
        }
        
        public int getYearGroup() {
            return yearGroup;
        }
        
        public boolean isAdmin() {
            return isAdmin;
        }
    }
    
    /**
     * Helper class for ban information
     */
    public static class BanInfo {
        private final String reason;
        private final boolean isPermanent;
        private final Timestamp expiresAt;
        
        public BanInfo(String reason, boolean isPermanent, Timestamp expiresAt) {
            this.reason = reason;
            this.isPermanent = isPermanent;
            this.expiresAt = expiresAt;
        }
        
        public String getReason() {
            return reason;
        }
        
        public boolean isPermanent() {
            return isPermanent;
        }
        
        public Timestamp getExpiresAt() {
            return expiresAt;
        }
    }
}
