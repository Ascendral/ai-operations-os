const assert = require("assert");
const utils = require("./utils");

// Test capitalize function
assert.strictEqual(utils.capitalize("hello"), "Hello");
assert.strictEqual(utils.capitalize(""), "");
assert.strictEqual(utils.capitalize("hello world"), "Hello world");
assert.strictEqual(utils.capitalize(123), "");

// Test slugify function
assert.strictEqual(utils.slugify("Hello World"), "hello-world");
assert.strictEqual(utils.slugify("  hello  world  "), "hello-world");
assert.strictEqual(utils.slugify("Hello%$&World!!"), "helloworld");

// Test truncate function
assert.strictEqual(utils.truncate("Hello World", 5), "Hello...");
assert.strictEqual(utils.truncate("Hi", 10), "Hi");
assert.strictEqual(utils.truncate("", 5), "");

// Test isEmail function
assert.strictEqual(utils.isEmail("test@example.com"), true);
assert.strictEqual(utils.isEmail("invalid-email"), false);
assert.strictEqual(utils.isEmail("test@.com"), false);

console.log("All tests passed!");
