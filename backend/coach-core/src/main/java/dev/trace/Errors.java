package dev.trace;

import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class Errors {

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(
      Map.of("message", e.getReason() == null ? "请求未完成" : e.getReason())
    );
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    MethodArgumentNotValidException.class,
  })
  ResponseEntity<?> bad(Exception e) {
    return ResponseEntity.badRequest().body(
      Map.of(
        "message",
        e instanceof IllegalArgumentException
          ? e.getMessage()
          : "输入不符合要求"
      )
    );
  }

  @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class)
  ResponseEntity<?> duplicate() {
    return ResponseEntity.status(409).body(Map.of("message", "该记录已存在"));
  }

  static ResponseStatusException missing() {
    return new ResponseStatusException(
      HttpStatus.NOT_FOUND,
      "记录不存在或无权访问"
    );
  }

  static ResponseStatusException conflict() {
    return new ResponseStatusException(
      HttpStatus.CONFLICT,
      "记录已更新，请重新加载后修改"
    );
  }
}
