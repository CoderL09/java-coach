package dev.trace.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GatewayApplication {

  public static void main(String[] args) {
    SpringApplication.run(GatewayApplication.class, args);
  }

  @Bean
  RouteLocator routes(RouteLocatorBuilder builder) {
    return builder
      .routes()
      .route("coach-core", r -> r.path("/api/**").uri("http://127.0.0.1:8091"))
      .build();
  }
}
