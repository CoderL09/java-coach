package dev.trace;

import java.util.*;
import org.apache.ibatis.annotations.*;

@Mapper
public interface Store {
  @Insert(
    "INSERT INTO runtime_traces(id,user_id,language,source,trace) VALUES(#{id},#{uid},#{language},#{source},#{trace})"
  )
  void addTrace(
    @Param("id") String id,
    @Param("uid") long uid,
    @Param("language") String language,
    @Param("source") String source,
    @Param("trace") String trace
  );

  @Select(
    "SELECT id,language,created_at AS createdAt FROM runtime_traces WHERE user_id=#{uid} ORDER BY created_at DESC LIMIT 20"
  )
  List<Map<String, Object>> traces(long uid);

  @Select(
    "SELECT id,language,source,trace,created_at AS createdAt FROM runtime_traces WHERE id=#{id} AND user_id=#{uid}"
  )
  Map<String, Object> trace(@Param("uid") long uid, @Param("id") String id);

  @Select(
    "SELECT id,username,password_hash AS passwordHash,role FROM users WHERE username=#{name}"
  )
  Map<String, Object> user(String name);

  @Insert(
    "INSERT INTO users(username,password_hash,role) VALUES(#{name},#{hash},#{role})"
  )
  void addUser(
    @Param("name") String name,
    @Param("hash") String hash,
    @Param("role") String role
  );

  @Select(
    "SELECT id,topic,title,kind,state,snapshot,note,version,created_at AS createdAt,updated_at AS updatedAt FROM learning_records WHERE user_id=#{uid} ORDER BY updated_at DESC LIMIT 200"
  )
  List<Map<String, Object>> records(long uid);

  @Select(
    "SELECT id,topic,title,kind,state,snapshot,note,version FROM learning_records WHERE id=#{id} AND user_id=#{uid}"
  )
  Map<String, Object> record(@Param("uid") long uid, @Param("id") String id);

  @Insert(
    "INSERT INTO learning_records(id,user_id,topic,title,kind,snapshot) VALUES(#{id},#{uid},#{topic},#{title},#{kind},#{snapshot})"
  )
  void addRecord(
    @Param("id") String id,
    @Param("uid") long uid,
    @Param("topic") String topic,
    @Param("title") String title,
    @Param("kind") String kind,
    @Param("snapshot") String snapshot
  );

  @Update(
    "UPDATE learning_records SET state=#{state},note=#{note},version=version+1 WHERE id=#{id} AND user_id=#{uid} AND version=#{version}"
  )
  int updateRecord(
    @Param("id") String id,
    @Param("uid") long uid,
    @Param("state") String state,
    @Param("note") String note,
    @Param("version") int version
  );

  @Insert(
    "INSERT INTO submissions(id,user_id,topic,language,source,result) VALUES(#{id},#{uid},#{topic},#{lang},#{source},#{result})"
  )
  void submission(
    @Param("id") String id,
    @Param("uid") long uid,
    @Param("topic") String topic,
    @Param("lang") String lang,
    @Param("source") String source,
    @Param("result") String result
  );

  @Select(
    "SELECT id,topic,language,result,created_at AS createdAt FROM submissions WHERE user_id=#{uid} ORDER BY created_at DESC LIMIT 30"
  )
  List<Map<String, Object>> submissions(long uid);

  @Select("SELECT id,title,enabled,version FROM experiments ORDER BY id")
  List<Map<String, Object>> experiments();

  @Update(
    "UPDATE experiments SET enabled=#{enabled},version=version+1 WHERE id=#{id} AND version=#{version}"
  )
  int publish(
    @Param("id") String id,
    @Param("enabled") boolean enabled,
    @Param("version") int version
  );

  @Select(
    "SELECT id,username,role,created_at AS createdAt FROM users ORDER BY id DESC LIMIT 100"
  )
  List<Map<String, Object>> users();

  @Select(
    "SELECT COUNT(*) AS total,SUM(kind='ERROR') AS errors FROM learning_records"
  )
  Map<String, Object> stats();
}
