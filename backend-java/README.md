# 杰力教育智能云平台 - 后端服务

基于 Spring Boot 3.x + Java 17 构建的教育管理系统后端服务。

## 技术栈

- **框架**: Spring Boot 3.2.x
- **语言**: Java 17
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **ORM**: Spring Data JPA
- **安全**: Spring Security + JWT
- **实时通信**: WebSocket
- **构建工具**: Maven
- **文档**: SpringDoc OpenAPI (Swagger)

## 项目结构

```
backend-java/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/jieliedu/platform/
│   │   │       ├── config/          # 配置类
│   │   │       ├── controller/      # API控制器
│   │   │       ├── service/         # 业务服务层
│   │   │       │   └── impl/        # 服务实现
│   │   │       ├── repository/      # 数据访问层
│   │   │       ├── entity/          # 实体类
│   │   │       ├── dto/             # 数据传输对象
│   │   │       ├── vo/              # 视图对象
│   │   │       ├── enums/           # 枚举
│   │   │       ├── security/        # 安全相关
│   │   │       ├── websocket/       # WebSocket
│   │   │       ├── utils/           # 工具类
│   │   │       └── exception/       # 异常处理
│   │   └── resources/
│   │       ├── application.yml      # 主配置文件
│   │       ├── application-dev.yml  # 开发环境配置
│   │       └── application-prod.yml # 生产环境配置
│   └── test/                        # 测试代码
├── pom.xml                          # Maven配置
└── README.md                        # 项目说明
```

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 6.0+

### 配置

1. 修改数据库配置 `application-dev.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/jieli_education?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: your_username
    password: your_password
```

2. 修改 Redis 配置:
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: 
```

3. 配置 JWT 密钥（生产环境必须修改）:
```yaml
jwt:
  secret: your-secret-key-here
```

### 运行

```bash
# 开发环境
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 打包
mvn clean package

# 运行jar包
java -jar target/jieli-education-platform-1.0.0-SNAPSHOT.jar

# 生产环境
java -jar -Dspring.profiles.active=prod target/jieli-education-platform-1.0.0-SNAPSHOT.jar
```

### API 文档

启动应用后访问:
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api/v3/api-docs

## 主要功能模块

- **用户管理**: 用户注册、登录、权限管理
- **JWT认证**: 基于Token的无状态认证
- **数据访问**: JPA + MySQL
- **缓存支持**: Redis
- **实时通信**: WebSocket
- **文件上传**: 支持多文件上传

## 开发规范

1. **包结构**: 按照功能模块分层，避免循环依赖
2. **命名规范**: 类名使用大驼峰，方法名使用小驼峰
3. **异常处理**: 统一使用 GlobalExceptionHandler
4. **响应格式**: 统一使用 Result<T> 封装
5. **日志**: 使用 Lombok @Slf4j 注解

## 许可证

Copyright © 2024 杰力教育
