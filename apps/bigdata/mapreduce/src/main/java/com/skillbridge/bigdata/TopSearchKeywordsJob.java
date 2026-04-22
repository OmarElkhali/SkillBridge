package com.skillbridge.bigdata;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TopSearchKeywordsJob {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[a-z0-9+#.]+");
    private static final Set<String> STOP_WORDS = new HashSet<>(
            Arrays.asList("a", "an", "and", "avec", "de", "for", "in", "of", "the", "to", "with")
    );

    public static class SearchKeywordMapper extends Mapper<Object, Text, Text, IntWritable> {
        private static final IntWritable ONE = new IntWritable(1);
        private final Text outputKey = new Text();

        @Override
        protected void map(Object key, Text value, Context context) throws IOException, InterruptedException {
            String line = value.toString();
            if (!"COURSE_SEARCH".equals(jsonField(line, "eventType"))) {
                return;
            }

            String query = jsonField(line, "query").toLowerCase(Locale.ROOT);
            Matcher matcher = TOKEN_PATTERN.matcher(query);
            while (matcher.find()) {
                String token = matcher.group();
                if (token.length() <= 1 || STOP_WORDS.contains(token)) {
                    continue;
                }
                outputKey.set(token);
                context.write(outputKey, ONE);
            }
        }

        private static String jsonField(String line, String field) {
            Pattern pattern = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"([^\"]*)\"");
            Matcher matcher = pattern.matcher(line);
            return matcher.find() ? matcher.group(1) : "";
        }
    }

    public static class SumReducer extends Reducer<Text, IntWritable, Text, IntWritable> {
        private final IntWritable result = new IntWritable();

        @Override
        protected void reduce(Text key, Iterable<IntWritable> values, Context context) throws IOException, InterruptedException {
            int sum = 0;
            for (IntWritable value : values) {
                sum += value.get();
            }
            result.set(sum);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("Usage: TopSearchKeywordsJob <input> <output>");
            System.exit(2);
        }

        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "SkillBridge Top Search Keywords");
        job.setJarByClass(TopSearchKeywordsJob.class);
        job.setMapperClass(SearchKeywordMapper.class);
        job.setCombinerClass(SumReducer.class);
        job.setReducerClass(SumReducer.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}

