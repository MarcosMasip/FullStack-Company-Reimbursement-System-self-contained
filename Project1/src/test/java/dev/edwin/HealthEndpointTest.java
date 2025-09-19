package dev.edwin;

import dev.edwin.app.App;
import org.junit.jupiter.api.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class HealthEndpointTest {

    private static Process proc;

    @BeforeAll
    static void startApp() throws Exception {
        System.setProperty("DB_MODE","EMBEDDED");
        // Start the main app in a separate JVM process to avoid port conflicts if tests run in parallel.
        ProcessBuilder pb = new ProcessBuilder("java","-DB_MODE=EMBEDDED","-cp","target/test-classes:target/classes:target/Project1-0.0.1-SNAPSHOT-shaded.jar","dev.edwin.app.App");
        pb.redirectErrorStream(true);
        proc = pb.start();
        // Simple wait loop for health readiness
        long start = System.currentTimeMillis();
        boolean up = false;
        while (System.currentTimeMillis() - start < 10000) {
            try {
                URL url = new URL("http://localhost:7070/health");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(500);
                conn.setReadTimeout(500);
                if (conn.getResponseCode() == 200) { up = true; break; }
            } catch (Exception ignored) { }
            Thread.sleep(300);
        }
        if(!up) {
            throw new IllegalStateException("App did not become healthy in time");
        }
    }

    @AfterAll
    static void stopApp() {
        if (proc != null) proc.destroy();
    }

    @Test
    void healthReturnsUp() throws Exception {
        URL url = new URL("http://localhost:7070/health");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        Assertions.assertEquals(200, conn.getResponseCode());
        try(BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
            String body = br.readLine();
            Assertions.assertTrue(body.contains("UP"));
        }
    }
}
