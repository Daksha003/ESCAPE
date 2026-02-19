// Test script for evaluateInterviewAnswers function
import {
  evaluateInterviewAnswers,
  interviewQuestions,
  generateDynamicQuestions,
  detectInterests,
} from "./gameData.js";

// Test Case 1: Default behavior with static questions
console.log("Test Case 1: Default behavior with static questions");
const answers1 = [
  "I have a degree in computer science and experience with projects.",
  "I am proficient in Java, Python, and JavaScript.",
  "Object-oriented programming focuses on objects and classes, while functional programming uses functions and immutability.",
  "I worked on a challenging project where I overcame difficulties by researching and collaborating.",
  "I use logs, breakpoints, and testing to debug code.",
  "I stay updated by reading blogs, taking courses, and participating in communities.",
  "Time complexity measures algorithm efficiency, space complexity measures memory usage.",
];
const result1 = evaluateInterviewAnswers(answers1);
console.log("Result:", result1);
console.log("Expected: score around 100, passed: true\n");

// Test Case 2: With dynamic questions
console.log("Test Case 2: With dynamic questions");
const interests = detectInterests(answers1);
const dynamicQuestions = generateDynamicQuestions(interests);
const answers2 = answers1.slice(0, dynamicQuestions.length); // Match length
const result2 = evaluateInterviewAnswers(answers2, dynamicQuestions);
console.log("Dynamic Questions Count:", dynamicQuestions.length);
console.log("Result:", result2);
console.log("Expected: score based on dynamic questions\n");

// Test Case 3: Edge case - empty answers
console.log("Test Case 3: Edge case - empty answers");
const answers3 = ["", "", ""];
const result3 = evaluateInterviewAnswers(answers3);
console.log("Result:", result3);
console.log("Expected: score 0, passed: false\n");

// Test Case 4: Edge case - no keywords
console.log("Test Case 4: Edge case - no keywords");
const answers4 = [
  "This is a short answer.",
  "Another brief response.",
  "One more.",
];
const result4 = evaluateInterviewAnswers(answers4);
console.log("Result:", result4);
console.log("Expected: low score, passed: false\n");

// Test Case 5: Mixed quality answers
console.log("Test Case 5: Mixed quality answers");
const answers5 = [
  "I have education and projects.", // Has keywords, medium length
  "Java Python", // Short, has keywords
  "OOP vs FP is different.", // Short, partial keywords
  "Challenging project solved.", // Short, has keywords
  "Debug with tools.", // Short, has keywords
  "Read blogs.", // Very short, has keywords
  "Big O notation.", // Short, has keywords
];
const result5 = evaluateInterviewAnswers(answers5);
console.log("Result:", result5);
console.log("Expected: moderate score\n");

// Test Case 6: Passing threshold check
console.log("Test Case 6: Passing threshold check");
const answers6 = [
  "I have extensive education in computer science with multiple projects and internships.",
  "I am highly proficient in Java, Python, JavaScript, C++, and SQL with years of experience.",
  "Object-oriented programming uses classes and objects with inheritance and polymorphism, while functional programming emphasizes pure functions, immutability, and higher-order functions without side effects.",
  "I led a challenging full-stack web application project where I overcame database performance issues by implementing indexing and query optimization, collaborating with the team to refactor the architecture.",
  "My debugging approach involves systematic isolation using logs, breakpoints, unit tests, and code review to identify root causes.",
  "I stay updated through daily reading of tech blogs like Hacker News, weekly courses on Coursera, active participation in GitHub communities, and attending conferences.",
  "Time complexity analyzes how algorithm performance scales with input size using Big O notation, while space complexity measures memory usage requirements.",
];
const result6 = evaluateInterviewAnswers(answers6);
console.log("Result:", result6);
console.log("Expected: high score, passed: true\n");

console.log("All test cases completed.");
