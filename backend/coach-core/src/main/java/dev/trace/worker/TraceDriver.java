package dev.trace.worker;

import com.sun.jdi.*;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

/** Runs inside the execution container. Reads suspended VM state without invoking user getters. */
public class TraceDriver {

  static final int STEP_LIMIT = 160,
    OBJECT_LIMIT = 32,
    DEPTH_LIMIT = 3;
  static int count = 0;
  static boolean limited = false;
  static String exception = "";
  static Capture activeOutput, activeError;

  public static void main(String[] args) throws Exception {
    var connector = Bootstrap.virtualMachineManager().defaultConnector();
    var options = connector.defaultArguments();
    options.get("main").setValue("Main");
    options
      .get("options")
      .setValue(
        "-cp /tmp/classes -XX:ActiveProcessorCount=1 -XX:+UseSerialGC -Xmx32m -XX:MaxMetaspaceSize=48m -XX:ReservedCodeCacheSize=16m"
      );
    options.get("suspend").setValue("true");
    VirtualMachine vm = connector.launch(options);
    Process target = vm.process();
    var stdout = new Capture(target.getInputStream());
    var stderr = new Capture(target.getErrorStream());
    activeOutput = stdout;
    activeError = stderr;
    Thread out = Thread.ofPlatform().start(stdout),
      err = Thread.ofPlatform().start(stderr);
    target.getOutputStream().close();
    var manager = vm.eventRequestManager();
    var prepare = manager.createClassPrepareRequest();
    prepare.addClassFilter("Main");
    prepare.setSuspendPolicy(EventRequest.SUSPEND_ALL);
    prepare.enable();
    var exceptions = manager.createExceptionRequest(null, true, true);
    exceptions.setSuspendPolicy(EventRequest.SUSPEND_ALL);
    exceptions.enable();
    boolean active = true;
    try {
      while (active) {
        EventSet set = vm.eventQueue().remove(500);
        if (set == null) continue;
        for (Event event : set) {
          if (event instanceof ClassPrepareEvent e) {
            for (Method method : e.referenceType().methodsByName("main")) {
              if (
                !method.signature().equals("([Ljava/lang/String;)V")
              ) continue;
              var locations = method.allLineLocations();
              if (!locations.isEmpty()) {
                var bp = manager.createBreakpointRequest(locations.getFirst());
                bp.setSuspendPolicy(EventRequest.SUSPEND_ALL);
                bp.enable();
              }
            }
          } else if (event instanceof BreakpointEvent e) {
            snapshot(e.thread(), e.location(), "line", "");
            manager.deleteEventRequest(e.request());
            var step = manager.createStepRequest(
              e.thread(),
              StepRequest.STEP_LINE,
              StepRequest.STEP_INTO
            );
            for (String name : List.of(
              "java.*",
              "javax.*",
              "jdk.*",
              "sun.*",
              "com.sun.*"
            ))
              step.addClassExclusionFilter(name);
            step.setSuspendPolicy(EventRequest.SUSPEND_ALL);
            step.enable();
          } else if (event instanceof StepEvent e) {
            if (isUser(e.location())) snapshot(
              e.thread(),
              e.location(),
              "line",
              ""
            );
          } else if (event instanceof ExceptionEvent e) {
            if (isUser(e.location())) {
              String message = e.exception().referenceType().name();
              Field detail = e
                .exception()
                .referenceType()
                .fieldByName("detailMessage");
              if (
                detail != null &&
                e.exception().getValue(detail) instanceof StringReference s
              ) message += ": " + s.value();
              boolean caught = e.catchLocation() != null;
              if (!caught) exception = message;
              snapshot(
                e.thread(),
                e.location(),
                caught ? "caught-exception" : "uncaught-exception",
                message
              );
            }
          } else if (
            event instanceof VMDeathEvent || event instanceof VMDisconnectEvent
          ) {
            active = false;
          }
        }
        if (count >= STEP_LIMIT) {
          limited = true;
          vm.exit(0);
          active = false;
        } else set.resume();
      }
    } catch (VMDisconnectedException ignored) {
    } finally {
      if (target.isAlive()) {
        target.waitFor(1500, TimeUnit.MILLISECONDS);
        if (target.isAlive()) target
          .destroyForcibly()
          .waitFor(1000, TimeUnit.MILLISECONDS);
      }
      stdout.finish();
      stderr.finish();
      out.join(1000);
      err.join(1000);
    }
    if (count > 0) {
      Map<String, Object> end = new LinkedHashMap<>();
      end.put("type", "frame");
      end.put("index", count);
      end.put("line", 0);
      end.put("method", "");
      end.put("thread", "main");
      boolean normal =
        !limited &&
        exception.isEmpty() &&
        !target.isAlive() &&
        target.exitValue() == 0;
      end.put("event", normal ? "program-exit" : "execution-stopped");
      end.put(
        "message",
        normal
          ? "程序执行结束"
          : limited
            ? "达到追踪上限，执行已终止"
            : "程序异常结束"
      );
      end.put("semantics", "after-exit");
      for (String key : List.of("stack", "heap", "statics", "classes"))
        end.put(key, List.of());
      end.put("stackTruncated", false);
      end.put("stdoutDelta", stdout.delta());
      end.put("stderrDelta", stderr.delta());
      System.out.println(json(end));
    }
    Map<String, Object> meta = new LinkedHashMap<>();
    meta.put("type", "meta");
    meta.put("stdout", stdout.text());
    meta.put("stderr", stderr.text());
    meta.put("outputTruncated", stdout.truncated || stderr.truncated);
    meta.put("stepLimit", STEP_LIMIT);
    meta.put("limited", limited);
    meta.put("exception", exception);
    meta.put("targetExitCode", target.isAlive() ? -1 : target.exitValue());
    System.out.println(json(meta));
  }

