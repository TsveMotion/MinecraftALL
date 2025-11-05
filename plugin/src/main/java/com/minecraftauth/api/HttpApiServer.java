package com.minecraftauth.api;

import com.minecraftauth.MinecraftAuthPlugin;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class HttpApiServer {
    
    private final MinecraftAuthPlugin plugin;
    private HttpServer server;
    private final String apiKey;
    
    public HttpApiServer(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
        this.apiKey = plugin.getConfig().getString("api.secret-key", "your-secret-key");
    }
    
    public void start() {
        try {
            int port = plugin.getConfig().getInt("api.port", 8080);
            server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/api/kick", new KickHandler());
            server.createContext("/api/ban", new BanHandler());
            server.setExecutor(Executors.newFixedThreadPool(2));
            server.start();
            plugin.getLogger().info("HTTP API server started on port " + port);
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to start HTTP API server: " + e.getMessage());
        }
    }
    
    public void stop() {
        if (server != null) {
            server.stop(0);
            plugin.getLogger().info("HTTP API server stopped");
        }
    }
    
    private boolean validateApiKey(HttpExchange exchange) {
        String providedKey = exchange.getRequestHeaders().getFirst("X-API-Key");
        return apiKey.equals(providedKey);
    }
    
    private String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    }
    
    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
    
    class KickHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }
            
            if (!validateApiKey(exchange)) {
                sendResponse(exchange, 401, "{\"error\": \"Unauthorized\"}");
                return;
            }
            
            try {
                String body = readRequestBody(exchange);
                String username = extractJsonValue(body, "username");
                
                if (username == null || username.isEmpty()) {
                    sendResponse(exchange, 400, "{\"error\": \"Username is required\"}");
                    return;
                }
                
                // Execute kick on main thread
                Bukkit.getScheduler().runTask(plugin, () -> {
                    Player player = Bukkit.getPlayer(username);
                    if (player != null) {
                        player.kick(Component.text("§c§lYou have been kicked by an administrator"));
                        plugin.getLogger().info("Player " + username + " was kicked via API");
                    }
                });
                
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Player kicked\"}");
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }
    }
    
    class BanHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
                return;
            }
            
            if (!validateApiKey(exchange)) {
                sendResponse(exchange, 401, "{\"error\": \"Unauthorized\"}");
                return;
            }
            
            try {
                String body = readRequestBody(exchange);
                String username = extractJsonValue(body, "username");
                String reason = extractJsonValue(body, "reason");
                
                if (username == null || username.isEmpty()) {
                    sendResponse(exchange, 400, "{\"error\": \"Username is required\"}");
                    return;
                }
                
                if (reason == null) {
                    reason = "Banned by administrator";
                }
                
                final String finalReason = reason;
                
                // Execute kick on main thread (ban is already in database)
                Bukkit.getScheduler().runTask(plugin, () -> {
                    Player player = Bukkit.getPlayer(username);
                    if (player != null) {
                        String kickMessage = "§c§lYou have been banned from this server!\n\n";
                        kickMessage += "§7Reason: §f" + finalReason;
                        player.kick(Component.text(kickMessage));
                        plugin.getLogger().info("Player " + username + " was banned via API");
                    }
                });
                
                sendResponse(exchange, 200, "{\"success\": true, \"message\": \"Player banned\"}");
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"" + e.getMessage() + "\"}");
            }
        }
    }
    
    /**
     * Simple JSON value extractor (for simple cases)
     */
    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int keyIndex = json.indexOf(searchKey);
        if (keyIndex == -1) return null;
        
        int colonIndex = json.indexOf(":", keyIndex);
        if (colonIndex == -1) return null;
        
        int startQuote = json.indexOf("\"", colonIndex);
        if (startQuote == -1) return null;
        
        int endQuote = json.indexOf("\"", startQuote + 1);
        if (endQuote == -1) return null;
        
        return json.substring(startQuote + 1, endQuote);
    }
}
