package com.webmcbridge;

import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.event.Listener;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.geysermc.floodgate.api.FloodgateApi;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class WebMCBridge extends JavaPlugin implements Listener {
    private static final String WS_URL = "ws://127.0.0.1:8081";
    private static final String HTTP_URL = "http://127.0.0.1:8081/chat";
    
    private HttpClient httpClient;
    private WebSocket webSocket;
    private Gson gson;
    private ScheduledExecutorService scheduler;
    private boolean isConnecting = false;

    @Override
    public void onEnable() {
        this.gson = new Gson();
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
        this.scheduler = Executors.newSingleThreadScheduledExecutor();
        
        getServer().getPluginManager().registerEvents(this, this);
        
        connectWebSocket();
        
        getLogger().info("WebMCBridge enabled!");
    }

    @Override
    public void onDisable() {
        if (webSocket != null) {
            webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "Plugin disabled");
        }
        if (scheduler != null) {
            scheduler.shutdown();
        }
        if (httpClient != null) {
            httpClient.close();
        }
        getLogger().info("WebMCBridge disabled!");
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerChat(AsyncPlayerChatEvent event) {
        String username = event.getPlayer().getName();
        String displayName = event.getPlayer().getDisplayName();
        String message = event.getMessage();
        
        // Check if player is from Bedrock via Floodgate
        if (FloodgateApi.getInstance().isFloodgatePlayer(event.getPlayer().getUniqueId())) {
            // Strip Floodgate prefix (.)
            if (username.startsWith(".")) {
                username = username.substring(1);
            }
            if (displayName.startsWith(".")) {
                displayName = displayName.substring(1);
            }
        }
        
        // Send to WebSocket server via HTTP POST
        sendChatToWebSocket(username, displayName, message);
    }

    private void sendChatToWebSocket(String username, String displayName, String message) {
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                JsonObject payload = new JsonObject();
                payload.addProperty("username", username);
                payload.addProperty("displayName", displayName);
                payload.add("roleSymbol", null);
                payload.add("roleColor", null);
                payload.addProperty("message", message);
                
                String jsonBody = gson.toJson(payload);
                
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(HTTP_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(5))
                    .build();
                
                httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        if (response.statusCode() != 200) {
                            getLogger().warning("Failed to send chat to WebSocket: HTTP " + response.statusCode());
                        }
                    })
                    .exceptionally(ex -> {
                        getLogger().warning("Error sending chat to WebSocket: " + ex.getMessage());
                        return null;
                    });
                    
            } catch (Exception e) {
                getLogger().warning("Error preparing chat message: " + e.getMessage());
            }
        });
    }

    private void connectWebSocket() {
        if (isConnecting) return;
        isConnecting = true;
        
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                getLogger().info("Connecting to WebSocket at " + WS_URL);
                
                WebSocket.Listener listener = new WebSocket.Listener() {
                    @Override
                    public void onOpen(WebSocket webSocket) {
                        getLogger().info("WebSocket connected!");
                        WebSocket.Listener.super.onOpen(webSocket);
                    }

                    @Override
                    public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                        handleWebSocketMessage(data.toString());
                        return WebSocket.Listener.super.onText(webSocket, data, last);
                    }

                    @Override
                    public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
                        getLogger().warning("WebSocket closed: " + reason + " (code: " + statusCode + ")");
                        scheduleReconnect();
                        return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
                    }

                    @Override
                    public void onError(WebSocket webSocket, Throwable error) {
                        getLogger().warning("WebSocket error: " + error.getMessage());
                        scheduleReconnect();
                        WebSocket.Listener.super.onError(webSocket, error);
                    }
                };

                webSocket = httpClient.newWebSocketBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .buildAsync(URI.create(WS_URL), listener)
                    .join();
                    
                isConnecting = false;
                
            } catch (Exception e) {
                getLogger().severe("Failed to connect to WebSocket: " + e.getMessage());
                isConnecting = false;
                scheduleReconnect();
            }
        });
    }

    private void handleWebSocketMessage(String message) {
        try {
            JsonObject json = gson.fromJson(message, JsonObject.class);
            
            if (json.has("type") && json.get("type").getAsString().equals("message")) {
                JsonObject data = json.getAsJsonObject("data");
                if (data.has("message")) {
                    String chatMessage = data.get("message").getAsString();
                    broadcastToMinecraft(chatMessage);
                }
            }
        } catch (Exception e) {
            getLogger().warning("Error parsing WebSocket message: " + e.getMessage());
        }
    }

    private void broadcastToMinecraft(String message) {
        // Must run on main thread
        Bukkit.getScheduler().runTask(this, () -> {
            Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "say " + message);
        });
    }

    private void scheduleReconnect() {
        scheduler.schedule(() -> {
            if (webSocket == null || !webSocket.isOutputClosed()) {
                connectWebSocket();
            }
        }, 5, TimeUnit.SECONDS);
    }
}
