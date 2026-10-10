package com.quiz.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    // In-memory sample data representing the quiz domain
    private final List<Map<String, Object>> quizzes = new ArrayList<>();
    private final Map<Long, List<Map<String, Object>>> quizQuestions = new HashMap<>();

    public QuizController() {
        initSampleData();
    }

    private void initSampleData() {
        // Quiz 1: Java 21 & Core Concepts
        Map<String, Object> q1 = new HashMap<>();
        q1.put("id", 1L);
        q1.put("title", "Java 21 Modern Features & Core OOP");
        q1.put("description", "Test your knowledge of Java 21 LTS features, records, pattern matching, virtual threads, and OOP principles.");
        q1.put("category", "Java");
        q1.put("questionCount", 4);
        q1.put("timeLimitMinutes", 5);
        q1.put("passingScore", 75);
        quizzes.add(q1);

        List<Map<String, Object>> q1Questions = new ArrayList<>();
        q1Questions.add(createQuestion(1L, "Which major concurrency feature was made permanent in Java 21 (JEP 444)?",
                List.of("Virtual Threads (Project Loom)", "Coroutines", "Reactive Streams", "Green Threads 2.0"), 0,
                "Virtual threads are lightweight threads that drastically reduce the effort of writing high-throughput concurrent applications."));
        q1Questions.add(createQuestion(2L, "Which keyword is used in Java to define an immutable data-carrier class with built-in getters, equals, and hashCode?",
                List.of("interface", "record", "sealed", "struct"), 1,
                "Records in Java provide a concise syntax for declaring classes that are transparent holders for shallowly immutable data."));
        q1Questions.add(createQuestion(3L, "What is the default initial size of an ArrayList in Java?",
                List.of("0 (until first element added, then 10)", "16", "32", "8"), 0,
                "An ArrayList initializes with an empty element data array and expands to capacity 10 upon first addition."));
        q1Questions.add(createQuestion(4L, "Can an abstract class in Java have concrete methods with implementations?",
                List.of("Yes, abstract classes can have both abstract and concrete methods", "No, only interfaces can have default methods", "No, all methods in an abstract class must be abstract", "Only if marked static"), 0,
                "Abstract classes can provide full implementations for methods alongside abstract method signatures."));
        quizQuestions.put(1L, q1Questions);

        // Quiz 2: Spring Boot 3 & REST APIs
        Map<String, Object> q2 = new HashMap<>();
        q2.put("id", 2L);
        q2.put("title", "Spring Boot 3.x & REST Architecture");
        q2.put("description", "Evaluate your skills in Spring Boot 3 autoconfiguration, JPA repositories, dependency injection, and REST controllers.");
        q2.put("category", "Spring Boot");
        q2.put("questionCount", 3);
        q2.put("timeLimitMinutes", 4);
        q2.put("passingScore", 66);
        quizzes.add(q2);

        List<Map<String, Object>> q2Questions = new ArrayList<>();
        q2Questions.add(createQuestion(5L, "Which annotation combines @Controller and @ResponseBody in Spring?",
                List.of("@RestController", "@Service", "@Component", "@Endpoint"), 0,
                "@RestController is a convenience annotation that combines @Controller and @ResponseBody."));
        q2Questions.add(createQuestion(6L, "Which base baseline version of Java is required to run Spring Boot 3.x?",
                List.of("Java 17", "Java 8", "Java 11", "Java 21"), 0,
                "Spring Boot 3 requires Java 17 as the minimum baseline and fully supports Java 21 LTS."));
        q2Questions.add(createQuestion(7L, "What is the default embedded HTTP server used by Spring Boot starter web?",
                List.of("Apache Tomcat", "Jetty", "Undertow", "Netty"), 0,
                "Apache Tomcat is the default embedded servlet container provided by spring-boot-starter-web."));
        quizQuestions.put(2L, q2Questions);

        // Quiz 3: React & Modern Frontend
        Map<String, Object> q3 = new HashMap<>();
        q3.put("id", 3L);
        q3.put("title", "React.js & State Management");
        q3.put("description", "Master React hooks, components, Virtual DOM, and state management fundamentals.");
        q3.put("category", "React");
        q3.put("questionCount", 3);
        q3.put("timeLimitMinutes", 4);
        q3.put("passingScore", 66);
        quizzes.add(q3);

        List<Map<String, Object>> q3Questions = new ArrayList<>();
        q3Questions.add(createQuestion(8L, "Which hook is used to manage side effects such as data fetching in React functional components?",
                List.of("useEffect", "useState", "useMemo", "useCallback"), 0,
                "useEffect lets you synchronize a component with external systems such as APIs or event listeners."));
        q3Questions.add(createQuestion(9L, "Why is Vite significantly faster than traditional Webpack dev servers?",
                List.of("It leverages native ES Modules (ESM) and esbuild", "It runs Python in the browser", "It avoids minification entirely", "It requires no build step in production"), 0,
                "Vite serves source code over native ESM, offloading bundle orchestration to the modern browser engine."));
        q3Questions.add(createQuestion(10L, "What does JSX stand for?",
                List.of("JavaScript XML", "Java Syntax Extension", "JSON Structured XML", "JavaScript XHR"), 0,
                "JSX stands for JavaScript XML, allowing developers to write HTML-like structures inside JavaScript."));
        quizQuestions.put(3L, q3Questions);
    }

    private Map<String, Object> createQuestion(Long id, String text, List<String> options, int correctIndex, String explanation) {
        Map<String, Object> q = new HashMap<>();
        q.put("id", id);
        q.put("questionText", text);
        q.put("options", options);
        q.put("correctIndex", correctIndex);
        q.put("explanation", explanation);
        return q;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllQuizzes() {
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getQuizById(@PathVariable Long id) {
        Map<String, Object> meta = quizzes.stream()
                .filter(q -> q.get("id").equals(id))
                .findFirst()
                .orElse(null);

        if (meta == null) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> questions = quizQuestions.getOrDefault(id, Collections.emptyList());

        // Return questions without leaking correctIndex directly
        List<Map<String, Object>> safeQuestions = new ArrayList<>();
        for (Map<String, Object> q : questions) {
            Map<String, Object> safeQ = new HashMap<>();
            safeQ.put("id", q.get("id"));
            safeQ.put("questionText", q.get("questionText"));
            safeQ.put("options", q.get("options"));
            safeQuestions.add(safeQ);
        }

        Map<String, Object> response = new HashMap<>(meta);
        response.put("questions", safeQuestions);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitQuiz(
            @PathVariable Long id,
            @RequestBody Map<String, Object> submission) {

        List<Map<String, Object>> questions = quizQuestions.getOrDefault(id, Collections.emptyList());
        if (questions.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> answers = (Map<String, Object>) submission.getOrDefault("answers", Collections.emptyMap());

        int score = 0;
        int total = questions.size();
        List<Map<String, Object>> breakdown = new ArrayList<>();

        for (Map<String, Object> q : questions) {
            Long qId = (Long) q.get("id");
            int correctIndex = (int) q.get("correctIndex");
            String qIdStr = String.valueOf(qId);

            Integer userChoice = null;
            if (answers.containsKey(qIdStr)) {
                userChoice = Integer.parseInt(answers.get(qIdStr).toString());
            }

            boolean isCorrect = userChoice != null && userChoice == correctIndex;
            if (isCorrect) {
                score++;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("questionId", qId);
            item.put("questionText", q.get("questionText"));
            item.put("options", q.get("options"));
            item.put("correctIndex", correctIndex);
            item.put("userChoice", userChoice);
            item.put("isCorrect", isCorrect);
            item.put("explanation", q.get("explanation"));
            breakdown.add(item);
        }

        int percentage = (int) Math.round(((double) score / total) * 100);
        int passingScore = (int) quizzes.stream()
                .filter(q -> q.get("id").equals(id))
                .findFirst()
                .map(q -> (int) q.get("passingScore"))
                .orElse(70);

        boolean passed = percentage >= passingScore;

        Map<String, Object> result = new HashMap<>();
        result.put("quizId", id);
        result.put("score", score);
        result.put("totalQuestions", total);
        result.put("percentage", percentage);
        result.put("passingScore", passingScore);
        result.put("passed", passed);
        result.put("breakdown", breakdown);
        result.put("completedAt", new Date().toString());

        return ResponseEntity.ok(result);
    }
}