  static boolean isUser(Location location) {
    try {
      return location.sourceName().equals("Main.java");
    } catch (AbsentInformationException e) {
      return false;
    }
  }

  static void snapshot(
    ThreadReference thread,
    Location location,
    String event,
    String message
  ) throws Exception {
    if (count >= STEP_LIMIT) return;
    Map<String, Object> heap = new LinkedHashMap<>();
    List<Object> stack = new ArrayList<>();
    var frames = thread.frames();
    for (int i = 0; i < Math.min(frames.size(), 12); i++) {
      StackFrame frame = frames.get(i);
      if (!isUser(frame.location())) continue;
      Map<String, Object> item = new LinkedHashMap<>();
      item.put(
        "method",
        frame.location().declaringType().name() +
          "." +
          frame.location().method().name()
      );
      item.put("line", frame.location().lineNumber());
      item.put("depth", frames.size() - i);
      List<Object> locals = new ArrayList<>();
      if (frame.thisObject() != null) locals.add(
        Map.of(
          "name",
          "this",
          "type",
          frame.thisObject().referenceType().name(),
          "value",
          value(frame.thisObject(), heap, 0)
        )
      );
      try {
        for (LocalVariable variable : frame
          .visibleVariables()
          .stream()
          .limit(24)
          .toList()) {
          Map<String, Object> local = new LinkedHashMap<>();
          local.put("name", variable.name());
          local.put("type", variable.typeName());
          local.put("value", value(frame.getValue(variable), heap, 0));
          locals.add(local);
        }
      } catch (AbsentInformationException ignored) {
        item.put("localsUnavailable", true);
      }
      item.put("locals", locals);
      stack.add(item);
    }
    // Static user fields are observable separately from method local variables.
    List<Object> statics = new ArrayList<>();
    List<Object> classes = new ArrayList<>();
    for (ReferenceType type : thread.virtualMachine().allClasses()) {
      if (!type.isPrepared() || !isUserType(type)) continue;
      if (classes.size() < 12) {
        Map<String, Object> classView = new LinkedHashMap<>();
        classView.put("name", type.name());
        if (type instanceof ClassType ct && ct.superclass() != null) {
          classView.put("superclass", ct.superclass().name());
        }
        classView.put("abstract", type.isAbstract());
        classView.put(
          "fields",
          type
            .fields()
            .stream()
            .limit(16)
            .map(f ->
              Map.of(
                "name",
                f.name(),
                "type",
                f.typeName(),
                "static",
                f.isStatic()
              )
            )
            .toList()
        );
        classView.put(
          "methods",
          type
            .methods()
            .stream()
            .filter(m -> !m.isSynthetic())
            .limit(16)
            .map(m ->
              Map.of(
                "name",
                m.name(),
                "returnType",
                m.returnTypeName(),
                "static",
                m.isStatic(),
                "abstract",
                m.isAbstract(),
                "parameters",
                m.argumentTypeNames()
              )
            )
            .toList()
        );
        classView.put(
          "limited",
          type.fields().size() > 16 || type.methods().size() > 16
        );
        classes.add(classView);
      }
      for (Field field : type
        .fields()
        .stream()
        .filter(Field::isStatic)
        .limit(12)
        .toList()) {
        Map<String, Object> fieldView = new LinkedHashMap<>();
        fieldView.put("name", type.name() + "." + field.name());
        fieldView.put("type", field.typeName());
        fieldView.put("value", value(type.getValue(field), heap, 0));
        statics.add(fieldView);
      }
    }
    Map<String, Object> snapshot = new LinkedHashMap<>();
    snapshot.put("type", "frame");
    snapshot.put("index", count++);
    snapshot.put("line", location.lineNumber());
    snapshot.put(
      "method",
      location.declaringType().name() + "." + location.method().name()
    );
    snapshot.put("thread", thread.name());
    snapshot.put("event", event);
    snapshot.put("message", message);
    snapshot.put("stack", stack);
    snapshot.put("stdoutDelta", activeOutput.delta());
    snapshot.put("stderrDelta", activeError.delta());
    snapshot.put("heap", new ArrayList<>(heap.values()));
    snapshot.put("statics", statics);
    snapshot.put("classes", classes);
    snapshot.put("stackTruncated", frames.size() > 12);
    snapshot.put(
      "semantics",
      event.equals("line") ? "before-line" : "exception-thrown"
    );
    System.out.println(json(snapshot));
    System.out.flush();
  }

