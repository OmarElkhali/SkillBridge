FROM bde2020/hadoop-base:2.0.0-hadoop2.7.4-java8

USER root

ENV FLUME_VERSION=1.9.0
ENV FLUME_HOME=/opt/flume
ENV HADOOP_HOME=/opt/hadoop-2.7.4
ENV HADOOP_CONF_DIR=/opt/hadoop-2.7.4/etc/hadoop
ENV PATH=${FLUME_HOME}/bin:${HADOOP_HOME}/bin:${PATH}
ENV FLUME_CLASSPATH=/opt/hadoop-2.7.4/etc/hadoop:/opt/hadoop-2.7.4/share/hadoop/common/*:/opt/hadoop-2.7.4/share/hadoop/common/lib/*:/opt/hadoop-2.7.4/share/hadoop/hdfs/*:/opt/hadoop-2.7.4/share/hadoop/hdfs/lib/*

RUN curl -fSL "https://archive.apache.org/dist/flume/${FLUME_VERSION}/apache-flume-${FLUME_VERSION}-bin.tar.gz" -o /tmp/flume.tar.gz \
    && tar -xzf /tmp/flume.tar.gz -C /opt \
    && mv "/opt/apache-flume-${FLUME_VERSION}-bin" "${FLUME_HOME}" \
    && rm /tmp/flume.tar.gz

WORKDIR /opt/skillbridge

CMD ["tail", "-f", "/dev/null"]
