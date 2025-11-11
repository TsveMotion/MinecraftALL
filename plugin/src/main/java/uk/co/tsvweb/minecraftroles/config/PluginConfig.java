package uk.co.tsvweb.minecraftroles.config;

import org.bukkit.configuration.file.FileConfiguration;
import uk.co.tsvweb.minecraftroles.MinecraftRoles;

public class PluginConfig {
    private final MinecraftRoles minecraftRoles;
    private String apiBaseUrl;
    private String apiKey;
    private int cacheSeconds;
    private String adminSymbol;
    private String adminColor;
    private boolean chatObfuscate;
    private String obfuscatePattern;
    private boolean reportEnabled;
    private boolean muteEnabled;

    public PluginConfig(MinecraftRoles minecraftRoles) {
        this.minecraftRoles = minecraftRoles;
    }

    public void load() {
        FileConfiguration config = minecraftRoles.getPlugin().getConfig();

        this.apiBaseUrl = config.getString("apiBaseUrl", "https://streetlymc.com");
        this.apiKey = config.getString("apiKey", "YOUR_API_KEY_HERE");
        this.cacheSeconds = config.getInt("cacheSeconds", 30);
        this.adminSymbol = config.getString("roleTag.admin.symbol", "◆");
        this.adminColor = config.getString("roleTag.admin.color", "#93C572");
        this.chatObfuscate = config.getBoolean("privacy.chatObfuscate", true);
        this.obfuscatePattern = config.getString("privacy.obfuscatePattern", "first3_ellipsis_last2");
        this.reportEnabled = config.getBoolean("report.enabled", true);
        this.muteEnabled = config.getBoolean("mute.enabled", true);

        if (apiKey.isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            minecraftRoles.getPlugin().getLogger().warning("API key is not configured! Role-based features will be limited.");
            minecraftRoles.getPlugin().getLogger().warning("Set 'apiKey' in config.yml to enable full functionality.");
        }
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public int getCacheSeconds() {
        return cacheSeconds;
    }

    public String getAdminSymbol() {
        return adminSymbol;
    }

    public String getAdminColor() {
        return adminColor;
    }

    public boolean isChatObfuscate() {
        return chatObfuscate;
    }

    public String getObfuscatePattern() {
        return obfuscatePattern;
    }

    public boolean isReportEnabled() {
        return reportEnabled;
    }

    public boolean isMuteEnabled() {
        return muteEnabled;
    }
}
