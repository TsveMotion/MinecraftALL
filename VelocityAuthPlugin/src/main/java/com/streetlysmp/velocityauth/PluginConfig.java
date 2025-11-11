package com.streetlysmp.velocityauth;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

public class PluginConfig {

    private final Path dataDirectory;
    private final Path configFile;
    private Properties properties;

    private String lobbyServerName = "lobby";
    private String websiteUrl = "https://play.streetlymc.com/register";

    public PluginConfig(Path dataDirectory) {
        this.dataDirectory = dataDirectory;
        this.configFile = dataDirectory.resolve("config.properties");
        this.properties = new Properties();
    }

    public void loadConfig() {
        // Create data directory if it doesn't exist
        if (!Files.exists(dataDirectory)) {
            try {
                Files.createDirectories(dataDirectory);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        // Create default config if it doesn't exist
        if (!Files.exists(configFile)) {
            createDefaultConfig();
        }

        // Load config
        try (InputStream input = Files.newInputStream(configFile)) {
            properties.load(input);
            lobbyServerName = properties.getProperty("lobby-server-name", "lobby");
            websiteUrl = properties.getProperty("website-url", "https://play.streetlymc.com/register");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void createDefaultConfig() {
        properties.setProperty("lobby-server-name", "lobby");
        properties.setProperty("website-url", "https://play.streetlymc.com/register");

        try (OutputStream output = Files.newOutputStream(configFile)) {
            properties.store(output, "VelocityAuthPlugin Configuration\n" +
                    "lobby-server-name: The name of your lobby server (must match velocity.toml)\n" +
                    "website-url: URL where players register/login");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public String getLobbyServerName() {
        return lobbyServerName;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }
}
