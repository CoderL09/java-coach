package dev.trace.worker;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class TraceCaptureTest {

  @Test
  void deltasContainOnlyNewBytesAndKeepUnicode() throws Exception {
    var pipe = new PipedInputStream();
    var writer = new PipedOutputStream(pipe);
    var capture = new TraceDriver.Capture(pipe);
    assertEquals("", capture.delta());
    writer.write("你好，Java\n".getBytes(StandardCharsets.UTF_8));
    assertEquals("你好，Java\n", capture.delta());
    assertEquals("", capture.delta());
    writer.write("24\n".getBytes(StandardCharsets.UTF_8));
    capture.finish();
    assertEquals("24\n", capture.delta());
    assertEquals("你好，Java\n24\n", capture.text());
    assertEquals("", capture.delta());
    writer.close();
    pipe.close();
  }

  @Test
  void outputIsBoundedAndNotDuplicatedAcrossSnapshots() {
    var capture = new TraceDriver.Capture(
      new ByteArrayInputStream(
        "x".repeat(80000).getBytes(StandardCharsets.UTF_8)
      )
    );
    String first = capture.delta(),
      second = capture.delta();
    assertEquals(16384, first.length());
    assertEquals("", second);
    assertTrue(capture.truncated);
    assertEquals(first, capture.text());
  }
}
