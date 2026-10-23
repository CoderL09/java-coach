package dev.trace;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ExerciseCatalogTest {

  @TempDir
  Path root;

  @Test
  void everyJavaReferenceCompilesAndPassesActualInputs() throws Exception {
    var json = new ObjectMapper();
    JsonNode catalog;
    try (var in = getClass().getResourceAsStream("/exercises.json")) {
      catalog = json.readTree(in);
    }
    for (var spec : catalog) {
      if (!spec.path("solution").has("java")) continue;
      Path dir = Files.createDirectories(
        root.resolve(spec.path("id").asText())
      );
      Path source = dir.resolve("Main.java");
      Files.writeString(
        source,
        ExerciseController.wrap(
          spec,
          "java",
          spec.path("solution").path("java").asText(),
          "CHECK:"
        )
      );
      var diagnostics = new java.io.ByteArrayOutputStream();
      int compiled = ToolProvider.getSystemJavaCompiler().run(
        null,
        diagnostics,
        diagnostics,
        "--release",
        "21",
        "-encoding",
        "UTF-8",
        "-d",
        dir.toString(),
        source.toString()
      );
      assertEquals(0, compiled, spec.path("id").asText() + " " + diagnostics);
      var process = new ProcessBuilder(
        Path.of(System.getProperty("java.home"), "bin", "java.exe").toString(),
        "-Dfile.encoding=UTF-8",
        "-Dstdout.encoding=UTF-8",
        "-Dstderr.encoding=UTF-8",
        "-cp",
        dir.toString(),
        "Main"
      )
        .redirectErrorStream(true)
        .start();
      assertTrue(process.waitFor(10, TimeUnit.SECONDS));
      var lines = new String(
        process.getInputStream().readAllBytes(),
        java.nio.charset.StandardCharsets.UTF_8
      )
        .lines()
        .filter(l -> l.startsWith("CHECK:"))
        .toList();
      assertEquals(spec.path("cases").size(), lines.size());
      for (int i = 0; i < lines.size(); i++) assertEquals(
        spec.path("cases").get(i).path("expected"),
        json.readTree(lines.get(i).substring(6)),
        spec.path("id").asText() + " #" + i
      );
    }
  }

  @Test
  void catalogReadDoesNotMutateTrustedTestCalls() throws Exception {
    var controller = new ExerciseController(null, null, new ObjectMapper());
    controller.list();
    controller.list();
    assertEquals(
      "solve(3,8)",
      controller.find("ticket-total").path("cases").get(0).path("java").asText()
    );
  }
}
