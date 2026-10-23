package dev.trace;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.apache.ibatis.annotations.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Mapper
interface ProjectStore {
  @Insert(
    "INSERT INTO project_versions(id,user_id,project_id,stage_no,source,state) VALUES(#{id},#{uid},#{project},#{stage},#{source},#{state})"
  )
  void save(
    @Param("id") String id,
    @Param("uid") long uid,
    @Param("project") String project,
    @Param("stage") int stage,
    @Param("source") String source,
    @Param("state") String state
  );

  @Select(
    "SELECT id,stage_no AS stage,source,state,created_at AS createdAt FROM project_versions WHERE user_id=#{uid} AND project_id=#{project} ORDER BY created_at DESC,id DESC LIMIT 20"
  )
  List<Map<String, Object>> versions(
    @Param("uid") long uid,
    @Param("project") String project
  );
}

@RestController
@RequestMapping("/api/projects")
class Projects {

  final ProjectStore projects;
  final Store db;

  Projects(ProjectStore projects, Store db) {
    this.projects = projects;
    this.db = db;
  }

  record Save(
    @NotBlank @Pattern(regexp = "[a-z][a-z0-9-]{0,79}") String projectId,
    @Min(1) @Max(20) int stage,
    @NotBlank @Size(max = 40000) String source,
    @Size(max = 40000) String state
  ) {}

  @GetMapping("/{project}/versions")
  Object versions(@PathVariable String project, Authentication auth) {
    return projects.versions(Accounts.uid(db, auth), project);
  }

  @PostMapping("/versions")
  Object save(@Valid @RequestBody Save save, Authentication auth) {
    String id = UUID.randomUUID().toString();
    projects.save(
      id,
      Accounts.uid(db, auth),
      save.projectId(),
      save.stage(),
      save.source(),
      save.state() == null ? "null" : save.state()
    );
    return Map.of("id", id);
  }
}
