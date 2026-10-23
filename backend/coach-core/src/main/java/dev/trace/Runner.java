package dev.trace;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** User code only enters an ephemeral, networkless Docker container. Never executes on the host JVM. */
@Service
class Runner {

  final boolean enabled;
  final Path root;
  final Semaphore slots = new Semaphore(2);

  Runner(
    @Value("${trace.runner-enabled}") boolean enabled,
    @Value("${trace.runtime}") String runtime
  ) {
    this.enabled = enabled;
    this.root = Path.of(runtime).toAbsolutePath().normalize().resolve("runs");
  }

  record Result(
    int exitCode,
    String stdout,
    String stderr,
    boolean timedOut,
    boolean truncated,
    long elapsedMs,
    String environment
  ) {}

  Result run(String language, String source, String stdin) {
    return run(language, source, stdin, false);
  }

  Result traceJava(String source) {
    return run("java", source, "", true);
  }

  Result traceJavaScript(String source) {
    return run("javascript", source, "", true);
  }

  private Result run(
    String language,
    String source,
    String stdin,
    boolean tracing
  ) {
    if (!enabled) throw new ResponseStatusException(
      HttpStatus.SERVICE_UNAVAILABLE,
      "执行环境未启动，请先完成本机配置"
    );
    if (
      !Set.of("java", "javascript").contains(language)
    ) throw new IllegalArgumentException("当前支持 Java 与 JavaScript");
    if (
      source == null ||
      source.isBlank() ||
      source.length() > 30000 ||
      stdin == null ||
      stdin.length() > 4000
    ) throw new IllegalArgumentException(
      "代码最多 30000 字符，输入最多 4000 字符"
    );
    if (!slots.tryAcquire()) throw new ResponseStatusException(
      HttpStatus.TOO_MANY_REQUESTS,
      "执行位置已满，请稍后重试"
    );
    String name = "trace-run-" + UUID.randomUUID();
    Path dir = root.resolve(name);
    Process process = null;
    long start = System.nanoTime();
    try {
      Files.createDirectories(dir);
      Files.writeString(
        dir.resolve(language.equals("java") ? "Main.java" : "main.js"),
        source,
        StandardCharsets.UTF_8
      );
      if (tracing && language.equals("java")) for (String suffix : List.of(
        "",
        "$Capture"
      )) {
        try (
          var driver = Runner.class.getResourceAsStream(
            "/dev/trace/worker/TraceDriver" + suffix + ".class"
          )
        ) {
          if (driver == null) throw new IOException(
            "Missing precompiled trace driver"
          );
          Files.write(
            dir.resolve("TraceDriver" + suffix + ".class"),
            driver.readAllBytes()
          );
        }
      }
      if (tracing && language.equals("javascript")) {
        try (
          var driver = Runner.class.getResourceAsStream(
            "/tracing/trace-driver.cjs"
          )
        ) {
          if (driver == null) throw new IOException(
            "Missing JavaScript inspector driver"
          );
          Files.write(dir.resolve("trace-driver.cjs"), driver.readAllBytes());
        }
      }
      List<String> command = new ArrayList<>(
        List.of(
          "docker",
          "run",
          "--rm",
          "-i",
          "--name",
          name,
          "--network",
          "none",
          "--read-only",
          "--cap-drop",
          "ALL",
          "--security-opt",
          "no-new-privileges:true",
          "--memory",
          "256m",
          "--cpus",
          "1",
          "--pids-limit",
          "64",
          "--user",
          "65534:65534",
          "--tmpfs",
          "/tmp:rw,nosuid,noexec,size=96m,mode=1777",
          "--mount",
          "type=bind,source=" + dir + ",target=/work,readonly",
          "--workdir",
          "/work"
        )
      );
      if (language.equals("java")) command.addAll(
        List.of(
          "eclipse-temurin:21-jdk-alpine",
          "sh",
          "-c",
          tracing
            ? "mkdir -p /tmp/classes/dev/trace/worker && javac -g -encoding UTF-8 -d /tmp/classes /work/Main.java && cp /work/TraceDriver.class '/work/TraceDriver$Capture.class' /tmp/classes/dev/trace/worker/ && java --add-modules jdk.jdi -XX:ActiveProcessorCount=1 -XX:+UseSerialGC -Xmx64m -XX:MaxMetaspaceSize=48m -XX:ReservedCodeCacheSize=16m -cp /tmp/classes dev.trace.worker.TraceDriver"
            : "mkdir /tmp/classes && javac -encoding UTF-8 -d /tmp/classes /work/Main.java && java -XX:ActiveProcessorCount=1 -XX:+UseSerialGC -Xmx64m -XX:MaxMetaspaceSize=64m -XX:ReservedCodeCacheSize=32m -cp /tmp/classes Main"
        )
      );
      else command.addAll(
        List.of(
          "node:22-alpine",
          "node",
          "--max-old-space-size=48",
          tracing ? "/work/trace-driver.cjs" : "/work/main.js"
        )
      );
      process = new ProcessBuilder(command).start();
      Collector stdout = new Collector(
          process.getInputStream(),
          tracing ? 524288 : 32768
        ),
        stderr = new Collector(process.getErrorStream());
      Thread out = Thread.ofVirtual().start(stdout),
        err = Thread.ofVirtual().start(stderr);
      try (var stream = process.getOutputStream()) {
        stream.write(stdin.getBytes(StandardCharsets.UTF_8));
      }
      boolean timeout = !process.waitFor(tracing ? 20 : 12, TimeUnit.SECONDS);
      if (timeout) {
        remove(name);
        process.destroyForcibly();
        process.waitFor(3, TimeUnit.SECONDS);
      }
      out.join(3000);
      err.join(3000);
      return new Result(
        timeout ? 124 : process.exitValue(),
        stdout.text(),
        stderr.text(),
        timeout,
        stdout.truncated || stderr.truncated,
        TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start),
        language.equals("java")
          ? "OpenJDK 21 · 隔离容器"
          : "Node.js 22 · 隔离容器"
      );
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "运行被中断"
      );
    } catch (IOException e) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "执行环境不可用，请检查 Docker 和语言镜像"
      );
    } finally {
      remove(name);
      if (process != null && process.isAlive()) process.destroyForcibly();
      try {
        Files.deleteIfExists(dir.resolve("Main.java"));
        Files.deleteIfExists(dir.resolve("main.js"));
        Files.deleteIfExists(dir.resolve("TraceDriver.class"));
        Files.deleteIfExists(dir.resolve("TraceDriver$Capture.class"));
        Files.deleteIfExists(dir.resolve("trace-driver.cjs"));
        Files.deleteIfExists(dir);
      } catch (IOException ignored) {}
      slots.release();
    }
  }

  void remove(String name) {
    try {
      var p = new ProcessBuilder("docker", "rm", "-f", name)
        .redirectOutput(ProcessBuilder.Redirect.DISCARD)
        .redirectError(ProcessBuilder.Redirect.DISCARD)
        .start();
      if (!p.waitFor(3, TimeUnit.SECONDS)) p.destroyForcibly();
    } catch (Exception ignored) {}
  }

  static class Collector implements Runnable {

    final InputStream input;
    final ByteArrayOutputStream saved = new ByteArrayOutputStream();
    volatile boolean truncated;
    final int limit;

    Collector(InputStream input) {
      this(input, 32768);
    }

    Collector(InputStream input, int limit) {
      this.input = input;
      this.limit = limit;
    }

    public void run() {
      try (input) {
        byte[] buffer = new byte[2048];
        int n;
        while ((n = input.read(buffer)) != -1) {
          int keep = Math.min(n, limit - saved.size());
          if (keep > 0) saved.write(buffer, 0, keep);
          if (keep < n) truncated = true;
        }
      } catch (IOException ignored) {}
    }

    String text() {
      return saved.toString(StandardCharsets.UTF_8);
    }
  }
}