  static boolean isUserType(ReferenceType type) {
    try {
      return type.sourceName().equals("Main.java");
    } catch (AbsentInformationException e) {
      return false;
    }
  }

  static Object value(Value value, Map<String, Object> heap, int depth) {
    if (value == null) return null;
    if (value instanceof BooleanValue b) return b.booleanValue();
    if (value instanceof CharValue c) return "'" + c.charValue() + "'";
    if (value instanceof PrimitiveValue) return value.toString();
    if (value instanceof StringReference s) {
      String text = s.value();
      return text.length() > 240 ? text.substring(0, 240) + "…" : text;
    }
    if (value instanceof ObjectReference object) {
      String id = "o" + object.uniqueID();
      Map<String, Object> reference = Map.of("ref", id);
      if (heap.containsKey(id) || heap.size() >= OBJECT_LIMIT) return reference;
      Map<String, Object> node = new LinkedHashMap<>();
      heap.put(id, node);
      node.put("id", id);
      node.put("type", object.referenceType().name());
      node.put("limited", depth >= DEPTH_LIMIT);
      Map<String, Object> fields = new LinkedHashMap<>();
      Map<String, Object> fieldTypes = new LinkedHashMap<>();
      node.put("fields", fields);
      node.put("fieldTypes", fieldTypes);
      if (depth >= DEPTH_LIMIT) return reference;
      try {
        if (object instanceof ArrayReference array) {
          node.put("length", array.length());
          node.put("limited", array.length() > 16);
          for (int i = 0; i < Math.min(array.length(), 16); i++) {
            fields.put(
              "[" + i + "]",
              value(array.getValue(i), heap, depth + 1)
            );
            fieldTypes.put(
              "[" + i + "]",
              ((ArrayType) array.referenceType()).componentTypeName()
            );
          }
        } else {
          var selected = object
            .referenceType()
            .allFields()
            .stream()
            .filter(f -> !f.isStatic() && !f.isSynthetic())
            .toList();
          node.put("limited", selected.size() > 12);
          for (Field field : selected.stream().limit(12).toList()) {
            fields.put(
              field.name(),
              value(object.getValue(field), heap, depth + 1)
            );
            fieldTypes.put(field.name(), field.typeName());
          }
        }
      } catch (ObjectCollectedException e) {
        node.put("unavailable", true);
      }
      return reference;
    }
    return "<不支持的值>";
  }

  static String json(Object value) {
    if (value == null) return "null";
    if (
      value instanceof Boolean || value instanceof Number
    ) return value.toString();
    if (value instanceof Map<?, ?> map) {
      List<String> parts = new ArrayList<>();
      for (var entry : map.entrySet())
        parts.add(
          json(entry.getKey().toString()) + ":" + json(entry.getValue())
        );
      return "{" + String.join(",", parts) + "}";
    }
    if (value instanceof Collection<?> list) {
      List<String> parts = new ArrayList<>();
      for (Object v : list) parts.add(json(v));
      return "[" + String.join(",", parts) + "]";
    }
    String text = value.toString();
    StringBuilder out = new StringBuilder("\"");
    for (int i = 0; i < text.length(); i++) {
      char c = text.charAt(i);
      switch (c) {
        case '"' -> out.append("\\\"");
        case '\\' -> out.append("\\\\");
        case '\n' -> out.append("\\n");
        case '\r' -> out.append("\\r");
        case '\t' -> out.append("\\t");
        default -> {
          if (c < 32) out.append(String.format("\\u%04x", (int) c));
          else out.append(c);
        }
      }
    }
    return out.append('"').toString();
  }

  static class Capture implements Runnable {

    final InputStream input;
    final ByteArrayOutputStream saved = new ByteArrayOutputStream();
    boolean truncated;
    volatile boolean running = true;
    int cursor;

    Capture(InputStream input) {
      this.input = input;
    }

    public void run() {
      try {
        while (running) {
          drain();
          Thread.sleep(2);
        }
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      } finally {
        drain();
        try {
          input.close();
        } catch (IOException ignored) {}
      }
    }

    synchronized void drain() {
      // Both the background reader and a suspended-step snapshot use this lock.
      // Never block waiting for bytes while the debugged VM is suspended.
      byte[] bytes = new byte[1024];
      int budget = 65536;
      try {
        int available;
        while (budget > 0 && (available = input.available()) > 0) {
          int n = input.read(
            bytes,
            0,
            Math.min(bytes.length, Math.min(available, budget))
          );
          if (n < 0) break;
          int keep = Math.min(n, 16384 - saved.size());
          if (keep > 0) saved.write(bytes, 0, keep);
          if (keep < n) truncated = true;
          budget -= n;
        }
      } catch (IOException ignored) {}
    }

    synchronized void finish() {
      drain();
      running = false;
    }

    synchronized String delta() {
      drain();
      byte[] bytes = saved.toByteArray();
      String result = new String(
        bytes,
        cursor,
        bytes.length - cursor,
        StandardCharsets.UTF_8
      );
      cursor = bytes.length;
      return result;
    }

    synchronized String text() {
      drain();
      return saved.toString(StandardCharsets.UTF_8);
    }
  }
}
