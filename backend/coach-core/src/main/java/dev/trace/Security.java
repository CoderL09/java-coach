package dev.trace;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class Security {

  @Bean
  BCryptPasswordEncoder encoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain chain(HttpSecurity http) throws Exception {
    return http
      .authorizeHttpRequests(a ->
        a
          .requestMatchers(
            "/api/auth/csrf",
            "/api/auth/login",
            "/api/auth/register",
            "/api/health",
            "/api/catalog",
            "/api/exercises",
            "/api/model/trace"
          )
          .permitAll()
          .requestMatchers("/api/admin/**")
          .hasRole("ADMIN")
          .anyRequest()
          .authenticated()
      )
      .exceptionHandling(e ->
        e
          .authenticationEntryPoint((q, r, x) -> {
            r.setStatus(401);
            r.setContentType("application/json;charset=UTF-8");
            r.getWriter().write("{\"message\":\"请登录后保存学习记录\"}");
          })
          .accessDeniedHandler((q, r, x) -> {
            r.setStatus(403);
            r.setContentType("application/json;charset=UTF-8");
            r.getWriter().write(
              "{\"message\":\"没有权限或请求令牌已过期，请刷新\"}"
            );
          })
      )
      .logout(l ->
        l
          .logoutUrl("/api/auth/logout")
          .logoutSuccessHandler((q, r, a) -> r.setStatus(204))
      )
      .build();
  }
}
