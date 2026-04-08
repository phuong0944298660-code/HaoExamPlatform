# =============================================================
# 接力教育智慧云平台 - Java 后端 Dockerfile
# 多阶段构建，优化镜像大小
# =============================================================

# -------------------- 阶段 1: 构建阶段 --------------------
FROM maven:3.9-eclipse-temurin-17 AS builder

# Maven already includes curl, no need to install separately
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /build

# 首先复制 pom.xml 和依赖（利用 Docker 缓存层）
COPY pom.xml .

# 下载依赖（如果 pom.xml 未更改，这一层会被缓存）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 构建项目（跳过测试，在单独阶段运行）
RUN mvn clean package -DskipTests -B && \
    mkdir -p target/dependency && \
    cd target/dependency && \
    jar -xf ../*.jar

# -------------------- 阶段 2: 运行阶段 --------------------
FROM eclipse-temurin:17-jre-focal


# 安装必要的工具
RUN apt-get update && \
    apt-get install -y curl tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm -rf /var/lib/apt/lists/*

# 创建非 root 用户运行应用
RUN groupadd -r jieli && useradd -r -g jieli jieli

# 设置工作目录
WORKDIR /app

# 从构建阶段复制依赖和类文件（包括配置文件）
COPY --from=builder /build/target/dependency/BOOT-INF/lib /app/lib
COPY --from=builder /build/target/dependency/META-INF /app/META-INF
COPY --from=builder /build/target/dependency/BOOT-INF/classes /app/classes

# 创建上传目录并设置权限
RUN mkdir -p /app/uploads && chown -R jieli:jieli /app

# 切换到非 root 用户
USER jieli

# 暴露应用端口
EXPOSE 8080

# JVM 参数优化（容器感知）
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:InitialRAMPercentage=50.0 \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+OptimizeStringConcat \
    -XX:+UseStringDeduplication \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.backgroundpreinitializer.ignore=true \
    -Dfile.encoding=UTF-8"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# 启动命令（包含classes目录以确保配置文件被正确加载）
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -cp 'classes:lib/*' com.jieliedu.platform.JieliEducationApplication"]
