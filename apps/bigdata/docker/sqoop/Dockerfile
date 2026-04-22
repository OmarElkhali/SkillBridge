FROM bde2020/hadoop-base:2.0.0-hadoop2.7.4-java8

USER root

ENV SQOOP_VERSION=1.4.7
ENV SQOOP_HOME=/opt/sqoop
ENV HADOOP_HOME=/opt/hadoop-2.7.4
ENV HADOOP_COMMON_HOME=/opt/hadoop-2.7.4
ENV HADOOP_MAPRED_HOME=/opt/hadoop-2.7.4
ENV HADOOP_HDFS_HOME=/opt/hadoop-2.7.4
ENV HADOOP_YARN_HOME=/opt/hadoop-2.7.4
ENV PATH=${SQOOP_HOME}/bin:${HADOOP_HOME}/bin:${HADOOP_HOME}/sbin:${PATH}

RUN curl -fSL "https://archive.apache.org/dist/sqoop/${SQOOP_VERSION}/sqoop-${SQOOP_VERSION}.bin__hadoop-2.6.0.tar.gz" -o /tmp/sqoop.tar.gz \
    && tar -xzf /tmp/sqoop.tar.gz -C /opt \
    && mv "/opt/sqoop-${SQOOP_VERSION}.bin__hadoop-2.6.0" "${SQOOP_HOME}" \
    && rm /tmp/sqoop.tar.gz \
    && curl -fSL "https://repo1.maven.org/maven2/org/postgresql/postgresql/42.7.4/postgresql-42.7.4.jar" -o "${SQOOP_HOME}/lib/postgresql-42.7.4.jar"

WORKDIR /opt/skillbridge

CMD ["tail", "-f", "/dev/null"]

