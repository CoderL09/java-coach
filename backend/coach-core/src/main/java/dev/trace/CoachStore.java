package dev.trace;

import java.util.*;
import org.apache.ibatis.annotations.*;

@Mapper
public interface CoachStore {
  @Insert(
    "INSERT INTO coach_threads(id,user_id,mode,topic) VALUES(#{id},#{uid},#{mode},#{topic})"
  )
  void create(
    @Param("id") String id,
    @Param("uid") long uid,
    @Param("mode") String mode,
    @Param("topic") String topic
  );

  @Select(
    "SELECT id,mode,topic,created_at AS createdAt FROM coach_threads WHERE id=#{id} AND user_id=#{uid}"
  )
  Map<String, Object> thread(@Param("id") String id, @Param("uid") long uid);

  @Select(
    "SELECT id,mode,topic,created_at AS createdAt FROM coach_threads WHERE user_id=#{uid} ORDER BY created_at DESC LIMIT 30"
  )
  List<Map<String, Object>> threads(long uid);

  @Select(
    "SELECT id,question,answer,context,created_at AS createdAt FROM coach_turns WHERE thread_id=#{id} ORDER BY id DESC LIMIT 12"
  )
  List<Map<String, Object>> turns(String id);

  @Insert(
    "INSERT INTO coach_turns(thread_id,question,answer,context) VALUES(#{id},#{question},#{answer},#{context})"
  )
  void add(
    @Param("id") String id,
    @Param("question") String question,
    @Param("answer") String answer,
    @Param("context") String context
  );

  @Select(
    "SELECT COUNT(*) FROM coach_turns t JOIN coach_threads c ON t.thread_id=c.id WHERE c.user_id=#{uid} AND t.created_at > CURRENT_TIMESTAMP - INTERVAL 1 MINUTE"
  )
  int recent(long uid);
}
