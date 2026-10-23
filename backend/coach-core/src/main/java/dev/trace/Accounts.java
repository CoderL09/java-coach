package dev.trace;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
class Accounts {

  final Store db;
  final BCryptPasswordEncoder encoder;

  Accounts(Store db, BCryptPasswordEncoder encoder) {
    this.db = db;
    this.encoder = encoder;
  }

  record Credentials(
    @NotBlank @Pattern(regexp = "[A-Za-z0-9_]{3,40}") String username,
    @NotBlank @Size(min = 8, max = 72) String password
  ) {}

  @GetMapping("/csrf")
  Object csrf(CsrfToken token) {
    return Map.of(
      "headerName",
      token.getHeaderName(),
      "token",
      token.getToken()
    );
  }

  @GetMapping("/me")
  Object me(Authentication a) {
    return publicUser(db.user(a.getName()));
  }

  @PostMapping("/register")
  Object register(@Valid @RequestBody Credentials c) {
    validate(c);
    db.addUser(c.username(), encoder.encode(c.password()), "USER");
    return Map.of("message", "账号已创建");
  }

  @PostMapping("/login")
  Object login(
    @Valid @RequestBody Credentials c,
    HttpServletRequest req,
    HttpServletResponse res
  ) {
    validate(c);
    var u = db.user(c.username());
    if (
      u == null ||
      !encoder.matches(c.password(), (String) u.get("passwordHash"))
    ) throw new ResponseStatusException(
      HttpStatus.UNAUTHORIZED,
      "账号或密码不正确"
    );
    req.getSession();
    req.changeSessionId();
    var auth = UsernamePasswordAuthenticationToken.authenticated(
      c.username(),
      null,
      List.of(new SimpleGrantedAuthority("ROLE_" + u.get("role")))
    );
    var ctx = SecurityContextHolder.createEmptyContext();
    ctx.setAuthentication(auth);
    SecurityContextHolder.setContext(ctx);
    new HttpSessionSecurityContextRepository().saveContext(ctx, req, res);
    return publicUser(u);
  }

  static Object publicUser(Map<String, Object> u) {
    return Map.of(
      "id",
      u.get("id"),
      "username",
      u.get("username"),
      "role",
      u.get("role")
    );
  }

  static void validate(Credentials c) {
    if (
      c.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
    ) throw new IllegalArgumentException("密码 UTF-8 编码不得超过 72 字节");
  }

  static long uid(Store db, Authentication a) {
    return ((Number) db.user(a.getName()).get("id")).longValue();
  }
}

@Component
class Seed implements ApplicationRunner {

  final Store db;
  final BCryptPasswordEncoder encoder;
  final String admin;

  Seed(
    Store db,
    BCryptPasswordEncoder encoder,
    @Value("${trace.admin-password}") String admin
  ) {
    this.db = db;
    this.encoder = encoder;
    this.admin = admin;
  }

  public void run(ApplicationArguments args) {
    if (db.user("learner") == null) db.addUser(
      "learner",
      encoder.encode("trace2026"),
      "USER"
    );
    if (!admin.isBlank() && db.user("admin") == null) db.addUser(
      "admin",
      encoder.encode(admin),
      "ADMIN"
    );
  }
}
