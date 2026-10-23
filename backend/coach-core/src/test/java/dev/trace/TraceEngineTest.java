package dev.trace;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import org.junit.jupiter.api.Test;

class TraceEngineTest {

  @Test
  void reversesWithoutLosingNodeIdentity() {
    var r = new TraceEngine().run("reverse", List.of(1, 2, 3, 4), "correct", 0);
    assertEquals(List.of(4, 3, 2, 1), r.output());
    assertTrue(r.correct());
    var last = r.frames().getLast();
    assertEquals("o3", last.locals().get("prev"));
    assertEquals("o2", last.nodes().get(3).next());
    assertNull(last.nodes().getFirst().next());
  }

  @Test
  void snapshotsRemainImmutableAfterLaterMutations() {
    var r = new TraceEngine().run("reverse", List.of(1, 2, 3), "correct", 0);
    assertEquals("o1", r.frames().getFirst().nodes().getFirst().next());
    assertNull(r.frames().getLast().nodes().getFirst().next());
  }

  @Test
  void wrongOrderExposesLostTraversalPath() {
    var r = new TraceEngine().run("reverse", List.of(1, 2, 3), "broken", 0);
    assertEquals(List.of(1), r.output());
    assertFalse(r.correct());
    assertTrue(r.frames().stream().anyMatch(TraceEngine.Frame::error));
    assertEquals(3, r.frames().getLast().nodes().size());
  }

  @Test
  void oneNodeDoesNotClaimWrongOutput() {
    var r = new TraceEngine().run("reverse", List.of(7), "broken", 0);
    assertTrue(r.correct());
    assertEquals(List.of(7), r.output());
  }

  @Test
  void duplicateValuesDoNotMergeObjects() {
    var r = new TraceEngine().run("reverse", List.of(2, 2, 2), "correct", 0);
    assertEquals(
      3,
      r
        .frames()
        .getLast()
        .nodes()
        .stream()
        .map(TraceEngine.NodeView::id)
        .distinct()
        .count()
    );
  }

  @Test
  void binarySearchShrinksAndFindsTarget() {
    var r = new TraceEngine().run(
      "binary",
      List.of(9, 1, 3, 7, 5),
      "correct",
      7
    );
    assertEquals(List.of(3), r.output());
    assertTrue(r.frames().size() < 10);
  }

  @Test
  void binaryMissingTargetReturnsNegativeOne() {
    assertEquals(
      List.of(-1),
      new TraceEngine().run("binary", List.of(1, 3, 5), "correct", 2).output()
    );
  }

  @Test
  void sharedAndIndependentObjectsDiffer() {
    assertEquals(
      List.of(99),
      new TraceEngine().run("reference", List.of(1, 99), "correct", 0).output()
    );
    assertEquals(
      List.of(1),
      new TraceEngine().run("reference", List.of(1, 99), "broken", 0).output()
    );
  }

  @Test
  void invalidInputRejected() {
    assertThrows(IllegalArgumentException.class, () ->
      new TraceEngine().run("reverse", List.of(), "correct", 0)
    );
    assertThrows(IllegalArgumentException.class, () ->
      new TraceEngine().run("reverse", List.of(1000), "correct", 0)
    );
    assertThrows(IllegalArgumentException.class, () ->
      new TraceEngine().run("unknown", List.of(1), "correct", 0)
    );
  }
}
